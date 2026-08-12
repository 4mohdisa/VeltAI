package scan

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/db"
	"lume/backend/internal/httpx"
	"lume/backend/internal/scan/pipeline"
)

// maxImageBytes caps a decoded scan image (15 MB) — beyond any real phone
// photo. maxScanBody caps the JSON request body: a 15 MB image is ~20 MB once
// base64-encoded, so the body cap sits above that (the shared httpx.Decode cap
// of 20 MB is too tight for image payloads, so scan requests decode their own
// body). Oversize either way → 413.
const (
	maxImageBytes = 15 << 20
	maxScanBody   = 24 << 20
)

// decodeScanBody decodes a scan request body under maxScanBody, mapping an
// oversize body to 413 and any other decode failure to 400. Returns false (and
// writes the error) when it fails.
func decodeScanBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxScanBody)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			httpx.Error(w, http.StatusRequestEntityTooLarge, "image too large")
		} else {
			httpx.Error(w, http.StatusBadRequest, "invalid JSON body")
		}
		return false
	}
	return true
}

// PipelineStore is the persistence the async scan pipeline needs. It is
// separate from Store so adding it does not change the existing Store contract
// (and the existing scan tests' fake). *PGStore satisfies both.
type PipelineStore interface {
	// CreateAnalyzingLog inserts a food_logs row in the 'analyzing' state and
	// returns its id. The pipeline fills it in and flips it to 'ready'.
	CreateAnalyzingLog(ctx context.Context, userID, date string, mealType *string) (id string, err error)
	// CreatePipelineSession inserts a scan_sessions row (scan_type 'pipeline')
	// linked to the analyzing food_log, so later /correction and /feedback calls
	// can reference it. Returns the session id.
	CreatePipelineSession(ctx context.Context, userID, foodLogID string) (id string, err error)
	// FinishScanLog updates an analyzing row with the pipeline's aggregate
	// result and the full per-region breakdown (scanResults JSON).
	FinishScanLog(ctx context.Context, id, status, foodName string, quantity, calories, protein, carbs, fat, fibre float64, scanResults []byte) error
	// UpdatePipelineSession records the pipeline's confidence/quality/timing
	// metrics on the session once the run completes.
	UpdatePipelineSession(ctx context.Context, sessionID string, imageQuality, geometryConf, aiConf, overallConf int, referenceObject string, plateDetected bool, processingMs int) error
	// CreateLabelSession inserts a scan_sessions row (scan_type 'label') with
	// no food_log, so a nutrition-label scan consumes the free-tier quota.
	// CountScansToday counts scan_sessions rows; POST /api/scan/label wrote
	// none, so it made unlimited paid Gemini calls for free-tier users.
	CreateLabelSession(ctx context.Context, userID string) (id string, err error)
}

// CreateAnalyzingLog inserts a placeholder food_logs row the async pipeline
// will complete. food_name is NOT NULL, so it gets an "Analyzing…" placeholder.
func (s *PGStore) CreateAnalyzingLog(ctx context.Context, userID, date string, mealType *string) (string, error) {
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		return "", err
	}
	var id string
	err := s.q.QueryRow(ctx,
		`INSERT INTO food_logs (user_id, date, meal_type, food_name, source, status, calories, protein, carbs, fat, fibre)
		 VALUES ($1, $2, $3, 'Analyzing…', 'scan', 'analyzing', 0, 0, 0, 0, 0)
		 RETURNING id`,
		userID, date, mealType).Scan(&id)
	return id, err
}

// CreatePipelineSession inserts the scan_sessions row for a pipeline scan,
// linked to its food_log up front so the link survives even if the background
// metric update never lands.
func (s *PGStore) CreatePipelineSession(ctx context.Context, userID, foodLogID string) (string, error) {
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		return "", err
	}
	var id string
	err := s.q.QueryRow(ctx,
		`INSERT INTO scan_sessions (user_id, scan_type, food_log_id, created_at)
		 VALUES ($1, 'pipeline', $2::uuid, now())
		 RETURNING id`,
		userID, foodLogID).Scan(&id)
	return id, err
}

