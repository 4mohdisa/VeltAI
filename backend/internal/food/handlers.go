package food

import (
	"context"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/httpx"
)

var uuidRE = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

type handler struct {
	store        Store
	search       *SearchClient
	cuisineCache cuisinePrefsCache
}

func Register(mux *http.ServeMux, s Store, sc *SearchClient) {
	h := &handler{store: s, search: sc}
	mux.HandleFunc("GET /api/food/logs", h.listLogs)
	mux.HandleFunc("GET /api/food/logs/{id}", h.getLog)
	mux.HandleFunc("POST /api/food/logs", h.createLog)
	mux.HandleFunc("PATCH /api/food/logs/{id}", h.patchLog)
	mux.HandleFunc("DELETE /api/food/logs/{id}", h.deleteLog)
	mux.HandleFunc("GET /api/food/summary", h.summary)
	mux.HandleFunc("GET /api/food/days", h.loggedDays)
	mux.HandleFunc("GET /api/food/search", h.searchFoods)
	mux.HandleFunc("GET /api/food/barcode/{barcode}", h.barcode)
	mux.HandleFunc("GET /api/food/saved", h.listSaved)
	mux.HandleFunc("POST /api/food/saved", h.createSaved)
	mux.HandleFunc("DELETE /api/food/saved/{id}", h.deleteSaved)
	mux.HandleFunc("POST /api/food/quick-add", h.quickAdd)
	mux.HandleFunc("GET /api/food/portion-memory", h.portionMemory)
}

func validDate(s string) bool {
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}

// --- Trust-boundary bounds (audit 2026-08-06) --------------------------------
// Pre-audit only calories >= 0 was checked; protein=-500 or carbs=-1e10 went
// straight to disk and silently corrupted /summary, the energy balance and the
// AI-brain inputs. Bounds are generous (a whole day's binge fits in one row)
// while rejecting the negative and the absurd. Exported so the scan-confirm
// and recipe log paths enforce the same rule instead of growing their own.

const (
	MaxItemCalories = 20000.0 // kcal for one logged item
	MaxItemMacroG   = 2000.0  // grams of one macro in one item
	MaxItemGrams    = 20000.0 // quantity of one item
)

// ValidMealType accepts the four meal slots, or absent. Anything else used to
// pass through as free text and silently vanish from the client's meal groups.
// Case-insensitive, and both "snack" and "snacks" are accepted, because the
// shipped app sends its capitalized slot names ('Breakfast', 'Snacks') — a
// strict lowercase enum here would 400 every real log write, and the hermetic
// suite (which posts lowercase) would never notice.
func ValidMealType(m *string) bool {
	if m == nil || *m == "" {
		return true
	}
	switch strings.ToLower(*m) {
	case "breakfast", "lunch", "dinner", "snack", "snacks":
		return true
	}
	return false
}

// ValidateItemValues checks one logged item's numbers; returns "" when fine.
func ValidateItemValues(calories, protein, carbs, fat, fibre float64, quantity *float64) string {
	type bound struct {
		name string
		v    float64
		max  float64
	}
	checks := []bound{
		{"calories", calories, MaxItemCalories},
		{"protein", protein, MaxItemMacroG},
		{"carbs", carbs, MaxItemMacroG},
		{"fat", fat, MaxItemMacroG},
		{"fibre", fibre, MaxItemMacroG},
	}
	if quantity != nil {
		checks = append(checks, bound{"quantity", *quantity, MaxItemGrams})
	}
	for _, c := range checks {
		if c.v < 0 {
			return c.name + " must not be negative"
		}
		if c.v > c.max {
			return c.name + " is implausibly large"
		}
	}
	return ""
}

