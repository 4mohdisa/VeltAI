// Package gym implements gym sessions, exercises and the workout streak.
package gym

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/energy"
	"lume/backend/internal/httpx"
)

const dateLayout = "2006-01-02"

// ErrNotFound is returned by Stores when a row does not exist.
var ErrNotFound = errors.New("not found")

type Session struct {
	ID              string     `json:"id"`
	UserID          string     `json:"user_id"`
	Date            string     `json:"date"`
	Name            *string    `json:"name"`
	Notes           *string    `json:"notes"`
	DurationMinutes *int       `json:"duration_minutes"`
	CreatedAt       time.Time  `json:"created_at"`
	Exercises       []Exercise `json:"exercises"`
	// IdempotencyKey is set from the Idempotency-Key header (offline-queue replay);
	// a partial unique index makes a replay return the existing session.
	IdempotencyKey string `json:"-"`
}

type Exercise struct {
	ID          string    `json:"id"`
	SessionID   string    `json:"session_id"`
	Name        string    `json:"name"`
	Sets        *int      `json:"sets"`
	Reps        *int      `json:"reps"`
	Weight      *float64  `json:"weight"`
	WeightUnit  *string   `json:"weight_unit"`
	RestSeconds *int      `json:"rest_seconds"`
	Notes       *string   `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	// Phase 12 parameter capture. RPE is progression-only; the rest are set by the
	// calorie engine when `parameters` are submitted (nil for old-style logs).
	RPE               *int                  `json:"rpe,omitempty"`
	Parameters        json.RawMessage       `json:"parameters,omitempty"`
	CalorieFormula    *string               `json:"calorie_formula,omitempty"`
	ComputedMET       *float64              `json:"computed_met,omitempty"`
	ExerciseLibraryID *string               `json:"exercise_library_id,omitempty"`
	ExerciseType      *string               `json:"exercise_type,omitempty"`
	DurationMinutes   *int                  `json:"duration_minutes,omitempty"`
	CalorieResult     *energy.CalorieResult `json:"calorie_result,omitempty"` // computed, returned on write — not a column
}

type Streak struct {
	CurrentStreak int     `json:"current_streak"`
	LongestStreak int     `json:"longest_streak"`
	LastGymDate   *string `json:"last_gym_date"`
	FreezeUsed    bool    `json:"freeze_used"`
	// LastFreezeDate is the day the active freeze covers; nil when no freeze
	// is in effect. Training on that day refunds the freeze.
	LastFreezeDate *string `json:"last_freeze_date"`
}

type Store interface {
	ListSessions(ctx context.Context, userID, from, to string) ([]Session, error)
	CreateSession(ctx context.Context, s *Session) error
	GetSession(ctx context.Context, id string) (*Session, error)
	UpdateSession(ctx context.Context, s *Session) error
	DeleteSession(ctx context.Context, id string) error
	CreateExercise(ctx context.Context, e *Exercise) error
	// GetExercise also returns the owning user's ID (via the parent session).
	GetExercise(ctx context.Context, id string) (*Exercise, string, error)
	UpdateExercise(ctx context.Context, e *Exercise) error
	DeleteExercise(ctx context.Context, id string) error
	// GetStreak returns a zero-value Streak when the user has no row yet.
	GetStreak(ctx context.Context, userID string) (Streak, error)
	SaveStreak(ctx context.Context, userID string, st Streak) error
}

// Register mounts the gym routes with no calorie engine (parameter logging is a
// no-op; the existing MET path runs). Kept for callers/tests that don't need it.
func Register(mux *http.ServeMux, s Store) { RegisterWithEngine(mux, s, nil) }

// RegisterWithEngine mounts the gym routes plus, when engine != nil, the
// parameter preview + last-logged routes and the calorie computation on
// create/patch exercise.
func RegisterWithEngine(mux *http.ServeMux, s Store, engine CalorieEngine) {
	h := handler{store: s, engine: engine}
	mux.HandleFunc("GET /api/gym/sessions", h.listSessions)
	mux.HandleFunc("POST /api/gym/sessions", h.createSession)
	mux.HandleFunc("PATCH /api/gym/sessions/{id}", h.patchSession)
	mux.HandleFunc("DELETE /api/gym/sessions/{id}", h.deleteSession)
	mux.HandleFunc("POST /api/gym/sessions/{id}/exercises", h.createExercise)
	mux.HandleFunc("PATCH /api/gym/exercises/{id}", h.patchExercise)
	mux.HandleFunc("DELETE /api/gym/exercises/{id}", h.deleteExercise)
	mux.HandleFunc("GET /api/gym/streak", h.getStreak)
	mux.HandleFunc("POST /api/gym/streak/freeze", h.freeze)
	if engine != nil {
		mux.HandleFunc("POST /api/gym/calories/preview", h.previewCalories)
		mux.HandleFunc("GET /api/gym/last-logged/{exercise_id}", h.lastLogged)
	}
}

type handler struct {
	store  Store
	engine CalorieEngine
}

// applyParameters validates + scores submitted parameters against the exercise's
// schema and copies the engine's outputs onto e. Writes the HTTP error and
// returns false when the caller should stop (400 for bad input, 500 otherwise).
func (h handler) applyParameters(w http.ResponseWriter, r *http.Request, e *Exercise, rawParams json.RawMessage) bool {
	if h.engine == nil || len(rawParams) == 0 {
		return true // no engine or no params → existing MET path, nothing to do
	}
	var params map[string]any
	if err := json.Unmarshal(rawParams, &params); err != nil {
		httpx.Error(w, http.StatusBadRequest, "parameters must be a JSON object")
		return false
	}
	lc, err := h.engine.ComputeForExerciseName(r.Context(), auth.UserID(r.Context()), e.Name, params)
	var perr *ParamError
	if errors.As(err, &perr) {
		httpx.Error(w, http.StatusBadRequest, perr.Msg)
		return false
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "calorie engine error")
		return false
	}
	res := lc.Result
	e.Parameters = lc.ParametersJSON
	e.CalorieFormula = &lc.Formula
	e.ComputedMET = &lc.ComputedMET
	e.DurationMinutes = lc.DurationMin
	e.ExerciseLibraryID = lc.LibraryID
	if lc.ExerciseType != "" {
		et := lc.ExerciseType
		e.ExerciseType = &et
	}
	e.CalorieResult = &res
	return true
}

// ownSession loads a session and enforces ownership; writes the error
// response and returns nil when the caller should stop.
func (h handler) ownSession(w http.ResponseWriter, r *http.Request, id string) *Session {
	s, err := h.store.GetSession(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "session not found")
		return nil
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return nil
	}
	if s.UserID != auth.UserID(r.Context()) {
		httpx.Error(w, http.StatusForbidden, "not your session")
		return nil
	}
	return s
}

func (h handler) ownExercise(w http.ResponseWriter, r *http.Request, id string) *Exercise {
	e, owner, err := h.store.GetExercise(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "exercise not found")
		return nil
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return nil
	}
	if owner != auth.UserID(r.Context()) {
		httpx.Error(w, http.StatusForbidden, "not your exercise")
		return nil
	}
	return e
}

func (h handler) listSessions(w http.ResponseWriter, r *http.Request) {
	from, to := r.URL.Query().Get("from"), r.URL.Query().Get("to")
	for _, d := range []string{from, to} {
		if d == "" {
			continue
		}
		if _, err := time.Parse(dateLayout, d); err != nil {
			httpx.Error(w, http.StatusBadRequest, "from/to must be YYYY-MM-DD")
			return
		}
	}
	list, err := h.store.ListSessions(r.Context(), auth.UserID(r.Context()), from, to)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	if list == nil {
		list = []Session{}
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (h handler) createSession(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Date            string  `json:"date"`
		Name            *string `json:"name"`
		Notes           *string `json:"notes"`
		DurationMinutes *int    `json:"duration_minutes"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.Date == "" {
		httpx.Error(w, http.StatusBadRequest, "date is required")
		return
	}
	day, err := time.Parse(dateLayout, in.Date)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	if in.Date > config.Today() { // lexicographic compare is correct for YYYY-MM-DD
		httpx.Error(w, http.StatusBadRequest, "date cannot be in the future")
		return
	}
	s := Session{
		UserID:          auth.UserID(r.Context()),
		Date:            in.Date,
		Name:            in.Name,
		Notes:           in.Notes,
		DurationMinutes: in.DurationMinutes,
		Exercises:       []Exercise{},
		IdempotencyKey:  r.Header.Get("Idempotency-Key"),
	}
	if err := h.store.CreateSession(r.Context(), &s); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	if err := h.bumpStreak(r.Context(), s.UserID, day); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusCreated, s)
}

