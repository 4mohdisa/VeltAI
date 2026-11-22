# Known issues (Phase 3)

Left as is in Phase 3. Each line says where the issue is and why it was left. Source: the Parked section of loop/NOTES_phase3.md and the unfixed list from the session handovers. None of these were fixed in Phase 3.

## App
- Gym history list is not virtualised (src/app/gym/history.tsx). It needs a change to the ScrollView in Screen.tsx and to the shared Card. hydrationErrorScreens.test.ts pins the screen. Waits on Isa's Row 6 option.
- useGym refetches on every mount and its session read has no limit (src/lib/data/hooks.ts:170). src/lib/data is off limits.
- useHydration logs failures through devWarn (src/lib/data/hooks.ts:72). src/lib/data is off limits.
- useGoals exposes no loading or error state, so Goals has no loading or failed-read state (Row 15). src/lib/data is off limits.
- Barcode shows 'Product not found' on a network failure (src/lib/data/scan.ts). src/lib/data is off limits.
- Food calendar shows an empty month when the load fails (src/lib/data/foodDays.ts). src/lib/data is off limits.
- Gym month summary '0 sessions' is an English literal (src/lib/data/gymRange.ts). src/lib/data is off limits.
- Muscle cards and exercise-progress have no Retry, because useGymPatterns and useExerciseProgress have no refetch. src/lib/data is off limits.
- Muscle and exercise names are English. They come from the server.
- Spoken kcal label on the nutrition dashboard (src/app/dashboard/nutrition.tsx). The change needs the snapshot regenerated.
- 'Save food' on the custom food form stays English (src/app/food/custom-food.tsx). src/__tests__/sheetVariant.test.ts:30 pins the source line.
- ConfidenceBadge 'This scan didn't return a breakdown.' stays English (src/components/food/scan/ConfidenceBadge.tsx). src/__tests__/scanConfidence.test.ts pins it.
- Ask Lume: the 503 text arrives in the server's language; the not_enough_data reply is English (src/lib/data/aiBrain.ts). src/lib/data is off limits.
- Ask Lume can show empty-answer copy behind the upgrade path (src/lib/data/aiBrain.ts:154). Phase 4.
- Food search shows 'No matches' for the 250 ms debounce (Food tab and new-recipe), Row 17 gaps 1 and 2 (src/lib/data/hooks.ts). src/lib/data is off limits.
- Dev-only barcode buttons 'Simulate scan' and 'Unknown code' are English (src/app/food/barcode-scan.tsx:128-129). Dev builds only.
- aiQueryEmpty and aiQueryEmptyAnswer render tests overlap. Existing tests are not edited.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight (src/components/gym/PlannedValuesForm.tsx). Left to keep each round's change small.
- scanCalibration.basedOn has no _one plural form (Row 16). Wording review pending.
- Preferences contentStyle uses a raw gap of 18, not a token. The design is final.
- Skeletons flash on repeat visits. Needs measuring first (Row 6).
- Food list has no getItemLayout. Measure first (Row 6).
- Analytics: feature_used accepts any short key; app_version or build could overwrite BUILD_TAGS (src/lib/analytics.ts). Editing this needs permission to change two pinned tests.
- Privacy and export: trial_started is never sent; the US cloud default is unconfirmed; the export is sent as text, not a .json file. Isa decides.
- Feedback: app_version carries the build number; there is no limit tighter than 120 per minute; the support mail link overlaps feedback. Isa decides.
- goals.saved locale key is unused. Left with the locale hygiene pass.
- Lint warnings in src/lib/data/gymSchedule.ts and src/lib/data/hooks.ts. src/lib/data is off limits.
- No test checks that en, es and fr have the same keys. Not a Phase 3 row.

## Backend
- Progress entries are sorted oldest first before LIMIT 30, so the newest are dropped (backend/internal/gym/schedule_pg.go:765-767). Not a Phase 3 row.
- 49 queries use WHERE id::text = $1, which bypasses the id index. Not a Phase 3 row.
- 20 TestPG tests skip without LUME_TEST_DATABASE_URL. No disposable test database is configured.
- getMorningBrief swallows errors; getProfile's .catch hides errors; there is no anomalies endpoint. Not a Phase 3 row.
- npm audit reports 48 vulnerabilities. Dependency upgrades are not in Phase 3.
- The authenticated role is missing in local Postgres 17. Phase 4.

## Docs
- Row 13 and Row 14 notes are out of round order. Left as written.
- Row 14's older notes still say 'status stays partial' while the row is BUILT. Docs cleanup only.

## Phase 4 (out of scope)
- src/app/profile/delete-account.tsx and src/app/profile/subscription.tsx are untouched.
