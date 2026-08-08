package goalstests

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"
	"testing"
	"time"

	"lume/backend/internal/ai"
	"lume/backend/internal/auth"
	"lume/backend/internal/cuisine"
	"lume/backend/internal/goals"
)

// ---------------------------------------------------------------------------
// fake store
// ---------------------------------------------------------------------------

// cuisinePrefRow mirrors a user_cuisine_preferences row.
type cuisinePrefRow struct {
	Cuisines            []string
	DietaryRequirements []string
}

// savedFoodRow mirrors the saved_foods columns CompleteOnboarding seeds.
type savedFoodRow struct {
	FoodName string
	Calories float64
}

type fakeStore struct {
	ob      map[string]*goals.Onboarding
	gl      map[string]*goals.Goals
	weights []goals.BodyWeight
	n       int

	cuisinePrefs map[string]cuisinePrefRow
	savedFoods   map[string][]savedFoodRow
	brains       map[string]ai.Brain
	needsRebuild map[string]bool

	// failSavedFoodsStep simulates a failure partway through CompleteOnboarding
	// (mirroring a mid-transaction SQL error) to test the all-or-nothing
	// contract: set before calling POST, nothing should be persisted.
	failSavedFoodsStep bool
}

func newFake() *fakeStore {
	return &fakeStore{
		ob:           map[string]*goals.Onboarding{},
		gl:           map[string]*goals.Goals{},
		cuisinePrefs: map[string]cuisinePrefRow{},
		savedFoods:   map[string][]savedFoodRow{},
		brains:       map[string]ai.Brain{},
		needsRebuild: map[string]bool{},
	}
}

func (f *fakeStore) GetOnboarding(_ context.Context, uid string) (*goals.Onboarding, error) {
	return f.ob[uid], nil
}

// matchesDietary mirrors the recognized-requirement filter CompleteOnboarding
// builds dynamically in SQL: every recognized requirement must hold on the
// food; unrecognized requirement strings are ignored, not an error.
func matchesDietary(food cuisine.Food, reqs []string) bool {
	for _, r := range reqs {
		switch r {
		case "halal":
			if !food.IsHalal {
				return false
			}
		case "vegetarian":
			if !food.IsVegetarian {
				return false
			}
		case "vegan":
			if !food.IsVegan {
				return false
			}
		case "gluten_free":
			if !food.IsGlutenFree {
				return false
			}
		}
	}
	return true
}

