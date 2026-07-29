-- Shared runtime state. Three pieces of state used to live in process memory —
-- rate-limit counters, the webhook replay guard, and OAuth CSRF states. All
-- three are correct on ONE instance and silently wrong on two: the limit becomes
-- N x the limit, a replayed webhook lands on the instance that never saw it, and
-- a restart between /connect and /callback drops every pending OAuth state.
--
-- These three tables are BACKEND-ONLY infrastructure: PostgREST and the app
-- never touch them, only the Go service (service role, bypasses RLS). They
-- therefore enable RLS with NO policy — the deny-all pattern used by
-- confidence_calibration in 20260719000001 — so the anon/authenticated API roles
-- can neither read nor write them.

-- ---------------------------------------------------------------------------
-- 1 — Rate-limit counters (fixed windows)
-- ---------------------------------------------------------------------------

-- One row per (caller+class key, window). The limiter's only write is a single
-- INSERT ... ON CONFLICT DO UPDATE ... RETURNING count, so N instances racing on
-- one key still produce one monotonic sequence: no read-modify-write.
create table if not exists rate_limit_counters (
  key          text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (key, window_start)
);

-- Retention: the limiter opportunistically DELETEs windows older than a few
-- minutes (see internal/ratelimit/pg.go). Indexed so that sweep is a range scan.
create index if not exists rate_limit_counters_window_idx on rate_limit_counters (window_start);

-- ---------------------------------------------------------------------------
-- 2 — Webhook replay guard
-- ---------------------------------------------------------------------------

-- One row per delivered provider event. Claiming an event is an
-- INSERT ... ON CONFLICT DO NOTHING: 0 rows affected means someone (another
-- delivery, another instance) already has it, i.e. this one is a replay.
create table if not exists webhook_processed_events (
  provider     text        not null,
  event_id     text        not null,
  processed_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- Retention: rows older than the provider's retry window are useless (an event
-- that old is rejected by the age bound anyway). Swept opportunistically on
-- claim; indexed for that sweep.
create index if not exists webhook_processed_events_processed_idx on webhook_processed_events (processed_at);

-- Durable half of the ordering guard: the newest event_timestamp_ms already
-- applied for this user. Compared AND updated inside the subscription upsert's
-- single statement, so two concurrent deliveries cannot both win — the loser's
-- ON CONFLICT DO UPDATE ... WHERE is false and it affects 0 rows.
alter table subscriptions
  add column if not exists last_event_ts_ms bigint;

-- ---------------------------------------------------------------------------
-- 3 — OAuth CSRF states
-- ---------------------------------------------------------------------------

-- One-time tokens tying an OAuth callback back to the user who started it.
-- Consumption is DELETE ... RETURNING: exactly one concurrent caller gets the
-- row, so a state token can never be redeemed twice.
--
-- user_id is the Clerk sub but deliberately NOT a profiles(id) foreign key:
-- these rows are ephemeral infrastructure (10-minute TTL, deleted on use), not
-- user data, and an FK would pull them into the account-export/delete surface
-- that every profiles(id) reference is required to cover. Account deletion needs
-- no cascade here — the rows expire and are swept within minutes.
create table if not exists oauth_states (
  state      text        primary key,
  user_id    text        not null,
  provider   text        not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Expired states are never consumable (checked on consume) and are swept on the
-- next issue; indexed for both.
create index if not exists oauth_states_expires_idx on oauth_states (expires_at);

-- ---------------------------------------------------------------------------
-- RLS: enabled with NO policy => deny-all for anon/authenticated. Backend only.
-- ---------------------------------------------------------------------------
alter table rate_limit_counters      enable row level security;
alter table webhook_processed_events enable row level security;
alter table oauth_states             enable row level security;
