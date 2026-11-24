Handover: Lume Phase 4, branch loop/phase4

Setup
Repo root: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first; the shell default is Node 24. The loop script commits between rounds, so git diff may be empty for earlier rounds' files. Check git log -1 -- <file> instead.

Rows
- Row 1 (Foundation) is BUILT.
- Row 2 is still PARTIAL. In 2.1 (Total gym days), only the simulator check is left, parked in OWNER_CHECKS_phase4.md.
- 2.2 (lint sweep) is in progress.

Last measured checkpoint
- tsc: 0 errors.
- Jest: 242 suites and 1,402 tests, all passing.
- npx expo lint: 0 errors, 18 warnings (down from 59). All 18 are @typescript-eslint/no-require-imports.

Done this session
- Swapped require('react') for jest.requireActual('react') inside jest.mock factories in savedMealsList, savedMealsLog, savedScreen and todayCard (all in src/__tests__/render/).
- In src/__tests__/noFabricatedData.test.ts:
  - child_process and the two derive modules are now top-level imports.
  - The 9 store reloads after jest.resetModules() now use jest.requireActual. A probe showed it returns a fresh module after a reset.
  - The redundant "as string" casts are gone.
- measurements.render.test.tsx: now imports act and router at the top level.
- onboardingActivity, BodyType, Cuisine, Dietary and Done: the test-body require('expo-router') is replaced by a top-level import { router } from 'expo-router', placed before the ./helpers import.

In progress
The same router swap, one file per round, in this order: onboardingGoal (line 33, push), then onboardingIndex, onboardingPreview, onboardingTargets, signupOtp and signupSignInMode (the last two use replace).

Decisions and why
- Factory cases use jest.requireActual, because babel-jest moves factories above the imports.
- Test-body requires of mocked modules become top-level imports. expo-router is mocked in src/__tests__/render/setup.ts, so jest.requireActual('expo-router') would return the real router and break .mock.calls.
- Where .mock.calls is read, cast to (router.push as jest.Mock), as the other render tests do.
- No disable comments are added. Ones that become unused are removed.
- debugStore.test.ts keeps require inside jest.isolateModules with one reasoned disable comment.

Remaining warnings after the router files
- signup.render.test.tsx, foodSaved.render.test.tsx, debugGating.test.ts, debugCapture.test.ts and authBilling.test.ts: 2 each.
- render/setup.ts: 1.
- src/lib/analyticsSink.ts: 1. This is app code, so look at it separately.

Gotchas
- Never connect to 127.0.0.1:55432 and never print LUME_TEST_DATABASE_URL.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md. Only append to OWNER_CHECKS_phase4.md.
- npx eslint . reports about 11k errors from web/ and ds-bundle/. Only expo lint is the gate.
- The repo has no Prettier config, and prettier --check already flags files at HEAD, so it is not a gate.
- Under zsh, PIPESTATUS doesn't work. Use pipestatus or count the errors with grep.

Not fixed
- The scan camera mocks (photoScan, labelScan, scanScreens.strings) still use require('react') with disable comments, and the expo-camera stub is copied into three tests.
- DailyMacroRing.tsx:96 shows "of" in English only; nutrition.ringOf exists.
- KNOWN_ISSUES.md:40 says 20 TestPG tests skip; there are 21 and they run.
- The i18n header comments look out of date.
- Nothing tests refetch in useWeeklyMacros.
- The history test hardcodes isoDaysAgo(6).