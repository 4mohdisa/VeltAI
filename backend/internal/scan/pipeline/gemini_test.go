package pipeline

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

// wrapEnvelope returns a valid Gemini generateContent envelope whose single
// candidate part text is the given payload.
func wrapEnvelope(t *testing.T, partText string) []byte {
	t.Helper()
	env := map[string]any{
		"candidates": []map[string]any{
			{"content": map[string]any{
				"parts": []map[string]any{{"text": partText}},
			}},
		},
	}
	b, err := json.Marshal(env)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestIdentifyFoods_ValidArray(t *testing.T) {
	arr := `[{"region_id":2,"food_name":"Basmati rice","food_category":"rice","density_gcm3":0.85,"estimated_weight_g":180,"calories_per_100g":130,"protein_per_100g":2.7,"carbs_per_100g":28,"fat_per_100g":0.3,"fibre_per_100g":0.4,"confidence":78.6,"reasoning":"white grains, plate coverage"}]`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-goog-api-key") == "" {
			t.Error("missing api key header")
		}
		w.Write(wrapEnvelope(t, arr))
	}))
	defer srv.Close()

	g := newTestGemini(srv.URL)
	out, err := g.IdentifyFoods(context.Background(), []byte("img"), GeometryResult{}, "image/jpeg")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out) != 1 {
		t.Fatalf("want 1 estimate, got %d", len(out))
	}
	e := out[0]
	if e.RegionID != 2 || e.FoodName != "Basmati rice" || e.FoodCategory != "rice" {
		t.Errorf("bad mapping: %+v", e)
	}
	if e.WeightG != 180 || e.DensityUsed != 0.85 || e.Confidence != 79 { // 78.6 rounds to 79
		t.Errorf("weight/density/confidence: %+v", e)
	}
	if e.CaloriesPer100g != 130 || e.ProteinPer100g != 2.7 || e.CarbsPer100g != 28 || e.FatPer100g != 0.3 || e.FibrePer100g != 0.4 {
		t.Errorf("macros: %+v", e)
	}
	if e.MacroSource != "ai_estimate" {
		t.Errorf("macro source: %q", e.MacroSource)
	}
}

// REWRITTEN in the 2026-08-06 audit: this used to assert the fabricated
// "Unknown food" fallback (plate area × default height × density presented as
// a successful identification). Garbage after one retry is an error.
func TestIdentifyFoods_GarbageFallsBackAfterRetry(t *testing.T) {
	var calls int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.Write(wrapEnvelope(t, "not json at all {{{"))
	}))
	defer srv.Close()

	g := newTestGemini(srv.URL)
	geo := GeometryResult{PlateAreaCm2: 100}
	out, err := g.IdentifyFoods(context.Background(), []byte("img"), geo, "image/jpeg")
	if !errors.Is(err, ErrUnparseable) {
		t.Fatalf("garbage output must return ErrUnparseable, got err=%v out=%+v", err, out)
	}
	if calls != 2 {
		t.Errorf("want 2 attempts (one retry), got %d", calls)
	}
	if len(out) != 0 {
		t.Fatalf("garbage output must yield no estimates, got %+v", out)
	}
}

func TestExtractLabel_PerServingToPer100g(t *testing.T) {
	label := `{"food_name":"Granola","serving_size_g":50,"calories_per_serving":200,"protein_g":5,"carbs_g":30,"fat_g":6,"fibre_g":4,"confidence":90}`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(wrapEnvelope(t, label))
	}))
	defer srv.Close()

	g := newTestGemini(srv.URL)
	res, err := g.ExtractLabel(context.Background(), []byte("img"), "image/jpeg")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// factor = 100/50 = 2
	if res.CaloriesPer100g != 400 || res.ProteinPer100g != 10 || res.CarbsPer100g != 60 || res.FatPer100g != 12 || res.FibrePer100g != 8 {
		t.Errorf("per-100g conversion wrong: %+v", res)
	}
	if res.ServingSizeG != 50 || res.Confidence != 90 || res.MacroSource != "label_scan" || res.FoodName != "Granola" {
		t.Errorf("label fields: %+v", res)
	}
}

func TestExtractLabel_ZeroServingTreatedAsPer100g(t *testing.T) {
	label := `{"food_name":null,"serving_size_g":0,"calories_per_serving":250,"protein_g":8,"carbs_g":40,"fat_g":5,"fibre_g":3,"confidence":70}`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(wrapEnvelope(t, label))
	}))
	defer srv.Close()

	g := newTestGemini(srv.URL)
	res, err := g.ExtractLabel(context.Background(), []byte("img"), "image/jpeg")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.CaloriesPer100g != 250 || res.ProteinPer100g != 8 || res.ServingSizeG != 100 {
		t.Errorf("zero-serving guard: %+v", res)
	}
	if res.FoodName != "" {
		t.Errorf("null food_name should be empty string, got %q", res.FoodName)
	}
}

func TestGemini_Unconfigured(t *testing.T) {
	g := NewGemini("")
	if _, err := g.IdentifyFoods(context.Background(), nil, GeometryResult{}, "image/jpeg"); err != ErrUnavailable {
		t.Errorf("IdentifyFoods want ErrUnavailable, got %v", err)
	}
	if _, err := g.ExtractLabel(context.Background(), nil, "image/jpeg"); err != ErrUnavailable {
		t.Errorf("ExtractLabel want ErrUnavailable, got %v", err)
	}
}
