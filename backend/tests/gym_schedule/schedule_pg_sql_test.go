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
// Skipped unless LUMO_TEST_DATABASE_URL points at a disposable database with
// the migrations applied. To run:
//
//	createdb lumo_gate_test
//	psql -d lumo_gate_test -c "CREATE SCHEMA auth;
//	  CREATE FUNCTION auth.uid() RETURNS text LANGUAGE sql STABLE AS \$\$
//	    SELECT current_setting('request.jwt.claim.sub', true) \$\$;
//	  CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS \$\$
//	    SELECT '{}'::jsonb \$\$;"
//	for f in supabase/migrations/*.sql; do psql -q -d lumo_gate_test -v ON_ERROR_STOP=1 -f "$f"; done
//	LUMO_TEST_DATABASE_URL=postgres:///lumo_gate_test go test ./tests/gym_schedule/ -run PG

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"lumo/backend/internal/gym"
)

// pgStore dials LUMO_TEST_DATABASE_URL, or skips.
func pgStore(t *testing.T) (*gym.SchedulePGStore, *pgxpool.Pool) {
	t.Helper()
	dsn := os.Getenv("LUMO_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUMO_TEST_DATABASE_URL not set — skipping real-SQL integration test")
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
