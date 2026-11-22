# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.

## State
- Phase 1 and 2 merged into main (b096ed3). Work on branch loop/phase3 only.
- Phase 3 baseline (Node 22.23.5): tsc 0 errors; app Jest 135/135 suites, 993 tests pass; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL). Details in loop/BASELINE_phase3.md.
- Jest pinned to ~29.7.0. Do not upgrade.
- Node 22 is the target. .nvmrc (22) and engines >=22 <23 added. Default shell Node is still 24, so use nvm use 22.
- App runs against LOCAL backend. 47 Phase 2 rows BUILT with owner check pending.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.
- Open check: package-lock.json does not yet record the engines field. Check in Row 11.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only (empty states, workout plus button, new Settings screens).
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial, no trial when buying straight away, web checkout later.
- Crash reporting Sentry. Analytics PostHog. Names and counts only, never food, health or body values.
- Analytics on by default with anonymous ID, off switch in Settings. Isa to confirm before Phase 4.
- Isa verifies on a device himself.
- A prompt missing a required rule is a prompt issue: re-issue the same row, not a new task.
- Row 3: keep the header plus on My workouts as the only way to add a second workout. Removal question parked in Blocked on Isa.

## Done
- Round 1: Task 1 (row list). PHASE3_ROWS.md created, 11 rows.
- Round 2: Row 1 (Node 22) BUILT.
- Round 3: Row 2 prompt rejected (missing branch rule). Re-issued.
- Round 4: Row 2 (baseline gates) BUILT.
- Round 5: Row 3 report had no checks run (loop flag). Row 3 set to PARTIAL, question parked.
- Round 6: Re-running Row 3 close: type check and templates tests, mark BUILT with owner check pending.

## Blocked on Isa
- Row 3: the header plus on My workouts (src/app/gym/templates.tsx) is kept as the only way to add a second workout. Option to remove it and add a New workout card at the end of the list (existing Card component) needs your approval. Default: keep it.

## Parked (not Phase 3)
- Jest install drift: node_modules/jest reads 30.0.5, pin is 29.7.0. Fix with npm ci (needs network). Tests use the 29.7.0 copy inside jest-expo.
- @types/jest ^30.0.0 while Jest is pinned to 29.7. Revisit in Row 11.
- 18 backend DB tests never run (tests/food 4, tests/gym_schedule 7, tests/scan 7). Needs local Postgres via LUME_TEST_DATABASE_URL. Row 5 may provide one.

## Next
- Row 4 (empty states audit, read only). Include hard-coded English in templates.tsx and gym.tsx:160 as follow-ups.
- Row 5 (seed data), then Row 6 (performance).
- Rows 7 and 8 (Sentry, PostHog), then Rows 9 and 10 (export, help), then Row 11 (final sweep).
- Row 11 also covers: package-lock engines field, @types/jest mismatch, Jest drift.