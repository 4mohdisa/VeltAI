package foodtests

// V6 — the detail sheet's meal switch (PATCH /api/food/logs/{id} with
// meal_type) against a REAL Postgres, through the real handler.
//
// The fake store cannot catch the two SQL-level ways this goes wrong: an owner
// lookup that doesn't scope by the row's user (so B moves A's food), and a
// COALESCE update that nulls the columns the patch left out. Both are checked
// by reading the row back from the database, not from the response.
//
// Skipped unless LUME_TEST_DATABASE_URL is set — see days_pg_test.go.

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func seedMealLog(t *testing.T, pool *pgxpool.Pool, userID, meal string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	var id string
	if err := pool.QueryRow(ctx,
		`INSERT INTO food_logs (user_id, date, meal_type, food_name, calories, protein)
		 VALUES ($1, '2026-09-01', $2, 'Rice', 400, 8) RETURNING id::text`,
		userID, meal).Scan(&id); err != nil {
		t.Fatalf("seed log: %v", err)
	}
	return id
}

func TestPG_MealMoveOnlyMovesTheOwnersRow(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	a := fmt.Sprintf("meal_a_%d", os.Getpid())
	b := fmt.Sprintf("meal_b_%d", os.Getpid())
	id := seedMealLog(t, pool, a, "lunch")
	mux := newMux(store, nil)

	row := func() (meal, name string, cal, protein float64) {
		t.Helper()
		if err := pool.QueryRow(ctx,
			`SELECT meal_type, food_name, calories, protein FROM food_logs WHERE id::text = $1`, id).
			Scan(&meal, &name, &cal, &protein); err != nil {
			t.Fatalf("read back: %v", err)
		}
		return
	}

	if rr := do(t, mux, "PATCH", "/api/food/logs/"+id, b, map[string]any{"meal_type": "Dinner"}); rr.Code != http.StatusForbidden {
		t.Fatalf("b moving a's row: status = %d, want 403", rr.Code)
	}
	if meal, _, _, _ := row(); meal != "lunch" {
		t.Fatalf("b moved a's row to %q", meal)
	}

	if rr := do(t, mux, "PATCH", "/api/food/logs/"+id, a, map[string]any{"meal_type": "Dinner"}); rr.Code != http.StatusOK {
		t.Fatalf("a moving own row: status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	meal, name, cal, protein := row()
	if meal != "Dinner" {
		t.Fatalf("meal_type = %q, want Dinner", meal)
	}
	if name != "Rice" || cal != 400 || protein != 8 {
		t.Errorf("the move changed other columns: name=%q calories=%v protein=%v", name, cal, protein)
	}
}
