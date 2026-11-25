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

func TestPG_DeleteProfileRemovesEveryUserTableRowForCallerOnly(t *testing.T) {
	pool := exportPool(t)
	a := fmt.Sprintf("delete_a_%d", os.Getpid())
	b := fmt.Sprintf("delete_b_%d", os.Getpid())
	for _, id := range []string{a, b} {
		seedUser(t, pool, id)
		seedOAuthState(t, pool, id)
	}
	before := userRowCounts(t, pool, b)

	if rec := deleteProfile(pool, a); rec.Code != http.StatusOK {
		t.Fatalf("DELETE /api/profile = %d, body %s", rec.Code, rec.Body)
	}

	for table, n := range userRowCounts(t, pool, a) {
		if n != 0 {
			t.Errorf("%s still has %d rows for the deleted user", table, n)
		}
	}
	after := userRowCounts(t, pool, b)
	for table, n := range before {
		if after[table] != n {
			t.Errorf("%s: user B had %d rows, now %d", table, n, after[table])
		}
	}
	if before["oauth_states"] != 1 || before["food_logs"] != 1 {
		t.Errorf("seed did not land: %v", before)
	}
}
