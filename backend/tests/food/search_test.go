package foodtests

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"lume/backend/internal/food"
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
	if !ok || off.FoodName != "Oat Bar" || off.Calories != 400 || off.Fibre == nil || *off.Fibre != 5 || off.Barcode != "111" {
		t.Errorf("bad OFF result: %+v", off)
	}
	if off.ServingSize != 30 || off.ServingUnit != "ml" {
		t.Errorf("OFF serving = %v %q, want 30 ml", off.ServingSize, off.ServingUnit)
	}
	usda, ok := bySource["usda"]
	if !ok || usda.FoodName != "Oat Cereal" || usda.Calories != 380 || usda.Protein != 9 ||
		usda.Fibre == nil || *usda.Fibre != 8 || usda.ServingSize != 40 {
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

// A source that does not carry fibre for a food must say so, rather than report
// a confident 0 g. Open Food Facts omits fiber_100g for most products, and a
// USDA search row only carries nutrient 1079 when it was measured — flattening
// either to 0 put a number in the app's macros that nothing backed.
func TestSearchLeavesFibreNilWhenTheSourceHasNone(t *testing.T) {
	offBody := `{"products":[
		{"product_name":"No Fibre Field","brands":"B","code":"222",
		 "nutriments":{"energy-kcal_100g":250,"proteins_100g":5,"carbohydrates_100g":30,"fat_100g":10}},
		{"product_name":"Zero Fibre","brands":"B","code":"333",
		 "nutriments":{"energy-kcal_100g":200,"proteins_100g":20,"carbohydrates_100g":0,"fat_100g":12,"fiber_100g":0}}
	]}`
	off := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(offBody))
	}))
	t.Cleanup(off.Close)
	// USDA row with no nutrient 1079 at all.
	usdaBody := `{"foods":[{"description":"Plain Beef","brandOwner":"X","servingSize":100,"servingSizeUnit":"g",
		"foodNutrients":[{"nutrientId":1008,"value":250},{"nutrientId":1003,"value":26}]}]}`
	usda := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(usdaBody))
	}))
	t.Cleanup(usda.Close)

	sc := food.NewSearchClient("test-key")
	sc.OFFBase = off.URL
	sc.USDABase = usda.URL
	rr := do(t, newMux(&fakeStore{}, sc), "GET", "/api/food/search?q=x", "user_1", nil)
	results := data[[]food.SearchResult](t, rr)

	byName := map[string]food.SearchResult{}
	for _, r := range results {
		byName[r.FoodName] = r
	}

	// Absent in the payload → absent in the response.
	if got, ok := byName["No Fibre Field"]; !ok || got.Fibre != nil {
		t.Errorf("OFF product with no fiber_100g: Fibre = %v, want nil", got.Fibre)
	}
	if got, ok := byName["Plain Beef"]; !ok || got.Fibre != nil {
		t.Errorf("USDA row with no nutrient 1079: Fibre = %v, want nil", got.Fibre)
	}
	// A measured 0 is still a real 0, and must survive as one.
	if got, ok := byName["Zero Fibre"]; !ok || got.Fibre == nil || *got.Fibre != 0 {
		t.Errorf("OFF product with fiber_100g=0: Fibre = %v, want 0", got.Fibre)
	}
}
