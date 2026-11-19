# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2. Never switch branches in prompts.
- Baselines (round 40, green): app tsc 0 errors; Jest 81 suites / 864 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* on local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session). No hosted Supabase, Clerk or RevenueCat in repo.
- Backend: go run ./cmd/server. Auth enforced (401 without token).
- Scope: ONE task, ONE row, ONE file or component per prompt.
- Claude Code usage limit hit rounds 42, 43, 45, 48 (5-hour limit). If hit: wait, do not change scope.

## Wording rule
- Cells and reports: BUILT, 'checked in code' or 'owner check pending'. Never verified/verify/verifies/confirmed/confirm, except the identifier api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe. v1 scope locked; extra ideas go to Parked.
- Phase 1 design final, do not restyle screens. Isa verifies on a device himself.
- TestPG tests run only after DSN is checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign in needs hosted Clerk JWKS. Owner step, no workaround, no auth bypass.
- Order of work: Food log before Gym log. Sign-in flows are owner steps; rows BUILT on passing local mocked Jest and Go tests.
- Prompts state the branch rule. loop/ files are loop-managed; prompts never edit them.
- Row 75 split into food log and gym log. Row 77 target src/app/gym/session.tsx.
- Row 9 scope widened to src/lib/offline/queue.ts (additive optional onLanded on runOrQueueSequence).
- Row 35 'streak footnote at 320pt width' mapped to row 35.
- Row 80 guard only if a crash reproduces; none reproduced, test only.
- Round 40: checkpoint baseline 81/864/4. Round 44: three modals in src/app/_layout.tsx back to reduceMotion ? 'fade' : 'slide_from_bottom'.
- Round 47: mappers.ts dead code cleanup DROPPED (subscriptionFromApi used by tests). Row 23 BUILT, checked in code.
- Round 48: row 30 tab bar checked in code, no change needed (tokens reused, design HTML has no tab bar markup).
- Visual QA rows compare against tokens and code only. design/Lume App.html has no per-screen markup. Pixel comparison is owner check pending until screenshots exist.
- Jev advice is advisory. Override only with a concrete reason, written here.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup and baseline: BUILT.
- BUILT: Food log, Gym history (simulator owner check pending), Add food, Legal (static), Dashboard/Summary and sub-pages, Gym streak, Goals, Paywall/Subscription.
- Checked in code, no gap: Gym templates, schedule, muscles, freeze, profile. Row 11 exercise progress BUILT.
- BUILT: motion audit, screen and navigation transitions, adding and removing food log entries, ProgressBar, EnergyBalanceCard, DailyMacroRing easing, gym log remove path (local).
- BUILT: row 9 gym log create reconciliation (sign in part owner check pending).
- BUILT checked in code: rows 35 and 54 streak footnote (simulator owner check pending).
- BUILT: rows 78, 79, 80, 81 gym patterns guards.
- BUILT checked in code: row 74 onboarding Reduce Motion (device feel owner check pending). Row 74 camera modal feel: owner check pending.
- BUILT: row 23 fades, row 26 scrims, row 30 tab bar (checked in code).
- Checkpoints round 16, 23, 39: gates green.

## Blocked on Isa
- Sign in: backend checks tokens against hosted Clerk JWKS. Owner step. E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend: build plan generation or drop the card for v1.
- Claude CLI sign in expires between 2026-11-24 and 2026-11-27. Run claude auth login, or claude setup-token.
- design/ has no per-screen markup. Visual QA needs screenshots or a design export for pixel comparison.
- loop/ files show uncommitted diffs (loop-managed, not a task).
- Merging loop/design-match into main: Isa's job.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Stale motion rows 65-72 duplicate 64 and 74-77. Fold or delete.

## Parked (not v1)
- Food log: long press to delete is not discoverable. Design call.
- Goals: 'Saved as you type' is untrue when a value is clamped silently.
- Account and index settings both link to Delete Account.
- Copy pass: 'owner check pending' reads awkwardly after a noun phrase.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- Final wording sweep of PHASE2_ROWS.md.
- Rows 27-63: notes column blank. Investigate one per round.
- BottomSheet.tsx has no render test. Add one. Side finding, not a row.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps: product decision.
- muscle_volume_map type guard checks objects, not numbers. Revisit only if a crash reproduces.
- Watch: transient Jest worker SIGSEGV on resetRegistry.test.ts.

## Next
- Round 49: row 37 Visual QA 3D body. One component.
- Then: rows 27-63 Visual QA that need no sign in, one per round, notes filled in.
- Then: final wording sweep of PHASE2_ROWS.md.
- Then: backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign in is solved.
- Jev risk about 1.1 of 2: keep tasks small, one row and one file per round. Run tsc and changed-file tests every round a row changes code.
- Reports and notes: 'checked in code' only.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Row 9 onLanded in queue.ts: keep additive.