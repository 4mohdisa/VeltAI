# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.
Work only on loop/phase3. Agents never run git. Never run Prettier (no config; it rewrites whole files).
Every prompt must state the loop/phase3 branch rule.

## State
- Phase 1 and 2 merged into main (b096ed3).
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Last full run in handover: 142 suites, 1013 tests. About 16 tests added since, so the checkpoint needs fresh numbers.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local backend only: Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Stray node_modules/jest 30.0.5 and @types/jest ^30 are parked.
- Component render tests must be *.render.test.tsx. Plain .test.ts runs in node project.
- Jest output: use tail, not grep (grep sometimes prints nothing).
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
- One component per round for prompts that cover screens or components.
- A flagged report is re-verified as its own round, unless the row changed no code and the brief gives nothing to run.
- A flagged report on a PARTIAL row whose checks passed: continue with the next item.
- A flagged report that leaves a caller broken (unhandled rejection) is fixed in the next round.
- A prompt missing a required rule, or rejected for scope: re-issue the same row, not a new task.
- Food tab error state (round 42) is recorded under row 13, not row 14.

## Done
- Rounds 1 to 4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5 to 6: Row 3 BUILT, owner check pending.
- Rounds 7 to 10: Row 4 audit BUILT (EMPTY_STATES_AUDIT.md); rows 12 to 17 added.
- Rounds 11 to 13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13 to 38: Row 12 plumbing (isError on hooks, useApi loading fix, useEnergyRange isError, getInsights rejects, ErrorState and PendingSyncBanner copy via t()).
- Round 41: row 12 re-verified clean.
- Round 42: Food tab reads isError from useInsights; shows ErrorState when it fails (food.anomalyError.render.test.tsx). Works, but useInsights runs twice (AnomalyBanner also calls it). Fix in row 13.

## Blocked on Isa
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a way to sign in as a seed user (no local auth bypass). Blocks row 6 heavy-user checks and row 9 export check. Parked, not asking again.
- Analytics default on (brief) vs store off (DECISIONS.md 2026-08-09). Default used. Confirm before Phase 4.
- Templates '+' replaced by a list control? Unanswered. Keep '+' (row 3).
- useEnergyRange: confirm 'both weeks fail' rule. Default used.
- Row 12 BUILT approval: waiting for checkpoint result.

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest install drift: node_modules/jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run (tests/food, tests/gym_schedule, tests/scan). Needs LUME_TEST_DATABASE_URL.
- es.json: addMenu.voice and addMenu.describeOutLoud extra keys.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx:36-38).
- Ask Lume drops server 503 message (src/app/ai-query.tsx:96).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'. Old data, not from the seed.
- Lint: gymSchedule.ts lines 50, 52 (react-hooks/refs); hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- Both gymSchedule test files use react-test-renderer (deprecated warning). Park.
- gymSchedule.ts header comment no longer matches code. Fix in Row 11.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- aiBrain.ts header does not mention useInsights isError. Park.
- Mocks lacking isError: useInsights in render/insights.render.test.tsx and render/anomaly.render.test.tsx; useEnergyRange in render/detailChrome.render.test.tsx:79.
- Anomalies stay empty when getInsights fails. Harmless: anomaly endpoint is empty today.
- getMorningBrief and getProfile swallow failures as null. Park.
- src/lib/i18n/index.ts comment says French 'intentionally partial'; probably stale. Park.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings. Passes. Park.
- Energy one-week-fails: failed earlier week path untested; no test that refetch after error clears isError. Parked.
- Food tab useInsights has no refetch, so no Retry button on its error state. Park.
- allText helper in render/helpers crashes on full-screen trees (circular JSON). Park.

## Next
- Round 43: checkpoint. Full tsc and full app Jest, no file changes. Report counts and failures.
- Row 13: AnomalyBanner takes anomalies and isError as props from food.tsx (removes duplicate useInsights). One component, one round. Then: 'Tap + to add your first meal' on past days; Food tab empty-state tests (Add meal opens /food/add, hidden when entries exist).
- Row 14: Gym log and history empty states, one screen per round, including remaining screens that read isError.
- Rows 15 to 17 (empty state follow-ups).
- Row 6 (performance): non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10 (export, help), then Row 11 (final sweep).