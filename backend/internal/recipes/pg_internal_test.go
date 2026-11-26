// In-package real-SQL tests for the recipe and saved meal handlers on top of
// PGStore. They run against LUME_TEST_DATABASE_URL, a disposable local
// database with every migration applied, and skip without it, like the other
// TestPG suites. Each test owns its profile rows and deletes them on cleanup;
// recipes, saved meals and food_logs cascade from profiles.
package recipes

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/auth"
)

const unknownUUID = "00000000-0000-0000-0000-000000000000"

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// testUser makes a fresh profile and deletes it (and everything that cascades
// from it) when the test ends.
func testUser(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, id); err != nil {
		t.Fatalf("clear profile: %v", err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1)`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	return id
}

func newMux(pool *pgxpool.Pool) *http.ServeMux {
	mux := http.NewServeMux()
	Register(mux, NewPGStore(pool))
	return mux
}

// call sends body as JSON, or as raw bytes when it is a string.
func call(t *testing.T, mux *http.ServeMux, method, path, user string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var raw []byte
	switch b := body.(type) {
	case nil:
	case string:
		raw = []byte(b)
	default:
		var err error
		if raw, err = json.Marshal(b); err != nil {
			t.Fatalf("marshal body: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(raw))
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	return rr
}

func decode[T any](t *testing.T, rr *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data T `json:"data"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode envelope: %v (body %s)", err, rr.Body.String())
	}
	return env.Data
}

func wantStatus(t *testing.T, rr *httptest.ResponseRecorder, want int) {
	t.Helper()
	if rr.Code != want {
		t.Fatalf("status = %d, want %d (body %s)", rr.Code, want, rr.Body.String())
	}
}

var curry = map[string]any{
	"name":          "Curry",
	"serving_count": 4,
	"ingredients": []map[string]any{
		{"food_name": "Chicken", "quantity_g": 400, "calories": 800, "protein": 120, "fat": 32},
		{"food_name": "Rice", "quantity_g": 200, "calories": 260, "protein": 5, "carbs": 56, "fibre": 2},
	},
}

var shake = map[string]any{
	"name":      "Shake",
	"meal_type": "snack",
	"items": []map[string]any{
		{"food_name": "Whey", "quantity_g": 30, "calories": 120, "protein": 24},
		{"food_name": "Banana", "quantity_g": 120, "calories": 100, "protein": 1, "carbs": 27},
	},
}

func createRecipe(t *testing.T, mux *http.ServeMux, user string) Recipe {
	t.Helper()
	rr := call(t, mux, "POST", "/api/recipes", user, curry)
	wantStatus(t, rr, http.StatusCreated)
	return decode[Recipe](t, rr)
}

func createMeal(t *testing.T, mux *http.ServeMux, user string) SavedMeal {
	t.Helper()
	rr := call(t, mux, "POST", "/api/saved-meals", user, shake)
	wantStatus(t, rr, http.StatusCreated)
	return decode[SavedMeal](t, rr)
}

type loggedRow struct {
	Date, MealType, Source string
	Quantity, Calories     float64
}

func foodLogs(t *testing.T, pool *pgxpool.Pool, user string) []loggedRow {
	t.Helper()
	rows, err := pool.Query(context.Background(), `SELECT date::text, meal_type, source, quantity, calories
		FROM food_logs WHERE user_id = $1 ORDER BY food_name`, user)
	if err != nil {
		t.Fatalf("read food_logs: %v", err)
	}
	defer rows.Close()
	var out []loggedRow
	for rows.Next() {
		var r loggedRow
		if err := rows.Scan(&r.Date, &r.MealType, &r.Source, &r.Quantity, &r.Calories); err != nil {
			t.Fatalf("scan food_logs: %v", err)
		}
		out = append(out, r)
	}
	return out
}

