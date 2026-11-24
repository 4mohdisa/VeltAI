# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features: Sign in with Apple, account deletion, AI consent and limits, subscriptions with RevenueCat, retention, notifications, HealthKit, privacy manifest, store content), then test everything hard for about a week with no input from Isa. Progress is counted from PHASE4_ROWS.md (does not exist yet, the first task creates it).

## State at start (24 Nov 2026)
- Branch loop/phase4 starts from loop/phase3 (Phase 3 finished there, not merged into main yet).
- Phase 3 gates: tsc 0 errors, Jest 241 suites and 1,386 tests pass, Go 34 packages ok, 20 TestPG tests skipped (no LUME_TEST_DATABASE_URL). Node 22 LTS. Jest pinned ~29.7.0.
- Read loop/NOTES_phase3.md Parked list and OWNER_CHECKS_phase3.md before row 2.
- Phase 3 stopped with Rows 6, 13 and 14 PARTIAL (needed src/lib/data edits). Row 2 of Phase 4 does that work. Isa approved edits in src/lib/data and pinned test edits when the change is intended (record it). Set those rows BUILT in PHASE3_ROWS.md when done.

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- RevenueCat only, no Stripe. No free tier, 7 day Apple trial with every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, at most 30 a day, logged in AI_TEST_LOG.md.
- Sentry crashes, PostHog analytics names and counts only.
- Launch soon is the goal: no major UI changes, fix flaws and flows on any screen, design sign up, sign in, onboarding and new Phase 4 screens fresh. Use the Mobbin MCP fully for references, log them in DESIGN_REFERENCES.md. Park big visual ideas as post launch UI items. Never copy a real app.
- Row 14b: design intent audit, flows and defaults only, never restyle (Tesler's law idea from a video Isa watched).
- Isa wants user feedback data: row 14a adds thumbs up and down after features plus a Settings feedback screen, in every profile.

## Done
Rows 2c and 2d were built by hand by Isa with Claude Code on 25 Nov 2026. Verify with the tests and mark them BUILT in PHASE4_ROWS.md.

## Blocked on Isa
(nothing yet)

## Parked
(nothing yet)

## Next
Task 1: create PHASE4_ROWS.md (34 rows, including 2b sign up and onboarding redesign, 14a feature feedback and 14b design intent audit) and OWNER_CHECKS_phase4.md. Then Row 1 (foundation and local Postgres), Row 2 (Phase 3 leftovers).
