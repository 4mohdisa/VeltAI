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
	// Webhooks and the OAuth callback sit outside the authenticated mux.
	"POST /api/webhooks/clerk":                  true,
	"POST /api/webhooks/revenuecat":             true,
	"GET /api/integrations/{provider}/callback": true,

	// Account, consent, export and subscription status.
	"GET /api/profile":       true,
	"PATCH /api/profile":     true,
	"DELETE /api/profile":    true,
	"GET /api/export":        true,
	"GET /api/subscription":  true,
	"GET /api/ai/consent":    true,
	"POST /api/ai/consent":   true,
	"DELETE /api/ai/consent": true,

	// Onboarding, goals and body weight.
	"GET /api/onboarding":               true,
	"POST /api/onboarding":              true,
	"GET /api/onboarding/preferences":   true,
	"PATCH /api/onboarding/preferences": true,
	"GET /api/goals":                    true,
	"PUT /api/goals":                    true,
	"GET /api/body-weight":              true,
	"POST /api/body-weight":             true,
	"DELETE /api/body-weight/{id}":      true,
	"GET /api/energy-balance":           true,
	"GET /api/energy-balance/week":      true,

	// Manual food logging, search, barcode, saved foods, recipes and meals.
	"GET /api/food/logs":              true,
	"POST /api/food/logs":             true,
	"GET /api/food/logs/{id}":         true,
	"PATCH /api/food/logs/{id}":       true,
	"DELETE /api/food/logs/{id}":      true,
	"GET /api/food/summary":           true,
	"GET /api/food/days":              true,
	"GET /api/food/search":            true,
	"GET /api/food/barcode/{barcode}": true,
	"GET /api/food/saved":             true,
	"POST /api/food/saved":            true,
	"DELETE /api/food/saved/{id}":     true,
	"POST /api/food/quick-add":        true,
	"GET /api/food/portion-memory":    true,
	"GET /api/recipes":                true,
	"POST /api/recipes":               true,
	"GET /api/recipes/{id}":           true,
	"PATCH /api/recipes/{id}":         true,
	"DELETE /api/recipes/{id}":        true,
	"POST /api/recipes/{id}/log":      true,
	"GET /api/saved-meals":            true,
	"POST /api/saved-meals":           true,
	"POST /api/saved-meals/{id}/log":  true,
	"DELETE /api/saved-meals/{id}":    true,

	// Scan follow-ups that make no AI call.
	"POST /api/scan/confirm":           true,
	"POST /api/scan/correction":        true,
	"POST /api/scan/feedback":          true,
	"GET /api/scan/calibration":        true,
	"GET /api/scan/calibration-report": true,

	// Stored AI results that make no AI call.
	"GET /api/ai/brain":                  true,
	"POST /api/ai/insights/{id}/dismiss": true,

	// All gym features.
	"GET /api/gym/exercises":                  true,
	"GET /api/gym/exercises/{id}":             true,
	"PATCH /api/gym/exercises/{id}":           true,
	"DELETE /api/gym/exercises/{id}":          true,
	"GET /api/gym/last-logged/{exercise_id}":  true,
	"GET /api/gym/patterns":                   true,
	"GET /api/gym/progress/{exercise_name}":   true,
	"GET /api/gym/schedule":                   true,
	"PUT /api/gym/schedule":                   true,
	"PUT /api/gym/schedule/{day}":             true,
	"GET /api/gym/sessions":                   true,
	"POST /api/gym/sessions":                  true,
	"PATCH /api/gym/sessions/{id}":            true,
	"DELETE /api/gym/sessions/{id}":           true,
	"POST /api/gym/sessions/{id}/complete":    true,
	"POST /api/gym/sessions/{id}/exercises":   true,
	"GET /api/gym/streak":                     true,
	"POST /api/gym/streak/freeze":             true,
	"GET /api/gym/templates":                  true,
	"POST /api/gym/templates":                 true,
	"GET /api/gym/templates/{id}":             true,
	"PATCH /api/gym/templates/{id}":           true,
	"DELETE /api/gym/templates/{id}":          true,
	"POST /api/gym/templates/{id}/exercises":  true,
	"PATCH /api/gym/template-exercises/{id}":  true,
	"DELETE /api/gym/template-exercises/{id}": true,
	"GET /api/gym/today":                      true,
	"POST /api/gym/calories/preview":          true,

	// Integrations: listing and disconnecting stay free so a lapsed
	// subscriber can always see and revoke a connection.
	"GET /api/integrations":               true,
	"DELETE /api/integrations/{provider}": true,

	// Product analytics, feedback and test build reports.
	"POST /api/analytics/events": true,
	"POST /api/feedback":         true,
	"GET /api/debug-reports":     true,
	"POST /api/debug-reports":    true,
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