// CompleteOnboarding is a hermetic in-memory stand-in for PGStore's
// transactional version: it computes everything first and only mutates
// fakeStore's maps once every step has succeeded, mirroring the real
// all-or-nothing commit.
func (f *fakeStore) CompleteOnboarding(_ context.Context, in goals.OnboardingCompletion) (*goals.Onboarding, *goals.Goals, error) {
	d := goals.DeriveGoals(goals.DeriveInput{
		Age: in.Age, Sex: in.Sex, Height: in.Height, HeightUnit: in.HeightUnit,
		Weight: in.Weight, WeightUnit: in.WeightUnit, ActivityLevel: in.ActivityLevel, Goal: in.Goal,
	})

	if f.failSavedFoodsStep {
		return nil, nil, errors.New("simulated saved-foods failure")
	}

	age, sex, height, weight, activity, goal := in.Age, in.Sex, in.Height, in.Weight, in.ActivityLevel, in.Goal
	ob := &goals.Onboarding{
		ID: "ob_" + in.UserID, UserID: in.UserID, Completed: true,
		Age: &age, Sex: &sex, Height: &height, Weight: &weight,
		ActivityLevel: &activity, Goal: &goal, CreatedAt: time.Now(),
	}
	src := "onboarding"
	gl := &goals.Goals{
		ID: "goals_" + in.UserID, UserID: in.UserID,
		CalorieTarget: fptr(d.Calories), ProteinTarget: fptr(d.Protein),
		CarbTarget: fptr(d.Carbs), FatTarget: fptr(d.Fat), FibreTarget: fptr(d.Fibre),
		WeightGoal: &goal, ActivityLevel: &activity, Source: &src, UpdatedAt: time.Now(),
	}

	existing := map[string]bool{}
	for _, sf := range f.savedFoods[in.UserID] {
		existing[sf.FoodName] = true
	}
	// Mirrors pg.go's DISTINCT ON (food_name) ORDER BY food_name, cuisine: pick
	// one row per food_name across ALL selected cuisines first (a real single
	// SQL statement's snapshot never sees rows it produces itself), THEN check
	// that against foods saved by prior calls. Without this collapse step,
	// cuisines sharing a food_name (e.g. "Hummus" in middle_eastern and
	// mediterranean) would double-insert.
	sortedCuisines := append([]string(nil), in.Cuisines...)
	sort.Strings(sortedCuisines)
	candidates := map[string]cuisine.Food{}
	for _, c := range sortedCuisines {
		for _, food := range cuisine.Library[c] {
			if !matchesDietary(food, in.DietaryRequirements) {
				continue
			}
			if _, ok := candidates[food.FoodName]; !ok {
				candidates[food.FoodName] = food
			}
		}
	}
	var newFoods []savedFoodRow
	for name, food := range candidates {
		if existing[name] {
			continue
		}
		newFoods = append(newFoods, savedFoodRow{FoodName: food.FoodName, Calories: food.Calories})
	}

	priors := cuisine.MergePriors(in.Cuisines)
	freshBrain := ai.Brain{
		TypicalDailyCalories: float64(d.Calories),
		TypicalMacros:        ai.Macros{Protein: float64(d.Protein), Carbs: float64(d.Carbs), Fat: float64(d.Fat), Fibre: float64(d.Fibre)},
		MealTimingPatterns:   ai.MealTiming{ExpectedDinnerHour: hourOf(priors.ExpectedDinnerTime)},
		JunkFoodFrequency:    ai.JunkFood{Keywords: priors.JunkFoodKeywords},
		EatingPatterns:       ai.EatingPatterns{CarbSource: priors.TypicalCarbSource, FatSource: priors.TypicalFatSource},
		LastRebuilt:          time.Now(),
	}
	// Mirrors pg.go's re-onboarding merge: an existing brain (real usage
	// already accumulated) keeps its learned fields; only the cuisine/goal
	// priors move, and needs_rebuild flips on so a real recompute follows.
	existingBrain, hadBrain := f.brains[in.UserID]
	brain := freshBrain
	if hadBrain {
		merged := existingBrain
		merged.TypicalDailyCalories = freshBrain.TypicalDailyCalories
		merged.TypicalMacros = freshBrain.TypicalMacros
		merged.MealTimingPatterns.ExpectedDinnerHour = freshBrain.MealTimingPatterns.ExpectedDinnerHour
		merged.JunkFoodFrequency.Keywords = freshBrain.JunkFoodFrequency.Keywords
		merged.EatingPatterns.CarbSource = freshBrain.EatingPatterns.CarbSource
		merged.EatingPatterns.FatSource = freshBrain.EatingPatterns.FatSource
		merged.LastRebuilt = freshBrain.LastRebuilt
		brain = merged
	}

	// Commit — nothing above touched fakeStore state until now.
	f.ob[in.UserID] = ob
	f.gl[in.UserID] = gl
	f.cuisinePrefs[in.UserID] = cuisinePrefRow{Cuisines: in.Cuisines, DietaryRequirements: in.DietaryRequirements}
	f.savedFoods[in.UserID] = append(f.savedFoods[in.UserID], newFoods...)
	f.brains[in.UserID] = brain
	f.needsRebuild[in.UserID] = hadBrain

	return ob, gl, nil
}

func fptr(n int) *float64 {
	v := float64(n)
	return &v
}

// hourOf parses "HH:MM" into a fractional hour, mirroring goals.parseHourString
// (unexported) for test assertions against cuisine.CuisinePrior.ExpectedDinnerTime.
func hourOf(hhmm string) float64 {
	var h, m int
	fmt.Sscanf(hhmm, "%d:%d", &h, &m)
	return float64(h) + float64(m)/60
}

func (f *fakeStore) GetGoals(_ context.Context, uid string) (*goals.Goals, error) {
	return f.gl[uid], nil
}

func (f *fakeStore) UpsertGoals(_ context.Context, g *goals.Goals) (*goals.Goals, error) {
	c := *g
	c.ID = "goals_" + g.UserID
	c.UpdatedAt = time.Now()
	f.gl[g.UserID] = &c
	return &c, nil
}

func (f *fakeStore) ListBodyWeight(_ context.Context, uid string) ([]goals.BodyWeight, error) {
	var out []goals.BodyWeight
	for _, w := range f.weights {
		if w.UserID == uid {
			out = append(out, w)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Date > out[j].Date })
	return out, nil
}

func (f *fakeStore) CreateBodyWeight(_ context.Context, bw *goals.BodyWeight) (*goals.BodyWeight, error) {
	f.n++
	c := *bw
	c.ID = fmt.Sprintf("bw%d", f.n)
	c.CreatedAt = time.Now()
	f.weights = append(f.weights, c)
	return &c, nil
}

