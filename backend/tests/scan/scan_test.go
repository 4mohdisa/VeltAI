package scantests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/scan"
)

type fakeOCR struct {
	result scan.Result
	err    error
}

func (f *fakeOCR) Extract(_ context.Context, _, _ string) (scan.Result, error) {
	return f.result, f.err
}

// fakePortionPref mirrors one row of user_portion_prefs.
type fakePortionPref struct {
	weight   float64
	mealType string
	count    int
}

// fakeSession mirrors one row of scan_sessions, for feedback/ownership and
// accuracy-summary tests.
type fakeSession struct {
	owner     string
	rating    string
	foodLogID string
}

// fakeCorrection mirrors one row of scan_corrections, enough to compute
// AccuracySummary the same way the real SQL does. createdAt must be set
// explicitly by callers that care about the 90-day window (zero-value is
// treated as "outside the window", matching a real all-NULL/ancient row).
type fakeCorrection struct {
	userID           string
	foodNameOriginal string
	weightOriginalG  float64
	weightCorrectedG float64
	magnitude        *float64
	createdAt        time.Time
}

// fakeFoodLog mirrors one row of food_logs — just enough (user/food/meal
// type) to replicate the majority-vote typical_meal_type subquery that
// scan.go's real upsertPortionPref shares with food/learning.go's
// UpsertPortionPref.
type fakeFoodLog struct {
	userID   string
	foodName string
	mealType string
}

// fakeStore is an in-memory stand-in for scan.PGStore. Every mutating method
// lazily initializes its map so a bare &fakeStore{} (as used by the existing
// tests in this file) works without a constructor.
type fakeStore struct {
	saved scan.ConfirmedLog

	portionPrefs map[string]fakePortionPref // key: userID+"\x00"+foodName
	sessions     map[string]fakeSession     // key: scan_session_id
	corrections  []fakeCorrection
	foodLogs     []fakeFoodLog

	// needsRebuild/logsSinceRebuild simulate ai_user_brain.needs_rebuild and
	// the food_logs-since-last-rebuild count the real bounded UPDATE counts;
	// this fake can't replicate the exact correlated-subquery SQL against a
	// real DB, so it mirrors the same threshold logic in Go (same caveat the
	// food package's fakes carry for SQL-only behavior).
	needsRebuild     map[string]bool
	logsSinceRebuild map[string]int

	nextSessionID int
}

func portionKey(userID, foodName string) string { return userID + "\x00" + foodName }

func (f *fakeStore) CreateSession(_ context.Context, sess scan.Session) (string, error) {
	if f.sessions == nil {
		f.sessions = map[string]fakeSession{}
	}
	f.nextSessionID++
	id := fmt.Sprintf("sess_%d", f.nextSessionID)
	f.sessions[id] = fakeSession{owner: sess.UserID}
	return id, nil
}

func (f *fakeStore) SaveConfirmed(_ context.Context, log scan.ConfirmedLog) (string, error) {
	f.saved = log
	id := "log_123"

	if log.ScanSessionID != nil && *log.ScanSessionID != "" {
		if f.sessions == nil {
			f.sessions = map[string]fakeSession{}
		}
		s := f.sessions[*log.ScanSessionID]
		s.foodLogID = id
		f.sessions[*log.ScanSessionID] = s
	}

	mealType := ""
	if log.MealType != nil {
		mealType = *log.MealType
	}
	f.foodLogs = append(f.foodLogs, fakeFoodLog{userID: log.UserID, foodName: log.FoodName, mealType: mealType})

	if log.Quantity != nil && *log.Quantity > 0 {
		f.upsertPortionPref(log.UserID, log.FoodName, *log.Quantity, mealType)
	}

	if f.logsSinceRebuild == nil {
		f.logsSinceRebuild = map[string]int{}
	}
	if f.needsRebuild == nil {
		f.needsRebuild = map[string]bool{}
	}
	f.logsSinceRebuild[log.UserID]++
	if !f.needsRebuild[log.UserID] && f.logsSinceRebuild[log.UserID] >= 5 {
		f.needsRebuild[log.UserID] = true
	}

	return id, nil
}

