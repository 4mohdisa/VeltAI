package gym

// Parameter schemas for the library, keyed by exercise name. Attached in the
// seed (SeedExerciseLibrary) rather than inlined into the 125 LibrarySeed
// literals. Cardio exercises get a schema + a calorie formula; strength
// exercises have none (they keep sets/reps/weight and an optional top-level RPE).

// numberField builds a required/optional number prompt with bounds.
func numberField(key, label, unit string, required bool, def, min, max, step float64) ParameterField {
	return ParameterField{Key: key, Label: label, Type: "number", Unit: unit, Required: required, Default: def, Min: fptr(min), Max: fptr(max), Step: fptr(step)}
}

// optionalNumber is a number prompt with no default (absent → not sent).
func optionalNumber(key, label, unit string, min, max, step float64) ParameterField {
	return ParameterField{Key: key, Label: label, Type: "number", Unit: unit, Min: fptr(min), Max: fptr(max), Step: fptr(step)}
}

func sliderField(key, label, unit string, def, min, max, step float64) ParameterField {
	return ParameterField{Key: key, Label: label, Type: "slider", Unit: unit, Default: def, Min: fptr(min), Max: fptr(max), Step: fptr(step)}
}

func intensityField() ParameterField {
	return ParameterField{
		Key: "intensity", Label: "Intensity", Type: "select", Default: "moderate",
		Options: []ParamOption{{"light", "Light"}, {"moderate", "Moderate"}, {"vigorous", "Vigorous"}},
	}
}

func duration(def, max float64) ParameterField {
	return numberField("duration_minutes", "Duration", "min", true, def, 1, max, 1)
}

var (
	treadmillSchema = ParameterSchema{
		Fields: []ParameterField{
			duration(30, 300),
			numberField("speed_kmh", "Speed", "km/h", false, 8, 1, 25, 0.5),
			sliderField("incline_percent", "Incline", "%", 0, 0, 15, 0.5),
		},
		CalorieFormula: "acsm_treadmill",
	}
	cyclingSchema = ParameterSchema{
		Fields: []ParameterField{
			duration(30, 300),
			optionalNumber("watts", "Power", "W", 0, 600, 5),
			sliderField("resistance_level", "Resistance", "", 8, 1, 20, 1),
			optionalNumber("cadence_rpm", "Cadence", "rpm", 30, 130, 1),
		},
		CalorieFormula: "acsm_cycling",
	}
	rowingSchema = ParameterSchema{
		Fields: []ParameterField{
			duration(20, 300),
			optionalNumber("distance_m", "Distance", "m", 0, 100000, 50),
			numberField("split_seconds", "Avg /500m split", "s", false, 120, 60, 240, 1),
		},
		CalorieFormula: "rowing_power",
	}
	steppingSchema = ParameterSchema{
		Fields: []ParameterField{
			duration(20, 300),
			numberField("steps_per_minute", "Steps/min", "spm", false, 80, 20, 160, 1),
			numberField("step_height_m", "Step height", "m", false, 0.20, 0.10, 0.40, 0.01),
		},
		CalorieFormula: "acsm_stepping",
	}
	intensitySchema = ParameterSchema{
		Fields:         []ParameterField{duration(30, 300), intensityField()},
		CalorieFormula: "met_fallback",
	}
	jumpRopeSchema = ParameterSchema{
		Fields:         []ParameterField{duration(10, 300)},
		CalorieFormula: "met_fallback",
	}
)

// ParamSchemas maps exercise name → its parameter schema. Exercises absent from
// the map have no schema (strength work, plus any cardio not yet parameterized).
var ParamSchemas = map[string]ParameterSchema{
	"Running":            treadmillSchema,
	"Treadmill Running":  treadmillSchema,
	"Incline Walking":    treadmillSchema,
	"Cycling":            cyclingSchema,
	"Stationary Bike":    cyclingSchema,
	"Assault Bike":       cyclingSchema,
	"Rowing":             rowingSchema,
	"Stair Climber":      steppingSchema,
	"Elliptical Trainer": intensitySchema,
	"Swimming":           intensitySchema,
	"Battle Ropes":       intensitySchema,
	"Jump Rope":          jumpRopeSchema,
}
