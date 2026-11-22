HANDOVER: Lume Phase 3, branch loop/phase3

ROW STATUS
- BUILT: 1, 2, 3, 4, 7, 9, 10. No new rows became BUILT in this session. Rows 9 and 10 still need owner checks.
- PARTIAL: 5, 8, 12, 13, 14, 15, 16, 17. Rows 16 and 17 moved from DIFFERENT to PARTIAL in this session.
- DIFFERENT: 6, 11.

BUILT THIS SESSION
- Row 5: `backend/internal/localdb` `DSN()` is the shared localhost-only guard. `tools/seed` and `scripts/seed_demo_account.go` (via `requireLocalDatabase`) both use it. The demo seeder's header and dead check were cleaned up.
- Row 16, Profile empty states:
  - Account name follows a late profile load.
  - Privacy keeps the withdraw control when the consent read fails.
  - Scan accuracy shows an error screen with Retry, and counts scans that have no corrections. Its dev `console.warn` was removed.
  - The Support email row shows a toast when Mail fails.
  - Account, Privacy and About copy now comes from `settings.accountDetails`, `settings.privacyDetails` and `settings.aboutDetails`.
  - Profile streak cards show skeletons while loading.
- Row 17, search empty states:
  - New-recipe ingredient search has loading, error, no-results and first-use states (`newRecipe.searchHint`).
  - ExercisePicker and PlannedValuesForm are fully translated (`exercisePicker.*`).
  - Ask Lume (`src/app/ai-query.tsx`) is translated (`aiQuery.*`).
- Row 15: the PlannedValuesForm weight pad caption shows the form's kg/lb (`exercisePicker.padWeight` uses `{{unit}}`).

LAST GATES
tsc 0 errors. Only targeted Jest files were run, all passing. The full suite hasn't been run since round 252.

IN PROGRESS
Nothing half-done.

WAITING ON ISA
- Changing the existing test `profileEmptyStates.render` test 1, so profile skeletons stop flashing on repeat visits.
- Changing `integrations.render.test.tsx:75`, so a failed Integrations list stops reading as "Nothing connected".
- Changing `privacyLocale.render.test.tsx:55-56`, so the Privacy "Your data" title can be translated.
- `src/lib/data` changes:
  - `hooks.ts`: the "No matches" flash during the search debounce.
  - `gymSchedule.ts`: the ExercisePicker failure state.
  - `aiBrain.ts`: the Ask Lume 503 message and the not_enough_data copy.
- Whether the session screen weight entry (`src/app/gym/session.tsx`, `gymSession.padWeight`) stays kg-only.
- Review of all new es and fr wording, plus the items from the previous handover (the nutrition.tsx snapshot approval, kJ wording and others).

DECISIONS
- Never edit existing tests or snapshots. If one blocks the work, stop and report it.
- Reuse a key only when the English is identical and the meaning matches. `exercisePicker.pillBack` means the back muscle, so it was not reused for navigation "Back".
- The weight caption follows the form's own unit control, not the units setting, because that control decides the saved `weight_unit`.

GOTCHAS
- Run `source ~/.nvm/nvm.sh && nvm use 22` first. Run Jest from the repo root; running it from a subfolder runs 0 tests. No git, Prettier or Maestro.
- `allText` crashes on screens with a FlatList (ExercisePicker). Collect strings with `findAll` instead.
- NumberEntryBar needs a `SafeAreaProvider` in tests.
- Edit locale files by text insertion with an exact anchor, not by a JSON rewrite: en and fr don't round-trip byte for byte. Check that the anchor is unique, because `padWeight` exists in two groups.
- `PHASE3_ROWS.md` must stay at 22 lines. Row 15 is line 20, Row 16 is line 21, Row 17 is line 22.

UNFIXED
- Preferences are not persisted (`src/lib/settings/store.ts`).
- New-recipe recents come only from the selected day.
- PlannedValuesForm duplicates `UNIT_OPTIONS.weight`, and its unit always starts at kg.
- Exercise names, equipment and badges are English data.
- The relative-time keys have no plural forms.

NEXT
Get Isa's decisions on the items above, then run the full Jest suite and the Go tests as a checkpoint.