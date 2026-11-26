package gymtests

// Row 16 step 2: ownership of the gym routes that take a user-owned {id}
// (sessions, exercises, templates, template exercises), against a REAL Postgres
// and through the real auth.Middleware. User B sends a token signed with a key
// generated here and must get 403 on every one of user A's ids and 404 on an
// unknown id, and user A's rows must read back unchanged afterwards.
//
// GET /api/gym/exercises/{id} is not here: it reads the shared exercise library,
// which no user owns.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied.

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
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
	"lume/backend/internal/gym"
)

const unknownID = "00000000-0000-0000-0000-000000000000"

func ownershipPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// seedOwner creates a profile with an example.test email and removes it, and
// everything that cascades from it, when the test ends.
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

// pgMux mounts the gym and schedule routes on the real Postgres stores.
func pgMux(pool *pgxpool.Pool) *http.ServeMux {
	mux := http.NewServeMux()
	gym.RegisterWithEngine(mux, gym.NewPGStore(pool), gym.NewParamEngine(pool))
	gym.RegisterSchedule(mux, gym.NewSchedulePGStore(pool))
	return mux
}

// sender wraps h in signedTokens and returns a function that sends one
// request as the given user.
func sender(t *testing.T, h http.Handler) func(method, path, user, body string) *httptest.ResponseRecorder {
	t.Helper()
	h, sign := signedTokens(t, h)
	return func(method, path, user, body string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+sign(user))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
}

func TestPG_GymRoutesRefuseAnotherUsersIDs(t *testing.T) {
	pool := ownershipPool(t)
	ctx := context.Background()
	a := seedOwner(t, pool, fmt.Sprintf("owner_gym_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("owner_gym_b_%d", os.Getpid()))

	send := sender(t, pgMux(pool))
	created := func(method, path, body string) string {
		t.Helper()
		rec := send(method, path, a, body)
		var env struct {
			Data struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		if rec.Code != http.StatusCreated || json.Unmarshal(rec.Body.Bytes(), &env) != nil || env.Data.ID == "" {
			t.Fatalf("user A %s %s = %d (body %s)", method, path, rec.Code, rec.Body.String())
		}
		return env.Data.ID
	}

	var libraryID string
	if err := pool.QueryRow(ctx, `SELECT id::text FROM exercise_library ORDER BY name LIMIT 1`).Scan(&libraryID); err != nil {
		t.Fatalf("read a library exercise: %v", err)
	}
	session := created(http.MethodPost, "/api/gym/sessions", `{"date":"2026-07-14","name":"Push day","duration_minutes":45}`)
	exercise := created(http.MethodPost, "/api/gym/sessions/"+session+"/exercises", `{"name":"Bench Press","sets":3,"reps":8}`)
	template := created(http.MethodPost, "/api/gym/templates", `{"name":"Push","exercises":[{"exercise_id":"`+libraryID+`","planned_sets":3}]}`)
	var templateExercise string
	if err := pool.QueryRow(ctx, `SELECT id::text FROM template_exercises WHERE template_id::text = $1`, template).Scan(&templateExercise); err != nil {
		t.Fatalf("read template exercise: %v", err)
	}

	snapshot := func() string {
		t.Helper()
		var out string
		if err := pool.QueryRow(ctx, `SELECT concat_ws('|',
			(SELECT concat_ws(',', date, name, duration_minutes, session_type) FROM gym_sessions WHERE id::text = $1),
			(SELECT concat_ws(',', name, sets, reps) FROM gym_exercises WHERE id::text = $2),
			(SELECT concat_ws(',', name, estimated_duration_minutes) FROM workout_templates WHERE id::text = $3),
			(SELECT concat_ws(',', planned_sets) FROM template_exercises WHERE id::text = $4),
			(SELECT count(*) FROM gym_exercises WHERE session_id::text = $1),
			(SELECT count(*) FROM template_exercises WHERE template_id::text = $3),
			(SELECT count(*) FROM gym_adherence WHERE user_id = $5))`,
			session, exercise, template, templateExercise, a).Scan(&out); err != nil {
			t.Fatalf("read user A's rows: %v", err)
		}
		return out
	}

	// The token path works: user A reads their own template.
	if rec := send(http.MethodGet, "/api/gym/templates/"+template, a, ""); rec.Code != http.StatusOK {
		t.Fatalf("owner GET template = %d, want 200 (body %s)", rec.Code, rec.Body.String())
	}
	before := snapshot()

	routes := []struct {
		method, path, body string
		id                 string
	}{
		{http.MethodPatch, "/api/gym/sessions/%s", `{"name":"Hijacked"}`, session},
		{http.MethodDelete, "/api/gym/sessions/%s", "", session},
		{http.MethodPost, "/api/gym/sessions/%s/complete", `{"completion_rate":1}`, session},
		{http.MethodPost, "/api/gym/sessions/%s/exercises", `{"name":"Planted"}`, session},
		{http.MethodPatch, "/api/gym/exercises/%s", `{"sets":99}`, exercise},
		{http.MethodDelete, "/api/gym/exercises/%s", "", exercise},
		{http.MethodGet, "/api/gym/templates/%s", "", template},
		{http.MethodPatch, "/api/gym/templates/%s", `{"name":"Hijacked"}`, template},
		{http.MethodDelete, "/api/gym/templates/%s", "", template},
		{http.MethodPost, "/api/gym/templates/%s/exercises", `{"exercise_id":"` + libraryID + `"}`, template},
		{http.MethodPatch, "/api/gym/template-exercises/%s", `{"planned_sets":99}`, templateExercise},
		{http.MethodDelete, "/api/gym/template-exercises/%s", "", templateExercise},
	}
	for _, r := range routes {
		for _, tc := range []struct {
			name, id string
			want     int
		}{
			{"user A's id", r.id, http.StatusForbidden},
			{"unknown id", unknownID, http.StatusNotFound},
		} {
			path := fmt.Sprintf(r.path, tc.id)
			t.Run(r.method+" "+r.path+" "+tc.name, func(t *testing.T) {
				if rec := send(r.method, path, b, r.body); rec.Code != tc.want {
					t.Fatalf("user B %s %s = %d, want %d (body %s)", r.method, path, rec.Code, tc.want, rec.Body.String())
				}
				if after := snapshot(); after != before {
					t.Fatalf("user A's rows changed: %s, was %s", after, before)
				}
			})
		}
	}
}
