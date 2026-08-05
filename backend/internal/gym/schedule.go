package gym

import (
	"context"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/httpx"
)

// ErrForbidden is returned by ScheduleStore when a row exists but belongs to
// another user; the handler maps it to 403 (ErrNotFound maps to 404).
var ErrForbidden = errors.New("forbidden")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// WorkoutTemplate is a reusable named workout with ordered exercises.
type WorkoutTemplate struct {
	ID                       string             `json:"id"`
	UserID                   string             `json:"user_id"`
	Name                     string             `json:"name"`
	EstimatedDurationMinutes *int               `json:"estimated_duration_minutes"`
	CreatedAt                time.Time          `json:"created_at"`
	UpdatedAt                time.Time          `json:"updated_at"`
	Exercises                []TemplateExercise `json:"exercises"`
}

// TemplateExercise is one planned exercise inside a template, with the joined
// library detail attached.
type TemplateExercise struct {
	ID                     string           `json:"id"`
	TemplateID             string           `json:"template_id"`
	ExerciseID             string           `json:"exercise_id"`
	PlannedSets            *int             `json:"planned_sets"`
	PlannedReps            *int             `json:"planned_reps"`
	PlannedWeight          *float64         `json:"planned_weight"`
	PlannedWeightUnit      *string          `json:"planned_weight_unit"`
	PlannedDurationMinutes *int             `json:"planned_duration_minutes"`
	RestSeconds            *int             `json:"rest_seconds"`
	SortOrder              int              `json:"sort_order"`
	CreatedAt              time.Time        `json:"created_at"`
	Exercise               *LibraryExercise `json:"exercise,omitempty"`
}

// ScheduleDay is one day of the weekly plan (day 0=Sunday .. 6=Saturday).
type ScheduleDay struct {
	DayOfWeek  int              `json:"day_of_week"`
	DayName    string           `json:"day_name"`
	IsRestDay  bool             `json:"is_rest_day"`
	TemplateID *string          `json:"template_id"`
	Template   *WorkoutTemplate `json:"template"`
}

// TodayWorkout is the resolved plan for today plus check-in state.
type TodayWorkout struct {
	DayOfWeek        int                `json:"day_of_week"`
	DayName          string             `json:"day_name"`
	IsRestDay        bool               `json:"is_rest_day"`
	Template         *WorkoutTemplate   `json:"template"`
	Exercises        []TemplateExercise `json:"exercises"`
	AlreadyCheckedIn bool               `json:"already_checked_in"`
	SessionID        *string            `json:"session_id"`
}

// AdherenceResult is the row written when a session is completed.
type AdherenceResult struct {
	ScheduledDate  string  `json:"scheduled_date"`
	TemplateID     *string `json:"template_id"`
	CheckedIn      bool    `json:"checked_in"`
	CompletionRate float64 `json:"completion_rate"`
	Customized     bool    `json:"customized"`
}

// GymPatterns is the rolled-up per-user training profile.
type GymPatterns struct {
	MostTrainedMuscles  []string           `json:"most_trained_muscles"`
	LeastTrainedMuscles []string           `json:"least_trained_muscles"`
	AvgSessionsPerWeek  float64            `json:"avg_sessions_per_week"`
	AdherenceRate       float64            `json:"adherence_rate"`
	CustomizationRate   float64            `json:"customization_rate"`
	MostMissedDay       *string            `json:"most_missed_day"`
	MuscleVolumeMap     map[string]float64 `json:"muscle_volume_map"`
	LastRebuilt         *time.Time         `json:"last_rebuilt"`
}

// ProgressEntry is one logged data point for an exercise, date ASC.
type ProgressEntry struct {
	Date   string   `json:"date"`
	Weight *float64 `json:"weight"`
	Reps   *int     `json:"reps"`
	Sets   *int     `json:"sets"`
}

// PersonalBest is the heaviest logged set for an exercise.
type PersonalBest struct {
	Weight float64 `json:"weight"`
	Reps   *int    `json:"reps"`
	Date   string  `json:"date"`
}

