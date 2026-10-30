# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding behaviour stabilised. v1 scope locked; extra ideas go to Parked.
- design/Lume App.html is the source of truth. The gap analysis is authoritative.
- 7-day trial, $49.99/yr, $8.99/mo, no card up front.
- Isa r24: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted deviations).
- Isa r39: celebration card approved; row 18 edit cycle dropped (accepted); already-logged routes to the day; Summary card must not call logGymSession() with no args; food detail search shows macros.
- r48: derived gym duration logged when above 0; derived 0 sent as undefined. r49: keep ?? for template estimate. r50: test gate green before any new product task.
- Card variant='elevated' is the repo mapping for the design's white card.
- Session mode state is derived, not set in effects (react-hooks/set-state-in-effect).
- Prompts: one task, one editable source file; one-line status edit to DESIGN_GAP_ANALYSIS.md allowed. Checks: tsc, eslint, jest on changed files only. Full suite at checkpoints only. Doc-only rounds run no tests.
- Isa Telegram r55: many screens already match the design (built after the gap analysis of 14 Sep). Do not rebuild. Before each row, compare current code with design/ HTML and list only real differences. Fix only those. If a row already matches, mark built and move on. Re-check a few rows per round first, then fix what is really different.
- R56: loop note said prompt rejected for missing loop/design-match branch rule. Fixed: every prompt now states the branch and no git.

## Done (BUILT, not verified)
- Shared NumberEntryBar: food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search routes to food tab with focus=search; + disc logs 100 g with toast.
- Goals: borderless input, hints, elevated card. Design hints wired (setByLume, tapToEdit, savedAsYouType).
- Gym 'How did it go?' chooser; session modes adjust / ticklist / picker.
- Row 19: already-logged routes to /gym/session.
- Row 17 steps 1-2: CelebrationCard.tsx opens from save() over color.overlay.
- Gym duration honesty (r48-49); gymDurationHonesty.test.ts passing.
- sheetVariant.test.ts fixed (r50); gate green.
- Food data path steps 1-3 done: detailSubject.ts macro fields; food.tsx pick() passes macros; detail.tsx search branch reads subject macros.
- foodDetail.test.ts: 'the search branch shows macros from the subject' passing (r54, 31/31).

## In progress
- R56: doc-only re-check of Food Add sheet and Quick add rows against design/ (Isa r55). Edit DESIGN_GAP_ANALYSIS.md only.

## Blocked on Isa
- Row 23 (Summary one-tap log). A: route onLog to log-session; edit index.tsx, oneTapGymLog.test.ts and V16 note. B: accepted deviation, doc-only. Asked r43, unanswered. Do not act.
- Row 17 Calories: design needs profile weight (5.5 MET). Shows a dash. Add the formula or accept the dash. Do not invent a number.
- Row 17 Calories column on the celebration card: Isa still to decide what it shows (raised r53).
- Not yet asked: template estimate 0 with planMinutes above 0 logs no duration under ??. Ask only if still open later.

## Next tasks
1. Re-check pass (Isa r55): a few gap rows per round, doc-only. Mark built where they match; note the one real difference where they do not. Done so far: Add sheet and Quick add (R56, pending result). Continue until all 41 rows are re-checked.
2. Recents: src/lib/data/hooks.ts useFoodSearch builds { name, kcalPer100 } only, so re-picking a recent logs 0 macros. Carry protein, carbs, fat per 100 g.
3. Stale comment in src/lib/food/detailSubject.ts lines 25-27 still says the sheet shows energy only. Fix to match behaviour.
4. quickAdd and detail.tsx log a missing macro as 0; unknown looks like zero. Decide display or leave as parked.
5. Fix only real differences found by the re-check pass, one row per round.
6. gymDurationHonesty.test.ts: rename stale 'Not set' title; cover the 0-or-less case.
7. Row 17 step 3: footnote 'Push logged - streak extended' on CelebrationCard.tsx.
8. Row 17: Time shows 0 min on an empty plan; show a dash like Calories.
9. Row 23 per Isa's answer.
10. i18n hardcoded toast copy in index.tsx and log-session.tsx.
11. Doc-only status sync, one row each: /gym/session summary, row 18 (Add sheet and Quick add covered by item 1).
12. Checkpoint (full tsc and jest, baseline 65 suites / 823 tests) when the loop note asks.
13. Food Search sheet (pill input, thumbnails, row metrics, no chips): needs a plan first.
14. Remaining gym rows: Isa approval per item.
15. If no non-gym one-file task remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order and per-set remove; cardio ParameterForm inputs; template editor and dock; kg/lb field; volume shows kg only.
- Row 17: rest-day and /gym/session exits show no card; uppercase labels; spacing and pill differences; ring vs flame; pop-in omitted; possible overflow on device; modal flow not yet run on a device.
- mixHex in GymCalendar.tsx to a shared helper. App-only Stepper/SliderField entries stay.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- es/fr locales lack new keys. CONFLICT_KEYWORDS not type-linked. Unused addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods.
- router.setParams rewrites history. Dev catalog has calories only, so macro fixes are a no-op in dev.
- Small a11y and copy items: blinking caret; Math.round in draft(); Goals accessibilityState; English hints in food.tsx near 761 and 844; labels at add.tsx:70 and log-session.tsx:155; /gym/session shows planned not logged rows.
- No render tests on food.tsx, detail.tsx or log-session.tsx (test harness lacks SafeAreaProvider).
- Estimated gym duration is logged and the backend derives kcal. Revisit if only measured durations should count.
- Adjust and ticklist arrive checked, so 'Save progress?' fires on an untouched back-out.
- Cardio Distance km kept; food search chips skipped (Isa r24).

## Loop notes
- R1-39: early rejections; data path, i18n and (a)-(e) handled.
- R43: asked Isa on row 23; unanswered. R45: prompt rejected (missing branch rule).
- R50: gate green. R51: food step 2 chosen.
- R52: last report flagged (jest not run, no changed files). R53 prompt runs tsc, eslint and jest on changed files. Step 3 chosen.
- R53 report: step 3 was already done, no edits. foodDetail.test.ts failing on macros={false}.
- R54: test-gate fix done (31/31, tsc and eslint exit 0). Recents fix deferred.
- R55: Isa Telegram reply received (re-check before fixing). Re-check pass chosen over recents. Jev run 84%. Doc-only prompt.
- R56: prompt rejected earlier for missing branch rule; rewritten with branch rule. Re-check of Add sheet and Quick add chosen (Jev run 76%). Doc-only, no tests.
- Handover at tree 1b8ab30 recorded; many screens already match design per Isa, so verify before building.