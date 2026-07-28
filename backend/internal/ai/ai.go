package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/cuisine"
	"lumo/backend/internal/httpx"
)

// StoredInsight is an ai_insights row as returned by the API.
type StoredInsight struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

// Store supplies the raw rows the computations need and persists results.
type Store interface {
	FoodLogs(ctx context.Context, userID string) ([]FoodLogRow, error)       // last 30 days
	GymSessions(ctx context.Context, userID string) ([]GymSessionRow, error) // last 4 weeks
	Goals(ctx context.Context, userID string) (*GoalRow, error)              // nil when unset
	Streak(ctx context.Context, userID string) (*StreakRow, error)           // nil when unset
	Weights(ctx context.Context, userID string) ([]WeightRow, error)         // last 30 days

	UpsertBrain(ctx context.Context, userID string, b Brain) error
	GetBrain(ctx context.Context, userID string) (*Brain, error)              // nil when never built
	InsertInsights(ctx context.Context, userID string, ins []Insight) error   // replaces non-dismissed insights
	NewestInsightAt(ctx context.Context, userID string) (*time.Time, error)   // any dismissed state; nil when none
	ListInsights(ctx context.Context, userID string) ([]StoredInsight, error) // non-dismissed, newest first
	GetInsightOwner(ctx context.Context, id string) (string, error)           // "" when not found
	DismissInsight(ctx context.Context, id string) error

	CuisinePreferences(ctx context.Context, userID string) ([]string, error)         // empty slice when unset
	ScanCorrections(ctx context.Context, userID string) ([]ScanCorrectionRow, error) // last 90 days
	UsersNeedingRebuild(ctx context.Context) ([]string, error)                       // flagged and due, for the sweep
}

type Service struct {
	Store Store
	LLM   LLM
	Now   func() time.Time // injectable clock for tests

	briefs briefCache
}

type briefEntry struct{ day, brief string }

// briefCache memoizes the morning brief per (user, calendar day) so a loop
// over the plain GET /api/ai/morning-brief cannot bill the LLM once per
// request. Zero value is ready to use.
// ponytail: in-process and per-instance, one entry per user, no eviction —
// move it to a briefs table if the API ever runs multi-instance or the user
// count makes the map worth bounding.
type briefCache struct {
	mu      sync.Mutex
	entries map[string]briefEntry
}

func (c *briefCache) get(uid, day string) (string, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.entries[uid]
	if !ok || e.day != day {
		return "", false
	}
	return e.brief, true
}

func (c *briefCache) put(uid, day, brief string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.entries == nil {
		c.entries = map[string]briefEntry{}
	}
	c.entries[uid] = briefEntry{day: day, brief: brief}
}

func NewService(store Store, llm LLM) *Service {
	return &Service{Store: store, LLM: llm, Now: time.Now}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/ai/brain", s.getBrain)
	mux.HandleFunc("POST /api/ai/brain/rebuild", s.rebuild)
	mux.HandleFunc("GET /api/ai/insights", s.listInsights)
	mux.HandleFunc("POST /api/ai/insights/{id}/dismiss", s.dismiss)
	mux.HandleFunc("GET /api/ai/morning-brief", s.morningBrief)
	mux.HandleFunc("POST /api/ai/query", s.query)
}

var notEnoughData = map[string]string{"state": "not_enough_data"}

type sourceData struct {
	logs     []FoodLogRow
	sessions []GymSessionRow
	goal     *GoalRow
	streak   *StreakRow
	weights  []WeightRow
}

func (s *Service) fetch(ctx context.Context, uid string) (sourceData, error) {
	var d sourceData
	var err error
	if d.logs, err = s.Store.FoodLogs(ctx, uid); err != nil {
		return d, err
	}
	if d.sessions, err = s.Store.GymSessions(ctx, uid); err != nil {
		return d, err
	}
	if d.goal, err = s.Store.Goals(ctx, uid); err != nil {
		return d, err
	}
	if d.streak, err = s.Store.Streak(ctx, uid); err != nil {
		return d, err
	}
	if d.weights, err = s.Store.Weights(ctx, uid); err != nil {
		return d, err
	}
	return d, nil
}

func (s *Service) getBrain(w http.ResponseWriter, r *http.Request) {
	b, err := s.Store.GetBrain(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load brain")
		return
	}
	if b == nil {
		httpx.JSON(w, http.StatusOK, notEnoughData)
		return
	}
	httpx.JSON(w, http.StatusOK, b)
}

func (s *Service) rebuild(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	brain, err := s.rebuildUser(ctx, auth.UserID(ctx))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to rebuild brain")
		return
	}
	if brain == nil {
		httpx.JSON(w, http.StatusOK, notEnoughData)
		return
	}
	httpx.JSON(w, http.StatusOK, brain)
}