func (f *fakeStore) GetBodyWeight(_ context.Context, id string) (*goals.BodyWeight, error) {
	for i := range f.weights {
		if f.weights[i].ID == id {
			c := f.weights[i]
			return &c, nil
		}
	}
	return nil, nil
}

func (f *fakeStore) DeleteBodyWeight(_ context.Context, id string) error {
	for i := range f.weights {
		if f.weights[i].ID == id {
			f.weights = append(f.weights[:i], f.weights[i+1:]...)
			return nil
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func newMux() (*http.ServeMux, *fakeStore) {
	mux := http.NewServeMux()
	f := newFake()
	goals.Register(mux, f)
	return mux, f
}

func do(t *testing.T, mux *http.ServeMux, method, path, user string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var rd io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		rd = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rd)
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	return rr
}

func decodeData[T any](t *testing.T, rr *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data T `json:"data"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode envelope: %v (body: %s)", err, rr.Body.String())
	}
	return env.Data
}

func errMsg(t *testing.T, rr *httptest.ResponseRecorder) string {
	t.Helper()
	var env struct {
		Error *string `json:"error"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &env); err != nil || env.Error == nil {
		t.Fatalf("expected error envelope, got: %s", rr.Body.String())
	}
	return *env.Error
}

func fv(p *float64) float64 {
	if p == nil {
		return -1
	}
	return *p
}

func sv(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

// ---------------------------------------------------------------------------
// DeriveGoals — hand-computed Mifflin–St Jeor vectors
// ---------------------------------------------------------------------------

func TestDeriveGoals(t *testing.T) {
	cases := []struct {
		name string
		in   goals.DeriveInput
		want goals.DerivedGoals
	}{
		{
			// BMR = 800+1125-150+5 = 1780; TDEE = 1780*1.55 = 2759 → 2760
			name: "male moderate maintain",
			in:   goals.DeriveInput{Age: 30, Sex: "male", Height: 180, Weight: 80, ActivityLevel: "moderate", Goal: "health"},
			want: goals.DerivedGoals{Calories: 2760, Protein: 144, Carbs: 373, Fat: 77, Fibre: 39},
		},
		{
			// BMR = 600+1031.25-125-161 = 1345.25; TDEE = 1849.71875; -400 → 1450
			name: "female light lose",
			in:   goals.DeriveInput{Age: 25, Sex: "female", Height: 165, Weight: 60, ActivityLevel: "light", Goal: "lose"},
			want: goals.DerivedGoals{Calories: 1450, Protein: 108, Carbs: 165, Fat: 40, Fibre: 25},
		},
		{
			// BMR = 700+1093.75-200-78 = 1515.75; TDEE = 2879.925; +250 → 3130
			name: "other very_active muscle",
			in:   goals.DeriveInput{Age: 40, Sex: "other", Height: 175, Weight: 70, ActivityLevel: "very_active", Goal: "muscle"},
			want: goals.DerivedGoals{Calories: 3130, Protein: 140, Carbs: 447, Fat: 87, Fibre: 44},
		},
		{
			// 70in = 177.8cm, 180lb = 81.64656kg
			// BMR = 816.4656+1111.25-175+5 = 1757.7156; TDEE = 2109.25872; -400 → 1710
			name: "male sedentary lose imperial",
			in:   goals.DeriveInput{Age: 35, Sex: "male", Height: 70, HeightUnit: "in", Weight: 180, WeightUnit: "lb", ActivityLevel: "sedentary", Goal: "lose"},
			want: goals.DerivedGoals{Calories: 1710, Protein: 147, Carbs: 173, Fat: 48, Fibre: 25},
		},
		{
			// BMR = 650+1062.5-140-161 = 1411.5; TDEE = 2434.8375; +250 → 2680
			name: "female active muscle",
			in:   goals.DeriveInput{Age: 28, Sex: "female", Height: 170, Weight: 65, ActivityLevel: "active", Goal: "muscle"},
			want: goals.DerivedGoals{Calories: 2680, Protein: 130, Carbs: 374, Fat: 74, Fibre: 38},
		},
		{
			// BMR = 450+937.5-300-161 = 926.5; TDEE = 1111.8; -400 = 711.8 → floor 1200
			name: "calorie floor",
			in:   goals.DeriveInput{Age: 60, Sex: "female", Height: 150, Weight: 45, ActivityLevel: "sedentary", Goal: "lose"},
			want: goals.DerivedGoals{Calories: 1200, Protein: 81, Carbs: 145, Fat: 33, Fibre: 25},
		},
		{
			// The floor is SEX-AWARE (1.4.1): it was a flat 1200 for everyone, so
			// this man was recommended the female minimum. 1500 is the widely-cited
			// male minimum. BMR = 400+937.5-300+5 = 1042.5; TDEE = 1251; -400 = 851.
			name: "calorie floor is 1500 for men",
			in:   goals.DeriveInput{Age: 60, Sex: "male", Height: 150, Weight: 40, ActivityLevel: "sedentary", Goal: "lose"},
			want: goals.DerivedGoals{Calories: 1500, Protein: 72, Carbs: 209, Fat: 42, Fibre: 25},
		},
		{
			// "other" takes the midpoint, matching the BMR offset convention.
			name: "calorie floor is 1500 for other (unspecified takes the higher floor)",
			in:   goals.DeriveInput{Age: 60, Sex: "other", Height: 150, Weight: 40, ActivityLevel: "sedentary", Goal: "lose"},
			want: goals.DerivedGoals{Calories: 1500, Protein: 72, Carbs: 209, Fat: 42, Fibre: 25},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := goals.DeriveGoals(tc.in)
			if got != tc.want {
				t.Errorf("DeriveGoals(%+v) = %+v, want %+v", tc.in, got, tc.want)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// onboarding
// ---------------------------------------------------------------------------

func TestOnboardingPostDerivesGoalsMale(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", map[string]any{
		"age": 30, "sex": "male", "height": 180, "weight": 80,
		"activity_level": "moderate", "goal": "health",
	})
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}

	rr = do(t, mux, "GET", "/api/goals", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("GET goals: got %d", rr.Code)
	}
	g := decodeData[goals.Goals](t, rr)
	if fv(g.CalorieTarget) != 2760 || fv(g.ProteinTarget) != 144 || fv(g.CarbTarget) != 373 ||
		fv(g.FatTarget) != 77 || fv(g.FibreTarget) != 39 {
		t.Errorf("derived targets wrong: cal=%v prot=%v carb=%v fat=%v fibre=%v",
			fv(g.CalorieTarget), fv(g.ProteinTarget), fv(g.CarbTarget), fv(g.FatTarget), fv(g.FibreTarget))
	}
	if sv(g.Source) != "onboarding" || sv(g.WeightGoal) != "health" || sv(g.ActivityLevel) != "moderate" {
		t.Errorf("metadata wrong: source=%q weight_goal=%q activity=%q", sv(g.Source), sv(g.WeightGoal), sv(g.ActivityLevel))
	}
}

func TestOnboardingPostDerivesGoalsFemale(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", map[string]any{
		"age": 25, "sex": "female", "height": 165, "weight": 60,
		"activity_level": "light", "goal": "lose",
	})
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}

	g := decodeData[goals.Goals](t, do(t, mux, "GET", "/api/goals", "user_1", nil))
	if fv(g.CalorieTarget) != 1450 || fv(g.ProteinTarget) != 108 || fv(g.CarbTarget) != 165 ||
		fv(g.FatTarget) != 40 || fv(g.FibreTarget) != 25 {
		t.Errorf("derived targets wrong: cal=%v prot=%v carb=%v fat=%v fibre=%v",
			fv(g.CalorieTarget), fv(g.ProteinTarget), fv(g.CarbTarget), fv(g.FatTarget), fv(g.FibreTarget))
	}
	if sv(g.WeightGoal) != "lose" {
		t.Errorf("weight_goal = %q, want lose", sv(g.WeightGoal))
	}
}

