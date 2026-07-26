package pipeline

import (
	"testing"

	"github.com/jackc/pgx/v5"
)

// macroRow fills CrosscheckMacros' 5 float targets (calories..fibre) positionally.
type macroRow struct {
	vals []float64
	err  error
}

func (r macroRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	for i := range dest {
		if i < len(r.vals) {
			if p, ok := dest[i].(*float64); ok {
				*p = r.vals[i]
			}
		}
	}
	return nil
}

func TestCrosscheckMacros_MatchSetsDatabase(t *testing.T) {
	q := fakeQuerier{row: macroRow{vals: []float64{130, 2.7, 28, 0.3, 0.4}}}
	out := CrosscheckMacros([]FoodEstimate{{FoodName: "rice", CaloriesPer100g: 999}}, "u1", q)
	if out[0].MacroSource != "database" {
		t.Fatalf("want database source, got %q", out[0].MacroSource)
	}
	if out[0].CaloriesPer100g != 130 || out[0].FibrePer100g != 0.4 {
		t.Fatalf("db macros not applied: %+v", out[0])
	}
}

func TestCrosscheckMacros_NoRowTagsAIEstimate(t *testing.T) {
	q := fakeQuerier{row: macroRow{err: pgx.ErrNoRows}}
	out := CrosscheckMacros([]FoodEstimate{{FoodName: "mystery", CaloriesPer100g: 42}}, "u1", q)
	if out[0].MacroSource != "ai_estimate" {
		t.Fatalf("want ai_estimate, got %q", out[0].MacroSource)
	}
	if out[0].CaloriesPer100g != 42 {
		t.Fatalf("gemini macros should be kept on no-match, got %v", out[0].CaloriesPer100g)
	}
}

func TestCrosscheckMacros_NoRowDoesNotDowngradeDatabase(t *testing.T) {
	q := fakeQuerier{row: macroRow{err: pgx.ErrNoRows}}
	out := CrosscheckMacros([]FoodEstimate{{FoodName: "x", MacroSource: "database"}}, "u1", q)
	if out[0].MacroSource != "database" {
		t.Fatalf("existing database source must not downgrade, got %q", out[0].MacroSource)
	}
}

func TestCrosscheckMacros_NilQuerier(t *testing.T) {
	in := []FoodEstimate{{FoodName: "rice", CaloriesPer100g: 5}}
	out := CrosscheckMacros(in, "u1", nil)
	if out[0].MacroSource != "" || out[0].CaloriesPer100g != 5 {
		t.Fatalf("nil q must leave estimates untouched, got %+v", out[0])
	}
}
