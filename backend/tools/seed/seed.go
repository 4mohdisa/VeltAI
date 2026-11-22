package main

import (
	"context"
	"fmt"
	"hash/fnv"
	"math/rand"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// body is a seed user's onboarding answers and goals. Nil means the user never
// finished onboarding.
type body struct {
	age                int
	sex                string
	heightCm, weightKg float64
	activity, goal     string
	kcal, p, c, f      int
}

type user struct {
	ID, Email, Name string
	body            *body
	foodDays        []int // days ago with food logged
	gymDays         []int // days ago with a gym session
	weightEvery     int   // a body weight entry every N food days, 0 for none
	weightTrend     float64
}

// span returns the days-ago values from..to inclusive (from >= to).
func span(from, to int) []int {
	var out []int
	for d := from; d >= to; d-- {
		out = append(out, d)
	}
	return out
}

// weekly keeps the days in span(from, to) that fall on the given weekdays.
func weekly(from, to int, today time.Time, days ...time.Weekday) []int {
	var out []int
	for _, d := range span(from, to) {
		wd := today.AddDate(0, 0, -d).Weekday()
		for _, w := range days {
			if wd == w {
				out = append(out, d)
			}
		}
	}
	return out
}

func seedUsers(today time.Time) []user {
	return []user{
		{ID: "seed_new", Email: "new" + seedEmailDomain, Name: "Nova New"},
		{
			ID: "seed_active", Email: "active" + seedEmailDomain, Name: "Ari Active",
			body:     &body{31, "female", 166, 64, "moderate", "maintain", 2050, 115, 250, 65},
			foodDays: span(20, 0), gymDays: weekly(20, 0, today, time.Monday, time.Wednesday, time.Friday),
			weightEvery: 4, weightTrend: 0,
		},
		{
			ID: "seed_heavy", Email: "heavy" + seedEmailDomain, Name: "Hana Heavy",
			body:     &body{29, "male", 180, 84, "active", "lose", 2450, 150, 270, 75},
			foodDays: span(89, 0), gymDays: weekly(89, 0, today, time.Monday, time.Tuesday, time.Thursday, time.Saturday),
			weightEvery: 2, weightTrend: -0.06,
		},
		{
			ID: "seed_lapsed", Email: "lapsed" + seedEmailDomain, Name: "Leo Lapsed",
			body:     &body{38, "male", 175, 90, "light", "lose", 2200, 160, 220, 70},
			foodDays: span(75, 31), gymDays: weekly(75, 31, today, time.Tuesday, time.Saturday),
			weightEvery: 5, weightTrend: -0.02,
		},
		{
			ID: "seed_long_streak", Email: "longstreak" + seedEmailDomain, Name: "Sam Streak",
			body:     &body{26, "female", 170, 61, "very_active", "muscle", 2400, 125, 300, 70},
			foodDays: span(59, 0), gymDays: span(59, 1),
			weightEvery: 7, weightTrend: 0.02,
		},
		{
			ID: "seed_broken_streak", Email: "brokenstreak" + seedEmailDomain, Name: "Bea Broken",
			body:     &body{34, "female", 162, 70, "moderate", "lose", 1800, 125, 190, 55},
			foodDays: span(40, 0), gymDays: span(40, 10),
			weightEvery: 6, weightTrend: -0.03,
		},
	}
}

type meal struct {
	name                 string
	kcal, p, c, f, fibre float64
}

var menu = map[string][]meal{
	"Breakfast": {
		{"Porridge with blueberries", 360, 12, 58, 8, 7},
		{"Scrambled eggs on sourdough", 420, 24, 34, 20, 3},
		{"Greek yogurt with granola", 340, 20, 42, 10, 4},
		{"Peanut butter banana toast", 390, 13, 50, 16, 6},
	},
	"Lunch": {
		{"Chicken caesar salad", 520, 38, 18, 32, 4},
		{"Lentil soup with bread", 460, 21, 68, 10, 14},
		{"Tuna sandwich", 480, 32, 46, 16, 5},
		{"Chicken burrito bowl", 640, 42, 70, 18, 11},
	},
	"Dinner": {
		{"Salmon, rice and broccoli", 610, 40, 58, 22, 6},
		{"Spaghetti bolognese", 700, 38, 82, 22, 7},
		{"Tofu vegetable stir-fry", 520, 26, 60, 18, 8},
		{"Chicken curry with rice", 690, 42, 74, 22, 5},
	},
	"Snacks": {
		{"Protein shake", 180, 30, 8, 3, 1},
		{"Apple", 95, 0.5, 25, 0.3, 4},
		{"Handful of almonds", 170, 6, 6, 15, 3},
		{"Rice cakes with hummus", 150, 5, 22, 5, 3},
	},
}

type lift struct {
	name   string
	sets   int
	reps   int
	weight float64 // starting kg
}

var plans = [][]lift{
	{{"Barbell Bench Press", 4, 8, 60}, {"Overhead Press", 3, 8, 35}, {"Dumbbell Curl", 3, 12, 10}},
	{{"Back Squat", 4, 6, 80}, {"Romanian Deadlift", 3, 8, 70}},
	{{"Deadlift", 3, 5, 100}, {"Bent-over Barbell Row", 3, 8, 50}, {"Lat Pulldown", 3, 10, 45}},
}

func seedUser(ctx context.Context, tx pgx.Tx, u user, today time.Time) error {
	if !isSeedEmail(u.Email) || !strings.HasPrefix(u.ID, seedIDPrefix) || u.ID == seedIDPrefix {
		return fmt.Errorf("not a seed identity: %s %s", u.ID, u.Email)
	}
	h := fnv.New64a()
	h.Write([]byte(u.ID))
	rng := rand.New(rand.NewSource(int64(h.Sum64()))) // same data every run
	date := func(daysAgo int) string { return today.AddDate(0, 0, -daysAgo).Format("2006-01-02") }

	if _, err := tx.Exec(ctx, `INSERT INTO profiles (id, email, display_name) VALUES ($1, $2, $3)`,
		u.ID, u.Email, u.Name); err != nil {
		return fmt.Errorf("profile: %w", err)
	}
	if u.body == nil {
		return nil
	}
	b := u.body
	if _, err := tx.Exec(ctx, `
		INSERT INTO onboarding (user_id, completed, age, sex, height, height_unit, weight, weight_unit, activity_level, goal)
		VALUES ($1, true, $2, $3, $4, 'cm', $5, 'kg', $6, $7)`,
		u.ID, b.age, b.sex, b.heightCm, b.weightKg, b.activity, b.goal); err != nil {
		return fmt.Errorf("onboarding: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO goals (user_id, calorie_target, protein_target, carb_target, fat_target, fibre_target, weight_goal, activity_level, source)
		VALUES ($1, $2, $3, $4, $5, 30, $6, $7, 'onboarding')`,
		u.ID, b.kcal, b.p, b.c, b.f, b.goal, b.activity); err != nil {
		return fmt.Errorf("goals: %w", err)
	}

	for i, d := range u.foodDays {
		for _, slot := range []string{"Breakfast", "Lunch", "Dinner", "Snacks"} {
			if slot == "Snacks" && rng.Intn(3) == 0 {
				continue
			}
			m := menu[slot][rng.Intn(len(menu[slot]))]
			// The menu averages about 1,650 kcal a day; scale it to the user's target.
			portion := float64(b.kcal) / 1650 * (0.85 + rng.Float64()*0.3)
			if _, err := tx.Exec(ctx, `
				INSERT INTO food_logs (user_id, date, meal_type, food_name, calories, protein, carbs, fat, fibre, source, quantity, unit)
				VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, 'manual', 1, 'serving')`,
				u.ID, date(d), slot, m.name, round1(m.kcal*portion), round1(m.p*portion),
				round1(m.c*portion), round1(m.f*portion), round1(m.fibre*portion)); err != nil {
				return fmt.Errorf("food log: %w", err)
			}
		}
		if u.weightEvery > 0 && i%u.weightEvery == 0 {
			w := b.weightKg + u.weightTrend*float64(len(u.foodDays)-i) + (rng.Float64()-0.5)*0.6
			if _, err := tx.Exec(ctx, `INSERT INTO body_weight (user_id, date, weight, unit) VALUES ($1, $2::date, $3, 'kg')`,
				u.ID, date(d), round1(w)); err != nil {
				return fmt.Errorf("body weight: %w", err)
			}
		}
	}

	for n, d := range u.gymDays {
		plan := plans[n%len(plans)]
		minutes := 45 + rng.Intn(30)
		var sid string
		if err := tx.QueryRow(ctx, `
			INSERT INTO gym_sessions (user_id, date, name, duration_minutes, calories_burned, calculation_method)
			VALUES ($1, $2::date, $3, $4, $5, 'met') RETURNING id::text`,
			u.ID, date(d), fmt.Sprintf("Strength %c", 'A'+n%len(plans)), minutes, 220+rng.Intn(180)).Scan(&sid); err != nil {
			return fmt.Errorf("session: %w", err)
		}
		progress := float64(n/len(plans)) * 1.25 // small, steady overload
		for _, l := range plan {
			if _, err := tx.Exec(ctx, `
				INSERT INTO gym_exercises (session_id, name, sets, reps, weight, weight_unit, rpe, exercise_library_id)
				VALUES ($1::uuid, $2, $3, $4, $5, 'kg', $6, (SELECT id FROM exercise_library WHERE name = $2 LIMIT 1))`,
				sid, l.name, l.sets, l.reps, l.weight+progress, 6+rng.Intn(3)); err != nil {
				return fmt.Errorf("exercise: %w", err)
			}
		}
	}

	if len(u.gymDays) > 0 {
		current, longest := streak(u.gymDays)
		if _, err := tx.Exec(ctx, `
			INSERT INTO gym_streaks (user_id, current_streak, longest_streak, last_gym_date)
			VALUES ($1, $2, $3, $4::date)`,
			u.ID, current, longest, date(u.gymDays[len(u.gymDays)-1])); err != nil {
			return fmt.Errorf("streak: %w", err)
		}
	}
	return nil
}

// streak mirrors the backend's rule (internal/gym bumpStreak): consecutive
// days with a session. The current run counts only if it reaches today or
// yesterday. days must be days-ago values in descending order.
func streak(days []int) (current, longest int) {
	run := 0
	for i, d := range days {
		if i > 0 && days[i-1]-d == 1 {
			run++
		} else {
			run = 1
		}
		longest = max(longest, run)
	}
	if len(days) > 0 && days[len(days)-1] <= 1 {
		current = run
	}
	return current, longest
}

func round1(v float64) float64 { return float64(int(v*10+0.5)) / 10 }