func TestOnboardingPostAllActivityLevels(t *testing.T) {
	// Same male profile (BMR 1780, goal health) across all five levels.
	want := map[string]float64{
		"sedentary":   2140, // 1780*1.2   = 2136  → 2140
		"light":       2450, // 1780*1.375 = 2447.5 → 2450
		"moderate":    2760, // 1780*1.55  = 2759  → 2760
		"active":      3070, // 1780*1.725 = 3070.5 → 3070
		"very_active": 3380, // 1780*1.9   = 3382  → 3380
	}
	mux, _ := newMux()
	for level, cal := range want {
		rr := do(t, mux, "POST", "/api/onboarding", "user_1", map[string]any{
			"age": 30, "sex": "male", "height": 180, "weight": 80,
			"activity_level": level, "goal": "health",
		})
		if rr.Code != http.StatusOK {
			t.Fatalf("POST onboarding (%s): got %d", level, rr.Code)
		}
		g := decodeData[goals.Goals](t, do(t, mux, "GET", "/api/goals", "user_1", nil))
		if fv(g.CalorieTarget) != cal {
			t.Errorf("%s: calorie_target = %v, want %v", level, fv(g.CalorieTarget), cal)
		}
	}
}

func TestOnboardingPostMissingFields(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", map[string]any{"age": 30, "sex": "male"})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("got %d, want 400", rr.Code)
	}
	msg := errMsg(t, rr)
	for _, field := range []string{"height", "weight", "activity_level", "goal"} {
		if !bytes.Contains([]byte(msg), []byte(field)) {
			t.Errorf("error %q does not mention missing field %q", msg, field)
		}
	}
}

