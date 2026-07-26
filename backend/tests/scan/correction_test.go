package scantests

import (
	"net/http"
	"testing"
	"time"

	"lumo/backend/internal/scan"
)

func TestCorrectionCalculatesMagnitude(t *testing.T) {
	store := &fakeStore{}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/correction",
		`{"food_name_original":"chicken breast","food_name_corrected":"chicken breast","weight_original_g":100,"weight_corrected_g":150}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if len(store.corrections) != 1 {
		t.Fatalf("corrections recorded = %d, want 1", len(store.corrections))
	}
	got := store.corrections[0]
	if got.magnitude == nil {
		t.Fatal("correction_magnitude = nil, want 0.5")
	}
	if *got.magnitude != 0.5 {
		t.Fatalf("correction_magnitude = %v, want 0.5", *got.magnitude)
	}
	var resp struct {
		Success            bool `json:"success"`
		CalibrationUpdated bool `json:"calibration_updated"`
	}
	decodeData(t, rec, &resp)
	if !resp.Success || !resp.CalibrationUpdated {
		t.Fatalf("resp = %+v, want success+calibration_updated", resp)
	}
}

func TestCorrectionMagnitudeNullWhenWeightOriginalNotPositive(t *testing.T) {
	store := &fakeStore{}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/correction",
		`{"food_name_original":"soup","food_name_corrected":"soup","weight_original_g":0,"weight_corrected_g":150}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if len(store.corrections) != 1 {
		t.Fatalf("corrections recorded = %d, want 1", len(store.corrections))
	}
	if store.corrections[0].magnitude != nil {
		t.Fatalf("correction_magnitude = %v, want nil", *store.corrections[0].magnitude)
	}
	var resp struct {
		Success            bool `json:"success"`
		CalibrationUpdated bool `json:"calibration_updated"`
	}
	decodeData(t, rec, &resp)
	if !resp.Success || resp.CalibrationUpdated {
		t.Fatalf("resp = %+v, want success=true calibration_updated=false", resp)
	}
}

