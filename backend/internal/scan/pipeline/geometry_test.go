package pipeline

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"math"
	"testing"
)

func geometryPNG(t *testing.T, img image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("png encode: %v", err)
	}
	return buf.Bytes()
}

func solidPNG(t *testing.T, c color.RGBA) []byte {
	img := image.NewRGBA(image.Rect(0, 0, 32, 32))
	for y := 0; y < 32; y++ {
		for x := 0; x < 32; x++ {
			img.Set(x, y, c)
		}
	}
	return geometryPNG(t, img)
}

func TestAnalyseGeometryNoPlate(t *testing.T) {
	// Solid mid-grey: not bright enough to read as a plate rim.
	got := AnalyseGeometry(solidPNG(t, color.RGBA{128, 128, 128, 255}))
	if got.PlateDetected {
		t.Fatalf("mid-grey image: PlateDetected = true, want false")
	}
}

func TestAnalyseGeometryDecodeError(t *testing.T) {
	got := AnalyseGeometry([]byte("nope"))
	if got.PlateDetected || len(got.Warnings) == 0 {
		t.Fatalf("decode error = %+v, want PlateDetected false with a warning", got)
	}
}

func TestPlateArea(t *testing.T) {
	got := PlateArea(27.0)
	want := math.Pi * 13.5 * 13.5
	if math.Abs(got-want) > 0.001 {
		t.Fatalf("PlateArea(27.0) = %v, want %v", got, want)
	}
}

func TestAnalyseGeometryWeightIsVolumeTimesDensity(t *testing.T) {
	// Solid white fills the frame with bright, neutral pixels → plate detected,
	// which yields a non-zero region we can check the volume×density path on.
	got := AnalyseGeometry(solidPNG(t, color.RGBA{255, 255, 255, 255}))
	if !got.PlateDetected {
		t.Fatalf("white image: PlateDetected = false, want true")
	}
	if len(got.Regions) == 0 {
		t.Fatal("white image: no regions produced")
	}
	r := got.Regions[0]
	if r.Volume <= 0 {
		t.Fatalf("region Volume = %v, want > 0", r.Volume)
	}
	if math.Abs(r.EstimatedWeightG-r.Volume*0.80) > 1e-9 {
		t.Fatalf("EstimatedWeightG = %v, want Volume*0.80 = %v", r.EstimatedWeightG, r.Volume*0.80)
	}
}