// bumpStreak applies the streak semantics for a session logged on day d.
func (h handler) bumpStreak(ctx context.Context, userID string, d time.Time) error {
	st, err := h.store.GetStreak(ctx, userID)
	if err != nil {
		return err
	}
	day := d.Format(dateLayout)
	if st.LastGymDate == nil {
		st.CurrentStreak = 1
	} else {
		last, err := time.Parse(dateLayout, *st.LastGymDate)
		if err != nil {
			return err
		}
		switch days := int(d.Sub(last).Hours() / 24); {
		case days == 0 && st.LastFreezeDate != nil && *st.LastFreezeDate == day:
			// Trained on the day a freeze was covering: count the workout
			// and refund the freeze.
			st.CurrentStreak++
			st.FreezeUsed = false
			st.LastFreezeDate = nil
		case days == 1:
			st.CurrentStreak++
		case days >= 2:
			st.CurrentStreak = 1
			st.FreezeUsed = false
			st.LastFreezeDate = nil
		}
		// days < 0 (backdated) or plain same-day: streak unchanged.
	}
	if st.LastGymDate == nil || day > *st.LastGymDate {
		st.LastGymDate = &day
	}
	if st.CurrentStreak > st.LongestStreak {
		st.LongestStreak = st.CurrentStreak
	}
	return h.store.SaveStreak(ctx, userID, st)
}

