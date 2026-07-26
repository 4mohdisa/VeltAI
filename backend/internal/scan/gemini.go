package scan

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

// ErrUnavailable is returned when no Gemini API key is configured.
var ErrUnavailable = errors.New("scan unavailable")

// Result is the structured nutrition data extracted from a food photo.
// ScanSessionID is filled in by the POST /api/scan handler after ocr.Extract
// succeeds (never by Extract itself) — the client passes it back into
// /api/scan/confirm, /api/scan/correction, and /api/scan/feedback.
type Result struct {
	FoodName      string  `json:"food_name"`
	Brand         string  `json:"brand"`
	Quantity      float64 `json:"quantity"`
	Unit          string  `json:"unit"`
	Calories      float64 `json:"calories"`
	Protein       float64 `json:"protein"`
	Carbs         float64 `json:"carbs"`
	Fat           float64 `json:"fat"`
	Fibre         float64 `json:"fibre"`
	Confidence    float64 `json:"confidence"`
	ScanSessionID string  `json:"scan_session_id"`
}

// OCR extracts nutrition data from a base64-encoded image.
type OCR interface {
	Extract(ctx context.Context, imageBase64, mimeType string) (Result, error)
}

// Gemini calls the Gemini vision API. Base and HTTP are exported for tests.
type Gemini struct {
	Base string
	HTTP *http.Client
	key  string
}

// NewGemini returns a Gemini-backed OCR; an empty key makes Extract fail
// with ErrUnavailable.
func NewGemini(apiKey string) OCR {
	return &Gemini{
		Base: "https://generativelanguage.googleapis.com",
		HTTP: &http.Client{Timeout: 30 * time.Second},
		key:  apiKey,
	}
}

const extractPrompt = `Identify the food in this image and estimate its nutrition. Respond with strict JSON only — a single object with exactly these keys: "food_name" (string), "brand" (string, "" if none), "quantity" (number), "unit" (string), "calories" (number), "protein" (number), "carbs" (number), "fat" (number), "fibre" (number), "confidence" (number 0-1). Use 0 or "" for unknown values. No markdown, no extra keys.`

type geminiPart struct {
	Text       string `json:"text,omitempty"`
	InlineData *struct {
		MimeType string `json:"mime_type"`
		Data     string `json:"data"`
	} `json:"inline_data,omitempty"`
}

func (g *Gemini) Extract(ctx context.Context, imageBase64, mimeType string) (Result, error) {
	if g.key == "" {
		return Result{}, ErrUnavailable
	}
	inline := &struct {
		MimeType string `json:"mime_type"`
		Data     string `json:"data"`
	}{MimeType: mimeType, Data: imageBase64}
	body := map[string]any{
		"contents": []map[string]any{
			{"parts": []geminiPart{{Text: extractPrompt}, {InlineData: inline}}},
		},
		"generationConfig": map[string]any{"response_mime_type": "application/json"},
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return Result{}, err
	}
	// Key goes in a header, never the URL: transport errors stringify the full URL.
	url := g.Base + "/v1beta/models/gemini-2.5-flash:generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return Result{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.key)
	resp, err := g.HTTP.Do(req)
	if err != nil {
		return Result{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return Result{}, fmt.Errorf("gemini: status %d", resp.StatusCode)
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
		return Result{}, fmt.Errorf("gemini: %w", err)
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return Result{}, errors.New("gemini: empty response")
	}
	var res Result
	if err := json.Unmarshal([]byte(out.Candidates[0].Content.Parts[0].Text), &res); err != nil {
		return Result{}, fmt.Errorf("gemini: bad JSON in response: %w", err)
	}
	return res, nil
}
