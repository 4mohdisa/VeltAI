-- Help and feedback messages sent from Settings (PHASE3_ROWS.md row 10).
--
-- Only what the user typed, the category they picked, and — when they turn the
-- switch on — the app version and device model. No headers, IP address, logs,
-- tokens or email are ever stored here.

create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references profiles(id) on delete cascade,
  category      text not null check (category in ('bug', 'idea', 'account', 'other')),
  message       text not null check (char_length(btrim(message)) between 1 and 2000),
  app_version   text,
  device_model  text,
  created_at    timestamptz not null default now()
);

create index if not exists feedback_user_created_idx
  on feedback (user_id, created_at desc);

alter table feedback enable row level security;

-- Same posture as every other user table: the Go backend connects with the
-- service role and enforces ownership in SQL; this policy covers any direct
-- PostgREST access. user_id is a Clerk id (text), so the owner check is
-- auth.jwt()->>'sub', not auth.uid().
drop policy if exists "own rows" on feedback;
create policy "own rows" on feedback
  for all using (user_id = (select auth.jwt() ->> 'sub'));

grant select, insert, update, delete on feedback to authenticated;
grant all on feedback to service_role;
