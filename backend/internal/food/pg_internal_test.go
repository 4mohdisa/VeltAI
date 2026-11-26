// In-package real-SQL tests for PGStore (pg.go, learning.go). They run against
// LUME_TEST_DATABASE_URL, a disposable local database with every migration
// applied, and skip without it, like the other TestPG suites. Each test owns a
// profile row and deletes it on cleanup; every food table cascades from
// profiles. No test here deletes a food log that a scan session links to.
package food

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

const unknownID = "00000000-0000-0000-0000-000000000000"

func ptrTo[T any](v T) *T { return &v }

// testStore connects to the test database and gives the test a fresh profile,
// deleted (with everything that cascades from it) when the test ends.
func testStore(t *testing.T, userID string) (*PGStore, *pgxpool.Pool) {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, userID); err != nil {
		t.Fatalf("clear profile: %v", err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, userID) })
	return NewPGStore(pool), pool
}

func count(t *testing.T, pool *pgxpool.Pool, sql string, args ...any) int {
	t.Helper()
	var n int
	if err := pool.QueryRow(context.Background(), sql, args...).Scan(&n); err != nil {
		t.Fatalf("count (%s): %v", sql, err)
	}
	return n
}

func logFood(t *testing.T, s *PGStore, l Log) Log {
	t.Helper()
	got, err := s.CreateLog(context.Background(), l)
	if err != nil {
		t.Fatalf("CreateLog(%s): %v", l.FoodName, err)
	}
	return got
}

func TestPGLogs(t *testing.T) {
	const user = "user_pg_food_logs"
	s, _ := testStore(t, user)
	ctx := context.Background()

	oats := logFood(t, s, Log{UserID: user, Date: "2026-07-14", MealType: ptrTo("breakfast"), FoodName: "Oats",
		Quantity: ptrTo(80.0), Unit: ptrTo("g"), Calories: 300, Protein: 10, Source: ptrTo("manual")})
	if oats.ID == "" || oats.Date != "2026-07-14" || oats.Status != "confirmed" || *oats.Quantity != 80 {
		t.Fatalf("created log = %+v", oats)
	}
	logFood(t, s, Log{UserID: user, Date: "2026-07-14", MealType: ptrTo("lunch"), FoodName: "Soup", Calories: 200})
	keyed := logFood(t, s, Log{UserID: user, Date: "2026-07-15", FoodName: "Apple", Calories: 95, IdempotencyKey: "offline-1"})
	if replay := logFood(t, s, Log{UserID: user, Date: "2026-07-15", FoodName: "Apple", Calories: 95, IdempotencyKey: "offline-1"}); replay.ID != keyed.ID {
		t.Fatalf("replayed write created %s, want the existing %s", replay.ID, keyed.ID)
	}

	cases := []struct {
		name                   string
		date, mealType, status *string
		want                   int
	}{
		{"no filters", nil, nil, nil, 3},
		{"by date", ptrTo("2026-07-14"), nil, nil, 2},
		{"by date and meal", ptrTo("2026-07-14"), ptrTo("lunch"), nil, 1},
		{"confirmed only", nil, nil, ptrTo("confirmed"), 3},
		{"no analyzing rows", nil, nil, ptrTo("analyzing"), 0},
		{"empty day", ptrTo("2026-01-01"), nil, nil, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			logs, err := s.ListLogs(ctx, user, tc.date, tc.mealType, tc.status)
			if err != nil || len(logs) != tc.want {
				t.Fatalf("ListLogs = %d rows, %v, want %d", len(logs), err, tc.want)
			}
		})
	}

	lookups := []struct {
		name, id string
		wantErr  error
	}{
		{"own log", oats.ID, nil},
		{"malformed id", "nope", ErrNotFound},
		{"unknown id", unknownID, ErrNotFound},
	}
	for _, tc := range lookups {
		t.Run("get "+tc.name, func(t *testing.T) {
			got, err := s.GetLog(ctx, tc.id)
			if !errors.Is(err, tc.wantErr) || (tc.wantErr == nil && got.FoodName != "Oats") {
				t.Fatalf("GetLog = %+v, %v, want %v", got, err, tc.wantErr)
			}
		})
	}

	// Oats was logged by hand, so no scan session links to it.
	if err := s.DeleteLog(ctx, oats.ID); err != nil {
		t.Fatalf("DeleteLog: %v", err)
	}
	if _, err := s.GetLog(ctx, oats.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("deleted log still readable: %v", err)
	}
}

