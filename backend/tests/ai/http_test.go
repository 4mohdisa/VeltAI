package aitests

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"
	"time"
	_ "time/tzdata" // timezone tests must not depend on the host's zoneinfo
	"unicode/utf8"

	"lumo/backend/internal/ai"
	"lumo/backend/internal/auth"
)

type storedIns struct {
	id        string
	userID    string
	ins       ai.Insight
	dismissed bool
	createdAt time.Time
}

type fakeStore struct {
	logs     []ai.FoodLogRow
	sessions []ai.GymSessionRow
	goal     *ai.GoalRow
	streak   *ai.StreakRow
	weights  []ai.WeightRow

	brains      map[string]ai.Brain
	insights    []storedIns
	insertCalls int
	nextID      int
	now         func() time.Time // mirrors the service clock for insight timestamps

	cuisines    []string
	corrections []ai.ScanCorrectionRow

	// needsRebuild simulates ai_user_brain.needs_rebuild per user; UpsertBrain
	// clears it, mirroring the real UPDATE SET needs_rebuild = false.
	needsRebuild map[string]bool
	// failFoodLogsFor makes FoodLogs error for one uid, to test that a single
	// user's rebuild failure doesn't stop a sweep.
	failFoodLogsFor string
}

func (f *fakeStore) clock() time.Time {
	if f.now != nil {
		return f.now()
	}
	return time.Now()
}

var _ ai.Store = (*fakeStore)(nil)

func (f *fakeStore) FoodLogs(_ context.Context, uid string) ([]ai.FoodLogRow, error) {
	if f.failFoodLogsFor != "" && uid == f.failFoodLogsFor {
		return nil, errors.New("food logs unavailable")
	}
	return f.logs, nil
}
func (f *fakeStore) GymSessions(context.Context, string) ([]ai.GymSessionRow, error) {
	return f.sessions, nil
}
func (f *fakeStore) Goals(context.Context, string) (*ai.GoalRow, error)      { return f.goal, nil }
func (f *fakeStore) Streak(context.Context, string) (*ai.StreakRow, error)   { return f.streak, nil }
func (f *fakeStore) Weights(context.Context, string) ([]ai.WeightRow, error) { return f.weights, nil }

func (f *fakeStore) UpsertBrain(_ context.Context, uid string, b ai.Brain) error {
	if f.brains == nil {
		f.brains = map[string]ai.Brain{}
	}
	f.brains[uid] = b
	if f.needsRebuild != nil {
		f.needsRebuild[uid] = false
	}
	return nil
}

func (f *fakeStore) GetBrain(_ context.Context, uid string) (*ai.Brain, error) {
	b, ok := f.brains[uid]
	if !ok {
		return nil, nil
	}
	return &b, nil
}

func (f *fakeStore) InsertInsights(_ context.Context, uid string, ins []ai.Insight) error {
	f.insertCalls++
	// Mirror PGStore: regeneration replaces the user's non-dismissed insights.
	kept := f.insights[:0]
	for _, si := range f.insights {
		if si.userID != uid || si.dismissed {
			kept = append(kept, si)
		}
	}
	f.insights = kept
	for _, in := range ins {
		f.nextID++
		f.insights = append(f.insights, storedIns{
			id: fmt.Sprintf("ins_%d", f.nextID), userID: uid, ins: in, createdAt: f.clock(),
		})
	}
	return nil
}

func (f *fakeStore) NewestInsightAt(_ context.Context, uid string) (*time.Time, error) {
	var newest *time.Time
	for _, si := range f.insights {
		if si.userID == uid && (newest == nil || si.createdAt.After(*newest)) {
			at := si.createdAt
			newest = &at
		}
	}
	return newest, nil
}

func (f *fakeStore) ListInsights(_ context.Context, uid string) ([]ai.StoredInsight, error) {
	var out []ai.StoredInsight
	for i := len(f.insights) - 1; i >= 0; i-- { // newest first
		si := f.insights[i]
		if si.userID == uid && !si.dismissed {
			out = append(out, ai.StoredInsight{
				ID: si.id, Type: si.ins.Type, Title: si.ins.Title, Body: si.ins.Body, CreatedAt: si.createdAt,
			})
		}
	}
	return out, nil
}

