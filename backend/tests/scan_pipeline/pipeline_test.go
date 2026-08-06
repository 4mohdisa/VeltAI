// Package scanpipelinetests is the external, black-box test suite for the Lume
// scan pipeline. It uses only the exported surface of internal/scan and
// internal/scan/pipeline (no internal edits), stdlib testing + net/http/httptest,
// and fakes for db.Querier and scan.PipelineStore. No network, no real DB.
package scanpipelinetests

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/png"
	"math"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"lume/backend/internal/auth"
	"lume/backend/internal/db"
	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
)

// ---------- shared helpers ----------

func pngBytes(t *testing.T, img image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("png encode: %v", err)
	}
	return buf.Bytes()
}

func solidPNG(t *testing.T, c color.RGBA) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 32, 32))
	for y := 0; y < 32; y++ {
		for x := 0; x < 32; x++ {
			img.Set(x, y, c)
		}
	}
	return pngBytes(t, img)
}

func approxEq(a, b, eps float64) bool { return math.Abs(a-b) <= eps }

// wrapEnvelope wraps model text in a Gemini generateContent response envelope,
// matching what pipeline.Gemini.generate decodes.
func wrapEnvelope(t *testing.T, partText string) []byte {
	t.Helper()
	env := map[string]any{
		"candidates": []map[string]any{
			{"content": map[string]any{"parts": []map[string]any{{"text": partText}}}},
		},
	}
	b, err := json.Marshal(env)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

// geminiServer returns a *pipeline.Gemini (key set → Configured() true) pointed
// at a local httptest server that always answers with partText as the model text.
func geminiServer(t *testing.T, partText string) (*pipeline.Gemini, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write(wrapEnvelope(t, partText))
	}))
	g := pipeline.NewGemini("test")
	g.Base = srv.URL
	return g, srv
}

// ---------- fake db.Querier (calibration) ----------

// calRow fills ApplyCalibration's Scan targets: (weight_multiplier_ewma *float64,
// sample_count *int).
type calRow struct {
	multiplier float64
	count      int
	err        error
}

func (r calRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	if len(dest) >= 1 {
		if p, ok := dest[0].(*float64); ok {
			*p = r.multiplier
		}
	}
	if len(dest) >= 2 {
		if p, ok := dest[1].(*int); ok {
			*p = r.count
		}
	}
	return nil
}

// fakeQuerier satisfies db.Querier; only QueryRow is exercised by the tests here.
type fakeQuerier struct{ row pgx.Row }

func (f fakeQuerier) Query(context.Context, string, ...any) (pgx.Rows, error) {
	return nil, pgx.ErrNoRows
}
func (f fakeQuerier) QueryRow(context.Context, string, ...any) pgx.Row { return f.row }
func (f fakeQuerier) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, nil
}
func (f fakeQuerier) Begin(context.Context) (pgx.Tx, error) { return nil, pgx.ErrTxClosed }

var _ db.Querier = fakeQuerier{}

// ---------- fake scan.PipelineStore ----------

type finishArgs struct {
	id, status, foodName string
	calories             float64
	scanResults          []byte
}

type fakePipelineStore struct {
	mu           sync.Mutex
	createCalled bool
	createUserID string
	createDate   string
	finished     chan finishArgs // buffered(1): signals FinishScanLog

	sessionForLog       string // food_log_id passed to CreatePipelineSession
	updatedSession      string // session id passed to UpdatePipelineSession
	updatedOverall      int
	updatedProcessingMs int
	updated             chan struct{} // buffered(1): signals UpdatePipelineSession

	labelSessions int // CreateLabelSession calls — the /api/scan/label quota row
}

func newFakePipelineStore() *fakePipelineStore {
	return &fakePipelineStore{
		finished: make(chan finishArgs, 1),
		updated:  make(chan struct{}, 1),
	}
}

func (f *fakePipelineStore) CreateAnalyzingLog(_ context.Context, userID, date string, _ *string) (string, error) {
	f.mu.Lock()
	f.createCalled = true
	f.createUserID = userID
	f.createDate = date
	f.mu.Unlock()
	return "log_abc", nil
}