func TestPGRecipeLifecycle(t *testing.T) {
	pool := testPool(t)
	mux := newMux(pool)
	user := testUser(t, pool, "user_pg_recipe_lifecycle")

	rr := call(t, mux, "GET", "/api/recipes", user, nil)
	wantStatus(t, rr, http.StatusOK)
	if got := decode[[]Recipe](t, rr); got == nil || len(got) != 0 {
		t.Fatalf("empty list = %v, want []", got)
	}

	rec := createRecipe(t, mux, user)
	if rec.TotalCalories != 1060 || rec.TotalProtein != 125 || rec.TotalCarbs != 56 || rec.TotalFat != 32 || rec.TotalFibre != 2 || rec.ServingCount != 4 {
		t.Fatalf("created recipe totals wrong: %+v", rec)
	}

	rr = call(t, mux, "GET", "/api/recipes", user, nil)
	wantStatus(t, rr, http.StatusOK)
	if list := decode[[]Recipe](t, rr); len(list) != 1 || list[0].ID != rec.ID || list[0].Ingredients != nil {
		t.Fatalf("list = %+v, want one recipe without ingredients", list)
	}

	rr = call(t, mux, "GET", "/api/recipes/"+rec.ID, user, nil)
	wantStatus(t, rr, http.StatusOK)
	if got := decode[Recipe](t, rr); len(got.Ingredients) != 2 || got.Name != "Curry" {
		t.Fatalf("get = %+v, want Curry with 2 ingredients", got)
	}

	rr = call(t, mux, "PATCH", "/api/recipes/"+rec.ID, user, map[string]any{"name": "Thai Curry", "description": "Weeknight"})
	wantStatus(t, rr, http.StatusOK)
	got := decode[Recipe](t, rr)
	if got.Name != "Thai Curry" || got.Description == nil || *got.Description != "Weeknight" || got.TotalCalories != 1060 || len(got.Ingredients) != 2 {
		t.Fatalf("name patch = %+v, want new name and untouched ingredients", got)
	}

	rr = call(t, mux, "PATCH", "/api/recipes/"+rec.ID, user, map[string]any{
		"serving_count": 2,
		"ingredients":   []map[string]any{{"food_name": "Tofu", "quantity_g": 300, "calories": 360, "protein": 36}},
	})
	wantStatus(t, rr, http.StatusOK)
	got = decode[Recipe](t, rr)
	if got.Name != "Thai Curry" || got.ServingCount != 2 || got.TotalCalories != 360 || got.TotalProtein != 36 || len(got.Ingredients) != 1 {
		t.Fatalf("ingredient patch = %+v, want 1 ingredient, 360 kcal, 2 servings", got)
	}

	// 2-serving recipe logged as 1 serving: every row is halved.
	rr = call(t, mux, "POST", "/api/recipes/"+rec.ID+"/log", user, map[string]any{"meal_type": "dinner", "servings": 1, "date": "2026-07-12"})
	wantStatus(t, rr, http.StatusOK)
	if n := decode[map[string]int](t, rr)["entries_created"]; n != 1 {
		t.Fatalf("entries_created = %d, want 1", n)
	}
	logs := foodLogs(t, pool, user)
	if len(logs) != 1 || logs[0] != (loggedRow{Date: "2026-07-12", MealType: "dinner", Source: "recipe", Quantity: 150, Calories: 180}) {
		t.Fatalf("food_logs = %+v, want one halved recipe row", logs)
	}

	// Zero servings and no date fall back to 1 serving today.
	rr = call(t, mux, "POST", "/api/recipes/"+rec.ID+"/log", user, map[string]any{"meal_type": "lunch"})
	wantStatus(t, rr, http.StatusOK)
	if logs := foodLogs(t, pool, user); len(logs) != 2 {
		t.Fatalf("food_logs = %d rows, want 2", len(logs))
	}

	rr = call(t, mux, "DELETE", "/api/recipes/"+rec.ID, user, nil)
	wantStatus(t, rr, http.StatusOK)
	wantStatus(t, call(t, mux, "GET", "/api/recipes/"+rec.ID, user, nil), http.StatusNotFound)
}