func (f *fakeStore) GetInsightOwner(_ context.Context, id string) (string, error) {
	for _, si := range f.insights {
		if si.id == id {
			return si.userID, nil
		}
	}
	return "", nil
}

func (f *fakeStore) DismissInsight(_ context.Context, id string) error {
	for i := range f.insights {
		if f.insights[i].id == id {
			f.insights[i].dismissed = true
		}
	}
	return nil
}

func (f *fakeStore) CuisinePreferences(context.Context, string) ([]string, error) {
	return f.cuisines, nil
}

func (f *fakeStore) ScanCorrections(context.Context, string) ([]ai.ScanCorrectionRow, error) {
	return f.corrections, nil
}

func (f *fakeStore) UsersNeedingRebuild(context.Context) ([]string, error) {
	var out []string
	for uid, need := range f.needsRebuild {
		if need {
			out = append(out, uid)
		}
	}
	sort.Strings(out) // deterministic order for tests
	return out, nil
}

type fakeLLM struct {
	resp   string
	err    error
	system string
	prompt string
	calls  int
}

func (f *fakeLLM) Complete(_ context.Context, system, prompt string) (string, error) {
	f.calls++
	f.system, f.prompt = system, prompt
	return f.resp, f.err
}

func fullStore() *fakeStore {
	return &fakeStore{
		logs:     fixtureLogs(),
		sessions: fixtureSessions(),
		goal:     fixtureGoal(),
		streak:   &ai.StreakRow{CurrentStreak: 2, LongestStreak: 5},
		weights:  fixtureWeights(),
	}
}

var fixedNow = time.Date(2026, 7, 4, 9, 0, 0, 0, time.UTC)

func newMux(st ai.Store, llm ai.LLM, now time.Time) *http.ServeMux {
	mux := http.NewServeMux()
	if f, ok := st.(*fakeStore); ok {
		f.now = func() time.Time { return now }
	}
	svc := ai.NewService(st, llm)
	svc.Now = func() time.Time { return now }
	svc.Routes(mux)
	return mux
}

func do(t *testing.T, mux *http.ServeMux, method, path string, body any, user string) *httptest.ResponseRecorder {
	t.Helper()
	var rd io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		rd = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rd)
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	return w
}

