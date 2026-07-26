package pipeline

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"testing"
)

// qualityPNG encodes an image to PNG bytes for the quality tests.
func qualityPNG(t *testing.T, img image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("png encode: %v", err)
	}
	return buf.Bytes()
}

func TestAssessQualityBlackImage(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 48, 48))
	for y := 0; y < 48; y++ {
		for x := 0; x < 48; x++ {
			img.Set(x, y, color.RGBA{0, 0, 0, 255})
		}
	}
	got := AssessQuality(qualityPNG(t, img))
	if got.SharpnessScore != 0 {
		t.Fatalf("black image SharpnessScore = %d, want 0", got.SharpnessScore)
	}
	if got.LightingScore != 0 {
		t.Fatalf("black image LightingScore = %d, want 0", got.LightingScore)
	}
}

func TestAssessQualityDecodeError(t *testing.T) {
	got := AssessQuality([]byte("not an image"))
	if got.SharpnessScore != 0 || got.LightingScore != 0 || got.OverallScore != 0 || len(got.QualityWarnings) != 0 {
		t.Fatalf("bad bytes = %+v, want zero QualityResult", got)
	}
}

func TestAssessQualitySharpWellLit(t *testing.T) {
	const w, h = 48, 48
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	// High-detail, high-contrast: a well-spread pseudo-random grey per pixel.
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			// Avalanche hash so adjacent pixels decorrelate (a plain LCG's high
			// byte barely moves per step, which would read as a flat, blurry image).
			n := uint32(y*w + x)
			n ^= n >> 16
			n *= 0x7feb352d
			n ^= n >> 15
			n *= 0x846ca68b
			n ^= n >> 16
			v := uint8(n)
			img.Set(x, y, color.RGBA{v, v, v, 255})
		}
	}
	got := AssessQuality(qualityPNG(t, img))
	if got.SharpnessScore <= 60 {
		t.Fatalf("noise SharpnessScore = %d, want > 60", got.SharpnessScore)
	}
	if got.LightingScore <= 60 {
		t.Fatalf("noise LightingScore = %d, want > 60", got.LightingScore)
	}
}
