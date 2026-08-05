package gym

import (
	"context"
	"encoding/json"
	"fmt"

	"lume/backend/internal/energy"
)

// ---------------------------------------------------------------------------
// Parameter schema — describes which fields the app prompts for and which
// calorie formula scores the log. Stored as exercise_library.parameter_schema
// (jsonb). Authored in Go in exercise_library.go for the seed.
// ---------------------------------------------------------------------------

// ParamOption is one choice in a select field.
type ParamOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

// ParameterField is one prompt in a schema.
type ParameterField struct {
	Key      string        `json:"key"`
	Label    string        `json:"label"`
	Type     string        `json:"type"` // number | slider | select | toggle
	Unit     string        `json:"unit,omitempty"`
	Required bool          `json:"required"`
	Default  any           `json:"default,omitempty"`
	Min      *float64      `json:"min,omitempty"`
	Max      *float64      `json:"max,omitempty"`
	Step     *float64      `json:"step,omitempty"`
	Options  []ParamOption `json:"options,omitempty"`
}

// ParameterSchema is a library exercise's full parameter definition.
type ParameterSchema struct {
	Fields         []ParameterField `json:"fields"`
	CalorieFormula string           `json:"calorie_formula"`
}

// fptr / f is sugar for authoring optional bounds in the Go seed.
func fptr(v float64) *float64 { return &v }

// ---------------------------------------------------------------------------
// Validation (pure)
// ---------------------------------------------------------------------------

// ParamError is a client input problem — the handler maps it to 400.
type ParamError struct{ Msg string }

func (e *ParamError) Error() string { return e.Msg }

// ValidateAndFill checks raw parameters against a schema and returns the filled
// value map (optional-missing filled from defaults), whether any default was
// used (→ confidence downgrade), or a *ParamError for bad input:
//   - unknown key
//   - missing required field
//   - wrong type
//   - number out of [min,max]
//   - invalid select option
func ValidateAndFill(schema ParameterSchema, raw map[string]any) (map[string]any, bool, *ParamError) {
	if raw == nil {
		raw = map[string]any{}
	}
	known := make(map[string]ParameterField, len(schema.Fields))
	for _, f := range schema.Fields {
		known[f.Key] = f
	}
	for k := range raw {
		if _, ok := known[k]; !ok {
			return nil, false, &ParamError{"unknown parameter: " + k}
		}
	}

	filled := map[string]any{}
	defaultsUsed := false
	for _, f := range schema.Fields {
		v, present := raw[f.Key]
		if !present || v == nil {
			if f.Required {
				return nil, false, &ParamError{"missing required parameter: " + f.Key}
			}
			if f.Default != nil {
				filled[f.Key] = f.Default
				defaultsUsed = true
			}
			continue
		}
		switch f.Type {
		case "number", "slider":
			n, ok := toFloat(v)
			if !ok {
				return nil, false, &ParamError{f.Key + " must be a number"}
			}
			if f.Min != nil && n < *f.Min {
				return nil, false, &ParamError{fmt.Sprintf("%s must be at least %g", f.Key, *f.Min)}
			}
			if f.Max != nil && n > *f.Max {
				return nil, false, &ParamError{fmt.Sprintf("%s must be at most %g", f.Key, *f.Max)}
			}
			filled[f.Key] = n
		case "select":
			s, ok := v.(string)
			if !ok || !validOption(f, s) {
				return nil, false, &ParamError{f.Key + " must be one of the allowed options"}
			}
			filled[f.Key] = s
		case "toggle":
			b, ok := v.(bool)
			if !ok {
				return nil, false, &ParamError{f.Key + " must be true or false"}
			}
			filled[f.Key] = b
		default:
			filled[f.Key] = v
		}
	}
	return filled, defaultsUsed, nil
}

func validOption(f ParameterField, s string) bool {
	if len(f.Options) == 0 {
		return true
	}
	for _, o := range f.Options {
		if o.Value == s {
			return true
		}
	}
	return false
}

func toFloat(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case float32:
		return float64(n), true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		return f, err == nil
	}
	return 0, false
}

// intFromParams pulls an int-valued parameter (for duration_minutes) if present.
func intFromParams(p map[string]any, key string) *int {
	if f, ok := toFloat(p[key]); ok {
		n := int(f)
		return &n
	}
	return nil
}

// ---------------------------------------------------------------------------
// Calorie engine — the DB-backed orchestration behind logging + preview.
// ---------------------------------------------------------------------------

// LoggedCalories is everything computing an exercise's parameters yields: the
// transparent result plus the values to persist on the gym_exercises row.
type LoggedCalories struct {
	Result         energy.CalorieResult
	ParametersJSON json.RawMessage // validated params to persist
	Formula        string
	ComputedMET    float64
	DurationMin    *int
	ExerciseType   string  // from the library row, to set on the log
	LibraryID      *string // exercise_library.id, to link the log
}

// CalorieEngine computes calories for a logged/previewed exercise. The real impl
// is DB-backed (parameters_pg.go); tests inject a hermetic fake. A *ParamError
// return means bad client input (→ 400).
type CalorieEngine interface {
	// ComputeForExerciseName validates params against the named exercise's schema
	// and computes calories with the user's bodyweight.
	ComputeForExerciseName(ctx context.Context, userID, exerciseName string, params map[string]any) (*LoggedCalories, error)
	// PreviewByID is ComputeForExerciseName keyed by library id, result only.
	PreviewByID(ctx context.Context, userID, exerciseID string, params map[string]any) (*energy.CalorieResult, error)
	// LastLogged returns the user's most recent logged parameters for a library
	// exercise (nil when none), for form pre-fill.
	LastLogged(ctx context.Context, userID, exerciseID string) (json.RawMessage, error)
}