func TestOnboardingGetLifecycle(t *testing.T) {
	mux, _ := newMux()

	ob := decodeData[goals.Onboarding](t, do(t, mux, "GET", "/api/onboarding", "user_1", nil))
	if ob.Completed {
		t.Fatal("new user should have completed=false")
	}
	if ob.Age != nil || ob.Sex != nil {
		t.Errorf("new user fields should be null, got age=%v sex=%v", ob.Age, ob.Sex)
	}

	rr := do(t, mux, "POST", "/api/onboarding", "user_1", map[string]any{
		"age": 30, "sex": "male", "height": 180, "weight": 80,
		"activity_level": "moderate", "goal": "health",
	})
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d", rr.Code)
	}

	ob = decodeData[goals.Onboarding](t, do(t, mux, "GET", "/api/onboarding", "user_1", nil))
	if !ob.Completed {
		t.Error("completed should be true after POST")
	}
	if ob.Age == nil || *ob.Age != 30 || sv(ob.Sex) != "male" || sv(ob.Goal) != "health" {
		t.Errorf("row not echoed: %+v", ob)
	}
}

// ---------------------------------------------------------------------------
// onboarding — cuisine preferences, saved-food seeding, brain priming
// ---------------------------------------------------------------------------

func baseOnboardingBody(extra map[string]any) map[string]any {
	body := map[string]any{
		"age": 30, "sex": "male", "height": 180, "weight": 80,
		"activity_level": "moderate", "goal": "health",
	}
	for k, v := range extra {
		body[k] = v
	}
	return body
}

func TestOnboardingPostSavesCuisinePreferences(t *testing.T) {
	mux, f := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", baseOnboardingBody(map[string]any{
		"cuisines":             []string{"south_asian", "east_asian"},
		"dietary_requirements": []string{"halal"},
	}))
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}
	pref, ok := f.cuisinePrefs["user_1"]
	if !ok {
		t.Fatal("no cuisine preferences persisted")
	}
	if len(pref.Cuisines) != 2 || pref.Cuisines[0] != "south_asian" || pref.Cuisines[1] != "east_asian" {
		t.Errorf("cuisines = %v, want [south_asian east_asian]", pref.Cuisines)
	}
	if len(pref.DietaryRequirements) != 1 || pref.DietaryRequirements[0] != "halal" {
		t.Errorf("dietary_requirements = %v, want [halal]", pref.DietaryRequirements)
	}
}

func TestOnboardingPostSeedsSavedFoodsForCuisine(t *testing.T) {
	mux, f := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", baseOnboardingBody(map[string]any{
		"cuisines": []string{"south_asian"},
	}))
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}
	found := false
	for _, sf := range f.savedFoods["user_1"] {
		if sf.FoodName == "White rice, cooked" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected south_asian seed food %q in saved_foods, got %+v", "White rice, cooked", f.savedFoods["user_1"])
	}
}

func TestOnboardingPostHalalExcludesNonHalalFoods(t *testing.T) {
	mux, f := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", baseOnboardingBody(map[string]any{
		"cuisines":             []string{"east_asian"},
		"dietary_requirements": []string{"halal"},
	}))
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}
	for _, sf := range f.savedFoods["user_1"] {
		if sf.FoodName == "Pork ramen" || sf.FoodName == "Char siu pork" {
			t.Errorf("non-halal food %q leaked into saved_foods with dietary_requirements=[halal]", sf.FoodName)
		}
	}
	haloFound := false
	for _, sf := range f.savedFoods["user_1"] {
		if sf.FoodName == "Plain tofu" {
			haloFound = true
		}
	}
	if !haloFound {
		t.Error("expected halal east_asian food 'Plain tofu' to be seeded")
	}
}

func TestOnboardingPostTransactionAllOrNothing(t *testing.T) {
	mux, f := newMux()
	f.failSavedFoodsStep = true
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", baseOnboardingBody(map[string]any{
		"cuisines": []string{"south_asian"},
	}))
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("got %d, want 500", rr.Code)
	}
	if _, ok := f.ob["user_1"]; ok {
		t.Error("onboarding row persisted despite mid-transaction failure")
	}
	if _, ok := f.gl["user_1"]; ok {
		t.Error("goals row persisted despite mid-transaction failure")
	}
	if _, ok := f.cuisinePrefs["user_1"]; ok {
		t.Error("cuisine preferences persisted despite mid-transaction failure")
	}
	if len(f.savedFoods["user_1"]) != 0 {
		t.Error("saved_foods persisted despite mid-transaction failure")
	}
}

