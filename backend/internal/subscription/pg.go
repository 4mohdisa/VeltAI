package subscription

import (
	"context"
	"errors"

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

func (s *PGStore) Upsert(ctx context.Context, sub Sub) error {
	// Guard against webhook arriving before the Clerk profile sync.
	if _, err := s.q.Exec(ctx,
		`INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, sub.UserID); err != nil {
		return err
	}
	_, err := s.q.Exec(ctx,
		`INSERT INTO subscriptions (user_id, platform, status, plan_interval, expires_at, revenuecat_user_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (user_id) DO UPDATE SET
		   platform = EXCLUDED.platform,
		   status = EXCLUDED.status,
		   plan_interval = EXCLUDED.plan_interval,
		   expires_at = EXCLUDED.expires_at,
		   revenuecat_user_id = EXCLUDED.revenuecat_user_id,
		   updated_at = now()`,
		sub.UserID, sub.Platform, sub.Status, sub.PlanInterval, sub.ExpiresAt, sub.RevenueCatUserID)
	return err
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
