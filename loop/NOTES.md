# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding.
- Macros stored unrounded, display rounds. Gym duration logged when above 0.
- Grid 1fr 1fr, 12pt gap. Missing macros are a data model change: parked.
- Add sheet row 90 BUILT at Isa's instruction, verdict PARTIAL MATCH. Negative margin accepted as interim; SheetContent is shared, not edited.
- Slot key snack, value 'Snacks'. Add sheet title lowercases translated slot; unknown slot falls back to 'Add meal'. Accepted R131.
- French and Spanish slot translations are agent translations ('vous' in fr, 'tú' in es).
- voice and describeOutLoud stay in es.json until Isa approves removal.
- Meal delete toast: 'Removed {{slot}}' (design wording). Isa may override. R135.
- Meal delete dialog: design defaults apply for casing and wording until Isa overrides. R137 keys added, R138 wired.
- Flag rule outranks Jev ranking. Jev 'ask' overridden when the next task needs nothing from Isa.
- Prompts: one task, one editable file. Name design/ file and gap row (or state none). No git. Branch loop/design-match only.
- Checkpoints: full tsc and full app suite, no file changes.

## Built (not verified)
- NumberEntryBar (shared) in quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90): title, +100 g toast, tile columns, -space.xl margin at add.tsx:68, SLOT_KEYS in add.tsx.
- Goals restyle. Gym 'How did it go?' chooser. Row 17 steps 1-2 (CelebrationCard). Gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre (hooks.ts). new-recipe.tsx sums fibre.
- Locales: en addMenu 20 keys; es addMenu 22; fr addMenu 20.
- en.json foodLog.mealDeleted = 'Removed {{slot}}' (R135). Read by food.tsx confirmDeleteMeal toast via t(`addMenu.${SLOT_KEYS[slot]}`).
- R137: en.json foodLog gained deleteMealTitle, deleteMealMessage_one, deleteMealMessage_other, deleteMealConfirm.
- R138: food.tsx confirmDeleteMeal dialog reads title, message (count), Cancel (common.cancel) and confirm from those keys. English wording unchanged. Not exercised by any test.
- food.tsx slot keys at :551 and :973 via local SLOT_KEYS at :83. t imported as type TFunction at :18.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification log
- Full checkpoints green: R113, R117, R120, R122, R126, R130, R132 (tsc 0, 65 suites, 824 tests).
- Targeted only, not cleared: R131 add.tsx slot title; R133 food.tsx slot mapping (tsc 0, 30 suites, 510 tests). R134 no edit.
- R135 flagged: tests not run. R136: tsc 0, 30 suites, 510 tests green.
- R137: tsc 0, JSON parse OK, 4 keys present once each. Tests not run by instruction.
- R138: tsc 0, 30 suites, 510 tests green (food subset). Dialog not covered by any test.
- R139: full checkpoint, tsc and full app suite, no file changes. Clears R131 to R138 flags if green. Prompt rejected for not naming a design/ file; rewritten as R140 with design file and gap row stated as none. Sent as the next round.
- Locale hand checks do not clear flags. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open differences
- Add sheet: SF Symbols not SVGs; scan routes split; Search foods goes to food tab; 0pt gap on no-inset devices.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- food.tsx: 'Add to' labels :551, :973 keep capital (design lowercase). Toast :390 uses addSlot.toLowerCase(), no translation match.
- food.tsx slot heading ~:717 and delete flow still show raw slot in places.
- VoiceOver labels ~:538, :768, :769, :793 and heading ~:772 show raw slot.
- foodLog.addedToMeal, foodLog.mealDeleted and the four R137 delete keys missing in es.json and fr.json.
- Hardcoded toasts: SavedMealsList.tsx :59, :63. plan.tsx :85 'Suggested:', :97 'Add ${entry.title}'.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Macros: food detail and quickAdd log missing as 0 (parked). detail.tsx num() rounds on save.
- Saved foods drop fibre. Recents fibre not displayed. Recipe Total shows 0g fibre when unknown.
- Locales: es voice and describeOutLoud unused. fr foodLog has 2 of es keys. fr 'à petit-déjeuner' should be 'au'; es 'Añadir a Desayuno' should be 'Añadir al desayuno'. Native review needed.
- Design mealNow() returns 'Snack'; MEALS uses 'Snacks'. Translated slots invisible while lng is 'en'.
- Long press to delete a meal is not discoverable (ponytail comment above confirmDeleteMeal). Design call open.
- Delete wording: 'Removed Lunch' toast vs 'Lunch deleted' earlier; lowercase question open with Isa.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation.
- Row 17 Calories: formula or accepted deviation. Dash for now.
- Search foods tile routing. Global + title: keep 'Add meal' or name a default.
- Quick add 17/22: Button prop, bodyBold change, or accept 17/24.
- Add sheet: is 0pt gap on no-inset devices acceptable?
- Confirm 'Snacks' as English label.
- Last-hour modified-files check: keep, or round-scoped only.
- Device runs: Add sheet; recipe and fibre; quick add; celebration card; meal delete dialog (singular and plural, one item and several) and wording 'Removed {{slot}}'. Confirm 'Removed Lunch' on device.
- Meal delete: no DESIGN_GAP_ANALYSIS.md row covers it. Decide whether to add a row.
- Macro types for food detail.
- Native review: fr and es addMenu.
- Remove es voice and describeOutLoud.
- Lowercase 'Add to <slot>' and meal delete wording: design defaults apply unless Isa overrides.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex to shared helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); SLOT_KEYS consolidation.
- Recipe fibre saved as 0. Saved foods fibre drop.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx, or the add.tsx slot title. No locale tests. No test for confirmDeleteMeal.

