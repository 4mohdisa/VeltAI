// POST and DELETE /api/push/token behind the auth middleware and the shared
// rate limiter, as main.go mounts them. The handler tests use an in-memory
// Store; the PG test at the bottom proves the real SQL (upsert by token, delete
// only the caller's own) and is skipped without LUME_TEST_DATABASE_URL.
package push_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
	"lume/backend/internal/push"
	"lume/backend/internal/ratelimit"
)

// tokenIsUser accepts any bearer token and treats it as the user ID.
type tokenIsUser struct{}

func (tokenIsUser) Verify(_ context.Context, token string) (string, error) { return token, nil }

type saved struct{ user, platform string }

// memStore keeps the same rules as PGStore: one row per token, delete by owner.
type memStore struct{ rows map[string]saved }

func newMem() *memStore { return &memStore{rows: map[string]saved{}} }

func (m *memStore) Upsert(_ context.Context, userID string, r push.Request) error {
	m.rows[r.Token] = saved{userID, r.Platform}
	return nil
}

func (m *memStore) Delete(_ context.Context, userID, token string) error {
	if m.rows[token].user == userID {
		delete(m.rows, token)
	}
	return nil
}

func server(store push.Store) http.Handler {
	mux := http.NewServeMux()
	push.Register(mux, store)
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	limiter := ratelimit.New(ratelimit.Limits{ratelimit.ClassWrite: 100}, func() time.Time { return now })
	return auth.Middleware(tokenIsUser{})(limiter.Middleware(mux))
}

func call(h http.Handler, method, user, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "/api/push/token", strings.NewReader(body))
	if user != "" {
		r.Header.Set("Authorization", "Bearer "+user)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	return rec
}

func TestRegisterValidation(t *testing.T) {
	long := strings.Repeat("a", 512)
	cases := []struct {
		name, body string
		want       int
	}{
		{"ios token", `{"token":"abc123","platform":"ios"}`, http.StatusNoContent},
		{"android token", `{"token":"fcm:APA91b","platform":"android"}`, http.StatusNoContent},
		{"512 characters", `{"token":"` + long + `","platform":"ios"}`, http.StatusNoContent},
		{"513 characters", `{"token":"` + long + `a","platform":"ios"}`, http.StatusBadRequest},
		{"empty token", `{"token":"","platform":"ios"}`, http.StatusBadRequest},
		{"missing token", `{"platform":"ios"}`, http.StatusBadRequest},
		{"space inside", `{"token":"abc 123","platform":"ios"}`, http.StatusBadRequest},
		{"leading space", `{"token":" abc","platform":"ios"}`, http.StatusBadRequest},
		{"tab", `{"token":"abc\t1","platform":"ios"}`, http.StatusBadRequest},
		{"newline", `{"token":"abc\n1","platform":"ios"}`, http.StatusBadRequest},
		{"no-break space", `{"token":"abc 1","platform":"ios"}`, http.StatusBadRequest},
		{"control character", `{"token":"abc\u00001","platform":"ios"}`, http.StatusBadRequest},
		{"unknown platform", `{"token":"abc","platform":"web"}`, http.StatusBadRequest},
		{"platform in capitals", `{"token":"abc","platform":"IOS"}`, http.StatusBadRequest},
		{"missing platform", `{"token":"abc"}`, http.StatusBadRequest},
		{"invalid JSON", `{"token":`, http.StatusBadRequest},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			store := newMem()
			rec := call(server(store), http.MethodPost, "user_a", c.body)
			if rec.Code != c.want {
				t.Fatalf("status = %d, want %d, body %s", rec.Code, c.want, rec.Body)
			}
			if stored := len(store.rows); (c.want == http.StatusNoContent) != (stored == 1) {
				t.Errorf("%d rows stored for status %d", stored, rec.Code)
			}
			if c.want == http.StatusNoContent && rec.Body.Len() != 0 {
				t.Errorf("204 has a body: %s", rec.Body)
			}
		})
	}
}