func TestPGRecipeValidation(t *testing.T) {
	pool := testPool(t)
	mux := newMux(pool)
	user := testUser(t, pool, "user_pg_recipe_validation")
	rec := createRecipe(t, mux, user)
	byID := "/api/recipes/" + rec.ID

	cases := []struct {
		name, method, path string
		body               any
		want               int
	}{
		{"create invalid JSON", "POST", "/api/recipes", "{", http.StatusBadRequest},
		{"create wrong type", "POST", "/api/recipes", `{"name": 7}`, http.StatusBadRequest},
		{"create missing name", "POST", "/api/recipes", map[string]any{"ingredients": curry["ingredients"]}, http.StatusBadRequest},
		{"create blank name", "POST", "/api/recipes", map[string]any{"name": "  ", "ingredients": curry["ingredients"]}, http.StatusBadRequest},
		{"create no ingredients", "POST", "/api/recipes", map[string]any{"name": "Empty", "ingredients": []any{}}, http.StatusBadRequest},
		{"patch invalid JSON", "PATCH", byID, "{", http.StatusBadRequest},
		{"patch blank name", "PATCH", byID, map[string]any{"name": " "}, http.StatusBadRequest},
		{"patch zero serving_count", "PATCH", byID, map[string]any{"serving_count": 0}, http.StatusBadRequest},
		{"patch negative serving_count", "PATCH", byID, map[string]any{"serving_count": -1}, http.StatusBadRequest},
		{"log invalid JSON", "POST", byID + "/log", "{", http.StatusBadRequest},
		{"log wrong type servings", "POST", byID + "/log", `{"servings": "two"}`, http.StatusBadRequest},
		{"log negative servings", "POST", byID + "/log", map[string]any{"servings": -0.5}, http.StatusBadRequest},
		{"log bad date", "POST", byID + "/log", map[string]any{"date": "12/07/2026"}, http.StatusBadRequest},
		{"log impossible date", "POST", byID + "/log", map[string]any{"date": "2026-02-30"}, http.StatusBadRequest},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantStatus(t, call(t, mux, tc.method, tc.path, user, tc.body), tc.want)
		})
	}

	rr := call(t, mux, "GET", byID, user, nil)
	wantStatus(t, rr, http.StatusOK)
	if got := decode[Recipe](t, rr); got.Name != "Curry" || got.ServingCount != 4 {
		t.Fatalf("rejected requests changed the recipe: %+v", got)
	}
	if logs := foodLogs(t, pool, user); len(logs) != 0 {
		t.Fatalf("rejected logs wrote %d food_logs rows", len(logs))
	}

	// serving_count 0 or below on create is a boundary that defaults to 1.
	rr = call(t, mux, "POST", "/api/recipes", user, map[string]any{"name": "Egg", "serving_count": 0, "ingredients": []map[string]any{{"food_name": "Egg", "calories": 78}}})
	wantStatus(t, rr, http.StatusCreated)
	if got := decode[Recipe](t, rr); got.ServingCount != 1 {
		t.Fatalf("serving_count = %d, want default 1", got.ServingCount)
	}
}

func TestPGRecipeAccess(t *testing.T) {
	pool := testPool(t)
	mux := newMux(pool)
	owner := testUser(t, pool, "user_pg_recipe_owner")
	other := testUser(t, pool, "user_pg_recipe_other")
	byID := "/api/recipes/" + createRecipe(t, mux, owner).ID

	cases := []struct {
		name, method, path, user string
		body                     any
		want                     int
	}{
		{"get other user", "GET", byID, other, nil, http.StatusForbidden},
		{"patch other user", "PATCH", byID, other, map[string]any{"name": "Mine"}, http.StatusForbidden},
		{"log other user", "POST", byID + "/log", other, map[string]any{}, http.StatusForbidden},
		{"delete other user", "DELETE", byID, other, nil, http.StatusForbidden},
		{"get malformed id", "GET", "/api/recipes/nope", owner, nil, http.StatusNotFound},
		{"get unknown id", "GET", "/api/recipes/" + unknownUUID, owner, nil, http.StatusNotFound},
		{"patch unknown id", "PATCH", "/api/recipes/" + unknownUUID, owner, map[string]any{"name": "X"}, http.StatusNotFound},
		{"log unknown id", "POST", "/api/recipes/" + unknownUUID + "/log", owner, map[string]any{}, http.StatusNotFound},
		{"delete unknown id", "DELETE", "/api/recipes/" + unknownUUID, owner, nil, http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantStatus(t, call(t, mux, tc.method, tc.path, tc.user, tc.body), tc.want)
		})
	}

	rr := call(t, mux, "GET", byID, owner, nil)
	wantStatus(t, rr, http.StatusOK)
	if got := decode[Recipe](t, rr); got.Name != "Curry" {
		t.Fatalf("other user changed the recipe: %+v", got)
	}
	if rr := call(t, mux, "GET", "/api/recipes", other, nil); len(decode[[]Recipe](t, rr)) != 0 {
		t.Fatal("other user's list shows the owner's recipe")
	}
	if logs := foodLogs(t, pool, other); len(logs) != 0 {
		t.Fatalf("other user's log wrote %d food_logs rows", len(logs))
	}
}

