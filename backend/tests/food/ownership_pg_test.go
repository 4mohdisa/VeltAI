package foodtests

// Row 16 step 2: ownership of the food routes that take an {id}, against a REAL
// Postgres and through the real auth.Middleware. User B sends a token signed
// with a key generated here and must be refused on every one of user A's ids,
// and user A's rows must read back unchanged afterwards.
//
// Skipped unless LUME_TEST_DATABASE_URL is set — see days_pg_test.go.

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
	"lume/backend/internal/food"
	"lume/backend/internal/recipes"
)

const unknownLogID = "00000000-0000-0000-0000-000000000000"

// seedOwner creates a profile with an example.test email and removes it, and
// everything that cascades from it, when the test ends.
func seedOwner(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id, email) VALUES ($1, $1 || '@example.test')
		ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	return id
}

// signedTokens returns the real auth middleware around h, verifying RS256
// tokens against a key generated for this test, and a signer for user ids.
func signedTokens(t *testing.T, h http.Handler) (http.Handler, func(userID string) string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	verifier := &auth.JWTVerifier{Keyfunc: func(*jwt.Token) (any, error) { return &key.PublicKey, nil }}
	sign := func(userID string) string {
		s, err := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
			"sub": userID, "exp": time.Now().Add(time.Hour).Unix(),
		}).SignedString(key)
		if err != nil {
			t.Fatalf("sign token: %v", err)
		}
		return s
	}
	return auth.Middleware(verifier)(h), sign
}

// sender wraps h in signedTokens and returns a function that sends one
// request as the given user.
func sender(t *testing.T, h http.Handler) func(method, path, user, body string) *httptest.ResponseRecorder {
	t.Helper()
	h, sign := signedTokens(t, h)
	return func(method, path, user, body string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+sign(user))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
}

