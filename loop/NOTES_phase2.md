# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend and test flows. Progress is counted from PHASE2_ROWS.md (83 rows; verify the file).

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Round 232 (current): checkpoint. Full app type check and full Jest suite, no file changes, report failures.
- Round 231 prompt was rejected before it ran (no branch rule). Row 83 Notes cell reword is still pending.
- Prompts: one row or one checkpoint, one file, full paths, grep before creating a test file, no git commands, state the loop/phase2 rule. Prompts never edit loop/ files.
- Verify PHASE2_ROWS.md before trusting any status. Latest report beats handover.

## Wording rule
- Use BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Real coverage = executed import that renders or uses the component.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass. Sign-in flows are owner steps; rows BUILT on passing local mocked tests.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Render tests: components *.render.test.tsx; screens in src/__tests__/render/. renderScreen via react-test-renderer. No RNTL (RN 0.85.3).
- Rows 19, 20: no edit. Row 8 BUILT once all live call sites have render tests.
- Row boundaries strict. Row 7 covers only its four declared call sites.
- Local-only mutations (editSavedFood) need no API test. 'nutrition/week' is not a row.
- Row 21: no data model or backend change. Client aggregation over foodLogs.list per day.
- Hosted migrations stay Isa's. Checkpoint rounds change no files.
- Stale notes in a row are corrected only when that row is next touched.
- Round 232: run chosen over ask (Jev 89% ask). Only Isa item is row 17, already parked for the stop report. Checkpoint is scheduled and the baseline is unknown.
- Round 231 scope: column 7 of row 83 is in scope for the next normal round.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights.
- BUILT: rows 1-10, 17-19, 21, 23, 26-34, 36-51, 55, 69-74, 77-83, 38.
- Row 21 weekly stacked chart: useWeeklyMacros in src/lib/data/hooks.ts.
- BUILT (owner check pending): rows 1, 2, 5, 18, 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- BUILT checked in code: gym templates, schedule, muscles, exercise-progress, freeze, profile, rows 11, 27, 29, 30, 35, 37, 50, 51-64, 68.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Known test gaps
- Row 7 notes: leftover 'status stays PARTIAL' sentence. Fix when touched.
- Row 83 Notes cell (column 7) still has the MACRO_BAR_W literal. Reword in the next normal round.
- About 20 Visual QA rows cite only the generic gate. Judge per row.

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
- Transient Jest SIGSEGV on resetRegistry.test.ts.
- Button and LumeTabBar lack numberOfLines (es/fr overflow risk).
- Row 2 _layout.tsx under src/app/onboarding: no test reference.
- Audit render tests with hardcoded *_date fixtures against the real clock. Pin the clock where found.
- TodayCard.tsx: a truthy malformed /api/gym/today response renders Rest day silently. Shape guard or product decision.

## Next
- Round 232: checkpoint (full type check and Jest, no changes).
- Round 233: row 83 Notes cell reword, column 7 only, grep MACRO_BAR_W must return zero. Fix any red gate from 232 if it is small.
- Then read PHASE2_ROWS.md and pick the next row with a named render or test gap.
- When every row is BUILT or EXACT except owner items: ask once about row 17, then the stop report.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 0.9 of 2: keep tasks small, one row, one file.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English.
- 'owner check pending' rows are BUILT; do not reopen.
- Headless Jest only; no simulator run yet. '[data] API unreachable' console noise is expected.
- Reanimated: mock ReanimatedSwipeable and stub useReducedMotion per test file only.
- startScanPoller must be stubbed wherever pipeline resolves.
- jest.requireActual('@/lib/api').api?.scan needs ?. (circular import).
- Multi-fragment Text children show as an array: join or use findAll.
- jest.useFakeTimers needs doNotFake: ['setImmediate'] when a test awaits a settle flush.
- Mock @/lib/api at the module boundary only. Screens using Screen need SafeAreaProvider.
- Skeleton/SkeletonList crashes on useReducedMotion in the harness: stub per file.
- Override useLocalSearchParams per file when a screen needs a route param. Pickers mount invisibly: mock their data hooks.
- Stale briefs have pointed at old row status six+ times: verify PHASE2_ROWS.md before trusting any status.