func (f *fakePipelineStore) FinishScanLog(_ context.Context, id, status, foodName string, _, calories, _, _, _, _ float64, scanResults []byte) error {
	select {
	case f.finished <- finishArgs{id: id, status: status, foodName: foodName, calories: calories, scanResults: scanResults}:
	default:
	}
	return nil
}

func (f *fakePipelineStore) CreatePipelineSession(_ context.Context, _, foodLogID string) (string, error) {
	f.mu.Lock()
	f.sessionForLog = foodLogID
	f.mu.Unlock()
	return "sess_pipeline_1", nil
}

func (f *fakePipelineStore) CreateLabelSession(_ context.Context, _ string) (string, error) {
	f.mu.Lock()
	f.labelSessions++
	f.mu.Unlock()
	return "sess_label_1", nil
}

func (f *fakePipelineStore) UpdatePipelineSession(_ context.Context, sessionID string, _, _, _, overallConf int, _ string, _ bool, processingMs int) error {
	f.mu.Lock()
	f.updatedSession = sessionID
	f.updatedOverall = overallConf
	f.updatedProcessingMs = processingMs
	f.mu.Unlock()
	select {
	case f.updated <- struct{}{}:
	default:
	}
	return nil
}

var _ scan.PipelineStore = (*fakePipelineStore)(nil)

