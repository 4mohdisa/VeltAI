# Lume Loop Notes: Phase 2

## Goal
Wire every screen to local backend, make backend changes the UI needs, test flows on simulator. Progress counted from PHASE2_ROWS.md (ends row 83). Prompts use row TITLE plus number.

## State
- Branch loop/phase2 only. Never switch, push or merge. Every prompt restates this rule.
- Checkpoint round 158: tsc 0 errors; Jest 107 suites / 920 tests / 4 snapshots, all passing. Baseline.
- Handover at round 165: render tests added for signup OTP, signup dev fallback, anomaly banner/card, ai-query send path, add menu, saved foods, quick-add initial render. Last full run: tsc 0; Jest 107-108 suites, 920-921 tests, green.
- Backend 632 pass incl. 18 TestPG on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- One row, one file per prompt. Full file paths in every prompt. Grep before creating a test file.
- loop/ files show uncommitted changes (loop-managed). Prompts never edit them.

## Wording rule
- Cells and reports: BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Code or test change = run tsc and the relevant Jest; full Jest on checkpoints.
- Real coverage = executed import that renders or uses the component.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass.
- Sign-in flows are owner steps; rows BUILT on passing local mocked tests.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Render tests: components get *.render.test.tsx; screens in src/__tests__/render/. Use renderScreen (react-test-renderer). No RNTL v14: incompatible with RN 0.85.3.
- Rows 19, 20, 21: no edit. Row 8 closed; reopen only on a real importing test.
- Grep before any 'add render test' prompt; duplicates happened twice.
- Task premises can be wrong (rows 38/53/83 are not AddMenu; row 55 is). Check the row before acting.
- Minor questions are decided by the manager, not asked.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights, rows 3, 4, 17, 19, 23, 26-34, 36-51, 55, 69-74, 77-83.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 27, 29, 30, 35, 37, 38, 50, 51-64, 68.
- BUILT (owner check pending): gym history; rows 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- PARTIAL: row 1 (signup, OTP, dev fallback render tests added; live Clerk sign-in owner step remains).
- PARTIAL: row 2 onboarding (all steps have render tests; live Clerk sign-in and profile persistence owner).
- PARTIAL: row 5 quick-add (initial render tests; submit path in progress, round 166).
- PARTIAL: row 8 saved foods (foodSaved render test added).
- Folded: 65, 66, 67, 71 into 64; 69 into 76.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks rows 1, 2, 5-8, 18 (PARTIAL).
- Row 17 plan.tsx: build plan generation or drop card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Consolidated token pass (icon sizes, stroke weight, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Row 41 es/fr overflow needs device run.
- Row 21 7-day chart: food store data model. Parked for v1. Do not ask again.

## Parked (not v1)
- No real render test yet: barcode-scan, label-scan, photo-capture, new-recipe, integrations screens.
- Swipe pane square corners while row rounds (row 34): design decision.
- Off-token values across screens and components: design pass.
- ProgressBar 250 ms vs motion 260 ms; disabled opacity drift.
- Sheet detents medium/large: no native mechanism in BottomSheet.
- Food log long-press delete not discoverable. Goals 'Saved as you type' untrue when clamped.
- Account and index settings both link to Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- Pre-existing gesture-handler worklet warning in SwipeableRow (food, saved, new-recipe, new-template).
- logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa.
- Local Clerk-compatible verifier: owner step.
- Muscles and exercise-progress design gaps: product decision.
- Local test env file for LUME_TEST_DATABASE_URL.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts.
- Row 22 notes quote old counts; refresh in a numbers pass.
- Rows 38, 53, 83 cover integrations.tsx and nutrition/week, not AddMenu: fix render coverage separately.

## Next
- Round 166: quick-add submit path render test (row 5, extend quickAdd.render.test.tsx).
- Then: integrations and nutrition/week render coverage (rows 38, 53, 83).
- Then: SwipeableRow warning, only if it blocks a test.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row and one file.
- SectionList or ScrollView refreshControl breaks JSON.stringify in render tests: use the key-filtering serializer.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English; LumeTabBar and Button lack numberOfLines.
- Unresolved: SwipeableRow square corners (row 34).
- 'owner check pending' rows are BUILT; do not reopen.
- Headless Jest only for render tests; no simulator run yet.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show as modified: loop-managed, leave alone.