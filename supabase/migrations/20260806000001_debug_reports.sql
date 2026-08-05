-- Debug reports captured on-device during internal TestFlight testing.
--
-- This is a SECONDARY copy: the device writes every report to its own
-- filesystem first and syncs opportunistically, so nothing here is load-bearing
-- and a failed insert never costs the tester a report.
--
-- The screenshot is stored as base64 text rather than in object storage: the
-- volume is one tester for a week or two, and a second storage dependency for
-- that is not worth it. If this ever outgrows a single tester, move `screenshot`
-- to a bucket and keep the row.

create table if not exists debug_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references profiles(id) on delete cascade,
  -- The device-generated id. Unique per user so a retried sync is a no-op
  -- rather than a duplicate row (the client retries whenever it regains signal).
  client_id     text not null,
  created_at    timestamptz not null default now(),
  captured_at   timestamptz not null,
  title         text not null,
  notes         text not null default '',
  severity      text not null,
  kind          text not null,
  area          text not null,
  trigger       text not null,
  route         text not null default '',
  app_version   text not null default '',
  build_number  text not null default '',
  resolution    text not null default 'open',
  -- The full ReportContext: console tail, API trace, breadcrumbs, store slice.
  -- Credentials are redacted on the DEVICE before this is ever written.
  context       jsonb not null default '{}'::jsonb,
  screenshot    text,
  unique (user_id, client_id)
);

create index if not exists debug_reports_user_created_idx
  on debug_reports (user_id, captured_at desc);

alter table debug_reports enable row level security;

-- Same posture as every other user table: the Go backend connects with the
-- service role and enforces ownership in SQL; these policies are the belt to
-- that braces for any direct PostgREST access.
--
-- user_id is a Clerk id (text), so the owner check is auth.jwt()->>'sub' like
-- every other table — NOT auth.uid(), which returns uuid and fails to compare.
drop policy if exists "debug_reports_select_own" on debug_reports;
drop policy if exists "debug_reports_insert_own" on debug_reports;
drop policy if exists "debug_reports_update_own" on debug_reports;
drop policy if exists "debug_reports_delete_own" on debug_reports;
drop policy if exists "own rows" on debug_reports;
create policy "own rows" on debug_reports
  for all using (user_id = (select auth.jwt() ->> 'sub'));

grant select, insert, update, delete on debug_reports to authenticated;
grant all on debug_reports to service_role;
