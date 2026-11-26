# Known issues (Phase 4)

Left as is in Phase 3. Each line says where the issue is and why it was left. Sources: the Parked section of loop/NOTES_phase3.md, the Parked list of loop/NOTES.md (earlier loop, rounds up to R1224) and the unfixed list from the session handovers. loop/NOTES.md has no separate Unfixed list. None of these were fixed in Phase 3. A file without a line number means the notes named no line.

## App
- Gym history list is not virtualised (src/app/gym/history.tsx). It needs a change to the ScrollView in Screen.tsx and to the shared Card. hydrationErrorScreens.test.ts pins the screen. Waits on Isa's Row 6 option.
- useGym refetches on every mount and its session read has no limit (src/lib/data/hooks.ts:170). src/lib/data is off limits.
- useHydration logs failures through devWarn (src/lib/data/hooks.ts:72). src/lib/data is off limits.
- useGoals exposes no loading or error state, so Goals has no loading or failed-read state (src/lib/data/hooks.ts:451, Row 15). src/lib/data is off limits.
- Barcode shows 'Product not found' on a network failure (src/lib/data/scan.ts:377). src/lib/data is off limits.
- Food calendar shows an empty month when the load fails (src/lib/data/foodDays.ts:39). src/lib/data is off limits.
- Gym month summary 'N sessions', 'untimed' and 'freeze' are English literals (src/lib/data/gymRange.ts:198). src/lib/data is off limits.
- Gym month name uses the device locale, not the app language (src/lib/data/gymRange.ts:207). src/lib/data is off limits.
- Summary Workouts card: the line under the count is English (workoutsLine, src/lib/data/summaryCards.ts:67) and the day letters M T W are English (LETTERS, src/lib/data/summaryCards.ts:45). src/lib/data is off limits.
- Muscle cards and exercise-progress have no Retry, because useGymPatterns and useExerciseProgress have no refetch (src/components/gym/GymPatternsCard.tsx:76, src/components/gym/MuscleChart.tsx, src/app/gym/exercise-progress.tsx:169). src/lib/data is off limits.
- Muscle and exercise names are English. They come from the server.
- Spoken kcal label on the nutrition dashboard (src/app/dashboard/nutrition.tsx). The change needs the snapshot regenerated.
- 'Save food' on the custom food form stays English (src/app/food/custom-food.tsx:84). src/__tests__/sheetVariant.test.ts:30 pins the source line.
- ConfidenceBadge 'This scan didn't return a breakdown.' stays English (src/components/food/scan/ConfidenceBadge.tsx:90). src/__tests__/scanConfidence.test.ts:93 pins it.
- Ask Lume: the 503 text arrives in the server's language; the not_enough_data reply is English (src/lib/data/aiBrain.ts). src/lib/data is off limits.
- Ask Lume can show empty-answer copy behind the upgrade path (src/lib/data/aiBrain.ts:154). Phase 4.
- Food search shows 'No matches' for the 250 ms debounce (Food tab and new-recipe), Row 17 gaps 1 and 2 (src/lib/data/hooks.ts). src/lib/data is off limits.
- Dev-only barcode buttons 'Simulate scan' and 'Unknown code' are English (src/app/food/barcode-scan.tsx:127-128). Dev builds only.
- aiQueryEmpty and aiQueryEmptyAnswer render tests overlap. Existing tests are not edited.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight (src/components/gym/PlannedValuesForm.tsx). Left to keep each round's change small.
- scanCalibration.basedOn has no _one plural form (src/lib/i18n/locales, Row 16). Wording review pending.
- Preferences contentStyle uses a raw gap of 18, not a token. The design is final.
- Skeletons flash on repeat visits. Needs measuring first (Row 6).
- Food list has no getItemLayout. Measure first (Row 6).
- Analytics: feature_used accepts any short key; app_version or build could overwrite BUILD_TAGS (src/lib/analytics.ts). Editing this needs permission to change two pinned tests.
- Privacy and export: trial_started is never sent; the US cloud default is unconfirmed; the export is sent as text, not a .json file. Isa decides.
- Feedback: app_version carries the build number; there is no limit tighter than 120 per minute; the support mail link overlaps feedback. Isa decides.
- goals.saved locale key is unused. Left with the locale hygiene pass.
- Lint warnings in src/lib/data/gymSchedule.ts and src/lib/data/hooks.ts. src/lib/data is off limits.
- Lint warning at src/lib/analyticsSink.ts:29 (no-require-imports) is accepted: the lazy require is kept so PostHog only loads when a key is set. Revisit in Row 29 by loading asynchronously with a small queue so launch events are not dropped.
- No test checks that en, es and fr have the same keys. Tracked in Phase 4 Row 29 (i18n parity).