// servePipeline mounts RegisterPipeline on a fresh mux and drives one request
// with an authenticated context (same pattern as tests/scan/scan_test.go).
func servePipeline(t *testing.T, gem *pipeline.Gemini, store scan.PipelineStore, q db.Querier, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	scan.RegisterPipeline(mux, gem, store, q)
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req = req.WithContext(auth.WithUserID(req.Context(), "user_1"))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

// decodeData unwraps the httpx { "data": ..., "error": null } envelope.
func decodeData(t *testing.T, rec *httptest.ResponseRecorder, dst any) {
	t.Helper()
	var env struct {
		Data  json.RawMessage `json:"data"`
		Error *string         `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("bad envelope: %v (body %s)", err, rec.Body)
	}
	if err := json.Unmarshal(env.Data, dst); err != nil {
		t.Fatalf("bad data: %v (body %s)", err, rec.Body)
	}
}

// ========================= Quality =========================

// A fully-black frame has no Laplacian variance, so sharpness is 0.
func TestQuality_BlackImageZeroSharpness(t *testing.T) {
	got := pipeline.AssessQuality(solidPNG(t, color.RGBA{0, 0, 0, 255}))
	if got.SharpnessScore != 0 {
		t.Fatalf("black image SharpnessScore = %d, want 0", got.SharpnessScore)
	}
}

// A high-detail, high-contrast frame scores well on both metrics. Per-pixel
// avalanche-hashed grey decorrelates neighbours (high Laplacian variance =
// sharp) and spreads luminance across the range (high std dev = well lit).
func TestQuality_SharpWellLitScoresAbove60(t *testing.T) {
	const w, h = 48, 48
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			n := uint32(y*w + x)
			n ^= n >> 16
			n *= 0x7feb352d
			n ^= n >> 15
			n *= 0x846ca68b
			n ^= n >> 16
			v := uint8(n)
			img.Set(x, y, color.RGBA{v, v, v, 255})
		}
	}
	got := pipeline.AssessQuality(pngBytes(t, img))
	if got.SharpnessScore <= 60 {
		t.Fatalf("SharpnessScore = %d, want > 60", got.SharpnessScore)
	}
	if got.LightingScore <= 60 {
		t.Fatalf("LightingScore = %d, want > 60", got.LightingScore)
	}
}

// ========================= Geometry =========================

// A solid mid-grey frame is not bright enough to read as a plate rim.
func TestGeometry_NoPlateForSolidColour(t *testing.T) {
	got := pipeline.AnalyseGeometry(solidPNG(t, color.RGBA{128, 128, 128, 255}))
	if got.PlateDetected {
		t.Fatalf("solid mid-grey: PlateDetected = true, want false")
	}
}

// PlateArea is the circle area π·r² for the standard 27cm plate.
func TestGeometry_PlateArea(t *testing.T) {
	got := pipeline.PlateArea(27.0)
	want := math.Pi * 13.5 * 13.5
	if !approxEq(got, want, 1e-6) {
		t.Fatalf("PlateArea(27.0) = %v, want %v", got, want)
	}
}

// A region's weight is its volume times the default density (0.80). A solid
// white frame reads as a plate, giving a non-zero region to check the relation.
func TestGeometry_RegionWeightIsVolumeTimesDensity(t *testing.T) {
	got := pipeline.AnalyseGeometry(solidPNG(t, color.RGBA{255, 255, 255, 255}))
	if !got.PlateDetected {
		t.Fatalf("white image: PlateDetected = false, want true")
	}
	if len(got.Regions) == 0 {
		t.Fatal("white image: no regions produced")
	}
	r := got.Regions[0]
	if r.Volume <= 0 {
		t.Fatalf("region Volume = %v, want > 0", r.Volume)
	}
	density := pipeline.Densities["default"] // 0.80
	if !approxEq(r.EstimatedWeightG, r.Volume*density, 1e-9) {
		t.Fatalf("EstimatedWeightG = %v, want Volume*%v = %v", r.EstimatedWeightG, density, r.Volume*density)
	}
}

// ========================= Confidence =========================

// A detected plate contributes a +20 factor named "plate_detected".
func TestConfidence_PlateDetectedAddsTwenty(t *testing.T) {
	b := pipeline.ScoreConfidence(pipeline.QualityResult{}, pipeline.GeometryResult{PlateDetected: true}, nil)
	var found bool
	for _, f := range b.Factors {
		if f.Name == "plate_detected" {
			found = true
			if f.Points != 20 {
				t.Fatalf("plate_detected Points = %d, want 20", f.Points)
			}
		}
	}
	if !found {
		t.Fatalf("no plate_detected factor in %+v", b.Factors)
	}
}

// A perfect scan now reaches exactly 55 (plate 20 + sharp 15 + light 10 +
// database 10 + calibration 10 − single_angle 10) and lands in the "High"
// band (>=55) — the fix for the previously-unreachable High tier.
func TestConfidence_PerfectScanIsHigh(t *testing.T) {
	b := pipeline.ScoreConfidence(
		pipeline.QualityResult{SharpnessScore: 90, LightingScore: 90},
		pipeline.GeometryResult{PlateDetected: true},
		[]pipeline.FoodEstimate{{MacroSource: "database", Notes: []string{"Adjusted to your portions"}}},
	)
	if b.Score != 55 {
		t.Fatalf("best-case Score = %d, want 55", b.Score)
	}
	if b.Label != "High" {
		t.Fatalf("Score 55 Label = %q, want High", b.Label)
	}
}

// A frame with every penalty firing clamps to 0 and labels "Low".
func TestConfidence_PoorScanIsLow(t *testing.T) {
	b := pipeline.ScoreConfidence(
		pipeline.QualityResult{SharpnessScore: 30, LightingScore: 30},
		pipeline.GeometryResult{PlateDetected: false},
		[]pipeline.FoodEstimate{{MacroSource: "ai_estimate"}},
	)
	if b.Score != 0 {
		t.Fatalf("Score = %d, want 0 (clamped)", b.Score)
	}
	if b.Label != "Low" {
		t.Fatalf("Label = %q, want Low", b.Label)
	}
}

// ========================= Calibration =========================

// With sample_count >= 3 the learned multiplier scales the weight and appends a note.
func TestCalibration_AppliesWhenEnoughSamples(t *testing.T) {
	q := fakeQuerier{row: calRow{multiplier: 1.5, count: 3}}
	out := pipeline.ApplyCalibration(context.Background(),
		[]pipeline.FoodEstimate{{FoodName: "rice", WeightG: 100}}, "user_1", q)
	if !approxEq(out[0].WeightG, 150, 1e-9) {
		t.Fatalf("WeightG = %v, want 150", out[0].WeightG)
	}
	var noted bool
	for _, n := range out[0].Notes {
		if n == "Adjusted to your portions" {
			noted = true
		}
	}
	if !noted {
		t.Fatalf("expected calibration note, got %v", out[0].Notes)
	}
}

// Below the sample threshold (count < 3) the estimate is left untouched.
func TestCalibration_NoChangeBelowSampleThreshold(t *testing.T) {
	q := fakeQuerier{row: calRow{multiplier: 1.5, count: 2}}
	out := pipeline.ApplyCalibration(context.Background(),
		[]pipeline.FoodEstimate{{FoodName: "rice", WeightG: 100}}, "user_1", q)
	if !approxEq(out[0].WeightG, 100, 1e-9) {
		t.Fatalf("WeightG = %v, want unchanged 100", out[0].WeightG)
	}
	if len(out[0].Notes) != 0 {
		t.Fatalf("expected no note, got %v", out[0].Notes)
	}
}

// EWMA bound: the parent scan package clamps the stored multiplier at 2.5, and
// ApplyCalibration scales weight by exactly the stored multiplier — so the max
// stored value (2.5) scales a 100g estimate to exactly 250g, never more.
func TestCalibration_EWMAMaxMultiplierIs2point5(t *testing.T) {
	q := fakeQuerier{row: calRow{multiplier: 2.5, count: 3}}
	out := pipeline.ApplyCalibration(context.Background(),
		[]pipeline.FoodEstimate{{FoodName: "rice", WeightG: 100}}, "user_1", q)
	if !approxEq(out[0].WeightG, 250, 1e-9) {
		t.Fatalf("WeightG = %v, want exactly 250 (2.5x cap)", out[0].WeightG)
	}
}

// ========================= Label scan =========================

// Per-serving values convert to per-100g: serving 50g, 200 kcal/serving → 400/100g.
func TestLabel_PerServingConvertsToPer100g(t *testing.T) {
	g, srv := geminiServer(t,
		`{"food_name":"Granola","serving_size_g":50,"calories_per_serving":200,"protein_g":5,"carbs_g":30,"fat_g":6,"fibre_g":4,"confidence":90}`)
	defer srv.Close()

	res, err := g.ExtractLabel(context.Background(), []byte("img"), "image/jpeg")
	if err != nil {
		t.Fatalf("ExtractLabel: %v", err)
	}
	if !approxEq(res.CaloriesPer100g, 400, 1e-9) {
		t.Fatalf("CaloriesPer100g = %v, want 400", res.CaloriesPer100g)
	}
}

// The /api/scan/label handler floors label confidence at 80 (printed numbers
// are trustworthy), so a fixture confidence of 30 surfaces as 80.
func TestLabel_HandlerConfidenceFloorIs80(t *testing.T) {
	g, srv := geminiServer(t,
		`{"food_name":"Granola","serving_size_g":50,"calories_per_serving":200,"protein_g":5,"carbs_g":30,"fat_g":6,"fibre_g":4,"confidence":30}`)
	defer srv.Close()

	rec := servePipeline(t, g, newFakePipelineStore(), nil,
		"POST", "/api/scan/label", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	var got pipeline.LabelResult
	decodeData(t, rec, &got)
	if got.Confidence != 80 {
		t.Fatalf("confidence = %d, want floored to 80", got.Confidence)
	}
}

// A label scan must write a scan_sessions row, because CountScansToday counts
// those rows and nothing else. Without one, POST /api/scan/label was a billable
// gemini-2.5-flash call that never consumed the free-tier quota — an unmetered
// paid path capped only by the 10/min rate limiter (600 calls/hour/account).
func TestLabel_WritesSessionRowForQuota(t *testing.T) {
	g, srv := geminiServer(t,
		`{"food_name":"Granola","serving_size_g":50,"calories_per_serving":200,"protein_g":5,"carbs_g":30,"fat_g":6,"fibre_g":4,"confidence":90}`)
	defer srv.Close()

	store := newFakePipelineStore()
	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/label", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	store.mu.Lock()
	n := store.labelSessions
	store.mu.Unlock()
	if n != 1 {
		t.Fatalf("CreateLabelSession calls = %d, want exactly 1 — the label scan is not counted against the quota", n)
	}
}

// The quota row is written BEFORE the paid call, so a Gemini failure still
// costs the caller a scan. Otherwise anyone who can make the call fail retries
// for free forever.
func TestLabel_CountsQuotaEvenWhenGeminiFails(t *testing.T) {
	g, srv := geminiServer(t, `not json at all`)
	defer srv.Close()

	store := newFakePipelineStore()
	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/label", `{"image_base64":"aGVsbG8="}`)
	if rec.Code == http.StatusOK {
		t.Fatalf("expected the label scan to fail, got 200: %s", rec.Body)
	}
	store.mu.Lock()
	n := store.labelSessions
	store.mu.Unlock()
	if n != 1 {
		t.Fatalf("CreateLabelSession calls = %d, want 1 — a failed paid call must still consume quota", n)
	}
}

// ========================= Pipeline handler =========================

// POST /api/scan/pipeline inserts an "analyzing" food_log and returns 202 with a
// log_id, kicking the passes off in the background.
func TestPipeline_CreatesAnalyzingLog(t *testing.T) {
	g, srv := geminiServer(t,
		`[{"region_id":0,"food_name":"Rice","food_category":"rice","estimated_weight_g":150,"calories_per_100g":130,"confidence":80}]`)
	defer srv.Close()
	store := newFakePipelineStore()

	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202; body %s", rec.Code, rec.Body)
	}
	var got struct {
		LogID  string `json:"log_id"`
		Status string `json:"status"`
	}
	decodeData(t, rec, &got)
	if got.Status != "analyzing" {
		t.Fatalf("status = %q, want analyzing", got.Status)
	}
	if got.LogID == "" {
		t.Fatal("log_id is empty")
	}
	store.mu.Lock()
	called, uid := store.createCalled, store.createUserID
	store.mu.Unlock()
	if !called {
		t.Fatal("CreateAnalyzingLog was not called")
	}
	if uid != "user_1" {
		t.Fatalf("CreateAnalyzingLog userID = %q, want user_1", uid)
	}
	// Let the detached goroutine finish before the httptest server closes.
	select {
	case <-store.finished:
	case <-time.After(2 * time.Second):
	}
}

// The background pipeline flips the log to "ready" once the passes complete.
// The fake store signals FinishScanLog on a channel; we poll with a timeout so
// the test stays deterministic and fast.
func TestPipeline_StatusUpdatedToReady(t *testing.T) {
	g, srv := geminiServer(t,
		`[{"region_id":0,"food_name":"Rice","food_category":"rice","estimated_weight_g":150,"calories_per_100g":130,"confidence":80}]`)
	defer srv.Close()
	store := newFakePipelineStore()

	rec := servePipeline(t, g, store, nil,
		"POST", "/api/scan/pipeline", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202; body %s", rec.Code, rec.Body)
	}
	select {
	case fin := <-store.finished:
		if fin.status != "ready" {
			t.Fatalf("FinishScanLog status = %q, want ready", fin.status)
		}
		if fin.id != "log_abc" {
			t.Fatalf("FinishScanLog id = %q, want log_abc", fin.id)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("pipeline did not reach ready within 3s")
	}
}

// ========================= Gemini failure honesty =========================

// Unparseable model output is retried once (2 calls total); after the retry it
// is an ERROR, not a result. REWRITTEN in the 2026-08-06 audit: this test used
// to assert the old behaviour — a fabricated "Unknown food" whole-plate
// estimate returned with a nil error, which the pipeline then wrote to the
// user's diary as a successful scan. That was the defect, not the contract.
func TestGemini_ParseErrorRetriesThenFallsBack(t *testing.T) {
	var mu sync.Mutex
	var calls int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		mu.Lock()
		calls++
		mu.Unlock()
		_, _ = w.Write(wrapEnvelope(t, "not json at all {{{"))
	}))
	defer srv.Close()

	g := pipeline.NewGemini("test")
	g.Base = srv.URL

	out, err := g.IdentifyFoods(context.Background(), []byte("img"), pipeline.GeometryResult{}, "image/jpeg")
	if !errors.Is(err, pipeline.ErrUnparseable) {
		t.Fatalf("unparseable output must return ErrUnparseable, got err=%v out=%+v", err, out)
	}
	if len(out) != 0 {
		t.Fatalf("unparseable output must yield no estimates (got %+v) — inventing one is the fabricated-data defect", out)
	}
	mu.Lock()
	got := calls
	mu.Unlock()
	if got != 2 {
		t.Fatalf("server hit %d times, want 2 (one retry)", got)
	}
}
