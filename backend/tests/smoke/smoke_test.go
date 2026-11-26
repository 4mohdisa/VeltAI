// Smoke test: the auth.Middleware contract on one guarded handler. A missing,
// non-bearer or invalid token is rejected with 401 before the handler runs, and
// a valid token passes through. Which routes sit behind the middleware is
// checked against the real server by the route table in
// tests/authz_routes_test.go, the single route list.
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

// guarded is a 200-handler wrapped in the real auth middleware.
func guarded() http.Handler {
	ok := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	return auth.Middleware(fakeVerifier{})(ok)
}

func TestMiddlewareTokenContract(t *testing.T) {
	h := guarded()
	cases := []struct {
		name, header string
		want         int
	}{
		{"no token", "", http.StatusUnauthorized},
		{"non-bearer scheme", "Token valid", http.StatusUnauthorized},
		{"invalid bearer", "Bearer nope", http.StatusUnauthorized},
		{"valid bearer passes the middleware", "Bearer valid", http.StatusOK},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/profile", nil)
			if tc.header != "" {
				req.Header.Set("Authorization", tc.header)
			}
			w := httptest.NewRecorder()
			h.ServeHTTP(w, req)
			if w.Code != tc.want {
				t.Errorf("%s = %d, want %d", tc.name, w.Code, tc.want)
			}
		})
	}
}
