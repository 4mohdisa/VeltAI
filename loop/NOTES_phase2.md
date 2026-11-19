# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress is counted from PHASE2_ROWS.md (ends at row 82; check the tail before appending). Prompts use row TITLE plus row number.

## State
- Branch loop/phase2. Never switch branches. Every prompt states this.
- Baseline (latest run): app tsc 0 errors; Jest 83 suites / 874 tests / 4 snapshots. Backend 632 pass incl. 18 TestPG_* on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg, started manually each session. LUME_TEST_DATABASE_URL is not set in a fresh shell.
- Scope: one row, one file or component per prompt.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Never verified, verify, verifies, confirmed or confirm, except the identifier api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- No code change = run tsc and full Jest and say so. A report that skips a test run gets flagged.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe. v1 scope locked; extra ideas go to Parked.
- Phase 1 design final; do not restyle screens. Isa verifies on a device himself.
- TestPG tests run only after DSN is checked as 127.0.0.1:55432.
- plan.tsx and the AI anomaly banner have no backend: keep design, show no fabricated data.
- Clerk sign-in needs hosted Clerk JWKS: owner step. No workaround, no auth bypass.
- Food log before Gym log. Sign-in flows are owner steps; rows BUILT on passing local mocked Jest and Go tests.
- loop/ files are loop-managed; prompts never edit them.
- Row 9 scope: src/lib/offline/queue.ts, additive optional onLanded only.
- Row 80 guard only if a crash reproduces (none did; test only).
- Modals in src/app/_layout.tsx use reduceMotion ? 'fade' : 'slide_from_bottom'.
- mappers.ts dead-code cleanup dropped (subscriptionFromApi used by tests).
- Visual QA compares against tokens and code only; design/Lume App.html has no per-screen markup.
- Visual QA rows with no named file use the two most relevant shared files (state in report). If no identical token exists, end with no code change. Do not guess values.
- No stroke-weight, letter-spacing, icon-size or 9pt space tokens added. Off-token values stay parked.
- Stale motion rows are FOLDED, not deleted (status BUILT, note pointing to parent). One row per round.
- Test gate: tsc and full Jest after any round that skips Jest.
- Native thread: width%, strokeDashoffset and similar layout props cannot use useNativeDriver under classic Animated. Settled (row 76); do not re-litigate.
- Skeleton pulse 700ms is correct by design.
- Checkpoints run only when the loop note asks: tsc and full Jest, no file changes. The loop note overrides Jev's ranking on checkpoint rounds.
- New render tests for files under src/components/ must be named *.render.test.tsx.
- isLiquidGlassAvailable() is false outside a real iOS build; test GlassView by mocking expo-glass-effect.
- Row 34: tokens correct, no code change. Swipe pane corner clipping parked.

## Done
- BUILT: Task 1, local setup, row 22 baseline, Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log create and remove, motion audit and transitions, food entry add/remove, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 23, 26-34, 36, 37, 39, 41-47, 69-74, 77-82.
- BUILT checked in code: gym templates, schedule, muscles, freeze, profile, rows 11, 29, 30, 35, 37, 51-64, 68.
- BUILT (owner check pending): gym history; rows 35 and 54 streak footnote; row 41 es/fr overflow.
- Folded: 65, 66, 67, 71 into 64; 69 into 76.
- No code change: rows 27, 28, 30, 33, 34, 37, 38, 40, 41, 46, 47, 51-53, 57-59, 61, 62.
- Code changes: row 31 GlassButtons borderWidth to layout.borderWidth; row 32 GlassButtons.reduceTransparency.render.test.tsx; row 33 LumeTabBar.a11y.render.test.tsx; row 36 layout.hairline (gym and food history); row 39 EnergyBalanceCard tokens; row 42 SettingsList CHIP to space['2xl']; row 43 Screen footer to layout.hairline; row 44 ProgressBar and MacroBars tokens; row 45 MuscleChart BAR_HEIGHT to space.sm; row 82 entering animation in src/app/gym/session.tsx.
- Checkpoints green: rounds 16, 23, 39, 56, 60, 63, 67, 69, 71, 73, 83, 87, 90.