// CreateLabelSession records a nutrition-label scan so it counts against the
// daily quota. food_log_id stays null: a label scan produces per-100g values
// the user still has to portion, not a logged food.
func (s *PGStore) CreateLabelSession(ctx context.Context, userID string) (string, error) {
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		return "", err
	}
	var id string
	err := s.q.QueryRow(ctx,
		`INSERT INTO scan_sessions (user_id, scan_type, created_at)
		 VALUES ($1, 'label', now())
		 RETURNING id`, userID).Scan(&id)
	return id, err
}

// FinishScanLog writes the pipeline's aggregate macros and the scan_results
// blob onto the analyzing row and sets its status (normally 'ready').
//
// `AND status = 'analyzing'` is the mirror image of claimPipelineLog's
// predicate, and it is what makes the two completion orders safe. The user can
// confirm a scan before the background pass lands (the poller is not the only
// way a row reaches the review card, and a slow pass can outlive it). Without
// this, a late pass would overwrite the user's own corrected values with the AI
// estimate and drag a confirmed row back to 'ready'. Updating zero rows is the
// correct outcome there, not an error.
func (s *PGStore) FinishScanLog(ctx context.Context, id, status, foodName string, quantity, calories, protein, carbs, fat, fibre float64, scanResults []byte) error {
	_, err := s.q.Exec(ctx, `
		UPDATE food_logs
		SET status = $1, food_name = $2, quantity = $3, calories = $4, protein = $5,
		    carbs = $6, fat = $7, fibre = $8, scan_results = $9::jsonb
		WHERE id::text = $10 AND status = 'analyzing'`,
		status, foodName, quantity, calories, protein, carbs, fat, fibre, scanResults, id)
	return err
}

// UpdatePipelineSession records the pipeline metrics onto the session row.
func (s *PGStore) UpdatePipelineSession(ctx context.Context, sessionID string, imageQuality, geometryConf, aiConf, overallConf int, referenceObject string, plateDetected bool, processingMs int) error {
	_, err := s.q.Exec(ctx, `
		UPDATE scan_sessions SET
			image_quality_score = $2, geometry_confidence = $3, ai_confidence = $4,
			overall_confidence = $5, reference_object = $6, plate_detected = $7,
			processing_ms = $8
		WHERE id::text = $1`,
		sessionID, imageQuality, geometryConf, aiConf, overallConf, referenceObject, plateDetected, processingMs)
	return err
}

// scanResultsBlob is what gets stored in food_logs.scan_results: the pipeline
// outcome flattened alongside the session id, so the frontend always has the
// session id (for correction/feedback) from the log alone. MatchedMeal (Phase 13
// signal 5) is set when the identified foods look like a known meal.
type scanResultsBlob struct {
	ScanSessionID string       `json:"scan_session_id"`
	MatchedMeal   *MatchedMeal `json:"matched_meal,omitempty"`
	pipeline.Outcome
}

// LearningStore is the optional capability for the Phase 13 learning wiring
// (assertion-checked so existing fakes keep compiling). *PGStore has it.
type LearningStore interface {
	// UserContextBlock assembles the per-user learned prompt context (E3).
	UserContextBlock(ctx context.Context, userID string) (string, error)
	// SavedMealsLite lists the user's saved meals for repeat-meal matching.
	SavedMealsLite(ctx context.Context, userID string) ([]SavedMealLite, error)
}

// MultiImageStore is the OPTIONAL persistence for multi-angle metadata. A
// separate interface (checked by assertion) so existing PipelineStore fakes keep
// compiling; *PGStore implements it. Both writes are best-effort.
type MultiImageStore interface {
	// RecordScanImages inserts one scan_images row per captured image and stamps
	// image_count + angle_agreement on the session.
	RecordScanImages(ctx context.Context, sessionID string, images []pipeline.PerImageResult, agreement *float64) error
}

