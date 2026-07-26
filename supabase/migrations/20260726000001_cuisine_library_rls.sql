-- Security-audit fix: cuisine_food_library was the only table without RLS.
-- Shared reference data — same posture as exercise_library: authenticated
-- read, no direct API writes (the backend seeds it as table owner, which
-- bypasses RLS).
alter table cuisine_food_library enable row level security;

create policy "read cuisine library" on cuisine_food_library
  for select to authenticated using (true);