func (h handler) patchSession(w http.ResponseWriter, r *http.Request) {
	s := h.ownSession(w, r, r.PathValue("id"))
	if s == nil {
		return
	}
	var in struct {
		Date            *string `json:"date"`
		Name            *string `json:"name"`
		Notes           *string `json:"notes"`
		DurationMinutes *int    `json:"duration_minutes"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.Date != nil {
		if _, err := time.Parse(dateLayout, *in.Date); err != nil {
			httpx.Error(w, http.StatusBadRequest, "date must be YYYY-MM-DD")
			return
		}
		s.Date = *in.Date
	}
	if in.Name != nil {
		s.Name = in.Name
	}
	if in.Notes != nil {
		s.Notes = in.Notes
	}
	if in.DurationMinutes != nil {
		s.DurationMinutes = in.DurationMinutes
	}
	if err := h.store.UpdateSession(r.Context(), s); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, s)
}

func (h handler) deleteSession(w http.ResponseWriter, r *http.Request) {
	s := h.ownSession(w, r, r.PathValue("id"))
	if s == nil {
		return
	}
	if err := h.store.DeleteSession(r.Context(), s.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (h handler) createExercise(w http.ResponseWriter, r *http.Request) {
	s := h.ownSession(w, r, r.PathValue("id"))
	if s == nil {
		return
	}
	var in struct {
		Name        string          `json:"name"`
		Sets        *int            `json:"sets"`
		Reps        *int            `json:"reps"`
		Weight      *float64        `json:"weight"`
		WeightUnit  *string         `json:"weight_unit"`
		RestSeconds *int            `json:"rest_seconds"`
		Notes       *string         `json:"notes"`
		Parameters  json.RawMessage `json:"parameters"`
		RPE         *int            `json:"rpe"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if !validRPE(w, in.RPE) {
		return
	}
	e := Exercise{
		SessionID:   s.ID,
		Name:        in.Name,
		Sets:        in.Sets,
		Reps:        in.Reps,
		Weight:      in.Weight,
		WeightUnit:  in.WeightUnit,
		RestSeconds: in.RestSeconds,
		Notes:       in.Notes,
		RPE:         in.RPE,
	}
	if !h.applyParameters(w, r, &e, in.Parameters) {
		return
	}
	if err := h.store.CreateExercise(r.Context(), &e); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusCreated, e)
}

// validRPE enforces the 1-10 range (mirrors the DB CHECK); writes 400 and
// returns false when invalid.
func validRPE(w http.ResponseWriter, rpe *int) bool {
	if rpe != nil && (*rpe < 1 || *rpe > 10) {
		httpx.Error(w, http.StatusBadRequest, "rpe must be between 1 and 10")
		return false
	}
	return true
}

