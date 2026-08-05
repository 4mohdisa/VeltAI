// OAuth CSRF states, now shared instead of per-process. Hermetic: fakeStore
// (integrations_test.go) models DELETE ... RETURNING as one indivisible step,
// and the SQL the PG store emits is pinned by string assertions — a
// SELECT-then-DELETE would pass every sequential test and let two concurrent
// callbacks redeem one token.
package integrationstests

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"lume/backend/internal/integrations"
)

func stateService(store *fakeStore) *integrations.Service {
	cipher, _ := integrations.NewCipher(testKey())
	return integrations.NewService(store, cipher, strava(true))
}

// Two concurrent callbacks carrying the SAME state: exactly one may succeed.
// A state token is a single-use credential — redeeming it twice is the CSRF hole
// the token exists to close.
func TestConcurrentCallbacksConsumeStateOnce(t *testing.T) {
	store := newStore()
	// Two muxes over one store = two instances behind the load balancer.
	issuer, other := serve(stateService(store)), serve(stateService(store))
	state := stateFromConnect(t, issuer, "u1", "strava")

	const callbacks = 8
	muxes := []*http.ServeMux{issuer, other}
	results := make(chan string, callbacks)
	var wg sync.WaitGroup
	for i := 0; i < callbacks; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			w := do(t, muxes[i%2], "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state)
			results <- w.Header().Get("Location")
		}(i)
	}
	wg.Wait()
	close(results)

	ok := 0
	for loc := range results {
		switch loc {
		case integrations.AppScheme + "://integrations/strava/success":
			ok++
		case integrations.AppScheme + "://integrations/strava/error":
		default:
			t.Fatalf("unexpected redirect %q", loc)
		}
	}
	if ok != 1 {
		t.Fatalf("%d of %d concurrent callbacks succeeded, want exactly 1", ok, callbacks)
	}
}

// The state survives the instance that issued it: connect on one, call back on
// the other. In memory this was an error redirect and a dead-end for the user.
func TestStateIssuedOnOneInstanceIsUsableOnAnother(t *testing.T) {
	store := newStore()
	a, b := serve(stateService(store)), serve(stateService(store))
	state := stateFromConnect(t, a, "u1", "strava")

	w := do(t, b, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state)
	if loc := w.Header().Get("Location"); loc != integrations.AppScheme+"://integrations/strava/success" {
		t.Fatalf("callback on a second instance = %q, want success", loc)
	}
	if _, ok := store.conns[ckey("u1", "strava")]; !ok {
		t.Fatal("connection was not stored for the user who started the flow")
	}
}

// One-time use, sequentially: the second redemption of a spent token fails.
func TestStateIsSingleUse(t *testing.T) {
	store := newStore()
	mux := serve(stateService(store))
	state := stateFromConnect(t, mux, "u1", "strava")

	if w := do(t, mux, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state); w.Header().Get("Location") != integrations.AppScheme+"://integrations/strava/success" {
		t.Fatalf("first callback failed: %q", w.Header().Get("Location"))
	}
	if w := do(t, mux, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state); w.Header().Get("Location") != integrations.AppScheme+"://integrations/strava/error" {
		t.Fatal("a spent state token was accepted a second time")
	}
}

// Expired states are never consumable.
func TestExpiredStateIsRejected(t *testing.T) {
	store := newStore()
	mux := serve(stateService(store))
	state := stateFromConnect(t, mux, "u1", "strava")

	// Age the stored row past its TTL.
	store.mu.Lock()
	st := store.states[state]
	st.expiresAt = time.Now().Add(-time.Second)
	store.states[state] = st
	store.mu.Unlock()

	if w := do(t, mux, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state); w.Header().Get("Location") != integrations.AppScheme+"://integrations/strava/error" {
		t.Fatal("an expired state token was accepted")
	}
}

// A store error DENIES on both halves of the flow: connect cannot hand out a
// state it failed to persist, and a callback whose state cannot be checked is
// not a callback we can trust.
func TestStateStoreErrorDenies(t *testing.T) {
	store := newStore()
	mux := serve(stateService(store))
	state := stateFromConnect(t, mux, "u1", "strava")

	store.stateErr = errors.New("db down")
	if w := do(t, mux, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state); w.Header().Get("Location") != integrations.AppScheme+"://integrations/strava/error" {
		t.Fatal("a callback was accepted while the state store was unavailable")
	}
	if w := do(t, mux, "u1", "GET", "/api/integrations/strava/connect"); w.Code != http.StatusInternalServerError {
		t.Fatalf("connect with an unwritable state store = %d, want 500", w.Code)
	}
	if len(store.conns) != 0 {
		t.Fatal("a connection was stored despite an unverifiable state")
	}
}

// ---------------------------------------------------------------------------
// SQL shape
// ---------------------------------------------------------------------------

func TestConsumeStateSQLIsAtomicAndOneTime(t *testing.T) {
	sql := integrations.ConsumeStateSQL
	for _, want := range []string{"DELETE FROM oauth_states", "WHERE state = $1", "RETURNING"} {
		if !strings.Contains(sql, want) {
			t.Errorf("ConsumeStateSQL missing %q:\n%s", want, sql)
		}
	}
	if strings.Contains(strings.ToUpper(sql), "SELECT") {
		t.Errorf("ConsumeStateSQL reads before it deletes — two callbacks both pass that:\n%s", sql)
	}
}

// Issuing must sweep expired rows, or abandoned OAuth flows accumulate forever.
func TestIssueStateSweepsExpiredRows(t *testing.T) {
	q := &recordingQuerier{}
	err := integrations.NewPGStore(q).IssueState(
		context.Background(), "tok", "u1", "strava", time.Now().Add(10*time.Minute))
	if err != nil {
		t.Fatalf("IssueState: %v", err)
	}
	if len(q.execs) != 2 {
		t.Fatalf("statements = %d, want 2 (sweep + insert): %v", len(q.execs), q.execs)
	}
	if !strings.Contains(q.execs[0], "DELETE FROM oauth_states") || !strings.Contains(q.execs[0], "expires_at <") {
		t.Errorf("first statement is not the retention sweep: %s", q.execs[0])
	}
	if !strings.Contains(q.execs[1], "INSERT INTO oauth_states") {
		t.Errorf("second statement is not the insert: %s", q.execs[1])
	}
}
