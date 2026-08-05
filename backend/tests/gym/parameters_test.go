package gymtests

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"testing"

	"lume/backend/internal/energy"
	"lume/backend/internal/gym"
)

// fakeEngine is a hermetic gym.CalorieEngine: it reuses the REAL schemas
// (gym.ParamSchemas), the REAL validation (gym.ValidateAndFill) and the REAL
// formulas (energy.ComputeCalories) — only the DB lookups are faked (exercise_id
// is treated as the exercise name, bodyweight is fixed at 70 kg).
type fakeEngine struct{ bodyweightKnown bool }

func (e fakeEngine) score(name string, params map[string]any) (energy.CalorieResult, map[string]any, error) {
	sch, ok := gym.ParamSchemas[name]
	if !ok {
		return energy.CalorieResult{}, nil, &gym.ParamError{Msg: "unknown exercise: " + name}
	}
	filled, defaults, perr := gym.ValidateAndFill(sch, params)
	if perr != nil {
		return energy.CalorieResult{}, nil, perr
	}
	res := energy.ComputeCalories(energy.CalorieInput{
		Formula: sch.CalorieFormula, Params: filled, MetValue: 8,
		BodyMassKg: 70, BodyweightKnown: e.bodyweightKnown, DefaultsUsed: defaults,
	})
	return res, filled, nil
}

func (e fakeEngine) ComputeForExerciseName(_ context.Context, userID, name string, params map[string]any) (*gym.LoggedCalories, error) {
	res, filled, err := e.score(name, params)
	if err != nil {
		return nil, err
	}
	pj, _ := json.Marshal(filled)
	var dur *int
	if f, ok := filled["duration_minutes"].(float64); ok {
		d := int(f)
		dur = &d
	}
	lib := "lib-" + name
	return &gym.LoggedCalories{
		Result: res, ParametersJSON: pj, Formula: res.Formula, ComputedMET: res.ComputedMET,
		DurationMin: dur, ExerciseType: "cardio", LibraryID: &lib,
	}, nil
}

func (e fakeEngine) PreviewByID(_ context.Context, userID, exerciseID string, params map[string]any) (*energy.CalorieResult, error) {
	res, _, err := e.score(exerciseID, params)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (e fakeEngine) LastLogged(_ context.Context, userID, exerciseID string) (json.RawMessage, error) {
	return nil, nil
}

func serveWithEngine(f *fakeStore) *http.ServeMux {
	mux := http.NewServeMux()
	gym.RegisterWithEngine(mux, f, fakeEngine{bodyweightKnown: true})
	return mux
}

// ---------------------------------------------------------------------------

func TestLogWithParametersRoundTrip(t *testing.T) {
	f := newFake()
	mux := serveWithEngine(f)
	s := createSession(t, mux, "user_1", "2026-07-01")

	w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises", map[string]any{
		"name":       "Running",
		"parameters": map[string]any{"duration_minutes": 30, "speed_kmh": 8, "incline_percent": 5},
	})
	wantStatus(t, w, http.StatusCreated)
	e := decode[gym.Exercise](t, w)
	if e.CalorieResult == nil {
		t.Fatal("no calorie_result on the create response")
	}
	if math.Abs(e.CalorieResult.Calories-380) > 2 {
		t.Fatalf("calories = %v, want ~380", e.CalorieResult.Calories)
	}
	if e.CalorieResult.Confidence != "high" {
		t.Fatalf("confidence = %q, want high", e.CalorieResult.Confidence)
	}
	if e.ComputedMET == nil || math.Abs(*e.ComputedMET-10.33) > 0.05 {
		t.Fatalf("computed_met = %v, want ~10.33", e.ComputedMET)
	}

	// Round-trip: GET the session list; the persisted exercise carries MET + params.
	sessions := decode[[]gym.Session](t, do(t, mux, "user_1", "GET", "/api/gym/sessions", nil))
	if len(sessions) != 1 || len(sessions[0].Exercises) != 1 {
		t.Fatalf("expected 1 session with 1 exercise, got %+v", sessions)
	}
	re := sessions[0].Exercises[0]
	if re.ComputedMET == nil || math.Abs(*re.ComputedMET-10.33) > 0.05 {
		t.Fatalf("round-trip computed_met = %v, want ~10.33", re.ComputedMET)
	}
	if len(re.Parameters) == 0 {
		t.Fatal("round-trip parameters missing")
	}
}

