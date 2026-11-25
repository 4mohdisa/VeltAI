package entitlementtests

// Real-Postgres tests for the RevenueCat webhook: the fixtures run through the
// real handler and subscription.PGStore, so the event id claim and the
// timestamp ordering are the production SQL, and the entitlement gate reads
// the stored state. Skipped unless LUME_TEST_DATABASE_URL points at a
// disposable database with the migrations applied.

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/entitlement"
	"lume/backend/internal/subscription"
)

const (
	fixtureUser   = "user_rc_fixture"
	webhookSecret = "Bearer entitlement-fixture-secret"
)

func pgPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// resetFixtureUser gives each case a fresh profile with no subscription row
// and no claimed fixture event ids, and removes both when the case ends.
func resetFixtureUser(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	clean := func() {
		ctx := context.Background()
		_, _ = pool.Exec(ctx, `DELETE FROM webhook_processed_events WHERE provider = 'revenuecat' AND event_id LIKE 'evt-fixture-%'`)
		_, _ = pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, fixtureUser)
	}
	clean()
	if _, err := pool.Exec(context.Background(), `INSERT INTO profiles (id) VALUES ($1)`, fixtureUser); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(clean)
}

// shiftedFixture moves every *_ms time in the fixture by the same amount, so
// the fixtures keep their order and spacing but land just before now, inside
// the webhook's 24 hour age bound.
func shiftedFixture(t *testing.T, name string, shiftMs int64) []byte {
	t.Helper()
	dec := json.NewDecoder(bytes.NewReader(readFixture(t, name)))
	dec.UseNumber()
	var body map[string]any
	if err := dec.Decode(&body); err != nil {
		t.Fatalf("decode fixture %s: %v", name, err)
	}
	event := body["event"].(map[string]any)
	for k, v := range event {
		n, ok := v.(json.Number)
		if !ok || !strings.HasSuffix(k, "_ms") {
			continue
		}
		i, err := n.Int64()
		if err != nil {
			t.Fatalf("fixture %s field %s: %v", name, k, err)
		}
		event[k] = i + shiftMs
	}
	out, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	return out
}

func deliver(t *testing.T, mux *http.ServeMux, payload []byte) string {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/webhooks/revenuecat", bytes.NewReader(payload))
	req.Header.Set("Authorization", webhookSecret)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("webhook status = %d, body %s", w.Code, w.Body)
	}
	var env struct {
		Data struct {
			Result string `json:"result"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode webhook response: %v", err)
	}
	return env.Data.Result
}

func TestPG_WebhookFixturesSetEntitlementState(t *testing.T) {
	pool := pgPool(t)
	store := subscription.NewPGStore(pool)
	mux := http.NewServeMux()
	subscription.RegisterWebhook(mux, store, webhookSecret)
	gated, _ := serve(t, store, defaultCfg())
	shiftMs := time.Now().UnixMilli() - (fixtureBaseMs + 10*3600000)

	cases := []struct {
		name        string
		deliveries  []string
		wantResults []string
		wantStatus  string
		wantAccess  bool
	}{
		{"initial purchase", []string{"initial_purchase"}, []string{"ok"}, entitlement.StateActive, true},
		{"trial", []string{"initial_purchase_trial"}, []string{"ok"}, entitlement.StateTrial, true},
		{"renewal", []string{"initial_purchase", "renewal"}, []string{"ok", "ok"}, entitlement.StateActive, true},
		{"cancellation keeps access until expiry", []string{"initial_purchase", "cancellation"}, []string{"ok", "ok"}, entitlement.StateCancelledActive, true},
		{"billing issue keeps access in grace", []string{"initial_purchase", "billing_issue"}, []string{"ok", "ok"}, entitlement.StateBillingIssue, true},
		{"billing issue with no grace ends access", []string{"initial_purchase", "billing_issue_no_grace"}, []string{"ok", "ok"}, entitlement.StateBillingIssue, false},
		{"product change leaves state alone", []string{"initial_purchase", "product_change"}, []string{"ok", "ignored"}, entitlement.StateActive, true},
		{"expiration ends access", []string{"initial_purchase", "expiration"}, []string{"ok", "ok"}, entitlement.StateExpired, false},
		{"refund ends access", []string{"initial_purchase", "refund"}, []string{"ok", "ok"}, entitlement.StateRefunded, false},
		{"refund reversed restores access", []string{"initial_purchase", "refund", "refund_reversed"}, []string{"ok", "ok", "ok"}, entitlement.StateActive, true},
		{"refund reversed after the period ends stays expired", []string{"initial_purchase", "refund", "refund_reversed_lapsed"}, []string{"ok", "ok", "ok"}, entitlement.StateExpired, false},
		{"older refund reversal never overwrites a newer expiration", []string{"initial_purchase", "out_of_order_expiration_older", "refund_reversed"}, []string{"ok", "ok", "ignored"}, entitlement.StateExpired, false},
		{"older event never overwrites a newer one", []string{"out_of_order_renewal_newer", "out_of_order_expiration_older"}, []string{"ok", "ignored"}, entitlement.StateActive, true},
		{"duplicate delivery applies once", []string{"initial_purchase", "expiration", "expiration"}, []string{"ok", "ok", "ignored"}, entitlement.StateExpired, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resetFixtureUser(t, pool)
			for i, f := range tc.deliveries {
				if got := deliver(t, mux, shiftedFixture(t, f, shiftMs)); got != tc.wantResults[i] {
					t.Fatalf("delivery %d (%s) result = %q, want %q", i+1, f, got, tc.wantResults[i])
				}
			}
			sub, err := store.Get(context.Background(), fixtureUser)
			if err != nil {
				t.Fatalf("read subscription: %v", err)
			}
			if sub.Status != tc.wantStatus {
				t.Fatalf("status = %q, want %q", sub.Status, tc.wantStatus)
			}
			wantCode := http.StatusPaymentRequired
			if tc.wantAccess {
				wantCode = http.StatusOK
			}
			if w := do(t, gated, http.MethodPost, "/api/ai/query", fixtureUser); w.Code != wantCode {
				t.Fatalf("Pro route status = %d, want %d; body %s", w.Code, wantCode, w.Body)
			}
		})
	}
}
