# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md (72 rows).

## State
- Phase 1 finished. Work on branch loop/phase2 (from loop/design-match).
- Baselines: app 65 suites / 823 tests, backend 632 pass.
- Safety check PASSED (round 1): API base http://localhost:8080 (EXPO_PUBLIC_API_URL unset). Backend port 8080. Local DB host db -> 127.0.0.1:55432, Postgres 16, disposable. No hosted Supabase, Clerk or RevenueCat found. No real .env files, only .env.example templates.
- Row count: 72 (20 core/other, 2 Phase 1 leftovers, 41 visual QA, 9 motion).

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.
- Round 1: Task 1 run instead of asking, since the check is read only and stops itself on any production hit.
- Round 2: row 22 (baseline) chosen over Goals and Subscription wiring. Needs nothing from Isa, and later rows depend on green gates.
- Round 2: Screen.tsx prettier diff checked against HEAD inside the baseline round.
- Round 2: TestPG tests run only after the DSN is confirmed as 127.0.0.1:55432.
- Round 2: plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data, decide when the row is reached. Not blocking.

## Done
- Task 1: PHASE2_ROWS.md created (72 rows).

## Blocked on Isa
- Nothing.

## Parked (not v1)
- Scope decision for plan.tsx and AI anomaly banner (no backend capability).
- Merging loop/design-match into main: Isa's job.

## Next
- Row 22 baseline (in progress, round 2).
- Then local seed data and sign in test user (E2E_EMAIL, E2E_PASSWORD from env only).
- Then Goals row: wire client to /api/goals. Then Subscription row: wire client to /api/subscription.
- Then core flows: sign in, onboarding, food logging, gym logging, goals and profile, rest.
- Then motion pass, then backend refinement rows.

## Known issues
- Screen.tsx may have an accidental prettier reformat (checking in row 22).
- Goals and Subscription screens have working backend endpoints that the client never calls.