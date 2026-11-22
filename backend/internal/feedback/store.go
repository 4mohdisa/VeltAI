package feedback

import (
	"context"

	"lume/backend/internal/db"
)

// Store persists feedback.
type Store interface {
	Insert(ctx context.Context, userID string, f Feedback) (string, error)
}

// PGStore is the Postgres Store.
type PGStore struct{ q db.Querier }

// NewPGStore returns a Postgres-backed store.
func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// Insert writes one message for userID and returns its id.
func (s *PGStore) Insert(ctx context.Context, userID string, f Feedback) (string, error) {
	var id string
	err := s.q.QueryRow(ctx, `
		INSERT INTO feedback (user_id, category, message, app_version, device_model)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id::text`,
		userID, f.Category, f.Message, f.AppVersion, f.DeviceModel).Scan(&id)
	return id, err
}
