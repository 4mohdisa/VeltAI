# Lume Loop Notes: Phase 3

## Goal
Polish and quality before the Apple side (Phase 4). Empty states, remove the workout plus button, real performance fixes, dummy data testing, crash reporting, private analytics, export my data, in app help and feedback. Progress is counted from PHASE3_ROWS.md in the repo root.

## State at start (21 Nov 2026)
- Phase 1 and Phase 2 merged into main (commit b096ed3). Branch loop/phase3 starts from main.
- Baseline on main: type check 0 errors; app Jest 134 suites pass and 1 skipped, 990 tests pass and 3 skipped. Backend baseline recorded by row 2.
- Jest pinned to ~29.7.0 (jest-expo 56 is on Jest 29). Do not upgrade.
- Occasional jest worker SIGSEGV is Node 24.16 GC crash. Rerun passes. Row 1 moves to Node 22 LTS.
- App runs against the LOCAL backend. 47 Phase 2 rows are BUILT with owner check pending.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- Phase 1 design is final. Exceptions: named Phase 3 rows only (empty states, workout plus button, new Settings screens).
- Phase 4 (Apple side) NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, retention, notifications, HealthKit, store content. Park any idea about them.
- For Phase 4 later (do not build now): RevenueCat for payments, no free tier, 7 day Apple trial with every feature, no trial when buying straight away, web checkout later on a separate website.
- Crash reporting is Sentry. Analytics is PostHog. Events carry names and counts only, never food, health or body values.
- Analytics on by default with an anonymous ID, off switch in Settings. Isa to confirm before Phase 4.
- Isa verifies on a device himself.

## Done
- Round 1: Task 1 (row list) issued.

## Blocked on Isa
(nothing yet)

## Parked (not Phase 3)
(nothing yet)

## Next
- Task 1 result check. Then Row 1 (Node 22 LTS), then Row 2 (baseline gates).
- Then Row 3 (workout plus button), then Row 5 (seed data), then Row 4 and follow ups (empty states), then Row 6 (performance).
- Then Rows 7 and 8 (Sentry, PostHog), then Rows 9 and 10 (export, help), then Row 11 (final sweep).