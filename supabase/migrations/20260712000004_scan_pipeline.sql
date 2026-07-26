-- Hardened scan pipeline: async food_logs need a status lifecycle
-- (analyzing → ready → confirmed) and a place to stash the per-region
-- pipeline output. Additive and idempotent; existing rows default to
-- 'confirmed' so nothing changes for the synchronous scan/manual paths.
alter table food_logs add column if not exists status text not null default 'confirmed';
alter table food_logs add column if not exists scan_results jsonb;