func dataOf[T any](t *testing.T, w *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data  T       `json:"data"`
		Error *string `json:"error"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode envelope: %v (body: %s)", err, w.Body.String())
	}
	return env.Data
}

func TestRebuildNotEnoughData(t *testing.T) {
	for name, logs := range map[string][]ai.FoodLogRow{
		"zero days": nil,
		"two days":  fixtureLogs()[:3], // days 1 and 2 only
	} {
		st := &fakeStore{logs: logs}
		w := do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "POST", "/api/ai/brain/rebuild", nil, "user_1")
		if w.Code != http.StatusOK {
			t.Fatalf("%s: status = %d, want 200", name, w.Code)
		}
		if d := dataOf[map[string]string](t, w); d["state"] != "not_enough_data" {
			t.Errorf("%s: state = %q, want not_enough_data", name, d["state"])
		}
		if len(st.brains) != 0 {
			t.Errorf("%s: brain should not be persisted", name)
		}
	}
}

// fixtureLogs spans exactly 3 days, so a rebuild always blends in the
// cuisine/goal prior at weight 0.8 (see priorWeight). fullStore() sets no
// cuisines, so the prior is cuisine.MergePriors(nil) == defaultPrior; the
// only non-zero prior signal here is fixtureGoal's calorie/protein targets
// (1000/65, carbs unset -> 0). Expected numbers below are hand-blended:
// 0.8*prior + 0.2*computed for the fields rebuild is documented to blend.
func TestRebuildComputesBrain(t *testing.T) {
	st := fullStore()
	w := do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "POST", "/api/ai/brain/rebuild", nil, "user_1")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", w.Code, w.Body.String())
	}
	b := dataOf[ai.Brain](t, w)
	approx(t, "typical_daily_calories", b.TypicalDailyCalories, 0.8*1000+0.2*(3400.0/3))
	approx(t, "macros.protein", b.TypicalMacros.Protein, 0.8*65+0.2*(190.0/3))
	approx(t, "macros.carbs", b.TypicalMacros.Carbs, 0.2*(250.0/3))
	approx(t, "junk per_week", b.JunkFoodFrequency.PerWeek, 0.2*(2*7.0/30))
	// Not blended: no meaningful prior counterpart.
	approx(t, "goal_adherence_score", b.GoalAdherenceScore, 41.0)
	approx(t, "consistency", b.EatingPatterns.ConsistencyScore, 0.1)
	approx(t, "sessions_per_week", b.GymPatterns.SessionsPerWeek, 0.5)
	if !b.LastRebuilt.Equal(fixedNow) {
		t.Errorf("last_rebuilt = %v, want %v", b.LastRebuilt, fixedNow)
	}
	if _, ok := st.brains["user_1"]; !ok {
		t.Error("brain not persisted")
	}
	if b.ScanAccuracyProfile != nil {
		t.Errorf("scan_accuracy_profile = %+v, want nil (no corrections)", b.ScanAccuracyProfile)
	}
}

func TestGetBrainStates(t *testing.T) {
	st := fullStore()
	mux := newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow)

	w := do(t, mux, "GET", "/api/ai/brain", nil, "user_1")
	if d := dataOf[map[string]string](t, w); d["state"] != "not_enough_data" {
		t.Fatalf("fresh brain state = %q, want not_enough_data", d["state"])
	}

	do(t, mux, "POST", "/api/ai/brain/rebuild", nil, "user_1")
	w = do(t, mux, "GET", "/api/ai/brain", nil, "user_1")
	b := dataOf[ai.Brain](t, w)
	approx(t, "stored typical calories", b.TypicalDailyCalories, 0.8*1000+0.2*(3400.0/3))
}

func TestInsightsFromLLM(t *testing.T) {
	llm := &fakeLLM{resp: "```json\n[" +
		`{"type":"protein_gap","title":"T1","body":"B1"},` +
		`{"type":"meal_timing","title":"T2","body":"B2"},` +
		`{"type":"gym_correlation","title":"T3","body":"B3"},` +
		`{"type":"food_habit","title":"T4","body":"B4"}` +
		"]\n```"}
	st := fullStore()
	mux := newMux(st, llm, fixedNow)
	do(t, mux, "POST", "/api/ai/brain/rebuild", nil, "user_1")

	w := do(t, mux, "GET", "/api/ai/insights", nil, "user_1")
	ins := dataOf[[]ai.StoredInsight](t, w)
	if len(ins) != 4 {
		t.Fatalf("insights = %d, want 4", len(ins))
	}
	if ins[0].ID == "" || ins[0].Title == "" {
		t.Errorf("insight missing fields: %+v", ins[0])
	}
}

func TestMalformedLLMJSONFallsBack(t *testing.T) {
	st := fullStore()
	mux := newMux(st, &fakeLLM{resp: "Sorry, I can't do JSON today. Eat more protein!"}, fixedNow)
	do(t, mux, "POST", "/api/ai/brain/rebuild", nil, "user_1")

	w := do(t, mux, "GET", "/api/ai/insights", nil, "user_1")
	ins := dataOf[[]ai.StoredInsight](t, w)
	if len(ins) < 3 {
		t.Fatalf("fallback insights = %d, want >= 3", len(ins))
	}
	types := map[string]bool{}
	for _, in := range ins {
		if in.Title == "" || in.Body == "" {
			t.Errorf("fallback insight missing text: %+v", in)
		}
		types[in.Type] = true
	}
	// Fixture signals: protein hit 1/3, skip rate 1/3, 0.5 sessions/week.
	for _, want := range []string{"protein_gap", "meal_timing", "gym_correlation"} {
		if !types[want] {
			t.Errorf("fallback missing %s insight (got %v)", want, types)
		}
	}
}

