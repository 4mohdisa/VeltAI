package push

import (
	"context"

	"lume/backend/internal/db"
)

// Store persists push tokens.
type Store interface {
	// Upsert binds token to userID, moving it from any other account.
	Upsert(ctx context.Context, userID string, r Request) error
	// Delete removes token only when userID owns it.
	Delete(ctx context.Context, userID, token string) error
}

// PGStore is the Postgres Store.
type PGStore struct{ q db.Querier }

// NewPGStore returns a Postgres-backed store.
func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// Upsert writes the token for userID. A token already on file moves to userID:
// the device that holds it has signed in to this account.
func (s *PGStore) Upsert(ctx context.Context, userID string, r Request) error {
	_, err := s.q.Exec(ctx, `
		INSERT INTO push_tokens (user_id, token, platform)
		VALUES ($1, $2, $3)
		ON CONFLICT (token) DO UPDATE
		SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = now()`,
		userID, r.Token, r.Platform)
	return err
}

// Delete removes the token if userID owns it; another user's token is left alone.
func (s *PGStore) Delete(ctx context.Context, userID, token string) error {
	_, err := s.q.Exec(ctx, `DELETE FROM push_tokens WHERE user_id = $1 AND token = $2`, userID, token)
	return err
}
