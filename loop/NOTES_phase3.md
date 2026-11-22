# Lume Loop Notes: Phase 3

## Goal
Polish and quality before Phase 4. Progress is counted from PHASE3_ROWS.md in the repo root.

## State
- Phase 1 and 2 merged into main (b096ed3). Work on branch loop/phase3 only.
- Phase 3 baseline (Node 22.23.5): tsc 0 errors; app Jest 135/135 suites, 993 tests pass; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL). Details in loop/BASELINE_phase3.md.
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
- Row 3: keep the header plus on My workouts as the only way to add a second workout.
- Goals and units stay in memory in Phase 3. Row 15 fixes the 'Saved as you type' copy. Backend persistence parked.
- A flagged report is re-verified as its own round, unless the row changed no code and the brief gives nothing to run.
- Seed tooling: backend/tools/seed, localhost-only host guard (pgx host check), reset deletes only seed_ ids with @example.test email. Seed code is not in the server image.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD is missing, park as owner step (brief rule).
- Loop note: unanswered question means use default and carry on. Do not re-ask the same question.

## Done
- Round 1: Task 1 (row list). PHASE3_ROWS.md created, 11 rows.
- Round 2: Row 1 (Node 22) BUILT.
- Round 4: Row 2 (baseline gates) BUILT.
- Round 5 and 6: Row 3 closed BUILT with owner check pending.
- Round 7: Row 4 audit written to EMPTY_STATES_AUDIT.md. Rows 12 to 17 added (DIFFERENT).
- Rounds 8 to 10: Row 4 re-verified, closed BUILT (audit only, no code).
- Round 11: Row 5 part 1 (seed and reset, 5 Go tests pass, seed ran on local DB).
- Round 12: Row 5 re-verify clean.
- Round 13: Row 5 closed BUILT with owner check pending (Maestro part parked).
- Round 13: Row 12 issued (Food log empty state).

## Blocked on Isa
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL and E2E_PASSWORD in the shell. Blocks Row 6 heavy-user simulator checks and Row 9 export test on seeded heavy user. Asked in rounds 12 and 13, no answer. Parked. Not asking again.
- Row 12 simulator flow: depends on sign-in. Unit tests only until Isa answers.
- Row 3: header plus on My workouts kept by default. Not blocking.
- Analytics default: store says off, brief says on. Default used (brief). Confirm before Phase 4.

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest install drift: node_modules/jest reads 30.0.5, pin is 29.7.0. Fix with npm ci (needs network).
- @types/jest ^30.0.0 while Jest is pinned to 29.7. Revisit in Row 11.
- 18 backend DB tests never run (tests/food 4, tests/gym_schedule 7, tests/scan 7). Needs LUME_TEST_DATABASE_URL.
- No test covers the header plus on My workouts. Add in Row 11 sweep.
- es.json: addMenu.voice and addMenu.describeOutLoud missing in en and fr.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx:36-38).
- Ask Lume drops server 503 message (src/app/ai-query.tsx:96).
- Row 15 note still says goals persistence needs a decision. Update when row 15 is worked (decision: no persistence, fix copy).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in cleanup.
- Old local rows mix 'lunch' and 'Lunch' meal names. Old data, not from the seed.

## Next
- Row 12 (Food log empty state), in progress.
- Row 6 (performance): non-sign-in backend measurements.
- Rows 13 to 17 (empty state follow-ups).
- Rows 7 and 8 (Sentry, PostHog), then Rows 9 and 10 (export, help), then Row 11 (final sweep).