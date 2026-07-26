package energy

import (
	"encoding/json"
	"fmt"
	"math"
)

// ---------------------------------------------------------------------------
// Calorie formulas — published ACSM metabolic equations, dispatched by name.
//
// Every equation yields VO2 in mL/kg/min, converted to MET and kcal:
//
//	MET      = VO2 / 3.5
//	kcal/min = MET * 3.5 * bodyMassKg / 200
//	kcal     = kcal/min * durationMinutes
//
// All pure — no DB, no time. Guarded against NaN/Inf, negatives, div-by-zero.
// ---------------------------------------------------------------------------

// CalorieResult is the transparent output of a computation: the number plus its
// full working so the app can show "how this was calculated".
type CalorieResult struct {
	Calories    float64        `json:"calories"`
	ComputedMET float64        `json:"computed_met"`
	Formula     string         `json:"formula"`
	Inputs      map[string]any `json:"inputs"`
	Confidence  string         `json:"confidence"` // "high" | "medium" | "low"
	Explanation string         `json:"explanation"`
}

// CalorieInput drives ComputeCalories. Params holds the validated field values
// (JSON numbers arrive as float64). MetValue backs met_fallback. DefaultsUsed
// (an optional field fell back to its schema default) and BodyweightKnown drive
// the confidence downgrade.
type CalorieInput struct {
	Formula         string
	Params          map[string]any
	MetValue        float64
	BodyMassKg      float64
	BodyweightKnown bool
	DefaultsUsed    bool
}

const (
	confHigh   = "high"
	confMedium = "medium"
	confLow    = "low"

	restingVO2 = 3.5 // mL/kg/min, 1 MET
	maxMET     = 30.0
)

// KcalFromMET converts a MET value to kilocalories over a duration.
func KcalFromMET(met, bodyMassKg, minutes float64) float64 {
	return met * 3.5 * bodyMassKg / 200.0 * minutes
}

// ComputeCalories dispatches to the named formula and returns the full result.
// An unknown/empty formula falls back to met_fallback.
func ComputeCalories(in CalorieInput) CalorieResult {
	mass := in.BodyMassKg
	if mass <= 0 || math.IsNaN(mass) || math.IsInf(mass, 0) {
		mass = 70
	}
	dur := clampNonNeg(pnum(in.Params, "duration_minutes"))

	var (
		vo2          float64
		estimateUsed bool
		met          float64
		formula      = in.Formula
		explanation  string
	)

	switch in.Formula {
	case "acsm_treadmill":
		vo2 = vo2Treadmill(in.Params)
		met = vo2 / restingVO2
		explanation = explainTreadmill(in.Params, mass)
	case "acsm_cycling":
		vo2, estimateUsed = vo2Cycling(in.Params, mass)
		met = vo2 / restingVO2
		explanation = explainCycling(in.Params, mass, estimateUsed)
	case "rowing_power":
		vo2 = vo2Rowing(in.Params, mass)
		met = vo2 / restingVO2
		explanation = explainRowing(in.Params, mass)
	case "acsm_stepping":
		vo2 = vo2Stepping(in.Params)
		met = vo2 / restingVO2
		explanation = explainStepping(in.Params, mass)
	default: // "met_fallback", "", or anything unrecognized
		formula = "met_fallback"
		met = metFallback(in.Params, in.MetValue)
		explanation = explainFallback(in.Params, met, mass)
	}

	met = clamp(met, 0, maxMET)
	kcal := math.Round(clampNonNeg(KcalFromMET(met, mass, dur)))

	return CalorieResult{
		Calories:    kcal,
		ComputedMET: math.Round(met*100) / 100,
		Formula:     formula,
		Inputs:      in.Params,
		Confidence:  confidence(formula, estimateUsed, in.DefaultsUsed, in.BodyweightKnown),
		Explanation: explanation,
	}
}

// confidence: met_fallback is always "low"; otherwise "high" unless an estimate,
// a default, or an unknown bodyweight was involved, which downgrade to "medium".
func confidence(formula string, estimateUsed, defaultsUsed, bodyweightKnown bool) string {
	if formula == "met_fallback" {
		return confLow
	}
	if estimateUsed || defaultsUsed || !bodyweightKnown {
		return confMedium
	}
	return confHigh
}

// ---------------------------------------------------------------------------
// VO2 equations
// ---------------------------------------------------------------------------

func vo2Treadmill(p map[string]any) float64 {
	speed := pnum(p, "speed_kmh") // km/h
	incline := pnum(p, "incline_percent")
	s := speed * 16.667 // m/min
	g := incline / 100.0
	if speed < 7.0 {
		return 0.1*s + 1.8*s*g + restingVO2 // walking
	}
	return 0.2*s + 0.9*s*g + restingVO2 // running
}

