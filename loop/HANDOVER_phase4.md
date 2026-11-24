Handover: Lume Phase 4, branch loop/phase4

Setup
Repo root: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first; the shell default is Node 24. The loop script commits between rounds, and git commands are not allowed.

Rows
- Row 1 (Foundation) is BUILT.
- Row 2 is PARTIAL. In 2.1 only the simulator check is left, parked in OWNER_CHECKS_phase4.md.
- 2.2 is in progress. The lint sweep is done and the schedule_pg LIMIT fix is written; both are noted in the row 2 notes cell. 2.2 to 2.5 are still open.
- No new rows were built this session.

Last checkpoint
- tsc: 0 errors.
- Jest: 242 suites and 1,402 tests pass. The render project alone is 166 suites and 536 tests.
- npx expo lint: 0 errors, 1 accepted warning (src/lib/analyticsSink.ts:29, recorded in KNOWN_ISSUES.md).
- Go: vet is clean and both gym packages pass with -race.

Done this session
- The require() calls are replaced in debugCapture.test.ts, debugGating.test.ts and render/setup.ts.
- render/setup.ts now imports unmountAll from ./helpers at the top.
- settingsHelp.render.test.tsx uses router.push as a real jest.fn.
- The new shared stub src/__tests__/render/cameraMock.tsx, cameraMock(getTakePicture, getPermission?), is used by photoScan, labelScan and scanScreens.strings.
- KNOWN_ISSUES.md: Phase 4 header, analyticsSink entry, corrected TestPG line.
- backend/internal/gym/schedule_pg.go: GetExerciseProgress picks the newest N rows (date, created_at, id DESC), then returns them oldest first.
- The new test is TestPG_ExerciseProgressLimitKeepsNewest in backend/tests/gym_schedule/schedule_pg_sql_test.go.

Next
- The new TestPG has never run: it SKIPPED because LUME_TEST_DATABASE_URL is unset in the loop shell. Isa needs to run go test ./tests/gym_schedule/ -run PG -race -count=1 with the local test database. There should be 22 TestPG tests now.
- After it passes, remove the progress bug entry from KNOWN_ISSUES.md and change its TestPG count from 21 to 22.

Decisions and why
- analyticsSink keeps its lazy require. A top-level import would load about fifteen optional native modules in builds with no key, and import() is async, so launch events could be dropped. Revisit in Row 29 with an async load and a small queue.
- Factory mocks use jest.requireActual<typeof import(...)> with no cast.
- cameraMock takes getters, because jest.mock factories run before the test file's variables are set.
- No eslint-disable comments go in app code.

Gotchas
- Never connect to 127.0.0.1:55432 and never print LUME_TEST_DATABASE_URL. The row 1 notes mention lume_test_local. If that is the 55432 database, the loop can never run TestPG; ask Isa.
- Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md. Only append to OWNER_CHECKS_phase4.md.
- Under zsh, quote globs, including in grep --include.
- The loop prompt keeps repeating tasks that are already finished. Check the file before changing it.
- Prettier has no repo config, so it is not a gate.

Not fixed
- devWarn output from src/lib/data/hooks.ts:72 shows in the render logs; src/lib/data is off limits.
- DailyMacroRing.tsx:96 shows "of" in English only; nutrition.ringOf exists.
- The KNOWN_ISSUES.md section "Phase 4 (out of scope)" clashes with the header.
- Nothing tests refetch in useWeeklyMacros.
- The history test hardcodes isoDaysAgo(6).