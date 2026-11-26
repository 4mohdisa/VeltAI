// Package entitlement enforces the subscription SERVER-SIDE.
//
// The client also knows about the subscription (it shows the paywall), but a
// client-only gate is bypassable by anyone holding a valid token, so this is
// the real control. It is deliberately implemented as ONE policy table wrapping
// the authenticated mux rather than scattered checks inside feature packages:
// the whole public surface is auditable in a single file, and a new route is
// gated by default (add it here to make it public).
//
// There is no free tier. Every feature route requires a trial or an active
// subscription. Public, so a user can always manage their account and get
// their data out (an Apple requirement and the right thing):
//
//	webhooks and the OAuth callback, subscription status, AI consent read and
//	withdraw, revoking an integration, removing a push token, data export,
//	account deletion and feedback.
package entitlement

import (
	"context"
	"net/http"
	"strings"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/httpx"
)

// Requirement is what a route demands of the caller.
type Requirement int

const (
	// Free routes are the named public surface in PolicyFor.
	Free Requirement = iota
	// Pro requires a trial or an active subscription. It is the default.
	Pro
)

// SubStore reads a user's stored subscription state and its expiry. A user
// with no subscription returns an empty state and no error. Implemented by the
// subscription package.
type SubStore interface {
	Entitlement(ctx context.Context, userID string) (state string, expiresAt *time.Time, err error)
}

// Config is env-tunable.
type Config struct {
	// Enforce is the master switch. Default true. Set LUME_GATING_ENABLED=false
	// only to deliberately open everything (e.g. a promo period).
	Enforce bool
}

// LoadConfig reads the tunables from the environment.
func LoadConfig() Config {
	return Config{Enforce: config.EnvBool("LUME_GATING_ENABLED", true)}
}

// Gate applies the policy table to the authenticated API mux.
type Gate struct {
	subs    SubStore
	cfg     Config
	now     func() time.Time
	nowUser func(*http.Request) string
}

// New builds a Gate. A nil subs store refuses every gated route.
func New(subs SubStore, cfg Config) *Gate {
	return &Gate{subs: subs, cfg: cfg, now: time.Now, nowUser: func(r *http.Request) string {
		return auth.UserID(r.Context())
	}}
}

// publicRoutes is the whole public surface, keyed "METHOD path".
var publicRoutes = map[string]bool{
	"GET /api/subscription":  true,
	"GET /api/ai/consent":    true,
	"DELETE /api/ai/consent": true,
	"GET /api/export":        true,
	"DELETE /api/profile":    true,
	"POST /api/feedback":     true,
	// Removing a push token stops push to that device, so a lapsed subscriber
	// can always do it. Registering one (POST) stays gated.
	"DELETE /api/push/token": true,
}

// PolicyFor maps a request to its requirement. Exported so the policy is
// directly testable, and so the full public surface is greppable.
//
// Paths carry the {provider}/{id} path values already substituted, so match on
// prefixes where a route is parameterised.
func PolicyFor(method, path string) Requirement {
	switch {
	case publicRoutes[method+" "+path]:
		return Free
	// Registered on the root mux, outside the gate: signature-checked webhooks
	// and the OAuth callback, which carries no Clerk token.
	case method == http.MethodPost && strings.HasPrefix(path, "/api/webhooks/"):
		return Free
	case method == http.MethodGet && strings.HasPrefix(path, "/api/integrations/") && strings.HasSuffix(path, "/callback"):
		return Free
	// Revoking a third-party connection is withdrawing consent, so a lapsed
	// subscriber can always do it.
	case method == http.MethodDelete && strings.HasPrefix(path, "/api/integrations/") && strings.Count(path, "/") == 3:
		return Free
	}
	return Pro
}

// upgradeBody is the shape the client keys off to present the paywall.
type upgradeBody struct {
	Message string `json:"message"`
	Upgrade bool   `json:"upgrade_required"`
	Feature string `json:"feature"`
	Reason  string `json:"reason"`
}

// Middleware enforces the policy. It runs INSIDE the authenticated mux, so the
// caller's identity is already verified; it never reads a user id from input.
func (g *Gate) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if PolicyFor(r.Method, r.URL.Path) == Free || !g.cfg.Enforce {
			next.ServeHTTP(w, r)
			return
		}
		userID := g.nowUser(r)
		if userID == "" {
			// Defence in depth: the auth middleware should have rejected this
			// already. Fail CLOSED rather than treat it as a subscriber.
			httpx.Error(w, http.StatusUnauthorized, "unauthenticated")
			return
		}
		if g.subs == nil {
			httpx.Error(w, http.StatusServiceUnavailable, "could not verify your subscription — try again shortly")
			return
		}
		state, expiresAt, err := g.subs.Entitlement(r.Context(), userID)
		if err != nil {
			// Fail closed: an unverifiable entitlement is not an entitlement.
			// 503 (not 402) because the user may well be a paying subscriber —
			// we could not check, so we must not claim they need to pay.
			httpx.Error(w, http.StatusServiceUnavailable, "could not verify your subscription — try again shortly")
			return
		}
		if Grants(state, expiresAt, g.now()) {
			next.ServeHTTP(w, r)
			return
		}
		httpx.JSONError(w, http.StatusPaymentRequired, upgradeBody{
			Message: "This feature is part of Lume Pro.",
			Upgrade: true,
			Feature: featureName(r.URL.Path),
			Reason:  RefusalReason(state),
		})
	})
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
