// Package energy computes calorie burn (MET-based) and the daily/weekly energy
// balance (intake vs BMR + exercise vs goal target). All the arithmetic lives in
// pure exported functions so tests exercise it without a DB.
package energy

import (
	"context"
	"math"
	"net/http"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/httpx"
)

const dateLayout = "2006-01-02"

// ---------------------------------------------------------------------------
// Calorie burn (MET method)
// ---------------------------------------------------------------------------

// SessionExercise is the minimal per-exercise input to the burn calculation.
// Sets/Reps/RestSeconds/DurationMinutes are nil when unknown.
type SessionExercise struct {
	MetValue        float64
	ExerciseType    string // "strength" | "cardio"
	Sets            *int
	Reps            *int
	RestSeconds     *int
	DurationMinutes *int
}

// secondsPerRep is the assumed tempo for a strength rep when no explicit
// duration is logged (concentric+eccentric ≈ 3s).
const secondsPerRep = 3

// avgMET is the fallback for a session that logged a duration but no exercises.
const avgMET = 5.0

// exerciseHours returns the active-time hours for one exercise:
//   - an explicit DurationMinutes always wins (both strength and cardio);
//   - else strength estimates (sets*reps*3s work) + (sets*rest) rest time;
//   - else (cardio without a duration) contributes nothing.
func exerciseHours(e SessionExercise) float64 {
	if e.DurationMinutes != nil {
		return float64(*e.DurationMinutes) / 60.0
	}
	if e.ExerciseType == "cardio" {
		return 0 // cardio needs a duration to score; none given
	}
	sets, reps, rest := 0, 0, 0
	if e.Sets != nil {
		sets = *e.Sets
	}
	if e.Reps != nil {
		reps = *e.Reps
	}
	if e.RestSeconds != nil {
		rest = *e.RestSeconds
	}
	seconds := sets*reps*secondsPerRep + sets*rest
	return float64(seconds) / 3600.0
}

// CalculateSessionCalories estimates kcal burned for a session:
//
//	calories = Σ metᵢ × bodyweightKg × hoursᵢ
//
// If the session logged no exercises but has a duration, it falls back to the
// average MET over that whole duration. Never negative.
func CalculateSessionCalories(exercises []SessionExercise, bodyweightKg float64, sessionDurationMinutes int) float64 {
	if bodyweightKg <= 0 {
		bodyweightKg = 70 // population median, matches the app's onboarding default
	}
	if len(exercises) == 0 {
		if sessionDurationMinutes <= 0 {
			return 0
		}
		return avgMET * bodyweightKg * (float64(sessionDurationMinutes) / 60.0)
	}
	total := 0.0
	for _, e := range exercises {
		total += e.MetValue * bodyweightKg * exerciseHours(e)
	}
	if total < 0 {
		return 0
	}
	return math.Round(total*10) / 10
}

// ---------------------------------------------------------------------------
// Energy balance
// ---------------------------------------------------------------------------

// BMR is Mifflin–St Jeor basal metabolic rate (kcal/day), NOT TDEE — no activity
// factor. Mirrors goals.DeriveGoals' BMR term exactly.
func BMR(age int, sex string, heightCm, weightKg float64) float64 {
	b := 10*weightKg + 6.25*heightCm - 5*float64(age)
	switch sex {
	case "male":
		b += 5
	case "female":
		b -= 161
	default:
		b -= 78
	}
	if b < 0 {
		return 0
	}
	return b
}

// EnergyBalance is one day's intake-vs-expenditure picture. Pointer fields are
// null when the input to derive them is missing (no body stats → no BMR/total/
// net; no goal → no target/variance).
type EnergyBalance struct {
	Date                string   `json:"date"`
	CaloriesIn          float64  `json:"calories_in"`
	CaloriesOutBMR      *float64 `json:"calories_out_bmr"`
	CaloriesOutExercise float64  `json:"calories_out_exercise"`
	CaloriesOutTotal    *float64 `json:"calories_out_total"`
	NetBalance          *float64 `json:"net_balance"`
	Target              *float64 `json:"target"`
	Variance            *float64 `json:"variance"`
	Status              string   `json:"status"` // deficit | surplus | on_target | no_target
}

// WeeklyEnergyBalance is the last 7 days (oldest first) plus rolled-up averages.
type WeeklyEnergyBalance struct {
	Days             []EnergyBalance `json:"days"`
	WeeklyAverageIn  float64         `json:"weekly_average_in"`
	WeeklyAverageOut float64         `json:"weekly_average_out"`
	WeeklyNet        float64         `json:"weekly_net"`
}

// onTargetBand is the ± kcal window around the target treated as "on target".
const onTargetBand = 50.0

