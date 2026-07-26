package pipeline

import "strings"

// ScoreConfidence computes the composite scan confidence deterministically from
// the image quality, plate geometry, and the merged/calibrated estimates. It
// accumulates signed ConfidenceFactors, clamps the total to [0,100], and labels
// it High/Medium/Low.
func ScoreConfidence(quality QualityResult, geo GeometryResult, estimates []FoodEstimate) ConfidenceBreakdown {
	var hasDB, hasCalibration bool
	for _, e := range estimates {
		if e.MacroSource == "database" {
			hasDB = true
		}
		for _, n := range e.Notes {
			if strings.Contains(n, "Adjusted to your portions") {
				hasCalibration = true
			}
		}
	}

	b := ConfidenceBreakdown{}
	add := func(name string, points int, msg string) {
		b.Score += points
		b.Factors = append(b.Factors, ConfidenceFactor{Name: name, Points: points, Message: msg})
	}

	if geo.PlateDetected {
		add("plate_detected", 20, "plate detected as size reference")
	}
	if quality.SharpnessScore > 60 {
		add("sharp_image", 15, "image is sharp")
	}
	if quality.LightingScore > 60 {
		add("good_lighting", 10, "lighting is good")
	}
	if hasDB {
		add("database_match", 10, "macros matched to food library")
	}
	if hasCalibration {
		add("calibration_applied", 10, "adjusted to your usual portions")
	}

	add("single_angle", -10, "single camera angle only")
	if quality.LightingScore < 40 {
		add("low_lighting", -15, "lighting is poor")
	}
	if quality.SharpnessScore < 40 {
		add("blurry", -15, "image is blurry")
	}
	if !geo.PlateDetected {
		add("no_plate", -20, "no plate detected for scale")
	}
	if !hasDB {
		add("ai_macros_only", -10, "macros are AI estimates only")
	}

	if b.Score < 0 {
		b.Score = 0
	} else if b.Score > 100 {
		b.Score = 100
	}
	b.Label = confidenceLabel(b.Score)
	return b
}

// confidenceLabel bands a 0-100 score. Thresholds calibrated to the achievable
// range: the positive factors that can co-occur sum to +65 (plate 20 + sharp 15
// + lighting 10 + database 10 + calibration 10) and single_angle is always -10,
// so a perfect scan reaches exactly 55 — hence "High" begins at 55 (the old 85
// threshold was mathematically unreachable). Pure + exported-package-testable so
// the band boundaries can be checked directly.
func confidenceLabel(score int) string {
	switch {
	case score >= 55:
		return "High"
	case score >= 35:
		return "Medium"
	default:
		return "Low"
	}
}
