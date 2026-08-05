package cuisinetests

import (
	"context"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"lume/backend/internal/cuisine"
)

// ---------------------------------------------------------------------------
// MergePriors
// ---------------------------------------------------------------------------

func TestMergePriorsSingleCuisine(t *testing.T) {
	got := cuisine.MergePriors([]string{"south_asian"})
	want := cuisine.CuisinePriors["south_asian"]
	if got.TypicalCarbSource != want.TypicalCarbSource ||
		got.TypicalFatSource != want.TypicalFatSource ||
		got.ExpectedDinnerTime != want.ExpectedDinnerTime ||
		got.TypicalMealCount != want.TypicalMealCount ||
		got.RicePortionPriorG != want.RicePortionPriorG {
		t.Fatalf("single-cuisine merge mismatch: got %+v, want scalars from %+v", got, want)
	}
	if len(got.JunkFoodKeywords) != len(want.JunkFoodKeywords) {
		t.Fatalf("junk keywords: got %v, want %v", got.JunkFoodKeywords, want.JunkFoodKeywords)
	}
	if len(got.CommonMealPatterns) != len(want.CommonMealPatterns) {
		t.Fatalf("meal patterns: got %v, want %v", got.CommonMealPatterns, want.CommonMealPatterns)
	}
}

func TestMergePriorsMultipleCuisinesAveragesAndUnion(t *testing.T) {
	// south_asian: meals=3 rice=300; mediterranean: meals=3 rice=150 -> avg rice=225.
	got := cuisine.MergePriors([]string{"south_asian", "mediterranean"})

	if got.TypicalMealCount != 3 {
		t.Errorf("TypicalMealCount = %d, want 3", got.TypicalMealCount)
	}
	if got.RicePortionPriorG != 225 {
		t.Errorf("RicePortionPriorG = %v, want 225", got.RicePortionPriorG)
	}
	if got.TypicalCarbSource != cuisine.CuisinePriors["south_asian"].TypicalCarbSource {
		t.Errorf("TypicalCarbSource = %q, want first-selected cuisine's value %q",
			got.TypicalCarbSource, cuisine.CuisinePriors["south_asian"].TypicalCarbSource)
	}
	if got.TypicalFatSource != cuisine.CuisinePriors["south_asian"].TypicalFatSource {
		t.Errorf("TypicalFatSource = %q, want first-selected cuisine's value %q",
			got.TypicalFatSource, cuisine.CuisinePriors["south_asian"].TypicalFatSource)
	}

	wantJunkLen := len(cuisine.CuisinePriors["south_asian"].JunkFoodKeywords) + len(cuisine.CuisinePriors["mediterranean"].JunkFoodKeywords)
	if len(got.JunkFoodKeywords) != wantJunkLen {
		t.Errorf("JunkFoodKeywords union len = %d, want %d (no overlap between these two lists): %v",
			len(got.JunkFoodKeywords), wantJunkLen, got.JunkFoodKeywords)
	}
	seen := map[string]bool{}
	for _, j := range got.JunkFoodKeywords {
		key := strings.ToLower(j)
		if seen[key] {
			t.Errorf("JunkFoodKeywords contains duplicate (case-insensitive): %q", j)
		}
		seen[key] = true
	}

	wantPatternsLen := len(cuisine.CuisinePriors["south_asian"].CommonMealPatterns) + len(cuisine.CuisinePriors["mediterranean"].CommonMealPatterns)
	if len(got.CommonMealPatterns) != wantPatternsLen {
		t.Errorf("CommonMealPatterns union len = %d, want %d: %v", len(got.CommonMealPatterns), wantPatternsLen, got.CommonMealPatterns)
	}
}

// The merge order here is deliberately chosen so neither "take the first
// input" nor "take the last input" would produce the correct max: the
// latest dinner time (mediterranean, 21:00) sits in the middle.
func TestMergePriorsDinnerTimeTakesLatest(t *testing.T) {
	got := cuisine.MergePriors([]string{"east_asian", "mediterranean", "western"})
	// east_asian=19:00, mediterranean=21:00, western=18:30 -> max is 21:00.
	if got.ExpectedDinnerTime != "21:00" {
		t.Fatalf("ExpectedDinnerTime = %q, want 21:00 (the actual latest, not first/last input order)", got.ExpectedDinnerTime)
	}
}

