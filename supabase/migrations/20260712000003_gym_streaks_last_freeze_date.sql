-- Distinguish "day covered by a freeze" from "day trained" so a workout on a
-- frozen day refunds the freeze instead of silently losing its increment.
alter table gym_streaks add column last_freeze_date date;
