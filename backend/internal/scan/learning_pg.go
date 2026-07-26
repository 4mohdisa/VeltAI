package scan

import (
	"context"
)

// ReportStore is the optional capability behind GET /api/scan/calibration-report
// (assertion-checked so existing Store fakes keep compiling). *PGStore has it.
type ReportStore interface {
	CalibrationReport(ctx context.Context) (CalibrationReport, error)
}

// DiscardStats aggregates signal 6: which capture-quality conditions correlate
// with users discarding a scan outright.
type DiscardStats struct {
	DiscardedCount       int      `json:"discarded_count"`
	KeptCount            int      `json:"kept_count"`
	MeanQualityDiscarded *float64 `json:"mean_quality_discarded"`
	MeanQualityKept      *float64 `json:"mean_quality_kept"`
}

// CalibrationReport is the global (not per-user) calibration health view.
type CalibrationReport struct {
	Bands    []BandStat   `json:"bands"`
	Warnings []string     `json:"warnings"` // non-empty ⇒ scoring is miscalibrated
	Discards DiscardStats `json:"discards"`
}

// SavedMealsLite lists the user's saved meals (name + item foods/weights) for
// repeat-meal matching (signal 5).
func (s *PGStore) SavedMealsLite(ctx context.Context, userID string) ([]SavedMealLite, error) {
	rows, err := s.q.Query(ctx, `
		SELECT sm.name, smi.food_name, smi.quantity_g
		FROM saved_meals sm
		JOIN saved_meal_items smi ON smi.saved_meal_id = sm.id
		WHERE sm.user_id = $1
		ORDER BY sm.logged_count DESC, sm.id, smi.id
		LIMIT 200`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SavedMealLite
	index := map[string]int{}
	for rows.Next() {
		var name, food string
		var qty float64
		if err := rows.Scan(&name, &food, &qty); err != nil {
			return nil, err
		}
		i, ok := index[name]
		if !ok {
			out = append(out, SavedMealLite{Name: name})
			i = len(out) - 1
			index[name] = i
		}
		out[i].Foods = append(out[i].Foods, food)
		out[i].Weights = append(out[i].Weights, qty)
	}
	return out, rows.Err()
}

// UserContextBlock assembles the E3 prompt context from the learned signals:
// cuisines, frequent foods (≥3 logs), identity corrections (≥3), and portion
// tendencies (≥3 samples). Meal-time patterns are omitted for now (they live in
// the ai_user_brain JSON; wiring them is a later refinement).
func (s *PGStore) UserContextBlock(ctx context.Context, userID string) (string, error) {
	in := UserContextInput{}

	var cuisines []string
	if err := s.q.QueryRow(ctx,
		`SELECT cuisines FROM user_cuisine_preferences WHERE user_id = $1`, userID).Scan(&cuisines); err == nil {
		in.Cuisines = cuisines
	}

	rows, err := s.q.Query(ctx, `
		SELECT food_name, count(*) FROM food_logs
		WHERE user_id = $1 AND status IS DISTINCT FROM 'analyzing'
		GROUP BY food_name ORDER BY count(*) DESC LIMIT 8`, userID)
	if err == nil {
		for rows.Next() {
			var it CountedItem
			if rows.Scan(&it.Name, &it.Count) == nil {
				in.FrequentFoods = append(in.FrequentFoods, it)
			}
		}
		rows.Close()
	}

	rows, err = s.q.Query(ctx, `
		SELECT ai_suggested, user_chose, occurrences FROM user_food_affinity
		WHERE user_id = $1 ORDER BY occurrences DESC LIMIT 5`, userID)
	if err == nil {
		for rows.Next() {
			var a AffinityItem
			if rows.Scan(&a.AISuggested, &a.UserChose, &a.Occurrences) == nil {
				in.IdentityFixes = append(in.IdentityFixes, a)
			}
		}
		rows.Close()
	}

	factors, err := s.CalibrationFactors(ctx, userID)
	if err == nil {
		in.PortionFactors = factors
	}

	return BuildUserContext(in), nil
}

// CalibrationReport reads the band stats + discard aggregates and derives the
// miscalibration warnings.
func (s *PGStore) CalibrationReport(ctx context.Context) (CalibrationReport, error) {
	report := CalibrationReport{Bands: []BandStat{}, Warnings: []string{}}

	rows, err := s.q.Query(ctx, `
		SELECT predicted_band, sample_count, mean_correction_magnitude
		FROM confidence_calibration ORDER BY predicted_band`)
	if err != nil {
		return report, err
	}
	for rows.Next() {
		var b BandStat
		if err := rows.Scan(&b.Band, &b.SampleCount, &b.MeanMag); err != nil {
			rows.Close()
			return report, err
		}
		report.Bands = append(report.Bands, b)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return report, err
	}
	report.Warnings = MiscalibrationWarnings(report.Bands)
	if report.Warnings == nil {
		report.Warnings = []string{}
	}

	// Signal 6 aggregate: mean image quality of discarded vs kept pipeline scans.
	err = s.q.QueryRow(ctx, `
		SELECT
			count(*) FILTER (WHERE discarded),
			count(*) FILTER (WHERE NOT discarded),
			avg(image_quality_score) FILTER (WHERE discarded),
			avg(image_quality_score) FILTER (WHERE NOT discarded)
		FROM scan_sessions
		WHERE scan_type = 'pipeline'`).
		Scan(&report.Discards.DiscardedCount, &report.Discards.KeptCount,
			&report.Discards.MeanQualityDiscarded, &report.Discards.MeanQualityKept)
	if err != nil {
		return report, err
	}
	return report, nil
}
