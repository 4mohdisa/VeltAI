package cuisinetests

import (
	"context"
	"errors"
	"math"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"lumo/backend/internal/cuisine"
)

// Covers branches cuisine_test.go does not: unknown cuisines mixed with known
// ones, duplicate inputs, real keyword/pattern overlap dedupe, density
// override union+averaging, and the SeedCuisineFoods error path.
//
// Not covered here (can't be exercised hermetically without editing package
// data): TypicalMealCount round-half-up — every prior has TypicalMealCount=3,
// so no input set produces a fractional average.

func TestMergePriorsSkipsUnknownAmongKnown(t *testing.T) {
	cases := []struct {
		name string
		in   []string
	}{
		{"unknown first", []string{"atlantis", "western"}},
		{"unknown last", []string{"western", "narnia"}},
		{"unknown surrounded", []string{"nope", "western", "also_nope"}},
	}
	want := cuisine.MergePriors([]string{"western"})
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := cuisine.MergePriors(tc.in)
			if got.TypicalCarbSource != want.TypicalCarbSource ||
				got.TypicalFatSource != want.TypicalFatSource ||
				got.ExpectedDinnerTime != want.ExpectedDinnerTime ||
				got.TypicalMealCount != want.TypicalMealCount ||
				got.RicePortionPriorG != want.RicePortionPriorG {
				t.Fatalf("got %+v, want same as pure western merge %+v", got, want)
			}
			if len(got.JunkFoodKeywords) != len(want.JunkFoodKeywords) {
				t.Fatalf("JunkFoodKeywords = %v, want %v", got.JunkFoodKeywords, want.JunkFoodKeywords)
			}
		})
	}
}

func TestMergePriorsDuplicateCuisineInput(t *testing.T) {
	got := cuisine.MergePriors([]string{"south_asian", "south_asian"})
	single := cuisine.CuisinePriors["south_asian"]

	// Averaging the same cuisine twice must not change scalars.
	if got.RicePortionPriorG != single.RicePortionPriorG {
		t.Errorf("RicePortionPriorG = %v, want %v", got.RicePortionPriorG, single.RicePortionPriorG)
	}
	if got.TypicalMealCount != single.TypicalMealCount {
		t.Errorf("TypicalMealCount = %d, want %d", got.TypicalMealCount, single.TypicalMealCount)
	}
	if got.ExpectedDinnerTime != single.ExpectedDinnerTime {
		t.Errorf("ExpectedDinnerTime = %q, want %q", got.ExpectedDinnerTime, single.ExpectedDinnerTime)
	}
	// Dedupe must collapse the doubled keyword/pattern lists back to one copy.
	if len(got.JunkFoodKeywords) != len(single.JunkFoodKeywords) {
		t.Errorf("JunkFoodKeywords len = %d, want %d (deduped)", len(got.JunkFoodKeywords), len(single.JunkFoodKeywords))
	}
	if len(got.CommonMealPatterns) != len(single.CommonMealPatterns) {
		t.Errorf("CommonMealPatterns len = %d, want %d (deduped)", len(got.CommonMealPatterns), len(single.CommonMealPatterns))
	}
	// Doubled density values average to themselves.
	for k, v := range single.DensityOverrides {
		if got.DensityOverrides[k] != v {
			t.Errorf("DensityOverrides[%q] = %v, want %v", k, got.DensityOverrides[k], v)
		}
	}
}

func TestMergePriorsJunkKeywordOverlapDedupe(t *testing.T) {
	// Real overlaps in the data set, unlike the disjoint pair the existing
	// test uses: middle_eastern and mediterranean both list "baklava";
	// african and latin_american both list "fried plantain".
	cases := []struct {
		name    string
		in      []string
		overlap string
	}{
		{"baklava", []string{"middle_eastern", "mediterranean"}, "baklava"},
		{"fried plantain", []string{"african", "latin_american"}, "fried plantain"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := cuisine.MergePriors(tc.in)
			n := 0
			for _, j := range got.JunkFoodKeywords {
				if strings.EqualFold(j, tc.overlap) {
					n++
				}
			}
			if n != 1 {
				t.Errorf("keyword %q appears %d times, want exactly 1: %v", tc.overlap, n, got.JunkFoodKeywords)
			}
			wantLen := len(cuisine.CuisinePriors[tc.in[0]].JunkFoodKeywords) +
				len(cuisine.CuisinePriors[tc.in[1]].JunkFoodKeywords) - 1
			if len(got.JunkFoodKeywords) != wantLen {
				t.Errorf("JunkFoodKeywords len = %d, want %d (one shared keyword)", len(got.JunkFoodKeywords), wantLen)
			}
		})
	}
}

