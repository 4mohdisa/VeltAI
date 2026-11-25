// Package consent holds the server-side third-party-AI consent gate shared by
// every route that sends user data to an AI provider (App Store 5.1.2(i)).
// Consent is recorded in profiles.ai_consent_at; each caller's store reads it.
package consent

import (
	"context"
	"net/http"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/httpx"
)

// Reader reads when the user gave third-party-AI consent, or nil if never.
type Reader interface {
	AIConsentAt(ctx context.Context, userID string) (*time.Time, error)
}

// Require fails CLOSED: a nil store or no recorded consent is 403
// ai_consent_required, and a read error is 500, so nothing is sent unless
// consent is on record. Returns false once it has written the response.
func Require(w http.ResponseWriter, r *http.Request, store Reader) bool {
	if store == nil {
		httpx.Error(w, http.StatusForbidden, "ai_consent_required")
		return false
	}
	at, err := store.AIConsentAt(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to check AI consent")
		return false
	}
	if at == nil {
		httpx.Error(w, http.StatusForbidden, "ai_consent_required")
		return false
	}
	return true
}