func TestDeleteValidation(t *testing.T) {
	cases := []struct {
		name, body string
		want       int
	}{
		{"token", `{"token":"abc"}`, http.StatusNoContent},
		{"empty token", `{"token":""}`, http.StatusBadRequest},
		{"space inside", `{"token":"a b"}`, http.StatusBadRequest},
		{"513 characters", `{"token":"` + strings.Repeat("a", 513) + `"}`, http.StatusBadRequest},
		{"invalid JSON", `nope`, http.StatusBadRequest},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if rec := call(server(newMem()), http.MethodDelete, "user_a", c.body); rec.Code != c.want {
				t.Fatalf("status = %d, want %d, body %s", rec.Code, c.want, rec.Body)
			}
		})
	}
}

func TestUnauthenticatedIs401(t *testing.T) {
	for _, method := range []string{http.MethodPost, http.MethodDelete} {
		t.Run(method, func(t *testing.T) {
			store := newMem()
			rec := call(server(store), method, "", `{"token":"abc","platform":"ios"}`)
			if rec.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want 401", rec.Code)
			}
			if len(store.rows) != 0 {
				t.Errorf("an unauthenticated call stored %d rows", len(store.rows))
			}
		})
	}
}

func TestOwnerComesFromTheTokenNotTheBody(t *testing.T) {
	store := newMem()
	call(server(store), http.MethodPost, "user_a", `{"token":"abc","platform":"ios","user_id":"user_b"}`)
	if got := store.rows["abc"]; got.user != "user_a" || got.platform != "ios" {
		t.Fatalf("stored %+v, want user_a on ios", got)
	}
}

func TestPG_PushTokensBelongToTheCaller(t *testing.T) {
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
	a := fmt.Sprintf("push_a_%d", os.Getpid())
	b := fmt.Sprintf("push_b_%d", os.Getpid())
	for _, id := range []string{a, b} {
		if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, id); err != nil {
			t.Fatalf("seed profile: %v", err)
		}
		t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	}
	token := a + "_device"
	h := server(push.NewPGStore(pool))
	owner := func() (user, platform string, rows int) {
		t.Helper()
		if err := pool.QueryRow(ctx, `SELECT count(*) FROM push_tokens WHERE token = $1`, token).Scan(&rows); err != nil {
			t.Fatal(err)
		}
		if rows == 1 {
			if err := pool.QueryRow(ctx, `SELECT user_id, platform FROM push_tokens WHERE token = $1`, token).Scan(&user, &platform); err != nil {
				t.Fatal(err)
			}
		}
		return user, platform, rows
	}
	steps := []struct {
		name, method, user, body string
		wantUser, wantPlatform   string
		wantRows                 int
	}{
		{"A registers", http.MethodPost, a, `{"token":"` + token + `","platform":"ios"}`, a, "ios", 1},
		{"A registers again: one row, platform updated", http.MethodPost, a, `{"token":"` + token + `","platform":"android"}`, a, "android", 1},
		{"B cannot delete A's token", http.MethodDelete, b, `{"token":"` + token + `"}`, a, "android", 1},
		{"A deletes its own token", http.MethodDelete, a, `{"token":"` + token + `"}`, "", "", 0},
		{"A registers once more", http.MethodPost, a, `{"token":"` + token + `","platform":"ios"}`, a, "ios", 1},
		{"the device signs in to B: the token moves to B", http.MethodPost, b, `{"token":"` + token + `","platform":"ios"}`, b, "ios", 1},
		{"A can no longer delete it", http.MethodDelete, a, `{"token":"` + token + `"}`, b, "ios", 1},
	}
	for _, s := range steps {
		if rec := call(h, s.method, s.user, s.body); rec.Code != http.StatusNoContent || rec.Body.Len() != 0 {
			t.Fatalf("%s: status = %d, body %q, want 204 with no body", s.name, rec.Code, rec.Body)
		}
		if user, platform, rows := owner(); user != s.wantUser || platform != s.wantPlatform || rows != s.wantRows {
			t.Fatalf("%s: row = (%q, %q, %d), want (%q, %q, %d)", s.name, user, platform, rows, s.wantUser, s.wantPlatform, s.wantRows)
		}
	}

	// Deleting B's profile takes the token with it.
	if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, b); err != nil {
		t.Fatal(err)
	}
	if _, _, rows := owner(); rows != 0 {
		t.Fatalf("%d push_tokens rows left after the profile was deleted", rows)
	}
}
