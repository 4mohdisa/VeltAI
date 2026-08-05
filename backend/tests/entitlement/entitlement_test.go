// Free/Pro gate — the SERVER-SIDE enforcement. A client-only gate is
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

	"lume/backend/internal/auth"
	"lume/backend/internal/entitlement"
)

type fakeSubs struct {
	active bool
	err    error
	calls  int
}

func (f *fakeSubs) IsActive(context.Context, string) (bool, error) {
	f.calls++
	return f.active, f.err
}

type fakeScans struct {
	count int
	err   error
}

func (f *fakeScans) CountScansToday(context.Context, string) (int, error) { return f.count, f.err }

// serve mounts a gate over a handler that records whether it was reached.
func serve(t *testing.T, subs entitlement.SubStore, scans entitlement.ScanCounter, cfg entitlement.Config) (*http.ServeMux, *bool) {
	t.Helper()
	reached := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		reached = true
		w.WriteHeader(http.StatusOK)
	})
	g := entitlement.New(subs, scans, cfg)
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
	return entitlement.Config{FreeScansPerDay: 3, Enforce: true}
}

// ---------------------------------------------------------------------------
// Policy table — the gated surface, asserted explicitly.
// ---------------------------------------------------------------------------

func TestPolicyTable(t *testing.T) {
	cases := []struct {
		method, path string
		want         entitlement.Requirement
	}{
		// Paid AI — gated.
		{"POST", "/api/scan", entitlement.ScanQuota},
		{"POST", "/api/scan/pipeline", entitlement.ScanQuota},
		{"POST", "/api/scan/label", entitlement.ScanQuota},
		{"GET", "/api/ai/insights", entitlement.Pro},
		{"GET", "/api/ai/morning-brief", entitlement.Pro},
		{"POST", "/api/ai/query", entitlement.Pro},
		{"POST", "/api/ai/brain/rebuild", entitlement.Pro},
		{"GET", "/api/integrations/strava/connect", entitlement.Pro},
		{"POST", "/api/integrations/whoop/sync", entitlement.Pro},

		// NEVER gated — these must stay free forever.
		{"POST", "/api/food/logs", entitlement.Free},       // manual logging
		{"GET", "/api/food/logs", entitlement.Free},        // your own data
		{"POST", "/api/food/quick-add", entitlement.Free},  // manual logging
		{"GET", "/api/food/search", entitlement.Free},      // no AI cost
		{"GET", "/api/food/barcode/123", entitlement.Free}, // DB lookup, no AI
		{"GET", "/api/export", entitlement.Free},           // GDPR access
		{"DELETE", "/api/profile", entitlement.Free},       // account deletion
		{"GET", "/api/profile", entitlement.Free},
		{"PATCH", "/api/profile", entitlement.Free},
		{"GET", "/api/subscription", entitlement.Free},
		{"GET", "/api/energy-balance", entitlement.Free},
		{"POST", "/api/gym/sessions", entitlement.Free}, // all gym is free
		{"GET", "/api/gym/streak", entitlement.Free},
		{"GET", "/api/ai/brain", entitlement.Free},               // a read of stored data, no LLM call
		{"GET", "/api/integrations", entitlement.Free},           // must always see connections
		{"DELETE", "/api/integrations/strava", entitlement.Free}, // must always be able to revoke
		{"POST", "/api/scan/confirm", entitlement.Free},          // persists an already-paid-for scan
		{"POST", "/api/scan/correction", entitlement.Free},       // learning signal, no LLM call
		{"GET", "/api/scan/calibration", entitlement.Free},       // your own data
	}
	for _, c := range cases {
		if got := entitlement.PolicyFor(c.method, c.path); got != c.want {
			t.Errorf("PolicyFor(%s %s) = %v, want %v", c.method, c.path, got, c.want)
		}
	}
}

// ---------------------------------------------------------------------------
// Pro-only routes
// ---------------------------------------------------------------------------