func TestRebuildIdempotentWithin6h(t *testing.T) {
	st := fullStore()
	mux := newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow)

	w1 := do(t, mux, "POST", "/api/ai/brain/rebuild", nil, "user_1")
	w2 := do(t, mux, "POST", "/api/ai/brain/rebuild", nil, "user_1")
	if w1.Body.String() != w2.Body.String() {
		t.Errorf("rebuild not idempotent:\n%s\n%s", w1.Body.String(), w2.Body.String())
	}
	if st.insertCalls != 1 {
		t.Errorf("insight inserts = %d, want 1 (cached within 6h)", st.insertCalls)
	}

	// 7h later the cache expires and insights regenerate.
	later := newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow.Add(7*time.Hour))
	do(t, later, "POST", "/api/ai/brain/rebuild", nil, "user_1")
	if st.insertCalls != 2 {
		t.Errorf("insight inserts after 7h = %d, want 2", st.insertCalls)
	}
}

// Regression: the 6h gate must key on the age of the newest stored insight,
// not the last rebuild — otherwise sub-6h rebuilds refresh last_rebuilt and
// starve regeneration forever.
func TestRebuildGateFollowsInsightAge(t *testing.T) {
	st := fullStore()
	// Three rebuilds inside an hour, fresh clock each time: one generation.
	for _, offset := range []time.Duration{0, 30 * time.Minute, time.Hour} {
		do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow.Add(offset)), "POST", "/api/ai/brain/rebuild", nil, "user_1")
	}
	if st.insertCalls != 1 {
		t.Fatalf("insight inserts within 1h = %d, want 1", st.insertCalls)
	}
	// A rebuild 5h in keeps the insights cached...
	do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow.Add(5*time.Hour)), "POST", "/api/ai/brain/rebuild", nil, "user_1")
	if st.insertCalls != 1 {
		t.Fatalf("insight inserts at 5h = %d, want 1", st.insertCalls)
	}
	// ...but once the insights themselves are 6h+ old they regenerate, even
	// though the last rebuild was only 5h ago.
	do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow.Add(10*time.Hour)), "POST", "/api/ai/brain/rebuild", nil, "user_1")
	if st.insertCalls != 2 {
		t.Errorf("insight inserts at 10h = %d, want 2 (gate follows insight age, not rebuild age)", st.insertCalls)
	}
}

// Regeneration replaces the active insights instead of accumulating
// duplicates, while dismissed rows survive so dismissals stick.
func TestRegenerationReplacesActiveInsights(t *testing.T) {
	st := fullStore()
	mux := newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow)
	do(t, mux, "POST", "/api/ai/brain/rebuild", nil, "user_1")
	first := dataOf[[]ai.StoredInsight](t, do(t, mux, "GET", "/api/ai/insights", nil, "user_1"))
	if len(first) == 0 {
		t.Fatal("no insights after first rebuild")
	}
	do(t, mux, "POST", "/api/ai/insights/"+first[0].ID+"/dismiss", nil, "user_1")

	later := newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow.Add(7*time.Hour))
	do(t, later, "POST", "/api/ai/brain/rebuild", nil, "user_1")

	ins := dataOf[[]ai.StoredInsight](t, do(t, later, "GET", "/api/ai/insights", nil, "user_1"))
	if len(ins) != len(first) {
		t.Errorf("insights after regeneration = %d, want %d (no duplicate accumulation)", len(ins), len(first))
	}
	dismissedKept := false
	for _, si := range st.insights {
		if si.id == first[0].ID && si.dismissed {
			dismissedKept = true
		}
	}
	if !dismissedKept {
		t.Error("regeneration deleted the dismissed insight; dismissals must stick")
	}
}

