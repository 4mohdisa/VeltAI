package energytests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/energy"
)

// ---------------------------------------------------------------------------
// Fake Store (hermetic, in-memory)
// ---------------------------------------------------------------------------

type fakeStore struct {
	intake map[string]float64
	burn   map[string]float64
	body   *energy.BodyStats
	target *float64
}

func within(m map[string]float64, from, to string) map[string]float64 {
	out := map[string]float64{}
	for d, v := range m {
		if d >= from && d <= to {
			out[d] = v
		}
	}
	return out
}

func (f *fakeStore) IntakeByDate(_ context.Context, _ /*userID*/, from, to string) (map[string]float64, error) {
	return within(f.intake, from, to), nil
}
func (f *fakeStore) ExerciseCaloriesByDate(_ context.Context, _ /*userID*/, from, to string) (map[string]float64, error) {
	return within(f.burn, from, to), nil
}
func (f *fakeStore) BodyStats(_ context.Context, _ string) (*energy.BodyStats, error) {
	return f.body, nil
}
func (f *fakeStore) CalorieTarget(_ context.Context, _ string) (*float64, error) {
	return f.target, nil
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func serve(s energy.Store) *http.ServeMux {
	mux := http.NewServeMux()
	energy.Register(mux, s)
	return mux
}

func do(t *testing.T, mux *http.ServeMux, user, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest("GET", path, nil)
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
		t.Fatalf("decode: %v (body %s)", err, w.Body.String())
	}
	return env.Data
}

func fptr(v float64) *float64 { return &v }
func iptr(v int) *int         { return &v }

func todayStr() string { return time.Now().In(config.Timezone()).Format("2006-01-02") }

// ---------------------------------------------------------------------------
// CalculateSessionCalories
// ---------------------------------------------------------------------------

func TestCalculateSessionCaloriesStrength(t *testing.T) {
	// met 6, 3×10 reps @3s + 3×60s rest = 270s = 0.075h; 6*70*0.075 = 31.5.
	got := energy.CalculateSessionCalories([]energy.SessionExercise{
		{MetValue: 6.0, ExerciseType: "strength", Sets: iptr(3), Reps: iptr(10), RestSeconds: iptr(60)},
	}, 70, 0)
	if got != 31.5 {
		t.Fatalf("strength calories = %v, want 31.5", got)
	}
}

func TestCalculateSessionCaloriesCardioUsesDuration(t *testing.T) {
	// cardio, 30 min: 8.3*70*0.5 = 290.5.
	got := energy.CalculateSessionCalories([]energy.SessionExercise{
		{MetValue: 8.3, ExerciseType: "cardio", DurationMinutes: iptr(30)},
	}, 70, 0)
	if got != 290.5 {
		t.Fatalf("cardio calories = %v, want 290.5", got)
	}
}

func TestCalculateSessionCaloriesDurationOverridesStrength(t *testing.T) {
	// explicit duration wins over the sets/reps estimate: 6*70*(20/60)=140.
	got := energy.CalculateSessionCalories([]energy.SessionExercise{
		{MetValue: 6.0, ExerciseType: "strength", Sets: iptr(3), Reps: iptr(10), RestSeconds: iptr(60), DurationMinutes: iptr(20)},
	}, 70, 0)
	if got != 140.0 {
		t.Fatalf("duration-override calories = %v, want 140.0", got)
	}
}

func TestCalculateSessionCaloriesNoExercisesUsesAvgMET(t *testing.T) {
	// no exercises but 45 min logged → avg MET 5.0: 5*70*0.75 = 262.5.
	got := energy.CalculateSessionCalories(nil, 70, 45)
	if got != 262.5 {
		t.Fatalf("avg-MET calories = %v, want 262.5", got)
	}
}

func TestCalculateSessionCaloriesEmptyIsZero(t *testing.T) {
	if got := energy.CalculateSessionCalories(nil, 70, 0); got != 0 {
		t.Fatalf("empty session = %v, want 0", got)
	}
	// cardio with no duration contributes nothing.
	if got := energy.CalculateSessionCalories([]energy.SessionExercise{{MetValue: 8, ExerciseType: "cardio"}}, 70, 0); got != 0 {
		t.Fatalf("cardio no-duration = %v, want 0", got)
	}
}

