package foodtests

// PGStore.LoggedDays executed against a REAL Postgres.
//
// The rest of days_test.go drives the handler through the in-memory fakeStore,
// which mirrors the intended semantics but cannot catch an SQL-level mistake —
// and the mistake that matters here is a missing or wrong `user_id = $1`, which
// would leak one user's logged days into another user's calendar. A fake can
// never reproduce that: it filters in Go. So the ownership claim is proved
// against the actual query.
//
// It also pins the two things the DISTINCT + range SQL is easy to get wrong:
// several rows on one day collapsing to one date, and from/to being inclusive
// on both ends.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied. To run:
//
//	createdb lume_gate_test
//	psql -d lume_gate_test -c "CREATE ROLE authenticated; CREATE SCHEMA auth;
//	  CREATE FUNCTION auth.uid() RETURNS text LANGUAGE sql STABLE AS \$\$
//	    SELECT current_setting('request.jwt.claim.sub', true) \$\$;
//	  CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS \$\$
//	    SELECT '{}'::jsonb \$\$;"
//	for f in supabase/migrations/*.sql; do psql -q -d lume_gate_test -v ON_ERROR_STOP=1 -f "$f"; done
//	LUME_TEST_DATABASE_URL=postgres:///lume_gate_test go test ./tests/food/ -run PG

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/food"
)

func daysPGStore(t *testing.T) (*food.PGStore, *pgxpool.Pool) {
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
	return food.NewPGStore(pool), pool
}

// seedDay inserts one food row for a user on a date, creating the profile the
// FK needs. Users are namespaced per test run so repeat runs stay independent.
func seedDay(t *testing.T, pool *pgxpool.Pool, userID, date, name string) {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	if _, err := pool.Exec(ctx,
		`INSERT INTO food_logs (user_id, date, food_name, calories) VALUES ($1, $2::date, $3, 100)`,
		userID, date, name); err != nil {
		t.Fatalf("seed log: %v", err)
	}
}

// TestPG_LoggedDaysNeverLeaksAnotherUsersDays is the ownership proof for the
// real query — user B must not see user A's dates.
func TestPG_LoggedDaysNeverLeaksAnotherUsersDays(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	a := fmt.Sprintf("user_a_%d", os.Getpid())
	b := fmt.Sprintf("user_b_%d", os.Getpid())

	seedDay(t, pool, a, "2026-09-01", "Oats")
	seedDay(t, pool, a, "2026-09-03", "Rice")
	seedDay(t, pool, b, "2026-09-02", "Steak")

	got, err := store.LoggedDays(ctx, a, nil, nil)
	if err != nil {
		t.Fatalf("LoggedDays(a): %v", err)
	}
	if len(got) != 2 || got[0] != "2026-09-01" || got[1] != "2026-09-03" {
		t.Fatalf("a's days = %v, want [2026-09-01 2026-09-03]", got)
	}
	for _, d := range got {
		if d == "2026-09-02" {
			t.Fatalf("a can see b's day %q — user_id scoping is not doing its job", d)
		}
	}

	// And the other direction, so the result is a filter and not an ordering fluke.
	gotB, err := store.LoggedDays(ctx, b, nil, nil)
	if err != nil {
		t.Fatalf("LoggedDays(b): %v", err)
	}
	if len(gotB) != 1 || gotB[0] != "2026-09-02" {
		t.Fatalf("b's days = %v, want [2026-09-02]", gotB)
	}

	// A user with nothing gets nothing — not everyone else's days.
	gotNone, err := store.LoggedDays(ctx, fmt.Sprintf("user_none_%d", os.Getpid()), nil, nil)
	if err != nil {
		t.Fatalf("LoggedDays(none): %v", err)
	}
	if len(gotNone) != 0 {
		t.Fatalf("a user with no logs got %v, want nothing", gotNone)
	}
}

// SELECT DISTINCT is the difference between one dot and four on a busy day.
func TestPG_LoggedDaysDedupesAndSorts(t *testing.T) {
	store, pool := daysPGStore(t)
	u := fmt.Sprintf("user_dedupe_%d", os.Getpid())

	seedDay(t, pool, u, "2026-09-05", "Curry")
	seedDay(t, pool, u, "2026-09-01", "Oats")
	seedDay(t, pool, u, "2026-09-05", "Wrap")
	seedDay(t, pool, u, "2026-09-05", "Apple")

	got, err := store.LoggedDays(context.Background(), u, nil, nil)
	if err != nil {
		t.Fatalf("LoggedDays: %v", err)
	}
	if len(got) != 2 || got[0] != "2026-09-01" || got[1] != "2026-09-05" {
		t.Fatalf("days = %v, want [2026-09-01 2026-09-05] — distinct and oldest first", got)
	}
}

// A ::date cast comparison is off-by-one in either direction if the bounds are
// exclusive, which would drop the first or last dot of a month on the calendar.
func TestPG_LoggedDaysRangeIsInclusiveAtBothEnds(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	u := fmt.Sprintf("user_range_%d", os.Getpid())

	for _, d := range []string{"2026-08-30", "2026-09-01", "2026-09-05", "2026-09-10"} {
		seedDay(t, pool, u, d, "Rice")
	}

	from, to := "2026-09-01", "2026-09-05"
	got, err := store.LoggedDays(ctx, u, &from, &to)
	if err != nil {
		t.Fatalf("LoggedDays: %v", err)
	}
	if len(got) != 2 || got[0] != from || got[1] != to {
		t.Fatalf("days = %v, want both bounds included", got)
	}

	// One open end.
	got, err = store.LoggedDays(ctx, u, &from, nil)
	if err != nil {
		t.Fatalf("LoggedDays(from only): %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("days from %s = %v, want 3", from, got)
	}
}