func TestDismissInsight(t *testing.T) {
	st := fullStore()
	st.insights = []storedIns{
		{id: "i1", userID: "user_1", ins: ai.Insight{Type: "food_habit", Title: "T", Body: "B"}},
		{id: "i2", userID: "user_2", ins: ai.Insight{Type: "food_habit", Title: "T", Body: "B"}},
	}
	mux := newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow)

	w := do(t, mux, "POST", "/api/ai/insights/i1/dismiss", nil, "user_1")
	if w.Code != http.StatusOK {
		t.Fatalf("dismiss status = %d, body %s", w.Code, w.Body.String())
	}
	if !st.insights[0].dismissed {
		t.Error("insight not marked dismissed")
	}
	w = do(t, mux, "GET", "/api/ai/insights", nil, "user_1")
	if ins := dataOf[[]ai.StoredInsight](t, w); len(ins) != 0 {
		t.Errorf("dismissed insight still listed: %+v", ins)
	}

	if w = do(t, mux, "POST", "/api/ai/insights/i2/dismiss", nil, "user_1"); w.Code != http.StatusForbidden {
		t.Errorf("dismiss other user's insight status = %d, want 403", w.Code)
	}
	if w = do(t, mux, "POST", "/api/ai/insights/nope/dismiss", nil, "user_1"); w.Code != http.StatusNotFound {
		t.Errorf("dismiss unknown insight status = %d, want 404", w.Code)
	}
}

func TestMorningBriefFallback(t *testing.T) {
	st := fullStore()
	// fixedNow is July 4 → yesterday July 3: 1000 kcal, 70g protein.
	w := do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "GET", "/api/ai/morning-brief", nil, "user_1")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d", w.Code)
	}
	brief := dataOf[map[string]string](t, w)["brief"]
	if brief == "" {
		t.Fatal("empty fallback brief")
	}
	if n := utf8.RuneCountInString(brief); n >= 500 {
		t.Errorf("fallback brief %d chars, want < 500", n)
	}
	for _, want := range []string{"1000", "70"} {
		if !strings.Contains(brief, want) {
			t.Errorf("fallback brief missing %q: %s", want, brief)
		}
	}
}

func TestMorningBriefLLMTruncated(t *testing.T) {
	long := strings.Repeat("Great work yesterday and today will be even better for you. ", 20)
	st := fullStore()
	w := do(t, newMux(st, &fakeLLM{resp: long}, fixedNow), "GET", "/api/ai/morning-brief", nil, "user_1")
	brief := dataOf[map[string]string](t, w)["brief"]
	if n := utf8.RuneCountInString(brief); n >= 500 {
		t.Errorf("LLM brief %d chars, want < 500", n)
	}
	if !strings.HasSuffix(brief, ".") {
		t.Errorf("truncation not at sentence boundary: ...%q", brief[len(brief)-20:])
	}
}

func TestMorningBriefUsesConfiguredTimezone(t *testing.T) {
	t.Setenv("LUMO_TIMEZONE", "Pacific/Midway") // UTC-11
	// fixedNow 2026-07-04 09:00 UTC is 2026-07-03 22:00 in Midway, so
	// "yesterday" is July 2: 1500 kcal / 60g protein (not July 3's 1000/70).
	st := fullStore()
	w := do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "GET", "/api/ai/morning-brief", nil, "user_1")
	brief := dataOf[map[string]string](t, w)["brief"]
	for _, want := range []string{"1500", "60"} {
		if !strings.Contains(brief, want) {
			t.Errorf("Midway brief missing %q: %s", want, brief)
		}
	}
}

func TestMorningBriefNotEnoughData(t *testing.T) {
	st := &fakeStore{logs: fixtureLogs()[:3]} // 2 days
	w := do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "GET", "/api/ai/morning-brief", nil, "user_1")
	if d := dataOf[map[string]string](t, w); d["state"] != "not_enough_data" {
		t.Errorf("state = %q, want not_enough_data", d["state"])
	}
}

