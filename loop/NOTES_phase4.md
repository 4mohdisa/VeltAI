# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features: Sign in with Apple, account deletion, AI consent and limits, RevenueCat subscriptions, retention, notifications, HealthKit, privacy manifest, store content), then test everything hard, with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3 (Phase 3 not merged into main).
- Phase 3 gates: tsc 0 errors, Jest 241 suites and 1,386 tests pass, Go 34 packages ok.
- Round 8 baseline (BASELINE_phase4.md): tsc 0 errors, Jest 242 suites and 1,397 tests pass, Go 34 packages ok. TestPG: 21 of 21 run on lume_test_local (localhost:5432, Postgres 17).
- Row 1 is BUILT.
- Row 2 is PARTIAL. Sub steps: 2.1 hydrateGym and total days, 2.2 backend and data leftovers, 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 everything else in Phase 3 leftovers.
- Row 2.1 backend done: GET /api/gym/streak and freeze return total_days (distinct dates, no cap), with Go tests (round 12).
- Row 2.1 app: GymStreak type gets total_days (round 13). Next: Total tile and streakFromApi mapper read it.
- Rows 2c and 2d (hand built, commit e0c184d) are still DIFFERENT. Verify and set status later.
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
- Decide, do not ask.
- Row 2.1 total gym days comes from the database (GET /api/gym/streak total_days), not from the capped store. A correct total beats the cap (round 12).
- Row 2 sub steps are named 2.1 to 2.5 everywhere, so they do not clash with rows 2b, 2c, 2d (round 12).
- Loop flag on round 12 (partly done): accepted. Row 2.1 was split on purpose. Backend is complete, app type in round 13, tile and mapper in round 14.

## Done
- Round 1-2: row list prompts rejected (too many components).
- Round 3: PHASE4_ROWS.md created.
- Round 4: progress line fixed to 0 of 36.
- Round 5: OWNER_CHECKS prompt rejected (no branch rule).
- Round 6: OWNER_CHECKS_phase4.md already existed (5 real checks).
- Round 7: Row 1 step 1 (branch, Node, gitignore).
- Round 8: Row 1 step 2 (gates, BASELINE_phase4.md).
- Round 9: Row 1 step 3 (local Postgres 17, 21 of 21 TestPG pass). Row 1 BUILT.
- Round 10: Row 2.1 hydrateGym limit 200 (1000 to 200 sessions). Clean.
- Round 11: Row 2.1 follow up prompt rejected (asked for two components). Rewritten.
- Round 12: Row 2.1 total_days on backend. Clean on backend, Go race tests pass.

## Blocked on Isa
(nothing)

## Parked
(nothing)

## Next
- Round 13: add total_days to GymStreak type in src/lib/api.ts (app type only).
- Round 14: read total_days in streakFromApi (src/lib/data/mappers.ts) and switch the Total gym days tile (Gym, Profile, Streak) to it. One file per round where possible.
- Then Row 2.2 (Phase 3 backend and data leftovers): gym/schedule_pg.go LIMIT order (oldest first then LIMIT 30 is wrong), 49 WHERE id::text queries, getMorningBrief and getProfile error swallowing, feature_used allowlist, app_version vs build number, export as .json file, one exportData function, lint, npm audit with safe fix.
- Then 2.3 (translations and Retry: gymRange, monthTitle, muscle cards, exercise progress, summaryCards, nutrition kcal label), 2.4 (useGoals isLoading, error, refetch, goals screen states, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted through backend, missing _one plural, goals.saved).
- Then Row 2b (sign up redesign, Mobbin check), 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.
- Rows 2c and 2d verification when Row 2 is done.

## Problems noticed, not fixed
- food/history.tsx:66 still calls listSessions() with no limit. Fix in 2.2 or 2.5.
- One react-hooks/set-state-in-effect lint error at src/lib/data/hooks.ts:405. Fix in 2.2 lint step.
- ssh tunnel on 127.0.0.1:55432: unknown target. The 2c/2d owner check uses this port. Isa should confirm what it reaches before running the AFCD importer.
- Postgres runs as a brew service. Database setup (roles, schema, 18 migrations) is manual. Rows 17 and 26 should script it.
- KNOWN_ISSUES.md line 40 still says 20 TestPG tests skip. It is 21 and they run. Fix in Row 2.5.
- Jest prints React act(...) warnings from ScanReviewCard and an 'API unreachable' warning from src/lib/data/hooks.ts. Not failing. Look at them in Row 22.
- loop/DECISIONS_LOG.md and loop/NOTES_phase4.md had uncommitted changes. Left alone for the loop script.
- Jev rated ask higher than run. Ignored (ask is not allowed).
- Next action confidence was low (0.46) in round 10. Keep tasks small.
- Jev risk 0.9 (round 13): keep steps small and check the gates each round.