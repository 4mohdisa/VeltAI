# Lume Loop Notes: Phase 2

## Goal
Wire every screen to local backend, make backend changes the UI needs, test flows on simulator. Progress counted from PHASE2_ROWS.md (ends row 83). Prompts use row TITLE plus number.

## State
- Branch loop/phase2 only. Never switch, push or merge.
- Baseline: tsc 0 errors; Jest 90 suites / 890 tests / 4 snapshots (round 132). Backend 632 pass incl. 18 TestPG on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- One row, one file or component per prompt. Full file paths in every prompt.
- Round 133 prompt was rejected (no loop/phase2 branch rule). Round 134 prompt restates the branch rule and the report format.

## Wording rule
- Cells: BUILT, 'checked in code', 'owner check pending'. Avoid verified/confirmed except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Code or docs change = run tsc and full Jest.
- Real coverage = an actual import statement that renders or uses the component. readFileSync, path strings and comments do not count.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data. No anomaly endpoints in v1.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass.
- Food log before Gym log. Sign-in flows are owner steps; rows BUILT on passing local mocked tests.
- loop/ files are loop-managed; prompts never edit them.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Rows with no named file: use most relevant shared file, state in report. Identical token = no code change.
- Native thread: layout props cannot use useNativeDriver under classic Animated. Settled.
- Render tests: components under src/components/ get *.render.test.tsx; screens go in src/__tests__/render/.
- isLiquidGlassAvailable() is false outside iOS build; mock expo-glass-effect.
- Unanswered question: use default after one round.
- Stale-note edits only after grep finds a real import. Status never changes in a docs pass.
- Rows 19, 20, 21: no edit. Row 8 closed; reopen only on a real importing test.
- Toast owner row 51; sheet owner row 27.
- Paywall lives at src/app/onboarding/paywall.tsx.
- Jev: follow on small tasks; a concrete reason can override, recorded here.
- Loop check flag on partial tasks: close the named remaining gap next, do not redo finished work.

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 3, 4, 17, 19, 23, 26-34, 36-51, 69-74, 77-83.
- PARTIAL: row 1 (signup.render.test.tsx; live sign-in owner step). Row 2 (signup and paywall post render tests exist; signup get read-back in progress round 134; 8 steps untested).
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 27, 29, 30, 35, 37, 38, 50, 51-64, 68.
- BUILT (owner check pending): gym history; rows 35, 54; row 41 es/fr overflow.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.
- Checkpoints green rounds 16 to 132.

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
- Row 1: render tests for signup email/OTP sub-stages and DevSignup no-key fallback.
- No real render test: insights, ai-query, legal terms and privacy, food/add, quick-add, barcode-scan, label-scan, photo-capture, food/saved, new-recipe, AnomalyBanner, AnomalyCard. 8 of 11 onboarding screens (index, goal, activity, body-type, dietary, cuisine, targets, preview, done) have no render test.
- Rows 38, 53, 83 name integrations.tsx and AddMenu.tsx with no test found; verify.
- Swipe pane square corners while row rounds (SwipeableRow, row 34): design decision.
- Off-token values (Screen offsets, AddMenu, DetailChart, KickerTitle, LumeTabBar, BlurView, RING_STROKE, MuscleChart, TEXT_GAP, nutrition, week NET_BAR_W, provider constants): design pass.
- ProgressBar 250 ms vs motion 260 ms; disabled opacity drift (0.3, 0.35, 0.4).
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
- Anomaly banner: no render test for null on zero anomalies.
- Row 22 notes quote old counts; refresh in a numbers pass.
- Owning-row check for other shared components.

## Next
- Round 134: row 2 signup api.onboarding.get read-back, file src/__tests__/render/signupReadBack.render.test.tsx. Row 2 stays PARTIAL.
- Then row 2 render tests for the 8 untested onboarding steps, one file each.
- Then backend refinement rows and unblocked PARTIAL rows. Pick the candidate that clears most rows.
- Handover 4 due round 141.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2 and low clean-completion odds: keep tasks small, one row and one file.
- SectionList or ScrollView refreshControl breaks JSON.stringify in render tests: use the key-filtering serializer.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts lacks letter-spacing, icon-size, stroke-width, bar-width and 9pt space tokens.
- Keep gym session and food.tsx enter and exit animations intact.
- es/fr strings run 2.5x to 3.7x English; LumeTabBar and Button lack numberOfLines.
- Unresolved: SwipeableRow square corners (row 34).
- 'owner check pending' rows are BUILT; do not reopen.