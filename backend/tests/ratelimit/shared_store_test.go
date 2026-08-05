// The shared (Postgres-backed) limiter. Hermetic: a fake Querier simulates the
// ATOMIC semantics of INSERT ... ON CONFLICT DO UPDATE ... RETURNING, and the
// SQL the store actually emits is pinned by string assertions — a rewrite into a
// read-modify-write would keep these logic tests green, so the query text is
// part of the contract.
package ratelimittests

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"lume/backend/internal/ratelimit"
)

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

// atomicStore is a correct Store: one lock per operation, so an Increment is
// indivisible exactly as the SQL statement is.
type atomicStore struct {
	mu     sync.Mutex
	counts map[string]int
	err    error
}

func newAtomicStore() *atomicStore { return &atomicStore{counts: map[string]int{}} }

func (s *atomicStore) Increment(_ context.Context, key string, window time.Time) (int, error) {
	if s.err != nil {
		return 0, s.err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	k := key + "|" + window.UTC().Format(time.RFC3339)
	s.counts[k]++
	return s.counts[k], nil
}

// fakeRow / fakeQuerier capture the SQL the PGStore emits.
type fakeRow struct {
	n   int
	err error
}

func (r fakeRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	if p, ok := dest[0].(*int); ok {
		*p = r.n
	}
	return nil
}

type fakeQuerier struct {
	mu       sync.Mutex
	queries  []string
	execs    []string
	next     int
	queryErr error
}

func (q *fakeQuerier) QueryRow(_ context.Context, sql string, _ ...any) pgx.Row {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.queries = append(q.queries, sql)
	q.next++
	return fakeRow{n: q.next, err: q.queryErr}
}
func (q *fakeQuerier) Exec(_ context.Context, sql string, _ ...any) (pgconn.CommandTag, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.execs = append(q.execs, sql)
	return pgconn.CommandTag{}, nil
}
func (q *fakeQuerier) Query(context.Context, string, ...any) (pgx.Rows, error) {
	panic("unused")
}
func (q *fakeQuerier) Begin(context.Context) (pgx.Tx, error) { panic("unused") }

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

// N concurrent Allow() calls against ONE key allow exactly the limit — the whole
// point of moving the counters out of process memory.
func TestSharedLimiterConcurrentCallersAllowExactlyTheLimit(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	l := ratelimit.NewShared(ratelimit.Limits{ratelimit.ClassAI: 10}, c.now, newAtomicStore())

	const callers = 300
	done := make(chan bool, callers)
	for i := 0; i < callers; i++ {
		go func() {
			ok, _ := l.Allow("u:same", ratelimit.ClassAI)
			done <- ok
		}()
	}
	allowed := 0
	for i := 0; i < callers; i++ {
		if <-done {
			allowed++
		}
	}
	if allowed != 10 {
		t.Fatalf("allowed %d of %d, want exactly 10", allowed, callers)
	}
}

// Two limiters sharing one store are two instances of the server: together they
// still get one budget, not one each.
func TestTwoInstancesShareOneBudget(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	store := newAtomicStore()
	a := ratelimit.NewShared(ratelimit.Limits{ratelimit.ClassAI: 3}, c.now, store)
	b := ratelimit.NewShared(ratelimit.Limits{ratelimit.ClassAI: 3}, c.now, store)

	allowed := 0
	for i := 0; i < 4; i++ {
		for _, l := range []*ratelimit.Limiter{a, b} {
			if ok, _ := l.Allow("u:same", ratelimit.ClassAI); ok {
				allowed++
			}
		}
	}
	if allowed != 3 {
		t.Fatalf("two instances allowed %d, want 3 — the budget is per-cluster, not per-process", allowed)
	}
}

// A new window resets the budget (fixed windows, aligned to the wall clock so
// every instance agrees on which window a request belongs to).
func TestSharedLimiterWindowRollover(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	l := ratelimit.NewShared(ratelimit.Limits{ratelimit.ClassAI: 1}, c.now, newAtomicStore())

	if ok, _ := l.Allow("u:1", ratelimit.ClassAI); !ok {
		t.Fatal("first call denied")
	}
	if ok, _ := l.Allow("u:1", ratelimit.ClassAI); ok {
		t.Fatal("second call in the same window allowed")
	}
	c.add(time.Minute)
	if ok, _ := l.Allow("u:1", ratelimit.ClassAI); !ok {
		t.Fatal("call in the next window denied — windows never reset")
	}
}

// ---------------------------------------------------------------------------
// Fail closed
// ---------------------------------------------------------------------------

// A store error DENIES, and denies as 503 + Retry-After: the caller exceeded
// nothing, we simply could not tell, and the request must not reach the handler.
func TestStoreErrorDeniesWith503(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	store := newAtomicStore()
	store.err = errors.New("connection refused")
	l := ratelimit.NewShared(ratelimit.Limits{ratelimit.ClassAI: 100}, c.now, store)

	if ok, _ := l.Allow("u:1", ratelimit.ClassAI); ok {
		t.Fatal("a store error ALLOWED the request — the limiter fails open")
	}
	ok, _, err := l.AllowCtx(context.Background(), "u:1", ratelimit.ClassAI)
	if ok || err == nil {
		t.Fatalf("AllowCtx = %v, %v — want denied with the store error", ok, err)
	}

	reached := 0
	h := l.Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { reached++ }))
	w := do(h, http.MethodPost, "/api/ai/query", "user_a")
	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("got %d, want 503 (not 429 — the caller exceeded nothing)", w.Code)
	}
	if reached != 0 {
		t.Fatal("request reached the handler despite an unusable limiter")
	}
	if secs, err := strconv.Atoi(w.Header().Get("Retry-After")); err != nil || secs < 1 {
		t.Fatalf("Retry-After = %q, want a positive integer", w.Header().Get("Retry-After"))
	}
}

