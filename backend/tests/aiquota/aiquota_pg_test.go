// aiquota.PGStore against a REAL Postgres: the counts are per user and per
// day, an unseen (user, day) reads 0, and Add increments in place. Skipped
// unless LUME_TEST_DATABASE_URL points at a disposable database with the
// migrations applied (see tests/food/days_pg_test.go for the setup).
package aiquotatests

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/aiquota"
)

func TestPG_AIDailyUsageCountsPerUserPerDay(t *testing.T) {
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)

	run := time.Now().UnixNano()
	a, b := fmt.Sprintf("quota_a_%d", run), fmt.Sprintf("quota_b_%d", run)
	for _, id := range []string{a, b} {
		if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1)`, id); err != nil {
			t.Fatalf("seed profile: %v", err)
		}
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = ANY($1)`, []string{a, b})
	})

	store := aiquota.NewPGStore(pool)
	const day, next = "2026-11-26", "2026-11-27"
	for range 2 {
		if err := store.Add(ctx, a, day); err != nil {
			t.Fatalf("Add: %v", err)
		}
	}
	cases := []struct {
		user, day string
		want      int
	}{
		{a, day, 2},
		{a, next, 0},
		{b, day, 0},
	}
	for _, tc := range cases {
		n, err := store.Used(ctx, tc.user, tc.day)
		if err != nil || n != tc.want {
			t.Errorf("Used(%s, %s) = %d, %v; want %d", tc.user, tc.day, n, err, tc.want)
		}
	}
}