// RecordScanImages persists per-image quality/geometry and the session-level
// multi-capture metadata.
func (s *PGStore) RecordScanImages(ctx context.Context, sessionID string, images []pipeline.PerImageResult, agreement *float64) error {
	for _, im := range images {
		geoJSON, err := json.Marshal(im.Geometry)
		if err != nil {
			geoJSON = []byte("null")
		}
		if _, err := s.q.Exec(ctx, `
			INSERT INTO scan_images (scan_session_id, angle, quality_score, geometry_result)
			VALUES ($1::uuid, $2, $3, $4::jsonb)`,
			sessionID, im.Angle, im.Quality.OverallScore, string(geoJSON)); err != nil {
			return err
		}
	}
	_, err := s.q.Exec(ctx,
		`UPDATE scan_sessions SET image_count = $2, angle_agreement = $3 WHERE id::text = $1`,
		sessionID, len(images), agreement)
	return err
}

// runScanPipeline runs the five passes (over one or more angle images) in the
// background and writes the result onto the analyzing food_log and its
// scan_session. Deliberately best-effort: any failure leaves the row as-is
// rather than crashing a detached goroutine. ctx should be detached from the
// request (context.Background with a timeout).
func runScanPipeline(ctx context.Context, images []pipeline.AngleImage, userID, logID, sessionID string, ident pipeline.FoodIdentifier, q db.Querier, store PipelineStore, start time.Time) {
	// This runs in a detached goroutine over untrusted image bytes; an
	// unrecovered panic here would take down the whole server process, so
	// contain it — but LOUDLY, and flip the row to 'failed' so the client's
	// poller surfaces the failure instead of an eternal 'Analyzing…' row.
	// (Pre-audit this was `_ = recover()`: silent, and the row stuck forever.)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("scan: pipeline panic (log %s, session %s): %v", logID, sessionID, r)
			// ctx may already be canceled/timed out — use a fresh one.
			failCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			if err := store.FinishScanLog(failCtx, logID, "failed", "", 0, 0, 0, 0, 0, 0, []byte("null")); err != nil {
				log.Printf("scan: could not mark log %s failed after panic: %v", logID, err)
			}
		}
	}()

	// Phase 13 E3: attach the per-user learned context so Gemini's prompt is
	// personalised. Best-effort — a fetch failure just means no context.
	ls, hasLearning := store.(LearningStore)
	if hasLearning {
		if block, err := ls.UserContextBlock(ctx, userID); err == nil && block != "" {
			ctx = pipeline.WithUserContext(ctx, block)
		}
	}

	outcome := pipeline.RunMulti(ctx, images, userID, ident, q)

	// Phase 13 signal 5: does this scan look like a meal the user already knows?
	var matched *MatchedMeal
	if hasLearning && len(outcome.Estimates) > 0 {
		if meals, err := ls.SavedMealsLite(ctx, userID); err == nil {
			names := make([]string, 0, len(outcome.Estimates))
			for _, e := range outcome.Estimates {
				names = append(names, e.FoodName)
			}
			matched = MatchRepeatMeal(names, meals)
		}
	}

	name, qty, cal, protein, carbs, fat, fibre := aggregateEstimates(outcome.Estimates)
	blob, err := json.Marshal(scanResultsBlob{ScanSessionID: sessionID, MatchedMeal: matched, Outcome: outcome})
	if err != nil {
		blob = []byte("null")
	}
	// Zero estimates means Gemini failed or identified nothing. Pre-audit this
	// still wrote 'ready', so the client rendered a successful review card for
	// a fabricated "Unknown food" — the exact defect class this app keeps
	// shipping. Write 'failed' and let the client's ScanFailedCard do its job.
	status := "ready"
	if len(outcome.Estimates) == 0 {
		status = "failed"
	}
	if err := store.FinishScanLog(ctx, logID, status, name, qty, cal, protein, carbs, fat, fibre, blob); err != nil {
		// Still best-effort (never crash the goroutine), but never silent: a
		// dropped finish strands the row at 'analyzing' with zero trace.
		log.Printf("scan: FinishScanLog %s → %s failed: %v", logID, status, err)
	}

	elapsedMs := int(time.Since(start).Milliseconds())
	if err := store.UpdatePipelineSession(ctx, sessionID,
		outcome.Quality.OverallScore, outcome.Geometry.ConfidencePoints,
		avgEstimateConfidence(outcome.Estimates), outcome.Confidence.Score,
		outcome.Geometry.ReferenceObject, outcome.Geometry.PlateDetected, elapsedMs); err != nil {
		log.Printf("scan: UpdatePipelineSession %s failed: %v", sessionID, err)
	}

	// Multi-angle metadata (optional interface so existing fakes keep working).
	if len(images) > 1 {
		if ms, ok := store.(MultiImageStore); ok {
			if err := ms.RecordScanImages(ctx, sessionID, outcome.PerImage, outcome.AngleAgreement); err != nil {
				log.Printf("scan: RecordScanImages %s failed: %v", sessionID, err)
			}
		}
	}
}