func TestPGSavedMealLifecycle(t *testing.T) {
	pool := testPool(t)
	mux := newMux(pool)
	user := testUser(t, pool, "user_pg_meal_lifecycle")

	rr := call(t, mux, "GET", "/api/saved-meals", user, nil)
	wantStatus(t, rr, http.StatusOK)
	if got := decode[[]SavedMeal](t, rr); got == nil || len(got) != 0 {
		t.Fatalf("empty list = %v, want []", got)
	}

	meal := createMeal(t, mux, user)
	if meal.TotalCalories != 220 || meal.TotalProtein != 25 || meal.TotalCarbs != 27 || meal.LoggedCount != 1 || meal.LastLogged != nil || meal.AutoGenerated {
		t.Fatalf("created meal = %+v", meal)
	}

	rr = call(t, mux, "POST", "/api/saved-meals/"+meal.ID+"/log", user, map[string]any{"meal_type": "breakfast", "date": "2026-07-12"})
	wantStatus(t, rr, http.StatusOK)
	if n := decode[map[string]int](t, rr)["entries_created"]; n != 2 {
		t.Fatalf("entries_created = %d, want 2", n)
	}
	want := []loggedRow{
		{Date: "2026-07-12", MealType: "breakfast", Source: "saved_meal", Quantity: 120, Calories: 100},
		{Date: "2026-07-12", MealType: "breakfast", Source: "saved_meal", Quantity: 30, Calories: 120},
	}
	if logs := foodLogs(t, pool, user); len(logs) != 2 || logs[0] != want[0] || logs[1] != want[1] {
		t.Fatalf("food_logs = %+v, want unscaled %+v", logs, want)
	}

	// No date falls back to today.
	wantStatus(t, call(t, mux, "POST", "/api/saved-meals/"+meal.ID+"/log", user, map[string]any{"meal_type": "snack"}), http.StatusOK)

	rr = call(t, mux, "GET", "/api/saved-meals", user, nil)
	wantStatus(t, rr, http.StatusOK)
	list := decode[[]SavedMeal](t, rr)
	if len(list) != 1 || len(list[0].Items) != 2 || list[0].LoggedCount != 3 || list[0].LastLogged == nil {
		t.Fatalf("list = %+v, want one meal with 2 items, logged_count 3 and last_logged set", list)
	}

	wantStatus(t, call(t, mux, "DELETE", "/api/saved-meals/"+meal.ID, user, nil), http.StatusOK)
	wantStatus(t, call(t, mux, "DELETE", "/api/saved-meals/"+meal.ID, user, nil), http.StatusNotFound)
}

