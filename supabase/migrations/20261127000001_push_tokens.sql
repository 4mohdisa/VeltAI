-- Device push tokens (PHASE4_ROWS.md row 10c). One row per device token, bound
-- to the account that last registered it: a device that signs in to another
-- account moves its token to that account. Only the token and the platform are
-- stored. Sending push is a hosted step and is not part of this table.

create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references profiles(id) on delete cascade,
  token       text not null unique check (char_length(token) between 1 and 512),
  platform    text not null check (platform in ('ios', 'android')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on push_tokens (user_id);

alter table push_tokens enable row level security;

-- Same posture as every other user table: the Go backend connects with the
-- service role and enforces ownership in SQL; this policy covers any direct
-- PostgREST access. user_id is a Clerk id (text), so the owner check is
-- auth.jwt()->>'sub', not auth.uid().
drop policy if exists "own rows" on push_tokens;
create policy "own rows" on push_tokens
  for all using (user_id = (select auth.jwt() ->> 'sub'));

grant select, insert, update, delete on push_tokens to authenticated;
grant all on push_tokens to service_role;
