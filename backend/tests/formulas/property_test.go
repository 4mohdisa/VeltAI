package formulastests

import (
	"math"
	"testing"

	"lume/backend/internal/energy"
)

// ---------------------------------------------------------------------------
// Property-based sweeps over ComputeCalories. Deterministic nested ranges,
// no randomness. Reuses the treadmill() helper from formulas_test.go.
// ---------------------------------------------------------------------------

var propFormulas = []string{
	"acsm_treadmill", "acsm_cycling", "rowing_power", "acsm_stepping",
	"met_fallback", "", "unknown_formula",
}

// propInput sets every numeric param to v so one sweep exercises each
// formula's own fields, however absurd v is.
func propInput(formula string, v, dur, mass, met float64) energy.CalorieInput {
	return energy.CalorieInput{
		Formula: formula,
		Params: map[string]any{
			"duration_minutes": dur,
			"speed_kmh":        v,
			"incline_percent":  v,
			"watts":            v,
			"resistance_level": v,
			"cadence_rpm":      v,
			"split_seconds":    v,
			"steps_per_minute": v,
			"step_height_m":    v,
		},
		MetValue:   met,
		BodyMassKg: mass,
	}
}

func assertFinite(t *testing.T, r energy.CalorieResult, format string, args ...any) {
	t.Helper()
	if math.IsNaN(r.Calories) || math.IsInf(r.Calories, 0) || r.Calories < 0 {
		t.Fatalf(format+": bad kcal %v", append(args, r.Calories)...)
	}
	if math.IsNaN(r.ComputedMET) || math.IsInf(r.ComputedMET, 0) || r.ComputedMET < 0 {
		t.Fatalf(format+": bad MET %v", append(args, r.ComputedMET)...)
	}
}

// Property 1: output is never NaN, Inf, or negative — any formula, any input.
func TestPropNeverNaNInfNegative(t *testing.T) {
	absurd := []float64{math.NaN(), math.Inf(1), math.Inf(-1), -1e12, -1, 0, 1e-9, 1e12}
	durs := []float64{math.NaN(), math.Inf(1), -10, 0, 30, 1e9}
	masses := []float64{math.NaN(), math.Inf(1), -10, 0, 0.001, 70, 200}
	for _, f := range propFormulas {
		for _, v := range absurd {
			for _, dur := range durs {
				for _, mass := range masses {
					r := energy.ComputeCalories(propInput(f, v, dur, mass, v))
					assertFinite(t, r, "formula=%s v=%v dur=%v mass=%v", f, v, dur, mass)
				}
			}
		}
	}
	// Dense treadmill grid: speeds 0..30 step 0.5, inclines 0..15,
	// durations 0..300, masses -10..200.
	for speed := 0.0; speed <= 30; speed += 0.5 {
		for incline := 0.0; incline <= 15; incline++ {
			for dur := 0.0; dur <= 300; dur += 60 {
				for mass := -10.0; mass <= 200; mass += 70 {
					r := treadmill(dur, speed, incline, mass, true, false)
					assertFinite(t, r, "speed=%v incline=%v dur=%v mass=%v", speed, incline, dur, mass)
				}
			}
		}
	}
}

// Property 2: at equal treadmill speed, more incline never yields fewer kcal.
// Each fixed speed lies in exactly one regime (walk <7, run >=7 km/h), so the
// 7.0 km/h equation switch never enters a comparison — the exemption holds by
// construction.
func TestPropInclineMonotonic(t *testing.T) {
	for speed := 0.0; speed <= 30; speed += 0.5 {
		prev := -1.0
		for incline := 0.0; incline <= 15; incline++ {
			r := treadmill(30, speed, incline, 70, true, false)
			if r.Calories < prev {
				t.Fatalf("speed=%v: incline %v gave %v kcal, less than %v at incline %v",
					speed, incline, r.Calories, prev, incline-1)
			}
			prev = r.Calories
		}
	}
}

