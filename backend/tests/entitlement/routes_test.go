package entitlementtests

import (
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"lume/backend/internal/entitlement"
)

// publicRoutes are the routes that stay free on purpose. A new route must be
// gated in entitlement.PolicyFor or named here, or TestEveryRouteIsGatedOrPublic
// fails.
var publicRoutes = map[string]bool{
	// Auth and session: webhooks and the OAuth callback sit outside the
	// authenticated mux.
	"POST /api/webhooks/clerk":                  true,
	"POST /api/webhooks/revenuecat":             true,
	"POST /api/webhooks/apple/retention":        true,
	"GET /api/integrations/{provider}/callback": true,

	// Subscription status read, so the app can show the paywall.
	"GET /api/subscription": true,

	// Consent read and withdraw; revoking an integration withdraws consent
	// for that third party.
	"GET /api/ai/consent":                 true,
	"DELETE /api/ai/consent":              true,
	"DELETE /api/integrations/{provider}": true,

	// Data export, account deletion and feedback.
	"GET /api/export":     true,
	"DELETE /api/profile": true,
	"POST /api/feedback":  true,

	// Removing a push token stops push to that device.
	"DELETE /api/push/token": true,
}

var routePattern = regexp.MustCompile(`Handle(?:Func)?\("([A-Z]+) (/api/[^"]*)"`)
var pathValue = regexp.MustCompile(`\{[^}]+\}`)

// registeredRoutes reads every "METHOD /api/..." pattern registered in the
// backend source, so a new route is seen without editing this test.
func registeredRoutes(t *testing.T) map[string][2]string {
	t.Helper()
	routes := map[string][2]string{}
	for _, root := range []string{"../../internal", "../../cmd"} {
		err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
			if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
				return err
			}
			src, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			for _, m := range routePattern.FindAllStringSubmatch(string(src), -1) {
				routes[m[1]+" "+m[2]] = [2]string{m[1], m[2]}
			}
			return nil
		})
		if err != nil {
			t.Fatalf("walk %s: %v", root, err)
		}
	}
	if len(routes) == 0 {
		t.Fatal("found no registered routes; the source walk is broken")
	}
	return routes
}

func TestEveryRouteIsGatedOrPublic(t *testing.T) {
	routes := registeredRoutes(t)
	for key, r := range routes {
		gated := entitlement.PolicyFor(r[0], pathValue.ReplaceAllString(r[1], "x")) != entitlement.Free
		switch {
		case gated && publicRoutes[key]:
			t.Errorf("%s is gated but also named public; remove it from publicRoutes", key)
		case !gated && !publicRoutes[key]:
			t.Errorf("%s is neither gated in entitlement.PolicyFor nor named in publicRoutes", key)
		}
	}
	for key := range publicRoutes {
		if _, ok := routes[key]; !ok {
			t.Errorf("publicRoutes names %s, which is not registered", key)
		}
	}
}
