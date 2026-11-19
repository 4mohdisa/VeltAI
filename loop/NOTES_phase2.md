# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md (73 rows). Prompts use row TITLES, not numbers.

## State
- Work on branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines (round 11 gate): app tsc 0 errors; Jest 68 suites / 832 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* against local DB.
- Safety check PASSED: API base http://localhost:8080. Local DB 127.0.0.1:55432, Postgres 16, container lume-test-pg (started manually each session). No hosted Supabase, Clerk or RevenueCat in repo; only .env.example templates.
- Local DB: lume_gate_test and lume databases, auth stubs, all 16 migrations applied. Seed: backend/scripts/seed_local.sql (idempotent, local only).
- Backend runs via go run ./cmd/server. /health 200. Auth enforced (401 without token).
- Docker compose plugin not installed. Use plain docker run.

## Wording rule
- Rows say BUILT or 'checked in code' or 'owner check pending'. Never 'verified', 'verify', 'verifies', 'confirmed' or 'confirm' in row cells. Exception: literal code identifiers (api.scan.confirm).
- Reports use the same wording. Reports must not claim a screen is verified.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.
- Row 22 baseline first; later rows depend on green gates.
- TestPG tests run only after DSN confirmed as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign in needs hosted Clerk (JWKS). Parked as owner step, no workaround, no auth bypass.
- Order of work: Food log before Gym log.
- Simulator flows that need sign in are owner steps. Rows are BUILT on passing local mocked Jest and Go tests.
- Prompts must state the branch rule.
- Jev ranking followed for Goals, Subscription, Profile. Round 10 chose wording pass over Dashboard/Summary.
- Round 11 chose gate check first (auto-check flagged round 10 as ungated).
- loop/ files are loop-managed. Prompts never edit them. Uncommitted diffs there are reported, not fixed.

## Done
- Task 1: PHASE2_ROWS.md created.
- Local setup, baseline: BUILT.
- Food log, Gym log, Gym history: BUILT. Simulator owner check pending.
- Gym templates, schedule, muscles, exercise progress, freeze: checked in code, no gap.
- Gym streak: BUILT. Fabricated upcoming-days removed.
- Goals: BUILT. hydrateGoals, server-first useEffectiveGoals.
- Paywall / Subscription: BUILT. hydrateSubscription / entitlementFromApi.
- Profile: checked in code, no gap.
- Add food, Legal: BUILT (static).
- Wording pass (round 10): 25 cells reworded in PHASE2_ROWS.md.
- Round 11 gate: passed, no code changed.

## Blocked on Isa
- Sign in: backend verifies tokens against hosted Clerk JWKS. Needs owner step (local verifier or test issuer).
- E2E_EMAIL and E2E_PASSWORD not set in environment.

## Parked (not v1)
- Scope decision for plan.tsx and AI anomaly banner.
- Food log: long press to delete a whole meal (confirmDeleteMeal) is not discoverable. Design call for Isa.
- Goals: 'Saved as you type' copy (en.json:82) is untrue when a value is clamped silently.
- Dead code: subscriptionFromApi and AppSubscription in src/lib/data/mappers.ts unused. Remove in a cleanup pass.
- Account and index settings both link to Delete Account. Consider consolidating later.
- Copy pass: 'owner check pending' phrasing in row cells reads awkwardly after a noun phrase.
- Merging loop/design-match into main: Isa's job.
- Docker compose plugin install (owner step, optional).
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps (no 3D body stage, no per-muscle lists, 'Last 30 days' vs design 'Last 7 days'). Product decision.
- Streak 'Freezes' derived as freeze_used ? 0 : 1. Revisit only if design wants more.
- Watch: one transient Jest worker SIGSEGV on resetRegistry.test.ts (round 8). Recheck if it recurs.
- Uncommitted diffs in loop/DECISIONS_LOG.md and loop/NOTES_phase2.md seen after round 11. Loop-managed, check in next report.

## Next
- Round 12: Dashboard and Summary route and field comparison (row 16).
- Then: plan.tsx stays parked (product decision). Then remaining PARTIAL or DIFFERENT core rows, motion pass, backend refinement rows.

## Known issues
- Authenticated flows cannot be exercised end to end until sign in is solved.
- logGymSession create has no id-reconciliation callback (logMeal has registerMealCreate). A queued session create landing after navigation may leave the optimistic row. Review in the Gym log rework.
- Gym history and Summary re-hydrate from server on view. Confirm in code, do not change without a failing case.
- Long-press meal delete in food.tsx flagged twice (see Parked).
- Jev risk 1.3 of 2 (low confidence): keep tasks small.