func TestPGSavedFoods(t *testing.T) {
	const user = "user_pg_food_saved"
	s, _ := testStore(t, user)
	ctx := context.Background()

	if list, err := s.ListSaved(ctx, user); len(list) != 0 || err != nil {
		t.Fatalf("ListSaved(empty) = %+v, %v", list, err)
	}
	bar, err := s.CreateSaved(ctx, SavedFood{UserID: user, FoodName: "Protein Bar", Brand: ptrTo("Acme"), Calories: 200, Protein: 20,
		ServingSize: ptrTo(60.0), ServingUnit: ptrTo("g")})
	if err != nil || bar.ID == "" || *bar.Brand != "Acme" || *bar.ServingSize != 60 {
		t.Fatalf("CreateSaved = %+v, %v", bar, err)
	}
	if _, err := s.CreateSaved(ctx, SavedFood{UserID: user, FoodName: "Yoghurt", Calories: 120}); err != nil {
		t.Fatalf("CreateSaved(minimal): %v", err)
	}
	if list, _ := s.ListSaved(ctx, user); len(list) != 2 || list[0].FoodName != "Yoghurt" {
		t.Fatalf("ListSaved = %+v, want newest first", list)
	}

	cases := []struct {
		name, id string
		wantErr  error
	}{
		{"own saved food", bar.ID, nil},
		{"malformed id", "nope", ErrNotFound},
		{"unknown id", unknownID, ErrNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			owner, err := s.GetSavedOwner(ctx, tc.id)
			if !errors.Is(err, tc.wantErr) || (tc.wantErr == nil && owner != user) {
				t.Fatalf("GetSavedOwner = %q, %v, want %v", owner, err, tc.wantErr)
			}
		})
	}

	if err := s.DeleteSaved(ctx, bar.ID); err != nil {
		t.Fatalf("DeleteSaved: %v", err)
	}
	if list, _ := s.ListSaved(ctx, user); len(list) != 1 {
		t.Fatalf("after delete ListSaved = %+v, want 1", list)
	}
}

func TestPGCuisinePrefsAndLibrary(t *testing.T) {
	const user = "user_pg_food_cuisine"
	const cuisine = "test_pg_food_cuisine"
	s, pool := testStore(t, user)
	ctx := context.Background()

	if c, d, err := s.UserCuisinePrefs(ctx, user); c != nil || d != nil || err != nil {
		t.Fatalf("UserCuisinePrefs(none) = %v, %v, %v, want nil, nil, nil", c, d, err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO user_cuisine_preferences (user_id, cuisines, dietary_requirements) VALUES ($1, '{Thai}', '{vegan}')`, user); err != nil {
		t.Fatalf("seed prefs: %v", err)
	}
	if c, d, err := s.UserCuisinePrefs(ctx, user); len(c) != 1 || c[0] != "Thai" || len(d) != 1 || d[0] != "vegan" || err != nil {
		t.Fatalf("UserCuisinePrefs = %v, %v, %v", c, d, err)
	}

	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM cuisine_food_library WHERE cuisine = $1`, cuisine)
	})
	if _, err := pool.Exec(ctx, `INSERT INTO cuisine_food_library (cuisine, food_name) VALUES ($1, 'Pad Thai'), ($1, 'Green Curry')`, cuisine); err != nil {
		t.Fatalf("seed library: %v", err)
	}
	cases := []struct {
		name     string
		cuisines []string
		want     map[string]bool
	}{
		{"no cuisines", nil, map[string]bool{}},
		{"unknown cuisine", []string{"test_pg_food_none"}, map[string]bool{}},
		{"seeded cuisine, lowercased", []string{cuisine}, map[string]bool{"pad thai": true, "green curry": true}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := s.CuisineLibraryNames(ctx, tc.cuisines)
			if err != nil || len(got) != len(tc.want) {
				t.Fatalf("CuisineLibraryNames = %v, %v, want %v", got, err, tc.want)
			}
			for name := range tc.want {
				if !got[name] {
					t.Fatalf("CuisineLibraryNames = %v, missing %q", got, name)
				}
			}
		})
	}
}

func TestPGPortionPrefAndCorrections(t *testing.T) {
	const user = "user_pg_food_learning"
	s, pool := testStore(t, user)
	ctx := context.Background()

	if p, err := s.GetPortionPref(ctx, user, "Oats"); p != nil || err != nil {
		t.Fatalf("GetPortionPref(none) = %+v, %v", p, err)
	}
	logFood(t, s, Log{UserID: user, Date: "2026-07-14", MealType: ptrTo("breakfast"), FoodName: "Oats"})

	steps := []struct {
		name       string
		weightG    float64
		mealType   string
		wantCount  int
		wantWeight float64
	}{
		{"zero weight is ignored", 0, "breakfast", 0, 0},
		{"negative weight is ignored", -5, "breakfast", 0, 0},
		{"first portion", 100, "breakfast", 1, 100},
		{"second portion averages, meal type from history", 200, "", 2, 150},
	}
	for _, st := range steps {
		if err := s.UpsertPortionPref(ctx, user, "Oats", st.weightG, st.mealType); err != nil {
			t.Fatalf("%s: UpsertPortionPref: %v", st.name, err)
		}
		p, err := s.GetPortionPref(ctx, user, "Oats")
		if err != nil {
			t.Fatalf("%s: GetPortionPref: %v", st.name, err)
		}
		if st.wantCount == 0 {
			if p != nil {
				t.Fatalf("%s: stored %+v, want no row", st.name, p)
			}
			continue
		}
		if p == nil || p.LoggedCount != st.wantCount || *p.TypicalWeightG != st.wantWeight || p.TypicalMealType == nil || *p.TypicalMealType != "breakfast" {
			t.Fatalf("%s: portion pref = %+v", st.name, p)
		}
	}

	corrections := []struct{ original, corrected string }{
		{"", "Brown Rice"},
		{"Rice", ""},
		{"Rice", "Rice"},
		{"Rice", "Brown Rice"},
	}
	for _, c := range corrections {
		if err := s.RecordFoodNameCorrection(ctx, user, c.original, c.corrected); err != nil {
			t.Fatalf("RecordFoodNameCorrection(%q, %q): %v", c.original, c.corrected, err)
		}
	}
	if n := count(t, pool, `SELECT count(*) FROM food_name_corrections WHERE user_id = $1`, user); n != 1 {
		t.Fatalf("food_name_corrections = %d rows, want only the real rename", n)
	}
}

