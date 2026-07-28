// Package scan implements photo food scanning via Gemini vision plus
// confirmation writes into food_logs.
package scan

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/db"
	"lumo/backend/internal/httpx"
)

// ErrNotFound is returned by Store lookups when a row does not exist.
var ErrNotFound = errors.New("not found")

// ConfirmedLog is a scan result the user confirmed for saving.
// Optional fields are pointers so omitted values insert NULL, matching the
// manual food.CreateLog write path (brand is never written by scan, so it is
// already NULL).
type ConfirmedLog struct {
	UserID        string   `json:"user_id"`
	Date          string   `json:"date"`
	MealType      *string  `json:"meal_type"`
	FoodName      string   `json:"food_name"`
	Quantity      *float64 `json:"quantity"`
	Unit          *string  `json:"unit"`
	Calories      float64  `json:"calories"`
	Protein       float64  `json:"protein"`
	Carbs         float64  `json:"carbs"`
	Fat           float64  `json:"fat"`
	Fibre         float64  `json:"fibre"`
	ScanSessionID *string  `json:"scan_session_id"`
}

// Correction is a user's edit to a scan result, submitted so the scanner can
// learn from it. UserID and CorrectionMagnitude are set server-side, never
// trusted from the request body.
type Correction struct {
	UserID                  string   `json:"-"`
	ScanSessionID           string   `json:"scan_session_id"`
	FoodNameOriginal        string   `json:"food_name_original"`
	FoodNameCorrected       string   `json:"food_name_corrected"`
	WeightOriginalG         float64  `json:"weight_original_g"`
	WeightCorrectedG        float64  `json:"weight_corrected_g"`
	CaloriesOriginal        float64  `json:"calories_original"`
	CaloriesCorrected       float64  `json:"calories_corrected"`
	ProteinOriginal         float64  `json:"protein_original"`
	ProteinCorrected        float64  `json:"protein_corrected"`
	CarbsOriginal           float64  `json:"carbs_original"`
	CarbsCorrected          float64  `json:"carbs_corrected"`
	FatOriginal             float64  `json:"fat_original"`
	FatCorrected            float64  `json:"fat_corrected"`
	TimeToCorrectionSeconds int      `json:"time_to_correction_seconds"`
	MacroSourceOriginal     string   `json:"macro_source_original"`
	CorrectionMagnitude     *float64 `json:"-"`
	// Phase 13 learning: type ('portion'|'identity'|'macro'|'discard', derived
	// when absent), the meal slot, and the local hour the log happened.
	CorrectionType string  `json:"correction_type"`
	MealType       *string `json:"meal_type"`
	LoggedHour     *int    `json:"logged_hour"`
}

// Session is a scan attempt, recorded so later /api/scan/confirm,
// /api/scan/correction, and /api/scan/feedback requests can reference it by
// id. image_quality_score, geometry_confidence, reference_object,
// camera_angle_deg, and plate_detected are intentionally left unset — the
// current OCR pipeline (gemini.go) doesn't produce them, so faking values
// here would be worse than leaving them NULL.
type Session struct {
	UserID            string
	ScanType          string
	AIConfidence      *int
	OverallConfidence *int
	ProcessingMs      *int
}

// CalibrationFactor is a per-food scan-weight multiplier learned from corrections.
type CalibrationFactor struct {
	FoodName    string  `json:"food_name"`
	Multiplier  float64 `json:"multiplier"`
	SampleCount int     `json:"sample_count"`
}

// AccuracySummary rolls up how a user's scans have needed correcting.
type AccuracySummary struct {
	TotalScans             int      `json:"total_scans"`
	CorrectedCount         int      `json:"corrected_count"`
	AvgCorrectionMagnitude float64  `json:"avg_correction_magnitude"`
	MostUnderestimated     []string `json:"most_underestimated"`
	MostOverestimated      []string `json:"most_overestimated"`
}

