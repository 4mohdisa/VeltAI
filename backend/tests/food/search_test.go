package foodtests

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"lumo/backend/internal/food"
)

const offSearchBody = `{"products":[{
	"product_name":"Oat Bar","brands":"OffBrand","code":"111",
	"serving_quantity":30,"serving_quantity_unit":"ml",
	"nutriments":{"energy-kcal_100g":400,"proteins_100g":10,"carbohydrates_100g":60,"fat_100g":12,"fiber_100g":5}
}]}`

const usdaSearchBody = `{"foods":[{
	"description":"Oat Cereal","brandOwner":"UsdaBrand","gtinUpc":"222",
	"servingSize":40,"servingSizeUnit":"g",
	"foodNutrients":[
		{"nutrientId":1008,"value":380},{"nutrientId":1003,"value":9},
		{"nutrientId":1005,"value":70},{"nutrientId":1004,"value":6},
		{"nutrientId":1079,"value":8}]
}]}`

func fixtureClient(t *testing.T, usdaOK bool) *food.SearchClient {
	t.Helper()
	off := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/cgi/search.pl":
			w.Write([]byte(offSearchBody))
		case "/api/v2/product/111.json":
			w.Write([]byte(`{"status":1,"product":{"product_name":"Oat Bar","brands":"OffBrand","code":"111",
				"nutriments":{"energy-kcal_100g":400,"proteins_100g":10}}}`))
		default:
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"status":0}`))
		}
	}))
	t.Cleanup(off.Close)
	usda := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !usdaOK {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Write([]byte(usdaSearchBody))
	}))
	t.Cleanup(usda.Close)
	sc := food.NewSearchClient("test-key")
	sc.OFFBase = off.URL
	sc.USDABase = usda.URL
	return sc
}

// fixtureClientWithBody serves a caller-supplied OFF search.pl body and a
// failing USDA source, so results are OFF-only in exactly the given order —
// used by ranking tests that need control over relevance-order input.
func fixtureClientWithBody(t *testing.T, offBody string) *food.SearchClient {
	t.Helper()
	off := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(offBody))
	}))
	t.Cleanup(off.Close)
	usda := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	t.Cleanup(usda.Close)
	sc := food.NewSearchClient("test-key")
	sc.OFFBase = off.URL
	sc.USDABase = usda.URL
	return sc
}

func TestSearchMergesBothSources(t *testing.T) {
	mux := newMux(&fakeStore{}, fixtureClient(t, true))
	rr := do(t, mux, "GET", "/api/food/search?q=oat", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	results := data[[]food.SearchResult](t, rr)
	if len(results) != 2 {
		t.Fatalf("got %d results, want 2: %+v", len(results), results)
	}
	bySource := map[string]food.SearchResult{}
	for _, r := range results {
		bySource[r.Source] = r
	}
	off, ok := bySource["off"]
	if !ok || off.FoodName != "Oat Bar" || off.Calories != 400 || off.Fibre != 5 || off.Barcode != "111" {
		t.Errorf("bad OFF result: %+v", off)
	}
	if off.ServingSize != 30 || off.ServingUnit != "ml" {
		t.Errorf("OFF serving = %v %q, want 30 ml", off.ServingSize, off.ServingUnit)
	}
	usda, ok := bySource["usda"]
	if !ok || usda.FoodName != "Oat Cereal" || usda.Calories != 380 || usda.Protein != 9 ||
		usda.Fibre != 8 || usda.ServingSize != 40 {
		t.Errorf("bad USDA result: %+v", usda)
	}
}

func TestSearchEmptyQuery400(t *testing.T) {
	mux := newMux(&fakeStore{}, fixtureClient(t, true))
	rr := do(t, mux, "GET", "/api/food/search?q=", "user_1", nil)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rr.Code)
	}
}

func TestSearchSurvivesOneSourceFailing(t *testing.T) {
	mux := newMux(&fakeStore{}, fixtureClient(t, false)) // USDA returns 500
	rr := do(t, mux, "GET", "/api/food/search?q=oat", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	results := data[[]food.SearchResult](t, rr)
	if len(results) != 1 || results[0].Source != "off" {
		t.Errorf("expected OFF-only results, got %+v", results)
	}
}

func TestBarcodeFound(t *testing.T) {
	mux := newMux(&fakeStore{}, fixtureClient(t, true))
	rr := do(t, mux, "GET", "/api/food/barcode/111", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	r := data[food.SearchResult](t, rr)
	if r.FoodName != "Oat Bar" || r.Barcode != "111" || r.Source != "off" {
		t.Errorf("bad barcode result: %+v", r)
	}
	if r.ServingUnit != "g" { // no serving_quantity_unit in fixture -> default g
		t.Errorf("ServingUnit = %q, want default g", r.ServingUnit)
	}
}

func TestSearchClientHasTimeout(t *testing.T) {
	sc := food.NewSearchClient("k")
	if sc.HTTP.Timeout <= 0 {
		t.Fatal("SearchClient HTTP client must have a timeout so a hung upstream cannot block /api/food/search")
	}
}

func TestBarcodeNotFound404(t *testing.T) {
	mux := newMux(&fakeStore{}, fixtureClient(t, true))
	rr := do(t, mux, "GET", "/api/food/barcode/000", "user_1", nil)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (body %s)", rr.Code, rr.Body.String())
	}
}
