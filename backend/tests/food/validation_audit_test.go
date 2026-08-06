package foodtests

// Regression tests for the 2026-08-06 audit: pre-audit only calories>=0 was
// checked on food-log writes — protein=-500 / carbs=-1e10 / meal_type
// 'not_a_meal' all reached disk and silently corrupted /summary, the energy
// balance and the AI-brain inputs.

import (
	"net/http"
	"testing"
)

func TestCreateLogRejectsNegativeMacros(t *testing.T) {
	mux := newMux(&fakeStore{}, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_val_1", map[string]any{
		"food_name": "Evil oats", "calories": 300, "protein": -500,
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("protein=-500: got %d, want 400; body %s", rr.Code, rr.Body.String())
	}
	rr = do(t, mux, "POST", "/api/food/logs", "user_val_1", map[string]any{
		"food_name": "Evil oats", "calories": 300, "carbs": 1e10,
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("carbs=1e10: got %d, want 400", rr.Code)
	}
}

func TestCreateLogRejectsUnknownMealType(t *testing.T) {
	mux := newMux(&fakeStore{}, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_val_2", map[string]any{
		"food_name": "Oats", "calories": 300, "meal_type": "not_a_meal",
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("meal_type=not_a_meal: got %d, want 400; body %s", rr.Code, rr.Body.String())
	}
}

func TestPatchLogRejectsNegativeMacros(t *testing.T) {
	mux := newMux(&fakeStore{}, nil)
	rr := do(t, mux, "POST", "/api/food/logs", "user_val_3", map[string]any{
		"food_name": "Oats", "calories": 300,
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("seed create: got %d", rr.Code)
	}
	created := data[struct {
		ID string `json:"id"`
	}](t, rr)
	rr = do(t, mux, "PATCH", "/api/food/logs/"+created.ID, "user_val_3", map[string]any{"fat": -50})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("fat=-50 patch: got %d, want 400; body %s", rr.Code, rr.Body.String())
	}
}

func TestQuickAddRejectsUnknownMealType(t *testing.T) {
	mux := newMux(&fakeStore{}, nil)
	rr := do(t, mux, "POST", "/api/food/quick-add", "user_val_4", map[string]any{
		"calories": 250, "meal_type": "elevenses",
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("quick-add meal_type=elevenses: got %d, want 400; body %s", rr.Code, rr.Body.String())
	}
}
