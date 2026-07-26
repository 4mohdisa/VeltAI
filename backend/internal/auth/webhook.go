package auth

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"lumo/backend/internal/httpx"
)

// RegisterWebhook mounts the Clerk user-sync webhook (svix-signed, no JWT).
func RegisterWebhook(mux *http.ServeMux, st ProfileStore, secret string) {
	mux.HandleFunc("POST /api/webhooks/clerk", func(w http.ResponseWriter, r *http.Request) {
		if secret == "" {
			httpx.Error(w, http.StatusServiceUnavailable, "webhook secret not configured")
			return
		}
		payload, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "cannot read body")
			return
		}
		if err := VerifySvix(secret, r.Header, payload); err != nil {
			httpx.Error(w, http.StatusForbidden, "invalid signature")
			return
		}

		var event struct {
			Type string `json:"type"`
			Data struct {
				ID             string `json:"id"`
				FirstName      string `json:"first_name"`
				LastName       string `json:"last_name"`
				ImageURL       string `json:"image_url"`
				PrimaryEmailID string `json:"primary_email_address_id"`
				EmailAddresses []struct {
					ID    string `json:"id"`
					Email string `json:"email_address"`
				} `json:"email_addresses"`
			} `json:"data"`
		}
		if err := json.Unmarshal(payload, &event); err != nil || event.Data.ID == "" {
			httpx.Error(w, http.StatusBadRequest, "invalid payload")
			return
		}

		switch event.Type {
		case "user.created", "user.updated":
			p := Profile{ID: event.Data.ID}
			if addrs := event.Data.EmailAddresses; len(addrs) > 0 {
				email := addrs[0].Email
				for _, a := range addrs {
					if a.ID == event.Data.PrimaryEmailID {
						email = a.Email
						break
					}
				}
				p.Email = &email
			}
			if name := strings.TrimSpace(event.Data.FirstName + " " + event.Data.LastName); name != "" {
				p.DisplayName = &name
			}
			if event.Data.ImageURL != "" {
				p.AvatarURL = &event.Data.ImageURL
			}
			if err := st.Upsert(r.Context(), p); err != nil {
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
		case "user.deleted":
			if err := st.Delete(r.Context(), event.Data.ID); err != nil {
				httpx.Error(w, http.StatusInternalServerError, "database error")
				return
			}
		}
		// Unknown event types ack with 200 so Clerk doesn't retry them.
		httpx.JSON(w, http.StatusOK, map[string]bool{"received": true})
	})
}
