# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features: Sign in with Apple, account deletion, AI consent and limits, RevenueCat subscriptions, retention, notifications, HealthKit, privacy manifest, store content), then test everything hard, with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3 (Phase 3 not merged into main).
- Phase 3 gates: tsc 0 errors, Jest 241 suites and 1,386 tests pass, Go 34 packages ok. Node 22 LTS. Jest pinned ~29.7.0.
- Round 8 baseline (BASELINE_phase4.md): tsc 0 errors, Jest 242 suites and 1,397 tests pass, Go 34 packages ok. TestPG: 21 of 21 now run on lume_test_local (localhost:5432, Postgres 17), 0 skipped.
- Row 1 is BUILT.
- Row 2 is PARTIAL. Sub steps: 2a hydrateGym (in progress), 2b to 2e open.
- Rows 2c and 2d (hand built, commit e0c184d) are still marked DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md has 5 open checks under 'Rows 2c and 2d' (AFCD licence, AFCD load per database, Gemini billing cap, LUME_TIMEZONE, read AI_COSTS.md). Never overwrite or empty it.

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- Only localhost:5432 / lume_test_local for tests. Never touch the ssh tunnel on 127.0.0.1:55432 (may reach hosted data).
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. Sign up, sign in, onboarding and new Phase 4 screens may be designed fresh. Use Mobbin MCP for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Row 14a feedback chips in every profile, production included. Row 14b design intent audit: flows and defaults only.
- Rows 2c and 2d are extra rows, BUILT only after their tests pass.
- Prompts ask for one screen, component or file each. Multi part work is split into rounds.
- Prompts have at most 5 numbered steps (loop rule).
- Progress line counts all 36 table rows.
- When Jev confidence is low, prefer the smaller task.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- AI_TEST_LOG.md and FEEDBACK_SUMMARY.md are git ignored.
- OWNER_CHECKS option (a) chosen in round 8 (keep as is).
- Row 1 TestPG count is 21 (round 9).
- Decide, do not ask (round 7 report asked a question; prompts forbid it).

## Done
- Round 1-2: row list prompts rejected (too many components).
- Round 3: PHASE4_ROWS.md created.
- Round 4: progress line fixed to 0 of 36.
- Round 5: OWNER_CHECKS prompt rejected (no branch rule).
- Round 6: OWNER_CHECKS_phase4.md already existed (5 real checks).
- Round 7: Row 1 step 1 (branch, Node, gitignore for backend/.env, AI_TEST_LOG.md, FEEDBACK_SUMMARY.md).
- Round 8: Row 1 step 2 (gates, BASELINE_phase4.md).
- Round 9: Row 1 step 3 (local Postgres 17, lume_test_local, 21 of 21 TestPG pass). Row 1 BUILT.
- Round 10: Row 2a prompt sent (hydrateGym limit, before and after numbers).

## Blocked on Isa
(nothing)

## Parked
(nothing)

## Next
- Round 10 result: Row 2a. Check before and after numbers in BASELINE_phase4.md.
- Then Row 2b (other Phase 3 leftovers in small steps: gym schedule LIMIT order, WHERE id::text, error swallowing, feature_used allowlist, etc.), then Row 2 translations and Retry states (2c area), then 2 to 14b, then 15 to 30, then 31.
- Rows 2c and 2d verification when Row 2 is done.

## Problems noticed, not fixed
- ssh tunnel on 127.0.0.1:55432: unknown target. The 2c/2d owner check uses this port. Isa should confirm what it reaches before running the AFCD importer.
- Postgres runs as a brew service (starts at login). Database setup (roles, schema, 18 migrations) is manual. Rows 17 and 26 should script it.
- KNOWN_ISSUES.md line 40 still says 20 TestPG tests skip. It is 21 and they run. Fix in Row 2e.
- Jest prints React act(...) warnings from ScanReviewCard and an 'API unreachable' warning from src/lib/data/hooks.ts. Not failing. Look at them in Row 22.
- loop/DECISIONS_LOG.md and loop/NOTES_phase4.md had uncommitted changes. Left alone for the loop script.
- Jev rated ask higher than run. Ignored (ask is not allowed).