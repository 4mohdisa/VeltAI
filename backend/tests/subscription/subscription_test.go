package subscriptiontests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/subscription"
)

type fakeStore struct{ subs map[string]subscription.Sub }

func newFakeStore() *fakeStore { return &fakeStore{subs: map[string]subscription.Sub{}} }

func (f *fakeStore) Get(_ context.Context, userID string) (subscription.Sub, error) {
	s, ok := f.subs[userID]
	if !ok {
		return subscription.Sub{}, subscription.ErrNotFound
	}
	return s, nil
}

func (f *fakeStore) Upsert(_ context.Context, s subscription.Sub) error {
	f.subs[s.UserID] = s
	return nil
}

func (f *fakeStore) Transfer(_ context.Context, from, to string) error {
	delete(f.subs, to)
	s, ok := f.subs[from]
	if !ok {
		return nil
	}
	delete(f.subs, from)
	s.UserID = to
	f.subs[to] = s
	return nil
}

const webhookAuth = "Bearer rc-secret"

func newMux(store subscription.Store) *http.ServeMux {
	mux := http.NewServeMux()
	subscription.RegisterWebhook(mux, store, webhookAuth)
	subscription.Register(mux, store)
	return mux
}

func getStatus(t *testing.T, mux *http.ServeMux, userID string) map[string]any {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/api/subscription", nil)
	req = req.WithContext(auth.WithUserID(req.Context(), userID))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/subscription: status %d, body %s", rec.Code, rec.Body)
	}
	var env struct {
		Data map[string]any `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return env.Data
}

func postWebhook(mux *http.ServeMux, authHeader, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/webhooks/revenuecat", strings.NewReader(body))
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func eventBody(typ, userID string, expMs int64) string {
	return fmt.Sprintf(`{"event":{"type":%q,"app_user_id":%q,"period_type":"NORMAL","expiration_at_ms":%d,"store":"APP_STORE","product_id":"lumo_pro_annual"}}`,
		typ, userID, expMs)
}

func TestGetNewUserInactive(t *testing.T) {
	mux := newMux(newFakeStore())
	data := getStatus(t, mux, "user_1")
	if data["status"] != "none" || data["is_active"] != false {
		t.Fatalf("want status none / inactive, got %v", data)
	}
}

func TestWebhookInitialPurchaseActivates(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	rec := postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "user_1", future))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	data := getStatus(t, mux, "user_1")
	if data["status"] != "active" || data["is_active"] != true {
		t.Fatalf("want active, got %v", data)
	}
	if data["platform"] != "ios" || data["plan_interval"] != "year" {
		t.Fatalf("want platform ios / interval year, got %v", data)
	}
}

func TestWebhookInvalidAuth(t *testing.T) {
	mux := newMux(newFakeStore())
	rec := postWebhook(mux, "Bearer wrong", eventBody("INITIAL_PURCHASE", "user_1", 0))
	if rec.Code != http.StatusForbidden {
		t.Fatalf("want 403, got %d", rec.Code)
	}
}

func TestWebhookExpirationDeactivates(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "user_1", future))
	rec := postWebhook(mux, webhookAuth, eventBody("EXPIRATION", "user_1", time.Now().UnixMilli()))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	data := getStatus(t, mux, "user_1")
	if data["status"] != "expired" || data["is_active"] != false {
		t.Fatalf("want expired / inactive, got %v", data)
	}
}

func TestWebhookCancellationKeepsPaidAccess(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "user_1", future))
	rec := postWebhook(mux, webhookAuth, eventBody("CANCELLATION", "user_1", future))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	data := getStatus(t, mux, "user_1")
	if data["status"] != "cancelled" || data["is_active"] != true {
		t.Fatalf("want cancelled but still active until expiry, got %v", data)
	}
}

func TestWebhookCancellationPastExpiryInactive(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	rec := postWebhook(mux, webhookAuth, eventBody("CANCELLATION", "user_1", time.Now().Add(-time.Hour).UnixMilli()))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	data := getStatus(t, mux, "user_1")
	if data["status"] != "cancelled" || data["is_active"] != false {
		t.Fatalf("want cancelled and inactive past expiry, got %v", data)
	}
}

func TestWebhookAnonymousUserIgnored(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	rec := postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "$RCAnonymousID:abc123", future))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	if !strings.Contains(rec.Body.String(), "ignored") {
		t.Fatalf("want ignored result, got %s", rec.Body)
	}
	if len(store.subs) != 0 {
		t.Fatalf("anonymous event must not create rows, got %v", store.subs)
	}
}

func transferBody(from, to []string) string {
	f, _ := json.Marshal(from)
	t, _ := json.Marshal(to)
	return fmt.Sprintf(`{"event":{"type":"TRANSFER","transferred_from":%s,"transferred_to":%s}}`, f, t)
}

func TestWebhookTransferMovesSubscription(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "user_a", future))
	// First non-anonymous id of each array is used.
	rec := postWebhook(mux, webhookAuth, transferBody(
		[]string{"$RCAnonymousID:x", "user_a"}, []string{"$RCAnonymousID:y", "user_b"}))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	if data := getStatus(t, mux, "user_b"); data["status"] != "active" || data["is_active"] != true {
		t.Fatalf("want user_b active after transfer, got %v", data)
	}
	if data := getStatus(t, mux, "user_a"); data["status"] != "none" {
		t.Fatalf("want user_a without subscription after transfer, got %v", data)
	}
}

func TestWebhookTransferAnonymousNoOp(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "user_a", future))
	for _, body := range []string{
		transferBody([]string{"user_a"}, []string{"$RCAnonymousID:y"}), // no usable target
		transferBody([]string{"$RCAnonymousID:x"}, []string{"user_b"}), // no usable source
		transferBody(nil, nil),
	} {
		rec := postWebhook(mux, webhookAuth, body)
		if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ignored") {
			t.Fatalf("want 200 ignored, got %d %s", rec.Code, rec.Body)
		}
	}
	if data := getStatus(t, mux, "user_a"); data["is_active"] != true {
		t.Fatalf("no-op transfer must not touch existing sub, got %v", data)
	}
}

func TestActiveStatusPastExpiryInactive(t *testing.T) {
	store := newFakeStore()
	past := time.Now().Add(-time.Hour)
	store.subs["user_1"] = subscription.Sub{UserID: "user_1", Status: "active", ExpiresAt: &past}
	data := getStatus(t, newMux(store), "user_1")
	if data["is_active"] != false {
		t.Fatalf("want inactive past expiry, got %v", data)
	}
}
