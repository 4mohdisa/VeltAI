// Demo-account seeder for App Store review (guideline 2.1: reviewers cannot sign
// up — provide working demo credentials WITH data).
//
// Usage:
//
//	DATABASE_URL=... go run ./scripts/seed_demo_account.go            # default user id
//	DATABASE_URL=... go run ./scripts/seed_demo_account.go -user <id> # real Clerk sub
//
// Idempotent and safe to re-run: it wipes the demo user's rows first (profiles
// cascade) and re-seeds, so the reviewer account always looks fresh. Once Clerk
// is live: create demo@lume.fit in the Clerk dashboard, copy its user id, and
// re-run with -user <clerk_user_id> so the seeded data attaches to the real
// sign-in. Paste into App Store Connect review notes:
//
//	Demo account: demo@lume.fit / <the password you set in Clerk>
//	(pre-loaded with 14 days of food logs, 8 workouts, a schedule and history)
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const demoEmail = "demo@lume.fit"

// demoPassword is NOT hardcoded: a real credential in tracked source is a
// credential in every clone and every fork of this repo forever. The operator
// sets it on the Clerk user by hand and passes it here only to have it echoed
// into the App Store review notes.
func demoPassword() string {
	if pw := os.Getenv("DEMO_ACCOUNT_PASSWORD"); pw != "" {
		return pw
	}
	return "<set DEMO_ACCOUNT_PASSWORD to print it here>"
}

func main() {
	userID := flag.String("user", "user_demo_reviewer", "user id (Clerk sub) to seed")
	flag.Parse()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	if err := seed(ctx, pool, *userID); err != nil {
		log.Fatalf("seed: %v", err)
	}
	fmt.Println("Demo account seeded.")
	fmt.Println()
	fmt.Println("App Store Connect review notes:")
	fmt.Printf("  Demo account: %s / %s\n", demoEmail, demoPassword())
	fmt.Printf("  (user id %q — 14 days of food logs, 8 workouts, template + schedule, weight history, active subscription)\n", *userID)
}

