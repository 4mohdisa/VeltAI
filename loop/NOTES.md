# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding behaviour stabilised. v1 scope locked; extra ideas go to Parked.
- design/Lume App.html is source of truth. Gap analysis is authoritative.
- 7-day trial, $49.99/yr, $8.99/mo, no card up front.
- Isa r24: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted).
- Isa r39: celebration card approved; row 18 edit cycle dropped (accepted); already-logged routes to the day; Summary card never calls logGymSession() with no args; food detail search shows macros.
- r48: derived gym duration logged when above 0; derived 0 sent as undefined. r49: keep ?? for template estimate. r50: test gate green before any new product task.
- Card variant='elevated' is the repo mapping for the design's white card.
- Session mode state is derived, not set in effects.
- Isa r55: many screens already match. Compare code with design/ before each row; fix only real differences.
- R57: Search foods tile routing to the food tab is a real difference. Dedicated search sheet parked.
- R58: do not change SegmentedField inset globally (11 callers). Quick add gets a separate compact option.
- R59: checkpoint prompts name the design file (reference only) and the repo check scripts.
- R60 checkpoint: tsc green, 65 suites pass, 824 tests. Baseline moved from 823 to 824; extra test unexplained (recount queued).
- Prompts: one task, one editable source file; one-line status edit to DESIGN_GAP_ANALYSIS.md allowed; checks are tsc, eslint and jest on changed files only; doc-only rounds run no tests; every prompt states the branch and no git.
- R62: a flagged report must be cleared (verification run, no edits) before any new build task.
- R63: calories on the celebration card show a dash (no body weight on that screen; no fabricated data).

## Done (BUILT, not verified)
- Shared NumberEntryBar: food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search routes to food tab with focus=search; + disc logs 100 g with toast.
- Goals: borderless input, hints, elevated card.
- Gym 'How did it go?' chooser; session modes adjust / ticklist / picker.
- Row 19: already-logged routes to /gym/session.
- Row 17 steps 1-2: CelebrationCard.tsx opens from save() as a native Modal replacing the toast. Step 3 (device run) not done.
- Gym duration honesty (r48-49); gymDurationHonesty.test.ts.
- Food data path steps 1-3: detailSubject macros, food.tsx pick passes macros, detail.tsx search reads subject macros; foodDetail.test.ts 31/31.
- Quick add toast (R61): reads '{kcal} added to {meal}' via formatCalories. Hardcoded English, not in en.json.
- Quick add MEAL caption (R61): uppercase, 13/16 semibold, 1.1 tracking, secondary label grey, 8pt gap above control. Caption sits in quick-add.tsx, not in SegmentedField.
- R62 verification: tsc exit 0, eslint exit 0 on quick-add.tsx, findRelatedTests found no tests. Device check still open (owner item).

## Re-check findings (open)
- Add sheet: title not meal-named; tile gap ~14pt not 12pt; SF Symbols not design SVGs.
- Quick add: Meal control 13/17 semibold, 3pt padding; detent 0.6 not fit-content; no blinking caret; confirm pill 56 vs 52pt, 17/24 vs 17/22; offline toast does not name the meal (no design equivalent).

