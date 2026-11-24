# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Checkpoint round 60 green: tsc 0, Jest 242 suites and 1,402 tests, expo lint 0 errors.
- Round 63: onboardingBodyType.render expo-router require swapped to top-level import. Lint warnings 21.
- Row 1 BUILT. Row 2 PARTIAL: 2.1 total gym days (code done, simulator check parked), 2.2 lint and backend leftovers (in progress), 2.3 Row 13 and 14 items, 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (hand built, commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md has open checks under 'Rows 2c and 2d' and the 2.1 simulator check. Never overwrite or empty it.

## Lint state
- Errors: 0. Warnings: 21 (round 63). Verify with `npx expo lint`.
- Remaining warning map: noFabricatedData 15; signup.render, foodSaved.render, debugGating, debugCapture, authBilling 2 each; 8 onboarding and signup render tests 1 each (expo-router require in test body); render/setup.ts; src/lib/analyticsSink.ts 1 (app code).
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
- Prompts ask for one screen, component or file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Mock forwardRef components get named functions (display-name fix).
- require() outside a jest.mock factory: top-level import. Inside a factory: jest.requireActual (no disable comment).
- Animated values use useState(() => new Animated.Value(x)), not ref .current reads during render.
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1.
- Do not change api.ts listSessions defaults (would add ?limit to gymRange reads and break apiSurface.test.ts).
- A required require (fresh module via jest.isolateModules) keeps one reasoned eslint-disable-next-line comment.
- i18n alias: `import i18next, { use as addPlugin }` is kept (a plain `use` trips rules-of-hooks).
- One file per round for lint swaps. Full suite on checkpoint rounds. Next checkpoint round 75, then every 15 rounds.
- 2.1 simulator check stays parked (E2E account needs 250 or more gym dates). No seed or insert without an approved path.
- Every round runs tsc and targeted Jest for changed files and reports results.
- zsh: quote glob patterns. Node 22 first on PATH.
- String changes wait for a string round.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md (loop script owns them).
- Jev risk moderate: keep steps to one file and check gates each round.
- Round 62: Jev's pick taken over my Row 2.2 backend pick. Reason: small, low risk, matches NEXT. Backend work follows after the lint sweep.
- Round 64 flag: loop check said round 63 report looked partial. Checked: the one file is complete. The rest of the sweep is tracked one file per round.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Rounds 28-37: react-hooks and display-name lint fixes. Lint errors 0.
- Rounds 38-39: history.tsx gym session read limited (7-day window, GYM_SESSION_HYDRATE_LIMIT).
- Rounds 40-43: i18n, debugStore, calendar and gymCards render test lint cleared.
- Rounds 44 and 60 (checkpoints): full tsc and Jest green.
- Rounds 45-62: render tests cleared, measurements.render cleared, onboardingActivity.render cleared.
- Round 63: onboardingBodyType.render cleared.

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates (new seed user under its own Clerk id, or one-off local SQL insert). Logged in OWNER_CHECKS_phase4.md.

## Parked
- Row 2.1 simulator check of the Total tile.

## Next
- Round 64: onboardingCuisine.render (top-level expo-router import).
- Then the remaining onboarding and signup render tests (Dietary, Done, Goal, Index, Preview, Targets, signupOtp, signupSignInMode), one per round.
- Then signup.render, foodSaved.render, debugGating, debugCapture, authBilling (2 each), render/setup.ts.
- Then app code src/lib/analyticsSink.ts (no-require-imports).
- Then camera mocks: photoScan, labelScan, scanScreens.strings (jest.requireActual), or one shared expo-camera mock.
- Row 2.2 backend: gym/schedule_pg.go LIMIT order; 49 WHERE id::text queries; getMorningBrief and getProfile error swallowing; feature_used allowlist; app_version vs build number; export as .json file; one exportData function; useWeeklyMacros refetch test; npm audit with safe fix.
- Then 2.3 (translations and Retry, including DailyMacroRing.tsx:96 'of' with nutrition.ringOf, a string round; i18n header comments), 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved, KNOWN_ISSUES line 40 says 20 TestPG, it is 21).
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