// upsertPortionPref mirrors scan.go's real upsertPortionPref: a running
// weighted average for typical_weight_g, and typical_meal_type set by
// majority vote over food_logs history (matching the fixed SQL — one
// newest-log outlier must not clobber an established pattern), falling back
// to the new value only when there's no history yet.
func (f *fakeStore) upsertPortionPref(userID, foodName string, weightG float64, mealType string) {
	if f.portionPrefs == nil {
		f.portionPrefs = map[string]fakePortionPref{}
	}
	key := portionKey(userID, foodName)
	existing := f.portionPrefs[key]
	newCount := existing.count + 1
	newWeight := weightG
	if existing.count > 0 {
		newWeight = (existing.weight*float64(existing.count) + weightG) / float64(newCount)
	}
	mt := f.mostFrequentMealType(userID, foodName)
	if mt == "" {
		mt = mealType
	}
	f.portionPrefs[key] = fakePortionPref{weight: newWeight, mealType: mt, count: newCount}
}

func (f *fakeStore) mostFrequentMealType(userID, foodName string) string {
	counts := map[string]int{}
	for _, l := range f.foodLogs {
		if l.userID == userID && l.foodName == foodName && l.mealType != "" {
			counts[l.mealType]++
		}
	}
	best, bestN := "", 0
	for mt, n := range counts {
		if n > bestN {
			best, bestN = mt, n
		}
	}
	return best
}

// SaveCorrection mirrors scan.PGStore.SaveCorrection's calibration_updated
// guard; it does not replicate the EWMA math itself (that's covered by the
// internal pure-function tests), only the correction_magnitude that was
// computed and passed in, and whether calibration would have been touched.
func (f *fakeStore) SaveCorrection(_ context.Context, c scan.Correction) (bool, error) {
	f.corrections = append(f.corrections, fakeCorrection{
		userID:           c.UserID,
		foodNameOriginal: c.FoodNameOriginal,
		weightOriginalG:  c.WeightOriginalG,
		weightCorrectedG: c.WeightCorrectedG,
		magnitude:        c.CorrectionMagnitude,
		createdAt:        time.Now(), // mirrors scan_corrections.created_at's `default now()`
	})
	if c.WeightOriginalG <= 0 || c.WeightCorrectedG <= 0 || c.FoodNameOriginal == "" {
		return false, nil
	}
	return true, nil
}

func (f *fakeStore) CalibrationFactors(_ context.Context, userID string) ([]scan.CalibrationFactor, error) {
	return nil, nil
}

func (f *fakeStore) AccuracySummary(_ context.Context, userID string) (scan.AccuracySummary, error) {
	var sum scan.AccuracySummary
	for _, s := range f.sessions {
		if s.owner == userID {
			sum.TotalScans++
		}
	}
	cutoff := time.Now().Add(-90 * 24 * time.Hour)
	type ratioAgg struct {
		sum         float64
		n           int
		displayName string // mirrors the real SQL's min(food_name_original)
	}
	byFood := map[string]*ratioAgg{} // key: lower(trim(food_name_original))
	var magSum float64
	for _, c := range f.corrections {
		if c.userID != userID || c.createdAt.Before(cutoff) {
			continue
		}
		sum.CorrectedCount++
		if c.magnitude != nil {
			magSum += *c.magnitude
		}
		if c.weightOriginalG <= 0 || c.foodNameOriginal == "" {
			continue
		}
		key := strings.ToLower(strings.TrimSpace(c.foodNameOriginal))
		a := byFood[key]
		if a == nil {
			a = &ratioAgg{displayName: c.foodNameOriginal}
			byFood[key] = a
		} else if c.foodNameOriginal < a.displayName {
			a.displayName = c.foodNameOriginal
		}
		a.sum += (c.weightCorrectedG - c.weightOriginalG) / c.weightOriginalG
		a.n++
	}
	if sum.CorrectedCount > 0 {
		sum.AvgCorrectionMagnitude = magSum / float64(sum.CorrectedCount)
	}
	type foodRatio struct {
		name  string
		ratio float64
	}
	var ratios []foodRatio
	for _, a := range byFood {
		ratios = append(ratios, foodRatio{a.displayName, a.sum / float64(a.n)})
	}
	top := func(desc bool) []string {
		sorted := append([]foodRatio(nil), ratios...)
		for i := 0; i < len(sorted); i++ {
			for j := i + 1; j < len(sorted); j++ {
				less := sorted[j].ratio > sorted[i].ratio
				if !desc {
					less = sorted[j].ratio < sorted[i].ratio
				}
				if less {
					sorted[i], sorted[j] = sorted[j], sorted[i]
				}
			}
		}
		var out []string
		for _, r := range sorted {
			out = append(out, r.name)
			if len(out) == 3 {
				break
			}
		}
		return out
	}
	sum.MostUnderestimated = top(true)
	sum.MostOverestimated = top(false)
	return sum, nil
}

