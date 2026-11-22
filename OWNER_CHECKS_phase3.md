# Owner checks (Phase 3)

Everything Isa must decide or check on a device or in a dashboard. Source: the 'Blocked on Isa' section of loop/NOTES_phase3.md and the owner checks in PHASE3_ROWS.md. Nothing here has been checked on a device.

## Decisions
- Row 6 Gym history: per-row card pieces, a list mode on Screen, or limiting hydrateGym in src/lib/data/hooks.ts:170 (recommended).
- Permission to edit src/lib/data for: the Row 6 hooks.ts limit; Row 17 gaps 1, 2 and 6; useGoals loading, error and refetch (Row 15); scan.ts 'Product not found' and foodDays.ts empty month (Row 13); the gymRange.ts '0 sessions' text and the muscle-card and exercise-progress Retry (Row 14).
- Permission to edit existing tests: sheetVariant.test.ts:30 ('Save food'); scanConfidence.test.ts (ConfidenceBadge breakdown line); profileEmptyStates test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; the detailChrome macros snapshot; the week.tsx snapshot regeneration; the nutrition.tsx snapshot approval.
- feature_used strict list and shapeOnly cleanup (needs two pinned tests edited).
- Analytics on by default (brief) or opt-in (code); whether the AI disclosure Continue should also turn analytics on. Confirm before Phase 4.
- Device maker, model and OS to PostHog: default is not sent.
- Session weight (gym/session.tsx padWeight): kg only, or follow the unit setting.
- Export: two exportData functions exist; which one stays.
- Which local database is Lume's; lume_audit is one migration behind (apply only if named).
- Feedback retention period.

## Credentials and dashboards
- Row 5 part 2: E2E_EMAIL, E2E_PASSWORD and the seed sign-in path.
- Row 7: Sentry DSN and source map upload (@sentry/react-native config plugin and SENTRY_AUTH_TOKEN not added).
- Row 8: PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Row 10: apply the feedback migration to hosted Supabase.

## Device and simulator checks
- Row 6: performance numbers on the simulator (PERF_BASELINE.md has code reading only); smoothness rows.
- Row 8: the analytics switch in Privacy.
- Row 9: export on a heavy user.
- Row 10: the Help and feedback simulator flow.
- Row 13: the Food tab offline banner; the Food log and scan simulator flow.
- Row 14: the Gym log and history simulator flow.
- Row 16: the Profile simulator flow.
- Row 17: the search results simulator flow.

## Wording review (es and fr)
- es 'Escribir a soporte'; fr 'Ecrire a l'assistance'; export error toast; Scan and Integrations; Profile error.
- Exercise picker Abdomen and Abdos; fr 'plus de {{food}}'; kJ 'kilojoules'; es addMenu.voice and addMenu.describeOutLoud.
- weekStrip, parameterForm, scanCards and customFood groups.
- fr 'Abandonner' (gymSession.discard) for scan discard; 'Supprimer' may read better.
- Kept by owner decision: Integrations 'Nothing connected' eyebrow; Privacy 'Your data' in English; Spanish 'Tus datos'.
