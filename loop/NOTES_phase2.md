# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines (round 40 checkpoint, green): app tsc 0 errors; Jest 81 suites / 864 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* against local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session). No hosted Supabase, Clerk or RevenueCat in repo.
- Backend: go run ./cmd/server. Auth enforced (401 without token).
- Prompt scope rule: ONE task per prompt, ONE row and ONE file or component.
- Claude Code usage limit hit at rounds 42, 43, 45. If it hits again: wait, do not change scope.

## Wording rule
- Row cells and reports say BUILT, 'checked in code' or 'owner check pending'. Never use verification words (verified, verify, verifies, confirmed, confirm) except the identifier api.scan.confirm.
- A row is BUILT only when every part is done. Partial work = PARTIAL.
- Flagged by automatic check in round 47 (row 23 report). Rule now repeated in every prompt.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope locked, extra ideas go to Parked.
- Phase 1 design final, do not restyle screens.
- Isa verifies on a device himself.
- TestPG tests run only after DSN is checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner have no backend. Keep design, show no fabricated data.
- Clerk sign in needs hosted Clerk JWKS. Owner step, no workaround, no auth bypass.
- Order of work: Food log before Gym log.
- Simulator flows needing sign in are owner steps. Rows BUILT on passing local mocked Jest and Go tests.
- Prompts must state the branch rule.
- loop/ files are loop-managed. Prompts never edit them.
- Row 75 split into food log and gym log.
- Row 77 target file is src/app/gym/session.tsx. Scope set by manager.
- Stale motion rows 65-72: fold or delete is Isa's decision.
- Row 9 scope widened to src/lib/offline/queue.ts for an additive optional onLanded on runOrQueueSequence.
- Row 35 'streak footnote at 320pt width' mapped to row 35.
- Round 35: row 80 guard conditional on a reproduced crash. None reproduced, so test only.
- Round 36: useGymPatterns central guard deferred. Call-site guards kept.
- Round 40: checkpoint baseline set to 81/864/4. Row 74 camera modals switched to screenAnimation(), reverted round 44.
- Round 44: three modals in src/app/_layout.tsx back to reduceMotion ? 'fade' : 'slide_from_bottom'.
- Round 47: dead code cleanup in mappers.ts DROPPED. subscriptionFromApi is used by src/__tests__/mappers.test.ts.
- Round 47: row 23 BUILT, checked in code (no code change). Simulator owner check pending.
- Round 47: Jev ranked row 26 first (94%). Picked row 26 to match. Not an override.
- Jev advice is advisory. Override only with a concrete reason, written in decisions.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup, baseline: BUILT.
- Food log, Gym history: BUILT (Gym history simulator owner check pending).
- Gym templates, schedule, muscles, exercise progress, freeze: checked in code, no gap.
- Gym streak, Goals, Paywall/Subscription: BUILT.
- Profile: checked in code, no gap.
- Add food, Legal: BUILT (static).
- Dashboard / Summary and sub-pages: BUILT.
- Motion audit, screen and navigation transitions: BUILT.
- Adding and removing food log entries: BUILT.
- ProgressBar, EnergyBalanceCard, DailyMacroRing ease to new values: BUILT.
- Gym log entries remove path (src/app/gym/session.tsx): BUILT, local only.
- Row 9 Gym log create reconciliation: BUILT. Simulator sign in part owner check pending.
- Rows 35 and 54 (streak footnote): BUILT, checked in code; simulator owner check pending.
- Rows 78, 79, 80, 81 gym patterns guards: BUILT.
- Row 11 exercise progress: BUILT, no gym patterns read.
- Row 74 onboarding layout Reduce Motion: BUILT, checked in code; device feel owner check pending.
- Row 74 camera modal feel: owner check pending.
- Row 23 Visual QA fades: BUILT, checked in code.
- Round 16, 23, 39 checkpoints: gates green.

## Blocked on Isa
- Sign in: backend checks tokens against hosted Clerk JWKS. Owner step.
- E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend. Product decision: build plan generation or drop the card for v1.
- Claude CLI sign in expires between 2026-11-24 and 2026-11-27. Run claude auth login before then, or set up a token (claude setup-token).
- loop/ files show uncommitted diffs. Loop-managed, not a task.
- Merging loop/design-match into main: Isa's job.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Stale motion rows 65-72 duplicate 64 and 74-77. Fold or delete.

## Parked (not v1)
- Food log: long press to delete a meal is not discoverable. Design call.
- Goals: 'Saved as you type' is untrue when a value is clamped silently.
- Account and index settings both link to Delete Account.
- Copy pass: 'owner check pending' reads awkwardly after a noun phrase.
- Rows 35 and 54 cover the same card and test file. Merge rows? Isa decision.
- Final wording sweep of PHASE2_ROWS.md for verification words (row 23 cell may need it).
- Rows 27-63: notes column blank. Investigate one per round.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps. Product decision.
- muscle_volume_map type guard checks object, not that values are numbers. Revisit only if a crash reproduces.
- Watch: transient Jest worker SIGSEGV on resetRegistry.test.ts.

## Next
- Round 47: row 26 Visual QA scrims (BottomSheet scrim opacity and timing). One file.
- Then: rows 27-63 visual QA that need no sign in, one per round, notes filled in.
- Then: final wording sweep of PHASE2_ROWS.md.
- Then: backend refinement rows.

## Known issues
- Authenticated flows cannot run end to end until sign in is solved.
- Jev risk about 1.1 of 2: keep tasks small, one row and one file per round. Run tsc and changed-file tests every round a row changes code.
- Reports and row notes: 'checked in code' only. Never 'verified'.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Row 9 runOrQueueSequence onLanded is in place (queue.ts); keep it additive.