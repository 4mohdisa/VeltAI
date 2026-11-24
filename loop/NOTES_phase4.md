# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Round 81 done: foodSaved.render.test.tsx both requires moved to jest.requireActual. tsc 0, file green, lint 0 errors, 8 warnings.
- Round 82 in progress: authBilling.test.ts (2 warnings, around line 259).
- Row 1 BUILT. Row 2 PARTIAL: 2.1 total gym days (code done, simulator check parked), 2.2 lint and backend leftovers (in progress), 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (hand built, commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md has open checks under 'Rows 2c and 2d' and the 2.1 simulator check. Never overwrite or empty it.

## Lint state
- Errors: 0. Warnings: 8 (last measured, round 81). Verify with `npx expo lint`.
- Remaining warnings: authBilling 2; debugGating 2; debugCapture 2; render/setup.ts 1; src/lib/analyticsSink.ts 1 (app code).
- `eslint --format unix` no longer exists. Use `npx expo lint`.

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- Only localhost:5432 / lume_test_local for tests. Never touch the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. Sign up, sign in, onboarding and new Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Rows 2c and 2d are extra rows, BUILT only after their tests pass.
- Prompts touch one screen, component or file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Shared router reset (setup.ts beforeEach) replaces per-test router mockClear. Local mocks that are not jest.fn or that wrap push (settingsHelp) keep their own clear.
- Mock forwardRef components get named functions (display-name fix).
- Factory cases use jest.requireActual (babel-jest hoists factories).
- Test-body requires of mocked modules become top-level imports.
- Animated values use useState(() => new Animated.Value(x)), not ref .current reads during render.
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1.
- Do not change api.ts listSessions defaults (would add ?limit to gymRange reads and break apiSurface.test.ts).
- A required require (fresh module via jest.isolateModules) keeps one reasoned eslint-disable-next-line comment.
- i18n alias: `import { use as addPlugin }` is kept.
- One file per round for lint swaps. Full suite on checkpoint rounds. Checkpoints every 15 rounds (90, 105, ...), plus any round the loop script marks.
- 2.1 simulator check stays parked (E2E account needs 250 or more gym dates). No seed or insert without an approved path.
- Every round runs tsc and targeted Jest for changed files and reports results.
- zsh: quote glob patterns. Node 22 first on PATH. Under zsh PIPESTATUS does not work; count errors with grep.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md (loop script owns them).
- Jev risk moderate to high: keep steps to one file and check gates each round.
- String changes wait for a string round.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Rounds 28-43: react-hooks, display-name, i18n, debugStore, calendar and gymCards lint fixes.
- Rounds 38-39: history.tsx gym session read limited (7-day window, GYM_SESSION_HYDRATE_LIMIT).
- Rounds 44, 60, 75, 76 (checkpoints): full tsc and Jest green.
- Rounds 45-81: render tests cleared of require and router swaps; shared router beforeEach in setup.ts; foodSaved requires fixed.

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates (new seed user under its own Clerk id, or one-off local SQL insert). Logged in OWNER_CHECKS_phase4.md.

## Parked
- Row 2.1 simulator check of the Total tile.

## Next
- Round 82: authBilling.test.ts 2 no-require-imports (around line 259).
- Then debugGating (112, 141), debugCapture (25, 78), render/setup.ts afterEach require (38).
- Then settingsHelp.render.test.tsx: clear its own wrapped mockPush.
- Then app code src/lib/analyticsSink.ts (line 29, no-require-imports).
- Then camera mocks: photoScan, labelScan, scanScreens.strings (jest.requireActual), or one shared expo-camera mock.
- Row 2.2 backend: gym/schedule_pg.go LIMIT order; 49 WHERE id::text queries; getMorningBrief and getProfile error swallowing; feature_used allowlist; app_version vs build number; export as .json file; one exportData function; useWeeklyMacros refetch test; npm audit with safe fix.
- Then 2.3 (translations and Retry, including DailyMacroRing.tsx:96 'of' with nutrition.ringOf, a string round; i18n header comments), 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved, KNOWN_ISSUES.md line 40 says 20 TestPG, it is 21).
- Then Row 2b, 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Isa should confirm before the AFCD importer runs.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- React act warnings from ScanReviewCard, 'API unreachable' warning from hooks.ts, logged stack trace in photoScan.render. Look at them in Row 22.
- The expo-camera stub is copied into three scan tests. Move to one shared mock later.
- Plain npx eslint at repo root reports about 11,000 errors, mostly in web/.next, web/out, ds-bundle/_vendor. Add to ESLint ignores (Row 29).
- i18n index.ts header says French is 'intentionally partial' and lng says 'picker was removed'. Check against locale files and Preferences (Row 2.3).
- The history test assertion hardcodes isoDaysAgo(6) because DAYS isn't exported.
- npx prettier --check flags noFabricatedData.test.ts. No Prettier config in repo, so not a gate.
- KNOWN_ISSUES.md:40 wrong TestPG count (21 run, not 20 skipped).
- DailyMacroRing.tsx:96 shows 'of' in English only.
- No test for refetch in useWeeklyMacros (src/lib/data/hooks.ts).