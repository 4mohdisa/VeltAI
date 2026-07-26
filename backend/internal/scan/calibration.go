package scan

import (
	"math"
	"time"
)

// EWMA calibration tuning. alpha weights how much a single new correction
// moves the estimate; decayFactorPerWeek pulls a stale factor back toward
// 1.0 (no correction) the longer it's been since the last one; min/max
// bound how far a food's estimate can drift from the scanner's raw guess.
const (
	ewmaAlpha          = 0.3
	decayFactorPerWeek = 0.95
	maxMultiplier      = 2.5
	minMultiplier      = 0.4
)

// updateCalibration blends a new scan correction into a food's running
// weight-multiplier estimate.
//
// Precondition: weightOriginal must be > 0 (correctionRatio divides by it).
// Callers must skip invoking this when weightOriginal <= 0 — that is not
// this function's problem to guard.
//
// For a food with no existing calibration row, callers pass
// existingFactor=1.0, existingSampleCount=0, lastUpdated=now so weeksSince
// is 0 and decayedFactor comes out to exactly 1.0 — no special-casing
// needed here.
func updateCalibration(existingFactor float64, existingSampleCount int, lastUpdated time.Time, weightOriginal, weightCorrected float64, now time.Time) (newFactor float64, newSampleCount int) {
	correctionRatio := weightCorrected / weightOriginal
	weeksSince := now.Sub(lastUpdated).Hours() / 168.0
	decayedFactor := 1.0 + (existingFactor-1.0)*math.Pow(decayFactorPerWeek, weeksSince)
	newFactor = clamp(ewmaAlpha*correctionRatio+(1-ewmaAlpha)*decayedFactor, minMultiplier, maxMultiplier)
	newSampleCount = existingSampleCount + 1
	return newFactor, newSampleCount
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
