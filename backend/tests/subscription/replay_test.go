// The durable webhook replay guard. Hermetic: fakeStore (subscription_test.go)
// simulates the atomic semantics — ClaimEvent wins exactly once, UpsertIfNewer
// compares-and-writes under one lock — and the SQL the PG store emits is pinned
// by string assertions, because a rewrite into exists-then-insert would keep
// every single-threaded test green and lose every race.
package subscriptiontests

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"lume/backend/internal/subscription"
)

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

// The same delivery arriving on N instances at once: exactly ONE is applied.
// This is the case the old in-memory guard got wrong — each process had its own
// "seen" set, so each one happily processed the event.
func TestConcurrentDeliveriesOfOneEventApplyOnce(t *testing.T) {
	store := newFakeStore()
	// Two muxes = two server instances sharing one store.
	instances := []*http.ServeMux{newMux(store), newMux(store)}

	now := time.Now().UnixMilli()
	body := eventBodyAt("INITIAL_PURCHASE", "user_1", "evt_race",
		time.Now().Add(24*time.Hour).UnixMilli(), now)

	const deliveries = 16
	results := make(chan string, deliveries)
	var wg sync.WaitGroup
	for i := 0; i < deliveries; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			rec := postWebhook(instances[i%len(instances)], webhookAuth, body)
			if rec.Code != http.StatusOK {
				results <- "status " + strconv.Itoa(rec.Code)
				return
			}
			results <- rec.Body.String()
		}(i)
	}
	wg.Wait()
	close(results)

	applied := 0
	for r := range results {
		switch {
		case strings.Contains(r, `"result":"ok"`):
			applied++
		case strings.Contains(r, "ignored"):
		default:
			t.Fatalf("unexpected webhook response: %s", r)
		}
	}
	if applied != 1 {
		t.Fatalf("%d of %d concurrent deliveries were applied, want exactly 1", applied, deliveries)
	}
}

// Two DIFFERENT events for one user racing: both are claimed (different ids),
// but the ordering guard still leaves the newer one in place — the compare and
// the write are one statement, so the older cannot land last.
func TestConcurrentEventsForOneUserLeaveTheNewerWinner(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	now := time.Now().UnixMilli()
	future := time.Now().Add(24 * time.Hour).UnixMilli()

	newer := eventBodyAt("RENEWAL", "user_1", "evt_new", future, now)
	older := eventBodyAt("EXPIRATION", "user_1", "evt_old", now, now-60_000)

	var wg sync.WaitGroup
	for _, body := range []string{newer, older} {
		wg.Add(1)
		go func(b string) { defer wg.Done(); postWebhook(mux, webhookAuth, b) }(body)
	}
	wg.Wait()

	got, ok := store.sub("user_1")
	if !ok {
		t.Fatal("no subscription stored")
	}
	if got.Status != "active" {
		t.Fatalf("status = %q, want active — the older event won the race", got.Status)
	}
}

// ---------------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------------

// A replayed event id is rejected once the first delivery is recorded — and the
// record is in the store, so it survives a restart and holds across instances.
func TestReplayRejectedAcrossInstancesAndRestarts(t *testing.T) {
	store := newFakeStore()
	first := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	body := eventBodyAt("INITIAL_PURCHASE", "user_1", "evt_1", future, time.Now().UnixMilli())

	if rec := postWebhook(first, webhookAuth, body); !strings.Contains(rec.Body.String(), `"ok"`) {
		t.Fatalf("first delivery not applied: %s", rec.Body)
	}
	// A different mux over the same store is both "another instance" and "after a
	// restart" — nothing about the guard lives in the handler.
	rec := postWebhook(newMux(store), webhookAuth, body)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ignored") {
		t.Fatalf("replay on a second instance: got %d %s, want 200 ignored", rec.Code, rec.Body)
	}
}

