package gymtests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"
	"testing"
	"time"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/gym"
)

// day returns today+offset as YYYY-MM-DD in the server's configured timezone,
// matching how the handlers compute "today"/"yesterday".
func day(offset int) string {
	return time.Now().In(config.Timezone()).AddDate(0, 0, offset).Format("2006-01-02")
}

type fakeStore struct {
	nextID    int
	sessions  map[string]*gym.Session
	exercises map[string]*gym.Exercise
	streaks   map[string]gym.Streak
}

func newFake() *fakeStore {
	return &fakeStore{
		sessions:  map[string]*gym.Session{},
		exercises: map[string]*gym.Exercise{},
		streaks:   map[string]gym.Streak{},
	}
}

func (f *fakeStore) id() string { f.nextID++; return fmt.Sprintf("id_%d", f.nextID) }

func (f *fakeStore) withExercises(s gym.Session) gym.Session {
	s.Exercises = []gym.Exercise{}
	for _, e := range f.exercises {
		if e.SessionID == s.ID {
			s.Exercises = append(s.Exercises, *e)
		}
	}
	// Mirror the PG store's ORDER BY created_at, id.
	sort.Slice(s.Exercises, func(i, j int) bool {
		a, b := s.Exercises[i], s.Exercises[j]
		if !a.CreatedAt.Equal(b.CreatedAt) {
			return a.CreatedAt.Before(b.CreatedAt)
		}
		return a.ID < b.ID
	})
	return s
}

func (f *fakeStore) ListSessions(_ context.Context, userID, from, to string) ([]gym.Session, error) {
	out := []gym.Session{}
	for _, s := range f.sessions {
		if s.UserID != userID {
			continue
		}
		if from != "" && s.Date < from {
			continue
		}
		if to != "" && s.Date > to {
			continue
		}
		out = append(out, f.withExercises(*s))
	}
	return out, nil
}

func (f *fakeStore) CreateSession(_ context.Context, s *gym.Session) error {
	s.ID = f.id()
	s.CreatedAt = time.Now()
	cp := *s
	f.sessions[s.ID] = &cp
	return nil
}

func (f *fakeStore) GetSession(_ context.Context, id string) (*gym.Session, error) {
	s, ok := f.sessions[id]
	if !ok {
		return nil, gym.ErrNotFound
	}
	cp := f.withExercises(*s)
	return &cp, nil
}

func (f *fakeStore) UpdateSession(_ context.Context, s *gym.Session) error {
	cp := *s
	f.sessions[s.ID] = &cp
	return nil
}

func (f *fakeStore) DeleteSession(_ context.Context, id string) error {
	delete(f.sessions, id)
	for eid, e := range f.exercises {
		if e.SessionID == id {
			delete(f.exercises, eid)
		}
	}
	return nil
}

func (f *fakeStore) CreateExercise(_ context.Context, e *gym.Exercise) error {
	e.ID = f.id()
	e.CreatedAt = time.Unix(int64(f.nextID), 0) // deterministic insertion order
	cp := *e
	f.exercises[e.ID] = &cp
	return nil
}

func (f *fakeStore) GetExercise(_ context.Context, id string) (*gym.Exercise, string, error) {
	e, ok := f.exercises[id]
	if !ok {
		return nil, "", gym.ErrNotFound
	}
	owner := ""
	if s, ok := f.sessions[e.SessionID]; ok {
		owner = s.UserID
	}
	cp := *e
	return &cp, owner, nil
}

func (f *fakeStore) UpdateExercise(_ context.Context, e *gym.Exercise) error {
	cp := *e
	f.exercises[e.ID] = &cp
	return nil
}

func (f *fakeStore) DeleteExercise(_ context.Context, id string) error {
	delete(f.exercises, id)
	return nil
}

func (f *fakeStore) GetStreak(_ context.Context, userID string) (gym.Streak, error) {
	return f.streaks[userID], nil
}

func (f *fakeStore) SaveStreak(_ context.Context, userID string, st gym.Streak) error {
	f.streaks[userID] = st
	return nil
}

func serve(f *fakeStore) *http.ServeMux {
	mux := http.NewServeMux()
	gym.Register(mux, f)
	return mux
}

func do(t *testing.T, mux *http.ServeMux, user, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var rd io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		rd = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rd)
	req = req.WithContext(auth.WithUserID(req.Context(), user))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	return w
}

