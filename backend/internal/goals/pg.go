package goals

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/ai"
	"lumo/backend/internal/cuisine"
	"lumo/backend/internal/db"
)

type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// ensureProfile guarantees the profiles FK target exists before user-owned
// writes (the Clerk webhook may not have synced the user yet). Takes an
// explicit Querier so callers inside a transaction can pass their tx.
func (s *PGStore) ensureProfile(ctx context.Context, q db.Querier, userID string) error {
	_, err := q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

const onboardingCols = `id::text, user_id, completed, age, sex, height, height_unit, weight, weight_unit, activity_level, goal, body_type, created_at`

func scanOnboarding(row pgx.Row) (*Onboarding, error) {
	var o Onboarding
	err := row.Scan(&o.ID, &o.UserID, &o.Completed, &o.Age, &o.Sex, &o.Height, &o.HeightUnit,
		&o.Weight, &o.WeightUnit, &o.ActivityLevel, &o.Goal, &o.BodyType, &o.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (s *PGStore) GetOnboarding(ctx context.Context, userID string) (*Onboarding, error) {
	return scanOnboarding(s.q.QueryRow(ctx,
		`SELECT `+onboardingCols+` FROM onboarding WHERE user_id = $1`, userID))
}

const goalsCols = `id::text, user_id, calorie_target, protein_target, carb_target, fat_target, fibre_target, weight_goal, target_weight, weight_unit, activity_level, source, created_at, updated_at`

func scanGoals(row pgx.Row) (*Goals, error) {
	var g Goals
	err := row.Scan(&g.ID, &g.UserID, &g.CalorieTarget, &g.ProteinTarget, &g.CarbTarget,
		&g.FatTarget, &g.FibreTarget, &g.WeightGoal, &g.TargetWeight, &g.WeightUnit,
		&g.ActivityLevel, &g.Source, &g.CreatedAt, &g.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (s *PGStore) GetGoals(ctx context.Context, userID string) (*Goals, error) {
	return scanGoals(s.q.QueryRow(ctx,
		`SELECT `+goalsCols+` FROM goals WHERE user_id = $1`, userID))
}

// UpsertGoals writes the full row; the handler merges partial updates first.
func (s *PGStore) UpsertGoals(ctx context.Context, g *Goals) (*Goals, error) {
	if err := s.ensureProfile(ctx, s.q, g.UserID); err != nil {
		return nil, err
	}
	return upsertGoals(ctx, s.q, g)
}

// upsertGoals runs the goals upsert against whatever Querier it's given (the
// pool or an in-flight tx), so CompleteOnboarding can reuse it inside its
// transaction.
func upsertGoals(ctx context.Context, q db.Querier, g *Goals) (*Goals, error) {
	return scanGoals(q.QueryRow(ctx, `
		INSERT INTO goals (user_id, calorie_target, protein_target, carb_target, fat_target, fibre_target, weight_goal, target_weight, weight_unit, activity_level, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (user_id) DO UPDATE SET
			calorie_target = EXCLUDED.calorie_target,
			protein_target = EXCLUDED.protein_target,
			carb_target = EXCLUDED.carb_target,
			fat_target = EXCLUDED.fat_target,
			fibre_target = EXCLUDED.fibre_target,
			weight_goal = EXCLUDED.weight_goal,
			target_weight = EXCLUDED.target_weight,
			weight_unit = EXCLUDED.weight_unit,
			activity_level = EXCLUDED.activity_level,
			source = EXCLUDED.source,
			updated_at = now()
		RETURNING `+goalsCols,
		g.UserID, g.CalorieTarget, g.ProteinTarget, g.CarbTarget, g.FatTarget,
		g.FibreTarget, g.WeightGoal, g.TargetWeight, g.WeightUnit, g.ActivityLevel, g.Source))
}

// dietaryColumn maps a recognized dietary_requirements string to the
// cuisine_food_library boolean column that must be true for a seeded-food
// match. Requirement strings outside this set are ignored, not an error.
var dietaryColumn = map[string]string{
	"halal":       "is_halal",
	"vegetarian":  "is_vegetarian",
	"vegan":       "is_vegan",
	"gluten_free": "is_gluten_free",
}

// parseHourString parses an "HH:MM" 24h clock string into a fractional hour
// ("18:30" -> 18.5); malformed input yields 0. Duplicated from the
// unexported copy in internal/ai — not worth exporting for one extra caller.
func parseHourString(s string) float64 {
	h, m, ok := strings.Cut(s, ":")
	if !ok {
		return 0
	}
	hh, err1 := strconv.Atoi(h)
	mm, err2 := strconv.Atoi(m)
	if err1 != nil || err2 != nil {
		return 0
	}
	return float64(hh) + float64(mm)/60
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// CompleteOnboarding upserts onboarding, derives+upserts goals, upserts
// cuisine preferences, bulk-seeds saved_foods from the cuisine library, and
// primes ai_user_brain with cuisine-informed priors — all in one
// transaction, so a failure anywhere leaves no partial state.
func (s *PGStore) CompleteOnboarding(ctx context.Context, in OnboardingCompletion) (*Onboarding, *Goals, error) {
	tx, err := s.q.Begin(ctx)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback(ctx) // no-op once committed

	if err := s.ensureProfile(ctx, tx, in.UserID); err != nil {
		return nil, nil, err
	}

	ob, err := scanOnboarding(tx.QueryRow(ctx, `
		INSERT INTO onboarding (user_id, completed, age, sex, height, height_unit, weight, weight_unit, activity_level, goal, body_type)
		VALUES ($1, true, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id) DO UPDATE SET
			completed = EXCLUDED.completed,
			age = EXCLUDED.age,
			sex = EXCLUDED.sex,
			height = EXCLUDED.height,
			height_unit = EXCLUDED.height_unit,
			weight = EXCLUDED.weight,
			weight_unit = EXCLUDED.weight_unit,
			activity_level = EXCLUDED.activity_level,
			goal = EXCLUDED.goal,
			body_type = EXCLUDED.body_type
		RETURNING `+onboardingCols,
		in.UserID, in.Age, in.Sex, in.Height, nilIfEmpty(in.HeightUnit),
		in.Weight, nilIfEmpty(in.WeightUnit), in.ActivityLevel, in.Goal, nilIfEmpty(in.BodyType)))
	if err != nil {
		return nil, nil, err
	}

	d := DeriveGoals(DeriveInput{
		Age: in.Age, Sex: in.Sex, Height: in.Height, HeightUnit: in.HeightUnit,
		Weight: in.Weight, WeightUnit: in.WeightUnit, ActivityLevel: in.ActivityLevel, Goal: in.Goal,
	})
	src := "onboarding"
	gl, err := upsertGoals(ctx, tx, &Goals{
		UserID:        in.UserID,
		CalorieTarget: fptr(d.Calories),
		ProteinTarget: fptr(d.Protein),
		CarbTarget:    fptr(d.Carbs),
		FatTarget:     fptr(d.Fat),
		FibreTarget:   fptr(d.Fibre),
		WeightGoal:    &in.Goal,
		ActivityLevel: &in.ActivityLevel,
		Source:        &src,
	})
	if err != nil {
		return nil, nil, err
	}

	cuisines := in.Cuisines
	if cuisines == nil {
		cuisines = []string{}
	}
	dietary := in.DietaryRequirements
	if dietary == nil {
		dietary = []string{}
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO user_cuisine_preferences (user_id, cuisines, dietary_requirements)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id) DO UPDATE SET
			cuisines = excluded.cuisines,
			dietary_requirements = excluded.dietary_requirements,
			updated_at = now()`,
		in.UserID, cuisines, dietary); err != nil {
		return nil, nil, err
	}

	// Dynamic AND clauses per recognized dietary requirement — column names
	// can't be parameterized, so they're appended as literal SQL fragments
	// from the fixed dietaryColumn map (never from raw user input).
	var reqClause strings.Builder
	for _, req := range dietary {
		if col, ok := dietaryColumn[req]; ok {
			reqClause.WriteString(" AND " + col + " = true")
		}
	}
	// DISTINCT ON (food_name) collapses cross-cuisine name collisions (e.g.
	// "Hummus" in both middle_eastern and mediterranean) to one row before the
	// NOT EXISTS dedup runs — Postgres's per-statement snapshot means NOT
	// EXISTS never sees rows this same INSERT...SELECT already produced, so
	// without this a multi-cuisine onboarding call would insert duplicates.
	if _, err := tx.Exec(ctx, `
		INSERT INTO saved_foods (user_id, food_name, brand, calories, protein, carbs, fat, fibre, serving_size, serving_unit)
		SELECT $1, c.food_name, c.brand, c.calories, c.protein, c.carbs, c.fat, c.fibre, c.serving_size, c.serving_unit
		FROM (
			SELECT DISTINCT ON (food_name) food_name, brand, calories, protein, carbs, fat, fibre, serving_size, serving_unit
			FROM cuisine_food_library
			WHERE cuisine = ANY($2::text[])`+reqClause.String()+`
			ORDER BY food_name, cuisine
		) c
		WHERE NOT EXISTS (
			SELECT 1 FROM saved_foods sf WHERE sf.user_id = $1 AND sf.food_name = c.food_name
		)`,
		in.UserID, cuisines); err != nil {
		return nil, nil, err
	}

	// Fetch any already-computed brain before writing — re-onboarding (a
	// profile edit that reposts /api/onboarding) must not clobber weeks of
	// learned eating/gym/goal-adherence data with a thin priors-only brain.
	existingBrain, err := ai.NewPGStore(tx).GetBrain(ctx, in.UserID)
	if err != nil {
		return nil, nil, err
	}

	priors := cuisine.MergePriors(in.Cuisines)
	brain := ai.Brain{
		TypicalDailyCalories: float64(d.Calories),
		TypicalMacros: ai.Macros{
			Protein: float64(d.Protein),
			Carbs:   float64(d.Carbs),
			Fat:     float64(d.Fat),
			Fibre:   float64(d.Fibre),
		},
		MealTimingPatterns: ai.MealTiming{ExpectedDinnerHour: parseHourString(priors.ExpectedDinnerTime)},
		JunkFoodFrequency:  ai.JunkFood{Keywords: priors.JunkFoodKeywords},
		EatingPatterns: ai.EatingPatterns{
			CarbSource: priors.TypicalCarbSource,
			FatSource:  priors.TypicalFatSource,
		},
		LastRebuilt: time.Now(),
	}
	// Re-onboarding: merge the fresh priors into the EXISTING brain instead of
	// overwriting it — only the cuisine/goal-derived fields move, everything
	// learned from real usage (top foods, consistency, gym patterns, goal
	// adherence, scan accuracy) stays untouched.
	reonboarding := existingBrain != nil
	if reonboarding {
		merged := *existingBrain
		merged.TypicalDailyCalories = brain.TypicalDailyCalories
		merged.TypicalMacros = brain.TypicalMacros
		merged.MealTimingPatterns.ExpectedDinnerHour = brain.MealTimingPatterns.ExpectedDinnerHour
		merged.JunkFoodFrequency.Keywords = brain.JunkFoodFrequency.Keywords
		merged.EatingPatterns.CarbSource = brain.EatingPatterns.CarbSource
		merged.EatingPatterns.FatSource = brain.EatingPatterns.FatSource
		merged.LastRebuilt = brain.LastRebuilt
		brain = merged
	}
	if err := ai.NewPGStore(tx).UpsertBrain(ctx, in.UserID, brain); err != nil {
		return nil, nil, err
	}
	if reonboarding {
		// UpsertBrain always sets needs_rebuild = false; flip it back on so the
		// background sweep recomputes a real brain blended with the fresh
		// priors instead of serving this merged-but-still-thin one until 5 more
		// logs land.
		if _, err := tx.Exec(ctx, `UPDATE ai_user_brain SET needs_rebuild = true WHERE user_id = $1`, in.UserID); err != nil {
			return nil, nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, err
	}
	return ob, gl, nil
}

const bodyWeightCols = `id::text, user_id, date::text, weight, unit, notes, created_at`

func (s *PGStore) ListBodyWeight(ctx context.Context, userID string) ([]BodyWeight, error) {
	rows, err := s.q.Query(ctx,
		`SELECT `+bodyWeightCols+` FROM body_weight WHERE user_id = $1 ORDER BY date DESC, created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []BodyWeight
	for rows.Next() {
		var bw BodyWeight
		if err := rows.Scan(&bw.ID, &bw.UserID, &bw.Date, &bw.Weight, &bw.Unit, &bw.Notes, &bw.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, bw)
	}
	return out, rows.Err()
}

func (s *PGStore) CreateBodyWeight(ctx context.Context, bw *BodyWeight) (*BodyWeight, error) {
	if err := s.ensureProfile(ctx, s.q, bw.UserID); err != nil {
		return nil, err
	}
	var saved BodyWeight
	err := s.q.QueryRow(ctx, `
		INSERT INTO body_weight (user_id, date, weight, unit, notes)
		VALUES ($1, $2::date, $3, $4, $5)
		RETURNING `+bodyWeightCols,
		bw.UserID, bw.Date, bw.Weight, bw.Unit, bw.Notes).
		Scan(&saved.ID, &saved.UserID, &saved.Date, &saved.Weight, &saved.Unit, &saved.Notes, &saved.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &saved, nil
}

// id::text comparison avoids uuid parse errors on garbage path params.
func (s *PGStore) GetBodyWeight(ctx context.Context, id string) (*BodyWeight, error) {
	var bw BodyWeight
	err := s.q.QueryRow(ctx,
		`SELECT `+bodyWeightCols+` FROM body_weight WHERE id::text = $1`, id).
		Scan(&bw.ID, &bw.UserID, &bw.Date, &bw.Weight, &bw.Unit, &bw.Notes, &bw.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &bw, nil
}

func (s *PGStore) DeleteBodyWeight(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, `DELETE FROM body_weight WHERE id::text = $1`, id)
	return err
}