## In progress
- R63: Quick add detent 0.6 to fit-content in src/app/food/quick-add.tsx (one value, reuse repo's fit-content sheet form; stop without edit if none exists).
- Compact segmented option for Quick add Meal: (a) check 11 inset callers vs design (doc-only); (b) add compact option to SegmentedField; (c) apply in quick-add.tsx.

## Blocked on Isa
- Row 23 one-tap log: A = route onLog to log-session (index.tsx, oneTapGymLog.test.ts, V16 note); B = accepted deviation, doc-only. Asked r43, unanswered. Do not act.
- Row 17 Calories: design needs profile weight (5.5 MET). Dash is shown for now (R63). Formula or accepted deviation? Do not invent a number.
- Row 17 celebration Calories column: what it shows (raised r53).
- Search foods tile routing accepted or not (raised r57; default is accepted, Isa to confirm).
- Inset callers: variant change or compact option (R58).
- Device check (owner): Quick add MEAL caption, new toast, sheet fit at detent; celebration card modal flow on a device (row 17 step 3). Not asked; for Isa's own UI check.

## Next tasks
1. Quick add detent 0.6 to fit-content in quick-add.tsx (R63, in progress).
2. Quick add confirm pill 56pt to 52pt, 17/24 to 17/22, in quick-add.tsx.
3. Recents: hooks.ts useFoodSearch drops macros; carry protein, carbs, fat per 100 g.
4. Compact segmented option (see In progress).
5. Quick add Meal control 13/17 semibold and 3pt padding, via the compact option.
6. Quick add blinking caret (check parked item first).
7. quickAdd and detail.tsx log missing macros as 0; decide display or park.
8. Add sheet title: 'Add to lunch' when opened from a meal.
9. detailSubject.ts lines 25-27: stale comment.
10. gymDurationHonesty.test.ts: rename stale 'Not set' title; cover 0-or-less case.
11. Row 17: CelebrationCard footnote 'Push logged - streak extended'; Time shows a dash on empty plan; card can show '0 min'.
12. Row 23 per Isa's answer.
13. i18n hardcoded toast copy in index.tsx, log-session.tsx and quick-add.tsx.
14. Food Search sheet (pill input, thumbnails, row metrics): plan first.
15. Doc-only: status sync for /gym/session summary and row 18; Quick add row wording; stale detail sections for Quick add and Add sheet in DESIGN_GAP_ANALYSIS.md (around lines 978, 1048, 1419).
16. Doc-only recount: list tests added since baseline to find the 824th test.
17. Checkpoint (tsc, full jest) when the loop note asks.
18. Remaining gym rows: Isa approval per item.
19. If no non-gym one-file task remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order and per-set remove; cardio ParameterForm inputs; template editor and dock; kg/lb field; volume shows kg only.
- Row 17: rest-day and /gym/session exits show no card; pop-in omitted; ring vs flame; possible overflow on device; modal flow not run on a device.
- Global SegmentedField inset restyle (11 callers) until each caller is checked.
- mixHex in GymCalendar.tsx to a shared helper. App-only Stepper/SliderField entries stay.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- es/fr locales lack new keys. CONFLICT_KEYWORDS not type-linked. Unused addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods.
- router.setParams rewrites history. Dev catalog has calories only, so macro fixes are a no-op in dev.
- Small a11y and copy: blinking caret; Math.round in draft(); Goals accessibilityState; English hints in food.tsx near 761 and 844; labels at add.tsx:70 and log-session.tsx:155; /gym/session shows planned not logged rows.
- No render tests on food.tsx, detail.tsx, quick-add.tsx or log-session.tsx (harness lacks SafeAreaProvider).
- Estimated gym duration is logged; backend derives kcal. Revisit if only measured durations should count.
- Adjust and ticklist arrive checked, so 'Save progress?' fires on an untouched back-out.
- Stale comments in src/app/_layout.tsx for add and quick sheets.
- Source-text tests in gymDurationHonesty.test.ts and foodDetail.test.ts do not run the behaviour they name.
- Add sheet 'Add meal' title from the global + (if not fixed by next task 8).

## Loop notes
- R1-39: early rejections; data path, i18n and (a)-(e) handled.
- R43: asked Isa on row 23, unanswered. R45: rejected (branch rule).
- R50: gate green. R53-54: food step 3 done; foodDetail 31/31.
- R55: Isa asked for re-check before fixing. R56: re-check, Add sheet and Quick add both DIFFERENT.
- R57: flagged (checks not run); inset change parked.
- R58: detailSubject comment chosen; flagged for checks not run.
- R59: rejected (design file not named); rewritten as no-edit checkpoint.
- R60: checkpoint green at 824 tests. Flagged as partly done; resolved by the checkpoint result.
- R61: MEAL caption built; tsc and eslint green, jest not run. Flagged.
- R62: verification-only round, tsc and eslint green, no related tests. Flag cleared.
- R63: handover occurred before this round. Claude Code knows only the handover summary; prompt names files fully.
- Gotchas kept: adjust/ticklist dirty guard, dev catalog calories only, session.tsx mode derived not set in effects. Design text lives in the __bundler payload; decode the manifest (gzip+base64) rather than grep. Source-reading tests are invisible to --findRelatedTests; grep src/__tests__. zsh does not word-split unquoted variables.