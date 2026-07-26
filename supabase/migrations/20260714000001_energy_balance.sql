-- Phase 10: calorie-burn engine + third-party integrations.
-- Additive only. exercise_library gains a MET value; gym_sessions gains a
-- computed burn + provenance columns for imported activities; a new
-- integration_connections table holds encrypted OAuth tokens per provider.

-- MET (Metabolic Equivalent of Task) drives calorie burn per exercise. Default
-- 5.0 = moderate general activity, so any un-tagged exercise still estimates.
alter table exercise_library
  add column if not exists met_value double precision not null default 5.0;

-- calories_burned is computed on session complete (calculation_method 'met') or
-- carried from a device import ('device'). Nullable: older sessions have neither.
-- strava_activity_id / whoop_workout_id dedupe re-syncs from those providers.
alter table gym_sessions
  add column if not exists calories_burned    double precision,
  add column if not exists calculation_method text default 'met',
  add column if not exists strava_activity_id text,
  add column if not exists whoop_workout_id   text;

-- One imported activity maps to at most one session per user. Partial so the
-- overwhelming majority of sessions (manual, both ids null) are unconstrained.
create unique index if not exists gym_sessions_strava_activity_idx
  on gym_sessions (user_id, strava_activity_id) where strava_activity_id is not null;
create unique index if not exists gym_sessions_whoop_workout_idx
  on gym_sessions (user_id, whoop_workout_id) where whoop_workout_id is not null;

-- OAuth connections to fitness providers. access_token/refresh_token are stored
-- AES-256-GCM-encrypted by the app layer (never plaintext). One row per
-- (user, provider); re-connecting upserts.
create table if not exists integration_connections (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null references profiles(id) on delete cascade,
  provider         text not null,
  access_token     text not null,
  refresh_token    text,
  expires_at       timestamptz,
  scopes           text[],
  external_user_id text,
  connected_at     timestamptz not null default now(),
  last_sync_at     timestamptz,
  unique (user_id, provider)
);
create index if not exists integration_connections_user_idx on integration_connections (user_id);

-- ---------------------------------------------------------------------------
-- RLS: owner-only, keyed on the Clerk `sub` claim (same pattern as all user
-- tables). exercise_library's existing shared-read policy is unaffected.
-- ---------------------------------------------------------------------------
alter table integration_connections enable row level security;

create policy "own rows" on integration_connections for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));
