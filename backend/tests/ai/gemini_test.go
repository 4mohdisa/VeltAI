package aitests

// The Gemini client and the provider switch, all against local httptest
// servers: no live paid call ever leaves this file.

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lume/backend/internal/ai"
	"lume/backend/internal/aiquota"
	"lume/backend/internal/auth"
	"lume/backend/internal/config"
)

func geminiAt(t *testing.T, h http.HandlerFunc) *ai.Gemini {
	t.Helper()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	g := ai.NewGemini("test-key", "").(*ai.Gemini)
	g.Base = srv.URL
	g.HTTP = srv.Client()
	return g
}

func reply(body string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte(body)) }
}

func TestGeminiRequestAndResponse(t *testing.T) {
	var got struct {
		SystemInstruction struct {
			Parts []struct{ Text string } `json:"parts"`
		} `json:"systemInstruction"`
		Contents []struct {
			Role  string                  `json:"role"`
			Parts []struct{ Text string } `json:"parts"`
		} `json:"contents"`
		GenerationConfig map[string]any `json:"generationConfig"`
	}
	g := geminiAt(t, func(w http.ResponseWriter, r *http.Request) {
		if want := "/v1beta/models/" + ai.DefaultGeminiModel + ":generateContent"; r.Method != http.MethodPost || r.URL.Path != want {
			t.Errorf("got %s %s, want POST %s", r.Method, r.URL.Path, want)
		}
		if k := r.Header.Get("x-goog-api-key"); k != "test-key" {
			t.Errorf("x-goog-api-key = %q", k)
		}
		if strings.Contains(r.URL.RawQuery, "test-key") {
			t.Error("API key leaked into the URL")
		}
		_ = json.NewDecoder(r.Body).Decode(&got)
		_, _ = w.Write([]byte(`{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"hello "},{"text":"world"}]}}]}`))
	})
	out, err := g.Complete(context.Background(), "sys", "hi")
	if err != nil {
		t.Fatalf("Complete: %v", err)
	}
	if out != "hello world" {
		t.Errorf("out = %q, want concatenated parts", out)
	}
	if len(got.SystemInstruction.Parts) != 1 || got.SystemInstruction.Parts[0].Text != "sys" {
		t.Errorf("systemInstruction = %+v", got.SystemInstruction)
	}
	if len(got.Contents) != 1 || got.Contents[0].Role != "user" || got.Contents[0].Parts[0].Text != "hi" {
		t.Errorf("contents = %+v", got.Contents)
	}
	if got.GenerationConfig["maxOutputTokens"] != float64(1024) {
		t.Errorf("generationConfig = %v, want maxOutputTokens 1024", got.GenerationConfig)
	}
}

func TestGeminiModelIsConfigurable(t *testing.T) {
	var path string
	g := geminiAt(t, func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		_, _ = w.Write([]byte(`{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}`))
	})
	g.Model = "gemini-3.1-flash-lite"
	if _, err := g.Complete(context.Background(), "s", "p"); err != nil {
		t.Fatal(err)
	}
	if path != "/v1beta/models/gemini-3.1-flash-lite:generateContent" {
		t.Errorf("path = %q", path)
	}
}

func TestGeminiFailuresAreUnavailable(t *testing.T) {
	cases := map[string]http.HandlerFunc{
		"server error":    func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusInternalServerError) },
		"rate limited":    func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusTooManyRequests) },
		"malformed body":  reply(`{"candidates":[`),
		"no candidates":   reply(`{"candidates":[]}`),
		"empty text":      reply(`{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"  "}]}}]}`),
		"prompt blocked":  reply(`{"promptFeedback":{"blockReason":"SAFETY"}}`),
		"safety refusal":  reply(`{"candidates":[{"finishReason":"SAFETY","content":{"parts":[]}}]}`),
		"content refusal": reply(`{"candidates":[{"finishReason":"PROHIBITED_CONTENT","content":{"parts":[{"text":"partial"}]}}]}`),
	}
	for name, h := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := geminiAt(t, h).Complete(context.Background(), "s", "p"); !errors.Is(err, ai.ErrUnavailable) {
				t.Fatalf("err = %v, want ErrUnavailable", err)
			}
		})
	}
}

func TestGeminiTruncatedAnswerIsKept(t *testing.T) {
	g := geminiAt(t, reply(`{"candidates":[{"finishReason":"MAX_TOKENS","content":{"parts":[{"text":"long answer"}]}}]}`))
	if out, err := g.Complete(context.Background(), "s", "p"); err != nil || out != "long answer" {
		t.Fatalf("out=%q err=%v, want the truncated text", out, err)
	}
}

