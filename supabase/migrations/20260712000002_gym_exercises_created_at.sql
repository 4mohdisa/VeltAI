-- Preserve insertion order of exercises within a session (uuid order is random).
alter table gym_exercises add column created_at timestamptz not null default now();
