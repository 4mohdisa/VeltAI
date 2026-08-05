package aitests

import (
	"math"
	"testing"
	"time"

	"lume/backend/internal/ai"
)

func approx(t *testing.T, name string, got, want float64) {
	t.Helper()
	if math.Abs(got-want) > 1e-9 {
		t.Errorf("%s = %v, want %v", name, got, want)
	}
}

func flog(day, hour, minute int, meal, name string, cal, p, c, fat, fib float64) ai.FoodLogRow {
	return ai.FoodLogRow{
		Date:     time.Date(2026, 7, day, 0, 0, 0, 0, time.UTC),
		MealType: meal,
		FoodName: name,
		Calories: cal, Protein: p, Carbs: c, Fat: fat, Fibre: fib,
		CreatedAt: time.Date(2026, 7, day, hour, minute, 0, 0, time.UTC),
	}
}

// 3 days (Wed 1st, Thu 2nd, Fri 3rd July 2026 — all weekdays).
// Daily totals: D1 900 kcal/60p, D2 1500/60, D3 1000/70.
func fixtureLogs() []ai.FoodLogRow {
	return []ai.FoodLogRow{
		flog(1, 8, 0, "breakfast", "Oats", 300, 10, 50, 5, 8),
		flog(1, 12, 30, "lunch", "Chicken", 600, 50, 20, 15, 2),
		flog(2, 13, 0, "breakfast", "Pizza", 800, 30, 80, 35, 4),
		flog(2, 19, 0, "dinner", "Burger", 700, 30, 50, 40, 3),
		flog(3, 11, 0, "lunch", "Salad", 400, 20, 30, 10, 6),
		flog(3, 18, 30, "dinner", "Chicken", 600, 50, 20, 15, 2),
	}
}

func gses(day, dur int) ai.GymSessionRow {
	d := time.Date(2026, 7, day, 0, 0, 0, 0, time.UTC)
	return ai.GymSessionRow{Date: d, DurationMinutes: dur, CreatedAt: d.Add(17 * time.Hour)}
}

func fixtureSessions() []ai.GymSessionRow {
	return []ai.GymSessionRow{gses(1, 60), gses(3, 45)}
}

func fp(v float64) *float64 { return &v }
func sp(v string) *string   { return &v }

func fixtureGoal() *ai.GoalRow {
	return &ai.GoalRow{CalorieTarget: fp(1000), ProteinTarget: fp(65), WeightGoal: sp("lose")}
}

func fixtureWeights() []ai.WeightRow {
	return []ai.WeightRow{
		{Date: time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC), Weight: 80},
		{Date: time.Date(2026, 7, 3, 0, 0, 0, 0, time.UTC), Weight: 79.2},
	}
}

func TestCalorieAndMacroAverages(t *testing.T) {
	logs := fixtureLogs()
	approx(t, "AvgDailyCalories", ai.AvgDailyCalories(logs), 3400.0/3)
	m := ai.AvgDailyMacros(logs)
	approx(t, "protein", m.Protein, 190.0/3)
	approx(t, "carbs", m.Carbs, 250.0/3)
	approx(t, "fat", m.Fat, 120.0/3) // 20 + 75 + 25
	approx(t, "fibre", m.Fibre, 25.0/3)
	if got := ai.DistinctDays(logs); got != 3 {
		t.Errorf("DistinctDays = %d, want 3", got)
	}
}

func TestJunkFoodFrequency(t *testing.T) {
	jf := ai.ComputeJunkFood(fixtureLogs())
	if jf.Count != 2 {
		t.Errorf("junk count = %d, want 2 (Pizza, Burger)", jf.Count)
	}
	approx(t, "junk per week", jf.PerWeek, 2*7.0/30)

	for name, want := range map[string]bool{
		"Pepperoni PIZZA Slice": true,
		"choc-chip Cookie":      true,
		"Fried rice":            true,
		"Grilled chicken":       false,
		"Apple":                 false,
	} {
		if got := ai.IsJunkFood(name); got != want {
			t.Errorf("IsJunkFood(%q) = %v, want %v", name, got, want)
		}
	}
}

func TestConsistencyScore(t *testing.T) {
	// All 3 fixture days have 2 distinct meal types → 3/30.
	approx(t, "consistency", ai.ConsistencyScore(fixtureLogs()), 0.1)
}

func TestTopFoods(t *testing.T) {
	top := ai.TopFoodsByCount(fixtureLogs(), 5)
	if len(top) != 5 || top[0].Name != "chicken" || top[0].Count != 2 {
		t.Fatalf("top foods = %+v, want chicken x2 first", top)
	}
	approx(t, "chicken calorie share", top[0].CalorieShare, 1200.0/3400)
}

func TestMealTiming(t *testing.T) {
	t.Setenv("LUME_TIMEZONE", "UTC") // pin: fixture CreatedAt hours are UTC
	mt := ai.ComputeMealTiming(fixtureLogs())
	// Weekday first-log hours: 8.0, 13.0, 11.0 → median 11.0. No weekend days.
	approx(t, "weekday first-log hour", mt.WeekdayFirstLogHour, 11.0)
	approx(t, "weekend first-log hour", mt.WeekendFirstLogHour, 0)
	approx(t, "breakfast skip rate", mt.BreakfastSkipRate, 1.0/3)
}

