package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// ErrUnavailable signals the LLM cannot produce an answer; callers fall back
// to deterministic text where a fallback exists.
var ErrUnavailable = errors.New("llm unavailable")

type LLM interface {
	Complete(ctx context.Context, system, prompt string) (string, error)
}

// DefaultGeminiModel is the cheapest stable Gemini Flash-class model with no
// announced shutdown (Google model and pricing pages, read 2026-11-24): see
// AI_COSTS.md. gemini-3.1-flash-lite is cheaper but shuts down 2027-05-07;
// gemini-2.5-flash-lite is open only to accounts that used 2.5 before.
const DefaultGeminiModel = "gemini-3.5-flash-lite"

// NewLLM picks the provider for insights, the morning brief and the query.
// Gemini is the default; Claude is an optional fallback behind
// LLM_PROVIDER=claude. An unknown provider is an error (config.Validate makes
// it fatal at startup).
func NewLLM(provider, geminiKey, geminiModel, anthropicKey string) (LLM, error) {
	switch strings.ToLower(strings.TrimSpace(provider)) {
	case "", "gemini":
		return NewGemini(geminiKey, geminiModel), nil
	case "claude":
		return NewClaude(anthropicKey), nil
	}
	return nil, fmt.Errorf("unknown LLM_PROVIDER %q (want gemini or claude)", provider)
}

// Gemini calls the Gemini generateContent API. Base and HTTP are exported so
// tests can point at a local server.
type Gemini struct {
	APIKey string
	Model  string
	Base   string
	HTTP   *http.Client
}

func NewGemini(apiKey, model string) LLM {
	if model == "" {
		model = DefaultGeminiModel
	}
	return &Gemini{
		APIKey: apiKey,
		Model:  model,
		Base:   "https://generativelanguage.googleapis.com",
		HTTP:   &http.Client{Timeout: 30 * time.Second},
	}
}

type geminiText struct {
	Text string `json:"text"`
}

// Complete wraps every failure, refusal included, in ErrUnavailable so
// callers need one check.
func (g *Gemini) Complete(ctx context.Context, system, prompt string) (string, error) {
	if g.APIKey == "" {
		return "", ErrUnavailable
	}
	body, _ := json.Marshal(map[string]any{
		"systemInstruction": map[string]any{"parts": []geminiText{{Text: system}}},
		"contents":          []map[string]any{{"role": "user", "parts": []geminiText{{Text: prompt}}}},
		// Bounds the paid output, thinking tokens included; the expected
		// answers are a few hundred tokens.
		"generationConfig": map[string]any{"maxOutputTokens": 1024},
	})
	// Key goes in a header, never the URL: transport errors stringify the URL.
	url := g.Base + "/v1beta/models/" + g.Model + ":generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	req.Header.Set("x-goog-api-key", g.APIKey)
	req.Header.Set("content-type", "application/json")
	resp, err := g.HTTP.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%w: status %d", ErrUnavailable, resp.StatusCode)
	}
	var out struct {
		PromptFeedback struct {
			BlockReason string `json:"blockReason"`
		} `json:"promptFeedback"`
		Candidates []struct {
			FinishReason string `json:"finishReason"`
			Content      struct {
				Parts []geminiText `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	if r := out.PromptFeedback.BlockReason; r != "" {
		return "", fmt.Errorf("%w: prompt blocked (%s)", ErrUnavailable, r)
	}
	if len(out.Candidates) == 0 {
		return "", fmt.Errorf("%w: no candidates", ErrUnavailable)
	}
	c := out.Candidates[0]
	// STOP is a finished answer and MAX_TOKENS a usable truncated one; any
	// other reason (SAFETY, RECITATION, PROHIBITED_CONTENT, ...) is a refusal.
	if c.FinishReason != "" && c.FinishReason != "STOP" && c.FinishReason != "MAX_TOKENS" {
		return "", fmt.Errorf("%w: refused (%s)", ErrUnavailable, c.FinishReason)
	}
	var sb strings.Builder
	for _, part := range c.Content.Parts {
		sb.WriteString(part.Text)
	}
	if strings.TrimSpace(sb.String()) == "" {
		return "", fmt.Errorf("%w: empty response", ErrUnavailable)
	}
	return sb.String(), nil
}

// Claude calls the Anthropic Messages API. Optional fallback only, used when
// LLM_PROVIDER=claude. Base and HTTP are exported so tests can point at a
// local server.
type Claude struct {
	APIKey string
	Base   string
	HTTP   *http.Client
}

func NewClaude(apiKey string) LLM {
	return &Claude{
		APIKey: apiKey,
		Base:   "https://api.anthropic.com",
		HTTP:   &http.Client{Timeout: 60 * time.Second},
	}
}

// Complete wraps every failure in ErrUnavailable so callers need one check.
func (c *Claude) Complete(ctx context.Context, system, prompt string) (string, error) {
	if c.APIKey == "" {
		return "", ErrUnavailable
	}
	body, _ := json.Marshal(map[string]any{
		"model":      "claude-fable-5",
		"max_tokens": 1024,
		"system":     system,
		"messages":   []map[string]string{{"role": "user", "content": prompt}},
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Base+"/v1/messages", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%w: status %d", ErrUnavailable, resp.StatusCode)
	}
	var out struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	var sb strings.Builder
	for _, part := range out.Content {
		sb.WriteString(part.Text)
	}
	if sb.Len() == 0 {
		return "", fmt.Errorf("%w: empty response", ErrUnavailable)
	}
	return sb.String(), nil
}
