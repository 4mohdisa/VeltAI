package aitests

import (
	"testing"
	"time"

	"lume/backend/internal/ai"
)

func TestBuildScanAccuracyProfileNilForZeroCorrections(t *testing.T) {
	if p := ai.BuildScanAccuracyProfile(nil); p != nil {
		t.Errorf("BuildScanAccuracyProfile(nil) = %+v, want nil", p)
	}
	if p := ai.BuildScanAccuracyProfile([]ai.ScanCorrectionRow{}); p != nil {
		t.Errorf("BuildScanAccuracyProfile(empty) = %+v, want nil", p)
	}
}

// Rice is consistently underestimated (corrected > original), fries
// consistently overestimated (corrected < original).
func TestBuildScanAccuracyProfile(t *testing.T) {
	now := time.Date(2026, 7, 4, 9, 0, 0, 0, time.UTC)
	corrections := []ai.ScanCorrectionRow{
		{FoodNameOriginal: "Rice", WeightOriginalG: 100, WeightCorrectedG: 150, CorrectionMagnitude: 0.30, CreatedAt: now},
		{FoodNameOriginal: "rice", WeightOriginalG: 200, WeightCorrectedG: 280, CorrectionMagnitude: 0.20, CreatedAt: now}, // case-insensitive grouping: ratio 0.4
		{FoodNameOriginal: "Fries", WeightOriginalG: 100, WeightCorrectedG: 60, CorrectionMagnitude: 0.40, CreatedAt: now},
		{FoodNameOriginal: "", WeightOriginalG: 50, WeightCorrectedG: 80, CorrectionMagnitude: 0.10, CreatedAt: now},     // empty name skipped from grouping
		{FoodNameOriginal: "Ghost", WeightOriginalG: 0, WeightCorrectedG: 50, CorrectionMagnitude: 0.05, CreatedAt: now}, // weight_original<=0 skipped from ratio
	}
	p := ai.BuildScanAccuracyProfile(corrections)
	if p == nil {
		t.Fatal("profile = nil, want non-nil")
	}

	avgMag := (0.30 + 0.20 + 0.40 + 0.10 + 0.05) / 5
	wantAccuracy := 100 * (1 - avgMag)
	if diff := p.OverallAccuracyPct - wantAccuracy; diff > 1e-9 || diff < -1e-9 {
		t.Errorf("overall_accuracy_pct = %v, want %v", p.OverallAccuracyPct, wantAccuracy)
	}
	if diff := p.AvgCorrectionMagnitude - avgMag; diff > 1e-9 || diff < -1e-9 {
		t.Errorf("avg_correction_magnitude = %v, want %v", p.AvgCorrectionMagnitude, avgMag)
	}

	if len(p.MostUnderestimatedFoods) == 0 || p.MostUnderestimatedFoods[0] != "rice" {
		t.Errorf("most_underestimated_foods = %v, want [rice]", p.MostUnderestimatedFoods)
	}
	if len(p.MostOverestimatedFoods) == 0 || p.MostOverestimatedFoods[0] != "fries" {
		t.Errorf("most_overestimated_foods = %v, want [fries]", p.MostOverestimatedFoods)
	}
	// rice's positive ratio must not also show up as overestimated, and
	// vice versa.
	for _, name := range p.MostOverestimatedFoods {
		if name == "rice" {
			t.Error("rice (underestimated) leaked into most_overestimated_foods")
		}
	}
	for _, name := range p.MostUnderestimatedFoods {
		if name == "fries" {
			t.Error("fries (overestimated) leaked into most_underestimated_foods")
		}
	}
}

// clamp is exercised indirectly: a magnitude > 1 must not push accuracy below 0.
func TestBuildScanAccuracyProfileClampsAccuracy(t *testing.T) {
	corrections := []ai.ScanCorrectionRow{
		{FoodNameOriginal: "Soup", WeightOriginalG: 100, WeightCorrectedG: 400, CorrectionMagnitude: 3.0, CreatedAt: time.Now()},
	}
	p := ai.BuildScanAccuracyProfile(corrections)
	if p == nil {
		t.Fatal("profile = nil")
	}
	if p.OverallAccuracyPct != 0 {
		t.Errorf("overall_accuracy_pct = %v, want clamped to 0", p.OverallAccuracyPct)
	}
}
