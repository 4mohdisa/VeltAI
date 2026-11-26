// Subscription gate — the SERVER-SIDE enforcement. A client-only gate is
// bypassable by anyone holding a valid token, so these tests are the real
// guarantee. Hermetic: fake stores, httptest, no DB.
package entitlementtests

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/entitlement"
)

type fakeSubs struct {
	state     string
	expiresAt *time.Time
	err       error
	calls     int
}

func (f *fakeSubs) Entitlement(context.Context, string) (string, *time.Time, error) {
	f.calls++
	return f.state, f.expiresAt, f.err
}

func subscribed() *fakeSubs {
	exp := time.Now().Add(24 * time.Hour)
	return &fakeSubs{state: entitlement.StateActive, expiresAt: &exp}
}

// serve mounts a gate over a handler that records whether it was reached.
func serve(t *testing.T, subs entitlement.SubStore, cfg entitlement.Config) (*http.ServeMux, *bool) {
	t.Helper()
	reached := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		reached = true
		w.WriteHeader(http.StatusOK)
	})
	g := entitlement.New(subs, cfg)
	mux := http.NewServeMux()
	mux.Handle("/", g.Middleware(inner))
	return mux, &reached
}

func do(t *testing.T, mux *http.ServeMux, method, path, user string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	if user != "" {
		req = req.WithContext(auth.WithUserID(req.Context(), user))
	}
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	return w
}

func defaultCfg() entitlement.Config {
	return entitlement.Config{Enforce: true}
}

type refusal struct {
	Upgrade bool   `json:"upgrade_required"`
	Feature string `json:"feature"`
	Reason  string `json:"reason"`
}

