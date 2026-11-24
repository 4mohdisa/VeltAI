package foodtests

// The Australian Food Composition Database: the importer on a fixture file,
// kJ conversion, and search ranking with Australian foods first. The fixture
// (testdata/afcd_fixture.xlsx) holds real AFCD Release 3 rows (© Food
// Standards Australia New Zealand, see legal/AFCD_LICENCE.md) plus two
// synthetic test rows, in the official column layout.

import (
	"archive/zip"
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"

	"lume/backend/internal/food"
)

func (f *fakeStore) SearchAFCD(_ context.Context, q string) ([]food.SearchResult, error) {
	if f.afcdErr != nil {
		return nil, f.afcdErr
	}
	var out []food.SearchResult
	for _, r := range f.afcd {
		if strings.Contains(strings.ToLower(r.FoodName), strings.ToLower(q)) {
			out = append(out, r)
		}
	}
	return out, nil
}

func parseFixture(t *testing.T) []food.AFCDFood {
	t.Helper()
	b, err := os.ReadFile("testdata/afcd_fixture.xlsx")
	if err != nil {
		t.Fatal(err)
	}
	foods, err := food.ParseAFCD(bytes.NewReader(b), int64(len(b)))
	if err != nil {
		t.Fatalf("ParseAFCD: %v", err)
	}
	return foods
}

func TestParseAFCDFixture(t *testing.T) {
	foods := parseFixture(t)
	if len(foods) != 6 {
		t.Fatalf("foods = %d, want 6 (the row without energy is skipped)", len(foods))
	}
	byKey := map[string]food.AFCDFood{}
	for _, f := range foods {
		byKey[f.Key] = f
	}
	chicken := byKey["F002593"]
	if chicken.Name != "Chicken, breast, lean flesh, grilled, no added fat" || chicken.EnergyKJ != 598 ||
		*chicken.Protein != 29.8 || *chicken.Fat != 2.5 || *chicken.Carbs != 0 || *chicken.Fibre != 0 {
		t.Errorf("chicken = %+v", chicken)
	}
	// The per 100 g sheet is read, never the per 100 mL one (278 kJ there).
	milk := byKey["F005634"]
	if milk.EnergyKJ != 270 || milk.Name != "Milk, cow, fluid, regular fat (~3.5%)" {
		t.Errorf("milk = %+v, want the per 100 g row (270 kJ) and its inline-string name", milk)
	}
	// Float noise in the file (8.8000000000000007) is rounded away.
	if b := byKey["F001457"]; *b.Protein != 8.8 || *byKey["F005635"].Carbs != 5.1 {
		t.Errorf("rounding: bread protein %v, omega milk carbs %v", *b.Protein, *byKey["F005635"].Carbs)
	}
	blank := byKey["F999998"]
	if blank.Protein != nil || blank.Fat != nil || blank.Carbs != nil || blank.Fibre != nil {
		t.Errorf("blank nutrients must stay nil, got %+v", blank)
	}
	if _, ok := byKey["F999999"]; ok {
		t.Error("a row with no energy must be skipped")
	}
}

