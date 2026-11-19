# Lume Loop Notes: Phase 2

## Goal
Wire every screen to local backend, test flows on simulator. Progress counted from PHASE2_ROWS.md (84 rows). Prompts use row TITLE plus number.

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Round 217: checkpoint. Full tsc and full app Jest, no file changes, report failures.
- Round 216: row 21 BUILT (nutrition.tsx wired to useWeeklyMacros, render test added).
- Last checkpoint GREEN: round 213 (tsc 0 errors; Jest 123 suites, 967 tests, 4 snapshots). Live counts; old numbers are stale.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Every prompt names loop/phase2 and bans git commands. One row, one file per prompt. Full paths. Grep before creating any test file. loop/ files never edited by prompts.
- Latest report beats handover claims. Verify PHASE2_ROWS.md before trusting a row status.

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
- Row 21: no data model change, no backend change. Client aggregation over foodLogs.list per day. Macros variant out of scope. Hosted migration stays Isa's.
- Checkpoint rounds change no files (round 217 kept over Jev's snapshot pick, to see real failures first).

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights, rows 1-8, 17-19, 21, 23, 26-34, 36-51, 55, 69-74, 77-83, 38.
- BUILT (owner check pending): gym history; rows 1, 5, 18, 35, 54; row 41 es/fr overflow; row 19 live simulator check; row 2 live Clerk sign-in and profile persistence.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 27, 29, 30, 35, 37, 50, 51-64, 68.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks live checks for rows 1, 2, 18.
- Row 17 plan.tsx: build plan generation or drop card for v1. Ask once in the stop report.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for screenshots and simulator flows.
- Merging loop/design-match into main: Isa's job.
- Token pass (icon sizes, stroke weight, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Applying migrations to hosted Supabase: Isa.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show modified in git status; untouched by loop work. Isa to check.

## Parked (not v1)
- Row 21 follow-up: DetailChart Plot lays multiple Bars as a flex row, so the 4 macros show as side-by-side bars, not one stacked column. Needs DetailChart change (separate row if wanted).
- Row 21 Secondary card header, note and footnote still describe today's macros, not the 7-day chart. Copy decision.
- Recipe and saved meal delete/unsave: no UI. Product gap.
- Row 8 notes cell is long with older contradictory fragments. Trim when next touched.
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

## Next
- Round 217: checkpoint (full tsc and full Jest, no changes). Read the failures, then re-rank.
- If detailChrome macros snapshot fails: regenerate only that snapshot in a later round, then check the diff.
- When every row is BUILT or EXACT except owner items: ask once about row 17 plan.tsx, then the stop report.

## Known issues
- detailChrome.render.test.tsx macros snapshot may be stale after useWeeklyMacros change (not yet run).
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row and one file.
- SectionList or ScrollView refreshControl breaks JSON.stringify in render tests: use key-filtering serializer.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English.
- 'owner check pending' rows are BUILT; do not reopen.
- Headless Jest only for render tests; no simulator run yet.
- Console noise '[data] API unreachable' and '[data] background sync failed' in passing tests is expected.
- Reanimated ReanimatedSwipeable ref.close() throws _WORKLET in render tests: mock the module in the test file only.
- Reanimated useReducedMotion crashes Skeleton, SkeletonCard, SkeletonList and SwipeableRow in render harness: stub only the broken piece inside the test file.
- startScanPoller must be stubbed in any test letting pipeline or pipelineMulti resolve.
- jest.requireActual('@/lib/api').api?.scan needs the ?. (circular import).
- Stale briefs have pointed at old row status at least four times: verify PHASE2_ROWS.md before trusting any status.