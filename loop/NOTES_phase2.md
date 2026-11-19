# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2. Never switch branches in prompts. Every prompt must say so.
- Baselines (round 56 checkpoint, green): app tsc 0 errors; Jest 81 suites / 867 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* on local DB (last full backend run round 39).
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session).
- Scope: ONE task, ONE row, ONE file or component per prompt.
- Claude Code 5-hour limit hit several times. If hit: wait, do not change scope.
- Claude CLI sign-in ends 2026-11-24 to 2026-11-27. Owner step: claude auth login.
- Handover at round 56. Claude Code knows only the summary: name files fully.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Never verified/verify/verifies/confirmed/confirm, except the identifier api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- A report that says tests were not run gets flagged. If no code changed, run tsc and say so.

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
- Round 44: three modals in src/app/_layout.tsx use reduceMotion ? 'fade' : 'slide_from_bottom'.
- Round 47: mappers.ts dead code cleanup DROPPED (subscriptionFromApi used by tests).
- Rows 30, 37, 51, 52, 53 checked in code, no change. Pixel checks are owner check pending. No stroke-weight token exists.
- Visual QA compares against tokens and code only. design/Lume App.html has no per-screen markup.
- Visual QA rows end in no code change when no identical token exists. Do not guess values.
- Round 54 and 56: Jev overridden where a concrete reason was written. Jev advice is advisory.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup and baseline: BUILT.
- BUILT: Food log, Add food, Legal, Dashboard/Summary and sub-pages, Gym streak, Goals, Paywall/Subscription, gym log create and remove, motion audit and transitions, food entry add/remove, ProgressBar, EnergyBalanceCard, DailyMacroRing, rows 78-81 gym guards, row 23 fades, row 26 scrims, row 74 Reduce Motion.
- BUILT checked in code: Gym templates, schedule, muscles, freeze, profile, row 11, rows 30, 35, 37, 51, 52, 53, 54, 55, 56.
- BUILT (simulator owner check pending): Gym history, rows 35 and 54 streak footnote.
- Checkpoints: rounds 16, 23, 39, 56 gates green.

## Blocked on Isa
- Sign-in: backend checks tokens against hosted Clerk JWKS. Owner step. E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27. Run claude auth login.
- design/ has no per-screen markup. Pixel QA needs screenshots or a design export.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Merging loop/design-match into main: Isa's job.
- Stale motion rows 65-72 duplicate 64 and 74-77. Fold or delete.

## Parked (not v1)
- AddMenu one-off values (PANEL_RADIUS 18, ROW_MIN_HEIGHT 54) close to radius and buttonHeight 52 but not equal. Design re-check needed.
- DetailChart TIGHT_STAT_GAP 3 and TIGHT_STAT_UNIT_GAP 7 sit just under space.xs 4 and space.sm 8, no comment. Design re-check needed.
- Stroke-weight token missing in tokens.ts (affects tick and icon rows).
- ToastHost and BottomSheet have no render test. Side findings.
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
- Chip tint ratio 0.14 and glyph stroke 1.9: one combined token only if more chips need them.
- Watch: transient Jest SIGSEGV on resetRegistry.test.ts (did not recur in round 56).

## Next
- Round 57: Row 57 Visual QA: unit gap and tracking (in progress, DetailChart.tsx TIGHT_STAT_TRACKING).
- Then rows 58-63 Visual QA, one per round.
- Then: final wording sweep. Then backend refinement rows.
- Backend full run due at next checkpoint (round 39 was the last).

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.0 of 2: keep tasks small, one row and one file per round.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Row 9 onLanded in queue.ts: keep additive.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.