func TestQuery(t *testing.T) {
	st := fullStore()

	w := do(t, newMux(st, &fakeLLM{resp: "x"}, fixedNow), "POST", "/api/ai/query", map[string]string{"question": "  "}, "user_1")
	if w.Code != http.StatusBadRequest {
		t.Errorf("empty question status = %d, want 400", w.Code)
	}

	w = do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "POST", "/api/ai/query", map[string]string{"question": "How is my protein?"}, "user_1")
	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("unavailable LLM status = %d, want 503", w.Code)
	}

	llm := &fakeLLM{resp: "You averaged 1133 kcal a day."}
	w = do(t, newMux(st, llm, fixedNow), "POST", "/api/ai/query", map[string]string{"question": "How is my protein?"}, "user_1")
	if w.Code != http.StatusOK {
		t.Fatalf("query status = %d, body %s", w.Code, w.Body.String())
	}
	if a := dataOf[map[string]string](t, w)["answer"]; a != "You averaged 1133 kcal a day." {
		t.Errorf("answer = %q", a)
	}
	if !strings.Contains(llm.prompt, "How is my protein?") || !strings.Contains(llm.prompt, "typical_daily_calories") {
		t.Errorf("query prompt not grounded on data summary: %s", llm.prompt)
	}
}

func TestRebuildIncludesScanAccuracyProfile(t *testing.T) {
	st := fullStore()
	st.corrections = []ai.ScanCorrectionRow{
		{FoodNameOriginal: "Rice", WeightOriginalG: 100, WeightCorrectedG: 150, CorrectionMagnitude: 0.3, CreatedAt: fixedNow},
		{FoodNameOriginal: "Rice", WeightOriginalG: 100, WeightCorrectedG: 140, CorrectionMagnitude: 0.2, CreatedAt: fixedNow},
	}
	w := do(t, newMux(st, &fakeLLM{err: ai.ErrUnavailable}, fixedNow), "POST", "/api/ai/brain/rebuild", nil, "user_1")
	b := dataOf[ai.Brain](t, w)
	if b.ScanAccuracyProfile == nil {
		t.Fatal("scan_accuracy_profile missing from rebuild response when corrections exist")
	}
	if len(b.ScanAccuracyProfile.MostUnderestimatedFoods) == 0 || b.ScanAccuracyProfile.MostUnderestimatedFoods[0] != "rice" {
		t.Errorf("most_underestimated_foods = %v, want [rice ...]", b.ScanAccuracyProfile.MostUnderestimatedFoods)
	}
}

func TestRunRebuildSweep(t *testing.T) {
	st := fullStore()
	st.needsRebuild = map[string]bool{
		"user_flagged": true,
		"user_failing": true,
		"user_calm":    false, // not flagged, must stay untouched
	}
	st.failFoodLogsFor = "user_failing"

	svc := ai.NewService(st, &fakeLLM{err: ai.ErrUnavailable})
	svc.Now = func() time.Time { return fixedNow }

	err := svc.RunRebuildSweep(context.Background())
	if err == nil {
		t.Fatal("expected a joined error from the failing user, got nil")
	}
	if !strings.Contains(err.Error(), "food logs unavailable") {
		t.Errorf("sweep error = %v, want it to surface the failing user's cause", err)
	}

	if st.needsRebuild["user_flagged"] {
		t.Error("flagged user's needs_rebuild should clear after a successful rebuild")
	}
	if _, ok := st.brains["user_flagged"]; !ok {
		t.Error("flagged user's brain was not rebuilt")
	}
	if !st.needsRebuild["user_failing"] {
		t.Error("failing user's needs_rebuild should remain set since the rebuild failed")
	}
	if _, ok := st.brains["user_failing"]; ok {
		t.Error("failing user should not have a persisted brain")
	}
	if _, ok := st.brains["user_calm"]; ok {
		t.Error("unflagged user should not have been touched by the sweep")
	}
}
