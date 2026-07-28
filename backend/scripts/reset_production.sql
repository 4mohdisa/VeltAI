-- ============================================================================
-- DESTRUCTIVE — wipes all user data. Run once against production before
-- launch. Do not run against a database you want to keep.
--
-- Run deliberately, by hand (psql / Supabase SQL editor). Nothing in the
-- build or the server ever executes this file.
--
-- What it does:
--   * TRUNCATEs every user-data table (schema stays intact; RLS stays intact)
--   * KEEPS the two shared library tables seeded:
--       - exercise_library      (re-seeded idempotently on server startup anyway)
--       - cuisine_food_library  (same)
--   * CASCADE covers child rows (scan_images → scan_sessions, saved_meal_items
--     → saved_meals, template_exercises → workout_templates, recipe_ingredients
--     → recipes, and every ON DELETE CASCADE reference to profiles).
--
-- Every cleared table is listed explicitly so nothing is missed. If a future
-- migration adds a user-data table, add it here.
-- ============================================================================

BEGIN;

TRUNCATE TABLE
  -- identity & account
  profiles,
  onboarding,
  goals,
  subscriptions,
  user_cuisine_preferences,
  -- food
  food_logs,
  saved_foods,
  saved_meals,
  saved_meal_items,
  recipes,
  recipe_ingredients,
  food_name_corrections,
  user_portion_prefs,
  -- body
  body_weight,
  -- gym
  gym_sessions,
  gym_exercises,
  gym_streaks,
  gym_adherence,
  workout_templates,
  template_exercises,
  workout_schedule,
  user_gym_patterns,
  -- integrations
  integration_connections,
  -- scan pipeline + learning
  scan_sessions,
  scan_images,
  scan_corrections,
  user_scan_calibration,
  user_food_affinity,
  confidence_calibration,
  -- AI brain
  ai_user_brain,
  ai_insights,
  -- product analytics (first-party)
  analytics_events
RESTART IDENTITY CASCADE;

COMMIT;

-- NOT truncated (shared, seeded reference data):
--   exercise_library, cuisine_food_library