// ExerciseProgress is the history + derived stats for a single exercise.
type ExerciseProgress struct {
	ExerciseName string          `json:"exercise_name"`
	History      []ProgressEntry `json:"history"`
	PersonalBest *PersonalBest   `json:"personal_best"`
	Trend        string          `json:"trend"`
}

// ExerciseFilter is the query for ListLibraryExercises; empty fields are ignored.
type ExerciseFilter struct {
	Category  string
	Muscle    string
	Type      string
	Equipment string
	Q         string
}

// TemplateExerciseInput is a planned exercise supplied when creating/adding.
type TemplateExerciseInput struct {
	ExerciseID             string   `json:"exercise_id"`
	PlannedSets            *int     `json:"planned_sets"`
	PlannedReps            *int     `json:"planned_reps"`
	PlannedWeight          *float64 `json:"planned_weight"`
	PlannedWeightUnit      *string  `json:"planned_weight_unit"`
	PlannedDurationMinutes *int     `json:"planned_duration_minutes"`
	RestSeconds            *int     `json:"rest_seconds"`
	SortOrder              *int     `json:"sort_order"`
}

// ScheduleDayInput is one day in a bulk schedule PUT.
type ScheduleDayInput struct {
	DayOfWeek  int     `json:"day_of_week"`
	TemplateID *string `json:"template_id"`
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

// ScheduleStore backs the gym-schedule routes. Separate from the existing gym
// Store so both can register on the same mux without touching each other.
type ScheduleStore interface {
	ListLibraryExercises(ctx context.Context, f ExerciseFilter) ([]LibraryExercise, error)
	GetLibraryExercise(ctx context.Context, id string) (*LibraryExercise, error)

	ListTemplates(ctx context.Context, userID string) ([]WorkoutTemplate, error)
	GetTemplate(ctx context.Context, id string) (*WorkoutTemplate, error)
	// CreateTemplate validates every exercise id exists (ErrNotFound if any
	// missing) and writes the template + rows in one transaction.
	CreateTemplate(ctx context.Context, userID, name string, estDuration *int, exercises []TemplateExerciseInput) (*WorkoutTemplate, error)
	UpdateTemplate(ctx context.Context, t *WorkoutTemplate) error
	DeleteTemplate(ctx context.Context, id string) error

	AddTemplateExercise(ctx context.Context, templateID string, in TemplateExerciseInput) (*TemplateExercise, error)
	// GetTemplateExercise returns the row and the owning user id (via its template).
	GetTemplateExercise(ctx context.Context, id string) (*TemplateExercise, string, error)
	UpdateTemplateExercise(ctx context.Context, te *TemplateExercise) error
	DeleteTemplateExercise(ctx context.Context, id string) error

	GetSchedule(ctx context.Context, userID string) ([]ScheduleDay, error)
	SetScheduleDay(ctx context.Context, userID string, day int, templateID *string) error
	SetSchedule(ctx context.Context, userID string, days []ScheduleDayInput) error

	GetToday(ctx context.Context, userID, today string, dayOfWeek int) (*TodayWorkout, error)

	// CompleteSession checks ownership (ErrNotFound/ErrForbidden), writes the
	// adherence row, rebuilds gym patterns, and returns the result.
	CompleteSession(ctx context.Context, userID, sessionID string, completionRate *float64) (*AdherenceResult, error)

	GetExerciseProgress(ctx context.Context, userID, exerciseName string, limit int) (*ExerciseProgress, error)
	GetPatterns(ctx context.Context, userID string) (*GymPatterns, error)
}

// RegisterSchedule mounts the gym-schedule routes on mux. Additive: it shares
// the /api/gym namespace with Register but adds no overlapping patterns.
func RegisterSchedule(mux *http.ServeMux, s ScheduleStore) {
	h := scheduleHandler{s}
	mux.HandleFunc("GET /api/gym/exercises", h.listExercises)
	mux.HandleFunc("GET /api/gym/exercises/{id}", h.getExercise)
	mux.HandleFunc("GET /api/gym/templates", h.listTemplates)
	mux.HandleFunc("POST /api/gym/templates", h.createTemplate)
	mux.HandleFunc("GET /api/gym/templates/{id}", h.getTemplate)
	mux.HandleFunc("PATCH /api/gym/templates/{id}", h.patchTemplate)
	mux.HandleFunc("DELETE /api/gym/templates/{id}", h.deleteTemplate)
	mux.HandleFunc("POST /api/gym/templates/{id}/exercises", h.addTemplateExercise)
	mux.HandleFunc("PATCH /api/gym/template-exercises/{id}", h.patchTemplateExercise)
	mux.HandleFunc("DELETE /api/gym/template-exercises/{id}", h.deleteTemplateExercise)
	mux.HandleFunc("GET /api/gym/schedule", h.getSchedule)
	mux.HandleFunc("PUT /api/gym/schedule/{day}", h.putScheduleDay)
	mux.HandleFunc("PUT /api/gym/schedule", h.putSchedule)
	mux.HandleFunc("GET /api/gym/today", h.getToday)
	mux.HandleFunc("POST /api/gym/sessions/{id}/complete", h.completeSession)
	mux.HandleFunc("GET /api/gym/progress/{exercise_name}", h.getProgress)
	mux.HandleFunc("GET /api/gym/patterns", h.getPatterns)
}

type scheduleHandler struct{ s ScheduleStore }

// ownTemplate loads a template and enforces ownership; writes the error and
// returns nil when the caller should stop.
func (h scheduleHandler) ownTemplate(w http.ResponseWriter, r *http.Request, id string) *WorkoutTemplate {
	t, err := h.s.GetTemplate(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "template not found")
		return nil
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return nil
	}
	if t.UserID != auth.UserID(r.Context()) {
		httpx.Error(w, http.StatusForbidden, "not your template")
		return nil
	}
	return t
}

