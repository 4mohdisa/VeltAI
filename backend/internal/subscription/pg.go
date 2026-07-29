package subscription

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
)

type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q} }

func (s *PGStore) Get(ctx context.Context, userID string) (Sub, error) {
	var sub Sub
	err := s.q.QueryRow(ctx,
		`SELECT user_id, platform, status, plan_interval, expires_at, revenuecat_user_id
		 FROM subscriptions WHERE user_id = $1`, userID).
		Scan(&sub.UserID, &sub.Platform, &sub.Status, &sub.PlanInterval, &sub.ExpiresAt, &sub.RevenueCatUserID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Sub{}, ErrNotFound
	}
	return sub, err
}

// ClaimEventSQL is the replay guard: the INSERT itself is the check. Whoever
// inserts the row owns the event; everyone else gets 0 rows affected and is a
// replay. No SELECT ... IF NOT EXISTS, which two concurrent deliveries both pass.
const ClaimEventSQL = `INSERT INTO webhook_processed_events (provider, event_id)
	VALUES ($1, $2) ON CONFLICT (provider, event_id) DO NOTHING`

// UpsertIfNewerSQL compares the incoming event timestamp against the stored one
// and writes in ONE statement, so two concurrent deliveries for the same user
// serialize on the row lock and only the newer survives. A NULL column is a row
// written before this guard existed; equal timestamps are allowed through (the
// event id already proved this is not the same delivery twice).
const UpsertIfNewerSQL = `INSERT INTO subscriptions
	 (user_id, platform, status, plan_interval, expires_at, revenuecat_user_id, last_event_ts_ms)
	 VALUES ($1, $2, $3, $4, $5, $6, $7)
	 ON CONFLICT (user_id) DO UPDATE SET
	   platform = EXCLUDED.platform,
	   status = EXCLUDED.status,
	   plan_interval = EXCLUDED.plan_interval,
	   expires_at = EXCLUDED.expires_at,
	   revenuecat_user_id = EXCLUDED.revenuecat_user_id,
	   last_event_ts_ms = EXCLUDED.last_event_ts_ms,
	   updated_at = now()
	 WHERE subscriptions.last_event_ts_ms IS NULL
	    OR subscriptions.last_event_ts_ms <= EXCLUDED.last_event_ts_ms`

// eventRetention is how long a processed-event row stays useful. Past
// maxEventAge the age bound rejects the delivery anyway, so keeping the row
// buys nothing; the margin covers clock skew between us and the provider.
const eventRetention = 2 * maxEventAge

func (s *PGStore) ClaimEvent(ctx context.Context, provider, eventID string) (bool, error) {
	tag, err := s.q.Exec(ctx, ClaimEventSQL, provider, eventID)
	if err != nil {
		return false, err
	}
	// ponytail: retention runs inline on the claim — webhooks are low-volume, so
	// one extra indexed DELETE per event is cheaper than a cron nobody maintains.
	// Best-effort: a failed sweep must not reject a real revenue event.
	if _, err := s.q.Exec(ctx,
		`DELETE FROM webhook_processed_events WHERE processed_at < $1`,
		time.Now().Add(-eventRetention)); err != nil {
		log.Printf("subscription: processed-event sweep failed: %v", err)
	}
	return tag.RowsAffected() > 0, nil
}

func (s *PGStore) ReleaseEvent(ctx context.Context, provider, eventID string) error {
	_, err := s.q.Exec(ctx,
		`DELETE FROM webhook_processed_events WHERE provider = $1 AND event_id = $2`, provider, eventID)
	return err
}

func (s *PGStore) UpsertIfNewer(ctx context.Context, sub Sub, eventTSMs int64) (bool, error) {
	// Guard against webhook arriving before the Clerk profile sync.
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, sub.UserID); err != nil {
		return false, err
	}
	tag, err := s.q.Exec(ctx, UpsertIfNewerSQL,
		sub.UserID, sub.Platform, sub.Status, sub.PlanInterval, sub.ExpiresAt, sub.RevenueCatUserID, eventTSMs)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

// Transfer re-keys a subscription row to a new user (RevenueCat TRANSFER event).
//
// PRECONDITION, enforced by the webhook handler: the source row exists and is
// active, and the target holds no ACTIVE subscription. This deletes the target's
// row, so calling it without those checks lets an attacker-shaped event wipe a
// paying user.
func (s *PGStore) Transfer(ctx context.Context, fromUserID, toUserID string) error {
	// Guard against the target profile not existing yet (same as Upsert).
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, toUserID); err != nil {
		return err
	}
	// Drop any stale row for the target so the unique(user_id) update can't conflict.
	if _, err := s.q.Exec(ctx,
		`DELETE FROM subscriptions WHERE user_id = $1`, toUserID); err != nil {
		return err
	}
	_, err := s.q.Exec(ctx,
		`UPDATE subscriptions SET user_id = $2, updated_at = now() WHERE user_id = $1`,
		fromUserID, toUserID)
	return err
}
