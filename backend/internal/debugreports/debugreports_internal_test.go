// In-package tests for the debug report routes and PGStore. The real-SQL tests
// run against LUME_TEST_DATABASE_URL, a disposable local database with every
// migration applied, and skip without it, like the other TestPG suites. Each
// test owns its profile rows and deletes them on cleanup; debug_reports
// cascades from profiles.
package debugreports

import (
	"bytes"
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
// deleted (with their reports) when the test ends.
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

func serve(store Store) *http.ServeMux {
	mux := http.NewServeMux()
	Register(mux, store)
	return mux
}

// call sends body as JSON, or as raw bytes when it is a string.
func call(t *testing.T, mux *http.ServeMux, method, user string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var raw []byte
	switch b := body.(type) {
	case nil:
	case string:
		raw = []byte(b)
	default:
		var err error
		if raw, err = json.Marshal(b); err != nil {
			t.Fatalf("marshal body: %v", err)
		}
	}
	req := httptest.NewRequest(method, "/api/debug-reports", bytes.NewReader(raw))
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) (T, string) {
	t.Helper()
	var env struct {
		Data  T      `json:"data"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode envelope: %v (body %s)", err, rec.Body.String())
	}
	return env.Data, env.Error
}

func report(clientID, title, capturedAt string) Report {
	return Report{ClientID: clientID, CapturedAt: capturedAt, Title: title, Notes: "steps", Severity: "high", Kind: "bug",
		Area: "food", Trigger: "shake", Route: "/food", AppVersion: "1.0.0", BuildNumber: "42", Context: json.RawMessage(`{"screen":"food"}`)}
}

func TestPGPostValidation(t *testing.T) {
	const user = "user_pg_debugreports_validation"
	s, pool := testStore(t, user)
	mux := serve(s)

	cases := []struct {
		name       string
		body       any
		wantStatus int
		wantError  string
	}{
		{"invalid JSON", "{", http.StatusBadRequest, "invalid JSON body"},
		{"wrong type", `{"client_id": 7, "title": "x"}`, http.StatusBadRequest, "invalid JSON body"},
		{"missing client_id", map[string]string{"title": "Crash"}, http.StatusBadRequest, "client_id and title are required"},
		{"missing title", map[string]string{"client_id": "c1"}, http.StatusBadRequest, "client_id and title are required"},
		{"over the body cap", `{"client_id":"c1","title":"x","image_base64":"` + strings.Repeat("A", maxBody) + `"}`,
			http.StatusRequestEntityTooLarge, "report too large"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := call(t, mux, http.MethodPost, user, tc.body)
			if _, msg := decode[map[string]string](t, rec); rec.Code != tc.wantStatus || msg != tc.wantError {
				t.Fatalf("status %d error %q, want %d %q", rec.Code, msg, tc.wantStatus, tc.wantError)
			}
		})
	}
	var n int
	if err := pool.QueryRow(context.Background(), `SELECT count(*) FROM debug_reports WHERE user_id = $1`, user).Scan(&n); err != nil || n != 0 {
		t.Fatalf("rejected posts stored %d rows, %v", n, err)
	}
}

func TestPGPostAndList(t *testing.T) {
	const owner, other = "user_pg_debugreports_owner", "user_pg_debugreports_other"
	s, pool := testStore(t, owner, other)
	mux := serve(s)
	ctx := context.Background()

	rec := call(t, mux, http.MethodGet, owner, nil)
	if list, _ := decode[[]Report](t, rec); rec.Code != http.StatusOK || list == nil || len(list) != 0 {
		t.Fatalf("empty list = %d %v, want 200 []", rec.Code, list)
	}

	post := func(user string, body any) string {
		t.Helper()
		rec := call(t, mux, http.MethodPost, user, body)
		got, msg := decode[map[string]string](t, rec)
		if rec.Code != http.StatusCreated || got["id"] == "" {
			t.Fatalf("post = %d %q", rec.Code, msg)
		}
		return got["id"]
	}
	older := report("c-older", "Older", "2026-07-01T09:00:00Z")
	older.ImageBase64 = "aGVsbG8="
	olderID := post(owner, older)

	// The context field left out entirely defaults to {}.
	post(owner, map[string]string{"client_id": "c-newer", "title": "Newer", "created_at": "2026-07-02T09:00:00Z",
		"severity": "low", "kind": "idea", "area": "gym", "trigger": "button"})
	post(other, report("c-older", "Someone else's", "2026-07-03T09:00:00Z"))

	// A retried sync of the same client_id updates the row and keeps the screenshot.
	retry := report("c-older", "Older, edited", "2026-07-01T09:00:00Z")
	if id := post(owner, retry); id != olderID {
		t.Fatalf("retry created %s, want the existing %s", id, olderID)
	}

	rec = call(t, mux, http.MethodGet, owner, nil)
	list, _ := decode[[]Report](t, rec)
	if rec.Code != http.StatusOK || len(list) != 2 {
		t.Fatalf("list = %d %+v, want the owner's 2 reports", rec.Code, list)
	}
	if list[0].ClientID != "c-newer" || list[1].ClientID != "c-older" || list[1].Title != "Older, edited" {
		t.Fatalf("list order or retry update wrong: %+v", list)
	}
	if list[1].CapturedAt != "2026-07-01T09:00:00Z" || string(list[1].Context) != `{"screen":"food"}` || list[1].ImageBase64 != "" {
		t.Fatalf("listed report = %+v, want its time and context and no screenshot", list[1])
	}
	if string(list[0].Context) != `{}` {
		t.Fatalf("missing context stored as %s, want {}", list[0].Context)
	}

	var screenshot *string
	if err := pool.QueryRow(ctx, `SELECT screenshot FROM debug_reports WHERE id = $1`, olderID).Scan(&screenshot); err != nil ||
		screenshot == nil || *screenshot != "aGVsbG8=" {
		t.Fatalf("screenshot after retry = %v, %v, want it kept", screenshot, err)
	}
}

func TestPGUpsertDefaultsBadCaptureTime(t *testing.T) {
	const user = "user_pg_debugreports_time"
	s, _ := testStore(t, user)
	ctx := context.Background()

	before := time.Now().Add(-time.Minute)
	if _, err := s.Upsert(ctx, user, report("c1", "No time", "yesterday")); err != nil {
		t.Fatalf("Upsert: %v", err)
	}
	list, err := s.List(ctx, user)
	if err != nil || len(list) != 1 {
		t.Fatalf("List = %+v, %v", list, err)
	}
	at, err := time.Parse(time.RFC3339, list[0].CapturedAt)
	if err != nil || at.Before(before) {
		t.Fatalf("captured_at = %q, want the time of the upload", list[0].CapturedAt)
	}
}

type failingStore struct{}

func (failingStore) Upsert(context.Context, string, Report) (string, error) {
	return "", errors.New("db down")
}
func (failingStore) List(context.Context, string) ([]Report, error) {
	return nil, errors.New("db down")
}

func TestStoreErrors(t *testing.T) {
	mux := serve(failingStore{})
	cases := []struct {
		name, method, wantError string
		body                    any
	}{
		{"save fails", http.MethodPost, "failed to save report", report("c1", "Crash", "")},
		{"list fails", http.MethodGet, "failed to list reports", nil},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := call(t, mux, tc.method, "user_1", tc.body)
			if _, msg := decode[map[string]string](t, rec); rec.Code != http.StatusInternalServerError || msg != tc.wantError {
				t.Fatalf("status %d error %q, want 500 %q", rec.Code, msg, tc.wantError)
			}
		})
	}
}
