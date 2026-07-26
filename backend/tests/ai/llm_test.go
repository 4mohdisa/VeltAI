package aitests

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"lumo/backend/internal/ai"
)

func TestClaudeEmptyKeyUnavailable(t *testing.T) {
	_, err := ai.NewClaude("").Complete(context.Background(), "s", "p")
	if !errors.Is(err, ai.ErrUnavailable) {
		t.Fatalf("err = %v, want ErrUnavailable", err)
	}
}

func TestClaudeRequestAndResponse(t *testing.T) {
	var gotBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/messages" || r.Method != http.MethodPost {
			t.Errorf("got %s %s", r.Method, r.URL.Path)
		}
		if k := r.Header.Get("x-api-key"); k != "test-key" {
			t.Errorf("x-api-key = %q", k)
		}
		if v := r.Header.Get("anthropic-version"); v != "2023-06-01" {
			t.Errorf("anthropic-version = %q", v)
		}
		if ct := r.Header.Get("content-type"); ct != "application/json" {
			t.Errorf("content-type = %q", ct)
		}
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		_, _ = w.Write([]byte(`{"content":[{"type":"text","text":"hello "},{"type":"text","text":"world"}]}`))
	}))
	defer srv.Close()

	c := ai.NewClaude("test-key").(*ai.Claude)
	c.Base = srv.URL
	c.HTTP = srv.Client()

	out, err := c.Complete(context.Background(), "sys", "hi")
	if err != nil {
		t.Fatalf("Complete: %v", err)
	}
	if out != "hello world" {
		t.Errorf("out = %q, want concatenated content text", out)
	}
	if gotBody["model"] != "claude-fable-5" || gotBody["system"] != "sys" || gotBody["max_tokens"] != float64(1024) {
		t.Errorf("request body = %v", gotBody)
	}
}

func TestClaudeErrorStatusIsUnavailable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	c := ai.NewClaude("k").(*ai.Claude)
	c.Base = srv.URL
	c.HTTP = srv.Client()
	if _, err := c.Complete(context.Background(), "s", "p"); !errors.Is(err, ai.ErrUnavailable) {
		t.Fatalf("err = %v, want ErrUnavailable", err)
	}
}

func TestParseInsights(t *testing.T) {
	fenced := "```json\n[{\"type\":\"a\",\"title\":\"t1\",\"body\":\"b1\"},{\"type\":\"b\",\"title\":\"t2\",\"body\":\"b2\"},{\"type\":\"c\",\"title\":\"t3\",\"body\":\"b3\"}]\n```"
	ins, err := ai.ParseInsights(fenced)
	if err != nil || len(ins) != 3 {
		t.Fatalf("fenced: ins=%d err=%v", len(ins), err)
	}

	prose := `Here you go! [{"type":"a","title":"t","body":"b"},{"type":"a","title":"t","body":"b"},{"type":"a","title":"t","body":"b"}] Hope that helps.`
	if ins, err = ai.ParseInsights(prose); err != nil || len(ins) != 3 {
		t.Fatalf("prose-wrapped: ins=%d err=%v", len(ins), err)
	}

	if _, err = ai.ParseInsights(`[{"type":"a","title":"t","body":"b"}]`); err == nil {
		t.Error("expected error for fewer than 3 insights")
	}
	if _, err = ai.ParseInsights("no json at all"); err == nil {
		t.Error("expected error for non-JSON output")
	}

	seven := `[` +
		`{"type":"a","title":"t","body":"b"},{"type":"a","title":"t","body":"b"},` +
		`{"type":"a","title":"t","body":"b"},{"type":"a","title":"t","body":"b"},` +
		`{"type":"a","title":"t","body":"b"},{"type":"a","title":"t","body":"b"},` +
		`{"type":"a","title":"t","body":"b"}]`
	if ins, err = ai.ParseInsights(seven); err != nil || len(ins) != 5 {
		t.Fatalf("seven items: ins=%d err=%v, want capped to 5", len(ins), err)
	}
}

func TestFallbackInsightsAlwaysThree(t *testing.T) {
	// Even an empty brain must still yield 3 insights.
	ins := ai.FallbackInsights(ai.Brain{})
	if len(ins) != 3 {
		t.Fatalf("empty brain fallback = %d insights, want 3", len(ins))
	}
	for _, in := range ins {
		if in.Type == "" || in.Title == "" || in.Body == "" {
			t.Errorf("incomplete fallback insight: %+v", in)
		}
	}
}
