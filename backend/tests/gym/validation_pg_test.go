package gymtests

// Row 16 step 3: bad input on the gym write routes, against a REAL Postgres
// and through the real auth.Middleware. A signed-in user sending a malformed
// body, a wrong JSON type or a missing required field gets 400 in the standard
// error envelope, and nothing is written. The PATCH routes have no required
// field, so their third case is an invalid value.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied.

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// wantErrorEnvelope fails unless rec is status with data null and an error
// string: exactly wantError, or any non-empty one when wantError is "".
// Same check as tests/food/validation_pg_test.go until the shared test helper
// package is approved.
func wantErrorEnvelope(t *testing.T, rec *httptest.ResponseRecorder, status int, wantError string) {
	t.Helper()
	var env struct {
		Data  json.RawMessage `json:"data"`
		Error *string         `json:"error"`
	}
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&env); err != nil {
		t.Fatalf("body is not the error envelope: %v (body %s)", err, rec.Body.String())
	}
	if rec.Code != status || string(env.Data) != "null" || env.Error == nil || *env.Error == "" ||
		(wantError != "" && *env.Error != wantError) {
		t.Fatalf("got %d %s, want %d with data null and error %q", rec.Code, rec.Body.String(), status, wantError)
	}
}

func TestPG_GymWriteRoutesRejectBadInput(t *testing.T) {
	pool := ownershipPool(t)
	ctx := context.Background()
	user := seedOwner(t, pool, fmt.Sprintf("gym_validation_%d", os.Getpid()))
	send := sender(t, pgMux(pool))

	createdID := func(path, body string) string {
		t.Helper()
		rec := send(http.MethodPost, path, user, body)
		var env struct {
			Data struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		if rec.Code != http.StatusCreated || json.Unmarshal(rec.Body.Bytes(), &env) != nil || env.Data.ID == "" {
			t.Fatalf("POST %s = %d (body %s)", path, rec.Code, rec.Body.String())
		}
		return env.Data.ID
	}
	session := createdID("/api/gym/sessions", `{"date":"2026-07-14","name":"Push day"}`)
	template := createdID("/api/gym/templates", `{"name":"Push"}`)

	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(ctx, `SELECT concat_ws('|',
			(SELECT count(*) FROM gym_sessions WHERE user_id = $1),
			(SELECT count(*) FROM gym_exercises WHERE session_id::text = $2),
			(SELECT count(*) FROM workout_templates WHERE user_id = $1),
			(SELECT concat_ws(',', date, name, duration_minutes) FROM gym_sessions WHERE id::text = $2),
			(SELECT concat_ws(',', name, estimated_duration_minutes) FROM workout_templates WHERE id::text = $3))`,
			user, session, template).Scan(&s); err != nil {
			t.Fatalf("read rows back: %v", err)
		}
		return s
	}
	before := snapshot()

	cases := []struct {
		name, method, path, body string
	}{
		{"create session, malformed body", http.MethodPost, "/api/gym/sessions", `{"date":`},
		{"create session, duration as text", http.MethodPost, "/api/gym/sessions", `{"date":"2026-07-14","duration_minutes":"long"}`},
		{"create session, no date", http.MethodPost, "/api/gym/sessions", `{"name":"Leg day"}`},
		{"add exercise, malformed body", http.MethodPost, "/api/gym/sessions/" + session + "/exercises", `{"name":`},
		{"add exercise, sets as text", http.MethodPost, "/api/gym/sessions/" + session + "/exercises", `{"name":"Squat","sets":"three"}`},
		{"add exercise, no name", http.MethodPost, "/api/gym/sessions/" + session + "/exercises", `{"sets":3}`},
		{"create template, malformed body", http.MethodPost, "/api/gym/templates", `{"name":`},
		{"create template, name as number", http.MethodPost, "/api/gym/templates", `{"name":42}`},
		{"create template, no name", http.MethodPost, "/api/gym/templates", `{"estimated_duration_minutes":30}`},
		{"edit session, malformed body", http.MethodPatch, "/api/gym/sessions/" + session, `{"name":`},
		{"edit session, duration as text", http.MethodPatch, "/api/gym/sessions/" + session, `{"duration_minutes":"long"}`},
		{"edit session, bad date", http.MethodPatch, "/api/gym/sessions/" + session, `{"date":"14/07/2026"}`},
		{"edit template, malformed body", http.MethodPatch, "/api/gym/templates/" + template, `{"name":`},
		{"edit template, name as number", http.MethodPatch, "/api/gym/templates/" + template, `{"name":42}`},
		{"edit template, empty name", http.MethodPatch, "/api/gym/templates/" + template, `{"name":"  "}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantErrorEnvelope(t, send(tc.method, tc.path, user, tc.body), http.StatusBadRequest, "")
			if after := snapshot(); after != before {
				t.Fatalf("rows changed: %s, was %s", after, before)
			}
		})
	}

	t.Run("edit an unknown session is a 404 envelope", func(t *testing.T) {
		wantErrorEnvelope(t, send(http.MethodPatch, "/api/gym/sessions/"+unknownID, user, `{"name":"X"}`), http.StatusNotFound, "")
	})
	t.Run("no token is the 401 envelope", func(t *testing.T) {
		h, _ := signedTokens(t, pgMux(pool))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/gym/sessions", strings.NewReader(`{"date":"2026-07-14"}`)))
		wantErrorEnvelope(t, rec, http.StatusUnauthorized, "missing bearer token")
		if after := snapshot(); after != before {
			t.Fatalf("rows changed: %s, was %s", after, before)
		}
	})
}
