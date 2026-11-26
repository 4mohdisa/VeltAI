package scantests

// Real-Postgres tests for the scan learning store: corrections and the
// calibration they feed, session lookups, the per-user prompt context, the
// global calibration report and the pipeline session writes. Skipped unless
// LUME_TEST_DATABASE_URL points at a disposable database with the migrations
// applied, like the other TestPG_ suites in this package.

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
)

const unknownSessionID = "00000000-0000-0000-0000-000000000000"

func ip(v int) *int       { return &v }
func sp(v string) *string { return &v }

func newSession(t *testing.T, s *scan.PGStore, user string, overall *int) string {
	t.Helper()
	id, err := s.CreateSession(context.Background(), scan.Session{UserID: user, ScanType: "photo", AIConfidence: ip(70), OverallConfidence: overall, ProcessingMs: ip(900)})
	if err != nil {
		t.Fatalf("CreateSession: %v", err)
	}
	return id
}

// keepBand restores the global confidence_calibration row for band after the
// test, so corrections made here do not leak into other suites.
func keepBand(t *testing.T, pool *pgxpool.Pool, band string) {
	t.Helper()
	ctx := context.Background()
	var count int
	var mean *float64
	err := pool.QueryRow(ctx, `SELECT sample_count, mean_correction_magnitude FROM confidence_calibration WHERE predicted_band = $1`, band).Scan(&count, &mean)
	existed := err == nil
	t.Cleanup(func() {
		if existed {
			_, _ = pool.Exec(context.Background(), `UPDATE confidence_calibration SET sample_count = $2, mean_correction_magnitude = $3 WHERE predicted_band = $1`, band, count, mean)
			return
		}
		_, _ = pool.Exec(context.Background(), `DELETE FROM confidence_calibration WHERE predicted_band = $1`, band)
	})
}

func countRows(t *testing.T, pool *pgxpool.Pool, sql string, args ...any) int {
	t.Helper()
	var n int
	if err := pool.QueryRow(context.Background(), sql, args...).Scan(&n); err != nil {
		t.Fatalf("count (%s): %v", sql, err)
	}
	return n
}

func TestPG_SaveCorrectionFeedsTheRightSignal(t *testing.T) {
	s, pool := pgScanStore(t)
	ctx := context.Background()
	user := freshUser(t, pool, "user_pg_scan_corrections")
	keepBand(t, pool, "high")
	session := newSession(t, s, user, ip(80))
	mag := 0.5

	steps := []struct {
		name       string
		c          scan.Correction
		wantPortio bool
	}{
		{"portion with meal slot", scan.Correction{ScanSessionID: session, FoodNameOriginal: "Rice", WeightOriginalG: 100, WeightCorrectedG: 150,
			CorrectionMagnitude: &mag, MealType: sp("lunch")}, true},
		{"second portion, other casing", scan.Correction{FoodNameOriginal: "rice ", WeightOriginalG: 100, WeightCorrectedG: 140}, true},
		{"overestimate", scan.Correction{FoodNameOriginal: "Pasta", WeightOriginalG: 200, WeightCorrectedG: 100}, true},
		{"identity", scan.Correction{FoodNameOriginal: "Rice", FoodNameCorrected: "Brown Rice"}, false},
		{"identity again", scan.Correction{FoodNameOriginal: "Rice", FoodNameCorrected: "Brown Rice"}, false},
		{"macro only, no weights", scan.Correction{FoodNameOriginal: "Soup", CaloriesOriginal: 200, CaloriesCorrected: 250}, false},
		{"discard", scan.Correction{ScanSessionID: session, CorrectionType: scan.CorrectionDiscard, FoodNameOriginal: "Rice", WeightOriginalG: 100, WeightCorrectedG: 300}, false},
	}
	for _, st := range steps {
		st.c.UserID = user
		got, err := s.SaveCorrection(ctx, st.c)
		if err != nil || got != st.wantPortio {
			t.Fatalf("%s: SaveCorrection = %v, %v, want %v", st.name, got, err, st.wantPortio)
		}
	}

	if n := countRows(t, pool, `SELECT count(*) FROM scan_corrections WHERE user_id = $1`, user); n != len(steps) {
		t.Fatalf("scan_corrections rows = %d, want %d", n, len(steps))
	}
	if n := countRows(t, pool, `SELECT occurrences FROM user_food_affinity WHERE user_id = $1 AND ai_suggested = 'Rice' AND user_chose = 'Brown Rice'`, user); n != 2 {
		t.Fatalf("affinity occurrences = %d, want 2", n)
	}
	if n := countRows(t, pool, `SELECT count(*) FROM scan_sessions WHERE id = $1 AND discarded`, session); n != 1 {
		t.Fatal("discard did not mark the session")
	}
	if n := countRows(t, pool, `SELECT count(*) FROM user_scan_calibration WHERE user_id = $1 AND meal_type = 'lunch'`, user); n != 1 {
		t.Fatalf("meal-scoped calibration rows = %d, want 1", n)
	}
	if n := countRows(t, pool, `SELECT count(*) FROM user_portion_prefs WHERE user_id = $1`, user); n != 3 {
		t.Fatalf("portion prefs = %d, want Rice, rice and Pasta", n)
	}

	factors, err := s.CalibrationFactors(ctx, user)
	if err != nil || len(factors) != 3 {
		t.Fatalf("CalibrationFactors = %+v, %v, want 3 food-level rows", factors, err)
	}
	for _, f := range factors {
		if f.SampleCount != 1 || (f.FoodName == "Pasta") != (f.Multiplier < 1) {
			t.Fatalf("factor %+v: want one sample, below 1 only for Pasta", f)
		}
	}

	sum, err := s.AccuracySummary(ctx, user)
	if err != nil {
		t.Fatalf("AccuracySummary: %v", err)
	}
	if sum.TotalScans != 1 || sum.CorrectedCount != len(steps) || sum.AvgCorrectionMagnitude != mag {
		t.Fatalf("summary = %+v", sum)
	}
	// "Rice" and "rice " group as one food; the discard (+200%) lifts it to the top.
	if len(sum.MostUnderestimated) != 2 || !strings.EqualFold(strings.TrimSpace(sum.MostUnderestimated[0]), "rice") || sum.MostUnderestimated[1] != "Pasta" {
		t.Fatalf("most underestimated = %v, want rice then Pasta", sum.MostUnderestimated)
	}
	if len(sum.MostOverestimated) != 2 || sum.MostOverestimated[0] != "Pasta" {
		t.Fatalf("most overestimated = %v, want Pasta first", sum.MostOverestimated)
	}
}

