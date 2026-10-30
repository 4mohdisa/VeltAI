# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97); celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash (no body weight). Quick add detent fitToContents. Pill height by padding, no Button edit.
- Recents macros per 100 g; missing stays missing (fibre undefined when unknown).
- Macros stored unrounded; display rounds. Calories keep Math.round.
- Card variant='elevated' maps the white card. Session mode derived, not set in effects.
- Gym duration logged when above 0, else undefined; keep ?? for template estimate.
- Design grid 1fr 1fr, 12pt gap; fixed-percent widths not acceptable.
- Blocker that came back twice: park, do not retry.
- Flagged report cleared by a verification-only or doc-only run before new code.
- Prompts: one task, one editable file; doc-only runs no tests; name design/ file, gap row and branch; say no git.
- Checkpoint rounds: full tsc and full app suite, no file changes.
- Rejected prompt: rewrite with every point fixed before re-sending.
- Recipe builder (/food/new-recipe) has no design counterpart.
- Add sheet summary row BUILT at Isa's instruction; section verdict stays PARTIAL MATCH.
- Round-scoped modified-file checks only.
- Missing macros: a data model change, so parked, not asked (R107).
- R106: Jev's 'ask' signal overridden; next task needs nothing from Isa. R107: same reason.
- Add sheet bottom padding: negative margin (marginBottom -space.xl on tile grid in add.tsx) accepted as interim workaround (R108). SheetContent is shared, so not edited.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet: title 'Add to {meal}', + logs 100 g with toast, two equal tile columns (flexGrow 1, flexBasis 40%, gap space.md). Bottom padding 34pt via marginBottom -space.xl (R107).
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control. SegmentedField compact prop.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx scales macros and fibre by grams; ingredientFrom and editRow carry them back.
- DESIGN_GAP_ANALYSIS.md: 23 DIFFERENT / 15 PARTIAL / 3 BUILT / 0 EXACT.
- Checkpoints R88 and R102 green (tsc 0, 65/65 suites, 824/824 tests).

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods tile goes to food tab.
- Quick add (row 87): no blinking caret; own flex:1 KeyboardAvoidingView; hardcoded English; offline toast names no meal; Meal chip padding, no background transition; confirm label 17/24 vs 17/22; Meal chip label token unconfirmed.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- food/detail.tsx and quickAdd log missing macros as 0. Parked: needs a type change across FoodItem, NewFoodItem, DetailItem, logInputFromItem and the summing code in foodStore.ts, mappers.ts and hooks.ts.
- Saved foods lose fibre: editSavedFood and saveFood in detail.tsx omit fibre although SavedFood.fibre exists.
- Rounded macros: num() in detail.tsx rounds macros when saving; search seed and applyGrams round too. Conflicts with the unrounded decision.
- Food Search: recents fibre carried in hooks.ts, not displayed.
- Locales: es.json lacks addMenu.addToSlot; fr.json lacks addMenu.title and addToSlot. Slot default 'Snack' vs design 'Snacks'.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.
- Rounded calories can drift in new-recipe editRow and recents.
- new-recipe Total omits fibre; shows 0g fibre when unknown (stored as 0).
- Test gap: no test names SegmentedField.tsx, quick-add.tsx or new-recipe.tsx.
- Doc: correction rows (food detail and Add sheet) carried a cross beside BUILT; fix in R108 doc-only run. Add sheet bottom padding entries updated in R108.

## Blocked on Isa
- Row 23 one-tap log: route to log-session, or accepted deviation (since r43).
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Quick add confirm 17/22: Button prop, change bodyBold for all callers, or accept 17/24.
- Global + title: keep 'Add meal' or name a default meal.
- Add sheet status label: BUILT or PARTIAL.
- Add sheet bottom padding: device check on a 34pt-inset iPhone (expect 34pt under grid; on no-inset device gap is 0pt). Accept negative margin for now (recommended) or replace via a SheetContent option.
- Last-hour modified-files check: keep, or round-scoped scan only. Failed last time (20 files, from earlier rounds); a round-scoped scan was empty.
- Device runs: recipe flow (fibre totals, recents fibre, 0g when unknown, save); quick add (fit, NumberEntryBar, pill, chips, MEAL caption, toast); Add sheet grid at 320pt and 430pt; celebration flow (row 17 step 3).

## Next
1. R108 (this round): doc-only. Update Add sheet bottom padding entries and remove crosses beside BUILT in correction rows, in DESIGN_GAP_ANALYSIS.md only. No tests.
2. Locale keys: es.json addMenu.addToSlot; fr.json addMenu.title and addToSlot. Design copy only.
3. Add sheet icons (SF Symbols to design SVGs), one icon per round, in src/app/food/add.tsx.
4. Checkpoint: full tsc and full app suite, no file changes.
5. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 in food/detail.tsx and quickAdd: needs a data model change across types and totals (R106 finding). Option: make the three macros optional on FoodItem, NewFoodItem, DetailItem and logInputFromItem, and count missing as 0 only when summing. Backend storage of macros not yet checked.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding and transition.
- Code: mixHex to shared helper, goals.tsx copy, CONFLICT_KEYWORDS untyped, router.setParams history, blinking caret, Math.round in draft().
- Recipe fibre saved as 0 (model needs optional field).
- Saved foods fibre dropped in editSavedFood and saveFood.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx.
- Add sheet negative margin: replace with a SheetContent option only if Isa wants it cleaner (shared file).

## Loop notes (condensed)
- R83-R87: verification and doc rounds; flags cleared.
- R88, R102: checkpoints green.
- R89, R99: prompts rejected (no design/ file named); rewritten.
- R92-R96: fibre across new-recipe and recents; flags cleared by verification runs.
- R103: totals fibre fix. R104: tsc 0, eslint clean, jest not run. Flagged.
- R105: verification-only, tsc 0, hooks jest 5/5 suites, 33/33 tests. Flag cleared. Name the test set explicitly in future checks.
- R106: detail.tsx missing-macros fix blocked (needs type change); moved to Parked, not asked. Related tests to run by name when that work happens: foodDetail, fibrePipeline, sheetVariant, foodMealMove.
- R107: Jev ask overridden. Add sheet padding built via negative margin; report flagged as partly done (padding workaround, device check open).
- R108: flag from R107 being cleared by doc-only run (gap analysis Add sheet entries). Handover recommendation (fibre in useFoodSearch recents) already built in R92-R96; dropped from Next.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; entry 71f71ac4 is food.
- Source-text tests are invisible to --findRelatedTests; grep src/__tests__.
- Shared Button in src/components/forms affects all callers; override locally first.
- SheetContent (src/components/navigation) is shared by other sheets; do not edit for one screen.
- zsh does not word-split unquoted variables. Expo rules in AGENTS.md.
- loop/NOTES.md is edited outside the session; re-read before each update.
- Grepping 'hooks' is loose; name the exact test set.