package scan

import (
	"fmt"
	"sort"
	"strings"
)

// Phase 13 E — the learning layer's pure logic. Six signals:
//  1. portion EWMA per (food, meal_type)  → PickCalibrationFactor
//  2. identity corrections                → ClassifyCorrection + affinity upsert
//  3. confidence calibration              → BandForScore, UpdateBandMean, MiscalibrationWarnings
//  4. time-of-day portions                → HourBucket
//  5. repeat-meal detection on scans      → MatchRepeatMeal
//  6. discard learning                    → correction_type='discard' + report aggregates
// All pure; the PG wiring lives in pg.go / learning_pg.go.

// Correction types.
const (
	CorrectionPortion  = "portion"
	CorrectionIdentity = "identity"
	CorrectionMacro    = "macro"
	CorrectionDiscard  = "discard"
)

// ClassifyCorrection derives the correction type when the client didn't send
// one: a changed name is an IDENTITY error (misidentification — must NOT move
// the portion multiplier); a changed weight is a PORTION error; otherwise macro.
func ClassifyCorrection(c Correction) string {
	if c.CorrectionType != "" {
		return c.CorrectionType
	}
	if c.FoodNameCorrected != "" && !strings.EqualFold(c.FoodNameOriginal, c.FoodNameCorrected) {
		return CorrectionIdentity
	}
	if c.WeightOriginalG > 0 && c.WeightCorrectedG > 0 && c.WeightOriginalG != c.WeightCorrectedG {
		return CorrectionPortion
	}
	return CorrectionMacro
}

// minMealSamples: a meal-scoped calibration row needs this many samples before
// it outranks the food-level factor.
const minMealSamples = 3

// PickCalibrationFactor implements the fallback: use the meal-scoped factor when
// it has ≥3 samples, else the food-level factor, else nil.
func PickCalibrationFactor(foodLevel, mealLevel *CalibrationFactor) *CalibrationFactor {
	if mealLevel != nil && mealLevel.SampleCount >= minMealSamples {
		return mealLevel
	}
	return foodLevel
}

// HourBucket maps a local hour (0–23) onto the time-of-day buckets used for
// portion learning. Out-of-range hours land in "late" (defensive).
func HourBucket(hour int) string {
	switch {
	case hour >= 5 && hour < 11:
		return "morning"
	case hour >= 11 && hour < 16:
		return "midday"
	case hour >= 16 && hour < 22:
		return "evening"
	default:
		return "late"
	}
}

// --- Signal 3: confidence calibration ---------------------------------------

// BandForScore maps an overall confidence score onto its predicted band,
// mirroring the pipeline's High ≥55 / Medium ≥35 thresholds.
func BandForScore(score int) string {
	switch {
	case score >= 55:
		return "high"
	case score >= 35:
		return "medium"
	default:
		return "low"
	}
}

// UpdateBandMean folds one correction magnitude into a band's running mean.
func UpdateBandMean(oldMean float64, oldCount int, magnitude float64) (newMean float64, newCount int) {
	newCount = oldCount + 1
	newMean = (oldMean*float64(oldCount) + magnitude) / float64(newCount)
	return newMean, newCount
}

// BandStat is one confidence_calibration row.
type BandStat struct {
	Band        string   `json:"predicted_band"`
	SampleCount int      `json:"sample_count"`
	MeanMag     *float64 `json:"mean_correction_magnitude"`
}

// MiscalibrationWarnings: scoring is miscalibrated when a band predicted MORE
// confident shows a HIGHER mean correction magnitude than a less-confident band.
func MiscalibrationWarnings(bands []BandStat) []string {
	byBand := map[string]BandStat{}
	for _, b := range bands {
		byBand[b.Band] = b
	}
	var warnings []string
	order := []string{"high", "medium", "low"} // most → least confident
	for i := 0; i < len(order)-1; i++ {
		upper, okU := byBand[order[i]]
		lower, okL := byBand[order[i+1]]
		if !okU || !okL || upper.MeanMag == nil || lower.MeanMag == nil {
			continue
		}
		if upper.SampleCount >= minMealSamples && lower.SampleCount >= minMealSamples && *upper.MeanMag > *lower.MeanMag {
			warnings = append(warnings, fmt.Sprintf(
				"band %q is corrected more (%.2f) than band %q (%.2f) — confidence scoring is miscalibrated",
				order[i], *upper.MeanMag, order[i+1], *lower.MeanMag))
		}
	}
	return warnings
}

// --- Signal 5: repeat-meal detection -----------------------------------------

