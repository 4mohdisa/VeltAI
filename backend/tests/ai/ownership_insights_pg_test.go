package aitests

// Row 16 step 2: ownership of POST /api/ai/insights/{id}/dismiss, against a
// REAL Postgres and through the real auth.Middleware. Insights have no create
// route (the brain rebuild writes them), so user A's row is inserted with SQL.
// User B sends a token signed with a key generated here and must get 403 on
// A's id and 404 on an unknown id, with A's row unchanged; A's own dismiss
// succeeds; no token is the 401 error envelope.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied (see tests/food/days_pg_test.go for the setup).

import (
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

	"lume/backend/internal/ai"
	"lume/backend/internal/auth"
)

const unknownID = "00000000-0000-0000-0000-000000000000"

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

func TestPG_InsightDismissRefusesAnotherUsersID(t *testing.T) {
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
	a := seedOwner(t, pool, fmt.Sprintf("insight_owner_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("insight_owner_b_%d", os.Getpid()))

	var insightID string
	if err := pool.QueryRow(ctx, `INSERT INTO ai_insights (user_id, type, title, body)
		VALUES ($1, 'pattern', 'Late dinners', 'You often eat after 9pm.') RETURNING id::text`, a).
		Scan(&insightID); err != nil {
		t.Fatalf("seed insight: %v", err)
	}

	mux := http.NewServeMux()
	ai.NewService(ai.NewPGStore(pool), &fakeLLM{}, testQuota(time.Now)).Routes(mux)
	h, sign := signedTokens(t, mux)
	dismiss := func(id, user string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(http.MethodPost, "/api/ai/insights/"+id+"/dismiss", nil)
		if user != "" {
			req.Header.Set("Authorization", "Bearer "+sign(user))
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(ctx, `SELECT concat_ws('|', user_id, type, title, body, dismissed) FROM ai_insights
			WHERE id::text = $1`, insightID).Scan(&s); err != nil {
			t.Fatalf("read A's insight back: %v", err)
		}
		return s
	}
	before := snapshot()

	t.Run("no token is the 401 error envelope", func(t *testing.T) {
		rec := dismiss(insightID, "")
		var env struct {
			Data  json.RawMessage `json:"data"`
			Error *string         `json:"error"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
			t.Fatalf("decode envelope: %v (body %s)", err, rec.Body.String())
		}
		if rec.Code != http.StatusUnauthorized || string(env.Data) != "null" || env.Error == nil || *env.Error != "missing bearer token" {
			t.Fatalf("no token = %d %s, want 401 data=null error=\"missing bearer token\"", rec.Code, rec.Body.String())
		}
		if after := snapshot(); after != before {
			t.Fatalf("user A's insight changed: %s, was %s", after, before)
		}
	})

	cases := []struct {
		name, id string
		want     int
	}{
		{"user B dismissing A's insight", insightID, http.StatusForbidden},
		{"user B dismissing an unknown insight", unknownID, http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if rec := dismiss(tc.id, b); rec.Code != tc.want {
				t.Fatalf("user B dismiss %s = %d, want %d (body %s)", tc.id, rec.Code, tc.want, rec.Body.String())
			}
			if after := snapshot(); after != before {
				t.Fatalf("user A's insight changed: %s, was %s", after, before)
			}
		})
	}

	t.Run("user A dismisses their own insight", func(t *testing.T) {
		if rec := dismiss(insightID, a); rec.Code != http.StatusOK || !dataOf[map[string]bool](t, rec)["dismissed"] {
			t.Fatalf("owner dismiss = %d, want 200 dismissed=true (body %s)", rec.Code, rec.Body.String())
		}
		var dismissed bool
		if err := pool.QueryRow(ctx, `SELECT dismissed FROM ai_insights WHERE id::text = $1`, insightID).
			Scan(&dismissed); err != nil {
			t.Fatalf("read dismissed: %v", err)
		}
		if !dismissed {
			t.Fatal("owner dismiss returned 200 but the row is not marked dismissed")
		}
	})
}