// rebuildUser recomputes and persists uid's brain: (nil, nil) when there's
// not enough logged data yet, (brain, nil) on success. Shared by the HTTP
// handler and the background rebuild sweep.
func (s *Service) rebuildUser(ctx context.Context, uid string) (*Brain, error) {
	d, err := s.fetch(ctx, uid)
	if err != nil {
		return nil, err
	}
	if DistinctDays(d.logs) < 3 {
		return nil, nil
	}
	brain := BuildBrain(d.logs, d.sessions, d.goal, d.streak, d.weights)

	cuisines, err := s.Store.CuisinePreferences(ctx, uid)
	if err != nil {
		return nil, err
	}
	priors := cuisine.MergePriors(cuisines)
	blended := applyBayesianPrior(brain, priors, d.goal, DistinctDays(d.logs))

	corrections, err := s.Store.ScanCorrections(ctx, uid)
	if err != nil {
		return nil, err
	}
	blended.ScanAccuracyProfile = BuildScanAccuracyProfile(corrections)

	now := s.Now()
	blended.LastRebuilt = now

	newest, err := s.Store.NewestInsightAt(ctx, uid)
	if err != nil {
		return nil, err
	}
	if err := s.Store.UpsertBrain(ctx, uid, blended); err != nil {
		return nil, err
	}
	// Insights are cached: patterns recompute every rebuild, insights only
	// regenerate when the newest stored insight is 6h+ old. The gate keys on
	// insight age, not rebuild age — frequent rebuilds must not starve it.
	if newest == nil || now.Sub(*newest) >= 6*time.Hour {
		if err := s.Store.InsertInsights(ctx, uid, s.generateInsights(ctx, blended)); err != nil {
			return nil, err
		}
	}
	return &blended, nil
}

// RunRebuildSweep rebuilds every user flagged needs_rebuild and due (called
// from a background ticker, not HTTP). One user's failure doesn't stop the
// rest; all failures are joined into the returned error.
func (s *Service) RunRebuildSweep(ctx context.Context) error {
	uids, err := s.Store.UsersNeedingRebuild(ctx)
	if err != nil {
		return err
	}
	var errs []error
	for _, uid := range uids {
		if _, err := s.rebuildUser(ctx, uid); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func (s *Service) generateInsights(ctx context.Context, b Brain) []Insight {
	summary, _ := json.Marshal(b)
	raw, err := s.LLM.Complete(ctx, insightsSystem, dataBlock("user_data", "User data summary:\n"+string(summary)))
	if err == nil {
		if ins, perr := ParseInsights(raw); perr == nil {
			return ins
		}
	}
	return FallbackInsights(b)
}

func (s *Service) listInsights(w http.ResponseWriter, r *http.Request) {
	ins, err := s.Store.ListInsights(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load insights")
		return
	}
	if ins == nil {
		ins = []StoredInsight{}
	}
	httpx.JSON(w, http.StatusOK, ins)
}

func (s *Service) dismiss(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	owner, err := s.Store.GetInsightOwner(ctx, id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load insight")
		return
	}
	if owner == "" {
		httpx.Error(w, http.StatusNotFound, "insight not found")
		return
	}
	if owner != auth.UserID(ctx) {
		httpx.Error(w, http.StatusForbidden, "not your insight")
		return
	}
	if err := s.Store.DismissInsight(ctx, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to dismiss insight")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"dismissed": true})
}

func (s *Service) morningBrief(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := auth.UserID(ctx)
	// "Today"/"yesterday" are calendar days in the configured timezone
	// (LUMO_TIMEZONE), not the server's zone, so the brief matches the dates
	// users log against. Same day key as config.Today(), but off the
	// injectable clock so tests can cross the boundary.
	now := s.Now().In(config.Timezone())
	day := now.Format("2006-01-02")
	// One LLM call per user per day: the brief is a plain GET, so without
	// this a loop over it bills unboundedly.
	if brief, ok := s.briefs.get(uid, day); ok {
		httpx.JSON(w, http.StatusOK, map[string]string{"brief": brief})
		return
	}
	d, err := s.fetch(ctx, uid)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load data")
		return
	}
	if DistinctDays(d.logs) < 3 {
		httpx.JSON(w, http.StatusOK, notEnoughData)
		return
	}
	cal, protein, logged := totalsOn(d.logs, now.AddDate(0, 0, -1))
	brief := fallbackBrief(cal, protein, logged, d.goal, d.streak)
	facts := briefFacts(cal, protein, logged, d.goal, d.streak)
	if raw, lerr := s.LLM.Complete(ctx, briefSystem, dataBlock("user_data", facts)); lerr == nil {
		if t := strings.TrimSpace(raw); t != "" {
			brief = capSentence(t, 499)
		}
		// Cache only once a call actually billed, so a transient LLM outage
		// serves the fallback and retries rather than sticking all day.
		s.briefs.put(uid, day, brief)
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"brief": brief})
}

func (s *Service) query(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := auth.UserID(ctx)
	var req struct {
		Question string `json:"question"`
	}
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	q := strings.TrimSpace(req.Question)
	if q == "" {
		httpx.Error(w, http.StatusBadRequest, "question is required")
		return
	}
	// The question is concatenated into a paid LLM prompt, so it needs its own
	// cap — the shared 20MB body limit is nowhere near a sane prompt budget.
	// Counted in runes so a non-ASCII question gets the same allowance.
	max := config.EnvInt("LUMO_MAX_QUESTION_CHARS", 500)
	if n := utf8.RuneCountInString(q); n > max {
		httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("question is too long: %d characters, limit is %d", n, max))
		return
	}
	d, err := s.fetch(ctx, uid)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to load data")
		return
	}
	if DistinctDays(d.logs) < 3 {
		httpx.JSON(w, http.StatusOK, notEnoughData)
		return
	}
	brain := BuildBrain(d.logs, d.sessions, d.goal, d.streak, d.weights)
	summary, _ := json.Marshal(map[string]any{
		"patterns": brain,
		"goals":    d.goal,
		"streak":   d.streak,
	})
	prompt := dataBlock("user_data", "Data summary:\n"+string(summary)) + "\n\n" + dataBlock("user_question", q)
	answer, err := s.LLM.Complete(ctx, querySystem, prompt)
	if err != nil {
		httpx.Error(w, http.StatusServiceUnavailable, "AI is unavailable right now")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"answer": answer})
}
