package entitlement

import "time"

// Subscription states written to subscriptions.status. The values are the
// strings already stored and returned by GET /api/subscription, so the names
// say what each state means and the wire values stay unchanged.
const (
	StateTrial           = "trialing"
	StateActive          = "active"
	StateBillingIssue    = "past_due"
	StateCancelledActive = "cancelled"
	StateExpired         = "expired"
	StateRefunded        = "refunded"
)

// refundReason is the RevenueCat cancel_reason for a refund: RevenueCat has no
// REFUND event type and sends a refund as a CANCELLATION with this reason.
const refundReason = "CUSTOMER_SUPPORT"

// Event is the part of a RevenueCat webhook event that decides the state.
type Event struct {
	Type                      string `json:"type"`
	PeriodType                string `json:"period_type"`
	CancelReason              string `json:"cancel_reason"`
	ExpirationAtMs            *int64 `json:"expiration_at_ms"`
	GracePeriodExpirationAtMs *int64 `json:"grace_period_expiration_at_ms"`
}

// StateFor maps an event to the state it sets and the expiry that bounds it.
// ok is false for events that do not change access: PRODUCT_CHANGE takes
// effect at the next renewal, which arrives as its own RENEWAL event.
// Ordering and replay are not decided here: the webhook claims the event id
// and writes only when the event is not older than the last one applied.
func StateFor(e Event) (state string, expiresAtMs *int64, ok bool) {
	switch e.Type {
	case "INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION":
		if e.PeriodType == "TRIAL" {
			return StateTrial, e.ExpirationAtMs, true
		}
		return StateActive, e.ExpirationAtMs, true
	case "CANCELLATION":
		if e.CancelReason == refundReason {
			return StateRefunded, e.ExpirationAtMs, true
		}
		return StateCancelledActive, e.ExpirationAtMs, true
	case "BILLING_ISSUE":
		// Access lasts through the store's grace period; with no grace period
		// the expiry is nil and the user has no access.
		return StateBillingIssue, e.GracePeriodExpirationAtMs, true
	case "EXPIRATION":
		return StateExpired, e.ExpirationAtMs, true
	}
	return "", nil, false
}

// Grants reports whether a stored state gives Pro access at now. Trial, active,
// billing issue (grace) and cancelled grant only until expiresAt; a missing
// expiry is unknown and grants nothing. Expired, refunded and any unknown state
// never grant.
func Grants(state string, expiresAt *time.Time, now time.Time) bool {
	switch state {
	case StateTrial, StateActive, StateBillingIssue, StateCancelledActive:
		return expiresAt != nil && expiresAt.After(now)
	}
	return false
}