// authorize writes 404/403/500 and returns false unless the row exists and
// belongs to the authenticated user.
func authorize(w http.ResponseWriter, r *http.Request, getOwner func(context.Context, string) (string, error), id string) bool {
	owner, err := getOwner(r.Context(), id)
	switch {
	case errors.Is(err, ErrNotFound):
		httpx.Error(w, http.StatusNotFound, "not found")
	case err != nil:
		httpx.Error(w, http.StatusInternalServerError, "lookup failed")
	case owner != auth.UserID(r.Context()):
		httpx.Error(w, http.StatusForbidden, "forbidden")
	default:
		return true
	}
	return false
}

func (h *handler) listLogs(w http.ResponseWriter, r *http.Request) {
	var date, meal *string
	if v := r.URL.Query().Get("date"); v != "" {
		if !validDate(v) {
			httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
			return
		}
		date = &v
	}
	if v := r.URL.Query().Get("meal_type"); v != "" {
		meal = &v
	}
	var status *string
	if v := r.URL.Query().Get("status"); v != "" {
		status = &v
	}
	logs, err := h.store.ListLogs(r.Context(), auth.UserID(r.Context()), date, meal, status)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to list logs")
		return
	}
	if logs == nil {
		logs = []Log{}
	}
	httpx.JSON(w, http.StatusOK, logs)
}

// getLog returns a single food_log by id (including status + scan_results),
// used by the scan poller. Invalid UUID → 400, missing → 404, other user → 403.
func (h *handler) getLog(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidRE.MatchString(id) {
		httpx.Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	l, err := h.store.GetLog(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "not found")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load log")
		return
	}
	if l.UserID != auth.UserID(r.Context()) {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	httpx.JSON(w, http.StatusOK, l)
}

func (h *handler) createLog(w http.ResponseWriter, r *http.Request) {
	var l Log
	if err := httpx.Decode(r, &l); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(l.FoodName) == "" {
		httpx.Error(w, http.StatusBadRequest, "food_name is required")
		return
	}
	if msg := ValidateItemValues(l.Calories, l.Protein, l.Carbs, l.Fat, l.Fibre, l.Quantity); msg != "" {
		httpx.Error(w, http.StatusBadRequest, msg)
		return
	}
	if !ValidMealType(l.MealType) {
		httpx.Error(w, http.StatusBadRequest, "meal_type must be breakfast, lunch, dinner or snack")
		return
	}
	if l.Date == "" {
		l.Date = config.Today()
	} else if !validDate(l.Date) {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	l.ID = ""
	l.UserID = auth.UserID(r.Context())
	l.IdempotencyKey = r.Header.Get("Idempotency-Key")
	created, err := h.store.CreateLog(r.Context(), l)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to create log")
		return
	}
	h.runLearningHooks(r.Context(), created)
	httpx.JSON(w, http.StatusCreated, created)
}

func (h *handler) patchLog(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !authorize(w, r, h.store.GetLogOwner, id) {
		return
	}
	var p LogPatch
	if err := httpx.Decode(r, &p); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if p.FoodName != nil && strings.TrimSpace(*p.FoodName) == "" {
		httpx.Error(w, http.StatusBadRequest, "food_name must not be empty")
		return
	}
	// Same bounds as create — a PATCH is the same trust boundary.
	deref := func(v *float64) float64 {
		if v == nil {
			return 0
		}
		return *v
	}
	if msg := ValidateItemValues(deref(p.Calories), deref(p.Protein), deref(p.Carbs), deref(p.Fat), deref(p.Fibre), p.Quantity); msg != "" {
		httpx.Error(w, http.StatusBadRequest, msg)
		return
	}
	if !ValidMealType(p.MealType) {
		httpx.Error(w, http.StatusBadRequest, "meal_type must be breakfast, lunch, dinner or snack")
		return
	}
	if p.Date != nil && !validDate(*p.Date) {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}

	// Pre-patch food_name, only needed to detect a correction below.
	// ponytail: reuses ListLogs instead of adding a single-row GetLog method
	// — O(n) in the user's log count, only paid when the patch touches
	// food_name; add a dedicated lookup if that ever shows up as a hot path.
	var preFoodName string
	if p.FoodName != nil {
		if logs, err := h.store.ListLogs(r.Context(), auth.UserID(r.Context()), nil, nil, nil); err == nil {
			for _, l := range logs {
				if l.ID == id {
					preFoodName = l.FoodName
					break
				}
			}
		}
	}

	updated, err := h.store.UpdateLog(r.Context(), id, p)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to update log")
		return
	}

	// Best-effort learning hooks — the patch already succeeded, so a hook
	// error here must never fail the request.
	if p.Quantity != nil && updated.Quantity != nil {
		mealType := ""
		if updated.MealType != nil {
			mealType = *updated.MealType
		}
		_ = h.store.UpsertPortionPref(r.Context(), updated.UserID, updated.FoodName, *updated.Quantity, mealType)
	}
	if p.FoodName != nil && preFoodName != "" && preFoodName != updated.FoodName {
		_ = h.store.RecordFoodNameCorrection(r.Context(), updated.UserID, preFoodName, updated.FoodName)
	}

	httpx.JSON(w, http.StatusOK, updated)
}

