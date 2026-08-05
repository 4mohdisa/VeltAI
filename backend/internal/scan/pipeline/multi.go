package pipeline

import (
	"context"
	"sync"

	"lume/backend/internal/db"
)

// Multi-angle pipeline (Phase 13 D). Quality + geometry run per image; the
// top-down image is authoritative for footprint and identification; the other
// angles contribute independent geometric weight estimates that Reconcile
// cross-validates. One image degrades to exactly the single-image Run.

// AngleImage is one captured shot with its angle hint.
type AngleImage struct {
	Bytes    []byte
	MimeType string
	Angle    string // 'top' | 'side' | 'oblique'
}

// PerImageResult is one image's quality + geometry, stored on scan_images.
type PerImageResult struct {
	Angle    string         `json:"angle"`
	Quality  QualityResult  `json:"quality"`
	Geometry GeometryResult `json:"geometry"`
}

// ValidAngle reports whether an angle hint is one of the accepted values.
func ValidAngle(a string) bool { return a == "top" || a == "side" || a == "oblique" }

// primaryIndex picks the authoritative image: the first 'top', else index 0.
func primaryIndex(images []AngleImage) int {
	for i, im := range images {
		if im.Angle == "top" {
			return i
		}
	}
	return 0
}

// RunMulti executes the pipeline over 1–3 angle images. With one image the
// outcome is identical to Run (plus ImageCount=1). With more, per-angle
// geometric estimates are reconciled: agreement ≥0.75 merges (top weighted
// highest, confidence +15); below it, BOTH estimates are surfaced with
// needs_user_confirmation and confidence −20.
func RunMulti(ctx context.Context, images []AngleImage, userID string, ident FoodIdentifier, q db.Querier) Outcome {
	if len(images) == 0 {
		return Outcome{}
	}
	primary := primaryIndex(images)

	// Pass 1+2 per image (pure Go, cheap) — parallel.
	perImage := make([]PerImageResult, len(images))
	var wg sync.WaitGroup
	for i, im := range images {
		wg.Add(1)
		go func(i int, im AngleImage) {
			defer wg.Done()
			// safeAssess contains a decoder panic to this angle: an unrecovered
			// panic in a goroutine kills the whole process.
			q, g := safeAssess(im.Bytes)
			perImage[i] = PerImageResult{Angle: im.Angle, Quality: q, Geometry: g}
		}(i, im)
	}
	wg.Wait()

	// Passes 3–5 on the primary (top-down) image only — identification once.
	base := Run(ctx, images[primary].Bytes, userID, ident, q, images[primary].MimeType)
	base.ImageCount = len(images)
	base.PerImage = perImage

	if len(images) < 2 {
		return base
	}

	// Independent per-angle weight estimates from geometry alone.
	weights := make([]AngleWeight, 0, len(perImage))
	for _, p := range perImage {
		weights = append(weights, AngleWeight{Angle: p.Angle, TotalWeightG: GeometryTotalWeightG(p.Geometry)})
	}
	rec := Reconcile(weights)
	agreement := rec.Agreement
	base.AngleAgreement = &agreement
	base.NeedsUserConfirmation = rec.NeedsConfirmation
	base.ReconciliationNote = rec.Note

	if rec.Merged && rec.ScaleFactor > 0 && rec.ScaleFactor != 1 {
		// Scale the identified estimates so their total matches the merged weight.
		for i := range base.Estimates {
			base.Estimates[i].WeightG = round2(base.Estimates[i].WeightG * rec.ScaleFactor)
			base.Estimates[i].Notes = append(base.Estimates[i].Notes, "weight refined from multi-angle capture")
		}
	}
	if !rec.Merged {
		// Surface the alternate (non-primary) estimate rather than averaging:
		// the same identified foods scaled to the other angles' mean weight.
		primaryTotal := GeometryTotalWeightG(perImage[primary].Geometry)
		altTotal := 0.0
		n := 0
		for i, p := range perImage {
			if i == primary {
				continue
			}
			altTotal += GeometryTotalWeightG(p.Geometry)
			n++
		}
		if n > 0 && primaryTotal > 0 {
			scale := (altTotal / float64(n)) / primaryTotal
			alt := make([]FoodEstimate, len(base.Estimates))
			for i, e := range base.Estimates {
				e.WeightG = round2(e.WeightG * scale)
				e.Notes = append([]string{}, "alternate estimate from side angle")
				alt[i] = e
			}
			base.AlternateEstimates = alt
		}
	}

	// Confidence delta from reconciliation, clamped to [0,100].
	score := base.Confidence.Score + rec.ConfidenceDelta
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	base.Confidence.Score = score
	base.Confidence.Label = confidenceLabel(score)
	base.Confidence.Factors = append(base.Confidence.Factors, ConfidenceFactor{
		Name:    "multi_angle",
		Points:  rec.ConfidenceDelta,
		Message: rec.Note,
	})
	return base
}
