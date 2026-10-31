HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs requirement is in AGENTS.md.

BUILT THIS SESSION (not verified)
- src/app/food/detail.tsx: search and barcode seeds keep macros and fibre unrounded, calories whole. editSavedFood and saveFood write fibre (:263, :317).
- src/app/(tabs)/food.tsx: quickAdd (the + on search rows) logs macros and fibre to 1 decimal.
- src/lib/data/mappers.ts: savedFoodFromApi reads fibre when > 0.
- src/app/food/saved.tsx: toEditable (:38) and add (:66) pass fibre when > 0.
- DESIGN_GAP_ANALYSIS.md: lines 1011, 1012, 1219 rewritten; 1090-1091 say + logs 100 g, parked; all detail.tsx citations moved to current lines.

GAP ROWS
Food detail difference 13 stays BUILT. No status cell or header count changed. No row covers saved-food fibre.

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0 after the final edits. Five suites naming food/detail: 60 tests passed. Last full suite: 65 suites, 824 tests passed; it predates the saved.tsx add and toEditable edits. No test covers decimal macros, quickAdd or saved-food fibre.

DECISIONS
- Seeds store unrounded values because num sits inside DetailForm; display and save round through num and MACRO_PRECISION.
- quickAdd rounds inline because it bypasses the form and MACRO_PRECISION is not exported.
- Fibre uses > 0 on saved foods because the column is a plain number, so 0 means unknown, as on log rows.
- Macro totals stay whole, as the design rounds them.

WAITING ON ISA
- First or second serving for the + button: the design uses x.serv[1]. FoodResult has no serving data, so parked as a data change.
- Food detail differences 1, 2, 4; do the ❌ verdicts at lines 961, 1210 hold?
- Line 330: stay Partial?
- Already-logged days: real editing or change toast? /gym/session writes a second session row (mutations.ts:173-178).
- Log-sheet row: stay BUILT?
- Device check, es/fr review, wash pill token, whole-day kcal, note-text cardio, Freestyle "No", "1,500 kcal" goal.

NOT FIXED (recommended next: first item)
- editSavedFood (src/lib/data/mutations.ts:157) is local only, so edits are lost on reload.
- Raw item values: (tabs)/food.tsx:852, :895; food/saved.tsx:144. Needs a design decision.
- MACRO_PRECISION comment omits fibre; inline Math.round(x * 10) / 10 repeats.
- Gap lines 1014 onward unchecked; line 90 merge; line 1495.
- 'Add something extra' missing on logged days.
- /gym/session saves all sets at top weight.
- Try again hardcoded with small tap target; session.tsx strings untranslated.
- PlannedValuesForm.tsx:200 not compared to design.

GOTCHAS
- Briefs repeat finished work and quote phrases already gone; check content first.
- Design assets decode in memory with node -e from the __bundler/manifest script; food 71f71ac4.
- zsh breaks on unquoted globs and echo ==; quote (tabs) paths.
- grep -c returning 0 exits 1. Use LC_ALL=C /usr/bin/grep.