package scantests

// Real-Postgres tests for the scan → confirm reconciliation.
//
// THE BUG THESE PIN: a confirmed photo scan wrote TWO food_logs rows.
// POST /api/scan/pipeline inserts row A ('analyzing'), the background pass
// fills it in and flips it to 'ready', and POST /api/scan/confirm then INSERTed
// a completely separate row B. Nothing reconciled them, so the day's total
// double-counted the meal the moment the client re-read the log. It was
// invisible to every hermetic test because the fakes do not model food_logs.
//
// Skipped unless LUMO_TEST_DATABASE_URL points at a disposable database with
// the migrations applied — see tests/gym_schedule/schedule_pg_sql_test.go for
// the setup commands.

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"lumo/backend/internal/scan"
)

func pgScanStore(t *testing.T) (*scan.PGStore, *pgxpool.Pool) {
	t.Helper()
	dsn := os.Getenv("LUMO_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUMO_TEST_DATABASE_URL not set — skipping real-SQL integration test")
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
	return scan.NewPGStore(pool), pool
}

// freshUser returns a user id whose rows are removed when the test ends.
func freshUser(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id)
	})
	return id
}

// dayTotals is what the client re-reads on refresh: the rows the list endpoint
// returns for a date, and the calories they sum to.
func dayTotals(t *testing.T, pool *pgxpool.Pool, userID, date string) (rows int, calories float64) {
	t.Helper()
	err := pool.QueryRow(context.Background(),
		`SELECT count(*), COALESCE(SUM(calories), 0) FROM food_logs WHERE user_id = $1 AND date = $2::date`,
		userID, date).Scan(&rows, &calories)
	if err != nil {
		t.Fatalf("day totals: %v", err)
	}
	return rows, calories
}

const testDate = "2026-03-03"

// The canonical flow: pipeline starts → background finishes → user confirms.
// Exactly ONE row must remain, carrying the user's confirmed values.
func TestPG_ConfirmClaimsThePipelineRow(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_reconcile_1")
	ctx := context.Background()

	logID, err := store.CreateAnalyzingLog(ctx, user, testDate, nil)
	if err != nil {
		t.Fatalf("CreateAnalyzingLog: %v", err)
	}
	sessID, err := store.CreatePipelineSession(ctx, user, logID)
	if err != nil {
		t.Fatalf("CreatePipelineSession: %v", err)
	}
	if err := store.FinishScanLog(ctx, logID, "ready", "Chicken rice", 300, 520, 40, 55, 12, 3, []byte(`{}`)); err != nil {
		t.Fatalf("FinishScanLog: %v", err)
	}

	// The user reviews and saves, correcting the estimate down to 480 kcal.
	qty, unit := 280.0, "g"
	confirmedID, err := store.SaveConfirmed(ctx, scan.ConfirmedLog{
		UserID: user, Date: testDate, FoodName: "Chicken rice",
		Quantity: &qty, Unit: &unit,
		Calories: 480, Protein: 38, Carbs: 50, Fat: 11, Fibre: 3,
		ScanSessionID: &sessID,
	})
	if err != nil {
		t.Fatalf("SaveConfirmed: %v", err)
	}

	rows, cals := dayTotals(t, pool, user, testDate)
	if rows != 1 {
		t.Fatalf("food_logs rows = %d, want exactly 1 — the confirmed scan is duplicated", rows)
	}
	if cals != 480 {
		t.Fatalf("day calories = %v, want 480 (the CONFIRMED value, not the AI estimate or their sum)", cals)
	}
	// It must be the SAME row, so the scan_results blob and the session link survive.
	if confirmedID != logID {
		t.Fatalf("confirm returned a new row %s; it must claim the pipeline row %s", confirmedID, logID)
	}

	var status string
	if err := pool.QueryRow(ctx, `SELECT status FROM food_logs WHERE id::text = $1`, logID).Scan(&status); err != nil {
		t.Fatalf("read status: %v", err)
	}
	if status != "confirmed" {
		t.Fatalf("status = %q, want confirmed", status)
	}
}

