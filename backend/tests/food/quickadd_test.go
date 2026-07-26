package foodtests

import (
	"net/http"
	"testing"

	"lumo/backend/internal/food"
)

// --- B) quick-add -------------------------------------------------------

func TestQuickAddOnlyCaloriesWithLabel(t *testing.T) {
	f := &fakeStore{}
	rr := do(t, newMux(f, nil), "POST", "/api/food/quick-add", "user_1",
		map[string]any{"calories": 250, "label": "Handful of nuts"})
	if rr.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body %s)", rr.Code, rr.Body.String())
	}
	l := data[food.Log](t, rr)
	if l.Calories != 250 {
		t.Errorf("calories = %v, want 250", l.Calories)
	}
	if l.FoodName != "Handful of nuts" {
		t.Errorf("food_name = %q, want label", l.FoodName)
	}
	if l.Protein != 0 || l.Carbs != 0 || l.Fat != 0 || l.Fibre != 0 {
		t.Errorf("expected zero macros, got %+v", l)
	}
	if l.Source == nil || *l.Source != "quick_add" {
		t.Errorf("source = %v, want quick_add", l.Source)
	}
}

func TestQuickAddDefaultsFoodNameToQuickAdd(t *testing.T) {
	f := &fakeStore{}
	rr := do(t, newMux(f, nil), "POST", "/api/food/quick-add", "user_1",
		map[string]any{"calories": 100})
	if rr.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body %s)", rr.Code, rr.Body.String())
	}
	l := data[food.Log](t, rr)
	if l.FoodName != "Quick add" {
		t.Errorf("food_name = %q, want %q", l.FoodName, "Quick add")
	}
}

func TestQuickAddMissingCalories400(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "POST", "/api/food/quick-add", "user_1",
		map[string]any{"label": "Snack"})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rr.Code)
	}
}

func TestQuickAddNegativeCalories400(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "POST", "/api/food/quick-add", "user_1",
		map[string]any{"calories": -1})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rr.Code)
	}
}

// --- C) portion memory ----------------------------------------------------

func TestPortionMemoryNotFound(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "GET", "/api/food/portion-memory?food_name=Oats", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	resp := data[struct {
		Found          bool     `json:"found"`
		TypicalWeightG *float64 `json:"typical_weight_g"`
	}](t, rr)
	if resp.Found {
		t.Error("expected found = false for never-logged food")
	}
	if resp.TypicalWeightG != nil {
		t.Errorf("expected nil typical_weight_g, got %v", *resp.TypicalWeightG)
	}
}

func TestPortionMemoryMissingFoodName400(t *testing.T) {
	rr := do(t, newMux(&fakeStore{}, nil), "GET", "/api/food/portion-memory", "user_1", nil)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rr.Code)
	}
}

func TestPortionMemoryAfterLog(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Rice Bowl", "calories": 400, "quantity": 250, "meal_type": "lunch",
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create log status = %d (body %s)", rr.Code, rr.Body.String())
	}
	rr = do(t, mux, "GET", "/api/food/portion-memory?food_name=Rice+Bowl", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	resp := data[struct {
		Found           bool     `json:"found"`
		TypicalWeightG  *float64 `json:"typical_weight_g"`
		LoggedCount     int      `json:"logged_count"`
		TypicalMealType *string  `json:"typical_meal_type"`
	}](t, rr)
	if !resp.Found {
		t.Fatal("expected found = true")
	}
	if resp.TypicalWeightG == nil || *resp.TypicalWeightG != 250 {
		t.Errorf("typical_weight_g = %v, want 250", resp.TypicalWeightG)
	}
	if resp.LoggedCount != 1 {
		t.Errorf("logged_count = %d, want 1", resp.LoggedCount)
	}
	if resp.TypicalMealType == nil || *resp.TypicalMealType != "lunch" {
		t.Errorf("typical_meal_type = %v, want lunch", resp.TypicalMealType)
	}
}

// --- D) learning hooks -----------------------------------------------------

func TestCreateLogUpsertsPortionPrefWeightedAverage(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Oats", "calories": 300, "quantity": 100, "meal_type": "breakfast",
	})
	do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Oats", "calories": 300, "quantity": 200, "meal_type": "breakfast",
	})
	p, err := f.GetPortionPref(nil, "user_1", "Oats")
	if err != nil {
		t.Fatal(err)
	}
	if p == nil {
		t.Fatal("expected portion pref to exist")
	}
	if p.LoggedCount != 2 {
		t.Errorf("logged_count = %d, want 2", p.LoggedCount)
	}
	// (100*1 + 200) / 2 = 150
	if p.TypicalWeightG == nil || *p.TypicalWeightG != 150 {
		t.Errorf("typical_weight_g = %v, want 150 (weighted average)", p.TypicalWeightG)
	}
}

