// GET /api/export behind the same middleware chain main.go mounts it in:
// auth first (401 without a token), then the shared rate limiter (429 past the
// read limit). The ownership and token checks run against a real Postgres,
// because a fake querier filters nothing and cannot catch a missing user_id.
package auth_test

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

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/account"
	"lume/backend/internal/auth"
	"lume/backend/internal/db"
	"lume/backend/internal/ratelimit"
)

// tokenIsUser accepts any bearer token and treats it as the user ID.
type tokenIsUser struct{}

func (tokenIsUser) Verify(_ context.Context, token string) (string, error) { return token, nil }

type emptyRow struct{}

func (emptyRow) Scan(dest ...any) error {
	*(dest[0].(*[]byte)) = []byte(`[]`)
	return nil
}

// emptyQuerier answers every export section with no rows.
type emptyQuerier struct{}

func (emptyQuerier) QueryRow(context.Context, string, ...any) pgx.Row { return emptyRow{} }
func (emptyQuerier) Query(context.Context, string, ...any) (pgx.Rows, error) {
	return nil, errors.New("unused")
}
func (emptyQuerier) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, errors.New("unused")
}
func (emptyQuerier) Begin(context.Context) (pgx.Tx, error) { return nil, errors.New("unused") }

func exportServer(q db.Querier, readPerMin int) http.Handler {
	mux := http.NewServeMux()
	auth.RegisterExport(mux, q)
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	limiter := ratelimit.New(ratelimit.Limits{ratelimit.ClassRead: readPerMin}, func() time.Time { return now })
	return auth.Middleware(tokenIsUser{})(limiter.Middleware(mux))
}

func getExport(h http.Handler, user string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodGet, "/api/export", nil)
	if user != "" {
		r.Header.Set("Authorization", "Bearer "+user)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	return rec
}

// TestExportCoversEveryAccountUserTable keeps the export in step with account
// deletion: every table deletion clears must also be exported.
func TestExportCoversEveryAccountUserTable(t *testing.T) {
	exported := map[string]bool{}
	for _, name := range auth.ExportTableNames() {
		exported[name] = true
	}
	for _, ut := range account.UserTables {
		if !exported[ut.Table] {
			t.Errorf("%s is in account.UserTables but missing from the export", ut.Table)
		}
	}
}

func TestExportWithoutTokenIs401(t *testing.T) {
	if rec := getExport(exportServer(emptyQuerier{}, 10), ""); rec.Code != http.StatusUnauthorized {
		t.Fatalf("no token: GET /api/export = %d, want 401", rec.Code)
	}
}

func TestExportPastReadLimitIs429(t *testing.T) {
	h := exportServer(emptyQuerier{}, 1)
	if rec := getExport(h, "user_1"); rec.Code != http.StatusOK {
		t.Fatalf("first call = %d, want 200", rec.Code)
	}
	if rec := getExport(h, "user_1"); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second call = %d, want 429", rec.Code)
	}
}

func exportPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// seedUser gives a user a food row, a body-weight row and an integration whose
// tokens carry the user ID, so a leak of either shows up in the export body.
func seedUser(t *testing.T, pool *pgxpool.Pool, id string) {
	t.Helper()
	ctx := context.Background()
	for _, s := range []struct {
		sql  string
		args []any
	}{
		{`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, []any{id}},
		{`INSERT INTO food_logs (user_id, date, food_name, calories) VALUES ($1, '2026-01-01', $1 || '_food', 100)`, []any{id}},
		{`INSERT INTO body_weight (user_id, date, weight) VALUES ($1, '2026-01-01', 70)`, []any{id}},
		{`INSERT INTO integration_connections (user_id, provider, access_token, refresh_token)
		  VALUES ($1, 'strava', $1 || '_access_secret', $1 || '_refresh_secret') ON CONFLICT DO NOTHING`, []any{id}},
	} {
		if _, err := pool.Exec(ctx, s.sql, s.args...); err != nil {
			t.Fatalf("seed %s: %v", id, err)
		}
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
}

func TestPG_ExportHasOnlyCallerRowsAndNoTokens(t *testing.T) {
	pool := exportPool(t)
	a := fmt.Sprintf("export_a_%d", os.Getpid())
	b := fmt.Sprintf("export_b_%d", os.Getpid())
	seedUser(t, pool, a)
	seedUser(t, pool, b)
	seedOAuthState(t, pool, a)
	if _, err := pool.Exec(context.Background(),
		`INSERT INTO push_tokens (user_id, token, platform) VALUES ($1, $1 || '_push_secret', 'android')`, a); err != nil {
		t.Fatalf("seed push token: %v", err)
	}

	rec := getExport(exportServer(pool, 10), a)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/export = %d, body %s", rec.Code, rec.Body)
	}
	body := rec.Body.String()
	if !strings.Contains(body, a+"_food") {
		t.Errorf("export is missing the caller's own food row")
	}
	if strings.Contains(body, b) {
		t.Errorf("user A's export contains user B data")
	}
	if !strings.Contains(body, `"platform":"android"`) {
		t.Errorf("export is missing the caller's push token row")
	}
	for _, secret := range []string{"access_token", "refresh_token", "_access_secret", "_refresh_secret", a + "_state", a + "_push_secret"} {
		if strings.Contains(body, secret) {
			t.Errorf("export contains token material %q", secret)
		}
	}
}
