# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines (round 23 checkpoint, green): app tsc 0 errors; Jest 73 suites / 847 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* against local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session). No hosted Supabase, Clerk or RevenueCat in repo.
- Backend: go run ./cmd/server. Auth enforced (401 without token).
- Prompt scope rule: ONE row AND one component or screen per prompt.

## Wording rule
- Row cells and reports say BUILT, 'checked in code' or 'owner check pending'. Never use the verification words (verified, verify, verifies, confirmed, confirm) except the code identifier api.scan.confirm.
- A row is BUILT only when every part is done. Partial work = PARTIAL.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope locked, extra ideas go to Parked.
- Phase 1 design final, do not restyle screens.
- Isa verifies on a device himself.
- TestPG tests run only after DSN is checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign in needs hosted Clerk JWKS. Owner step, no workaround, no auth bypass.
- Order of work: Food log before Gym log.
- Simulator flows needing sign in are owner steps. Rows BUILT on passing local mocked Jest and Go tests.
- Prompts must state the branch rule.
- loop/ files are loop-managed. Prompts never edit them.
- Row 75 split into food log and gym log.
- Row 77 target file is src/app/gym/session.tsx. Scope set by manager.
- Stale motion rows 65-72: fold or delete is Isa's decision.
- Row 9 scope widened to src/lib/offline/queue.ts for an additive optional onLanded on runOrQueueSequence.
- Row 35 'streak footnote at 320pt width' mapped to row 35.
- Rounds 31, 32, 33: Jev asks overridden with written reasons (minor, reversible, existing tests pass).
- Round 34: rejected prompt rewritten to one component (MuscleChart.tsx). One export keyword on isGymPatternsShape allowed to reuse the guard.
- Round 35: row 80 (muscles screen) guard is conditional on a reproduced crash. MuscleChart crash did not reproduce, so no edit without a failing test.
- Jev advice is advisory. Override only with a concrete reason, written in decisions.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup, baseline: BUILT.
- Food log, Gym history: BUILT (Gym history simulator owner check pending).
- Gym templates, schedule, muscles, exercise progress, freeze: checked in code, no gap.
- Gym streak, Goals, Paywall/Subscription: BUILT.
- Profile: checked in code, no gap.
- Add food, Legal: BUILT (static).
- Dashboard / Summary and sub-pages: BUILT.
- Motion audit, screen and navigation transitions: BUILT.
- Adding and removing list items, food log entries: BUILT.
- ProgressBar, EnergyBalanceCard, DailyMacroRing ease to new values: BUILT. Progress rings row closed.
- Gym log entries remove path (src/app/gym/session.tsx): BUILT, local only.
- Row 9 Gym log create reconciliation: BUILT. Simulator sign in part owner check pending.
- Rows 35 and 54 (streak footnote): BUILT, checked in code; simulator owner check pending.
- Row 78 Gym patterns card shape guard: BUILT (tests pass, no simulator run).
- Row 79 MuscleChart shape guard: BUILT (test passes; guard was not needed to stop a crash, recorded in row).
- Round 16, 23 checkpoints: gates green.
- Round 29: no change, task had no matching row.

## Blocked on Isa
- Sign in: backend checks tokens against hosted Clerk JWKS. Owner step.
- E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend. Product decision: build plan generation or drop the card for v1.
- loop/ files show uncommitted diffs. Loop-managed, not a task.
- Merging loop/design-match into main: Isa's job.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Stale motion rows 65-72 duplicate 64 and 74-77. Fold or delete.

## Parked (not v1)
- Gym patterns card: partially malformed object (for example {}) still crashes at .length. Small follow-up, own row.
- Food log: long press to delete a meal is not discoverable. Design call.
- Goals: 'Saved as you type' is untrue when a value is clamped silently.
- Dead code: subscriptionFromApi and AppSubscription in src/lib/data/mappers.ts.
- Account and index settings both link to Delete Account.
- Copy pass: 'owner check pending' reads awkwardly after a noun phrase.
- Rows 35 and 54 cover the same card and test file. Merge rows? Isa decision.
- onboarding/_layout.tsx ignores Reduce Motion. One-line fix.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps. Product decision.
- Watch: transient Jest worker SIGSEGV on resetRegistry.test.ts.

## Next
- Round 35: row 80 src/app/gym/muscles.tsx shape guard (one screen, guard only if a crash reproduces).
- Then: exercise-progress screen guard if it calls useGymPatterns or similar, parked partial-object guard as its own row, remaining Phase 1 visual QA rows (sign in dependent ones are owner steps), then backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign in is solved.
- Jev risk 1.0 of 2: keep tasks small, one row per round. Run the gate every round a row changes code.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Row 9 runOrQueueSequence onLanded is in place (queue.ts); keep it additive.