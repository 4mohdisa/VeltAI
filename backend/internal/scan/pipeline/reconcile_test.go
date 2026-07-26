package pipeline

import (
	"math"
	"testing"
)

func TestReconcileAgreementMerges(t *testing.T) {
	// Worked example: top 400 g, side 440 g → mean 420, stdev 20,
	// agreement = 1 - 20/420 ≈ 0.952 → merge. Weighted mean (top ×2):
	// (400*2 + 440) / 3 = 413.33.
	rec := Reconcile([]AngleWeight{{Angle: "top", TotalWeightG: 400}, {Angle: "side", TotalWeightG: 440}})
	if !rec.Merged || rec.NeedsConfirmation {
		t.Fatalf("high agreement should merge: %+v", rec)
	}
	if math.Abs(rec.Agreement-0.95) > 0.01 {
		t.Errorf("agreement = %v, want ≈0.95", rec.Agreement)
	}
	if math.Abs(rec.MergedWeightG-413.33) > 0.5 {
		t.Errorf("merged = %v, want ≈413.33 (top weighted double)", rec.MergedWeightG)
	}
	if rec.ConfidenceDelta != 15 {
		t.Errorf("delta = %d, want +15", rec.ConfidenceDelta)
	}
}

func TestReconcileDisagreementSurfacesBoth(t *testing.T) {
	// top 300 g vs side 700 g → mean 500, stdev 200, agreement 0.6 < 0.75 →
	// no silent averaging: keep top as primary, ask the user.
	rec := Reconcile([]AngleWeight{{Angle: "top", TotalWeightG: 300}, {Angle: "side", TotalWeightG: 700}})
	if rec.Merged {
		t.Fatal("wild disagreement must NOT merge")
	}
	if !rec.NeedsConfirmation {
		t.Fatal("disagreement must set needs_confirmation")
	}
	if rec.ConfidenceDelta != -20 {
		t.Errorf("delta = %d, want -20", rec.ConfidenceDelta)
	}
	if rec.MergedWeightG != 300 {
		t.Errorf("primary stays the top-down estimate: %v", rec.MergedWeightG)
	}
	if rec.Note == "" {
		t.Error("disagreement must carry an explanatory note")
	}
}

func TestReconcileThresholdBoundary(t *testing.T) {
	// Exactly at 0.75 merges (>=). stdev/mean = 0.25: weights 300 and 500 →
	// mean 400, stdev 100 → agreement 0.75.
	rec := Reconcile([]AngleWeight{{Angle: "top", TotalWeightG: 300}, {Angle: "side", TotalWeightG: 500}})
	if !rec.Merged {
		t.Fatalf("agreement %.3f at the 0.75 boundary should merge", rec.Agreement)
	}
}

func TestReconcileGuards(t *testing.T) {
	// Single estimate → identity.
	rec := Reconcile([]AngleWeight{{Angle: "top", TotalWeightG: 350}})
	if !rec.Merged || rec.ConfidenceDelta != 0 || rec.ScaleFactor != 1 {
		t.Errorf("single estimate should be identity: %+v", rec)
	}
	// Zero/negative/NaN estimates dropped; none usable → identity, no NaN.
	for _, ws := range [][]AngleWeight{
		{},
		{{Angle: "top", TotalWeightG: 0}},
		{{Angle: "top", TotalWeightG: -5}, {Angle: "side", TotalWeightG: math.NaN()}},
	} {
		rec := Reconcile(ws)
		if math.IsNaN(rec.Agreement) || math.IsNaN(rec.MergedWeightG) || math.IsNaN(rec.ScaleFactor) {
			t.Errorf("NaN escaped Reconcile(%v): %+v", ws, rec)
		}
		if rec.NeedsConfirmation {
			t.Errorf("unusable inputs should not demand confirmation: %+v", rec)
		}
	}
}

func TestReconcileThreeAngles(t *testing.T) {
	rec := Reconcile([]AngleWeight{
		{Angle: "top", TotalWeightG: 400},
		{Angle: "side", TotalWeightG: 420},
		{Angle: "oblique", TotalWeightG: 380},
	})
	if !rec.Merged {
		t.Fatalf("close three-angle capture should merge: %+v", rec)
	}
	// Weighted mean: (400*2 + 420 + 380) / 4 = 400.
	if math.Abs(rec.MergedWeightG-400) > 0.5 {
		t.Errorf("merged = %v, want 400", rec.MergedWeightG)
	}
}

func TestValidAngle(t *testing.T) {
	for _, ok := range []string{"top", "side", "oblique"} {
		if !ValidAngle(ok) {
			t.Errorf("%q should be valid", ok)
		}
	}
	for _, bad := range []string{"", "front", "TOP", "45"} {
		if ValidAngle(bad) {
			t.Errorf("%q should be invalid", bad)
		}
	}
}

func TestGeometryTotalWeight(t *testing.T) {
	geo := GeometryResult{Regions: []Region{{EstimatedWeightG: 120}, {EstimatedWeightG: 200}}}
	if got := GeometryTotalWeightG(geo); got != 320 {
		t.Errorf("total = %v, want 320", got)
	}
	if got := GeometryTotalWeightG(GeometryResult{}); got != 0 {
		t.Errorf("empty = %v, want 0", got)
	}
}