## Backend
- 49 queries use WHERE id::text = $1, which bypasses the id index. Tracked in Phase 4.
- With LUME_TEST_DATABASE_URL set, 24 TestPG tests run and pass. The database is local only and never hosted.
- getMorningBrief and getProfile now reject on a failed read and useMorningBrief and useBrainProfile report it through isError (src/__tests__/aiBrain.briefProfile.test.ts), but there is still no anomalies endpoint, so getAnomalies and dismissAnomaly degrade to empty. Tracked in Phase 4.
- npm audit reports 48 vulnerabilities. Dependency upgrades are not in Phase 3.
- The authenticated role is missing in local Postgres 17. Phase 4.
- Recipe ingredients and saved meal items come back in random order, because they are sorted by a random UUID id (ORDER BY id in backend/internal/recipes/pg.go:126 and :292). Found in Round 173 and not fixed, since fixing it changes behaviour.
- Integration sync reads only the first page (Strava per_page=50 at backend/internal/integrations/strava.go:127, WHOOP limit=25 at whoop.go:108) and then moves last_sync_at to now (integrations.go:442), so any workouts past that page are never imported. Found in Round 174 and not fixed.
- A food log that came from a photo scan cannot be deleted: scan_sessions.food_log_id references food_logs with no ON DELETE rule (supabase/migrations/20260712000001_onboarding_cuisine.sql:47), so DELETE FROM food_logs (backend/internal/food/pg.go:145) fails with a foreign key violation. Every pipeline scan links its session up front. Found in Round 175 and not fixed.

## Docs
- Row 14's older notes still say 'status stays partial' while the row is BUILT. The notes are history and are not rewritten.

## Parked in the earlier loop (loop/NOTES.md)
- Row 103 item 1 and the Macros variant of item 2: need 7-day data, a food store data model change.
- Food: src/app/(tabs)/food.tsx:682-683; src/app/food/detail.tsx:315 and :683; day chip 66 vs 52/60; NumberEntryBar.tsx:108; multi-angle scan; anomaly banner. Parked as design deviations.
- Scan: three routes; black camera; guides; shutter 72; no gallery, My dishes or Quick add; busy states; radius 28. Parked as design deviations.
- Copy: 'por dia' vs 'al dia'; es and fr unreviewed; gym.tsx plurals hard coded; es.json Fibre labels duplicated. Wording review pending.
- Styles: button label colour; no danger token; literals 16 and 22 at src/app/profile/delete-account.tsx:116; hero title and BreakdownRow label numberOfLines 1; KickerTitle literals 10, 2, 1.1, -0.6; HERO_TITLE has no type token; button icon 18pt for a 16pt label; statLarge line height 100 at size 40. The design is final.
- Glass: back button fill three-way without system Liquid Glass; icon colour black vs #171717. The design is final.
- Layout: headerRight top 64 on Summary; Screen floating gap 12. The design is final.
- Goals: silent clamping; 'Saved as you type' is untrue (src/lib/i18n/locales/en.json:82, src/app/profile/goals.tsx:198). Isa decides the copy.
- Calendar: src/app/food/calendar.tsx:101, :110, :128; six-row scroll; Jump to today. Parked as design deviations.
- Gym: src/components/gym/MuscleChart.tsx:1; src/app/gym/muscles.tsx:75; src/app/gym/history.tsx:44-46; src/app/gym/session.tsx:116-123; dead chevrons; lb plan vs kg; cardio sets x 3.2; Summary streak pulses. Parked in the earlier loop.
- Charts: Energy scale 7-93%; gutter 48; literal fontSize 12; space.xs bar minimum; fractional bar heights; easing copied in two files; GrowBar animated height overrides base. The design is final.
- Cleanup: CHART_GUTTER_W and SCALE_LABEL_W copied in four screens; stale 'lifted VERBATIM' header; mixHex in src/components/domain/GymCalendar.tsx; duplicate SLOT_KEYS; row 103 item 10 stale refs. Left to keep changes small.
- Tests: sheetVariant.test.ts is brittle; no render tests for log-session, connected apps or Gym; 'API unreachable' warnings; no snapshot for This week's net view. Existing tests are not edited.
- Doc: stale headings and line refs (rows 102, 103, 110). Docs cleanup only.
- Backend: session calories; logged pill colour waits on a token. Isa decides.
- /tmp/lume-* leftovers. Removing them needs Isa's approval.
- Outside the 41 rows: secondary card headers (bundle :291); Steps per day sheet (bundle :655). Not in scope.

## Phase 4 (out of scope)
- src/app/profile/delete-account.tsx is untouched. src/app/profile/subscription.tsx: Manage subscription now shows a failure and has a busy state, and Restore Purchases has a busy state too.

## Phase 4 Row 16
- The sync and connect handlers in backend/internal/integrations/integrations.go check the encryption key before the provider name, so an unknown provider without INTEGRATION_ENCRYPTION_KEY returns 503 instead of 404. Not fixed; needs Isa approval.

## Phase 4 Row 17 open items
- The migration schema test in backend/tests/migrations checks the table names used by backend SQL but not the column names.
- No test blocks a CREATE INDEX CONCURRENTLY migration, which would fail only inside the transaction deploy/migrate.sh wraps each migration in.