// Ordering safety: if the background pass lands AFTER the user has confirmed,
// it must not overwrite the user's values or drag the row back to 'ready'.
func TestPG_LateFinishDoesNotClobberAConfirmedRow(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_reconcile_2")
	ctx := context.Background()

	logID, _ := store.CreateAnalyzingLog(ctx, user, testDate, nil)
	sessID, _ := store.CreatePipelineSession(ctx, user, logID)

	qty := 250.0
	if _, err := store.SaveConfirmed(ctx, scan.ConfirmedLog{
		UserID: user, Date: testDate, FoodName: "User's answer",
		Quantity: &qty, Calories: 400, ScanSessionID: &sessID,
	}); err != nil {
		t.Fatalf("SaveConfirmed: %v", err)
	}

	// The pipeline finally finishes and tries to write the AI estimate.
	if err := store.FinishScanLog(ctx, logID, "ready", "AI guess", 900, 1200, 10, 10, 10, 1, []byte(`{}`)); err != nil {
		t.Fatalf("FinishScanLog: %v", err)
	}

	rows, cals := dayTotals(t, pool, user, testDate)
	if rows != 1 {
		t.Fatalf("food_logs rows = %d, want 1", rows)
	}
	if cals != 400 {
		t.Fatalf("day calories = %v, want the user's 400 — a late pipeline pass overwrote a confirmed row", cals)
	}
	var name, status string
	if err := pool.QueryRow(ctx, `SELECT food_name, status FROM food_logs WHERE id::text = $1`, logID).Scan(&name, &status); err != nil {
		t.Fatalf("read row: %v", err)
	}
	if name != "User's answer" || status != "confirmed" {
		t.Fatalf("row = (%q, %q), want (\"User's answer\", \"confirmed\")", name, status)
	}
}

// Refreshing must not change the day's total. This is the re-read the bug only
// showed on: confirm, then read the day back exactly as the client does.
func TestPG_RefreshDoesNotChangeTheDayTotal(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_reconcile_3")
	ctx := context.Background()

	logID, _ := store.CreateAnalyzingLog(ctx, user, testDate, nil)
	sessID, _ := store.CreatePipelineSession(ctx, user, logID)
	_ = store.FinishScanLog(ctx, logID, "ready", "Pasta", 400, 700, 20, 90, 25, 5, []byte(`{}`))

	qty := 400.0
	if _, err := store.SaveConfirmed(ctx, scan.ConfirmedLog{
		UserID: user, Date: testDate, FoodName: "Pasta",
		Quantity: &qty, Calories: 700, ScanSessionID: &sessID,
	}); err != nil {
		t.Fatalf("SaveConfirmed: %v", err)
	}

	_, first := dayTotals(t, pool, user, testDate)
	_, second := dayTotals(t, pool, user, testDate)
	if first != second || first != 700 {
		t.Fatalf("day total drifted across reads: %v then %v, want 700 both times", first, second)
	}
}

// A confirm with NO scan session (the synchronous /api/scan fallback, a label
// scan, or a manual entry routed here) still inserts its own row — there is no
// pipeline row to claim.
func TestPG_ConfirmWithoutSessionStillInserts(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_reconcile_4")
	ctx := context.Background()

	qty := 100.0
	if _, err := store.SaveConfirmed(ctx, scan.ConfirmedLog{
		UserID: user, Date: testDate, FoodName: "Apple", Quantity: &qty, Calories: 95,
	}); err != nil {
		t.Fatalf("SaveConfirmed: %v", err)
	}
	rows, cals := dayTotals(t, pool, user, testDate)
	if rows != 1 || cals != 95 {
		t.Fatalf("rows=%d cals=%v, want 1 row / 95 kcal", rows, cals)
	}
}

// A session whose food_log was deleted (user discarded it) must not resurrect
// the row — confirm falls back to inserting a fresh one.
func TestPG_ConfirmWithDanglingSessionInserts(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_reconcile_5")
	ctx := context.Background()

	logID, _ := store.CreateAnalyzingLog(ctx, user, testDate, nil)
	sessID, _ := store.CreatePipelineSession(ctx, user, logID)
	// scan_sessions.food_log_id has an FK to food_logs, so a discard has to
	// clear the link before deleting the row.
	if _, err := pool.Exec(ctx, `UPDATE scan_sessions SET food_log_id = NULL WHERE id::text = $1`, sessID); err != nil {
		t.Fatalf("unlink session: %v", err)
	}
	if _, err := pool.Exec(ctx, `DELETE FROM food_logs WHERE id::text = $1`, logID); err != nil {
		t.Fatalf("delete log: %v", err)
	}

	qty := 200.0
	if _, err := store.SaveConfirmed(ctx, scan.ConfirmedLog{
		UserID: user, Date: testDate, FoodName: "Soup",
		Quantity: &qty, Calories: 150, ScanSessionID: &sessID,
	}); err != nil {
		t.Fatalf("SaveConfirmed: %v", err)
	}
	rows, cals := dayTotals(t, pool, user, testDate)
	if rows != 1 || cals != 150 {
		t.Fatalf("rows=%d cals=%v, want 1 row / 150 kcal", rows, cals)
	}
}
