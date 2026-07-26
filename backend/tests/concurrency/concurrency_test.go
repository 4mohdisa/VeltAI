// Package concurrencytests is a -race regression guard: the "pure" cores below
// must stay free of shared-state mutation. Every test shares ONE set of inputs
// across ≥50 goroutines and compares every result to the single-threaded
// baseline — any in-place sort, map write, or lazy init inside the functions
// shows up as a race or a divergent result.
//
// Run with: go test -race ./tests/concurrency
package concurrencytests

import (
	"reflect"
	"sync"
	"testing"

	"lumo/backend/internal/energy"
	"lumo/backend/internal/gym"
	"lumo/backend/internal/scan"
)

const goroutines = 100

// runConcurrent fans check out over `goroutines` goroutines and waits.
// check must use t.Errorf (goroutine-safe), never t.Fatalf.
func runConcurrent(t *testing.T, check func(worker int)) {
	t.Helper()
	var wg sync.WaitGroup
	for w := 0; w < goroutines; w++ {
		wg.Add(1)
		go func(worker int) {
			defer wg.Done()
			check(worker)
		}(w)
	}
	wg.Wait()
}

func ip(v int) *int { return &v }

// ---------------------------------------------------------------------------
// energy.CalculateSessionCalories
// ---------------------------------------------------------------------------

func TestCalculateSessionCaloriesConcurrent(t *testing.T) {
	// Shared across all goroutines — covers every branch of exerciseHours and
	// the empty/fallback/negative paths of CalculateSessionCalories.
	cases := []struct {
		name      string
		exercises []energy.SessionExercise
		bwKg      float64
		durMin    int
	}{
		{"explicit duration wins", []energy.SessionExercise{{MetValue: 8, ExerciseType: "cardio", DurationMinutes: ip(30)}}, 80, 0},
		{"strength sets/reps/rest estimate", []energy.SessionExercise{{MetValue: 5, ExerciseType: "strength", Sets: ip(3), Reps: ip(10), RestSeconds: ip(60)}}, 75, 0},
		{"strength nil fields → zero hours", []energy.SessionExercise{{MetValue: 5, ExerciseType: "strength"}}, 75, 0},
		{"cardio without duration → zero", []energy.SessionExercise{{MetValue: 9, ExerciseType: "cardio"}}, 70, 0},
		{"no exercises, duration fallback", nil, 90, 45},
		{"no exercises, no duration", nil, 90, 0},
		{"bodyweight defaulted to 70", []energy.SessionExercise{{MetValue: 6, ExerciseType: "cardio", DurationMinutes: ip(20)}}, 0, 0},
		{"negative MET clamps to 0", []energy.SessionExercise{{MetValue: -4, ExerciseType: "cardio", DurationMinutes: ip(20)}}, 70, 0},
		{"mixed multi-exercise", []energy.SessionExercise{
			{MetValue: 8, ExerciseType: "cardio", DurationMinutes: ip(15)},
			{MetValue: 5, ExerciseType: "strength", Sets: ip(4), Reps: ip(8), RestSeconds: ip(90)},
		}, 82.5, 60},
	}

	baseline := make([]float64, len(cases))
	for i, c := range cases {
		baseline[i] = energy.CalculateSessionCalories(c.exercises, c.bwKg, c.durMin)
	}
	// Sanity: the table isn't all zeros.
	if baseline[0] == 0 || baseline[4] == 0 {
		t.Fatalf("baseline sanity failed: %v", baseline)
	}

	runConcurrent(t, func(worker int) {
		for i, c := range cases {
			if got := energy.CalculateSessionCalories(c.exercises, c.bwKg, c.durMin); got != baseline[i] {
				t.Errorf("worker %d case %q: got %v want %v", worker, c.name, got, baseline[i])
			}
		}
	})
}

// ---------------------------------------------------------------------------
// energy.ComputeCalories
// ---------------------------------------------------------------------------

