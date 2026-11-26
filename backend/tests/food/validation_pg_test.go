package foodtests

// Row 16 step 3: bad input on the food write routes, against a REAL Postgres
// and through the real auth.Middleware. A signed-in user sending a malformed
// body, a wrong JSON type or a missing required field gets 400 in the standard
// error envelope, and nothing is written. PATCH /api/food/logs/{id} is the
// only food PATCH or PUT route and has no required field, so its third case is
// an empty food_name.
//
// Skipped unless LUME_TEST_DATABASE_URL is set — see days_pg_test.go.

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// wantErrorEnvelope fails unless rec is status with data null and an error
// string: exactly wantError, or any non-empty one when wantError is "".
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

func TestPG_FoodWriteRoutesRejectBadInput(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	user := seedOwner(t, pool, fmt.Sprintf("food_validation_%d", os.Getpid()))
	logID := seedMealLog(t, pool, user, "lunch")
	send := sender(t, newMux(store, nil))

	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(ctx, `SELECT concat_ws('|',
			(SELECT count(*) FROM food_logs WHERE user_id = $1),
			(SELECT count(*) FROM saved_foods WHERE user_id = $1),
			(SELECT concat_ws(',', meal_type, food_name, calories) FROM food_logs WHERE id::text = $2))`,
			user, logID).Scan(&s); err != nil {
			t.Fatalf("read rows back: %v", err)
		}
		return s
	}
	before := snapshot()

	cases := []struct {
		name, method, path, body string
	}{
		{"create log, malformed body", http.MethodPost, "/api/food/logs", `{"food_name":`},
		{"create log, calories as text", http.MethodPost, "/api/food/logs", `{"food_name":"Apple","calories":"lots"}`},
		{"create log, no food_name", http.MethodPost, "/api/food/logs", `{"calories":95}`},
		{"quick add, malformed body", http.MethodPost, "/api/food/quick-add", `{"calories":`},
		{"quick add, calories as text", http.MethodPost, "/api/food/quick-add", `{"calories":"lots"}`},
		{"quick add, no calories", http.MethodPost, "/api/food/quick-add", `{"meal_type":"lunch"}`},
		{"save food, malformed body", http.MethodPost, "/api/food/saved", `{"food_name":`},
		{"save food, food_name as number", http.MethodPost, "/api/food/saved", `{"food_name":42}`},
		{"save food, no food_name", http.MethodPost, "/api/food/saved", `{"calories":200}`},
		{"edit log, malformed body", http.MethodPatch, "/api/food/logs/" + logID, `{"calories":`},
		{"edit log, calories as text", http.MethodPatch, "/api/food/logs/" + logID, `{"calories":"lots"}`},
		{"edit log, empty food_name", http.MethodPatch, "/api/food/logs/" + logID, `{"food_name":"  "}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantErrorEnvelope(t, send(tc.method, tc.path, user, tc.body), http.StatusBadRequest, "")
			if after := snapshot(); after != before {
				t.Fatalf("rows changed: %s, was %s", after, before)
			}
		})
	}

	t.Run("edit an unknown log is a 404 envelope", func(t *testing.T) {
		wantErrorEnvelope(t, send(http.MethodPatch, "/api/food/logs/"+unknownLogID, user, `{"calories":1}`), http.StatusNotFound, "not found")
	})
	t.Run("no token is the 401 envelope", func(t *testing.T) {
		h, _ := signedTokens(t, newMux(store, nil))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/food/logs", bytes.NewReader([]byte(`{"food_name":"Apple"}`))))
		wantErrorEnvelope(t, rec, http.StatusUnauthorized, "missing bearer token")
		if after := snapshot(); after != before {
			t.Fatalf("rows changed: %s, was %s", after, before)
		}
	})
}
