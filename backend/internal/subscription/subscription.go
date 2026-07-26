// Package subscription exposes subscription status and ingests RevenueCat webhooks.
package subscription

import (
	"context"
	"crypto/subtle"
	"errors"
	"net/http"
	"strings"
	"time"

	"lumo/backend/internal/auth"
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

func isActive(s Sub) bool {
	switch s.Status {
	case "active", "trialing":
		return s.ExpiresAt == nil || s.ExpiresAt.After(time.Now())
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
func RegisterWebhook(mux *http.ServeMux, store Store, authHeader string) {
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
				Type            string   `json:"type"`
				AppUserID       string   `json:"app_user_id"`
				PeriodType      string   `json:"period_type"`
				ExpirationAtMs  *int64   `json:"expiration_at_ms"`
				Store           string   `json:"store"`
				ProductID       string   `json:"product_id"`
				TransferredFrom []string `json:"transferred_from"`
				TransferredTo   []string `json:"transferred_to"`
			} `json:"event"`
		}
		if err := httpx.Decode(r, &body); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		e := body.Event

		if e.Type == "TRANSFER" {
			from, to := firstIdentified(e.TransferredFrom), firstIdentified(e.TransferredTo)
			if from == "" || to == "" {
				httpx.JSON(w, http.StatusOK, map[string]string{"result": "ignored"})
				return
			}
			if err := store.Transfer(r.Context(), from, to); err != nil {
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
			httpx.JSON(w, http.StatusOK, map[string]string{"result": "ignored"})
			return
		}
		if e.AppUserID == "" {
			httpx.Error(w, http.StatusBadRequest, "missing app_user_id")
			return
		}
		if strings.HasPrefix(e.AppUserID, anonPrefix) {
			// Unattributable purchase; RevenueCat sends TRANSFER once it maps
			// the anonymous id to a real user. Don't create orphan rows.
			httpx.JSON(w, http.StatusOK, map[string]string{"result": "ignored"})
			return
		}

		sub := Sub{UserID: e.AppUserID, Status: status, RevenueCatUserID: &e.AppUserID}
		if e.ExpirationAtMs != nil {
			t := time.UnixMilli(*e.ExpirationAtMs).UTC()
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