func (f *fakeStore) GetScanSessionOwner(_ context.Context, id string) (string, error) {
	s, ok := f.sessions[id]
	if !ok {
		return "", scan.ErrNotFound
	}
	return s.owner, nil
}

func (f *fakeStore) UpdateScanRating(_ context.Context, id, rating string) error {
	if f.sessions == nil {
		f.sessions = map[string]fakeSession{}
	}
	s := f.sessions[id]
	s.rating = rating
	f.sessions[id] = s
	return nil
}

func serve(t *testing.T, ocr scan.OCR, store scan.Store, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	scan.Register(mux, ocr, store)
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req = req.WithContext(auth.WithUserID(req.Context(), "user_1"))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func decodeData(t *testing.T, rec *httptest.ResponseRecorder, dst any) {
	t.Helper()
	var env struct {
		Data  json.RawMessage `json:"data"`
		Error *string         `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("bad envelope: %v", err)
	}
	if err := json.Unmarshal(env.Data, dst); err != nil {
		t.Fatalf("bad data: %v", err)
	}
}

func TestScanReturnsResult(t *testing.T) {
	ocr := &fakeOCR{result: scan.Result{FoodName: "banana", Calories: 105, Protein: 1.3, Confidence: 0.9}}
	rec := serve(t, ocr, &fakeStore{}, "POST", "/api/scan", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	var got scan.Result
	decodeData(t, rec, &got)
	if got.FoodName != "banana" || got.Calories != 105 || got.Confidence != 0.9 {
		t.Fatalf("got %+v", got)
	}
}

func TestScanMissingImage(t *testing.T) {
	rec := serve(t, &fakeOCR{}, &fakeStore{}, "POST", "/api/scan", `{"mime_type":"image/png"}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestScanUnavailable(t *testing.T) {
	rec := serve(t, scan.NewGemini(""), &fakeStore{}, "POST", "/api/scan", `{"image_base64":"aGVsbG8="}`)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503; body %s", rec.Code, rec.Body)
	}
	if !strings.Contains(rec.Body.String(), "GEMINI_API_KEY") {
		t.Fatalf("body = %s", rec.Body)
	}
}

func TestConfirmSaves(t *testing.T) {
	store := &fakeStore{}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"banana","meal_type":"snack","calories":105,"quantity":1,"unit":"medium"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body %s", rec.Code, rec.Body)
	}
	if store.saved.UserID != "user_1" {
		t.Fatalf("user_id = %q, want user_1", store.saved.UserID)
	}
	if store.saved.Date == "" {
		t.Fatal("date not defaulted")
	}
	if store.saved.MealType == nil || *store.saved.MealType != "snack" {
		t.Fatalf("meal_type = %v, want snack", store.saved.MealType)
	}
	if store.saved.Quantity == nil || *store.saved.Quantity != 1 {
		t.Fatalf("quantity = %v, want 1", store.saved.Quantity)
	}
	if store.saved.Unit == nil || *store.saved.Unit != "medium" {
		t.Fatalf("unit = %v, want medium", store.saved.Unit)
	}
	var got struct {
		ID       string `json:"id"`
		Source   string `json:"source"`
		FoodName string `json:"food_name"`
	}
	decodeData(t, rec, &got)
	if got.ID != "log_123" || got.Source != "scan" || got.FoodName != "banana" {
		t.Fatalf("got %+v", got)
	}
}

// IDOR: POST /api/scan/confirm accepts a caller-supplied scan_session_id and
// used it to UPDATE scan_sessions with no ownership check, so user B could
// point another user's session row at B's own food_log. The two sibling routes
// (/correction, /feedback) already checked; this one was missed.
func TestConfirmRejectsForeignScanSession(t *testing.T) {
	store := &fakeStore{sessions: map[string]fakeSession{
		"sess_victim": {owner: "user_victim"},
	}}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"attacker food","calories":100,"scan_session_id":"sess_victim"}`)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403; body %s", rec.Code, rec.Body)
	}
	if store.saved.FoodName != "" {
		t.Fatalf("a rejected confirm must not save a log, saved %q", store.saved.FoodName)
	}
}

// An unknown session id is a 404, matching /api/scan/correction.
func TestConfirmUnknownScanSessionIs404(t *testing.T) {
	store := &fakeStore{}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"banana","calories":105,"scan_session_id":"sess_nope"}`)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404; body %s", rec.Code, rec.Body)
	}
}

