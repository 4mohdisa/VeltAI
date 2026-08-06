package scantests

// Real-Postgres regression tests added in the 2026-08-06 audit.
//
// 1. A REPLAYED confirm (retry, double-tap, offline flush) used to re-run the
//    double-count bug: the claim UPDATE matched nothing (status already
//    'confirmed'), so SaveConfirmed fell through to the INSERT branch and
//    wrote a second row.
// 2. /api/food/summary summed every row regardless of status, so an unsaved
//    'ready' review row (or a discarded scan's orphan) inflated the day's
//    server-side totals.
//
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied.

import (
	"context"
	"testing"

	"lume/backend/internal/food"
	"lume/backend/internal/scan"
)

func TestPG_ReplayedConfirmDoesNotInsertASecondRow(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_replay_1")
	ctx := context.Background()

	logID, err := store.CreateAnalyzingLog(ctx, user, testDate, nil)
	if err != nil {
		t.Fatalf("CreateAnalyzingLog: %v", err)
	}
	sessID, err := store.CreatePipelineSession(ctx, user, logID)
	if err != nil {
		t.Fatalf("CreatePipelineSession: %v", err)
	}
	if err := store.FinishScanLog(ctx, logID, "ready", "Pasta", 250, 600, 20, 80, 18, 4, []byte(`{}`)); err != nil {
		t.Fatalf("FinishScanLog: %v", err)
	}

	qty, unit := 250.0, "g"
	confirm := scan.ConfirmedLog{
		UserID: user, Date: testDate, FoodName: "Pasta",
		Quantity: &qty, Unit: &unit,
		Calories: 600, Protein: 20, Carbs: 80, Fat: 18, Fibre: 4,
		ScanSessionID: &sessID,
	}
	first, err := store.SaveConfirmed(ctx, confirm)
	if err != nil {
		t.Fatalf("first SaveConfirmed: %v", err)
	}
	second, err := store.SaveConfirmed(ctx, confirm) // the replay
	if err != nil {
		t.Fatalf("replayed SaveConfirmed: %v", err)
	}
	if first != second {
		t.Fatalf("replay returned a different row (%s then %s) — it inserted a duplicate", first, second)
	}
	rows, cals := dayTotals(t, pool, user, testDate)
	if rows != 1 || cals != 600 {
		t.Fatalf("after replay: rows = %d cals = %v, want 1 row / 600 — the double-count is back", rows, cals)
	}
}

func TestPG_SummaryExcludesUnconfirmedRows(t *testing.T) {
	store, pool := pgScanStore(t)
	user := freshUser(t, pool, "user_summary_1")
	ctx := context.Background()

	// One confirmed manual-style row (status defaults to 'confirmed')…
	if _, err := pool.Exec(ctx,
		`INSERT INTO food_logs (user_id, date, food_name, calories, protein, carbs, fat, fibre)
		 VALUES ($1, $2::date, 'Oats', 700, 20, 90, 14, 8)`, user, testDate); err != nil {
		t.Fatalf("seed confirmed row: %v", err)
	}
	// …and one 'ready' pipeline row the user never saved.
	logID, err := store.CreateAnalyzingLog(ctx, user, testDate, nil)
	if err != nil {
		t.Fatalf("CreateAnalyzingLog: %v", err)
	}
	if err := store.FinishScanLog(ctx, logID, "ready", "Phantom burger", 300, 400, 25, 30, 20, 2, []byte(`{}`)); err != nil {
		t.Fatalf("FinishScanLog: %v", err)
	}

	sum, err := food.NewPGStore(pool).Summary(ctx, user, testDate)
	if err != nil {
		t.Fatalf("Summary: %v", err)
	}
	if sum.Calories != 700 {
		t.Fatalf("summary calories = %v, want 700 — the unsaved 'ready' review row is being counted as eaten", sum.Calories)
	}
}
