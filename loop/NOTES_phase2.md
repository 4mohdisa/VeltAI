# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES, not numbers.

## State
- Branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines (round 16 checkpoint, green): app tsc 0 errors; Jest 69 suites / 833 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* against local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session). No hosted Supabase, Clerk or RevenueCat in repo.
- Backend: go run ./cmd/server. Auth enforced (401 without token). Plain docker run, no compose plugin.
- Prompt scope rule: ONE component per prompt.

## Wording rule
- Row cells say BUILT, 'checked in code' or 'owner check pending'. Never verified, verify, verifies, confirmed, confirm. Exception: code identifiers (api.scan.confirm).
- Reports use the same wording.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope locked, extra ideas go to Parked.
- Phase 1 design final, do not restyle screens.
- Isa verifies on a device himself.
- TestPG tests run only after DSN confirmed as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign in needs hosted Clerk JWKS. Owner step, no workaround, no auth bypass.
- Order of work: Food log before Gym log.
- Simulator flows needing sign in are owner steps. Rows BUILT on passing local mocked Jest and Go tests.
- Prompts must state the branch rule.
- loop/ files are loop-managed. Prompts never edit them.
- Row 75 split into food log and gym log.
- Row 77 (gym log entries) target file is src/app/gym/session.tsx. Scope widened by manager.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup, baseline: BUILT.
- Food log, Gym log, Gym history: BUILT. Simulator owner check pending.
- Gym templates, schedule, muscles, exercise progress, freeze: checked in code, no gap.
- Gym streak, Goals, Paywall/Subscription: BUILT.
- Profile: checked in code, no gap.
- Add food, Legal: BUILT (static).
- Dashboard / Summary and sub-pages: BUILT.
- Motion audit, screen and navigation transitions: BUILT.
- Adding and removing list items, food log entries: BUILT.
- Progress rings (Summary EnergyBalanceCard) and number changes: BUILT. Eases to new value.
- Round 16 baseline checkpoint: gates green.

## Blocked on Isa
- Sign in: backend verifies tokens against hosted Clerk JWKS. Owner step.
- E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend. Product decision: build plan generation or drop the card for v1.
- loop/ files show uncommitted diffs. Loop-managed, not a task.
- Merging loop/design-match into main: Isa's job.

## Parked (not v1)
- Food log: long press to delete a meal is not discoverable. Design call.
- Goals: 'Saved as you type' is untrue when a value is clamped silently.
- Dead code: subscriptionFromApi and AppSubscription in src/lib/data/mappers.ts. Remove in cleanup pass.
- Account and index settings both link to Delete Account.
- Copy pass: 'owner check pending' reads awkwardly after a noun phrase.
- Stale motion rows 65-72 overlap later motion rows. Fold or delete (Isa decision).
- onboarding/_layout.tsx ignores Reduce Motion. One-line fix.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps. Product decision.
- Watch: transient Jest worker SIGSEGV on resetRegistry.test.ts.

## Next
- Round 21 (running): 'Progress bars ease to new values' (ProgressBar.tsx only).
- Then: 'Daily macro ring eases to new values' (DailyMacroRing.tsx).
- Then: row 77 gym session remove path (src/app/gym/session.tsx).
- Then Phase 1 visual QA rows (sign in dependent ones are owner steps), then backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign in is solved.
- logGymSession create has no id-reconciliation callback (logMeal has registerMealCreate). Review in the Gym log rework.
- Jev risk 1.4 of 2 (confidence 0.40): keep tasks small.