func TestGeminiTimeoutIsUnavailable(t *testing.T) {
	release := make(chan struct{})
	g := geminiAt(t, func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-release:
		case <-r.Context().Done():
		}
	})
	defer close(release)
	g.HTTP.Timeout = 50 * time.Millisecond
	start := time.Now()
	if _, err := g.Complete(context.Background(), "s", "p"); !errors.Is(err, ai.ErrUnavailable) {
		t.Fatalf("err = %v, want ErrUnavailable", err)
	}
	if time.Since(start) > 5*time.Second {
		t.Error("timeout did not bound the call")
	}
}

func TestGeminiEmptyKeyMakesNoCall(t *testing.T) {
	called := false
	g := geminiAt(t, func(http.ResponseWriter, *http.Request) { called = true })
	g.APIKey = ""
	if _, err := g.Complete(context.Background(), "s", "p"); !errors.Is(err, ai.ErrUnavailable) {
		t.Fatalf("err = %v, want ErrUnavailable", err)
	}
	if called {
		t.Error("an empty key must not reach the network")
	}
}

func TestNewLLMProviderSwitch(t *testing.T) {
	for _, p := range []string{"", "gemini", " Gemini "} {
		llm, err := ai.NewLLM(p, "g", "", "")
		if err != nil {
			t.Fatalf("%q: %v", p, err)
		}
		g, ok := llm.(*ai.Gemini)
		if !ok {
			t.Fatalf("%q: got %T, want *ai.Gemini (the default)", p, llm)
		}
		if g.Model != ai.DefaultGeminiModel || g.APIKey != "g" {
			t.Errorf("%q: model=%q key=%q", p, g.Model, g.APIKey)
		}
	}
	llm, err := ai.NewLLM("gemini", "g", "gemini-3.1-flash-lite", "")
	if err != nil || llm.(*ai.Gemini).Model != "gemini-3.1-flash-lite" {
		t.Errorf("GEMINI_MODEL not honoured: %v %v", llm, err)
	}
	if llm, err := ai.NewLLM("claude", "", "", "a"); err != nil {
		t.Fatal(err)
	} else if _, ok := llm.(*ai.Claude); !ok {
		t.Errorf("claude: got %T", llm)
	}
	if _, err := ai.NewLLM("openai", "g", "", ""); err == nil {
		t.Error("unknown provider must be an error")
	}
}

// ---- Service: response cache and daily limit ------------------------------

func TestQueryCacheHitSkipsThePaidCall(t *testing.T) {
	llm := &fakeLLM{resp: "Protein is on track."}
	now := fixedNow
	mux := newService(fullStore(), llm, &now)
	q := map[string]string{"question": "How is my protein?"}

	for i := 0; i < 3; i++ {
		if w := do(t, mux, "POST", "/api/ai/query", q, "user_1"); w.Code != http.StatusOK || dataOf[map[string]string](t, w)["answer"] != "Protein is on track." {
			t.Fatalf("call %d: %d %s", i, w.Code, w.Body.String())
		}
	}
	if llm.calls != 1 {
		t.Errorf("LLM calls for 3 identical questions = %d, want 1", llm.calls)
	}

	do(t, mux, "POST", "/api/ai/query", q, "user_2")
	if llm.calls != 2 {
		t.Errorf("another user's identical question = %d calls, want 2 (cache is per user)", llm.calls)
	}
	do(t, mux, "POST", "/api/ai/query", map[string]string{"question": "And my fibre?"}, "user_1")
	if llm.calls != 3 {
		t.Errorf("a different question = %d calls, want 3", llm.calls)
	}

	now = now.Add(16 * time.Minute) // past the 15 minute default window
	do(t, mux, "POST", "/api/ai/query", q, "user_1")
	if llm.calls != 4 {
		t.Errorf("after the cache window = %d calls, want 4", llm.calls)
	}
}

func TestQueryCacheWindowIsConfigurable(t *testing.T) {
	t.Setenv("LUME_AI_CACHE_SECONDS", "0")
	llm := &fakeLLM{resp: "x"}
	now := fixedNow
	mux := newService(fullStore(), llm, &now)
	q := map[string]string{"question": "How is my protein?"}
	do(t, mux, "POST", "/api/ai/query", q, "user_1")
	do(t, mux, "POST", "/api/ai/query", q, "user_1")
	if llm.calls != 2 {
		t.Errorf("cache disabled: calls = %d, want 2", llm.calls)
	}
}