// A write that FAILS must release the claim: the provider's retry of an event we
// never applied is a real delivery, not a replay. Otherwise one transient DB
// blip silently drops a purchase.
func TestFailedWriteReleasesTheClaimSoRetryWorks(t *testing.T) {
	store := newFakeStore()
	mux := newMux(store)
	future := time.Now().Add(24 * time.Hour).UnixMilli()
	body := eventBodyAt("INITIAL_PURCHASE", "user_1", "evt_1", future, time.Now().UnixMilli())

	store.err = errors.New("connection reset")
	if rec := postWebhook(mux, webhookAuth, body); rec.Code != http.StatusInternalServerError {
		t.Fatalf("failed write: got %d, want 500 so RevenueCat retries", rec.Code)
	}
	store.err = nil

	if rec := postWebhook(mux, webhookAuth, body); !strings.Contains(rec.Body.String(), `"ok"`) {
		t.Fatalf("retry after a failed write was swallowed as a replay: %s", rec.Body)
	}
	if _, ok := store.sub("user_1"); !ok {
		t.Fatal("the retried purchase was never applied")
	}
}

// ---------------------------------------------------------------------------
// Fail closed
// ---------------------------------------------------------------------------

// A guard we cannot consult DENIES: 500, no write, no "ignored" (which would
// tell RevenueCat we handled it and stop the retries).
func TestStoreErrorDeniesAndDoesNotWrite(t *testing.T) {
	store := newFakeStore()
	store.err = errors.New("db down")
	mux := newMux(store)

	rec := postWebhook(mux, webhookAuth, eventBodyAt("INITIAL_PURCHASE", "user_1", "evt_1",
		time.Now().Add(24*time.Hour).UnixMilli(), time.Now().UnixMilli()))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("got %d, want 500 — an unusable guard must not let the event through", rec.Code)
	}
	if strings.Contains(rec.Body.String(), "ignored") {
		t.Fatal("a DB error was reported as handled — RevenueCat would stop retrying")
	}
	if store.count() != 0 {
		t.Fatal("an event was applied while the guard was unavailable")
	}
}

// ---------------------------------------------------------------------------
// SQL shape
// ---------------------------------------------------------------------------

func TestClaimEventSQLIsAtomic(t *testing.T) {
	sql := subscription.ClaimEventSQL
	for _, want := range []string{
		"INSERT INTO webhook_processed_events",
		"ON CONFLICT (provider, event_id) DO NOTHING",
	} {
		if !strings.Contains(sql, want) {
			t.Errorf("ClaimEventSQL missing %q:\n%s", want, sql)
		}
	}
	if strings.Contains(strings.ToUpper(sql), "SELECT") {
		t.Errorf("ClaimEventSQL checks before it inserts — two deliveries both pass that:\n%s", sql)
	}
}

// The monotonicity guard must compare AND write in one statement. A SELECT of
// last_event_ts_ms followed by an UPDATE lets two concurrent deliveries both
// read the old value and both win.
func TestUpsertIfNewerComparesAndWritesInOneStatement(t *testing.T) {
	sql := subscription.UpsertIfNewerSQL
	for _, want := range []string{
		"INSERT INTO subscriptions",
		"ON CONFLICT (user_id) DO UPDATE",
		"last_event_ts_ms = EXCLUDED.last_event_ts_ms",
		"WHERE subscriptions.last_event_ts_ms IS NULL",
		"subscriptions.last_event_ts_ms <= EXCLUDED.last_event_ts_ms",
	} {
		if !strings.Contains(sql, want) {
			t.Errorf("UpsertIfNewerSQL missing %q:\n%s", want, sql)
		}
	}
	// The guard must sit on the UPDATE, after the conflict target.
	if strings.Index(sql, "ON CONFLICT") > strings.Index(sql, "WHERE subscriptions.last_event_ts_ms") {
		t.Errorf("the ordering guard is not the ON CONFLICT DO UPDATE's WHERE:\n%s", sql)
	}
}
