# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md (73 rows).

## State
- Work on branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines: app 65 suites / 824 tests / 4 snapshots (green), backend 632 pass plus 18 TestPG_* against local DB (green).
- Safety check PASSED: API base http://localhost:8080. Local DB 127.0.0.1:55432, Postgres 16, container lume-test-pg running. No hosted Supabase, Clerk or RevenueCat in repo; only .env.example templates.
- Local DB: lume_gate_test and lume databases, auth stubs, all 16 migrations applied. Seed in backend/scripts/seed_local.sql (idempotent, local only).
- Backend running locally via go run ./cmd/server. /health 200. Auth enforced (401 without token).
- Docker compose plugin not installed. Use plain docker run.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.
- Row 22 baseline chosen first; later rows depend on green gates.
- TestPG tests run only after DSN confirmed as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data. Not blocking.
- Clerk sign in needs hosted Clerk (JWKS). Parked as owner step, no workaround, no auth bypass.
- Order of work: row 3 Food log before row 9 Gym log.
- Simulator flows that need sign in are owner steps. Rows are BUILT on passing local mocked Jest and Go tests.
- Prompts must state the branch rule (stay on loop/phase2, no switch, push or merge). Round 5 prompt was rejected for lacking it.

## Done
- Task 1: PHASE2_ROWS.md created.
- Row 22 baseline: BUILT.
- Row 73 Local setup: done. Sign in step parked.
- Row 3 Food log: BUILT (round 4). Simulator owner check pending.

## Blocked on Isa
- Sign in: backend verifies tokens against hosted Clerk JWKS. Needs owner step (local verifier or test issuer).
- E2E_EMAIL and E2E_PASSWORD not set in environment.

## Parked (not v1)
- Scope decision for plan.tsx and AI anomaly banner.
- Food log: long press to delete a whole meal (confirmDeleteMeal) is not discoverable. Design call for Isa.
- Merging loop/design-match into main: Isa's job.
- Docker compose plugin install (owner step, optional).
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer for simulator sign in: owner step.

## Next
- Round 5: row 9 Gym log (verify routes, client wiring, one mapping test). Prompt sent.
- Then Goals row (wire client to /api/goals) and Subscription row (wire client to /api/subscription).
- Then remaining core flows, motion pass, backend refinement rows.

## Known issues
- Goals and Subscription screens have backend endpoints the client never calls.
- Authenticated flows cannot be exercised end to end until sign in is solved.