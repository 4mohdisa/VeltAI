// Package subscription exposes subscription status and ingests RevenueCat webhooks.
package subscription

import (
	"context"
	"crypto/subtle"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/httpx"
)

var ErrNotFound = errors.New("subscription not found")

type Sub struct {
	UserID           string     `json:"user_id"`
	Platform         *string    `json:"platform"`
	Status           string     `json:"status"`
	PlanInterval     *string    `json:"plan_interval"`
	ExpiresAt        *time.Time `json:"expires_at"`
	RevenueCatUserID *string    `json:"revenuecat_user_id"`
}

type Store interface {
	Get(ctx context.Context, userID string) (Sub, error)
	Transfer(ctx context.Context, fromUserID, toUserID string) error

	// ClaimEvent records (provider, eventID) as processed and reports whether
	// THIS caller got the claim. false = some other delivery already has it, i.e.
	// a replay. Must be atomic (INSERT ... ON CONFLICT DO NOTHING), not
	// exists-then-insert, or two concurrent deliveries both win.
	ClaimEvent(ctx context.Context, provider, eventID string) (bool, error)

	// ReleaseEvent drops a claim whose write then failed, so the provider's retry
	// of a genuinely unapplied event is not mistaken for a replay.
	ReleaseEvent(ctx context.Context, provider, eventID string) error

	// UpsertIfNewer writes s only when eventTSMs is not older than the newest
	// event already applied for that user, comparing and updating in ONE
	// statement. false = the delivery is out of order and was not applied.
	UpsertIfNewer(ctx context.Context, s Sub, eventTSMs int64) (bool, error)
}

// eventProvider namespaces the processed-event rows; RevenueCat is the only
// webhook source today.
const eventProvider = "revenuecat"

// anonPrefix marks RevenueCat anonymous app user ids; events keyed on them
// are unattributable to a Clerk user, so the webhook no-ops on them.
const anonPrefix = "$RCAnonymousID:"

// maxEventAge bounds how old a webhook event may be and still be applied: a
// captured request stops working once it ages out. RevenueCat retries a failed
// delivery for ~24h, so anything older is not a real delivery. It is also the
// retention horizon for the processed-event rows.
const maxEventAge = 24 * time.Hour

func isActive(s Sub) bool {
	switch s.Status {
	case "active", "trialing":
		// A missing expiry is NOT "never expires" — that turned any grant event
		// without expiration_at_ms into permanent free Pro. The webhook always
		// writes a bounded expiry (see defaultTTL), so nil here means unknown,
		// and unknown fails closed.
		return s.ExpiresAt != nil && s.ExpiresAt.After(time.Now())
	case "cancelled":
		// Auto-renew off: access is paid through ExpiresAt (EXPIRATION ends it).
		// Refund cancellations carry a past expiration_at_ms, so they stay inactive.
		return s.ExpiresAt != nil && s.ExpiresAt.After(time.Now())
	}
	return false
}

// Register attaches the authenticated subscription-status route.
func Register(mux *http.ServeMux, store Store) {
	type statusResp struct {
		Status       string     `json:"status"`
		IsActive     bool       `json:"is_active"`
		Platform     *string    `json:"platform"`
		PlanInterval *string    `json:"plan_interval"`
		ExpiresAt    *time.Time `json:"expires_at"`
	}
	mux.HandleFunc("GET /api/subscription", func(w http.ResponseWriter, r *http.Request) {
		sub, err := store.Get(r.Context(), auth.UserID(r.Context()))
		if errors.Is(err, ErrNotFound) {
			httpx.JSON(w, http.StatusOK, statusResp{Status: "none"})
			return
		}
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "database error")
			return
		}
		httpx.JSON(w, http.StatusOK, statusResp{
			Status:       sub.Status,
			IsActive:     isActive(sub),
			Platform:     sub.Platform,
			PlanInterval: sub.PlanInterval,
			ExpiresAt:    sub.ExpiresAt,
		})
	})
}