func (h *handler) deleteLog(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !authorize(w, r, h.store.GetLogOwner, id) {
		return
	}
	// Deliberate: deletion is not a portion-preference signal (usually
	// accidental/duplicate) — per DECISIONS.md, no learning hooks here.
	if err := h.store.DeleteLog(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to delete log")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (h *handler) summary(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		date = config.Today()
	} else if !validDate(date) {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	sum, err := h.store.Summary(r.Context(), auth.UserID(r.Context()), date)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to compute summary")
		return
	}
	sum.Date = date
	httpx.JSON(w, http.StatusOK, sum)
}

// loggedDays answers "which days does this user have food on?" — the week-strip
// and month-calendar dots, and nothing else. The client used to answer it by
// pulling its ENTIRE unpaginated log history and grouping the rows itself; this
// returns just the dates.
//
// Optional from/to bound the window, inclusive. Both are validated: an
// unparseable date is a 400 rather than a silently ignored filter, and a
// backwards window is a 400 rather than a confidently empty answer.
func (h *handler) loggedDays(w http.ResponseWriter, r *http.Request) {
	var from, to *string
	if v := r.URL.Query().Get("from"); v != "" {
		if !validDate(v) {
			httpx.Error(w, http.StatusBadRequest, "from must be YYYY-MM-DD")
			return
		}
		from = &v
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if !validDate(v) {
			httpx.Error(w, http.StatusBadRequest, "to must be YYYY-MM-DD")
			return
		}
		to = &v
	}
	if from != nil && to != nil && *from > *to {
		httpx.Error(w, http.StatusBadRequest, "from must not be after to")
		return
	}
	days, err := h.store.LoggedDays(r.Context(), auth.UserID(r.Context()), from, to)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to list logged days")
		return
	}
	// A user with no logs gets [], never null: the client turns this straight
	// into a Set, and a dot is a claim that a day has a row.
	if days == nil {
		days = []string{}
	}
	httpx.JSON(w, http.StatusOK, days)
}

func (h *handler) searchFoods(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		httpx.Error(w, http.StatusBadRequest, "q is required")
		return
	}
	results := h.search.Search(r.Context(), q)

	cuisines, dietary := h.cuisinePrefs(r.Context(), auth.UserID(r.Context()))
	libraryNames, err := h.store.CuisineLibraryNames(r.Context(), cuisines)
	if err != nil {
		libraryNames = nil // ranking should never break search
	}
	httpx.JSON(w, http.StatusOK, rankByCuisine(results, cuisines, dietary, libraryNames))
}

func (h *handler) barcode(w http.ResponseWriter, r *http.Request) {
	res, err := h.search.Barcode(r.Context(), r.PathValue("barcode"))
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "product not found")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, "barcode lookup failed")
		return
	}
	httpx.JSON(w, http.StatusOK, res)
}

func (h *handler) listSaved(w http.ResponseWriter, r *http.Request) {
	saved, err := h.store.ListSaved(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to list saved foods")
		return
	}
	if saved == nil {
		saved = []SavedFood{}
	}
	httpx.JSON(w, http.StatusOK, saved)
}