func TestPG_ScanSessionLookups(t *testing.T) {
	s, pool := pgScanStore(t)
	ctx := context.Background()
	user := freshUser(t, pool, "user_pg_scan_lookups")
	session := newSession(t, s, user, nil)

	cases := []struct {
		name, id string
		wantErr  error
	}{
		{"own session", session, nil},
		{"malformed id", "nope", scan.ErrNotFound},
		{"unknown id", unknownSessionID, scan.ErrNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			owner, err := s.GetScanSessionOwner(ctx, tc.id)
			if !errors.Is(err, tc.wantErr) || (tc.wantErr == nil && owner != user) {
				t.Fatalf("GetScanSessionOwner = %q, %v, want %v", owner, err, tc.wantErr)
			}
		})
	}

	if err := s.UpdateScanRating(ctx, session, "accurate"); err != nil {
		t.Fatalf("UpdateScanRating: %v", err)
	}
	if n := countRows(t, pool, `SELECT count(*) FROM scan_sessions WHERE id = $1 AND rating = 'accurate'`, session); n != 1 {
		t.Fatal("rating not stored")
	}

	for _, id := range []string{user, "user_pg_scan_never_seen"} {
		if at, err := s.AIConsentAt(ctx, id); at != nil || err != nil {
			t.Fatalf("AIConsentAt(%s) = %v, %v, want nil, nil", id, at, err)
		}
	}
	if _, err := pool.Exec(ctx, `UPDATE profiles SET ai_consent_at = now() WHERE id = $1`, user); err != nil {
		t.Fatalf("record consent: %v", err)
	}
	if at, err := s.AIConsentAt(ctx, user); at == nil || err != nil {
		t.Fatalf("AIConsentAt after consent = %v, %v", at, err)
	}
}

