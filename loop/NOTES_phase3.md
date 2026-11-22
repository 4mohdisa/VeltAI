# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.
Work only on loop/phase3. Agents never run git commands. Never run Prettier (no config in repo; it rewrites whole files).

## State
- Phase 1 and 2 merged into main (b096ed3).
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL). Details loop/BASELINE_phase3.md.
- Round 15 checkpoint: tsc 0; app Jest 136 suites, 995 tests pass, 0 skipped.
- Full suite NOT run since round 15. Round 30 checkpoint is running now.
- Jest pinned ~29.7.0. Never upgrade. Stray top-level node_modules/jest 30.0.5 and @types/jest ^30 are parked.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local backend only: Colima Postgres 127.0.0.1:55432. DATABASE_URL not set in shell.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only (empty states, workout plus button, new Settings screens).
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial, no trial when buying straight away, web checkout later.
- Crash reporting Sentry. Analytics PostHog. Names and counts only, never food, health or body values.
- Analytics on by default with anonymous ID, off switch in Settings (brief). Store default is off (DECISIONS.md 2026-08-09): conflict for Isa to confirm before Phase 4.
- Row 3: keep header plus on My workouts as the only way to add a second workout.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Fixes for hook errors go in the shared hook, not per screen.
- A flagged report is re-verified as its own round, unless the row changed no code and the brief gives nothing to run.
- A flagged report on a PARTIAL row whose checks passed: continue with the next hook; no separate re-verify round.
- A prompt missing a required rule: re-issue the same row, not a new task.
- A prompt the loop rejects for covering more than one screen or component: re-issue as one component per round.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email. Seed code not in server image.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.

## Done
- Rounds 1 to 4: row list (PHASE3_ROWS.md), Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5 to 6: Row 3 BUILT, owner check pending.
- Rounds 7 to 10: Row 4 audit (EMPTY_STATES_AUDIT.md), rows 12 to 17 added, Row 4 BUILT.
- Rounds 11 to 13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13 to 29: Row 12 PARTIAL. useHydration loading fix; isError on useApi, useToday, useTemplates, useSchedule, useExercises, useGymPatterns, useExerciseProgress (all six gymSchedule hooks report errors).

## Blocked on Isa
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL and E2E_PASSWORD. Blocks row 6 heavy-user checks and row 9 export check. Parked, not asking again.
- Analytics default on (brief) vs store off (DECISIONS.md 2026-08-09). Default used. Confirm before Phase 4.
- Templates '+' replaced by a list control? Unanswered. Keep '+' (row 3).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest install drift: node_modules/jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run (tests/food, tests/gym_schedule, tests/scan). Needs LUME_TEST_DATABASE_URL.
- es.json: addMenu.voice and addMenu.describeOutLoud missing in en and fr.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx:36-38).
- Ask Lume drops server 503 message (src/app/ai-query.tsx:96).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'. Old data, not from the seed.
- Lint: gymSchedule.ts lines 41, 43 (react-hooks/refs); hooks.ts ~395 useWeeklyMacros (set-state-in-effect). Row 11 or park.
- Both gymSchedule test files use react-test-renderer (deprecated warning). Park.
- gymSchedule.ts header comment no longer matches code (all hooks report errors). Fix in Row 11.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- No screen reads isError yet: My workouts shows 'No workouts yet' on fetch failure. Row 14.
- No test for useExercises and useExerciseProgress refetch when inputs change. Row 12.
- Food log copy: 'Tap + to add your first meal' shows on past days. Row 13.

## Next
- Round 30: checkpoint, full tsc and full app Jest, no file changes (running).
- Row 12 close-out: useEnergyRange error flag, insights API errors, ErrorState and PendingSyncBanner copy.
- Row 13: Food tab empty state tests (Add meal opens /food/add, hidden when entries exist).
- Rows 14 to 17 (empty state follow-ups).
- Row 6 (performance): non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10 (export, help), then Row 11 (final sweep).