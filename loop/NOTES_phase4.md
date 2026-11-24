# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features: Sign in with Apple, account deletion, AI consent and limits, RevenueCat subscriptions, retention, notifications, HealthKit, privacy manifest, store content), then test everything hard for about a week with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State (24 Nov 2026)
- Branch loop/phase4 from loop/phase3 (Phase 3 not merged into main).
- Phase 3 gates: tsc 0 errors, Jest 241 suites and 1,386 tests pass, Go 34 packages ok, 20 TestPG skipped (no LUME_TEST_DATABASE_URL). Node 22 LTS. Jest pinned ~29.7.0.
- Phase 3 Rows 6, 13, 14 are PARTIAL, handled in Phase 4 Row 2.
- PHASE4_ROWS.md created (36 rows, all DIFFERENT). Progress line fixed to 0 of 36 this round.

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. Sign up, sign in, onboarding and new Phase 4 screens may be designed fresh. Use Mobbin MCP for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Row 14a feedback chips in every profile, production included. Row 14b design intent audit: flows and defaults only.
- Rows 2c and 2d (built by hand by Isa, 25 Nov 2026) are extra rows, BUILT only after their tests pass.
- Prompts must ask for one screen, component or file each. Multi part work is split into rounds.
- Progress line counts all 36 table rows (decided round 4).

## Done
- Round 1: row list prompt rejected (too many components).
- Round 2: prompt rejected again (asked for more than one component).
- Round 3: PHASE4_ROWS.md created, one file only, no code changes.
- Round 4: progress line said 0 of 33 but table has 36 rows. Fixed to 0 of 36.

## Blocked on Isa
(nothing)

## Parked
(nothing)

## Next
- Round 5: create OWNER_CHECKS_phase4.md (empty list with header), one file only.
- Round 6: Row 1 (foundation), one step per round: branch and Node check, gitignore check, gates and BASELINE_phase4.md, local Postgres 17, lume_test_local, the 20 TestPG tests.
- Then Row 2 (Phase 3 leftovers) in small steps, then 2b, then 3 to 14b, then 15 to 30, then 31.

## Problems noticed, not fixed
- loop/DECISIONS_LOG.md and loop/NOTES_phase4.md were modified and uncommitted at the start of round 4. Left alone for the loop script.

LATEST CLAUDE CODE REPORT:
(none yet)

LOOP NOTE:
(none)