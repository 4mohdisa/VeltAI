package integrations

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// httpClient is the shared client for all provider calls (bounded timeout so a
// hung provider never wedges a sync request).
var httpClient = &http.Client{Timeout: 15 * time.Second}

// postForm sends an application/x-www-form-urlencoded POST and decodes the JSON
// response into out. Non-2xx is an error carrying a truncated body for logs.
func postForm(ctx context.Context, endpoint string, form url.Values, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	return doJSON(req, out)
}

// getJSON sends a bearer-authenticated GET and decodes the JSON response.
func getJSON(ctx context.Context, endpoint, bearer string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+bearer)
	req.Header.Set("Accept", "application/json")
	return doJSON(req, out)
}

func doJSON(req *http.Request, out any) error {
	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		snippet := string(body)
		if len(snippet) > 200 {
			snippet = snippet[:200]
		}
		return fmt.Errorf("provider returned %d: %s", resp.StatusCode, snippet)
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(body, out)
}

// dateOnly returns the YYYY-MM-DD prefix of an ISO timestamp ("2026-07-14T…" →
// "2026-07-14"). A too-short string is returned unchanged.
func dateOnly(iso string) string {
	if len(iso) >= 10 {
		return iso[:10]
	}
	return iso
}

func firstNonEmpty(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}
