HANDOVER: Lume Phase 3, branch loop/phase3. No files were changed while writing this.

ROW STATUS (PHASE3_ROWS.md, 22 lines)
- BUILT: 1, 2, 3, 4, 7, 8, 9, 10, 12, 15, 16. Rows 15 and 16 became BUILT this session.
- PARTIAL: 5, 13, 14, 17.
- DIFFERENT: 6, 11.

BUILT THIS SESSION
- Row 16:
  - Integrations: a failed list shows LoadFailedNotice with Retry (new key integrationsDetails.loadFailed in en, es, fr).
  - Scan calibration, Support and Preferences were already fully translated; added tests only.
  - preferences.tsx header comment corrected.
  - Tests: integrationsLoadFailed, scanCalibration.strings, supportStrings, preferencesCopy (all .render) and supportMailSubject.
- Row 15: BUILT. Goals always shows numbers (useEffectiveGoals), so no empty state; loading and failed-read states parked.
- Row 17:
  - Gap 3: src/components/gym/ExercisePicker.tsx shows LoadFailedNotice gym.loadFailed when useExercises reports isError. No Retry, because there is no refetch. Test: exercisePicker.failed.render.
  - Gap 4: src/app/ai-query.tsx shows the 503 message that ask() returns (src/lib/data/aiBrain.ts:167-169) under the translated title. Test: aiQuery503.render.

IN PROGRESS
Nothing half-done. The next task is Row 17 gap 5: an empty Ask Lume answer renders nothing (ai-query.tsx:108-118). It can be fixed in the screen alone.

LAST GATES
tsc 0 errors. Full Jest 233 suites and 1,338 tests pass; the new test files since add 1 suite and 2 tests. Go 543 pass, 20 TestPG skipped.

DECISIONS
- Never edit existing tests or snapshots; when a change breaks one, back it out.
- src/lib/data is off limits.
- New strings go in new top-level groups before the unique "pendingSync" anchor, by exact text insertion.
- Reuse a key only when the English and the meaning match.
- Test files go in src/__tests__/render/, never src/app.

WAITING ON ISA
- useGoals exposing isLoading, error and refetch (Goals loading and failed-read states).
- Row 17 gaps 1, 2 and 6 need src/lib/data changes:
  - the "No matches" flash during the 250 ms search debounce (hooks.ts);
  - the English "not enough data" and consent replies (aiBrain.ts).
- The Export row is on both Settings (index.tsx) and Privacy (privacy.tsx); each is pinned by its own test.
- Row 8 analytics decisions; the Privacy "Your data" title (kept in English by privacyLocale); es and fr wording review.
- The new Jest baseline.

GOTCHAS
- Run `source ~/.nvm/nvm.sh && nvm use 22` first.
- zsh does not split variables: pass Jest paths through xargs and quote --include globs.
- SegmentedField labels render as [label, ""].
- FlatList trees break allText; use findAll.
- .test.ts files run in Jest's node project.

UNFIXED
- Stale Row 17 notes still say the 503 message waits on aiBrain.ts.
- scanCalibration.basedOn has no _one form.
- preferences.tsx uses a raw gap: 18.
- The 503 text is shown in whatever language the server sends.
- Parked: the nutrition.tsx spoken kcal label (needs the detailChrome snapshot regenerated), the repeat-visit skeleton flash, and the three identical offline Gym notices.