## Next
1. R140 (now): full checkpoint, tsc and full app suite, no file changes. Clears R131 to R138 flags if green. Replaces the rejected R139 prompt.
2. Lowercase 'Add to <slot>' in food.tsx :551 and :973.
3. food.tsx :389 slot lookup, so it finds the translated slot.
4. SavedMealsList.tsx :59 and :63.
5. plan.tsx :85 and :97 (one file).
6. foodLog.addedToMeal, mealDeleted and the R137 delete keys into es.json and fr.json (one file per round).
7. Add sheet icons: SF Symbols to design SVGs, one per round.
8. Consolidate SLOT_KEYS into one shared helper, one file per round.
9. Checkpoint: full tsc and full suite, no file changes.
10. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Prompts rejected: R89, R99, R117, R125 (no design/ file named); R123 (no branch line); R139 (no design/ file named, rewritten as R140 with 'none' stated). All rewritten.
- R134 flagged partly done: split into R135 (en.json) and R136 (wire).
- R135 and R137 flagged: tests not run. R136 and R138 ran targeted suites to clear them.
- R138 flagged by loop check as partly done. Treated as needing a full checkpoint: R139, now R140.
- Jev ask overridden at R120, R124 to R126, R131, R134.
- Open flags: R131, R133 (targeted), R134 (no edit). R140 checkpoint clears them.
- Handovers after R125 and later. Name files fully in prompts.

## Gotchas
- Design text is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; 71f71ac4 is food.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- Shell grep is ugrep; use LC_ALL=C /usr/bin/grep. Grep before citing line numbers.
- Locales: src/lib/i18n/locales/. Check key order against en.json.
- App slot value 'Snacks' (src/lib/mock/data.ts:48), key snack.
- Shared Button in src/components/forms affects all callers; override locally first.
- Handover file: loop/HANDOVER.md.
- i18next plural selection uses Intl.PluralRules, which is untested on Hermes.
- Claude Code report at R136: key path is addMenu.${SLOT_KEYS[slot]}, not a bare slot key.
- Handover summary conflicts with notes: it lists the add.tsx slot title and es/fr key work as in progress, while notes record the slot title as built at R131. R140 checkpoint is the arbiter; Isa verifies on device.