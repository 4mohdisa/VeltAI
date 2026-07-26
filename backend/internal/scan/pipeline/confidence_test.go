package pipeline

import "testing"

func factorByName(fs []ConfidenceFactor, name string) (ConfidenceFactor, bool) {
	for _, f := range fs {
		if f.Name == name {
			return f, true
		}
	}
	return ConfidenceFactor{}, false
}

func TestScoreConfidence_PlateDetectedFactor(t *testing.T) {
	b := ScoreConfidence(QualityResult{}, GeometryResult{PlateDetected: true}, nil)
	f, ok := factorByName(b.Factors, "plate_detected")
	if !ok {
		t.Fatalf("expected a plate_detected factor, got %+v", b.Factors)
	}
	if f.Points != 20 {
		t.Fatalf("plate_detected should be +20, got %d", f.Points)
	}
}

func TestScoreConfidence_LowLabel(t *testing.T) {
	// No plate, blurry, dark, AI-only macros → every penalty fires, clamps to 0.
	b := ScoreConfidence(
		QualityResult{SharpnessScore: 30, LightingScore: 30},
		GeometryResult{PlateDetected: false},
		[]FoodEstimate{{MacroSource: "ai_estimate"}},
	)
	if b.Score >= 60 {
		t.Fatalf("expected Score < 60, got %d", b.Score)
	}
	if b.Label != "Low" {
		t.Fatalf("expected Label Low, got %q", b.Label)
	}
	if b.Score != 0 {
		t.Fatalf("expected clamp to 0, got %d", b.Score)
	}
}

// TestScoreConfidence_BestCaseIsHigh: a perfect scan reaches exactly 55
// (plate 20 + sharp 15 + lighting 10 + database 10 + calibration 10 −
// single_angle 10) and lands in the "High" band (>=55) — the fix for the
// previously-unreachable High tier.
func TestScoreConfidence_BestCaseIsHigh(t *testing.T) {
	b := ScoreConfidence(
		QualityResult{SharpnessScore: 90, LightingScore: 90},
		GeometryResult{PlateDetected: true},
		[]FoodEstimate{{MacroSource: "database", Notes: []string{"Adjusted to your portions"}}},
	)
	if b.Score != 55 {
		t.Fatalf("best case should score 55, got %d (factors %+v)", b.Score, b.Factors)
	}
	if b.Label != "High" {
		t.Fatalf("score 55 should label High, got %q", b.Label)
	}
	if _, ok := factorByName(b.Factors, "calibration_applied"); !ok {
		t.Fatalf("expected calibration_applied factor from the note, got %+v", b.Factors)
	}
}