func TestOnboardingPostInitializesBrainFromCuisine(t *testing.T) {
	mux, f := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", baseOnboardingBody(map[string]any{
		"cuisines": []string{"south_asian"},
	}))
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}
	b, ok := f.brains["user_1"]
	if !ok {
		t.Fatal("no brain persisted")
	}
	if b.TypicalDailyCalories != 2760 {
		t.Errorf("TypicalDailyCalories = %v, want 2760 (derived goal calories)", b.TypicalDailyCalories)
	}
	if b.EatingPatterns.CarbSource != "rice_and_bread" {
		t.Errorf("CarbSource = %q, want rice_and_bread (south_asian prior)", b.EatingPatterns.CarbSource)
	}
	if len(b.JunkFoodFrequency.Keywords) == 0 {
		t.Error("JunkFoodFrequency.Keywords empty, want south_asian junk keywords")
	}
}

func TestOnboardingPostIdempotentSavedFoods(t *testing.T) {
	mux, f := newMux()
	body := baseOnboardingBody(map[string]any{"cuisines": []string{"south_asian"}})
	if rr := do(t, mux, "POST", "/api/onboarding", "user_1", body); rr.Code != http.StatusOK {
		t.Fatalf("POST #1: got %d", rr.Code)
	}
	firstCount := len(f.savedFoods["user_1"])
	if firstCount == 0 {
		t.Fatal("expected saved foods after first onboarding")
	}
	if rr := do(t, mux, "POST", "/api/onboarding", "user_1", body); rr.Code != http.StatusOK {
		t.Fatalf("POST #2: got %d", rr.Code)
	}
	if got := len(f.savedFoods["user_1"]); got != firstCount {
		t.Errorf("saved_foods count after repeat onboarding = %d, want %d (no duplicates)", got, firstCount)
	}
}

// TestOnboardingPostDedupesSharedFoodNamesAcrossCuisines is the regression
// test for FIX #1: cuisine_food_library has identical food_name values under
// multiple cuisines (e.g. "Hummus" in both middle_eastern and mediterranean).
// A single onboarding call selecting both must seed exactly one row per
// shared name, not one per cuisine.
func TestOnboardingPostDedupesSharedFoodNamesAcrossCuisines(t *testing.T) {
	mux, f := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_1", baseOnboardingBody(map[string]any{
		"cuisines": []string{"middle_eastern", "mediterranean"},
	}))
	if rr.Code != http.StatusOK {
		t.Fatalf("POST onboarding: got %d, body %s", rr.Code, rr.Body.String())
	}

	counts := map[string]int{}
	for _, sf := range f.savedFoods["user_1"] {
		counts[sf.FoodName]++
	}
	for _, shared := range []string{"Hummus", "Pita bread", "Lentil soup", "Baklava"} {
		if counts[shared] != 1 {
			t.Errorf("saved_foods count for %q = %d, want 1 (shared across middle_eastern+mediterranean)", shared, counts[shared])
		}
	}
}