// avgEstimateConfidence is the mean per-estimate AI confidence (0 when empty).
func avgEstimateConfidence(estimates []pipeline.FoodEstimate) int {
	if len(estimates) == 0 {
		return 0
	}
	sum := 0
	for _, e := range estimates {
		sum += e.Confidence
	}
	return sum / len(estimates)
}

// aggregateEstimates rolls the per-region estimates into the single set of
// macros stored on the food_log row. Each region's contribution is
// weight × per-100g / 100.
func aggregateEstimates(estimates []pipeline.FoodEstimate) (name string, quantity, calories, protein, carbs, fat, fibre float64) {
	for _, e := range estimates {
		f := e.WeightG / 100.0
		quantity += e.WeightG
		calories += f * e.CaloriesPer100g
		protein += f * e.ProteinPer100g
		carbs += f * e.CarbsPer100g
		fat += f * e.FatPer100g
		fibre += f * e.FibrePer100g
	}
	switch {
	case len(estimates) == 0:
		name = "Unknown food"
	case len(estimates) == 1:
		name = estimates[0].FoodName
	default:
		name = fmt.Sprintf("%s + %d more", estimates[0].FoodName, len(estimates)-1)
	}
	return name, quantity, calories, protein, carbs, fat, fibre
}

// inFlightScans tracks background scan goroutines by their food_log id, so a
// graceful shutdown can tell which are still running and mark those rows
// 'failed' at its deadline — otherwise SIGTERM kills the goroutine outright
// with no chance to update its own row, and the client's poller waits on an
// 'analyzing' row forever.
type inFlightScans struct {
	wg sync.WaitGroup

	mu     sync.Mutex
	logIDs map[string]struct{}
}

func newInFlightScans() *inFlightScans {
	return &inFlightScans{logIDs: map[string]struct{}{}}
}

func (t *inFlightScans) start(logID string) {
	t.mu.Lock()
	t.logIDs[logID] = struct{}{}
	t.mu.Unlock()
	t.wg.Add(1)
}

func (t *inFlightScans) finish(logID string) {
	t.mu.Lock()
	delete(t.logIDs, logID)
	t.mu.Unlock()
	t.wg.Done()
}

// waitOrDeadline blocks until every tracked scan finishes or ctx ends,
// whichever comes first. It returns the log ids still running at that point
// (nil when everything finished cleanly).
func (t *inFlightScans) waitOrDeadline(ctx context.Context) []string {
	done := make(chan struct{})
	go func() {
		t.wg.Wait()
		close(done)
	}()
	select {
	case <-done:
		return nil
	case <-ctx.Done():
		t.mu.Lock()
		defer t.mu.Unlock()
		ids := make([]string, 0, len(t.logIDs))
		for id := range t.logIDs {
			ids = append(ids, id)
		}
		return ids
	}
}