func TestProRouteDeniedForFreeUser(t *testing.T) {
	mux, reached := serve(t, &fakeSubs{active: false}, &fakeScans{}, defaultCfg())
	rec := do(t, mux, "GET", "/api/ai/insights", "user_free")

	if rec.Code != http.StatusPaymentRequired {
		t.Fatalf("status = %d, want 402", rec.Code)
	}
	if *reached {
		t.Fatal("handler ran despite the gate denying — no paid API call may happen")
	}
	var env struct {
		Error struct {
			Upgrade bool   `json:"upgrade_required"`
			Feature string `json:"feature"`
		} `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v (body %s)", err, rec.Body)
	}
	if !env.Error.Upgrade || env.Error.Feature != "ai_insights" {
		t.Errorf("body = %s, want upgrade_required + feature ai_insights", rec.Body)
	}
}

func TestProRouteAllowedForSubscriber(t *testing.T) {
	mux, reached := serve(t, &fakeSubs{active: true}, &fakeScans{}, defaultCfg())
	if rec := do(t, mux, "GET", "/api/ai/insights", "user_pro"); rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if !*reached {
		t.Fatal("subscriber was blocked")
	}
}

func TestFreeRouteNeverConsultsSubscription(t *testing.T) {
	subs := &fakeSubs{active: false}
	mux, reached := serve(t, subs, &fakeScans{}, defaultCfg())
	for _, p := range []string{"/api/food/logs", "/api/export", "/api/gym/sessions"} {
		if rec := do(t, mux, "POST", p, "user_free"); rec.Code != http.StatusOK {
			t.Errorf("%s: status = %d, want 200 (free route)", p, rec.Code)
		}
	}
	if !*reached {
		t.Fatal("free routes were blocked")
	}
	if subs.calls != 0 {
		t.Errorf("subscription checked %d times on free routes — wasted DB work", subs.calls)
	}
}

// ---------------------------------------------------------------------------
// Scan quota
// ---------------------------------------------------------------------------

func TestScanQuotaAllowsUnderLimitAndBlocksAt(t *testing.T) {
	for _, tc := range []struct {
		used, limit int
		wantCode    int
	}{
		{0, 3, http.StatusOK},
		{2, 3, http.StatusOK},
		{3, 3, http.StatusPaymentRequired}, // limit reached
		{9, 3, http.StatusPaymentRequired},
		{0, 0, http.StatusPaymentRequired}, // no free scans configured
	} {
		cfg := entitlement.Config{FreeScansPerDay: tc.limit, Enforce: true}
		mux, _ := serve(t, &fakeSubs{active: false}, &fakeScans{count: tc.used}, cfg)
		rec := do(t, mux, "POST", "/api/scan/pipeline", "user_free")
		if rec.Code != tc.wantCode {
			t.Errorf("used=%d limit=%d: status = %d, want %d", tc.used, tc.limit, rec.Code, tc.wantCode)
		}
	}
}

func TestScanQuotaIrrelevantForSubscriber(t *testing.T) {
	// A subscriber with 500 scans today still gets through: quota is free-tier only.
	mux, _ := serve(t, &fakeSubs{active: true}, &fakeScans{count: 500}, defaultCfg())
	if rec := do(t, mux, "POST", "/api/scan/pipeline", "user_pro"); rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 for subscriber", rec.Code)
	}
}

func TestScanQuotaNegativeLimitMeansUnlimited(t *testing.T) {
	cfg := entitlement.Config{FreeScansPerDay: -1, Enforce: true}
	mux, _ := serve(t, &fakeSubs{active: false}, &fakeScans{count: 9999}, cfg)
	if rec := do(t, mux, "POST", "/api/scan", "user_free"); rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (quota disabled)", rec.Code)
	}
}

// ---------------------------------------------------------------------------
// Fail closed — the rule that overrides everything
// ---------------------------------------------------------------------------

func TestSubscriptionLookupErrorFailsClosed(t *testing.T) {
	mux, reached := serve(t, &fakeSubs{err: errors.New("db down")}, &fakeScans{}, defaultCfg())
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

func TestScanCounterErrorFailsClosed(t *testing.T) {
	mux, reached := serve(t, &fakeSubs{active: false}, &fakeScans{err: errors.New("db down")}, defaultCfg())
	rec := do(t, mux, "POST", "/api/scan/pipeline", "user_x")
	if *reached {
		t.Fatal("FAILED OPEN: scan ran while the allowance was unverifiable")
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
}

func TestMissingIdentityFailsClosed(t *testing.T) {
	// Defence in depth: the auth middleware should already have rejected this.
	mux, reached := serve(t, &fakeSubs{active: true}, &fakeScans{}, defaultCfg())
	rec := do(t, mux, "GET", "/api/ai/insights", "") // no user in context
	if *reached {
		t.Fatal("FAILED OPEN: gated handler ran with no authenticated identity")
	}
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestNilStoresFailClosed(t *testing.T) {
	// A misconfigured gate (no stores wired) must deny, not wave everyone through.
	mux, reached := serve(t, nil, nil, defaultCfg())
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
	cfg := entitlement.Config{FreeScansPerDay: 0, Enforce: false}
	subs := &fakeSubs{active: false}
	mux, _ := serve(t, subs, &fakeScans{count: 100}, cfg)
	for _, p := range []string{"/api/ai/insights", "/api/scan/pipeline"} {
		if rec := do(t, mux, "POST", p, "u1"); rec.Code != http.StatusOK {
			t.Errorf("%s: status = %d, want 200 with enforcement off", p, rec.Code)
		}
	}
	if subs.calls != 0 {
		t.Error("subscription consulted while enforcement is off")
	}
}
