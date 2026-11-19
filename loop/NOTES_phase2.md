# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2. Never switch branches. Every prompt names this rule and the branch check.
- Baselines (round 90 checkpoint, still holding at round 92): app tsc 0 errors; Jest 81 suites / 869 tests / 4 snapshots. Backend 632 pass incl. 18 TestPG_* on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session). LUME_TEST_DATABASE_URL is not set in a fresh shell.
- Scope: ONE task, ONE row, ONE file or component per prompt.
- Claude CLI sign-in ends 2026-11-24 to 2026-11-27. Owner step.
- PHASE2_ROWS.md ends at row 82. Check the tail before appending.
- Handover happened at round 92. Prompts must name files fully.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Never verified/verify/verifies/confirmed/confirm, except identifier api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- A report that skips a test run gets flagged. If no code changed, run tsc and full Jest and say so.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe. v1 scope locked; extra ideas go to Parked.
- Phase 1 design final, do not restyle screens. Isa verifies on a device himself.
- TestPG tests run only after DSN is checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign-in needs hosted Clerk JWKS. Owner step, no workaround, no auth bypass.
- Food log before Gym log. Sign-in flows are owner steps; rows BUILT on passing local mocked Jest and Go tests.
- loop/ files are loop-managed; prompts never edit them.
- Row 9 scope: src/lib/offline/queue.ts, additive optional onLanded only.
- Row 80 guard only if a crash reproduces; none did, test only.
- Three modals in src/app/_layout.tsx use reduceMotion ? 'fade' : 'slide_from_bottom'.
- mappers.ts dead code cleanup DROPPED (subscriptionFromApi used by tests).
- Visual QA compares against tokens and code only. design/Lume App.html has no per-screen markup.
- Visual QA rows with no named file use the two most relevant shared files, stated in notes.
- Visual QA rows end in no code change when no identical token exists. Do not guess values.
- No stroke-weight, letter-spacing or 9pt space tokens added. Off-token values stay parked for one design pass.
- Stale motion rows: FOLD, not delete. Folded row gets status BUILT and a note pointing to its parent. One row per round.
- Test gate: tsc and full Jest after any round that skips Jest.
- Native thread: width%, strokeDashoffset and similar layout props cannot use useNativeDriver under classic Animated. Row 76 settled this. Do not re-litigate.
- Skeleton pulse 700ms is correct by design. Not a gap.
- Every prompt must name the loop/phase2 branch rule explicitly.
- Checkpoint rounds run only when the loop note asks for one: tsc and full Jest, no file changes.
- New render tests for files under src/components/ must be named *.render.test.tsx (jest-expo render project).
- isLiquidGlassAvailable() is false outside a real iOS build; test the GlassView branch by mocking expo-glass-effect.

## Done
- Task 1, local setup, row 22 baseline: BUILT.
- BUILT: Food log, Add food, Legal, Dashboard/Summary, Gym streak, Goals, Paywall/Subscription, gym log create and remove, motion audit and transitions, food entry add/remove, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 23, 26-28, 31, 32, 33, 69, 70, 71, 72, 74, 77, 78-82.
- BUILT checked in code: Gym templates, schedule, muscles, freeze, profile, rows 11, 29, 30, 35, 37, 51-64, 68.
- Folded: 65, 66, 67 into 64; 71 into 64; 69 into 76.
- BUILT (owner check pending): Gym history, rows 35 and 54 streak footnote.
- No code change: rows 27, 28, 30, 33, 37, 51-53, 57-59, 61, 62.
- Row 31: GlassButtons.tsx solidGlass borderWidth literal swapped for layout.borderWidth.
- Row 32: GlassButtons.reduceTransparency.render.test.tsx added.
- Row 33: LumeTabBar.a11y.render.test.tsx added (3 cases). Component already had role, label, selected state.
- Row 82 gym session: entering animation added in src/app/gym/session.tsx with gymSessionRemoveExtra.render.test.tsx.
- Checkpoints green: rounds 16, 23, 39, 56, 60, 63, 67, 69, 71, 73, 83, 87, 90.

## Blocked on Isa
- Sign-in: backend checks tokens against hosted Clerk JWKS. Owner step. E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27. Run claude auth login.
- design/ has no per-screen markup. Pixel QA needs screenshots or a design export.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Row 69 fold conflict: handover said open, Done says folded into 76. Confirm once, then close.

## Parked (not v1)
- Off-token values (one design pass with Isa): Screen.tsx 40, 40, 32, -6, title gap 2; AddMenu PANEL_RADIUS 18, ROW_MIN_HEIGHT 54; DetailChart TIGHT_STAT_GAP 3, TIGHT_STAT_UNIT_GAP 7, TIGHT_STAT_TRACKING -1; KickerTitle letterSpacing 1.1, -0.6; LumeTabBar press 0.86/0.96 vs opacity.pressed 0.85; icon sizes 18/26; BlurView intensity 40/50; GlassButtons has no icon or blur token category.
- Disabled opacity drift: GymCalendar 0.3, food/calendar 0.35, opacity.disabled 0.4.
- Sheet detents medium/large: no native mechanism in BottomSheet.tsx. Structural gap.
- Stroke-weight token missing. Chip tint 0.14, glyph stroke 1.9.
- Render smoke tests missing: Screen.tsx, ToastHost, BottomSheet. LumeTabBar and FloatingHeader Reduce Transparency branches untested with flag on.
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
- MuscleChart magic numbers: promote to tokens only if another chart needs them.
- Local test env file or script for LUME_TEST_DATABASE_URL (repo tooling).
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts (not recurred rounds 65-92).

## Next
- Round 93: Row 34 Visual QA: delete flow (SwipeableRow.tsx and food.tsx, or the files row 34 names).
- Then rows 35-50 (Visual QA), one per round, skipping BUILT rows.
- Then render smoke test for LumeTabBar Reduce Transparency branch.
- Then render smoke test for Screen.tsx, then backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row and one file per round.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- Gotcha: tokens.ts has no letter-spacing or 9pt space tokens; one design pass with Isa.
- Gotcha: PHASE2_ROWS.md ends at row 82. Check the tail before appending.
- Gotcha: gym session now has entering and exit animation; food.tsx has both.