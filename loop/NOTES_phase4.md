# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3 (Phase 3 not merged into main). Never work on main.
- Baseline (BASELINE_phase4.md): tsc 0, Jest 242 suites and 1,397 tests, Go 34 ok. TestPG 21 of 21 run on lume_test_local (localhost:5432, Postgres 17).
- Round 15 checkpoint: tsc 0, Jest 242 suites and 1,400 tests pass.
- Row 1 BUILT.
- Row 2 PARTIAL. Sub steps: 2.1 total gym days (PARTIAL: mocks fixed; assertion being strengthened; simulator check pending), 2.2 backend and data leftovers, 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (hand built, commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md has 5 open checks under 'Rows 2c and 2d'. Never overwrite or empty it.

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- Only localhost:5432 / lume_test_local for tests. Never touch the ssh tunnel on 127.0.0.1:55432.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. Sign up, sign in, onboarding and new Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Rows 2c and 2d are extra rows, BUILT only after their tests pass.
- Prompts ask for one screen, component or file each. Prompts have at most 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Row 2.1 total gym days comes from the database (total_days), not from the capped store.
- Row 2 sub steps are named 2.1 to 2.5 so they do not clash with rows 2b, 2c, 2d.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1.
- Fixture total_days is 20 where longest_streak is 20. Where longest_streak is 9, total_days is 9.
- Round 24: trust notes over the report's NEXT list.
- Round 25: targeted tests for 2.1, not the full suite. Full suite runs on checkpoint round 30.
- Round 26: the 1,000-session assertion could not tell a server total from a count of loaded sessions. Fixed by mocking total_days 365 and asserting 365. Reason: cheap one-file fix first, Jev risk high.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-20: hydrateGym limit 200, total_days on backend, GymStreak.total_days in app, streakFromApi takes only row, hooks.ts distinct count removed, stale mocks fixed.
- Rounds 21-24: dashboardSummary, hydrationErrorState, summaryHydration and productionReadiness got total_days on their API streak objects.
- Round 25: all callers of streakFromApi checked (one argument each). One total assertion added to productionReadiness.test.ts.

## Blocked on Isa
(nothing)

## Parked
(nothing)

## Next
- Round 26 (in progress): productionReadiness.test.ts total_days 365 and assert 365. Targeted tsc, Jest and eslint on that file.
- Round 27: Row 2.1 simulator check of the Total gym days tile (Gym, Profile, Streak) with a seeded user. Set 2.1 BUILT only after mocks and simulator both pass.
- Then Row 2.2: fix react-hooks/set-state-in-effect at src/lib/data/hooks.ts:400. Then src/app/food/history.tsx:66 listSessions limit, gym/schedule_pg.go LIMIT order, 49 WHERE id::text queries, getMorningBrief and getProfile error swallowing, feature_used allowlist, app_version vs build number, export as .json file, one exportData function, lint, npm audit with safe fix.
- Then 2.3 (translations and Retry), 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Row 2b, 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- src/app/food/history.tsx:66 still calls listSessions() with no limit. Fix in 2.2.
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md when deploy is written).
- react-hooks/set-state-in-effect lint error at src/lib/data/hooks.ts:400. Fix in 2.2.
- ssh tunnel on 127.0.0.1:55432: unknown target. Isa should confirm before the AFCD importer runs.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- KNOWN_ISSUES.md line 40 says 20 TestPG tests skip. It is 21 and they run. Fix in 2.5.
- Jest prints React act(...) warnings from ScanReviewCard and an 'API unreachable' warning from hooks.ts. Look at them in Row 22.
- Jev risk high: keep steps to one file and check the gates each round.
- zsh: quote glob patterns and pass Jest file lists via printf '%s\0' with xargs -0.