// In-package test: updateCalibration and clamp are unexported (pure EWMA
// mechanics, not part of the package's public surface), so they can only be
// unit tested from here.
package scan

import (
	"math"
	"testing"
	"time"
)

func TestUpdateCalibrationFirstCorrection(t *testing.T) {
	now := time.Now()
	// No existing row: caller passes factor=1.0, count=0, lastUpdated=now.
	factor, count := updateCalibration(1.0, 0, now, 100, 150, now)
	want := ewmaAlpha*1.5 + (1-ewmaAlpha)*1.0
	if math.Abs(factor-want) > 1e-9 {
		t.Fatalf("factor = %v, want %v", factor, want)
	}
	if count != 1 {
		t.Fatalf("sampleCount = %d, want 1", count)
	}
}

func TestUpdateCalibrationSecondCorrectionOneWeekLater(t *testing.T) {
	t0 := time.Now()
	factor1, count1 := updateCalibration(1.0, 0, t0, 100, 150, t0) // ratio 1.5
	t1 := t0.Add(7 * 24 * time.Hour)
	factor2, count2 := updateCalibration(factor1, count1, t0, 100, 140, t1) // ratio 1.4, 1 week later

	decayed := 1.0 + (factor1-1.0)*math.Pow(decayFactorPerWeek, 1.0)
	want := ewmaAlpha*1.4 + (1-ewmaAlpha)*decayed
	if math.Abs(factor2-want) > 1e-9 {
		t.Fatalf("factor2 = %v, want %v", factor2, want)
	}
	if count2 != 2 {
		t.Fatalf("count2 = %d, want 2", count2)
	}
}

func TestUpdateCalibrationDecay(t *testing.T) {
	existingFactor := 2.0
	now := time.Now()
	last := now.Add(-4 * 7 * 24 * time.Hour) // 4 weeks ago
	// weightCorrected/weightOriginal == existingFactor, so if the result
	// lands closer to 1.0 than existingFactor, that pull can only have come
	// from decay (the new sample alone would reproduce existingFactor).
	factor, count := updateCalibration(existingFactor, 3, last, 100, 200, now)
	if math.Abs(factor-1.0) >= math.Abs(existingFactor-1.0) {
		t.Fatalf("expected decay to pull factor (%v) closer to 1.0 than existingFactor (%v)", factor, existingFactor)
	}
	if count != 4 {
		t.Fatalf("sampleCount = %d, want 4", count)
	}
}

func TestUpdateCalibrationClampsHigh(t *testing.T) {
	now := time.Now()
	// raw blend: 0.3*10 + 0.7*2.5 = 4.75, well above maxMultiplier.
	factor, _ := updateCalibration(2.5, 10, now, 100, 1000, now)
	if factor != maxMultiplier {
		t.Fatalf("factor = %v, want exactly %v (clamped)", factor, maxMultiplier)
	}
}

func TestUpdateCalibrationClampsLow(t *testing.T) {
	now := time.Now()
	// raw blend: 0.3*0.01 + 0.7*0.4 = 0.283, below minMultiplier.
	factor, _ := updateCalibration(0.4, 10, now, 100, 1, now)
	if factor != minMultiplier {
		t.Fatalf("factor = %v, want exactly %v (clamped)", factor, minMultiplier)
	}
}

func TestClamp(t *testing.T) {
	if clamp(1.5, 0, 1) != 1 {
		t.Fatal("clamp did not cap high value")
	}
	if clamp(-0.5, 0, 1) != 0 {
		t.Fatal("clamp did not floor low value")
	}
	if clamp(0.5, 0, 1) != 0.5 {
		t.Fatal("clamp changed an in-range value")
	}
}
