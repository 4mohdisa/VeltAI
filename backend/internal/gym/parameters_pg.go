package gym

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/db"
	"lume/backend/internal/energy"
)

// ParamEngine is the Postgres CalorieEngine: it reads the exercise's
// parameter_schema + met_value and the user's bodyweight, then runs the pure
// ValidateAndFill + energy.ComputeCalories pipeline.
type ParamEngine struct{ q db.Querier }

// NewParamEngine builds the engine over a Querier (pool in prod).
func NewParamEngine(q db.Querier) *ParamEngine { return &ParamEngine{q} }

// bodyweight reads the user's onboarding weight in kg. Returns (70, false) when
// absent so the caller can downgrade confidence.
func (e *ParamEngine) bodyweight(ctx context.Context, userID string) (float64, bool, error) {
	var weight *float64
	var unit *string
	err := e.q.QueryRow(ctx, `SELECT weight, weight_unit FROM onboarding WHERE user_id = $1`, userID).
		Scan(&weight, &unit)
	if errors.Is(err, pgx.ErrNoRows) {
		return 70, false, nil
	}
	if err != nil {
		return 70, false, err
	}
	if weight == nil || *weight <= 0 {
		return 70, false, nil
	}
	kg := *weight
	if unit != nil && *unit == "lb" {
		kg *= 0.453592
	}
	return kg, true, nil
}

// fetchSchema returns (schema, metValue, exerciseType, id). id is "" when no such
// exercise; schema is nil when the exercise exists but has no parameter_schema.
func (e *ParamEngine) fetchSchema(ctx context.Context, query, val string) (*ParameterSchema, float64, string, string, error) {
	var raw []byte
	var met float64
	var exType, id string
	err := e.q.QueryRow(ctx, query, val).Scan(&raw, &met, &exType, &id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, 0, "", "", nil
	}
	if err != nil {
		return nil, 0, "", "", err
	}
	if len(raw) == 0 {
		return nil, met, exType, id, nil
	}
	var sch ParameterSchema
	if err := json.Unmarshal(raw, &sch); err != nil {
		return nil, 0, "", "", err
	}
	return &sch, met, exType, id, nil
}

const schemaSelectByName = `SELECT parameter_schema, met_value, exercise_type, id::text FROM exercise_library WHERE name ILIKE $1 LIMIT 1`
const schemaSelectByID = `SELECT parameter_schema, met_value, exercise_type, id::text FROM exercise_library WHERE id::text = $1`

// compute is the shared validate → score pipeline.
func (e *ParamEngine) compute(ctx context.Context, userID string, sch *ParameterSchema, met float64, params map[string]any) (energy.CalorieResult, map[string]any, bool, error) {
	mass, known, err := e.bodyweight(ctx, userID)
	if err != nil {
		return energy.CalorieResult{}, nil, false, err
	}
	filled, defaultsUsed, perr := ValidateAndFill(*sch, params)
	if perr != nil {
		return energy.CalorieResult{}, nil, false, perr
	}
	res := energy.ComputeCalories(energy.CalorieInput{
		Formula:         sch.CalorieFormula,
		Params:          filled,
		MetValue:        met,
		BodyMassKg:      mass,
		BodyweightKnown: known,
		DefaultsUsed:    defaultsUsed,
	})
	return res, filled, defaultsUsed, nil
}

func (e *ParamEngine) ComputeForExerciseName(ctx context.Context, userID, exerciseName string, params map[string]any) (*LoggedCalories, error) {
	sch, met, exType, id, err := e.fetchSchema(ctx, schemaSelectByName, exerciseName)
	if err != nil {
		return nil, err
	}
	if id == "" {
		return nil, &ParamError{"unknown exercise: " + exerciseName}
	}
	if sch == nil {
		return nil, &ParamError{"this exercise takes no parameters"}
	}
	res, filled, _, err := e.compute(ctx, userID, sch, met, params)
	if err != nil {
		return nil, err
	}
	pj, err := json.Marshal(filled)
	if err != nil {
		return nil, err
	}
	libID := id
	return &LoggedCalories{
		Result:         res,
		ParametersJSON: pj,
		Formula:        res.Formula,
		ComputedMET:    res.ComputedMET,
		DurationMin:    intFromParams(filled, "duration_minutes"),
		ExerciseType:   exType,
		LibraryID:      &libID,
	}, nil
}

func (e *ParamEngine) PreviewByID(ctx context.Context, userID, exerciseID string, params map[string]any) (*energy.CalorieResult, error) {
	sch, met, _, id, err := e.fetchSchema(ctx, schemaSelectByID, exerciseID)
	if err != nil {
		return nil, err
	}
	if id == "" {
		return nil, &ParamError{"unknown exercise"}
	}
	if sch == nil {
		return nil, &ParamError{"this exercise takes no parameters"}
	}
	res, _, _, err := e.compute(ctx, userID, sch, met, params)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (e *ParamEngine) LastLogged(ctx context.Context, userID, exerciseID string) (json.RawMessage, error) {
	var raw []byte
	err := e.q.QueryRow(ctx, `
		SELECT ge.parameters
		FROM gym_exercises ge
		JOIN gym_sessions gs ON gs.id = ge.session_id
		WHERE gs.user_id = $1 AND ge.exercise_library_id::text = $2 AND ge.parameters IS NOT NULL
		ORDER BY gs.date DESC, ge.created_at DESC
		LIMIT 1`, userID, exerciseID).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return json.RawMessage(raw), nil
}
