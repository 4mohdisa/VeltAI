package entitlementtests

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"lume/backend/internal/entitlement"
)

// fixtureBaseMs is the time every fixture in testdata was written around
// (2026-01-01T00:00:00Z); every event timestamp falls within 10 hours of it.
const fixtureBaseMs int64 = 1767225600000

func readFixture(t *testing.T, name string) []byte {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("testdata", name+".json"))
	if err != nil {
		t.Fatalf("read fixture %s: %v", name, err)
	}
	return b
}

func fixtureEvent(t *testing.T, name string) entitlement.Event {
	t.Helper()
	var body struct {
		Event entitlement.Event `json:"event"`
	}
	if err := json.Unmarshal(readFixture(t, name), &body); err != nil {
		t.Fatalf("decode fixture %s: %v", name, err)
	}
	return body.Event
}

func ms(v int64) *int64 { return &v }

func TestStateForEveryFixture(t *testing.T) {
	const hour, day int64 = 3600000, 86400000
	cases := []struct {
		fixture    string
		wantOK     bool
		wantState  string
		wantExpiry *int64
	}{
		{"initial_purchase", true, entitlement.StateActive, ms(fixtureBaseMs + 30*day)},
		{"initial_purchase_trial", true, entitlement.StateTrial, ms(fixtureBaseMs + 7*day)},
		{"renewal", true, entitlement.StateActive, ms(fixtureBaseMs + 60*day)},
		{"cancellation", true, entitlement.StateCancelledActive, ms(fixtureBaseMs + 60*day)},
		{"billing_issue", true, entitlement.StateBillingIssue, ms(fixtureBaseMs + 4*hour + 16*day)},
		{"billing_issue_no_grace", true, entitlement.StateBillingIssue, nil},
		{"expiration", true, entitlement.StateExpired, ms(fixtureBaseMs + 6*hour)},
		{"refund", true, entitlement.StateRefunded, ms(fixtureBaseMs + 7*hour)},
		{"product_change", false, "", nil},
	}
	for _, tc := range cases {
		t.Run(tc.fixture, func(t *testing.T) {
			state, expiry, ok := entitlement.StateFor(fixtureEvent(t, tc.fixture))
			if ok != tc.wantOK || state != tc.wantState {
				t.Fatalf("StateFor = (%q, ok %v), want (%q, ok %v)", state, ok, tc.wantState, tc.wantOK)
			}
			if (expiry == nil) != (tc.wantExpiry == nil) || (expiry != nil && *expiry != *tc.wantExpiry) {
				t.Fatalf("expiry = %v, want %v", expiry, tc.wantExpiry)
			}
		})
	}
}

func TestGrantsAtAFixedClock(t *testing.T) {
	now := time.Date(2026, 3, 1, 12, 0, 0, 0, time.UTC)
	future := now.Add(time.Hour)
	past := now.Add(-time.Hour)
	cases := []struct {
		name      string
		state     string
		expiresAt *time.Time
		want      bool
	}{
		{"trial before expiry", entitlement.StateTrial, &future, true},
		{"trial after expiry", entitlement.StateTrial, &past, false},
		{"active before expiry", entitlement.StateActive, &future, true},
		{"active after expiry", entitlement.StateActive, &past, false},
		{"active with no expiry", entitlement.StateActive, nil, false},
		{"billing issue in grace", entitlement.StateBillingIssue, &future, true},
		{"billing issue after grace", entitlement.StateBillingIssue, &past, false},
		{"billing issue with no grace", entitlement.StateBillingIssue, nil, false},
		{"cancelled before expiry", entitlement.StateCancelledActive, &future, true},
		{"cancelled after expiry", entitlement.StateCancelledActive, &past, false},
		{"expired", entitlement.StateExpired, &future, false},
		{"refunded with a future expiry", entitlement.StateRefunded, &future, false},
		{"unknown state", "inactive", &future, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := entitlement.Grants(tc.state, tc.expiresAt, now); got != tc.want {
				t.Fatalf("Grants(%q) = %v, want %v", tc.state, got, tc.want)
			}
		})
	}
}
