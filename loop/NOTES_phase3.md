# Lume Loop Notes: Phase 3

## Goal
Polish before Phase 4. Progress counted from PHASE3_ROWS.md. Work only on loop/phase3. Agents never run git or Prettier. One screen or component per prompt.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Round 87 checkpoint clean: tsc 0; 160 suites, 1073 tests, 0 failed.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Jest pinned ~29.7.0. Never upgrade. Render tests are *.render.test.tsx. Multi-file jest via xargs. zsh: use $? not PIPESTATUS. Write output to file, then tail.
- Failed reads: LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch}. Omit onRetry if no refetch.
- Dev builds seed mock gym data; set arrays to [] in tests.
- Maestro not installed. Local Colima Postgres 127.0.0.1:55432.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope (Apple sign in, account deletion, AI consent, subscriptions, paywall, restore, notifications, HealthKit, store content, privacy manifest). Park ideas.
- Later (Phase 4): RevenueCat for payments, no free tier, 7 day Apple trial.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default, anonymous ID, off switch in Settings. Store default off: Isa to confirm before Phase 4.
- Row 3: header plus on My workouts is the only way to add a second workout. Templates kept.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook, not per screen. useEnergyRange isError true only when both week reads fail.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Saved screen load failure shows ErrorState with Retry.
- Locale blocks inserted as text, not JSON rewrite. French: no-break space before ':' and '?'.
- Food tab shows PendingSyncBanner counting all queued writes (default).
- Food detail: Entry not found gets one Done button (common.done). Barcode not-found keeps Scan again.
- Gym session and history: failed read shows LoadFailedNotice with Retry.
- Identical text reuses existing keys. Data layer (src/lib/data) off limits.
- Templates: failed read uses useTemplates isError and refetch.
- Exercise-progress failed read shows notice, no Retry (default).
- Session.tsx English reuse limited to gym.* and gymSession keys.
- Unanswered question: use default and carry on. Do not re-ask.

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done.
- Rounds 42-81: Row 13 Food tab states, SavedMealsList, RecipesList, Saved states, translations, food detail Done.
- Rounds 82-88: gym session, history, templates, exercise-progress states, locale blocks, render tests.
- Rounds 89-90: session.tsx labels, number pad, Cardio, RPE, Set N, N / 10 translated.
- Round 91: remove-button test uses translated key (gymSessionRemoveExtra). Row 14 PARTIAL.

## Blocked on Isa (defaults used, do not re-ask)
- Row 12 BUILT approval. Stays PARTIAL.
- useLoggedDays (src/lib/data/foodDays.ts) calendar failed read.
- Exercise-progress Retry: one-line refetch in useExerciseProgress (src/lib/data/gymSchedule.ts).
- lookupBarcodeAsync (src/lib/data/scan.ts): not found vs offline. Keep copy.
- Keys needed in en, es, fr: ', today', 'Previous week', 'Next week'. WeekStrip labels stay until approved.
- Row 13: 'this day's food log' and 'Nothing was logged on this day.' default used.
- Row 13 and 14: es and fr wording of all new blocks, including Rounds 88-90 keys. Review needed.
- Row 13 casing: 'New recipe' vs 'New Recipe'. Isa picks one.
- Row 13: /food/meals link from Food tab. Default: no link.
- Row 13: PendingSyncBanner counts all queued writes. Confirm.
- Row 14: gym session failed read shows only notice. Default unchanged.
- Row 14: 'streak' as 'racha' (es) and 'serie' (fr). Review.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 (Maestro, seeded users): needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path. Blocks row 6 heavy-user checks and row 9 export check.
- Analytics default on vs store off. Confirm before Phase 4.

## Next
- Round 92: session.tsx save alert and 'Progress saved' translated, with a render assertion.
- Round 93: Row 14 gym/muscles.tsx failed read and translations.
- Then gym/templates.tsx, streak and freeze screens for Row 14.
- Rows 15 to 17, one screen per round.
- Row 6: non-sign-in backend measurements.
- Rows 7, 8 (Sentry, PostHog), then 9, 10, then Row 11 final sweep.

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci (network).
- 18 backend DB tests never run without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure. Needs src/lib/data change.
- Date helpers use device locale; formatRelativeDate hardcoded English.
- GymCalendar, WeekEnergyCard: hardcoded weekday letters.
- Exercise library failed read hides muscles card. Cardio not recognised on failed read.
- Muscle names stay English. '{{value}} reps' has no singular.
- fr straight apostrophe in exercise removal prompt. Row 11.
- Dev gym failed read keeps mock sessions. Dev falls back to mock product DB.
- Freeze toast shows success when queued offline (gym/freeze.tsx).
- Ask Lume drops server 503 message (ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395. Row 11 or park.
- react-test-renderer deprecation warning in gymSchedule tests. Session save test logs a background sync warning.
- Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- food.tsx header line over 80 chars. Row 11.
- gymSchedule.revalidate.test.ts has own useApi harness. Row 11.
- useInsights has no refetch. allText crashes on full-screen trees: use findAll.
- Energy one-week-fails path untested. Food tab useInsights has no consent gate.
- Shared render setup does not mock useFocusEffect or useLocalSearchParams.
- Hidden-banner tests check only alert role. Row 11.
- gym 'Nothing scheduled' copy. Decide in Row 11.
- gymSession.eyebrow and defaultTitle duplicate foodLog.today and dashboard.workout. Row 11.
- WeekStrip and calendar.tsx duplicate logged-day label. Shared helper.
- SheetContent.tsx 'Close' hardcoded English.
- No test covers app-language dates or en/es/fr key parity. Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- saved.tsx line 1 says 'C13 · My dishes'. meals.tsx line 2 is 82 characters.
- Planned-weight unit ('kg'/'lb') from data not translated.

## Loop notes
- Round 80: Jev said ask (80%). Kept run: only open question owner-only and defaulted.
- Round 82: Jev said ask (74%). Kept run: question not major.
- Round 88 to 90: Jev 83 to 90% run. Branch rules first.
- Round 91: loop flagged Round 90 as partly done. Completed in Round 91.
- Round 92: Jev 98% run. Chose the session.tsx translation gap before a new screen.