// Store persists confirmed scans and the correction/calibration data used to
// improve future scans.
type Store interface {
	// CreateSession inserts a scan_sessions row for a POST /api/scan call
	// and returns its id.
	CreateSession(ctx context.Context, s Session) (id string, err error)

	SaveConfirmed(ctx context.Context, log ConfirmedLog) (id string, err error)

	// SaveCorrection inserts a scan_corrections row and, when the weight
	// fields make it meaningful, updates the food's EWMA calibration factor
	// and portion preference. Returns whether calibration was updated.
	SaveCorrection(ctx context.Context, c Correction) (calibrationUpdated bool, err error)

	CalibrationFactors(ctx context.Context, userID string) ([]CalibrationFactor, error)
	AccuracySummary(ctx context.Context, userID string) (AccuracySummary, error)

	GetScanSessionOwner(ctx context.Context, id string) (string, error)
	UpdateScanRating(ctx context.Context, id, rating string) error
}

// PGStore writes confirmed scans to Postgres.
type PGStore struct{ q db.Querier }

// NewPGStore returns the concrete *PGStore (which satisfies both Store and
// PipelineStore) so a single instance can back Register and RegisterPipeline.
func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// CreateSession inserts a scan_sessions row so the returned id can be
// referenced by later confirm/correction/feedback calls.
func (s *PGStore) CreateSession(ctx context.Context, sess Session) (string, error) {
	// Ensure the profile row exists before hitting the FK (Clerk webhook may lag).
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, sess.UserID); err != nil {
		return "", err
	}
	var id string
	err := s.q.QueryRow(ctx,
		`INSERT INTO scan_sessions (user_id, scan_type, ai_confidence, overall_confidence, processing_ms)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id`,
		sess.UserID, sess.ScanType, sess.AIConfidence, sess.OverallConfidence, sess.ProcessingMs).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (s *PGStore) SaveConfirmed(ctx context.Context, log ConfirmedLog) (string, error) {
	// Ensure the profile row exists before hitting the FK (Clerk webhook may lag).
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, log.UserID); err != nil {
		return "", err
	}
	var id string
	err := s.q.QueryRow(ctx,
		`INSERT INTO food_logs (user_id, date, meal_type, food_name, quantity, unit,
		                        calories, protein, carbs, fat, fibre, source)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'scan')
		 RETURNING id`,
		log.UserID, log.Date, log.MealType, log.FoodName, log.Quantity, log.Unit,
		log.Calories, log.Protein, log.Carbs, log.Fat, log.Fibre).Scan(&id)
	if err != nil {
		return "", err
	}

	if log.ScanSessionID != nil && *log.ScanSessionID != "" {
		// Best-effort: linking the session back to the food_log it produced
		// must never fail the confirm itself. ponytail: error swallowed
		// rather than logged (no logger wired into this package, same as
		// the learning hooks below).
		_, _ = s.q.Exec(ctx,
			`UPDATE scan_sessions SET food_log_id = $1 WHERE id::text = $2`, id, *log.ScanSessionID)
	}

	// Learning hooks are best-effort: a failure here must never fail the
	// confirm request itself. ponytail: errors swallowed rather than logged
	// (no logger wired into this package) — add one if this needs
	// observability later.
	if log.Quantity != nil && *log.Quantity > 0 {
		var mealType *string
		if log.MealType != nil && *log.MealType != "" {
			mealType = log.MealType
		}
		_ = s.upsertPortionPref(ctx, log.UserID, log.FoodName, *log.Quantity, mealType, time.Now().UTC())
	}
	_ = s.flagNeedsRebuild(ctx, log.UserID)

	return id, nil
}