func TestMealTimingUsesConfiguredTimezone(t *testing.T) {
	t.Setenv("LUME_TIMEZONE", "Australia/Adelaide") // UTC+9:30 in July
	// 22:30 UTC July 1 is 08:00 July 2 in Adelaide: a breakfast, not a
	// midnight snack — the hour must be read in the configured timezone.
	logs := []ai.FoodLogRow{{
		Date:      time.Date(2026, 7, 2, 0, 0, 0, 0, time.UTC), // Thursday
		FoodName:  "Oats",
		CreatedAt: time.Date(2026, 7, 1, 22, 30, 0, 0, time.UTC),
	}}
	mt := ai.ComputeMealTiming(logs)
	approx(t, "weekday first-log hour (Adelaide)", mt.WeekdayFirstLogHour, 8.0)
	approx(t, "breakfast skip rate (Adelaide)", mt.BreakfastSkipRate, 0)
}

func TestSessionsPerWeek(t *testing.T) {
	six := []ai.GymSessionRow{gses(1, 60), gses(3, 45), gses(5, 30), gses(8, 60), gses(10, 50), gses(12, 40)}
	approx(t, "sessions/week (6)", ai.SessionsPerWeek(six), 1.5)
	approx(t, "sessions/week (0)", ai.SessionsPerWeek(nil), 0)
	approx(t, "sessions/week (2)", ai.SessionsPerWeek(fixtureSessions()), 0.5)
}

func TestGymPatterns(t *testing.T) {
	approx(t, "avg duration", ai.AvgSessionDuration(fixtureSessions()), 52.5)
	// July 1 = Wednesday, July 3 = Friday; both modal.
	wds := ai.PreferredWeekdays(fixtureSessions())
	if len(wds) != 2 || wds[0] != "Wednesday" || wds[1] != "Friday" {
		t.Errorf("preferred weekdays = %v, want [Wednesday Friday]", wds)
	}
}

func TestGoalCheckAndAdherence(t *testing.T) {
	gc := ai.ComputeGoalCheck(fixtureLogs(), fixtureSessions(), fixtureGoal(), fixtureWeights())
	// Calorie target 1000, ±10% band [900,1100]: D1 900 ✓, D2 1500 ✗, D3 1000 ✓.
	approx(t, "calorie band rate", gc.CalorieWithinBandRate, 2.0/3)
	// Protein target 65: D1 60 ✗, D2 60 ✗, D3 70 ✓; miss avg (60+60)/2.
	approx(t, "protein hit rate", gc.ProteinHitRate, 1.0/3)
	approx(t, "protein avg on miss", gc.ProteinAvgOnMissDays, 60)
	// Gym days 1st & 3rd: (900+1000)/2; rest day: 1500.
	approx(t, "gym day calories", gc.GymDayCalories, 950)
	approx(t, "rest day calories", gc.RestDayCalories, 1500)
	if gc.WeightTrend != "down" {
		t.Errorf("weight trend = %q, want down", gc.WeightTrend)
	}
	approx(t, "weight change", gc.WeightChange, -0.8)
	if gc.TrendMatchesGoal == nil || !*gc.TrendMatchesGoal {
		t.Errorf("trend should match 'lose' goal, got %v", gc.TrendMatchesGoal)
	}

	// 100*(0.4*(2/3) + 0.3*(1/3) + 0.2*(0.5/3) + 0.1*0.1) = 41.0
	approx(t, "adherence score", ai.AdherenceScore(2.0/3, 1.0/3, 0.5, 0.1), 41.0)
	// Gym component caps at 1.0: 100*(0.2*1.0) = 20.
	approx(t, "adherence gym cap", ai.AdherenceScore(0, 0, 6, 0), 20.0)
}

// The app's goal vocabulary is lose/muscle/consistency/eat-better/health/...;
// every value must yield a trend check, not just "lose".
func TestTrendMatchesGoalVocabulary(t *testing.T) {
	up := []ai.WeightRow{
		{Date: time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC), Weight: 80},
		{Date: time.Date(2026, 7, 3, 0, 0, 0, 0, time.UTC), Weight: 81.5},
	}
	for _, c := range []struct {
		goal    string
		weights []ai.WeightRow
		want    bool
	}{
		{"muscle", up, true},                    // trending up matches muscle
		{"muscle", fixtureWeights(), false},     // trending down does not
		{"consistency", fixtureWeights(), true}, // -0.8 within the ±1kg maintain band
		{"health", up, false},                   // +1.5 outside the ±1kg band
	} {
		gc := ai.ComputeGoalCheck(fixtureLogs(), fixtureSessions(), &ai.GoalRow{WeightGoal: sp(c.goal)}, c.weights)
		if gc.TrendMatchesGoal == nil {
			t.Errorf("goal %q: TrendMatchesGoal = nil, want %v", c.goal, c.want)
		} else if *gc.TrendMatchesGoal != c.want {
			t.Errorf("goal %q (change %+.1f): TrendMatchesGoal = %v, want %v", c.goal, gc.WeightChange, *gc.TrendMatchesGoal, c.want)
		}
	}
}

func TestBuildBrain(t *testing.T) {
	b := ai.BuildBrain(fixtureLogs(), fixtureSessions(), fixtureGoal(), &ai.StreakRow{CurrentStreak: 2, LongestStreak: 5}, fixtureWeights())
	approx(t, "typical calories", b.TypicalDailyCalories, 3400.0/3)
	approx(t, "adherence", b.GoalAdherenceScore, 41.0)
	if b.GymPatterns.CurrentStreak != 2 || b.GymPatterns.LongestStreak != 5 {
		t.Errorf("streak not carried into gym patterns: %+v", b.GymPatterns)
	}
}
