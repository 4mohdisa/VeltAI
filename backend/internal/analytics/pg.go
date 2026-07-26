package analytics

import (
	"context"

	"lumo/backend/internal/db"
)

type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q} }

// InsertEvents writes the batch atomically.
// ponytail: loop in a tx (≤50 rows) — switch to unnest/pgx.Batch if ingest volume matters.
func (s *PGStore) InsertEvents(ctx context.Context, userID string, events []Event) error {
	tx, err := s.q.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	for _, e := range events {
		if _, err := tx.Exec(ctx,
			`INSERT INTO analytics_events (user_id, event_name, properties, session_id, client_ts)
			 VALUES ($1, $2, $3, $4, $5)`,
			userID, e.Name, e.Properties, e.SessionID, e.ClientTS); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
