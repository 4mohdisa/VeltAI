# Owner checks (Phase 3)

Everything Isa must decide, provide or check on a device or in a dashboard. Sources: the 'Blocked on Isa' section of loop/NOTES_phase3.md and the owner checks in PHASE3_ROWS.md. Each item names the file or key it touches. Nothing here has been checked on a device.

## Permission to edit src/lib/data
- Barcode network error: a failed lookup shows 'Product not found' (src/lib/data/scan.ts:377; shown by src/app/food/barcode-scan.tsx and src/app/food/detail.tsx). Row 13.
- Calendar load error: a failed read shows an empty month (useLoggedDays, src/lib/data/foodDays.ts:39; shown by src/app/food/calendar.tsx). Row 13.
- Gym month line: monthSummary 'N sessions', 'untimed', 'freeze' and the device-locale month name in monthTitle (src/lib/data/gymRange.ts:198 and :207; shown at src/app/(tabs)/gym.tsx:79). Row 14.
- Summary Workouts line: workoutsLine and the LETTERS day letters (src/lib/data/summaryCards.ts:67 and :45; shown by src/components/domain/WorkoutsWeekCard.tsx). Row 14.
- Retry on the muscle cards and exercise-progress: useGymPatterns and useExerciseProgress need a refetch (src/lib/data/gymSchedule.ts; callers src/components/gym/GymPatternsCard.tsx:76, src/components/gym/MuscleChart.tsx, src/app/gym/exercise-progress.tsx:169). Row 14.
- useGoals isLoading, error and refetch (src/lib/data/hooks.ts:451; caller src/app/profile/goals.tsx). Row 15.
- The limit on hydrateGym (src/lib/data/hooks.ts:170). Row 6.
- Row 17 gaps 1, 2 and 6: search debounce 'No matches' (src/lib/data/hooks.ts) and Ask Lume copy (src/lib/data/aiBrain.ts).

## Decisions
- Row 6 Gym history (src/app/gym/history.tsx): per-row card pieces, a list mode on Screen (src/components/navigation/Screen.tsx), or the hydrateGym limit in src/lib/data/hooks.ts:170 (recommended).
- Session weight unit: the number pad is kg only (gymSession.padWeight and gymSession.unitKg, src/app/gym/session.tsx:78). Keep kg, or follow the unit setting.
- Analytics default: opt-in in code today (analyticsEnabled, src/lib/settings/store.ts and src/lib/analytics.ts:10); the brief says on. Also whether the AI disclosure Continue turns analytics on. Confirm before Phase 4.
- Device maker, model and OS to PostHog (src/lib/analyticsSink.ts): default is not sent.
- feature_used strict list and shapeOnly cleanup (src/lib/analytics.ts): needs two pinned analytics tests edited.
- Export: two exportData functions exist (src/app/profile/index.tsx:87 and src/app/profile/privacy.tsx:51). Which one stays.
- Which local database is Lume's; lume_audit is one migration behind (supabase/migrations). Apply only if named.
- Feedback retention period (supabase/migrations/20261123000001_feedback.sql).

## Pinned tests that need permission to edit
- src/__tests__/sheetVariant.test.ts:30 pins 'Save food' (src/app/food/custom-food.tsx:84).
- src/__tests__/scanConfidence.test.ts:93 pins the ConfidenceBadge line (src/components/food/scan/ConfidenceBadge.tsx:90).
- profileEmptyStates test 1.
- src/__tests__/render/integrations.render.test.tsx:75.
- src/__tests__/render/privacyLocale.render.test.tsx:55-56.
- The detailChrome macros snapshot (src/__tests__/render/__snapshots__/detailChrome.render.test.tsx.snap).
- The week.tsx snapshot regeneration (src/app/dashboard/week.tsx).
- The nutrition.tsx snapshot approval for the spoken kcal label (src/app/dashboard/nutrition.tsx).

## Credentials and dashboards
- Row 5 part 2: E2E_EMAIL and E2E_PASSWORD environment variables and the seed sign-in path.
- Row 7: Sentry DSN and source map upload (@sentry/react-native config plugin and SENTRY_AUTH_TOKEN not added).
- Row 8: PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Row 10: apply supabase/migrations/20261123000001_feedback.sql to hosted Supabase.

## Device and simulator checks
- Row 6: performance numbers on the simulator (PERF_BASELINE.md has code reading only); smoothness rows.
- Row 8: the analytics switch in Privacy (src/app/profile/privacy.tsx).
- Row 9: export on a heavy user.
- Row 10: the Help and feedback simulator flow.
- Row 13: the Food tab offline banner; the Food log and scan simulator flow.
- Row 14: the Gym log and history simulator flow.
- Row 16: the Profile simulator flow.
- Row 17: the search results simulator flow.

## Wording review (es and fr, src/lib/i18n/locales/es.json and fr.json)
- es 'Escribir a soporte'; fr 'Ecrire a l'assistance'; export error toast (settings.exportError); Scan and Integrations; Profile error.
- Exercise picker Abdomen and Abdos; fr 'plus de {{food}}'; kJ 'kilojoules'; es addMenu.voice and addMenu.describeOutLoud.
- weekStrip, parameterForm, scanCards, customFood and workoutsWeek groups.
- fr 'Abandonner' (gymSession.discard) for scan discard; 'Supprimer' may read better.
- fr 'Séances' (dashboard.workouts, Workouts card title) vs 'Entraînements' (workoutsWeek.a11yLabel_one and _other).
- Kept by owner decision: Integrations 'Nothing connected' eyebrow; Privacy 'Your data' in English; Spanish 'Tus datos'.
