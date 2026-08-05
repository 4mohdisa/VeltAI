package scanpipelinetests

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"lumo/backend/internal/scan"
	"lumo/backend/internal/scan/pipeline"
)

// validEstimateArray is a well-formed pass-3 fixture so the background pipeline
// succeeds (Gemini returns one parseable estimate).
const validEstimateArray = `[{"region_id":0,"food_name":"Rice","food_category":"rice","estimated_weight_g":150,"calories_per_100g":130,"confidence":80}]`

// drainFinished lets the detached goroutine complete before an httptest server
// closes, so a late request doesn't hit a closed listener.
func drainFinished(store *fakePipelineStore) {
	select {
	case <-store.finished:
	case <-time.After(2 * time.Second):
	}
}

// ========================= Session wiring =========================

// POST /api/scan/pipeline returns a non-empty scan_session_id alongside log_id,
// and CreatePipelineSession is called with the food_log id (the session is
// linked to the log up front). scan_type="pipeline" itself is set in the
// PGStore INSERT SQL (see CreatePipelineSession in pipeline_handler.go) — not
// reachable through the fake, so it's covered by reading that SQL, not here.
func TestPipeline_ReturnsScanSessionID(t *testing.T) {
	g, srv := geminiServer(t, validEstimateArray)
	defer srv.Close()
	store := newFakePipelineStore()

	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202; body %s", rec.Code, rec.Body)
	}
	var got struct {
		LogID         string `json:"log_id"`
		ScanSessionID string `json:"scan_session_id"`
		Status        string `json:"status"`
	}
	decodeData(t, rec, &got)
	if got.LogID == "" {
		t.Fatal("log_id is empty")
	}
	if got.ScanSessionID != "sess_pipeline_1" {
		t.Fatalf("scan_session_id = %q, want sess_pipeline_1", got.ScanSessionID)
	}
	// The session is a normal session id — the same shape the existing
	// /api/scan/correction and /api/scan/feedback ownership tests (tests/scan)
	// accept — so no separate correction/feedback test is duplicated here.
	store.mu.Lock()
	linked := store.sessionForLog
	store.mu.Unlock()
	if linked != got.LogID {
		t.Fatalf("CreatePipelineSession food_log id = %q, want returned log_id %q", linked, got.LogID)
	}
	drainFinished(store)
}

// After the background pipeline finishes it records metrics on the session via
// UpdatePipelineSession(sessionID, ..., overallConf, ..., processingMs). We wait
// on both the FinishScanLog and the UpdatePipelineSession signals, then assert
// the update targeted the right session with a non-negative processing time.
func TestPipeline_SessionUpdatedAfterComplete(t *testing.T) {
	g, srv := geminiServer(t, validEstimateArray)
	defer srv.Close()
	store := newFakePipelineStore()

	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202; body %s", rec.Code, rec.Body)
	}
	select {
	case <-store.finished:
	case <-time.After(3 * time.Second):
		t.Fatal("FinishScanLog not called within 3s")
	}
	select {
	case <-store.updated:
	case <-time.After(3 * time.Second):
		t.Fatal("UpdatePipelineSession not called within 3s")
	}
	store.mu.Lock()
	sess, ms := store.updatedSession, store.updatedProcessingMs
	store.mu.Unlock()
	if sess != "sess_pipeline_1" {
		t.Fatalf("UpdatePipelineSession session = %q, want sess_pipeline_1", sess)
	}
	if ms < 0 {
		t.Fatalf("processing_ms = %d, want >= 0", ms)
	}
	// overall_confidence is passed through as any int (incl. 0) — asserting it
	// was called with the right session id already proves the wiring.
}

