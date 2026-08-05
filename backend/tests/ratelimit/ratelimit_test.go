// Per-user rate limiting — the spend ceiling in front of the paid AI calls.
// Hermetic: fake clock, httptest, no DB, no sleeps.
package ratelimittests

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/ratelimit"
)

// clock is a hand-cranked time source.
type clock struct{ t time.Time }

func (c *clock) now() time.Time      { return c.t }
func (c *clock) add(d time.Duration) { c.t = c.t.Add(d) }

// serve mounts the limiter over a handler that records how often it was reached.
func serve(limits ratelimit.Limits, now func() time.Time) (http.Handler, *int) {
	reached := 0
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		reached++
		w.WriteHeader(http.StatusOK)
	})
	return ratelimit.New(limits, now).Middleware(inner), &reached
}

// do sends one request as userID ("" = unauthenticated).
func do(h http.Handler, method, path, userID string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, nil)
	r.RemoteAddr = "203.0.113.7:5555"
	if userID != "" {
		r = r.WithContext(auth.WithUserID(r.Context(), userID))
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestUnderLimitPassesAndNPlusOneIs429(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	h, reached := serve(ratelimit.Limits{ratelimit.ClassAI: 3}, c.now)

	for i := 1; i <= 3; i++ {
		if got := do(h, http.MethodPost, "/api/ai/query", "user_a").Code; got != http.StatusOK {
			t.Fatalf("request %d: got %d, want 200", i, got)
		}
	}
	w := do(h, http.MethodPost, "/api/ai/query", "user_a")
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("4th request: got %d, want 429", w.Code)
	}
	if *reached != 3 {
		t.Fatalf("handler reached %d times, want 3 — a blocked request still cost money", *reached)
	}
}

func TestRetryAfterIsPresentAndSane(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	h, _ := serve(ratelimit.Limits{ratelimit.ClassAI: 1}, c.now)

	do(h, http.MethodPost, "/api/ai/query", "user_a")
	c.add(20 * time.Second)
	w := do(h, http.MethodPost, "/api/ai/query", "user_a")

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("got %d, want 429", w.Code)
	}
	secs, err := strconv.Atoi(w.Header().Get("Retry-After"))
	if err != nil {
		t.Fatalf("Retry-After = %q: %v", w.Header().Get("Retry-After"), err)
	}
	if secs != 40 { // 60s window, 20s elapsed
		t.Fatalf("Retry-After = %d, want 40", secs)
	}
}

// The critical one: one user's spending must never throttle another's.
func TestDifferentUsersDoNotShareABucket(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	h, _ := serve(ratelimit.Limits{ratelimit.ClassAI: 2}, c.now)

	do(h, http.MethodPost, "/api/ai/query", "user_a")
	do(h, http.MethodPost, "/api/ai/query", "user_a")
	if got := do(h, http.MethodPost, "/api/ai/query", "user_a").Code; got != http.StatusTooManyRequests {
		t.Fatalf("user_a 3rd: got %d, want 429", got)
	}
	if got := do(h, http.MethodPost, "/api/ai/query", "user_b").Code; got != http.StatusOK {
		t.Fatalf("user_b 1st: got %d, want 200 — buckets are shared", got)
	}
}

// Same IP, so an unauthenticated caller would collide with user_a if they were
// keyed the same. They must be limited, but separately.
func TestUnauthenticatedIsLimitedSeparately(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	h, _ := serve(ratelimit.Limits{ratelimit.ClassAI: 1}, c.now)

	if got := do(h, http.MethodPost, "/api/ai/query", "user_a").Code; got != http.StatusOK {
		t.Fatalf("user_a: got %d, want 200", got)
	}
	if got := do(h, http.MethodPost, "/api/ai/query", "").Code; got != http.StatusOK {
		t.Fatalf("anon 1st: got %d, want 200 — anon shares user_a's bucket", got)
	}
	if got := do(h, http.MethodPost, "/api/ai/query", "").Code; got != http.StatusTooManyRequests {
		t.Fatalf("anon 2nd: got %d, want 429 — anon is unlimited", got)
	}
}

func TestRefillsAfterWindow(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	h, _ := serve(ratelimit.Limits{ratelimit.ClassAI: 1}, c.now)

	do(h, http.MethodPost, "/api/ai/query", "user_a")
	if got := do(h, http.MethodPost, "/api/ai/query", "user_a").Code; got != http.StatusTooManyRequests {
		t.Fatalf("within window: got %d, want 429", got)
	}
	c.add(time.Minute)
	if got := do(h, http.MethodPost, "/api/ai/query", "user_a").Code; got != http.StatusOK {
		t.Fatalf("after window: got %d, want 200", got)
	}
}

func TestDisabledClassNeverBlocks(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	h, reached := serve(ratelimit.Limits{ratelimit.ClassAI: 0, ratelimit.ClassRead: -1}, c.now)

	for i := 0; i < 50; i++ {
		do(h, http.MethodPost, "/api/ai/query", "user_a")
		do(h, http.MethodGet, "/api/food/logs", "user_a")
	}
	if *reached != 100 {
		t.Fatalf("handler reached %d times, want 100 — a disabled class blocked", *reached)
	}
}

func TestClassify(t *testing.T) {
	cases := []struct {
		method, path, want string
	}{
		{http.MethodPost, "/api/scan/pipeline", ratelimit.ClassAI},
		{http.MethodPost, "/api/ai/query", ratelimit.ClassAI},
		{http.MethodPost, "/api/scan", ratelimit.ClassAI},
		{http.MethodGet, "/api/ai/insights", ratelimit.ClassAI}, // a GET that costs money
		{http.MethodPost, "/api/food/logs", ratelimit.ClassWrite},
		{http.MethodPatch, "/api/goals", ratelimit.ClassWrite},
		{http.MethodDelete, "/api/food/logs/1", ratelimit.ClassWrite},
		{http.MethodGet, "/api/food/logs", ratelimit.ClassRead},
	}
	for _, c := range cases {
		if got := ratelimit.Classify(c.method, c.path); got != c.want {
			t.Errorf("Classify(%s %s) = %q, want %q", c.method, c.path, got, c.want)
		}
	}
}

// Concurrent callers must not oversell the limit — the counter is the ceiling.
func TestConcurrentCallersAreSafe(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	l := ratelimit.New(ratelimit.Limits{ratelimit.ClassWrite: 100}, c.now)
	done := make(chan bool, 200)
	for i := 0; i < 200; i++ {
		go func() { ok, _ := l.Allow("u:same", ratelimit.ClassWrite); done <- ok }()
	}
	allowed := 0
	for i := 0; i < 200; i++ {
		if <-done {
			allowed++
		}
	}
	if allowed != 100 {
		t.Fatalf("allowed %d of 200, want exactly 100", allowed)
	}
}
