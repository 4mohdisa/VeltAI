package goalstests

// Row 16 step 3: bad input on the goals write routes (onboarding, goals, body
// weight, food preferences), against a REAL Postgres and through the real
// auth.Middleware. A signed-in, onboarded user sending a malformed body, a
// wrong JSON type or an invalid value gets 400 in the standard error envelope,
// and none of their goals, onboarding, preferences or body weight rows change.
// Only cases the handlers reject today are here; the gaps are listed in
// PHASE4_ROWS.md Row 16.
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

func TestPG_GoalsWriteRoutesRejectBadInput(t *testing.T) {
	pool := ownershipPool(t)
	user := seedOwner(t, pool, fmt.Sprintf("goals_validation_%d", os.Getpid()))
	send := sender(t, pgMux(pool))

	for _, r := range []struct{ method, path, body string }{
		{http.MethodPost, "/api/onboarding", `{"age":30,"sex":"male","height":180,"weight":80,"activity_level":"moderate","goal":"health"}`},
		{http.MethodPost, "/api/body-weight", `{"date":"2026-07-14","weight":80}`},
	} {
		if rec := send(r.method, r.path, user, r.body); rec.Code != http.StatusOK && rec.Code != http.StatusCreated {
			t.Fatalf("seed %s %s = %d (body %s)", r.method, r.path, rec.Code, rec.Body.String())
		}
	}

	// Whole rows as JSON, so any column a bad request touched shows up.
	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(context.Background(), `SELECT concat_ws('|',
			(SELECT row_to_json(g)::text FROM goals g WHERE user_id = $1),
			(SELECT row_to_json(o)::text FROM onboarding o WHERE user_id = $1),
			(SELECT row_to_json(p)::text FROM user_cuisine_preferences p WHERE user_id = $1),
			(SELECT json_agg(b ORDER BY b.id)::text FROM body_weight b WHERE user_id = $1),
			(SELECT count(*) FROM saved_foods WHERE user_id = $1))`, user).Scan(&s); err != nil {
			t.Fatalf("read rows back: %v", err)
		}
		return s
	}
	before := snapshot()

	cases := []struct {
		name, method, path, body string
	}{
		{"onboarding, malformed body", http.MethodPost, "/api/onboarding", `{"age":`},
		{"onboarding, age as text", http.MethodPost, "/api/onboarding", `{"age":"thirty","sex":"male","height":180,"weight":80,"activity_level":"moderate","goal":"health"}`},
		{"onboarding, no age", http.MethodPost, "/api/onboarding", `{"sex":"male","height":180,"weight":80,"activity_level":"moderate","goal":"health"}`},
		{"onboarding, age 12", http.MethodPost, "/api/onboarding", `{"age":12,"sex":"male","height":180,"weight":80,"activity_level":"moderate","goal":"health"}`},
		{"onboarding, weight 500 kg", http.MethodPost, "/api/onboarding", `{"age":30,"sex":"male","height":180,"weight":500,"activity_level":"moderate","goal":"health"}`},
		{"goals, malformed body", http.MethodPut, "/api/goals", `{"calorie_target":`},
		{"goals, calorie_target as text", http.MethodPut, "/api/goals", `{"calorie_target":"lots"}`},
		{"goals, negative protein_target", http.MethodPut, "/api/goals", `{"protein_target":-400}`},
		{"goals, calorie_target below the male floor", http.MethodPut, "/api/goals", `{"calorie_target":1200}`},
		{"goals, unknown weight_unit", http.MethodPut, "/api/goals", `{"weight_unit":"stone"}`},
		{"body weight, malformed body", http.MethodPost, "/api/body-weight", `{"weight":`},
		{"body weight, weight as text", http.MethodPost, "/api/body-weight", `{"date":"2026-07-15","weight":"heavy"}`},
		{"body weight, no date", http.MethodPost, "/api/body-weight", `{"weight":80}`},
		{"body weight, negative weight", http.MethodPost, "/api/body-weight", `{"date":"2026-07-15","weight":-5}`},
		{"body weight, absurd weight", http.MethodPost, "/api/body-weight", `{"date":"2026-07-15","weight":1e15}`},
		{"body weight, unknown unit", http.MethodPost, "/api/body-weight", `{"date":"2026-07-15","weight":80,"unit":"parsecs"}`},
		{"preferences, malformed body", http.MethodPatch, "/api/onboarding/preferences", `{"cuisines":`},
		{"preferences, cuisines as text", http.MethodPatch, "/api/onboarding/preferences", `{"cuisines":"italian"}`},
		{"preferences, unknown cuisine", http.MethodPatch, "/api/onboarding/preferences", `{"cuisines":["martian"]}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantErrorEnvelope(t, send(tc.method, tc.path, user, tc.body), http.StatusBadRequest, "")
			if after := snapshot(); after != before {
				t.Fatalf("rows changed: %s, was %s", after, before)
			}
		})
	}

	t.Run("delete an unknown body weight entry is a 404 envelope", func(t *testing.T) {
		wantErrorEnvelope(t, send(http.MethodDelete, "/api/body-weight/"+unknownID, user, ""), http.StatusNotFound, "body weight entry not found")
		if after := snapshot(); after != before {
			t.Fatalf("rows changed: %s, was %s", after, before)
		}
	})
	t.Run("no token is the 401 envelope", func(t *testing.T) {
		h, _ := signedTokens(t, pgMux(pool))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/body-weight", strings.NewReader(`{"date":"2026-07-15","weight":80}`)))
		wantErrorEnvelope(t, rec, http.StatusUnauthorized, "missing bearer token")
		if after := snapshot(); after != before {
			t.Fatalf("rows changed: %s, was %s", after, before)
		}
	})
}
