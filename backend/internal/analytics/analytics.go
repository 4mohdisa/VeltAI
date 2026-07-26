// Package analytics ingests first-party product events. Events are
// allow-listed by name and attributed to the authenticated user only —
// never to an id from the request body.
package analytics

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/httpx"
)

// Event is one validated analytics event, ready for storage.
type Event struct {
	Name       string
	Properties json.RawMessage
	SessionID  string
	ClientTS   time.Time
}

type Store interface {
	InsertEvents(ctx context.Context, userID string, events []Event) error
}

const (
	maxEvents     = 50
	maxProperties = 2048 // serialized JSON bytes per event
	maxSessionID  = 64
)

// allowedNames is the closed set of events the app may report.
var allowedNames = map[string]bool{
	"onboarding_completed":  true,
	"food_logged":           true,
	"scan_started":          true,
	"scan_confirmed":        true,
	"scan_corrected":        true,
	"scan_discarded":        true,
	"workout_logged":        true,
	"template_created":      true,
	"integration_connected": true,
	"paywall_viewed":        true,
	"trial_started":         true,
	"feature_used":          true,
}

// Register attaches the authenticated event-ingest route.
func Register(mux *http.ServeMux, store Store) {
	type reqEvent struct {
		Name       string          `json:"name"`
		Properties json.RawMessage `json:"properties"`
		SessionID  string          `json:"session_id"`
		ClientTS   string          `json:"client_ts"`
	}
	mux.HandleFunc("POST /api/analytics/events", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Events []reqEvent `json:"events"`
		}
		if err := httpx.Decode(r, &body); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if len(body.Events) == 0 || len(body.Events) > maxEvents {
			httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("events must contain 1 to %d items", maxEvents))
			return
		}
		events := make([]Event, 0, len(body.Events))
		for i, e := range body.Events {
			if !allowedNames[e.Name] {
				httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("events[%d]: unknown event name %q", i, e.Name))
				return
			}
			if len(e.Properties) > maxProperties {
				httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("events[%d]: properties exceed %d bytes", i, maxProperties))
				return
			}
			if len(e.SessionID) > maxSessionID {
				httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("events[%d]: session_id exceeds %d chars", i, maxSessionID))
				return
			}
			ts, err := time.Parse(time.RFC3339, e.ClientTS)
			if err != nil {
				httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("events[%d]: client_ts must be RFC3339", i))
				return
			}
			props := e.Properties
			if len(props) == 0 || string(props) == "null" {
				props = json.RawMessage(`{}`)
			}
			events = append(events, Event{Name: e.Name, Properties: props, SessionID: e.SessionID, ClientTS: ts})
		}
		// Attribution comes only from the verified JWT.
		if err := store.InsertEvents(r.Context(), auth.UserID(r.Context()), events); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "database error")
			return
		}
		httpx.JSON(w, http.StatusAccepted, map[string]int{"accepted": len(events)})
	})
}