func decode[T any](t *testing.T, w *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data T `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode envelope: %v (body: %s)", err, w.Body.String())
	}
	return env.Data
}

func wantStatus(t *testing.T, w *httptest.ResponseRecorder, want int) {
	t.Helper()
	if w.Code != want {
		t.Fatalf("status = %d, want %d (body: %s)", w.Code, want, w.Body.String())
	}
}

func createSession(t *testing.T, mux *http.ServeMux, user, date string) gym.Session {
	t.Helper()
	w := do(t, mux, user, "POST", "/api/gym/sessions", map[string]any{"date": date, "name": "Workout"})
	wantStatus(t, w, http.StatusCreated)
	return decode[gym.Session](t, w)
}

func getStreak(t *testing.T, mux *http.ServeMux, user string) gym.Streak {
	t.Helper()
	w := do(t, mux, user, "GET", "/api/gym/streak", nil)
	wantStatus(t, w, http.StatusOK)
	return decode[gym.Streak](t, w)
}

func TestCreateSession(t *testing.T) {
	f := newFake()
	mux := serve(f)

	w := do(t, mux, "user_1", "POST", "/api/gym/sessions", map[string]any{"name": "no date"})
	wantStatus(t, w, http.StatusBadRequest)

	w = do(t, mux, "user_1", "POST", "/api/gym/sessions", map[string]any{"date": day(1)})
	wantStatus(t, w, http.StatusBadRequest) // future dates rejected

	s := createSession(t, mux, "user_1", "2026-07-01")
	if s.ID == "" || s.UserID != "user_1" || s.Date != "2026-07-01" {
		t.Fatalf("bad session: %+v", s)
	}
	if s.Exercises == nil || len(s.Exercises) != 0 {
		t.Fatalf("exercises should be empty, got %+v", s.Exercises)
	}
	if st := getStreak(t, mux, "user_1"); st.CurrentStreak != 1 || st.LongestStreak != 1 || *st.LastGymDate != "2026-07-01" {
		t.Fatalf("streak after first session: %+v", st)
	}
}

func TestCreateExercise(t *testing.T) {
	f := newFake()
	mux := serve(f)
	s := createSession(t, mux, "user_1", "2026-07-01")

	w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises", map[string]any{"sets": 3})
	wantStatus(t, w, http.StatusBadRequest)

	w = do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises",
		map[string]any{"name": "Bench Press", "sets": 3, "reps": 8, "weight": 60.0, "weight_unit": "kg"})
	wantStatus(t, w, http.StatusCreated)
	e := decode[gym.Exercise](t, w)
	if e.ID == "" || e.SessionID != s.ID || e.Name != "Bench Press" || *e.Sets != 3 {
		t.Fatalf("bad exercise: %+v", e)
	}

	w = do(t, mux, "user_1", "GET", "/api/gym/sessions", nil)
	wantStatus(t, w, http.StatusOK)
	list := decode[[]gym.Session](t, w)
	if len(list) != 1 || len(list[0].Exercises) != 1 {
		t.Fatalf("session should include its exercise: %+v", list)
	}
}

func TestSessionsDateRangeFilter(t *testing.T) {
	f := newFake()
	mux := serve(f)
	createSession(t, mux, "user_1", "2026-07-01")
	createSession(t, mux, "user_1", "2026-07-05")
	createSession(t, mux, "user_1", "2026-07-10")

	w := do(t, mux, "user_1", "GET", "/api/gym/sessions?from=2026-07-02&to=2026-07-09", nil)
	wantStatus(t, w, http.StatusOK)
	list := decode[[]gym.Session](t, w)
	if len(list) != 1 || list[0].Date != "2026-07-05" {
		t.Fatalf("filtered list = %+v", list)
	}

	w = do(t, mux, "user_1", "GET", "/api/gym/sessions", nil)
	if list := decode[[]gym.Session](t, w); len(list) != 3 {
		t.Fatalf("unfiltered list should have 3, got %d", len(list))
	}
}

func TestDeleteSessionCascades(t *testing.T) {
	f := newFake()
	mux := serve(f)
	s := createSession(t, mux, "user_1", "2026-07-01")
	for _, name := range []string{"Squat", "Deadlift"} {
		w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises", map[string]any{"name": name})
		wantStatus(t, w, http.StatusCreated)
	}

	w := do(t, mux, "user_1", "DELETE", "/api/gym/sessions/"+s.ID, nil)
	wantStatus(t, w, http.StatusOK)

	w = do(t, mux, "user_1", "DELETE", "/api/gym/sessions/"+s.ID, nil)
	wantStatus(t, w, http.StatusNotFound)
	if len(f.exercises) != 0 {
		t.Fatalf("exercises should cascade on session delete, %d left", len(f.exercises))
	}
}

func TestStreakEndpoint(t *testing.T) {
	f := newFake()
	mux := serve(f)

	st := getStreak(t, mux, "user_new")
	if st.CurrentStreak != 0 || st.LongestStreak != 0 || st.LastGymDate != nil || st.FreezeUsed {
		t.Fatalf("zero-row streak = %+v", st)
	}

	last := "2026-07-01"
	f.streaks["user_1"] = gym.Streak{CurrentStreak: 3, LongestStreak: 5, LastGymDate: &last}
	if st := getStreak(t, mux, "user_1"); st.CurrentStreak != 3 || st.LongestStreak != 5 || *st.LastGymDate != last {
		t.Fatalf("streak = %+v", st)
	}
}

func TestStreakIncrementAndReset(t *testing.T) {
	f := newFake()
	mux := serve(f)

	createSession(t, mux, "user_1", "2026-07-01")
	createSession(t, mux, "user_1", "2026-07-01") // same day: unchanged
	if st := getStreak(t, mux, "user_1"); st.CurrentStreak != 1 {
		t.Fatalf("after same-day sessions current = %d, want 1", st.CurrentStreak)
	}

	createSession(t, mux, "user_1", "2026-07-02")
	createSession(t, mux, "user_1", "2026-07-03")
	if st := getStreak(t, mux, "user_1"); st.CurrentStreak != 3 || st.LongestStreak != 3 {
		t.Fatalf("after consecutive days streak = %+v", st)
	}

	// Mark freeze used so we can verify the gap resets it too.
	st := f.streaks["user_1"]
	st.FreezeUsed = true
	f.streaks["user_1"] = st

	createSession(t, mux, "user_1", "2026-07-06") // gap >= 2 days
	got := getStreak(t, mux, "user_1")
	if got.CurrentStreak != 1 || got.LongestStreak != 3 || got.FreezeUsed || *got.LastGymDate != "2026-07-06" {
		t.Fatalf("after gap streak = %+v", got)
	}
}

func TestBackdatedSessionIsNoOp(t *testing.T) {
	f := newFake()
	mux := serve(f)
	last := "2026-07-05"
	f.streaks["user_1"] = gym.Streak{CurrentStreak: 3, LongestStreak: 4, LastGymDate: &last}

	createSession(t, mux, "user_1", "2026-07-01") // diff < 0: backdated
	st := getStreak(t, mux, "user_1")
	if st.CurrentStreak != 3 || st.LongestStreak != 4 || *st.LastGymDate != "2026-07-05" {
		t.Fatalf("backdated session should not change streak: %+v", st)
	}
}

func TestFreezeBridgesYesterday(t *testing.T) {
	f := newFake()
	mux := serve(f)
	yesterday := day(-1)
	f.streaks["user_1"] = gym.Streak{CurrentStreak: 5, LongestStreak: 5, LastGymDate: &yesterday}

	w := do(t, mux, "user_1", "POST", "/api/gym/streak/freeze", nil)
	wantStatus(t, w, http.StatusOK)
	st := decode[gym.Streak](t, w)
	today := day(0)
	if !st.FreezeUsed || *st.LastGymDate != today || st.LastFreezeDate == nil || *st.LastFreezeDate != today || st.CurrentStreak != 5 {
		t.Fatalf("after freeze streak = %+v (today %s)", st, today)
	}
}

func TestFreezeThenTrainTodayRefunds(t *testing.T) {
	f := newFake()
	mux := serve(f)
	yesterday := day(-1)
	f.streaks["user_1"] = gym.Streak{CurrentStreak: 5, LongestStreak: 5, LastGymDate: &yesterday}

	w := do(t, mux, "user_1", "POST", "/api/gym/streak/freeze", nil)
	wantStatus(t, w, http.StatusOK)

	// User actually trains on the frozen day: increment and refund the freeze.
	createSession(t, mux, "user_1", day(0))
	st := getStreak(t, mux, "user_1")
	if st.CurrentStreak != 6 || st.LongestStreak != 6 || st.FreezeUsed || st.LastFreezeDate != nil {
		t.Fatalf("train on frozen day should refund freeze: %+v", st)
	}

	// A second same-day session is a plain no-op.
	createSession(t, mux, "user_1", day(0))
	if st := getStreak(t, mux, "user_1"); st.CurrentStreak != 6 || st.FreezeUsed {
		t.Fatalf("second same-day session should be a no-op: %+v", st)
	}
}

func TestTrainDayAfterFreezeContinuesStreak(t *testing.T) {
	f := newFake()
	mux := serve(f)
	// State as if the user froze yesterday: freeze stays consumed, streak continues.
	yesterday := day(-1)
	f.streaks["user_1"] = gym.Streak{CurrentStreak: 5, LongestStreak: 5, LastGymDate: &yesterday, FreezeUsed: true, LastFreezeDate: &yesterday}

	createSession(t, mux, "user_1", day(0)) // diff == 1
	st := getStreak(t, mux, "user_1")
	if st.CurrentStreak != 6 || st.LongestStreak != 6 || !st.FreezeUsed || st.LastFreezeDate == nil {
		t.Fatalf("day-after-freeze session should continue streak with freeze consumed: %+v", st)
	}
}

func TestGapResetsStreakAndFreeze(t *testing.T) {
	f := newFake()
	mux := serve(f)
	last := "2026-07-01"
	frozen := "2026-07-01"
	f.streaks["user_1"] = gym.Streak{CurrentStreak: 5, LongestStreak: 5, LastGymDate: &last, FreezeUsed: true, LastFreezeDate: &frozen}

	createSession(t, mux, "user_1", "2026-07-04") // diff >= 2
	st := getStreak(t, mux, "user_1")
	if st.CurrentStreak != 1 || st.LongestStreak != 5 || st.FreezeUsed || st.LastFreezeDate != nil || *st.LastGymDate != "2026-07-04" {
		t.Fatalf("gap should reset streak and clear freeze: %+v", st)
	}
}

func TestFreezeRejections(t *testing.T) {
	f := newFake()
	mux := serve(f)
	yesterday, today, twoAgo := day(-1), day(0), day(-2)

	cases := []struct {
		name   string
		streak gym.Streak
	}{
		{"freeze already used", gym.Streak{CurrentStreak: 2, LongestStreak: 2, LastGymDate: &yesterday, FreezeUsed: true}},
		{"no streak to protect", gym.Streak{}},
		{"already covered today", gym.Streak{CurrentStreak: 2, LongestStreak: 2, LastGymDate: &today}},
		{"streak already broken", gym.Streak{CurrentStreak: 2, LongestStreak: 2, LastGymDate: &twoAgo}},
	}
	for i, c := range cases {
		user := fmt.Sprintf("user_%d", i)
		f.streaks[user] = c.streak
		w := do(t, mux, user, "POST", "/api/gym/streak/freeze", nil)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("%s: status = %d, want 400 (body: %s)", c.name, w.Code, w.Body.String())
		}
		// Rejected freezes must never touch the stored streak.
		if got := f.streaks[user]; got != c.streak {
			t.Fatalf("%s: streak mutated to %+v", c.name, got)
		}
	}
}

func TestExercisesKeepInsertionOrder(t *testing.T) {
	f := newFake()
	mux := serve(f)
	s := createSession(t, mux, "user_1", "2026-07-01")
	names := []string{"Bench", "Squat", "Deadlift"}
	for _, n := range names {
		w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises", map[string]any{"name": n})
		wantStatus(t, w, http.StatusCreated)
	}

	w := do(t, mux, "user_1", "GET", "/api/gym/sessions", nil)
	wantStatus(t, w, http.StatusOK)
	list := decode[[]gym.Session](t, w)
	if len(list) != 1 || len(list[0].Exercises) != 3 {
		t.Fatalf("want 1 session with 3 exercises, got %+v", list)
	}
	for i, e := range list[0].Exercises {
		if e.Name != names[i] {
			t.Fatalf("exercise %d = %s, want %s (order scrambled)", i, e.Name, names[i])
		}
	}
}

func TestOwnership(t *testing.T) {
	f := newFake()
	mux := serve(f)
	s := createSession(t, mux, "user_1", "2026-07-01")
	w := do(t, mux, "user_1", "POST", "/api/gym/sessions/"+s.ID+"/exercises", map[string]any{"name": "Row"})
	wantStatus(t, w, http.StatusCreated)
	e := decode[gym.Exercise](t, w)

	cases := []struct {
		method, path string
		body         any
	}{
		{"PATCH", "/api/gym/sessions/" + s.ID, map[string]any{"name": "hijack"}},
		{"DELETE", "/api/gym/sessions/" + s.ID, nil},
		{"POST", "/api/gym/sessions/" + s.ID + "/exercises", map[string]any{"name": "Curl"}},
		{"PATCH", "/api/gym/exercises/" + e.ID, map[string]any{"sets": 99}},
		{"DELETE", "/api/gym/exercises/" + e.ID, nil},
	}
	for _, c := range cases {
		w := do(t, mux, "user_2", c.method, c.path, c.body)
		wantStatus(t, w, http.StatusForbidden)
	}

	w = do(t, mux, "user_2", "PATCH", "/api/gym/sessions/missing", map[string]any{"name": "x"})
	wantStatus(t, w, http.StatusNotFound)
	w = do(t, mux, "user_2", "PATCH", "/api/gym/exercises/missing", map[string]any{"sets": 1})
	wantStatus(t, w, http.StatusNotFound)
}
