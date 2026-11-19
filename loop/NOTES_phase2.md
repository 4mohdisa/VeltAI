# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md (72 rows).

## State
- Phase 1 finished. Work on branch loop/phase2 (from loop/design-match).
- Baselines: app 65 suites / 824 tests / 4 snapshots (green), backend 632 pass plus 18 TestPG_* run against local DB (green).
- Safety check PASSED (round 1): API base http://localhost:8080. Local DB 127.0.0.1:55432, Postgres 16, disposable container left running. No hosted Supabase, Clerk or RevenueCat found. Only .env.example templates in repo.
- Local DB has throwaway lume_gate_test database, auth stubs and all 16 migrations applied.
- Docker compose plugin not installed. Use plain docker run or docker-compose.
- Row count: 72 (20 core/other, 2 Phase 1 leftovers, 41 visual QA, 9 motion).
- Row 22 (baseline) BUILT.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.
- Round 1: Task 1 run instead of asking, since the check is read only and stops itself on any production hit.
- Round 2: row 22 (baseline) chosen over Goals and Subscription. Later rows depend on green gates.
- Round 2: Screen.tsx prettier diff checked against HEAD, clean.
- Round 2: TestPG tests run only after DSN confirmed as 127.0.0.1:55432.
- Round 2: plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data, decide when row is reached. Not blocking.
- Round 3: local setup chosen over Goals and Subscription. Every simulator flow depends on it.
- Round 3: Clerk sign in needing hosted Clerk is parked as owner step, no workaround.
- Round 3: seed data in backend/scripts/seed_local.sql, local DB only.

## Done
- Task 1: PHASE2_ROWS.md created (72 rows).
- Row 22 baseline: BUILT.

## Blocked on Isa
- Nothing yet. Sign in may need owner step if Clerk is hosted-only.

## Parked (not v1)
- Scope decision for plan.tsx and AI anomaly banner (no backend capability).
- Merging loop/design-match into main: Isa's job.
- Docker compose plugin install (owner step, optional).
- Applying migrations to hosted Supabase: Isa's job.

## Next
- Local setup row (round 3, in progress).
- Then Goals row: wire client to /api/goals.
- Then Subscription row: wire client to /api/subscription.
- Then core flows: sign in, onboarding, food logging, gym logging, goals and profile, rest.
- Then motion pass, then backend refinement rows.

## Known issues
- Goals and Subscription screens have working backend endpoints that the client never calls.
- Sign in test user needs E2E_EMAIL and E2E_PASSWORD from env. Park dependent flows if missing.