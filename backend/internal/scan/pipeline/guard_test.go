package pipeline

import (
	"context"
	"testing"
)

// Regression (review finding): a blank FoodName must NOT reach the ILIKE query,
// where '%%' would match an unrelated calibration row and apply the wrong
// multiplier. The fake row would scale weight ×1.5 if consulted; the guard must
// skip it so weight stays 100.
func TestApplyCalibration_BlankNameSkipsQuery(t *testing.T) {
	q := fakeQuerier{row: fakeRow{multiplier: 1.5, count: 9}}
	for _, name := range []string{"", "   "} {
		out := ApplyCalibration(context.Background(),
			[]FoodEstimate{{FoodName: name, WeightG: 100}}, "u1", q)
		if !approx(out[0].WeightG, 100) || len(out[0].Notes) != 0 {
			t.Fatalf("blank name %q must skip calibration, got weight=%v notes=%v", name, out[0].WeightG, out[0].Notes)
		}
	}
}

// Regression (review finding): a blank FoodName must NOT reach the library ILIKE
// query, where '%%' would match an arbitrary row and overwrite macros + falsely
// stamp MacroSource "database".
func TestCrosscheckMacros_BlankNameSkipsQuery(t *testing.T) {
	q := fakeQuerier{row: fakeRow{multiplier: 999, count: 0}} // never consulted
	in := []FoodEstimate{{FoodName: "  ", CaloriesPer100g: 111, MacroSource: "ai_estimate"}}
	out := CrosscheckMacros(in, "u1", q)
	if out[0].CaloriesPer100g != 111 || out[0].MacroSource != "ai_estimate" {
		t.Fatalf("blank name must skip crosscheck, got %+v", out[0])
	}
}
