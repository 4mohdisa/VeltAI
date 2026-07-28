// Package entitlement enforces the free/Pro split SERVER-SIDE.
//
// The client also knows about the split (it shows the paywall), but a
// client-only gate is bypassable by anyone holding a valid token, so this is
// the real control. It is deliberately implemented as ONE policy table wrapping
// the authenticated mux rather than scattered checks inside feature packages:
// the whole gating surface is auditable in a single file, and a new route is
// free by default (add it here to gate it).
//
// The split:
//
//	FREE      manual + search + barcode logging, all gym features, your own
//	          data, dashboards, energy balance, export, account management,
//	          account deletion, and up to LUMO_FREE_SCANS_PER_DAY AI scans/day.
//	PRO       unlimited AI scans, AI insights / morning brief / Ask-Lumo /
//	          brain rebuild, and the Strava/WHOOP integrations.
//
// Anything with real marginal cost (a Gemini or Anthropic call) or real depth
// is gated. Nothing a user needs to control their own account or get their data
// out is ever gated — that is both an Apple requirement and the right thing.
package entitlement

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/httpx"
)

// Requirement is what a route demands of the caller.
type Requirement int

const (
	// Free is the default for any route not listed in the policy table.
	Free Requirement = iota
	// Pro requires an active subscription (or trial).
	Pro
	// ScanQuota allows Pro through unconditionally, and free users up to the
	// configured number of AI scans per day.
	ScanQuota
)

// SubStore reports whether a user currently has an active entitlement.
// Implemented by the subscription package.
type SubStore interface {
	IsActive(ctx context.Context, userID string) (bool, error)
}

// ScanCounter counts a user's AI scans in the current server-calendar day.
type ScanCounter interface {
	CountScansToday(ctx context.Context, userID string) (int, error)
}

// Config is env-tunable so free-tier generosity can change without a redeploy.
type Config struct {
	// FreeScansPerDay is the number of AI scans a non-subscriber may run per
	// day. 0 means "no free scans"; a negative value means unlimited (used to
	// disable the quota without disabling Pro gating).
	FreeScansPerDay int
	// Enforce is the master switch. Default true. Set LUMO_GATING_ENABLED=false
	// only to deliberately open everything (e.g. a promo period).
	Enforce bool
}

// LoadConfig reads the tunables from the environment.
func LoadConfig() Config {
	return Config{
		FreeScansPerDay: config.EnvInt("LUMO_FREE_SCANS_PER_DAY", 3),
		Enforce:         config.EnvBool("LUMO_GATING_ENABLED", true),
	}
}

// Gate applies the policy table to the authenticated API mux.
type Gate struct {
	subs    SubStore
	scans   ScanCounter
	cfg     Config
	policy  func(method, path string) Requirement
	nowUser func(*http.Request) string
}

// New builds a Gate. A nil subs or scans store disables the corresponding
// check (used by hermetic tests that mount routes without a DB).
func New(subs SubStore, scans ScanCounter, cfg Config) *Gate {
	return &Gate{subs: subs, scans: scans, cfg: cfg, policy: PolicyFor, nowUser: func(r *http.Request) string {
		return auth.UserID(r.Context())
	}}
}

// PolicyFor maps a request to its requirement. Exported so the policy is
// directly testable, and so the full gated surface is greppable.
//
// Paths carry the {provider}/{id} path values already substituted, so match on
// prefixes where a route is parameterised.
func PolicyFor(method, path string) Requirement {
	switch {
	// --- Paid AI: Gemini per scan -------------------------------------------
	case method == http.MethodPost && (path == "/api/scan" || path == "/api/scan/pipeline" || path == "/api/scan/label"):
		return ScanQuota

	// --- Paid AI: Anthropic per call ----------------------------------------
	case method == http.MethodGet && (path == "/api/ai/insights" || path == "/api/ai/morning-brief"):
		return Pro
	case method == http.MethodPost && (path == "/api/ai/query" || path == "/api/ai/brain/rebuild"):
		return Pro

	// --- Integrations: connecting and syncing are Pro; listing and
	//     disconnecting stay FREE so a lapsed subscriber can always see and
	//     revoke their connections. ------------------------------------------
	case method == http.MethodGet && strings.HasPrefix(path, "/api/integrations/") && strings.HasSuffix(path, "/connect"):
		return Pro
	case method == http.MethodPost && strings.HasPrefix(path, "/api/integrations/") && strings.HasSuffix(path, "/sync"):
		return Pro
	}
	return Free
}

// upgradeBody is the shape the client keys off to present the paywall.
type upgradeBody struct {
	Message  string `json:"message"`
	Upgrade  bool   `json:"upgrade_required"`
	Feature  string `json:"feature"`
	Limit    int    `json:"limit,omitempty"`
	Interval string `json:"interval,omitempty"`
}

// Middleware enforces the policy. It runs INSIDE the authenticated mux, so the
// caller's identity is already verified; it never reads a user id from input.
func (g *Gate) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		req := g.policy(r.Method, r.URL.Path)
		if req == Free || !g.cfg.Enforce {
			next.ServeHTTP(w, r)
			return
		}
		userID := g.nowUser(r)
		if userID == "" {
			// Defence in depth: the auth middleware should have rejected this
			// already. Fail CLOSED rather than treat it as a free user.
			httpx.Error(w, http.StatusUnauthorized, "unauthenticated")
			return
		}

		active, err := g.isActive(r.Context(), userID)
		if err != nil {
			// Fail closed: an unverifiable entitlement is not an entitlement.
			// 503 (not 402) because the user may well be a paying subscriber —
			// we could not check, so we must not claim they need to pay.
			httpx.Error(w, http.StatusServiceUnavailable, "could not verify your subscription — try again shortly")
			return
		}
		if active {
			next.ServeHTTP(w, r)
			return
		}

		if req == Pro {
			httpx.JSONError(w, http.StatusPaymentRequired, upgradeBody{
				Message: "This feature is part of Lumo Pro.",
				Upgrade: true,
				Feature: featureName(r.URL.Path),
			})
			return
		}

		// ScanQuota: free users get a daily allowance.
		if g.cfg.FreeScansPerDay < 0 {
			next.ServeHTTP(w, r)
			return
		}
		used, err := g.countScans(r.Context(), userID)
		if err != nil {
			httpx.Error(w, http.StatusServiceUnavailable, "could not check your scan allowance — try again shortly")
			return
		}
		if used >= g.cfg.FreeScansPerDay {
			httpx.JSONError(w, http.StatusPaymentRequired, upgradeBody{
				Message:  "You've used all your free scans for today. Lumo Pro has unlimited scanning.",
				Upgrade:  true,
				Feature:  "ai_scan",
				Limit:    g.cfg.FreeScansPerDay,
				Interval: "day",
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (g *Gate) isActive(ctx context.Context, userID string) (bool, error) {
	if g.subs == nil {
		return false, errors.New("no subscription store configured")
	}
	return g.subs.IsActive(ctx, userID)
}

func (g *Gate) countScans(ctx context.Context, userID string) (int, error) {
	if g.scans == nil {
		return 0, errors.New("no scan counter configured")
	}
	return g.scans.CountScansToday(ctx, userID)
}

func featureName(path string) string {
	switch {
	case strings.HasPrefix(path, "/api/scan"):
		return "ai_scan"
	case strings.HasPrefix(path, "/api/ai"):
		return "ai_insights"
	case strings.HasPrefix(path, "/api/integrations"):
		return "integrations"
	}
	return "pro"
}
