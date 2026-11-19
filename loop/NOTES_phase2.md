# Lume Loop Notes: Phase 2

## Goal
Wire every screen to local backend, make backend changes the UI needs, test flows on simulator. Progress counted from PHASE2_ROWS.md (ends row 83). Prompts use row TITLE plus number.

## State
- Branch loop/phase2 only. Never switch, push or merge. Every prompt restates this rule.
- Baseline round 157: tsc 0 errors; Jest 107 suites / 920 tests / 4 snapshots (last full run round 156, all passing).
- Backend 632 pass incl. 18 TestPG on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- One row, one file per prompt. Full file paths in every prompt. Grep before creating a test file.
- loop/ files show uncommitted changes (loop-managed). Prompts never edit them.

## Wording rule
- Cells and reports: BUILT, 'checked in code', 'owner check pending'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Code or test change = run tsc and the relevant Jest; full Jest on checkpoints.
- Real coverage = executed import that renders or uses the component. readFileSync, path strings, ROUTES checks and comments do not count.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data. No anomaly endpoints in v1.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass.
- Food log before Gym log. Sign-in flows are owner steps; rows BUILT on passing local mocked tests.
- loop/ files are loop-managed; prompts never edit them.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Render tests: components get *.render.test.tsx; screens go in src/__tests__/render/. Use renderScreen (react-test-renderer). Do not switch to RNTL v14: incompatible with RN 0.85.3 (accepted round 156).
- isLiquidGlassAvailable() is false outside iOS build; mock expo-glass-effect.
- Native thread: layout props cannot use useNativeDriver under classic Animated. Settled.
- Rows 19, 20, 21: no edit. Row 8 closed; reopen only on a real importing test.
- Toast owner row 51; sheet owner row 27. Paywall at src/app/onboarding/paywall.tsx.
- Stale-note edits only after grep finds a real import. Status never changes in a docs pass.
- Jev: follow on small tasks; a concrete reason can override, recorded here.
- Branch rule is mandatory in every prompt.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal terms and privacy, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, Insights, Insights/AI query (initial state and send path), AnomalyBanner and AnomalyCard (render test, round 152), rows 3, 4, 17, 23, 26-34, 36-51, 69-74, 77-83.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 27, 29, 30, 35, 37, 38, 50, 51-64, 68.
- BUILT (owner check pending): gym history; rows 35, 54; row 41 es/fr overflow; row 19 live simulator check.
- Row 2 onboarding: all 8 steps plus index, signup, paywall, measurements have render tests. Open: live Clerk sign-in and profile persistence (owner). Stays PARTIAL.
- PARTIAL: row 1 (signup, OTP, email verify, DevSignup no-key fallback render test). Live sign-in owner step remains.
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
- No real render test yet: food/add, quick-add, barcode-scan, label-scan, photo-capture, food/saved, new-recipe, integrations screens checked by grep.
- Rows 38, 53, 83 name integrations.tsx and AddMenu.tsx with no test found; verify.
- Swipe pane square corners while row rounds (row 34): design decision.
- Off-token values across screens and components: design pass.
- ProgressBar 250 ms vs motion 260 ms; disabled opacity drift.
- Sheet detents medium/large: no native mechanism in BottomSheet. Structural.
- Food log long-press delete not discoverable. Goals 'Saved as you type' untrue when clamped.
- Account and index settings both link to Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- Pre-existing gesture-handler warning in SwipeableRow.
- logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa.
- Local Clerk-compatible verifier: owner step.
- Muscles and exercise-progress design gaps: product decision.
- Local test env file for LUME_TEST_DATABASE_URL.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts.
- Row 22 notes quote old counts; refresh in a numbers pass.
- 'Add a render test' prompts have duplicated existing coverage: grep first.

## Next
- Round 157: row 19 anomaly coverage check (grep anomaly.render.test.tsx; add only if no executed import exists).
- Then unblocked PARTIAL rows and backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.1 of 2: keep tasks small, one row and one file.
- SectionList or ScrollView refreshControl breaks JSON.stringify in render tests: use the key-filtering serializer.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English; LumeTabBar and Button lack numberOfLines.
- Unresolved: SwipeableRow square corners (row 34).
- 'owner check pending' rows are BUILT; do not reopen.
- Headless Jest only for render tests; no simulator run yet.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show as modified: loop-managed, leave alone.