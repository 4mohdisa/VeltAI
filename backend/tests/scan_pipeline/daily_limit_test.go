// Daily AI limit (PHASE4_ROWS.md row 5) on the pipeline and label scans. The
// upstream is a local fake Gemini server, so no call leaves the process. With
// a limit of 1, a successful first scan uses the allowance and the second is
// refused before Gemini; a failed first scan leaves it unused.
package scanpipelinetests

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"lume/backend/internal/aiquota"
	"lume/backend/internal/auth"
	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
)

const validLabel = `{"food_name":"Granola","serving_size_g":50,"calories_per_serving":200,"protein_g":5,"carbs_g":30,"fat_g":6,"fibre_g":4,"confidence":90}`

func TestDailyAILimitOnPipelineAndLabel(t *testing.T) {
	cases := []struct {
		name       string
		path       string
		reply      string // Gemini part text; empty means the upstream fails
		wantFirst  int
		wantSecond int
	}{
		{"pipeline: a successful scan uses the allowance", "/api/scan/pipeline", validEstimateArray, 202, 429},
		{"pipeline: a failed scan does not", "/api/scan/pipeline", "", 202, 202},
		{"label: a successful scan uses the allowance", "/api/scan/label", validLabel, 200, 429},
		{"label: a failed scan does not", "/api/scan/label", "", 502, 200},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var hits atomic.Int32
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				if hits.Add(1) == 1 && tc.reply == "" {
					http.Error(w, "upstream down", http.StatusServiceUnavailable)
					return
				}
				reply := tc.reply
				if reply == "" {
					reply = validLabel
					if tc.path == "/api/scan/pipeline" {
						reply = validEstimateArray
					}
				}
				_, _ = w.Write(wrapEnvelope(t, reply))
			}))
			defer srv.Close()
			gem := pipeline.NewGemini("test")
			gem.Base = srv.URL
			store := newFakePipelineStore()
			mux := http.NewServeMux()
			scan.RegisterPipeline(mux, gem, store, nil, aiquota.New(1, nil))

			send := func() *httptest.ResponseRecorder {
				req := httptest.NewRequest("POST", tc.path, strings.NewReader(`{"image_base64":"aGVsbG8="}`))
				req = req.WithContext(auth.WithUserID(req.Context(), "user_1"))
				rec := httptest.NewRecorder()
				mux.ServeHTTP(rec, req)
				return rec
			}

			if rec := send(); rec.Code != tc.wantFirst {
				t.Fatalf("first scan = %d, want %d; body %s", rec.Code, tc.wantFirst, rec.Body)
			}
			if tc.path == "/api/scan/pipeline" {
				drainFinished(store) // the count is recorded before the row finishes
			}
			before := hits.Load()
			rec := send()
			if rec.Code != tc.wantSecond {
				t.Fatalf("second scan = %d, want %d; body %s", rec.Code, tc.wantSecond, rec.Body)
			}
			if tc.wantSecond == http.StatusTooManyRequests {
				if hits.Load() != before {
					t.Error("a refused scan still reached Gemini")
				}
				if !strings.Contains(rec.Body.String(), aiquota.Code) {
					t.Errorf("429 body = %s, want code %s", rec.Body, aiquota.Code)
				}
			}
			if tc.path == "/api/scan/pipeline" && rec.Code == http.StatusAccepted {
				drainFinished(store)
			}
		})
	}
}
