-- Cuisine onboarding, scan-accuracy learning, meal builder, and the general
-- food-logging learning layer. Additive only — no existing table is altered
-- except ai_user_brain (+needs_rebuild).

-- ---------------------------------------------------------------------------
-- Cuisine onboarding
-- ---------------------------------------------------------------------------

create table user_cuisine_preferences (
  id                   uuid primary key default gen_random_uuid(),
  user_id              text not null unique references profiles(id) on delete cascade,
  cuisines             text[] not null default '{}',
  dietary_requirements text[] not null default '{}',
  updated_at           timestamptz not null default now()
);

-- Shared reference data, not user-owned — no RLS (readable by all authenticated
-- users; the backend's service-role connection bypasses RLS regardless).
create table cuisine_food_library (
  id             uuid primary key default gen_random_uuid(),
  cuisine        text not null,
  food_name      text not null,
  brand          text,
  calories       double precision not null default 0,
  protein        double precision not null default 0,
  carbs          double precision not null default 0,
  fat            double precision not null default 0,
  fibre          double precision not null default 0,
  serving_size   double precision not null default 100,
  serving_unit   text not null default 'g',
  is_vegetarian  boolean not null default false,
  is_vegan       boolean not null default false,
  is_halal       boolean not null default false,
  is_gluten_free boolean not null default false,
  tags           text[] not null default '{}',
  unique (cuisine, food_name)
);
create index cuisine_food_library_cuisine_idx on cuisine_food_library (cuisine);

-- ---------------------------------------------------------------------------
-- Scan accuracy learning
-- ---------------------------------------------------------------------------

create table scan_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null references profiles(id) on delete cascade,
  food_log_id         uuid references food_logs(id),
  scan_type           text not null,
  image_quality_score int,
  geometry_confidence int,
  ai_confidence       int,
  overall_confidence  int,
  reference_object    text,
  camera_angle_deg    double precision,
  plate_detected      boolean,
  processing_ms       int,
  rating              text, -- "way_off" | "a_bit_off" | "pretty_good" | "spot_on"
  created_at          timestamptz not null default now()
);
create index scan_sessions_user_idx on scan_sessions (user_id);

create table scan_corrections (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     text not null references profiles(id) on delete cascade,
  scan_session_id             uuid references scan_sessions(id),
  food_name_original          text,
  food_name_corrected         text,
  weight_original_g           double precision,
  weight_corrected_g          double precision,
  calories_original           double precision,
  calories_corrected          double precision,
  protein_original            double precision,
  protein_corrected           double precision,
  carbs_original              double precision,
  carbs_corrected             double precision,
  fat_original                double precision,
  fat_corrected               double precision,
  correction_magnitude        double precision,
  time_to_correction_seconds  int,
  macro_source_original       text,
  created_at                  timestamptz not null default now()
);
create index scan_corrections_user_idx on scan_corrections (user_id);

create table user_scan_calibration (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  text not null references profiles(id) on delete cascade,
  food_name                text not null,
  food_category            text,
  weight_multiplier_ewma   double precision not null default 1.0,
  sample_count             int not null default 0,
  last_updated             timestamptz not null default now(),
  unique (user_id, food_name)
);

create table user_portion_prefs (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null references profiles(id) on delete cascade,
  food_name         text not null,
  typical_weight_g  double precision,
  typical_meal_type text,
  logged_count      int not null default 1,
  last_logged       timestamptz,
  unique (user_id, food_name)
);

-- Teaches search: "chiken" -> "chicken tikka" once the user has corrected it.
create table food_name_corrections (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references profiles(id) on delete cascade,
  original_name   text not null,
  corrected_name  text not null,
  created_at      timestamptz not null default now()
);
create index food_name_corrections_user_idx on food_name_corrections (user_id, original_name);

-- ---------------------------------------------------------------------------
-- Meal builder
-- ---------------------------------------------------------------------------

create table recipes (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references profiles(id) on delete cascade,
  name           text not null,
  description    text,
  total_calories double precision not null default 0,
  total_protein  double precision not null default 0,
  total_carbs    double precision not null default 0,
  total_fat      double precision not null default 0,
  total_fibre    double precision not null default 0,
  serving_count  int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table recipe_ingredients (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references recipes(id) on delete cascade,
  food_name  text not null,
  quantity_g double precision not null,
  calories   double precision not null default 0,
  protein    double precision not null default 0,
  carbs      double precision not null default 0,
  fat        double precision not null default 0,
  fibre      double precision not null default 0
);
create index recipe_ingredients_recipe_idx on recipe_ingredients (recipe_id);

create table saved_meals (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references profiles(id) on delete cascade,
  name           text not null,
  meal_type      text,
  total_calories double precision not null default 0,
  total_protein  double precision not null default 0,
  total_carbs    double precision not null default 0,
  total_fat      double precision not null default 0,
  total_fibre    double precision not null default 0,
  logged_count   int not null default 1,
  last_logged    timestamptz,
  auto_generated boolean not null default false,
  created_at     timestamptz not null default now()
);
create index saved_meals_user_idx on saved_meals (user_id);

create table saved_meal_items (
  id             uuid primary key default gen_random_uuid(),
  saved_meal_id  uuid not null references saved_meals(id) on delete cascade,
  food_name      text not null,
  quantity_g     double precision not null,
  calories       double precision not null default 0,
  protein        double precision not null default 0,
  carbs          double precision not null default 0,
  fat            double precision not null default 0,
  fibre          double precision not null default 0
);
create index saved_meal_items_meal_idx on saved_meal_items (saved_meal_id);

-- ---------------------------------------------------------------------------
-- Brain rebuild eligibility
-- ---------------------------------------------------------------------------

alter table ai_user_brain add column needs_rebuild boolean not null default false;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table user_cuisine_preferences enable row level security;
alter table scan_sessions            enable row level security;
alter table scan_corrections         enable row level security;
alter table user_scan_calibration    enable row level security;
alter table user_portion_prefs       enable row level security;
alter table food_name_corrections    enable row level security;
alter table recipes                  enable row level security;
alter table recipe_ingredients       enable row level security;
alter table saved_meals              enable row level security;
alter table saved_meal_items         enable row level security;
-- cuisine_food_library intentionally has NO RLS: shared reference data.

create policy "own rows" on user_cuisine_preferences for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on scan_sessions for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on scan_corrections for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on user_scan_calibration for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on user_portion_prefs for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on food_name_corrections for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on recipes for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows via recipe" on recipe_ingredients for all to authenticated
  using (exists (select 1 from recipes r
                 where r.id = recipe_id and r.user_id = (select auth.jwt()->>'sub')))
  with check (exists (select 1 from recipes r
                      where r.id = recipe_id and r.user_id = (select auth.jwt()->>'sub')));

create policy "own rows" on saved_meals for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows via saved meal" on saved_meal_items for all to authenticated
  using (exists (select 1 from saved_meals m
                 where m.id = saved_meal_id and m.user_id = (select auth.jwt()->>'sub')))
  with check (exists (select 1 from saved_meals m
                      where m.id = saved_meal_id and m.user_id = (select auth.jwt()->>'sub')));
