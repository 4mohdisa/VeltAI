package pipeline

import "testing"

// findFactor is this file's local lookup helper (confidence_test.go already
// declares factorByName; do not redeclare it).
func findFactor(fs []ConfidenceFactor, name string) (ConfidenceFactor, bool) {
	for _, f := range fs {
		if f.Name == name {
			return f, true
		}
	}
	return ConfidenceFactor{}, false
}

func TestConfidenceLabel_Bands(t *testing.T) {
	cases := []struct {
		score int
		want  string
	}{
		{55, "High"},
		{54, "Medium"},
		{35, "Medium"},
		{34, "Low"},
		{0, "Low"},
		{100, "High"},
	}
	for _, c := range cases {
		if got := confidenceLabel(c.score); got != c.want {
			t.Errorf("confidenceLabel(%d) = %q, want %q", c.score, got, c.want)
		}
	}
}

func TestScoreConfidence_Factors(t *testing.T) {
	cases := []struct {
		name      string
		quality   QualityResult
		geo       GeometryResult
		estimates []FoodEstimate
		factor    string // factor expected present...
		points    int    // ...with these points
		absent    string // factor expected absent ("" = skip)
	}{
		{
			name:   "plate detected +20",
			geo:    GeometryResult{PlateDetected: true},
			factor: "plate_detected", points: 20, absent: "no_plate",
		},
		{
			name:   "no plate -20",
			geo:    GeometryResult{PlateDetected: false},
			factor: "no_plate", points: -20, absent: "plate_detected",
		},
		{
			name:    "sharp image +15 at 61",
			quality: QualityResult{SharpnessScore: 61},
			factor:  "sharp_image", points: 15, absent: "blurry",
		},
		{
			name:    "no sharp_image at boundary 60",
			quality: QualityResult{SharpnessScore: 60},
			factor:  "", absent: "sharp_image",
		},
		{
			name:    "blurry -15 at 39",
			quality: QualityResult{SharpnessScore: 39},
			factor:  "blurry", points: -15, absent: "sharp_image",
		},
		{
			name:    "no blurry at boundary 40",
			quality: QualityResult{SharpnessScore: 40},
			factor:  "", absent: "blurry",
		},
		{
			name:    "good lighting +10 at 61",
			quality: QualityResult{LightingScore: 61},
			factor:  "good_lighting", points: 10, absent: "low_lighting",
		},
		{
			name:    "low lighting -15 at 39",
			quality: QualityResult{LightingScore: 39},
			factor:  "low_lighting", points: -15, absent: "good_lighting",
		},
		{
			name:      "database match +10",
			estimates: []FoodEstimate{{MacroSource: "database"}},
			factor:    "database_match", points: 10, absent: "ai_macros_only",
		},
		{
			name:      "ai macros only -10",
			estimates: []FoodEstimate{{MacroSource: "ai_estimate"}},
			factor:    "ai_macros_only", points: -10, absent: "database_match",
		},
		{
			name:      "calibration applied +10",
			estimates: []FoodEstimate{{MacroSource: "database", Notes: []string{"Adjusted to your portions"}}},
			factor:    "calibration_applied", points: 10,
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			b := ScoreConfidence(c.quality, c.geo, c.estimates)
			if c.factor != "" {
				f, ok := findFactor(b.Factors, c.factor)
				if !ok {
					t.Fatalf("expected factor %q present, got %+v", c.factor, b.Factors)
				}
				if f.Points != c.points {
					t.Fatalf("factor %q points = %d, want %d", c.factor, f.Points, c.points)
				}
			}
			if c.absent != "" {
				if _, ok := findFactor(b.Factors, c.absent); ok {
					t.Fatalf("expected factor %q absent, got %+v", c.absent, b.Factors)
				}
			}
		})
	}
}

// single_angle -10 fires on every call, regardless of inputs.
func TestScoreConfidence_SingleAngleAlways(t *testing.T) {
	inputs := []struct {
		quality QualityResult
		geo     GeometryResult
		est     []FoodEstimate
	}{
		{},
		{QualityResult{SharpnessScore: 90, LightingScore: 90}, GeometryResult{PlateDetected: true}, []FoodEstimate{{MacroSource: "database"}}},
		{QualityResult{SharpnessScore: 10, LightingScore: 10}, GeometryResult{PlateDetected: false}, []FoodEstimate{{MacroSource: "ai_estimate"}}},
	}
	for i, in := range inputs {
		b := ScoreConfidence(in.quality, in.geo, in.est)
		f, ok := findFactor(b.Factors, "single_angle")
		if !ok || f.Points != -10 {
			t.Fatalf("input %d: expected single_angle -10, got %+v", i, b.Factors)
		}
	}
}

func TestScoreConfidence_Scenarios(t *testing.T) {
	cases := []struct {
		name      string
		quality   QualityResult
		geo       GeometryResult
		estimates []FoodEstimate
		wantScore int
		wantLabel string
	}{
		{
			name:      "perfect",
			quality:   QualityResult{SharpnessScore: 90, LightingScore: 90},
			geo:       GeometryResult{PlateDetected: true},
			estimates: []FoodEstimate{{MacroSource: "database", Notes: []string{"Adjusted to your portions"}}},
			wantScore: 55, wantLabel: "High",
		},
		{
			name:      "average",
			quality:   QualityResult{SharpnessScore: 90, LightingScore: 90},
			geo:       GeometryResult{PlateDetected: true},
			estimates: []FoodEstimate{{MacroSource: "database"}},
			wantScore: 45, wantLabel: "Medium",
		},
		{
			name:      "poor clamps to zero",
			quality:   QualityResult{SharpnessScore: 30, LightingScore: 30},
			geo:       GeometryResult{PlateDetected: false},
			estimates: []FoodEstimate{{MacroSource: "ai_estimate"}},
			wantScore: 0, wantLabel: "Low",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			b := ScoreConfidence(c.quality, c.geo, c.estimates)
			if b.Score != c.wantScore {
				t.Errorf("Score = %d, want %d (factors %+v)", b.Score, c.wantScore, b.Factors)
			}
			if b.Label != c.wantLabel {
				t.Errorf("Label = %q, want %q", b.Label, c.wantLabel)
			}
		})
	}
}

// Kitchen sink: across a wide grid of inputs the clamp invariant [0,100] always holds.
func TestScoreConfidence_ClampInvariant(t *testing.T) {
	scores := []int{0, 39, 40, 60, 61, 100}
	plates := []bool{true, false}
	sources := []string{"database", "ai_estimate"}
	for _, s := range scores {
		for _, l := range scores {
			for _, p := range plates {
				for _, src := range sources {
					b := ScoreConfidence(
						QualityResult{SharpnessScore: s, LightingScore: l},
						GeometryResult{PlateDetected: p},
						[]FoodEstimate{{MacroSource: src, Notes: []string{"Adjusted to your portions"}}},
					)
					if b.Score < 0 || b.Score > 100 {
						t.Fatalf("Score %d out of [0,100] for sharp=%d light=%d plate=%v src=%s", b.Score, s, l, p, src)
					}
				}
			}
		}
	}
}