func TestFailedCallIsNeitherCachedNorCounted(t *testing.T) {
	t.Setenv("LUME_AI_DAILY_LIMIT", "1")
	llm := &fakeLLM{err: ai.ErrUnavailable}
	now := fixedNow
	mux := newService(fullStore(), llm, &now)
	q := map[string]string{"question": "How is my protein?"}
	if w := do(t, mux, "POST", "/api/ai/query", q, "user_1"); w.Code != http.StatusServiceUnavailable {
		t.Fatalf("outage status = %d, want 503", w.Code)
	}
	llm.err, llm.resp = nil, "back"
	if w := do(t, mux, "POST", "/api/ai/query", q, "user_1"); w.Code != http.StatusOK {
		t.Fatalf("after outage status = %d, want 200 (a failure must not use the allowance)", w.Code)
	}
}

func TestDailyLimitCapsPaidCallsPerUser(t *testing.T) {
	t.Setenv("LUME_AI_DAILY_LIMIT", "2")
	llm := &fakeLLM{resp: "answer"}
	now := fixedNow
	mux := newService(fullStore(), llm, &now)
	ask := func(user, q string) int {
		return do(t, mux, "POST", "/api/ai/query", map[string]string{"question": q}, user).Code
	}
	if ask("user_1", "q1") != 200 || ask("user_1", "q2") != 200 {
		t.Fatal("first two calls should pass")
	}
	w := do(t, mux, "POST", "/api/ai/query", map[string]string{"question": "q3"}, "user_1")
	if w.Code != http.StatusTooManyRequests || !strings.Contains(w.Body.String(), aiquota.Code) {
		t.Fatalf("third call = %d %s, want 429 %s", w.Code, w.Body.String(), aiquota.Code)
	}
	if ask("user_1", "q1") != 200 {
		t.Error("a cached answer costs nothing, so it is served even at the limit")
	}
	if ask("user_2", "q1") != 200 {
		t.Error("the limit is per user")
	}
	// Over the limit the brief still answers, with the deterministic fallback.
	if w := do(t, mux, "GET", "/api/ai/morning-brief", nil, "user_1"); w.Code != http.StatusOK || dataOf[map[string]string](t, w)["brief"] == "answer" {
		t.Errorf("brief at the limit = %d %s, want the fallback text", w.Code, w.Body.String())
	}
	if llm.calls != 3 {
		t.Errorf("billed calls = %d, want 3", llm.calls)
	}

	now = now.AddDate(0, 0, 1)
	if ask("user_1", "q4") != 200 {
		t.Error("the allowance resets on the next calendar day")
	}
}

// Australia first: every prompt asks for Australian measures and spelling.
func TestEverySystemPromptUsesAustralianMeasures(t *testing.T) {
	llm := &fakeLLM{resp: "ok"}
	mux := newMux(fullStore(), llm, fixedNow)
	for _, call := range []struct{ method, path string }{
		{"POST", "/api/ai/brain/rebuild"},
		{"GET", "/api/ai/morning-brief"},
		{"POST", "/api/ai/query"},
	} {
		llm.system = ""
		var body any
		if call.path == "/api/ai/query" {
			body = map[string]string{"question": "How much oil is a tablespoon?"}
		}
		do(t, mux, call.method, call.path, body, "user_1")
		for _, want := range []string{"1 cup = 250 ml", "1 tablespoon = 20 ml", "1 teaspoon = 5 ml", "Australian spelling"} {
			if !strings.Contains(llm.system, want) {
				t.Errorf("%s system prompt lacks %q", call.path, want)
			}
		}
	}
}

// The brief's day is the user's calendar day from the X-Timezone header:
// 2026-07-04 15:00 UTC is already 5 July in Sydney but still 4 July in Perth.
func TestMorningBriefDayFollowsTheDeviceTimezone(t *testing.T) {
	t.Setenv("LUME_TIMEZONE", "UTC")
	llm := &fakeLLM{resp: "Good morning."}
	now := fixedNow // 2026-07-04 09:00 UTC
	h := config.TimezoneMiddleware(newService(fullStore(), llm, &now))
	brief := func(user, zone string) {
		req := httptest.NewRequest("GET", "/api/ai/morning-brief", nil)
		req.Header.Set(config.TimezoneHeader, zone)
		req = req.WithContext(auth.WithUserID(req.Context(), user))
		h.ServeHTTP(httptest.NewRecorder(), req)
	}
	brief("sydney_user", "Australia/Sydney")
	brief("perth_user", "Australia/Perth")
	if llm.calls != 2 {
		t.Fatalf("calls = %d, want 2", llm.calls)
	}
	now = fixedNow.Add(6 * time.Hour)
	brief("perth_user", "Australia/Perth")
	if llm.calls != 2 {
		t.Errorf("Perth is still on 4 July: calls = %d, want 2 (cached)", llm.calls)
	}
	brief("sydney_user", "Australia/Sydney")
	if llm.calls != 3 {
		t.Errorf("Sydney has reached 5 July: calls = %d, want 3 (new brief)", llm.calls)
	}
}
