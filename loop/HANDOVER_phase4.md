Handover: Lume Phase 4, branch loop/phase4

Repo root: /Users/mohammedisa/Development/projects-app/LumeAI (briefs sometimes give /Users/isa/... paths that don't exist). Node 22.23.5 from nvm; the shell default is 24, so put v22 first on PATH.

Built so far
- Row 1 (Foundation) is BUILT. No other row is.
- Row 2 is PARTIAL, with sub-steps 2.1 to 2.5.
- 2.1 (Total gym days): code, mocks and tests are done.
  - GET /api/gym/streak returns total_days, which streakFromApi maps to totalGymDays.
  - Every API streak mock in src/__tests__ has total_days.
  - productionReadiness.test.ts asserts total 365 while only 200 sessions load.
  - The simulator check is parked in OWNER_CHECKS_phase4.md: no seed path gives the E2E account more than 200 gym dates.
- 2.2 (lint sweep) is in progress.
  - Fixed: the hooks.ts set-state-in-effect error and every react-hooks/refs error (gymSchedule.ts, ProgressBar.tsx, DailyMacroRing.tsx, EnergyBalanceCard.tsx).
  - Fixed: the react/display-name error in src/__tests__/render/labelScan.render.test.tsx.
  - Left: display-name errors in photoScan.render.test.tsx:83 and scanScreens.strings.render.test.tsx:48. These are the last lint errors.
  - Also left: 59 warnings, mostly no-require-imports in tests.

Last checkpoint (round 35): tsc 0 errors; Jest 242 suites and 1,402 tests, all passing.

Decisions and why
- Animated values are created with useState(() => new Animated.Value(x)), not useRef(...).current. Reading a ref during render breaks the react-hooks/refs rule, and the lazy useState keeps one stable value without building a new one every render.
- In useApi (gymSchedule.ts), the latest-value refs are updated in a useLayoutEffect with no dependency array. A layout effect runs before every regular effect, so a focus revalidate still reads the latest fetcher.
- useWeeklyMacros sets loading inside refetch, not inside the effect. The first load already starts with loading true.
- Mock forwardRef components get named functions to satisfy display-name.

Gotchas
- Never connect to 127.0.0.1:55432 (an unidentified ssh tunnel). Use only localhost:5432 and lume_test_local, and never print LUME_TEST_DATABASE_URL.
- The tool refuses the zsh `printf '%s\0' $(...)` form for Jest file lists; `tr '\n' '\0' | xargs -0` works.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md (the loop script changes them). Only append to OWNER_CHECKS_phase4.md. Status words go only in PHASE4_ROWS.md's status column.
- The backend has Clerk development keys, and E2E_EMAIL and E2E_PASSWORD are set. The old "401 locally" note is probably out of date.

Not fixed
- DailyMacroRing.tsx:96 shows "of" in English only; the nutrition.ringOf key exists.
- Nothing tests refetch in useWeeklyMacros.
- src/app/food/history.tsx:66 reads every session with no limit.
- KNOWN_ISSUES.md:40 says 20 TestPG tests skip; there are 21 and they run.
- The backend must be deployed before the app, or the Total tile shows undefined.
- The same expo-camera stub is copied into three scan tests and could become one shared mock.