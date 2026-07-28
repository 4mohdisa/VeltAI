// Package subscription exposes subscription status and ingests RevenueCat webhooks.
package subscription

import (
	"context"
	"crypto/subtle"
	"errors"
	"log"
	"net/http"
	"strings"
	"sync"
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
	Upsert(ctx context.Context, s Sub) error
	Transfer(ctx context.Context, fromUserID, toUserID string) error
}

// anonPrefix marks RevenueCat anonymous app user ids; events keyed on them
// are unattributable to a Clerk user, so the webhook no-ops on them.
const anonPrefix = "$RCAnonymousID:"

// maxEventAge bounds how old a webhook event may be and still be applied. It is
// the only replay defence that survives a restart (the guard below is
// in-memory): a captured request stops working once it ages out. RevenueCat
// retries a failed delivery for ~24h, so anything older is not a real delivery.
const maxEventAge = 24 * time.Hour

// maxGuardEntries bounds the in-memory guard's maps.
const maxGuardEntries = 4096

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
// captures it can forge arbitrary events. The guards here (age bound, replay id
// set, timestamp monotonicity, transfer preconditions) contain blind replay and
// bad ordering; they cannot contain a leaked secret. Rotate it if it leaks.
func RegisterWebhook(mux *http.ServeMux, store Store, authHeader string) {
	// A grant carrying no expiration must not become permanent Pro. The default
	// is deliberately longer than a renewal cycle's retry window so a legitimate
	// payer is never locked out: any later status event refreshes it, and the
	// worst case is losing access ~36h after the store stops talking to us.
	defaultTTL := time.Duration(config.EnvInt("LUMO_SUB_DEFAULT_TTL_HOURS", 36)) * time.Hour
	if defaultTTL <= 0 {
		defaultTTL = 36 * time.Hour
	}
	guard := newEventGuard()

	mux.HandleFunc("POST /api/webhooks/revenuecat", func(w http.ResponseWriter, r *http.Request) {
		if authHeader == "" {
			httpx.Error(w, http.StatusServiceUnavailable, "webhook auth not configured")
			return
		}
		if subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte(authHeader)) != 1 {
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
		if !guard.allow(e.ID, e.AppUserID, ts) {
			log.Printf("subscription: dropping replayed/out-of-order webhook event %q (type %s)", e.ID, e.Type)
			ignored()
			return
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
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
			if err == nil && isActive(dst) {
				log.Printf("subscription: TRANSFER ignored — target already holds an active subscription")
				ignored()
				return
			}
			if err := store.Transfer(r.Context(), from, to); err != nil {
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
			guard.record(e.ID, e.AppUserID, ts)
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
		if err := store.Upsert(r.Context(), sub); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "database error")
			return
		}
		guard.record(e.ID, e.AppUserID, ts)
		httpx.JSON(w, http.StatusOK, map[string]string{"result": "ok"})
	})
}

// eventGuard rejects exact replays (an event id already applied) and
// out-of-order deliveries (an event older than the newest one already applied
// for that user), so a delayed EXPIRATION cannot downgrade a fresh RENEWAL.
//
// ponytail: in-memory, per process — it does not survive a restart and is not
// shared across replicas. maxEventAge is the half that does survive. Closing
// the gap properly needs a last_event_at column on `subscriptions`; not worth a
// migration until the webhook runs on more than one instance.
type eventGuard struct {
	mu   sync.Mutex
	seen map[string]int64 // event id -> event_timestamp_ms
	last map[string]int64 // app_user_id -> newest event_timestamp_ms applied
}

func newEventGuard() *eventGuard {
	return &eventGuard{seen: map[string]int64{}, last: map[string]int64{}}
}

// allow reports whether the event may be applied. It records nothing: record is
// called only once the event has actually been written, so a 500 that
// RevenueCat retries is not swallowed as a replay.
func (g *eventGuard) allow(id, user string, ts int64) bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	if id != "" {
		if _, dup := g.seen[id]; dup {
			return false
		}
	}
	if user != "" {
		if prev, ok := g.last[user]; ok && ts < prev {
			return false
		}
	}
	return true
}

func (g *eventGuard) record(id, user string, ts int64) {
	g.mu.Lock()
	defer g.mu.Unlock()
	cutoff := time.Now().Add(-maxEventAge).UnixMilli()
	trim(g.seen, cutoff)
	trim(g.last, cutoff)
	if id != "" {
		g.seen[id] = ts
	}
	if user != "" && ts > g.last[user] {
		g.last[user] = ts
	}
}

// trim bounds guard memory: drop entries older than the age window, and if that
// is not enough drop everything — an event older than the window is rejected by
// maxEventAge anyway, so forgetting it costs no protection.
func trim(m map[string]int64, cutoff int64) {
	if len(m) < maxGuardEntries {
		return
	}
	for k, ts := range m {
		if ts < cutoff {
			delete(m, k)
		}
	}
	if len(m) >= maxGuardEntries {
		clear(m)
	}
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
