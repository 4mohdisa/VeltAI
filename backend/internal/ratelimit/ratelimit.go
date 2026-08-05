// Package ratelimit throttles requests per caller per class. Every AI call
// costs real money, so an unthrottled token is an unbounded bill; writes and
// reads are capped too so one client cannot starve the rest.
//
// Fixed one-minute windows. Counting is per-process by default; give the
// limiter a Store (see pg.go) and the counters live in Postgres instead, so N
// instances share one budget rather than allowing N x the limit.
package ratelimit

import (
	"context"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/httpx"
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
		ClassAI:    config.EnvInt("LUME_RATE_AI_PER_MIN", 10),
		ClassWrite: config.EnvInt("LUME_RATE_WRITE_PER_MIN", 120),
		ClassRead:  config.EnvInt("LUME_RATE_READ_PER_MIN", 300),
	}
}

// Store is a counter shared by every instance. Increment must add one to the
// counter for (key, windowStart) and return the NEW total in a single atomic
// statement — a read-then-write loses races and stops limiting under load.
type Store interface {
	Increment(ctx context.Context, key string, windowStart time.Time) (int, error)
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
	store  Store // nil => count in memory, per process

	mu        sync.Mutex
	buckets   map[string]*counter
	lastSweep time.Time
}

// New builds a per-process Limiter. now is injectable so tests are
// deterministic; nil means time.Now.
func New(limits Limits, now func() time.Time) *Limiter {
	if now == nil {
		now = time.Now
	}
	return &Limiter{limits: limits, now: now, buckets: make(map[string]*counter)}
}

// NewShared builds a Limiter whose counters live in store, so every instance
// draws on the same budget. A store error DENIES (see Middleware): if we cannot
// count, we cannot claim the caller is under the limit.
func NewShared(limits Limits, now func() time.Time, store Store) *Limiter {
	l := New(limits, now)
	l.store = store
	return l
}

// Allow records one request from key in class. It reports whether the request
// may proceed and, when it may not, how long until the window resets. A shared
// store that errors reports "not allowed" — callers wanting to distinguish
// "over limit" (429) from "cannot tell" (503) use AllowCtx.
func (l *Limiter) Allow(key, class string) (bool, time.Duration) {
	ok, retry, _ := l.AllowCtx(context.Background(), key, class)
	return ok, retry
}

// AllowCtx is Allow with a context and the store's error. A non-nil error means
// the decision could not be made: FAIL CLOSED — deny, but as 503, not 429.
func (l *Limiter) AllowCtx(ctx context.Context, key, class string) (bool, time.Duration, error) {
	limit := l.limits[class]
	if limit <= 0 {
		return true, 0, nil // class disabled
	}
	now := l.now()
	// "|" not "\x00": this key is a Postgres text value, and text cannot hold a
	// NUL byte. Both halves are prefixed ("ai", "u:"/"ip:"), so "|" is unambiguous.
	k := class + "|" + key

	if l.store == nil {
		ok, retry := l.allowLocal(now, k, limit)
		return ok, retry, nil
	}
	// Windows are aligned to the wall clock so every instance agrees on which
	// window a request belongs to without coordinating.
	start := now.Truncate(window)
	retry := start.Add(window).Sub(now)
	n, err := l.store.Increment(ctx, k, start)
	if err != nil {
		return false, retry, err
	}
	if n > limit {
		return false, retry, nil
	}
	return true, 0, nil
}

func (l *Limiter) allowLocal(now time.Time, k string, limit int) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.sweep(now)

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
//
// A shared-store failure is 503, not 429: the caller exceeded nothing, we simply
// could not tell, and telling them "too many requests" would be a lie that also
// hides an outage. Either way the request does not reach the handler.
func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ok, retry, err := l.AllowCtx(r.Context(), Key(r), Classify(r.Method, r.URL.Path))
		if err != nil {
			log.Printf("ratelimit: store unavailable, denying request: %v", err)
			w.Header().Set("Retry-After", strconv.Itoa(retryAfterSeconds(retry)))
			httpx.Error(w, http.StatusServiceUnavailable, "rate limiter unavailable — try again shortly")
			return
		}
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
