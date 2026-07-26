// In-package test: the jwksCache fetch hook is unexported, so the
// rate-limit / refetch-on-unknown-kid logic can only be reached from here.
package auth

import (
	"crypto/rsa"
	"errors"
	"testing"
	"time"
)

func TestJWKSCache(t *testing.T) {
	k1, k2 := &rsa.PublicKey{}, &rsa.PublicKey{}
	var (
		fetches  int
		nextKeys map[string]*rsa.PublicKey
		nextErr  error
	)
	c := &jwksCache{fetch: func() (map[string]*rsa.PublicKey, error) {
		fetches++
		return nextKeys, nextErr
	}}

	// Empty cache: first lookup fetches.
	nextKeys = map[string]*rsa.PublicKey{"a": k1}
	if got, err := c.key("a"); err != nil || got != k1 {
		t.Fatalf("cold lookup = %v, %v; want k1, nil", got, err)
	}
	if fetches != 1 {
		t.Fatalf("fetches = %d, want 1", fetches)
	}

	// Known kid within TTL: served from cache, no fetch.
	if got, err := c.key("a"); err != nil || got != k1 {
		t.Fatalf("cached lookup = %v, %v; want k1, nil", got, err)
	}
	if fetches != 1 {
		t.Fatalf("fetches = %d, want 1 (cache hit must not fetch)", fetches)
	}

	// Unknown kid within 30s of the last attempt: rate-limited, no fetch.
	if _, err := c.key("b"); err == nil {
		t.Fatal("rate-limited unknown kid should error")
	}
	if fetches != 1 {
		t.Fatalf("fetches = %d, want 1 (rate limit must block refetch)", fetches)
	}

	// Unknown kid after the rate-limit window: refetch picks up the rotated key.
	c.lastAttempt = time.Now().Add(-31 * time.Second)
	nextKeys = map[string]*rsa.PublicKey{"a": k1, "b": k2}
	if got, err := c.key("b"); err != nil || got != k2 {
		t.Fatalf("rotated lookup = %v, %v; want k2, nil", got, err)
	}
	if fetches != 2 {
		t.Fatalf("fetches = %d, want 2 (unknown kid must trigger refetch)", fetches)
	}

	// Stale cache + failing fetch: attempt happens, stale key still served.
	c.fetchedAt = time.Now().Add(-2 * time.Hour)
	c.lastAttempt = time.Now().Add(-31 * time.Second)
	nextErr = errors.New("clerk down")
	if got, err := c.key("b"); err != nil || got != k2 {
		t.Fatalf("stale-on-failure lookup = %v, %v; want k2, nil", got, err)
	}
	if fetches != 3 {
		t.Fatalf("fetches = %d, want 3", fetches)
	}

	// Failed attempt still bumped lastAttempt: immediate retry is
	// rate-limited (no fetch) and serves the stale key.
	if got, err := c.key("b"); err != nil || got != k2 {
		t.Fatalf("rate-limited stale lookup = %v, %v; want k2, nil", got, err)
	}
	if fetches != 3 {
		t.Fatalf("fetches = %d, want 3 (failure must still rate-limit)", fetches)
	}

	// Fetch in flight elsewhere: waiter serves stale instead of piling on.
	c.inFlight = true
	c.lastAttempt = time.Now().Add(-31 * time.Second)
	if got, err := c.key("b"); err != nil || got != k2 {
		t.Fatalf("in-flight stale lookup = %v, %v; want k2, nil", got, err)
	}
	if fetches != 3 {
		t.Fatalf("fetches = %d, want 3 (in-flight must not double-fetch)", fetches)
	}

	// Cold cache + failing fetch: error propagates.
	c2 := &jwksCache{fetch: func() (map[string]*rsa.PublicKey, error) {
		return nil, errors.New("clerk down")
	}}
	if _, err := c2.key("a"); err == nil || err.Error() != "clerk down" {
		t.Fatalf("cold failure err = %v, want clerk down", err)
	}
}
