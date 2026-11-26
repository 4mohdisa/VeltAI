// Package retention serves the "thinking of leaving" usage summary and the
// Apple Retention Messaging hooks. Everything here is counts or fixed copy:
// no food names, body or health values, or email ever leave this package.
package retention

import (
	"context"

	"lume/backend/internal/db"
)

// WindowDays is how far back the summary counts, today included.
const WindowDays = 30

// Summary is the whole GET /api/retention/summary payload: counts only.
type Summary struct {
	MealsLast30Days    int `json:"meals_last_30_days"`
	WorkoutsLast30Days int `json:"workouts_last_30_days"`
	CurrentStreakDays  int `json:"current_streak_days"`
}

// Store reads a user's summary for the window ending on today (YYYY-MM-DD).
type Store interface {
	Summary(ctx context.Context, userID, today string) (Summary, error)
}

// PGStore is the Postgres Store.
type PGStore struct{ q db.Querier }

// NewPGStore returns a Postgres-backed store.
func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// Summary counts confirmed meals (one per day and meal type) and workouts in
// the window, and reads the streak the Gym screen shows (gym_streaks).
func (s *PGStore) Summary(ctx context.Context, userID, today string) (Summary, error) {
	var out Summary
	err := s.q.QueryRow(ctx, `
		SELECT
		  (SELECT count(DISTINCT (date, coalesce(meal_type, ''))) FROM food_logs
		    WHERE user_id = $1 AND status = 'confirmed'
		      AND date BETWEEN $2::date - ($3::int - 1) AND $2::date),
		  (SELECT count(*) FROM gym_sessions
		    WHERE user_id = $1 AND date BETWEEN $2::date - ($3::int - 1) AND $2::date),
		  coalesce((SELECT current_streak FROM gym_streaks WHERE user_id = $1), 0)`,
		userID, today, WindowDays).Scan(&out.MealsLast30Days, &out.WorkoutsLast30Days, &out.CurrentStreakDays)
	return out, err
}
