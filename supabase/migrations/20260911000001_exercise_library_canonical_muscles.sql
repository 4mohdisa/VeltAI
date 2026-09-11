-- D1: exercise_library muscle groups are canonical lowercase, and now provably so.
--
-- muscle_volume_map (and every muscle view built on it) is keyed by
-- exercise_library.muscle_group_primary, so two spellings of one muscle
-- ("Back" / "back") would render as two muscles. The seed has only ever
-- written the twelve lowercase values below, but nothing ENFORCED that: the
-- columns had no constraint, and the seed's ON CONFLICT refreshed only
-- met_value and parameter_schema, so a legacy or hand-inserted row with any
-- other spelling would have survived every restart.
--
-- This migration normalises whatever is already there (a no-op on a library the
-- seed built) and then makes any other value impossible. It fails loudly if a
-- row carries a muscle that is not one of the twelve even after lower-casing —
-- that row needs a human, not a silent guess.

update exercise_library
   set muscle_group_primary = lower(btrim(muscle_group_primary))
 where muscle_group_primary is distinct from lower(btrim(muscle_group_primary));

update exercise_library
   set muscle_groups_secondary = coalesce(
         (select array_agg(distinct lower(btrim(m))) from unnest(muscle_groups_secondary) as m),
         '{}')
 where exists (
         select 1 from unnest(muscle_groups_secondary) as m
          where m is distinct from lower(btrim(m)));

alter table exercise_library drop constraint if exists exercise_library_muscle_primary_canonical;
alter table exercise_library add constraint exercise_library_muscle_primary_canonical
  check (muscle_group_primary in (
    'chest', 'back', 'quadriceps', 'hamstrings', 'glutes', 'shoulders',
    'biceps', 'triceps', 'core', 'calves', 'cardio', 'full_body'));

alter table exercise_library drop constraint if exists exercise_library_muscle_secondary_canonical;
alter table exercise_library add constraint exercise_library_muscle_secondary_canonical
  check (muscle_groups_secondary <@ array[
    'chest', 'back', 'quadriceps', 'hamstrings', 'glutes', 'shoulders',
    'biceps', 'triceps', 'core', 'calves', 'cardio', 'full_body']::text[]);
