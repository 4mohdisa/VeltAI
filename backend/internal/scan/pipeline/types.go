// Package pipeline implements the hardened multi-pass food-scan pipeline:
// pure-Go image quality (pass 1) and geometry/volume estimation (pass 2), a
// geometry-constrained structured Gemini call (pass 3), a cuisine-library
// macro crosscheck (pass 4), personal EWMA portion calibration (pass 5), and a
// deterministic confidence score. It has no dependency on the parent scan
// package (the scan package orchestrates and persists); it depends only on
// internal/db for the Querier type.
package pipeline

// StandardPlateDiameterCm is the assumed diameter of a detected dinner plate,
// used as the real-world scale reference for volume/weight estimation.
const StandardPlateDiameterCm = 27.0

// QualityResult is pass 1's pure-Go assessment of image usability.
type QualityResult struct {
	SharpnessScore  int      `json:"sharpness_score"`  // Laplacian variance, 0-100
	LightingScore   int      `json:"lighting_score"`   // luminance std deviation, 0-100
	OverallScore    int      `json:"overall_score"`    // avg of the two
	QualityWarnings []string `json:"quality_warnings"` // human-readable issues
}

// Region is one coloured area of the plate, with an estimated real-world size
// and food volume. Volume and EstimatedWeightG are derived from AreaCm2 ×
// HeightEstCm × density (default density in pass 2; refined by Gemini in pass 3).
type Region struct {
	ID               int     `json:"id"`
	AreaPercent      float64 `json:"area_percent"`
	AreaCm2          float64 `json:"area_cm2"`
	DominantColour   string  `json:"dominant_colour"`
	HeightEstCm      float64 `json:"height_est_cm"`
	HeightMethod     string  `json:"height_method"` // "shadow" | "category_default"
	Volume           float64 `json:"volume_cm3"`
	EstimatedWeightG float64 `json:"estimated_weight_g"`
}

// GeometryResult is pass 2's pure-Go geometric read of the plate and its foods.
type GeometryResult struct {
	PlateDetected    bool     `json:"plate_detected"`
	PlateDiameterCm  float64  `json:"plate_diameter_cm"`
	PlateAreaCm2     float64  `json:"plate_area_cm2"`
	CameraAngleDeg   float64  `json:"camera_angle_deg"`
	ReferenceObject  string   `json:"reference_object"`
	Regions          []Region `json:"regions"`
	ConfidencePoints int      `json:"confidence_points"`
	Warnings         []string `json:"warnings"`
}

// FoodEstimate is one identified food with a weight and per-100g macros. It is
// produced by Gemini (pass 3), refined by the cuisine-library crosscheck
// (pass 4, which may overwrite the per-100g macros and set MacroSource), and
// by personal calibration (pass 5, which scales WeightG and appends a note).
type FoodEstimate struct {
	RegionID        int      `json:"region_id"`
	FoodName        string   `json:"food_name"`
	FoodCategory    string   `json:"food_category"`
	WeightG         float64  `json:"weight_g"`
	Confidence      int      `json:"confidence"`
	DensityUsed     float64  `json:"density_used"`
	MacroSource     string   `json:"macro_source"` // "ai_estimate" | "database" | "label_scan"
	CaloriesPer100g float64  `json:"calories_per_100g"`
	ProteinPer100g  float64  `json:"protein_per_100g"`
	CarbsPer100g    float64  `json:"carbs_per_100g"`
	FatPer100g      float64  `json:"fat_per_100g"`
	FibrePer100g    float64  `json:"fibre_per_100g"`
	Reasoning       string   `json:"reasoning"`
	Notes           []string `json:"notes"`
}

// ConfidenceFactor is one signed contributor to the overall confidence score.
type ConfidenceFactor struct {
	Name    string `json:"name"`
	Points  int    `json:"points"`
	Message string `json:"message"`
}

// ConfidenceBreakdown is the composite scan confidence with its factors.
type ConfidenceBreakdown struct {
	Score   int                `json:"score"`
	Label   string             `json:"label"` // "High" | "Medium" | "Low"
	Factors []ConfidenceFactor `json:"factors"`
}

// LabelResult is a nutrition-label scan, already converted to per-100g values.
type LabelResult struct {
	FoodName        string  `json:"food_name"`
	ServingSizeG    float64 `json:"serving_size_g"`
	CaloriesPer100g float64 `json:"calories_per_100g"`
	ProteinPer100g  float64 `json:"protein_per_100g"`
	CarbsPer100g    float64 `json:"carbs_per_100g"`
	FatPer100g      float64 `json:"fat_per_100g"`
	FibrePer100g    float64 `json:"fibre_per_100g"`
	Confidence      int     `json:"confidence"`
	MacroSource     string  `json:"macro_source"` // always "label_scan"
}

// Densities maps a food category to its density in g/cm³, used to turn an
// estimated volume into an estimated weight.
var Densities = map[string]float64{
	"rice":    0.85,
	"pasta":   0.75,
	"chicken": 1.05,
	"beef":    1.08,
	"salad":   0.15,
	"bread":   0.30,
	"curry":   0.90,
	"soup":    1.00,
	"default": 0.80,
}

// categoryHeights maps a food category keyword to a default food height (cm),
// used when a per-region height can't be measured from shadows.
var categoryHeights = []struct {
	keywords []string
	height   float64
}{
	{[]string{"rice", "noodles", "pasta"}, 2.0},
	{[]string{"curry", "stew", "soup"}, 3.5},
	{[]string{"salad", "vegetables"}, 2.5},
	{[]string{"bread", "roti", "naan"}, 1.5},
	{[]string{"meat", "chicken", "fish"}, 3.0},
}

// HeightForCategory returns the category-default height (cm) and the method
// name ("category_default"). Unknown categories get 2.5cm.
func HeightForCategory(category string) (height float64, method string) {
	for _, ch := range categoryHeights {
		for _, kw := range ch.keywords {
			if containsFold(category, kw) {
				return ch.height, "category_default"
			}
		}
	}
	return 2.5, "category_default"
}

// containsFold reports whether s contains substr, case-insensitively, without
// allocating (small strings, called per-region).
func containsFold(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	if len(substr) > len(s) {
		return false
	}
	for i := 0; i+len(substr) <= len(s); i++ {
		if equalFold(s[i:i+len(substr)], substr) {
			return true
		}
	}
	return false
}

func equalFold(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if 'A' <= ca && ca <= 'Z' {
			ca += 'a' - 'A'
		}
		if 'A' <= cb && cb <= 'Z' {
			cb += 'a' - 'A'
		}
		if ca != cb {
			return false
		}
	}
	return true
}