// baseCases: one realistic parameter set per formula, shared by the duration
// properties below.
var baseCases = []struct {
	formula string
	params  map[string]any
	met     float64
}{
	{"acsm_treadmill", map[string]any{"speed_kmh": 8.0, "incline_percent": 5.0}, 0},
	{"acsm_cycling", map[string]any{"watts": 150.0}, 0},
	{"acsm_cycling", map[string]any{"resistance_level": 8.0, "cadence_rpm": 80.0}, 0},
	{"rowing_power", map[string]any{"split_seconds": 120.0}, 0},
	{"acsm_stepping", map[string]any{"steps_per_minute": 60.0, "step_height_m": 0.2}, 0},
	{"met_fallback", map[string]any{"intensity": "vigorous"}, 8},
	{"met_fallback", map[string]any{"intensity": "light"}, 8},
	{"", nil, 0}, // unknown → met_fallback defaults
}

func baseInput(i int, dur float64) energy.CalorieInput {
	b := baseCases[i]
	p := map[string]any{"duration_minutes": dur}
	for k, v := range b.params {
		p[k] = v
	}
	return energy.CalorieInput{Formula: b.formula, Params: p, MetValue: b.met, BodyMassKg: 70, BodyweightKnown: true}
}

// Property 3: longer duration never yields fewer calories, all formulas.
func TestPropDurationMonotonic(t *testing.T) {
	for i, b := range baseCases {
		prev := -1.0
		for dur := 0.0; dur <= 300; dur += 15 {
			r := energy.ComputeCalories(baseInput(i, dur))
			if r.Calories < prev {
				t.Fatalf("%s %v: dur %v gave %v kcal, less than %v at dur %v",
					b.formula, b.params, dur, r.Calories, prev, dur-15)
			}
			prev = r.Calories
		}
	}
}

// Property 4: zero duration → zero calories, all formulas.
func TestPropZeroDurationZeroCalories(t *testing.T) {
	for i, b := range baseCases {
		if r := energy.ComputeCalories(baseInput(i, 0)); r.Calories != 0 {
			t.Errorf("%s %v: dur 0 gave %v kcal, want 0", b.formula, b.params, r.Calories)
		}
	}
	// Absurd non-duration params still yield 0 at zero duration.
	for _, f := range propFormulas {
		if r := energy.ComputeCalories(propInput(f, 1e9, 0, 70, 1e9)); r.Calories != 0 {
			t.Errorf("formula=%s: dur 0 with extreme params gave %v kcal, want 0", f, r.Calories)
		}
	}
}

// Property 5: extreme inputs clamp — MET never exceeds 30, so kcal is bounded
// by KcalFromMET(30, mass, minutes) (+0.5 for the final rounding).
func TestPropMETCapBoundsCalories(t *testing.T) {
	extremes := []struct {
		formula string
		params  map[string]any
		met     float64
	}{
		{"acsm_treadmill", map[string]any{"speed_kmh": 1e6, "incline_percent": 1e6}, 0},
		{"acsm_treadmill", map[string]any{"speed_kmh": 30.0, "incline_percent": 15.0}, 0},
		{"acsm_cycling", map[string]any{"watts": 1e9}, 0},
		{"acsm_cycling", map[string]any{"resistance_level": 1e6, "cadence_rpm": 1e6}, 0},
		{"rowing_power", map[string]any{"split_seconds": 0.001}, 0},
		{"acsm_stepping", map[string]any{"steps_per_minute": 1e9, "step_height_m": 10.0}, 0},
		{"met_fallback", map[string]any{"intensity": "vigorous"}, 1e6},
	}
	masses := []float64{-10, 0, 0.5, 70, 200}
	durs := []float64{1, 30, 300}
	for _, e := range extremes {
		for _, mass := range masses {
			eff := mass
			if eff <= 0 {
				eff = 70 // ComputeCalories falls back to 70 kg
			}
			for _, dur := range durs {
				p := map[string]any{"duration_minutes": dur}
				for k, v := range e.params {
					p[k] = v
				}
				r := energy.ComputeCalories(energy.CalorieInput{Formula: e.formula, Params: p, MetValue: e.met, BodyMassKg: mass})
				if r.ComputedMET > 30 {
					t.Errorf("%s %v mass=%v: MET %v exceeds cap 30", e.formula, e.params, mass, r.ComputedMET)
				}
				bound := energy.KcalFromMET(30, eff, dur) + 0.5
				if r.Calories > bound {
					t.Errorf("%s %v mass=%v dur=%v: kcal %v exceeds MET-cap bound %v",
						e.formula, e.params, mass, dur, r.Calories, bound)
				}
			}
		}
	}
}
