-- Gym schedule: exercise library, workout templates, weekly schedule,
-- per-day adherence, and rolled-up gym patterns. Additive; existing gym_sessions
-- / gym_exercises / onboarding gain optional columns.

create table exercise_library (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  muscle_group_primary    text not null,
  muscle_groups_secondary text[] not null default '{}',
  category                text not null,
  exercise_type           text not null default 'strength',
  equipment               text not null default 'bodyweight',
  difficulty              text not null default 'intermediate',
  description             text,
  unique (name)
);

create table workout_templates (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    text not null references profiles(id) on delete cascade,
  name                       text not null,
  estimated_duration_minutes int,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index workout_templates_user_idx on workout_templates (user_id);

create table template_exercises (
  id                       uuid primary key default gen_random_uuid(),
  template_id              uuid not null references workout_templates(id) on delete cascade,
  exercise_id              uuid not null references exercise_library(id),
  planned_sets             int,
  planned_reps             int,
  planned_weight           double precision,
  planned_weight_unit      text default 'kg',
  planned_duration_minutes int,
  rest_seconds             int,
  sort_order               int not null default 0,
  created_at               timestamptz not null default now()
);
create index template_exercises_template_idx on template_exercises (template_id);

create table workout_schedule (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  template_id uuid references workout_templates(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, day_of_week)
);

create table gym_adherence (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references profiles(id) on delete cascade,
  scheduled_date  date not null,
  template_id     uuid references workout_templates(id) on delete set null,
  checked_in      boolean not null default false,
  completion_rate double precision,
  customized      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (user_id, scheduled_date)
);
create index gym_adherence_user_date_idx on gym_adherence (user_id, scheduled_date);

create table user_gym_patterns (
  id                    uuid primary key default gen_random_uuid(),
  user_id               text not null unique references profiles(id) on delete cascade,
  most_trained_muscles  text[] not null default '{}',
  least_trained_muscles text[] not null default '{}',
  avg_sessions_per_week double precision,
  adherence_rate        double precision,
  customization_rate    double precision,
  most_missed_day       text,
  muscle_volume_map     jsonb,
  last_rebuilt          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table gym_sessions
  add column if not exists template_id uuid references workout_templates(id) on delete set null,
  add column if not exists session_type text not null default 'unplanned';

alter table gym_exercises
  add column if not exists exercise_library_id uuid references exercise_library(id) on delete set null,
  add column if not exists exercise_type text not null default 'strength',
  add column if not exists duration_minutes int,
  add column if not exists planned_sets int,
  add column if not exists planned_reps int,
  add column if not exists planned_weight double precision,
  add column if not exists is_extra boolean not null default false,
  add column if not exists skipped boolean not null default false;

alter table onboarding
  add column if not exists body_type text;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table exercise_library   enable row level security;
alter table workout_templates  enable row level security;
alter table template_exercises enable row level security;
alter table workout_schedule   enable row level security;
alter table gym_adherence      enable row level security;
alter table user_gym_patterns  enable row level security;

-- Shared reference data: readable by any authenticated user, no user filter.
create policy "read exercise library" on exercise_library for select to authenticated using (true);

create policy "own rows" on workout_templates for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows via template" on template_exercises for all to authenticated
  using (exists (select 1 from workout_templates t
                 where t.id = template_id and t.user_id = (select auth.jwt()->>'sub')))
  with check (exists (select 1 from workout_templates t
                      where t.id = template_id and t.user_id = (select auth.jwt()->>'sub')));

create policy "own rows" on workout_schedule for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on gym_adherence for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));

create policy "own rows" on user_gym_patterns for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));
