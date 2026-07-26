package pipeline

import (
	"context"
	"strings"

	"lumo/backend/internal/db"
)

// ApplyCalibration is pass 5 — scale each estimate's weight by the user's
// learned EWMA portion multiplier when enough samples exist (>= 3). A nil q, no
// matching row (pgx.ErrNoRows), too few samples, or any query error all leave
// the estimate unchanged, so a DB hiccup never crashes the pipeline.
func ApplyCalibration(ctx context.Context, estimates []FoodEstimate, userID string, q db.Querier) []FoodEstimate {
	if q == nil {
		return estimates
	}
	for i := range estimates {
		// Guard empty/blank names: an empty $2 makes the pattern ILIKE '%%',
		// which matches every one of the user's calibration rows and would apply
		// an unrelated food's multiplier. Mirrors matchLibrary's guard in
		// pipeline.go — Gemini can return a region with no food_name.
		if strings.TrimSpace(estimates[i].FoodName) == "" {
			continue
		}
		var multiplier float64
		var sampleCount int
		// ponytail: skip on ANY error subsumes the errors.Is(err, pgx.ErrNoRows)
		// "no calibration yet" case — both leave the estimate unchanged.
		err := q.QueryRow(ctx,
			`SELECT weight_multiplier_ewma, sample_count FROM user_scan_calibration
			 WHERE user_id=$1 AND food_name ILIKE '%' || $2 || '%'
			 ORDER BY sample_count DESC LIMIT 1`,
			userID, estimates[i].FoodName).Scan(&multiplier, &sampleCount)
		if err != nil || sampleCount < 3 {
			continue
		}
		estimates[i].WeightG *= multiplier
		estimates[i].Notes = append(estimates[i].Notes, "Adjusted to your portions")
	}
	return estimates
}
