package gymscheduletests

// Integration tests that execute SchedulePGStore's REAL SQL against a REAL
// Postgres. Everything else in this package substitutes an in-memory fake, so
// the SQL itself was never executed by any test — which is exactly how three
// shipping routes came to 500 on every single request:
//
//	POST   /api/gym/templates/{id}/exercises
//	PATCH  /api/gym/template-exercises/{id}
//	DELETE /api/gym/template-exercises/{id}
//
// GetTemplateExercise appended `JOIN workout_templates t` and scanned an extra
// &owner destination, but never added t.user_id to the select list: 22 columns
// returned, 23 destinations, and pgx rejects that unconditionally. It compiled,
// it vetted, and it passed the whole suite.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied. To run:
//
//	createdb lume_gate_test
//	psql -d lume_gate_test -c "CREATE SCHEMA auth;
//	  CREATE FUNCTION auth.uid() RETURNS text LANGUAGE sql STABLE AS \$\$
//	    SELECT current_setting('request.jwt.claim.sub', true) \$\$;
//	  CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS \$\$
//	    SELECT '{}'::jsonb \$\$;"
//	for f in supabase/migrations/*.sql; do psql -q -d lume_gate_test -v ON_ERROR_STOP=1 -f "$f"; done
//	LUME_TEST_DATABASE_URL=postgres:///lume_gate_test go test ./tests/gym_schedule/ -run PG

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/gym"
)

// pgStore dials LUME_TEST_DATABASE_URL, or skips.
func pgStore(t *testing.T) (*gym.SchedulePGStore, *pgxpool.Pool) {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping: %v", err)
	}
	t.Cleanup(pool.Close)
	return gym.NewSchedulePGStore(pool), pool
}

// seedTemplate creates a profile, a library exercise and a template, and
// returns (userID, templateID, exerciseID).
func seedTemplate(t *testing.T, pool *pgxpool.Pool, userID string) (string, string) {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	var exID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO exercise_library (name, muscle_group_primary, category, exercise_type, equipment, difficulty, met_value)
		 VALUES ($1,'chest','push','strength','barbell','intermediate',5.0)
		 ON CONFLICT (name) DO UPDATE SET met_value = EXCLUDED.met_value
		 RETURNING id::text`, "Bench Press "+userID).Scan(&exID); err != nil {
		t.Fatalf("seed exercise: %v", err)
	}
	var tplID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO workout_templates (user_id, name) VALUES ($1,'Push Day') RETURNING id::text`,
		userID).Scan(&tplID); err != nil {
		t.Fatalf("seed template: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, userID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM exercise_library WHERE id::text = $1`, exID)
	})
	return tplID, exID
}

// The regression: adding an exercise to a template must succeed and return the
// hydrated row. This 500'd on every request before the select list was widened.
func TestPG_AddTemplateExerciseReturnsTheRow(t *testing.T) {
	store, pool := pgStore(t)
	tplID, exID := seedTemplate(t, pool, "user_pg_add")

	te, err := store.AddTemplateExercise(context.Background(), tplID, gym.TemplateExerciseInput{
		ExerciseID:  exID,
		PlannedSets: ptr(4),
		PlannedReps: ptr(8),
		RestSeconds: ptr(90),
		SortOrder:   ptr(1),
	})
	if err != nil {
		t.Fatalf("AddTemplateExercise: %v", err)
	}
	if te == nil || te.ID == "" {
		t.Fatal("AddTemplateExercise returned no row")
	}
	if te.Exercise == nil || te.Exercise.ID != exID {
		t.Fatalf("joined library exercise = %+v, want id %s", te.Exercise, exID)
	}
	if te.PlannedSets == nil || *te.PlannedSets != 4 {
		t.Fatalf("planned_sets = %v, want 4", te.PlannedSets)
	}
}

