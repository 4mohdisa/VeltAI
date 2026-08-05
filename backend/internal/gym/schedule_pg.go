package gym

import (
	"context"
	"encoding/json"
	"errors"
	"math"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
	"lumo/backend/internal/energy"
)

// SchedulePGStore is the Postgres ScheduleStore. Mirrors PGStore's conventions:
// uuid/date columns cast to text so they scan as strings, and `id::text = $1`
// so a garbage path id matches nothing (404) instead of erroring on a cast.
type SchedulePGStore struct{ q db.Querier }

func NewSchedulePGStore(q db.Querier) *SchedulePGStore { return &SchedulePGStore{q} }

func (p *SchedulePGStore) ensureProfile(ctx context.Context, userID string) error {
	_, err := p.q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

// ---------------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------------

const libExerciseCols = `id::text, name, muscle_group_primary, muscle_groups_secondary, category, exercise_type, equipment, difficulty, COALESCE(description, ''), met_value, parameter_schema`

func scanLibraryExercise(row pgx.Row) (*LibraryExercise, error) {
	var e LibraryExercise
	err := row.Scan(&e.ID, &e.Name, &e.MuscleGroupPrimary, &e.MuscleGroupsSecondary,
		&e.Category, &e.ExerciseType, &e.Equipment, &e.Difficulty, &e.Description, &e.MetValue, &e.ParameterSchema)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (p *SchedulePGStore) ListLibraryExercises(ctx context.Context, f ExerciseFilter) ([]LibraryExercise, error) {
	rows, err := p.q.Query(ctx, `
		SELECT `+libExerciseCols+`
		FROM exercise_library
		WHERE ($1 = '' OR category = $1)
		  AND ($2 = '' OR muscle_group_primary = $2)
		  AND ($3 = '' OR exercise_type = $3)
		  AND ($4 = '' OR equipment = $4)
		  AND ($5 = '' OR name ILIKE '%' || $5 || '%')
		ORDER BY name
		LIMIT 200`, f.Category, f.Muscle, f.Type, f.Equipment, f.Q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []LibraryExercise{}
	for rows.Next() {
		e, err := scanLibraryExercise(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (p *SchedulePGStore) GetLibraryExercise(ctx context.Context, id string) (*LibraryExercise, error) {
	e, err := scanLibraryExercise(p.q.QueryRow(ctx,
		`SELECT `+libExerciseCols+` FROM exercise_library WHERE id::text = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return e, err
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const templateCols = `id::text, user_id, name, estimated_duration_minutes, created_at, updated_at`

func scanTemplate(row pgx.Row) (*WorkoutTemplate, error) {
	var t WorkoutTemplate
	err := row.Scan(&t.ID, &t.UserID, &t.Name, &t.EstimatedDurationMinutes, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Exercises = []TemplateExercise{}
	return &t, nil
}

// The projection is split from the FROM clause so a caller that needs an extra
// column (GetTemplateExercise wants the owning template's user_id) can insert
// it into the select list instead of appending after FROM, which is not valid
// SQL. Appending a JOIN without widening the select list is exactly the bug
// that made the three template-exercise routes 500 on every request: 22 columns
// returned, 23 Scan destinations, and pgx fails that unconditionally.
const templateExerciseCols = `
	SELECT te.id::text, te.template_id::text, te.exercise_id::text,
	       te.planned_sets, te.planned_reps, te.planned_weight, te.planned_weight_unit,
	       te.planned_duration_minutes, te.rest_seconds, te.sort_order, te.created_at,
	       el.id::text, el.name, el.muscle_group_primary, el.muscle_groups_secondary,
	       el.category, el.exercise_type, el.equipment, el.difficulty, COALESCE(el.description, ''), el.met_value, el.parameter_schema`

const templateExerciseFrom = `
	FROM template_exercises te
	JOIN exercise_library el ON el.id = te.exercise_id`

const templateExerciseSelect = templateExerciseCols + templateExerciseFrom

func scanTemplateExercise(row pgx.Row) (*TemplateExercise, error) {
	var te TemplateExercise
	var lib LibraryExercise
	err := row.Scan(&te.ID, &te.TemplateID, &te.ExerciseID,
		&te.PlannedSets, &te.PlannedReps, &te.PlannedWeight, &te.PlannedWeightUnit,
		&te.PlannedDurationMinutes, &te.RestSeconds, &te.SortOrder, &te.CreatedAt,
		&lib.ID, &lib.Name, &lib.MuscleGroupPrimary, &lib.MuscleGroupsSecondary,
		&lib.Category, &lib.ExerciseType, &lib.Equipment, &lib.Difficulty, &lib.Description, &lib.MetValue, &lib.ParameterSchema)
	if err != nil {
		return nil, err
	}
	te.Exercise = &lib
	return &te, nil
}

func (p *SchedulePGStore) templateExercisesFor(ctx context.Context, templateIDs []string) (map[string][]TemplateExercise, error) {
	out := map[string][]TemplateExercise{}
	if len(templateIDs) == 0 {
		return out, nil
	}
	rows, err := p.q.Query(ctx, templateExerciseSelect+`
		WHERE te.template_id = ANY($1::uuid[])
		ORDER BY te.sort_order, te.id`, templateIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		te, err := scanTemplateExercise(rows)
		if err != nil {
			return nil, err
		}
		out[te.TemplateID] = append(out[te.TemplateID], *te)
	}
	return out, rows.Err()
}

func (p *SchedulePGStore) ListTemplates(ctx context.Context, userID string) ([]WorkoutTemplate, error) {
	rows, err := p.q.Query(ctx,
		`SELECT `+templateCols+` FROM workout_templates WHERE user_id = $1 ORDER BY created_at DESC, id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []WorkoutTemplate{}
	ids := []string{}
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *t)
		ids = append(ids, t.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	byTemplate, err := p.templateExercisesFor(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range out {
		if ex := byTemplate[out[i].ID]; ex != nil {
			out[i].Exercises = ex
		}
	}
	return out, nil
}

func (p *SchedulePGStore) GetTemplate(ctx context.Context, id string) (*WorkoutTemplate, error) {
	t, err := scanTemplate(p.q.QueryRow(ctx,
		`SELECT `+templateCols+` FROM workout_templates WHERE id::text = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	byTemplate, err := p.templateExercisesFor(ctx, []string{t.ID})
	if err != nil {
		return nil, err
	}
	if ex := byTemplate[t.ID]; ex != nil {
		t.Exercises = ex
	}
	return t, nil
}

// exercisesExist reports whether every id in the (de-duplicated) list is a real
// exercise_library row. id::text avoids uuid-cast errors on garbage ids.
func exercisesExist(ctx context.Context, q db.Querier, ids []string) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	seen := map[string]bool{}
	uniq := []string{}
	for _, id := range ids {
		if !seen[id] {
			seen[id] = true
			uniq = append(uniq, id)
		}
	}
	var found int
	if err := q.QueryRow(ctx,
		`SELECT count(*) FROM exercise_library WHERE id::text = ANY($1::text[])`, uniq).Scan(&found); err != nil {
		return false, err
	}
	return found == len(uniq), nil
}

func insertTemplateExercise(ctx context.Context, q db.Querier, templateID string, in TemplateExerciseInput) (string, error) {
	sortOrder := 0
	if in.SortOrder != nil {
		sortOrder = *in.SortOrder
	}
	var id string
	err := q.QueryRow(ctx, `
		INSERT INTO template_exercises
			(template_id, exercise_id, planned_sets, planned_reps, planned_weight, planned_weight_unit, planned_duration_minutes, rest_seconds, sort_order)
		VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id::text`,
		templateID, in.ExerciseID, in.PlannedSets, in.PlannedReps, in.PlannedWeight,
		in.PlannedWeightUnit, in.PlannedDurationMinutes, in.RestSeconds, sortOrder).Scan(&id)
	return id, err
}

func (p *SchedulePGStore) CreateTemplate(ctx context.Context, userID, name string, estDuration *int, exercises []TemplateExerciseInput) (*WorkoutTemplate, error) {
	ids := make([]string, 0, len(exercises))
	for _, e := range exercises {
		ids = append(ids, e.ExerciseID)
	}

	tx, err := p.q.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) // no-op once committed

	if err := func() error {
		_, err := tx.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
		return err
	}(); err != nil {
		return nil, err
	}

	ok, err := exercisesExist(ctx, tx, ids)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrNotFound
	}

	var id string
	if err := tx.QueryRow(ctx, `
		INSERT INTO workout_templates (user_id, name, estimated_duration_minutes)
		VALUES ($1, $2, $3)
		RETURNING id::text`, userID, name, estDuration).Scan(&id); err != nil {
		return nil, err
	}
	for _, e := range exercises {
		if _, err := insertTemplateExercise(ctx, tx, id, e); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return p.GetTemplate(ctx, id)
}

func (p *SchedulePGStore) UpdateTemplate(ctx context.Context, t *WorkoutTemplate) error {
	_, err := p.q.Exec(ctx, `
		UPDATE workout_templates
		SET name = $2, estimated_duration_minutes = $3, updated_at = now()
		WHERE id::text = $1`, t.ID, t.Name, t.EstimatedDurationMinutes)
	return err
}

func (p *SchedulePGStore) DeleteTemplate(ctx context.Context, id string) error {
	// template_exercises cascade; workout_schedule.template_id set null (FKs).
	_, err := p.q.Exec(ctx, `DELETE FROM workout_templates WHERE id::text = $1`, id)
	return err
}

func (p *SchedulePGStore) AddTemplateExercise(ctx context.Context, templateID string, in TemplateExerciseInput) (*TemplateExercise, error) {
	ok, err := exercisesExist(ctx, p.q, []string{in.ExerciseID})
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrNotFound
	}
	id, err := insertTemplateExercise(ctx, p.q, templateID, in)
	if err != nil {
		return nil, err
	}
	te, _, err := p.GetTemplateExercise(ctx, id)
	return te, err
}

func (p *SchedulePGStore) GetTemplateExercise(ctx context.Context, id string) (*TemplateExercise, string, error) {
	var te TemplateExercise
	var lib LibraryExercise
	var owner string
	err := p.q.QueryRow(ctx, templateExerciseCols+`, t.user_id`+templateExerciseFrom+`
		JOIN workout_templates t ON t.id = te.template_id
		WHERE te.id::text = $1`, id).Scan(
		&te.ID, &te.TemplateID, &te.ExerciseID,
		&te.PlannedSets, &te.PlannedReps, &te.PlannedWeight, &te.PlannedWeightUnit,
		&te.PlannedDurationMinutes, &te.RestSeconds, &te.SortOrder, &te.CreatedAt,
		&lib.ID, &lib.Name, &lib.MuscleGroupPrimary, &lib.MuscleGroupsSecondary,
		&lib.Category, &lib.ExerciseType, &lib.Equipment, &lib.Difficulty, &lib.Description, &lib.MetValue, &lib.ParameterSchema,
		&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, "", ErrNotFound
	}
	if err != nil {
		return nil, "", err
	}
	te.Exercise = &lib
	return &te, owner, nil
}

func (p *SchedulePGStore) UpdateTemplateExercise(ctx context.Context, te *TemplateExercise) error {
	_, err := p.q.Exec(ctx, `
		UPDATE template_exercises
		SET planned_sets = $2, planned_reps = $3, planned_weight = $4, planned_weight_unit = $5,
		    planned_duration_minutes = $6, rest_seconds = $7, sort_order = $8
		WHERE id::text = $1`,
		te.ID, te.PlannedSets, te.PlannedReps, te.PlannedWeight, te.PlannedWeightUnit,
		te.PlannedDurationMinutes, te.RestSeconds, te.SortOrder)
	return err
}

func (p *SchedulePGStore) DeleteTemplateExercise(ctx context.Context, id string) error {
	_, err := p.q.Exec(ctx, `DELETE FROM template_exercises WHERE id::text = $1`, id)
	return err
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

func (p *SchedulePGStore) GetSchedule(ctx context.Context, userID string) ([]ScheduleDay, error) {
	rows, err := p.q.Query(ctx,
		`SELECT day_of_week, template_id::text FROM workout_schedule WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	byDay := map[int]*string{}
	for rows.Next() {
		var day int
		var templateID *string
		if err := rows.Scan(&day, &templateID); err != nil {
			rows.Close()
			return nil, err
		}
		byDay[day] = templateID
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	cache := map[string]*WorkoutTemplate{}
	load := func(id string) (*WorkoutTemplate, error) {
		if t, ok := cache[id]; ok {
			return t, nil
		}
		t, err := p.GetTemplate(ctx, id)
		if errors.Is(err, ErrNotFound) {
			return nil, nil // dangling id (shouldn't happen): treat as rest
		}
		if err != nil {
			return nil, err
		}
		cache[id] = t
		return t, nil
	}

	out := make([]ScheduleDay, 7)
	for i := 0; i < 7; i++ {
		d := ScheduleDay{DayOfWeek: i, DayName: dayName(i), IsRestDay: true}
		if tid, ok := byDay[i]; ok && tid != nil {
			t, err := load(*tid)
			if err != nil {
				return nil, err
			}
			if t != nil {
				d.TemplateID = tid
				d.Template = t
				d.IsRestDay = false
			}
		}
		out[i] = d
	}
	return out, nil
}

func (p *SchedulePGStore) SetScheduleDay(ctx context.Context, userID string, day int, templateID *string) error {
	if err := p.ensureProfile(ctx, userID); err != nil {
		return err
	}
	_, err := p.q.Exec(ctx, `
		INSERT INTO workout_schedule (user_id, day_of_week, template_id)
		VALUES ($1, $2, $3::uuid)
		ON CONFLICT (user_id, day_of_week) DO UPDATE SET
			template_id = excluded.template_id,
			updated_at = now()`, userID, day, templateID)
	return err
}

func (p *SchedulePGStore) SetSchedule(ctx context.Context, userID string, days []ScheduleDayInput) error {
	tx, err := p.q.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		return err
	}
	for _, d := range days {
		if _, err := tx.Exec(ctx, `
			INSERT INTO workout_schedule (user_id, day_of_week, template_id)
			VALUES ($1, $2, $3::uuid)
			ON CONFLICT (user_id, day_of_week) DO UPDATE SET
				template_id = excluded.template_id,
				updated_at = now()`, userID, d.DayOfWeek, d.TemplateID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (p *SchedulePGStore) GetToday(ctx context.Context, userID, today string, dayOfWeek int) (*TodayWorkout, error) {
	var templateID *string
	err := p.q.QueryRow(ctx,
		`SELECT template_id::text FROM workout_schedule WHERE user_id = $1 AND day_of_week = $2`,
		userID, dayOfWeek).Scan(&templateID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	tw := &TodayWorkout{
		DayOfWeek: dayOfWeek,
		DayName:   dayName(dayOfWeek),
		IsRestDay: true,
		Exercises: []TemplateExercise{},
	}
	if templateID != nil {
		t, err := p.GetTemplate(ctx, *templateID)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
		if t != nil {
			tw.IsRestDay = false
			tw.Template = t
			tw.Exercises = t.Exercises
		}
	}

	var sessionID *string
	err = p.q.QueryRow(ctx,
		`SELECT id::text FROM gym_sessions WHERE user_id = $1 AND date = $2::date ORDER BY created_at LIMIT 1`,
		userID, today).Scan(&sessionID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	tw.SessionID = sessionID
	tw.AlreadyCheckedIn = sessionID != nil
	return tw, nil
}

// ---------------------------------------------------------------------------
// Completion + patterns
// ---------------------------------------------------------------------------

func (p *SchedulePGStore) CompleteSession(ctx context.Context, userID, sessionID string, completionRate *float64) (*AdherenceResult, error) {
	var owner, date string
	var templateID *string
	var durationMin *int
	err := p.q.QueryRow(ctx,
		`SELECT user_id, template_id::text, date::text, duration_minutes FROM gym_sessions WHERE id::text = $1`, sessionID).
		Scan(&owner, &templateID, &date, &durationMin)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if owner != userID {
		return nil, ErrForbidden
	}

	// Compute + store the MET-based calorie burn for the session (best-effort:
	// this enriches the row but must not block check-in).
	if err := p.storeSessionCalories(ctx, sessionID, userID, durationMin); err != nil {
		return nil, err
	}

	flags, err := p.sessionExerciseFlags(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	plannedCount := 0
	if templateID != nil {
		if err := p.q.QueryRow(ctx,
			`SELECT count(*) FROM template_exercises WHERE template_id = $1::uuid`, *templateID).
			Scan(&plannedCount); err != nil {
			return nil, err
		}
	}
	rate, customized := ComputeCompletion(flags, plannedCount)
	if completionRate != nil {
		rate = *completionRate
	}

	if err := p.ensureProfile(ctx, userID); err != nil {
		return nil, err
	}
	if _, err := p.q.Exec(ctx, `
		INSERT INTO gym_adherence (user_id, scheduled_date, template_id, checked_in, completion_rate, customized)
		VALUES ($1, $2::date, $3::uuid, true, $4, $5)
		ON CONFLICT (user_id, scheduled_date) DO UPDATE SET
			template_id = excluded.template_id,
			checked_in = true,
			completion_rate = excluded.completion_rate,
			customized = excluded.customized`,
		userID, date, templateID, rate, customized); err != nil {
		return nil, err
	}

	if err := RebuildGymPatterns(ctx, p.q, userID); err != nil {
		return nil, err
	}
	return &AdherenceResult{
		ScheduledDate:  date,
		TemplateID:     templateID,
		CheckedIn:      true,
		CompletionRate: rate,
		Customized:     customized,
	}, nil
}

// storeSessionCalories computes the MET-based burn for a session's logged
// exercises and writes it to gym_sessions.calories_burned (calculation_method
// 'met'). Bodyweight comes from the user's onboarding row (defaults to 70kg when
// absent). Exercises without a linked library row fall back to the average MET.
func (p *SchedulePGStore) storeSessionCalories(ctx context.Context, sessionID, userID string, durationMin *int) error {
	// Bodyweight first — the parameter (ACSM) exercises need it per-exercise.
	bodyweightKg := 70.0
	var weight *float64
	var weightUnit *string
	err := p.q.QueryRow(ctx, `SELECT weight, weight_unit FROM onboarding WHERE user_id = $1`, userID).
		Scan(&weight, &weightUnit)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	if weight != nil && *weight > 0 {
		bodyweightKg = *weight
		if weightUnit != nil && *weightUnit == "lb" {
			bodyweightKg *= 0.453592
		}
	}

	rows, err := p.q.Query(ctx, `
		SELECT COALESCE(el.met_value, 5.0), COALESCE(ge.exercise_type, 'strength'),
		       ge.sets, ge.reps, ge.rest_seconds, ge.duration_minutes, ge.computed_met
		FROM gym_exercises ge
		LEFT JOIN exercise_library el ON el.id = ge.exercise_library_id
		WHERE ge.session_id = $1::uuid`, sessionID)
	if err != nil {
		return err
	}
	var metExs []energy.SessionExercise // exercises scored the old MET way
	paramKcal := 0.0                    // sum of parameter-scored (ACSM) exercises
	hadExercises := false
	for rows.Next() {
		hadExercises = true
		var e energy.SessionExercise
		var computedMET *float64
		if err := rows.Scan(&e.MetValue, &e.ExerciseType, &e.Sets, &e.Reps, &e.RestSeconds, &e.DurationMinutes, &computedMET); err != nil {
			rows.Close()
			return err
		}
		// Parameter-logged exercise: use its precomputed MET over its duration.
		if computedMET != nil && e.DurationMinutes != nil {
			paramKcal += energy.KcalFromMET(*computedMET, bodyweightKg, float64(*e.DurationMinutes))
		} else {
			metExs = append(metExs, e)
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	sessionDuration := 0
	if durationMin != nil {
		sessionDuration = *durationMin
	}

	// MET path for non-parameter exercises. When ALL exercises were parameter
	// logs, don't invoke the empty-list duration fallback (it would double-count);
	// only fall back for a session with no exercises at all.
	metKcal := 0.0
	if len(metExs) > 0 {
		metKcal = energy.CalculateSessionCalories(metExs, bodyweightKg, sessionDuration)
	} else if !hadExercises {
		metKcal = energy.CalculateSessionCalories(nil, bodyweightKg, sessionDuration)
	}

	cals := math.Round((paramKcal+metKcal)*10) / 10
	_, err = p.q.Exec(ctx,
		`UPDATE gym_sessions SET calories_burned = $2, calculation_method = 'met' WHERE id::text = $1`,
		sessionID, cals)
	return err
}

func (p *SchedulePGStore) sessionExerciseFlags(ctx context.Context, sessionID string) ([]ExerciseFlags, error) {
	rows, err := p.q.Query(ctx,
		`SELECT skipped, is_extra FROM gym_exercises WHERE session_id = $1::uuid`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ExerciseFlags
	for rows.Next() {
		var f ExerciseFlags
		if err := rows.Scan(&f.Skipped, &f.IsExtra); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

// RebuildGymPatterns recomputes and upserts the user's rolled-up gym patterns
// from the last 90 days of adherence and 30 days of logged volume. Called
// synchronously after a session completes; takes a Querier so it can run on the
// pool or inside a transaction.
func RebuildGymPatterns(ctx context.Context, q db.Querier, userID string) error {
	adhRows, err := q.Query(ctx, `
		SELECT scheduled_date::text, checked_in, customized
		FROM gym_adherence
		WHERE user_id = $1 AND scheduled_date >= current_date - interval '90 days'`, userID)
	if err != nil {
		return err
	}
	var adh []AdherenceRow
	for adhRows.Next() {
		var a AdherenceRow
		if err := adhRows.Scan(&a.ScheduledDate, &a.CheckedIn, &a.Customized); err != nil {
			adhRows.Close()
			return err
		}
		adh = append(adh, a)
	}
	adhRows.Close()
	if err := adhRows.Err(); err != nil {
		return err
	}
	avgSessions, adherenceRate, customizationRate, mostMissed := ComputeAdherenceStats(adh, 90)

	volRows, err := q.Query(ctx, `
		SELECT el.muscle_group_primary, ge.sets, ge.reps, ge.weight
		FROM gym_exercises ge
		JOIN gym_sessions gs ON gs.id = ge.session_id
		JOIN exercise_library el ON el.id = ge.exercise_library_id
		WHERE gs.user_id = $1 AND gs.date >= current_date - interval '30 days'`, userID)
	if err != nil {
		return err
	}
	var vol []VolumeRow
	for volRows.Next() {
		var v VolumeRow
		if err := volRows.Scan(&v.MusclePrimary, &v.Sets, &v.Reps, &v.Weight); err != nil {
			volRows.Close()
			return err
		}
		vol = append(vol, v)
	}
	volRows.Close()
	if err := volRows.Err(); err != nil {
		return err
	}
	volumeMap := ComputeMuscleVolume(vol)
	top, bottom := TopAndBottomMuscles(volumeMap)
	volJSON, err := json.Marshal(volumeMap)
	if err != nil {
		return err
	}

	if _, err := q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		return err
	}
	_, err = q.Exec(ctx, `
		INSERT INTO user_gym_patterns
			(user_id, most_trained_muscles, least_trained_muscles, avg_sessions_per_week, adherence_rate, customization_rate, most_missed_day, muscle_volume_map, last_rebuilt, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now(), now())
		ON CONFLICT (user_id) DO UPDATE SET
			most_trained_muscles = excluded.most_trained_muscles,
			least_trained_muscles = excluded.least_trained_muscles,
			avg_sessions_per_week = excluded.avg_sessions_per_week,
			adherence_rate = excluded.adherence_rate,
			customization_rate = excluded.customization_rate,
			most_missed_day = excluded.most_missed_day,
			muscle_volume_map = excluded.muscle_volume_map,
			last_rebuilt = excluded.last_rebuilt,
			updated_at = now()`,
		userID, top, bottom, avgSessions, adherenceRate, customizationRate, mostMissed, string(volJSON))
	return err
}

func (p *SchedulePGStore) GetPatterns(ctx context.Context, userID string) (*GymPatterns, error) {
	var gp GymPatterns
	var volJSON []byte
	err := p.q.QueryRow(ctx, `
		SELECT most_trained_muscles, least_trained_muscles,
		       COALESCE(avg_sessions_per_week, 0), COALESCE(adherence_rate, 0), COALESCE(customization_rate, 0),
		       most_missed_day, muscle_volume_map, last_rebuilt
		FROM user_gym_patterns WHERE user_id = $1`, userID).
		Scan(&gp.MostTrainedMuscles, &gp.LeastTrainedMuscles,
			&gp.AvgSessionsPerWeek, &gp.AdherenceRate, &gp.CustomizationRate,
			&gp.MostMissedDay, &volJSON, &gp.LastRebuilt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	gp.MuscleVolumeMap = map[string]float64{}
	if len(volJSON) > 0 {
		if err := json.Unmarshal(volJSON, &gp.MuscleVolumeMap); err != nil {
			return nil, err
		}
	}
	return &gp, nil
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

func (p *SchedulePGStore) GetExerciseProgress(ctx context.Context, userID, exerciseName string, limit int) (*ExerciseProgress, error) {
	rows, err := p.q.Query(ctx, `
		SELECT gs.date::text, ge.weight, ge.reps, ge.sets
		FROM gym_exercises ge
		JOIN gym_sessions gs ON gs.id = ge.session_id
		WHERE gs.user_id = $1 AND ge.name ILIKE $2
		ORDER BY gs.date ASC, ge.created_at ASC
		LIMIT $3`, userID, exerciseName, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	history := []ProgressEntry{}
	var best *PersonalBest
	for rows.Next() {
		var e ProgressEntry
		if err := rows.Scan(&e.Date, &e.Weight, &e.Reps, &e.Sets); err != nil {
			return nil, err
		}
		history = append(history, e)
		if e.Weight != nil && (best == nil || *e.Weight > best.Weight) {
			best = &PersonalBest{Weight: *e.Weight, Reps: e.Reps, Date: e.Date}
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return &ExerciseProgress{
		ExerciseName: exerciseName,
		History:      history,
		PersonalBest: best,
		Trend:        ComputeTrend(history),
	}, nil
}

// dayName maps 0=Sunday .. 6=Saturday to a weekday name via the stdlib.
func dayName(d int) string { return time.Weekday(d).String() }
