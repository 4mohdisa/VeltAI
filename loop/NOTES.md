# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0.
- Add sheet row 90 BUILT. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'.
- 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender agreement.
- Plan file is src/app/dashboard/plan.tsx.
- fr plan, fr savedMeals, fr gymLog and fr goals values are manager-written, pending native review.
- es savedMeals.emptyMessage translated from en (R192, Isa may override).
- fr savedMeals keeps U+00A0 and U+2019 (R194). ASCII check waived for that group.
- Locale order en, es, fr, one file per round.
- Flagged reports are cleared by a verification round before a new build task.
- savedMeals is its own group after foodLog. plan group sits last in en.json and es.json. gymLog sits between savedMeals and plan in fr. gymLog sits between savedMeals and plan in es.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and the gap row or 'none'.
- Full suite may run in a verification round when the flag says tests were not run.
- Checkpoint is run as a read-only verification round (no file changes).

## Built (not verified)
- NumberEntryBar shared: quick add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90). Gym chooser. Goals restyle. CelebrationCard (row 17 steps 1-2). Gym duration.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre. Recipe fibre sum.
- food.tsx: slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- savedMeals keys (all three locales): logged, logFailed, lastLoggedToday, lastLoggedYesterday, lastLoggedDaysAgo_one/_other, neverLogged, emptyTitle, emptyMessage, itemCount_one/_other, logNow.
- SavedMealsList.tsx: lastLoggedLabel takes t. Empty state, item count and Log now use t().
- plan group (all three locales): suggested, addTitle, title, emptyTitle, emptyMessage. plan.tsx uses them.
- fr goals group (R195, 20 keys). fr goals.setByLume fixed R200. Key match verified R196, R199.
- es goals: setByLume, tapToEdit, savedAsYouType (R198). 20 keys.
- fr gymLog group (R203): 21 keys, same order as en.json, placed between savedMeals and plan. Own translation, needs native review. Not on screen (lng fixed to en).
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last green checkpoint: R204 (read-only): tsc 0, JSON parse ok for en, es, fr, 65/65 suites, 824/824 tests, 4/4 snapshots. gymLog key match en vs fr.
- R199 (read-only): tsc 0, JSON parse ok for en, es, fr, 65 suites, 824 tests, 4 snapshots.
- R201: read-only verification green: tsc 0, JSON ok, 65/65 suites, 824/824 tests, 4/4 snapshots.
- R203 (fr gymLog): tsc exit 0, fr.json parses, 21 keys match en.json. Jest NOT run. Flagged by automatic check. Cleared by R204.
- R204: read-only verification round, green. Clears the R203 flag.
- R185, R187, R189, R191, R193, R195, R200 flagged, each cleared by the next verification round.
- R197: checkpoint prompt rejected (no design file named). Checkpoint run in R199.
- R202: fr gymLog prompt rejected (no branch rule). Rewritten as R203.
- R205: es gymLog ordered. Jest NOT run in this round (locale only). Expect a flag; clear it with the next verification round.
- Unverified: all new strings, add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts and states, plan group and screen, lastLoggedLabel, fr goals, es goals, fr gymLog, es gymLog. No test reads locale files or covers SavedMealsList or plan.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R205: es.json gymLog group (21 keys, same order as en.json, between savedMeals and plan). Ordered.
2. Next verification round: tsc, JSON parse x3, full suite, gymLog key comparison for es and fr. Clears the R205 flag.
3. fr.json dashboard, nutrition, settings.scanAccuracy. One group per round. fr goals uses straight apostrophes; align later with native review.
4. Consolidate SLOT_KEYS (add.tsx, food.tsx).
5. Fix lastLoggedDaysAgo_one: unreachable because days === 1 returns the yesterday string.
6. 'Why this plan' hardcoded at src/app/dashboard/plan.tsx:120; move to plan keys.
7. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
8. plan.addTitle display label. entry.title stays English for the route param at plan.tsx:101.
9. Add sheet icons to design SVGs.
10. Remaining gap rows, most rows cleared per task first.
11. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- French streak label: celebration.streak 'jours d’affilée' gives '1 jours'. Needs a count-based key, a log-session.tsx change and matching en and es edits. Not a single-locale round.
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0. Saved foods drop fibre. detail.tsx num() rounds on save. Food tab render test (needs new suite).
- Long-press meal delete not discoverable. mealNow() returns 'Snack' while MEALS uses 'Snacks'.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration, delete dialog, VoiceOver, toasts, saved meal states and labels, saved meals empty state, item counts and Log now, plan Suggested and Add label, plan title and empty state, goals restyle, gymLog strings.
- Native review fr: all new savedMeals, plan, goals and gymLog strings. Typography: goals uses straight apostrophes, savedMeals and gymLog use U+00A0 and U+2019. One word for logging ('enregistrer' vs 'ajout'). Gender agreement. goals: setOwn, setByLume, aiHint. differentWeights ('Charges différentes').
- Native review es: new plan, savedMeals, goals and gymLog strings, including setByLume, tapToEdit, savedAsYouType. 'Puede que no coincida', addedToMeal word order, 'elemento', masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin on device.
- Override available: es emptyMessage wording.

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'; es and fr never show on screen.
- entry.title is English in plan.addTitle under es and fr. Keep it English for the route param.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep all output inside the repo. No /tmp.
- Verification rounds keep being requested after rounds that skip Jest, so the flag may refire.
- Design file has no plan empty-state or saved-meal empty-state wording; English values are the old app text.
- Prompts with no design file named get rejected. Always name design/Lume App.html.
- Prompts with no loop/design-match branch rule get rejected. Always state it.

## Loop notes
- Handover after R141, R156, R167, R172, R187, and after R204 (summary read in R205). Handover summary in loop/HANDOVER.md.
- Flags: R183 cleared R184; R185 cleared R186; R187 cleared R188; R189 cleared R190; R191 cleared R192; R193 cleared R194; R195 cleared R196; R198 cleared R199; R200 cleared R201; R203 cleared by R204. R205 expected to flag (Jest skipped).
- Jev R203: run 99%, ask 1%, stop 0%, last task clean 23%, risk 1.5 of 2. Matched Jev on run.
- Jev R204: run 91%, ask 7%, stop 2%, last task clean 88%, risk 1.3 of 2. Chose run (R204 verification). Matched Jev on run.
- Jev R205: run 89%, ask 6%, stop 5%, last task clean 23%, risk 1.4 of 2 (confidence 0.24 on risk). Chose run (es gymLog, small locale task). Matched Jev on run.
- R205: candidates were es gymLog, fr dashboard/nutrition/scanAccuracy, SLOT_KEYS consolidation. Chose es gymLog as the next Next item and the smallest task.