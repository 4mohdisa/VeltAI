# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras go to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is the source of truth; the gap analysis is authoritative.
- Isa: cardio stays Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding.
- Macros stored unrounded, display rounds; calories Math.round. Recents missing macros stay undefined.
- Gym duration logged when above 0, else undefined.
- Grid 1fr 1fr, 12pt gap; no fixed-percent widths.
- Missing macros are a data model change: parked, not asked.
- Recipe builder (/food/new-recipe) has no design counterpart.
- Add sheet row 90 BUILT at Isa's instruction; section verdict stays PARTIAL MATCH. Negative margin accepted as interim; SheetContent is shared, not edited.
- Flagged report: cleared by a verification-only run before new code. Flag rule outranks Jev ranking. Jev 'ask' overridden when the next task needs nothing from Isa.
- Prompts: one task, one editable file (verification excepted); name design/ file, gap row, branch; say no git.
- Checkpoints: full tsc and full app suite, no file changes. Round-scoped modified-file checks only.
- A blocker that came back twice: park.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet: title, +100 g toast, two tile columns, bottom padding via negative margin.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx scales and sums fibre.
- es.json addMenu.addToSlot.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.
- Last full checkpoint R113 green: tsc 0, 65 suites, 824 tests. Since then no test covers recipe totals, the Spanish key or the add.tsx margin.
- R114: tsc 0; eslint clean on add.tsx, new-recipe.tsx, hooks.ts. Jest not run, flagged.
- R115: verification only. tsc 0; hooks.ts related 5 suites / 33 tests green; sheetVariant and tabbar 22 of 22 green; eslint clean. Clears the 'Jest not run' flag. Does not verify row 90, recipe fibre total, or the Spanish key.

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods goes to food tab; 0pt gap on no-inset devices (doc does not say so); row 1445 holds build status.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; Meal chip padding and token; confirm 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Macros: food/detail.tsx and quickAdd log missing as 0 (parked). detail.tsx num() rounds on save.
- Saved foods drop fibre (editSavedFood, saveFood). Recents fibre not displayed. Recipe Total shows 0g fibre when unknown.
- Calories drift in new-recipe editRow and recents.
- Locales: es.json lacks 8 addMenu keys (mealPhotoOrLabel, exactDatabaseMatch, savedGallery, searchFoods, searchPlaceholder, myDishes, quickAdd, quickAddSub); has voice and describeOutLoud, absent from en, usage unchecked. fr.json has no addMenu block (16 keys). Slot default 'Snack' vs design 'Snacks'.
- add.tsx:56 passes the raw lowercased slot; Spanish and French titles show English slot names.
- Test gap: no test names SegmentedField.tsx, quick-add.tsx or new-recipe.tsx; no locale test.
- Jest noise: hooks.ts:56 log, tabbar act() warning. Not blocking.

## Blocked on Isa
- Row 23 one-tap log: route to log-session, or accepted deviation.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing. Global + title: keep 'Add meal' or name a default.
- Quick add confirm 17/22: Button prop, bodyBold change, or accept 17/24.
- Add sheet status label BUILT or PARTIAL. Negative margin: accept, or SheetContent option.
- Last-hour modified-files check: keep, or round-scoped only.
- Device runs: Add sheet (34pt inset; grid at 320pt and 430pt); recipe and fibre; quick add; celebration card.
- Macro types for food detail: decision needed before any type change.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex to shared helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0 (needs optional model field). Saved foods fibre drop.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx.

## Next
1. R116 (this round): verification-only, no file changes. tsc; addMenu key audit for en, es, fr; add.tsx slot-title line; tile grid margin vs SheetContent padding. Clears the flag if it reports cleanly.
2. R117: fr.json full addMenu block, all 16 keys from en.json, one file.
3. R118: es.json 8 missing addMenu keys, one file. Check voice and describeOutLoud usage first.
4. Add sheet slot translation at add.tsx:56.
5. Add sheet icons: SF Symbols to design SVGs, one per round.
6. Checkpoint: full tsc and full app suite, no file changes.
7. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- R83-R87 verification and doc. R88, R102, R113 checkpoints green.
- R89, R99 prompts rejected (no design/ file named), rewritten.
- R106 detail macros parked. R107 Add sheet negative margin.
- R111 es addToSlot. R112, R114, R115 verification runs; hand checks of locales do not clear flags.
- R114 flagged: Jest not run. R115 cleared that point.
- R115 flagged again by automatic check: report looked partly done. R116 is verification-only to deal with it. Jev ranked fr.json first (87%); kept the verification round because the flag rule outranks Jev ranking.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; 71f71ac4 is food.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- hooks.ts related: 5 suites, 33 tests. 'Nine suites, 116' means nine named suites.
- Shell grep is ugrep; use /usr/bin/grep with LC_ALL=C.
- Shared Button in src/components/forms affects all callers; override locally first.
- Add sheet title line moves; grep before citing a line number.
- No tsc or test output written to the repo or /tmp.