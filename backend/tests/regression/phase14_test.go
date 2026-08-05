// Phase 14 re-verification (Part 1.6). One test per audited claim, asserted
// independently of the tests that originally shipped each fix — a prior audit
// report is not evidence. Hermetic: fake stores, httptest, no DB, no network.
//
// Overlap is deliberate where an existing test already covers a claim
// (tests/auth, tests/goals, tests/energy, tests/integrations); these assert the
// same guarantees from the outside so a regression fails here too.
package regressiontests

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/energy"
	"lumo/backend/internal/goals"
	"lumo/backend/internal/integrations"
)

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

func req(t *testing.T, mux *http.ServeMux, method, path, user, body string) *httptest.ResponseRecorder {
	t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	r = r.WithContext(auth.WithUserID(r.Context(), user))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, r)
	return rec
}

func data[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data  T       `json:"data"`
		Error *string `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode %s: %v", rec.Body.String(), err)
	}
	return env.Data
}

// ---------------------------------------------------------------------------
// Claim 1 — account deletion: identity BEFORE row, provider failure aborts.
// ---------------------------------------------------------------------------

type profileStore struct {
	rows  map[string]auth.Profile
	calls *[]string
}

func (s profileStore) EnsureExists(_ context.Context, id string) error {
	if _, ok := s.rows[id]; !ok {
		s.rows[id] = auth.Profile{ID: id}
	}
	return nil
}

func (s profileStore) Upsert(_ context.Context, p auth.Profile) error {
	s.rows[p.ID] = p
	return nil
}
func (s profileStore) Get(_ context.Context, id string) (auth.Profile, error) {
	p, ok := s.rows[id]
	if !ok {
		return auth.Profile{}, auth.ErrNotFound
	}
	return p, nil
}
func (s profileStore) Update(_ context.Context, id string, _, _ *string) (auth.Profile, error) {
	return s.Get(context.Background(), id)
}
func (s profileStore) Delete(_ context.Context, id string) error {
	*s.calls = append(*s.calls, "row:"+id)
	delete(s.rows, id)
	return nil
}

func TestAccountDeleteRemovesIdentityBeforeRow(t *testing.T) {
	var calls []string
	st := profileStore{rows: map[string]auth.Profile{"user_1": {ID: "user_1"}}, calls: &calls}
	mux := http.NewServeMux()
	auth.RegisterProfileWithIdentity(mux, st, func(_ context.Context, id string) error {
		calls = append(calls, "identity:"+id)
		return nil
	})

	if rec := req(t, mux, http.MethodDelete, "/api/profile", "user_1", ""); rec.Code != http.StatusOK {
		t.Fatalf("DELETE /api/profile = %d, body %s", rec.Code, rec.Body)
	}
	want := []string{"identity:user_1", "row:user_1"}
	if fmt.Sprint(calls) != fmt.Sprint(want) {
		t.Fatalf("call order = %v, want %v (identity must go first)", calls, want)
	}
	if _, ok := st.rows["user_1"]; ok {
		t.Fatal("profile row survived a successful delete")
	}
}

func TestAccountDeleteAbortsRowDeleteWhenIdentityDeleteFails(t *testing.T) {
	var calls []string
	st := profileStore{rows: map[string]auth.Profile{"user_1": {ID: "user_1"}}, calls: &calls}
	mux := http.NewServeMux()
	auth.RegisterProfileWithIdentity(mux, st, func(context.Context, string) error {
		return errors.New("clerk user delete: status 500")
	})

	rec := req(t, mux, http.MethodDelete, "/api/profile", "user_1", "")
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
	if _, ok := st.rows["user_1"]; !ok {
		t.Fatal("row deleted although the sign-in identity still exists — the account would be unreachable but signable-in")
	}
	if len(calls) != 0 {
		t.Fatalf("store touched after identity failure: %v", calls)
	}
	// The user is told to retry, not that the account is gone.
	if strings.Contains(rec.Body.String(), "deleted\":true") {
		t.Fatalf("502 body claims deletion: %s", rec.Body)
	}
}

// ---------------------------------------------------------------------------
// Claim 2 — server half of the calorie safety band on PUT /api/goals.
// (The client half lives in src/__tests__/phase14Regression.test.ts.)
// ---------------------------------------------------------------------------

type goalsStore struct{ g map[string]*goals.Goals }

func (s goalsStore) GetOnboarding(context.Context, string) (*goals.Onboarding, error) {
	return nil, nil
}
func (s goalsStore) CompleteOnboarding(context.Context, goals.OnboardingCompletion) (*goals.Onboarding, *goals.Goals, error) {
	return nil, nil, errors.New("unused")
}
func (s goalsStore) GetGoals(_ context.Context, uid string) (*goals.Goals, error) {
	return s.g[uid], nil
}
func (s goalsStore) UpsertGoals(_ context.Context, g *goals.Goals) (*goals.Goals, error) {
	s.g[g.UserID] = g
	return g, nil
}
func (s goalsStore) ListBodyWeight(context.Context, string) ([]goals.BodyWeight, error) {
	return nil, nil
}
func (s goalsStore) CreateBodyWeight(_ context.Context, bw *goals.BodyWeight) (*goals.BodyWeight, error) {
	return bw, nil
}
func (s goalsStore) GetBodyWeight(context.Context, string) (*goals.BodyWeight, error) {
	return nil, nil
}
func (s goalsStore) DeleteBodyWeight(context.Context, string) error { return nil }

func TestGoalsServerEnforcesCalorieBand(t *testing.T) {
	st := goalsStore{g: map[string]*goals.Goals{}}
	mux := http.NewServeMux()
	goals.Register(mux, st)

	for _, unsafe := range []float64{-1, 0, 900, 1199, 10001, 99999} {
		rec := req(t, mux, http.MethodPut, "/api/goals", "user_1",
			fmt.Sprintf(`{"calorie_target":%v}`, unsafe))
		if rec.Code != http.StatusBadRequest {
			t.Errorf("calorie_target=%v: %d, want 400", unsafe, rec.Code)
		}
	}
	if len(st.g) != 0 {
		t.Fatalf("rejected targets were persisted: %+v", st.g)
	}
	// Band edges are the accepted extremes.
	for _, ok := range []float64{1200, 5000, 10000} {
		rec := req(t, mux, http.MethodPut, "/api/goals", "user_1",
			fmt.Sprintf(`{"calorie_target":%v}`, ok))
		if rec.Code != http.StatusOK {
			t.Errorf("calorie_target=%v: %d, want 200 (body %s)", ok, rec.Code, rec.Body)
		}
	}
	if got := *st.g["user_1"].CalorieTarget; got != 10000 {
		t.Fatalf("stored target = %v, want 10000", got)
	}
}

// ---------------------------------------------------------------------------
// Claim 4 — cross-source dedupe.
// ---------------------------------------------------------------------------

func TestCrossSourceDuplicateSkipsSameWorkoutFromAnotherSource(t *testing.T) {
	min45, min61 := 45, 61
	existing := []integrations.ExistingSession{
		{SessionType: "cardio", DurationMinutes: &min45},
		{SessionType: "strength", DurationMinutes: &min61},
		{SessionType: "cardio", DurationMinutes: nil}, // no duration → never matches
	}
	cases := []struct {
		name     string
		typ      string
		duration int
		want     bool
	}{
		{"exact same duration and type", "cardio", 45, true},
		{"within +10 min tolerance", "cardio", 55, true},
		{"within -10 min tolerance", "cardio", 35, true},
		{"just outside tolerance", "cardio", 56, false},
		{"same duration, different type", "yoga", 45, false},
		{"matches only its own type's row", "strength", 52, true}, // 61-52 = 9 ≤ tolerance
		{"no candidate duration → import normally", "cardio", 0, false},
		{"negative duration → import normally", "cardio", -5, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := integrations.IsCrossSourceDuplicate(c.typ, c.duration, existing); got != c.want {
				t.Fatalf("IsCrossSourceDuplicate(%q,%d) = %v, want %v", c.typ, c.duration, got, c.want)
			}
		})
	}
	// No stored sessions → nothing can be a duplicate.
	if integrations.IsCrossSourceDuplicate("cardio", 45, nil) {
		t.Fatal("duplicate against an empty day")
	}
}

// Same-provider re-imports dedupe by activity id, not by the heuristic: the
// insert carries a per-provider dedupe column with ON CONFLICT DO NOTHING, and
// the cross-source scan explicitly excludes this provider's own rows.
func TestSameProviderReimportDedupesByActivityID(t *testing.T) {
	src := readFile(t, "../../internal/integrations/pg.go")
	for _, want := range []string{
		"col := dedupeColumn(in.Provider)",
		"IS NULL",                            // cross-source scan excludes own-provider rows
		"ON CONFLICT (user_id, %s) WHERE %s", // per-provider unique index
		"DO NOTHING",
	} {
		if !strings.Contains(src, want) {
			t.Errorf("integrations/pg.go no longer contains %q — same-provider dedupe changed", want)
		}
	}
	if !strings.Contains(src, "if errors.Is(err, pgx.ErrNoRows)") {
		t.Error("conflict path (no RETURNING row → skipped) is gone")
	}
}

// ---------------------------------------------------------------------------
// Claim 5 — timezone anchoring: the server honours the client's LOCAL date.
// ---------------------------------------------------------------------------

type energyStore struct{ intake map[string]float64 }

func (s energyStore) IntakeByDate(_ context.Context, _, from, to string) (map[string]float64, error) {
	out := map[string]float64{}
	for d, v := range s.intake {
		if d >= from && d <= to {
			out[d] = v
		}
	}
	return out, nil
}
func (s energyStore) ExerciseCaloriesByDate(context.Context, string, string, string) (map[string]float64, error) {
	return map[string]float64{}, nil
}
func (s energyStore) BodyStats(context.Context, string) (*energy.BodyStats, error) { return nil, nil }
func (s energyStore) CalorieTarget(context.Context, string) (*float64, error)      { return nil, nil }

func TestEnergyEndpointsAnchorOnClientLocalDate(t *testing.T) {
	mux := http.NewServeMux()
	energy.Register(mux, energyStore{intake: map[string]float64{"2026-03-01": 1234}})

	// Daily: ?date= is the client's local day, not the server's.
	day := data[energy.EnergyBalance](t, req(t, mux, http.MethodGet, "/api/energy-balance?date=2026-03-01", "u1", ""))
	if day.Date != "2026-03-01" || day.CaloriesIn != 1234 {
		t.Fatalf("daily = %+v, want date 2026-03-01 with 1234 in", day)
	}
	// Weekly: ?end= closes the 7-day window on the client's local day.
	wk := data[energy.WeeklyEnergyBalance](t, req(t, mux, http.MethodGet, "/api/energy-balance/week?end=2026-03-01", "u1", ""))
	if len(wk.Days) != 7 || wk.Days[6].Date != "2026-03-01" || wk.Days[0].Date != "2026-02-23" {
		t.Fatalf("week = %+v", wk.Days)
	}
	if wk.Days[6].CaloriesIn != 1234 {
		t.Fatalf("end-day intake = %v, want 1234", wk.Days[6].CaloriesIn)
	}
	// Malformed input fails closed (400) — never a silent server-calendar fallback.
	for _, path := range []string{
		"/api/energy-balance?date=tomorrow",
		"/api/energy-balance?date=2026-13-99",
		"/api/energy-balance/week?end=tomorrow",
		"/api/energy-balance/week?end=03-01-2026",
	} {
		if rec := req(t, mux, http.MethodGet, path, "u1", ""); rec.Code != http.StatusBadRequest {
			t.Errorf("%s = %d, want 400", path, rec.Code)
		}
	}
}

// ---------------------------------------------------------------------------
// Claim 6 — GET /api/export returns ONLY the caller's rows, with no tokens.
// ---------------------------------------------------------------------------

type recordedQuery struct {
	sql  string
	args []any
}

type fakeQuerier struct{ seen *[]recordedQuery }

type fakeRow struct{}

func (fakeRow) Scan(dest ...any) error {
	for _, d := range dest {
		if b, ok := d.(*[]byte); ok {
			*b = []byte(`[]`)
		}
	}
	return nil
}

func (q fakeQuerier) QueryRow(_ context.Context, sql string, args ...any) pgx.Row {
	*q.seen = append(*q.seen, recordedQuery{sql: sql, args: args})
	return fakeRow{}
}
func (q fakeQuerier) Query(context.Context, string, ...any) (pgx.Rows, error) {
	return nil, errors.New("unused")
}
func (q fakeQuerier) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, errors.New("unused")
}
func (q fakeQuerier) Begin(context.Context) (pgx.Tx, error) { return nil, errors.New("unused") }

func TestExportIsCallerScopedAndTokenFree(t *testing.T) {
	var seen []recordedQuery
	mux := http.NewServeMux()
	auth.RegisterExport(mux, fakeQuerier{seen: &seen})

	rec := req(t, mux, http.MethodGet, "/api/export", "user_1", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/export = %d, body %s", rec.Code, rec.Body)
	}
	if len(seen) != len(auth.ExportTableNames()) {
		t.Fatalf("%d queries for %d sections", len(seen), len(auth.ExportTableNames()))
	}

	for _, q := range seen {
		// Exactly one bind, and it is the authenticated caller — never a value
		// from the request.
		if len(q.args) != 1 || q.args[0] != "user_1" {
			t.Errorf("args = %v for %q, want [user_1]", q.args, q.sql)
		}
		if strings.Contains(q.sql, "$2") {
			t.Errorf("second bind in %q", q.sql)
		}
		// Every section terminates in a user-scoping predicate: owned rows on
		// user_id, the profile on id, child tables through a user-scoped
		// subselect on their parent. An unscoped section would leak other users.
		scoped := strings.HasSuffix(q.sql, "where user_id = $1") ||
			strings.HasSuffix(q.sql, "where user_id = $1)") ||
			strings.HasSuffix(q.sql, "where id = $1")
		if !scoped {
			t.Errorf("section not user-scoped: %q", q.sql)
		}
		// Child sections must reach their parent through the scoped subselect.
		if strings.Contains(q.sql, " in (select id from ") &&
			!strings.Contains(q.sql, "where user_id = $1)") {
			t.Errorf("child subselect not user-scoped: %q", q.sql)
		}
		// No section may emit OAuth token columns.
		if strings.Contains(q.sql, "integration_connections") &&
			!(strings.Contains(q.sql, "- 'access_token'") && strings.Contains(q.sql, "- 'refresh_token'")) {
			t.Errorf("integration_connections export keeps token material: %q", q.sql)
		}
	}

	// The document is keyed by section and stamped with the caller.
	body := data[map[string]json.RawMessage](t, rec)
	if string(body["exported_for"]) != `"user_1"` {
		t.Fatalf("exported_for = %s, want \"user_1\"", body["exported_for"])
	}
	for _, name := range auth.ExportTableNames() {
		key := name
		if key == "profiles" {
			key = "profile"
		}
		if _, ok := body[key]; !ok {
			t.Errorf("section %q missing from the export document", key)
		}
	}

	// Section list is sane (the migrations-derived completeness check lives in
	// tests/migrations TestExportCoversEveryUserTable; this guards duplicates).
	dup := map[string]bool{}
	for _, name := range auth.ExportTableNames() {
		if dup[name] {
			t.Errorf("table %q exported twice", name)
		}
		dup[name] = true
	}
	if !dup["profiles"] {
		t.Error("profiles missing from ExportTableNames")
	}

	// A different caller binds a different id — no shared/cached scoping.
	seen = nil
	if rec := req(t, mux, http.MethodGet, "/api/export", "user_2", ""); rec.Code != http.StatusOK {
		t.Fatalf("second caller = %d", rec.Code)
	}
	for _, q := range seen {
		if q.args[0] != "user_2" {
			t.Fatalf("query bound %v for caller user_2", q.args[0])
		}
	}
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return string(b)
}