func TestPGFlagBrainRebuildIfDue(t *testing.T) {
	const user = "user_pg_food_brain"
	s, pool := testStore(t, user)
	ctx := context.Background()

	if err := s.FlagBrainRebuildIfDue(ctx, user); err != nil {
		t.Fatalf("FlagBrainRebuildIfDue without a brain row: %v", err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO ai_user_brain (user_id, last_rebuilt) VALUES ($1, now() - interval '1 day')`, user); err != nil {
		t.Fatalf("seed brain: %v", err)
	}
	for i := 1; i <= 5; i++ {
		logFood(t, s, Log{UserID: user, Date: "2026-07-14", FoodName: "Snack"})
		if err := s.FlagBrainRebuildIfDue(ctx, user); err != nil {
			t.Fatalf("FlagBrainRebuildIfDue: %v", err)
		}
		flagged := count(t, pool, `SELECT count(*) FROM ai_user_brain WHERE user_id = $1 AND needs_rebuild`, user) == 1
		if flagged != (i == 5) {
			t.Fatalf("after %d logs needs_rebuild = %v, want it only from the 5th", i, flagged)
		}
	}
}

func TestPGDetectMealMemory(t *testing.T) {
	const user = "user_pg_food_meal_memory"
	s, pool := testStore(t, user)
	ctx := context.Background()

	breakfast := func(date string, names ...string) {
		t.Helper()
		for _, n := range names {
			logFood(t, s, Log{UserID: user, Date: date, MealType: ptrTo("breakfast"), FoodName: n, Quantity: ptrTo(100.0), Calories: 100, Protein: 5})
		}
	}
	breakfast("2026-07-01", "Oats", "Banana")
	breakfast("2026-07-02", "oats ", "Banana")
	breakfast("2026-07-04", "Toast")

	usual := func() (meals, items, loggedCount int) {
		t.Helper()
		meals = count(t, pool, `SELECT count(*) FROM saved_meals WHERE user_id = $1 AND auto_generated AND name = 'Your usual breakfast'`, user)
		items = count(t, pool, `SELECT count(*) FROM saved_meal_items i JOIN saved_meals m ON m.id = i.saved_meal_id WHERE m.user_id = $1`, user)
		loggedCount = count(t, pool, `SELECT coalesce(max(logged_count), 0) FROM saved_meals WHERE user_id = $1`, user)
		return
	}

	steps := []struct {
		name, logDay, date, mealType   string
		wantMeals, wantItems, wantSeen int
	}{
		{"one food is not a meal", "", "2026-07-04", "breakfast", 0, 0, 0},
		{"meal type with no logs", "", "2026-07-02", "dinner", 0, 0, 0},
		{"two matching days are not enough", "", "2026-07-02", "breakfast", 0, 0, 0},
		{"third matching day creates the usual meal", "2026-07-03", "2026-07-03", "breakfast", 1, 2, 1},
		{"a repeat bumps the existing meal", "", "2026-07-03", "breakfast", 1, 2, 2},
	}
	for _, st := range steps {
		if st.logDay != "" {
			breakfast(st.logDay, "Oats", "Banana")
		}
		if err := s.DetectMealMemory(ctx, user, st.date, st.mealType); err != nil {
			t.Fatalf("%s: DetectMealMemory: %v", st.name, err)
		}
		if meals, items, seen := usual(); meals != st.wantMeals || items != st.wantItems || seen != st.wantSeen {
			t.Fatalf("%s: meals %d, items %d, logged_count %d, want %d, %d, %d", st.name, meals, items, seen, st.wantMeals, st.wantItems, st.wantSeen)
		}
	}
	if n := count(t, pool, `SELECT count(*) FROM saved_meals WHERE user_id = $1 AND total_calories = 200 AND total_protein = 10`, user); n != 1 {
		t.Fatal("usual meal totals are not the day's sum")
	}
}