func seed(ctx context.Context, pool *pgxpool.Pool, uid string) error {
	rng := rand.New(rand.NewSource(42)) // deterministic → same demo data every run

	// Idempotency: profiles cascades to every user table, so delete + reinsert
	// resets the account completely.
	if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, uid); err != nil {
		return fmt.Errorf("reset: %w", err)
	}
	if _, err := pool.Exec(ctx,
		`INSERT INTO profiles (id, email, display_name) VALUES ($1, $2, 'Demo Reviewer')`,
		uid, demoEmail); err != nil {
		return fmt.Errorf("profile: %w", err)
	}

	// Completed onboarding + derived goals.
	if _, err := pool.Exec(ctx, `
		INSERT INTO onboarding (user_id, completed, age, sex, height, height_unit, weight, weight_unit, activity_level, goal, body_type)
		VALUES ($1, true, 29, 'male', 178, 'cm', 76, 'kg', 'moderate', 'lose', 'average')`, uid); err != nil {
		return fmt.Errorf("onboarding: %w", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO goals (user_id, calorie_target, protein_target, carb_target, fat_target, fibre_target, weight_goal, activity_level, source)
		VALUES ($1, 2140, 137, 264, 59, 30, 'lose', 'moderate', 'onboarding')`, uid); err != nil {
		return fmt.Errorf("goals: %w", err)
	}

	// 14 days of food logs across all meal types.
	type meal struct {
		slot, name           string
		kcal, p, c, f, fibre float64
	}
	menu := map[string][]meal{
		"Breakfast": {
			{"Breakfast", "Masala omelette + toast", 380, 22, 28, 19, 3},
			{"Breakfast", "Overnight oats with banana", 420, 15, 68, 10, 8},
			{"Breakfast", "Greek yogurt + granola", 340, 20, 42, 10, 4},
		},
		"Lunch": {
			{"Lunch", "Chicken biryani", 650, 38, 78, 20, 4},
			{"Lunch", "Dal with roti", 480, 21, 70, 12, 12},
			{"Lunch", "Grilled chicken wrap", 520, 35, 52, 18, 5},
		},
		"Dinner": {
			{"Dinner", "Butter chicken with rice", 720, 42, 66, 30, 4},
			{"Dinner", "Beef stir-fry with noodles", 610, 36, 60, 22, 6},
			{"Dinner", "Salmon, potatoes and greens", 560, 40, 42, 24, 7},
		},
		"Snacks": {
			{"Snacks", "Protein shake", 180, 30, 8, 3, 1},
			{"Snacks", "Apple with peanut butter", 250, 6, 30, 12, 5},
			{"Snacks", "Handful of almonds", 170, 6, 6, 15, 3},
		},
	}
	today := time.Now().UTC()
	for d := 0; d < 14; d++ {
		date := today.AddDate(0, 0, -d).Format("2006-01-02")
		for _, slot := range []string{"Breakfast", "Lunch", "Dinner", "Snacks"} {
			if slot == "Snacks" && d%2 == 1 {
				continue // snacks most days, not all — looks human
			}
			m := menu[slot][rng.Intn(len(menu[slot]))]
			if _, err := pool.Exec(ctx, `
				INSERT INTO food_logs (user_id, date, meal_type, food_name, calories, protein, carbs, fat, fibre, source, quantity, unit)
				VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, 'manual', 1, 'serving')`,
				uid, date, m.slot, m.name, m.kcal, m.p, m.c, m.f, m.fibre); err != nil {
				return fmt.Errorf("food log: %w", err)
			}
		}
	}

	// Workout template + weekly schedule (Mon/Wed/Fri push-pull-legs-ish).
	var templateID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO workout_templates (user_id, name, estimated_duration_minutes)
		VALUES ($1, 'Full Body Strength', 60) RETURNING id::text`, uid).Scan(&templateID); err != nil {
		return fmt.Errorf("template: %w", err)
	}
	tmplExercises := []struct {
		name       string
		sets, reps int
		weight     float64
	}{
		{"Barbell Bench Press", 3, 8, 60}, {"Back Squat", 3, 8, 80},
		{"Bent-over Barbell Row", 3, 10, 50}, {"Overhead Press", 3, 8, 40}, {"Plank", 3, 0, 0},
	}
	for i, te := range tmplExercises {
		var weight any
		if te.weight > 0 {
			weight = te.weight
		}
		if _, err := pool.Exec(ctx, `
			INSERT INTO template_exercises (template_id, exercise_id, planned_sets, planned_reps, planned_weight, sort_order)
			SELECT $1::uuid, id, $3, $4, $5, $6 FROM exercise_library WHERE name = $2 LIMIT 1`,
			templateID, te.name, te.sets, te.reps, weight, i); err != nil {
			return fmt.Errorf("template exercise: %w", err)
		}
	}
	for _, day := range []int{1, 3, 5} {
		if _, err := pool.Exec(ctx, `
			INSERT INTO workout_schedule (user_id, day_of_week, template_id) VALUES ($1, $2, $3::uuid)
			ON CONFLICT (user_id, day_of_week) DO UPDATE SET template_id = excluded.template_id`,
			uid, day, templateID); err != nil {
			return fmt.Errorf("schedule: %w", err)
		}
	}

	// 8 gym sessions over the last 2 weeks, varied exercises (incl. parameterized cardio).
	sessions := []struct {
		daysAgo int
		name    string
		minutes int
	}{{1, "Full Body Strength", 62}, {3, "Full Body Strength", 58}, {4, "Morning Run", 32},
		{6, "Full Body Strength", 65}, {8, "Full Body Strength", 55}, {9, "Intervals", 24},
		{11, "Full Body Strength", 60}, {13, "Full Body Strength", 63}}
	for _, s := range sessions {
		date := today.AddDate(0, 0, -s.daysAgo).Format("2006-01-02")
		var sid string
		if err := pool.QueryRow(ctx, `
			INSERT INTO gym_sessions (user_id, date, name, duration_minutes, calories_burned, calculation_method)
			VALUES ($1, $2::date, $3, $4, $5, 'met') RETURNING id::text`,
			uid, date, s.name, s.minutes, 250+rng.Intn(200)).Scan(&sid); err != nil {
			return fmt.Errorf("session: %w", err)
		}
		if s.name == "Morning Run" || s.name == "Intervals" {
			if _, err := pool.Exec(ctx, `
				INSERT INTO gym_exercises (session_id, name, exercise_type, duration_minutes, parameters, calorie_formula, computed_met, exercise_library_id)
				SELECT $1::uuid, 'Running', 'cardio', $2, $3::jsonb, 'acsm_treadmill', 9.1, id
				FROM exercise_library WHERE name = 'Running' LIMIT 1`,
				sid, s.minutes, fmt.Sprintf(`{"duration_minutes":%d,"speed_kmh":9,"incline_percent":1}`, s.minutes)); err != nil {
				return fmt.Errorf("cardio exercise: %w", err)
			}
			continue
		}
		for _, te := range tmplExercises[:4] {
			w := te.weight + float64(rng.Intn(3))*2.5
			if _, err := pool.Exec(ctx, `
				INSERT INTO gym_exercises (session_id, name, sets, reps, weight, weight_unit, rpe)
				VALUES ($1::uuid, $2, $3, $4, $5, 'kg', $6)`,
				sid, te.name, te.sets, te.reps, w, 6+rng.Intn(3)); err != nil {
				return fmt.Errorf("exercise: %w", err)
			}
		}
	}

	// Streak + body-weight history + active subscription.
	if _, err := pool.Exec(ctx, `
		INSERT INTO gym_streaks (user_id, current_streak, longest_streak, last_gym_date)
		VALUES ($1, 3, 9, $2::date)
		ON CONFLICT (user_id) DO UPDATE SET current_streak = 3, longest_streak = 9, last_gym_date = excluded.last_gym_date`,
		uid, today.AddDate(0, 0, -1).Format("2006-01-02")); err != nil {
		return fmt.Errorf("streak: %w", err)
	}
	for d := 0; d < 8; d++ {
		if _, err := pool.Exec(ctx, `
			INSERT INTO body_weight (user_id, date, weight, unit)
			VALUES ($1, $2::date, $3, 'kg')`,
			uid, today.AddDate(0, 0, -d*2).Format("2006-01-02"), 76.0+float64(d)*0.3); err != nil {
			return fmt.Errorf("body weight: %w", err)
		}
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO subscriptions (user_id, platform, status, plan_interval, expires_at)
		VALUES ($1, 'ios', 'active', 'year', now() + interval '340 days')
		ON CONFLICT (user_id) DO UPDATE SET status = 'active', expires_at = excluded.expires_at`,
		uid); err != nil {
		return fmt.Errorf("subscription: %w", err)
	}
	return nil
}
