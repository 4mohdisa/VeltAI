package pipeline

import (
	"math"
	"sort"
)

// neutralSatThreshold is the max channel spread (max-min, 0-255) for a pixel to
// count as "neutral" (grey/white) — used for both plate-rim detection and the
// neutral colour bucket. Tunable.
const neutralSatThreshold = 30.0

// plateNeutralBrightFraction is the fraction of bright, low-saturation pixels
// above which we assume a plate dominates the frame.
// ponytail: crude colour-fraction heuristic, not real plate segmentation —
// upgrade to an ellipse/rim detector or an ML segmenter if accuracy matters.
const plateNeutralBrightFraction = 0.40

// PlateArea returns the top-down area (cm²) of a circular plate: π·r².
func PlateArea(diameterCm float64) float64 {
	r := diameterCm / 2
	return math.Pi * r * r
}

// AnalyseGeometry is pass 2 — pure-Go plate/region geometry. It estimates
// whether a plate dominates the frame (giving a real-world scale reference),
// then buckets pixels into colour regions and derives per-region area, volume
// and a default-density weight. A frame that fails to decode — or whose
// declared bitmap is too large to allocate — yields a no-plate result with a
// warning (never panics).
func AnalyseGeometry(imageBytes []byte) GeometryResult {
	img, err := decodeImage(imageBytes)
	if err != nil {
		return GeometryResult{PlateDetected: false, Warnings: []string{"could not decode image"}}
	}
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	total := w * h
	if total == 0 {
		return GeometryResult{PlateDetected: false, Warnings: []string{"could not decode image"}}
	}

	buckets := map[string]int{}
	var neutralBright int
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			r16, g16, bl16, _ := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
			R, G, B := float64(r16>>8), float64(g16>>8), float64(bl16>>8)
			name, luminance, sat := classifyPixel(R, G, B)
			buckets[name]++
			if luminance > 0.6*255 && sat < neutralSatThreshold {
				neutralBright++
			}
		}
	}

	res := GeometryResult{}
	if float64(neutralBright)/float64(total) > plateNeutralBrightFraction {
		res.PlateDetected = true
		res.ReferenceObject = "plate_rim"
		res.PlateDiameterCm = StandardPlateDiameterCm
		res.PlateAreaCm2 = PlateArea(StandardPlateDiameterCm)
		res.ConfidencePoints += 20
	} else {
		res.Warnings = append(res.Warnings, "No plate detected")
	}
	// CameraAngleDeg stays 0: single top-down capture assumption (no multi-view
	// or reference to infer tilt in pass 2).

	// One region per non-empty colour bucket, largest area first, capped at 5.
	type bucketCount struct {
		name  string
		count int
	}
	bcs := make([]bucketCount, 0, len(buckets))
	for name, count := range buckets {
		if count > 0 {
			bcs = append(bcs, bucketCount{name, count})
		}
	}
	sort.Slice(bcs, func(i, j int) bool {
		if bcs[i].count != bcs[j].count {
			return bcs[i].count > bcs[j].count
		}
		return bcs[i].name < bcs[j].name // stable tie-break
	})

	// Category is unknown in pass 2 → default height (2.5cm) and default density
	// (0.80). Gemini refines these downstream.
	height, method := HeightForCategory("default")
	density := Densities["default"]
	for i, bc := range bcs {
		if i >= 5 {
			break
		}
		areaPercent := float64(bc.count) / float64(total)
		areaCm2 := res.PlateAreaCm2 * areaPercent
		volume := areaCm2 * height
		res.Regions = append(res.Regions, Region{
			ID:               i,
			AreaPercent:      areaPercent,
			AreaCm2:          areaCm2,
			DominantColour:   bc.name,
			HeightEstCm:      height,
			HeightMethod:     method,
			Volume:           volume,
			EstimatedWeightG: volume * density,
		})
	}
	return res
}

// classifyPixel maps an RGB pixel to one of five stable colour buckets and
// returns its luminance and saturation (max-min, 0-255). Low-saturation pixels
// are neutral/brown; the rest split by hue.
func classifyPixel(R, G, B float64) (name string, luminance, sat float64) {
	maxc := math.Max(R, math.Max(G, B))
	minc := math.Min(R, math.Min(G, B))
	sat = maxc - minc
	luminance = 0.299*R + 0.587*G + 0.114*B
	if sat < neutralSatThreshold {
		return "neutral/brown", luminance, sat
	}
	switch hue := hueDeg(R, G, B, maxc, minc); {
	case hue < 40 || hue >= 320:
		return "red/orange", luminance, sat
	case hue < 80:
		return "yellow/green", luminance, sat
	case hue < 170:
		return "green", luminance, sat
	default:
		return "blue/purple", luminance, sat
	}
}

// hueDeg returns the hue angle in degrees [0,360) for an RGB pixel.
func hueDeg(R, G, B, maxc, minc float64) float64 {
	d := maxc - minc
	if d == 0 {
		return 0
	}
	var hue float64
	switch maxc {
	case R:
		hue = math.Mod((G-B)/d, 6)
	case G:
		hue = (B-R)/d + 2
	default:
		hue = (R-G)/d + 4
	}
	hue *= 60
	if hue < 0 {
		hue += 360
	}
	return hue
}
