// Package aiquota caps paid AI calls per user per UTC day (LUME_AI_DAILY_LIMIT).
//
// Every route that calls Gemini or Claude checks before the upstream call and
// records only after a successful one, so a failed call never uses the
// allowance. The day is the UTC calendar day, not the X-Timezone header, so a
// client cannot reset its count by changing zone.
package aiquota

import (
	"context"
	"errors"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/auth"
	"lume/backend/internal/db"
	"lume/backend/internal/httpx"
)

// Code is the machine-readable reason in the 429 body.
const Code = "ai_daily_limit_reached"

// ErrLimit means the user has used today's allowance.
var ErrLimit = errors.New("ai daily limit reached")

// Store counts calls per (user, UTC day as YYYY-MM-DD).
type Store interface {
	Used(ctx context.Context, userID, day string) (int, error)
	Add(ctx context.Context, userID, day string) error
}

// Quota is safe for concurrent use. Limit 0 turns the cap off.
// ponytail: the check is not atomic with the upstream call, so parallel
// requests can overshoot by a few; the per-minute AI rate limit bounds that.
// Reserve-then-refund in one statement if the overshoot ever matters.
type Quota struct {
	Limit int
	Store Store
	Now   func() time.Time // injectable clock for tests
}

// New builds a Quota. A nil store counts in memory, per process (tests and
// single-instance dev), the same fallback internal/ratelimit uses.
func New(limit int, store Store) *Quota {
	if store == nil {
		store = &memStore{counts: map[string]int{}}
	}
	return &Quota{Limit: limit, Store: store, Now: time.Now}
}

func (q *Quota) day() string { return q.Now().UTC().Format("2006-01-02") }

// Check returns ErrLimit once userID has used today's allowance, or the
// store's error, which callers treat as a refusal (fail closed).
func (q *Quota) Check(ctx context.Context, userID string) error {
	if q.Limit == 0 {
		return nil
	}
	n, err := q.Store.Used(ctx, userID, q.day())
	if err != nil {
		return err
	}
	if n >= q.Limit {
		return ErrLimit
	}
	return nil
}

// Record counts one successful upstream call. A store failure is logged, not
// returned: the call is already paid for and its answer should still reach
// the user.
func (q *Quota) Record(ctx context.Context, userID string) {
	if q.Limit == 0 {
		return
	}
	if err := q.Store.Add(ctx, userID, q.day()); err != nil {
		log.Printf("aiquota: could not record a call: %v", err)
	}
}

// Allow checks the caller's allowance for a handler. When it returns false
// the response is already written: 429 at the limit, 503 when the count
// cannot be read.
func (q *Quota) Allow(w http.ResponseWriter, r *http.Request) bool {
	err := q.Check(r.Context(), auth.UserID(r.Context()))
	switch {
	case err == nil:
		return true
	case errors.Is(err, ErrLimit):
		Refuse(w)
	default:
		httpx.Error(w, http.StatusServiceUnavailable, "could not check your AI allowance, try again shortly")
	}
	return false
}

// Refuse writes the 429 the app shows when today's allowance is used up.
func Refuse(w http.ResponseWriter) {
	httpx.JSONError(w, http.StatusTooManyRequests, struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	}{"You've used today's AI allowance. It resets at midnight UTC.", Code})
}

type memStore struct {
	mu     sync.Mutex
	counts map[string]int
}

func (s *memStore) Used(_ context.Context, userID, day string) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.counts[userID+"|"+day], nil
}

func (s *memStore) Add(_ context.Context, userID, day string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.counts[userID+"|"+day]++
	return nil
}

// PGStore keeps the counts in ai_daily_usage so every instance shares one
// budget.
// ponytail: old days are never deleted (one small row per user per day);
// add a retention DELETE if the table ever matters.
type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

func (s *PGStore) Used(ctx context.Context, userID, day string) (int, error) {
	var n int
	err := s.q.QueryRow(ctx,
		`SELECT count FROM ai_daily_usage WHERE user_id = $1 AND day = $2::date`, userID, day).Scan(&n)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return n, err
}

func (s *PGStore) Add(ctx context.Context, userID, day string) error {
	_, err := s.q.Exec(ctx,
		`INSERT INTO ai_daily_usage (user_id, day, count) VALUES ($1, $2::date, 1)
		 ON CONFLICT (user_id, day) DO UPDATE SET count = ai_daily_usage.count + 1`, userID, day)
	return err
}