// RegisterWebhook attaches the public RevenueCat webhook. RevenueCat sends a
// fixed Authorization header configured in its dashboard; require exact match.
//
// The header is a shared bearer secret, NOT an HMAC over the body, so anyone who
// captures it can forge arbitrary events. The guards here (age bound, durable
// event-id claim, timestamp monotonicity, transfer preconditions) contain blind
// replay and bad ordering; they cannot contain a leaked secret. Rotate it if it
// leaks.
//
// Both replay guards live in Postgres, so they hold across instances and across
// restarts. A guard that cannot be consulted (DB error) answers 500 — RevenueCat
// retries, and we never apply an event we could not check.
func RegisterWebhook(mux *http.ServeMux, store Store, authHeader string) {
	// A grant carrying no expiration must not become permanent Pro. The default
	// is deliberately longer than a renewal cycle's retry window so a legitimate
	// payer is never locked out: any later status event refreshes it, and the
	// worst case is losing access ~36h after the store stops talking to us.
	defaultTTL := time.Duration(config.EnvInt("LUMO_SUB_DEFAULT_TTL_HOURS", 36)) * time.Hour
	if defaultTTL <= 0 {
		defaultTTL = 36 * time.Hour
	}
	// Rotation support: authHeader may carry the CURRENT secret, and
	// REVENUECAT_WEBHOOK_AUTH_PREVIOUS the one being retired. Accepting both for
	// an overlap window is what makes rotation a non-event — otherwise every
	// rotation drops whatever webhooks are in flight while the dashboard and the
	// server disagree, and a dropped RevenueCat event means a paying user
	// silently loses access. Retire the previous value once traffic confirms it
	// is unused (DEPLOY.md "Rotating secrets").
	accepted := acceptedSecrets(authHeader, config.Env("REVENUECAT_WEBHOOK_AUTH_PREVIOUS", ""))

	mux.HandleFunc("POST /api/webhooks/revenuecat", func(w http.ResponseWriter, r *http.Request) {
		if len(accepted) == 0 {
			httpx.Error(w, http.StatusServiceUnavailable, "webhook auth not configured")
			return
		}
		if !authorized(r.Header.Get("Authorization"), accepted) {
			httpx.Error(w, http.StatusForbidden, "invalid webhook authorization")
			return
		}
		var body struct {
			Event struct {
				ID               string   `json:"id"`
				Type             string   `json:"type"`
				AppUserID        string   `json:"app_user_id"`
				PeriodType       string   `json:"period_type"`
				ExpirationAtMs   *int64   `json:"expiration_at_ms"`
				EventTimestampMs *int64   `json:"event_timestamp_ms"`
				Store            string   `json:"store"`
				ProductID        string   `json:"product_id"`
				TransferredFrom  []string `json:"transferred_from"`
				TransferredTo    []string `json:"transferred_to"`
			} `json:"event"`
		}
		if err := httpx.Decode(r, &body); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		e := body.Event
		ignored := func() { httpx.JSON(w, http.StatusOK, map[string]string{"result": "ignored"}) }

		// event_timestamp_ms is present on every real delivery. If it is absent
		// we cannot order the event, so treat it as current and fall back to the
		// event-id replay check rather than dropping a real revenue event.
		ts := time.Now().UnixMilli()
		if e.EventTimestampMs != nil {
			ts = *e.EventTimestampMs
		}
		if age := time.Since(time.UnixMilli(ts)); age > maxEventAge {
			log.Printf("subscription: dropping stale webhook event %q (type %s, age %s)", e.ID, e.Type, age.Truncate(time.Second))
			ignored()
			return
		}
		// Claim the event id BEFORE doing anything with it: the claim is the
		// atomic INSERT, so of two concurrent deliveries of one event exactly one
		// proceeds. Claiming after the write would let both through. An event
		// carrying no id cannot be deduped this way and relies on the timestamp
		// guard below.
		if e.ID != "" {
			claimed, err := store.ClaimEvent(r.Context(), eventProvider, e.ID)
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
			if !claimed {
				log.Printf("subscription: dropping replayed webhook event %q (type %s)", e.ID, e.Type)
				ignored()
				return
			}
		}
		// release undoes the claim when the event turns out not to have been
		// applied because of an ERROR — a retry of an unapplied event must not
		// look like a replay. Deliberate no-ops (ignored types, failed
		// preconditions, stale ordering) keep the claim: they are decisions, and
		// retrying them would reach the same one.
		release := func() {
			if e.ID == "" {
				return
			}
			if err := store.ReleaseEvent(r.Context(), eventProvider, e.ID); err != nil {
				log.Printf("subscription: could not release claim on event %q: %v", e.ID, err)
			}
		}

		if e.Type == "TRANSFER" {
			// Both users are named on the wire, so a TRANSFER is an untrusted
			// instruction to delete an arbitrary row. Only move a live
			// entitlement, and never over the top of someone else's live one.
			// Anything inconsistent is logged and left alone — no state change.
			from, to := firstIdentified(e.TransferredFrom), firstIdentified(e.TransferredTo)
			if from == "" || to == "" || from == to {
				ignored()
				return
			}
			src, err := store.Get(r.Context(), from)
			if err != nil && !errors.Is(err, ErrNotFound) {
				release()
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
			if err != nil || !isActive(src) {
				log.Printf("subscription: TRANSFER ignored — source has no active subscription")
				ignored()
				return
			}
			dst, err := store.Get(r.Context(), to)
			if err != nil && !errors.Is(err, ErrNotFound) {
				release()
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
			if err == nil && isActive(dst) {
				log.Printf("subscription: TRANSFER ignored — target already holds an active subscription")
				ignored()
				return
			}
			if err := store.Transfer(r.Context(), from, to); err != nil {
				release()
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
			httpx.JSON(w, http.StatusOK, map[string]string{"result": "ok"})
			return
		}

		var status string
		switch e.Type {
		case "INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION":
			status = "active"
			if e.PeriodType == "TRIAL" {
				status = "trialing"
			}
		case "CANCELLATION":
			status = "cancelled"
		case "EXPIRATION":
			status = "expired"
		case "BILLING_ISSUE":
			status = "past_due"
		default:
			ignored()
			return
		}
		if e.AppUserID == "" {
			httpx.Error(w, http.StatusBadRequest, "missing app_user_id")
			return
		}
		if strings.HasPrefix(e.AppUserID, anonPrefix) {
			// Unattributable purchase; RevenueCat sends TRANSFER once it maps
			// the anonymous id to a real user. Don't create orphan rows.
			ignored()
			return
		}

		sub := Sub{UserID: e.AppUserID, Status: status, RevenueCatUserID: &e.AppUserID}
		switch {
		case e.ExpirationAtMs != nil:
			t := time.UnixMilli(*e.ExpirationAtMs).UTC()
			sub.ExpiresAt = &t
		case status == "active" || status == "trialing":
			// Grant with no expiry: bound it instead of granting forever.
			t := time.Now().Add(defaultTTL).UTC()
			sub.ExpiresAt = &t
		}
		if p := platformFromStore(e.Store); p != "" {
			sub.Platform = &p
		}
		if pi := intervalFromProduct(e.ProductID); pi != "" {
			sub.PlanInterval = &pi
		}
		// One statement compares ts against the user's last applied event and
		// writes: two concurrent deliveries for one user cannot both win, and a
		// delayed EXPIRATION cannot downgrade a fresh RENEWAL on another instance.
		applied, err := store.UpsertIfNewer(r.Context(), sub, ts)
		if err != nil {
			release()
			httpx.Error(w, http.StatusInternalServerError, "database error")
			return
		}
		if !applied {
			log.Printf("subscription: dropping out-of-order webhook event %q (type %s)", e.ID, e.Type)
			ignored()
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]string{"result": "ok"})
	})
}

func firstIdentified(ids []string) string {
	for _, id := range ids {
		if id != "" && !strings.HasPrefix(id, anonPrefix) {
			return id
		}
	}
	return ""
}

func platformFromStore(store string) string {
	switch store {
	case "APP_STORE", "MAC_APP_STORE":
		return "ios"
	case "PLAY_STORE":
		return "android"
	case "":
		return ""
	default:
		return strings.ToLower(store)
	}
}

func intervalFromProduct(productID string) string {
	p := strings.ToLower(productID)
	switch {
	case strings.Contains(p, "annual"), strings.Contains(p, "year"):
		return "year"
	case strings.Contains(p, "month"):
		return "month"
	default:
		return ""
	}
}

// IsActive reports whether the user currently holds an entitlement. It is the
// SERVER-SIDE source of truth the entitlement gate consults — the client's
// RevenueCat SDK view is advisory only, since anyone with a valid token could
// lie about it. A user with no subscription row is simply not active (no error).
func (s *PGStore) IsActive(ctx context.Context, userID string) (bool, error) {
	sub, err := s.Get(ctx, userID)
	if errors.Is(err, ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return isActive(sub), nil
}

// acceptedSecrets returns the non-empty secrets a webhook may authenticate
// with (current, and optionally the previous one during a rotation overlap).
func acceptedSecrets(current, previous string) [][]byte {
	var out [][]byte
	for _, s := range []string{current, previous} {
		if s != "" {
			out = append(out, []byte(s))
		}
	}
	return out
}

// authorized compares the presented header against every accepted secret in
// CONSTANT TIME. It deliberately checks all of them rather than returning
// early on the first match: an early return leaks, through timing, which of
// the two secrets matched. The loop's cost is fixed at two comparisons.
func authorized(presented string, accepted [][]byte) bool {
	p := []byte(presented)
	var ok int
	for _, s := range accepted {
		ok |= subtle.ConstantTimeCompare(p, s)
	}
	return ok == 1
}
