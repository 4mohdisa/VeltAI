# Lume Loop Notes: Phase 2

## Goal
Wire every row in PHASE2_ROWS.md to the local backend and test flows. Progress is counted from PHASE2_ROWS.md. Verify the file before trusting any status.

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Round 246 checkpoint green (tsc 0; Jest 133 suites, 985 tests, 4 snapshots). Backend go test green, TestPG skipped.
- Round 255: row 9 widened to useGymRange(2) in TodayCard LoggedCard, one test added.
- Round 256 read-only check: 84 rows, all BUILT.
- Round 257: row 5 pipe fix. All 84 rows now 9 pipes.
- Round 258: row 18 Notes wording, one cell only. Done. Status word removed from sentence.
- Round 259 (current): read-only check of row 17 cell, status counts, and plan code. No edits.
- Prompts: one row or one checkpoint, one file, full paths, grep before creating a test file. Every prompt states the loop/phase2 branch rule. Prompts never edit loop/ files.
- A loop flag on a report means the gate runs next round.

## Wording rule
- Use BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Real coverage = executed import that renders or uses the component.
- Status word in capitals appears only in the Status cell.

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
- Local-only mutations (editSavedFood) need no API test.
- Row 21: no data model or backend change. Client aggregation over foodLogs.list per day.
- Hosted migrations stay Isa's. Checkpoint rounds change no files.
- Stale notes in a row are corrected only when that row is next touched.
- Row 9 includes the TodayCard malformed-response guard and the retry notice for a session missing from the range.
- Row 84 focus refetch uses a silent revalidate. Never list revalidate in a caller's deps. Use [] on focus callbacks.
- Round 252: chose the row 83 doc fix over LoggedCard (row 9 scope).
- Round 255: accepted row 9 widening. Round 256: verify before asking about row 17.
- Round 257: row 5 pipe fix before row 18 wording (table parsing first).
- Round 258: row 17 read-only check before asking Isa.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights.
- BUILT: rows 1-11, 17-19, 21, 23, 26-34, 36-51, 55, 69-74, 77-84, 38.
- Row 21 weekly stacked chart: useWeeklyMacros in src/lib/data/hooks.ts.
- BUILT (owner check pending): rows 1, 2, 5, 18, 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- BUILT checked in code: gym templates, schedule, muscles, exercise-progress, profile, rows 27, 29, 30, 35, 37, 50, 51-64, 68.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Known test gaps
- About 20 Visual QA rows cite only the generic gate. Judge per row.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks live checks for rows 1, 2, 18.
- Row 17 plan.tsx: build plan generation or drop the card for v1. Ask once in the stop report, after the round 259 read-only check of the row 17 cell.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for simulator flows.
- Merge loop/design-match into main: Isa.
- Token pass (icon sizes, stroke, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Hosted Supabase migrations: Isa.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md modified in git status: Isa to check.

## Parked (not v1)
- Row 21: DetailChart lays Bars as a flex row, not stacked. Copy decision.
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
- Muscles and exercise-progress design gaps: product decision.
- Transient Jest SIGSEGV on resetRegistry.test.ts.
- Button and LumeTabBar lack numberOfLines (es/fr overflow risk).
- Audit render tests with hardcoded *_date fixtures against the real clock. Pin the clock where found.
- Server 'today' uses fixed LUME_TIMEZONE, not device timezone. Documented in backend/internal/config/config.go.
- Two useFocusEffect calls in gym.tsx (refetchMonth, revalidate): possible consolidation.
- Local Clerk-compatible verifier and local test env file for LUME_TEST_DATABASE_URL: owner steps.
- Row 9: a session outside the 2-day range shows the retry notice, not the detail. Known limit, untested edge.

## Next
- Round 259: read-only check of row 17 cell, status counts, and plan code (no edits).
- Then: decide the row 17 question using the real count. Ask Isa once.
- When every row is BUILT or EXACT except owner items: ask once about row 17, then the stop report.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row, one file.
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
- Count pipes against the header row before and after any PHASE2_ROWS.md edit.
- Verify PHASE2_ROWS.md before trusting any status.
- Jest SIGSEGV on resetRegistry.test.ts is transient; rerun before blaming a change.
- TodayCard LoggedCard: session missing from the fetched range renders no extra detail, no error (see row 9 Parked).