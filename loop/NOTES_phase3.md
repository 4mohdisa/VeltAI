# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.
Work only on loop/phase3. Agents never run git. Never run Prettier. Every prompt states the loop/phase3 branch rule.

## State
- Phase 1 and 2 merged into main (b096ed3).
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 50: tsc 0; Jest 147 suites, 1029 tests, 0 failed, 0 skipped, 4 of 4 snapshots.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local backend only: Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade.
- Component render tests must be *.render.test.tsx. Plain .test.ts runs in node project.
- Jest output: write to file, then tail. Not grep.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings (brief). Store default off (DECISIONS.md 2026-08-09): conflict for Isa to confirm before Phase 4.
- Row 3: keep header plus on My workouts as the only way to add a second workout.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Fixes for hook errors go in the shared hook, not per screen.
- useEnergyRange isError is true only when both week reads fail. Default used.
- Food tab error state recorded under row 13. AnomalyBanner takes anomalies, isError, onDismiss props; food tab screen makes the only useInsights call.
- phase14Regression reads the food tab screen for useInsights.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- One component per round for prompts that cover screens or components.
- A flagged report is re-verified as its own round, unless the row changed no code. A row already re-verified once is not re-verified again; carry on with its next open item.
- A prompt missing a required rule, or rejected for scope: re-issue the same row.
- Round 48: row 12 set back to PARTIAL per handover (BUILT needs Isa approval).
- Round 48: useInsights refetch and Retry stay parked (not in any row).
- Round 50: full checkpoint chosen over row 13. Edits allowed only to the three named mock files (isError: false).
- Round 51: same flagged blocker (row 12 approval) came back twice. Recorded under Blocked on Isa, not retried.
- Round 52: row 13 re-verified as its own round. Row 13 stays PARTIAL.
- Round 53: flag on round 52 again. Row 13 PARTIAL by design. Not re-verified a third time.
- Round 54: past-day error test added in foodTab.emptyStates.render.test.tsx (test only, row 13 scope). Then rerun the 12 Food tab suites, since food.tsx changed.

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done (gymSchedule hooks return isError, useApi loading on refetch, useEnergyRange isError, getInsights rejects with ApiError, ErrorState and PendingSyncBanner copy in en, es, fr).
- Round 42: Food tab ErrorState when useInsights fails.
- Round 44: AnomalyBanner props. Round 45: phase14Regression reads the food tab screen.
- Round 46: full checkpoint passed. Round 47: docs cleanup.
- Round 48: mock isError fixes in detailChrome and insights render tests.
- Round 49: row 12 re-verified. Round 50: full checkpoint clean.
- Round 51: row 13 Food tab states: past-day empty message, foodTab.emptyStates render tests (4).
- Round 52: row 13 Food tab re-verified (12 suites, 130 tests, tsc 0).
- Round 53: past-day error copy (food.empty.loadFailedPast, food.loadFailedPast) in en, es, fr. Food tab uses one isPastDay value.

## Blocked on Isa
- Row 12 BUILT approval. Code done, checkpoint clean round 50. Stays PARTIAL until Isa approves. Do not retry, do not re-ask.
- Row 13 PARTIAL vs BUILT. Past-day wording "this day's food log" and "Nothing was logged on this day." Default used.
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed-user sign-in path. Blocks row 6 heavy-user checks and row 9 export check. Parked.
- Analytics default on (brief) vs store off (DECISIONS.md 2026-08-09). Default used. Confirm before Phase 4.
- Templates '+' replaced by a list control? Unanswered. Keep '+' (row 3).
- useEnergyRange: confirm 'both weeks fail' rule. Default used.

## Next
- Round 54: past-day error test and rerun of the 12 Food tab suites.
- Row 13: SavedMealsList and RecipesList error states, PendingSyncBanner on Food tab, 'No meals yet' on a past day, then saved, calendar, detail, barcode and translations.
- Row 14: Gym log and history empty states, one screen per round.
- Rows 15 to 17: empty state follow-ups.
- Full checkpoint on its scheduled round.
- Row 6: non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10, then Row 11 (final sweep).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest install drift: node_modules jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run (tests/food, tests/gym_schedule, tests/scan). Needs LUME_TEST_DATABASE_URL.
- es.json extra keys addMenu.voice and addMenu.describeOutLoud.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx).
- Ask Lume drops server 503 message (src/app/ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- Lint: gymSchedule.ts lines 50, 52 (react-hooks/refs); hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- react-test-renderer deprecated warning in gymSchedule test files.
- Stale header comments: aiBrain.ts, gymSchedule.ts, and 'French intentionally partial' in src/lib/i18n/index.ts. Park.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- useInsights has no refetch, so no Retry on error states. Park.
- allText helper in render/helpers crashes on full-screen trees (circular JSON). Use findAll with string children. Park the helper fix.
- getMorningBrief and getProfile swallow failures as null. Park.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings. Park.
- Energy one-week-fails path untested; no test for refetch clearing isError. Park.
- Anomalies stay empty when getInsights fails. Harmless today.
- Food tab mounts useInsights with no consent gate (pure database read, pinned in phase14Regression). Park.
- Other Food tab tests run in round 54 only; no full checkpoint since food.tsx changed in round 53.