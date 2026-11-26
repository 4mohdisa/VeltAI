package goalstests

// Row 16 step 2: ownership of DELETE /api/body-weight/{id}, the only goals
// route that takes a user-owned {id}, against a REAL Postgres and through the
// real auth.Middleware. User B sends a token signed with a key generated here
// and must get 403 on user A's id and 404 on an unknown id, and user A's entry
// must read back unchanged afterwards.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied.

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
	"lume/backend/internal/goals"
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

func TestPG_BodyWeightRoutesRefuseAnotherUsersIDs(t *testing.T) {
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
	a := seedOwner(t, pool, fmt.Sprintf("bw_owner_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("bw_owner_b_%d", os.Getpid()))
	mux := http.NewServeMux()
	goals.Register(mux, goals.NewPGStore(pool))
	h, sign := signedTokens(t, mux)

	send := func(method, path, user, body string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+sign(user))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
	listIDs := func(user string) []string {
		t.Helper()
		rec := send(http.MethodGet, "/api/body-weight", user, "")
		if rec.Code != http.StatusOK {
			t.Fatalf("GET /api/body-weight as %s = %d, want 200 (body %s)", user, rec.Code, rec.Body.String())
		}
		var ids []string
		for _, bw := range decodeData[[]goals.BodyWeight](t, rec) {
			ids = append(ids, bw.ID)
		}
		return ids
	}

	rec := send(http.MethodPost, "/api/body-weight", a, `{"date":"2026-01-15","weight":72.5,"unit":"kg","notes":"morning"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create body weight = %d (body %s)", rec.Code, rec.Body.String())
	}
	entry := decodeData[goals.BodyWeight](t, rec)

	// The token path works: user A lists their own entry, and user B's list
	// does not include it.
	if ids := listIDs(a); len(ids) != 1 || ids[0] != entry.ID {
		t.Fatalf("owner list = %v, want [%s]", ids, entry.ID)
	}
	if ids := listIDs(b); len(ids) != 0 {
		t.Fatalf("user B list = %v, want none", ids)
	}

	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(ctx, `SELECT concat_ws('|', date, weight, unit, notes) FROM body_weight
			WHERE id::text = $1 AND user_id = $2`, entry.ID, a).Scan(&s); err != nil {
			t.Fatalf("read A's entry back: %v", err)
		}
		return s
	}
	before := snapshot()

	cases := []struct {
		name, path string
		want       int
	}{
		{"delete A's entry", "/api/body-weight/" + entry.ID, http.StatusForbidden},
		{"delete an unknown entry", "/api/body-weight/" + unknownID, http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if rec := send(http.MethodDelete, tc.path, b, ""); rec.Code != tc.want {
				t.Fatalf("user B DELETE %s = %d, want %d (body %s)", tc.path, rec.Code, tc.want, rec.Body.String())
			}
			if after := snapshot(); after != before {
				t.Fatalf("user A's entry changed: %s, was %s", after, before)
			}
		})
	}
}
