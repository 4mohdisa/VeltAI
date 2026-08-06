package scantests

// Added in the 2026-08-06 audit.
//
// Consent: App Store 5.1.2(i) (Nov 2025 revision: "including with third-party
// AI") requires recorded consent BEFORE user data reaches Gemini. The ai
// package had this gate; the scan package — the one that actually sends the
// user's photos — had none. These tests pin the server-side gate.
//
// Quota: the sync /api/scan billed Gemini BEFORE writing the scan_sessions row
// the free-tier quota counts, so a failing call was retryable for free,
// forever. The failed-attempt row is the fix.

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"lume/backend/internal/scan"
)

// consentStore wraps fakeStore with a controllable scan.ConsentStore answer.
type consentStore struct {
	fakeStore
	consentAt *time.Time
}

func (c *consentStore) AIConsentAt(context.Context, string) (*time.Time, error) {
	return c.consentAt, nil
}

var _ scan.ConsentStore = (*consentStore)(nil)

func TestScanWithoutRecordedConsentIs403(t *testing.T) {
	ocr := &fakeOCR{result: scan.Result{FoodName: "banana", Calories: 105}}
	store := &consentStore{} // consentAt nil → never consented
	rec := serve(t, ocr, store, "POST", "/api/scan", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 — the photo must not reach Gemini without recorded consent; body %s", rec.Code, rec.Body)
	}
}

func TestScanWithRecordedConsentProceeds(t *testing.T) {
	now := time.Now()
	ocr := &fakeOCR{result: scan.Result{FoodName: "banana", Calories: 105}}
	store := &consentStore{consentAt: &now}
	rec := serve(t, ocr, store, "POST", "/api/scan", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 with consent recorded; body %s", rec.Code, rec.Body)
	}
}

func TestFailedGeminiCallStillConsumesQuota(t *testing.T) {
	now := time.Now()
	ocr := &fakeOCR{err: errors.New("gemini: status 500")} // billed, then failed
	store := &consentStore{consentAt: &now}
	rec := serve(t, ocr, store, "POST", "/api/scan", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502; body %s", rec.Code, rec.Body)
	}
	if len(store.sessions) != 1 {
		t.Fatalf("scan_sessions rows after a billed-but-failed call = %d, want 1 — the free quota counts sessions, so an unrecorded failure is a free retry of a paid call", len(store.sessions))
	}
}
