# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.

## State
- Phase 1 and 2 merged into main (b096ed3). Work on branch loop/phase3 only.
- Baseline (Node 22.23.5): tsc 0 errors; app Jest 135/135 suites, 993 tests pass; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL). Details in loop/BASELINE_phase3.md.
- Latest checkpoint (round 15): tsc 0 errors; app Jest 136 suites, 995 tests pass, 0 skipped. Next checkpoint round 30.
- Jest pinned to ~29.7.0. Do not upgrade.
- Node 22 is the target. Default shell Node is 24, so use nvm use 22.
- App runs against LOCAL backend (Colima Postgres at 127.0.0.1:55432). 47 Phase 2 rows BUILT with owner check pending.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.
- Open check: package-lock.json does not record the engines field. Check in Row 11.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only (empty states, workout plus button, new Settings screens).
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial, no trial when buying straight away, web checkout later.
- Crash reporting Sentry. Analytics PostHog. Names and counts only, never food, health or body values.
- Analytics on by default with anonymous ID, off switch in Settings (brief governs row 8). Store default is opt-in/off per DECISIONS.md 2026-08-09: conflict flagged for Isa to confirm before Phase 4.
- Isa verifies on a device himself.
- A prompt missing a required rule is a prompt issue: re-issue the same row, not a new task.
- A prompt the loop rejects for covering more than one screen or component: re-issue as one component per round.
- Row 3: keep the header plus on My workouts as the only way to add a second workout.
- Goals and units stay in memory in Phase 3. Row 15 fixes the 'Saved as you type' copy. Backend persistence parked.
- A flagged report is re-verified as its own round, unless the row changed no code and the brief gives nothing to run.
- Seed tooling: backend/tools/seed, localhost-only host guard (pgx host check), reset deletes only seed_ ids with @example.test email. Seed code is not in the server image.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD is missing, park as owner step (brief rule).
- Loop note: unanswered question means use default and carry on. Do not re-ask the same question.
- Agent must not run git commands (reminded in every prompt).
- No formatter config in repo. Do not run Prettier on files (round 19 drift).

## Done
- Round 1: Task 1 (row list). PHASE3_ROWS.md created, 11 rows.
- Round 2: Row 1 (Node 22) BUILT.
- Round 4: Row 2 (baseline gates) BUILT.
- Rounds 5 and 6: Row 3 BUILT with owner check pending.
- Round 7: Row 4 audit in EMPTY_STATES_AUDIT.md. Rows 12 to 17 added (DIFFERENT).
- Rounds 8 to 10: Row 4 re-verified, BUILT (audit only).
- Round 11: Row 5 part 1 (seed and reset, 5 Go tests pass, seed ran on local DB).
- Round 12: Row 5 re-verify clean.
- Round 13: Row 5 BUILT with owner check pending (Maestro part parked).
- Round 13: Row 12 partial. useHydration resets loading on Food day switch.
- Round 17: Row 12 useApi exported from src/lib/data/gymSchedule.ts, returns isError.
- Round 19: 3 refetch and revalidate isError tests (gymSchedule.revalidate.test.ts).
- Round 20: re-verify clean, 6 of 6 pass. Row 12 PARTIAL.
- Round 21: useToday returns isError (gymSchedule.useToday.test.ts, 2 tests). Flagged as partly done by loop check.
- Round 22 (issued): re-verify round 21 with no code change. Jev preferred useTemplates (82%); kept re-verify per the flagged-report rule.

## Blocked on Isa
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL and E2E_PASSWORD in the shell. Blocks Row 6 heavy-user simulator checks and Row 9 export test on seeded heavy user. Asked in rounds 12 and 13, no answer. Parked. Not asking again.
- Row 12 simulator flow: depends on sign-in. Unit tests only until Isa answers.
- Analytics default: store says off, brief says on. Default used (brief). Confirm before Phase 4.
- Replace templates '+' with a list control? Unanswered. Keep the '+' (Row 3 decision).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest install drift: node_modules/jest reads 30.0.5, pin is 29.7.0. Fix with npm ci (needs network).
- @types/jest ^30.0.0 while Jest is pinned to 29.7. Revisit in Row 11.
- 18 backend DB tests never run (tests/food 4, tests/gym_schedule 7, tests/scan 7). Needs LUME_TEST_DATABASE_URL.
- No test covers the header plus on My workouts. Add in Row 11 sweep.
- es.json: addMenu.voice and addMenu.describeOutLoud missing in en and fr.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx:36-38).
- Ask Lume drops server 503 message (src/app/ai-query.tsx:96).
- Row 15: fix copy only (decision: no goals persistence).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in cleanup.
- Old local rows mix 'lunch' and 'Lunch'. Old data, not from the seed.
- Lint error: useWeeklyMacros (src/lib/data/hooks.ts ~395) breaks react-hooks/set-state-in-effect. Not ours. Fix in Row 11 or park.
- Lint error: gymSchedule.ts lines 41 and 43 write refs during render (react-hooks/refs). Pre-existing. Park for Row 11.
- Food log copy: 'Tap + to add your first meal' shows on past days too. Fix under Row 13.
- Duplicate useApi test harness in two gymSchedule test files. Shared helper in Row 11 if a third copy appears.
- Row 12: useHydration other callers not yet verified. Covered by checkpoint, which passed.

## Next
- Round 22 (issued): re-verify useToday isError, no code change.
- Round 23: Row 12, pass isError through useTemplates (My workouts 'No workouts yet' false state).
- Row 12 remaining hooks, one per round: useSchedule, useExercises, useGymPatterns, useExerciseProgress.
- Row 13: Food tab empty state tests (Add meal opens /food/add, hidden when entries exist).
- Rows 14 to 17 (empty state follow-ups).
- Row 6 (performance): non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then Rows 9 and 10 (export, help), then Row 11 (final sweep).