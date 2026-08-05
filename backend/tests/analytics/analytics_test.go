package analyticstests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"lume/backend/internal/analytics"
	"lume/backend/internal/auth"
)

type fakeStore struct {
	userID string
	events []analytics.Event
}

func (f *fakeStore) InsertEvents(_ context.Context, userID string, events []analytics.Event) error {
	f.userID = userID
	f.events = append(f.events, events...)
	return nil
}

func newMux(store analytics.Store) *http.ServeMux {
	mux := http.NewServeMux()
	analytics.Register(mux, store)
	return mux
}

func post(mux *http.ServeMux, userID, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/analytics/events", strings.NewReader(body))
	req = req.WithContext(auth.WithUserID(req.Context(), userID))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func event(name, props string) string {
	if props == "" {
		return fmt.Sprintf(`{"name":%q,"session_id":"sess_1","client_ts":"2026-07-27T10:00:00Z"}`, name)
	}
	return fmt.Sprintf(`{"name":%q,"properties":%s,"session_id":"sess_1","client_ts":"2026-07-27T10:00:00Z"}`, name, props)
}

func TestValidBatchAccepted(t *testing.T) {
	store := &fakeStore{}
	// Body carries a user_id (top-level and in properties) that must be ignored.
	body := fmt.Sprintf(`{"user_id":"user_evil","events":[%s,%s]}`,
		event("food_logged", `{"meal":"lunch","user_id":"user_evil"}`),
		event("scan_started", ""))
	rec := post(newMux(store), "user_ctx", body)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("want 202, got %d, body %s", rec.Code, rec.Body)
	}
	var env struct {
		Data map[string]int `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if env.Data["accepted"] != 2 {
		t.Fatalf("want accepted 2, got %v", env.Data)
	}
	if store.userID != "user_ctx" {
		t.Fatalf("user id must come from auth context, got %q", store.userID)
	}
	if len(store.events) != 2 || store.events[0].Name != "food_logged" || store.events[1].Name != "scan_started" {
		t.Fatalf("want 2 events landed, got %+v", store.events)
	}
}

func TestUnknownEventNameRejected(t *testing.T) {
	store := &fakeStore{}
	rec := post(newMux(store), "user_1", fmt.Sprintf(`{"events":[%s]}`, event("crush_your_goals", "")))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d", rec.Code)
	}
	if len(store.events) != 0 {
		t.Fatalf("rejected batch must not land, got %+v", store.events)
	}
}

func TestTooManyEventsRejected(t *testing.T) {
	events := make([]string, 51)
	for i := range events {
		events[i] = event("feature_used", "")
	}
	rec := post(newMux(&fakeStore{}), "user_1", fmt.Sprintf(`{"events":[%s]}`, strings.Join(events, ",")))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400 for 51 events, got %d", rec.Code)
	}
}

func TestOversizedPropertiesRejected(t *testing.T) {
	big := fmt.Sprintf(`{"pad":%q}`, strings.Repeat("x", 2100))
	rec := post(newMux(&fakeStore{}), "user_1", fmt.Sprintf(`{"events":[%s]}`, event("feature_used", big)))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400 for oversized properties, got %d", rec.Code)
	}
}

func TestBadClientTSRejected(t *testing.T) {
	body := `{"events":[{"name":"feature_used","session_id":"s","client_ts":"yesterday"}]}`
	rec := post(newMux(&fakeStore{}), "user_1", body)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400 for bad client_ts, got %d", rec.Code)
	}
}

func TestEmptyEventsRejected(t *testing.T) {
	rec := post(newMux(&fakeStore{}), "user_1", `{"events":[]}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400 for empty events, got %d", rec.Code)
	}
}

func TestAbsentPropertiesDefaultsToEmptyObject(t *testing.T) {
	store := &fakeStore{}
	rec := post(newMux(store), "user_1", fmt.Sprintf(`{"events":[%s]}`, event("paywall_viewed", "")))
	if rec.Code != http.StatusAccepted {
		t.Fatalf("want 202, got %d, body %s", rec.Code, rec.Body)
	}
	if len(store.events) != 1 || string(store.events[0].Properties) != "{}" {
		t.Fatalf("want properties {} when absent, got %+v", store.events)
	}
}
