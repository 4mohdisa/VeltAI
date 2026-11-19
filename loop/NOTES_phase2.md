# Lume Loop Notes: Phase 2

## Goal
Wire every screen to local backend, make backend changes the UI needs, test flows on simulator. Progress counted from PHASE2_ROWS.md (ends row 83). Prompts use row TITLE plus number.

## State
- Branch loop/phase2 only. Never switch, push or merge.
- Round 173 checkpoint GREEN: tsc 0 errors; Jest 111 suites, 932 tests, 4 snapshots, --ci. Next full checkpoint: round 188.
- Round 183 handover done. Row 5 BUILT. Row 8 PARTIAL.
- Round 184: row 8 delete/unsave premise checked. No recipe or saved meal delete/unsave UI exists. Removed from row 8 scope.
- Backend 632 pass incl. 18 TestPG on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- One row, one file per prompt. Full paths in every prompt. Grep before creating any test file.
- Every prompt must name loop/phase2 and ban git commands. loop/ files are never edited by prompts.
- Task premises can be wrong: check row content and code before acting.

## Wording rule
- Cells and reports: BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
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
- Render tests: components get *.render.test.tsx; screens in src/__tests__/render/. Use renderScreen (react-test-renderer). No RNTL: incompatible with RN 0.85.3.
- Rows 19, 20, 21: no edit. Row 8: reopen only on a real importing test.
- Rows 38, 53 are integrations.tsx. Row 55 is AddMenu. 'nutrition/week' is not a row.
- Minor questions are decided by the manager. Checkpoints override Jev ranking.
- Jev ask signals are advisory. Keep run when the question is minor and blocks no row.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights, quick-add (row 5), rows 3, 4, 17, 19, 23, 26-34, 36-51, 55, 69-74, 77-83.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 27, 29, 30, 35, 37, 38, 50, 51-64, 68.
- BUILT (owner check pending): gym history; rows 5, 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- PARTIAL: row 1 (live Clerk sign-in owner step; signup OTP and dev fallback render tests added); row 2 onboarding (live sign-in and profile persistence owner); row 8 saved foods (render tests: list, empty, re-log, SwipeableRow delete, saveFood custom, recipes.create, savedMeals.log); row 18 Energy screen (render tests added; local check open).
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks rows 1, 2, 6-8, 18.
- Row 17 plan.tsx: build plan generation or drop card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Token pass (icon sizes, stroke weight, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Row 41 es/fr overflow needs device run.
- Row 21 7-day chart: food store data model. Parked for v1. Do not ask again.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show modified in git status across many rounds, untouched by loop work. Isa to check.

## Parked (not v1)
- Recipe and saved meal delete/unsave: no UI exists (api.recipes.delete, api.savedMeals.delete are dead). Product gap, not a test gap.
- No real render test yet: barcode-scan, label-scan, photo-capture.
- Quick-add: on-device check of the food log entry (owner).
- Row 8 notes cell has a stale line ('api.recipes.create and savedMeals.log still have no render coverage'). Wording cleanup for a later round.
- Row 34 swipe pane square corners while row rounds: design decision.
- Off-token values; ProgressBar 250 vs motion 260 ms; disabled opacity drift.
- Sheet detents medium/large: no native mechanism in BottomSheet.
- Food log long-press delete not discoverable. Goals 'Saved as you type' untrue when clamped.
- Account and index settings both link to Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- gesture-handler worklet warning in SwipeableRow: pre-existing.
- logGymSession while gymLoggedToday is true.
- Applying migrations to hosted Supabase: Isa.
- Local Clerk-compatible verifier: owner step.
- Muscles and exercise-progress design gaps: product decision.
- Local test env file for LUME_TEST_DATABASE_URL.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts.
- Row 22 notes quote old counts: numbers pass.
- Button and LumeTabBar lack numberOfLines (es/fr overflow risk).

## Next
- Round 185: row 8 api.recipes.log render coverage (or 'no UI call site found').
- Then: row 8 status decision (BUILT if all live call sites covered). Then row 18 Energy local check (needs simulator setup first).
- Checkpoint round 188.

## Known issues
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
- gesture-handler worklet console warning from SwipeableRow: pre-existing, not a test failure.
- Reanimated ReanimatedSwipeable ref.close() throws _WORKLET in render tests: mock the module in the test file only.
- Reanimated useReducedMotion crashes Skeleton, SkeletonCard and SwipeableRow in the render harness: stub only the broken piece inside the test file.
- Automatic check flagged round 181, 183 and 184 reports as partly done: row 8 stays PARTIAL until all its live parts are covered.