# Lume Loop Notes: Phase 3

## Goal
Polish before Phase 4. Progress counted from PHASE3_ROWS.md. Work only on loop/phase3. Agents never run git or Prettier. One screen or component per prompt.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 73: tsc 0; 156 suites, 1056 tests, 0 failed.
- Round 87 checkpoint: running now (see Loop notes).
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Render tests are *.render.test.tsx.
- Multi-file jest via xargs. zsh: use $? not PIPESTATUS. Write Jest output to file, then tail.
- Failed reads: LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch}. Omit onRetry if the hook has no refetch.
- Dev builds seed mock gym data on store reset; set arrays to [] in tests.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings. Store default off: Isa to confirm before Phase 4.
- Row 3: header plus on My workouts is the only way to add a second workout. Templates kept.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook, not per screen. useEnergyRange isError true only when both week reads fail.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Saved screen load failure shows ErrorState with Retry. Default generic copy.
- Locale blocks inserted as text, not JSON rewrite. French uses no-break space before ':' and '?'.
- Food tab shows PendingSyncBanner, counting all queued writes. Default used.
- Food detail: Entry not found gets one Done button (common.done). Barcode not-found keeps Scan again.
- Gym session and history: failed read shows LoadFailedNotice with Retry.
- Identical text reuses existing keys. Data layer (src/lib/data) is off limits.
- Templates: failed read uses useTemplates isError and refetch. Accepted.
- Round 86: exercise-progress failed read shows notice, no Retry. Hook has no refetch; src/lib/data off limits. Default used. Do not re-ask.
- Unanswered question: use default and carry on. Do not re-ask.

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done.
- Rounds 42-81: Row 13 Food tab states, SavedMealsList, RecipesList, Saved states, translations, food detail Done button.
- Rounds 82-86: gym session, history, templates, exercise-progress failed and empty states, with locale blocks and render tests.

## Blocked on Isa
- Row 12 BUILT approval. Stays PARTIAL. Do not re-ask.
- useLoggedDays (src/lib/data/foodDays.ts) change for calendar failed read. Do not retry.
- Retry on exercise-progress: one-line refetch pass-through in useExerciseProgress (src/lib/data/gymSchedule.ts). Default: no Retry.
- lookupBarcodeAsync (src/lib/data/scan.ts): not found vs offline. Default: keep copy.
- Keys needed in en, es, fr: ', today', 'Previous week', 'Next week'. Until approved, WeekStrip labels stay.
- Row 13: 'this day's food log' and 'Nothing was logged on this day.' Default used.
- Row 13 and 14: es and fr wording for all new blocks. Default used. Review needed.
- Row 13 casing: 'New recipe' (meals.newRecipeLabel) vs 'New Recipe' (recipesList.newRecipe). Isa picks one.
- Row 13: /food/meals link from Food tab. Default: no link.
- Row 13: PendingSyncBanner counts all queued writes. Default used. Confirm.
- Row 14: gym session failed read shows only notice (no freestyle start or Add an exercise). Default: unchanged.
- Row 14: gym history 'streak' as 'racha' (es) and 'serie' (fr). Default used. Review.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks row 6 heavy-user checks and row 9 export check.
- Analytics default on vs store off. Default used. Confirm before Phase 4.

## Next
- Round 88: Row 14 session.tsx leftovers: 'Progress saved' toast, Save label, unsaved-changes alert.
- Rows 15 to 17: remaining empty state screens, one per round.
- Row 6: non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10, then Row 11 (final sweep).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run. Needs LUME_TEST_DATABASE_URL.
- useTemplates drops templates when a refetch fails. Needs src/lib/data change.
- Date helpers use device locale; formatRelativeDate hardcoded English.
- GymCalendar.tsx and WeekEnergyCard.tsx: hardcoded weekday letters.
- Exercise library failed read hides muscles card silently. Cardio not recognised on failed read.
- Muscle names from DB slugs, stay English. '{{value}} reps' has no singular.
- fr 'Retirer l'exercice ?' straight apostrophe. Row 11.
- Dev gym failed read keeps mock sessions. Dev builds fall back to mock product DB.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx).
- Ask Lume drops server 503 message (src/app/ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- react-test-renderer deprecated warning in gymSchedule tests.
- Stale header comments: aiBrain.ts, gymSchedule.ts, src/lib/i18n/index.ts, saved.tsx, meals.tsx.
- food.tsx and meals.tsx header line over 80 chars. Row 11.
- gymSchedule.revalidate.test.ts has own useApi harness copy. Row 11.
- useInsights has no refetch. allText crashes on full-screen trees: use findAll.
- Energy one-week-fails path untested. Food tab useInsights has no consent gate (pinned in phase14Regression).
- Shared render setup does not mock useFocusEffect or useLocalSearchParams.
- Hidden-banner tests check only alert role. Assert no banner at all (Row 11).
- gym session 'Nothing scheduled' and gym.nothingScheduledSub: decide in Row 11.
- gymSession.eyebrow and defaultTitle duplicate foodLog.today and dashboard.workout. Row 11.
- WeekStrip and calendar.tsx duplicate logged-day label expression. Shared helper.
- SheetContent.tsx close label 'Close' hardcoded English.
- No test covers app-language dates or en/es/fr key parity. Row 11.
- Old local rows mix 'lunch' and 'Lunch'.

## Loop notes
- Round 80: Jev said ask (80%). Kept run: only open question owner-only and defaulted.
- Round 82: Jev said ask (74%). Kept run: question not major, default used.
- Round 83: Jev said run (75%). Kept run: smallest clean task.
- Round 85: Jev said run (85%). Run: templates.tsx.
- Round 86: Jev said run (82%). Run: exercise-progress.tsx, partly done (no Retry). Accepted.
- Round 87: loop note said this round is a checkpoint. Run: full tsc and full app Jest, no file changes. Jev said run session.tsx leftovers (90%). Kept checkpoint: the schedule requires it and no full gate has run since round 73. Session.tsx moves to round 88.