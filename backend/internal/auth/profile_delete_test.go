// DELETE /api/profile must remove every row the caller owns, including
// oauth_states, which has no foreign key to profiles and so is not reached by
// the cascade. The unit test records the store's SQL; the TestPG test checks
// every table in account.UserTables against a real Postgres.
package auth_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/account"
	"lume/backend/internal/auth"
	"lume/backend/internal/db"
)

// execRecorder records every Exec and answers it with success.
type execRecorder struct {
	emptyQuerier
	sql  []string
	args [][]any
}

func (q *execRecorder) Exec(_ context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	q.sql = append(q.sql, sql)
	q.args = append(q.args, args)
	return pgconn.CommandTag{}, nil
}

func deleteProfile(q db.Querier, user string) *httptest.ResponseRecorder {
	mux := http.NewServeMux()
	auth.RegisterProfile(mux, auth.NewPGProfileStore(q))
	r := httptest.NewRequest(http.MethodDelete, "/api/profile", nil)
	r.Header.Set("Authorization", "Bearer "+user)
	rec := httptest.NewRecorder()
	auth.Middleware(tokenIsUser{})(mux).ServeHTTP(rec, r)
	return rec
}

func TestDeleteProfileClearsCallerOAuthStates(t *testing.T) {
	q := &execRecorder{}
	if rec := deleteProfile(q, "user_a"); rec.Code != http.StatusOK {
		t.Fatalf("DELETE /api/profile = %d, body %s", rec.Code, rec.Body)
	}
	if len(q.sql) != 1 {
		t.Fatalf("got %d statements, want 1", len(q.sql))
	}
	sql := q.sql[0]
	for _, want := range []string{"DELETE FROM oauth_states WHERE user_id = $1", "DELETE FROM profiles WHERE id = $1"} {
		if !strings.Contains(sql, want) {
			t.Errorf("delete statement is missing %q:\n%s", want, sql)
		}
	}
	if len(q.args[0]) != 1 || q.args[0][0] != "user_a" {
		t.Errorf("delete args = %v, want only the caller user_a", q.args[0])
	}
}

// userRowCounts counts each listed table's rows owned by id.
func userRowCounts(t *testing.T, pool *pgxpool.Pool, id string) map[string]int {
	t.Helper()
	counts := map[string]int{}
	for _, ut := range account.UserTables {
		var n int
		sql := fmt.Sprintf("SELECT count(*) FROM %s WHERE %s = $1", ut.Table, ut.Column)
		if err := pool.QueryRow(context.Background(), sql, id).Scan(&n); err != nil {
			t.Fatalf("count %s: %v", ut.Table, err)
		}
		counts[ut.Table] = n
	}
	return counts
}

