package pipeline

import "math"

// Quality normalisation constants — tuned so a black/uniform frame scores 0 and
// a high-detail (noisy) frame scores well above 60. See quality_test.go for the
// acceptance bounds.
const (
	// sharpnessK: score = sqrt(Laplacian-magnitude variance) * sharpnessK.
	// Full-noise sqrt(variance) lands ~200, so k=0.5 pushes it to ~100 while a
	// mildly blurred frame (low Laplacian variance) stays well under 30.
	sharpnessK = 0.5
	// lightingNorm: score = lumaStdDev / lightingNorm * 100. A well-exposed
	// frame has a luminance std dev around 50-70 (0-255 scale); 64 maps that
	// band to ~80-100.
	lightingNorm = 64.0
)

// AssessQuality is pass 1 — pure-Go image quality: Laplacian-variance sharpness
// and luminance-std-dev lighting, each normalised to 0-100. A frame that fails
// to decode — or whose declared bitmap is too large to allocate — yields a zero
// result (never panics).
func AssessQuality(imageBytes []byte) QualityResult {
	img, err := decodeImage(imageBytes)
	if err != nil {
		return QualityResult{}
	}
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if w < 3 || h < 3 {
		return QualityResult{}
	}

	// Luminance buffer (0-255), reused for both sharpness and lighting.
	luma := make([]float64, w*h)
	var sum, sumSq float64
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			r, g, bl, _ := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
			Y := 0.299*float64(r>>8) + 0.587*float64(g>>8) + 0.114*float64(bl>>8)
			luma[y*w+x] = Y
			sum += Y
			sumSq += Y * Y
		}
	}
	n := float64(w * h)

	// Lighting: standard deviation of luminance.
	lightVar := sumSq/n - (sum/n)*(sum/n)
	if lightVar < 0 {
		lightVar = 0
	}
	lightingScore := clampScore(int(math.Round(math.Sqrt(lightVar) / lightingNorm * 100)))

	// Sharpness: variance of the Laplacian magnitude over interior pixels.
	var lSum, lSumSq, lc float64
	for y := 1; y < h-1; y++ {
		for x := 1; x < w-1; x++ {
			c := luma[y*w+x]
			l := math.Abs(4*c - luma[y*w+x-1] - luma[y*w+x+1] - luma[(y-1)*w+x] - luma[(y+1)*w+x])
			lSum += l
			lSumSq += l * l
			lc++
		}
	}
	var sharpnessScore int
	if lc > 0 {
		lVar := lSumSq/lc - (lSum/lc)*(lSum/lc)
		if lVar < 0 {
			lVar = 0
		}
		sharpnessScore = clampScore(int(math.Round(math.Sqrt(lVar) * sharpnessK)))
	}

	res := QualityResult{
		SharpnessScore: sharpnessScore,
		LightingScore:  lightingScore,
		OverallScore:   int(math.Round(float64(sharpnessScore+lightingScore) / 2)),
	}
	if sharpnessScore < 30 {
		res.QualityWarnings = append(res.QualityWarnings, "Image not sharp enough")
	}
	if lightingScore < 25 {
		res.QualityWarnings = append(res.QualityWarnings, "Low lighting detected")
	}
	return res
}

func clampScore(v int) int {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return v
}
