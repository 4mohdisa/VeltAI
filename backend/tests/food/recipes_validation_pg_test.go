package foodtests

// Row 16 step 3: bad input on the recipe and saved meal write routes, against
// a REAL Postgres and through the real auth.Middleware. A signed-in owner
// sending a malformed body, a wrong JSON type or a missing or invalid field
// gets 400 in the standard error envelope (wantErrorEnvelope in
// validation_pg_test.go), and nothing is written. Only cases the handlers
// reject today are here; the gaps are listed in PHASE4_ROWS.md Row 16.
//
// Skipped unless LUME_TEST_DATABASE_URL is set — see days_pg_test.go.

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestPG_RecipeAndSavedMealWriteRoutesRejectBadInput(t *testing.T) {
	_, pool := daysPGStore(t)
	user := seedOwner(t, pool, fmt.Sprintf("recipe_validation_%d", os.Getpid()))
	send := sender(t, recipeMux(pool))
	recipe, meal := seedRecipeAndMeal(t, send, user)
	snapshot := func() string { return recipeRows(t, pool, recipe.ID, meal.ID, user, user) }
	before := snapshot()

	recipePath := "/api/recipes/" + recipe.ID
	mealLogPath := "/api/saved-meals/" + meal.ID + "/log"
	cases := []struct {
		name, method, path, body string
	}{
		{"create recipe, malformed body", http.MethodPost, "/api/recipes", `{"name":`},
		{"create recipe, name as number", http.MethodPost, "/api/recipes", `{"name":42,"ingredients":[{"food_name":"Oats","calories":1}]}`},
		{"create recipe, no name", http.MethodPost, "/api/recipes", `{"ingredients":[{"food_name":"Oats","calories":1}]}`},
		{"create recipe, no ingredients", http.MethodPost, "/api/recipes", `{"name":"Soup"}`},
		{"edit recipe, malformed body", http.MethodPatch, recipePath, `{"name":`},
		{"edit recipe, serving_count as text", http.MethodPatch, recipePath, `{"serving_count":"two"}`},
		{"edit recipe, empty name", http.MethodPatch, recipePath, `{"name":"  "}`},
		{"edit recipe, zero serving_count", http.MethodPatch, recipePath, `{"serving_count":0}`},
		{"log recipe, malformed body", http.MethodPost, recipePath + "/log", `{"servings":`},
		{"log recipe, servings as text", http.MethodPost, recipePath + "/log", `{"servings":"one"}`},
		{"log recipe, negative servings", http.MethodPost, recipePath + "/log", `{"servings":-1}`},
		{"log recipe, bad date", http.MethodPost, recipePath + "/log", `{"date":"14/07/2026"}`},
		{"create saved meal, malformed body", http.MethodPost, "/api/saved-meals", `{"name":`},
		{"create saved meal, items as text", http.MethodPost, "/api/saved-meals", `{"name":"Lunch","items":"rice"}`},
		{"create saved meal, no name", http.MethodPost, "/api/saved-meals", `{"items":[{"food_name":"Rice","calories":1}]}`},
		{"create saved meal, no items", http.MethodPost, "/api/saved-meals", `{"name":"Lunch"}`},
		{"log saved meal, malformed body", http.MethodPost, mealLogPath, `{"date":`},
		{"log saved meal, date as number", http.MethodPost, mealLogPath, `{"date":20260714}`},
		{"log saved meal, bad date", http.MethodPost, mealLogPath, `{"date":"14/07/2026"}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantErrorEnvelope(t, send(tc.method, tc.path, user, tc.body), http.StatusBadRequest, "")
			if after := snapshot(); after != before {
				t.Fatalf("rows changed: %s, was %s", after, before)
			}
		})
	}

	for _, r := range []struct{ method, path, body string }{
		{http.MethodGet, "/api/recipes/" + unknownLogID, ""},
		{http.MethodPatch, "/api/recipes/" + unknownLogID, `{"name":"X"}`},
		{http.MethodDelete, "/api/recipes/" + unknownLogID, ""},
		{http.MethodPost, "/api/recipes/" + unknownLogID + "/log", `{"meal_type":"lunch"}`},
		{http.MethodPost, "/api/saved-meals/" + unknownLogID + "/log", `{"meal_type":"lunch"}`},
		{http.MethodDelete, "/api/saved-meals/" + unknownLogID, ""},
	} {
		t.Run(r.method+" "+r.path+" is a 404 envelope", func(t *testing.T) {
			wantErrorEnvelope(t, send(r.method, r.path, user, r.body), http.StatusNotFound, "not found")
		})
	}

	t.Run("no token is the 401 envelope", func(t *testing.T) {
		h, _ := signedTokens(t, recipeMux(pool))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/recipes", strings.NewReader(`{"name":"Soup"}`)))
		wantErrorEnvelope(t, rec, http.StatusUnauthorized, "missing bearer token")
		if after := snapshot(); after != before {
			t.Fatalf("rows changed: %s, was %s", after, before)
		}
	})
}
