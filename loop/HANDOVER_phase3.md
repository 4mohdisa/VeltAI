HANDOVER: Lume Phase 3, branch loop/phase3. No files were changed while writing this.

ROW STATUS (PHASE3_ROWS.md)
- BUILT: 1, 2, 3, 4, 7, 8, 9, 10, 12. Rows 8 and 12 became BUILT this session. Row 8 still says "owner check pending".
- PARTIAL: 5, 13, 14, 15, 16, 17.
- DIFFERENT: 6, 11.

BUILT THIS SESSION
- Row 8: added a call-site allowlist test and a build-label test to `src/__tests__/analyticsAllowlist.test.ts` (12 tests). Added `src/lib/analyticsGaps.test.ts` and `src/__tests__/render/privacyAnalytics.render.test.tsx`. PRIVACY_DATA.md now names both places that turn analytics on.
- Row 12: re-checked, then a direct unit test, `src/__tests__/energyRange.useEnergyRange.test.ts`.
- Row 13: barcode-scan, label-scan, photo-capture and CaptureGuidanceOverlay are translated. Test: `render/scanScreens.strings.render.test.tsx`.
- Row 14:
  - Error and loading states plus translations in `(tabs)/gym.tsx`, GymCalendar, MuscleChart, GymPatternsCard, MyScheduleCard, `gym/schedule.tsx`, `gym/new-template.tsx` and the log-session "Only some of it" sheet.
  - Tests: `render/gymCards.emptyStates`, `gymScheduleTemplate.emptyStates`, `gymStreakSkeleton` and `gymLogSessionSomeOfIt`.

IN PROGRESS
Nothing half-done.

LAST GATES
tsc 0 errors. Jest 228 suites and 1,322 tests pass; this is the new baseline, which Isa still needs to confirm. Go: 543 pass and 20 TestPG skipped.

WAITING ON ISA
- Row 8:
  - Should Continue on the AI disclosure (`src/lib/ai/consent.ts`, Phase 4) keep turning analytics on?
  - Should analytics stay off by default (as coded) or be on by default (as the row text says)?
- Rows 13 and 14 need `src/lib/data` changes:
  - `scan.ts`: tell a network failure apart from "Product not found".
  - `foodDays.ts`: return an error flag.
  - `gymRange.ts`: the month summary "0 sessions" is still English.
  - `gymSchedule.ts`: add a refetch to `useGymPatterns` so the muscle cards can offer Retry.
- Review of all new es and fr wording.

DECISIONS
- Test files never go under `src/app`. Expo Router treats every `.ts` or `.tsx` file there as a route (`node_modules/expo-router/_ctx-shared.js`), so render tests go in `src/__tests__/render/`.
- New strings go in new top-level locale groups, inserted before the unique `"pendingSync"` anchor. Reuse a key only when the English and the meaning match.
- When an existing test breaks on a change (for example the Skeleton in new-template), drop that change instead of editing the test.

GOTCHAS
- `source ~/.nvm/nvm.sh && nvm use 22` first. Run Jest from the repo root.
- Skeleton needs reanimated's `useReducedMotion`. Mock `@/components/display/LoadingSkeleton` in tests.
- `useGym().data.loggedDays` is an array, not a Set.
- Stay within 22 lines in `PHASE3_ROWS.md`.

UNFIXED
- `feature_used` still uses `shapeOnly()`, so a key named `app_version` or `build` would overwrite the real build label.
- `formatWeekdayDate` and the MyScheduleCard weekday use the device language, not the app language.
- The Gym tab can show three identical load-failed notices when offline.
- WeekStrip's ", today" and Previous/Next week labels are still English, and so are muscle and exercise names.
- In PRIVACY_DATA.md, the "Allowlist test" bullet sits under "Defaults and open items".

NEXT
Get Isa's decisions above, then prepare the Row 11 final sweep.