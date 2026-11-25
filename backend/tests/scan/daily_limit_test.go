// Daily AI limit (PHASE4_ROWS.md row 5) on the sync photo scan. The upstream
// is the fake OCR, so no call leaves the process. The clock starts one minute
// before UTC midnight, so "next day" is a UTC calendar day, not 24 hours.
package scantests

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lume/backend/internal/aiquota"
	"lume/backend/internal/auth"
	"lume/backend/internal/scan"
)

type countingOCR struct {
	calls int
	err   error
}

func (o *countingOCR) Extract(context.Context, string, string) (scan.Result, error) {
	o.calls++
	return scan.Result{FoodName: "banana", Calories: 105}, o.err
}

type step struct {
	user    string
	advance time.Duration // moved on the clock before this request
	fail    bool          // the upstream call fails
	want    int
}

func TestDailyAILimitOnPhotoScan(t *testing.T) {
	cases := []struct {
		name  string
		limit int
		steps []step
	}{
		{"under the limit passes", 2, []step{
			{user: "user_1", want: 200},
			{user: "user_1", want: 200},
		}},
		{"at the limit returns 429", 2, []step{
			{user: "user_1", want: 200},
			{user: "user_1", want: 200},
			{user: "user_1", want: 429},
		}},
		{"the count resets on the next UTC day", 1, []step{
			{user: "user_1", want: 200},
			{user: "user_1", want: 429},
			{user: "user_1", advance: 2 * time.Minute, want: 200},
		}},
		{"another user is not counted", 1, []step{
			{user: "user_1", want: 200},
			{user: "user_2", want: 200},
			{user: "user_1", want: 429},
		}},
		{"a failed upstream call does not use the allowance", 1, []step{
			{user: "user_1", fail: true, want: 502},
			{user: "user_1", want: 200},
			{user: "user_1", want: 429},
		}},
		{"limit 0 turns the cap off", 0, []step{
			{user: "user_1", want: 200},
			{user: "user_1", want: 200},
			{user: "user_1", want: 200},
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			now := time.Date(2026, 11, 26, 23, 59, 0, 0, time.UTC)
			quota := aiquota.New(tc.limit, nil)
			quota.Now = func() time.Time { return now }
			ocr := &countingOCR{}
			mux := http.NewServeMux()
			scan.Register(mux, ocr, &fakeStore{}, quota)

			for i, s := range tc.steps {
				now = now.Add(s.advance)
				ocr.err = nil
				if s.fail {
					ocr.err = errors.New("gemini: status 500")
				}
				before := ocr.calls
				rec := scanAs(mux, s.user)
				if rec.Code != s.want {
					t.Fatalf("step %d (%s) = %d, want %d; body %s", i, s.user, rec.Code, s.want, rec.Body)
				}
				if s.want == http.StatusTooManyRequests {
					if ocr.calls != before {
						t.Errorf("step %d: a refused scan still reached the upstream", i)
					}
					assertLimitBody(t, rec)
				}
			}
		})
	}
}

type failingQuotaStore struct{}

func (failingQuotaStore) Used(context.Context, string, string) (int, error) {
	return 0, errors.New("db down")
}
func (failingQuotaStore) Add(context.Context, string, string) error { return nil }

// An unreadable count refuses with 503 rather than letting a paid call through.
func TestDailyAILimitFailsClosedWhenTheCountCannotBeRead(t *testing.T) {
	ocr := &countingOCR{}
	mux := http.NewServeMux()
	scan.Register(mux, ocr, &fakeStore{}, aiquota.New(5, failingQuotaStore{}))
	if rec := scanAs(mux, "user_1"); rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503; body %s", rec.Code, rec.Body)
	}
	if ocr.calls != 0 {
		t.Error("the upstream was called although the allowance could not be checked")
	}
}

func scanAs(mux *http.ServeMux, user string) *httptest.ResponseRecorder {
	req := httptest.NewRequest("POST", "/api/scan", strings.NewReader(`{"image_base64":"aGVsbG8="}`))
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

// assertLimitBody pins the shape the app reads: the usual error envelope, with
// a readable message and the machine-readable code.
func assertLimitBody(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	var body struct {
		Data  any `json:"data"`
		Error struct {
			Message string `json:"message"`
			Code    string `json:"code"`
		} `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("429 body is not the error envelope: %v; %s", err, rec.Body)
	}
	if body.Data != nil || body.Error.Code != aiquota.Code || body.Error.Message == "" {
		t.Errorf("429 body = %s, want data null, code %s and a message", rec.Body, aiquota.Code)
	}
}
