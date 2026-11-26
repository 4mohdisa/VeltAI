// GET /api/retention/summary behind auth (401 without a token). The handler
// tests use an in-memory Store; the PG tests prove the real SQL, the user B
// isolation and the p95 budget, and skip without LUME_TEST_DATABASE_URL.
package retention_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/retention"
)

// tokenIsUser accepts any bearer token and treats it as the user ID.
type tokenIsUser struct{}

func (tokenIsUser) Verify(_ context.Context, token string) (string, error) { return token, nil }

type memStore map[string]retention.Summary

func (m memStore) Summary(_ context.Context, userID, _ string) (retention.Summary, error) {
	return m[userID], nil
}

func server(store retention.Store) http.Handler {
	mux := http.NewServeMux()
	retention.Register(mux, store)
	return auth.Middleware(tokenIsUser{})(mux)
}

func get(h http.Handler, user string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodGet, "/api/retention/summary", nil)
	if user != "" {
		r.Header.Set("Authorization", "Bearer "+user)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	return rec
}

func decode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var body struct {
		Data map[string]any `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("bad body %s: %v", rec.Body, err)
	}
	return body.Data
}

func TestSummaryHandler(t *testing.T) {
	store := memStore{
		"user_a": {MealsLast30Days: 42, WorkoutsLast30Days: 9, CurrentStreakDays: 3},
		"user_b": {MealsLast30Days: 1},
	}
	cases := []struct {
		name string
		user string
		code int
		want map[string]any
	}{
		{"no token", "", http.StatusUnauthorized, nil},
		{"user A sees only A", "user_a", http.StatusOK, map[string]any{
			"meals_last_30_days": 42.0, "workouts_last_30_days": 9.0, "current_streak_days": 3.0}},
		{"user B sees only B", "user_b", http.StatusOK, map[string]any{
			"meals_last_30_days": 1.0, "workouts_last_30_days": 0.0, "current_streak_days": 0.0}},
		{"new user gets zeros", "user_new", http.StatusOK, map[string]any{
			"meals_last_30_days": 0.0, "workouts_last_30_days": 0.0, "current_streak_days": 0.0}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := get(server(store), c.user)
			if rec.Code != c.code {
				t.Fatalf("status = %d, want %d (%s)", rec.Code, c.code, rec.Body)
			}
			if c.want == nil {
				return
			}
			// Exactly these keys: counts only, nothing else can leak.
			if got := decode(t, rec); fmt.Sprint(got) != fmt.Sprint(c.want) {
				t.Errorf("data = %v, want %v", got, c.want)
			}
		})
	}
}

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func TestPG_SummaryCountsWindowAndIsolatesUsers(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	a := fmt.Sprintf("retention_a_%d", os.Getpid())
	b := fmt.Sprintf("retention_b_%d", os.Getpid())
	for _, id := range []string{a, b} {
		if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, id); err != nil {
			t.Fatalf("seed profile: %v", err)
		}
		t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	}
	// The handler has no timezone header here, so it uses the same day.
	today := config.Today(ctx)
	foods := []struct {
		user, meal, status string
		daysAgo            int
	}{
		{a, "breakfast", "confirmed", 0},
		{a, "breakfast", "confirmed", 0}, // same meal, second item: still one meal
		{a, "lunch", "confirmed", 0},
		{a, "dinner", "pending", 0}, // not confirmed: not counted
		{a, "lunch", "confirmed", retention.WindowDays - 1},
		{a, "lunch", "confirmed", retention.WindowDays}, // outside the window
		{a, "lunch", "confirmed", -1},                   // tomorrow: not counted
		{b, "dinner", "confirmed", 0},
	}
	for _, f := range foods {
		if _, err := pool.Exec(ctx, `INSERT INTO food_logs (user_id, date, meal_type, food_name, status)
			VALUES ($1, $2::date - $3::int, $4, 'Chicken rice', $5)`, f.user, today, f.daysAgo, f.meal, f.status); err != nil {
			t.Fatalf("seed food: %v", err)
		}
	}
	for _, g := range []struct {
		user    string
		daysAgo int
	}{{a, 0}, {a, retention.WindowDays - 1}, {a, retention.WindowDays}, {b, 0}, {b, 1}} {
		if _, err := pool.Exec(ctx, `INSERT INTO gym_sessions (user_id, date) VALUES ($1, $2::date - $3::int)`,
			g.user, today, g.daysAgo); err != nil {
			t.Fatalf("seed gym: %v", err)
		}
	}
	if _, err := pool.Exec(ctx, `INSERT INTO gym_streaks (user_id, current_streak) VALUES ($1, 5)`, b); err != nil {
		t.Fatalf("seed streak: %v", err)
	}

	h := server(retention.NewPGStore(pool))
	for _, c := range []struct {
		user string
		want retention.Summary
	}{
		{a, retention.Summary{MealsLast30Days: 3, WorkoutsLast30Days: 2, CurrentStreakDays: 0}},
		{b, retention.Summary{MealsLast30Days: 1, WorkoutsLast30Days: 2, CurrentStreakDays: 5}},
	} {
		rec := get(h, c.user)
		var body struct{ Data retention.Summary }
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || rec.Code != http.StatusOK {
			t.Fatalf("%s: status %d, body %s", c.user, rec.Code, rec.Body)
		}
		if body.Data != c.want {
			t.Errorf("%s: got %+v, want %+v", c.user, body.Data, c.want)
		}
	}
}

// Budget from PERF_BASELINE.md: slowest backend route, 200 ms p95, local
// database, seeded heavy user (go run ./tools/seed).
func TestPG_SummaryP95OnSeededHeavyUser(t *testing.T) {
	pool := testPool(t)
	const heavy, runs, budget = "seed_heavy", 200, 200 * time.Millisecond
	var exists bool
	if err := pool.QueryRow(context.Background(), `SELECT EXISTS (SELECT 1 FROM profiles WHERE id = $1)`, heavy).Scan(&exists); err != nil {
		t.Fatal(err)
	}
	if !exists {
		t.Skip("seed_heavy missing — run go run ./tools/seed against this database")
	}
	h := server(retention.NewPGStore(pool))
	times := make([]time.Duration, runs)
	for i := range times {
		start := time.Now()
		if rec := get(h, heavy); rec.Code != http.StatusOK {
			t.Fatalf("status %d", rec.Code)
		}
		times[i] = time.Since(start)
	}
	slices.Sort(times)
	p95 := times[runs*95/100-1]
	t.Logf("retention summary p95 = %v over %d runs (seed_heavy)", p95, runs)
	if p95 > budget {
		t.Errorf("p95 %v over the %v budget", p95, budget)
	}
}