func (h *handler) createSaved(w http.ResponseWriter, r *http.Request) {
	var s SavedFood
	if err := httpx.Decode(r, &s); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(s.FoodName) == "" {
		httpx.Error(w, http.StatusBadRequest, "food_name is required")
		return
	}
	s.ID = ""
	s.UserID = auth.UserID(r.Context())
	created, err := h.store.CreateSaved(r.Context(), s)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to save food")
		return
	}
	httpx.JSON(w, http.StatusCreated, created)
}

func (h *handler) deleteSaved(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !authorize(w, r, h.store.GetSavedOwner, id) {
		return
	}
	if err := h.store.DeleteSaved(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to delete saved food")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

type quickAddRequest struct {
	Calories *float64 `json:"calories"`
	MealType string   `json:"meal_type"`
	Date     string   `json:"date"`
	Label    string   `json:"label"`
}

func (h *handler) quickAdd(w http.ResponseWriter, r *http.Request) {
	var req quickAddRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Calories == nil {
		httpx.Error(w, http.StatusBadRequest, "calories is required")
		return
	}
	if msg := ValidateItemValues(*req.Calories, 0, 0, 0, 0, nil); msg != "" {
		httpx.Error(w, http.StatusBadRequest, msg)
		return
	}
	if req.MealType != "" && !ValidMealType(&req.MealType) {
		httpx.Error(w, http.StatusBadRequest, "meal_type must be breakfast, lunch, dinner or snack")
		return
	}
	date := req.Date
	if date == "" {
		date = config.Today()
	} else if !validDate(date) {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	foodName := "Quick add"
	if strings.TrimSpace(req.Label) != "" {
		foodName = req.Label
	}
	source := "quick_add"
	l := Log{
		UserID:   auth.UserID(r.Context()),
		Date:     date,
		FoodName: foodName,
		Calories: *req.Calories,
		Source:   &source,
	}
	if req.MealType != "" {
		l.MealType = &req.MealType
	}
	created, err := h.store.CreateLog(r.Context(), l)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to create log")
		return
	}
	h.runLearningHooks(r.Context(), created)
	httpx.JSON(w, http.StatusCreated, created)
}

type portionMemoryResponse struct {
	Found           bool     `json:"found"`
	TypicalWeightG  *float64 `json:"typical_weight_g"`
	LoggedCount     int      `json:"logged_count"`
	TypicalMealType *string  `json:"typical_meal_type"`
}

func (h *handler) portionMemory(w http.ResponseWriter, r *http.Request) {
	foodName := r.URL.Query().Get("food_name")
	if strings.TrimSpace(foodName) == "" {
		httpx.Error(w, http.StatusBadRequest, "food_name is required")
		return
	}
	pref, err := h.store.GetPortionPref(r.Context(), auth.UserID(r.Context()), foodName)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to look up portion memory")
		return
	}
	resp := portionMemoryResponse{Found: pref != nil}
	if pref != nil {
		resp.TypicalWeightG = pref.TypicalWeightG
		resp.LoggedCount = pref.LoggedCount
		resp.TypicalMealType = pref.TypicalMealType
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// runLearningHooks fires the general food-logging learning layer after a log
// write succeeds (createLog, quickAdd). Best-effort: the log itself is
// already durable and is the primary contract, so an individual hook error
// here must never fail the request — it just means that signal is lost.
func (h *handler) runLearningHooks(ctx context.Context, l Log) {
	if l.Quantity != nil {
		mealType := ""
		if l.MealType != nil {
			mealType = *l.MealType
		}
		_ = h.store.UpsertPortionPref(ctx, l.UserID, l.FoodName, *l.Quantity, mealType)
	}
	_ = h.store.FlagBrainRebuildIfDue(ctx, l.UserID)
	if l.MealType != nil && *l.MealType != "" {
		_ = h.store.DetectMealMemory(ctx, l.UserID, l.Date, *l.MealType)
	}
}
