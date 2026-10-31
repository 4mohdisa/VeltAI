HANDOVER: branch loop/design-match. Don't switch, push or merge. The loop script commits. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md.

ROW STATUS (DESIGN_GAP_ANALYSIS.md)
- Row 86, Food detail sheet: BUILT, not verified. All copy in detail.tsx uses t().
- Row 87, Quick add: still DIFFERENT. Screen copy uses t(); citations refreshed.
- Row 85, Day log: still DIFFERENT, with these parts BUILT, not verified:
  - Logged-row macro line uses food.rowMacros, with macros rounded.
  - VoiceOver label is rounded and uses food.gramsUnit.
  - CaloriesCard has a fourth Fibre column.
  - Dots replaced by 6px ProgressBars filled from useGoals().

IN PROGRESS: nothing. Last check: tsc exit 0, app suite 824/824 (before the doc-only round; tsc re-passed after it). Backend last ran earlier at 614 passed, with 18 skipped, the ones seen being TestPG_* (probably need Postgres).

KEY FILES
- src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist)
- src/app/food/detail.tsx, src/app/food/quick-add.tsx
- src/components/display/ProgressBar.tsx
- src/lib/i18n/locales/{en,es,fr}.json
- design/Lume App.html: food screen is bundle 71f71ac4. Decode the __bundler/manifest with node, into /tmp only.

DECISIONS
- Rows with no fibre figure add 0, matching dashboard/nutrition.tsx; the column always shows, as in the design.
- Macro bars use real targets, with a zero-target guard from MacroBars.tsx.
- es and fr macro letters are unreviewed drafts: es P/C/G, fr P/G/L.
- Row 85 stays DIFFERENT because large differences remain.

WAITING ON ISA
- Whether to build the 12px calorie bar and 'left today' figure. useGoals() now supplies the calorie goal.
- Device check of the macro bars and four-column wrapping (es 'Carbohidratos').
- Whether TestPG_* tests must run against Postgres.

SPOTTED, NOT FIXED
Recommended next: DESIGN_GAP_ANALYSIS.md lines 895-897 (stale three-column wording, food.tsx:584-626 citation).

Other doc items:
- Line 930 and row 85's opening say no goal is read.
- Line 1058, "The copy is hardcoded English", contradicts row 87.
- Line 1017 says "Save to my foods"; the app now says "Save to my dishes".
- Line 934 states a current fact inside a differences list.

Code and copy:
- food.rowAnalysing is "Analysing"; design says "Analysing photo — this can take a moment".
- CaloriesCard has a hardcoded g unit.
- Raw energyUnit on logged rows; design is kcal-only.
- No 700ms bar fill animation.
- food.deleteItem is "Delete item"; design says "Remove from log".
- foodLog.per100 is "/ 100g"; design has "/ 100 g".
- No 'Updated {name}' toast after saving.
- Sheet title shows the mode, not the food name (needs Isa).
- 'Check your connection' assumes a cause (food.searchFailed, food.loadFailed).
- Hardcoded strings: scan.ts:305 'Scan failed', quick-add.tsx:73 'Quick add', NumberEntryBar.tsx:108 'Done'.
- SLOT_KEYS duplicated in detail.tsx and quick-add.tsx.
- The CaloriesCard comment cites UI_PASS_GAPS.md §2, unconfirmed.

GOTCHAS
- Use LC_ALL=C /usr/bin/grep and quote (tabs) paths.
- detail.tsx strings are already translated; several rounds found nothing to do, so don't requeue them.
- No test covers CaloriesCard, the macro line or its VoiceOver label, or renders quick-add.tsx, so passing suites don't prove these.
- Say BUILT, never verified.