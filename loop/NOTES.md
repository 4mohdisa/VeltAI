# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio stays Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding.
- Macros stored unrounded, display rounds; calories Math.round. Recents missing macros stay undefined. Gym duration logged when above 0, else undefined.
- Grid 1fr 1fr, 12pt gap. Recipe builder has no design counterpart. Missing macros are a data model change: parked.
- Add sheet row 90 BUILT at Isa's instruction; verdict PARTIAL MATCH. Negative margin accepted as interim; SheetContent is shared, not edited.
- Flag rule outranks Jev ranking. Jev 'ask' overridden when the next task needs nothing from Isa.
- Prompts: one task, one editable file (verification excepted); name design/ file and gap row; no git; branch loop/design-match only.
- Checkpoints: full tsc and full app suite, no file changes. A blocker that came back twice: park.
- Slots: key snack, value 'Snacks' (design MEALS list). Keys sit in addMenu. Not asked of Isa.
- French and Spanish slot translations are agent translations: 'vous' in fr, 'tú' in es.
- voice and describeOutLoud stay in es.json until Isa approves removal.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90): title, +100 g toast, tile columns, -space.xl margin at add.tsx:68.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx sums fibre.
- Locales: en.json addMenu 20 keys (R125). es.json addMenu 22 keys (R127, verified R128, agent translations). fr.json addMenu 16 keys (R118). No code reads the four slot keys yet.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification log
- Full checkpoints green: R113, R117, R120, R122, R126 (tsc 0, 65 suites, 824 tests, 4 snapshots).
- R128 verification green: tsc 0, 65 suites, 824 tests, 4 snapshots; es.json parses, addMenu 22 keys.
- Flags: R121, R125, R127 had tests not run. R127 es.json edit is cleared by R128 verification.
- Locale hand checks do not clear flags alone. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods goes to food tab; 0pt gap on no-inset devices.
- Slot mapping: add.tsx:56 and food.tsx:543, :965 pass lowercased slot; 'Snacks' gives 'snacks', which has no key. es and fr titles show English until wired.
- Design: mealNow() returns 'Snack' for scans; MEALS uses 'Snacks'.
- Hardcoded English toasts: food.tsx:717, SavedMealsList.tsx:59 and :63.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Macros: food detail and quickAdd log missing as 0 (parked). detail.tsx num() rounds on save.
- Saved foods drop fibre. Recents fibre not displayed. Recipe Total shows 0g fibre when unknown. Calories drift in new-recipe editRow and recents.
- Locales: es.json unused voice and describeOutLoud. fr.json foodLog has 2 of es's keys. Translated slots read oddly: fr 'à petit-déjeuner' should be 'au'; es 'Añadir a Desayuno' should be 'Añadir al desayuno'. Fix likely needs full-phrase strings. Native review needed.

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
- Native review: fr addMenu (oneTapReadd, scanPackage, exactDatabaseMatch); es addMenu (quickAdd, searchPlaceholder, exactDatabaseMatch wrap at 320pt).

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex to shared helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0 (needs optional model field). Saved foods fibre drop.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx. No locale tests.

## Next
1. (R129, now) Add breakfast, lunch, dinner, snack to fr.json addMenu only, in en.json positions. Values: Petit-déjeuner, Déjeuner, Dîner, Snacks. Confirm fr addMenu is 16 keys first; if not, report and stop the edit. Check: JSON parses, 20 keys, key set equals en.json.
2. add.tsx:56 maps 'Snacks' to key snack explicitly and uses the keys; food.tsx:543 and :965 same mapping. One file per round.
3. Remove unused voice and describeOutLoud from es.json after grep confirms no reads.
4. Hardcoded English toasts: food.tsx:717, then SavedMealsList.tsx:59 and :63 (one file per round).
5. Add sheet icons: SF Symbols to design SVGs, one per round.
6. Checkpoint: full tsc and suite, no file changes.
7. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Prompts rejected: R89, R99, R117, R125 (no design/ file named); R123 (no branch line). All rewritten.
- R123 BLOCKED on missing slot keys; recast as Next 2 and 3.
- Flags: R114, R119, R121, R125, R127. Cleared by R122 and R126 verification.
- Handover after R125. Claude Code knows only the summary: name files fully.
- Jev ask overridden at R120, R124 to R126 (nothing needs Isa).
- R128 verification clean, no flags. Handover summary read at R129.

## Gotchas
- Design text is in bundler payload (gzip+base64). /tmp/lume-design may vanish; 71f71ac4 is food.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- Shell grep is ugrep; use LC_ALL=C /usr/bin/grep. Grep before citing line numbers.
- Locales: src/lib/i18n/locales/. Check key order against en.json.
- App slot value 'Snacks' (src/lib/mock/data.ts:48), key snack.
- Shared Button in src/components/forms affects all callers; override locally first.
- Handover file: loop/HANDOVER.md.