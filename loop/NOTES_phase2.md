# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress is counted from PHASE2_ROWS.md (ends at row 83). Prompts use row TITLE plus row number.

## State
- Branch loop/phase2. Never switch branches. Every prompt states this.
- Baseline: app tsc 0 errors; Jest 88 suites / 885 tests / 4 snapshots, green (round 122). Backend 632 pass incl. 18 TestPG_* on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg, started manually each session.
- Scope: one row, one file or component per prompt.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Avoid verified, confirmed and similar, except the identifier api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Code change or docs-only change = run tsc and full Jest and say so.

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
- Literal swapped for token only when value identical AND semantic category matches. Off-token values stay parked.
- Stale motion rows are FOLDED, not deleted. One row per round.
- Native thread: width%, strokeDashoffset and similar layout props cannot use useNativeDriver under classic Animated. Settled.
- New render tests for files under src/components/ are named *.render.test.tsx.
- isLiquidGlassAvailable() is false outside a real iOS build; test GlassView by mocking expo-glass-effect.
- Jev ranking: follow it on small tasks; a concrete reason (data model size, risk, scheduled checkpoint) can override it, and the reason goes here.
- Unanswered question: after one round, use the default and do not ask again.
- Render smoke tests stay folded into their visual rows.
- Stale-note corrections: edit only after grep finds a real importing test with an import statement; name the exact file. Status never changes in a docs pass. A readFileSync or path string does not count.
- Row 8 surface: src/app/food/saved.tsx used as most relevant file. No real importing test found; no edit (round 121).

## Done
- BUILT: Task 1, local setup, baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log, motion audit and transitions, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 3, 4, 17, 19, 23, 26-34, 36-51, 69-74, 77-83.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 27, 29, 30, 35, 37, 38, 50, 51-64, 68.
- BUILT (owner check pending): gym history; rows 35 and 54 streak footnote; row 41 es/fr overflow.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.
- Tests added: ToastHost.render.test.tsx (row 51), BottomSheet.render.test.tsx (row 27), FloatingHeader.reduceTransparency.render.test.tsx (row 32), Screen.render.test.tsx (row 62), signup.render.test.tsx (row 1).
- Stale-note corrections done: rows 61, 17, 52, 36, 38, 26, 83, 2, 3, 7, 1, 18 (round 122: energy.tsx via detailChrome.render.test.tsx). Rows 4, 5, 6, 8: checked, no real importing test, no change.
- Checkpoints green: rounds 16, 23, 39, 56, 60, 63, 67, 69, 71, 73, 83, 87, 90, 93, 101, 102, 104, 111, 117, 119, 120, 121, 122.

## Blocked on Isa
- Sign-in: backend checks tokens against hosted Clerk JWKS. E2E_EMAIL and E2E_PASSWORD not set. Blocks rows 1, 2, 5-8, 18 (PARTIAL).
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Simulator: maestro not installed. Owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Consolidated token pass (icon sizes, stroke weight, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Row 41 es/fr overflow on gym.title, common.save, common.reset: needs a real device run.
- Row 21 7-day chart: food store data model. Parked for v1. Do not ask again.
- Backlog: which header 'FloatingHeader' was meant to be (row 32 wording).

## Parked (not v1)
- Row 1 remainder: render tests for signup email/OTP sub-stages and DevSignup no-key fallback.
- paywall.tsx has no component render test; only source-text checks.
- Toast and sheet owning-row mapping: rows 3, 5, 7, 9, 27, 51. Pick one owning row per component.
- Stale 'no Jest' phrasing: rows 40, 55 to check. Rows 38, 53, 83 name profile/integrations.tsx and AddMenu.tsx with no test found; verify.
- No direct render test: food/add.tsx (row 4), food/quick-add.tsx (row 5), barcode-scan.tsx, label-scan.tsx, photo-capture.tsx (row 6), food/saved.tsx and food/new-recipe.tsx (row 8).
- Swipe pane has no corner radius while the row rounds corners (SwipeableRow.tsx). Design decision.
- Off-token values: Screen.tsx offsets; AddMenu radius, row height, PANEL_RING_WIDTH 0.5, ROW_MIN_HEIGHT 54, label 16/20; DetailChart gaps; KickerTitle letterSpacing; LumeTabBar press scale vs opacity; history icon sizes; BlurView intensity; RING_STROKE 10; MuscleChart widths; food/add.tsx and gym/log-session.tsx TEXT_GAP; dashboard/nutrition.tsx MACRO_BAR_W 30 and radius 5/2; dashboard/week.tsx NET_BAR_W 22. Row 38 PROVIDER_GLYPH_SIZE/STROKE, PROVIDER_CHIP_TINT. Row 53 PROVIDER_ROW_GAP, PROVIDER_NAME_SIZE/LINE_HEIGHT, PROVIDER_CHIP_SIZE, PROVIDER_CHIP_TINT, PROVIDER_GLYPH_SIZE/STROKE.
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
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts (did not recur in rounds 117, 119, 120, 121, 122).
- Anomaly banner: no render test for null on zero anomalies.
- summaryDetails.test.ts checks energy/week/training/nutrition as source text only; the real render coverage is detailChrome.render.test.tsx. Weak proof, no fix needed.

## Next
- Round 123: row 19 stale-note check (notes cell only), grep first, real import required.
- Then toast and sheet owning-row decision.
- Then row 8 surface check if still unresolved, then backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 0.9 of 2: keep tasks small, one row and one file per round.
- Mounting a real screen under test with SectionList or ScrollView refreshControl breaks JSON.stringify: use the key-filtering serializer pattern.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts has no letter-spacing, icon-size, stroke-width, bar-width or 9pt space tokens.
- Keep gym session and food.tsx entering and exit animations intact.
- es/fr strings run 2.5x to 3.7x English in some labels; LumeTabBar and Button have no numberOfLines or ellipsizeMode.
- Unresolved: SwipeableRow delete pane square corners (row 34). Needs design decision.
- Unchecked token gotchas: nutrition.tsx MACRO_BAR_W/radius, week.tsx NET_BAR_W.
- 'owner check pending' rows are BUILT for loop purposes; do not reopen them.
- Handover 3 done. Name full file paths in every prompt.