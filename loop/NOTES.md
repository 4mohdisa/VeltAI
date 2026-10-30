# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97); celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding, no Button edit.
- Recents macros per 100 g; missing stays undefined.
- Macros stored unrounded; display rounds. Calories keep Math.round.
- Card variant='elevated' maps the white card. Session mode derived, not set in effects.
- Gym duration logged when above 0, else undefined; keep ?? for template estimate.
- Design grid 1fr 1fr, 12pt gap; fixed-percent widths not acceptable.
- Blocker that came back twice: park, do not retry.
- Flagged report cleared by a verification-only run before new code (doc-only is not enough when the flag names tests).
- Prompts: one task, one editable file (verification runs excepted); name design/ file, gap row and branch; say no git.
- Checkpoint rounds: full tsc and full app suite, no file changes.
- Rejected prompt: rewrite with every point fixed before re-sending.
- Recipe builder (/food/new-recipe) has no design counterpart.
- Add sheet summary row BUILT at Isa's instruction; section verdict stays PARTIAL MATCH.
- Round-scoped modified-file checks only.
- Missing macros are a data model change: parked, not asked (R106, R107).
- Jev 'ask' overridden when next task needs nothing from Isa (R106, R107, R110, R111). Flag rule outranks Jev ranking (R109).
- Add sheet bottom padding: negative margin on the tile grid accepted as interim (R108). SheetContent is shared, not edited.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet: title 'Add to {meal}' (add.tsx:56), + logs 100 g with toast, two equal tile columns, bottom padding via marginBottom -space.xl.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control. SegmentedField compact prop.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx scales macros and fibre by grams; totals sum fibre.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT, 0 EXACT. BUILT rows: 76, 86, 90.
- Checkpoints R88 and R102 green. Last full suite (824 tests) predates the recipe totals and add.tsx edits.
- R110 verification clean: tsc 0 errors, hooks 5 suites/33 tests, sheetVariant and tabbar 22/22, eslint clean on three files. R109 flag cleared.

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods tile goes to food tab; 0pt gap on no-inset devices (doc silent); row 1445 'This pass' cell holds build status, not audit verdict.
- Quick add (row 87): no blinking caret; own flex:1 KeyboardAvoidingView; hardcoded English; offline toast names no meal; Meal chip padding and transition; confirm 17/24 vs 17/22; Meal chip token unconfirmed.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- food/detail.tsx and quickAdd log missing macros as 0 (parked).
- detail.tsx num() rounds macros on save; search seed and applyGrams round too.
- Saved foods drop fibre in editSavedFood and saveFood (SavedFood.fibre exists).
- Recents fibre carried in hooks.ts, not displayed.
- Recipe Total shows 0g fibre when unknown (stored as 0).
- Calories can drift in new-recipe editRow and recents.
- Locales: es.json lacks addMenu.addToSlot (in progress R111); fr.json lacks addMenu.title and addToSlot. Slot default 'Snack' vs design 'Snacks'.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.
- Test gap: no test names SegmentedField.tsx, quick-add.tsx or new-recipe.tsx.
- Jest noise: hooks.ts:56 'API unreachable' log; tabbar act() warning from reduceMotion.ts:13. Not blocking.
- loop/NOTES.md lines 39, 42, 54 to re-read.

## Blocked on Isa
- Row 23 one-tap log: route to log-session, or accepted deviation.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Quick add confirm 17/22: Button prop, bodyBold change, or accept 17/24.
- Global + title: keep 'Add meal' or name a default meal.
- Add sheet status label: BUILT or PARTIAL.
- Negative margin: accept, or replace via a SheetContent option.
- Last-hour modified-files check: keep, or round-scoped only.
- Device runs: Add sheet (34pt inset; grid at 320pt and 430pt); recipe flow and fibre; quick add; celebration card.
- Macro types for food detail (parked, needs a decision before any type change).

## Next
1. R111 (this round): es.json addMenu.addToSlot, one file.
2. R112: fr.json addMenu.title and addToSlot, one file.
3. Add sheet icons: SF Symbols to design SVGs, one icon per round, in src/app/food/add.tsx.
4. Checkpoint: full tsc and full app suite, no file changes.
5. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 in food/detail.tsx and quickAdd: needs a data model change across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding and transition.
- Code: mixHex to shared helper, goals.tsx copy, CONFLICT_KEYWORDS untyped, router.setParams history, blinking caret, Math.round in draft().
- Recipe fibre saved as 0 (model needs optional field).
- Saved foods fibre dropped in editSavedFood and saveFood.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx.
- Add sheet negative margin: SheetContent option only if Isa wants it cleaner.

## Loop notes (condensed)
- R83-R87: verification and doc rounds. R88, R102: checkpoints green.
- R89, R99: prompts rejected (no design/ file named), rewritten.
- R92-R96: fibre across new-recipe and recents. R105: verification run, hooks 5 suites, 33 tests.
- R106: detail macros parked. R107: Add sheet padding via negative margin.
- R108, R109: doc-only. R109 flag cleared by doc-only, locale keys deferred.
- R110: verification-only, flag cleared (tsc, hooks, sheetVariant, tabbar, eslint all green).
- R111: es.json addToSlot. Jev ask overridden.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; entry 71f71ac4 is food.
- --findRelatedTests misses source-reading tests (foodDetail, fibrePipeline, sheetVariant, foodMealMove); grep src/__tests__.
- --findRelatedTests hooks.ts gives 5 suites, 33 tests. 'Nine suites, 116' means nine named suites.
- Shell grep is ugrep; use /usr/bin/grep with LC_ALL=C for long patterns.
- Shared Button in src/components/forms affects all callers; override locally first.
- SheetContent is shared; do not edit it for one screen.
- zsh does not word-split unquoted variables. Expo rules in AGENTS.md.
- loop/NOTES.md is edited outside the session; re-read before each update.
- Add sheet title line moves; grep before citing a line number.
