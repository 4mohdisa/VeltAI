package subscriptiontests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/subscription"
)

// fakeStore simulates the ATOMIC semantics of the Postgres store: ClaimEvent is
// INSERT ... ON CONFLICT DO NOTHING (exactly one caller wins) and UpsertIfNewer
// compares-and-writes under one lock (the row lock). Everything is guarded by a
// single mutex so the concurrency tests below exercise real interleavings.
type fakeStore struct {
	mu     sync.Mutex
	subs   map[string]subscription.Sub
	lastTS map[string]int64 // user -> newest applied event_timestamp_ms
	claims map[string]bool  // provider|event_id
	err    error            // when set, every call fails (DB down)
}

func newFakeStore() *fakeStore {
	return &fakeStore{
		subs:   map[string]subscription.Sub{},
		lastTS: map[string]int64{},
		claims: map[string]bool{},
	}
}

func (f *fakeStore) Get(_ context.Context, userID string) (subscription.Sub, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return subscription.Sub{}, f.err
	}
	s, ok := f.subs[userID]
	if !ok {
		return subscription.Sub{}, subscription.ErrNotFound
	}
	return s, nil
}

func (f *fakeStore) ClaimEvent(_ context.Context, provider, eventID string) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return false, f.err
	}
	k := provider + "|" + eventID
	if f.claims[k] {
		return false, nil // already processed — replay
	}
	f.claims[k] = true
	return true, nil
}

func (f *fakeStore) ReleaseEvent(_ context.Context, provider, eventID string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.claims, provider+"|"+eventID)
	return nil
}

func (f *fakeStore) UpsertIfNewer(_ context.Context, s subscription.Sub, tsMs int64) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return false, f.err
	}
	if prev, ok := f.lastTS[s.UserID]; ok && tsMs < prev {
		return false, nil // out of order — the WHERE clause is false
	}
	f.lastTS[s.UserID] = tsMs
	f.subs[s.UserID] = s
	return true, nil
}

func (f *fakeStore) Transfer(_ context.Context, from, to string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return f.err
	}
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

// sub reads a stored subscription under the lock (the handler may still be
// running in the concurrency tests).
func (f *fakeStore) sub(userID string) (subscription.Sub, bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	s, ok := f.subs[userID]
	return s, ok
}

func (f *fakeStore) count() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.subs)
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
	return fmt.Sprintf(`{"event":{"type":%q,"app_user_id":%q,"period_type":"NORMAL","expiration_at_ms":%d,"store":"APP_STORE","product_id":"lume_pro_annual"}}`,
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
	if store.count() != 0 {
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

// eventBodyAt is eventBody plus the fields the replay/ordering guard reads.
func eventBodyAt(typ, userID, id string, expMs, tsMs int64) string {
	return fmt.Sprintf(`{"event":{"id":%q,"type":%q,"app_user_id":%q,"period_type":"NORMAL","expiration_at_ms":%d,"event_timestamp_ms":%d,"store":"APP_STORE","product_id":"lume_pro_annual"}}`,
		id, typ, userID, expMs, tsMs)
}

// noExpiryBody omits expiration_at_ms entirely — the indefinite-Pro vector.
func noExpiryBody(typ, userID string) string {
	return fmt.Sprintf(`{"event":{"type":%q,"app_user_id":%q,"period_type":"NORMAL","store":"APP_STORE","product_id":"lume_pro_annual"}}`, typ, userID)
}

func TestWebhookGrantWithoutExpiryIsBounded(t *testing.T) {
	t.Setenv("LUME_SUB_DEFAULT_TTL_HOURS", "1")
	store := newFakeStore()
	mux := newMux(store)
	rec := postWebhook(mux, webhookAuth, noExpiryBody("INITIAL_PURCHASE", "user_1"))
	if rec.Code != http.StatusOK {
		t.Fatalf("webhook: status %d, body %s", rec.Code, rec.Body)
	}
	got, _ := store.sub("user_1")
	if got.ExpiresAt == nil {
		t.Fatal("grant without expiration_at_ms must not be stored as never-expiring")
	}
	if got.ExpiresAt.After(time.Now().Add(2 * time.Hour)) {
		t.Fatalf("want expiry bounded by LUME_SUB_DEFAULT_TTL_HOURS=1, got %v", got.ExpiresAt)
	}
	if data := getStatus(t, mux, "user_1"); data["is_active"] != true {
		t.Fatalf("want a paying user still active inside the window, got %v", data)
	}
}

func TestNilExpiryReadsInactive(t *testing.T) {
	store := newFakeStore()
	store.subs["user_1"] = subscription.Sub{UserID: "user_1", Status: "active"}
	if data := getStatus(t, newMux(store), "user_1"); data["is_active"] != false {
		t.Fatalf("unknown expiry must fail closed, got %v", data)
	}
}

func TestWebhookTransferCannotWipeUnrelatedUser(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "victim", future))
	postWebhook(mux, webhookAuth, eventBody("INITIAL_PURCHASE", "attacker", future))

	for name, body := range map[string]string{
		"target holds an active sub": transferBody([]string{"attacker"}, []string{"victim"}),
		"source row does not exist":  transferBody([]string{"ghost"}, []string{"victim"}),
	} {
		rec := postWebhook(mux, webhookAuth, body)
		if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ignored") {
			t.Fatalf("%s: want 200 ignored, got %d %s", name, rec.Code, rec.Body)
		}
		if data := getStatus(t, mux, "victim"); data["is_active"] != true {
			t.Fatalf("%s: victim's subscription was destroyed, got %v", name, data)
		}
	}
}

