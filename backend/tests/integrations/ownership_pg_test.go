package integrationstests

// Row 16 steps 2 and 3 for the integration routes, which take a provider name,
// not a row id: GET /api/integrations/{provider}/connect, POST
// /api/integrations/{provider}/sync and DELETE /api/integrations/{provider},
// against a REAL Postgres and through the real auth.Middleware. User A is
// connected to a fake Strava through the real connect and callback flow; user
// B's calls must never read, refresh, sync or remove A's connection. No token
// is the 401 error envelope and an unknown provider is the handler's 404.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied (see tests/food/days_pg_test.go for the setup).

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
	"lume/backend/internal/integrations"
)

// seedOwner creates a profile with an example.test email and removes it, and
// everything that cascades from it, when the test ends.
// Copied from tests/food/ownership_pg_test.go until the shared test helper
// package is approved.
func seedOwner(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	if _, err := pool.Exec(context.Background(), `INSERT INTO profiles (id, email) VALUES ($1, $1 || '@example.test')
		ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	return id
}

// signedTokens returns the real auth middleware around h, verifying RS256
// tokens against a key generated for this test, and a signer for user ids.
// Copied from tests/food/ownership_pg_test.go until the shared test helper
// package is approved.
func signedTokens(t *testing.T, h http.Handler) (http.Handler, func(userID string) string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	verifier := &auth.JWTVerifier{Keyfunc: func(*jwt.Token) (any, error) { return &key.PublicKey, nil }}
	sign := func(userID string) string {
		s, err := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
			"sub": userID, "exp": time.Now().Add(time.Hour).Unix(),
		}).SignedString(key)
		if err != nil {
			t.Fatalf("sign token: %v", err)
		}
		return s
	}
	return auth.Middleware(verifier)(h), sign
}

// wantErrorEnvelope fails unless rec is status with data null and an error
// string: exactly wantError, or any non-empty one when wantError is "".
// Same check as tests/food/validation_pg_test.go until the shared test helper
// package is approved.
func wantErrorEnvelope(t *testing.T, rec *httptest.ResponseRecorder, status int, wantError string) {
	t.Helper()
	var env struct {
		Data  json.RawMessage `json:"data"`
		Error *string         `json:"error"`
	}
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&env); err != nil {
		t.Fatalf("body is not the error envelope: %v (body %s)", err, rec.Body.String())
	}
	if rec.Code != status || string(env.Data) != "null" || env.Error == nil || *env.Error == "" ||
		(wantError != "" && *env.Error != wantError) {
		t.Fatalf("got %d %s, want %d with data null and error %q", rec.Code, rec.Body.String(), status, wantError)
	}
}

func TestPG_IntegrationRoutesKeepEachUsersConnection(t *testing.T) {
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	a := seedOwner(t, pool, fmt.Sprintf("integration_owner_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("integration_owner_b_%d", os.Getpid()))
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM oauth_states WHERE user_id IN ($1, $2)`, a, b)
	})

	cipher, err := integrations.NewCipher(testKey())
	if err != nil {
		t.Fatalf("cipher: %v", err)
	}
	provider := strava(true)
	svc := integrations.NewService(integrations.NewPGStore(pool), cipher, provider)

	// User A connects through the real connect and public callback routes.
	plain := serve(svc)
	state := stateFromConnect(t, plain, a, "strava")
	if w := do(t, plain, "", http.MethodGet, "/api/integrations/strava/callback?code=c&state="+state); w.Code != http.StatusFound {
		t.Fatalf("callback = %d, want 302 (body %s)", w.Code, w.Body.String())
	}

	h, sign := signedTokens(t, plain)
	send := func(method, path, user string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, path, nil)
		if user != "" {
			req.Header.Set("Authorization", "Bearer "+sign(user))
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
	connected := func(user string) bool {
		t.Helper()
		rec := send(http.MethodGet, "/api/integrations", user)
		if rec.Code != http.StatusOK {
			t.Fatalf("list as %s = %d (body %s)", user, rec.Code, rec.Body.String())
		}
		for _, st := range decode[[]integrations.ConnectionStatus](t, rec) {
			if st.Provider == "strava" {
				return st.Connected
			}
		}
		return false
	}
	// The token path works: A sees the connection and B does not.
	if !connected(a) || connected(b) {
		t.Fatalf("strava connected: A=%v B=%v, want A=true B=false", connected(a), connected(b))
	}

	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(ctx, `SELECT concat_ws('|',
			(SELECT json_agg(c ORDER BY c.user_id, c.provider)::text FROM integration_connections c WHERE user_id IN ($1, $2)),
			(SELECT count(*) FROM gym_sessions WHERE user_id IN ($1, $2)))`, a, b).Scan(&s); err != nil {
			t.Fatalf("read rows back: %v", err)
		}
		return s
	}
	before := snapshot()

	cases := []struct {
		name, method, path, user string
		status                   int
		wantError                string
	}{
		{"connect, no token", http.MethodGet, "/api/integrations/strava/connect", "", http.StatusUnauthorized, "missing bearer token"},
		{"sync, no token", http.MethodPost, "/api/integrations/strava/sync", "", http.StatusUnauthorized, "missing bearer token"},
		{"disconnect, no token", http.MethodDelete, "/api/integrations/strava", "", http.StatusUnauthorized, "missing bearer token"},
		{"connect, unknown provider", http.MethodGet, "/api/integrations/garmin/connect", b, http.StatusNotFound, "unknown provider"},
		{"sync, unknown provider", http.MethodPost, "/api/integrations/garmin/sync", b, http.StatusNotFound, "unknown provider"},
		{"disconnect, unknown provider", http.MethodDelete, "/api/integrations/garmin", b, http.StatusNotFound, "unknown provider"},
		{"user B syncs strava", http.MethodPost, "/api/integrations/strava/sync", b, http.StatusBadRequest, "not connected to strava"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantErrorEnvelope(t, send(tc.method, tc.path, tc.user), tc.status, tc.wantError)
			if after := snapshot(); after != before {
				t.Fatalf("rows changed: %s, was %s", after, before)
			}
		})
	}

	t.Run("user B disconnects strava and removes nothing", func(t *testing.T) {
		rec := send(http.MethodDelete, "/api/integrations/strava", b)
		if rec.Code != http.StatusOK || decode[map[string]bool](t, rec)["disconnected"] {
			t.Fatalf("user B disconnect = %d %s, want 200 disconnected=false", rec.Code, rec.Body.String())
		}
		if after := snapshot(); after != before {
			t.Fatalf("rows changed: %s, was %s", after, before)
		}
	})

	if provider.lastAccess != "" || provider.refreshCalls != 0 {
		t.Fatalf("provider used a token for user B: lastAccess=%q refreshCalls=%d", provider.lastAccess, provider.refreshCalls)
	}
	if !connected(a) {
		t.Fatal("user A lost the strava connection")
	}
}