// The scan_results blob written onto the food_log embeds the scan_session_id, so
// the frontend can reach correction/feedback from the log row alone.
func TestPipeline_ScanResultsEmbedsSessionID(t *testing.T) {
	g, srv := geminiServer(t, validEstimateArray)
	defer srv.Close()
	store := newFakePipelineStore()

	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202; body %s", rec.Code, rec.Body)
	}
	var got struct {
		ScanSessionID string `json:"scan_session_id"`
	}
	decodeData(t, rec, &got)

	var fin finishArgs
	select {
	case fin = <-store.finished:
	case <-time.After(3 * time.Second):
		t.Fatal("FinishScanLog not called within 3s")
	}
	var blob map[string]json.RawMessage
	if err := json.Unmarshal(fin.scanResults, &blob); err != nil {
		t.Fatalf("scan_results not an object: %v (raw %s)", err, fin.scanResults)
	}
	raw, ok := blob["scan_session_id"]
	if !ok {
		t.Fatalf("scan_results missing scan_session_id key: %s", fin.scanResults)
	}
	var sess string
	if err := json.Unmarshal(raw, &sess); err != nil {
		t.Fatalf("scan_session_id not a string: %v", err)
	}
	if sess != got.ScanSessionID {
		t.Fatalf("scan_results scan_session_id = %q, want %q", sess, got.ScanSessionID)
	}
}

// ========================= Robustness =========================

// A syntactically invalid base64 image is a client error (400), never a 500.
func TestPipeline_MalformedBase64Is400(t *testing.T) {
	g := pipeline.NewGemini("test") // Configured, but decode fails before any call
	rec := servePipeline(t, g, newFakePipelineStore(), nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"!!!not base64!!!"}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400; body %s", rec.Code, rec.Body)
	}
}

