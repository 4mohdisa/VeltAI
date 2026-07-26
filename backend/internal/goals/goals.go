// Package goals implements onboarding (with TDEE goal derivation), goal
// targets, and body-weight tracking.
package goals

import (
	"context"
	"net/http"
	"strings"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/httpx"
)

type Onboarding struct {
	ID            string    `json:"id,omitzero"`
	UserID        string    `json:"user_id,omitzero"`
	Completed     bool      `json:"completed"`
	Age           *int      `json:"age"`
	Sex           *string   `json:"sex"`
	Height        *float64  `json:"height"`
	HeightUnit    *string   `json:"height_unit"`
	Weight        *float64  `json:"weight"`
	WeightUnit    *string   `json:"weight_unit"`
	ActivityLevel *string   `json:"activity_level"`
	Goal          *string   `json:"goal"`
	BodyType      *string   `json:"body_type"`
	CreatedAt     time.Time `json:"created_at,omitzero"`
}

type Goals struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	CalorieTarget *float64  `json:"calorie_target"`
	ProteinTarget *float64  `json:"protein_target"`
	CarbTarget    *float64  `json:"carb_target"`
	FatTarget     *float64  `json:"fat_target"`
	FibreTarget   *float64  `json:"fibre_target"`
	WeightGoal    *string   `json:"weight_goal"`
	TargetWeight  *float64  `json:"target_weight"`
	WeightUnit    *string   `json:"weight_unit"`
	ActivityLevel *string   `json:"activity_level"`
	Source        *string   `json:"source"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type BodyWeight struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Date      string    `json:"date"`
	Weight    float64   `json:"weight"`
	Unit      string    `json:"unit"`
	Notes     *string   `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

// OnboardingCompletion is the validated input to CompleteOnboarding: onboarding
// answers plus optional cuisine/dietary preferences, all committed atomically.
type OnboardingCompletion struct {
	UserID              string
	Age                 int
	Sex                 string
	Height, Weight      float64
	HeightUnit          string
	WeightUnit          string
	ActivityLevel, Goal string
	BodyType            string
	Cuisines            []string
	DietaryRequirements []string
}

// bodyTypeGoalSuggestion maps a body_type to the goal it nudges toward; the
// empty key (no body_type) yields "".
var bodyTypeGoalSuggestion = map[string]string{
	"skinny":     "Build muscle",
	"skinny_fat": "Body recomp",
	"average":    "Eat healthier",
	"overweight": "Lose weight",
	"muscular":   "Track nutrition",
}

// Store methods return (nil, nil) when a row doesn't exist.
type Store interface {
	GetOnboarding(ctx context.Context, userID string) (*Onboarding, error)
	// CompleteOnboarding upserts onboarding+derived goals+cuisine prefs, seeds
	// saved_foods from the cuisine library, and primes ai_user_brain, all in
	// one transaction: either everything lands or nothing does.
	CompleteOnboarding(ctx context.Context, in OnboardingCompletion) (*Onboarding, *Goals, error)
	GetGoals(ctx context.Context, userID string) (*Goals, error)
	UpsertGoals(ctx context.Context, g *Goals) (*Goals, error)
	ListBodyWeight(ctx context.Context, userID string) ([]BodyWeight, error)
	CreateBodyWeight(ctx context.Context, bw *BodyWeight) (*BodyWeight, error)
	GetBodyWeight(ctx context.Context, id string) (*BodyWeight, error)
	DeleteBodyWeight(ctx context.Context, id string) error
}

func Register(mux *http.ServeMux, s Store) {
	h := &handler{s: s}
	mux.HandleFunc("GET /api/onboarding", h.getOnboarding)
	mux.HandleFunc("POST /api/onboarding", h.postOnboarding)
	mux.HandleFunc("GET /api/goals", h.getGoals)
	mux.HandleFunc("PUT /api/goals", h.putGoals)
	mux.HandleFunc("GET /api/body-weight", h.listBodyWeight)
	mux.HandleFunc("POST /api/body-weight", h.postBodyWeight)
	mux.HandleFunc("DELETE /api/body-weight/{id}", h.deleteBodyWeight)
}

type handler struct{ s Store }

func (h *handler) getOnboarding(w http.ResponseWriter, r *http.Request) {
	ob, err := h.s.GetOnboarding(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load onboarding")
		return
	}
	if ob == nil {
		ob = &Onboarding{Completed: false}
	}
	httpx.JSON(w, http.StatusOK, ob)
}

type onboardingReq struct {
	Age                 *int     `json:"age"`
	Sex                 *string  `json:"sex"`
	Height              *float64 `json:"height"`
	HeightUnit          *string  `json:"height_unit"`
	Weight              *float64 `json:"weight"`
	WeightUnit          *string  `json:"weight_unit"`
	ActivityLevel       *string  `json:"activity_level"`
	Goal                *string  `json:"goal"`
	BodyType            *string  `json:"body_type"`
	Cuisines            []string `json:"cuisines"`
	DietaryRequirements []string `json:"dietary_requirements"`
}

