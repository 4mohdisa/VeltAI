# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Read PHASE3_ROWS.md before each task. Rows say built, never verified (Isa verifies).

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Round 101 checkpoint: tsc 0; Jest 166 suites, 1093 tests, 0 failed.
- Before commands: source ~/.nvm/nvm.sh && nvm use 22.
- Jest pinned ~29.7.0, never upgrade. Render tests are *.render.test.tsx. Write output to file, then tail.
- Maestro not installed. Local Colima Postgres 127.0.0.1:55432.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope (Apple sign in, account deletion, AI consent, subscriptions, paywall, restore, notifications, HealthKit, store content, privacy manifest).
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings. Store default off: Isa to confirm before Phase 4.
- Row 3: header plus on My workouts is the only way to add a second workout. Templates kept.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook. useEnergyRange isError true only when both week reads fail.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only guard, reset deletes only seed_ ids with @example.test email.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Failed reads: LoadFailedNotice message={t('gym.loadFailed')}, plus onRetry={refetch} only if refetch exists.
- Empty or failed screens with no stored data: one clear action.
- Locale blocks inserted as text. French: no-break space before ':' and '?'.
- Food tab shows PendingSyncBanner counting all queued writes (default).
- Exercise progress and muscles: failed read shows notice, no Retry (default).
- Session.tsx English reuse limited to gym.* and gymSession keys.
- Identical text reuses existing keys. Data layer (src/lib/data) off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- GlassButtons.tsx changed in round 98 (accepted as needed for freeze sheet Close).
- gymMuscles.goBack removed; muscles uses common.goBack.
- Dashboard training: failed sessions read uses gym.loadFailed; failed energy read uses dashboard.energyLoadFailed.
- Round 105: energy.render.test.tsx line 94 may be edited (pins the broken failed-read behaviour Row 15 fixes).

## Done
- Rows 1-4 BUILT (row list, Node 22, baseline, audit).
- Rows 3 and 5 part 1 BUILT (owner check pending).
- Rows 12-17 added after audit.
- Row 12 PARTIAL until Isa says built (plumbing done).
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail done.
- Row 14 PARTIAL: all gym screens have failed-read notice and calm empty states; labels translated.
- Row 15 PARTIAL: dashboard/training.tsx (round 103) and dashboard/week.tsx (round 104) done.

## Blocked on Isa (defaults used, do not re-ask)
- Row 12 BUILT approval.
- Retry for useGymPatterns and useExerciseProgress needs refetch in src/lib/data/gymSchedule.ts. Default: no Retry.
- useLoggedDays calendar failed read has no error (src/lib/data/foodDays.ts).
- lookupBarcodeAsync: not found vs offline. Keep copy.
- Keys needed in en, es, fr: ', today', 'Previous week', 'Next week'. WeekStrip labels stay until approved.
- Row 13: 'this day's food log' and 'Nothing was logged on this day.' default used.
- Row 13 and 14: es and fr wording of all new blocks. Review needed, incl. dashboard.energyLoadFailed.
- Row 13 casing: 'New recipe' vs 'New Recipe'. Isa picks one.
- Row 13: /food/meals link from Food tab. Default: no link.
- Row 13: PendingSyncBanner counts all queued writes. Confirm.
- Row 14: 'streak' as 'racha' (es), 'serie' (fr). Review.
- Row 14: freeze sheet disables apply tick and shows log-session when no streak. Confirm.
- Row 14: Cerrar, Fermer, Volver, Retour for close and back. Review.
- Row 15: goals persistence decision needed before goals part can close.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 (Maestro, seeded users): needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off. Confirm before Phase 4.

## Next
- Round 105 (running): Row 15 src/app/energy.tsx failed-read notice, plus energy.render line 94 edit and new energy.emptyStates.render test.
- Then Row 15 remaining: EMPTY_STATES_AUDIT.md error flag fix (week and energy); Summary GymStatusCard shown from seed data while loading; nutrition dashboard (numbers before load, zero bars on failure, fibre as 0 g); insights literals and swallowed errors; goals load and error states; Summary card literals.
- Then Rows 16 and 17, one screen per round.
- Row 14 cleanup: gymMuscles.shape and sheetContent.render read en.json. Add key parity check (none exists).
- Has-a-streak shared helper (needs location decision). Freeze offline toast (needs decision).
- Row 6: non-sign-in backend measurements.
- Rows 7, 8 (Sentry, PostHog), then 9, 10, then Row 11 final sweep.

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci (network).
- 18 backend DB tests never run without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure (needs src/lib/data change).
- Date helpers use device locale; formatRelativeDate hardcoded English. GymCalendar, WeekEnergyCard hardcoded weekday letters.
- Exercise library failed read hides muscles card. Cardio not recognised on failed read.
- Muscle names stay English. '{{value}} reps' has no singular. Planned-weight unit kg/lb not translated.
- Freeze toast shows success when queued offline (gym/freeze.tsx).
- Has-a-streak check duplicated in streak.tsx and freeze.tsx.
- Dev gym failed read keeps mock sessions. Dev falls back to mock product DB.
- Ask Lume drops server 503 message (ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395. Row 11 or park.
- react-test-renderer deprecation warning in gymSchedule tests. Session save test logs background sync warning; 'background sync failed' warning prints in gymSession.emptyStates suite.
- Jest log noise '[data] API unreachable' from src/lib/env.ts and hooks.ts:72. Data layer off limits.
- Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- fr straight apostrophe in exercise removal prompt. food.tsx header line over 80 chars. meals.tsx line 2 is 82 chars. saved.tsx line 1 'C13 · My dishes'. Row 11.
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

## Loop notes
- Round 94: muscles done, no Retry (default). Round 95: templates already done.
- Round 96: streak done. Round 97: freeze done. Round 98-99: SheetContent and BottomSheet close labels done.
- Round 100: GlassButtons labels translated. Handover after round 100.
- Round 101: checkpoint clean (166 suites, 1093 tests, tsc 0).
- Round 102: gymMuscles.goBack reuses common.goBack.
- Round 103: Row 15 training.tsx done. Still PARTIAL.
- Round 104: Row 15 week.tsx failed-read notice done. Still PARTIAL.
- Round 105: energy.tsx blocked by protected test (energy.render line 94). Default applied: test edit allowed. Re-run queued.