package gym

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
)

// exerciseReadCols is the full gym_exercises projection (incl. the Phase 12
// parameter columns), aliased `e.` so it works both standalone and joined to
// gym_sessions. uuid columns cast to text so they scan as strings.
const exerciseReadCols = `e.id::text, e.session_id::text, e.name, e.sets, e.reps, e.weight, e.weight_unit, e.rest_seconds, e.notes, e.created_at, e.parameters, e.calorie_formula, e.computed_met, e.rpe, e.exercise_library_id::text, e.exercise_type, e.duration_minutes`

// scanExercise reads one gym_exercises row (exerciseReadCols order). extra is an
// optional trailing column (the owning user id) appended for GetExercise.
func scanExercise(row pgx.Row, e *Exercise, extra ...any) error {
	dst := []any{&e.ID, &e.SessionID, &e.Name, &e.Sets, &e.Reps, &e.Weight, &e.WeightUnit,
		&e.RestSeconds, &e.Notes, &e.CreatedAt, &e.Parameters, &e.CalorieFormula,
		&e.ComputedMET, &e.RPE, &e.ExerciseLibraryID, &e.ExerciseType, &e.DurationMinutes}
	return row.Scan(append(dst, extra...)...)
}

// jsonbArg renders a json.RawMessage as a jsonb argument (nil when empty).
func jsonbArg(raw json.RawMessage) any {
	if len(raw) == 0 {
		return nil
	}
	return string(raw)
}

// PGStore is the Postgres Store. uuid/date columns are cast to text in SQL so
// everything scans as plain strings; id::text = $1 also means a garbage path
// id matches nothing (404) instead of erroring on a uuid cast.
type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q} }