func TestComputeCaloriesConcurrent(t *testing.T) {
	// Params maps are SHARED across goroutines — a write inside ComputeCalories
	// (or its explain helpers) is a race. Covers every formula branch.
	cases := []energy.CalorieInput{
		{Formula: "acsm_treadmill", Params: map[string]any{"speed_kmh": 5.0, "incline_percent": 2.0, "duration_minutes": 30.0}, BodyMassKg: 80, BodyweightKnown: true},   // walking
		{Formula: "acsm_treadmill", Params: map[string]any{"speed_kmh": 10.0, "incline_percent": 1.0, "duration_minutes": 30.0}, BodyMassKg: 80, BodyweightKnown: true},  // running
		{Formula: "acsm_cycling", Params: map[string]any{"watts": 150.0, "duration_minutes": 40.0}, BodyMassKg: 75, BodyweightKnown: true},                               // direct watts
		{Formula: "acsm_cycling", Params: map[string]any{"resistance_level": 8.0, "cadence_rpm": 80.0, "duration_minutes": 40.0}, BodyMassKg: 75, BodyweightKnown: true}, // estimated watts
		{Formula: "acsm_cycling", Params: map[string]any{"duration_minutes": 40.0}, BodyMassKg: 75, BodyweightKnown: true},                                               // 2-MET floor
		{Formula: "rowing_power", Params: map[string]any{"split_seconds": 120.0, "duration_minutes": 20.0}, BodyMassKg: 85, BodyweightKnown: true},
		{Formula: "rowing_power", Params: map[string]any{"duration_minutes": 20.0}, BodyMassKg: 85, BodyweightKnown: true}, // no split → floor
		{Formula: "acsm_stepping", Params: map[string]any{"steps_per_minute": 60.0, "duration_minutes": 25.0}, BodyMassKg: 70, BodyweightKnown: true},
		{Formula: "met_fallback", Params: map[string]any{"duration_minutes": 30.0, "intensity": "vigorous"}, MetValue: 6, BodyMassKg: 70, BodyweightKnown: true},
		{Formula: "", Params: map[string]any{"duration_minutes": 30.0}, MetValue: 0, BodyMassKg: 0},                                                                 // everything defaulted
		{Formula: "acsm_treadmill", Params: map[string]any{"speed_kmh": 8.0, "duration_minutes": 30.0}, BodyMassKg: 80, DefaultsUsed: true, BodyweightKnown: false}, // medium confidence
	}

	baseline := make([]energy.CalorieResult, len(cases))
	for i, in := range cases {
		baseline[i] = energy.ComputeCalories(in)
	}
	if baseline[0].Calories <= 0 || baseline[0].Confidence != "high" {
		t.Fatalf("baseline sanity failed: %+v", baseline[0])
	}

	runConcurrent(t, func(worker int) {
		for i, in := range cases {
			if got := energy.ComputeCalories(in); !reflect.DeepEqual(got, baseline[i]) {
				t.Errorf("worker %d case %d (%s): got %+v want %+v", worker, i, in.Formula, got, baseline[i])
			}
		}
	})
}

// ---------------------------------------------------------------------------
// gym.ValidateAndFill over the shared package-level ParamSchemas map
// ---------------------------------------------------------------------------

// validRaw builds an accepted raw-param map for a schema (min-or-10 numbers,
// first select option, toggles true).
func validRaw(schema gym.ParameterSchema) map[string]any {
	raw := map[string]any{}
	for _, f := range schema.Fields {
		switch f.Type {
		case "number", "slider":
			v := 10.0
			if f.Min != nil {
				v = *f.Min
			}
			raw[f.Key] = v
		case "select":
			if len(f.Options) > 0 {
				raw[f.Key] = f.Options[0].Value
			} else {
				raw[f.Key] = "any"
			}
		case "toggle":
			raw[f.Key] = true
		}
	}
	return raw
}

func TestValidateAndFillConcurrentOverParamSchemas(t *testing.T) {
	if len(gym.ParamSchemas) == 0 {
		t.Fatal("ParamSchemas is empty")
	}

	// One shared raw map per exercise + the single-threaded baseline.
	raws := map[string]map[string]any{}
	type base struct {
		filled       map[string]any
		defaultsUsed bool
	}
	baseline := map[string]base{}
	for name, schema := range gym.ParamSchemas {
		raw := validRaw(schema)
		filled, du, perr := gym.ValidateAndFill(schema, raw)
		if perr != nil {
			t.Fatalf("baseline %q rejected valid raw: %v", name, perr)
		}
		raws[name] = raw
		baseline[name] = base{filled, du}
	}

	runConcurrent(t, func(worker int) {
		// Iterating the shared package-level map from every goroutine is the
		// point: a write to it anywhere would be a race.
		for name, schema := range gym.ParamSchemas {
			filled, du, perr := gym.ValidateAndFill(schema, raws[name])
			if perr != nil {
				t.Errorf("worker %d %q: unexpected error %v", worker, name, perr)
				continue
			}
			want := baseline[name]
			if du != want.defaultsUsed || !reflect.DeepEqual(filled, want.filled) {
				t.Errorf("worker %d %q: got (%v,%v) want (%v,%v)", worker, name, filled, du, want.filled, want.defaultsUsed)
			}
			// Error branches concurrently against the same shared schema.
			if _, _, perr := gym.ValidateAndFill(schema, map[string]any{"definitely_bogus": 1}); perr == nil {
				t.Errorf("worker %d %q: unknown key accepted", worker, name)
			}
			// nil raw: only errors when the schema has a required field.
			_, _, nilErr := gym.ValidateAndFill(schema, nil)
			hasRequired := false
			for _, f := range schema.Fields {
				if f.Required {
					hasRequired = true
				}
			}
			if hasRequired && nilErr == nil {
				t.Errorf("worker %d %q: nil raw accepted despite required fields", worker, name)
			}
		}
	})
}

