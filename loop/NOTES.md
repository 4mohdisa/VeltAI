# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras go to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative. Before each row, compare code with design/; fix real differences only.
- Isa: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted); celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash (no body weight). Quick add detent fitToContents (_layout.tsx:160). Pill height by padding, no Button edit.
- Recent macros scaled per 100 g. Search foods to food tab is a real difference; dedicated search sheet parked.
- Card variant='elevated' maps the white card. Session mode derived, not set in effects.
- Gym duration logged when above 0, else undefined; keep ?? for template estimate.
- A task whose blocker came back twice is parked, not retried.
- A flagged report is cleared by a verification-only or doc-only run before any new code edit.
- Design grid is 1fr 1fr with 12pt gap; fixed-percent tile widths are not acceptable.
- Prompts: one task, one editable file; doc-only rounds run no tests; name design/ file, gap row and branch; say no git.
- Checkpoint rounds run the full tsc and full app suite with no file changes (R88 overrode Jev's ranking for this reason: last full-suite run predates Quick add, compact and recents changes).
- A rejected prompt is rewritten with every listed point fixed before it is re-sent (R89: missing design/ file name).

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; title 'Add to {meal}' (add.tsx:53); + logs 100 g with toast.
- Add sheet tiles: two equal columns, flexGrow 1, flexBasis 40% (TILE_BASIS), 12pt gap from space.md. Quick add row flexBasis 100%. Owner to check at 320pt and 430pt.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard from save() in log-session.tsx). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control. SegmentedField compact prop (opt-in).
- Recents macros in hooks.ts (per 100 g). new-recipe.tsx ingredientFrom scales protein, carbs, fat by grams (no test covers it).
- DESIGN_GAP_ANALYSIS.md truth-up done (R86): count 23 DIFFERENT / 15 PARTIAL / 3 BUILT / 0 EXACT.
- R87 verification (tsc, eslint, 9 suites, 126 tests) green; R86 flag cleared.

## Open differences
- Add sheet: SF Symbols not design SVGs; scan routes split; bottom padding 54pt vs 34pt; Search foods tile goes to food tab.
- Add sheet status conflict: summary says BUILT, section verdict says PARTIAL. Isa to pick one label.
- Quick add: no blinking caret; own flex:1 KeyboardAvoidingView (quick-add.tsx:114); hardcoded English; offline toast names no meal; Meal chip 8pt horizontal padding, no selection transition (row 87).
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- ingredientFrom: fibre saved as 0 (new-recipe.tsx:34-44 and edit path near 80); literal \n in comment at new-recipe.tsx:49.
- quickAdd and food/detail.tsx log missing macros as 0. Keep ?? for planMinutes.
- Food Search section has no recents macros note.
- DESIGN_GAP_ANALYSIS.md:86-87 say FoodNumberEntryBar; should be NumberEntryBar.
- Locales: es.json lacks addMenu.addToSlot; fr.json lacks addMenu.title and addToSlot. Slot: design 'Snacks' vs 'Snack' default.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.
- Calorie rounding in new-recipe edit path and useFoodSearch recents can drift ingredient calories slightly.

## Blocked on Isa
- Row 23 one-tap log: route onLog to log-session, or accepted deviation. Unanswered since r43.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Quick add confirm 17/22: add Button label or size prop, change bodyBold for all callers, or accept 17/24.
- Global + title: keep 'Add meal' or name a default meal.
- ingredientFrom device run: add a recent and a searched food to a recipe, check totals, change grams, save.
- Owner device checks (ask once): quick add fit, MEAL caption, toast, compact chips, keyboard bar, Add sheet title and tile grid at 320pt and 430pt, celebration flow, recipe macros.

## Next
1. R88 (rewritten after R89 rejection, names design/Lume App.html and row 87): checkpoint. Full tsc and full app suite, no file changes. Report all failures.
2. If green: fibre and macro scaling. In src/app/food/new-recipe.tsx scale fibre in ingredientFrom (lines 34-44) and update the edit path (near line 80); in src/lib/data/hooks.ts include fibre in useFoodSearch recents. One file per round.
3. Stop logging missing macros as 0 in food/detail.tsx (own round, verification first).
4. Same for quickAdd (own round).
5. Add sheet icons, scan routes, bottom padding.
6. Re-read loop/NOTES.md lines 39, 42, 54 (may be stale).
7. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding and transition.
- Code: mixHex to shared helper, goals.tsx copy, CONFLICT_KEYWORDS untyped, router.setParams history, blinking caret, Math.round in draft().
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx. No test names SegmentedField.tsx or quick-add.tsx by path.

## Loop notes
- R83: verification-only run green (tsc, eslint, 9 suites, 146 tests).
- R85: last report flagged. Tile width fixed to 1fr 1fr with 12pt gap; BUILT, not verified.
- R86: doc-only truth-up. No code, no tests. Flagged for no checks run.
- R87: verification-only run green (tsc 0 errors, eslint clean, 9 suites, 126 tests). R86 flag cleared.
- R88: checkpoint requested by loop note. Jev ranked fibre task first (82%); kept checkpoint, reason in decisions. Prompt rejected before running.
- R89: prompt rejected before running: did not name the matching design/ file. Rewritten as R88 checkpoint naming design/Lume App.html and row 87. Jev: run 91%, last task clean 18%, risk 1.5/2.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish.
- Source-text tests are invisible to --findRelatedTests; grep src/__tests__ for the path.
- Shared Button in src/components/forms affects all callers; override locally first.
- zsh does not word-split unquoted variables. Expo rules in AGENTS.md.
- Notes file was edited outside the session; re-read before each update.
- Jev risk was 1.5/2 with 23% clean-completion confidence on the last task; prefer small, verified steps.