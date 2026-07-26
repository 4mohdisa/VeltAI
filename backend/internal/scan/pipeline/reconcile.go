package pipeline

import (
	"fmt"
	"math"
)

// Multi-angle reconciliation (Phase 13 D3). Each captured angle yields an
// independent geometric weight estimate; agreement between them decides whether
// to merge (weighted mean, top-down weighted highest) or to surface BOTH
// estimates and ask the user — never silently average wild disagreement.

// AngleWeight is one image's independent total-weight estimate.
type AngleWeight struct {
	Angle        string  `json:"angle"` // 'top' | 'side' | 'oblique'
	TotalWeightG float64 `json:"total_weight_g"`
}

// Reconciliation is the outcome of cross-validating per-angle estimates.
type Reconciliation struct {
	Agreement         float64 `json:"agreement"` // 1 - stdev/mean, clamped [0,1]
	Merged            bool    `json:"merged"`
	MergedWeightG     float64 `json:"merged_weight_g"`
	ScaleFactor       float64 `json:"scale_factor"` // merged / top-down estimate
	ConfidenceDelta   int     `json:"confidence_delta"`
	NeedsConfirmation bool    `json:"needs_confirmation"`
	Note              string  `json:"note,omitempty"`
}

// agreementThreshold: below this the angles genuinely disagree.
const agreementThreshold = 0.75

// topWeightFactor: the top-down image is authoritative for footprint, so it
// carries double weight in the merge.
const topWeightFactor = 2.0

// Reconcile cross-validates per-angle weight estimates. Guards: fewer than two
// usable estimates → identity (no delta, merged, factor 1). Non-positive
// estimates are dropped before the math; a zero mean can then never divide.
func Reconcile(weights []AngleWeight) Reconciliation {
	usable := make([]AngleWeight, 0, len(weights))
	for _, w := range weights {
		if w.TotalWeightG > 0 && !math.IsNaN(w.TotalWeightG) && !math.IsInf(w.TotalWeightG, 0) {
			usable = append(usable, w)
		}
	}
	if len(usable) < 2 {
		return Reconciliation{Agreement: 1, Merged: true, ScaleFactor: 1, MergedWeightG: firstWeight(usable)}
	}

	mean := 0.0
	for _, w := range usable {
		mean += w.TotalWeightG
	}
	mean /= float64(len(usable))

	variance := 0.0
	for _, w := range usable {
		d := w.TotalWeightG - mean
		variance += d * d
	}
	stdev := math.Sqrt(variance / float64(len(usable)))
	agreement := 1 - stdev/mean
	if agreement < 0 {
		agreement = 0
	}
	if agreement > 1 {
		agreement = 1
	}

	top := topWeight(usable)
	if agreement >= agreementThreshold {
		// Weighted mean, top-down counted double.
		sum, wsum := 0.0, 0.0
		for _, w := range usable {
			f := 1.0
			if w.Angle == "top" {
				f = topWeightFactor
			}
			sum += w.TotalWeightG * f
			wsum += f
		}
		merged := sum / wsum
		scale := 1.0
		if top > 0 {
			scale = merged / top
		}
		return Reconciliation{
			Agreement:       round2(agreement),
			Merged:          true,
			MergedWeightG:   round2(merged),
			ScaleFactor:     scale,
			ConfidenceDelta: +15,
			Note:            fmt.Sprintf("%d angles agree (%.0f%%) — estimates merged", len(usable), agreement*100),
		}
	}

	// Disagreement: keep the top-down as primary, surface the spread, ask.
	return Reconciliation{
		Agreement:         round2(agreement),
		Merged:            false,
		MergedWeightG:     round2(top),
		ScaleFactor:       1,
		ConfidenceDelta:   -20,
		NeedsConfirmation: true,
		Note: fmt.Sprintf(
			"Your angles disagree (%.0f%% agreement): estimates range %.0f–%.0f g. Please confirm which looks right.",
			agreement*100, minWeight(usable), maxWeight(usable)),
	}
}

// GeometryTotalWeightG sums a geometry pass's per-region weight estimates —
// each image's independent, Gemini-free view of how much food is on the plate.
func GeometryTotalWeightG(geo GeometryResult) float64 {
	total := 0.0
	for _, r := range geo.Regions {
		total += r.EstimatedWeightG
	}
	return total
}

func firstWeight(ws []AngleWeight) float64 {
	if len(ws) == 0 {
		return 0
	}
	return ws[0].TotalWeightG
}

// topWeight prefers the 'top' angle's estimate; falls back to the first.
func topWeight(ws []AngleWeight) float64 {
	for _, w := range ws {
		if w.Angle == "top" {
			return w.TotalWeightG
		}
	}
	return firstWeight(ws)
}

func minWeight(ws []AngleWeight) float64 {
	m := math.Inf(1)
	for _, w := range ws {
		m = math.Min(m, w.TotalWeightG)
	}
	return m
}

func maxWeight(ws []AngleWeight) float64 {
	m := math.Inf(-1)
	for _, w := range ws {
		m = math.Max(m, w.TotalWeightG)
	}
	return m
}

func round2(f float64) float64 { return math.Round(f*100) / 100 }
