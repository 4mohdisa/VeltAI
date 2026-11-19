# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend and test flows on the simulator. Progress is counted from PHASE2_ROWS.md (83 rows; verify from the file). Prompts use row TITLE plus number.

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Round 228 done: row 11 freeze render test (freeze.render.test.tsx). Row 11 render backlog closed (templates, new-template, schedule, exercise-progress, freeze, muscles).
- Round 229 (current): row 83 stale MACRO_BAR_W note fixed in PHASE2_ROWS.md (docs only).
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Every prompt names loop/phase2 and bans git commands. One row, one file per prompt. Full paths. Grep before creating any test file. loop/ files never edited by prompts.
- Verify PHASE2_ROWS.md before trusting any row status. Latest report beats handover claims.

## Wording rule
- Use BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Real coverage = executed import that renders or uses the component.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass.
- Sign-in flows are owner steps; rows BUILT on passing local mocked tests.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Render tests: components *.render.test.tsx; screens in src/__tests__/render/. renderScreen (react-test-renderer). No RNTL (incompatible with RN 0.85.3).
- Rows 19, 20: no edit. Row 8 BUILT once all live call sites have render tests.
- Row boundaries strict. Row 7 covers only its four declared call sites.
- Local-only mutations (editSavedFood) need no API test.
- 'nutrition/week' is not a row.
- Row 21: no data model or backend change. Client aggregation over foodLogs.list per day.
- Hosted migration stays Isa's.
- Checkpoint rounds change no files.
- Stale notes in a row are corrected only when that row is next touched.
- Round 229: row 83 note fix chosen over a render test (Jev ranked render test first). Reason Jev cannot see: MACRO_BAR_W citation flagged six+ rounds; no named coverage gap without reading the row list.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights, rows 1-10, 17-19, 21, 23, 26-34, 36-51, 55, 69-74, 77-83, 38.
- BUILT (owner check pending): rows 1, 2, 5, 18, 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- BUILT checked in code: gym templates, schedule, muscles, exercise-progress, freeze, profile, rows 11, 27, 29, 30, 35, 37, 50, 51-64, 68.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Known test gaps
- Row 7 notes contain a leftover 'status stays PARTIAL' sentence. Fix when touched.
- Roughly 20 Visual QA rows cite only the generic gate. Judge per row, not by grep.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks live checks for rows 1, 2, 18.
- Row 17 plan.tsx: build plan generation or drop the card for v1. Ask once in the stop report.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for screenshots and simulator flows.
- Merging loop/design-match into main: Isa's job.
- Token pass (icon sizes, stroke weight, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Applying migrations to hosted Supabase: Isa.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show modified in git status. Isa to check.

## Parked (not v1)
- Row 21: DetailChart lays Bars as a flex row, so macros show side by side, not stacked. Needs a separate row if wanted.
- Row 21 secondary card header, note and footnote describe today's macros. Copy decision.
- Recipe and saved meal delete/unsave: no UI. Product gap.
- Row 8 notes cell long with older fragments. Trim when next touched.
- Quick add: on-device check of food log entry (owner).
- Row 34 swipe pane square corners while row rounds: design decision.
- Off-token values; ProgressBar 250 vs motion 260 ms; disabled opacity drift.
- Sheet detents medium/large: no native mechanism in BottomSheet.
- Food log long-press delete not discoverable. Goals 'Saved as you type' untrue when clamped.
- Account and index settings both link to Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- gesture-handler worklet warning in SwipeableRow: pre-existing.
- logGymSession while gymLoggedToday is true.
- Local Clerk-compatible verifier: owner step.
- Muscles and exercise-progress design gaps: product decision.
- Local test env file for LUME_TEST_DATABASE_URL.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts.
- Button and LumeTabBar lack numberOfLines (es/fr overflow risk).
- Row 2 _layout.tsx under src/app/onboarding has no test reference; navigation only.
- Audit untouched render tests with hardcoded *_date fixtures against the real clock. Pin the clock where found.
- TodayCard.tsx: a truthy malformed /api/gym/today response renders Rest day silently. Shape guard or product decision.

## Next
- Round 229: row 83 MACRO_BAR_W note fix (docs only).
- Then: read PHASE2_ROWS.md and pick the next row with a named render or test gap.
- When every row is BUILT or EXACT except owner items: ask once about row 17 plan.tsx, then the stop report.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 0.9 of 2: keep tasks small, one row and one file.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English.
- 'owner check pending' rows are BUILT; do not reopen.
- Headless Jest only for render tests; no simulator run yet.
- Console noise '[data] API unreachable' in passing tests is expected.
- Reanimated: mock ReanimatedSwipeable and stub useReducedMotion breakage per test file only.
- startScanPoller must be stubbed in any test letting pipeline or pipelineMulti resolve.
- jest.requireActual('@/lib/api').api?.scan needs the ?. (circular import).
- Multi-fragment Text children show as an array: join or use findAll.
- jest.useFakeTimers needs doNotFake: ['setImmediate'] when a test awaits a settle flush.
- Mock @/lib/api at the module boundary only; let real hooks run. Screens using Screen need SafeAreaProvider.
- Stale briefs have pointed at old row status at least six times: verify PHASE2_ROWS.md before trusting any status.