func (h *handler) postOnboarding(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	var req onboardingReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var missing []string
	if req.Age == nil {
		missing = append(missing, "age")
	}
	if req.Sex == nil {
		missing = append(missing, "sex")
	}
	if req.Height == nil {
		missing = append(missing, "height")
	}
	if req.Weight == nil {
		missing = append(missing, "weight")
	}
	if req.ActivityLevel == nil {
		missing = append(missing, "activity_level")
	}
	if req.Goal == nil {
		missing = append(missing, "goal")
	}
	if len(missing) > 0 {
		httpx.Error(w, http.StatusBadRequest, "missing required fields: "+strings.Join(missing, ", "))
		return
	}
	if *req.Age <= 0 || *req.Height <= 0 || *req.Weight <= 0 {
		httpx.Error(w, http.StatusBadRequest, "age, height, and weight must be positive")
		return
	}
	// body_type is optional; when present it must be a known value.
	bodyType := strv(req.BodyType)
	if bodyType != "" {
		if _, ok := bodyTypeGoalSuggestion[bodyType]; !ok {
			httpx.Error(w, http.StatusBadRequest, "body_type must be one of skinny, skinny_fat, average, overweight, muscular")
			return
		}
	}

	saved, _, err := h.s.CompleteOnboarding(r.Context(), OnboardingCompletion{
		UserID:              uid,
		Age:                 *req.Age,
		Sex:                 *req.Sex,
		Height:              *req.Height,
		HeightUnit:          strv(req.HeightUnit),
		Weight:              *req.Weight,
		WeightUnit:          strv(req.WeightUnit),
		ActivityLevel:       *req.ActivityLevel,
		Goal:                *req.Goal,
		BodyType:            bodyType,
		Cuisines:            req.Cuisines,
		DietaryRequirements: req.DietaryRequirements,
	})
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to save onboarding")
		return
	}
	// Wrap the onboarding row with the derived goal suggestion (empty when no
	// body_type was supplied).
	httpx.JSON(w, http.StatusOK, struct {
		*Onboarding
		BodyTypeGoalSuggestion string `json:"body_type_goal_suggestion"`
	}{saved, bodyTypeGoalSuggestion[bodyType]})
}

func (h *handler) getGoals(w http.ResponseWriter, r *http.Request) {
	g, err := h.s.GetGoals(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load goals")
		return
	}
	if g == nil {
		httpx.Error(w, http.StatusNotFound, "no goals set")
		return
	}
	httpx.JSON(w, http.StatusOK, g)
}

type goalsReq struct {
	CalorieTarget *float64 `json:"calorie_target"`
	ProteinTarget *float64 `json:"protein_target"`
	CarbTarget    *float64 `json:"carb_target"`
	FatTarget     *float64 `json:"fat_target"`
	FibreTarget   *float64 `json:"fibre_target"`
	WeightGoal    *string  `json:"weight_goal"`
	TargetWeight  *float64 `json:"target_weight"`
	WeightUnit    *string  `json:"weight_unit"`
	ActivityLevel *string  `json:"activity_level"`
	Source        *string  `json:"source"`
}

func (h *handler) putGoals(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	var req goalsReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	cur, err := h.s.GetGoals(r.Context(), uid)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load goals")
		return
	}
	g := &Goals{UserID: uid}
	if cur != nil {
		*g = *cur
	}
	if req.CalorieTarget != nil {
		g.CalorieTarget = req.CalorieTarget
	}
	if req.ProteinTarget != nil {
		g.ProteinTarget = req.ProteinTarget
	}
	if req.CarbTarget != nil {
		g.CarbTarget = req.CarbTarget
	}
	if req.FatTarget != nil {
		g.FatTarget = req.FatTarget
	}
	if req.FibreTarget != nil {
		g.FibreTarget = req.FibreTarget
	}
	if req.WeightGoal != nil {
		g.WeightGoal = req.WeightGoal
	}
	if req.TargetWeight != nil {
		g.TargetWeight = req.TargetWeight
	}
	if req.WeightUnit != nil {
		g.WeightUnit = req.WeightUnit
	}
	if req.ActivityLevel != nil {
		g.ActivityLevel = req.ActivityLevel
	}
	src := "manual"
	if req.Source != nil {
		src = *req.Source
	}
	g.Source = &src

	saved, err := h.s.UpsertGoals(r.Context(), g)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to save goals")
		return
	}
	httpx.JSON(w, http.StatusOK, saved)
}

func (h *handler) listBodyWeight(w http.ResponseWriter, r *http.Request) {
	entries, err := h.s.ListBodyWeight(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load body weight")
		return
	}
	if entries == nil {
		entries = []BodyWeight{}
	}
	httpx.JSON(w, http.StatusOK, entries)
}

type bodyWeightReq struct {
	Date   *string  `json:"date"`
	Weight *float64 `json:"weight"`
	Unit   *string  `json:"unit"`
	Notes  *string  `json:"notes"`
}

func (h *handler) postBodyWeight(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	var req bodyWeightReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Date == nil || *req.Date == "" {
		httpx.Error(w, http.StatusBadRequest, "date is required")
		return
	}
	if _, err := time.Parse("2006-01-02", *req.Date); err != nil {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	if req.Weight == nil || *req.Weight <= 0 {
		httpx.Error(w, http.StatusBadRequest, "weight must be greater than 0")
		return
	}
	unit := "kg"
	if req.Unit != nil && *req.Unit != "" {
		unit = *req.Unit
	}
	saved, err := h.s.CreateBodyWeight(r.Context(), &BodyWeight{
		UserID: uid,
		Date:   *req.Date,
		Weight: *req.Weight,
		Unit:   unit,
		Notes:  req.Notes,
	})
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to save body weight")
		return
	}
	httpx.JSON(w, http.StatusCreated, saved)
}

func (h *handler) deleteBodyWeight(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	bw, err := h.s.GetBodyWeight(r.Context(), r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load body weight")
		return
	}
	if bw == nil {
		httpx.Error(w, http.StatusNotFound, "body weight entry not found")
		return
	}
	if bw.UserID != uid {
		httpx.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	if err := h.s.DeleteBodyWeight(r.Context(), bw.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to delete body weight")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func strv(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func fptr(n int) *float64 {
	f := float64(n)
	return &f
}
