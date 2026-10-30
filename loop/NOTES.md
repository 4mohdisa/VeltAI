# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding.
- Macros stored unrounded, display rounds. Gym duration logged when above 0. Grid 1fr 1fr, 12pt gap.
- Add sheet row 90 BUILT at Isa's instruction (PARTIAL MATCH). Negative margin at add.tsx:68 accepted; SheetContent is shared, not edited.
- Slot key snack = 'Snacks'. Add sheet title lowercases translated slot; unknown slot falls back to 'Add meal'.
- French and Spanish slot translations are agent translations ('vous' fr, 'tú' es).
- voice and describeOutLoud stay in es.json until Isa approves removal.
- Meal delete toast 'Removed {{slot}}' and dialog design defaults for casing and wording until Isa overrides.
- Food log 'Add to Lunch' keeps its capital per Isa's brief; design lowercases. (Standing decision: do not lowercase at food.tsx :551 or :973.)
- No fallback in the delete toast: slot is typed MealSlot.
- SLOT_KEYS duplicated in add.tsx and food.tsx as instructed; share it if a third caller appears.
- Delete button key lives in foodLog; Cancel reuses common.cancel.
- Flag rule outranks Jev ranking. Jev 'ask' overridden when the next task needs nothing from Isa.
- Prompts: one task, one editable file, name design/ file and gap row (or 'none'). No git. Branch loop/design-match only.
- Checkpoints: full tsc and full app suite, no file changes.

## Built (not verified)
- NumberEntryBar shared: quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90): title, +100 g toast, tile columns, SLOT_KEYS in add.tsx.
- Goals restyle; gym 'How did it go?' chooser; row 17 steps 1-2 (CelebrationCard); gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre (hooks.ts); new-recipe.tsx sums fibre.
- Locales: en addMenu 20 keys; es 22; fr 20. en foodLog.mealDeleted, deleteMealTitle, deleteMealMessage_one/_other, deleteMealConfirm.
- food.tsx delete dialog and toast read translated keys; English wording unchanged; no test covers it.
- food.tsx slot heading and VoiceOver strings use translated slot names via local SLOT_KEYS (line 83). confirmDeleteMeal takes t.
- R142: food.tsx 'Add to' VoiceOver labels at 539 and 795 use t('foodLog.addToMeal', { slot }) with the same shape as line 975.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Full checkpoints green: R113, R117, R120, R122, R126, R130, R132, R140 (tsc 0, 65 suites, 824 tests).
- Targeted only: R131, R133, R136, R138, R141, R142 (tsc 0, 30 food suites, 510 tests).
- No test renders the add.tsx title, food.tsx slot heading, MealSectionHeader, delete dialog, toast or the 'Add to' VoiceOver labels. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- R143 (now): food.tsx toast at ~390 uses translated slot name instead of lowercased raw slot.
- food.tsx hint at 771 'Long press to delete everything logged to' hardcoded, needs new key in en, es, fr (one file per round).
- SavedMealsList.tsx :59, :63 hardcoded English toasts. plan.tsx :85 'Suggested:', :97 'Add ${entry.title}'.
- foodLog.addedToMeal, mealDeleted and the deleteMeal keys missing in es.json and fr.json.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Add sheet icons are SF Symbols, not design SVGs. Scan routes split; Search foods goes to food tab.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre; recents fibre not displayed. detail.tsx num() rounds on save.
- Locales: es voice and describeOutLoud unused; fr foodLog has 2 es keys; fr 'à petit-déjeuner' should be 'au'; es 'Añadir a Desayuno' should be 'Añadir al desayuno'. Native review needed.
- Design mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Long-press delete not discoverable (design call open).

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation.
- Row 17 Calories: formula or accepted deviation (dash now).
- Search foods tile routing; global + title default.
- Quick add 17/22 vs 17/24.
- Add sheet 0pt gap on no-inset devices: acceptable?
- Confirm 'Snacks' English label.
- Last-hour modified-files check: keep or round-scoped only.
- Device runs: Add sheet; recipe and fibre; quick add; celebration card; meal delete dialog (singular and plural), 'Removed {{slot}}', and header plus VoiceOver labels.
- Meal delete has no gap row: add one?
- Macro types for food detail (data model change, parked).
- Native review of fr and es addMenu.
- Remove es voice and describeOutLoud.
- Lowercase 'Add to' and delete wording: design defaults apply unless Isa overrides.
- 'Add to Lunch' capitals: standing decision keeps capital; confirm or override.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); SLOT_KEYS consolidation.
- Recipe fibre saved as 0.
- Long-press meal delete discoverability.
- No render tests for food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx, add.tsx title, MealSectionHeader. No locale tests. No confirmDeleteMeal test.

## Next
1. R143 (now): food.tsx toast near line 390 uses translated slot name (single file, no locale key).
2. food.tsx hint at 771: new locale key for 'Long press to delete everything logged to' (en, es, fr, one file per round, en first).
3. SavedMealsList.tsx :59, :63 (needs locale keys if no existing ones fit).
4. plan.tsx :85, :97.
5. es.json then fr.json, one file per round: addedToMeal, mealDeleted, deleteMeal keys.
6. Add sheet icons: SF Symbols to design SVGs, one per round.
7. Consolidate SLOT_KEYS, one file per round.
8. Checkpoint: full tsc and full suite.
9. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Prompts rejected for no design/ file: R89, R99, R117, R125, R139. R123 had no branch line. All rewritten.
- R134 split into R135 and R136. R135, R137 untested at the time. R138 flagged; R140 checkpoint green.
- R141 report flagged as partly done: 539 and 795 'Add to' still hardcoded. Handled in R142, which reported done with no gap row to check against.
- Jev ask overridden at R120, R124, R126, R131, R134.
- Handovers after R125 and R141. Name files fully in prompts.

## Gotchas
- Design is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; decoded copy was at 71f71ac4 (food).
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- Use LC_ALL=C /usr/bin/grep. Shell grep is ugrep. Grep before citing line numbers. Earlier brief line numbers 551/973 were really 552/975.
- Exclude the .snap match when passing grep results to jest.
- Locales: src/lib/i18n/locales/. Check key order against en.json.
- src/lib/i18n/index.ts fixes lng to 'en', so es and fr are not on screen.
- App slot 'Snacks' is in src/lib/mock/data.ts:48, key snack. slot.toLowerCase() finds nothing for it.
- Shared Button in src/components/forms affects all callers: override locally first.
- Handover file: loop/HANDOVER.md. Its summary conflicted with notes; the R140 checkpoint settled it.