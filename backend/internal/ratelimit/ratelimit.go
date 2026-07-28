// Package ratelimit throttles requests per caller per class. Every AI call
// costs real money, so an unthrottled token is an unbounded bill; writes and
// reads are capped too so one client cannot starve the rest.
//
// Fixed one-minute windows, counted in memory. ponytail: per-process, so N
// instances allow N x the limit — move to a shared store only if we ever run
// more than one.
package ratelimit

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/httpx"
)

// window is the accounting period for every class.
const window = time.Minute

// Request classes.
const (
	ClassAI    = "ai"    // scan + AI endpoints — every call costs money
	ClassWrite = "write" // POST/PATCH/PUT/DELETE
	ClassRead  = "read"  // everything else
)

// Limits is requests-per-window keyed by class. A limit <= 0 DISABLES the
// class: it is never counted and never blocked.
type Limits map[string]int

// LoadLimits reads the env-tunable limits.
func LoadLimits() Limits {
	return Limits{
		ClassAI:    config.EnvInt("LUMO_RATE_AI_PER_MIN", 10),
		ClassWrite: config.EnvInt("LUMO_RATE_WRITE_PER_MIN", 120),
		ClassRead:  config.EnvInt("LUMO_RATE_READ_PER_MIN", 300),
	}
}

// counter is one caller's usage inside one window.
type counter struct {
	start time.Time
	n     int
}

// Limiter counts requests per (caller, class). Safe for concurrent use.
type Limiter struct {
	limits Limits
	now    func() time.Time

	mu        sync.Mutex
	buckets   map[string]*counter
	lastSweep time.Time
}

// New builds a Limiter. now is injectable so tests are deterministic; nil means
// time.Now.
func New(limits Limits, now func() time.Time) *Limiter {
	if now == nil {
		now = time.Now
	}
	return &Limiter{limits: limits, now: now, buckets: make(map[string]*counter)}
}

// Allow records one request from key in class. It reports whether the request
// may proceed and, when it may not, how long until the window resets.
func (l *Limiter) Allow(key, class string) (bool, time.Duration) {
	limit := l.limits[class]
	if limit <= 0 {
		return true, 0 // class disabled
	}
	now := l.now()

	l.mu.Lock()
	defer l.mu.Unlock()
	l.sweep(now)

	k := class + "\x00" + key
	c := l.buckets[k]
	if c == nil || now.Sub(c.start) >= window {
		l.buckets[k] = &counter{start: now, n: 1}
		return true, 0
	}
	if c.n >= limit {
		return false, window - now.Sub(c.start)
	}
	c.n++
	return true, 0
}

// sweep deletes counters whose window has passed, so an idle caller costs no
// memory. Runs at most once per window under the caller's lock — bounded O(n)
// work, no background goroutine to leak.
func (l *Limiter) sweep(now time.Time) {
	if now.Sub(l.lastSweep) < window {
		return
	}
	l.lastSweep = now
	for k, c := range l.buckets {
		if now.Sub(c.start) >= window {
			delete(l.buckets, k)
		}
	}
}

// Middleware rejects requests over the limit with 429 + Retry-After. Mount it
// INSIDE the auth middleware so the caller's identity is already verified.
func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ok, retry := l.Allow(Key(r), Classify(r.Method, r.URL.Path))
		if !ok {
			w.Header().Set("Retry-After", strconv.Itoa(retryAfterSeconds(retry)))
			httpx.Error(w, http.StatusTooManyRequests, "too many requests — try again shortly")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// retryAfterSeconds rounds up to whole seconds, never below 1 — a "retry in 0s"
// invites an immediate retry that is guaranteed to fail again.
func retryAfterSeconds(d time.Duration) int {
	s := int((d + time.Second - 1) / time.Second)
	if s < 1 {
		return 1
	}
	return s
}

// Classify maps a request to its class. AI and scan paths cost money whatever
// the method, so they are classed by path first.
func Classify(method, path string) string {
	switch {
	case strings.HasPrefix(path, "/api/ai/"),
		path == "/api/scan", strings.HasPrefix(path, "/api/scan/"):
		return ClassAI
	case method == http.MethodPost, method == http.MethodPatch,
		method == http.MethodPut, method == http.MethodDelete:
		return ClassWrite
	}
	return ClassRead
}

// Key identifies the caller. Authenticated users get their own bucket; anyone
// else is bucketed by source IP under a separate prefix, so an unauthenticated
// request can never spend — or hide inside — a real user's allowance.
func Key(r *http.Request) string {
	if id := auth.UserID(r.Context()); id != "" {
		return "u:" + id
	}
	// ponytail: RemoteAddr only. X-Forwarded-For is client-settable, so
	// trusting it would let an attacker mint a fresh bucket per request.
	// Behind a proxy every anonymous caller shares one bucket — fails closed.
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	return "ip:" + host
}
