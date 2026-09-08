// GET /api/food/days — the dates this user has food logged on.
//
// It exists to kill an unbounded client fetch: the week strip and the month
// calendar used to pull the user's ENTIRE food-log history and group the rows
// in JavaScript just to decide which days get a dot. This returns the dates and
// nothing else.
//
// The rules it has to keep, in order of how badly they break things:
//  1. It is scoped to the caller. A dot is a claim about the user's own log,
//     and one user's dates must never appear in another user's calendar.
//  2. No rows means [], not null — the client builds a Set from it directly.
//  3. Dates are distinct and sorted, so N logs on one day is still one dot.
//  4. from/to bound the window inclusively, and a malformed or backwards range
//     is refused rather than quietly answered with the wrong set.
package foodtests

import (
	"net/http"
	"strings"
	"testing"
)

// TestLoggedDaysOwnership is the one that gates everything else: the endpoint
// was wired to the app only after this passed.
func TestLoggedDaysOwnership(t *testing.T) {
	f := &fakeStore{}
	seedLog(t, f, "user_a", "2026-09-01", "breakfast", "Oats", 350, 12)
	seedLog(t, f, "user_a", "2026-09-03", "lunch", "Rice", 500, 15)
	seedLog(t, f, "user_b", "2026-09-02", "dinner", "Steak", 700, 50)

	rr := do(t, newMux(f, nil), "GET", "/api/food/days", "user_a", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	got := data[[]string](t, rr)
	want := []string{"2026-09-01", "2026-09-03"}
	if len(got) != len(want) {
		t.Fatalf("days = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("days = %v, want %v", got, want)
		}
	}
	// The explicit half of the claim: user_b's day is not in user_a's answer.
	for _, d := range got {
		if d == "2026-09-02" {
			t.Fatalf("user_a can see user_b's logged day %q", d)
		}
	}
}

// The mirror of the above from the other side — user_b sees only their own day,
// so the scoping is a real filter and not an accident of ordering.
func TestLoggedDaysIsPerUser(t *testing.T) {
	f := &fakeStore{}
	seedLog(t, f, "user_a", "2026-09-01", "breakfast", "Oats", 350, 12)
	seedLog(t, f, "user_b", "2026-09-02", "dinner", "Steak", 700, 50)

	got := data[[]string](t, do(t, newMux(f, nil), "GET", "/api/food/days", "user_b", nil))
	if len(got) != 1 || got[0] != "2026-09-02" {
		t.Fatalf("user_b days = %v, want [2026-09-02]", got)
	}
}

// A user id is never taken from the query string — only from the auth context.
func TestLoggedDaysIgnoresUserIDInQuery(t *testing.T) {
	f := &fakeStore{}
	seedLog(t, f, "user_a", "2026-09-01", "breakfast", "Oats", 350, 12)

	got := data[[]string](t, do(t, newMux(f, nil), "GET",
		"/api/food/days?user_id=user_a", "user_b", nil))
	if len(got) != 0 {
		t.Fatalf("days = %v, want none — user_id in the query must not be honoured", got)
	}
}

func TestLoggedDaysEmptyIsEmptyArrayNotNull(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "GET", "/api/food/days", "user_new", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	// The client does `new Set(days)`. A JSON null there is a crash, not a
	// missing dot, so the envelope must carry [].
	if body := rr.Body.String(); !strings.Contains(body, `"data":[]`) {
		t.Fatalf("body = %s, want data to be []", body)
	}
	if got := data[[]string](t, rr); len(got) != 0 {
		t.Fatalf("days = %v, want empty", got)
	}
}

// Four rows across two days is two dots, not four.
func TestLoggedDaysAreDistinctAndSorted(t *testing.T) {
	f := &fakeStore{}
	seedLog(t, f, "u1", "2026-09-05", "dinner", "Curry", 600, 20)
	seedLog(t, f, "u1", "2026-09-01", "breakfast", "Oats", 350, 12)
	seedLog(t, f, "u1", "2026-09-05", "lunch", "Wrap", 450, 25)
	seedLog(t, f, "u1", "2026-09-01", "snack", "Apple", 90, 0)

	got := data[[]string](t, do(t, newMux(f, nil), "GET", "/api/food/days", "u1", nil))
	want := []string{"2026-09-01", "2026-09-05"}
	if len(got) != len(want) {
		t.Fatalf("days = %v, want %v (deduped)", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("days = %v, want %v (oldest first)", got, want)
		}
	}
}

func TestLoggedDaysRangeIsInclusive(t *testing.T) {
	f := &fakeStore{}
	for _, d := range []string{"2026-08-30", "2026-09-01", "2026-09-05", "2026-09-10"} {
		seedLog(t, f, "u1", d, "lunch", "Rice", 500, 15)
	}
	mux := newMux(f, nil)

	// Both bounds land exactly on a logged day: both are included.
	got := data[[]string](t, do(t, mux, "GET", "/api/food/days?from=2026-09-01&to=2026-09-05", "u1", nil))
	want := []string{"2026-09-01", "2026-09-05"}
	if len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Fatalf("days = %v, want %v (from/to inclusive)", got, want)
	}

	// One open end still bounds the other.
	got = data[[]string](t, do(t, mux, "GET", "/api/food/days?from=2026-09-05", "u1", nil))
	if len(got) != 2 || got[0] != "2026-09-05" || got[1] != "2026-09-10" {
		t.Fatalf("days = %v, want the two days from 2026-09-05 on", got)
	}
	got = data[[]string](t, do(t, mux, "GET", "/api/food/days?to=2026-08-31", "u1", nil))
	if len(got) != 1 || got[0] != "2026-08-30" {
		t.Fatalf("days = %v, want only 2026-08-30", got)
	}
}

