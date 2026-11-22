# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.

## State (21 Nov 2026)
- Phase 1 and 2 merged into main (b096ed3). Branch loop/phase3 from main.
- Baseline on main: type check 0 errors; app Jest 134 suites pass, 1 skipped; 990 tests pass, 3 skipped. Backend baseline recorded by row 2.
- Jest pinned to ~29.7.0. Do not upgrade.
- Occasional jest worker SIGSEGV is Node 24.16 GC crash. Rerun passes. Row 1 moves to Node 22.
- App runs against LOCAL backend. 47 Phase 2 rows BUILT with owner check pending.
- Uncommitted files not ours: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md. Do not touch.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only (empty states, workout plus button, new Settings screens).
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial, no trial when buying straight away, web checkout later.
- Crash reporting Sentry. Analytics PostHog. Names and counts only, never food, health or body values.
- Analytics on by default with anonymous ID, off switch in Settings. Isa to confirm before Phase 4.
- Isa verifies on a device himself.

## Done
- Round 1: Task 1 (row list) issued. PHASE3_ROWS.md created with 11 rows, all DIFFERENT.
- Round 2: flagged by loop check (type check or tests not run). Re-issued as Row 1 with type check and tests on Node 22, plus format check of PHASE3_ROWS.md.

## Blocked on Isa
(nothing yet)

## Parked (not Phase 3)
(nothing yet)

## Next
- Row 1 (Node 22 LTS) result check.
- Row 2 (baseline gates).
- Row 3 (workout plus button), then Row 5 (seed data).
- Row 4 and follow ups (empty states), then Row 6 (performance).
- Rows 7 and 8 (Sentry, PostHog), then Rows 9 and 10 (export, help), then Row 11 (final sweep).

## Open checks
- If Row 1 report flags a missing step again, treat it as a prompt issue and re-issue the row, not a new task.