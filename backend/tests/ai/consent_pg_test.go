// DELETE /api/ai/consent (the Settings → Privacy withdraw switch) against a
// REAL Postgres, behind auth.Middleware as main.go mounts it: no token is a
// 401 that clears nothing, and a signed-in withdraw clears only that user's
// profiles.ai_consent_at. Skipped unless LUME_TEST_DATABASE_URL points at a
// disposable database with the migrations applied (see
// tests/food/days_pg_test.go for the setup).
package aitests

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/ai"
	"lume/backend/internal/auth"
)

// tokenIsUserVerifier accepts "Bearer user:<id>" as a signed-in <id>.
type tokenIsUserVerifier struct{}

func (tokenIsUserVerifier) Verify(_ context.Context, token string) (string, error) {
	if id, ok := strings.CutPrefix(token, "user:"); ok && id != "" {
		return id, nil
	}
	return "", errors.New("invalid token")
}

func TestPG_WithdrawConsentRoute(t *testing.T) {
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

	store := ai.NewPGStore(pool)
	mux := http.NewServeMux()
	ai.NewService(store, &fakeLLM{}, testQuota(time.Now)).Routes(mux)
	handler := auth.Middleware(tokenIsUserVerifier{})(mux)

	run := time.Now().UnixNano()
	cases := []struct {
		name         string
		header       func(user string) string // "" sends no Authorization header
		wantCode     int
		wantACleared bool
	}{
		{"no token is 401 and clears nothing", func(string) string { return "" }, http.StatusUnauthorized, false},
		{"invalid token is 401 and clears nothing", func(string) string { return "Bearer nope" }, http.StatusUnauthorized, false},
		{"signed-in withdraw clears only that user", func(u string) string { return "Bearer user:" + u }, http.StatusOK, true},
	}
	for i, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			a, b := fmt.Sprintf("consent_a_%d_%d", run, i), fmt.Sprintf("consent_b_%d_%d", run, i)
			for _, id := range []string{a, b} {
				if _, err := pool.Exec(ctx, `INSERT INTO profiles (id, ai_consent_at) VALUES ($1, now())`, id); err != nil {
					t.Fatalf("seed profile: %v", err)
				}
			}
			t.Cleanup(func() {
				_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = ANY($1)`, []string{a, b})
			})

			req := httptest.NewRequest(http.MethodDelete, "/api/ai/consent", nil)
			if h := tc.header(a); h != "" {
				req.Header.Set("Authorization", h)
			}
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)
			if w.Code != tc.wantCode {
				t.Fatalf("status = %d, want %d; body %s", w.Code, tc.wantCode, w.Body)
			}

			atA, err := store.AIConsentAt(ctx, a)
			if err != nil {
				t.Fatalf("read consent a: %v", err)
			}
			if gotCleared := atA == nil; gotCleared != tc.wantACleared {
				t.Errorf("user a consent cleared = %v, want %v", gotCleared, tc.wantACleared)
			}
			atB, err := store.AIConsentAt(ctx, b)
			if err != nil || atB == nil {
				t.Errorf("second user's consent changed: at = %v, err = %v", atB, err)
			}
		})
	}
}
