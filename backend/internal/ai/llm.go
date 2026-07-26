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

// Claude calls the Anthropic Messages API. Base and HTTP are exported so
// tests can point at a local server.
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
