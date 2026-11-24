# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3 (Phase 3 not merged into main). Never work on main.
- Baseline (BASELINE_phase4.md): tsc 0, Jest 242 suites and 1,397 tests, Go 34 ok. TestPG 21 of 21 run on lume_test_local (localhost:5432, Postgres 17).
- Row 1 BUILT.
- Row 2 PARTIAL. Sub steps: 2.1 total gym days (PARTIAL: code and mocks done, simulator check parked), 2.2 backend and data leftovers, 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (hand built, commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md has open checks under 'Rows 2c and 2d' and one for the 2.1 simulator check. Never overwrite or empty it.

## Lint state (round 30 sweep)
- npx eslint src: 18 errors, 59 warnings in 37 of 464 files.
- 15 react-hooks/refs errors in app code: gymSchedule.ts:50,52; ProgressBar.tsx:31; DailyMacroRing.tsx; EnergyBalanceCard.tsx.
- 3 react/display-name errors in render tests: labelScan, photoScan, scanScreens.strings.
- 57 no-require-imports warnings (mostly tests), 1 import/first, 1 import/no-named-as-default-member (src/lib/i18n/index.ts:37).

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- Only localhost:5432 / lume_test_local for tests. Never touch the ssh tunnel on 127.0.0.1:55432.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. Sign up, sign in, onboarding and new Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Rows 2c and 2d are extra rows, BUILT only after their tests pass.
- Prompts ask for one screen, component or file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Row 2.1 total gym days comes from the database (total_days), not from the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1.
- Full suite on checkpoint rounds (every 5 rounds: next is 35).
- 2.1 simulator check stays parked (E2E account needs 250 or more gym dates). Do not seed or insert data without an approved seed path.
- Every round runs tsc and targeted Jest for changed files and reports the results.
- zsh: quote glob patterns; pass Jest file lists via printf '%s\0' | xargs -0.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Round 27: simulator check of Total tile blocked. Parked.
- Round 28: fixed react-hooks/set-state-in-effect at src/lib/data/hooks.ts:400.
- Round 29: checkpoint clean (tsc 0, Jest 242 suites, 1,400 tests).
- Round 30: full sweep, no edits (lint numbers above).

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates (new seed user under its own Clerk id, or a one-off local SQL insert). Logged in OWNER_CHECKS_phase4.md.

## Parked
- Row 2.1 simulator check of the Total tile.

## Next
- Round 31 (now): fix react-hooks/refs in src/lib/data/gymSchedule.ts (lines 50, 52), with one targeted test.
- Then one file per round: ProgressBar.tsx, DailyMacroRing.tsx, EnergyBalanceCard.tsx (react-hooks/refs), then the 3 display-name render tests.
- Row 2.2 remaining: src/app/food/history.tsx:66 listSessions limit (high priority); useWeeklyMacros refetch test; gym/schedule_pg.go LIMIT order; 49 WHERE id::text queries; getMorningBrief and getProfile error swallowing; feature_used allowlist; app_version vs build number; export as .json file; one exportData function; npm audit with safe fix.
- Then 2.3 (translations and Retry), 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved, KNOWN_ISSUES line 40).
- Then Row 2b, 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- src/app/food/history.tsx:66 still calls listSessions() with no limit. Fix in 2.2.
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Isa should confirm before the AFCD importer runs.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- KNOWN_ISSUES.md line 40 says 20 TestPG tests skip. It is 21 and they run. Fix in 2.5.
- Phase 2 iOS notes say the backend returns 401 without a Clerk token. Unverified against local Clerk dev keys. Check in Row 16.
- Jest prints React act(...) warnings from ScanReviewCard and an 'API unreachable' warning from hooks.ts. Look at them in Row 22.
- Jev risk high: keep steps to one file and check the gates each round.