package scan

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lume/backend/internal/auth"
)

type stubConsent struct {
	at  *time.Time
	err error
}

func (s stubConsent) AIConsentAt(context.Context, string) (*time.Time, error) {
	return s.at, s.err
}

func TestRequireScanConsent(t *testing.T) {
	now := time.Now()
	cases := []struct {
		name      string
		store     ConsentStore
		wantOK    bool
		wantCode  int
		wantError string
	}{
		{"consent present", stubConsent{at: &now}, true, http.StatusOK, ""},
		{"no consent recorded", stubConsent{}, false, http.StatusForbidden, "ai_consent_required"},
		{"store read error", stubConsent{err: errors.New("connection reset")}, false, http.StatusInternalServerError, "failed to check AI consent"},
		{"nil store", nil, false, http.StatusForbidden, "ai_consent_required"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodPost, "/api/scan", nil)
			r = r.WithContext(auth.WithUserID(r.Context(), "u1"))
			w := httptest.NewRecorder()

			if got := requireScanConsent(w, r, tc.store); got != tc.wantOK {
				t.Fatalf("requireScanConsent = %v, want %v", got, tc.wantOK)
			}
			if w.Code != tc.wantCode {
				t.Fatalf("status = %d, want %d", w.Code, tc.wantCode)
			}
			if tc.wantError == "" {
				if w.Body.Len() != 0 {
					t.Fatalf("allowed request wrote a response: %s", w.Body)
				}
				return
			}
			want := `{"data":null,"error":"` + tc.wantError + `"}`
			if got := strings.TrimSpace(w.Body.String()); got != want {
				t.Fatalf("body = %s, want %s", got, want)
			}
		})
	}
}