// The caller's OWN session still confirms normally.
func TestConfirmAcceptsOwnScanSession(t *testing.T) {
	store := &fakeStore{sessions: map[string]fakeSession{
		"sess_mine": {owner: "user_1"},
	}}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"banana","calories":105,"scan_session_id":"sess_mine"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body %s", rec.Code, rec.Body)
	}
	if store.saved.FoodName != "banana" {
		t.Fatalf("saved = %q, want banana", store.saved.FoodName)
	}
}

// Omitted optional fields must stay nil so pgx inserts NULL, matching the
// manual food.CreateLog write path.
func TestConfirmOmittedOptionalsStayNil(t *testing.T) {
	store := &fakeStore{}
	rec := serve(t, &fakeOCR{}, store, "POST", "/api/scan/confirm",
		`{"food_name":"apple","calories":95}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body %s", rec.Code, rec.Body)
	}
	if store.saved.MealType != nil {
		t.Fatalf("meal_type = %q, want nil", *store.saved.MealType)
	}
	if store.saved.Quantity != nil {
		t.Fatalf("quantity = %v, want nil", *store.saved.Quantity)
	}
	if store.saved.Unit != nil {
		t.Fatalf("unit = %q, want nil", *store.saved.Unit)
	}
	// Response JSON mirrors the stored values: null, not ""/0.
	var got struct {
		MealType *string  `json:"meal_type"`
		Quantity *float64 `json:"quantity"`
		Unit     *string  `json:"unit"`
	}
	decodeData(t, rec, &got)
	if got.MealType != nil || got.Quantity != nil || got.Unit != nil {
		t.Fatalf("response optionals = %v/%v/%v, want nulls", got.MealType, got.Quantity, got.Unit)
	}
}

func TestConfirmMissingFoodName(t *testing.T) {
	rec := serve(t, &fakeOCR{}, &fakeStore{}, "POST", "/api/scan/confirm", `{"calories":100}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestConfirmNegativeCalories(t *testing.T) {
	rec := serve(t, &fakeOCR{}, &fakeStore{}, "POST", "/api/scan/confirm",
		`{"food_name":"banana","calories":-5}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestGeminiRequestAndParsing(t *testing.T) {
	var gotPath, gotRawQuery, gotKeyHeader string
	var gotBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotRawQuery = r.URL.RawQuery
		gotKeyHeader = r.Header.Get("x-goog-api-key")
		if err := json.NewDecoder(r.Body).Decode(&gotBody); err != nil {
			t.Errorf("bad request body: %v", err)
		}
		inner := `{"food_name":"apple","brand":"","quantity":1,"unit":"whole","calories":95,"protein":0.5,"carbs":25,"fat":0.3,"fibre":4.4,"confidence":0.85}`
		resp := map[string]any{"candidates": []any{map[string]any{
			"content": map[string]any{"parts": []any{map[string]any{"text": inner}}},
		}}}
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	g := scan.NewGemini("test-key").(*scan.Gemini)
	g.Base = srv.URL
	res, err := g.Extract(context.Background(), "aW1n", "image/png")
	if err != nil {
		t.Fatalf("Extract: %v", err)
	}
	if gotPath != "/v1beta/models/gemini-2.5-flash:generateContent" {
		t.Fatalf("path = %q", gotPath)
	}
	if gotKeyHeader != "test-key" {
		t.Fatalf("x-goog-api-key = %q, want test-key", gotKeyHeader)
	}
	if gotRawQuery != "" {
		t.Fatalf("query = %q, want empty (key must not appear in the URL)", gotRawQuery)
	}
	contents := gotBody["contents"].([]any)
	parts := contents[0].(map[string]any)["parts"].([]any)
	if len(parts) != 2 {
		t.Fatalf("parts = %d, want 2", len(parts))
	}
	text := parts[0].(map[string]any)["text"].(string)
	if !strings.Contains(text, "food_name") || !strings.Contains(text, "confidence") {
		t.Fatalf("prompt missing keys: %q", text)
	}
	inline := parts[1].(map[string]any)["inline_data"].(map[string]any)
	if inline["mime_type"] != "image/png" || inline["data"] != "aW1n" {
		t.Fatalf("inline_data = %v", inline)
	}
	gc := gotBody["generationConfig"].(map[string]any)
	if gc["response_mime_type"] != "application/json" {
		t.Fatalf("generationConfig = %v", gc)
	}
	if res.FoodName != "apple" || res.Calories != 95 || res.Fibre != 4.4 || res.Confidence != 0.85 {
		t.Fatalf("res = %+v", res)
	}
}
