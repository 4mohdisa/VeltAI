Handover: Lume Phase 4, branch loop/phase4

Repo root: /Users/mohammedisa/Development/projects-app/LumeAI. Put Node 22 first on PATH with export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH". The shell default is v24.16.0.

Rows built
- Row 1 (Foundation) is BUILT.
- Row 2 is still PARTIAL. 2.1 (Total gym days) is done except the simulator check parked in OWNER_CHECKS_phase4.md.
- 2.2 (lint sweep) is in progress:
  - All lint errors are fixed: `npx expo lint` reports 0 errors.
  - Warnings are down from 59 to about 49. That number is worked out from each fix, not re-run.
  - src/app/food/history.tsx now asks for only the 7-day window: listSessions({ from: days[DAYS - 1].iso, limit: GYM_SESSION_HYDRATE_LIMIT }).

Last checkpoint (full run): tsc 0 errors; Jest 242 suites and 1,402 tests, all passing.

In progress: swapping require('react') for jest.requireActual('react') inside jest.mock factories, one file per round. Still to do, all in src/__tests__/render/:
- savedMealsList.render.test.tsx
- savedMealsLog.render.test.tsx (likely has a disable comment that becomes unused)
- savedScreen.render.test.tsx
- todayCard.render.test.tsx

Gates for each file: tsc; jest on the file; eslint --report-unused-disable-directives on the file; grep -c 'require(' = 0.

Decisions and why
- jest.requireActual('react') is used inside mock factories. babel-jest moves factories above the imports, so a top-level import can't be used there. react isn't mocked, so the result is the same module with no disable comment needed.
- Disable comments made unused by a swap are removed. Comments that say "require(), not an import" are reworded.
- debugStore.test.ts keeps require inside jest.isolateModules, with one reasoned disable comment. jest.isolateModulesAsync with import() fails because Jest runs without ESM support.
- i18n/index.ts uses `import { use as addPlugin }`. A plain named `use` trips react-hooks/rules-of-hooks. The named export is bound to the default instance.
- api.ts listSessions was left without a default limit. A default would add ?limit=200 to the gymRange.ts range reads and break the apiSurface "no params" case.

Gotchas
- `eslint --format unix` no longer exists. Use `npx expo lint`, or `-f json` piped to a counting script.
- `npx eslint .` reports about 11k errors from web/.next, web/out and ds-bundle/_vendor. Only expo lint is the real gate.
- Never connect to 127.0.0.1:55432 and never print LUME_TEST_DATABASE_URL. Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md. Only append to OWNER_CHECKS_phase4.md.

Not fixed
- Remaining warnings outside the render folder:
  - noFabricatedData.test.ts (15)
  - measurements.render.test.tsx (9)
  - authBilling.test.ts, debugCapture.test.ts, debugGating.test.ts and signup.render.test.tsx (2 each)
  - src/lib/analyticsSink.ts (1, app code)
  - several onboarding and signup render tests
- The scan camera mocks (photoScan, labelScan, scanScreens.strings) still use require('react') with a disable comment. They could switch to requireActual.
- The history test assertion hardcodes isoDaysAgo(6) because DAYS isn't exported.
- The i18n header comments ("French is intentionally partial", "picker was removed") look out of date.
- DailyMacroRing.tsx:96 shows "of" in English only; nutrition.ringOf exists.
- Nothing tests refetch in useWeeklyMacros.
- KNOWN_ISSUES.md:40 says 20 TestPG tests skip; there are 21 and they run.
- The expo-camera stub is copied into three scan tests.