## Blocked on Isa
- Sign-in: backend checks tokens against hosted Clerk JWKS. E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- design/ has no per-screen markup: pixel QA needs screenshots or a design export.
- Simulator: maestro not installed, simctl unresponsive in sandbox. Owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Consolidated token pass (icon sizes, stroke weight, blur intensity, letter-spacing, 9pt space, Screen.tsx offsets): one design pass with Isa.
- Row 41 es/fr overflow on gym.title, common.save, common.reset: needs a real device run.

## Parked (not v1)
- Swipe pane has no corner radius while the row rounds corners (SwipeableRow.tsx, food.tsx). Design decision.
- Off-token values: Screen.tsx 40, 32, -6, 48, title gap 2; AddMenu PANEL_RADIUS 18, ROW_MIN_HEIGHT 54; DetailChart TIGHT_STAT_GAP 3, TIGHT_STAT_UNIT_GAP 7, TIGHT_STAT_TRACKING -1; KickerTitle letterSpacing; LumeTabBar press 0.86/0.96 vs opacity.pressed 0.85; icon sizes in history screens; MacroBars icon 11; BlurView intensity 40/50; RING_STROKE 10; SettingsList icon 17, chevron 14; MuscleChart NAME_WIDTH 84, VALUE_WIDTH 74.
- dashboard/nutrition.tsx and dashboard/week.tsx: literal bar constants (nutrition MACRO_BAR_W 30, MACRO_BAR_RADIUS_TOP 5, MACRO_BAR_RADIUS_BOTTOM 2; week NET_BAR_W) and barRadius/bar widths passed into DetailChart Plot are not checked against tokens. Dedicated row needed.
- ProgressBar VALUE_ANIMATION_MS 250 vs motion.duration.fast 260: design decision.
- Disabled opacity drift: GymCalendar 0.3, food/calendar 0.35, opacity.disabled 0.4.
- Sheet detents medium/large: no native mechanism in BottomSheet.tsx. Structural gap.
- Chip tint 0.14, glyph stroke 1.9 (row 38 literals).
- Render smoke tests missing: Screen.tsx, ToastHost, BottomSheet. LumeTabBar and FloatingHeader Reduce Transparency branches untested.
- Food log: long press to delete not discoverable. Design call.
- Goals: 'Saved as you type' untrue when a value is clamped silently.
- Account and index settings both link to Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps: product decision.
- muscle_volume_map guard checks objects, not numbers. Revisit only if a crash reproduces.
- MuscleChart magic numbers: promote only if another chart needs them.
- Local test env file or script for LUME_TEST_DATABASE_URL.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts (not seen rounds 65-102).

## Next
- Checkpoint this round (tsc and full app Jest, no file changes). Report counts.
- Then row 48 (DIFFERENT), then remaining non-BUILT rows, one per round.
- Then the nutrition.tsx and week.tsx bar constants row (Parked).
- Then render smoke test for the LumeTabBar Reduce Transparency branch.
- Then render smoke tests for Screen.tsx, ToastHost, BottomSheet.
- Then backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row and one file per round.
- Mounting a real screen under test with SectionList or ScrollView refreshControl breaks JSON.stringify: use the key-filtering serializer pattern.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- tokens.ts has no letter-spacing, icon-size, stroke-width or 9pt space tokens.
- Keep gym session and food.tsx entering and exit animations intact.
- es/fr strings are 2.5x to 3.7x English in settings.groupApp, gym.title, common.save, common.reset; LumeTabBar and Button have no numberOfLines or ellipsizeMode.
- 'owner check pending' rows are BUILT for loop purposes; do not reopen them.