func (h handler) patchExercise(w http.ResponseWriter, r *http.Request) {
	e := h.ownExercise(w, r, r.PathValue("id"))
	if e == nil {
		return
	}
	var in struct {
		Name        *string         `json:"name"`
		Sets        *int            `json:"sets"`
		Reps        *int            `json:"reps"`
		Weight      *float64        `json:"weight"`
		WeightUnit  *string         `json:"weight_unit"`
		RestSeconds *int            `json:"rest_seconds"`
		Notes       *string         `json:"notes"`
		Parameters  json.RawMessage `json:"parameters"`
		RPE         *int            `json:"rpe"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.Name != nil {
		if *in.Name == "" {
			httpx.Error(w, http.StatusBadRequest, "name cannot be empty")
			return
		}
		e.Name = *in.Name
	}
	if in.Sets != nil {
		e.Sets = in.Sets
	}
	if in.Reps != nil {
		e.Reps = in.Reps
	}
	if in.Weight != nil {
		e.Weight = in.Weight
	}
	if in.WeightUnit != nil {
		e.WeightUnit = in.WeightUnit
	}
	if in.RestSeconds != nil {
		e.RestSeconds = in.RestSeconds
	}
	if in.Notes != nil {
		e.Notes = in.Notes
	}
	if in.RPE != nil {
		if !validRPE(w, in.RPE) {
			return
		}
		e.RPE = in.RPE
	}
	// Re-score if new parameters were submitted (recomputes formula/MET/calories).
	if !h.applyParameters(w, r, e, in.Parameters) {
		return
	}
	if err := h.store.UpdateExercise(r.Context(), e); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, e)
}

// ---------------------------------------------------------------------------
// Parameter preview + last-logged (registered only when an engine is present)
// ---------------------------------------------------------------------------

func (h handler) previewCalories(w http.ResponseWriter, r *http.Request) {
	var in struct {
		ExerciseID string         `json:"exercise_id"`
		Parameters map[string]any `json:"parameters"`
	}
	if err := httpx.Decode(r, &in); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if in.ExerciseID == "" {
		httpx.Error(w, http.StatusBadRequest, "exercise_id is required")
		return
	}
	res, err := h.engine.PreviewByID(r.Context(), auth.UserID(r.Context()), in.ExerciseID, in.Parameters)
	var perr *ParamError
	if errors.As(err, &perr) {
		httpx.Error(w, http.StatusBadRequest, perr.Msg)
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "calorie engine error")
		return
	}
	httpx.JSON(w, http.StatusOK, res)
}

func (h handler) lastLogged(w http.ResponseWriter, r *http.Request) {
	raw, err := h.engine.LastLogged(r.Context(), auth.UserID(r.Context()), r.PathValue("exercise_id"))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	// raw is nil (marshals to null) when the user hasn't logged this exercise.
	httpx.JSON(w, http.StatusOK, map[string]json.RawMessage{"parameters": raw})
}

func (h handler) deleteExercise(w http.ResponseWriter, r *http.Request) {
	e := h.ownExercise(w, r, r.PathValue("id"))
	if e == nil {
		return
	}
	if err := h.store.DeleteExercise(r.Context(), e.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (h handler) getStreak(w http.ResponseWriter, r *http.Request) {
	st, err := h.store.GetStreak(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, st)
}

func (h handler) freeze(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	st, err := h.store.GetStreak(r.Context(), uid)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	if st.FreezeUsed {
		httpx.Error(w, http.StatusBadRequest, "freeze already used")
		return
	}
	if st.LastGymDate == nil {
		httpx.Error(w, http.StatusBadRequest, "no streak to protect")
		return
	}
	// A freeze only bridges today, the day after the last workout. Lexicographic
	// compares are correct for YYYY-MM-DD; last_gym_date can never move backwards.
	today := config.Today()
	yesterday := time.Now().In(config.Timezone()).AddDate(0, 0, -1).Format(dateLayout)
	if *st.LastGymDate >= today {
		httpx.Error(w, http.StatusBadRequest, "already covered today")
		return
	}
	if *st.LastGymDate < yesterday {
		httpx.Error(w, http.StatusBadRequest, "streak already broken")
		return
	}
	st.LastGymDate = &today
	st.FreezeUsed = true
	st.LastFreezeDate = &today
	if err := h.store.SaveStreak(r.Context(), uid, st); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, st)
}
