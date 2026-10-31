HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs requirement is in AGENTS.md.

BUILT THIS SESSION (not verified)
- src/app/gym/session.tsx: plannedRows carries rest_seconds (:200).
- src/app/food/detail.tsx: protein, carbs, fat and fibre keep 1 decimal, typed or picked, on display and save. MACRO_PRECISION :66, num :402.
- DESIGN_GAP_ANALYSIS.md: session.tsx and detail.tsx citations correct; edit-bar, ExercisePicker, effort/energy and number-entry text corrected.

GAP ROWS
- Difference 11 (rest seconds, planned rows) and Food detail difference 13 (precision, including fibre) are BUILT. No status cell or header count changed.

IN PROGRESS: nothing mid-edit.

LAST CHECKS: tsc exit 0, sheetVariant, foodDetail and foodDetailLogged render: 44 tests passed, after all edits. Last full suite (65 suites, 824 tests passed) predates the applyGrams and fibre changes. No test covers decimal macros.

DECISIONS
- Macro totals stay whole: the design rounds them (hMacroCols, gMacroDefs); r1 is only on Food detail.
- draft() rounds to 1 decimal on save; only form state is unrounded.
- Numeric cites on doc line numbers shift; always confirm by content.

NEXT: doc-only fix. Line 1219 "Fibre is still rounded as it is typed" is now false. Line 1012 "Fibre is not editable" and line 1011 "2-up inputs" are stale.

WAITING ON ISA
- Food detail differences 1, 2, 4: keep listed? Do ❌ verdicts at lines 961, 1210 hold?
- Line 330: stay Partial?
- Already-logged days: build real editing or change toast? /gym/session writes a second session row (src/lib/data/mutations.ts:173-178).
- Log-sheet row: stay BUILT?
- Device check, es/fr review, wash pill token, whole-day kcal, note-text cardio, Freestyle "No", "1,500 kcal" goal.

NOT FIXED
- Seeds round macros: detail.tsx:164-168, :224; src/app/(tabs)/food.tsx:380-382.
- Raw item values: (tabs)/food.tsx:895, :852; food/saved.tsx:135.
- Gap lines 1006 onward unchecked; line 90 merge; prior-reports line 1495 "no keyboard bar".
- 'Add something extra' missing on logged days.
- /gym/session saves all sets at top weight, overstating volume.
- Try again hardcoded with small tap target; session.tsx strings untranslated.
- PlannedValuesForm.tsx:200 "Add exercise" not compared to design.

GOTCHAS
- Briefs have named wrong premises; check first.
- Design assets decode in memory with node -e from the __bundler/manifest script; food 71f71ac4, gym 7dc211f6, summary 185bb533.
- zsh breaks on unquoted globs and echo ==; quote (tabs) paths.
- grep -c returning 0 exits 1, which the tool reports as failure. Use LC_ALL=C /usr/bin/grep.