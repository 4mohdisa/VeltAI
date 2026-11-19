# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md (73 rows). Prompts use row TITLES, not numbers (numbers drift).

## State
- Work on branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines: app tsc 0 errors, Jest 65 suites / 826 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* against local DB.
- Safety check PASSED: API base http://localhost:8080. Local DB 127.0.0.1:55432, Postgres 16, container lume-test-pg running. No hosted Supabase, Clerk or RevenueCat in repo; only .env.example templates.
- Local DB: lume_gate_test and lume databases, auth stubs, all 16 migrations applied. Seed in backend/scripts/seed_local.sql (idempotent, local only).
- Backend runs locally via go run ./cmd/server. /health 200. Auth enforced (401 without token).
- Docker compose plugin not installed. Use plain docker run.

## Wording rule
- Rows say BUILT or 'checked in code'. Never 'verified', 'verify', 'confirmed' or 'confirm' in row cells. Isa verifies.
- Reports must use the same wording. Reports are not row cells, but they must not claim a screen is verified.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.
- Row 22 baseline chosen first; later rows depend on green gates.
- TestPG tests run only after DSN confirmed as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign in needs hosted Clerk (JWKS). Parked as owner step, no workaround, no auth bypass.
- Order of work: Food log before Gym log.
- Simulator flows that need sign in are owner steps. Rows are BUILT on passing local mocked Jest and Go tests.
- Prompts must state the branch rule (stay on loop/phase2, no switch, push or merge).
- Jev ranked run 93% for Goals (chose Goals); run 88% for Subscription (chose Subscription); run 91% for Profile (chose Profile).
- Jev ranked Dashboard/Summary 80% for the round after Profile. Round 9 chose the checkpoint instead, because the loop script marks it as a checkpoint and the wording issue must be cleared first.

## Done
- Task 1: PHASE2_ROWS.md created.
- Local setup: done. Sign in step parked.
- Baseline: BUILT.
- Food log: BUILT. Simulator owner check pending.
- Gym log: BUILT. Simulator owner check pending.
- Gym history: BUILT. Simulator owner check pending.
- Gym templates, schedule, muscles, exercise progress, freeze: checked in code, no gap. Simulator owner check pending.
- Gym streak: BUILT. Fabricated upcoming-days removed. Simulator owner check pending.
- Goals: BUILT. hydrateGoals and server-first useEffectiveGoals. Render test added. Simulator owner check pending.
- Paywall / Subscription: BUILT. GET /api/subscription hydrated into serverEntitlement. Render test added (2 cases). Simulator owner check pending.
- Profile: checked in code, no gap (all routes and JSON fields match). Simulator owner check pending. Row wording to be checked (see Next).

## Blocked on Isa
- Sign in: backend verifies tokens against hosted Clerk JWKS. Needs owner step (local verifier or test issuer).
- E2E_EMAIL and E2E_PASSWORD not set in environment.

## Parked (not v1)
- Scope decision for plan.tsx and AI anomaly banner.
- Food log: long press to delete a whole meal (confirmDeleteMeal) is not discoverable. Design call for Isa.
- Goals: 'Saved as you type' copy (en.json:82) is untrue when a value is clamped silently. Fix later.
- Dead code: subscriptionFromApi and AppSubscription in src/lib/data/mappers.ts are unused. Remove in a cleanup pass.
- Account screen and index settings both offer Delete Account. Both are correct. Consider consolidating later.
- Merging loop/design-match into main: Isa's job.
- Docker compose plugin install (owner step, optional).
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer for simulator sign in: owner step.
- Wording: soft synonyms in rows 1, 3, 7 Simulator-flow cells. Covered by the Next wording pass.
- Watch: one transient Jest worker SIGSEGV on resetRegistry.test.ts (round 8). Recheck if it recurs.
- Muscles and exercise-progress screens: design gaps (no 3D body stage, no per-muscle exercise lists, 'Last 30 days' vs design 'Last 7 days'). Product decision for Isa.
- Streak stats 'Freezes' is derived as freeze_used ? 0 : 1. Revisit only if design wants more freezes.

## Next
- Round 9 (checkpoint): full tsc and full app Jest, no file changes.
- Then: reword any 'verified' or 'confirmed' wording in row cells (including Profile) to 'checked in code'. One row only.
- Then: Dashboard/Summary route and field comparison (rows 16 and 17).
- Then remaining PARTIAL or DIFFERENT core rows, motion pass, backend refinement rows.

## Known issues
- Authenticated flows cannot be exercised end to end until sign in is solved.
- logGymSession create has no id-reconciliation callback (logMeal has registerMealCreate). A queued session create landing after navigation may leave the optimistic row. Review when the Gym log row is reworked.
- Gym history and Summary re-hydrate from server on view. May be intended. Confirm in code, do not change without a failing case.
- Long-press meal delete in food.tsx flagged twice (see Parked).