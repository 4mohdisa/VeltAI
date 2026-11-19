# Lume Loop Notes: Phase 2

## Goal
Wire every row in PHASE2_ROWS.md to the local backend and test flows. Progress is counted from PHASE2_ROWS.md (83 rows; verify the file).

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Round 239 (current): checkpoint gate (tsc + full Jest), no file changes. Flagged by loop: round 238 ran no gate.
- Round 238 done: row 83 Notes cell describes the current stacked chart. MACRO_BAR_W stale note resolved.
- Round 237 done: TodayCard malformed-response guard (isValidTodayWorkout in src/components/gym/TodayCard.tsx) with src/__tests__/render/todayCard.render.test.tsx. Recorded under row 9.
- Round 232 checkpoint GREEN: tsc 0 errors, Jest 132 suites, 982 tests, 4 snapshots.
- Prompts: one row or one checkpoint, one file, full paths, grep by content before creating a test file, no git commands. Prompts never edit loop/ files. Every prompt must state the loop/phase2 branch rule.
- Verify PHASE2_ROWS.md before trusting any status. Latest report beats handover.

## Wording rule
- Use BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Real coverage = executed import that renders or uses the component.
- A round that changes no code still runs the gate when the loop flags it.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass. Rows BUILT on passing local mocked tests.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Render tests: components *.render.test.tsx; screens in src/__tests__/render/. renderScreen via react-test-renderer. No RNTL (RN 0.85.3).
- Rows 19, 20: no edit. Row 8 BUILT once all live call sites have render tests.
- Row boundaries strict. Row 7 covers only its four declared call sites.
- Local-only mutations (editSavedFood) need no API test. 'nutrition/week' is not a row.
- Row 21: no data model or backend change. Client aggregation over foodLogs.list per day.
- Hosted migrations stay Isa's. Checkpoint rounds change no files.
- Stale notes in a row are corrected only when that row is next touched.
- Round 232: run chosen over ask. Only Isa item is row 17, parked for the stop report.
- Round 234: keep scope small (Jev 33% clean on last task).
- Round 235: existing render test counts as row 2 coverage. Default used.
- Round 237: test location answered by repo convention. TodayCard guard recorded under row 9.
- Round 238: run over ask. Smallest task chosen.
- Round 239: run over ask (Jev 89%). Gate flag treated as a checkpoint with no file changes.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights.
- BUILT: rows 1-11, 17-19, 21, 23, 26-34, 36-51, 55, 69-74, 77-83, 38.
- Row 21 weekly stacked chart: useWeeklyMacros in src/lib/data/hooks.ts.
- BUILT (owner check pending): rows 1, 2, 5, 18, 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- BUILT checked in code: gym templates, schedule, muscles, exercise-progress, profile, rows 27, 29, 30, 35, 37, 50, 51-64, 68.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Known test gaps
- Row 7 notes: leftover 'status stays PARTIAL' sentence. Fix when touched (next after gate).
- About 20 Visual QA rows cite only the generic gate. Judge per row.
- LoggedCard: if sessionId is not in the fetched range, session is undefined and LoggedSessionDetail silently does not render. Possible gap, not confirmed. Audit after notes are clean.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks live checks for rows 1, 2, 18.
- Row 17 plan.tsx: build plan generation or drop the card for v1. Ask once in the stop report.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for simulator flows.
- Merge loop/design-match into main: Isa.
- Token pass (icon sizes, stroke, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Hosted Supabase migrations: Isa.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md modified in git status: Isa to check.

## Parked (not v1)
- Row 21: DetailChart lays Bars as a flex row, not stacked. Card header, note and footnote describe today's macros: copy decision.
- Recipe and saved meal delete/unsave: no UI.
- Row 8 notes cell long. Trim when touched.
- Quick add on-device check (owner). Row 34 swipe pane square corners: design decision.
- Off-token values; ProgressBar 250 vs motion 260 ms; disabled opacity drift.
- Sheet detents medium/large: no native mechanism.
- Food log long-press delete not discoverable. Goals 'Saved as you type' untrue when clamped.
- Account and index settings both link Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- gesture-handler worklet warning in SwipeableRow: pre-existing.
- logGymSession while gymLoggedToday is true.
- Local Clerk-compatible verifier and local test env file for LUME_TEST_DATABASE_URL: owner steps.
- Muscles and exercise-progress design gaps: product decision.
- Transient Jest SIGSEGV on resetRegistry.test.ts (did not trigger in round 232).
- Button and LumeTabBar lack numberOfLines (es/fr overflow risk).
- Audit render tests with hardcoded *_date fixtures against the real clock. Pin the clock where found.

## Next
- Round 239: checkpoint gate (tsc + full Jest). Read result before any other row.
- Then: row 7 stale PARTIAL sentence fix.
- Then: LoggedCard silent-undefined session audit (read first, fix only if confirmed).
- When every row is BUILT or EXACT except owner items: ask once about row 17, then the stop report.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 0.9 to 1.2 of 2: keep tasks small, one row, one file.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English.
- 'owner check pending' rows are BUILT; do not reopen.
- Headless Jest only; no simulator run yet. '[data] API unreachable' console noise is expected.
- Reanimated: mock ReanimatedSwipeable and stub useReducedMotion per test file only.
- startScanPoller must be stubbed wherever pipeline resolves.
- Mock @/lib/api at the module boundary only. Screens using Screen need SafeAreaProvider.
- Skeleton/SkeletonList crashes on useReducedMotion in the harness: stub per file.
- Override useLocalSearchParams per file when a screen needs a route param.
- Multi-fragment Text children show as an array: join or use findAll.
- jest.useFakeTimers needs doNotFake: ['setImmediate'] when a test awaits a settle flush.
- Stale briefs have pointed at old row status six+ times: verify PHASE2_ROWS.md before trusting any status.