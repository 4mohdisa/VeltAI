# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.
Work only on loop/phase3. Agents never run git. Never run Prettier. Every prompt states the loop/phase3 branch rule.

## State
- Phase 1 and 2 merged into main (b096ed3).
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 46: tsc 0; Jest 147 suites, 1029 tests, 0 failed, 0 skipped, 4 of 4 snapshots.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local backend only: Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade.
- Component render tests must be *.render.test.tsx. Plain .test.ts runs in node project.
- Jest output: use tail, not grep.
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
- phase14Regression reads the food tab screen for useInsights (round 45).
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- One component per round for prompts that cover screens or components.
- A flagged report is re-verified as its own round, unless the row changed no code.
- A prompt missing a required rule, or rejected for scope: re-issue the same row.
- Round 48: row 12 set back to PARTIAL per handover (BUILT needs Isa approval).
- Round 48: useInsights refetch and Retry stay parked (not in any row).
- Round 49: row 12 notes cell rewritten from handover summary (git history not reachable by agents).

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done (gymSchedule hooks return isError, useApi loading on refetch, useEnergyRange isError, getInsights rejects with ApiError, ErrorState and PendingSyncBanner copy in en, es, fr).
- Round 42: Food tab ErrorState when useInsights fails.
- Round 44: AnomalyBanner props.
- Round 45: phase14Regression reads the food tab screen.
- Round 46: full checkpoint passed.
- Round 47: docs cleanup (phase14 comment, ai/index.ts comment, row 13 stale note).
- Round 48: mock isError fixes in detailChrome and insights render tests. Report flagged as partly done.

## Blocked on Isa
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed-user sign-in path. Blocks row 6 heavy-user checks and row 9 export check. Parked, not asking again.
- Analytics default on (brief) vs store off (DECISIONS.md 2026-08-09). Default used. Confirm before Phase 4.
- Templates '+' replaced by a list control? Unanswered. Keep '+' (row 3).
- useEnergyRange: confirm 'both weeks fail' rule. Default used.
- Row 12 BUILT approval: Isa to approve. Status is PARTIAL until then.

## Next
- Round 49: re-verify row 12 (tsc and the three render tests), fix row 12 notes line.
- Round 50: full checkpoint (tsc, full Jest) for row 12.
- Row 13: Food tab empty-state tests; 'Tap + to add your first meal' on past days.
- Row 14: Gym log and history empty states, one screen per round. No screen reads isError yet.
- Rows 15 to 17: empty state follow-ups.
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
- Stale header comments: aiBrain.ts, gymSchedule.ts. Park.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- useInsights has no refetch, so no Retry on error states. Park.
- allText helper in render/helpers crashes on full-screen trees (circular JSON). Park.
- getMorningBrief and getProfile swallow failures as null. Park.
- src/lib/i18n/index.ts says French 'intentionally partial'; probably stale. Park.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings. Park.
- Energy one-week-fails path untested; no test for refetch clearing isError. Park.
- Anomalies stay empty when getInsights fails. Harmless today.