// A disabled class is never counted, so it never touches the store and cannot be
// taken down by it.
func TestDisabledClassNeedsNoStore(t *testing.T) {
	c := &clock{t: time.Unix(1_700_000_000, 0)}
	store := newAtomicStore()
	store.err = errors.New("down")
	l := ratelimit.NewShared(ratelimit.Limits{ratelimit.ClassAI: 0}, c.now, store)
	if ok, _ := l.Allow("u:1", ratelimit.ClassAI); !ok {
		t.Fatal("disabled class denied")
	}
}

// ---------------------------------------------------------------------------
// SQL shape
// ---------------------------------------------------------------------------

// The increment must be ONE atomic statement. A SELECT-then-UPDATE passes every
// single-threaded test and silently stops limiting under concurrency, so the
// query text itself is pinned.
func TestIncrementSQLIsAtomic(t *testing.T) {
	sql := ratelimit.IncrementSQL
	for _, want := range []string{
		"INSERT INTO rate_limit_counters",
		"ON CONFLICT (key, window_start) DO UPDATE",
		"count = rate_limit_counters.count + 1",
		"RETURNING count",
	} {
		if !strings.Contains(sql, want) {
			t.Errorf("IncrementSQL missing %q:\n%s", want, sql)
		}
	}
	if strings.Contains(strings.ToUpper(sql), "SELECT") {
		t.Errorf("IncrementSQL reads before it writes — that is a lost-update race:\n%s", sql)
	}
}

func TestPGStoreEmitsTheAtomicIncrement(t *testing.T) {
	q := &fakeQuerier{}
	s := ratelimit.NewPGStore(q)
	n, err := s.Increment(context.Background(), "ai\x00u:1", time.Unix(1_700_000_000, 0).Truncate(time.Minute))
	if err != nil || n != 1 {
		t.Fatalf("Increment = %d, %v", n, err)
	}
	if len(q.queries) != 1 || q.queries[0] != ratelimit.IncrementSQL {
		t.Fatalf("store did not emit IncrementSQL, got %v", q.queries)
	}
}

// Old windows are reclaimed: the counters table must not grow forever.
func TestPGStoreSweepsExpiredWindows(t *testing.T) {
	q := &fakeQuerier{}
	s := ratelimit.NewPGStore(q)
	ctx := context.Background()
	start := time.Unix(1_700_000_000, 0).Truncate(time.Minute)

	// First increment sweeps; the immediate next one must not (throttled).
	if _, err := s.Increment(ctx, "k", start); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Increment(ctx, "k", start); err != nil {
		t.Fatal(err)
	}
	if len(q.execs) != 1 {
		t.Fatalf("sweeps = %d, want exactly 1 (throttled)", len(q.execs))
	}
	if !strings.Contains(q.execs[0], "DELETE FROM rate_limit_counters") ||
		!strings.Contains(q.execs[0], "window_start <") {
		t.Fatalf("retention DELETE has the wrong shape: %s", q.execs[0])
	}

	// Well past the sweep interval it runs again.
	if _, err := s.Increment(ctx, "k", start.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	if len(q.execs) != 2 {
		t.Fatalf("sweeps = %d after the interval elapsed, want 2", len(q.execs))
	}
}

// A failing sweep is not a failing request: stale rows waste space, they never
// mis-count, so retention must never deny a caller.
func TestIncrementErrorPropagates(t *testing.T) {
	q := &fakeQuerier{queryErr: errors.New("boom")}
	if _, err := ratelimit.NewPGStore(q).Increment(context.Background(), "k", time.Now()); err == nil {
		t.Fatal("a failed increment must surface as an error so the limiter denies")
	}
}