func TestMergePriorsZeroOrUnknownReturnsDefault(t *testing.T) {
	wantDefault := cuisine.CuisinePrior{
		TypicalCarbSource:  "rice_and_bread",
		TypicalFatSource:   "mixed_oils",
		ExpectedDinnerTime: "19:00",
		TypicalMealCount:   3,
		RicePortionPriorG:  200,
		JunkFoodKeywords:   []string{"candy", "chips", "soda", "cake", "cookie"},
		CommonMealPatterns: nil,
		DensityOverrides:   map[string]float64{},
	}

	for name, in := range map[string][]string{
		"nil slice":          nil,
		"empty slice":        {},
		"unknown cuisines":   {"atlantis", "narnia"},
		"mixed unknown only": {"not_a_cuisine"},
	} {
		t.Run(name, func(t *testing.T) {
			got := cuisine.MergePriors(in)
			if got.TypicalCarbSource != wantDefault.TypicalCarbSource ||
				got.TypicalFatSource != wantDefault.TypicalFatSource ||
				got.ExpectedDinnerTime != wantDefault.ExpectedDinnerTime ||
				got.TypicalMealCount != wantDefault.TypicalMealCount ||
				got.RicePortionPriorG != wantDefault.RicePortionPriorG {
				t.Fatalf("got %+v, want %+v", got, wantDefault)
			}
			if len(got.JunkFoodKeywords) != len(wantDefault.JunkFoodKeywords) {
				t.Fatalf("JunkFoodKeywords = %v, want %v", got.JunkFoodKeywords, wantDefault.JunkFoodKeywords)
			}
			for i, kw := range wantDefault.JunkFoodKeywords {
				if got.JunkFoodKeywords[i] != kw {
					t.Fatalf("JunkFoodKeywords[%d] = %q, want %q", i, got.JunkFoodKeywords[i], kw)
				}
			}
			if got.CommonMealPatterns != nil {
				t.Fatalf("CommonMealPatterns = %v, want nil", got.CommonMealPatterns)
			}
			if len(got.DensityOverrides) != 0 {
				t.Fatalf("DensityOverrides = %v, want empty map", got.DensityOverrides)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// SeedCuisineFoods
// ---------------------------------------------------------------------------

// fakeQuerier is a minimal db.Querier stub: SeedCuisineFoods only calls Exec.
type fakeQuerier struct {
	execSQLs []string
	execN    int
}

func (f *fakeQuerier) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	panic("not used by SeedCuisineFoods")
}
func (f *fakeQuerier) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	panic("not used by SeedCuisineFoods")
}
func (f *fakeQuerier) Begin(ctx context.Context) (pgx.Tx, error) {
	panic("not used by SeedCuisineFoods")
}
func (f *fakeQuerier) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	f.execSQLs = append(f.execSQLs, sql)
	f.execN++
	return pgconn.CommandTag{}, nil
}

func TestSeedCuisineFoodsIsIdempotent(t *testing.T) {
	f := &fakeQuerier{}
	if err := cuisine.SeedCuisineFoods(context.Background(), f); err != nil {
		t.Fatalf("SeedCuisineFoods returned error: %v", err)
	}

	wantN := 0
	for _, foods := range cuisine.Library {
		wantN += len(foods)
	}
	if f.execN != wantN {
		t.Fatalf("Exec called %d times, want %d (one per Library food)", f.execN, wantN)
	}
	for _, sql := range f.execSQLs {
		if !strings.Contains(sql, "ON CONFLICT (cuisine, food_name) DO NOTHING") {
			t.Fatalf("INSERT missing idempotent ON CONFLICT clause: %s", sql)
		}
	}
}

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

func TestLibraryHasAtLeast15EntriesPerCuisine(t *testing.T) {
	wantCuisines := []string{
		"south_asian", "east_asian", "southeast_asian", "middle_eastern",
		"mediterranean", "western", "african", "latin_american",
	}
	if len(cuisine.Library) != len(wantCuisines) {
		t.Fatalf("Library has %d cuisines, want %d", len(cuisine.Library), len(wantCuisines))
	}
	for _, c := range wantCuisines {
		foods, ok := cuisine.Library[c]
		if !ok {
			t.Errorf("Library missing cuisine %q", c)
			continue
		}
		if len(foods) < 15 {
			t.Errorf("Library[%q] has %d foods, want at least 15", c, len(foods))
		}
	}
}

func containsAny(s string, subs ...string) bool {
	s = strings.ToLower(s)
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func TestHalalFoodsNotIncorrectlyMarkedVegan(t *testing.T) {
	for cuisineName, foods := range cuisine.Library {
		for _, f := range foods {
			if f.IsHalal && f.IsVegan && containsAny(f.FoodName, "chicken", "beef", "lamb", "goat") {
				t.Errorf("%s/%s: IsHalal=true and IsVegan=true but name implies meat", cuisineName, f.FoodName)
			}
		}
	}
}

func TestDietaryFlagConsistency(t *testing.T) {
	for cuisineName, foods := range cuisine.Library {
		for _, f := range foods {
			if containsAny(f.FoodName, "pork", "bacon", "ham") && f.IsHalal {
				t.Errorf("%s/%s: name implies pork but IsHalal=true", cuisineName, f.FoodName)
			}
			if f.IsVegan && !f.IsVegetarian {
				t.Errorf("%s/%s: IsVegan=true but IsVegetarian=false", cuisineName, f.FoodName)
			}
		}
	}
}