// RegisterPipeline mounts the async pipeline scan (POST /api/scan/pipeline) and
// the nutrition-label scan (POST /api/scan/label). These are additive — the
// existing /api/scan and /api/scan/confirm routes (Register) are untouched.
//
// The returned drain func is graceful shutdown's other half: srv.Shutdown
// only waits for HTTP handlers, and the pipeline handoff to background
// goroutines happens BEFORE the handler returns, so those goroutines are
// invisible to it. Call drain with a bounded context during shutdown; it
// waits for in-flight scans and marks any still running at the deadline
// 'failed' instead of leaving them stranded at 'analyzing'.
func RegisterPipeline(mux *http.ServeMux, gem *pipeline.Gemini, store PipelineStore, q db.Querier) (drain func(ctx context.Context)) {
	// Backpressure: the pipeline runs detached from the request, so without a
	// cap every request spawns an unbounded goroutine doing megabytes of image
	// work. Slots are acquired BEFORE any row is written (no orphan 'analyzing'
	// rows) and never queued — a full pool answers 503 immediately.
	// ponytail: per-registration channel rather than a package global, so tests
	// can size it via LUME_SCAN_CONCURRENCY; main.go registers exactly once.
	concurrency := config.EnvInt("LUME_SCAN_CONCURRENCY", 4)
	if concurrency < 1 {
		concurrency = 1
	}
	sem := make(chan struct{}, concurrency)
	runTimeout := time.Duration(config.EnvInt("LUME_SCAN_TIMEOUT_SEC", 120)) * time.Second
	inFlight := newInFlightScans()

	mux.HandleFunc("POST /api/scan/pipeline", func(w http.ResponseWriter, r *http.Request) {
		// 5.1.2(i): photos go to Google Gemini — recorded consent first.
		if !requireScanConsent(w, r, store) {
			return
		}
		// Accepts EITHER the original single-image body (backward compatible)
		// OR a 1–3 element `images` array with per-image angle hints (Phase 13).
		var req struct {
			ImageBase64 string  `json:"image_base64"`
			MimeType    string  `json:"mime_type"`
			Date        string  `json:"date"`
			MealType    *string `json:"meal_type"`
			Images      []struct {
				ImageBase64 string `json:"image_base64"`
				MimeType    string `json:"mime_type"`
				Angle       string `json:"angle"`
			} `json:"images"`
		}
		if !decodeScanBody(w, r, &req) {
			return
		}
		if len(req.Images) > 3 {
			httpx.Error(w, http.StatusBadRequest, "at most 3 images per scan")
			return
		}
		if len(req.Images) == 0 && req.ImageBase64 == "" {
			httpx.Error(w, http.StatusBadRequest, "image_base64 is required")
			return
		}
		if !gem.Configured() {
			httpx.Error(w, http.StatusServiceUnavailable, "scan unavailable: GEMINI_API_KEY not set")
			return
		}

		// Normalize both shapes into []AngleImage; a bare single image is 'top'.
		type rawImage struct{ b64, mime, angle string }
		var raws []rawImage
		if len(req.Images) > 0 {
			for _, im := range req.Images {
				raws = append(raws, rawImage{im.ImageBase64, im.MimeType, im.Angle})
			}
		} else {
			raws = []rawImage{{req.ImageBase64, req.MimeType, "top"}}
		}
		images := make([]pipeline.AngleImage, 0, len(raws))
		for _, raw := range raws {
			if raw.b64 == "" {
				httpx.Error(w, http.StatusBadRequest, "every image needs image_base64")
				return
			}
			if !pipeline.ValidAngle(raw.angle) {
				httpx.Error(w, http.StatusBadRequest, "angle must be top, side or oblique")
				return
			}
			bytes, err := base64.StdEncoding.DecodeString(raw.b64)
			if err != nil {
				httpx.Error(w, http.StatusBadRequest, "image_base64 is not valid base64")
				return
			}
			if len(bytes) > maxImageBytes {
				httpx.Error(w, http.StatusRequestEntityTooLarge, "image too large")
				return
			}
			// maxImageBytes caps the COMPRESSED payload; a small file can still
			// declare a gigapixel bitmap. Reject on the header alone, before
			// anything allocates per pixel. A format we cannot parse locally
			// (heic/webp) is still left to Gemini, as before.
			if err := pipeline.CheckImageBounds(bytes); errors.Is(err, pipeline.ErrImageTooLarge) {
				httpx.Error(w, http.StatusRequestEntityTooLarge, "image dimensions too large")
				return
			}
			images = append(images, pipeline.AngleImage{Bytes: bytes, MimeType: raw.mime, Angle: raw.angle})
		}

		// Acquire a pipeline slot BEFORE writing any row (so a rejection leaves
		// no orphan 'analyzing' row) and never queue: a full pool answers 503.
		select {
		case sem <- struct{}{}:
		default:
			w.Header().Set("Retry-After", "1")
			httpx.Error(w, http.StatusServiceUnavailable, "scan capacity reached, retry shortly")
			return
		}
		handedOff := false
		defer func() {
			if !handedOff {
				<-sem
			}
		}()

		date := req.Date
		if date == "" {
			date = time.Now().UTC().Format("2006-01-02")
		} else if _, err := time.Parse("2006-01-02", date); err != nil {
			httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
			return
		}
		userID := auth.UserID(r.Context())
		logID, err := store.CreateAnalyzingLog(r.Context(), userID, date, req.MealType)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to create scan log")
			return
		}
		sessionID, err := store.CreatePipelineSession(r.Context(), userID, logID)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to create scan session")
			return
		}
		start := time.Now()
		// Detach from the request context — the handler returns immediately.
		// The goroutine owns the semaphore slot from here and its own timeout.
		handedOff = true
		inFlight.start(logID)
		go func() {
			defer func() { <-sem }()
			defer inFlight.finish(logID)
			bg, cancel := context.WithTimeout(context.Background(), runTimeout)
			defer cancel()
			runScanPipeline(bg, images, userID, logID, sessionID, gem, q, store, start)
		}()
		httpx.JSON(w, http.StatusAccepted, map[string]string{
			"log_id":          logID,
			"scan_session_id": sessionID,
			"status":          "analyzing",
		})
	})

	mux.HandleFunc("POST /api/scan/label", func(w http.ResponseWriter, r *http.Request) {
		// 5.1.2(i): the label photo goes to Google Gemini — consent first.
		if !requireScanConsent(w, r, store) {
			return
		}
		var req struct {
			ImageBase64 string `json:"image_base64"`
			MimeType    string `json:"mime_type"`
		}
		if !decodeScanBody(w, r, &req) {
			return
		}
		if req.ImageBase64 == "" {
			httpx.Error(w, http.StatusBadRequest, "image_base64 is required")
			return
		}
		if !gem.Configured() {
			httpx.Error(w, http.StatusServiceUnavailable, "scan unavailable: GEMINI_API_KEY not set")
			return
		}
		imageBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "image_base64 is not valid base64")
			return
		}
		if len(imageBytes) > maxImageBytes {
			httpx.Error(w, http.StatusRequestEntityTooLarge, "image too large")
			return
		}
		// Record the session BEFORE the paid call, so a failing Gemini request
		// still consumes quota. Cost control has to count attempts: otherwise a
		// caller who can make the call fail retries for free, forever.
		if _, err := store.CreateLabelSession(r.Context(), auth.UserID(r.Context())); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to start label scan")
			return
		}
		label, err := gem.ExtractLabel(r.Context(), imageBytes, req.MimeType)
		if err != nil {
			httpx.Error(w, http.StatusBadGateway, "label scan failed")
			return
		}
		// Labels carry real printed numbers, so confidence has a floor of 80.
		if label.Confidence < 80 {
			label.Confidence = 80
		}
		label.MacroSource = "label_scan"
		httpx.JSON(w, http.StatusOK, label)
	})

	return func(ctx context.Context) {
		remaining := inFlight.waitOrDeadline(ctx)
		if len(remaining) == 0 {
			return
		}
		log.Printf("scan: shutdown deadline reached with %d scan(s) still running — marking failed", len(remaining))
		// A fresh context, not ctx: ctx is what just expired, and a DB call
		// made with an already-canceled context fails immediately — the same
		// reason the panic-recovery path above uses context.Background().
		failCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		for _, logID := range remaining {
			if err := store.FinishScanLog(failCtx, logID, "failed", "", 0, 0, 0, 0, 0, 0, []byte("null")); err != nil {
				log.Printf("scan: shutdown could not mark log %s failed: %v", logID, err)
			}
		}
	}
}