func TestWebhookReplayDoesNotRegrant(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	now := time.Now().UnixMilli()
	purchase := eventBodyAt("INITIAL_PURCHASE", "user_1", "evt_purchase",
		time.Now().Add(24*time.Hour).UnixMilli(), now)
	postWebhook(mux, webhookAuth, purchase)
	postWebhook(mux, webhookAuth, eventBodyAt("EXPIRATION", "user_1", "evt_expire", now, now+1000))

	rec := postWebhook(mux, webhookAuth, purchase) // captured request, replayed
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ignored") {
		t.Fatalf("want 200 ignored, got %d %s", rec.Code, rec.Body)
	}
	if data := getStatus(t, mux, "user_1"); data["status"] != "expired" || data["is_active"] != false {
		t.Fatalf("replay re-granted entitlement, got %v", data)
	}
}

func TestWebhookOlderEventDoesNotDowngrade(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	now := time.Now().UnixMilli()
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	postWebhook(mux, webhookAuth, eventBodyAt("RENEWAL", "user_1", "evt_new", future, now))

	// A delayed EXPIRATION from before the renewal must not win.
	rec := postWebhook(mux, webhookAuth, eventBodyAt("EXPIRATION", "user_1", "evt_old", now, now-60_000))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ignored") {
		t.Fatalf("want 200 ignored, got %d %s", rec.Code, rec.Body)
	}
	if data := getStatus(t, mux, "user_1"); data["status"] != "active" || data["is_active"] != true {
		t.Fatalf("older event downgraded newer state, got %v", data)
	}
}

func TestWebhookStaleEventIgnored(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	old := time.Now().Add(-48 * time.Hour).UnixMilli()
	rec := postWebhook(mux, webhookAuth, eventBodyAt("INITIAL_PURCHASE", "user_1", "evt_old",
		time.Now().Add(24*time.Hour).UnixMilli(), old))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ignored") {
		t.Fatalf("want 200 ignored, got %d %s", rec.Code, rec.Body)
	}
	if store.count() != 0 {
		t.Fatalf("stale event must not write, got %v", store.subs)
	}
}

func TestWebhookUnconfiguredSecretUnavailable(t *testing.T) {
	mux := http.NewServeMux()
	subscription.RegisterWebhook(mux, newFakeStore(), "")
	for _, hdr := range []string{"", webhookAuth} {
		rec := postWebhook(mux, hdr, eventBody("INITIAL_PURCHASE", "user_1", time.Now().UnixMilli()))
		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("unconfigured secret must fail closed with 503, got %d", rec.Code)
		}
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

// Secret rotation: the webhook must accept BOTH the current and the previous
// secret during the overlap window. Without that, every rotation drops the
// webhooks in flight while the dashboard and the server disagree — and a
// dropped RevenueCat event means a paying user silently loses access.
func TestWebhookAcceptsCurrentAndPreviousSecretDuringRotation(t *testing.T) {
	const current = "Bearer rc-new-secret"
	const previous = "Bearer rc-old-secret"
	t.Setenv("REVENUECAT_WEBHOOK_AUTH_PREVIOUS", previous)

	for _, tc := range []struct {
		name, header string
		wantCode     int
	}{
		{"current secret", current, http.StatusOK},
		{"previous secret (still in flight)", previous, http.StatusOK},
		{"a retired third secret", "Bearer rc-ancient", http.StatusForbidden},
		{"empty header", "", http.StatusForbidden},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := newFakeStore()
			mux := http.NewServeMux()
			subscription.RegisterWebhook(mux, store, current)

			body := `{"event":{"id":"evt_` + tc.name + `","type":"INITIAL_PURCHASE","app_user_id":"user_rot",` +
				`"period_type":"NORMAL","store":"APP_STORE","product_id":"p"}}`
			req := httptest.NewRequest(http.MethodPost, "/api/webhooks/revenuecat", strings.NewReader(body))
			if tc.header != "" {
				req.Header.Set("Authorization", tc.header)
			}
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, req)

			if rec.Code != tc.wantCode {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.wantCode, rec.Body)
			}
		})
	}
}

// With no previous secret configured, only the current one is accepted — the
// rotation support must not widen what is accepted by default.
func TestWebhookRejectsPreviousWhenRotationNotInProgress(t *testing.T) {
	t.Setenv("REVENUECAT_WEBHOOK_AUTH_PREVIOUS", "")
	store := newFakeStore()
	mux := http.NewServeMux()
	subscription.RegisterWebhook(mux, store, "Bearer only-current")

	req := httptest.NewRequest(http.MethodPost, "/api/webhooks/revenuecat",
		strings.NewReader(`{"event":{"id":"e1","type":"INITIAL_PURCHASE","app_user_id":"u"}}`))
	req.Header.Set("Authorization", "Bearer some-old-secret")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", rec.Code)
	}
}
