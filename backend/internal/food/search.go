package food

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

const maxSearchResults = 25

type SearchResult struct {
	FoodName    string  `json:"food_name"`
	Brand       string  `json:"brand"`
	Barcode     string  `json:"barcode"`
	Calories    float64 `json:"calories"`
	Protein     float64 `json:"protein"`
	Carbs       float64 `json:"carbs"`
	Fat         float64 `json:"fat"`
	// Fibre is a POINTER because "this source has no fibre figure for this food"
	// and "this food has 0 g of fibre" are different claims, and both happen a
	// lot: Open Food Facts omits fiber_100g for most products, and USDA search
	// rows only carry nutrient 1079 when the lab measured it. Flattening the
	// absent case to 0 made the app report a confident 0 g it had no basis for.
	Fibre       *float64 `json:"fibre"`
	ServingSize float64 `json:"serving_size"`
	ServingUnit string  `json:"serving_unit"`
	Source      string  `json:"source"`
}

// SearchClient queries Open Food Facts and USDA FoodData Central. Base URLs
// and HTTP client are exported so tests can point at httptest servers.
type SearchClient struct {
	OFFBase  string
	USDABase string
	HTTP     *http.Client
	USDAKey  string
}

func NewSearchClient(usdaKey string) *SearchClient {
	return &SearchClient{
		OFFBase:  "https://world.openfoodfacts.org",
		USDABase: "https://api.nal.usda.gov",
		// Timeout bounds hung upstreams (OFF's search.pl is known to stall);
		// without it a stuck request blocks /api/food/search forever.
		HTTP:    &http.Client{Timeout: 10 * time.Second},
		USDAKey: usdaKey,
	}
}

// Search queries both sources concurrently; a failed source contributes
// nothing rather than failing the whole search.
func (c *SearchClient) Search(ctx context.Context, q string) []SearchResult {
	var off, usda []SearchResult
	var wg sync.WaitGroup
	wg.Add(2)
	go func() { defer wg.Done(); off, _ = c.searchOFF(ctx, q) }()
	go func() { defer wg.Done(); usda, _ = c.searchUSDA(ctx, q) }()
	wg.Wait()

	seen := map[string]bool{}
	out := make([]SearchResult, 0, len(off)+len(usda))
	for _, r := range append(off, usda...) {
		key := r.Barcode
		if key == "" {
			key = strings.ToLower(r.FoodName) + "|" + strings.ToLower(r.Brand)
		}
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, r)
		if len(out) == maxSearchResults {
			break
		}
	}
	return out
}

// Barcode looks a product up on Open Food Facts; ErrNotFound when unknown.
func (c *SearchClient) Barcode(ctx context.Context, code string) (SearchResult, error) {
	var body struct {
		Status  int        `json:"status"`
		Product offProduct `json:"product"`
	}
	err := c.getJSON(ctx, c.OFFBase+"/api/v2/product/"+url.PathEscape(code)+".json", &body)
	if err != nil {
		return SearchResult{}, err
	}
	if body.Status != 1 {
		return SearchResult{}, ErrNotFound
	}
	return body.Product.result(), nil
}

type offProduct struct {
	ProductName         string         `json:"product_name"`
	Brands              string         `json:"brands"`
	Code                string         `json:"code"`
	ServingQuantity     any            `json:"serving_quantity"`
	ServingQuantityUnit string         `json:"serving_quantity_unit"`
	Nutriments          map[string]any `json:"nutriments"`
}

// result maps an OFF product; macros are per 100g fields.
func (p offProduct) result() SearchResult {
	size := toFloat(p.ServingQuantity)
	if size <= 0 {
		size = 100
	}
	unit := p.ServingQuantityUnit
	if unit == "" {
		unit = "g"
	}
	return SearchResult{
		FoodName:    p.ProductName,
		Brand:       p.Brands,
		Barcode:     p.Code,
		Calories:    toFloat(p.Nutriments["energy-kcal_100g"]),
		Protein:     toFloat(p.Nutriments["proteins_100g"]),
		Carbs:       toFloat(p.Nutriments["carbohydrates_100g"]),
		Fat:         toFloat(p.Nutriments["fat_100g"]),
		Fibre:       optFloat(p.Nutriments["fiber_100g"]),
		ServingSize: size,
		ServingUnit: unit,
		Source:      "off",
	}
}

func (c *SearchClient) searchOFF(ctx context.Context, q string) ([]SearchResult, error) {
	var body struct {
		Products []offProduct `json:"products"`
	}
	u := c.OFFBase + "/cgi/search.pl?search_terms=" + url.QueryEscape(q) +
		"&search_simple=1&action=process&json=1&page_size=20"
	if err := c.getJSON(ctx, u, &body); err != nil {
		return nil, err
	}
	out := make([]SearchResult, 0, len(body.Products))
	for _, p := range body.Products {
		out = append(out, p.result())
	}
	return out, nil
}

func (c *SearchClient) searchUSDA(ctx context.Context, q string) ([]SearchResult, error) {
	var body struct {
		Foods []struct {
			Description     string  `json:"description"`
			BrandOwner      string  `json:"brandOwner"`
			GtinUpc         string  `json:"gtinUpc"`
			ServingSize     float64 `json:"servingSize"`
			ServingSizeUnit string  `json:"servingSizeUnit"`
			FoodNutrients   []struct {
				NutrientID int     `json:"nutrientId"`
				Value      float64 `json:"value"`
			} `json:"foodNutrients"`
		} `json:"foods"`
	}
	u := c.USDABase + "/fdc/v1/foods/search?api_key=" + url.QueryEscape(c.USDAKey) +
		"&query=" + url.QueryEscape(q) + "&pageSize=20"
	if err := c.getJSON(ctx, u, &body); err != nil {
		return nil, err
	}
	out := make([]SearchResult, 0, len(body.Foods))
	for _, f := range body.Foods {
		r := SearchResult{
			FoodName:    f.Description,
			Brand:       f.BrandOwner,
			Barcode:     f.GtinUpc,
			ServingSize: f.ServingSize,
			ServingUnit: f.ServingSizeUnit,
			Source:      "usda",
		}
		if r.ServingSize <= 0 {
			r.ServingSize = 100
		}
		if r.ServingUnit == "" {
			r.ServingUnit = "g"
		}
		// USDA search nutrient values are per 100g.
		for _, n := range f.FoodNutrients {
			switch n.NutrientID {
			case 1008:
				r.Calories = n.Value
			case 1003:
				r.Protein = n.Value
			case 1005:
				r.Carbs = n.Value
			case 1004:
				r.Fat = n.Value
			case 1079:
				v := n.Value
				r.Fibre = &v
			}
		}
		out = append(out, r)
	}
	return out, nil
}

func (c *SearchClient) getJSON(ctx context.Context, u string, dst any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return ErrNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("upstream status %d", resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(dst)
}

// toFloat coerces OFF's number-or-string JSON values.
// optFloat is toFloat for a field that is allowed to be missing: nil in, nil
// out, so an absent nutrient never becomes a reported zero.
func optFloat(v any) *float64 {
	if v == nil {
		return nil
	}
	switch n := v.(type) {
	case float64:
		return &n
	case string:
		f, err := strconv.ParseFloat(n, 64)
		if err != nil {
			return nil
		}
		return &f
	}
	return nil
}

func toFloat(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case string:
		f, _ := strconv.ParseFloat(n, 64)
		return f
	}
	return 0
}
