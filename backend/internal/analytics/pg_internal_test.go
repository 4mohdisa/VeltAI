// In-package tests for PGStore and the ingest route on top of it. The real-SQL
// tests run against LUME_TEST_DATABASE_URL, a disposable local database with
// every migration applied, and skip without it, like the other TestPG suites.
// Each test owns its profile rows and deletes them on cleanup;
// analytics_events cascades from profiles.
package analytics

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
)

// testStore connects to the test database and gives the test fresh profiles,
// deleted (with their events) when the test ends.
func testStore(t *testing.T, userIDs ...string) (*PGStore, *pgxpool.Pool) {
	t.Helper()
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
	for _, id := range userIDs {
		if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, id); err != nil {
			t.Fatalf("clear profile: %v", err)
		}
		if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1)`, id); err != nil {
			t.Fatalf("seed profile: %v", err)
		}
		t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	}
	return NewPGStore(pool), pool
}

func eventCount(t *testing.T, pool *pgxpool.Pool, userID string) int {
	t.Helper()
	var n int
	if err := pool.QueryRow(context.Background(), `SELECT count(*) FROM analytics_events WHERE user_id = $1`, userID).Scan(&n); err != nil {
		t.Fatalf("count events: %v", err)
	}
	return n
}

func ingest(t *testing.T, store Store, userID, body string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	Register(mux, store)
	req := httptest.NewRequest(http.MethodPost, "/api/analytics/events", strings.NewReader(body))
	req = req.WithContext(auth.WithUserID(req.Context(), userID))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func TestPGInsertEvents(t *testing.T) {
	const user, other = "user_pg_analytics_owner", "user_pg_analytics_other"
	s, pool := testStore(t, user, other)
	ctx := context.Background()
	ts := time.Date(2026, 7, 14, 8, 0, 0, 0, time.UTC)
	ok := Event{Name: "food_logged", Properties: json.RawMessage(`{"count":2}`), SessionID: "s1", ClientTS: ts}

	if err := s.InsertEvents(ctx, other, []Event{ok}); err != nil {
		t.Fatalf("seed other user's event: %v", err)
	}
	cases := []struct {
		name      string
		userID    string
		events    []Event
		wantErr   bool
		wantTotal int
	}{
		{"empty batch", user, nil, false, 0},
		{"valid batch", user, []Event{ok, {Name: "scan_started", Properties: json.RawMessage(`{}`), ClientTS: ts}}, false, 2},
		{"a bad event rolls back the whole batch", user, []Event{ok, {Name: "scan_failed", Properties: json.RawMessage(`not json`), ClientTS: ts}}, true, 2},
		{"a user with no profile is refused", "user_pg_analytics_missing", []Event{ok}, true, 2},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := s.InsertEvents(ctx, tc.userID, tc.events); (err != nil) != tc.wantErr {
				t.Fatalf("InsertEvents err = %v, want error %v", err, tc.wantErr)
			}
			if n := eventCount(t, pool, user); n != tc.wantTotal {
				t.Fatalf("stored events = %d, want %d", n, tc.wantTotal)
			}
		})
	}

	var name, props, session string
	var clientTS time.Time
	if err := pool.QueryRow(ctx, `SELECT event_name, properties::text, session_id, client_ts FROM analytics_events
		WHERE user_id = $1 AND event_name = 'food_logged'`, user).Scan(&name, &props, &session, &clientTS); err != nil {
		t.Fatalf("read event: %v", err)
	}
	if props != `{"count": 2}` || session != "s1" || !clientTS.Equal(ts) {
		t.Fatalf("stored event = %s %s %s %s", name, props, session, clientTS)
	}
	if n := eventCount(t, pool, other); n != 1 {
		t.Fatalf("other user's events = %d, want their 1 untouched", n)
	}
}

func TestPGIngestRoute(t *testing.T) {
	const user = "user_pg_analytics_route"
	s, pool := testStore(t, user)
	longSession := strings.Repeat("s", maxSessionID+1)

	cases := []struct {
		name       string
		body       string
		wantStatus int
		wantStored int
	}{
		{"invalid JSON", `{"events":`, http.StatusBadRequest, 0},
		{"session_id too long", `{"events":[{"name":"food_logged","session_id":"` + longSession + `","client_ts":"2026-07-14T08:00:00Z"}]}`, http.StatusBadRequest, 0},
		{"session_id at the limit", `{"events":[{"name":"food_logged","session_id":"` + longSession[1:] + `","client_ts":"2026-07-14T08:00:00Z"}]}`, http.StatusAccepted, 1},
		{"null properties stored as {}", `{"events":[{"name":"scan_started","properties":null,"client_ts":"2026-07-14T08:00:00Z"}]}`, http.StatusAccepted, 2},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if rec := ingest(t, s, user, tc.body); rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.wantStatus, rec.Body.String())
			}
			if n := eventCount(t, pool, user); n != tc.wantStored {
				t.Fatalf("stored events = %d, want %d", n, tc.wantStored)
			}
		})
	}
	var props string
	if err := pool.QueryRow(context.Background(), `SELECT properties::text FROM analytics_events WHERE user_id = $1 AND event_name = 'scan_started'`, user).Scan(&props); err != nil || props != `{}` {
		t.Fatalf("null properties stored as %q, %v, want {}", props, err)
	}
}

type failingStore struct{}

func (failingStore) InsertEvents(context.Context, string, []Event) error {
	return errors.New("db down")
}

func TestIngestStoreErrorIs500(t *testing.T) {
	rec := ingest(t, failingStore{}, "user_1", `{"events":[{"name":"food_logged","client_ts":"2026-07-14T08:00:00Z"}]}`)
	if rec.Code != http.StatusInternalServerError || !strings.Contains(rec.Body.String(), "database error") {
		t.Fatalf("status = %d body %s, want 500 database error", rec.Code, rec.Body.String())
	}
}
