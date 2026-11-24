-- Australian Food Composition Database (FSANZ AFCD), per 100 g.
--
-- Shared reference data, loaded by backend/tools/afcd from the official
-- "Nutrient profiles" Excel file (see legal/AFCD_LICENCE.md for the licence
-- and attribution). Food search reads it first so Australian foods rank above
-- overseas sources. Nutrients the file leaves blank stay null.

create table if not exists afcd_foods (
  food_key    text primary key,          -- AFCD Public Food Key, e.g. F002258
  food_name   text not null,
  energy_kj   numeric not null check (energy_kj >= 0), -- energy with dietary fibre, equated
  protein_g   numeric check (protein_g >= 0),
  fat_g       numeric check (fat_g >= 0),
  carbs_g     numeric check (carbs_g >= 0), -- available carbohydrate, with sugar alcohols
  fibre_g     numeric check (fibre_g >= 0),
  release     text not null,             -- e.g. "AFCD Release 3"
  imported_at timestamptz not null default now()
);

-- Same posture as cuisine_food_library: authenticated read, no direct API
-- writes (the importer writes as table owner, which bypasses RLS).
alter table afcd_foods enable row level security;

drop policy if exists "read afcd foods" on afcd_foods;
create policy "read afcd foods" on afcd_foods
  for select to authenticated using (true);
