HANDOVER: Lume Phase 3, branch loop/phase3

BUILT ROWS (PHASE3_ROWS.md)
1. Node 22: .nvmrc, plus engines ">=22 <23" in package.json.
2. Baseline gates: loop/BASELINE_phase3.md. The 18 skipped backend tests all need LUME_TEST_DATABASE_URL.
3. Header "+" on My workouts (src/app/gym/templates.tsx) kept. It is the only way to add a second workout. Owner check pending.
4. Empty states audit: EMPTY_STATES_AUDIT.md (156 rows). Rows 12 to 17 were created from it.

PARTIAL ROWS
5. Seed data: backend/tools/seed/ (main.go, seed.go, seed_test.go, README.md). It is localhost-only and the six seed_ users are in the local database. Part 2 (Maestro flows) is waiting on a way to sign in as a seed user: there is no local auth bypass, so this needs Isa.
12. Shared plumbing, done so far:
- useHydration (src/lib/data/hooks.ts) reports loading again on a Food tab day switch.
- useApi (src/lib/data/gymSchedule.ts) is exported and returns isError.
- useToday passes isError through.
- Tests: src/__tests__/render/foodLogDaySwitch.render.test.tsx, src/__tests__/gymSchedule.revalidate.test.ts, src/__tests__/gymSchedule.useToday.test.ts.

IN PROGRESS
Passing isError through the other gymSchedule hooks, one per round. Next is useTemplates, then useSchedule, useExercises, useGymPatterns, useExerciseProgress. No screen reads isError yet; that is row 14.

LAST CHECKPOINT
Before the useApi work: tsc 0 errors, 136 Jest suites and 995 tests, all passing. 7 tests have been added since, and the full suite has not been run again.

DECISIONS
- Fixes go in the shared hook, not per screen.
- The Food log empty state already existed, so the fix was the loading flash, not new UI.
- Per loop/DECISIONS_LOG.md:
  - Goals persistence is parked; row 15 fixes the "Saved as you type" copy instead.
  - Row 8 makes analytics on by default, which conflicts with the store default and DECISIONS.md 2026-08-09. Isa to confirm.

GOTCHAS
- Commands: source ~/.nvm/nvm.sh && nvm use 22 before every command.
- Formatting: never run Prettier. The repo has no config, and Prettier rewrites whole files (single quotes, about 120 columns).
- Git: loop rounds often forbid git, even git status.
- Database: the local one is 127.0.0.1:55432 (user lume), a Colima port forward. DATABASE_URL is not set in the shell.
- Jest: tests run 29.7.0 through jest-expo. The top-level node_modules/jest is a stray 30.0.5, and @types/jest is ^30.
- Row numbers: loop prompts sometimes use the wrong number. Check the row title.
- Rows table: status words in capitals only in the Status column; 7 columns per row.

UNFIXED
- Lint: gymSchedule.ts:41,43 (react-hooks/refs); hooks.ts:395 useWeeklyMacros (set-state-in-effect).
- Seeder: backend/scripts/seed_demo_account.go has no host guard.
- Data: old local rows mix "lunch" and "Lunch".
- Translations: es.json has two extra keys, addMenu.voice and addMenu.describeOutLoud.
- No test covers the Food tab empty state or the templates "+".
- The useApi test harness is copied in two test files.
- Unanswered for Isa: replace the templates "+" with a list control?