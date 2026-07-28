package ratelimit

import (
	"testing"
	"time"
)

// A limiter that never forgets is a memory leak with a long fuse: one entry per
// user per class, forever. Idle entries must be reclaimed.
func TestSweepReclaimsIdleBuckets(t *testing.T) {
	now := time.Unix(1_700_000_000, 0)
	l := New(Limits{ClassRead: 10}, func() time.Time { return now })

	for i := 0; i < 1000; i++ {
		l.Allow(string(rune(i)), ClassRead)
	}
	if got := len(l.buckets); got != 1000 {
		t.Fatalf("buckets = %d, want 1000", got)
	}

	// One window later those callers are all idle; the next request sweeps them.
	now = now.Add(2 * time.Minute)
	l.Allow("still-here", ClassRead)
	if got := len(l.buckets); got != 1 {
		t.Fatalf("buckets = %d after sweep, want 1 — idle entries leaked", got)
	}
}