// An empty image_base64 is rejected 400 before anything else.
func TestPipeline_EmptyImageIs400(t *testing.T) {
	g := pipeline.NewGemini("test")
	rec := servePipeline(t, g, newFakePipelineStore(), nil,
		"POST", "/api/scan/pipeline", `{"image_base64":""}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400; body %s", rec.Code, rec.Body)
	}
}

// A >15 MB decoded image is rejected 413. The scan handlers decode their own
// body under a 24 MB cap (wider than the shared httpx 20 MB), so a 16 MB image
// (~21.3 MB base64, under the body cap) decodes and then trips the 15 MB
// decoded-image limit → 413.
func TestPipeline_OversizeImageIsRejected(t *testing.T) {
	g := pipeline.NewGemini("test")
	big := base64.StdEncoding.EncodeToString(make([]byte, 16<<20)) // 16 MB → ~21.3 MB base64
	body := fmt.Sprintf(`{"image_base64":%q}`, big)
	rec := servePipeline(t, g, newFakePipelineStore(), nil,
		"POST", "/api/scan/pipeline", body)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want 413; body %s", rec.Code, rec.Body)
	}
}

// With no GEMINI_API_KEY the pipeline is unavailable (503) and says so.
func TestPipeline_NoAPIKeyIs503(t *testing.T) {
	g := pipeline.NewGemini("") // Configured() == false
	rec := servePipeline(t, g, newFakePipelineStore(), nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503; body %s", rec.Code, rec.Body)
	}
	if !strings.Contains(rec.Body.String(), "GEMINI_API_KEY") {
		t.Fatalf("503 body should mention GEMINI_API_KEY, got %s", rec.Body)
	}
}

// countingPipelineStore hands out a unique incrementing id from each Create*,
// so concurrent requests can be checked for their own log + session.
type countingPipelineStore struct {
	mu       sync.Mutex
	logN     int
	sessN    int
	finished chan struct{} // buffered: one signal per FinishScanLog
}

func (c *countingPipelineStore) CreateAnalyzingLog(_ context.Context, _, _ string, _ *string) (string, error) {
	c.mu.Lock()
	c.logN++
	id := fmt.Sprintf("log_%d", c.logN)
	c.mu.Unlock()
	return id, nil
}

func (c *countingPipelineStore) CreatePipelineSession(_ context.Context, _, _ string) (string, error) {
	c.mu.Lock()
	c.sessN++
	id := fmt.Sprintf("sess_%d", c.sessN)
	c.mu.Unlock()
	return id, nil
}

func (c *countingPipelineStore) FinishScanLog(_ context.Context, _, _, _ string, _, _, _, _, _, _ float64, _ []byte) error {
	select {
	case c.finished <- struct{}{}:
	default:
	}
	return nil
}

func (c *countingPipelineStore) CreateLabelSession(_ context.Context, _ string) (string, error) {
	c.mu.Lock()
	c.sessN++
	id := fmt.Sprintf("sess_%d", c.sessN)
	c.mu.Unlock()
	return id, nil
}

func (c *countingPipelineStore) UpdatePipelineSession(_ context.Context, _ string, _, _, _, _ int, _ string, _ bool, _ int) error {
	return nil
}

var _ scan.PipelineStore = (*countingPipelineStore)(nil)

// Three concurrent pipeline requests each get their own log_id and
// scan_session_id (no cross-request id reuse under the store's lock).
func TestPipeline_ConcurrentRequestsGetDistinctIDs(t *testing.T) {
	g, srv := geminiServer(t, validEstimateArray)
	defer srv.Close()
	store := &countingPipelineStore{finished: make(chan struct{}, 3)}

	const n = 3
	type resp struct {
		LogID         string `json:"log_id"`
		ScanSessionID string `json:"scan_session_id"`
	}
	results := make([]resp, n)
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func(i int) {
			defer wg.Done()
			rec := servePipeline(t, g, store, nil,
				"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
			if rec.Code != http.StatusAccepted {
				t.Errorf("req %d status = %d, want 202; body %s", i, rec.Code, rec.Body)
				return
			}
			decodeData(t, rec, &results[i])
		}(i)
	}
	wg.Wait()

	logs := map[string]bool{}
	sessions := map[string]bool{}
	for _, r := range results {
		if r.LogID == "" || r.ScanSessionID == "" {
			t.Fatalf("empty ids in %+v", r)
		}
		logs[r.LogID] = true
		sessions[r.ScanSessionID] = true
	}
	if len(logs) != n {
		t.Fatalf("distinct log_ids = %d, want %d (%v)", len(logs), n, logs)
	}
	if len(sessions) != n {
		t.Fatalf("distinct scan_session_ids = %d, want %d (%v)", len(sessions), n, sessions)
	}
	// Drain the background completions so the gemini server outlives them.
	for i := 0; i < n; i++ {
		select {
		case <-store.finished:
		case <-time.After(2 * time.Second):
		}
	}
}

// The detached goroutine's panic recovery (defer recover() in runScanPipeline)
// cannot be forced through the public handler: the handler takes a concrete
// *pipeline.Gemini (not an injectable interface) and runScanPipeline is
// unexported, so no fake can make the background work panic from these tests.
// That recover() is verified by reading pipeline_handler.go, not hermetically.

// ========================= Calibration integration (full Run) =========================

// pipeline.Run threads pass-5 calibration: a user with >= 3 samples and a 1.5×
// EWMA multiplier scales the Gemini weight (100 g → 150 g) and appends the
// "Adjusted to your portions" note. The fakeQuerier returns ErrNoRows from Query
// (so the library prefetch/crosscheck are no-ops and MacroSource stays
// ai_estimate) and the calibration row from QueryRow.
func TestPipeline_RunAppliesCalibration(t *testing.T) {
	g, srv := geminiServer(t,
		`[{"region_id":0,"food_name":"rice","food_category":"rice","estimated_weight_g":100,"calories_per_100g":130,"confidence":80}]`)
	defer srv.Close()

	q := fakeQuerier{row: calRow{multiplier: 1.5, count: 3}}
	out := pipeline.Run(context.Background(), []byte("img"), "user_1", g, q, "image/jpeg")

	if len(out.Estimates) != 1 {
		t.Fatalf("estimates = %d, want 1 (%+v)", len(out.Estimates), out.Estimates)
	}
	if !approxEq(out.Estimates[0].WeightG, 150, 1e-9) {
		t.Fatalf("WeightG = %v, want 150 (100 × 1.5 calibration)", out.Estimates[0].WeightG)
	}
	var noted bool
	for _, note := range out.Estimates[0].Notes {
		if note == "Adjusted to your portions" {
			noted = true
		}
	}
	if !noted {
		t.Fatalf("expected calibration note, got %v", out.Estimates[0].Notes)
	}
}
