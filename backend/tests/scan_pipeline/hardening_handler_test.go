package scanpipelinetests

import (
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"hash/crc32"
	"image/color"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/db"
	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
)

// bombPNG returns a small PNG whose IHDR DECLARES w×h pixels. The compressed
// bytes stay tiny, so the 15 MB payload cap never fires — only a header check
// stops a decoder from allocating w*h*4 bytes.
func bombPNG(t *testing.T, w, h uint32) []byte {
	t.Helper()
	src := solidPNG(t, color.RGBA{1, 2, 3, 255})
	out := make([]byte, len(src))
	copy(out, src)
	const ihdr = 8 + 4 // signature(8) + length(4) → start of the chunk type
	binary.BigEndian.PutUint32(out[ihdr+4:], w)
	binary.BigEndian.PutUint32(out[ihdr+8:], h)
	binary.BigEndian.PutUint32(out[ihdr+4+13:], crc32.ChecksumIEEE(out[ihdr:ihdr+4+13]))
	return out
}

func scanBody(t *testing.T, img []byte) string {
	t.Helper()
	b, err := json.Marshal(map[string]string{
		"image_base64": base64.StdEncoding.EncodeToString(img),
		"date":         "2026-01-01",
	})
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

// post drives one authenticated request against an ALREADY-registered mux (the
// concurrency semaphore lives on the registration, so the tests below must
// share one mux across requests).
func post(t *testing.T, mux *http.ServeMux, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest("POST", "/api/scan/pipeline", strings.NewReader(body))
	req = req.WithContext(auth.WithUserID(req.Context(), "user_1"))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

// A gigapixel image declared in the header is rejected with a 4xx before the
// pipeline is started and before any 'analyzing' row is written — the 15 MB
// byte cap alone would have let ~12 GB of bitmap through.
func TestPipeline_RejectsDecompressionBomb(t *testing.T) {
	gem, srv := geminiServer(t, `[]`)
	defer srv.Close()
	store := newFakePipelineStore()
	mux := http.NewServeMux()
	scan.RegisterPipeline(mux, gem, store, db.Querier(nil))

	rec := post(t, mux, scanBody(t, bombPNG(t, 40000, 40000)))
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want 413 (body %s)", rec.Code, rec.Body)
	}
	store.mu.Lock()
	created := store.createCalled
	store.mu.Unlock()
	if created {
		t.Fatal("bomb image created an analyzing row — it must be rejected first")
	}
}

// The background pipeline is capped: with one slot configured, a second scan
// arriving while the first still runs is rejected with 503 + Retry-After rather
// than spawning an unbounded goroutine.
func TestPipeline_ConcurrencyCapReturns503(t *testing.T) {
	t.Setenv("LUME_SCAN_CONCURRENCY", "1")

	release := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		<-release // hold the in-flight pipeline run, and with it its slot
		_, _ = w.Write(wrapEnvelope(t, `[]`))
	}))
	defer srv.Close()
	gem := pipeline.NewGemini("test")
	gem.Base = srv.URL

	store := newFakePipelineStore()
	mux := http.NewServeMux()
	scan.RegisterPipeline(mux, gem, store, db.Querier(nil))
	body := scanBody(t, solidPNG(t, color.RGBA{255, 255, 255, 255}))

	if rec := post(t, mux, body); rec.Code != http.StatusAccepted {
		t.Fatalf("first scan status = %d, want 202 (body %s)", rec.Code, rec.Body)
	}
	rec := post(t, mux, body)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("saturated status = %d, want 503 (body %s)", rec.Code, rec.Body)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("503 is missing Retry-After")
	}

	// Let the held run finish, then a later scan is accepted again.
	close(release)
	select {
	case <-store.finished:
	case <-time.After(5 * time.Second):
		t.Fatal("pipeline never finished — slot leaked")
	}
	if rec := post(t, mux, body); rec.Code != http.StatusAccepted {
		t.Fatalf("after release status = %d, want 202 (body %s)", rec.Code, rec.Body)
	}
}
