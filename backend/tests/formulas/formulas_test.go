package formulastests

import (
	"math"
	"testing"

	"lumo/backend/internal/energy"
)

func within(t *testing.T, name string, got, want, tol float64) {
	t.Helper()
	if math.Abs(got-want) > tol {
		t.Errorf("%s = %.3f, want %.3f ± %.1f", name, got, want, tol)
	}
}

func treadmill(dur, speed, incline, mass float64, known, defaults bool) energy.CalorieResult {
	return energy.ComputeCalories(energy.CalorieInput{
		Formula:         "acsm_treadmill",
		Params:          map[string]any{"duration_minutes": dur, "speed_kmh": speed, "incline_percent": incline},
		BodyMassKg:      mass,
		BodyweightKnown: known,
		DefaultsUsed:    defaults,
	})
}

// ---------------------------------------------------------------------------
// Worked examples (ground truth from the plan) — assert within ±2 kcal.
// ---------------------------------------------------------------------------

func TestTreadmillRunningIncline(t *testing.T) {
	r := treadmill(30, 8, 5, 70, true, false)
	within(t, "kcal", r.Calories, 380, 2)
	within(t, "MET", r.ComputedMET, 10.33, 0.05)
	if r.Confidence != "high" {
		t.Errorf("confidence = %q, want high", r.Confidence)
	}
}

func TestTreadmillFlat(t *testing.T) {
	r := treadmill(30, 8, 0, 70, true, false)
	within(t, "kcal", r.Calories, 317, 2)
	within(t, "MET", r.ComputedMET, 8.62, 0.05)
}

func TestCyclingWatts(t *testing.T) {
	r := energy.ComputeCalories(energy.CalorieInput{
		Formula:         "acsm_cycling",
		Params:          map[string]any{"duration_minutes": 45.0, "watts": 150.0},
		BodyMassKg:      70,
		BodyweightKnown: true,
	})
	within(t, "kcal", r.Calories, 475, 2)
	within(t, "MET", r.ComputedMET, 8.61, 0.05)
}

func TestRowingWattsFromSplit(t *testing.T) {
	within(t, "watts@2:00", energy.WattsFromSplit(120), 202.5, 1)
	within(t, "watts@0", energy.WattsFromSplit(0), 0, 0.001)
}

// ---------------------------------------------------------------------------
// Boundaries + confidence
// ---------------------------------------------------------------------------

func TestWalkRunThreshold(t *testing.T) {
	// 6.9 (walk eq.) vs 7.1 (run eq.) must select DIFFERENT equations → the MET
	// jumps discontinuously at 7.0 km/h (walking uses 0.1·S, running 0.2·S).
	walk := treadmill(30, 6.9, 5, 70, true, false)
	run := treadmill(30, 7.1, 5, 70, true, false)
	if walk.ComputedMET == run.ComputedMET {
		t.Fatalf("walk and run METs equal (%.2f) — threshold not applied", walk.ComputedMET)
	}
	// Just under vs just over the threshold the running equation (higher speed
	// coefficient) yields the larger MET.
	if run.ComputedMET <= walk.ComputedMET {
		t.Errorf("run MET %.2f should exceed walk MET %.2f just past the threshold", run.ComputedMET, walk.ComputedMET)
	}
}

func TestInclineBounds(t *testing.T) {
	for _, incline := range []float64{0, 15} {
		r := treadmill(30, 8, incline, 70, true, false)
		if r.Calories <= 0 || math.IsNaN(r.Calories) {
			t.Errorf("incline %v gave invalid kcal %v", incline, r.Calories)
		}
	}
}

func TestDefaultsDowngradeToMedium(t *testing.T) {
	r := treadmill(30, 8, 5, 70, true, true) // a default was used
	if r.Confidence != "medium" {
		t.Errorf("confidence = %q, want medium (default used)", r.Confidence)
	}
}

func TestUnknownBodyweightDowngrades(t *testing.T) {
	r := treadmill(30, 8, 5, 70, false, false) // bodyweight unknown → 70 default
	if r.Confidence != "medium" {
		t.Errorf("confidence = %q, want medium (bodyweight unknown)", r.Confidence)
	}
}

func TestMetFallbackIsLow(t *testing.T) {
	r := energy.ComputeCalories(energy.CalorieInput{
		Formula:         "met_fallback",
		Params:          map[string]any{"duration_minutes": 30.0},
		MetValue:        8.0,
		BodyMassKg:      70,
		BodyweightKnown: true,
	})
	if r.Confidence != "low" {
		t.Errorf("met_fallback confidence = %q, want low", r.Confidence)
	}
	// 8 MET, 70 kg, 30 min → 8*3.5*70/200*30 = 294.
	within(t, "kcal", r.Calories, 294, 1)
}

func TestMetFallbackIntensityScaling(t *testing.T) {
	base := map[string]any{"duration_minutes": 30.0, "intensity": "moderate"}
	vig := map[string]any{"duration_minutes": 30.0, "intensity": "vigorous"}
	rb := energy.ComputeCalories(energy.CalorieInput{Formula: "met_fallback", Params: base, MetValue: 8, BodyMassKg: 70, BodyweightKnown: true})
	rv := energy.ComputeCalories(energy.CalorieInput{Formula: "met_fallback", Params: vig, MetValue: 8, BodyMassKg: 70, BodyweightKnown: true})
	within(t, "vigorous/moderate ratio", rv.Calories/rb.Calories, 1.25, 0.02)
}

func TestCyclingResistanceEstimateIsMedium(t *testing.T) {
	r := energy.ComputeCalories(energy.CalorieInput{
		Formula:         "acsm_cycling",
		Params:          map[string]any{"duration_minutes": 30.0, "resistance_level": 8.0, "cadence_rpm": 80.0},
		BodyMassKg:      70,
		BodyweightKnown: true,
	})
	if r.Confidence != "medium" {
		t.Errorf("estimated-watts confidence = %q, want medium", r.Confidence)
	}
}

// ---------------------------------------------------------------------------
// No NaN / Inf escapes, ever.
// ---------------------------------------------------------------------------

func TestNoNaNOrInf(t *testing.T) {
	cases := []energy.CalorieInput{
		{Formula: "acsm_treadmill", Params: map[string]any{"duration_minutes": 0.0, "speed_kmh": 0.0}, BodyMassKg: 0},
		{Formula: "acsm_cycling", Params: map[string]any{"duration_minutes": -5.0}, BodyMassKg: -1},
		{Formula: "rowing_power", Params: map[string]any{"duration_minutes": 30.0, "split_seconds": 0.0}, BodyMassKg: 70},
		{Formula: "acsm_stepping", Params: map[string]any{"duration_minutes": 30.0}, BodyMassKg: 70},
		{Formula: "unknown_formula", Params: map[string]any{}, BodyMassKg: 70},
		{Formula: "", Params: nil, BodyMassKg: 70},
	}
	for i, in := range cases {
		r := energy.ComputeCalories(in)
		if math.IsNaN(r.Calories) || math.IsInf(r.Calories, 0) || r.Calories < 0 {
			t.Errorf("case %d: bad kcal %v", i, r.Calories)
		}
		if math.IsNaN(r.ComputedMET) || math.IsInf(r.ComputedMET, 0) {
			t.Errorf("case %d: bad MET %v", i, r.ComputedMET)
		}
	}
}
