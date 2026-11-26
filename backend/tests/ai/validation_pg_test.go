package aitests

// Row 16 step 3: bad input and the consent gate on POST /api/ai/query, POST
// /api/ai/consent and POST /api/ai/insights/{id}/dismiss, against a REAL
// Postgres and through the real auth.Middleware. The only LLM is fakeLLM with
// a fixture answer; every refused request must leave it uncalled and write
// nothing. POST /api/ai/consent and the dismiss route read no body, so they
// have no body cases.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied (see tests/food/days_pg_test.go for the setup).

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

func TestPG_AIRoutesRejectBadInput(t *testing.T) {
	t.Setenv("LUME_MAX_QUESTION_CHARS", "500")
	pool := aiPool(t)
	consented := seedOwner(t, pool, fmt.Sprintf("ai_validation_yes_%d", os.Getpid()))
	noConsent := seedOwner(t, pool, fmt.Sprintf("ai_validation_no_%d", os.Getpid()))
	insightID := seedInsight(t, pool, consented)
	llm := &fakeLLM{resp: "Protein is on track."}
	send := sender(t, pgMux(pool, llm))
	if rec := send(http.MethodPost, "/api/ai/consent", consented, ""); rec.Code != http.StatusOK {
		t.Fatalf("record consent = %d (body %s)", rec.Code, rec.Body.String())
	}

	snapshot := func() string {
		t.Helper()
		var s string
		if err := pool.QueryRow(context.Background(), `SELECT concat_ws('|',
			(SELECT string_agg(concat_ws(':', id, ai_consent_at IS NOT NULL), ',' ORDER BY id) FROM profiles WHERE id IN ($1, $2)),
			(SELECT string_agg(concat_ws(':', id, dismissed), ',' ORDER BY id) FROM ai_insights WHERE user_id IN ($1, $2)))`,
			consented, noConsent).Scan(&s); err != nil {
			t.Fatalf("read rows back: %v", err)
		}
		return s
	}
	before := snapshot()

	const query = "/api/ai/query"
	cases := []struct {
		name, method, path, user, body string
		status                         int
		wantError                      string
	}{
		{"query, malformed body", http.MethodPost, query, consented, `{"question":`, http.StatusBadRequest, ""},
		{"query, question as number", http.MethodPost, query, consented, `{"question":42}`, http.StatusBadRequest, ""},
		{"query, no question", http.MethodPost, query, consented, `{}`, http.StatusBadRequest, "question is required"},
		{"query, blank question", http.MethodPost, query, consented, `{"question":"   "}`, http.StatusBadRequest, "question is required"},
		{"query, question over the cap", http.MethodPost, query, consented, `{"question":"` + strings.Repeat("a", 501) + `"}`,
			http.StatusBadRequest, "question is too long: 501 characters, limit is 500"},
		{"query without consent", http.MethodPost, query, noConsent, `{"question":"How is my protein?"}`, http.StatusForbidden, "ai_consent_required"},
		{"query without consent, malformed body", http.MethodPost, query, noConsent, `{"question":`, http.StatusForbidden, "ai_consent_required"},
		{"query, no token", http.MethodPost, query, "", `{"question":"How is my protein?"}`, http.StatusUnauthorized, "missing bearer token"},
		{"consent, no token", http.MethodPost, "/api/ai/consent", "", "", http.StatusUnauthorized, "missing bearer token"},
		{"dismiss, malformed id", http.MethodPost, "/api/ai/insights/not-a-uuid/dismiss", consented, "", http.StatusNotFound, "insight not found"},
		{"dismiss, unknown id", http.MethodPost, "/api/ai/insights/" + unknownID + "/dismiss", consented, "", http.StatusNotFound, "insight not found"},
		{"dismiss, no token", http.MethodPost, "/api/ai/insights/" + insightID + "/dismiss", "", "", http.StatusUnauthorized, "missing bearer token"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantErrorEnvelope(t, send(tc.method, tc.path, tc.user, tc.body), tc.status, tc.wantError)
			if llm.calls != 0 {
				t.Fatalf("the LLM was called %d times, want 0", llm.calls)
			}
			if after := snapshot(); after != before {
				t.Fatalf("rows changed: %s, was %s", after, before)
			}
		})
	}
}
