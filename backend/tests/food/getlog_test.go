package foodtests

import (
	"encoding/json"
	"net/http"
	"testing"

	"lume/backend/internal/food"
)

// getLog validates the UUID format BEFORE touching the store, and the fake
// CreateLog auto-numbers ids as "log_N" (not UUIDs), so getLog tests seed
// f.logs directly with explicit valid-UUID ids.
func seedUUIDLog(f *fakeStore, l food.Log) food.Log {
	f.logs = append(f.logs, l)
	return l
}

func TestGetLogInvalidUUID400(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "GET", "/api/food/logs/not-a-uuid", "user_1", nil)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body %s)", rr.Code, rr.Body.String())
	}
}

func TestGetLogMissing404(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "GET",
		"/api/food/logs/11111111-1111-1111-1111-111111111111", "user_1", nil)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (body %s)", rr.Code, rr.Body.String())
	}
}

func TestGetLogOtherUser403(t *testing.T) {
	f := &fakeStore{}
	seedUUIDLog(f, food.Log{
		ID: "22222222-2222-2222-2222-222222222222", UserID: "user_2",
		Date: "2026-07-11", FoodName: "Toast", Calories: 200, Status: "confirmed",
	})
	rr := do(t, newMux(f, nil), "GET",
		"/api/food/logs/22222222-2222-2222-2222-222222222222", "user_1", nil)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 (body %s)", rr.Code, rr.Body.String())
	}
}

func TestGetLogReturnsStatus(t *testing.T) {
	f := &fakeStore{}
	seedUUIDLog(f, food.Log{
		ID: "33333333-3333-3333-3333-333333333333", UserID: "user_1",
		Date: "2026-07-11", FoodName: "Oats", Calories: 300, Status: "confirmed",
	})
	rr := do(t, newMux(f, nil), "GET",
		"/api/food/logs/33333333-3333-3333-3333-333333333333", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	if got := data[food.Log](t, rr); got.Status != "confirmed" {
		t.Errorf("status = %q, want confirmed", got.Status)
	}
}

func TestGetLogReturnsScanResults(t *testing.T) {
	f := &fakeStore{}
	seedUUIDLog(f, food.Log{
		ID: "44444444-4444-4444-4444-444444444444", UserID: "user_1",
		Date: "2026-07-11", FoodName: "Curry", Calories: 500, Status: "ready",
		ScanResults: json.RawMessage(`{"scan_session_id":"s1","confidence":{"score":55,"label":"High"}}`),
	})
	rr := do(t, newMux(f, nil), "GET",
		"/api/food/logs/44444444-4444-4444-4444-444444444444", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	got := data[food.Log](t, rr)
	if got.Status != "ready" {
		t.Errorf("status = %q, want ready", got.Status)
	}
	var sr struct {
		ScanSessionID string `json:"scan_session_id"`
	}
	if err := json.Unmarshal(got.ScanResults, &sr); err != nil {
		t.Fatalf("decode scan_results: %v (raw %s)", err, got.ScanResults)
	}
	if sr.ScanSessionID != "s1" {
		t.Errorf("scan_session_id = %q, want s1", sr.ScanSessionID)
	}
}

func TestGetLogStatusVariants(t *testing.T) {
	ids := map[string]string{
		"analyzing": "aaaaaaaa-0000-0000-0000-000000000001",
		"ready":     "aaaaaaaa-0000-0000-0000-000000000002",
		"confirmed": "aaaaaaaa-0000-0000-0000-000000000003",
	}
	f := &fakeStore{}
	for status, id := range ids {
		seedUUIDLog(f, food.Log{
			ID: id, UserID: "user_1", Date: "2026-07-11",
			FoodName: "X", Calories: 100, Status: status,
		})
	}
	mux := newMux(f, nil)
	for status, id := range ids {
		rr := do(t, mux, "GET", "/api/food/logs/"+id, "user_1", nil)
		if rr.Code != http.StatusOK {
			t.Fatalf("status %q: code = %d, want 200 (body %s)", status, rr.Code, rr.Body.String())
		}
		if got := data[food.Log](t, rr); got.Status != status {
			t.Errorf("status round-trip: got %q, want %q", got.Status, status)
		}
	}
}
