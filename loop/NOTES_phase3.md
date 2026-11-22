# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Round 101 checkpoint: tsc 0; Jest 166 suites, 1093 tests, 0 failed.
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Write output to /tmp, then tail.
- Jest pinned ~29.7.0, never upgrade. Render tests are *.render.test.tsx.
- Maestro not installed. Local Colima Postgres 127.0.0.1:55432.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope (Apple sign in, account deletion, AI consent, subscriptions, paywall, restore, notifications, HealthKit, store content, privacy manifest).
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings. Store default off. Isa to confirm before Phase 4.
- Row 3: header plus on My workouts is the only way to add a second workout. Templates kept.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook. useEnergyRange isError true only when both week reads fail.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only guard, reset deletes only seed_ ids with @example.test email.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Failed reads: LoadFailedNotice message={t('gym.loadFailed')}, onRetry={refetch} only if refetch exists.
- Empty or failed screens with no stored data: one clear action.
- Locale blocks inserted as text. French: no-break space before ':' and '?'.
- Food tab PendingSyncBanner counts all queued writes.
- Exercise progress and muscles: failed read shows notice, no Retry.
- Identical text reuses existing keys. Data layer (src/lib/data) off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- GlassButtons.tsx changed in round 98 (accepted as needed for freeze sheet Close).
- Dashboard training: failed sessions read uses gym.loadFailed; failed energy read uses dashboard.energyLoadFailed.
- Goals persistence parked (round 108). Goals part of Row 15 closes on load and error states only.

## Done
- Rows 1-4 BUILT. Rows 3 and 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail done.
- Row 14 PARTIAL: all gym screens have failed-read notice and calm empty states.
- Row 15 PARTIAL: dashboard/training, dashboard/week, energy done.

## Blocked on Isa (defaults used, do not re-ask)
- Row 12 BUILT approval.
- Retry for useGymPatterns and useExerciseProgress needs refetch in src/lib/data/gymSchedule.ts. Default: no Retry.
- useLoggedDays calendar failed read has no error (src/lib/data/foodDays.ts).
- lookupBarcodeAsync: not found vs offline. Keep copy.
- Keys needed in en, es, fr: ', today', 'Previous week', 'Next week'. WeekStrip labels stay until approved.
- Row 13 and 14: es and fr wording of all new blocks, incl. dashboard.energyLoadFailed. Review needed.
- Row 13 casing: 'New recipe' vs 'New Recipe'. Isa picks one.
- Row 13: /food/meals link from Food tab. Default: no link.
- Row 14: 'streak' as 'racha' (es), 'serie' (fr). Review.
- Row 14: freeze sheet disables apply tick and shows log-session when no streak. Confirm.
- Row 14: Cerrar, Fermer, Volver, Retour for close and back. Review.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 (Maestro, seeded users): needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off. Confirm before Phase 4.

## Next
- Round 109 (running): nutrition dashboard states (src/app/dashboard/nutrition.tsx): numbers before load, zero bars on failure, fibre as 0 g.
- Row 15 remaining: Summary GymStatusCard shows seed data while loading; insights literals and swallowed errors; goals load and error states; Summary card literals.
- Then Rows 16 and 17, one screen per round.
- Row 14 cleanup: gymMuscles.shape and sheetContent.render read en.json. Add key parity check.
- Has-a-streak shared helper (location decision). Freeze offline toast (decision).
- Row 6: non-sign-in backend measurements.
- Rows 7, 8 (Sentry, PostHog), then 9, 10, then Row 11 final sweep.

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci (network).
- 18 backend DB tests never run without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure (needs src/lib/data change).
- Date helpers use device locale; formatRelativeDate hardcoded English. GymCalendar, WeekEnergyCard hardcoded weekday letters.
- Exercise library failed read hides muscles card. Cardio not recognised on failed read.
- Muscle names English. '{{value}} reps' has no singular. Planned-weight unit kg/lb not translated.
- Freeze toast shows success when queued offline (gym/freeze.tsx).
- Has-a-streak check duplicated in streak.tsx and freeze.tsx.
- Dev gym failed read keeps mock sessions. Dev falls back to mock product DB.
- Ask Lume drops server 503 message (ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395. Row 11 or park.
- react-test-renderer deprecation warning; 'background sync failed' warnings in gym suites.
- Jest log noise from env.ts and hooks.ts:72. Data layer off limits.
- Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- fr straight apostrophe in exercise removal prompt. Long lines: food.tsx, meals.tsx, saved.tsx. Row 11.
- gymSchedule.revalidate.test.ts has own useApi harness. Row 11.
- useInsights has no refetch. allText crashes on full-screen trees: use findAll.
- Energy one-week-fails path untested. Food tab useInsights has no consent gate.
- Shared render setup does not mock useFocusEffect or useLocalSearchParams.
- Hidden-banner tests check only alert role. Row 11.
- gym 'Nothing scheduled' copy. Decide in Row 11.
- gymSession.eyebrow and defaultTitle duplicate foodLog.today and dashboard.workout. Row 11.
- WeekStrip and calendar.tsx duplicate logged-day label. Shared helper.
- Session.tsx 'Progress saved' and 'Save' in its alert still English.
- No test covers app-language dates or en/es/fr key parity. Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- GlassButtons change in round 98 not named in brief; Isa approval pending.

## Loop notes
- Rounds 94-100: muscles, templates, streak, freeze, sheet and button close labels done.
- Round 101: checkpoint clean (166 suites, 1093 tests, tsc 0).
- Rounds 102-108: training, week, gymMuscles.goBack, energy done. Audit rows corrected.
- Round 109 prompt rejected once (no branch rule). Rewritten with loop/phase3 rule.
- Jev (advisory): last task completed cleanly 41%, risk 1.1. Chose a single-screen task.