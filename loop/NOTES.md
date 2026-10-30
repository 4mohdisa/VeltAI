# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio stays Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding.
- Macros stored unrounded, display rounds; calories Math.round. Recents missing macros stay undefined.
- Gym duration logged when above 0, else undefined.
- Grid 1fr 1fr, 12pt gap.
- Missing macros are a data model change: parked, not asked.
- Recipe builder has no design counterpart.
- Add sheet row 90 BUILT at Isa's instruction; section verdict PARTIAL MATCH. Negative margin accepted as interim; SheetContent is shared, not edited.
- Flag rule outranks Jev ranking. Jev 'ask' overridden when the next task needs nothing from Isa.
- Prompts: one task, one editable file (verification excepted); name design/ file and gap row; say no git; state branch loop/design-match only.
- Checkpoints: full tsc and full app suite, no file changes.
- A blocker that came back twice: park.
- Slot labels: the loop adds the keys itself; design hMeal wording decides Snack vs Snacks (key name stays snack). Not asked of Isa.
- Key name snack, value 'Snacks' (from design MEALS list). Keys sit in addMenu.
- French and Spanish slot translations are agent translations; 'vous' in fr, 'tú' in es.
- voice and describeOutLoud stay in es.json until Isa approves removal.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90): title, +100 g toast, tile columns, -space.xl margin at add.tsx:68.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx sums fibre.
- es.json addMenu: 18 keys plus addToSlot (R121, agent translation). fr.json addMenu: 16 keys (R118, agent translation).
- en.json addMenu: breakfast, lunch, dinner, snack ('Snacks') added (R125). No code reads them yet.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification log
- R113, R117 full checkpoints green: tsc 0, 65 suites, 824 tests, 4 snapshots.
- R120 full suite green; cleared R118/R119 flag.
- R121: es.json edit only, tsc run, tests not run. Flagged.
- R122: verification only. tsc 0, full app suite 65 suites, 824 tests, 4 snapshots green. Cleared R121 flag.
- R123: blocked. No slot label keys existed. No edit made.
- R124: Next 1 (es.json unused keys) not confirmed done; re-check before removing anything.
- R125: en.json addMenu four keys added. tsc 0, exit 0. Tests not run. Flagged by automatic check after handover.
- R126: verification only. tsc 0 errors. Full app suite 65/65 suites, 824/824 tests, 4/4 snapshots. en.json parses, addMenu 20 keys, four slot keys present once each. es.json parses, addMenu 18 keys. fr.json parses, addMenu 16 keys. Cleared R125 flag. No file changes.
- Hand checks of locales do not clear flags alone. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods goes to food tab; 0pt gap on no-inset devices (doc silent); row 1445 holds build status.
- Add sheet slot: add.tsx:56 passes raw lowercased slot; 'Snacks' lowercased gives 'snacks', which has no key (needs explicit mapping to snack). es and fr titles show English slot names until keys are added.
- Food log: food.tsx:543 and :965 pass raw slot into foodLog.addToMeal (same English-slot problem in es and fr).
- Design inconsistency: design mealNow() returns singular 'Snack' for scans; MEALS uses 'Snacks'.
- Hardcoded English toasts: food.tsx:717 (`${slot} deleted.`), SavedMealsList.tsx:59 and :63.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; Meal chip token; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Macros: food detail and quickAdd log missing as 0 (parked). detail.tsx num() rounds on save.
- Saved foods drop fibre. Recents fibre not displayed. Recipe Total shows 0g fibre when unknown.
- Calories drift in new-recipe editRow and recents.
- Locales: es.json has unused voice and describeOutLoud (Next 6). fr.json foodLog has 2 of es's keys; other fr blocks not compared to en. Slot default 'Snack' vs design 'Snacks'. Key counts differ across locales (en 20, es 18, fr 16) until slot keys are added to es and fr.
- Lowercased translated slots may read oddly (French 'à petit-déjeuner' should be 'au'). Native review needed.

## Blocked on Isa
- Row 23 one-tap log: route to log-session, or accepted deviation.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing. Global + title: keep 'Add meal' or name a default.
- Quick add confirm 17/22: Button prop, bodyBold change, or accept 17/24.
- Add sheet status BUILT or PARTIAL. Negative margin: accept or SheetContent option. Is 0pt acceptable on no-inset devices?
- Confirm 'Snacks' as English label (design mealNow() says 'Snack').
- Last-hour modified-files check: keep, or round-scoped only.
- Device runs: Add sheet (34pt inset; grid at 320pt and 430pt); recipe and fibre; quick add; celebration card.
- Macro types for food detail: decision before any type change.
- French review of fr.json addMenu (oneTapReadd, scanPackage, exactDatabaseMatch); tile wrap at 320pt.
- Spanish review of es.json addMenu (quickAdd, searchPlaceholder, exactDatabaseMatch wrap at 320pt).

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex to shared helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0 (needs optional model field). Saved foods fibre drop.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx. No locale tests.

## Next
1. (done R125) en.json breakfast, lunch, dinner, snack added. Verified as parse-only in R126.
2. (done R126) Verification: tsc, full app suite, locale parse. Green.
3. (R127, in progress) Add breakfast, lunch, dinner, snack to es.json addMenu only, same order as en.json. Values: Desayuno, Almuerzo, Cena, Snacks.
4. Add the same four keys to fr.json only, same key order as en.json.
5. Then add.tsx:56 maps 'Snacks' to key snack explicitly and uses the keys; food.tsx:543 and :965 get the same mapping.
6. Remove unused voice and describeOutLoud from es.json (grep first; confirm first).
7. Hardcoded English toasts: food.tsx:717, SavedMealsList.tsx:59 and :63 (one file per round).
8. Add sheet icons: SF Symbols to design SVGs, one per round.
9. Checkpoint: full tsc and full suite, no file changes.
10. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- R89, R99, R117 prompts rejected (no design/ file named); rewritten.
- R123 prompt rejected (no explicit loop/design-match branch line); rewritten with branch rule and no-git rule.
- R125 prompt rejected (no design/ file named); rewritten to name design/Lume App.html and row 90.
- R123 reported BLOCKED: slot keys missing in all three locales. Recast as Next 3-4.
- R106 detail macros parked. R107 negative margin. R111 es addToSlot.
- R114, R119, R121, R125 flagged by automatic check; R125 flag cleared by R126 verification.
- Handover occurred after R125. Claude Code knows only the handover summary: name files fully.
- Jev ask overridden at R120, R124, R125, R126 (nothing needs Isa).
- R127: Jev run 98%, chose es.json task. Jev and manager agree.

## Gotchas
- Design text is in bundler payload (gzip+base64). /tmp/lume-design may vanish; 71f71ac4 is food.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- hooks.ts related: 5 suites, 33 tests. 'Nine suites, 116' = nine named suites.
- Shell grep is ugrep; use /usr/bin/grep with LC_ALL=C.
- Shared Button in src/components/forms affects all callers; override locally first.
- Grep before citing a line number. No tsc or test output written to repo or /tmp.
- Locale files: src/lib/i18n/locales/ (not src/locales/). Check key order against en.json before editing.
- App slot value is 'Snacks' (src/lib/mock/data.ts:48) but key is snack.
- Handover file: loop/HANDOVER.md.
- Handover summary says es addMenu has addToSlot plus 8 missing keys; R126 counted 18. Verify the count before the next es edit.