// TestOnboardingPostReonboardingPreservesLearnedBrain is the regression test
// for FIX #8: re-submitting onboarding (a profile edit) must merge fresh
// cuisine/goal priors into an existing brain, not overwrite weeks of learned
// eating/gym/goal-adherence/scan-accuracy data with a thin day-one brain.
func TestOnboardingPostReonboardingPreservesLearnedBrain(t *testing.T) {
	mux, f := newMux()

	body1 := baseOnboardingBody(map[string]any{"cuisines": []string{"south_asian"}})
	if rr := do(t, mux, "POST", "/api/onboarding", "user_1", body1); rr.Code != http.StatusOK {
		t.Fatalf("POST #1: got %d, body %s", rr.Code, rr.Body.String())
	}

	// Simulate weeks of accumulated learning on top of the day-one brain.
	learned := f.brains["user_1"]
	learned.EatingPatterns.TopFoods = []ai.TopFood{{Name: "Chicken curry", Count: 12, CalorieShare: 0.3}}
	learned.EatingPatterns.ConsistencyScore = 0.82
	learned.EatingPatterns.DaysLogged = 21
	learned.EatingPatterns.GoalCheck = ai.GoalCheck{WeightTrend: "down", WeightChange: -1.2}
	learned.GymPatterns = ai.GymPatterns{SessionsPerWeek: 4, CurrentStreak: 6, LongestStreak: 9}
	learned.GoalAdherenceScore = 55
	learned.ScanAccuracyProfile = &ai.ScanAccuracyProfile{OverallAccuracyPct: 91, AvgCorrectionMagnitude: 5}
	f.brains["user_1"] = learned
	f.needsRebuild["user_1"] = false

	// Re-onboard: user edits their profile (activity level + cuisine change).
	body2 := baseOnboardingBody(map[string]any{
		"activity_level": "active",
		"cuisines":       []string{"mediterranean"},
	})
	if rr := do(t, mux, "POST", "/api/onboarding", "user_1", body2); rr.Code != http.StatusOK {
		t.Fatalf("POST #2: got %d, body %s", rr.Code, rr.Body.String())
	}

	got := f.brains["user_1"]
	if got.GoalAdherenceScore != 55 {
		t.Errorf("GoalAdherenceScore = %v, want 55 (must survive re-onboarding)", got.GoalAdherenceScore)
	}
	if got.GymPatterns.SessionsPerWeek != 4 || got.GymPatterns.CurrentStreak != 6 || got.GymPatterns.LongestStreak != 9 {
		t.Errorf("GymPatterns changed by re-onboarding: %+v", got.GymPatterns)
	}
	if got.ScanAccuracyProfile == nil || got.ScanAccuracyProfile.OverallAccuracyPct != 91 {
		t.Errorf("ScanAccuracyProfile changed by re-onboarding: %+v", got.ScanAccuracyProfile)
	}
	if len(got.EatingPatterns.TopFoods) != 1 || got.EatingPatterns.TopFoods[0].Name != "Chicken curry" {
		t.Errorf("EatingPatterns.TopFoods changed by re-onboarding: %+v", got.EatingPatterns.TopFoods)
	}
	if got.EatingPatterns.ConsistencyScore != 0.82 || got.EatingPatterns.DaysLogged != 21 {
		t.Errorf("EatingPatterns consistency/days changed by re-onboarding: %+v", got.EatingPatterns)
	}
	if got.EatingPatterns.GoalCheck.WeightTrend != "down" {
		t.Errorf("EatingPatterns.GoalCheck changed by re-onboarding: %+v", got.EatingPatterns.GoalCheck)
	}

	// Fresh onboarding inputs DID move.
	if got.TypicalDailyCalories != 3070 {
		t.Errorf("TypicalDailyCalories = %v, want 3070 (fresh male/active/health derivation)", got.TypicalDailyCalories)
	}
	if got.EatingPatterns.CarbSource != "bread_and_pasta" {
		t.Errorf("CarbSource = %q, want bread_and_pasta (mediterranean prior)", got.EatingPatterns.CarbSource)
	}
	if want := hourOf("21:00"); got.MealTimingPatterns.ExpectedDinnerHour != want {
		t.Errorf("ExpectedDinnerHour = %v, want %v (mediterranean prior)", got.MealTimingPatterns.ExpectedDinnerHour, want)
	}

	if !f.needsRebuild["user_1"] {
		t.Error("needs_rebuild should be true after re-onboarding merges into an existing brain")
	}
}

// ---------------------------------------------------------------------------
// goals
// ---------------------------------------------------------------------------

func TestGoalsGetNone(t *testing.T) {
	mux, _ := newMux()
	if rr := do(t, mux, "GET", "/api/goals", "user_1", nil); rr.Code != http.StatusNotFound {
		t.Fatalf("got %d, want 404", rr.Code)
	}
}

func TestGoalsPutUpsert(t *testing.T) {
	mux, _ := newMux()

	rr := do(t, mux, "PUT", "/api/goals", "user_1", map[string]any{"calorie_target": 2000})
	if rr.Code != http.StatusOK {
		t.Fatalf("PUT goals: got %d, body %s", rr.Code, rr.Body.String())
	}
	g := decodeData[goals.Goals](t, rr)
	if fv(g.CalorieTarget) != 2000 || sv(g.Source) != "manual" {
		t.Errorf("got cal=%v source=%q, want 2000/manual", fv(g.CalorieTarget), sv(g.Source))
	}

	// Partial update keeps the untouched target; explicit source wins.
	rr = do(t, mux, "PUT", "/api/goals", "user_1", map[string]any{"protein_target": 150, "source": "coach"})
	if rr.Code != http.StatusOK {
		t.Fatalf("PUT goals #2: got %d", rr.Code)
	}
	g = decodeData[goals.Goals](t, do(t, mux, "GET", "/api/goals", "user_1", nil))
	if fv(g.CalorieTarget) != 2000 || fv(g.ProteinTarget) != 150 || sv(g.Source) != "coach" {
		t.Errorf("after partial PUT: cal=%v prot=%v source=%q", fv(g.CalorieTarget), fv(g.ProteinTarget), sv(g.Source))
	}
}

