-- Phase 12: exercise parameter system + Apple Health dedupe.
-- Additive only. exercise_library gains a per-exercise parameter schema; each
-- logged gym_exercise gains the captured parameters, the formula that scored it,
-- the computed MET, and an optional RPE. Both tables already have RLS.

-- Schema-driven parameter capture: parameter_schema describes which fields the
-- app prompts for and which calorie formula computes the burn (see
-- internal/gym/parameters.go). Null for exercises with no special parameters.
alter table exercise_library
  add column if not exists parameter_schema jsonb;

-- Per-log capture: the validated parameters, the formula that scored them, the
-- computed MET, and an optional 1-10 RPE (rate of perceived exertion) used for
-- progression tracking. All nullable — an exercise logged the old way stays valid.
alter table gym_exercises
  add column if not exists parameters      jsonb,
  add column if not exists calorie_formula text,
  add column if not exists computed_met    double precision,
  add column if not exists rpe             int;

-- rpe is a 1-10 scale when present.
alter table gym_exercises
  drop constraint if exists gym_exercises_rpe_range;
alter table gym_exercises
  add constraint gym_exercises_rpe_range check (rpe is null or (rpe between 1 and 10));

-- Apple Health import dedupe: one HealthKit workout maps to at most one session
-- per user. Partial unique index (the vast majority of sessions have a null uuid),
-- mirroring the Strava/WHOOP indexes from 20260714000001.
alter table gym_sessions
  add column if not exists apple_health_uuid text;
create unique index if not exists gym_sessions_apple_health_uuid_idx
  on gym_sessions (user_id, apple_health_uuid) where apple_health_uuid is not null;

-- Idempotency: the offline mutation queue replays writes with a client-generated
-- key. A partial unique index makes a replay a no-op (the handler returns the
-- existing row) instead of a duplicate. Covers POST /api/food/logs + gym/sessions.
alter table food_logs    add column if not exists idempotency_key text;
alter table gym_sessions add column if not exists idempotency_key text;
create unique index if not exists food_logs_idempotency_idx
  on food_logs (user_id, idempotency_key) where idempotency_key is not null;
create unique index if not exists gym_sessions_idempotency_idx
  on gym_sessions (user_id, idempotency_key) where idempotency_key is not null;
