package energy

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
)

// PGStore is the Postgres Store. Read-only: it never writes (calories_burned is
// written by the gym package on session complete).
type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// sumByDate runs a "SELECT date::text, SUM(col) ... GROUP BY date" query and
// returns a date→sum map. Missing dates are simply absent (callers treat as 0).
func (s *PGStore) sumByDate(ctx context.Context, query, userID, from, to string) (map[string]float64, error) {
	rows, err := s.q.Query(ctx, query, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]float64{}
	for rows.Next() {
		var date string
		var sum float64
		if err := rows.Scan(&date, &sum); err != nil {
			return nil, err
		}
		out[date] = sum
	}
	return out, rows.Err()
}

func (s *PGStore) IntakeByDate(ctx context.Context, userID, from, to string) (map[string]float64, error) {
	return s.sumByDate(ctx, `
		SELECT date::text, COALESCE(SUM(calories), 0)
		FROM food_logs
		WHERE user_id = $1 AND date BETWEEN $2::date AND $3::date
		GROUP BY date`, userID, from, to)
}

func (s *PGStore) ExerciseCaloriesByDate(ctx context.Context, userID, from, to string) (map[string]float64, error) {
	return s.sumByDate(ctx, `
		SELECT date::text, COALESCE(SUM(calories_burned), 0)
		FROM gym_sessions
		WHERE user_id = $1 AND date BETWEEN $2::date AND $3::date AND calories_burned IS NOT NULL
		GROUP BY date`, userID, from, to)
}

// BodyStats reads the onboarding row and normalizes height→cm, weight→kg. Returns
// nil when there's no row, or when age/height/weight are incomplete (BMR needs
// all three); sex is optional (BMR defaults it).
func (s *PGStore) BodyStats(ctx context.Context, userID string) (*BodyStats, error) {
	var (
		age                   *int
		sex, heightU, weightU *string
		height, weight        *float64
	)
	err := s.q.QueryRow(ctx, `
		SELECT age, sex, height, height_unit, weight, weight_unit
		FROM onboarding WHERE user_id = $1`, userID).
		Scan(&age, &sex, &height, &heightU, &weight, &weightU)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if age == nil || height == nil || weight == nil {
		return nil, nil
	}
	heightCm := *height
	if heightU != nil && *heightU == "in" {
		heightCm *= 2.54
	}
	weightKg := *weight
	if weightU != nil && *weightU == "lb" {
		weightKg *= 0.453592
	}
	bs := &BodyStats{Age: *age, HeightCm: heightCm, WeightKg: weightKg}
	if sex != nil {
		bs.Sex = *sex
	}
	return bs, nil
}

func (s *PGStore) CalorieTarget(ctx context.Context, userID string) (*float64, error) {
	var target *float64
	err := s.q.QueryRow(ctx,
		`SELECT calorie_target FROM goals WHERE user_id = $1`, userID).Scan(&target)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return target, nil
}
