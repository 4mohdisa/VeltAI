-- Paid AI calls per user per UTC day (PHASE4_ROWS.md row 5). One row per user
-- per day, counted by internal/aiquota after a successful Gemini or Claude
-- call and capped by LUME_AI_DAILY_LIMIT. Only a count is stored: no prompt,
-- answer, image or food value.
--
-- Not rate_limit_counters: its sweep deletes windows older than two minutes,
-- which would reset a daily count within minutes.

create table if not exists ai_daily_usage (
  user_id  text not null references profiles(id) on delete cascade,
  day      date not null,
  count    int  not null default 0 check (count >= 0),
  primary key (user_id, day)
);

-- RLS enabled with NO policy: deny-all for anon and authenticated, so a user
-- cannot reset their own count through PostgREST. Backend only.
alter table ai_daily_usage enable row level security;

grant all on ai_daily_usage to service_role;