// ComputeBalance assembles one day's EnergyBalance from its parts. bmr/target are
// nil when unknown; the derived pointer fields stay nil to match.
func ComputeBalance(date string, caloriesIn, caloriesOutExercise float64, bmr, target *float64) EnergyBalance {
	eb := EnergyBalance{
		Date:                date,
		CaloriesIn:          caloriesIn,
		CaloriesOutExercise: caloriesOutExercise,
		Target:              target,
		Status:              "no_target",
	}
	if bmr != nil {
		b := *bmr
		eb.CaloriesOutBMR = &b
		total := b + caloriesOutExercise
		eb.CaloriesOutTotal = &total
		net := caloriesIn - total
		eb.NetBalance = &net
	}
	if target != nil {
		v := caloriesIn - *target
		eb.Variance = &v
		switch {
		case v < -onTargetBand:
			eb.Status = "deficit"
		case v > onTargetBand:
			eb.Status = "surplus"
		default:
			eb.Status = "on_target"
		}
	}
	return eb
}

// ComputeWeekly builds the weekly view from per-day balances (oldest first).
// weekly_average_out uses each day's total when known, else exercise-only.
func ComputeWeekly(days []EnergyBalance) WeeklyEnergyBalance {
	w := WeeklyEnergyBalance{Days: days}
	if len(days) == 0 {
		return w
	}
	var sumIn, sumOut float64
	for _, d := range days {
		sumIn += d.CaloriesIn
		if d.CaloriesOutTotal != nil {
			sumOut += *d.CaloriesOutTotal
		} else {
			sumOut += d.CaloriesOutExercise
		}
	}
	n := float64(len(days))
	w.WeeklyAverageIn = math.Round(sumIn / n)
	w.WeeklyAverageOut = math.Round(sumOut / n)
	w.WeeklyNet = w.WeeklyAverageIn - w.WeeklyAverageOut
	return w
}

// ---------------------------------------------------------------------------
// Store + routes
// ---------------------------------------------------------------------------

// BodyStats are the onboarding-derived inputs to BMR (weight already in kg,
// height in cm). Returned nil by the store when the user has no onboarding row.
type BodyStats struct {
	Age      int
	Sex      string
	HeightCm float64
	WeightKg float64
}

// Store backs the energy-balance routes. Read-only over food_logs, gym_sessions,
// onboarding and goals — no writes.
type Store interface {
	// IntakeByDate sums food_logs.calories per date in [from,to].
	IntakeByDate(ctx context.Context, userID, from, to string) (map[string]float64, error)
	// ExerciseCaloriesByDate sums gym_sessions.calories_burned per date in [from,to].
	ExerciseCaloriesByDate(ctx context.Context, userID, from, to string) (map[string]float64, error)
	// BodyStats returns the user's onboarding body stats, or nil when none exist.
	BodyStats(ctx context.Context, userID string) (*BodyStats, error)
	// CalorieTarget returns goals.calorie_target, or nil when unset.
	CalorieTarget(ctx context.Context, userID string) (*float64, error)
}

// Register mounts the energy-balance routes.
func Register(mux *http.ServeMux, s Store) {
	h := handler{s}
	mux.HandleFunc("GET /api/energy-balance", h.getBalance)
	mux.HandleFunc("GET /api/energy-balance/week", h.getWeek)
}

type handler struct{ s Store }

// bmrFor returns the user's BMR pointer (nil when no body stats) and the body
// weight in kg (0 when unknown) for downstream use.
func (h handler) bmrFor(r *http.Request, userID string) (*float64, error) {
	bs, err := h.s.BodyStats(r.Context(), userID)
	if err != nil {
		return nil, err
	}
	if bs == nil || bs.WeightKg <= 0 {
		return nil, nil
	}
	b := BMR(bs.Age, bs.Sex, bs.HeightCm, bs.WeightKg)
	return &b, nil
}

func (h handler) getBalance(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	date := r.URL.Query().Get("date")
	if date == "" {
		date = config.Today()
	}
	if _, err := time.Parse(dateLayout, date); err != nil {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	bmr, err := h.bmrFor(r, userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	target, err := h.s.CalorieTarget(r.Context(), userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	intake, err := h.s.IntakeByDate(r.Context(), userID, date, date)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	burn, err := h.s.ExerciseCaloriesByDate(r.Context(), userID, date, date)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	eb := ComputeBalance(date, intake[date], burn[date], bmr, target)
	httpx.JSON(w, http.StatusOK, eb)
}

func (h handler) getWeek(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	// The client passes its LOCAL date as ?end= so the 7-day window matches the
	// calendar its food/gym logs are stamped with; default = server calendar.
	today := r.URL.Query().Get("end")
	if today == "" {
		today = config.Today()
	}
	end, err := time.Parse(dateLayout, today)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "end must be YYYY-MM-DD")
		return
	}
	start := end.AddDate(0, 0, -6)
	from, to := start.Format(dateLayout), end.Format(dateLayout)

	bmr, err := h.bmrFor(r, userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	target, err := h.s.CalorieTarget(r.Context(), userID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	intake, err := h.s.IntakeByDate(r.Context(), userID, from, to)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	burn, err := h.s.ExerciseCaloriesByDate(r.Context(), userID, from, to)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}

	days := make([]EnergyBalance, 0, 7)
	for i := 0; i < 7; i++ {
		d := start.AddDate(0, 0, i).Format(dateLayout)
		days = append(days, ComputeBalance(d, intake[d], burn[d], bmr, target))
	}
	httpx.JSON(w, http.StatusOK, ComputeWeekly(days))
}
