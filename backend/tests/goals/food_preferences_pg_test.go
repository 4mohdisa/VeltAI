package goalstests

// PGStore food preferences executed against a REAL Postgres. The fake cannot
// catch a wrong user_id filter or a COALESCE that wipes the field the caller
// left out, so both are pinned against the actual SQL.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied (see tests/food/days_pg_test.go for the setup).

import (
	"context"
	"fmt"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/goals"
)

func TestFoodPreferencesPG(t *testing.T) {
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
	s := goals.NewPGStore(pool)
	run := time.Now().UnixNano()
	userA, userB := fmt.Sprintf("prefs-a-%d", run), fmt.Sprintf("prefs-b-%d", run)
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM profiles WHERE id = ANY($1)`, []string{userA, userB})
	})

	if p, err := s.GetFoodPreferences(ctx, userA); err != nil || p != nil {
		t.Fatalf("no row yet: got %+v, %v; want nil, nil", p, err)
	}
	if _, err := s.UpdateFoodPreferences(ctx, userA, []string{"south_asian"}, []string{"halal"}); err != nil {
		t.Fatalf("first update: %v", err)
	}
	if _, err := s.UpdateFoodPreferences(ctx, userB, []string{"western"}, []string{"vegan"}); err != nil {
		t.Fatalf("user B update: %v", err)
	}
	got, err := s.UpdateFoodPreferences(ctx, userA, []string{"east_asian"}, nil)
	if err != nil {
		t.Fatalf("cuisine-only update: %v", err)
	}
	want := &goals.FoodPreferences{Cuisines: []string{"east_asian"}, DietaryRequirements: []string{"halal"}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("cuisine-only update = %+v, want %+v (diet must be kept)", got, want)
	}
	if a, _ := s.GetFoodPreferences(ctx, userA); !reflect.DeepEqual(a, want) {
		t.Fatalf("user A row = %+v, want %+v (user B must not change it)", a, want)
	}
	var seeded int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM saved_foods WHERE user_id = $1`, userA).Scan(&seeded); err != nil {
		t.Fatalf("count saved_foods: %v", err)
	}
	if seeded != 0 {
		t.Fatalf("saved_foods seeded %d rows; the preferences update must not seed", seeded)
	}
}