// upsertPortionPref runs a weighted-average update of the user's typical
// portion size for a food: typical_weight_g moves toward weightG by one more
// sample, logged_count increments, last_logged advances. typical_meal_type is
// the majority meal_type across the food's food_logs history (same
// GROUP BY/ORDER BY count(*) DESC subquery as food/learning.go's
// UpsertPortionPref — one newest-log outlier must never clobber an
// established pattern), falling back to the new value only when there's no
// history yet.
func (s *PGStore) upsertPortionPref(ctx context.Context, userID, foodName string, weightG float64, mealType *string, now time.Time) error {
	_, err := s.q.Exec(ctx, `
		INSERT INTO user_portion_prefs (user_id, food_name, typical_weight_g, typical_meal_type, logged_count, last_logged)
		VALUES ($1, $2, $3, $4, 1, $5)
		ON CONFLICT (user_id, food_name) DO UPDATE SET
			typical_weight_g = (coalesce(user_portion_prefs.typical_weight_g, excluded.typical_weight_g) * user_portion_prefs.logged_count + excluded.typical_weight_g) / (user_portion_prefs.logged_count + 1),
			typical_meal_type = coalesce(
				(SELECT meal_type FROM food_logs
				 WHERE user_id = $1 AND food_name = $2 AND meal_type IS NOT NULL
				 GROUP BY meal_type ORDER BY count(*) DESC LIMIT 1),
				excluded.typical_meal_type),
			logged_count = user_portion_prefs.logged_count + 1,
			last_logged = excluded.last_logged`,
		userID, foodName, weightG, mealType, now)
	return err
}

// flagNeedsRebuild sets ai_user_brain.needs_rebuild once a user has logged
// enough food since their last rebuild to be worth re-summarizing. Bounded:
// only fires when not already flagged and at least 5 qualifying logs exist,
// so it's cheap to call after every confirm.
func (s *PGStore) flagNeedsRebuild(ctx context.Context, userID string) error {
	_, err := s.q.Exec(ctx, `
		UPDATE ai_user_brain b
		SET needs_rebuild = true
		WHERE b.user_id = $1
		  AND b.needs_rebuild = false
		  AND (SELECT count(*) FROM food_logs f
		       WHERE f.user_id = $1 AND f.created_at > coalesce(b.last_rebuilt, 'epoch'::timestamptz)) >= 5`,
		userID)
	return err
}