func TestCorrectionMissingFoodName(t *testing.T) {
	rec := serve(t, &fakeOCR{}, &fakeStore{}, "POST", "/api/scan/correction",
		`{"weight_original_g":100,"weight_corrected_g":150}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400; body %s", rec.Code, rec.Body)
	}
}

func TestCalibrationEndpoint(t *testing.T) {
	store := &fakeStore{
		sessions: map[string]fakeSession{
			"s1": {owner: "user_1"},
			"s2": {owner: "user_1"},
			"s3": {owner: "user_2"}, // other user, must not leak into user_1's summary
		},
		corrections: []fakeCorrection{
			// user_1: rice consistently underestimated (+50%), salad overestimated (-33%).
			{userID: "user_1", foodNameOriginal: "rice", weightOriginalG: 100, weightCorrectedG: 150, magnitude: fp(0.5), createdAt: time.Now()},
			{userID: "user_1", foodNameOriginal: "rice", weightOriginalG: 100, weightCorrectedG: 150, magnitude: fp(0.5), createdAt: time.Now()},
			{userID: "user_1", foodNameOriginal: "salad", weightOriginalG: 150, weightCorrectedG: 100, magnitude: fp(1.0 / 3), createdAt: time.Now()},
			{userID: "user_2", foodNameOriginal: "rice", weightOriginalG: 100, weightCorrectedG: 90, magnitude: fp(0.1), createdAt: time.Now()},
		},
	}
	rec := serve(t, &fakeOCR{}, store, "GET", "/api/scan/calibration", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	var got struct {
		Factors         []scan.CalibrationFactor `json:"factors"`
		AccuracySummary scan.AccuracySummary     `json:"accuracy_summary"`
	}
	decodeData(t, rec, &got)

	sum := got.AccuracySummary
	if sum.TotalScans != 2 {
		t.Fatalf("total_scans = %d, want 2", sum.TotalScans)
	}
	if sum.CorrectedCount != 3 {
		t.Fatalf("corrected_count = %d, want 3", sum.CorrectedCount)
	}
	wantAvgMag := (0.5 + 0.5 + 1.0/3) / 3
	if diff := sum.AvgCorrectionMagnitude - wantAvgMag; diff > 1e-9 || diff < -1e-9 {
		t.Fatalf("avg_correction_magnitude = %v, want %v", sum.AvgCorrectionMagnitude, wantAvgMag)
	}
	if len(sum.MostUnderestimated) != 2 || sum.MostUnderestimated[0] != "rice" {
		t.Fatalf("most_underestimated = %v, want [rice salad]", sum.MostUnderestimated)
	}
	if len(sum.MostOverestimated) != 2 || sum.MostOverestimated[0] != "salad" {
		t.Fatalf("most_overestimated = %v, want [salad rice]", sum.MostOverestimated)
	}
}

func fp(v float64) *float64 { return &v }

func TestFeedbackUpdatesRating(t *testing.T) {
	store := &fakeStore{sessions: map[string]fakeSession{"sess_1": {owner: "user_1"}}}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/feedback",
		`{"scan_session_id":"sess_1","rating":"pretty_good"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	var resp struct {
		Updated bool `json:"updated"`
	}
	decodeData(t, rec, &resp)
	if !resp.Updated {
		t.Fatal("updated = false, want true")
	}
	if store.sessions["sess_1"].rating != "pretty_good" {
		t.Fatalf("rating = %q, want pretty_good", store.sessions["sess_1"].rating)
	}
}

func TestFeedbackInvalidRating(t *testing.T) {
	store := &fakeStore{sessions: map[string]fakeSession{"sess_1": {owner: "user_1"}}}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/feedback",
		`{"scan_session_id":"sess_1","rating":"terrible"}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400; body %s", rec.Code, rec.Body)
	}
}

func TestFeedbackUnknownSession(t *testing.T) {
	rec := serve(t, &fakeOCR{}, &fakeStore{}, "POST", "/api/scan/feedback",
		`{"scan_session_id":"missing","rating":"spot_on"}`)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404; body %s", rec.Code, rec.Body)
	}
}

func TestFeedbackOtherUsersSession(t *testing.T) {
	store := &fakeStore{sessions: map[string]fakeSession{"sess_1": {owner: "user_2"}}}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/feedback",
		`{"scan_session_id":"sess_1","rating":"spot_on"}`)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403; body %s", rec.Code, rec.Body)
	}
}

func TestConfirmLearningHookUpdatesPortionPref(t *testing.T) {
	store := &fakeStore{}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"banana","calories":105,"quantity":120,"unit":"g"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body %s", rec.Code, rec.Body)
	}
	pref, ok := store.portionPrefs[portionKey("user_1", "banana")]
	if !ok {
		t.Fatal("portion pref not recorded")
	}
	if pref.weight != 120 || pref.count != 1 {
		t.Fatalf("pref = %+v, want weight=120 count=1", pref)
	}

	// A second confirm with a different quantity should move the running
	// average, not overwrite it.
	rec2 := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"banana","calories":90,"quantity":100,"unit":"g"}`)
	if rec2.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body %s", rec2.Code, rec2.Body)
	}
	pref = store.portionPrefs[portionKey("user_1", "banana")]
	wantWeight := (120.0 + 100.0) / 2
	if pref.weight != wantWeight || pref.count != 2 {
		t.Fatalf("pref = %+v, want weight=%v count=2", pref, wantWeight)
	}
}

func TestConfirmLearningHookFlipsNeedsRebuildAfterEnoughLogs(t *testing.T) {
	store := &fakeStore{}
	for i := 0; i < 4; i++ {
		rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm", `{"food_name":"apple","calories":95}`)
		if rec.Code != http.StatusCreated {
			t.Fatalf("confirm %d: status = %d", i, rec.Code)
		}
	}
	if store.needsRebuild["user_1"] {
		t.Fatal("needs_rebuild flipped true too early (before 5 logs)")
	}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm", `{"food_name":"apple","calories":95}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("5th confirm: status = %d", rec.Code)
	}
	if !store.needsRebuild["user_1"] {
		t.Fatal("needs_rebuild should be true after 5 logs")
	}
}