// GetTemplateExercise must return the OWNING user, which is what the handlers
// authorize against. The missing column meant it returned an error instead —
// so the routes failed closed, but by 500 rather than by a real check.
func TestPG_GetTemplateExerciseReturnsOwner(t *testing.T) {
	store, pool := pgStore(t)
	tplID, exID := seedTemplate(t, pool, "user_pg_owner")

	te, err := store.AddTemplateExercise(context.Background(), tplID, gym.TemplateExerciseInput{ExerciseID: exID})
	if err != nil {
		t.Fatalf("AddTemplateExercise: %v", err)
	}
	got, owner, err := store.GetTemplateExercise(context.Background(), te.ID)
	if err != nil {
		t.Fatalf("GetTemplateExercise: %v", err)
	}
	if owner != "user_pg_owner" {
		t.Fatalf("owner = %q, want user_pg_owner", owner)
	}
	if got.ID != te.ID {
		t.Fatalf("id = %q, want %q", got.ID, te.ID)
	}
}

// The owner really is the template's user, not the caller's — this is the value
// the nested-resource authorization check depends on, so prove it discriminates.
func TestPG_GetTemplateExerciseOwnerIsTheTemplateOwner(t *testing.T) {
	store, pool := pgStore(t)
	tplA, exA := seedTemplate(t, pool, "user_pg_a")
	_, _ = seedTemplate(t, pool, "user_pg_b")

	te, err := store.AddTemplateExercise(context.Background(), tplA, gym.TemplateExerciseInput{ExerciseID: exA})
	if err != nil {
		t.Fatalf("AddTemplateExercise: %v", err)
	}
	_, owner, err := store.GetTemplateExercise(context.Background(), te.ID)
	if err != nil {
		t.Fatalf("GetTemplateExercise: %v", err)
	}
	if owner == "user_pg_b" {
		t.Fatal("owner resolved to the wrong user — the authorization check would pass for a stranger")
	}
	if owner != "user_pg_a" {
		t.Fatalf("owner = %q, want user_pg_a", owner)
	}
}

// The shared 22-column projection still scans correctly for the list path.
func TestPG_TemplateExercisesForStillScans(t *testing.T) {
	store, pool := pgStore(t)
	tplID, exID := seedTemplate(t, pool, "user_pg_list")

	if _, err := store.AddTemplateExercise(context.Background(), tplID, gym.TemplateExerciseInput{ExerciseID: exID}); err != nil {
		t.Fatalf("AddTemplateExercise: %v", err)
	}
	tpl, err := store.GetTemplate(context.Background(), tplID)
	if err != nil {
		t.Fatalf("GetTemplate: %v", err)
	}
	if len(tpl.Exercises) != 1 {
		t.Fatalf("template exercises = %d, want 1", len(tpl.Exercises))
	}
	if tpl.Exercises[0].Exercise == nil {
		t.Fatal("library exercise not joined onto the listed row")
	}
}

func ptr[T any](v T) *T { return &v }

// ListSessions had no LIMIT, so hydrating the Gym tab read every session a user
// ever logged, plus every exercise in each. A limit must return only the newest
// rows, and 0 must keep the full read for the callers that want a date range.
func TestPG_ListSessionsLimitReturnsNewest(t *testing.T) {
	_, pool := pgStore(t)
	store := gym.NewPGStore(pool)
	ctx := context.Background()
	userID := "pg_list_sessions_limit"
	if _, err := pool.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, userID)
	})
	if _, err := pool.Exec(ctx,
		`INSERT INTO gym_sessions (user_id, date)
		 SELECT $1, date '2024-01-01' + n FROM generate_series(0, 999) AS n`, userID); err != nil {
		t.Fatalf("seed sessions: %v", err)
	}

	all, err := store.ListSessions(ctx, userID, "", "", 0)
	if err != nil {
		t.Fatalf("list all: %v", err)
	}
	if len(all) != 1000 {
		t.Fatalf("limit 0 read %d sessions, want 1000", len(all))
	}

	capped, err := store.ListSessions(ctx, userID, "", "", 200)
	if err != nil {
		t.Fatalf("list capped: %v", err)
	}
	if len(capped) != 200 {
		t.Fatalf("limit 200 read %d sessions, want 200", len(capped))
	}
	if capped[0].Date != all[0].Date || capped[199].Date != all[199].Date {
		t.Fatalf("capped read is not the newest 200: first %s last %s", capped[0].Date, capped[199].Date)
	}
}