// Calorie safety band (guideline 1.4.1): PUT /api/goals must reject targets
// outside [1200, 10000] and never persist them.
func TestGoalsPutRejectsUnsafeCalorieTarget(t *testing.T) {
	mux, _ := newMux()

	for _, unsafe := range []float64{0, 800, 1199, 10001, 50000} {
		rr := do(t, mux, "PUT", "/api/goals", "user_1", map[string]any{"calorie_target": unsafe})
		if rr.Code != http.StatusBadRequest {
			t.Errorf("calorie_target=%v: got %d, want 400", unsafe, rr.Code)
		}
	}
	// Nothing was persisted by the rejected writes.
	if rr := do(t, mux, "GET", "/api/goals", "user_1", nil); rr.Code != http.StatusNotFound {
		t.Fatalf("goals exist after rejected PUTs: %d, body %s", rr.Code, rr.Body.String())
	}
	// Band edges are accepted.
	for _, ok := range []float64{1200, 10000} {
		if rr := do(t, mux, "PUT", "/api/goals", "user_1", map[string]any{"calorie_target": ok}); rr.Code != http.StatusOK {
			t.Errorf("calorie_target=%v: got %d, want 200", ok, rr.Code)
		}
	}
}

// ---------------------------------------------------------------------------
// body weight
// ---------------------------------------------------------------------------

func TestBodyWeightFlow(t *testing.T) {
	mux, _ := newMux()

	for _, d := range []string{"2026-07-05", "2026-07-10", "2026-07-01"} {
		rr := do(t, mux, "POST", "/api/body-weight", "user_1", map[string]any{"date": d, "weight": 80.5})
		if rr.Code != http.StatusCreated {
			t.Fatalf("POST body-weight %s: got %d, body %s", d, rr.Code, rr.Body.String())
		}
	}

	list := decodeData[[]goals.BodyWeight](t, do(t, mux, "GET", "/api/body-weight", "user_1", nil))
	if len(list) != 3 {
		t.Fatalf("got %d entries, want 3", len(list))
	}
	wantOrder := []string{"2026-07-10", "2026-07-05", "2026-07-01"}
	for i, want := range wantOrder {
		if list[i].Date != want {
			t.Errorf("entry %d: date %s, want %s (date DESC)", i, list[i].Date, want)
		}
	}
	if list[0].Unit != "kg" {
		t.Errorf("default unit = %q, want kg", list[0].Unit)
	}

	rr := do(t, mux, "DELETE", "/api/body-weight/"+list[0].ID, "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("DELETE: got %d", rr.Code)
	}
	list = decodeData[[]goals.BodyWeight](t, do(t, mux, "GET", "/api/body-weight", "user_1", nil))
	if len(list) != 2 {
		t.Fatalf("after delete: got %d entries, want 2", len(list))
	}
}

func TestBodyWeightOwnership(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/body-weight", "user_1", map[string]any{"date": "2026-07-10", "weight": 80})
	created := decodeData[goals.BodyWeight](t, rr)

	if rr := do(t, mux, "DELETE", "/api/body-weight/"+created.ID, "user_2", nil); rr.Code != http.StatusForbidden {
		t.Errorf("other user delete: got %d, want 403", rr.Code)
	}
	if rr := do(t, mux, "DELETE", "/api/body-weight/nope", "user_1", nil); rr.Code != http.StatusNotFound {
		t.Errorf("missing row delete: got %d, want 404", rr.Code)
	}
	// Other user's list stays empty.
	if list := decodeData[[]goals.BodyWeight](t, do(t, mux, "GET", "/api/body-weight", "user_2", nil)); len(list) != 0 {
		t.Errorf("user_2 sees %d entries, want 0", len(list))
	}
}

func TestBodyWeightValidation(t *testing.T) {
	mux, _ := newMux()
	cases := []map[string]any{
		{"weight": 80},                       // no date
		{"date": "2026-07-10"},               // no weight
		{"date": "2026-07-10", "weight": 0},  // zero weight
		{"date": "2026-07-10", "weight": -5}, // negative weight
		{"date": "not-a-date", "weight": 80}, // bad date
	}
	for i, body := range cases {
		if rr := do(t, mux, "POST", "/api/body-weight", "user_1", body); rr.Code != http.StatusBadRequest {
			t.Errorf("case %d (%v): got %d, want 400", i, body, rr.Code)
		}
	}
}
