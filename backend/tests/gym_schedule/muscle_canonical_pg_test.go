package gymscheduletests

// D1 — exercise_library muscle groups, proved against a REAL Postgres.
//
// muscle_volume_map is keyed by exercise_library.muscle_group_primary, so a
// second spelling of one muscle ("Back" beside "back") renders as a second
// muscle in the muscle-focus view. The seed only ever writes canonical
// lowercase keys; these tests pin that the DATABASE now guarantees it too:
//
//   - migration 20260911000001's CHECK constraints refuse any other spelling,
//     in the primary column and inside the secondary array;
//   - SeedExerciseLibrary rewrites a drifted muscle column back to the seed's
//     value on the next startup, instead of leaving it as ON CONFLICT used to;
//   - after seeding, every muscle key in the table is one of the twelve.
//
// Skipped unless LUME_TEST_DATABASE_URL is set (see schedule_pg_sql_test.go).

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"

	"lume/backend/internal/gym"
)

var canonicalMuscles = map[string]bool{
	"chest": true, "back": true, "quadriceps": true, "hamstrings": true, "glutes": true,
	"shoulders": true, "biceps": true, "triceps": true, "core": true, "calves": true,
	"cardio": true, "full_body": true,
}

func isCheckViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23514"
}

func TestPG_LibraryRejectsNonCanonicalPrimaryMuscle(t *testing.T) {
	_, pool := pgStore(t)
	ctx := context.Background()
	for _, bad := range []string{"Back", "BACK", " back", "legs"} {
		_, err := pool.Exec(ctx, `
			INSERT INTO exercise_library (name, muscle_group_primary, category)
			VALUES ($1, $2, 'Back')`, "d1-probe-"+bad, bad)
		if !isCheckViolation(err) {
			t.Errorf("primary %q: want a check violation, got %v", bad, err)
		}
	}
}

func TestPG_LibraryRejectsNonCanonicalSecondaryMuscle(t *testing.T) {
	_, pool := pgStore(t)
	ctx := context.Background()
	_, err := pool.Exec(ctx, `
		INSERT INTO exercise_library (name, muscle_group_primary, muscle_groups_secondary, category)
		VALUES ('d1-probe-secondary', 'back', ARRAY['Chest'], 'Back')`)
	if !isCheckViolation(err) {
		t.Errorf("secondary {Chest}: want a check violation, got %v", err)
	}
}

func TestPG_SeedRewritesDriftedMuscleAndIsCanonical(t *testing.T) {
	_, pool := pgStore(t)
	ctx := context.Background()
	if err := gym.SeedExerciseLibrary(pool); err != nil {
		t.Fatalf("seed: %v", err)
	}

	// Drift one seeded row to a DIFFERENT canonical muscle (the constraint
	// forbids a non-canonical one), then re-seed: the seed must win.
	const name = "Barbell Bench Press"
	if _, err := pool.Exec(ctx,
		`UPDATE exercise_library SET muscle_group_primary = 'core', muscle_groups_secondary = '{}' WHERE name = $1`, name); err != nil {
		t.Fatalf("drift: %v", err)
	}
	if err := gym.SeedExerciseLibrary(pool); err != nil {
		t.Fatalf("re-seed: %v", err)
	}
	var primary string
	var secondary []string
	if err := pool.QueryRow(ctx,
		`SELECT muscle_group_primary, muscle_groups_secondary FROM exercise_library WHERE name = $1`, name).
		Scan(&primary, &secondary); err != nil {
		t.Fatalf("read back: %v", err)
	}
	if primary != "chest" || len(secondary) != 2 {
		t.Errorf("re-seed left %q %v, want chest [triceps shoulders]", primary, secondary)
	}

	// Every muscle key anywhere in the table is canonical.
	rows, err := pool.Query(ctx, `
		SELECT muscle_group_primary FROM exercise_library
		UNION SELECT unnest(muscle_groups_secondary) FROM exercise_library`)
	if err != nil {
		t.Fatalf("distinct muscles: %v", err)
	}
	defer rows.Close()
	seen := 0
	for rows.Next() {
		var m string
		if err := rows.Scan(&m); err != nil {
			t.Fatalf("scan: %v", err)
		}
		seen++
		if !canonicalMuscles[m] {
			t.Errorf("non-canonical muscle key %q in exercise_library", m)
		}
	}
	if seen == 0 {
		t.Fatal("no muscle keys read — the seed did not load")
	}
}