func seedOAuthState(t *testing.T, pool *pgxpool.Pool, id string) {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `INSERT INTO oauth_states (state, user_id, provider, expires_at)
		VALUES ($1 || '_state', $1, 'strava', now() + interval '10 minutes')`, id); err != nil {
		t.Fatalf("seed oauth_states %s: %v", id, err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM oauth_states WHERE user_id = $1`, id) })
}

// seedRestOfUserTables gives a seeded user one row in each UserTables table
// that seedUser and seedOAuthState do not reach. Every row hangs off profiles,
// so seedUser's cleanup removes them.
func seedRestOfUserTables(t *testing.T, pool *pgxpool.Pool, id string) {
	t.Helper()
	for _, sql := range []string{
		`INSERT INTO saved_foods (user_id, food_name) VALUES ($1, 'oats')`,
		`INSERT INTO gym_sessions (user_id, date) VALUES ($1, '2026-01-01')`,
		`INSERT INTO goals (user_id) VALUES ($1)`,
		`INSERT INTO gym_streaks (user_id) VALUES ($1)`,
		`INSERT INTO ai_user_brain (user_id) VALUES ($1)`,
		`INSERT INTO ai_insights (user_id, title, body) VALUES ($1, 'title', 'body')`,
		`INSERT INTO onboarding (user_id) VALUES ($1)`,
		`INSERT INTO subscriptions (user_id) VALUES ($1)`,
		`INSERT INTO user_cuisine_preferences (user_id) VALUES ($1)`,
		`INSERT INTO scan_sessions (user_id, scan_type) VALUES ($1, 'photo')`,
		`INSERT INTO scan_corrections (user_id) VALUES ($1)`,
		`INSERT INTO user_scan_calibration (user_id, food_name) VALUES ($1, 'oats')`,
		`INSERT INTO user_portion_prefs (user_id, food_name) VALUES ($1, 'oats')`,
		`INSERT INTO food_name_corrections (user_id, original_name, corrected_name) VALUES ($1, 'oat', 'oats')`,
		`INSERT INTO recipes (user_id, name) VALUES ($1, 'porridge')`,
		`INSERT INTO saved_meals (user_id, name) VALUES ($1, 'breakfast')`,
		`INSERT INTO workout_templates (user_id, name) VALUES ($1, 'push')`,
		`INSERT INTO workout_schedule (user_id, day_of_week) VALUES ($1, 1)`,
		`INSERT INTO gym_adherence (user_id, scheduled_date) VALUES ($1, '2026-01-01')`,
		`INSERT INTO user_gym_patterns (user_id) VALUES ($1)`,
		`INSERT INTO user_food_affinity (user_id, ai_suggested, user_chose) VALUES ($1, 'oat', 'oats')`,
		`INSERT INTO analytics_events (user_id, event_name) VALUES ($1, 'app_open')`,
		`INSERT INTO debug_reports (user_id, client_id, captured_at, title, severity, kind, area, trigger)
		  VALUES ($1, $1 || '_report', now(), 'title', 'low', 'bug', 'food', 'button')`,
		`INSERT INTO feedback (user_id, category, message) VALUES ($1, 'idea', 'message')`,
	} {
		if _, err := pool.Exec(context.Background(), sql, id); err != nil {
			t.Fatalf("seed %s: %v\n%s", id, err, sql)
		}
	}
}

// childTable is a table with no user column, reached only through its parent's
// foreign key. insert adds one child row under the user's parent row.
type childTable struct {
	table, fk, parent, insert string
}

var childTables = []childTable{
	{"gym_exercises", "session_id", "gym_sessions",
		`INSERT INTO gym_exercises (session_id, name) SELECT id, 'bench' FROM gym_sessions WHERE user_id = $1`},
	{"recipe_ingredients", "recipe_id", "recipes",
		`INSERT INTO recipe_ingredients (recipe_id, food_name, quantity_g) SELECT id, 'oats', 50 FROM recipes WHERE user_id = $1`},
	{"saved_meal_items", "saved_meal_id", "saved_meals",
		`INSERT INTO saved_meal_items (saved_meal_id, food_name, quantity_g) SELECT id, 'oats', 50 FROM saved_meals WHERE user_id = $1`},
	{"template_exercises", "template_id", "workout_templates",
		`INSERT INTO template_exercises (template_id, exercise_id)
		  SELECT id, (SELECT id FROM exercise_library ORDER BY id LIMIT 1) FROM workout_templates WHERE user_id = $1`},
	{"scan_images", "scan_session_id", "scan_sessions",
		`INSERT INTO scan_images (scan_session_id, angle) SELECT id, 'top' FROM scan_sessions WHERE user_id = $1`},
}

// seedChildRows adds one row to each child table under the parent rows that
// seedRestOfUserTables gave the user.
func seedChildRows(t *testing.T, pool *pgxpool.Pool, id string) {
	t.Helper()
	for _, c := range childTables {
		if _, err := pool.Exec(context.Background(), c.insert, id); err != nil {
			t.Fatalf("seed %s %s: %v", c.table, id, err)
		}
	}
}

// parentIDs returns, per child table, the ids of the user's parent rows. They
// are read before the delete so the child rows can still be counted after it.
func parentIDs(t *testing.T, pool *pgxpool.Pool, id string) map[string][]string {
	t.Helper()
	ids := map[string][]string{}
	for _, c := range childTables {
		var parents []string
		sql := fmt.Sprintf("SELECT coalesce(array_agg(id::text), '{}') FROM %s WHERE user_id = $1", c.parent)
		if err := pool.QueryRow(context.Background(), sql, id).Scan(&parents); err != nil {
			t.Fatalf("read %s ids: %v", c.parent, err)
		}
		ids[c.table] = parents
	}
	return ids
}

// rowCounts counts the user's rows in every UserTables table and every child
// table, the child rows found through parents.
func rowCounts(t *testing.T, pool *pgxpool.Pool, id string, parents map[string][]string) map[string]int {
	t.Helper()
	counts := userRowCounts(t, pool, id)
	for _, c := range childTables {
		var n int
		sql := fmt.Sprintf("SELECT count(*) FROM %s WHERE %s::text = ANY($1)", c.table, c.fk)
		if err := pool.QueryRow(context.Background(), sql, parents[c.table]).Scan(&n); err != nil {
			t.Fatalf("count %s: %v", c.table, err)
		}
		counts[c.table] = n
	}
	return counts
}

func TestPG_DeleteProfileRemovesEveryUserTableRowForCallerOnly(t *testing.T) {
	pool := exportPool(t)
	a := fmt.Sprintf("delete_a_%d", os.Getpid())
	b := fmt.Sprintf("delete_b_%d", os.Getpid())
	for _, id := range []string{a, b} {
		seedUser(t, pool, id)
		seedOAuthState(t, pool, id)
		seedRestOfUserTables(t, pool, id)
		seedChildRows(t, pool, id)
	}
	parentsA, parentsB := parentIDs(t, pool, a), parentIDs(t, pool, b)
	for table, n := range rowCounts(t, pool, a, parentsA) {
		if n == 0 {
			t.Fatalf("%s has no seeded row for user A, so the delete check would prove nothing", table)
		}
	}
	before := rowCounts(t, pool, b, parentsB)
	for table, n := range before {
		if n == 0 {
			t.Fatalf("%s has no seeded row for user B", table)
		}
	}

	if rec := deleteProfile(pool, a); rec.Code != http.StatusOK {
		t.Fatalf("DELETE /api/profile = %d, body %s", rec.Code, rec.Body)
	}

	for table, n := range rowCounts(t, pool, a, parentsA) {
		if n != 0 {
			t.Errorf("%s still has %d rows for the deleted user", table, n)
		}
	}
	after := rowCounts(t, pool, b, parentsB)
	for table, n := range before {
		if after[table] != n {
			t.Errorf("%s: user B had %d rows, now %d", table, n, after[table])
		}
	}
}