func TestCalculateSessionCaloriesDefaultsBodyweight(t *testing.T) {
	// bodyweight 0 → defaults to 70kg: 5*70*0.75 = 262.5.
	if got := energy.CalculateSessionCalories(nil, 0, 45); got != 262.5 {
		t.Fatalf("default-bodyweight = %v, want 262.5", got)
	}
}

// ---------------------------------------------------------------------------
// BMR
// ---------------------------------------------------------------------------

func TestBMR(t *testing.T) {
	// 10*80 + 6.25*180 - 5*30 = 800+1125-150 = 1775, then sex offset.
	if got := energy.BMR(30, "male", 180, 80); got != 1780 {
		t.Errorf("male BMR = %v, want 1780", got)
	}
	if got := energy.BMR(30, "female", 180, 80); got != 1614 {
		t.Errorf("female BMR = %v, want 1614", got)
	}
	if got := energy.BMR(30, "other", 180, 80); got != 1697 {
		t.Errorf("other BMR = %v, want 1697", got)
	}
}

// ---------------------------------------------------------------------------
// ComputeBalance
// ---------------------------------------------------------------------------

func TestComputeBalanceDeficit(t *testing.T) {
	eb := energy.ComputeBalance("2026-07-01", 2000, 300, fptr(1600), fptr(2200))
	if eb.CaloriesOutBMR == nil || *eb.CaloriesOutBMR != 1600 {
		t.Fatalf("bmr = %v", eb.CaloriesOutBMR)
	}
	if eb.CaloriesOutTotal == nil || *eb.CaloriesOutTotal != 1900 {
		t.Fatalf("total = %v, want 1900", eb.CaloriesOutTotal)
	}
	if eb.NetBalance == nil || *eb.NetBalance != 100 {
		t.Fatalf("net = %v, want 100", eb.NetBalance)
	}
	if eb.Variance == nil || *eb.Variance != -200 {
		t.Fatalf("variance = %v, want -200", eb.Variance)
	}
	if eb.Status != "deficit" {
		t.Fatalf("status = %q, want deficit", eb.Status)
	}
}

func TestComputeBalanceSurplusAndOnTarget(t *testing.T) {
	if eb := energy.ComputeBalance("d", 2500, 0, fptr(1600), fptr(2200)); eb.Status != "surplus" {
		t.Errorf("status = %q, want surplus", eb.Status)
	}
	if eb := energy.ComputeBalance("d", 2200, 0, fptr(1600), fptr(2200)); eb.Status != "on_target" {
		t.Errorf("status = %q, want on_target", eb.Status)
	}
	// exactly at the band edge is still on_target (|50| not > 50).
	if eb := energy.ComputeBalance("d", 2250, 0, fptr(1600), fptr(2200)); eb.Status != "on_target" {
		t.Errorf("edge status = %q, want on_target", eb.Status)
	}
}

func TestComputeBalanceMissingInputs(t *testing.T) {
	// no target → no_target, no variance.
	eb := energy.ComputeBalance("d", 2000, 300, fptr(1600), nil)
	if eb.Status != "no_target" || eb.Variance != nil || eb.Target != nil {
		t.Fatalf("no-target = %+v", eb)
	}
	// no body stats → no BMR/total/net (but exercise still shown).
	eb = energy.ComputeBalance("d", 2000, 300, nil, fptr(2200))
	if eb.CaloriesOutBMR != nil || eb.CaloriesOutTotal != nil || eb.NetBalance != nil {
		t.Fatalf("no-bmr should null total/net: %+v", eb)
	}
	if eb.CaloriesOutExercise != 300 {
		t.Fatalf("exercise = %v, want 300", eb.CaloriesOutExercise)
	}
}

