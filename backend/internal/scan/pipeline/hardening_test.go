package pipeline

import (
	"context"
	"encoding/binary"
	"hash/crc32"
	"image"
	"image/color"
	"io"
	"math"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// ---------- decompression bomb ----------

// bombPNG returns a small PNG whose IHDR DECLARES w×h. The IDAT is a real
// (tiny) one, so a decoder that trusts the header allocates w*h*4 bytes before
// it discovers the pixel data is short — exactly the bomb we must not decode.
func bombPNG(t *testing.T, w, h uint32) []byte {
	t.Helper()
	src := solidPNG(t, color.RGBA{1, 2, 3, 255}) // 32x32, valid
	out := make([]byte, len(src))
	copy(out, src)
	// Layout: 8-byte signature, then length(4) "IHDR"(4) data(13) crc(4).
	const ihdr = 8 + 4 // start of the chunk type
	binary.BigEndian.PutUint32(out[ihdr+4:], w)
	binary.BigEndian.PutUint32(out[ihdr+8:], h)
	crc := crc32.ChecksumIEEE(out[ihdr : ihdr+4+13]) // over type+data
	binary.BigEndian.PutUint32(out[ihdr+4+13:], crc)
	return out
}

// A header-declared gigapixel image is rejected from the header alone, without
// ever allocating the bitmap (40000×40000 would be 6.4 GB).
func TestCheckImageBounds_RejectsHeaderBomb(t *testing.T) {
	b := bombPNG(t, 40000, 40000)
	start := time.Now()
	if err := CheckImageBounds(b); err != ErrImageTooLarge {
		t.Fatalf("CheckImageBounds = %v, want ErrImageTooLarge", err)
	}
	if el := time.Since(start); el > 2*time.Second {
		t.Fatalf("bounds check took %v — it decoded the bitmap", el)
	}
}

// Both untrusted decode sites refuse the bomb and degrade gracefully instead of
// allocating a float64 per pixel.
func TestPasses1And2_RejectHeaderBomb(t *testing.T) {
	b := bombPNG(t, 40000, 40000)
	if q := AssessQuality(b); !zeroQuality(q) {
		t.Fatalf("AssessQuality on bomb = %+v, want zero result", q)
	}
	g := AnalyseGeometry(b)
	if g.PlateDetected || len(g.Regions) != 0 {
		t.Fatalf("AnalyseGeometry on bomb = %+v, want empty no-plate result", g)
	}
}

// A single absurd dimension is rejected even when width*height stays under the
// pixel budget (a 1×400,000,000 strip is still 3.2 GB of float64 luma).
func TestCheckImageBounds_RejectsAbsurdSingleDimension(t *testing.T) {
	if err := CheckImageBounds(bombPNG(t, 1, 500000)); err != ErrImageTooLarge {
		t.Fatalf("tall strip: err = %v, want ErrImageTooLarge", err)
	}
}

// The pixel budget is env-tunable and a normal photo passes.
func TestCheckImageBounds_EnvTunable(t *testing.T) {
	small := solidPNG(t, color.RGBA{255, 255, 255, 255}) // 32x32 = 1024 px
	if err := CheckImageBounds(small); err != nil {
		t.Fatalf("32x32 rejected: %v", err)
	}
	t.Setenv("LUME_MAX_IMAGE_PIXELS", "100")
	if err := CheckImageBounds(small); err != ErrImageTooLarge {
		t.Fatalf("with a 100px budget, 1024px must be rejected, got %v", err)
	}
}

// zeroQuality reports whether a QualityResult is the untouched zero value
// (QualityResult holds a slice, so it is not comparable with ==).
func zeroQuality(q QualityResult) bool {
	return q.SharpnessScore == 0 && q.LightingScore == 0 && q.OverallScore == 0 && len(q.QualityWarnings) == 0
}

// ---------- panic containment ----------

// panicMagic is the header of a fake image format registered only in this test
// binary: its DecodeConfig looks sane, but decoding panics — standing in for a
// decoder bug on attacker-chosen bytes.
const panicMagic = "PANICIMG"

func init() {
	image.RegisterFormat("lumepanic", panicMagic,
		func(io.Reader) (image.Image, error) { panic("boom: decoder bug") },
		func(io.Reader) (image.Config, error) {
			return image.Config{ColorModel: color.RGBAModel, Width: 8, Height: 8}, nil
		})
}

// A panicking decode is contained to its own angle: the other angles still
// produce results and RunMulti returns normally (an unrecovered panic in the
// per-angle goroutine would kill the process, taking every in-flight scan).
func TestRunMulti_PanicInOneAngleIsContained(t *testing.T) {
	images := []AngleImage{
		{Bytes: solidPNG(t, color.RGBA{255, 255, 255, 255}), Angle: "top"},
		{Bytes: []byte(panicMagic + "rest"), Angle: "side"},
	}
	out := RunMulti(context.Background(), images, "u1", nil, nil)

	if len(out.PerImage) != 2 {
		t.Fatalf("PerImage = %d entries, want 2", len(out.PerImage))
	}
	if !out.PerImage[0].Geometry.PlateDetected {
		t.Fatalf("healthy angle lost its result: %+v", out.PerImage[0])
	}
	var flagged bool
	for _, w := range out.PerImage[1].Geometry.Warnings {
		if w == "image processing failed" {
			flagged = true
		}
	}
	if !flagged {
		t.Fatalf("panicking angle warnings = %v, want it flagged", out.PerImage[1].Geometry.Warnings)
	}
	// REWRITTEN in the 2026-08-06 audit: this test ran with a nil identifier,
	// so its old ">= 1 estimate" assertion could only ever be satisfied by the
	// fabricated whole-plate fallback — which is gone. With no identifier there
	// are honestly zero estimates; the containment property this test exists
	// for is the two assertions above (process alive, healthy angle intact).
	if len(out.Estimates) != 0 {
		t.Fatalf("nil identifier must yield no estimates, got %+v", out.Estimates)
	}
}

// safeAssess itself must swallow the panic (it is the shared containment point
// for every goroutine touching image bytes).
func TestSafeAssess_ContainsPanic(t *testing.T) {
	q, g := safeAssess([]byte(panicMagic + "rest"))
	if !zeroQuality(q) {
		t.Fatalf("quality after panic = %+v, want zero", q)
	}
	if len(g.Warnings) == 0 {
		t.Fatal("geometry after panic carries no warning")
	}
}

// ---------- untrusted model output ----------

func TestClampNum_RejectsNaNInfAndNegatives(t *testing.T) {
	cases := []struct {
		in, max, want float64
	}{
		{math.NaN(), 100, 0},
		{math.Inf(1), 100, 100},
		{math.Inf(-1), 100, 0},
		{-5, 100, 0},
		{1e308, 100, 100},
		{42, 100, 42},
	}
	for _, c := range cases {
		if got := clampNum(c.in, c.max); got != c.want {
			t.Errorf("clampNum(%v, %v) = %v, want %v", c.in, c.max, got, c.want)
		}
	}
	if got := clampConfidence(math.NaN()); got != 0 {
		t.Errorf("clampConfidence(NaN) = %d, want 0", got)
	}
	if got := clampConfidence(1e9); got != 100 {
		t.Errorf("clampConfidence(1e9) = %d, want 100", got)
	}
}

// Out-of-range numbers and oversized strings from the model are clamped and
// truncated before they can reach the database.
func TestIdentifyFoods_ClampsHostileModelOutput(t *testing.T) {
	long := strings.Repeat("é", 5000) // multi-byte: proves rune-safe truncation
	arr := `[{"region_id":0,"food_name":"` + long + `","food_category":"` + long + `",` +
		`"density_gcm3":1e300,"estimated_weight_g":1e300,"calories_per_100g":-50,` +
		`"protein_per_100g":99999,"carbs_per_100g":-1,"fat_per_100g":1e300,` +
		`"fibre_per_100g":500,"confidence":9999,"reasoning":"` + long + `"}]`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Write(wrapEnvelope(t, arr))
	}))
	defer srv.Close()

	out, err := newTestGemini(srv.URL).IdentifyFoods(context.Background(), []byte("img"), GeometryResult{}, "image/jpeg")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	e := out[0]
	if e.WeightG != maxWeightG || e.DensityUsed != maxDensityGcm3 {
		t.Errorf("weight/density not clamped: %+v", e)
	}
	if e.CaloriesPer100g != 0 || e.CarbsPer100g != 0 {
		t.Errorf("negatives not floored: %+v", e)
	}
	if e.ProteinPer100g != maxGramsPer100 || e.FatPer100g != maxGramsPer100 || e.FibrePer100g != maxGramsPer100 {
		t.Errorf("macros not capped: %+v", e)
	}
	if e.Confidence != 100 {
		t.Errorf("confidence = %d, want 100", e.Confidence)
	}
	if n := len([]rune(e.FoodName)); n != maxFoodNameRunes {
		t.Errorf("food_name = %d runes, want %d", n, maxFoodNameRunes)
	}
	if n := len([]rune(e.FoodCategory)); n != maxCategoryRunes {
		t.Errorf("food_category = %d runes, want %d", n, maxCategoryRunes)
	}
	if n := len([]rune(e.Reasoning)); n != maxReasoningRunes {
		t.Errorf("reasoning = %d runes, want %d", n, maxReasoningRunes)
	}
}

// A near-zero serving size makes the per-100g conversion factor explode; the
// converted values must still land inside their physical bounds.
func TestExtractLabel_ClampsExplodingConversion(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Write(wrapEnvelope(t, `{"food_name":"x","serving_size_g":1e-300,"calories_per_serving":500,`+
			`"protein_g":10,"carbs_g":10,"fat_g":10,"fibre_g":10,"confidence":-20}`))
	}))
	defer srv.Close()

	got, err := newTestGemini(srv.URL).ExtractLabel(context.Background(), []byte("img"), "image/jpeg")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.CaloriesPer100g != maxCaloriesPer100 || got.ProteinPer100g != maxGramsPer100 {
		t.Fatalf("exploded values not clamped: %+v", got)
	}
	if got.Confidence != 0 {
		t.Fatalf("negative confidence = %d, want 0", got.Confidence)
	}
}