// The Total tile needs every logged day, not just the sessions a capped list
// returns. Sessions are seeded with no streak row, as imported sessions are.
func TestPG_StreakTotalDaysCountsEveryDate(t *testing.T) {
	_, pool := pgStore(t)
	store := gym.NewPGStore(pool)
	ctx := context.Background()
	userID := "pg_streak_total_days"
	if _, err := pool.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, userID)
	})
	if _, err := pool.Exec(ctx,
		`INSERT INTO gym_sessions (user_id, date)
		 SELECT $1, date '2025-01-01' + n FROM generate_series(0, 249) AS n`, userID); err != nil {
		t.Fatalf("seed sessions: %v", err)
	}

	st, err := store.GetStreak(ctx, userID)
	if err != nil {
		t.Fatalf("get streak: %v", err)
	}
	if st.TotalDays != 250 {
		t.Fatalf("total_days = %d, want 250", st.TotalDays)
	}
	if st.CurrentStreak != 0 || st.LongestStreak != 0 || st.LastGymDate != nil || st.FreezeUsed || st.LastFreezeDate != nil {
		t.Fatalf("streak fields without a streak row = %+v, want zero", st)
	}
}

// Progress sorted oldest first before LIMIT, so a user with more entries than
// the limit saw their oldest sets and never their latest. The limit must keep
// the newest entries and still return them oldest first.
func TestPG_ExerciseProgressLimitKeepsNewest(t *testing.T) {
	store, pool := pgStore(t)
	ctx := context.Background()
	userID := "pg_progress_limit"
	if _, err := pool.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, userID)
	})
	// 40 sessions on consecutive days, one Bench Press entry each, weight = day.
	if _, err := pool.Exec(ctx, `
		WITH s AS (
			INSERT INTO gym_sessions (user_id, date)
			SELECT $1, date '2025-01-01' + n FROM generate_series(0, 39) AS n
			RETURNING id, date
		)
		INSERT INTO gym_exercises (session_id, name, sets, reps, weight)
		SELECT id, 'Bench Press', 3, 5, (date - date '2025-01-01')::float8 FROM s`, userID); err != nil {
		t.Fatalf("seed progress: %v", err)
	}

	for _, tc := range []struct {
		name                string
		limit               int
		wantLen             int
		wantFirst, wantLast string
	}{
		{"limit below row count keeps the newest", 30, 30, "2025-01-11", "2025-02-09"},
		{"limit above row count returns every row", 50, 40, "2025-01-01", "2025-02-09"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			prog, err := store.GetExerciseProgress(ctx, userID, "bench press", tc.limit)
			if err != nil {
				t.Fatalf("progress: %v", err)
			}
			h := prog.History
			if len(h) != tc.wantLen {
				t.Fatalf("len = %d, want %d", len(h), tc.wantLen)
			}
			if h[0].Date != tc.wantFirst || h[len(h)-1].Date != tc.wantLast {
				t.Fatalf("range = %s..%s, want %s..%s", h[0].Date, h[len(h)-1].Date, tc.wantFirst, tc.wantLast)
			}
			for i := 1; i < len(h); i++ {
				if h[i].Date <= h[i-1].Date {
					t.Fatalf("history not oldest first at %d: %s after %s", i, h[i].Date, h[i-1].Date)
				}
			}
			if prog.PersonalBest == nil || prog.PersonalBest.Date != "2025-02-09" {
				t.Fatalf("personal best = %+v, want the newest entry", prog.PersonalBest)
			}
		})
	}
}
