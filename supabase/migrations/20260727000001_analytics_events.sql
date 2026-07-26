-- First-party analytics events. No third-party SDKs: the app POSTs a small
-- allow-listed set of events to /api/analytics/events and they land here.
-- user_id always comes from the verified Clerk JWT, never the request body.

create table if not exists analytics_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references profiles(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}',
  session_id text not null default '',
  client_ts  timestamptz,
  server_ts  timestamptz not null default now()
);

-- Per-user timelines and per-event funnels, newest first.
create index if not exists analytics_events_user_idx  on analytics_events (user_id, server_ts desc);
create index if not exists analytics_events_event_idx on analytics_events (event_name, server_ts desc);

-- RLS: owner-only, keyed on the Clerk `sub` claim (same pattern as all user tables).
alter table analytics_events enable row level security;

create policy "own rows" on analytics_events for all to authenticated
  using (user_id = (select auth.jwt()->>'sub'))
  with check (user_id = (select auth.jwt()->>'sub'));
