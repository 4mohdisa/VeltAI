package pipeline

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"
)

// ErrUnavailable is returned when no Gemini API key is configured.
var ErrUnavailable = errors.New("scan pipeline: gemini unavailable")

// Gemini is the structured (geometry-constrained) vision client for pass 3 and
// the nutrition-label reader. Base and HTTP are exported for tests.
type Gemini struct {
	Base string
	HTTP *http.Client
	key  string
}

// NewGemini returns a structured-pipeline Gemini client; an empty key makes the
// calls fail with ErrUnavailable.
func NewGemini(apiKey string) *Gemini {
	return &Gemini{
		Base: "https://generativelanguage.googleapis.com",
		HTTP: &http.Client{Timeout: 30 * time.Second},
		key:  apiKey,
	}
}

// newTestGemini injects a fake server (key is unexported, so tests can't set it).
func newTestGemini(base string) *Gemini {
	return &Gemini{Base: base, HTTP: http.DefaultClient, key: "test"}
}

// Key reports whether an API key is configured (label handler uses it to 503).
func (g *Gemini) Configured() bool { return g.key != "" }

const identifyInstructions = `For each region return a JSON array of objects with keys: region_id (int), food_name (string), food_category (string), density_gcm3 (number), estimated_weight_g (number), calories_per_100g (number), protein_per_100g (number), carbs_per_100g (number), fat_per_100g (number), confidence (number 0-100), reasoning (string max 15 words). Return ONLY a valid JSON array, no other text.`

const labelPrompt = `This is a nutrition facts label. Extract: {food_name (string or null), serving_size_g (number), calories_per_serving (number), protein_g (number), carbs_g (number), fat_g (number), fibre_g (number), confidence (number 0-100)}. Return ONLY valid JSON.`

// aiFood mirrors one object of the Gemini JSON array (pass 3).
type aiFood struct {
	RegionID         int     `json:"region_id"`
	FoodName         string  `json:"food_name"`
	FoodCategory     string  `json:"food_category"`
	DensityGcm3      float64 `json:"density_gcm3"`
	EstimatedWeightG float64 `json:"estimated_weight_g"`
	CaloriesPer100g  float64 `json:"calories_per_100g"`
	ProteinPer100g   float64 `json:"protein_per_100g"`
	CarbsPer100g     float64 `json:"carbs_per_100g"`
	FatPer100g       float64 `json:"fat_per_100g"`
	FibrePer100g     float64 `json:"fibre_per_100g"`
	Confidence       float64 `json:"confidence"`
	Reasoning        string  `json:"reasoning"`
}

// aiLabel mirrors the per-serving nutrition-label JSON (null food_name unmarshals to "").
type aiLabel struct {
	FoodName           string  `json:"food_name"`
	ServingSizeG       float64 `json:"serving_size_g"`
	CaloriesPerServing float64 `json:"calories_per_serving"`
	ProteinG           float64 `json:"protein_g"`
	CarbsG             float64 `json:"carbs_g"`
	FatG               float64 `json:"fat_g"`
	FibreG             float64 `json:"fibre_g"`
	Confidence         float64 `json:"confidence"`
}

// IdentifyFoods is pass 3 — structured, geometry-constrained identification.
// mimeType is the image's content type (jpeg/png/webp/heic); empty/unknown
// falls back to image/jpeg.
func (g *Gemini) IdentifyFoods(ctx context.Context, imageBytes []byte, geo GeometryResult, mimeType string) ([]FoodEstimate, error) {
	if g.key == "" {
		return nil, ErrUnavailable
	}
	prompt := buildIdentifyPrompt(geo)
	// Phase 13 E3: per-user learned context (cuisines, frequent foods, identity
	// corrections, portion tendencies) prepends to the identification prompt.
	// Carried on the ctx so the FoodIdentifier interface stays unchanged.
	if uc := UserContextFrom(ctx); uc != "" {
		prompt = uc + "\n\n" + prompt
	}

	// Parse errors get one retry (2 attempts total); HTTP errors propagate.
	for attempt := 0; attempt < 2; attempt++ {
		text, err := g.generate(ctx, prompt, imageBytes, mimeType)
		if err != nil {
			return nil, err
		}
		var raw []aiFood
		if json.Unmarshal([]byte(stripFence(text)), &raw) == nil {
			out := make([]FoodEstimate, len(raw))
			for i, f := range raw {
				out[i] = FoodEstimate{
					RegionID:        f.RegionID,
					FoodName:        f.FoodName,
					FoodCategory:    f.FoodCategory,
					WeightG:         f.EstimatedWeightG,
					Confidence:      int(math.Round(f.Confidence)),
					DensityUsed:     f.DensityGcm3,
					MacroSource:     "ai_estimate",
					CaloriesPer100g: f.CaloriesPer100g,
					ProteinPer100g:  f.ProteinPer100g,
					CarbsPer100g:    f.CarbsPer100g,
					FatPer100g:      f.FatPer100g,
					FibrePer100g:    f.FibrePer100g,
					Reasoning:       f.Reasoning,
				}
			}
			return out, nil
		}
	}

	// Unparseable after retry: a whole-plate fallback is a success, not a failure.
	weight := 150.0
	if geo.PlateAreaCm2 > 0 {
		weight = geo.PlateAreaCm2 * 2.5 * 0.80
	}
	return []FoodEstimate{{
		RegionID:    0,
		FoodName:    "Unknown food",
		WeightG:     weight,
		Confidence:  20,
		DensityUsed: 0.80,
		MacroSource: "ai_estimate",
		Reasoning:   "fallback: unparseable AI response",
	}}, nil
}

