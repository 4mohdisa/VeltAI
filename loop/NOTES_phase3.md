# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.
Work only on loop/phase3. Agents never run git commands. Never run Prettier (no config; it rewrites whole files).
Every prompt must state the loop/phase3 branch rule.

## State
- Phase 1 and 2 merged into main (b096ed3).
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Round 30 checkpoint clean. Next full checkpoint: round 45, or when Row 12 is complete if that comes first.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local backend only: Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Stray node_modules/jest 30.0.5 and @types/jest ^30 are parked.
- Component render tests must be *.render.test.tsx.
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
- useEnergyRange isError is true only when both week reads fail. Default used.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email. Seed code not in server image.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts (mountHook, readHook built on it).
- A flagged report is re-verified as its own round, unless the row changed no code and the brief gives nothing to run.
- A flagged report on a PARTIAL row whose checks passed: continue with the next item; no separate re-verify round.
- A flagged report that leaves a caller broken (unhandled rejection) is fixed in the next round, not re-verified.
- A prompt missing a required rule: re-issue the same row, not a new task.
- A prompt the loop rejects for covering more than one screen or component: re-issue as one component per round.

## Done
- Rounds 1 to 4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5 to 6: Row 3 BUILT, owner check pending.
- Rounds 7 to 10: Row 4 audit BUILT (EMPTY_STATES_AUDIT.md); rows 12 to 17 added.
- Rounds 11 to 13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13 to 29: Row 12 PARTIAL. useHydration loading fix; isError on useApi, useToday, useTemplates, useSchedule, useExercises, useGymPatterns, useExerciseProgress.
- Round 30: checkpoint clean.
- Round 31: useEnergyRange returns isError. Clean.
- Round 32: getInsights rejects instead of swallowing (api.ts).
- Round 33: useInsights returns isError (aiBrain.ts).
- Round 34: ErrorState default copy in t() (en, es, fr), render test.
- Round 35: PendingSyncBanner copy in t() (en, es, fr), key pendingSync.waiting, render test.
- Round 36: useExercises and useExerciseProgress failure, recovery and input-change tests. mountHook added to the shared harness.
- Round 37: useEnergyRange one-week-fails test (energy.render.test.tsx). Passes, no source change.

## Blocked on Isa
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a way to sign in as a seed user (no local auth bypass). Blocks row 6 heavy-user checks and row 9 export check. Parked, not asking again.
- Analytics default on (brief) vs store off (DECISIONS.md 2026-08-09). Default used. Confirm before Phase 4.
- Templates '+' replaced by a list control? Unanswered. Keep '+' (row 3).
- useEnergyRange: confirm 'both weeks fail' rule. Default used.

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest install drift: node_modules/jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run (tests/food, tests/gym_schedule, tests/scan). Needs LUME_TEST_DATABASE_URL.
- es.json: addMenu.voice and addMenu.describeOutLoud extra keys.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx:36-38).
- Ask Lume drops server 503 message (src/app/ai-query.tsx:96).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'. Old data, not from the seed.
- Lint: gymSchedule.ts lines 41, 43 (react-hooks/refs); hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- Both gymSchedule test files use react-test-renderer (deprecated warning). Park.
- gymSchedule.ts header comment no longer matches code. Fix in Row 11.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- aiBrain.ts header does not mention useInsights isError. Park.
- useInsights mocks in render/insights.render.test.tsx and render/anomaly.render.test.tsx lack isError. Harmless until a screen reads it.
- detailChrome.render.test.tsx:79 useEnergyRange mock lacks isError. Harmless until a screen reads it.
- Anomalies stay empty when getInsights fails. Harmless: anomaly endpoint is empty today.
- getMorningBrief and getProfile swallow failures as null. Park.
- Food tab anomaly banner does not read isError. Later row.
- src/lib/i18n/index.ts comment says French 'intentionally partial'; probably stale. Park.
- No screen reads isError yet: My workouts shows 'No workouts yet' on fetch failure. Row 14.
- Food log copy: 'Tap + to add your first meal' shows on past days. Row 13.
- Energy one-week-fails: failed earlier week path untested; no test that refetch after error clears isError. Row 12 follow-up.
- Both-weeks-failed, useEnergyRange: confirm rule (see Blocked).

## Next
- Round 38: useApi loading on input change (Row 12, shared hook, with a test).
- Then: full checkpoint (tsc and full Jest) when Row 12 is complete or at round 45, whichever comes first.
- Row 13: Food tab empty state tests (Add meal opens /food/add, hidden when entries exist).
- Rows 14 to 17 (empty state follow-ups).
- Row 6 (performance): non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10 (export, help), then Row 11 (final sweep).