func vo2Cycling(p map[string]any, mass float64) (vo2 float64, estimate bool) {
	watts := pnum(p, "watts")
	if watts <= 0 {
		res := pnum(p, "resistance_level")
		cad := pnum(p, "cadence_rpm")
		if res > 0 && cad > 0 {
			watts = res * cad * 0.35 // rough ergometer estimate
			estimate = true
		} else {
			return restingVO2 * 2, false // ~2 MET floor when nothing usable
		}
	}
	return (10.8 * watts / mass) + 7, estimate
}

// WattsFromSplit derives ergometer power (W) from a 500 m split in seconds
// (Concept2 relation). 0 for a non-positive split.
func WattsFromSplit(splitSeconds float64) float64 {
	if splitSeconds <= 0 {
		return 0
	}
	x := splitSeconds / 500.0
	return 2.80 / (x * x * x)
}

func vo2Rowing(p map[string]any, mass float64) float64 {
	watts := WattsFromSplit(pnum(p, "split_seconds"))
	if watts <= 0 {
		return restingVO2 * 2
	}
	return (10.8 * watts / mass) + 7
}

func vo2Stepping(p map[string]any) float64 {
	f := pnum(p, "steps_per_minute")
	h := pnum(p, "step_height_m")
	if h <= 0 {
		h = 0.20 // default step height (metres)
	}
	return 0.2*f + 1.33*1.8*h*f + restingVO2
}

// metFallback scales the exercise's flat MET by an optional intensity selector.
func metFallback(p map[string]any, metValue float64) float64 {
	if metValue <= 0 {
		metValue = 5.0
	}
	scale := 1.0
	switch pstr(p, "intensity") {
	case "light":
		scale = 0.8
	case "vigorous":
		scale = 1.25
	}
	return metValue * scale
}

// ---------------------------------------------------------------------------
// Explanations
// ---------------------------------------------------------------------------

func explainTreadmill(p map[string]any, mass float64) string {
	speed := pnum(p, "speed_kmh")
	kind := "walking"
	if speed >= 7.0 {
		kind = "running"
	}
	return fmt.Sprintf("ACSM %s equation · %s km/h at %s%% incline · %s kg",
		kind, trim(speed), trim(pnum(p, "incline_percent")), trim(mass))
}

func explainCycling(p map[string]any, mass float64, estimate bool) string {
	if estimate {
		return fmt.Sprintf("ACSM cycling equation · power estimated from resistance × cadence · %s kg", trim(mass))
	}
	return fmt.Sprintf("ACSM cycling equation · %s W · %s kg", trim(pnum(p, "watts")), trim(mass))
}

func explainRowing(p map[string]any, mass float64) string {
	return fmt.Sprintf("Rowing power from split · %s W at a %ss/500m split · %s kg",
		trim(math.Round(WattsFromSplit(pnum(p, "split_seconds")))), trim(pnum(p, "split_seconds")), trim(mass))
}

func explainStepping(p map[string]any, mass float64) string {
	return fmt.Sprintf("ACSM stepping equation · %s steps/min · %s kg", trim(pnum(p, "steps_per_minute")), trim(mass))
}

func explainFallback(p map[string]any, met, mass float64) string {
	intensity := pstr(p, "intensity")
	if intensity == "" {
		intensity = "moderate"
	}
	return fmt.Sprintf("MET estimate (%s) · %s MET · %s kg", intensity, trim(math.Round(met*10)/10), trim(mass))
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// pnum reads a JSON number from a param map (0 when absent/wrong type).
func pnum(p map[string]any, key string) float64 {
	v, ok := p[key]
	if !ok || v == nil {
		return 0
	}
	switch n := v.(type) {
	case float64:
		return n
	case float32:
		return float64(n)
	case int:
		return float64(n)
	case int64:
		return float64(n)
	case json.Number:
		f, err := n.Float64()
		if err != nil {
			return 0
		}
		return f
	}
	return 0
}

func pstr(p map[string]any, key string) string {
	if s, ok := p[key].(string); ok {
		return s
	}
	return ""
}

func clampNonNeg(f float64) float64 {
	if math.IsNaN(f) || math.IsInf(f, 0) || f < 0 {
		return 0
	}
	return f
}

func clamp(f, lo, hi float64) float64 {
	if math.IsNaN(f) || math.IsInf(f, 0) {
		return lo
	}
	return math.Max(lo, math.Min(hi, f))
}

// trim renders a float without trailing zeros for explanation strings.
func trim(f float64) string {
	return fmt.Sprintf("%g", math.Round(f*100)/100)
}