func TestMergePriorsMealPatternOverlapDedupe(t *testing.T) {
	// south_asian and east_asian share "rice" and "curry".
	got := cuisine.MergePriors([]string{"south_asian", "east_asian"})
	for _, shared := range []string{"rice", "curry"} {
		n := 0
		for _, p := range got.CommonMealPatterns {
			if strings.EqualFold(p, shared) {
				n++
			}
		}
		if n != 1 {
			t.Errorf("pattern %q appears %d times, want exactly 1: %v", shared, n, got.CommonMealPatterns)
		}
	}
	wantLen := len(cuisine.CuisinePriors["south_asian"].CommonMealPatterns) +
		len(cuisine.CuisinePriors["east_asian"].CommonMealPatterns) - 2
	if len(got.CommonMealPatterns) != wantLen {
		t.Errorf("CommonMealPatterns len = %d, want %d (two shared patterns)", len(got.CommonMealPatterns), wantLen)
	}
}

func TestMergePriorsDensityOverridesUnionAndAverage(t *testing.T) {
	// mediterranean: couscous=0.6, olive_oil=0.92
	// middle_eastern: rice=0.92, couscous=0.6
	// Shared key "couscous" is averaged; distinct keys pass through.
	got := cuisine.MergePriors([]string{"mediterranean", "middle_eastern"})
	want := map[string]float64{"couscous": 0.6, "olive_oil": 0.92, "rice": 0.92}
	if len(got.DensityOverrides) != len(want) {
		t.Fatalf("DensityOverrides = %v, want keys %v", got.DensityOverrides, want)
	}
	for k, v := range want {
		if g, ok := got.DensityOverrides[k]; !ok || math.Abs(g-v) > 1e-9 {
			t.Errorf("DensityOverrides[%q] = %v (present=%v), want %v", k, g, ok, v)
		}
	}
}

func TestMergePriorsWesternHasNoDensityOverrides(t *testing.T) {
	// western's DensityOverrides is empty — merging it alone must yield an
	// empty (but non-nil, per the merged-map construction) map.
	got := cuisine.MergePriors([]string{"western"})
	if got.DensityOverrides == nil {
		t.Fatal("DensityOverrides is nil, want non-nil empty map")
	}
	if len(got.DensityOverrides) != 0 {
		t.Fatalf("DensityOverrides = %v, want empty", got.DensityOverrides)
	}
}

func TestMergePriorsRiceAverageThreeCuisines(t *testing.T) {
	// south_asian=300, east_asian=200, western=150 -> 650/3.
	got := cuisine.MergePriors([]string{"south_asian", "east_asian", "western"})
	want := 650.0 / 3.0
	if math.Abs(got.RicePortionPriorG-want) > 1e-9 {
		t.Fatalf("RicePortionPriorG = %v, want %v", got.RicePortionPriorG, want)
	}
}

// errQuerier fails Exec after a set number of successes; SeedCuisineFoods
// must propagate the error and stop issuing further Execs.
type errQuerier struct {
	failAfter int
	calls     int
	err       error
}

func (e *errQuerier) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	panic("not used by SeedCuisineFoods")
}
func (e *errQuerier) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	panic("not used by SeedCuisineFoods")
}
func (e *errQuerier) Begin(ctx context.Context) (pgx.Tx, error) {
	panic("not used by SeedCuisineFoods")
}
func (e *errQuerier) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	e.calls++
	if e.calls > e.failAfter {
		return pgconn.CommandTag{}, e.err
	}
	return pgconn.CommandTag{}, nil
}

func TestSeedCuisineFoodsPropagatesExecError(t *testing.T) {
	sentinel := errors.New("boom")
	for _, failAfter := range []int{0, 3} {
		q := &errQuerier{failAfter: failAfter, err: sentinel}
		err := cuisine.SeedCuisineFoods(context.Background(), q)
		if !errors.Is(err, sentinel) {
			t.Fatalf("failAfter=%d: err = %v, want sentinel", failAfter, err)
		}
		if q.calls != failAfter+1 {
			t.Fatalf("failAfter=%d: Exec called %d times, want %d (stop at first error)", failAfter, q.calls, failAfter+1)
		}
	}
}
