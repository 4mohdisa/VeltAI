package scan

import (
	"strings"
	"testing"
)

func fp(v float64) *float64 { return &v }

func TestClassifyCorrection(t *testing.T) {
	cases := []struct {
		name string
		c    Correction
		want string
	}{
		{"explicit type wins", Correction{CorrectionType: CorrectionDiscard}, CorrectionDiscard},
		{"name change → identity", Correction{FoodNameOriginal: "chicken curry", FoodNameCorrected: "butter chicken"}, CorrectionIdentity},
		{"case-only name change is NOT identity", Correction{FoodNameOriginal: "Dal", FoodNameCorrected: "dal", WeightOriginalG: 100, WeightCorrectedG: 150}, CorrectionPortion},
		{"weight change → portion", Correction{FoodNameOriginal: "rice", FoodNameCorrected: "rice", WeightOriginalG: 200, WeightCorrectedG: 260}, CorrectionPortion},
		{"nothing changed → macro", Correction{FoodNameOriginal: "rice", FoodNameCorrected: "rice", WeightOriginalG: 200, WeightCorrectedG: 200}, CorrectionMacro},
	}
	for _, tc := range cases {
		if got := ClassifyCorrection(tc.c); got != tc.want {
			t.Errorf("%s: got %q want %q", tc.name, got, tc.want)
		}
	}
}

func TestPickCalibrationFactor(t *testing.T) {
	food := &CalibrationFactor{FoodName: "rice", Multiplier: 1.2, SampleCount: 10}
	mealFew := &CalibrationFactor{FoodName: "rice", Multiplier: 1.5, SampleCount: 2}
	mealEnough := &CalibrationFactor{FoodName: "rice", Multiplier: 1.5, SampleCount: 3}

	if got := PickCalibrationFactor(food, mealFew); got != food {
		t.Error("meal row under 3 samples must fall back to the food-level factor")
	}
	if got := PickCalibrationFactor(food, mealEnough); got != mealEnough {
		t.Error("meal row with ≥3 samples must win")
	}
	if got := PickCalibrationFactor(food, nil); got != food {
		t.Error("nil meal row falls back")
	}
	if got := PickCalibrationFactor(nil, nil); got != nil {
		t.Error("nothing learned → nil")
	}
}

func TestHourBucket(t *testing.T) {
	cases := map[int]string{5: "morning", 10: "morning", 11: "midday", 15: "midday", 16: "evening", 21: "evening", 22: "late", 2: "late", -1: "late", 30: "late"}
	for h, want := range cases {
		if got := HourBucket(h); got != want {
			t.Errorf("HourBucket(%d) = %q, want %q", h, got, want)
		}
	}
}

func TestBandForScoreMirrorsPipelineThresholds(t *testing.T) {
	if BandForScore(55) != "high" || BandForScore(90) != "high" {
		t.Error("≥55 is high")
	}
	if BandForScore(54) != "medium" || BandForScore(35) != "medium" {
		t.Error("35–54 is medium")
	}
	if BandForScore(34) != "low" || BandForScore(0) != "low" {
		t.Error("<35 is low")
	}
}

func TestUpdateBandMean(t *testing.T) {
	mean, n := UpdateBandMean(0, 0, 0.4)
	if mean != 0.4 || n != 1 {
		t.Fatalf("first sample: %v/%d", mean, n)
	}
	mean, n = UpdateBandMean(mean, n, 0.2)
	if mean < 0.299 || mean > 0.301 || n != 2 {
		t.Fatalf("second sample: %v/%d, want ≈0.3/2", mean, n)
	}
}

