package foodtests

// Row 16 step 2: ownership of the food routes that take an {id}, against a REAL
// Postgres and through the real auth.Middleware. User B sends a token signed
// with a key generated here and must be refused on every one of user A's ids,
// and user A's rows must read back unchanged afterwards.
//
// Skipped unless LUME_TEST_DATABASE_URL is set — see days_pg_test.go.

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
	"lume/backend/internal/food"
)

const unknownLogID = "00000000-0000-0000-0000-000000000000"

// seedOwner creates a profile with an example.test email and removes it, and
// everything that cascades from it, when the test ends.
func seedOwner(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id, email) VALUES ($1, $1 || '@example.test')
		ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	return id
}

// signedTokens returns the real auth middleware around h, verifying RS256
// tokens against a key generated for this test, and a signer for user ids.
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

func TestPG_FoodRoutesRefuseAnotherUsersIDs(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	a := seedOwner(t, pool, fmt.Sprintf("owner_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("owner_b_%d", os.Getpid()))
	logID := seedMealLog(t, pool, a, "lunch")
	saved, err := store.CreateSaved(ctx, food.SavedFood{UserID: a, FoodName: "Protein Bar", Calories: 200})
	if err != nil {
		t.Fatalf("seed saved food: %v", err)
	}
	h, sign := signedTokens(t, newMux(store, nil))

	send := func(method, path, user, body string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+sign(user))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
	snapshot := func() string {
		t.Helper()
		var meal, name string
		var cal float64
		var savedRows int
		if err := pool.QueryRow(ctx, `SELECT meal_type, food_name, calories FROM food_logs WHERE id::text = $1`, logID).
			Scan(&meal, &name, &cal); err != nil {
			t.Fatalf("read log back: %v", err)
		}
		if err := pool.QueryRow(ctx, `SELECT count(*) FROM saved_foods WHERE id::text = $1 AND user_id = $2`, saved.ID, a).
			Scan(&savedRows); err != nil {
			t.Fatalf("read saved food back: %v", err)
		}
		return fmt.Sprintf("%s|%s|%v|%d", meal, name, cal, savedRows)
	}

	// The token path works: user A reads their own log.
	if rec := send(http.MethodGet, "/api/food/logs/"+logID, a, ""); rec.Code != http.StatusOK {
		t.Fatalf("owner GET = %d, want 200 (body %s)", rec.Code, rec.Body.String())
	}
	before := snapshot()

	cases := []struct {
		name, method, path, body string
		want                     int
	}{
		{"read A's log", http.MethodGet, "/api/food/logs/" + logID, "", http.StatusForbidden},
		{"edit A's log", http.MethodPatch, "/api/food/logs/" + logID, `{"food_name":"Hijacked","calories":1}`, http.StatusForbidden},
		{"delete A's log", http.MethodDelete, "/api/food/logs/" + logID, "", http.StatusForbidden},
		{"delete A's saved food", http.MethodDelete, "/api/food/saved/" + saved.ID, "", http.StatusForbidden},
		{"read an unknown log", http.MethodGet, "/api/food/logs/" + unknownLogID, "", http.StatusNotFound},
		{"edit an unknown log", http.MethodPatch, "/api/food/logs/" + unknownLogID, `{"calories":1}`, http.StatusNotFound},
		{"delete an unknown saved food", http.MethodDelete, "/api/food/saved/" + unknownLogID, "", http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if rec := send(tc.method, tc.path, b, tc.body); rec.Code != tc.want {
				t.Fatalf("user B %s %s = %d, want %d (body %s)", tc.method, tc.path, rec.Code, tc.want, rec.Body.String())
			}
			if after := snapshot(); after != before {
				t.Fatalf("user A's rows changed: %s, was %s", after, before)
			}
		})
	}
}