func TestParameterValidationErrors(t *testing.T) {
	f := newFake()
	mux := serveWithEngine(f)
	s := createSession(t, mux, "user_1", "2026-07-01")
	post := func(params map[string]any) int {
		w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises",
			map[string]any{"name": "Running", "parameters": params})
		return w.Code
	}
	if c := post(map[string]any{"duration_minutes": 30, "bogus": 1}); c != http.StatusBadRequest {
		t.Errorf("unknown key → %d, want 400", c)
	}
	if c := post(map[string]any{"speed_kmh": 8}); c != http.StatusBadRequest {
		t.Errorf("missing required duration → %d, want 400", c)
	}
	if c := post(map[string]any{"duration_minutes": 30, "incline_percent": 99}); c != http.StatusBadRequest {
		t.Errorf("out-of-bounds incline → %d, want 400", c)
	}
	if c := post(map[string]any{"duration_minutes": 0}); c != http.StatusBadRequest {
		t.Errorf("zero duration → %d, want 400", c)
	}
	if c := post(map[string]any{"duration_minutes": 30, "speed_kmh": 8, "incline_percent": 5}); c != http.StatusCreated {
		t.Errorf("valid params → %d, want 201", c)
	}
}

func TestBackwardCompatNoParameters(t *testing.T) {
	f := newFake()
	mux := serveWithEngine(f)
	s := createSession(t, mux, "user_1", "2026-07-01")
	// A strength exercise with no parameters logs exactly as before.
	w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises",
		map[string]any{"name": "Bench Press", "sets": 3, "reps": 8, "weight": 60.0})
	wantStatus(t, w, http.StatusCreated)
	e := decode[gym.Exercise](t, w)
	if e.CalorieResult != nil || e.ComputedMET != nil {
		t.Fatalf("no-parameter log should not compute calories: %+v", e)
	}
	if e.Sets == nil || *e.Sets != 3 {
		t.Fatalf("sets not preserved: %+v", e)
	}
}

func TestRPEValidation(t *testing.T) {
	f := newFake()
	mux := serveWithEngine(f)
	s := createSession(t, mux, "user_1", "2026-07-01")
	bad := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises",
		map[string]any{"name": "Bench Press", "rpe": 11})
	wantStatus(t, bad, http.StatusBadRequest)
	ok := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises",
		map[string]any{"name": "Bench Press", "rpe": 7})
	wantStatus(t, ok, http.StatusCreated)
	e := decode[gym.Exercise](t, ok)
	if e.RPE == nil || *e.RPE != 7 {
		t.Fatalf("rpe not persisted: %+v", e.RPE)
	}
}

func TestPreviewEndpoint(t *testing.T) {
	f := newFake()
	mux := serveWithEngine(f)
	w := do(t, mux, "user_1", "POST", "/api/gym/calories/preview", map[string]any{
		"exercise_id": "Running",
		"parameters":  map[string]any{"duration_minutes": 30, "speed_kmh": 8, "incline_percent": 5},
	})
	wantStatus(t, w, http.StatusOK)
	res := decode[energy.CalorieResult](t, w)
	if math.Abs(res.Calories-380) > 2 {
		t.Fatalf("preview calories = %v, want ~380", res.Calories)
	}
	// Unknown exercise → 400.
	bad := do(t, mux, "user_1", "POST", "/api/gym/calories/preview",
		map[string]any{"exercise_id": "Nope", "parameters": map[string]any{"duration_minutes": 30}})
	wantStatus(t, bad, http.StatusBadRequest)
}

func TestPreviewRouteAbsentWithoutEngine(t *testing.T) {
	// serve() uses gym.Register (nil engine) → preview/last-logged not mounted.
	f := newFake()
	mux := serve(f)
	w := do(t, mux, "user_1", "POST", "/api/gym/calories/preview", map[string]any{"exercise_id": "Running"})
	wantStatus(t, w, http.StatusNotFound)
}
