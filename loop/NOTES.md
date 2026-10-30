# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras go to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative. Compare code with design before each row; fix real differences only.
- Isa: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97); celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash (no body weight). Quick add detent fitToContents. Pill height by padding, no Button edit.
- Recent macros scaled per 100 g. Search foods to food tab is a real difference; dedicated search sheet parked.
- Card variant='elevated' maps the white card. Session mode derived, not set in effects.
- Gym duration logged when above 0, else undefined; keep ?? for template estimate.
- Design grid is 1fr 1fr with 12pt gap; fixed-percent widths not acceptable.
- A task whose blocker came back twice is parked, not retried.
- A flagged report is cleared by a verification-only or doc-only run before any new code edit.
- Prompts: one task, one editable file; doc-only runs no tests; name design/ file, gap row and branch; say no git.
- Checkpoint rounds run full tsc and full app suite with no file changes.
- A rejected prompt is rewritten with every listed point fixed before re-sending.
- Recipe builder (/food/new-recipe) has no design counterpart; match-to-design does not apply.
- Macros stored unrounded; display rounds. Calories keep Math.round.
- Missing macros stay missing in recents. new-recipe.tsx saves missing fibre as 0 (model limit); parked.
- Add sheet summary row is BUILT at Isa's instruction; section verdict stays PARTIAL MATCH.
- Round-scoped modified-file checks only. Last-hour scan dropped unless Isa replies otherwise.
- R95: Jev ranked the fibre edit first (92%). Kept the verification-only run first, per the flag rule above. Fibre edit is R96.
- R96: recents fibre stays undefined when unknown (not 0). Recipe save still 0 by model limit.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet: 'Add to {meal}' title, + logs 100 g with toast, two equal tile columns (flexGrow 1, flexBasis 40%, 12pt gap).
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard in log-session.tsx). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control. SegmentedField compact prop (opt-in).
- Recents macros per 100 g in hooks.ts, including fibre (R96; undefined when unknown; not verified by any test). new-recipe.tsx ingredientFrom scales protein, carbs, fat, fibre by grams; editRow carries fibre. No test covers new-recipe.tsx.
- DESIGN_GAP_ANALYSIS.md: 23 DIFFERENT / 15 PARTIAL / 3 BUILT / 0 EXACT.
- Checkpoint R88 green: tsc 0 errors, 65/65 suites, 824/824 tests.

## Open differences
- Add sheet: SF Symbols not design SVGs; scan routes split; bottom padding 54pt vs 34pt; Search foods tile goes to food tab; correction row shows a cross beside BUILT text.
- Quick add (row 87): no blinking caret; own flex:1 KeyboardAvoidingView; hardcoded English; offline toast names no meal; Meal chip padding and no background transition; confirm label 17/24 vs 17/22; Meal chip label token vs 600 13/17 unconfirmed.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- food/detail.tsx and quickAdd log missing macros as 0. Keep ?? for planMinutes.
- Food Search section has no recents macros note beyond the R97 line; recents fibre carried, not displayed (wording fixed in R100, line about 1046).
- Locales: es.json lacks addMenu.addToSlot; fr.json lacks addMenu.title and addToSlot. Slot default 'Snack' vs design 'Snacks'.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.
- Rounded calories can drift in new-recipe edit path and recents.
- new-recipe.tsx totals (around lines 64-72) omit fibre.
- Test gap: no test names SegmentedField.tsx, quick-add.tsx or new-recipe.tsx by path.

## Blocked on Isa
- Row 23 one-tap log: route to log-session, or accepted deviation (unanswered since r43).
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Quick add confirm 17/22: Button label or size prop, change bodyBold for all callers, or accept 17/24.
- Global + title: keep 'Add meal' or name a default meal.
- Add sheet status label: BUILT or PARTIAL.
- Whether the last-hour modified-files check stays, or a round-scoped scan replaces it.
- Device run, recipe: add a recent and a searched food, check totals and fibre, change grams, save.
- Device run, owner checks: quick add fit and no collapse, NumberEntryBar above keyboard, pill, compact chips, MEAL caption, toast; Add sheet title and tile grid at 320pt and 430pt; celebration flow (row 17 step 3); recipe macros.

## Next
1. R101 (this round): verification-only. tsc once, eslint on new-recipe.tsx and hooks.ts. No file edits. Clears the R100 flag.
2. R102: add fibre to totals in src/app/food/new-recipe.tsx (own round, one file).
3. Stop logging missing macros as 0 in src/app/food/detail.tsx (own round). Same for quickAdd (own round).
4. Add sheet icons, scan routes, bottom padding (src/app/food/add.tsx).
5. Locale keys: es.json and fr.json, own round.
6. Doc-only: re-read loop/NOTES.md lines 39, 42, 54 (may be stale) and correct.
7. Checkpoint: full tsc and full app suite, no file changes.
8. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding and transition.
- Code: mixHex to shared helper, goals.tsx copy, CONFLICT_KEYWORDS untyped, router.setParams history, blinking caret, Math.round in draft().
- Missing fibre in new-recipe.tsx saved as 0 (model needs optional field).
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx.

## Loop notes
- R83-R87: verification and doc rounds green; flags cleared as they came.
- R88: checkpoint green. R89: prompt rejected (no design/ file named), re-sent.
- R90-R91: doc truth-up, then verification green.
- R92-R94: fibre in new-recipe.tsx; checks green. Flagged for tsc/tests not run and a last-hour scan of 20 files.
- R95: verification-only run green (tsc 0, eslint clean, 116/116 hooks tests). Flag cleared.
- R96: fibre in recents, one-file prompt, tsc once and hooks tests only. Flagged as partly done.
- R97: doc-only run to clear the R96 flag. No tests. Flagged: no type check or tests run.
- R98: verification-only run to clear the R97 flag. No file edits. Flagged.
- R99: prompt rejected (no design/ file named). Rewritten as verification-only. Green: tsc 0, eslint clean, 33/33 hooks tests. Flagged as partly done.
- R100: doc-only wording fix (line about 1046 in DESIGN_GAP_ANALYSIS.md, 'show' changed to 'carry'). Flagged: no type check or tests run.
- R101: verification-only run (tsc, eslint on touched files, no edits) to clear the R100 flag.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; entry 71f71ac4 is food.
- Source-text tests are invisible to --findRelatedTests; grep src/__tests__ for the path.
- Shared Button in src/components/forms affects all callers; override locally first.
- zsh does not word-split unquoted variables. Expo rules in AGENTS.md.
- loop/NOTES.md is edited outside the session; re-read before each update.
- Prefer small verified steps. Grepping 'hooks' is loose.