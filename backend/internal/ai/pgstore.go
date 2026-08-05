package ai

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/db"
)

type PGStore struct{ q db.Querier }

var _ Store = (*PGStore)(nil)

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// ensureProfile keeps user-owned inserts from hitting the profiles FK before
// the Clerk webhook has synced the user.
func (s *PGStore) ensureProfile(ctx context.Context, userID string) error {
	_, err := s.q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

func (s *PGStore) FoodLogs(ctx context.Context, userID string) ([]FoodLogRow, error) {
	rows, err := s.q.Query(ctx, `
		SELECT date, coalesce(meal_type, ''), food_name, calories, protein, carbs, fat, fibre, created_at
		FROM food_logs
		WHERE user_id = $1 AND date >= current_date - 29
		ORDER BY date, created_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []FoodLogRow
	for rows.Next() {
		var r FoodLogRow
		if err := rows.Scan(&r.Date, &r.MealType, &r.FoodName, &r.Calories, &r.Protein, &r.Carbs, &r.Fat, &r.Fibre, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PGStore) GymSessions(ctx context.Context, userID string) ([]GymSessionRow, error) {
	rows, err := s.q.Query(ctx, `
		SELECT date, coalesce(duration_minutes, 0), created_at
		FROM gym_sessions
		WHERE user_id = $1 AND date >= current_date - 27
		ORDER BY date`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []GymSessionRow
	for rows.Next() {
		var r GymSessionRow
		if err := rows.Scan(&r.Date, &r.DurationMinutes, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PGStore) Goals(ctx context.Context, userID string) (*GoalRow, error) {
	var g GoalRow
	err := s.q.QueryRow(ctx, `
		SELECT calorie_target, protein_target, carb_target, fat_target, fibre_target, weight_goal
		FROM goals WHERE user_id = $1`, userID).
		Scan(&g.CalorieTarget, &g.ProteinTarget, &g.CarbTarget, &g.FatTarget, &g.FibreTarget, &g.WeightGoal)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (s *PGStore) Streak(ctx context.Context, userID string) (*StreakRow, error) {
	var r StreakRow
	err := s.q.QueryRow(ctx, `
		SELECT current_streak, longest_streak, freeze_used
		FROM gym_streaks WHERE user_id = $1`, userID).
		Scan(&r.CurrentStreak, &r.LongestStreak, &r.FreezeUsed)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *PGStore) Weights(ctx context.Context, userID string) ([]WeightRow, error) {
	rows, err := s.q.Query(ctx, `
		SELECT date, weight
		FROM body_weight
		WHERE user_id = $1 AND date >= current_date - 29
		ORDER BY date`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []WeightRow
	for rows.Next() {
		var r WeightRow
		if err := rows.Scan(&r.Date, &r.Weight); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PGStore) UpsertBrain(ctx context.Context, userID string, b Brain) error {
	if err := s.ensureProfile(ctx, userID); err != nil {
		return err
	}
	eat, _ := json.Marshal(b.EatingPatterns)
	gym, _ := json.Marshal(b.GymPatterns)
	macros, _ := json.Marshal(b.TypicalMacros)
	timing, _ := json.Marshal(b.MealTimingPatterns)
	junk, _ := json.Marshal(b.JunkFoodFrequency)
	// insights_cache reuses an existing column to carry ScanAccuracyProfile;
	// nil profile -> NULL, not "null" or "{}".
	var insightsCache any
	if b.ScanAccuracyProfile != nil {
		buf, _ := json.Marshal(b.ScanAccuracyProfile)
		insightsCache = string(buf)
	}
	_, err := s.q.Exec(ctx, `
		INSERT INTO ai_user_brain (user_id, eating_patterns, gym_patterns, typical_daily_calories,
			typical_macros, meal_timing_patterns, junk_food_frequency, goal_adherence_score, insights_cache, last_rebuilt, updated_at)
		VALUES ($1, $2::jsonb, $3::jsonb, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9::jsonb, $10, now())
		ON CONFLICT (user_id) DO UPDATE SET
			eating_patterns = excluded.eating_patterns,
			gym_patterns = excluded.gym_patterns,
			typical_daily_calories = excluded.typical_daily_calories,
			typical_macros = excluded.typical_macros,
			meal_timing_patterns = excluded.meal_timing_patterns,
			junk_food_frequency = excluded.junk_food_frequency,
			goal_adherence_score = excluded.goal_adherence_score,
			insights_cache = excluded.insights_cache,
			needs_rebuild = false,
			last_rebuilt = excluded.last_rebuilt,
			updated_at = now()`,
		userID, string(eat), string(gym), b.TypicalDailyCalories,
		string(macros), string(timing), string(junk), b.GoalAdherenceScore, insightsCache, b.LastRebuilt)
	return err
}

func (s *PGStore) GetBrain(ctx context.Context, userID string) (*Brain, error) {
	var (
		b                                     Brain
		eat, gym, macros, timing, junk, cache []byte
		last                                  *time.Time
	)
	err := s.q.QueryRow(ctx, `
		SELECT eating_patterns, gym_patterns, coalesce(typical_daily_calories, 0),
			typical_macros, meal_timing_patterns, junk_food_frequency,
			coalesce(goal_adherence_score, 0), insights_cache, last_rebuilt
		FROM ai_user_brain WHERE user_id = $1`, userID).
		Scan(&eat, &gym, &b.TypicalDailyCalories, &macros, &timing, &junk, &b.GoalAdherenceScore, &cache, &last)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	for _, p := range []struct {
		src []byte
		dst any
	}{
		{eat, &b.EatingPatterns}, {gym, &b.GymPatterns}, {macros, &b.TypicalMacros},
		{timing, &b.MealTimingPatterns}, {junk, &b.JunkFoodFrequency},
	} {
		if len(p.src) > 0 {
			_ = json.Unmarshal(p.src, p.dst)
		}
	}
	if len(cache) > 0 {
		var sap ScanAccuracyProfile
		if json.Unmarshal(cache, &sap) == nil {
			b.ScanAccuracyProfile = &sap
		}
	}
	if last != nil {
		b.LastRebuilt = *last
	}
	return &b, nil
}

func (s *PGStore) InsertInsights(ctx context.Context, userID string, ins []Insight) error {
	if err := s.ensureProfile(ctx, userID); err != nil {
		return err
	}
	// Regeneration replaces the active set; dismissed rows survive so
	// dismissals stick. ponytail: DELETE then INSERT without a transaction —
	// a mid-batch failure costs at most one 6h insight cycle.
	if _, err := s.q.Exec(ctx, `DELETE FROM ai_insights WHERE user_id = $1 AND dismissed = false`, userID); err != nil {
		return err
	}
	for _, in := range ins {
		if _, err := s.q.Exec(ctx, `
			INSERT INTO ai_insights (user_id, type, title, body)
			VALUES ($1, $2, $3, $4)`, userID, in.Type, in.Title, in.Body); err != nil {
			return err
		}
	}
	return nil
}

// NewestInsightAt returns the created_at of the user's newest insight in any
// dismissed state, or nil when the user has none. max() over zero rows yields
// a NULL row, which scans into a nil *time.Time.
func (s *PGStore) NewestInsightAt(ctx context.Context, userID string) (*time.Time, error) {
	var at *time.Time
	if err := s.q.QueryRow(ctx, `SELECT max(created_at) FROM ai_insights WHERE user_id = $1`, userID).Scan(&at); err != nil {
		return nil, err
	}
	return at, nil
}

func (s *PGStore) ListInsights(ctx context.Context, userID string) ([]StoredInsight, error) {
	rows, err := s.q.Query(ctx, `
		SELECT id, coalesce(type, ''), title, body, created_at
		FROM ai_insights
		WHERE user_id = $1 AND dismissed = false
		ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []StoredInsight
	for rows.Next() {
		var r StoredInsight
		if err := rows.Scan(&r.ID, &r.Type, &r.Title, &r.Body, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// id::text comparison keeps malformed ids a clean not-found instead of a
// uuid parse error.
func (s *PGStore) GetInsightOwner(ctx context.Context, id string) (string, error) {
	var owner string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM ai_insights WHERE id::text = $1`, id).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return owner, nil
}

func (s *PGStore) DismissInsight(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, `UPDATE ai_insights SET dismissed = true WHERE id::text = $1`, id)
	return err
}

func (s *PGStore) CuisinePreferences(ctx context.Context, userID string) ([]string, error) {
	var cuisines []string
	err := s.q.QueryRow(ctx, `SELECT cuisines FROM user_cuisine_preferences WHERE user_id = $1`, userID).
		Scan(&cuisines)
	if errors.Is(err, pgx.ErrNoRows) {
		return []string{}, nil
	}
	if err != nil {
		return nil, err
	}
	return cuisines, nil
}

func (s *PGStore) ScanCorrections(ctx context.Context, userID string) ([]ScanCorrectionRow, error) {
	rows, err := s.q.Query(ctx, `
		SELECT coalesce(food_name_original, ''), coalesce(weight_original_g, 0),
			coalesce(weight_corrected_g, 0), coalesce(correction_magnitude, 0), created_at
		FROM scan_corrections
		WHERE user_id = $1 AND created_at >= now() - interval '90 days'`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ScanCorrectionRow
	for rows.Next() {
		var r ScanCorrectionRow
		if err := rows.Scan(&r.FoodNameOriginal, &r.WeightOriginalG, &r.WeightCorrectedG, &r.CorrectionMagnitude, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PGStore) UsersNeedingRebuild(ctx context.Context) ([]string, error) {
	// The join on profiles.ai_consent_at is the consent gate for the background
	// sweep (5.1.2(i)). Merely logging five foods flags needs_rebuild, so
	// without this the sweep shipped the brain of any active user to Anthropic
	// whether or not they had ever seen the AI disclosure. A device-local flag
	// cannot gate a job that runs on a timer with no device involved.
	rows, err := s.q.Query(ctx, `
		SELECT b.user_id FROM ai_user_brain b
		JOIN profiles p ON p.id = b.user_id
		WHERE b.needs_rebuild = true
		  AND (b.last_rebuilt IS NULL OR b.last_rebuilt < now() - interval '6 hours')
		  AND p.ai_consent_at IS NOT NULL`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var uid string
		if err := rows.Scan(&uid); err != nil {
			return nil, err
		}
		out = append(out, uid)
	}
	return out, rows.Err()
}

// AIConsentAt returns when the user accepted AI-partner processing, or nil if
// they never did. Every server-side path that sends user data to Gemini or
// Anthropic must refuse on nil — see 5.1.2(i).
func (s *PGStore) AIConsentAt(ctx context.Context, userID string) (*time.Time, error) {
	var at *time.Time
	err := s.q.QueryRow(ctx, "SELECT ai_consent_at FROM profiles WHERE id = $1", userID).Scan(&at)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil // no profile row yet => no consent on record
	}
	return at, err
}

// SetAIConsent records acceptance. First acceptance wins so a re-prompt cannot
// silently move the timestamp forward and obscure when consent was actually
// given.
func (s *PGStore) SetAIConsent(ctx context.Context, userID string) error {
	_, err := s.q.Exec(ctx,
		"UPDATE profiles SET ai_consent_at = COALESCE(ai_consent_at, now()), updated_at = now() WHERE id = $1", userID)
	return err
}

// RevokeAIConsent clears it. The user must be able to withdraw consent, and
// the next sweep must then skip them (5.1.1(i)).
func (s *PGStore) RevokeAIConsent(ctx context.Context, userID string) error {
	_, err := s.q.Exec(ctx, "UPDATE profiles SET ai_consent_at = NULL, updated_at = now() WHERE id = $1", userID)
	return err
}