// ---------------------------------------------------------------------------
// scan.BuildUserContext + scan.MatchRepeatMeal
// ---------------------------------------------------------------------------

func TestScanPureFunctionsConcurrent(t *testing.T) {
	// SHARED input — BuildUserContext must copy IdentityFixes before sorting;
	// an in-place sort here is both a race and a cross-worker divergence.
	ctxIn := scan.UserContextInput{
		Cuisines: []string{"indian", "thai"},
		FrequentFoods: []scan.CountedItem{
			{Name: "dal", Count: 12}, {Name: "rice", Count: 8}, {Name: "once-off", Count: 1},
		},
		IdentityFixes: []scan.AffinityItem{
			{AISuggested: "chicken curry", UserChose: "butter chicken", Occurrences: 4},
			{AISuggested: "noise", UserChose: "noise2", Occurrences: 1},
			{AISuggested: "flatbread", UserChose: "roti", Occurrences: 6},
		},
		PortionFactors: []scan.CalibrationFactor{
			{FoodName: "rice", Multiplier: 1.3, SampleCount: 5},
			{FoodName: "dal", Multiplier: 1.0, SampleCount: 9},  // skipped: multiplier 1
			{FoodName: "naan", Multiplier: 0.8, SampleCount: 2}, // skipped: <3 samples
		},
		TypicalBreakfast: "08:30",
		TypicalDinner:    "19:00",
	}
	ctxBaseline := scan.BuildUserContext(ctxIn)
	if ctxBaseline == "" {
		t.Fatal("baseline context unexpectedly empty")
	}
	if got := scan.BuildUserContext(scan.UserContextInput{}); got != "" {
		t.Fatalf("empty input should yield empty context, got %q", got)
	}

	meals := []scan.SavedMealLite{
		{Name: "Usual Curry Night", Foods: []string{"butter chicken", "basmati rice", "naan"}, Weights: []float64{250, 180, 90}},
		{Name: "Just Porridge", Foods: []string{"porridge"}, Weights: []float64{300}},
	}
	matchCases := []struct {
		name      string
		scanFoods []string
	}{
		{"two-food match", []string{"rice", "butter chicken"}},
		{"single-food meal match", []string{"porridge"}},
		{"one overlap only → nil", []string{"rice", "salad"}},
		{"no overlap → nil", []string{"pizza"}},
		{"empty scan → nil", nil},
	}
	matchBaseline := make([]*scan.MatchedMeal, len(matchCases))
	for i, mc := range matchCases {
		matchBaseline[i] = scan.MatchRepeatMeal(mc.scanFoods, meals)
	}
	if matchBaseline[0] == nil || matchBaseline[0].Name != "Usual Curry Night" {
		t.Fatalf("match baseline sanity failed: %+v", matchBaseline[0])
	}
	if matchBaseline[2] != nil || matchBaseline[3] != nil || matchBaseline[4] != nil {
		t.Fatalf("nil-match baselines sanity failed: %v", matchBaseline)
	}

	runConcurrent(t, func(worker int) {
		if got := scan.BuildUserContext(ctxIn); got != ctxBaseline {
			t.Errorf("worker %d: BuildUserContext diverged:\n got %q\nwant %q", worker, got, ctxBaseline)
		}
		for i, mc := range matchCases {
			if got := scan.MatchRepeatMeal(mc.scanFoods, meals); !reflect.DeepEqual(got, matchBaseline[i]) {
				t.Errorf("worker %d %q: got %+v want %+v", worker, mc.name, got, matchBaseline[i])
			}
		}
	})
}
