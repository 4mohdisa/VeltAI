package ratelimit

import (
	"context"
	"log"
	"sync"
	"time"

	"lume/backend/internal/db"
)

// IncrementSQL is the whole limiter. One statement: insert the window's first
// hit or add one to the existing count, and return the resulting total. No
// SELECT-then-UPDATE, so concurrent callers on one key are serialized by the
// row lock and every one of them sees a distinct count.
const IncrementSQL = `INSERT INTO rate_limit_counters (key, window_start, count)
	VALUES ($1, $2, 1)
	ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limit_counters.count + 1
	RETURNING count`

// sweepEvery bounds how often one process runs the retention DELETE.
const sweepEvery = 5 * time.Minute

// PGStore keeps the counters in Postgres so every instance shares one budget.
type PGStore struct {
	q db.Querier

	mu        sync.Mutex
	lastSweep time.Time
}

var _ Store = (*PGStore)(nil)

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

func (s *PGStore) Increment(ctx context.Context, key string, windowStart time.Time) (int, error) {
	var n int
	if err := s.q.QueryRow(ctx, IncrementSQL, key, windowStart).Scan(&n); err != nil {
		return 0, err
	}
	s.sweep(ctx, windowStart)
	return n, nil
}

// sweep drops windows that can no longer be counted against. ponytail: runs
// inline on whichever request crosses the interval — one indexed DELETE every
// five minutes per process, no background goroutine and no cron to forget.
// A failure is logged and ignored: stale rows waste space, they never
// mis-count, so this must not turn into a denied request.
func (s *PGStore) sweep(ctx context.Context, now time.Time) {
	s.mu.Lock()
	if now.Sub(s.lastSweep) < sweepEvery {
		s.mu.Unlock()
		return
	}
	s.lastSweep = now
	s.mu.Unlock()

	if _, err := s.q.Exec(ctx,
		`DELETE FROM rate_limit_counters WHERE window_start < $1`, now.Add(-2*window)); err != nil {
		log.Printf("ratelimit: counter sweep failed: %v", err)
	}
}
