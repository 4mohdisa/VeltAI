# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress is counted from PHASE2_ROWS.md (ends at row 83). Prompts use row TITLE plus row number.

## State
- Branch loop/phase2. Never switch branches. Every prompt states this.
- Baseline: app tsc 0 errors; Jest 84 suites / 875 tests / 4 snapshots (green). Backend 632 pass incl. 18 TestPG_* on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg, started manually each session.
- Scope: one row, one file or component per prompt.
- Rows 27-64 reconciled (round 96). Row 50 BUILT, checked in code.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Never verified, verify, verifies, confirmed or confirm, except the identifier api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- No code change = run tsc and full Jest and say so.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe. v1 scope locked; extra ideas go to Parked.
- Phase 1 design final; do not restyle screens. Isa verifies on a device himself.
- TestPG tests run only after DSN is checked as 127.0.0.1:55432.
- plan.tsx and the AI anomaly banner have no backend: keep design, show no fabricated data. No anomaly endpoints in v1.
- Clerk sign-in needs hosted Clerk JWKS: owner step. No workaround, no auth bypass.
- Food log before Gym log. Sign-in flows are owner steps; rows BUILT on passing local mocked tests.
- loop/ files are loop-managed; prompts never edit them.
- Row 9 scope: src/lib/offline/queue.ts, additive optional onLanded only.
- Modals in src/app/_layout.tsx use reduceMotion ? 'fade' : 'slide_from_bottom'.
- Rows with no named file: use the most relevant shared file, state in report. No identical token = no code change.
- Literal swapped for token only when value identical AND semantic category matches.
- No stroke-weight, letter-spacing, icon-size or 9pt space tokens added. Off-token values stay parked.
- Stale motion rows are FOLDED, not deleted. One row per round.
- Native thread: width%, strokeDashoffset and similar layout props cannot use useNativeDriver under classic Animated. Settled.
- New render tests for files under src/components/ are named *.render.test.tsx.
- isLiquidGlassAvailable() is false outside a real iOS build; test GlassView by mocking expo-glass-effect.
- Jev ranking: follow it on small tasks; a concrete reason (data model size, risk) can override it, and the reason goes here.
- Unanswered question: after one round, use the default and do not ask again (round 97).

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 19, 23, 26-34, 36-50, 69-74, 77-83.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 29, 30, 35, 37, 51-64, 68.
- BUILT (owner check pending): gym history; rows 35 and 54 streak footnote; row 41 es/fr overflow.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.
- Row 32: FloatingHeader render test added; FloatingHeader is decorative.
- Checkpoints green: rounds 16, 23, 39, 56, 60, 63, 67, 69, 71, 73, 83, 87, 90, 93.

## Blocked on Isa
- Sign-in: backend checks tokens against hosted Clerk JWKS. E2E_EMAIL and E2E_PASSWORD not set. Blocks rows 1, 2, 5-8, 18 (PARTIAL).
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Simulator: maestro not installed. Owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Consolidated token pass (icon sizes, stroke weight, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Row 41 es/fr overflow on gym.title, common.save, common.reset: needs a real device run.
- Row 21 7-day chart: food store data model. Asked round 96, no answer by round 97. Parked for v1 by default. Do not ask again.
- Backlog: which header 'FloatingHeader' was meant to be (row 32 wording).

## Parked (not v1)
- Swipe pane has no corner radius while the row rounds corners (SwipeableRow.tsx). Design decision.
- Off-token values: Screen.tsx offsets; AddMenu radius and row height; DetailChart gaps; KickerTitle letterSpacing; LumeTabBar press scale vs opacity; history icon sizes; BlurView intensity; RING_STROKE 10; MuscleChart widths; food/add.tsx and gym/log-session.tsx TEXT_GAP; dashboard/nutrition.tsx MACRO_BAR_W 30 and radius 5/2; dashboard/week.tsx NET_BAR_W 22.
- ProgressBar VALUE_ANIMATION_MS 250 vs motion.duration.fast 260: design decision.
- Disabled opacity drift: GymCalendar 0.3, food/calendar 0.35, opacity.disabled 0.4.
- Sheet detents medium/large: no native mechanism in BottomSheet.tsx. Structural gap.
- Food log: long press to delete not discoverable. Design call.
- Goals: 'Saved as you type' untrue when a value is clamped silently.
- Account and index settings both link to Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps: product decision.
- Local test env file or script for LUME_TEST_DATABASE_URL.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts.
- Anomaly banner: no render test for null on zero anomalies.

## Next
- Round 97: Screen.tsx render smoke test (in progress).
- Then ToastHost render smoke test, then BottomSheet render smoke test.
- Then rows 1, 2, 5-8, 18: decide if mocked coverage allows BUILT checked in code.
- Then backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.1 of 2: keep tasks small, one row and one file per round.
- Mounting a real screen under test with SectionList or ScrollView refreshControl breaks JSON.stringify: use the key-filtering serializer pattern.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts has no letter-spacing, icon-size, stroke-width, bar-width or 9pt space tokens.
- Keep gym session and food.tsx entering and exit animations intact.
- es/fr strings run 2.5x to 3.7x English in some labels; LumeTabBar and Button have no numberOfLines or ellipsizeMode.
- Unresolved: SwipeableRow delete pane square corners (row 34). Needs design decision.
- Unchecked token gotchas: nutrition.tsx MACRO_BAR_W/radius, week.tsx NET_BAR_W.
- 'owner check pending' rows are BUILT for loop purposes; do not reopen them.
- Handover 3 done. Name full file paths in every prompt.