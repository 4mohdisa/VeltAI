# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3 (Phase 3 not merged into main).
- Phase 3 gates: tsc 0 errors, Jest 241 suites and 1,386 tests pass, Go 34 packages ok.
- Round 8 baseline (BASELINE_phase4.md): tsc 0 errors, Jest 242 suites and 1,397 tests pass, Go 34 packages ok. TestPG: 21 of 21 run on lume_test_local (localhost:5432, Postgres 17).
- Row 1 is BUILT.
- Row 2 is PARTIAL. Sub steps: 2.1 total gym days and hydrateGym, 2.2 backend and data leftovers, 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- Row 2.1 backend done (GET /api/gym/streak and freeze return total_days, Go tests pass).
- Row 2.1 app: GymStreak.total_days in src/lib/api.ts (round 13). streakFromApi in mappers.ts takes row.total_days as default (round 14, mapper test updated, 15 tests pass).
- Row 2.1 app NOT finished: hooks.ts hydrateGym still passes its own capped count as third argument, so the Total tile still shows the capped number. Also prev is now unused in streakFromApi.
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
- Row 2.1 total gym days comes from the database (total_days), not from the capped store. A correct total beats the cap (round 12).
- Row 2 sub steps are named 2.1 to 2.5 so they do not clash with rows 2b, 2c, 2d (round 12).
- Round 14: a loop flag said round 13 was partly done. Fixed by finishing the mapper in its own round, one file at a time.
- Round 15: loop flag said round 14 was only partly done. Checkpoint chosen over Jev's top pick (remove the argument, 96%). Reason Jev cannot see: the gate on the partial state gives a clean baseline before the next edit. Checkpoint changes no files.

## Done
- Rounds 1-2: row list prompts rejected (too many components).
- Round 3: PHASE4_ROWS.md created. Round 4: progress line fixed to 0 of 36.
- Round 5: OWNER_CHECKS prompt rejected (no branch rule). Round 6: OWNER_CHECKS_phase4.md already existed.
- Round 7-9: Row 1 done (branch, gates, local Postgres 17, 21 of 21 TestPG pass).
- Round 10: Row 2.1 hydrateGym limit 200 (1000 to 200 sessions).
- Round 11: Row 2.1 follow up rejected (two components). Rewritten.
- Round 12: Row 2.1 total_days on backend, Go race tests pass.
- Round 13: GymStreak.total_days added in src/lib/api.ts, fixtures updated.
- Round 14: streakFromApi default changed to row.total_days; mapper test updated.

## Blocked on Isa
(nothing)

## Parked
(nothing)

## Next
- Round 15 (this round): checkpoint. Full tsc and full app Jest run, no file changes. Report failures and the state of hooks.ts and mappers.ts.
- Round 16: in src/lib/data/hooks.ts remove the distinct count and the third argument to streakFromApi. In src/lib/data/mappers.ts remove prev and totalGymDays from streakFromApi. Update the 5 calls in src/__tests__/mappers.test.ts. Switch the Total gym days tile (Gym, Profile, Streak) to totalGymDays. Run tsc and the changed tests.
- Then Row 2.2 (Phase 3 backend and data leftovers): gym/schedule_pg.go LIMIT order (oldest first then LIMIT 30 is wrong), 49 WHERE id::text queries, getMorningBrief and getProfile error swallowing, feature_used allowlist, app_version vs build number, export as .json file, one exportData function, lint, npm audit with safe fix.
- Then 2.3 (translations and Retry: gymRange, monthTitle, muscle cards, exercise progress, summaryCards, nutrition kcal label), 2.4 (useGoals isLoading, error, refetch, goals screen states, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted through backend, missing _one plural, goals.saved).
- Then Row 2b (sign up redesign, Mobbin check), 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- food/history.tsx:66 still calls listSessions() with no limit. Fix in 2.2 or 2.5.
- One react-hooks/set-state-in-effect lint error at src/lib/data/hooks.ts:405. Fix in 2.2 lint step.
- ssh tunnel on 127.0.0.1:55432: unknown target. The 2c/2d owner check uses this port. Isa should confirm what it reaches before running the AFCD importer.
- Postgres runs as a brew service. Database setup (roles, schema, 18 migrations) is manual. Rows 17 and 26 should script it.
- KNOWN_ISSUES.md line 40 still says 20 TestPG tests skip. It is 21 and they run. Fix in Row 2.5.
- Jest prints React act(...) warnings from ScanReviewCard and an 'API unreachable' warning from src/lib/data/hooks.ts. Not failing. Look at them in Row 22.
- loop/DECISIONS_LOG.md and loop/NOTES_phase4.md had uncommitted changes. Left alone for the loop script.
- Jev rated ask higher than run. Ignored (ask is not allowed).
- Jev risk 1.0 (rounds 14 and 15): keep steps small and check the gates each round. Last task completed cleanly: 27% likely. Round 14 was partial; finish 2.1 before starting 2.2.