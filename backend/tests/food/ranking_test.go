package foodtests

import (
	"net/http"
	"testing"

	"lumo/backend/internal/food"
)

// rankingFixture returns three OFF-only results (so search returns them in
// this exact position order) with unremarkable relevance decay.
func rankingFixture(t *testing.T) *food.SearchClient {
	t.Helper()
	body := `{"products":[
		{"product_name":"Grilled Chicken Salad","brands":"","code":"1","nutriments":{}},
		{"product_name":"Beef Bacon Sandwich","brands":"","code":"2","nutriments":{}},
		{"product_name":"Chicken Biryani","brands":"","code":"3","nutriments":{}}
	]}`
	return fixtureClientWithBody(t, body)
}

func TestCuisineRankingPromotesLibraryMatch(t *testing.T) {
	f := &fakeStore{
		cuisinePrefs: map[string]cuisinePrefEntry{
			"user_1": {cuisines: []string{"south_asian"}},
		},
		libraryFoods: map[string][]string{
			"south_asian": {"Chicken Biryani"},
		},
	}
	mux := newMux(f, rankingFixture(t))
	rr := do(t, mux, "GET", "/api/food/search?q=chicken", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	results := data[[]food.SearchResult](t, rr)
	if len(results) == 0 || results[0].FoodName != "Chicken Biryani" {
		t.Fatalf("expected library match promoted to top, got %+v", results)
	}
}

// halalFixture returns 5 OFF-only results with "Bacon Sandwich" first by
// position — with 5 results the per-position relevance gap (0.12) is smaller
// than the halal dietary-conflict penalty's contribution (~0.133), so a
// halal user must see it demoted below its position-only placement.
func halalFixture(t *testing.T) *food.SearchClient {
	t.Helper()
	body := `{"products":[
		{"product_name":"Bacon Sandwich","brands":"","code":"1","nutriments":{}},
		{"product_name":"Grilled Chicken Salad","brands":"","code":"2","nutriments":{}},
		{"product_name":"Chicken Tikka","brands":"","code":"3","nutriments":{}},
		{"product_name":"Vegetable Curry","brands":"","code":"4","nutriments":{}},
		{"product_name":"Rice Bowl","brands":"","code":"5","nutriments":{}}
	]}`
	return fixtureClientWithBody(t, body)
}

func TestCuisineRankingDemotesHalalConflict(t *testing.T) {
	f := &fakeStore{
		cuisinePrefs: map[string]cuisinePrefEntry{
			"user_1": {dietary: []string{"halal"}},
		},
	}
	mux := newMux(f, halalFixture(t))
	rr := do(t, mux, "GET", "/api/food/search?q=chicken", "user_1", nil)
	results := data[[]food.SearchResult](t, rr)
	if len(results) != 5 {
		t.Fatalf("got %d results, want 5", len(results))
	}
	baconIdx := -1
	for i, r := range results {
		if r.FoodName == "Bacon Sandwich" {
			baconIdx = i
		}
	}
	if baconIdx == -1 {
		t.Fatal("bacon result missing")
	}
	// Bacon started in position 0 (highest position-only relevance); the
	// halal conflict must demote it below that placement.
	if baconIdx <= 0 {
		t.Errorf("bacon result not demoted for halal user: index %d, results %+v", baconIdx, results)
	}
}

func TestCuisineRankingUnchangedOrderWithNoPrefs(t *testing.T) {
	f := &fakeStore{}
	mux := newMux(f, rankingFixture(t))
	rr := do(t, mux, "GET", "/api/food/search?q=chicken", "user_1", nil)
	results := data[[]food.SearchResult](t, rr)
	if len(results) != 3 {
		t.Fatalf("got %d results, want 3", len(results))
	}
	want := []string{"Grilled Chicken Salad", "Beef Bacon Sandwich", "Chicken Biryani"}
	for i, w := range want {
		if results[i].FoodName != w {
			t.Errorf("order changed with no prefs set: got %+v, want %v", results, want)
			break
		}
	}
}
