package gymscheduletests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/gym"
)

// ---------------------------------------------------------------------------
// Fake ScheduleStore (hermetic, in-memory; no DB / no network)
// ---------------------------------------------------------------------------

type loggedFlag struct{ skipped, isExtra bool }

type fakeSession struct {
	userID     string
	date       string
	templateID *string
	exercises  []loggedFlag
}

type progRow struct {
	userID, name, date string
	weight             *float64
	reps, sets         *int
	seq                int
}

type fakeSchedule struct {
	nextID            int
	exercises         map[string]gym.LibraryExercise
	templates         map[string]*gym.WorkoutTemplate
	templateExercises map[string]*gym.TemplateExercise
	schedule          map[string]map[int]*string // userID -> day -> templateID
	sessions          map[string]*fakeSession
	adherence         map[string]map[string]gym.AdherenceResult
	patterns          map[string]*gym.GymPatterns
	progress          []progRow
}

func newFake() *fakeSchedule {
	f := &fakeSchedule{
		exercises:         map[string]gym.LibraryExercise{},
		templates:         map[string]*gym.WorkoutTemplate{},
		templateExercises: map[string]*gym.TemplateExercise{},
		schedule:          map[string]map[int]*string{},
		sessions:          map[string]*fakeSession{},
		adherence:         map[string]map[string]gym.AdherenceResult{},
		patterns:          map[string]*gym.GymPatterns{},
	}
	for _, e := range []gym.LibraryExercise{
		{ID: "ex_bench", Name: "Barbell Bench Press", MuscleGroupPrimary: "chest", MuscleGroupsSecondary: []string{"triceps"}, Category: "Chest", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate"},
		{ID: "ex_squat", Name: "Back Squat", MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: []string{"glutes"}, Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate"},
		{ID: "ex_run", Name: "Running", MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: []string{}, Category: "Cardio", ExerciseType: "cardio", Equipment: "bodyweight", Difficulty: "beginner"},
		{ID: "ex_curl", Name: "Barbell Curl", MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: []string{}, Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "beginner"},
	} {
		f.exercises[e.ID] = e
	}
	return f
}

func (f *fakeSchedule) id(prefix string) string {
	f.nextID++
	return fmt.Sprintf("%s_%d", prefix, f.nextID)
}

func (f *fakeSchedule) ListLibraryExercises(_ context.Context, flt gym.ExerciseFilter) ([]gym.LibraryExercise, error) {
	var out []gym.LibraryExercise
	for _, e := range f.exercises {
		if flt.Category != "" && e.Category != flt.Category {
			continue
		}
		if flt.Muscle != "" && e.MuscleGroupPrimary != flt.Muscle {
			continue
		}
		if flt.Type != "" && e.ExerciseType != flt.Type {
			continue
		}
		if flt.Equipment != "" && e.Equipment != flt.Equipment {
			continue
		}
		if flt.Q != "" && !strings.Contains(strings.ToLower(e.Name), strings.ToLower(flt.Q)) {
			continue
		}
		out = append(out, e)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}

func (f *fakeSchedule) GetLibraryExercise(_ context.Context, id string) (*gym.LibraryExercise, error) {
	e, ok := f.exercises[id]
	if !ok {
		return nil, gym.ErrNotFound
	}
	return &e, nil
}

func (f *fakeSchedule) getTemplate(id string) *gym.WorkoutTemplate {
	t, ok := f.templates[id]
	if !ok {
		return nil
	}
	cp := *t
	cp.Exercises = []gym.TemplateExercise{}
	for _, te := range f.templateExercises {
		if te.TemplateID == id {
			cp.Exercises = append(cp.Exercises, *te)
		}
	}
	sort.Slice(cp.Exercises, func(i, j int) bool {
		if cp.Exercises[i].SortOrder != cp.Exercises[j].SortOrder {
			return cp.Exercises[i].SortOrder < cp.Exercises[j].SortOrder
		}
		return cp.Exercises[i].ID < cp.Exercises[j].ID
	})
	return &cp
}

func (f *fakeSchedule) insertTE(templateID string, in gym.TemplateExerciseInput) *gym.TemplateExercise {
	id := f.id("te")
	lib := f.exercises[in.ExerciseID]
	so := 0
	if in.SortOrder != nil {
		so = *in.SortOrder
	}
	te := &gym.TemplateExercise{
		ID: id, TemplateID: templateID, ExerciseID: in.ExerciseID,
		PlannedSets: in.PlannedSets, PlannedReps: in.PlannedReps, PlannedWeight: in.PlannedWeight,
		PlannedWeightUnit: in.PlannedWeightUnit, PlannedDurationMinutes: in.PlannedDurationMinutes,
		RestSeconds: in.RestSeconds, SortOrder: so, CreatedAt: time.Now(), Exercise: &lib,
	}
	f.templateExercises[id] = te
	return te
}

func (f *fakeSchedule) ListTemplates(_ context.Context, userID string) ([]gym.WorkoutTemplate, error) {
	var out []gym.WorkoutTemplate
	for id, t := range f.templates {
		if t.UserID == userID {
			out = append(out, *f.getTemplate(id))
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func (f *fakeSchedule) GetTemplate(_ context.Context, id string) (*gym.WorkoutTemplate, error) {
	t := f.getTemplate(id)
	if t == nil {
		return nil, gym.ErrNotFound
	}
	return t, nil
}

func (f *fakeSchedule) CreateTemplate(_ context.Context, userID, name string, est *int, exs []gym.TemplateExerciseInput) (*gym.WorkoutTemplate, error) {
	for _, e := range exs {
		if _, ok := f.exercises[e.ExerciseID]; !ok {
			return nil, gym.ErrNotFound
		}
	}
	id := f.id("tmpl")
	now := time.Now()
	f.templates[id] = &gym.WorkoutTemplate{ID: id, UserID: userID, Name: name, EstimatedDurationMinutes: est, CreatedAt: now, UpdatedAt: now}
	for _, e := range exs {
		f.insertTE(id, e)
	}
	return f.getTemplate(id), nil
}

func (f *fakeSchedule) UpdateTemplate(_ context.Context, t *gym.WorkoutTemplate) error {
	cur, ok := f.templates[t.ID]
	if !ok {
		return gym.ErrNotFound
	}
	cur.Name = t.Name
	cur.EstimatedDurationMinutes = t.EstimatedDurationMinutes
	cur.UpdatedAt = time.Now()
	return nil
}

func (f *fakeSchedule) DeleteTemplate(_ context.Context, id string) error {
	delete(f.templates, id)
	for teid, te := range f.templateExercises {
		if te.TemplateID == id {
			delete(f.templateExercises, teid)
		}
	}
	for _, days := range f.schedule {
		for d, tid := range days {
			if tid != nil && *tid == id {
				days[d] = nil
			}
		}
	}
	return nil
}

func (f *fakeSchedule) AddTemplateExercise(_ context.Context, templateID string, in gym.TemplateExerciseInput) (*gym.TemplateExercise, error) {
	if _, ok := f.exercises[in.ExerciseID]; !ok {
		return nil, gym.ErrNotFound
	}
	te := f.insertTE(templateID, in)
	cp := *te
	return &cp, nil
}

func (f *fakeSchedule) GetTemplateExercise(_ context.Context, id string) (*gym.TemplateExercise, string, error) {
	te, ok := f.templateExercises[id]
	if !ok {
		return nil, "", gym.ErrNotFound
	}
	owner := ""
	if t, ok := f.templates[te.TemplateID]; ok {
		owner = t.UserID
	}
	cp := *te
	return &cp, owner, nil
}

func (f *fakeSchedule) UpdateTemplateExercise(_ context.Context, te *gym.TemplateExercise) error {
	cur, ok := f.templateExercises[te.ID]
	if !ok {
		return gym.ErrNotFound
	}
	cur.PlannedSets = te.PlannedSets
	cur.PlannedReps = te.PlannedReps
	cur.PlannedWeight = te.PlannedWeight
	cur.PlannedWeightUnit = te.PlannedWeightUnit
	cur.PlannedDurationMinutes = te.PlannedDurationMinutes
	cur.RestSeconds = te.RestSeconds
	cur.SortOrder = te.SortOrder
	return nil
}

func (f *fakeSchedule) DeleteTemplateExercise(_ context.Context, id string) error {
	delete(f.templateExercises, id)
	return nil
}

func (f *fakeSchedule) GetSchedule(_ context.Context, userID string) ([]gym.ScheduleDay, error) {
	days := f.schedule[userID]
	out := make([]gym.ScheduleDay, 7)
	for i := 0; i < 7; i++ {
		d := gym.ScheduleDay{DayOfWeek: i, DayName: time.Weekday(i).String(), IsRestDay: true}
		if days != nil {
			if tid, ok := days[i]; ok && tid != nil {
				if t := f.getTemplate(*tid); t != nil {
					d.TemplateID = tid
					d.Template = t
					d.IsRestDay = false
				}
			}
		}
		out[i] = d
	}
	return out, nil
}

func (f *fakeSchedule) SetScheduleDay(_ context.Context, userID string, day int, templateID *string) error {
	if f.schedule[userID] == nil {
		f.schedule[userID] = map[int]*string{}
	}
	f.schedule[userID][day] = templateID
	return nil
}

func (f *fakeSchedule) SetSchedule(ctx context.Context, userID string, days []gym.ScheduleDayInput) error {
	for _, d := range days {
		if err := f.SetScheduleDay(ctx, userID, d.DayOfWeek, d.TemplateID); err != nil {
			return err
		}
	}
	return nil
}

func (f *fakeSchedule) GetToday(_ context.Context, userID, today string, dow int) (*gym.TodayWorkout, error) {
	tw := &gym.TodayWorkout{DayOfWeek: dow, DayName: time.Weekday(dow).String(), IsRestDay: true, Exercises: []gym.TemplateExercise{}}
	if days := f.schedule[userID]; days != nil {
		if tid, ok := days[dow]; ok && tid != nil {
			if t := f.getTemplate(*tid); t != nil {
				tw.IsRestDay = false
				tw.Template = t
				tw.Exercises = t.Exercises
			}
		}
	}
	for id, s := range f.sessions {
		if s.userID == userID && s.date == today {
			sid := id
			tw.SessionID = &sid
			tw.AlreadyCheckedIn = true
			break
		}
	}
	return tw, nil
}

func (f *fakeSchedule) countTEs(templateID string) int {
	n := 0
	for _, te := range f.templateExercises {
		if te.TemplateID == templateID {
			n++
		}
	}
	return n
}

func (f *fakeSchedule) CompleteSession(_ context.Context, userID, sessionID string, completionRate *float64) (*gym.AdherenceResult, error) {
	s, ok := f.sessions[sessionID]
	if !ok {
		return nil, gym.ErrNotFound
	}
	if s.userID != userID {
		return nil, gym.ErrForbidden
	}
	flags := make([]gym.ExerciseFlags, 0, len(s.exercises))
	for _, e := range s.exercises {
		flags = append(flags, gym.ExerciseFlags{Skipped: e.skipped, IsExtra: e.isExtra})
	}
	planned := 0
	if s.templateID != nil {
		planned = f.countTEs(*s.templateID)
	}
	rate, customized := gym.ComputeCompletion(flags, planned)
	if completionRate != nil {
		rate = *completionRate
	}
	res := gym.AdherenceResult{ScheduledDate: s.date, TemplateID: s.templateID, CheckedIn: true, CompletionRate: rate, Customized: customized}
	if f.adherence[userID] == nil {
		f.adherence[userID] = map[string]gym.AdherenceResult{}
	}
	f.adherence[userID][s.date] = res
	return &res, nil
}

func (f *fakeSchedule) GetExerciseProgress(_ context.Context, userID, name string, limit int) (*gym.ExerciseProgress, error) {
	var rows []progRow
	for _, p := range f.progress {
		if p.userID == userID && strings.EqualFold(p.name, name) {
			rows = append(rows, p)
		}
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].date != rows[j].date {
			return rows[i].date < rows[j].date
		}
		return rows[i].seq < rows[j].seq
	})
	if len(rows) > limit {
		rows = rows[:limit]
	}
	history := []gym.ProgressEntry{}
	var best *gym.PersonalBest
	for _, p := range rows {
		history = append(history, gym.ProgressEntry{Date: p.date, Weight: p.weight, Reps: p.reps, Sets: p.sets})
		if p.weight != nil && (best == nil || *p.weight > best.Weight) {
			best = &gym.PersonalBest{Weight: *p.weight, Reps: p.reps, Date: p.date}
		}
	}
	return &gym.ExerciseProgress{ExerciseName: name, History: history, PersonalBest: best, Trend: gym.ComputeTrend(history)}, nil
}

func (f *fakeSchedule) GetPatterns(_ context.Context, userID string) (*gym.GymPatterns, error) {
	return f.patterns[userID], nil
}

// test-only seeding helpers
func (f *fakeSchedule) addSession(userID, date string, templateID *string, flags []loggedFlag) string {
	id := f.id("sess")
	f.sessions[id] = &fakeSession{userID: userID, date: date, templateID: templateID, exercises: flags}
	return id
}

func (f *fakeSchedule) logExercise(userID, name, date string, weight *float64, reps, sets *int) {
	f.nextID++
	f.progress = append(f.progress, progRow{userID: userID, name: name, date: date, weight: weight, reps: reps, sets: sets, seq: f.nextID})
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func serve(f *fakeSchedule) *http.ServeMux {
	mux := http.NewServeMux()
	gym.RegisterSchedule(mux, f)
	return mux
}

func do(t *testing.T, mux *http.ServeMux, user, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var rd io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		rd = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rd)
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	return w
}

func decode[T any](t *testing.T, w *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data T `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode envelope: %v (body: %s)", err, w.Body.String())
	}
	return env.Data
}

func want(t *testing.T, w *httptest.ResponseRecorder, code int) {
	t.Helper()
	if w.Code != code {
		t.Fatalf("status = %d, want %d (body: %s)", w.Code, code, w.Body.String())
	}
}

func fptr(v float64) *float64 { return &v }
func iptr(v int) *int         { return &v }

func todayStr() string { return time.Now().In(config.Timezone()).Format("2006-01-02") }

// createTemplate is a helper that POSTs a template with the given exercise ids.
func createTemplate(t *testing.T, mux *http.ServeMux, user, name string, exIDs ...string) gym.WorkoutTemplate {
	t.Helper()
	exs := make([]map[string]any, 0, len(exIDs))
	for i, id := range exIDs {
		exs = append(exs, map[string]any{"exercise_id": id, "sort_order": i})
	}
	w := do(t, mux, user, "POST", "/api/gym/templates", map[string]any{"name": name, "exercises": exs})
	want(t, w, http.StatusCreated)
	return decode[gym.WorkoutTemplate](t, w)
}

// ---------------------------------------------------------------------------
// Library seed
// ---------------------------------------------------------------------------

func TestLibrarySeedCoverage(t *testing.T) {
	if len(gym.LibrarySeed) < 120 {
		t.Fatalf("LibrarySeed has %d exercises, want >= 120", len(gym.LibrarySeed))
	}
	allowed := map[string]bool{
		"chest": true, "back": true, "quadriceps": true, "hamstrings": true, "glutes": true,
		"shoulders": true, "biceps": true, "triceps": true, "core": true, "calves": true,
		"cardio": true, "full_body": true,
	}
	minCount := map[string]int{
		"chest": 8, "back": 10, "quadriceps": 8, "hamstrings": 5, "glutes": 5, "shoulders": 8,
		"biceps": 6, "triceps": 6, "core": 7, "calves": 3, "cardio": 8, "full_body": 5,
	}
	counts := map[string]int{}
	names := map[string]bool{}
	for _, e := range gym.LibrarySeed {
		if !allowed[e.MuscleGroupPrimary] {
			t.Fatalf("exercise %q has illegal primary muscle %q", e.Name, e.MuscleGroupPrimary)
		}
		if names[e.Name] {
			t.Fatalf("duplicate exercise name %q (ON CONFLICT would drop it)", e.Name)
		}
		names[e.Name] = true
		counts[e.MuscleGroupPrimary]++
	}
	for muscle, min := range minCount {
		if counts[muscle] < min {
			t.Errorf("muscle %q has %d exercises, want >= %d", muscle, counts[muscle], min)
		}
	}
	if len(counts) != 12 {
		t.Errorf("covered %d muscle groups, want all 12", len(counts))
	}
}

// D1: every muscle the seed writes — primary AND secondary — is one of the twelve
// canonical lowercase keys. muscle_volume_map is keyed by these, so a second
// spelling of one muscle would render as a second muscle. The migration
// 20260911000001 enforces the same set in the database.
func TestLibrarySeedMusclesAreCanonical(t *testing.T) {
	canonical := map[string]bool{
		"chest": true, "back": true, "quadriceps": true, "hamstrings": true, "glutes": true,
		"shoulders": true, "biceps": true, "triceps": true, "core": true, "calves": true,
		"cardio": true, "full_body": true,
	}
	for _, e := range gym.LibrarySeed {
		if !canonical[e.MuscleGroupPrimary] {
			t.Errorf("%q: primary muscle %q is not a canonical key", e.Name, e.MuscleGroupPrimary)
		}
		for _, m := range e.MuscleGroupsSecondary {
			if !canonical[m] {
				t.Errorf("%q: secondary muscle %q is not a canonical key", e.Name, m)
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

func TestListExercisesFilter(t *testing.T) {
	mux := serve(newFake())

	all := decode[[]gym.LibraryExercise](t, do(t, mux, "u1", "GET", "/api/gym/exercises", nil))
	if len(all) != 4 {
		t.Fatalf("unfiltered = %d, want 4", len(all))
	}

	chest := decode[[]gym.LibraryExercise](t, do(t, mux, "u1", "GET", "/api/gym/exercises?category=Chest", nil))
	if len(chest) != 1 || chest[0].Name != "Barbell Bench Press" {
		t.Fatalf("category filter = %+v", chest)
	}

	// q is case-insensitive on name.
	q := decode[[]gym.LibraryExercise](t, do(t, mux, "u1", "GET", "/api/gym/exercises?q=BENCH", nil))
	if len(q) != 1 || q[0].Name != "Barbell Bench Press" {
		t.Fatalf("q filter = %+v", q)
	}

	cardio := decode[[]gym.LibraryExercise](t, do(t, mux, "u1", "GET", "/api/gym/exercises?muscle=cardio&type=cardio", nil))
	if len(cardio) != 1 || cardio[0].Name != "Running" {
		t.Fatalf("muscle/type filter = %+v", cardio)
	}
}

func TestGetExercise(t *testing.T) {
	mux := serve(newFake())
	want(t, do(t, mux, "u1", "GET", "/api/gym/exercises/nope", nil), http.StatusNotFound)

	e := decode[gym.LibraryExercise](t, do(t, mux, "u1", "GET", "/api/gym/exercises/ex_squat", nil))
	if e.Name != "Back Squat" || e.MuscleGroupPrimary != "quadriceps" {
		t.Fatalf("get exercise = %+v", e)
	}
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

func TestCreateTemplateJoinsExercises(t *testing.T) {
	mux := serve(newFake())

	// empty name -> 400
	want(t, do(t, mux, "u1", "POST", "/api/gym/templates", map[string]any{"name": ""}), http.StatusBadRequest)

	// unknown exercise_id -> 404
	want(t, do(t, mux, "u1", "POST", "/api/gym/templates", map[string]any{
		"name": "Push", "exercises": []map[string]any{{"exercise_id": "missing"}},
	}), http.StatusNotFound)

	tmpl := createTemplate(t, mux, "u1", "Push Day", "ex_bench", "ex_curl")
	if tmpl.Name != "Push Day" || len(tmpl.Exercises) != 2 {
		t.Fatalf("created template = %+v", tmpl)
	}
	// Joined library detail present and ordered by sort_order.
	if tmpl.Exercises[0].Exercise == nil || tmpl.Exercises[0].Exercise.Name != "Barbell Bench Press" {
		t.Fatalf("first exercise not joined: %+v", tmpl.Exercises[0])
	}

	got := decode[gym.WorkoutTemplate](t, do(t, mux, "u1", "GET", "/api/gym/templates/"+tmpl.ID, nil))
	if len(got.Exercises) != 2 {
		t.Fatalf("get template exercises = %d, want 2", len(got.Exercises))
	}
}

func TestTemplateOwnership(t *testing.T) {
	mux := serve(newFake())
	tmpl := createTemplate(t, mux, "u1", "Mine", "ex_bench")

	want(t, do(t, mux, "u2", "GET", "/api/gym/templates/"+tmpl.ID, nil), http.StatusForbidden)
	want(t, do(t, mux, "u2", "PATCH", "/api/gym/templates/"+tmpl.ID, map[string]any{"name": "x"}), http.StatusForbidden)
	want(t, do(t, mux, "u2", "DELETE", "/api/gym/templates/"+tmpl.ID, nil), http.StatusForbidden)
	want(t, do(t, mux, "u2", "GET", "/api/gym/templates/missing", nil), http.StatusNotFound)
}

func TestPatchAndDeleteTemplate(t *testing.T) {
	mux := serve(newFake())
	tmpl := createTemplate(t, mux, "u1", "Old", "ex_bench")

	patched := decode[gym.WorkoutTemplate](t, do(t, mux, "u1", "PATCH", "/api/gym/templates/"+tmpl.ID,
		map[string]any{"name": "New", "estimated_duration_minutes": 45}))
	if patched.Name != "New" || patched.EstimatedDurationMinutes == nil || *patched.EstimatedDurationMinutes != 45 {
		t.Fatalf("patched = %+v", patched)
	}
	// empty name rejected
	want(t, do(t, mux, "u1", "PATCH", "/api/gym/templates/"+tmpl.ID, map[string]any{"name": ""}), http.StatusBadRequest)

	want(t, do(t, mux, "u1", "DELETE", "/api/gym/templates/"+tmpl.ID, nil), http.StatusOK)
	want(t, do(t, mux, "u1", "GET", "/api/gym/templates/"+tmpl.ID, nil), http.StatusNotFound)
}

func TestTemplateExerciseCRUD(t *testing.T) {
	mux := serve(newFake())
	tmpl := createTemplate(t, mux, "u1", "Legs", "ex_squat")

	// add one, validating exercise_id
	want(t, do(t, mux, "u1", "POST", "/api/gym/templates/"+tmpl.ID+"/exercises",
		map[string]any{"exercise_id": "missing"}), http.StatusNotFound)
	added := decode[gym.TemplateExercise](t, do(t, mux, "u1", "POST", "/api/gym/templates/"+tmpl.ID+"/exercises",
		map[string]any{"exercise_id": "ex_curl", "planned_sets": 3, "planned_reps": 10}))
	if added.ExerciseID != "ex_curl" || added.PlannedSets == nil || *added.PlannedSets != 3 {
		t.Fatalf("added te = %+v", added)
	}

	// foreign user cannot add or mutate
	want(t, do(t, mux, "u2", "POST", "/api/gym/templates/"+tmpl.ID+"/exercises", map[string]any{"exercise_id": "ex_curl"}), http.StatusForbidden)
	want(t, do(t, mux, "u2", "PATCH", "/api/gym/template-exercises/"+added.ID, map[string]any{"planned_sets": 9}), http.StatusForbidden)
	want(t, do(t, mux, "u2", "DELETE", "/api/gym/template-exercises/"+added.ID, nil), http.StatusForbidden)

	patched := decode[gym.TemplateExercise](t, do(t, mux, "u1", "PATCH", "/api/gym/template-exercises/"+added.ID,
		map[string]any{"planned_sets": 5, "rest_seconds": 90}))
	if *patched.PlannedSets != 5 || patched.RestSeconds == nil || *patched.RestSeconds != 90 {
		t.Fatalf("patched te = %+v", patched)
	}

	want(t, do(t, mux, "u1", "DELETE", "/api/gym/template-exercises/"+added.ID, nil), http.StatusOK)
	want(t, do(t, mux, "u1", "PATCH", "/api/gym/template-exercises/"+added.ID, map[string]any{"planned_sets": 1}), http.StatusNotFound)
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

func TestScheduleAlwaysSevenRows(t *testing.T) {
	mux := serve(newFake())
	days := decode[[]gym.ScheduleDay](t, do(t, mux, "u1", "GET", "/api/gym/schedule", nil))
	if len(days) != 7 {
		t.Fatalf("schedule rows = %d, want 7", len(days))
	}
	for i, d := range days {
		if d.DayOfWeek != i || !d.IsRestDay || d.Template != nil {
			t.Fatalf("day %d = %+v, want empty rest day", i, d)
		}
	}
	if days[1].DayName != "Monday" {
		t.Fatalf("day 1 name = %q, want Monday", days[1].DayName)
	}
}

func TestPutScheduleDayUpsertAndRest(t *testing.T) {
	mux := serve(newFake())
	tmpl := createTemplate(t, mux, "u1", "Push", "ex_bench")

	days := decode[[]gym.ScheduleDay](t, do(t, mux, "u1", "PUT", "/api/gym/schedule/1",
		map[string]any{"template_id": tmpl.ID}))
	if days[1].IsRestDay || days[1].Template == nil || days[1].Template.ID != tmpl.ID {
		t.Fatalf("day 1 after set = %+v", days[1])
	}

	// null template_id -> rest day
	days = decode[[]gym.ScheduleDay](t, do(t, mux, "u1", "PUT", "/api/gym/schedule/1",
		map[string]any{"template_id": nil}))
	if !days[1].IsRestDay || days[1].Template != nil {
		t.Fatalf("day 1 after null = %+v, want rest", days[1])
	}

	// invalid day
	want(t, do(t, mux, "u1", "PUT", "/api/gym/schedule/9", map[string]any{"template_id": nil}), http.StatusBadRequest)
	// foreign template -> 403
	want(t, do(t, mux, "u2", "PUT", "/api/gym/schedule/1", map[string]any{"template_id": tmpl.ID}), http.StatusForbidden)
	// unknown template -> 404
	want(t, do(t, mux, "u1", "PUT", "/api/gym/schedule/1", map[string]any{"template_id": "nope"}), http.StatusNotFound)
}

func TestPutScheduleBulk(t *testing.T) {
	mux := serve(newFake())
	push := createTemplate(t, mux, "u1", "Push", "ex_bench")
	legs := createTemplate(t, mux, "u1", "Legs", "ex_squat")

	days := decode[[]gym.ScheduleDay](t, do(t, mux, "u1", "PUT", "/api/gym/schedule", map[string]any{
		"schedule": []map[string]any{
			{"day_of_week": 1, "template_id": push.ID},
			{"day_of_week": 3, "template_id": legs.ID},
			{"day_of_week": 5, "template_id": nil},
		},
	}))
	if days[1].Template == nil || days[1].Template.ID != push.ID {
		t.Fatalf("day 1 = %+v", days[1])
	}
	if days[3].Template == nil || days[3].Template.ID != legs.ID {
		t.Fatalf("day 3 = %+v", days[3])
	}
	if !days[5].IsRestDay || !days[0].IsRestDay {
		t.Fatalf("days 5/0 should be rest: %+v %+v", days[5], days[0])
	}

	// a foreign template anywhere in the batch -> 403, nothing written
	want(t, do(t, mux, "u2", "PUT", "/api/gym/schedule", map[string]any{
		"schedule": []map[string]any{{"day_of_week": 1, "template_id": push.ID}},
	}), http.StatusForbidden)
}

// ---------------------------------------------------------------------------
// Today
// ---------------------------------------------------------------------------

func TestTodayRestAndCheckin(t *testing.T) {
	f := newFake()
	mux := serve(f)

	tw := decode[gym.TodayWorkout](t, do(t, mux, "u1", "GET", "/api/gym/today", nil))
	if !tw.IsRestDay || tw.AlreadyCheckedIn || tw.SessionID != nil {
		t.Fatalf("fresh today = %+v, want rest + not checked in", tw)
	}

	// Schedule today's weekday with a template, then a session for today.
	dow := int(time.Now().In(config.Timezone()).Weekday())
	tmpl := createTemplate(t, mux, "u1", "Push", "ex_bench")
	want(t, do(t, mux, "u1", "PUT", fmt.Sprintf("/api/gym/schedule/%d", dow), map[string]any{"template_id": tmpl.ID}), http.StatusOK)
	f.addSession("u1", todayStr(), &tmpl.ID, nil)

	tw = decode[gym.TodayWorkout](t, do(t, mux, "u1", "GET", "/api/gym/today", nil))
	if tw.IsRestDay || !tw.AlreadyCheckedIn || tw.SessionID == nil {
		t.Fatalf("today after schedule+session = %+v", tw)
	}
	if tw.Template == nil || len(tw.Exercises) != 1 {
		t.Fatalf("today template/exercises = %+v", tw)
	}
}

// ---------------------------------------------------------------------------
// Complete
// ---------------------------------------------------------------------------

func TestCompleteSessionComputesRate(t *testing.T) {
	f := newFake()
	mux := serve(f)
	// planned = 4 exercises; 2 logged, both counted -> rate 0.5.
	tmpl := createTemplate(t, mux, "u1", "Push", "ex_bench", "ex_curl", "ex_squat", "ex_run")
	sid := f.addSession("u1", "2026-07-10", &tmpl.ID, []loggedFlag{{}, {}})

	res := decode[gym.AdherenceResult](t, do(t, mux, "u1", "POST", "/api/gym/sessions/"+sid+"/complete", nil))
	if res.CompletionRate != 0.5 || res.CheckedIn != true || res.Customized {
		t.Fatalf("computed adherence = %+v, want rate 0.5 checked_in true not customized", res)
	}

	// planned = 0 (no template) -> rate 1.0
	sid2 := f.addSession("u1", "2026-07-11", nil, []loggedFlag{{}})
	res = decode[gym.AdherenceResult](t, do(t, mux, "u1", "POST", "/api/gym/sessions/"+sid2+"/complete", nil))
	if res.CompletionRate != 1.0 {
		t.Fatalf("planned=0 rate = %v, want 1.0", res.CompletionRate)
	}

	// is_extra present -> customized
	sid3 := f.addSession("u1", "2026-07-12", &tmpl.ID, []loggedFlag{{}, {isExtra: true}})
	res = decode[gym.AdherenceResult](t, do(t, mux, "u1", "POST", "/api/gym/sessions/"+sid3+"/complete", nil))
	if !res.Customized {
		t.Fatalf("expected customized when an exercise is_extra: %+v", res)
	}

	// explicit completion_rate overrides the computed one
	sid4 := f.addSession("u1", "2026-07-13", &tmpl.ID, []loggedFlag{{}, {}})
	res = decode[gym.AdherenceResult](t, do(t, mux, "u1", "POST", "/api/gym/sessions/"+sid4+"/complete",
		map[string]any{"completion_rate": 0.9}))
	if res.CompletionRate != 0.9 {
		t.Fatalf("explicit rate = %v, want 0.9", res.CompletionRate)
	}
}

func TestCompleteSessionOwnership(t *testing.T) {
	f := newFake()
	mux := serve(f)
	sid := f.addSession("u1", "2026-07-10", nil, nil)
	want(t, do(t, mux, "u2", "POST", "/api/gym/sessions/"+sid+"/complete", nil), http.StatusForbidden)
	want(t, do(t, mux, "u1", "POST", "/api/gym/sessions/missing/complete", nil), http.StatusNotFound)
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

func TestProgressHistoryAndTrend(t *testing.T) {
	f := newFake()
	mux := serve(f)

	// Log out of date order; weights rise 50 -> 70 for an improving trend.
	f.logExercise("u1", "Bench Press", "2026-07-05", fptr(60), iptr(8), iptr(3))
	f.logExercise("u1", "Bench Press", "2026-07-01", fptr(50), iptr(8), iptr(3))
	f.logExercise("u1", "Bench Press", "2026-07-03", fptr(50), iptr(8), iptr(3))
	f.logExercise("u1", "Bench Press", "2026-07-07", fptr(70), iptr(8), iptr(3))
	f.logExercise("u1", "Bench Press", "2026-07-09", fptr(70), iptr(8), iptr(3))

	p := decode[gym.ExerciseProgress](t, do(t, mux, "u1", "GET", "/api/gym/progress/Bench%20Press", nil))
	if len(p.History) != 5 || p.History[0].Date != "2026-07-01" || p.History[4].Date != "2026-07-09" {
		t.Fatalf("history not date-ASC: %+v", p.History)
	}
	if p.PersonalBest == nil || p.PersonalBest.Weight != 70 {
		t.Fatalf("personal best = %+v, want 70", p.PersonalBest)
	}
	if p.Trend != "improving" {
		t.Fatalf("trend = %q, want improving", p.Trend)
	}

	// Fewer than 3 data points -> insufficient_data.
	f.logExercise("u1", "Deadlift", "2026-07-01", fptr(100), iptr(5), iptr(3))
	f.logExercise("u1", "Deadlift", "2026-07-03", fptr(105), iptr(5), iptr(3))
	p = decode[gym.ExerciseProgress](t, do(t, mux, "u1", "GET", "/api/gym/progress/Deadlift", nil))
	if p.Trend != "insufficient_data" {
		t.Fatalf("trend = %q, want insufficient_data", p.Trend)
	}
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

func TestGetPatterns(t *testing.T) {
	f := newFake()
	mux := serve(f)

	// null when no row yet
	w := do(t, mux, "u1", "GET", "/api/gym/patterns", nil)
	want(t, w, http.StatusOK)
	if got := decode[*gym.GymPatterns](t, w); got != nil {
		t.Fatalf("patterns = %+v, want null", got)
	}

	f.patterns["u1"] = &gym.GymPatterns{MostTrainedMuscles: []string{"chest"}, AdherenceRate: 0.8}
	got := decode[gym.GymPatterns](t, do(t, mux, "u1", "GET", "/api/gym/patterns", nil))
	if got.AdherenceRate != 0.8 || len(got.MostTrainedMuscles) != 1 {
		t.Fatalf("patterns = %+v", got)
	}
}

// ---------------------------------------------------------------------------
// Pure computation (RebuildGymPatterns math + completion + trend)
// ---------------------------------------------------------------------------

func TestComputeCompletion(t *testing.T) {
	rate, custom := gym.ComputeCompletion([]gym.ExerciseFlags{{}, {}, {Skipped: true}}, 4)
	if rate != 0.5 || !custom {
		t.Fatalf("2 done of 4 with a skip = (%v,%v), want (0.5,true)", rate, custom)
	}
	rate, custom = gym.ComputeCompletion(nil, 0)
	if rate != 1.0 || custom {
		t.Fatalf("planned 0 = (%v,%v), want (1.0,false)", rate, custom)
	}
	_, custom = gym.ComputeCompletion([]gym.ExerciseFlags{{IsExtra: true}}, 3)
	if !custom {
		t.Fatalf("extra exercise should mark customized")
	}
}

func TestComputeAdherenceStats(t *testing.T) {
	rows := []gym.AdherenceRow{
		{ScheduledDate: "2026-06-01", CheckedIn: true, Customized: true},  // Monday
		{ScheduledDate: "2026-06-02", CheckedIn: true, Customized: false}, // Tuesday
		{ScheduledDate: "2026-06-08", CheckedIn: false},                   // Monday, missed
		{ScheduledDate: "2026-06-15", CheckedIn: false},                   // Monday, missed
		{ScheduledDate: "2026-06-03", CheckedIn: false},                   // Wednesday, missed
	}
	avg, adh, cust, missed := gym.ComputeAdherenceStats(rows, 90)
	// 2 checked-in over 90/7 weeks.
	if wantAvg := 2.0 / (90.0 / 7.0); avg != wantAvg {
		t.Errorf("avgSessionsPerWeek = %v, want %v", avg, wantAvg)
	}
	if adh != 2.0/5.0 {
		t.Errorf("adherenceRate = %v, want 0.4", adh)
	}
	if cust != 1.0/2.0 {
		t.Errorf("customizationRate = %v, want 0.5", cust)
	}
	if missed == nil || *missed != "Monday" {
		t.Errorf("mostMissedDay = %v, want Monday", missed)
	}

	// No misses -> nil.
	_, _, _, none := gym.ComputeAdherenceStats([]gym.AdherenceRow{{ScheduledDate: "2026-06-01", CheckedIn: true}}, 90)
	if none != nil {
		t.Errorf("mostMissedDay = %v, want nil when nothing missed", *none)
	}
}

func TestComputeMuscleVolumeBodyweightDefault(t *testing.T) {
	vol := gym.ComputeMuscleVolume([]gym.VolumeRow{
		{MusclePrimary: "chest", Sets: iptr(3), Reps: iptr(10), Weight: fptr(60)}, // 1800
		{MusclePrimary: "chest", Sets: iptr(3), Reps: iptr(10), Weight: nil},      // bodyweight -> *1.0 = 30
		{MusclePrimary: "core", Sets: iptr(4), Reps: iptr(15), Weight: nil},       // 60
	})
	if vol["chest"] != 1830 {
		t.Errorf("chest volume = %v, want 1830 (bodyweight defaults weight to 1.0)", vol["chest"])
	}
	if vol["core"] != 60 {
		t.Errorf("core volume = %v, want 60", vol["core"])
	}
}

func TestTopAndBottomMuscles(t *testing.T) {
	top, bottom := gym.TopAndBottomMuscles(map[string]float64{
		"chest": 1000, "back": 800, "core": 600, "biceps": 400, "calves": 0,
	})
	if len(top) != 3 || top[0] != "chest" || top[1] != "back" || top[2] != "core" {
		t.Errorf("top = %v, want [chest back core]", top)
	}
	// bottom 3 among muscles with volume > 0 (calves excluded).
	if len(bottom) != 3 || bottom[0] != "biceps" {
		t.Errorf("bottom = %v, want lowest-first among positive muscles", bottom)
	}
	for _, m := range bottom {
		if m == "calves" {
			t.Errorf("bottom must exclude zero-volume muscles, got %v", bottom)
		}
	}
}

func TestComputeTrend(t *testing.T) {
	up := []gym.ProgressEntry{
		{Weight: fptr(50)}, {Weight: fptr(50)}, {Weight: fptr(50)},
		{Weight: fptr(60)}, {Weight: fptr(60)}, {Weight: fptr(60)},
	}
	if got := gym.ComputeTrend(up); got != "improving" {
		t.Errorf("trend = %q, want improving", got)
	}
	down := []gym.ProgressEntry{
		{Weight: fptr(60)}, {Weight: fptr(60)}, {Weight: fptr(60)},
		{Weight: fptr(50)}, {Weight: fptr(50)}, {Weight: fptr(50)},
	}
	if got := gym.ComputeTrend(down); got != "declining" {
		t.Errorf("trend = %q, want declining", got)
	}
	flat := []gym.ProgressEntry{{Weight: fptr(50)}, {Weight: fptr(50)}, {Weight: fptr(51)}}
	if got := gym.ComputeTrend(flat); got != "maintaining" {
		t.Errorf("trend = %q, want maintaining", got)
	}
	if got := gym.ComputeTrend([]gym.ProgressEntry{{Weight: fptr(50)}, {Weight: fptr(60)}}); got != "insufficient_data" {
		t.Errorf("trend = %q, want insufficient_data", got)
	}
}