func TestCreateLogIncrementsLoggedCountOnRepeat(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	for i := 0; i < 3; i++ {
		do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
			"food_name": "Toast", "calories": 150, "quantity": 50,
		})
	}
	p, _ := f.GetPortionPref(nil, "user_1", "Toast")
	if p == nil || p.LoggedCount != 3 {
		t.Fatalf("expected logged_count = 3, got %+v", p)
	}
}

func TestPatchLogQuantityUpdatesPortionPref(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Pasta", "calories": 500, "quantity": 200,
	})
	l := data[food.Log](t, rr)
	do(t, mux, "PATCH", "/api/food/logs/"+l.ID, "user_1", map[string]any{"quantity": 300})
	p, _ := f.GetPortionPref(nil, "user_1", "Pasta")
	if p == nil {
		t.Fatal("expected portion pref to exist")
	}
	// (200*1 + 300) / 2 = 250
	if p.TypicalWeightG == nil || *p.TypicalWeightG != 250 {
		t.Errorf("typical_weight_g = %v, want 250 after patch", p.TypicalWeightG)
	}
}

func TestPatchLogFoodNameSavesCorrection(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Chiken Tikka", "calories": 300,
	})
	l := data[food.Log](t, rr)
	do(t, mux, "PATCH", "/api/food/logs/"+l.ID, "user_1", map[string]any{"food_name": "Chicken Tikka"})
	if len(f.corrections) != 1 {
		t.Fatalf("expected 1 correction, got %d: %+v", len(f.corrections), f.corrections)
	}
	c := f.corrections[0]
	if c.original != "Chiken Tikka" || c.corrected != "Chicken Tikka" || c.userID != "user_1" {
		t.Errorf("unexpected correction: %+v", c)
	}
}

func TestMealMemoryCreatesAutoGeneratedOnThirdDay(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	days := []string{"2026-07-01", "2026-07-02", "2026-07-03"}
	for i, d := range days {
		do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
			"food_name": "Eggs", "calories": 150, "date": d, "meal_type": "breakfast",
		})
		do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
			"food_name": "Toast", "calories": 120, "date": d, "meal_type": "breakfast",
		})
		wantMeals := 0
		if i == 2 { // 3rd distinct matching day
			wantMeals = 1
		}
		if len(f.savedMeals) != wantMeals {
			t.Fatalf("after day %d (%s): saved_meals = %d, want %d", i+1, d, len(f.savedMeals), wantMeals)
		}
	}
	sm := f.savedMeals[0]
	if !sm.autoGenerated || sm.mealType != "breakfast" || sm.loggedCount != 1 {
		t.Errorf("unexpected auto-generated saved meal: %+v", sm)
	}
	if len(sm.items) != 2 {
		t.Errorf("expected 2 items, got %+v", sm.items)
	}
}

func TestBrainNeedsRebuildAfterFifthLog(t *testing.T) {
	f := &fakeStore{brainExists: map[string]bool{"user_1": true}}
	mux := newMux(f, nil)
	for i := 0; i < 4; i++ {
		do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
			"food_name": "Snack", "calories": 100,
		})
		if f.brainNeedsRebuild["user_1"] {
			t.Fatalf("needs_rebuild set too early, after log %d", i+1)
		}
	}
	do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Snack", "calories": 100,
	})
	if !f.brainNeedsRebuild["user_1"] {
		t.Error("expected needs_rebuild = true after the 5th log")
	}
}

func TestDeleteLogDoesNotModifyPortionPref(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_1", map[string]any{
		"food_name": "Yogurt", "calories": 120, "quantity": 170,
	})
	l := data[food.Log](t, rr)
	before, _ := f.GetPortionPref(nil, "user_1", "Yogurt")
	do(t, mux, "DELETE", "/api/food/logs/"+l.ID, "user_1", nil)
	after, _ := f.GetPortionPref(nil, "user_1", "Yogurt")
	if before == nil || after == nil {
		t.Fatal("expected portion pref to exist before and after delete")
	}
	if *before.TypicalWeightG != *after.TypicalWeightG || before.LoggedCount != after.LoggedCount {
		t.Errorf("portion pref changed by delete: before %+v, after %+v", before, after)
	}
}