func TestPG_UserContextAndSavedMeals(t *testing.T) {
	s, pool := pgScanStore(t)
	ctx := context.Background()
	user := freshUser(t, pool, "user_pg_scan_context")

	if block, err := s.UserContextBlock(ctx, user); block != "" || err != nil {
		t.Fatalf("empty history block = %q, %v, want empty", block, err)
	}
	if meals, err := s.SavedMealsLite(ctx, user); len(meals) != 0 || err != nil {
		t.Fatalf("SavedMealsLite(empty) = %+v, %v", meals, err)
	}

	seed := []string{
		`INSERT INTO user_cuisine_preferences (user_id, cuisines) VALUES ($1, '{Thai,Italian}')`,
		`INSERT INTO food_logs (user_id, date, food_name) SELECT $1, '2026-07-14', 'Oats' FROM generate_series(1, 3)`,
		`INSERT INTO food_logs (user_id, date, food_name, status) SELECT $1, '2026-07-14', 'Analyzing…', 'analyzing' FROM generate_series(1, 3)`,
		`INSERT INTO user_food_affinity (user_id, ai_suggested, user_chose, occurrences, last_seen) VALUES ($1, 'Rice', 'Brown Rice', 4, now())`,
		`INSERT INTO user_scan_calibration (user_id, food_name, weight_multiplier_ewma, sample_count, last_updated) VALUES ($1, 'Pasta', 1.3, 5, now())`,
		`WITH m AS (INSERT INTO saved_meals (user_id, name, logged_count) VALUES ($1, 'Bowl', 5) RETURNING id)
		 INSERT INTO saved_meal_items (saved_meal_id, food_name, quantity_g) SELECT id, f, q FROM m, (VALUES ('Chicken', 150.0), ('Rice', 200.0)) v(f, q)`,
		`WITH m AS (INSERT INTO saved_meals (user_id, name, logged_count) VALUES ($1, 'Snack', 1) RETURNING id)
		 INSERT INTO saved_meal_items (saved_meal_id, food_name, quantity_g) SELECT id, 'Apple', 120 FROM m`,
	}
	for _, sql := range seed {
		if _, err := pool.Exec(ctx, sql, user); err != nil {
			t.Fatalf("seed: %v\n%s", err, sql)
		}
	}

	block, err := s.UserContextBlock(ctx, user)
	if err != nil {
		t.Fatalf("UserContextBlock: %v", err)
	}
	for _, want := range []string{"- Cuisines: Thai, Italian", "- Frequently logged: Oats", `"Rice" → "Brown Rice" (x4)`, "Pasta ~1.3x typical"} {
		if !strings.Contains(block, want) {
			t.Errorf("context block missing %q:\n%s", want, block)
		}
	}
	if strings.Contains(block, "Analyzing") {
		t.Errorf("context block counts an analyzing placeholder:\n%s", block)
	}

	meals, err := s.SavedMealsLite(ctx, user)
	if err != nil || len(meals) != 2 || meals[0].Name != "Bowl" || len(meals[0].Foods) != 2 || len(meals[0].Weights) != 2 || meals[1].Name != "Snack" {
		t.Fatalf("SavedMealsLite = %+v, %v, want Bowl (2 items) then Snack", meals, err)
	}
}

func TestPG_PipelineSessionWritesAndReport(t *testing.T) {
	s, pool := pgScanStore(t)
	ctx := context.Background()
	user := freshUser(t, pool, "user_pg_scan_pipeline_store")

	label, err := s.CreateLabelSession(ctx, user)
	if err != nil {
		t.Fatalf("CreateLabelSession: %v", err)
	}
	if n := countRows(t, pool, `SELECT count(*) FROM scan_sessions WHERE id = $1 AND scan_type = 'label' AND food_log_id IS NULL`, label); n != 1 {
		t.Fatal("label session not stored as an unlinked label scan")
	}

	logID, err := s.CreateAnalyzingLog(ctx, user, "2026-07-14", nil)
	if err != nil {
		t.Fatalf("CreateAnalyzingLog: %v", err)
	}
	session, err := s.CreatePipelineSession(ctx, user, logID)
	if err != nil {
		t.Fatalf("CreatePipelineSession: %v", err)
	}
	if err := s.UpdatePipelineSession(ctx, session, 30, 60, 70, 65, "card", true, 1200); err != nil {
		t.Fatalf("UpdatePipelineSession: %v", err)
	}
	agreement := 0.9
	images := []pipeline.PerImageResult{
		{Angle: "top", Quality: pipeline.QualityResult{OverallScore: 80}},
		{Angle: "side", Quality: pipeline.QualityResult{OverallScore: 60}},
	}
	if err := s.RecordScanImages(ctx, session, images, &agreement); err != nil {
		t.Fatalf("RecordScanImages: %v", err)
	}
	if n := countRows(t, pool, `SELECT count(*) FROM scan_images WHERE scan_session_id = $1 AND geometry_result ? 'plate_detected'`, session); n != 2 {
		t.Fatalf("scan_images rows = %d, want 2 with geometry", n)
	}
	if n := countRows(t, pool, `SELECT count(*) FROM scan_sessions WHERE id = $1 AND image_count = 2 AND angle_agreement = 0.9
		AND image_quality_score = 30 AND overall_confidence = 65 AND reference_object = 'card' AND plate_detected AND processing_ms = 1200`, session); n != 1 {
		t.Fatal("pipeline session metrics not stored")
	}

	if _, err := pool.Exec(ctx, `UPDATE scan_sessions SET discarded = true WHERE id = $1`, session); err != nil {
		t.Fatalf("discard: %v", err)
	}
	report, err := s.CalibrationReport(ctx)
	if err != nil {
		t.Fatalf("CalibrationReport: %v", err)
	}
	if report.Bands == nil || report.Warnings == nil || report.Discards.DiscardedCount < 1 || report.Discards.MeanQualityDiscarded == nil {
		t.Fatalf("report = %+v, want non-nil lists and the discarded pipeline scan counted", report)
	}
}
