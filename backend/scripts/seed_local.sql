-- Idempotent local-dev seed: one test profile, a few food log entries and a
-- couple of gym sessions, so the app has something to show against the local
-- backend without a hosted Supabase/Clerk account. Local database only —
-- never point this at production.
--
-- :user_id becomes profiles.id (the Clerk user ID in production). No real
-- sign-in has happened against this local stack, so there is no real Clerk ID
-- to seed under — pass a fixed local placeholder, or the real one once a
-- hosted Clerk dev project and a sign-in exist. :user_email is optional.
--
-- Apply (reads E2E_EMAIL from the environment only; never hardcode it here):
--   psql "$DATABASE_URL" \
--     -v user_id="'local_test_user'" \
--     -v user_email="'${E2E_EMAIL:-local-test@example.invalid}'" \
--     -f backend/scripts/seed_local.sql

insert into profiles (id, email, display_name)
values (:user_id, :user_email, 'Local Test User')
on conflict (id) do update set email = excluded.email;

insert into food_logs (id, user_id, date, meal_type, food_name, calories, protein, carbs, fat, source)
values
  ('11111111-1111-4111-8111-111111111101', :user_id, current_date,     'breakfast', 'Oatmeal with banana',     320, 10, 58,  6, 'seed'),
  ('11111111-1111-4111-8111-111111111102', :user_id, current_date,     'lunch',     'Grilled chicken salad',   450, 42, 18, 20, 'seed'),
  ('11111111-1111-4111-8111-111111111103', :user_id, current_date - 1, 'dinner',    'Salmon with rice',        580, 38, 52, 22, 'seed')
on conflict (id) do nothing;

insert into gym_sessions (id, user_id, date, name, duration_minutes)
values
  ('22222222-2222-4222-8222-222222222201', :user_id, current_date,     'Push day', 55),
  ('22222222-2222-4222-8222-222222222202', :user_id, current_date - 2, 'Leg day',  60)
on conflict (id) do nothing;

insert into gym_exercises (id, session_id, name, sets, reps, weight, weight_unit)
values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Bench press', 4, 8, 60, 'kg'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'Back squat',  5, 5, 80, 'kg')
on conflict (id) do nothing;
