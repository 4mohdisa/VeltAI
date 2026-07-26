-- Lumo initial schema. All user-owned tables key on the Clerk user ID (TEXT).
-- RLS is enabled everywhere; policies compare against the Clerk `sub` claim so
-- direct Supabase client access (if ever used) is scoped to the owner. The Go
-- backend connects with the service role and enforces ownership in SQL.

create table profiles (
  id           text primary key, -- Clerk user ID
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table food_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references profiles(id) on delete cascade,
  date       date not null,
  meal_type  text,
  food_name  text not null,
  brand      text,
  barcode    text,
  quantity   double precision,
  unit       text,
  calories   double precision not null default 0,
  protein    double precision not null default 0,
  carbs      double precision not null default 0,
  fat        double precision not null default 0,
  fibre      double precision not null default 0,
  source     text,
  created_at timestamptz not null default now()
);
create index food_logs_user_date_idx on food_logs (user_id, date);

create table saved_foods (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references profiles(id) on delete cascade,
  food_name    text not null,
  brand        text,
  barcode      text,
  calories     double precision not null default 0,
  protein      double precision not null default 0,
  carbs        double precision not null default 0,
  fat          double precision not null default 0,
  fibre        double precision not null default 0,
  serving_size double precision,
  serving_unit text,
  created_at   timestamptz not null default now()
);
create index saved_foods_user_idx on saved_foods (user_id);

create table gym_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null references profiles(id) on delete cascade,
  date             date not null,
  name             text,
  notes            text,
  duration_minutes int,
  created_at       timestamptz not null default now()
);
create index gym_sessions_user_date_idx on gym_sessions (user_id, date);

create table gym_exercises (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references gym_sessions(id) on delete cascade,
  name         text not null,
  sets         int,
  reps         int,
  weight       double precision,
  weight_unit  text,
  rest_seconds int,
  notes        text
);
create index gym_exercises_session_idx on gym_exercises (session_id);

create table goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null unique references profiles(id) on delete cascade,
  calorie_target double precision,
  protein_target double precision,
  carb_target    double precision,
  fat_target     double precision,
  fibre_target   double precision,
  weight_goal    text,
  target_weight  double precision,
  weight_unit    text,
  activity_level text,
  source         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table body_weight (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references profiles(id) on delete cascade,
  date       date not null,
  weight     double precision not null,
  unit       text not null default 'kg',
  notes      text,
  created_at timestamptz not null default now()
);
create index body_weight_user_date_idx on body_weight (user_id, date);

create table gym_streaks (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null unique references profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_gym_date  date,
  freeze_used    boolean not null default false,
  updated_at     timestamptz not null default now()
);

create table ai_user_brain (
  id                     uuid primary key default gen_random_uuid(),
  user_id                text not null unique references profiles(id) on delete cascade,
  eating_patterns        jsonb,
  gym_patterns           jsonb,
  typical_daily_calories double precision,
  typical_macros         jsonb,
  meal_timing_patterns   jsonb,
  junk_food_frequency    jsonb,
  goal_adherence_score   double precision,
  insights_cache         jsonb,
  last_rebuilt           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table ai_insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references profiles(id) on delete cascade,
  type       text,
  title      text not null,
  body       text not null,
  data       jsonb,
  shown_at   timestamptz,
  dismissed  boolean not null default false,
  created_at timestamptz not null default now()
);
create index ai_insights_user_active_idx on ai_insights (user_id, dismissed);

create table onboarding (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null unique references profiles(id) on delete cascade,
  completed      boolean not null default false,
  age            int,
  sex            text,
  height         double precision,
  height_unit    text,
  weight         double precision,
  weight_unit    text,
  activity_level text,
  goal           text,
  created_at     timestamptz not null default now()
);

create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null unique references profiles(id) on delete cascade,
  platform           text,
  status             text not null default 'inactive',
  plan_interval      text,
  expires_at         timestamptz,
  revenuecat_user_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: owner-only access keyed on the Clerk `sub` claim.
-- ---------------------------------------------------------------------------
alter table profiles      enable row level security;
alter table food_logs     enable row level security;
alter table saved_foods   enable row level security;
alter table gym_sessions  enable row level security;
alter table gym_exercises enable row level security;
alter table goals         enable row level security;
alter table body_weight   enable row level security;
alter table gym_streaks   enable row level security;
alter table ai_user_brain enable row level security;
alter table ai_insights   enable row level security;
alter table onboarding    enable row level security;
alter table subscriptions enable row level security;

create policy "own profile" on profiles for all to authenticated
  using (id = (select auth.jwt()->>'sub'))
  with check (id = (select auth.jwt()->>'sub'));

create policy "own rows" on food_logs for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on saved_foods for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on gym_sessions for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows via session" on gym_exercises for all to authenticated
  using (exists (select 1 from gym_sessions s
                 where s.id = session_id
                   and s.user_id = (select auth.jwt()->>'sub')))
  with check (exists (select 1 from gym_sessions s
                      where s.id = session_id
                        and s.user_id = (select auth.jwt()->>'sub')));

create policy "own rows" on goals for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on body_weight for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on gym_streaks for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on ai_user_brain for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on ai_insights for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on onboarding for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on subscriptions for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));
