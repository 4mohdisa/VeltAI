# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2. Never switch branches. Every prompt states this rule and the branch check.
- Baselines (gate green round 73): app tsc 0 errors; Jest 81 suites / 867 tests / 4 snapshots. Backend 632 pass incl. 18 TestPG_* on local DB (last full backend run round 39).
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session).
- Scope: ONE task, ONE row, ONE file or component per prompt.
- Claude CLI sign-in ends 2026-11-24 to 2026-11-27. Owner step: claude auth login.
- PHASE2_ROWS.md runs to row 81. Check the true end before appending.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Never verified/verify/verifies/confirmed/confirm, except the identifier api.scan.confirm.
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
- Row 75 split into food log and gym log. Row 77 target src/app/gym/session.tsx.
- Row 9 scope: src/lib/offline/queue.ts, additive optional onLanded only.
- Row 80 guard only if a crash reproduces; none did, test only.
- Three modals in src/app/_layout.tsx use reduceMotion ? 'fade' : 'slide_from_bottom'.
- mappers.ts dead code cleanup DROPPED (subscriptionFromApi used by tests).
- Visual QA compares against tokens and code only. design/Lume App.html has no per-screen markup.
- Visual QA rows end in no code change when no identical token exists. Do not guess values.
- No stroke-weight, letter-spacing or 9pt space tokens added. Off-token values stay parked for one design pass.
- Stale motion rows: FOLD, not delete. Folded row gets status BUILT and a note pointing to its parent. One row per round.
- Test gate: tsc and full Jest after any round that skips Jest.
- Native thread: width%, strokeDashoffset and similar layout props cannot use useNativeDriver under classic Animated. Row 76 settled this. Do not re-litigate in motion rows.
- Skeleton pulse 700ms is correct by design (continuous pulse, motion token). Not a gap.
- Rejected prompt (round 70 note): every prompt must name the loop/phase2 branch rule explicitly.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup and baseline: BUILT.
- BUILT: Food log, Add food, Legal, Dashboard/Summary and sub-pages, Gym streak, Goals, Paywall/Subscription, gym log create and remove, motion audit and transitions, food entry add/remove, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 78-81 gym guards, row 23 fades, row 26 scrims, row 74 Reduce Motion, row 77 gym removeExtra exit animation.
- BUILT checked in code: Gym templates, schedule, muscles, freeze, profile, rows 11, 30, 35, 37, 51-56, 58, 60, 63, 64, 65 (folded into 64), 66 (folded into 64), 67 (folded into 64), 68, 69 (duplicate of 76), 70 (folded into 64), 71 (folded into 64).
- BUILT (simulator owner check pending): Gym history, rows 35 and 54 streak footnote.
- No code change: rows 30, 37, 51, 52, 53, 57, 59, 61, 62.
- Checkpoints green: rounds 16, 23, 39, 56, 60, 63, 67, 69, 71, 73.

## Blocked on Isa
- Sign-in: backend checks tokens against hosted Clerk JWKS. Owner step. E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27. Run claude auth login.
- design/ has no per-screen markup. Pixel QA needs screenshots or a design export.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Merging loop/design-match into main: Isa's job.

## Parked (not v1)
- Session.tsx picker: gym extras have no entering animation (food.tsx has rowEntering). Parity row, after rows 70-72.
- Render smoke test for Screen.tsx and GlassButtons.tsx (zero Jest coverage).
- Off-token values: Screen.tsx 40, 40, 32 and DETAIL_BACK_TOP -6; AddMenu PANEL_RADIUS 18, ROW_MIN_HEIGHT 54; DetailChart TIGHT_STAT_GAP 3, TIGHT_STAT_UNIT_GAP 7, TIGHT_STAT_TRACKING -1; KickerTitle letterSpacing 1.1, -0.6; LumeTabBar plus-button press 0.86 and 0.96 vs opacity.pressed 0.85. One design re-check with Isa.
- Stroke-weight token missing (tick and icon rows). Chip tint 0.14 and glyph stroke 1.9: one token only if more chips need them.
- ToastHost and BottomSheet have no render test.
- Food log: long press to delete is not discoverable. Design call.
- Goals: 'Saved as you type' is untrue when a value is clamped silently.
- Account and index settings both link to Delete Account.
- Copy pass: 'owner check pending' reads awkwardly after a noun phrase. Final wording sweep of PHASE2_ROWS.md.
- Rows 27-63: notes column blank. Backfill in progress.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps: product decision.
- muscle_volume_map guard checks objects, not numbers. Revisit only if a crash reproduces.
- MuscleChart magic numbers: promote to tokens only if another chart needs them.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts (did not recur rounds 65, 69, 70, 71, 72, 73).

## Next
- Round 74 (running): row 72 'Motion: toasts'. Check later rows for a close first (fold if closed). Otherwise gap check on ToastHost and its toast item. Fix only in that file, or fold.
- Then session.tsx entering-animation parity row (gym extras).
- Then final wording sweep. Then render smoke test. Then backend refinement rows.
- Backend full run due at next checkpoint (round 39 was the last).

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row and one file per round.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Row 9 onLanded in queue.ts: keep additive.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- Gotcha: the gym session row has an exit animation but no matching entering animation (food.tsx has both).
- Gotcha: tokens.ts has no letter-spacing or 9pt space tokens; one design pass with Isa, not per-row notes.
- Gotcha: PHASE2_ROWS.md runs to row 81, not 72. Check the end before appending.