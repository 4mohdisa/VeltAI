HANDOVER: Lume Phase 3, branch loop/phase3

ROW STATUS (unchanged this session)
- BUILT: 1, 2, 3, 4, 7, 9, 10. Rows 9 and 10 still need owner checks.
- PARTIAL: 5, 8, 12, 13, 14, 15.
- DIFFERENT: 6, 11, 16, 17.
- All this session's work went into Row 15 (copy pass), rounds 236 to 252, logged in its cell.

BUILT THIS SESSION (Row 15)
- fr.json typography:
  - curly apostrophes (round 237)
  - no-break spaces before ':' and '?' (round 238)
  - no-break spaces inside « » in foodLog.noMatches (round 239)
- Goals calorie field: spoken label uses goals.caloriesSpoken when the unit is kcal; kJ stays "kJ". Test goalsSpokenCalories.render.
- Scan accuracy (src/app/profile/scan-calibration.tsx): 14 settings.scanCalibration.* keys. Test scanAccuracyCopy.render.
- Integrations (src/app/profile/integrations.tsx): 18 profile.integrations.* keys, English text unchanged, comments corrected. Test integrationsCopy.render.
- spokenEnergy(kcal, unit, t) is exported from src/lib/units.ts. src/app/(tabs)/food.tsx uses it for the meal header and food row labels. Test foodSpokenKcal.render.

LAST GATES (round 252)
- tsc: 0 errors.
- Jest: 213 suites, 1252 tests, 4 snapshots, all passing.
- Go (round 244): 637 passed, 0 failed, 20 TestPG_* skipped (no local database).

IN PROGRESS
- src/app/dashboard/nutrition.tsx spoken kcal labels: the calories hero and the meal rows. The fix was backed out in round 249, because the detailChrome.render macros snapshot pins the "kcal" labels.
- Once Isa approves:
  - make the `remaining` const use spokenEnergy (the hero label is its only user)
  - switch the other two calls
  - regenerate that one snapshot
  - add nutritionSpokenKcal.render.test.tsx

DECISIONS
- Check every prompt against the files first. Rounds 246 and 252 asked for apostrophe work that was already done.
- Never edit existing tests or snapshots. If one breaks, back out the change and report.
- Reuse keys only when the visible English stays identical. The compact "2h ago" kept its own keys.
- French percent uses a plain space before %, as instructed.
- Row notes must state what actually happened, even when the prompt dictates other wording.

WAITING ON ISA
- Approval for the detailChrome macros snapshot update.
- Whether kJ should be spoken as "kilojoules".
- Spanish and French wording from rounds 242 and 243 (for example, French "plus de {{food}}" doesn't elide before vowels).
- es.json-only keys addMenu.voice and addMenu.describeOutLoud.
- Everything left from the previous handover.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. No git, Prettier or Maestro.
- zsh does not split $var file lists. Use xargs or ${=var}.
- Perl replacement strings interpolate ${...}, which caused a bug in round 242. Use node with s.replace(a, () => b).
- Perl without -CSD double-encodes non-ASCII text. Check the bytes after an edit.
- PHASE3_ROWS.md: append notes inside line 20 (the Row 15 cell). The file must stay at 22 lines.

UNFIXED
- goals.saved is unused.
- The scan-calibration.tsx:50 dev-only console.warn is still there.
- The relative-time keys have no plural forms.
- Privacy share-sheet subject, the two Export rows and the Support feedback overlap (carried over).

NEXT
Get Isa's approval on the snapshot, then finish the nutrition.tsx labels.