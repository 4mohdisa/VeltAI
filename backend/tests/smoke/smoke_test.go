// Smoke test: every /api route sits behind auth.Middleware, so an unauthenticated
// request is rejected with 401 before any handler runs, and a valid token passes
// through. The middleware wraps the whole api mux uniformly (see main.go), so this
// proves the security contract for the entire surface with one guarded handler.
// (Per-handler behaviour — 400/404/403 — is covered by each package's own tests.)
package smoketests

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"lume/backend/internal/auth"
)

type fakeVerifier struct{}

func (fakeVerifier) Verify(_ context.Context, token string) (string, error) {
	if token == "valid" {
		return "u1", nil
	}
	return "", errors.New("invalid token")
}

// Every authenticated route registered across the packages (mirrors main.go).
// Backend-only routes (webhooks, OAuth callback, /health) are intentionally
// excluded — they are not behind auth.Middleware.
var routes = []struct{ method, path string }{
	{"GET", "/api/profile"},
	{"PATCH", "/api/profile"},
	{"DELETE", "/api/profile"},
	{"GET", "/api/onboarding"},
	{"POST", "/api/onboarding"},
	{"GET", "/api/goals"},
	{"PUT", "/api/goals"},
	{"GET", "/api/body-weight"},
	{"POST", "/api/body-weight"},
	{"DELETE", "/api/body-weight/abc"},
	{"GET", "/api/food/logs"},
	{"POST", "/api/food/logs"},
	{"GET", "/api/food/logs/abc"},
	{"PATCH", "/api/food/logs/abc"},
	{"DELETE", "/api/food/logs/abc"},
	{"GET", "/api/food/summary"},
	{"GET", "/api/food/days"},
	{"POST", "/api/food/quick-add"},
	{"GET", "/api/food/search"},
	{"GET", "/api/food/saved"},
	{"GET", "/api/gym/sessions"},
	{"POST", "/api/gym/sessions"},
	{"POST", "/api/gym/sessions/abc/complete"},
	{"GET", "/api/gym/streak"},
	{"GET", "/api/gym/exercises"},
	{"GET", "/api/gym/exercises/abc"},
	{"GET", "/api/gym/templates"},
	{"POST", "/api/gym/templates"},
	{"GET", "/api/gym/schedule"},
	{"PUT", "/api/gym/schedule/1"},
	{"GET", "/api/gym/today"},
	{"GET", "/api/gym/patterns"},
	{"GET", "/api/gym/progress/Bench"},
	{"GET", "/api/energy-balance"},
	{"GET", "/api/energy-balance/week"},
	{"GET", "/api/integrations"},
	{"GET", "/api/integrations/strava/connect"},
	{"POST", "/api/integrations/strava/sync"},
	{"DELETE", "/api/integrations/strava"},
	{"POST", "/api/scan"},
	{"POST", "/api/scan/pipeline"},
	{"POST", "/api/scan/label"},
	{"GET", "/api/scan/calibration"},
	{"GET", "/api/recipes"},
	{"GET", "/api/saved-meals"},
	{"GET", "/api/subscription"},
	{"GET", "/api/ai/brain"},
	{"POST", "/api/ai/query"},
	{"GET", "/api/ai/morning-brief"},
	{"GET", "/api/ai/insights"},
}

// guarded is a 200-handler wrapped in the real auth middleware.
func guarded() http.Handler {
	ok := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	return auth.Middleware(fakeVerifier{})(ok)
}

func TestEveryRouteRequiresAuth(t *testing.T) {
	h := guarded()
	for _, r := range routes {
		req := httptest.NewRequest(r.method, r.path, nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("%s %s without token = %d, want 401", r.method, r.path, w.Code)
		}
	}
}

func TestValidTokenPasses(t *testing.T) {
	h := guarded()
	for _, r := range routes {
		req := httptest.NewRequest(r.method, r.path, nil)
		req.Header.Set("Authorization", "Bearer valid")
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("%s %s with valid token = %d, want 200 (passed middleware)", r.method, r.path, w.Code)
		}
	}
}

func TestMalformedAndMissingToken(t *testing.T) {
	h := guarded()
	// No "Bearer " prefix.
	req := httptest.NewRequest("GET", "/api/profile", nil)
	req.Header.Set("Authorization", "Token valid")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("non-bearer scheme = %d, want 401", w.Code)
	}
	// Bearer with an invalid token.
	req = httptest.NewRequest("GET", "/api/profile", nil)
	req.Header.Set("Authorization", "Bearer nope")
	w = httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("invalid bearer = %d, want 401", w.Code)
	}
}
