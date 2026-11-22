// POST /api/feedback behind the same chain main.go mounts it in: auth (401
// without a token), then the shared rate limiter (429 past the write limit),
// then the handler. The handler tests use an in-memory Store; the PG test at the
// bottom proves the real SQL and is skipped without LUME_TEST_DATABASE_URL.
package feedback_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
	"lume/backend/internal/feedback"
	"lume/backend/internal/ratelimit"
)

// tokenIsUser accepts any bearer token and treats it as the user ID.
type tokenIsUser struct{}

func (tokenIsUser) Verify(_ context.Context, token string) (string, error) { return token, nil }

type row struct {
	userID string
	f      feedback.Feedback
}

type memStore struct{ rows []row }

func (m *memStore) Insert(_ context.Context, userID string, f feedback.Feedback) (string, error) {
	m.rows = append(m.rows, row{userID, f})
	return fmt.Sprintf("id_%d", len(m.rows)), nil
}

func server(store feedback.Store, writePerMin int) http.Handler {
	mux := http.NewServeMux()
	feedback.Register(mux, store)
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	limiter := ratelimit.New(ratelimit.Limits{ratelimit.ClassWrite: writePerMin}, func() time.Time { return now })
	return auth.Middleware(tokenIsUser{})(limiter.Middleware(mux))
}

func post(h http.Handler, user, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodPost, "/api/feedback", strings.NewReader(body))
	if user != "" {
		r.Header.Set("Authorization", "Bearer "+user)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	return rec
}

func TestValidFeedbackStoresOneRowForCaller(t *testing.T) {
	store := &memStore{}
	rec := post(server(store, 10), "user_a",
		`{"category":"bug","message":"  Scan froze  ","app_version":"1.4.0","device_model":"iPhone16,2"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body)
	}
	var body struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || body.Data.ID == "" {
		t.Fatalf("response has no id: %s", rec.Body)
	}
	if len(store.rows) != 1 {
		t.Fatalf("%d rows stored, want 1", len(store.rows))
	}
	got := store.rows[0]
	if got.userID != "user_a" || got.f.Category != "bug" || got.f.Message != "Scan froze" {
		t.Errorf("stored %+v", got)
	}
	if got.f.AppVersion == nil || *got.f.AppVersion != "1.4.0" || got.f.DeviceModel == nil || *got.f.DeviceModel != "iPhone16,2" {
		t.Errorf("device fields = %v, %v", got.f.AppVersion, got.f.DeviceModel)
	}
}

func TestNoTokenIs401(t *testing.T) {
	store := &memStore{}
	if rec := post(server(store, 10), "", `{"category":"bug","message":"hi"}`); rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	if len(store.rows) != 0 {
		t.Fatal("a row was stored without auth")
	}
}

func TestInvalidRequestsRejected(t *testing.T) {
	cases := map[string]string{
		"unknown category":     `{"category":"praise","message":"hi"}`,
		"missing category":     `{"message":"hi"}`,
		"empty message":        `{"category":"idea","message":""}`,
		"blank message":        `{"category":"idea","message":"   "}`,
		"message over 2000":    `{"category":"idea","message":"` + strings.Repeat("a", 2001) + `"}`,
		"app_version over 64":  `{"category":"idea","message":"hi","app_version":"` + strings.Repeat("1", 65) + `"}`,
		"device_model over 64": `{"category":"idea","message":"hi","device_model":"` + strings.Repeat("x", 65) + `"}`,
		"not JSON":             `category=bug`,
	}
	for name, body := range cases {
		store := &memStore{}
		if rec := post(server(store, 100), "user_a", body); rec.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, want 400", name, rec.Code)
		}
		if len(store.rows) != 0 {
			t.Errorf("%s: a row was stored", name)
		}
	}
}

func TestMessageOf2000CharactersAccepted(t *testing.T) {
	body := `{"category":"other","message":"` + strings.Repeat("é", 2000) + `"}`
	if rec := post(server(&memStore{}, 10), "user_a", body); rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201", rec.Code)
	}
}

func TestAbsentDeviceFieldsStoredAsNull(t *testing.T) {
	store := &memStore{}
	if rec := post(server(store, 10), "user_a", `{"category":"account","message":"hi","app_version":"  "}`); rec.Code != http.StatusCreated {
		t.Fatalf("status = %d", rec.Code)
	}
	if f := store.rows[0].f; f.AppVersion != nil || f.DeviceModel != nil {
		t.Errorf("device fields = %v, %v, want nil, nil", f.AppVersion, f.DeviceModel)
	}
}

func TestPastWriteLimitIs429(t *testing.T) {
	store := &memStore{}
	h := server(store, 1)
	if rec := post(h, "user_a", `{"category":"bug","message":"one"}`); rec.Code != http.StatusCreated {
		t.Fatalf("first = %d, want 201", rec.Code)
	}
	if rec := post(h, "user_a", `{"category":"bug","message":"two"}`); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second = %d, want 429", rec.Code)
	}
	if len(store.rows) != 1 {
		t.Errorf("%d rows stored, want 1", len(store.rows))
	}
}

func TestBodyUserIDIsIgnored(t *testing.T) {
	store := &memStore{}
	post(server(store, 10), "user_a", `{"category":"bug","message":"hi","user_id":"user_b"}`)
	if len(store.rows) != 1 || store.rows[0].userID != "user_a" {
		t.Fatalf("stored %+v, want one row for user_a", store.rows)
	}
}

func TestPG_FeedbackRowsBelongToCallerOnly(t *testing.T) {
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
	a := fmt.Sprintf("feedback_a_%d", os.Getpid())
	b := fmt.Sprintf("feedback_b_%d", os.Getpid())
	for _, id := range []string{a, b} {
		if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, id); err != nil {
			t.Fatalf("seed profile: %v", err)
		}
		t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	}

	h := server(feedback.NewPGStore(pool), 10)
	if rec := post(h, a, `{"category":"idea","message":"hello","user_id":"`+b+`"}`); rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body)
	}

	var aRows, bRows int
	var appVersion, deviceModel *string
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM feedback WHERE user_id = $1`, a).Scan(&aRows); err != nil {
		t.Fatal(err)
	}
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM feedback WHERE user_id = $1`, b).Scan(&bRows); err != nil {
		t.Fatal(err)
	}
	if aRows != 1 || bRows != 0 {
		t.Fatalf("rows: user A %d, user B %d; want 1 and 0", aRows, bRows)
	}
	if err := pool.QueryRow(ctx, `SELECT app_version, device_model FROM feedback WHERE user_id = $1`, a).Scan(&appVersion, &deviceModel); err != nil {
		t.Fatal(err)
	}
	if appVersion != nil || deviceModel != nil {
		t.Errorf("device fields = %v, %v, want NULL", appVersion, deviceModel)
	}
}