func TestComputeWeeklyAverages(t *testing.T) {
	days := []energy.EnergyBalance{
		energy.ComputeBalance("d1", 2000, 200, fptr(1600), fptr(2000)), // total 1800
		energy.ComputeBalance("d2", 2200, 0, fptr(1600), fptr(2000)),   // total 1600
		energy.ComputeBalance("d3", 1800, 400, nil, fptr(2000)),        // no total → exercise 400
	}
	w := energy.ComputeWeekly(days)
	if w.WeeklyAverageIn != 2000 { // (2000+2200+1800)/3
		t.Errorf("avg in = %v, want 2000", w.WeeklyAverageIn)
	}
	// (1800+1600+400)/3 = 1266.67 → 1267.
	if w.WeeklyAverageOut != 1267 {
		t.Errorf("avg out = %v, want 1267", w.WeeklyAverageOut)
	}
	if w.WeeklyNet != 733 {
		t.Errorf("net = %v, want 733", w.WeeklyNet)
	}
}

// ---------------------------------------------------------------------------
// HTTP routes
// ---------------------------------------------------------------------------

func TestGetBalanceRoute(t *testing.T) {
	s := &fakeStore{
		intake: map[string]float64{"2026-07-01": 2000},
		burn:   map[string]float64{"2026-07-01": 300},
		body:   &energy.BodyStats{Age: 30, Sex: "male", HeightCm: 180, WeightKg: 80},
		target: fptr(2200),
	}
	mux := serve(s)

	eb := decode[energy.EnergyBalance](t, do(t, mux, "u1", "/api/energy-balance?date=2026-07-01"))
	if eb.CaloriesIn != 2000 || eb.CaloriesOutExercise != 300 {
		t.Fatalf("in/exercise = %+v", eb)
	}
	if eb.CaloriesOutBMR == nil || *eb.CaloriesOutBMR != 1780 {
		t.Fatalf("bmr = %v, want 1780", eb.CaloriesOutBMR)
	}
	if eb.CaloriesOutTotal == nil || *eb.CaloriesOutTotal != 2080 {
		t.Fatalf("total = %v, want 2080", eb.CaloriesOutTotal)
	}
	if eb.NetBalance == nil || *eb.NetBalance != -80 {
		t.Fatalf("net = %v, want -80", eb.NetBalance)
	}
	if eb.Status != "deficit" {
		t.Fatalf("status = %q, want deficit", eb.Status)
	}
}

func TestGetBalanceDefaultsToToday(t *testing.T) {
	today := todayStr()
	s := &fakeStore{intake: map[string]float64{today: 1500}, burn: map[string]float64{}}
	mux := serve(s)
	eb := decode[energy.EnergyBalance](t, do(t, mux, "u1", "/api/energy-balance"))
	if eb.Date != today || eb.CaloriesIn != 1500 {
		t.Fatalf("default-today = %+v, want date %s in 1500", eb, today)
	}
	// no body stats + no target → nulls + no_target, not a 500.
	if eb.CaloriesOutBMR != nil || eb.Status != "no_target" {
		t.Fatalf("missing-data degraded wrong: %+v", eb)
	}
}

func TestGetBalanceBadDate(t *testing.T) {
	mux := serve(&fakeStore{})
	w := do(t, mux, "u1", "/api/energy-balance?date=not-a-date")
	if w.Code != http.StatusBadRequest {
		t.Fatalf("bad date status = %d, want 400", w.Code)
	}
}

func TestGetWeekRoute(t *testing.T) {
	today := todayStr()
	s := &fakeStore{
		intake: map[string]float64{today: 2100},
		burn:   map[string]float64{today: 250},
		body:   &energy.BodyStats{Age: 25, Sex: "female", HeightCm: 165, WeightKg: 60},
		target: fptr(1900),
	}
	mux := serve(s)
	w := decode[energy.WeeklyEnergyBalance](t, do(t, mux, "u1", "/api/energy-balance/week"))
	if len(w.Days) != 7 {
		t.Fatalf("week days = %d, want 7", len(w.Days))
	}
	if w.Days[6].Date != today {
		t.Fatalf("last day = %s, want today %s", w.Days[6].Date, today)
	}
	if w.Days[6].CaloriesIn != 2100 || w.Days[6].CaloriesOutExercise != 250 {
		t.Fatalf("today's row = %+v", w.Days[6])
	}
	// Earlier days had no logs → zero intake, still a valid row.
	if w.Days[0].CaloriesIn != 0 {
		t.Fatalf("day 0 intake = %v, want 0", w.Days[0].CaloriesIn)
	}
}
