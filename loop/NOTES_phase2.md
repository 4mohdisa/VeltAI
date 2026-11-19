# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, test key flows on the iOS Simulator. Progress counted from PHASE2_ROWS.md. Prompts use row TITLES plus row number.

## State
- Branch loop/phase2 (from loop/design-match). Never switch branches in prompts.
- Baselines (round 39 checkpoint, green): app tsc 0 errors; Jest 81 suites / 864 tests / 4 snapshots; backend 632 pass incl. 18 TestPG_* against local DB.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg (started manually each session). No hosted Supabase, Clerk or RevenueCat in repo.
- Backend: go run ./cmd/server. Auth enforced (401 without token).
- Prompt scope rule: ONE task per prompt, ONE row and ONE file or component.
- Handover at round 42/43: Claude Code knows only the handover summary. Name files fully.
- Claude Code usage limit hit at rounds 42, 43. Resets 5:40pm Adelaide.

## Wording rule
- Row cells and reports say BUILT, 'checked in code' or 'owner check pending'. Never use verification words (verified, verify, verifies, confirmed, confirm) except the identifier api.scan.confirm.
- A row is BUILT only when every part is done. Partial work = PARTIAL.

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
- Rounds 37-39: Jev asks overridden with written reasons (minor, reversible, existing tests pass, read-only checkpoint).
- Round 40: checkpoint baseline set to 81/864/4.
- Round 40: row 74 camera modals switched to screenAnimation(). Motion change flagged as unintended.
- Round 44: camera modal restore done. Three modals in src/app/_layout.tsx back to reduceMotion ? 'fade' : 'slide_from_bottom'. Tests green.
- Round 45: Jev suggested ask (58%, risk 1.0). Overridden: no major open question, change small and reversible.
- Jev advice is advisory. Override only with a concrete reason, written in decisions.

## Done
- Task 1: PHASE2_ROWS.md created. Local setup, baseline: BUILT.
- Food log, Gym history: BUILT (Gym history simulator owner check pending).
- Gym templates, schedule, muscles, exercise progress, freeze: checked in code, no gap.
- Gym streak, Goals, Paywall/Subscription: BUILT.
- Profile: checked in code, no gap.
- Add food, Legal: BUILT (static).
- Dashboard / Summary and sub-pages: BUILT.
- Motion audit, screen and navigation transitions: BUILT. Row 74 camera modal restored (round 44).
- Adding and removing food log entries: BUILT.
- ProgressBar, EnergyBalanceCard, DailyMacroRing ease to new values: BUILT.
- Gym log entries remove path (src/app/gym/session.tsx): BUILT, local only.
- Row 9 Gym log create reconciliation: BUILT (queue.ts onLanded additive). Simulator sign in part owner check pending.
- Rows 35 and 54 (streak footnote): BUILT, checked in code; simulator owner check pending.
- Rows 78, 79, 80 gym patterns shape guards: BUILT.
- Row 11 exercise progress: BUILT, no gym patterns read.
- Row 74 onboarding layout Reduce Motion: BUILT, checked in code; device feel owner check pending.
- Row 74 camera modal feel (slide up vs horizontal push): owner check pending.
- Round 16, 23, 39 checkpoints: gates green.

## Blocked on Isa
- Sign in: backend checks tokens against hosted Clerk JWKS. Owner step.
- E2E_EMAIL and E2E_PASSWORD not set.
- Row 17 plan.tsx has no backend. Product decision: build plan generation or drop the card for v1.
- Claude CLI sign in expires between 2026-11-24 and 2026-11-27. Run claude auth login before then, or set up a token (claude setup-token) for unattended runs. May stop unattended runs when it expires.
- loop/ files show uncommitted diffs. Loop-managed, not a task.
- Merging loop/design-match into main: Isa's job.
- Simulator: maestro not installed, simctl hangs in sandbox. Owner step for screenshots.
- Stale motion rows 65-72 duplicate 64 and 74-77. Fold or delete.

## Parked (not v1)
- Food log: long press to delete a meal is not discoverable. Design call.
- Goals: 'Saved as you type' is untrue when a value is clamped silently.
- Dead code: subscriptionFromApi and AppSubscription in src/lib/data/mappers.ts.
- Account and index settings both link to Delete Account.
- Copy pass: 'owner check pending' reads awkwardly after a noun phrase.
- Rows 35 and 54 cover the same card and test file. Merge rows? Isa decision.
- Pre-existing react-native-gesture-handler warning in SwipeableRow.tsx.
- Gym log: logGymSession while gymLoggedToday is true. Revisit if double-log matters.
- Applying migrations to hosted Supabase: Isa's job.
- Local Clerk-compatible verifier or test issuer: owner step.
- Muscles and exercise-progress design gaps. Product decision.
- Watch: transient Jest worker SIGSEGV on resetRegistry.test.ts.

## Next
- Round 45: gym patterns partial object guard (isGymPatternsShape, its file and test file). Check result.
- Then: remove dead code in src/lib/data/mappers.ts (subscriptionFromApi, AppSubscription), if no imports remain.
- Then: remaining Phase 1 visual QA rows that need no sign in, then backend refinement rows.
- If the usage limit hits again: wait, do not change scope.

## Known issues
- Authenticated flows cannot run end to end until sign in is solved.
- Jev risk 1.0 to 1.3 of 2: keep tasks small, one row and one file per round. Run the gate every round a row changes code.
- Mounting a real screen under test with SectionList/ScrollView refreshControl breaks JSON.stringify. Use the key-filtering serializer pattern.
- Row 9 runOrQueueSequence onLanded is in place (queue.ts); keep it additive.