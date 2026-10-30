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
- A flagged doc-only report is cleared by a verification-only run before any new edit.
- Prompts: one task, one editable file; doc-only rounds run no tests; name design/ file, gap row and branch; say no git.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; title 'Add to {meal}' (add.tsx:53); + logs 100 g with toast.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard from save() in log-session.tsx). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros in hooks.ts. new-recipe.tsx ingredientFrom scales protein, carbs, fat by grams (no test covers it).

## Open differences
- Add sheet: tile gap (48% tiles, space-between) vs design; SF Symbols not design SVGs; scan routes split; bottom padding 20pt plus safe area vs 34pt.
- Quick add: no blinking caret; own flex:1 KeyboardAvoidingView (quick-add.tsx:114); hardcoded English; Meal chip 8pt padding, no selection transition (row 87).
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- ingredientFrom: fibre saved as 0; literal \n at new-recipe.tsx:49.
- quickAdd and food/detail.tsx log missing macros as 0. Keep ?? for planMinutes.
- Doc stale: DESIGN_GAP_ANALYSIS.md:86-87 says FoodNumberEntryBar (real: NumberEntryBar); summary count near line 72; Add sheet correction row near 1431; food Search lacks recents-macros note.
- Locales: es.json lacks addMenu.addToSlot; fr.json lacks addMenu.title and addToSlot. Slot: design 'Snacks' vs 'Snack' default.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.

## Blocked on Isa
- Row 23 one-tap log: route onLog to log-session, or accepted deviation. Unanswered since r43.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Quick add confirm 17/22: add Button label or size prop, change bodyBold for all callers, or accept 17/24.
- Global + title: keep 'Add meal' or name a default meal.
- ingredientFrom device run: add a recent and a searched food to a recipe, check totals, change grams, save.
- Owner device checks (ask once): quick add fit, MEAL caption, toast, compact chips, keyboard bar, Add sheet title, celebration flow, recipe macros.

## Next
1. Add sheet tile gap in add.tsx: space-between to the design's column gap, checked against design/.
2. Stop logging missing macros as 0 in food/detail.tsx (own round, verification first).
3. Same for quickAdd (own round).
4. Doc-only truth-up of the stale lines above.
5. Add sheet icons, scan routes, bottom padding.
6. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding and transition.
- Code: mixHex to shared helper, goals.tsx copy, CONFLICT_KEYWORDS untyped, router.setParams history, blinking caret, Math.round in draft().
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx.

## Loop notes
- R83: verification-only run green (tsc, eslint, 9 suites, 146 tests). R84: notes rewritten under 600 words.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish.
- Source-text tests are invisible to --findRelatedTests; grep src/__tests__ for the path.
- Shared Button in src/components/forms affects all callers; override locally first.
- zsh does not word-split unquoted variables. Expo rules in AGENTS.md.
- Notes file was edited outside the session; re-read before each update.