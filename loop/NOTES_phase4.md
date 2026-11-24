# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Baseline: tsc 0, Jest 242 suites and 1,402 tests (round 44 checkpoint), Go 34 ok. TestPG 21 of 21 run on lume_test_local (localhost:5432, Postgres 17).
- Row 1 BUILT. Row 2 PARTIAL: 2.1 total gym days (code done, simulator check parked), 2.2 lint and backend leftovers (in progress), 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (hand built, commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md has open checks under 'Rows 2c and 2d' and the 2.1 simulator check. Never overwrite or empty it.

## Lint state
- Errors: 0 (npx expo lint). Warnings: about 49 (estimate, not re-run since round 55).
- Count with `npx eslint -f json` piped to a small counting script. `eslint --format unix` no longer exists.

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- Only localhost:5432 / lume_test_local for tests. Never touch the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. Sign up, sign in, onboarding and new Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Rows 2c and 2d are extra rows, BUILT only after their tests pass.
- Prompts ask for one screen, component or file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- no-require-imports in jest.mock factories: use jest.requireActual('react') (no disable comment). Top-level imports fail there because babel-jest hoists jest.mock.
- Mock forwardRef components get named functions (display-name fix).
- Animated values use useState(() => new Animated.Value(x)), not ref .current reads during render.
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1.
- Do not change api.ts listSessions defaults (would add ?limit to gymRange reads and break apiSurface.test.ts).
- A required require (fresh module via jest.isolateModules) keeps one reasoned eslint-disable-next-line comment.
- A require() after jest.resetModules() is a fresh-module reload, not a require('react') case. Keep it unless jest.requireActual is shown to give the same fresh module.
- Full suite on checkpoint rounds. Next checkpoint about round 60.
- 2.1 simulator check stays parked (E2E account needs 250 or more gym dates). No seed or insert without an approved path.
- Every round runs tsc and targeted Jest for changed files and reports results.
- zsh: quote glob patterns; pass Jest file lists via tr '\n' '\0' | xargs -0.
- Node 22 first on PATH (shell default is 24).
- String changes wait for a string round.
- i18n alias: `import i18next, { use as addPlugin }` is kept because a plain `use` import trips react-hooks/rules-of-hooks.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md (loop script owns them).
- Round 53: a flagged 'partly done' report is re-verified before the next swap. Round 56 applied this rule.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Round 27: simulator check of Total tile blocked, parked.
- Rounds 28-37: react-hooks and display-name lint fixes. Lint errors now 0.
- Rounds 38-39: history.tsx gym session read limited (7-day window, GYM_SESSION_HYDRATE_LIMIT).
- Rounds 40-43: i18n, debugStore, calendar and gymCards render test lint cleared.
- Round 44 (checkpoint): full tsc and Jest green.
- Rounds 45-55: render tests swapped or re-verified (gymSession, gymStreakSkeleton, gymStreakStripFootnote, mealsScreen.strings, recipeLog, recipesList, savedMealsList, savedMealsLog, savedScreen, todayCard).
- Round 56: last report was partly done (noFabricatedData has 0 jest.mock and 0 require('react'); its 15 warnings are plain require() calls). Re-verifying and clearing the non-store requires this round.

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates (new seed user under its own Clerk id, or one-off local SQL insert). Logged in OWNER_CHECKS_phase4.md.

## Parked
- Row 2.1 simulator check of the Total tile.

## Next
- Round 56 (this round): noFabricatedData.test.ts. Clear the 2 child_process and 4 derive requires with top-level imports where no resetModules comes first. Leave the 11 store reloads. Gates: tsc, jest on file, eslint unused directives, console/debugger/TODO search.
- Round 57: decide the 11 store reloads in noFabricatedData (check whether jest.requireActual gives a fresh module after jest.resetModules). Only then swap.
- Then measurements.render.test.tsx (9). Onboarding and signup render tests may use the same pattern (signup 2, others).
- Then camera mocks in photoScan, labelScan and scanScreens.strings (disable comment to jest.requireActual). Consider one shared expo-camera mock.
- Then app code src/lib/analyticsSink.ts (no-require-imports).
- Round 60: checkpoint. Run npx expo lint for the real warning count and the full Jest suite.
- Row 2.2 remaining: display-name errors in photoScan.render.test.tsx:83 and scanScreens.strings.render.test.tsx:48; useWeeklyMacros refetch test; gym/schedule_pg.go LIMIT order; 49 WHERE id::text queries; getMorningBrief and getProfile error swallowing; feature_used allowlist; app_version vs build number; export as .json file; one exportData function; npm audit with safe fix. ScanReviewCard act warnings are Row 22.
- Then 2.3 (translations and Retry, including DailyMacroRing.tsx:96 'of' with nutrition.ringOf, a string round), 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved, KNOWN_ISSUES line 40 says 20 TestPG, it is 21).
- Then Row 2b, 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Isa should confirm before the AFCD importer runs.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- Jest prints React act(...) warnings from ScanReviewCard, an 'API unreachable' warning from hooks.ts, and a logged stack trace in photoScan.render. Look at them in Row 22.
- No test for refetch in useWeeklyMacros (src/lib/data/hooks.ts).
- The expo-camera stub is copied into three scan tests. Move to one shared mock later.
- Plain npx eslint at repo root reports about 11,000 errors, mostly in web/.next, web/out, ds-bundle/_vendor. Add to ESLint ignores (Row 29).
- i18n index.ts header says French is 'intentionally partial' and lng says 'picker was removed'. Check against locale files and Preferences (Row 2.3).
- The history test assertion hardcodes isoDaysAgo(6) because DAYS isn't exported.
- Jev risk moderate: keep steps to one file and check gates each round.