# Lume Loop Notes: Phase 3

## Goal
Polish before Phase 4. Progress counted from PHASE3_ROWS.md. Work only on loop/phase3. Agents never run git or Prettier. Every prompt states the branch rule. One screen or component per prompt.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 58: tsc 0; 150 suites, 1038 tests, 0 failed.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Component render tests are *.render.test.tsx.
- Jest output: write to file, then tail. zsh: use xargs for multi-file runs.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings. Store default off (DECISIONS.md 2026-08-09): Isa to confirm before Phase 4.
- Row 3: keep header plus on My workouts as the only way to add a second workout.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook, not per screen.
- useEnergyRange isError is true only when both week reads fail. Default used.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Re-verify a flagged report as its own round only if the row changed code. Re-verified once is enough.
- Round 48: row 12 set back to PARTIAL until Isa approves BUILT.
- Round 48: useInsights refetch and Retry stay parked.
- Round 55: one screen or component per prompt.
- Round 58: checkpoint chosen over Jev's 93% Saved screen task.
- Round 59: Saved screen chosen. Failed load with nothing saved shows ErrorState with Retry. Default generic copy used.
- Round 60: calendar failed-load state chosen (Jev 98%, matches report NEXT). No concrete reason to deviate.

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done.
- Rounds 42-54: Row 13 Food tab states done.
- Rounds 56-57: Row 13 SavedMealsList and RecipesList load-failure states.
- Round 58: checkpoint clean.
- Round 59: Row 13 Saved screen load-failure state + 2 tests (savedScreen.render.test.tsx).

## Blocked on Isa
- Row 12 BUILT approval. Stays PARTIAL. Do not re-ask.
- Row 13 wording 'this day's food log' and 'Nothing was logged on this day.' unconfirmed. Default used.
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks row 6 heavy-user checks and row 9 export check.
- Analytics default on vs store off. Default used. Confirm before Phase 4.
- Templates '+' kept (row 3). useEnergyRange 'both weeks fail' rule default used.
- Saved, meals and recipes error copy: generic ErrorState copy used. Isa may pick specific copy ('Couldn't load your saved foods.').

## Next
- Round 60: Row 13 calendar failed-load state (ErrorState with Retry, not empty state). Tests in calendarScreen.render.test.tsx.
- Row 13 remaining: RecipesList translations (hardcoded English), detail, barcode, Food tab PendingSyncBanner, history.tsx translated error key.
- Row 14: Gym log and history empty states, one screen per round.
- Rows 15 to 17: empty state follow-ups.
- Row 6: non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10, then Row 11 (final sweep).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run. Needs LUME_TEST_DATABASE_URL.
- es.json extra keys addMenu.voice and addMenu.describeOutLoud.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx).
- Ask Lume drops server 503 message (src/app/ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- react-test-renderer deprecated warning in gymSchedule tests.
- Stale header comments: aiBrain.ts, gymSchedule.ts, saved.tsx '(mock)', 'French intentionally partial' in src/lib/i18n/index.ts.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- useInsights has no refetch, so no Retry. Park.
- allText crashes on full-screen trees (circular JSON). Use findAll. Park the helper fix.
- getMorningBrief and getProfile swallow failures as null. Park.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings. Park.
- Energy one-week-fails path untested. Park.
- Food tab mounts useInsights with no consent gate (pure database read, pinned in phase14Regression). Park.
- 'No meals yet' reads oddly on a past day. Park unless row 13 wording is approved.
- Compact LoadFailedNotice past-day text (food.loadFailedPast) has no test. Park.
- Food tab has no PendingSyncBanner, so offline looks like a plain error. Row 13 later item.
- src/app/food/history.tsx shows hardcoded English error text. Should be a translated key. Park.
- Shared render setup does not mock useFocusEffect or useLocalSearchParams; tests mock expo-router themselves (3+ files). Park.
- Saved screen tests and calendar tests: consider a shared expo-router mock helper in Row 11.