// ExtractLabel reads a nutrition-facts label and returns per-100g values.
// mimeType is the image's content type; empty/unknown falls back to image/jpeg.
func (g *Gemini) ExtractLabel(ctx context.Context, imageBytes []byte, mimeType string) (LabelResult, error) {
	if g.key == "" {
		return LabelResult{}, ErrUnavailable
	}
	text, err := g.generate(ctx, labelPrompt, imageBytes, mimeType)
	if err != nil {
		return LabelResult{}, err
	}
	var lbl aiLabel
	if err := json.Unmarshal([]byte(stripFence(text)), &lbl); err != nil {
		return LabelResult{}, fmt.Errorf("gemini label: %w", err)
	}

	// Convert per-serving to per-100g. Guard a missing/zero serving size by
	// treating the values as already per-100g (factor 1, serving 100g).
	serving := lbl.ServingSizeG
	factor := 100.0 / serving
	if serving <= 0 {
		factor = 1
		serving = 100
	}
	return LabelResult{
		FoodName:        lbl.FoodName,
		ServingSizeG:    serving,
		CaloriesPer100g: lbl.CaloriesPerServing * factor,
		ProteinPer100g:  lbl.ProteinG * factor,
		CarbsPer100g:    lbl.CarbsG * factor,
		FatPer100g:      lbl.FatG * factor,
		FibrePer100g:    lbl.FibreG * factor,
		Confidence:      int(math.Round(lbl.Confidence)),
		MacroSource:     "label_scan",
	}, nil
}

// buildIdentifyPrompt embeds the geometric constraints for pass 3.
func buildIdentifyPrompt(geo GeometryResult) string {
	var b strings.Builder
	b.WriteString("GEOMETRIC CONSTRAINTS — use these, do not override:\n")
	fmt.Fprintf(&b, "Plate detected: %v\n", geo.PlateDetected)
	fmt.Fprintf(&b, "Plate diameter: %gcm\n", geo.PlateDiameterCm)
	fmt.Fprintf(&b, "Camera angle: %g°\n", geo.CameraAngleDeg)
	b.WriteString("REGIONS:\n")
	for _, r := range geo.Regions {
		fmt.Fprintf(&b, "Region %d: %g%% plate area = %gcm², colour=%s, estimated height=%gcm, estimated volume=%gcm³\n",
			r.ID, r.AreaPercent, r.AreaCm2, r.DominantColour, r.HeightEstCm, r.Volume)
	}
	b.WriteString(identifyInstructions)
	return b.String()
}

// supportedMimes are the image content types Gemini vision accepts; anything
// else (or empty) is sent as image/jpeg.
var supportedMimes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/heic": true,
}

// normalizeMime returns a supported image MIME type, defaulting to image/jpeg.
func normalizeMime(mimeType string) string {
	if supportedMimes[strings.ToLower(strings.TrimSpace(mimeType))] {
		return strings.ToLower(strings.TrimSpace(mimeType))
	}
	return "image/jpeg"
}

// generate performs the Gemini generateContent call and returns the raw text of
// candidates[0].content.parts[0].text. imageBytes is base64-encoded inline with
// the given (normalized) mime type.
func (g *Gemini) generate(ctx context.Context, prompt string, imageBytes []byte, mimeType string) (string, error) {
	body := map[string]any{
		"contents": []map[string]any{
			{"parts": []map[string]any{
				{"text": prompt},
				{"inline_data": map[string]any{
					"mime_type": normalizeMime(mimeType),
					"data":      base64.StdEncoding.EncodeToString(imageBytes),
				}},
			}},
		},
		"generationConfig": map[string]any{"response_mime_type": "application/json"},
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	// Key goes in a header, never the URL.
	url := g.Base + "/v1beta/models/gemini-2.5-flash:generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.key)
	resp, err := g.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini: status %d", resp.StatusCode)
	}
	var out struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("gemini: %w", err)
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("gemini: empty response")
	}
	return out.Candidates[0].Content.Parts[0].Text, nil
}

// stripFence removes a ```json ... ``` markdown fence if the model wrapped its JSON.
func stripFence(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
