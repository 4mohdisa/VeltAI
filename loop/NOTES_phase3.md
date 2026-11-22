# Lume Loop Notes: Phase 3

## Goal
Polish and quality before the Apple side (Phase 4). Fix empty states, remove the workout plus button, fix performance properly, test with real dummy data, add crash reporting and private analytics, export my data, and in app help and feedback. Progress is counted from PHASE3_ROWS.md (does not exist yet, the first task creates it).

## State at start (21 Nov 2026)
- Phase 1 (design match) and Phase 2 (backend wiring, simulator tests, motion) are merged into main. Main was cleaned up and pushed (commit b096ed3). Branch loop/phase3 starts from main.
- Baseline on main: type check 0 errors; app Jest 134 suites pass and 1 skipped, 990 tests pass and 3 skipped; backend baseline is recorded by the baseline row.
- Jest is pinned to ~29.7.0 because jest-expo 56 is built on Jest 29. Do not upgrade it.
- Occasional "jest worker SIGSEGV" comes from Node 24.16 crashing in its garbage collector. A rerun passes. Row 1 moves the project to Node 22 LTS.
- App runs against the LOCAL backend. 47 Phase 2 rows are BUILT with "owner check pending" (Isa checks on his phone).

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- Phase 1 design is final. Exceptions are only the named Phase 3 rows (empty states, workout plus button, new Settings screens).
- Phase 4 (Apple side) is NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, retention, notifications, HealthKit, store content. Park any idea about them.
- For Phase 4 later (do not build now): RevenueCat for payments, no free tier, 7 day Apple trial with every feature, no trial when buying straight away, web checkout later on a separate website.
- Crash reporting is Sentry. Analytics is PostHog. Events carry names and counts only, never food, health or body values.
- Isa verifies on a device himself.

## Done
(nothing yet)

## Blocked on Isa
(nothing yet)

## Parked (not Phase 3)
(nothing yet)

## Next
Task 1: create PHASE3_ROWS.md. Task 2: Row 1 (Node 22 LTS) then the baseline gates.
