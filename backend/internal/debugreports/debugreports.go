// Package debugreports stores the in-app debug captures from internal testing.
//
// This is a SECONDARY copy. The device persists every report to its own
// filesystem before it ever calls this, and syncs opportunistically — so a
// failure here costs nothing but a retry, and the endpoint is deliberately
// forgiving: it upserts on (user_id, client_id) so a client that retries after
// losing signal never creates a duplicate.
package debugreports

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/db"
	"lume/backend/internal/httpx"
)

// maxBody caps the request: a report carries a base64 JPEG screenshot, which is
// a few hundred KB at the capture quality the client uses.
const maxBody = 12 << 20

// Report is one captured report as the device sends it.
type Report struct {
	ID          string          `json:"id,omitempty"`
	ClientID    string          `json:"client_id"`
	CapturedAt  string          `json:"created_at"`
	Title       string          `json:"title"`
	Notes       string          `json:"notes"`
	Severity    string          `json:"severity"`
	Kind        string          `json:"kind"`
	Area        string          `json:"area"`
	Trigger     string          `json:"trigger"`
	Route       string          `json:"route"`
	AppVersion  string          `json:"app_version"`
	BuildNumber string          `json:"build_number"`
	Context     json.RawMessage `json:"context"`
	ImageBase64 string          `json:"image_base64,omitempty"`
}

// Store persists reports.
type Store interface {
	Upsert(ctx context.Context, userID string, r Report) (string, error)
	List(ctx context.Context, userID string) ([]Report, error)
}

// PGStore is the Postgres Store.
type PGStore struct{ q db.Querier }

// NewPGStore returns a Postgres-backed store.
func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// Upsert writes a report, keyed on (user_id, client_id) so a retried sync
// updates the existing row instead of duplicating it.
func (s *PGStore) Upsert(ctx context.Context, userID string, r Report) (string, error) {
	capturedAt, err := time.Parse(time.RFC3339, r.CapturedAt)
	if err != nil {
		capturedAt = time.Now().UTC()
	}
	ctxJSON := r.Context
	if len(ctxJSON) == 0 {
		ctxJSON = json.RawMessage(`{}`)
	}
	var screenshot *string
	if r.ImageBase64 != "" {
		screenshot = &r.ImageBase64
	}
	var id string
	err = s.q.QueryRow(ctx, `
		INSERT INTO debug_reports (user_id, client_id, captured_at, title, notes, severity,
		                           kind, area, trigger, route, app_version, build_number,
		                           context, screenshot)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)
		ON CONFLICT (user_id, client_id) DO UPDATE SET
			title = EXCLUDED.title, notes = EXCLUDED.notes, severity = EXCLUDED.severity,
			kind = EXCLUDED.kind, area = EXCLUDED.area, context = EXCLUDED.context,
			screenshot = COALESCE(EXCLUDED.screenshot, debug_reports.screenshot)
		RETURNING id::text`,
		userID, r.ClientID, capturedAt, r.Title, r.Notes, r.Severity, r.Kind, r.Area,
		r.Trigger, r.Route, r.AppVersion, r.BuildNumber, string(ctxJSON), screenshot).Scan(&id)
	return id, err
}

// List returns the user's reports, newest first. The screenshot is omitted —
// the list is for triage, and the images are large.
func (s *PGStore) List(ctx context.Context, userID string) ([]Report, error) {
	rows, err := s.q.Query(ctx, `
		SELECT id::text, client_id, captured_at, title, notes, severity, kind, area,
		       trigger, route, app_version, build_number, context
		FROM debug_reports WHERE user_id = $1 ORDER BY captured_at DESC LIMIT 500`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Report{}
	for rows.Next() {
		var r Report
		var at time.Time
		if err := rows.Scan(&r.ID, &r.ClientID, &at, &r.Title, &r.Notes, &r.Severity, &r.Kind,
			&r.Area, &r.Trigger, &r.Route, &r.AppVersion, &r.BuildNumber, &r.Context); err != nil {
			return nil, err
		}
		r.CapturedAt = at.UTC().Format(time.RFC3339)
		out = append(out, r)
	}
	return out, rows.Err()
}

// Register mounts the authenticated debug-report routes.
func Register(mux *http.ServeMux, store Store) {
	mux.HandleFunc("POST /api/debug-reports", func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxBody)
		var req Report
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			var tooLarge *http.MaxBytesError
			if ok := asMaxBytes(err, &tooLarge); ok {
				httpx.Error(w, http.StatusRequestEntityTooLarge, "report too large")
				return
			}
			httpx.Error(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		if req.ClientID == "" || req.Title == "" {
			httpx.Error(w, http.StatusBadRequest, "client_id and title are required")
			return
		}
		id, err := store.Upsert(r.Context(), auth.UserID(r.Context()), req)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to save report")
			return
		}
		httpx.JSON(w, http.StatusCreated, map[string]string{"id": id})
	})

	mux.HandleFunc("GET /api/debug-reports", func(w http.ResponseWriter, r *http.Request) {
		list, err := store.List(r.Context(), auth.UserID(r.Context()))
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to list reports")
			return
		}
		httpx.JSON(w, http.StatusOK, list)
	})
}

// asMaxBytes keeps errors.As out of the handler's readable path.
func asMaxBytes(err error, target **http.MaxBytesError) bool {
	e, ok := err.(*http.MaxBytesError)
	if ok {
		*target = e
	}
	return ok
}
