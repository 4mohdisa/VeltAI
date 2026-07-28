package pipeline

import (
	"context"
	"log"
	"sync"

	"lumo/backend/internal/db"
)

// FoodIdentifier is pass 3: identify foods from the image under geometric
// constraints. *Gemini implements it; tests inject a fake. mimeType is the
// image's content type, threaded so PNG/WEBP/HEIC aren't misread as JPEG.
type FoodIdentifier interface {
	IdentifyFoods(ctx context.Context, imageBytes []byte, geo GeometryResult, mimeType string) ([]FoodEstimate, error)
}

// userContextKey carries the per-user learned prompt block (Phase 13 E3) on the
// ctx, so FoodIdentifier's signature — and every fake implementing it — stays
// unchanged.
type userContextKey struct{}

// WithUserContext attaches a learned per-user context block to ctx.
func WithUserContext(ctx context.Context, block string) context.Context {
	if block == "" {
		return ctx
	}
	return context.WithValue(ctx, userContextKey{}, block)
}

// UserContextFrom reads the per-user context block ("" when absent).
func UserContextFrom(ctx context.Context) string {
	s, _ := ctx.Value(userContextKey{}).(string)
	return s
}

// Outcome is the full result of a pipeline run, stored on the food_log's
// scan_results JSONB and used to set its aggregate macros. The multi-angle
// fields (Phase 13) are zero/omitted for single-image runs, so existing stored
// blobs and clients are unaffected.
type Outcome struct {
	Quality    QualityResult       `json:"quality"`
	Geometry   GeometryResult      `json:"geometry"`
	Estimates  []FoodEstimate      `json:"estimates"`
	Confidence ConfidenceBreakdown `json:"confidence"`

	// Multi-angle capture (RunMulti).
	ImageCount            int              `json:"image_count,omitempty"`
	PerImage              []PerImageResult `json:"per_image,omitempty"`
	AngleAgreement        *float64         `json:"angle_agreement,omitempty"`
	NeedsUserConfirmation bool             `json:"needs_user_confirmation,omitempty"`
	AlternateEstimates    []FoodEstimate   `json:"alternate_estimates,omitempty"`
	ReconciliationNote    string           `json:"reconciliation_note,omitempty"`
}

// libRow is one cuisine_food_library row, prefetched for the crosscheck merge.
type libRow struct {
	name                                 string
	calories, protein, carbs, fat, fibre float64
}

// Run executes the five passes and scores confidence. Passes 1 and 2 are pure
// Go; pass 3 (Gemini) and a pass-4 library prefetch run concurrently; the
// merge applies database macros over the Gemini weights; pass 5 applies the
// user's personal calibration. A nil q skips the DB-backed passes gracefully
// (used when no pool is available).
func Run(ctx context.Context, imageBytes []byte, userID string, ident FoodIdentifier, q db.Querier, mimeType string) Outcome {
	quality, geo := safeAssess(imageBytes)

	var geminiEstimates []FoodEstimate
	var lib []libRow
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		// This goroutine hands untrusted bytes to the identifier; a panic here
		// would take the process down, so contain it (no estimates → fallback).
		defer func() {
			if r := recover(); r != nil {
				log.Printf("scan pipeline: recovered panic identifying foods: %v", r)
			}
		}()
		if ident != nil {
			geminiEstimates, _ = ident.IdentifyFoods(ctx, imageBytes, geo, mimeType)
		}
	}()
	go func() {
		defer wg.Done()
		lib = prefetchLibrary(ctx, q)
	}()
	wg.Wait()

	estimates := MergeResults(geminiEstimates, geo, lib)
	estimates = ApplyCalibration(ctx, estimates, userID, q)
	confidence := ScoreConfidence(quality, geo, estimates)

	return Outcome{Quality: quality, Geometry: geo, Estimates: estimates, Confidence: confidence}
}

// prefetchLibrary loads the shared cuisine_food_library once (bounded, ~135
// rows) so the crosscheck merge is in-memory rather than one query per food.
// Returns nil on any error or when q is nil — the merge then keeps Gemini's
// macros.
func prefetchLibrary(ctx context.Context, q db.Querier) []libRow {
	if q == nil {
		return nil
	}
	rows, err := q.Query(ctx,
		`SELECT food_name, calories, protein, carbs, fat, fibre FROM cuisine_food_library`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []libRow
	for rows.Next() {
		var r libRow
		if err := rows.Scan(&r.name, &r.calories, &r.protein, &r.carbs, &r.fat, &r.fibre); err != nil {
			return out
		}
		out = append(out, r)
	}
	return out
}

// MergeResults combines Gemini's identified foods (weights) with database
// macros (pass 4 crosscheck, in-memory over prefetched rows). When Gemini
// returned nothing, it falls back to a single whole-plate estimate from the
// geometry so the pipeline always yields at least one item.
func MergeResults(gemini []FoodEstimate, geo GeometryResult, lib []libRow) []FoodEstimate {
	if len(gemini) == 0 {
		return []FoodEstimate{fallbackEstimate(geo)}
	}
	out := make([]FoodEstimate, len(gemini))
	for i, est := range gemini {
		if row, ok := matchLibrary(est.FoodName, lib); ok {
			est.CaloriesPer100g = row.calories
			est.ProteinPer100g = row.protein
			est.CarbsPer100g = row.carbs
			est.FatPer100g = row.fat
			est.FibrePer100g = row.fibre
			est.MacroSource = "database"
		} else if est.MacroSource == "" {
			est.MacroSource = "ai_estimate"
		}
		out[i] = est
	}
	return out
}

// fallbackEstimate builds a single whole-plate estimate from the geometry when
// Gemini is unavailable or unparseable: total plate area × default height ×
// default density.
func fallbackEstimate(geo GeometryResult) FoodEstimate {
	height, method := HeightForCategory("default")
	_ = method
	area := geo.PlateAreaCm2
	if area <= 0 {
		area = 100 // no plate detected: assume a small default area so weight isn't 0
	}
	density := Densities["default"]
	weight := area * height * density
	return FoodEstimate{
		RegionID:    0,
		FoodName:    "Unknown food",
		WeightG:     weight,
		Confidence:  20,
		DensityUsed: density,
		MacroSource: "ai_estimate",
		Reasoning:   "fallback: gemini unavailable, whole-plate default estimate",
	}
}

// matchLibrary finds the first library row whose name contains the estimate's
// food name (or vice-versa), case-insensitively — the in-memory equivalent of
// the ILIKE '%name%' crosscheck query.
func matchLibrary(foodName string, lib []libRow) (libRow, bool) {
	if foodName == "" {
		return libRow{}, false
	}
	for _, r := range lib {
		if containsFold(r.name, foodName) || containsFold(foodName, r.name) {
			return r, true
		}
	}
	return libRow{}, false
}
