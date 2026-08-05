-- Covering indexes for every foreign key that lacked one (2026-08-06 audit).
-- At one-tester scale these change nothing; they exist so cascades and the
-- owner-filtered joins the backend runs on every request never degrade to
-- sequential scans as data grows.

create index if not exists gym_adherence_template_id_idx      on gym_adherence (template_id);
create index if not exists gym_exercises_exercise_library_idx on gym_exercises (exercise_library_id);
create index if not exists gym_sessions_template_id_idx       on gym_sessions (template_id);
create index if not exists recipes_user_id_idx                on recipes (user_id);
create index if not exists scan_corrections_session_id_idx    on scan_corrections (scan_session_id);
create index if not exists scan_sessions_food_log_id_idx      on scan_sessions (food_log_id);
create index if not exists template_exercises_exercise_id_idx on template_exercises (exercise_id);
create index if not exists workout_schedule_template_id_idx   on workout_schedule (template_id);
