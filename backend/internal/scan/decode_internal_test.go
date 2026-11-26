package scan

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeScanBody(t *testing.T) {
	// An image field just over the body cap, as a phone would send it.
	oversize := `{"image":"` + strings.Repeat("A", maxScanBody) + `"}`
	cases := []struct {
		name       string
		body       string
		wantOK     bool
		wantStatus int
		wantError  string
	}{
		{"valid", `{"image":"aGVsbG8=","media_type":"image/jpeg"}`, true, http.StatusOK, ""},
		{"empty body", ``, false, http.StatusBadRequest, "invalid JSON body"},
		{"truncated JSON", `{"image":`, false, http.StatusBadRequest, "invalid JSON body"},
		{"wrong type", `{"image":42}`, false, http.StatusBadRequest, "invalid JSON body"},
		{"over the body cap", oversize, false, http.StatusRequestEntityTooLarge, "image too large"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/api/scan", bytes.NewReader([]byte(tc.body)))
			var dst struct {
				Image     string `json:"image"`
				MediaType string `json:"media_type"`
			}
			if ok := decodeScanBody(rec, req, &dst); ok != tc.wantOK {
				t.Fatalf("decodeScanBody = %v, want %v", ok, tc.wantOK)
			}
			if tc.wantOK {
				if dst.Image != "aGVsbG8=" || dst.MediaType != "image/jpeg" || rec.Body.Len() != 0 {
					t.Fatalf("decoded %+v, wrote %q", dst, rec.Body.String())
				}
				return
			}
			var env struct {
				Error string `json:"error"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
				t.Fatalf("decode error body: %v (%s)", err, rec.Body.String())
			}
			if rec.Code != tc.wantStatus || env.Error != tc.wantError {
				t.Fatalf("status %d error %q, want %d %q", rec.Code, env.Error, tc.wantStatus, tc.wantError)
			}
		})
	}
}
