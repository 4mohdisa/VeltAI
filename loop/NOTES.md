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
- R117 checkpoint kept over Jev's fr.json pick (82%). Last full suite was R113; R117 re-ran it green.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet: title, +100 g toast, two tile columns, bottom padding via negative margin (add.tsx:68, -space.xl, cancels SheetContent 20pt).
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx scales and sums fibre.
- es.json addMenu.addToSlot (R111). Re-checked in R119 report: value 'Añadir a {{slot}}', unchanged.
- R118: fr.json full addMenu block, 16 keys from en.json, placed before foodLog. Wording is the agent's own translation (no French in design). Needs French review.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification log
- R113 full checkpoint green: tsc 0, 65 suites, 824 tests.
- R114: tsc 0; eslint clean on add.tsx, new-recipe.tsx, hooks.ts. Jest not run, flagged.
- R115: verification only. tsc 0; hooks.ts related 5 suites / 33 tests green; sheetVariant and tabbar 22 of 22 green. Cleared R114 flag. Does not verify row 90, recipe fibre total, or the Spanish key.
- R116: verification only. tsc 0. Locale audit done. Margin arithmetic: -20pt + 20pt = 0pt, leaving only the device inset (34pt on 34pt-inset, 0pt on no-inset). Arithmetic only, not measured. Cleared R115 flag.
- R117: full checkpoint, no file changes. tsc 0; full app suite 65/65 suites, 824/824 tests, 4/4 snapshots, identical to R113. Green.
- R118: fr.json addMenu added. Flagged by automatic check (type check or tests not run).
- R119: verification only. tsc 0. fr.json and en.json parse; fr addMenu key order matches en (16 keys); no empty or copied-English values. No locale test exists. Jest not run. Flagged again by automatic check.
- R120: verification only, tsc plus full app suite, no file changes. Clean: tsc 0; 65/65 suites; 824/824 tests; 4 snapshots. Both fr.json and es.json parse. Cleared the R118/R119 Jest flag. Row 76, 86, 90 remain BUILT, not verified. No test reads locale files, so the French text is not verified.
- R121 (pending): es.json 8 missing addMenu keys, one file. Check voice and describeOutLoud usage (report only).

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods goes to food tab; 0pt gap on no-inset devices (doc does not say so); row 1445 holds build status.
- Add sheet slot: add.tsx:56 passes raw lowercased slot; es and fr titles show English slot names (e.g. 'Añadir a breakfast', 'Ajouter à breakfast'). Check whether translated slot names exist first.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; Meal chip padding and token; confirm 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Macros: food/detail.tsx and quickAdd log missing as 0 (parked). detail.tsx num() rounds on save.
- Saved foods drop fibre (editSavedFood, saveFood). Recents fibre not displayed. Recipe Total shows 0g fibre when unknown.
- Calories drift in new-recipe editRow and recents.
- Locales: es.json lacks 8 addMenu keys (mealPhotoOrLabel, exactDatabaseMatch, savedGallery, searchFoods, searchPlaceholder, myDishes, quickAdd, quickAddSub); has voice and describeOutLoud, absent from en, usage being checked in R121. fr.json has 16 addMenu keys. Slot default 'Snack' vs design 'Snacks'. foodLog in fr.json has only 2 of es's keys; other fr blocks not compared to en.
- Test gap: no test names SegmentedField.tsx, quick-add.tsx or new-recipe.tsx; no locale test.
- Jest noise: hooks.ts:56 log, tabbar act() warning. Not blocking.

## Blocked on Isa
- Row 23 one-tap log: route to log-session, or accepted deviation.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing. Global + title: keep 'Add meal' or name a default.
- Quick add confirm 17/22: Button prop, bodyBold change, or accept 17/24.
- Add sheet status label BUILT or PARTIAL. Negative margin: accept, or SheetContent option.
- Add sheet no-inset gap: is 0pt acceptable on no-inset devices?
- Last-hour modified-files check: keep, or round-scoped only.
- Device runs: Add sheet (34pt inset; grid at 320pt and 430pt); recipe and fibre; quick add; celebration card.
- Macro types for food detail: decision needed before any type change.
- French review of fr.json addMenu wording (oneTapReadd, scanPackage, exactDatabaseMatch); tile wrap at 320pt.
- Spanish review of es.json addMenu keys added in R121 (agent translation).

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex to shared helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0 (needs optional model field). Saved foods fibre drop.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx.
- Locale test coverage (no test reads fr.json or es.json).

## Next
1. R121 (this round): es.json 8 missing addMenu keys, one file. Check voice and describeOutLoud usage (report only). tsc once, no full suite.
2. Add sheet slot translation at add.tsx:56. Check whether translated slot names exist first.
3. Decide on voice and describeOutLoud keys (remove if unused, as its own task).
4. Add sheet icons: SF Symbols to design SVGs, one per round.
5. Checkpoint: full tsc and full app suite, no file changes.
6. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- R83-R87 verification and doc. R88, R102, R113, R117 checkpoints green. R120 full-suite verification green.
- R89, R99, R117 prompts rejected (no design/ file named), rewritten.
- R106 detail macros parked. R107 Add sheet negative margin.
- R111 es addToSlot. R112, R114, R115, R116, R119 verification runs; hand checks of locales do not clear flags.
- R114 flagged: Jest not run. R115 cleared that point. R115 flagged again by automatic check; R116 cleared it.
- R118 fr.json addMenu block (Jev 95%, run). Flagged by automatic check. R119 flagged again; R120 full-suite run cleared it.
- Jev ask 39% at R120 overridden: next task needs nothing from Isa.
- R121: es.json addMenu keys (Jev run 77%).

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; 71f71ac4 is food.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- hooks.ts related: 5 suites, 33 tests. 'Nine suites, 116' means nine named suites.
- Shell grep is ugrep; use /usr/bin/grep with LC_ALL=C.
- Shared Button in src/components/forms affects all callers; override locally first.
- Add sheet title line moves; grep before citing a line number.
- No tsc or test output written to the repo or /tmp.
- Handover file loop/HANDOVER.md: read after a handover; loop/NOTES.md lines 39, 42, 54 need re-reading.
- Locale files: src/lib/i18n/locales/en.json, es.json, fr.json (not src/locales/). Check key order against en.json before editing.