// A window with nothing in it is an honest empty answer, not an error.
func TestLoggedDaysRangeWithNoRowsIsEmpty(t *testing.T) {
	f := &fakeStore{}
	seedLog(t, f, "u1", "2026-09-01", "lunch", "Rice", 500, 15)

	got := data[[]string](t, do(t, newMux(f, nil), "GET",
		"/api/food/days?from=2026-10-01&to=2026-10-31", "u1", nil))
	if len(got) != 0 {
		t.Fatalf("days = %v, want empty for a month with no logs", got)
	}
}

// A bad filter must not degrade into "no filter" — that would silently answer a
// different question than the one asked.
func TestLoggedDaysRejectsMalformedRange(t *testing.T) {
	mux := newMux(&fakeStore{}, nil)
	for _, q := range []string{
		"?from=nonsense",
		"?to=nonsense",
		"?from=2026-13-45",
		"?from=09-01-2026",
		"?to=2026-09-01T00:00:00Z",
	} {
		rr := do(t, mux, "GET", "/api/food/days"+q, "u1", nil)
		if rr.Code != http.StatusBadRequest {
			t.Errorf("GET /api/food/days%s = %d, want 400", q, rr.Code)
		}
	}
}

func TestLoggedDaysRejectsBackwardsRange(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "GET",
		"/api/food/days?from=2026-09-10&to=2026-09-01", "u1", nil)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 for from > to", rr.Code)
	}
}

// An in-flight or failed scan row still marks the day. This is deliberate and
// matches what the client it replaces did: the old code listed every row with
// no status filter, so removing these here would delete dots that are on screen
// today. Pinned so the choice is a decision rather than a drift.
func TestLoggedDaysCountsEveryStatus(t *testing.T) {
	f := &fakeStore{}
	analyzing := seedLog(t, f, "u1", "2026-09-02", "lunch", "Scan", 0, 0)
	for i := range f.logs {
		if f.logs[i].ID == analyzing.ID {
			f.logs[i].Status = "analyzing"
		}
	}
	got := data[[]string](t, do(t, newMux(f, nil), "GET", "/api/food/days", "u1", nil))
	if len(got) != 1 || got[0] != "2026-09-02" {
		t.Fatalf("days = %v, want the analyzing row's day to still carry a dot", got)
	}
}
