Handover: Lume Phase 4, branch loop/phase4

Setup
Repo root: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first; the shell default is Node 24. The loop script commits between rounds, so check git log -1 -- <file> rather than git diff.

Rows
- Row 1 (Foundation) is BUILT.
- Row 2 is still PARTIAL. In 2.1 (Total gym days) only the simulator check is left, parked in OWNER_CHECKS_phase4.md.
- 2.2 (lint sweep) is in progress. No new rows were built this session.

Last checkpoint
- tsc: 0 errors.
- Jest: 242 suites and 1,402 tests, all passing. The render project alone is 166 suites and 536 tests.
- npx expo lint: 0 errors, 6 warnings (down from 18), all @typescript-eslint/no-require-imports.

Done this session
- The test-body require('expo-router') swap is finished in onboardingGoal, Index, Preview, Targets, signupOtp, signupSignInMode and src/__tests__/signup.render.test.tsx. That last one is not under render/.
- src/__tests__/render/setup.ts has a shared beforeEach that clears router.push, replace and back. It looks the router up with jest.requireMock(...) and clears only real mock functions. The per-test router clears are now removed.
- foodSaved.render.test.tsx: the factory requires are now jest.requireActual<typeof import('x')>('x').
- authBilling.test.ts: the fs and path requires are now top-level imports.

Next
Fix the 2 warnings in src/__tests__/debugCapture.test.ts (lines 25 and 78). After that:
- debugGating.test.ts:112 and :141
- render/setup.ts:38
- src/lib/analyticsSink.ts:29 (app code, so review it separately)

Decisions and why
- setup.ts must not import expo-router at the top. A top-level import loads setup's mock first, so the 18 suites with their own jest.mock('expo-router') break. The ReduceMotion test's mock also has no router at all, so the hook uses Partial typing and optional chaining.
- Inside factories, use jest.requireActual with a generic and no cast. Requires of mocked modules in test bodies become top-level imports.
- Node built-ins become named top-level imports: { readFileSync } from 'fs' and { join } from 'path'.
- No disable comments are added. debugStore.test.ts keeps its one reasoned disable.

Gotchas
- Never connect to 127.0.0.1:55432 and never print LUME_TEST_DATABASE_URL.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md. Only append to OWNER_CHECKS_phase4.md.
- Only npx expo lint is the gate. npx eslint . reports web/ and ds-bundle/ noise.
- Under zsh, quote globs: an unmatched jest.config.* glob exits with code 1.
- grep "render/setup" only finds comments. Run the render project with npx jest --selectProjects render.

Not fixed
- settingsHelp.render.test.tsx wraps mockPush in a plain function, so the shared hook can't clear it.
- The scan camera mocks (photoScan, labelScan, scanScreens.strings) still use require('react') with disable comments, and the stub is copied into three files.
- DailyMacroRing.tsx:96 shows "of" in English only; nutrition.ringOf exists.
- KNOWN_ISSUES.md:40 says 20 TestPG tests skip; there are 21 and they run.
- The i18n header comments are out of date.
- Nothing tests refetch in useWeeklyMacros.
- The history test hardcodes isoDaysAgo(6).