// SavedMealLite is the minimal saved-meal view for matching.
type SavedMealLite struct {
	Name    string
	Foods   []string  // item food names
	Weights []float64 // typical weight per item (g), same order
}

// MatchedMeal is returned on the scan outcome when the identified foods look
// like a meal the user already saves/logs, enabling one-tap accept.
type MatchedMeal struct {
	Name           string             `json:"name"`
	TypicalWeights map[string]float64 `json:"typical_weights"`
}

// MatchRepeatMeal reports the first saved meal whose items cover ≥2 of the
// scan's identified foods (case-insensitive substring either way) — the scan
// "looks like your usual X". Single-food meals need an exact-ish match.
func MatchRepeatMeal(scanFoods []string, meals []SavedMealLite) *MatchedMeal {
	if len(scanFoods) == 0 {
		return nil
	}
	for _, m := range meals {
		matched := map[string]float64{}
		for i, mf := range m.Foods {
			for _, sf := range scanFoods {
				if containsEitherFold(mf, sf) {
					w := 0.0
					if i < len(m.Weights) {
						w = m.Weights[i]
					}
					matched[mf] = w
					break
				}
			}
		}
		need := 2
		if len(m.Foods) == 1 {
			need = 1
		}
		if len(matched) >= need {
			return &MatchedMeal{Name: m.Name, TypicalWeights: matched}
		}
	}
	return nil
}

func containsEitherFold(a, b string) bool {
	la, lb := strings.ToLower(strings.TrimSpace(a)), strings.ToLower(strings.TrimSpace(b))
	if la == "" || lb == "" {
		return false
	}
	return strings.Contains(la, lb) || strings.Contains(lb, la)
}

// --- E3: per-user prompt context ---------------------------------------------

// UserContextInput is everything the context builder may draw on. Every slice is
// pre-aggregated (name + observation count) so the builder stays pure.
type UserContextInput struct {
	Cuisines         []string
	FrequentFoods    []CountedItem // logged foods, most frequent first
	IdentityFixes    []AffinityItem
	PortionFactors   []CalibrationFactor // learned multipliers (sample_count = observations)
	TypicalBreakfast string              // "09:00" — empty when unknown
	TypicalDinner    string
}

// CountedItem is a name with how often it was observed.
type CountedItem struct {
	Name  string
	Count int
}

// AffinityItem is one learned identity correction.
type AffinityItem struct {
	AISuggested string
	UserChose   string
	Occurrences int
}

// minObservations: anything seen fewer times than this is noise, not signal.
const minObservations = 3

// maxContextChars ≈ 400 tokens (~4 chars/token) — the hard cap on the block.
const maxContextChars = 1600

// BuildUserContext assembles the compact per-user context block prepended to
// the Gemini identification prompt. Deterministic, bounded, and omits any
// signal with fewer than 3 observations. Empty string when nothing qualifies.
func BuildUserContext(in UserContextInput) string {
	var lines []string

	if len(in.Cuisines) > 0 {
		lines = append(lines, "- Cuisines: "+strings.Join(in.Cuisines, ", "))
	}

	var freq []string
	for _, f := range in.FrequentFoods {
		if f.Count >= minObservations {
			freq = append(freq, f.Name)
		}
		if len(freq) == 5 {
			break
		}
	}
	if len(freq) > 0 {
		lines = append(lines, "- Frequently logged: "+strings.Join(freq, ", "))
	}

	fixes := append([]AffinityItem{}, in.IdentityFixes...)
	sort.SliceStable(fixes, func(i, j int) bool { return fixes[i].Occurrences > fixes[j].Occurrences })
	count := 0
	for _, fx := range fixes {
		if fx.Occurrences < minObservations || count == 3 {
			continue
		}
		lines = append(lines, fmt.Sprintf("- Past identity corrections: %q → %q (x%d)", fx.AISuggested, fx.UserChose, fx.Occurrences))
		count++
	}

	for i, p := range in.PortionFactors {
		if i == 3 {
			break
		}
		if p.SampleCount < minObservations || p.Multiplier == 1 {
			continue
		}
		lines = append(lines, fmt.Sprintf("- Portion tendency: %s ~%.1fx typical", p.FoodName, p.Multiplier))
	}

	if in.TypicalBreakfast != "" && in.TypicalDinner != "" {
		lines = append(lines, fmt.Sprintf("- Typical meal times: breakfast %s, dinner %s", in.TypicalBreakfast, in.TypicalDinner))
	}

	if len(lines) == 0 {
		return ""
	}
	block := "This user's history:\n" + strings.Join(lines, "\n")
	if len(block) > maxContextChars {
		block = block[:maxContextChars]
	}
	return block
}
