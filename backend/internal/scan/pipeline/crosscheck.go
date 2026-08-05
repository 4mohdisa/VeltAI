package pipeline

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/db"
)

// CrosscheckMacros is pass 4 — replace AI macros with cuisine_food_library
// values where a name match exists (ILIKE '%food_name%'). It mirrors the
// in-memory crosscheck MergeResults does during a live Run, but issues one
// query per estimate for direct/standalone use.
//
// The frozen signature has no ctx param, so we use context.Background() for the
// per-row query. A nil q leaves everything unchanged; a match sets database
// macros; pgx.ErrNoRows downgrades to "ai_estimate" only when unset; any other
// query error leaves the estimate untouched.
func CrosscheckMacros(estimates []FoodEstimate, userID string, q db.Querier) []FoodEstimate {
	if q == nil {
		return estimates
	}
	ctx := context.Background()
	for i := range estimates {
		// Guard empty/blank names: ILIKE '%%' matches an arbitrary library row
		// and would overwrite macros + falsely stamp MacroSource "database".
		// Mirrors matchLibrary's guard in pipeline.go.
		if strings.TrimSpace(estimates[i].FoodName) == "" {
			continue
		}
		var cal, protein, carbs, fat, fibre float64
		err := q.QueryRow(ctx,
			`SELECT calories, protein, carbs, fat, fibre FROM cuisine_food_library
			 WHERE food_name ILIKE '%' || $1 || '%' LIMIT 1`,
			estimates[i].FoodName).Scan(&cal, &protein, &carbs, &fat, &fibre)
		if err != nil {
			// No match (pgx.ErrNoRows): keep Gemini's values but tag them as an AI
			// estimate — without downgrading an already-"database" source. Any other
			// query error leaves the estimate entirely unchanged.
			if errors.Is(err, pgx.ErrNoRows) && estimates[i].MacroSource == "" {
				estimates[i].MacroSource = "ai_estimate"
			}
			continue
		}
		estimates[i].CaloriesPer100g = cal
		estimates[i].ProteinPer100g = protein
		estimates[i].CarbsPer100g = carbs
		estimates[i].FatPer100g = fat
		estimates[i].FibrePer100g = fibre
		estimates[i].MacroSource = "database"
	}
	return estimates
}