func TestMiscalibrationWarnings(t *testing.T) {
	// high corrected MORE than medium → warning.
	bands := []BandStat{
		{Band: "high", SampleCount: 10, MeanMag: fp(0.5)},
		{Band: "medium", SampleCount: 10, MeanMag: fp(0.3)},
		{Band: "low", SampleCount: 10, MeanMag: fp(0.6)},
	}
	w := MiscalibrationWarnings(bands)
	if len(w) != 1 || !strings.Contains(w[0], `"high"`) {
		t.Fatalf("want one high-vs-medium warning, got %v", w)
	}
	// Healthy ordering → no warnings.
	healthy := []BandStat{
		{Band: "high", SampleCount: 10, MeanMag: fp(0.1)},
		{Band: "medium", SampleCount: 10, MeanMag: fp(0.3)},
		{Band: "low", SampleCount: 10, MeanMag: fp(0.5)},
	}
	if w := MiscalibrationWarnings(healthy); len(w) != 0 {
		t.Errorf("healthy bands warned: %v", w)
	}
	// Thin samples (<3) never warn.
	thin := []BandStat{
		{Band: "high", SampleCount: 2, MeanMag: fp(0.9)},
		{Band: "medium", SampleCount: 10, MeanMag: fp(0.1)},
	}
	if w := MiscalibrationWarnings(thin); len(w) != 0 {
		t.Errorf("thin bands warned: %v", w)
	}
}

func TestMatchRepeatMeal(t *testing.T) {
	meals := []SavedMealLite{
		{Name: "Tuesday lunch", Foods: []string{"chicken biryani", "raita"}, Weights: []float64{450, 80}},
		{Name: "Shake", Foods: []string{"protein shake"}, Weights: []float64{300}},
	}
	// Two of two items match (substring, case-insensitive) → matched.
	m := MatchRepeatMeal([]string{"Biryani", "raita", "salad"}, meals)
	if m == nil || m.Name != "Tuesday lunch" {
		t.Fatalf("expected Tuesday lunch, got %+v", m)
	}
	if m.TypicalWeights["chicken biryani"] != 450 {
		t.Errorf("typical weight missing: %+v", m.TypicalWeights)
	}
	// One item of a two-item meal is not enough.
	if m := MatchRepeatMeal([]string{"raita"}, meals); m != nil {
		t.Errorf("single overlap matched a 2-item meal: %+v", m)
	}
	// Single-food meals match on one.
	if m := MatchRepeatMeal([]string{"protein shake"}, meals); m == nil || m.Name != "Shake" {
		t.Errorf("single-food meal should match: %+v", m)
	}
	if m := MatchRepeatMeal(nil, meals); m != nil {
		t.Error("no scan foods → nil")
	}
}

func TestBuildUserContext(t *testing.T) {
	in := UserContextInput{
		Cuisines:      []string{"south_asian"},
		FrequentFoods: []CountedItem{{"chicken biryani", 9}, {"dal", 5}, {"roti", 4}, {"once-off", 1}},
		IdentityFixes: []AffinityItem{
			{"chicken curry", "butter chicken", 6},
			{"soup", "dal", 2}, // <3 observations → omitted
		},
		PortionFactors:   []CalibrationFactor{{FoodName: "rice", Multiplier: 1.3, SampleCount: 5}, {FoodName: "dal", Multiplier: 1.0, SampleCount: 9}},
		TypicalBreakfast: "09:00",
		TypicalDinner:    "21:00",
	}
	block := BuildUserContext(in)

	// Well-formed: header + expected lines.
	if !strings.HasPrefix(block, "This user's history:") {
		t.Fatalf("missing header: %q", block)
	}
	for _, want := range []string{
		"- Cuisines: south_asian",
		"- Frequently logged: chicken biryani, dal, roti",
		`"chicken curry" → "butter chicken" (x6)`,
		"- Portion tendency: rice ~1.3x typical",
		"- Typical meal times: breakfast 09:00, dinner 21:00",
	} {
		if !strings.Contains(block, want) {
			t.Errorf("missing %q in:\n%s", want, block)
		}
	}
	// Omissions: <3-observation signals and 1.0 multipliers never appear.
	if strings.Contains(block, "once-off") || strings.Contains(block, `"soup"`) || strings.Contains(block, "dal ~1.0x") {
		t.Errorf("low-observation/no-op signals leaked:\n%s", block)
	}
	// Bounded: ≤ ~400 tokens (1600 chars).
	if len(block) > 1600 {
		t.Errorf("context block exceeds cap: %d chars", len(block))
	}
	// Nothing learned → empty string (no header-only block).
	if got := BuildUserContext(UserContextInput{}); got != "" {
		t.Errorf("empty input should yield empty block, got %q", got)
	}
}
