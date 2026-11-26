package goalstests

// Row 14b Fix 9: the onboarding save with an adjusted calorie target stores
// macros split from that target, against a REAL Postgres, so the plan the app
// shows on Targets is the plan the goals row keeps.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied (see tests/food/days_pg_test.go for the setup).

import (
	"context"
	"fmt"
	"math"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/goals"
)

func TestCompleteOnboardingSplitsMacrosFromCalorieTargetPG(t *testing.T) {
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
	user := fmt.Sprintf("onb-kcal-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, user)
	})

	target := 1800
	_, g, err := goals.NewPGStore(pool).CompleteOnboarding(ctx, goals.OnboardingCompletion{
		UserID: user, Age: 30, Sex: "male", Height: 180, HeightUnit: "cm", Weight: 80, WeightUnit: "kg",
		ActivityLevel: "moderate", Goal: "health", CalorieTarget: &target,
	})
	if err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}

	var cal, protein, carbs, fat float64
	var source string
	if err := pool.QueryRow(ctx,
		`SELECT calorie_target, protein_target, carb_target, fat_target, source FROM goals WHERE user_id = $1`, user).
		Scan(&cal, &protein, &carbs, &fat, &source); err != nil {
		t.Fatalf("read back: %v", err)
	}
	if cal != 1800 || source != "manual" {
		t.Fatalf("stored calories=%v source=%q, want 1800/manual", cal, source)
	}
	if kcal := protein*4 + carbs*4 + fat*9; math.Abs(kcal-1800)/1800 > 0.02 {
		t.Errorf("stored macros add up to %v kcal, want within 2%% of 1800 (protein=%v carbs=%v fat=%v)", kcal, protein, carbs, fat)
	}
	if *g.ProteinTarget != protein || *g.CarbTarget != carbs || *g.FatTarget != fat {
		t.Errorf("returned goals %v/%v/%v differ from the stored row %v/%v/%v",
			*g.ProteinTarget, *g.CarbTarget, *g.FatTarget, protein, carbs, fat)
	}
}
