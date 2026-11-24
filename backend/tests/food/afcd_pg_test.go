package foodtests

// The afcd_foods migration, ImportAFCD and SearchAFCD against a REAL Postgres.
// Skipped unless LUME_TEST_DATABASE_URL points at a disposable database with
// the migrations applied (recipe in days_pg_test.go).

import (
	"context"
	"testing"

	"lume/backend/internal/food"
)

func TestPG_AFCDImportAndSearch(t *testing.T) {
	store, pool := daysPGStore(t)
	ctx := context.Background()
	foods := parseFixture(t)
	if err := food.ImportAFCD(ctx, pool, foods, "AFCD Release 3"); err != nil {
		t.Fatalf("import: %v", err)
	}
	t.Cleanup(func() { pool.Exec(context.Background(), `DELETE FROM afcd_foods`) })

	// Re-import replaces rather than duplicating.
	if err := food.ImportAFCD(ctx, pool, foods[:3], "AFCD Release 3"); err != nil {
		t.Fatalf("re-import: %v", err)
	}
	var n int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM afcd_foods`).Scan(&n); err != nil || n != 3 {
		t.Fatalf("rows after re-import = %d (%v), want 3", n, err)
	}
	if err := food.ImportAFCD(ctx, pool, foods, "AFCD Release 3"); err != nil {
		t.Fatal(err)
	}

	got, err := store.SearchAFCD(ctx, "Chicken BREAST")
	if err != nil {
		t.Fatalf("search: %v", err)
	}
	if len(got) != 1 {
		t.Fatalf("chicken breast: %+v, want 1 food", got)
	}
	c := got[0]
	if c.Calories != 142.9 || c.Protein != 29.8 || c.Fat != 2.5 || c.Fibre == nil || *c.Fibre != 0 ||
		c.ServingSize != 100 || c.ServingUnit != "g" || c.Source != food.SourceAFCD {
		t.Errorf("chicken result = %+v", c)
	}

	// Every word must match; starts-with comes first, then the shorter name.
	got, _ = store.SearchAFCD(ctx, "milk")
	if len(got) != 2 || got[0].FoodName != "Milk, cow, fluid, regular fat (~3.5%)" {
		t.Errorf("milk order = %+v", got)
	}
	// A blank fibre stays unknown (nil), never a reported 0.
	got, _ = store.SearchAFCD(ctx, "blank nutrients")
	if len(got) != 1 || got[0].Fibre != nil || got[0].Protein != 0 {
		t.Errorf("blank row = %+v", got)
	}
	// LIKE wildcards in user text match literally: only the two milk names
	// contain a real "%", and none contains "_".
	for q, want := range map[string]int{"%": 2, "3.5%)": 2, "_": 0, "  ": 0} {
		if got, _ = store.SearchAFCD(ctx, q); len(got) != want {
			t.Errorf("%q matched %d foods, want %d", q, len(got), want)
		}
	}
}