func refusalOf(t *testing.T, rec *httptest.ResponseRecorder) refusal {
	t.Helper()
	var env struct {
		Error refusal `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v (body %s)", err, rec.Body)
	}
	return env.Error
}

// ---------------------------------------------------------------------------
// Policy table — the public surface, asserted explicitly.
// ---------------------------------------------------------------------------

func TestPolicyTable(t *testing.T) {
	cases := []struct {
		method, path string
		want         entitlement.Requirement
	}{
		// Every feature route is gated: there is no free tier.
		{"POST", "/api/scan", entitlement.Pro},
		{"POST", "/api/scan/pipeline", entitlement.Pro},
		{"POST", "/api/scan/label", entitlement.Pro},
		{"POST", "/api/scan/confirm", entitlement.Pro},
		{"GET", "/api/ai/insights", entitlement.Pro},
		{"GET", "/api/ai/morning-brief", entitlement.Pro},
		{"POST", "/api/ai/query", entitlement.Pro},
		{"POST", "/api/ai/brain/rebuild", entitlement.Pro},
		{"GET", "/api/ai/brain", entitlement.Pro},
		{"POST", "/api/ai/consent", entitlement.Pro},
		{"GET", "/api/integrations", entitlement.Pro},
		{"GET", "/api/integrations/strava/connect", entitlement.Pro},
		{"POST", "/api/integrations/whoop/sync", entitlement.Pro},
		{"POST", "/api/food/logs", entitlement.Pro},
		{"GET", "/api/food/search", entitlement.Pro},
		{"POST", "/api/gym/sessions", entitlement.Pro},
		{"GET", "/api/gym/streak", entitlement.Pro},
		{"PUT", "/api/goals", entitlement.Pro},
		{"POST", "/api/body-weight", entitlement.Pro},
		{"GET", "/api/onboarding", entitlement.Pro},
		{"POST", "/api/onboarding", entitlement.Pro},
		{"GET", "/api/profile", entitlement.Pro},
		{"PATCH", "/api/profile", entitlement.Pro},
		{"GET", "/api/energy-balance", entitlement.Pro},
		{"GET", "/api/retention/summary", entitlement.Pro},
		{"POST", "/api/push/token", entitlement.Pro},
		{"GET", "/api/unknown-new-route", entitlement.Pro}, // gated by default

		// NEVER gated — a user can always manage their account and leave.
		{"GET", "/api/subscription", entitlement.Free},
		{"GET", "/api/ai/consent", entitlement.Free},
		{"DELETE", "/api/ai/consent", entitlement.Free},
		{"DELETE", "/api/integrations/strava", entitlement.Free}, // revoke a connection
		{"GET", "/api/export", entitlement.Free},                 // GDPR access
		{"DELETE", "/api/profile", entitlement.Free},             // account deletion
		{"POST", "/api/feedback", entitlement.Free},
		{"DELETE", "/api/push/token", entitlement.Free}, // stop push to a device
		{"POST", "/api/webhooks/revenuecat", entitlement.Free},
		{"POST", "/api/webhooks/clerk", entitlement.Free},
		{"POST", "/api/webhooks/apple/retention", entitlement.Free},
		{"GET", "/api/integrations/strava/callback", entitlement.Free},
	}
	for _, c := range cases {
		if got := entitlement.PolicyFor(c.method, c.path); got != c.want {
			t.Errorf("PolicyFor(%s %s) = %v, want %v", c.method, c.path, got, c.want)
		}
	}
}

// ---------------------------------------------------------------------------
// Gated routes
// ---------------------------------------------------------------------------

func TestGatedRouteDeniedWithoutSubscription(t *testing.T) {
	mux, reached := serve(t, &fakeSubs{}, defaultCfg())
	rec := do(t, mux, "GET", "/api/ai/insights", "user_free")

	if rec.Code != http.StatusPaymentRequired {
		t.Fatalf("status = %d, want 402", rec.Code)
	}
	if *reached {
		t.Fatal("handler ran despite the gate denying — no paid API call may happen")
	}
	if got := refusalOf(t, rec); !got.Upgrade || got.Feature != "ai_insights" || got.Reason != entitlement.ReasonNotSubscribed {
		t.Errorf("body = %s, want upgrade_required, feature ai_insights, reason not_subscribed", rec.Body)
	}
}

func TestGatedRouteAllowedForSubscriber(t *testing.T) {
	mux, reached := serve(t, subscribed(), defaultCfg())
	if rec := do(t, mux, "GET", "/api/ai/insights", "user_pro"); rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if !*reached {
		t.Fatal("subscriber was blocked")
	}
}

func TestScansRequireSubscription(t *testing.T) {
	for _, path := range []string{"/api/scan", "/api/scan/pipeline", "/api/scan/label"} {
		mux, reached := serve(t, &fakeSubs{}, defaultCfg())
		rec := do(t, mux, "POST", path, "user_free")
		if rec.Code != http.StatusPaymentRequired || *reached {
			t.Errorf("%s without a subscription: status = %d, reached = %v, want 402 and not reached", path, rec.Code, *reached)
		}
		if got := refusalOf(t, rec); got.Feature != "ai_scan" {
			t.Errorf("%s: feature = %q, want ai_scan", path, got.Feature)
		}
		mux, _ = serve(t, subscribed(), defaultCfg())
		if rec := do(t, mux, "POST", path, "user_pro"); rec.Code != http.StatusOK {
			t.Errorf("%s for a subscriber: status = %d, want 200", path, rec.Code)
		}
	}
}

func TestPublicRouteNeverConsultsSubscription(t *testing.T) {
	subs := &fakeSubs{}
	mux, reached := serve(t, subs, defaultCfg())
	for _, r := range []struct{ method, path string }{
		{"GET", "/api/export"},
		{"DELETE", "/api/profile"},
		{"POST", "/api/feedback"},
	} {
		if rec := do(t, mux, r.method, r.path, "user_free"); rec.Code != http.StatusOK {
			t.Errorf("%s %s: status = %d, want 200 (public route)", r.method, r.path, rec.Code)
		}
	}
	if !*reached {
		t.Fatal("public routes were blocked")
	}
	if subs.calls != 0 {
		t.Errorf("subscription checked %d times on public routes — wasted DB work", subs.calls)
	}
}

// ---------------------------------------------------------------------------
// Refusal reason — one case per reason, derived from the stored state
// ---------------------------------------------------------------------------

func TestRefusalReasonForEveryState(t *testing.T) {
	past := time.Now().Add(-time.Hour)
	future := time.Now().Add(time.Hour)
	cases := []struct {
		name      string
		state     string
		expiresAt *time.Time
		want      string
	}{
		{"trial ended", entitlement.StateTrial, &past, entitlement.ReasonTrialEnded},
		{"expired", entitlement.StateExpired, &past, entitlement.ReasonExpired},
		{"active past expiry", entitlement.StateActive, &past, entitlement.ReasonExpired},
		{"billing failed", entitlement.StateBillingIssue, nil, entitlement.ReasonBillingFailed},
		{"cancelled ended", entitlement.StateCancelledActive, &past, entitlement.ReasonCancelledEnded},
		{"refunded", entitlement.StateRefunded, &future, entitlement.ReasonRefunded},
		{"not subscribed", "", nil, entitlement.ReasonNotSubscribed},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			mux, reached := serve(t, &fakeSubs{state: tc.state, expiresAt: tc.expiresAt}, defaultCfg())
			rec := do(t, mux, "POST", "/api/ai/query", "u1")
			if rec.Code != http.StatusPaymentRequired || *reached {
				t.Fatalf("status = %d, reached = %v, want 402 and not reached", rec.Code, *reached)
			}
			got := refusalOf(t, rec)
			if !got.Upgrade || got.Feature != "ai_insights" || got.Reason != tc.want {
				t.Fatalf("body = %s, want upgrade_required, feature ai_insights, reason %s", rec.Body, tc.want)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// Fail closed — the rule that overrides everything
// ---------------------------------------------------------------------------

func TestSubscriptionLookupErrorFailsClosed(t *testing.T) {
	mux, reached := serve(t, &fakeSubs{err: errors.New("db down")}, defaultCfg())
	rec := do(t, mux, "GET", "/api/ai/insights", "user_x")

	if *reached {
		t.Fatal("FAILED OPEN: handler ran while entitlement was unverifiable")
	}
	// 503, not 402: the user may well be a paying subscriber — we could not
	// check, so we must not claim they need to pay.
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
}

func TestMissingIdentityFailsClosed(t *testing.T) {
	// Defence in depth: the auth middleware should already have rejected this.
	mux, reached := serve(t, subscribed(), defaultCfg())
	rec := do(t, mux, "GET", "/api/ai/insights", "") // no user in context
	if *reached {
		t.Fatal("FAILED OPEN: gated handler ran with no authenticated identity")
	}
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestNilStoreFailsClosed(t *testing.T) {
	// A misconfigured gate (no store wired) must deny, not wave everyone through.
	mux, reached := serve(t, nil, defaultCfg())
	if rec := do(t, mux, "GET", "/api/ai/insights", "u1"); rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	if *reached {
		t.Fatal("FAILED OPEN: misconfigured gate allowed a paid route")
	}
}

// ---------------------------------------------------------------------------
// Kill switch
// ---------------------------------------------------------------------------

func TestEnforceFalseOpensEverything(t *testing.T) {
	cfg := entitlement.Config{Enforce: false}
	subs := &fakeSubs{}
	mux, _ := serve(t, subs, cfg)
	for _, p := range []string{"/api/ai/insights", "/api/scan/pipeline", "/api/food/logs"} {
		if rec := do(t, mux, "POST", p, "u1"); rec.Code != http.StatusOK {
			t.Errorf("%s: status = %d, want 200 with enforcement off", p, rec.Code)
		}
	}
	if subs.calls != 0 {
		t.Error("subscription consulted while enforcement is off")
	}
}
