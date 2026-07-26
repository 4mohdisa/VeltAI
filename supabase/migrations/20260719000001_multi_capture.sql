-- Phase 13: multi-angle capture + learning layer. Additive only.

-- ---------------------------------------------------------------------------
-- D — Multi-angle capture
-- ---------------------------------------------------------------------------

-- scan_sessions gains multi-image metadata: how many images fed the estimate,
-- how well the per-angle estimates agreed (1 - stdev/mean; null for single),
-- and whether the user discarded the scan entirely (signal 6).
alter table scan_sessions
  add column if not exists image_count      int not null default 1,
  add column if not exists angle_agreement  double precision,
  add column if not exists discarded        boolean not null default false;

-- One row per captured image in a multi-shot scan.
create table if not exists scan_images (
  id               uuid primary key default gen_random_uuid(),
  scan_session_id  uuid not null references scan_sessions(id) on delete cascade,
  angle            text not null, -- 'top' | 'side' | 'oblique'
  quality_score    int,
  geometry_result  jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists scan_images_session_idx on scan_images (scan_session_id);

-- ---------------------------------------------------------------------------
-- E — Learning layer
-- ---------------------------------------------------------------------------

-- Corrections gain a type ('portion'|'identity'|'macro'|'discard'), the meal
-- slot, and the local hour the log happened — the inputs to signals 1/2/4/6.
alter table scan_corrections
  add column if not exists correction_type text,
  add column if not exists meal_type       text,
  add column if not exists logged_hour     int;

-- Signal 1/4: extend portion EWMA with a meal_type dimension. Null meal_type is
-- the existing food-level factor; per-meal rows refine it once ≥3 samples exist.
alter table user_scan_calibration
  add column if not exists meal_type text;
-- Replace the per-user-per-food uniqueness with per-user-per-food-per-meal.
-- (The original unique constraint name follows Postgres's default naming.)
alter table user_scan_calibration
  drop constraint if exists user_scan_calibration_user_id_food_name_key;
create unique index if not exists user_scan_calibration_user_food_meal_idx
  on user_scan_calibration (user_id, food_name, coalesce(meal_type, ''));

-- Signal 2: identity corrections ("AI said X, user picked Y").
create table if not exists user_food_affinity (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references profiles(id) on delete cascade,
  ai_suggested text not null,
  user_chose   text not null,
  occurrences  int not null default 1,
  last_seen    timestamptz not null default now(),
  unique (user_id, ai_suggested, user_chose)
);
create index if not exists user_food_affinity_user_idx on user_food_affinity (user_id);

-- Signal 3: global confidence calibration (aggregate, not per-user).
create table if not exists confidence_calibration (
  id                        uuid primary key default gen_random_uuid(),
  predicted_band            text not null, -- 'high' | 'medium' | 'low'
  sample_count              int not null default 0,
  mean_correction_magnitude double precision,
  updated_at                timestamptz not null default now(),
  unique (predicted_band)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table scan_images            enable row level security;
alter table user_food_affinity     enable row level security;
alter table confidence_calibration enable row level security;

-- scan_images: ownership via the parent scan_session (same pattern as
-- gym_exercises-via-session).
create policy "own rows via session" on scan_images for all to authenticated
  using (exists (select 1 from scan_sessions s
                 where s.id = scan_session_id
                   and s.user_id = (select auth.jwt()->>'sub')))
  with check (exists (select 1 from scan_sessions s
                      where s.id = scan_session_id
                        and s.user_id = (select auth.jwt()->>'sub')));

create policy "own rows" on user_food_affinity for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

-- confidence_calibration is a global aggregate: service-role only (no policy for
-- authenticated → RLS denies user reads/writes; the Go backend uses the service
-- role and bypasses RLS).