func TestParseAFCDRejectsOtherFiles(t *testing.T) {
	if _, err := food.ParseAFCD(strings.NewReader("not a zip"), 9); err == nil {
		t.Error("a non-xlsx file must be an error")
	}
	// A per 100 g sheet whose header lost the Protein column.
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, _ := zw.Create("xl/worksheets/sheet1.xml")
	w.Write([]byte(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
		<row r="1"><c r="A1" t="inlineStr"><is><t>Release 9 - Nutrient profiles (per 100 g)</t></is></c></row>
		<row r="3"><c r="A3" t="inlineStr"><is><t>Public Food Key</t></is></c><c r="B3" t="inlineStr"><is><t>Food Name</t></is></c></row>
		</sheetData></worksheet>`))
	zw.Close()
	_, err := food.ParseAFCD(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err == nil || !strings.Contains(err.Error(), "not found") {
		t.Errorf("missing columns: err = %v, want a named-column error", err)
	}
}

func TestKJToKcal(t *testing.T) {
	for kj, want := range map[float64]float64{0: 0, 4.184: 1, 598: 142.9, 2000: 478, 8700: 2079.3} {
		if got := food.KJToKcal(kj); got != want {
			t.Errorf("KJToKcal(%v) = %v, want %v", kj, got, want)
		}
	}
}

func afcdResult(name string, kcal float64) food.SearchResult {
	return food.SearchResult{FoodName: name, Calories: kcal, ServingSize: 100, ServingUnit: "g", Source: food.SourceAFCD}
}

// Australian results rank above overseas ones, even against a cuisine
// library bonus on an Open Food Facts result.
func TestSearchRanksAustralianFoodsFirst(t *testing.T) {
	f := &fakeStore{
		afcd: []food.SearchResult{
			afcdResult("Chicken, breast, lean flesh, grilled, no added fat", 142.9),
			afcdResult("Chicken, thigh, lean flesh, baked", 160),
		},
		cuisinePrefs: map[string]cuisinePrefEntry{"user_1": {cuisines: []string{"south_asian"}}},
		libraryFoods: map[string][]string{"south_asian": {"Chicken Biryani"}},
	}
	rr := do(t, newMux(f, rankingFixture(t)), "GET", "/api/food/search?q=chicken", "user_1", nil)
	results := data[[]food.SearchResult](t, rr)
	if len(results) != 5 {
		t.Fatalf("got %d results, want 2 AFCD + 3 OFF: %+v", len(results), results)
	}
	for i, r := range results {
		if wantAU := i < 2; (r.Source == food.SourceAFCD) != wantAU {
			t.Fatalf("position %d is %q from %s; Australian foods must come first: %+v", i, r.FoodName, r.Source, results)
		}
	}
	if results[0].FoodName != "Chicken, breast, lean flesh, grilled, no added fat" {
		t.Errorf("AFCD order changed: %+v", results[:2])
	}
	if results[2].FoodName != "Chicken Biryani" {
		t.Errorf("preferences must still reorder the overseas group, got %q first", results[2].FoodName)
	}
}

func TestSearchSurvivesAFCDFailure(t *testing.T) {
	f := &fakeStore{afcdErr: context.DeadlineExceeded}
	rr := do(t, newMux(f, rankingFixture(t)), "GET", "/api/food/search?q=chicken", "user_1", nil)
	if rr.Code != http.StatusOK || len(data[[]food.SearchResult](t, rr)) != 3 {
		t.Fatalf("a local table failure must fall back to the online sources: %d %s", rr.Code, rr.Body.String())
	}
}

// USDA is optional: with no key it is never called, and search still answers
// from the Australian table and Open Food Facts.
func TestSearchSkipsUSDAWithoutKey(t *testing.T) {
	var usdaCalls atomic.Int32
	usda := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		usdaCalls.Add(1)
		w.Write([]byte(usdaSearchBody))
	}))
	t.Cleanup(usda.Close)
	sc := fixtureClient(t, true)
	sc.USDABase = usda.URL
	sc.USDAKey = ""
	f := &fakeStore{afcd: []food.SearchResult{afcdResult("Oats, rolled, uncooked", 380)}}
	results := data[[]food.SearchResult](t, do(t, newMux(f, sc), "GET", "/api/food/search?q=oat", "user_1", nil))
	if usdaCalls.Load() != 0 {
		t.Errorf("USDA called %d times with no key", usdaCalls.Load())
	}
	if len(results) != 2 || results[0].Source != food.SourceAFCD || results[1].Source != "off" {
		t.Errorf("results = %+v, want the AFCD food then the OFF one", results)
	}

	sc.USDAKey = "k"
	results = data[[]food.SearchResult](t, do(t, newMux(f, sc), "GET", "/api/food/search?q=oat", "user_1", nil))
	if len(results) != 3 || results[2].Source != "usda" {
		t.Errorf("with a key, USDA must come last: %+v", results)
	}
}