func TestPGSavedMealValidationAndAccess(t *testing.T) {
	pool := testPool(t)
	mux := newMux(pool)
	owner := testUser(t, pool, "user_pg_meal_owner")
	other := testUser(t, pool, "user_pg_meal_other")
	meal := createMeal(t, mux, owner)
	logPath := "/api/saved-meals/" + meal.ID + "/log"

	cases := []struct {
		name, method, path, user string
		body                     any
		want                     int
	}{
		{"create invalid JSON", "POST", "/api/saved-meals", owner, "{", http.StatusBadRequest},
		{"create wrong type", "POST", "/api/saved-meals", owner, `{"items": "eggs"}`, http.StatusBadRequest},
		{"create blank name", "POST", "/api/saved-meals", owner, map[string]any{"name": " ", "items": shake["items"]}, http.StatusBadRequest},
		{"create no items", "POST", "/api/saved-meals", owner, map[string]any{"name": "Empty"}, http.StatusBadRequest},
		{"log invalid JSON", "POST", logPath, owner, "{", http.StatusBadRequest},
		{"log bad date", "POST", logPath, owner, map[string]any{"date": "2026-13-01"}, http.StatusBadRequest},
		{"log other user", "POST", logPath, other, map[string]any{}, http.StatusForbidden},
		{"delete other user", "DELETE", "/api/saved-meals/" + meal.ID, other, nil, http.StatusForbidden},
		{"log malformed id", "POST", "/api/saved-meals/nope/log", owner, map[string]any{}, http.StatusNotFound},
		{"log unknown id", "POST", "/api/saved-meals/" + unknownUUID + "/log", owner, map[string]any{}, http.StatusNotFound},
		{"delete unknown id", "DELETE", "/api/saved-meals/" + unknownUUID, owner, nil, http.StatusNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			wantStatus(t, call(t, mux, tc.method, tc.path, tc.user, tc.body), tc.want)
		})
	}

	rr := call(t, mux, "GET", "/api/saved-meals", owner, nil)
	if list := decode[[]SavedMeal](t, rr); len(list) != 1 || list[0].LoggedCount != 1 {
		t.Fatalf("rejected requests changed the meal: %+v", list)
	}
	if rr := call(t, mux, "GET", "/api/saved-meals", other, nil); len(decode[[]SavedMeal](t, rr)) != 0 {
		t.Fatal("other user's list shows the owner's meal")
	}
	if n := len(foodLogs(t, pool, owner)) + len(foodLogs(t, pool, other)); n != 0 {
		t.Fatalf("rejected logs wrote %d food_logs rows", n)
	}
}

// The store is also called without the handler's guards, so its own
// not-found and serving_count fallbacks are checked directly.
func TestPGStoreGuards(t *testing.T) {
	pool := testPool(t)
	s := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_recipe_store")

	if r, err := s.GetRecipe(ctx, unknownUUID); r != nil || err != nil {
		t.Fatalf("GetRecipe(unknown) = %v, %v, want nil, nil", r, err)
	}
	if _, err := s.UpdateRecipe(ctx, unknownUUID, nil, nil, nil, nil); !errors.Is(err, ErrNotFound) {
		t.Fatalf("UpdateRecipe(unknown) err = %v, want ErrNotFound", err)
	}
	if _, err := s.LogRecipe(ctx, unknownUUID, "lunch", "2026-07-12", 1); !errors.Is(err, ErrNotFound) {
		t.Fatalf("LogRecipe(unknown) err = %v, want ErrNotFound", err)
	}
	if _, err := s.LogSavedMeal(ctx, unknownUUID, "lunch", "2026-07-12"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("LogSavedMeal(unknown) err = %v, want ErrNotFound", err)
	}

	rec, err := s.CreateRecipe(ctx, user, "Toast", nil, 2, []Ingredient{{FoodName: "Bread", QuantityG: 80, Calories: 200}})
	if err != nil {
		t.Fatalf("CreateRecipe: %v", err)
	}
	if _, err := pool.Exec(ctx, `UPDATE recipes SET serving_count = 0 WHERE id = $1`, rec.ID); err != nil {
		t.Fatalf("zero serving_count: %v", err)
	}
	if _, err := s.LogRecipe(ctx, rec.ID, "breakfast", "2026-07-12", 2); err != nil {
		t.Fatalf("LogRecipe: %v", err)
	}
	logs := foodLogs(t, pool, user)
	if len(logs) != 1 || logs[0].Quantity != 160 || logs[0].Calories != 400 {
		t.Fatalf("food_logs = %+v, want serving_count 0 treated as 1 (2x scale)", logs)
	}
}