func (p *PGStore) ensureProfile(ctx context.Context, userID string) error {
	_, err := p.q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

const sessionCols = `id::text, user_id, date::text, name, notes, duration_minutes, created_at`

func (p *PGStore) ListSessions(ctx context.Context, userID, from, to string) ([]Session, error) {
	rows, err := p.q.Query(ctx, `
		SELECT `+sessionCols+`
		FROM gym_sessions
		WHERE user_id = $1
		  AND date >= coalesce(nullif($2, '')::date, date)
		  AND date <= coalesce(nullif($3, '')::date, date)
		ORDER BY date DESC, created_at DESC`, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Session{}
	ids := []string{}
	for rows.Next() {
		var s Session
		if err := rows.Scan(&s.ID, &s.UserID, &s.Date, &s.Name, &s.Notes, &s.DurationMinutes, &s.CreatedAt); err != nil {
			return nil, err
		}
		s.Exercises = []Exercise{}
		out = append(out, s)
		ids = append(ids, s.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return out, nil
	}
	bySession, err := p.exercisesFor(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range out {
		if ex := bySession[out[i].ID]; ex != nil {
			out[i].Exercises = ex
		}
	}
	return out, nil
}

func (p *PGStore) exercisesFor(ctx context.Context, sessionIDs []string) (map[string][]Exercise, error) {
	rows, err := p.q.Query(ctx, `
		SELECT `+exerciseReadCols+`
		FROM gym_exercises e
		WHERE e.session_id = ANY($1::uuid[])
		ORDER BY e.created_at, e.id`, sessionIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string][]Exercise{}
	for rows.Next() {
		var e Exercise
		if err := scanExercise(rows, &e); err != nil {
			return nil, err
		}
		out[e.SessionID] = append(out[e.SessionID], e)
	}
	return out, rows.Err()
}

func (p *PGStore) CreateSession(ctx context.Context, s *Session) error {
	if err := p.ensureProfile(ctx, s.UserID); err != nil {
		return err
	}
	// Idempotent path: a replayed offline write (same key) returns the existing
	// session rather than duplicating (re-bumping the streak on the same date is
	// itself a no-op, so the caller can safely proceed).
	if s.IdempotencyKey != "" {
		err := p.q.QueryRow(ctx, `
			INSERT INTO gym_sessions (user_id, date, name, notes, duration_minutes, idempotency_key)
			VALUES ($1, $2::date, $3, $4, $5, $6)
			ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
			RETURNING id::text, created_at`,
			s.UserID, s.Date, s.Name, s.Notes, s.DurationMinutes, s.IdempotencyKey).
			Scan(&s.ID, &s.CreatedAt)
		if errors.Is(err, pgx.ErrNoRows) {
			return p.q.QueryRow(ctx,
				`SELECT id::text, created_at FROM gym_sessions WHERE user_id = $1 AND idempotency_key = $2`,
				s.UserID, s.IdempotencyKey).Scan(&s.ID, &s.CreatedAt)
		}
		return err
	}
	return p.q.QueryRow(ctx, `
		INSERT INTO gym_sessions (user_id, date, name, notes, duration_minutes)
		VALUES ($1, $2::date, $3, $4, $5)
		RETURNING id::text, created_at`,
		s.UserID, s.Date, s.Name, s.Notes, s.DurationMinutes).
		Scan(&s.ID, &s.CreatedAt)
}

func (p *PGStore) GetSession(ctx context.Context, id string) (*Session, error) {
	var s Session
	err := p.q.QueryRow(ctx, `SELECT `+sessionCols+` FROM gym_sessions WHERE id::text = $1`, id).
		Scan(&s.ID, &s.UserID, &s.Date, &s.Name, &s.Notes, &s.DurationMinutes, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	s.Exercises = []Exercise{}
	bySession, err := p.exercisesFor(ctx, []string{s.ID})
	if err != nil {
		return nil, err
	}
	if ex := bySession[s.ID]; ex != nil {
		s.Exercises = ex
	}
	return &s, nil
}

func (p *PGStore) UpdateSession(ctx context.Context, s *Session) error {
	_, err := p.q.Exec(ctx, `
		UPDATE gym_sessions
		SET date = $2::date, name = $3, notes = $4, duration_minutes = $5
		WHERE id::text = $1`,
		s.ID, s.Date, s.Name, s.Notes, s.DurationMinutes)
	return err
}

func (p *PGStore) DeleteSession(ctx context.Context, id string) error {
	// gym_exercises cascade via FK.
	_, err := p.q.Exec(ctx, `DELETE FROM gym_sessions WHERE id::text = $1`, id)
	return err
}

func (p *PGStore) CreateExercise(ctx context.Context, e *Exercise) error {
	return p.q.QueryRow(ctx, `
		INSERT INTO gym_exercises
			(session_id, name, sets, reps, weight, weight_unit, rest_seconds, notes,
			 parameters, calorie_formula, computed_met, rpe, exercise_library_id, exercise_type, duration_minutes)
		VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8,
			$9::jsonb, $10, $11, $12, $13::uuid, COALESCE($14, 'strength'), $15)
		RETURNING id::text, created_at`,
		e.SessionID, e.Name, e.Sets, e.Reps, e.Weight, e.WeightUnit, e.RestSeconds, e.Notes,
		jsonbArg(e.Parameters), e.CalorieFormula, e.ComputedMET, e.RPE, e.ExerciseLibraryID, e.ExerciseType, e.DurationMinutes).
		Scan(&e.ID, &e.CreatedAt)
}

func (p *PGStore) GetExercise(ctx context.Context, id string) (*Exercise, string, error) {
	var (
		e     Exercise
		owner string
	)
	err := scanExercise(p.q.QueryRow(ctx, `
		SELECT `+exerciseReadCols+`, s.user_id
		FROM gym_exercises e
		JOIN gym_sessions s ON s.id = e.session_id
		WHERE e.id::text = $1`, id), &e, &owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, "", ErrNotFound
	}
	if err != nil {
		return nil, "", err
	}
	return &e, owner, nil
}

func (p *PGStore) UpdateExercise(ctx context.Context, e *Exercise) error {
	_, err := p.q.Exec(ctx, `
		UPDATE gym_exercises
		SET name = $2, sets = $3, reps = $4, weight = $5, weight_unit = $6, rest_seconds = $7, notes = $8,
		    parameters = $9::jsonb, calorie_formula = $10, computed_met = $11, rpe = $12,
		    exercise_library_id = COALESCE($13::uuid, exercise_library_id),
		    exercise_type = COALESCE($14, exercise_type),
		    duration_minutes = $15
		WHERE id::text = $1`,
		e.ID, e.Name, e.Sets, e.Reps, e.Weight, e.WeightUnit, e.RestSeconds, e.Notes,
		jsonbArg(e.Parameters), e.CalorieFormula, e.ComputedMET, e.RPE, e.ExerciseLibraryID, e.ExerciseType, e.DurationMinutes)
	return err
}

func (p *PGStore) DeleteExercise(ctx context.Context, id string) error {
	_, err := p.q.Exec(ctx, `DELETE FROM gym_exercises WHERE id::text = $1`, id)
	return err
}

func (p *PGStore) GetStreak(ctx context.Context, userID string) (Streak, error) {
	var st Streak
	err := p.q.QueryRow(ctx, `
		SELECT current_streak, longest_streak, last_gym_date::text, freeze_used, last_freeze_date::text
		FROM gym_streaks WHERE user_id = $1`, userID).
		Scan(&st.CurrentStreak, &st.LongestStreak, &st.LastGymDate, &st.FreezeUsed, &st.LastFreezeDate)
	if errors.Is(err, pgx.ErrNoRows) {
		return Streak{}, nil
	}
	return st, err
}

func (p *PGStore) SaveStreak(ctx context.Context, userID string, st Streak) error {
	if err := p.ensureProfile(ctx, userID); err != nil {
		return err
	}
	_, err := p.q.Exec(ctx, `
		INSERT INTO gym_streaks (user_id, current_streak, longest_streak, last_gym_date, freeze_used, last_freeze_date, updated_at)
		VALUES ($1, $2, $3, $4::date, $5, $6::date, now())
		ON CONFLICT (user_id) DO UPDATE SET
			current_streak   = excluded.current_streak,
			longest_streak   = excluded.longest_streak,
			last_gym_date    = excluded.last_gym_date,
			freeze_used      = excluded.freeze_used,
			last_freeze_date = excluded.last_freeze_date,
			updated_at       = now()`,
		userID, st.CurrentStreak, st.LongestStreak, st.LastGymDate, st.FreezeUsed, st.LastFreezeDate)
	return err
}