func TestPG_FoodRoutesRefuseAnotherUsersIDs(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	a := seedOwner(t, pool, fmt.Sprintf("owner_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("owner_b_%d", os.Getpid()))
	logID := seedMealLog(t, pool, a, "lunch")
	saved, err := store.CreateSaved(ctx, food.SavedFood{UserID: a, FoodName: "Protein Bar", Calories: 200})
	if err != nil {
		t.Fatalf("seed saved food: %v", err)
	}
	send := sender(t, newMux(store, nil))
	snapshot := func() string {
		t.Helper()
		var meal, name string
		var cal float64
		var savedRows int
		if err := pool.QueryRow(ctx, `SELECT meal_type, food_name, calories FROM food_logs WHERE id::text = $1`, logID).
			Scan(&meal, &name, &cal); err != nil {
			t.Fatalf("read log back: %v", err)
		}
		if err := pool.QueryRow(ctx, `SELECT count(*) FROM saved_foods WHERE id::text = $1 AND user_id = $2`, saved.ID, a).
			Scan(&savedRows); err != nil {
			t.Fatalf("read saved food back: %v", err)
		}
		return fmt.Sprintf("%s|%s|%v|%d", meal, name, cal, savedRows)
	}

	// The token path works: user A reads their own log.
	if rec := send(http.MethodGet, "/api/food/logs/"+logID, a, ""); rec.Code != http.StatusOK {
		t.Fatalf("owner GET = %d, want 200 (body %s)", rec.Code, rec.Body.String())
	}
	before := snapshot()

	cases := []struct {
		name, method, path, body string
		want                     int
	}{
		{"read A's log", http.MethodGet, "/api/food/logs/" + logID, "", http.StatusForbidden},
		{"edit A's log", http.MethodPatch, "/api/food/logs/" + logID, `{"food_name":"Hijacked","calories":1}`, http.StatusForbidden},
		{"delete A's log", http.MethodDelete, "/api/food/logs/" + logID, "", http.StatusForbidden},
		{"delete A's saved food", http.MethodDelete, "/api/food/saved/" + saved.ID, "", http.StatusForbidden},
		{"read an unknown log", http.MethodGet, "/api/food/logs/" + unknownLogID, "", http.StatusNotFound},
		{"edit an unknown log", http.MethodPatch, "/api/food/logs/" + unknownLogID, `{"calories":1}`, http.StatusNotFound},
		{"delete an unknown saved food", http.MethodDelete, "/api/food/saved/" + unknownLogID, "", http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if rec := send(tc.method, tc.path, b, tc.body); rec.Code != tc.want {
				t.Fatalf("user B %s %s = %d, want %d (body %s)", tc.method, tc.path, rec.Code, tc.want, rec.Body.String())
			}
			if after := snapshot(); after != before {
				t.Fatalf("user A's rows changed: %s, was %s", after, before)
			}
		})
	}
}

// recipeMux mounts the recipe and saved meal routes on the real Postgres store.
func recipeMux(pool *pgxpool.Pool) *http.ServeMux {
	mux := http.NewServeMux()
	recipes.Register(mux, recipes.NewPGStore(pool))
	return mux
}

// seedRecipeAndMeal creates, as user, a recipe with two ingredients and a
// saved meal with two items through the real POST routes.
func seedRecipeAndMeal(t *testing.T, send func(method, path, user, body string) *httptest.ResponseRecorder, user string) (recipes.Recipe, recipes.SavedMeal) {
	t.Helper()
	rec := send(http.MethodPost, "/api/recipes", user, `{"name":"Oats","serving_count":2,"ingredients":[
		{"food_name":"Rolled oats","quantity_g":80,"calories":300},
		{"food_name":"Milk","quantity_g":200,"calories":130}]}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create recipe = %d (body %s)", rec.Code, rec.Body.String())
	}
	recipe := data[recipes.Recipe](t, rec)
	rec = send(http.MethodPost, "/api/saved-meals", user, `{"name":"Usual lunch","meal_type":"lunch","items":[
		{"food_name":"Rice","quantity_g":150,"calories":200},
		{"food_name":"Chicken","quantity_g":120,"calories":190}]}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create saved meal = %d (body %s)", rec.Code, rec.Body.String())
	}
	meal := data[recipes.SavedMeal](t, rec)
	if len(meal.Items) != 2 {
		t.Fatalf("saved meal has %d items, want 2", len(meal.Items))
	}
	return recipe, meal
}

// recipeRows reads back the recipe and saved meal with their child rows, the
// owner's recipe and saved meal counts, and the food_logs count for owner and
// other. Child rows are sorted by name because their stored order is random
// (KNOWN_ISSUES.md).
func recipeRows(t *testing.T, pool *pgxpool.Pool, recipeID, mealID, owner, other string) string {
	t.Helper()
	var s string
	if err := pool.QueryRow(context.Background(), `SELECT concat_ws('|',
		(SELECT concat_ws(':', name, total_calories, serving_count, updated_at) FROM recipes
			WHERE id::text = $1 AND user_id = $3),
		(SELECT string_agg(concat_ws(':', food_name, quantity_g, calories), ',' ORDER BY food_name)
			FROM recipe_ingredients WHERE recipe_id::text = $1),
		(SELECT concat_ws(':', name, total_calories, logged_count, last_logged) FROM saved_meals
			WHERE id::text = $2 AND user_id = $3),
		(SELECT string_agg(concat_ws(':', food_name, quantity_g, calories), ',' ORDER BY food_name)
			FROM saved_meal_items WHERE saved_meal_id::text = $2),
		(SELECT count(*) FROM recipes WHERE user_id = $3),
		(SELECT count(*) FROM saved_meals WHERE user_id = $3),
		(SELECT count(*) FROM food_logs WHERE user_id IN ($3, $4)))`,
		recipeID, mealID, owner, other).Scan(&s); err != nil {
		t.Fatalf("read rows back: %v", err)
	}
	return s
}

func TestPG_RecipeAndSavedMealRoutesRefuseAnotherUsersIDs(t *testing.T) {
	_, pool := daysPGStore(t)
	a := seedOwner(t, pool, fmt.Sprintf("recipe_owner_a_%d", os.Getpid()))
	b := seedOwner(t, pool, fmt.Sprintf("recipe_owner_b_%d", os.Getpid()))
	send := sender(t, recipeMux(pool))
	recipe, meal := seedRecipeAndMeal(t, send, a)

	// The token path works: user A reads their own recipe.
	rec := send(http.MethodGet, "/api/recipes/"+recipe.ID, a, "")
	if rec.Code != http.StatusOK || len(data[recipes.Recipe](t, rec).Ingredients) != 2 {
		t.Fatalf("owner GET = %d, want 200 with 2 ingredients (body %s)", rec.Code, rec.Body.String())
	}

	snapshot := func() string { return recipeRows(t, pool, recipe.ID, meal.ID, a, b) }
	before := snapshot()

	cases := []struct {
		name, method, path, body string
		want                     int
	}{
		{"read A's recipe", http.MethodGet, "/api/recipes/" + recipe.ID, "", http.StatusForbidden},
		{"edit A's recipe", http.MethodPatch, "/api/recipes/" + recipe.ID, `{"name":"Hijacked","ingredients":[{"food_name":"X","calories":1}]}`, http.StatusForbidden},
		{"delete A's recipe", http.MethodDelete, "/api/recipes/" + recipe.ID, "", http.StatusForbidden},
		{"log A's recipe", http.MethodPost, "/api/recipes/" + recipe.ID + "/log", `{"meal_type":"lunch"}`, http.StatusForbidden},
		{"log A's saved meal", http.MethodPost, "/api/saved-meals/" + meal.ID + "/log", `{"meal_type":"lunch"}`, http.StatusForbidden},
		{"delete A's saved meal", http.MethodDelete, "/api/saved-meals/" + meal.ID, "", http.StatusForbidden},
		{"read an unknown recipe", http.MethodGet, "/api/recipes/" + unknownLogID, "", http.StatusNotFound},
		{"edit an unknown recipe", http.MethodPatch, "/api/recipes/" + unknownLogID, `{"name":"X"}`, http.StatusNotFound},
		{"delete an unknown recipe", http.MethodDelete, "/api/recipes/" + unknownLogID, "", http.StatusNotFound},
		{"log an unknown recipe", http.MethodPost, "/api/recipes/" + unknownLogID + "/log", `{"meal_type":"lunch"}`, http.StatusNotFound},
		{"log an unknown saved meal", http.MethodPost, "/api/saved-meals/" + unknownLogID + "/log", `{"meal_type":"lunch"}`, http.StatusNotFound},
		{"delete an unknown saved meal", http.MethodDelete, "/api/saved-meals/" + unknownLogID, "", http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if rec := send(tc.method, tc.path, b, tc.body); rec.Code != tc.want {
				t.Fatalf("user B %s %s = %d, want %d (body %s)", tc.method, tc.path, rec.Code, tc.want, rec.Body.String())
			}
			if after := snapshot(); after != before {
				t.Fatalf("user A's rows changed: %s, was %s", after, before)
			}
		})
	}
}