func (h scheduleHandler) listExercises(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	list, err := h.s.ListLibraryExercises(r.Context(), ExerciseFilter{
		Category:  q.Get("category"),
		Muscle:    q.Get("muscle"),
		Type:      q.Get("type"),
		Equipment: q.Get("equipment"),
		Q:         q.Get("q"),
	})
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	if list == nil {
		list = []LibraryExercise{}
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (h scheduleHandler) getExercise(w http.ResponseWriter, r *http.Request) {
	e, err := h.s.GetLibraryExercise(r.Context(), r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "exercise not found")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, e)
}

func (h scheduleHandler) listTemplates(w http.ResponseWriter, r *http.Request) {
	list, err := h.s.ListTemplates(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	if list == nil {
		list = []WorkoutTemplate{}
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (h scheduleHandler) createTemplate(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name                     string                  `json:"name"`
		EstimatedDurationMinutes *int                    `json:"estimated_duration_minutes"`
		Exercises                []TemplateExerciseInput `json:"exercises"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(in.Name) == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	t, err := h.s.CreateTemplate(r.Context(), auth.UserID(r.Context()), in.Name, in.EstimatedDurationMinutes, in.Exercises)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "exercise not found")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusCreated, t)
}

func (h scheduleHandler) getTemplate(w http.ResponseWriter, r *http.Request) {
	t := h.ownTemplate(w, r, r.PathValue("id"))
	if t == nil {
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}

func (h scheduleHandler) patchTemplate(w http.ResponseWriter, r *http.Request) {
	t := h.ownTemplate(w, r, r.PathValue("id"))
	if t == nil {
		return
	}
	var in struct {
		Name                     *string `json:"name"`
		EstimatedDurationMinutes *int    `json:"estimated_duration_minutes"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.Name != nil {
		if strings.TrimSpace(*in.Name) == "" {
			httpx.Error(w, http.StatusBadRequest, "name cannot be empty")
			return
		}
		t.Name = *in.Name
	}
	if in.EstimatedDurationMinutes != nil {
		t.EstimatedDurationMinutes = in.EstimatedDurationMinutes
	}
	if err := h.s.UpdateTemplate(r.Context(), t); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, t)
}

func (h scheduleHandler) deleteTemplate(w http.ResponseWriter, r *http.Request) {
	t := h.ownTemplate(w, r, r.PathValue("id"))
	if t == nil {
		return
	}
	if err := h.s.DeleteTemplate(r.Context(), t.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (h scheduleHandler) addTemplateExercise(w http.ResponseWriter, r *http.Request) {
	t := h.ownTemplate(w, r, r.PathValue("id"))
	if t == nil {
		return
	}
	var in TemplateExerciseInput
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.ExerciseID == "" {
		httpx.Error(w, http.StatusBadRequest, "exercise_id is required")
		return
	}
	te, err := h.s.AddTemplateExercise(r.Context(), t.ID, in)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "exercise not found")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusCreated, te)
}

// ownTemplateExercise loads a template-exercise and enforces ownership via its
// parent template.
func (h scheduleHandler) ownTemplateExercise(w http.ResponseWriter, r *http.Request, id string) *TemplateExercise {
	te, owner, err := h.s.GetTemplateExercise(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "template exercise not found")
		return nil
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return nil
	}
	if owner != auth.UserID(r.Context()) {
		httpx.Error(w, http.StatusForbidden, "not your template exercise")
		return nil
	}
	return te
}

func (h scheduleHandler) patchTemplateExercise(w http.ResponseWriter, r *http.Request) {
	te := h.ownTemplateExercise(w, r, r.PathValue("id"))
	if te == nil {
		return
	}
	var in struct {
		PlannedSets            *int     `json:"planned_sets"`
		PlannedReps            *int     `json:"planned_reps"`
		PlannedWeight          *float64 `json:"planned_weight"`
		PlannedWeightUnit      *string  `json:"planned_weight_unit"`
		PlannedDurationMinutes *int     `json:"planned_duration_minutes"`
		RestSeconds            *int     `json:"rest_seconds"`
		SortOrder              *int     `json:"sort_order"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.PlannedSets != nil {
		te.PlannedSets = in.PlannedSets
	}
	if in.PlannedReps != nil {
		te.PlannedReps = in.PlannedReps
	}
	if in.PlannedWeight != nil {
		te.PlannedWeight = in.PlannedWeight
	}
	if in.PlannedWeightUnit != nil {
		te.PlannedWeightUnit = in.PlannedWeightUnit
	}
	if in.PlannedDurationMinutes != nil {
		te.PlannedDurationMinutes = in.PlannedDurationMinutes
	}
	if in.RestSeconds != nil {
		te.RestSeconds = in.RestSeconds
	}
	if in.SortOrder != nil {
		te.SortOrder = *in.SortOrder
	}
	if err := h.s.UpdateTemplateExercise(r.Context(), te); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, te)
}

func (h scheduleHandler) deleteTemplateExercise(w http.ResponseWriter, r *http.Request) {
	te := h.ownTemplateExercise(w, r, r.PathValue("id"))
	if te == nil {
		return
	}
	if err := h.s.DeleteTemplateExercise(r.Context(), te.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (h scheduleHandler) getSchedule(w http.ResponseWriter, r *http.Request) {
	days, err := h.s.GetSchedule(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, days)
}

// validTemplateForUser confirms a template_id (if non-nil) exists and belongs
// to the user; writes the error and returns false when the caller should stop.
func (h scheduleHandler) validTemplateForUser(w http.ResponseWriter, r *http.Request, templateID *string) bool {
	if templateID == nil {
		return true
	}
	t, err := h.s.GetTemplate(r.Context(), *templateID)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "template not found")
		return false
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return false
	}
	if t.UserID != auth.UserID(r.Context()) {
		httpx.Error(w, http.StatusForbidden, "not your template")
		return false
	}
	return true
}

func (h scheduleHandler) putScheduleDay(w http.ResponseWriter, r *http.Request) {
	day, err := strconv.Atoi(r.PathValue("day"))
	if err != nil || day < 0 || day > 6 {
		httpx.Error(w, http.StatusBadRequest, "day must be 0-6")
		return
	}
	var in struct {
		TemplateID *string `json:"template_id"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if !h.validTemplateForUser(w, r, in.TemplateID) {
		return
	}
	if err := h.s.SetScheduleDay(r.Context(), auth.UserID(r.Context()), day, in.TemplateID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	// Echo the full 7-day schedule so the client re-renders in one round trip.
	days, err := h.s.GetSchedule(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, days)
}

func (h scheduleHandler) putSchedule(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Schedule []ScheduleDayInput `json:"schedule"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	for _, d := range in.Schedule {
		if d.DayOfWeek < 0 || d.DayOfWeek > 6 {
			httpx.Error(w, http.StatusBadRequest, "day_of_week must be 0-6")
			return
		}
		if !h.validTemplateForUser(w, r, d.TemplateID) {
			return
		}
	}
	if err := h.s.SetSchedule(r.Context(), auth.UserID(r.Context()), in.Schedule); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	days, err := h.s.GetSchedule(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, days)
}

func (h scheduleHandler) getToday(w http.ResponseWriter, r *http.Request) {
	today := config.Today()
	t, err := time.Parse(dateLayout, today)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "clock error")
		return
	}
	tw, err := h.s.GetToday(r.Context(), auth.UserID(r.Context()), today, int(t.Weekday()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, tw)
}

func (h scheduleHandler) completeSession(w http.ResponseWriter, r *http.Request) {
	var in struct {
		CompletionRate *float64 `json:"completion_rate"`
	}
	if r.ContentLength != 0 {
		if err := httpx.Decode(r, &in); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
	}
	res, err := h.s.CompleteSession(r.Context(), auth.UserID(r.Context()), r.PathValue("id"), in.CompletionRate)
	switch {
	case errors.Is(err, ErrNotFound):
		httpx.Error(w, http.StatusNotFound, "session not found")
		return
	case errors.Is(err, ErrForbidden):
		httpx.Error(w, http.StatusForbidden, "not your session")
		return
	case err != nil:
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, res)
}

func (h scheduleHandler) getProgress(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("exercise_name")
	limit := 30
	if q := r.URL.Query().Get("limit"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n > 0 {
			limit = n
		}
	}
	if limit > 90 {
		limit = 90
	}
	prog, err := h.s.GetExerciseProgress(r.Context(), auth.UserID(r.Context()), name, limit)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, prog)
}

func (h scheduleHandler) getPatterns(w http.ResponseWriter, r *http.Request) {
	p, err := h.s.GetPatterns(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, p) // null when no row yet
}

// ---------------------------------------------------------------------------
// Pure computation — exported so tests exercise the math without a DB.
// ---------------------------------------------------------------------------

// ExerciseFlags is the minimal per-logged-exercise info for completion math.
type ExerciseFlags struct {
	Skipped bool
	IsExtra bool
}

// ComputeCompletion returns (completionRate, customized) for a completed
// session: completed = logged exercises that are neither skipped nor extra;
// rate = completed/plannedCount (1.0 when plannedCount is 0); customized = any
// logged exercise is extra or skipped.
func ComputeCompletion(logged []ExerciseFlags, plannedCount int) (float64, bool) {
	completed, customized := 0, false
	for _, e := range logged {
		if e.IsExtra || e.Skipped {
			customized = true
		}
		if !e.Skipped && !e.IsExtra {
			completed++
		}
	}
	if plannedCount <= 0 {
		return 1.0, customized
	}
	return float64(completed) / float64(plannedCount), customized
}

// AdherenceRow is one gym_adherence row for stats math.
type AdherenceRow struct {
	ScheduledDate string // YYYY-MM-DD
	CheckedIn     bool
	Customized    bool
}

// ComputeAdherenceStats derives the rolled-up adherence numbers over a window.
// avgSessionsPerWeek = checked-in count / (windowDays/7); adherenceRate =
// checked-in / total rows; customizationRate = customized / checked-in;
// mostMissedDay = weekday name most often scheduled-but-not-checked-in (nil
// when nothing was missed).
func ComputeAdherenceStats(rows []AdherenceRow, windowDays int) (avgSessionsPerWeek, adherenceRate, customizationRate float64, mostMissedDay *string) {
	checkedIn, customized := 0, 0
	missedByDay := map[time.Weekday]int{}
	for _, r := range rows {
		if r.CheckedIn {
			checkedIn++
			if r.Customized {
				customized++
			}
			continue
		}
		if d, err := time.Parse(dateLayout, r.ScheduledDate); err == nil {
			missedByDay[d.Weekday()]++
		}
	}
	if windowDays > 0 {
		avgSessionsPerWeek = float64(checkedIn) / (float64(windowDays) / 7.0)
	}
	if n := len(rows); n > 0 {
		adherenceRate = float64(checkedIn) / float64(n)
	}
	if checkedIn > 0 {
		customizationRate = float64(customized) / float64(checkedIn)
	}
	// Pick the weekday with the most misses; ties break to the earlier weekday
	// (Sunday=0) for determinism.
	best, bestCount := time.Weekday(-1), 0
	for d := time.Sunday; d <= time.Saturday; d++ {
		if c := missedByDay[d]; c > bestCount {
			best, bestCount = d, c
		}
	}
	if bestCount > 0 {
		name := best.String()
		mostMissedDay = &name
	}
	return avgSessionsPerWeek, adherenceRate, customizationRate, mostMissedDay
}

// VolumeRow is one logged set joined to its primary muscle group.
type VolumeRow struct {
	MusclePrimary string
	Sets          *int
	Reps          *int
	Weight        *float64
}

// ComputeMuscleVolume sums sets*reps*weight per primary muscle group; a nil
// weight (bodyweight) defaults to 1.0 so reps still accrue volume.
func ComputeMuscleVolume(rows []VolumeRow) map[string]float64 {
	out := map[string]float64{}
	for _, r := range rows {
		sets, reps, weight := 0, 0, 1.0
		if r.Sets != nil {
			sets = *r.Sets
		}
		if r.Reps != nil {
			reps = *r.Reps
		}
		if r.Weight != nil {
			weight = *r.Weight
		}
		out[r.MusclePrimary] += float64(sets) * float64(reps) * weight
	}
	return out
}

// TopAndBottomMuscles returns the top 3 muscles by volume and the bottom 3
// among muscles with volume > 0. Ties break alphabetically for determinism.
func TopAndBottomMuscles(vol map[string]float64) (top, bottom []string) {
	type mv struct {
		muscle string
		vol    float64
	}
	positive := make([]mv, 0, len(vol))
	for m, v := range vol {
		if v > 0 {
			positive = append(positive, mv{m, v})
		}
	}
	byVolDesc := func(a, b mv) bool {
		if a.vol != b.vol {
			return a.vol > b.vol
		}
		return a.muscle < b.muscle
	}
	sort.Slice(positive, func(i, j int) bool { return byVolDesc(positive[i], positive[j]) })

	top = []string{}
	for i := 0; i < len(positive) && i < 3; i++ {
		top = append(top, positive[i].muscle)
	}
	bottom = []string{}
	for i := len(positive) - 1; i >= 0 && len(bottom) < 3; i-- {
		bottom = append(bottom, positive[i].muscle)
	}
	return top, bottom
}

// ComputeTrend compares the average logged weight of the first vs last three
// entries (history is date ASC): >+5% "improving", <-5% "declining", within
// that band "maintaining"; fewer than 3 points "insufficient_data".
func ComputeTrend(history []ProgressEntry) string {
	if len(history) < 3 {
		return "insufficient_data"
	}
	avg := func(entries []ProgressEntry) float64 {
		sum := 0.0
		for _, e := range entries {
			if e.Weight != nil {
				sum += *e.Weight
			}
		}
		return sum / float64(len(entries))
	}
	first := avg(history[:3])
	last := avg(history[len(history)-3:])
	if first <= 0 {
		return "maintaining"
	}
	change := (last - first) / first
	switch {
	case change > 0.05:
		return "improving"
	case change < -0.05:
		return "declining"
	default:
		return "maintaining"
	}
}