// SaveCorrection persists a scan correction and, when the weight fields make
// it meaningful, folds it into the food's EWMA calibration factor and the
// user's portion preference for that food.
func (s *PGStore) SaveCorrection(ctx context.Context, c Correction) (bool, error) {
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, c.UserID); err != nil {
		return false, err
	}
	var scanSessionID any
	if c.ScanSessionID != "" {
		scanSessionID = c.ScanSessionID
	}
	ctype := ClassifyCorrection(c)
	_, err := s.q.Exec(ctx, `
		INSERT INTO scan_corrections (user_id, scan_session_id, food_name_original, food_name_corrected,
			weight_original_g, weight_corrected_g, calories_original, calories_corrected,
			protein_original, protein_corrected, carbs_original, carbs_corrected,
			fat_original, fat_corrected, correction_magnitude, time_to_correction_seconds, macro_source_original,
			correction_type, meal_type, logged_hour)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
		c.UserID, scanSessionID, c.FoodNameOriginal, c.FoodNameCorrected,
		c.WeightOriginalG, c.WeightCorrectedG, c.CaloriesOriginal, c.CaloriesCorrected,
		c.ProteinOriginal, c.ProteinCorrected, c.CarbsOriginal, c.CarbsCorrected,
		c.FatOriginal, c.FatCorrected, c.CorrectionMagnitude, c.TimeToCorrectionSeconds, c.MacroSourceOriginal,
		ctype, c.MealType, c.LoggedHour)
	if err != nil {
		return false, err
	}

	// Signal 3: fold this correction's magnitude into the predicted band's
	// running mean (bounded, SQL-side math — no read-modify-write race).
	if c.CorrectionMagnitude != nil && c.ScanSessionID != "" {
		_ = s.updateConfidenceBand(ctx, c.ScanSessionID, *c.CorrectionMagnitude)
	}

	// Signal 6: a discard is the strongest negative signal — mark the session and
	// stop. It must not move any portion learning.
	if ctype == CorrectionDiscard {
		if c.ScanSessionID != "" {
			_, _ = s.q.Exec(ctx, `UPDATE scan_sessions SET discarded = true WHERE id::text = $1`, c.ScanSessionID)
		}
		return false, nil
	}

	// Signal 2: an identity correction is a MISIDENTIFICATION, not a portion
	// error — record the affinity and leave the portion multiplier alone.
	if ctype == CorrectionIdentity {
		if err := s.upsertAffinity(ctx, c.UserID, c.FoodNameOriginal, c.FoodNameCorrected); err != nil {
			return false, err
		}
		return false, nil
	}

	if c.WeightOriginalG <= 0 || c.WeightCorrectedG <= 0 || c.FoodNameOriginal == "" {
		return false, nil
	}

	now := time.Now().UTC()
	// Signal 1: food-level EWMA (meal_type NULL) plus, when the meal slot is
	// known, the meal-scoped row (signals 1+4).
	if err := s.updateCalibrationLocked(ctx, c.UserID, c.FoodNameOriginal, nil, c.WeightOriginalG, c.WeightCorrectedG, now); err != nil {
		return false, err
	}
	if c.MealType != nil && *c.MealType != "" {
		if err := s.updateCalibrationLocked(ctx, c.UserID, c.FoodNameOriginal, c.MealType, c.WeightOriginalG, c.WeightCorrectedG, now); err != nil {
			return false, err
		}
	}

	if err := s.upsertPortionPref(ctx, c.UserID, c.FoodNameOriginal, c.WeightCorrectedG, nil, now); err != nil {
		return false, err
	}

	return true, nil
}

// upsertAffinity records "AI said X, user picked Y" (signal 2).
func (s *PGStore) upsertAffinity(ctx context.Context, userID, aiSuggested, userChose string) error {
	if aiSuggested == "" || userChose == "" {
		return nil
	}
	_, err := s.q.Exec(ctx, `
		INSERT INTO user_food_affinity (user_id, ai_suggested, user_chose, occurrences, last_seen)
		VALUES ($1, $2, $3, 1, now())
		ON CONFLICT (user_id, ai_suggested, user_chose) DO UPDATE SET
			occurrences = user_food_affinity.occurrences + 1,
			last_seen = now()`,
		userID, aiSuggested, userChose)
	return err
}

// updateConfidenceBand folds one correction magnitude into the global
// confidence_calibration row for the session's predicted band. The mean update
// happens inside the UPDATE's SET (no read-modify-write race).
func (s *PGStore) updateConfidenceBand(ctx context.Context, sessionID string, magnitude float64) error {
	var score *int
	if err := s.q.QueryRow(ctx,
		`SELECT overall_confidence FROM scan_sessions WHERE id::text = $1`, sessionID).Scan(&score); err != nil {
		return err
	}
	if score == nil {
		return nil
	}
	band := BandForScore(*score)
	if _, err := s.q.Exec(ctx, `
		INSERT INTO confidence_calibration (predicted_band, sample_count, mean_correction_magnitude)
		VALUES ($1, 0, NULL)
		ON CONFLICT (predicted_band) DO NOTHING`, band); err != nil {
		return err
	}
	_, err := s.q.Exec(ctx, `
		UPDATE confidence_calibration SET
			mean_correction_magnitude = (COALESCE(mean_correction_magnitude, 0) * sample_count + $2) / (sample_count + 1),
			sample_count = sample_count + 1,
			updated_at = now()
		WHERE predicted_band = $1`, band, magnitude)
	return err
}

// updateCalibrationLocked reads and rewrites a user_scan_calibration row
// inside one transaction, holding a row lock (SELECT ... FOR UPDATE) across
// the read and the write. Without this, two concurrent corrections for the
// same user+food could both read the same starting factor/sample_count and
// the later UPSERT would silently clobber the earlier one's contribution —
// see upsertPortionPref above for the equivalent problem solved by folding
// the increment into the UPDATE's own SET expression; here the update
// (updateCalibration) is pure Go, not SQL-expressible, so it needs an
// explicit lock instead.
//
// INSERT ... ON CONFLICT DO NOTHING before the locking SELECT handles the
// first-ever-correction case without a separate insert/update branch: the
// row is guaranteed to exist by the time SELECT ... FOR UPDATE runs.
// mealType nil → the food-level row; non-nil → the meal-scoped row (Phase 13
// signal 1/4). Uniqueness is the expression index (user_id, food_name,
// coalesce(meal_type, ”)), so ON CONFLICT targets that expression.
func (s *PGStore) updateCalibrationLocked(ctx context.Context, userID, foodName string, mealType *string, weightOriginal, weightCorrected float64, now time.Time) error {
	tx, err := s.q.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) // no-op once committed

	if _, err := tx.Exec(ctx, `
		INSERT INTO user_scan_calibration (user_id, food_name, meal_type, weight_multiplier_ewma, sample_count, last_updated)
		VALUES ($1, $2, $3, 1.0, 0, $4)
		ON CONFLICT (user_id, food_name, coalesce(meal_type, '')) DO NOTHING`,
		userID, foodName, mealType, now); err != nil {
		return err
	}

	var factor float64
	var sampleCount int
	var lastUpdated time.Time
	if err := tx.QueryRow(ctx, `
		SELECT weight_multiplier_ewma, sample_count, last_updated FROM user_scan_calibration
		WHERE user_id = $1 AND food_name = $2 AND coalesce(meal_type, '') = coalesce($3, '') FOR UPDATE`,
		userID, foodName, mealType).
		Scan(&factor, &sampleCount, &lastUpdated); err != nil {
		return err
	}

	newFactor, newSampleCount := updateCalibration(factor, sampleCount, lastUpdated, weightOriginal, weightCorrected, now)

	if _, err := tx.Exec(ctx, `
		UPDATE user_scan_calibration SET weight_multiplier_ewma = $1, sample_count = $2, last_updated = $3
		WHERE user_id = $4 AND food_name = $5 AND coalesce(meal_type, '') = coalesce($6, '')`,
		newFactor, newSampleCount, now, userID, foodName, mealType); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// CalibrationFactors lists a user's learned per-food scan-weight multipliers,
// most-corrected food first.
func (s *PGStore) CalibrationFactors(ctx context.Context, userID string) ([]CalibrationFactor, error) {
	rows, err := s.q.Query(ctx, `
		SELECT food_name, weight_multiplier_ewma, sample_count
		FROM user_scan_calibration
		WHERE user_id = $1 AND meal_type IS NULL
		ORDER BY sample_count DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CalibrationFactor
	for rows.Next() {
		var f CalibrationFactor
		if err := rows.Scan(&f.FoodName, &f.Multiplier, &f.SampleCount); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

// AccuracySummary rolls up how a user's scans have needed correcting.
// Independently implemented from the same formula family as internal/ai's
// ScanAccuracyProfile (this package has no dependency on internal/ai), but
// deliberately matches its windowing (last 90 days) and food-identity
// normalization (case/whitespace-insensitive grouping in topCorrectedFoods)
// so GET /api/scan/calibration and GET /api/ai/brain report the same
// numbers for the same underlying data.
func (s *PGStore) AccuracySummary(ctx context.Context, userID string) (AccuracySummary, error) {
	var sum AccuracySummary
	if err := s.q.QueryRow(ctx,
		`SELECT count(*) FROM scan_sessions WHERE user_id = $1`, userID).Scan(&sum.TotalScans); err != nil {
		return sum, err
	}
	if err := s.q.QueryRow(ctx,
		`SELECT count(*), coalesce(avg(correction_magnitude), 0) FROM scan_corrections
		 WHERE user_id = $1 AND created_at >= now() - interval '90 days'`, userID).
		Scan(&sum.CorrectedCount, &sum.AvgCorrectionMagnitude); err != nil {
		return sum, err
	}
	under, err := s.topCorrectedFoods(ctx, userID, "DESC")
	if err != nil {
		return sum, err
	}
	over, err := s.topCorrectedFoods(ctx, userID, "ASC")
	if err != nil {
		return sum, err
	}
	sum.MostUnderestimated = under
	sum.MostOverestimated = over
	return sum, nil
}

// topCorrectedFoods returns the top 3 distinct foods (by
// lower(trim(food_name_original)), so "Chicken Rice" and "chicken rice"
// count as the same food — matching internal/ai's BuildScanAccuracyProfile
// grouping) by average (weight_corrected_g - weight_original_g) /
// weight_original_g over the last 90 days, ordered by direction ("DESC" for
// underestimated, "ASC" for overestimated). min(food_name_original) picks a
// representative display name for each normalized group.
func (s *PGStore) topCorrectedFoods(ctx context.Context, userID, direction string) ([]string, error) {
	rows, err := s.q.Query(ctx, fmt.Sprintf(`
		SELECT min(food_name_original)
		FROM scan_corrections
		WHERE user_id = $1 AND weight_original_g > 0
		  AND food_name_original IS NOT NULL AND food_name_original <> ''
		  AND created_at >= now() - interval '90 days'
		GROUP BY lower(trim(food_name_original))
		ORDER BY avg((weight_corrected_g - weight_original_g) / weight_original_g) %s
		LIMIT 3`, direction), userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		out = append(out, name)
	}
	return out, rows.Err()
}

// GetScanSessionOwner returns the owning user's id, or ErrNotFound. id::text
// comparison keeps a malformed id a clean not-found instead of a query error.
func (s *PGStore) GetScanSessionOwner(ctx context.Context, id string) (string, error) {
	var owner string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM scan_sessions WHERE id::text = $1`, id).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return owner, err
}

func (s *PGStore) UpdateScanRating(ctx context.Context, id, rating string) error {
	_, err := s.q.Exec(ctx, `UPDATE scan_sessions SET rating = $1 WHERE id::text = $2`, rating, id)
	return err
}

// Register mounts the scan routes.
func Register(mux *http.ServeMux, ocr OCR, store Store) {
	mux.HandleFunc("POST /api/scan", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ImageBase64 string `json:"image_base64"`
			MimeType    string `json:"mime_type"`
		}
		if err := httpx.Decode(r, &req); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if req.ImageBase64 == "" {
			httpx.Error(w, http.StatusBadRequest, "image_base64 is required")
			return
		}
		if req.MimeType == "" {
			req.MimeType = "image/jpeg"
		}
		start := time.Now()
		result, err := ocr.Extract(r.Context(), req.ImageBase64, req.MimeType)
		elapsedMs := int(time.Since(start).Milliseconds())
		if errors.Is(err, ErrUnavailable) {
			httpx.Error(w, http.StatusServiceUnavailable, "scan unavailable: GEMINI_API_KEY not set")
			return
		}
		if err != nil {
			httpx.Error(w, http.StatusBadGateway, "scan failed")
			return
		}

		confPct := confidencePercent(result.Confidence)
		sessionID, err := store.CreateSession(r.Context(), Session{
			UserID:            auth.UserID(r.Context()),
			ScanType:          "photo",
			AIConfidence:      &confPct,
			OverallConfidence: &confPct,
			ProcessingMs:      &elapsedMs,
		})
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to save scan session")
			return
		}
		result.ScanSessionID = sessionID

		httpx.JSON(w, http.StatusOK, result)
	})

	mux.HandleFunc("POST /api/scan/confirm", func(w http.ResponseWriter, r *http.Request) {
		var log ConfirmedLog
		if err := httpx.Decode(r, &log); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if log.FoodName == "" {
			httpx.Error(w, http.StatusBadRequest, "food_name is required")
			return
		}
		if log.Calories < 0 {
			httpx.Error(w, http.StatusBadRequest, "calories must be >= 0")
			return
		}
		if log.Date == "" {
			log.Date = time.Now().UTC().Format("2006-01-02")
		} else if _, err := time.Parse("2006-01-02", log.Date); err != nil {
			httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
			return
		}
		log.UserID = auth.UserID(r.Context())
		id, err := store.SaveConfirmed(r.Context(), log)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to save log")
			return
		}
		httpx.JSON(w, http.StatusCreated, struct {
			ID     string `json:"id"`
			Source string `json:"source"`
			ConfirmedLog
		}{ID: id, Source: "scan", ConfirmedLog: log})
	})

	mux.HandleFunc("POST /api/scan/correction", func(w http.ResponseWriter, r *http.Request) {
		var c Correction
		if err := httpx.Decode(r, &c); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if c.FoodNameOriginal == "" || c.FoodNameCorrected == "" {
			httpx.Error(w, http.StatusBadRequest, "food_name_original and food_name_corrected are required")
			return
		}
		c.UserID = auth.UserID(r.Context())
		if c.ScanSessionID != "" {
			// Mirror the ownership check POST /api/scan/feedback already does
			// below — a client must not be able to attach a correction to
			// another user's scan session.
			owner, err := store.GetScanSessionOwner(r.Context(), c.ScanSessionID)
			if errors.Is(err, ErrNotFound) {
				httpx.Error(w, http.StatusNotFound, "scan session not found")
				return
			}
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "lookup failed")
				return
			}
			if owner != c.UserID {
				httpx.Error(w, http.StatusForbidden, "forbidden")
				return
			}
		}
		if c.WeightOriginalG > 0 {
			m := math.Abs((c.WeightCorrectedG - c.WeightOriginalG) / c.WeightOriginalG)
			c.CorrectionMagnitude = &m
		}
		calibrationUpdated, err := store.SaveCorrection(r.Context(), c)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to save correction")
			return
		}
		httpx.JSON(w, http.StatusOK, struct {
			Success            bool `json:"success"`
			CalibrationUpdated bool `json:"calibration_updated"`
		}{true, calibrationUpdated})
	})

	mux.HandleFunc("GET /api/scan/calibration", func(w http.ResponseWriter, r *http.Request) {
		userID := auth.UserID(r.Context())
		factors, err := store.CalibrationFactors(r.Context(), userID)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to load calibration")
			return
		}
		if factors == nil {
			factors = []CalibrationFactor{}
		}
		summary, err := store.AccuracySummary(r.Context(), userID)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to load accuracy summary")
			return
		}
		httpx.JSON(w, http.StatusOK, struct {
			Factors         []CalibrationFactor `json:"factors"`
			AccuracySummary AccuracySummary     `json:"accuracy_summary"`
		}{factors, summary})
	})

	// Phase 13 signal 3+6: global confidence-calibration report + discard
	// aggregates. Optional store capability (assertion) so existing fakes keep
	// compiling; stores without it return an empty report.
	mux.HandleFunc("GET /api/scan/calibration-report", func(w http.ResponseWriter, r *http.Request) {
		rs, ok := store.(ReportStore)
		if !ok {
			httpx.JSON(w, http.StatusOK, CalibrationReport{Bands: []BandStat{}, Warnings: []string{}})
			return
		}
		report, err := rs.CalibrationReport(r.Context())
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to load calibration report")
			return
		}
		httpx.JSON(w, http.StatusOK, report)
	})

	mux.HandleFunc("POST /api/scan/feedback", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ScanSessionID string `json:"scan_session_id"`
			Rating        string `json:"rating"`
		}
		if err := httpx.Decode(r, &req); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if !validRatings[req.Rating] {
			httpx.Error(w, http.StatusBadRequest, "rating must be one of way_off, a_bit_off, pretty_good, spot_on")
			return
		}
		owner, err := store.GetScanSessionOwner(r.Context(), req.ScanSessionID)
		if errors.Is(err, ErrNotFound) {
			httpx.Error(w, http.StatusNotFound, "scan session not found")
			return
		}
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "lookup failed")
			return
		}
		if owner != auth.UserID(r.Context()) {
			httpx.Error(w, http.StatusForbidden, "forbidden")
			return
		}
		if err := store.UpdateScanRating(r.Context(), req.ScanSessionID, req.Rating); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to update rating")
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]bool{"updated": true})
	})
}

var validRatings = map[string]bool{
	"way_off": true, "a_bit_off": true, "pretty_good": true, "spot_on": true,
}

// confidencePercent maps scan.Result.Confidence (a 0..1 float from the OCR
// prompt) onto scan_sessions' integer ai_confidence/overall_confidence
// percentage columns.
func confidencePercent(confidence float64) int {
	return int(clamp(math.Round(confidence*100), 0, 100))
}

// CountScansToday counts the user's AI scans in the current server-calendar
// day, backing the free-tier scan quota. Counting existing scan_sessions rows
// avoids a second source of truth (and a migration): every paid Gemini call
// writes exactly one session row.
func (s *PGStore) CountScansToday(ctx context.Context, userID string) (int, error) {
	var n int
	err := s.q.QueryRow(ctx,
		`SELECT count(*) FROM scan_sessions
		 WHERE user_id = $1 AND created_at >= date_trunc('day', now())`,
		userID).Scan(&n)
	return n, err
}
