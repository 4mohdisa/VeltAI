# Lume Loop Notes

## Goal
Build every UI surface to match the Claude Design export in design/ (source: design/Lume App.html) through the 41 rows of DESIGN_GAP_ANALYSIS.md. Isa verifies the UI himself. Branch loop/design-match, single workspace.

## Decisions (never delete)
- RevenueCat over Stripe.
- Onboarding behaviour is stabilised, do not change it.
- v1 scope is locked, extra ideas go to Parked.
- The design HTML in design/ is the source of truth for the UI.
- The gap analysis is authoritative, earlier verification reports are not.
- 7-day free trial, $49.99 per year and $8.99 per month, no card up front.
- Gym logging redesign APPROVED by Isa (round 24): plan-aware 'How did it go?' chooser replaces the 4-field questionnaire.
- Isa round 24: cardio in a gym session stays 'Distance km'. Do NOT build Food search filter chips. Goals structure stays as built (app-only extras stay). Goals rows 76, 78 and 97 stay DIFFERENT as accepted deviations.

## Prompt rules learned
- One task, max 5 steps, exactly ONE editable source file named (the checker rejects two). A one-line status edit to DESIGN_GAP_ANALYSIS.md is accepted alongside it. An en.json key addition is tolerated when named explicitly.
- EVERY prompt, including read-only checkpoint prompts, must name design/Lume App.html.
- Testing is light: tsc plus eslint plus jest --findRelatedTests --passWithNoTests on changed files. Never run prettier.
- CHECKED must paste literal exit codes and result lines for tsc, eslint and jest, or the auto-checker flags the report.
- Grep for the real path before naming a file. Check git state before re-issuing a task.
- Locale files: src/lib/i18n/locales/en.json (es.json, fr.json beside it).
- eslint enforces react-hooks/set-state-in-effect: derive state, do not seed it in effects.
- Checkpoint rounds only when the loop note says so: full tsc plus full jest (baseline 65 suites / 823 tests), no file changes.
- If a data path needs several files, split it into one task per file, each compiling on its own (optional fields first).
- After a handover, name files fully in the prompt.

## Done (all BUILT, not verified)
- Shared NumberEntryBar, applied in food quick-add, food detail, gym session and gym PlannedValuesForm.
- Food Add sheet chooser. Search tile routes to the food tab with focus=search, and the param is cleared after use.
- Goals: borderless calorie input, hints, white card.
- Gym log-session 'How did it go?' chooser with adjust / ticklist / picker modes passed to gym/session.tsx. Side effect to tell Isa: in adjust and ticklist the rows start checked, so backing out untouched offers 'Save progress?'.
- Search macros path CLOSED: detailSubject.ts optional macro fields (1b8ab30); (tabs)/food.tsx pick() passes per-100 g macros (round 32); food/detail.tsx search branch seed and per100 use them with `?? 0` (round 33); (tabs)/food.tsx quickAdd (+ disc) logs Math.round(protein/carbs/fat ?? 0) at 100 g, same row as the detail sheet (round 34). macros={false} left as is, so values stay hidden until Isa decides.
- Round 35 (verified clean: tsc 0, eslint 0, jest none related): (tabs)/food.tsx warnConflict toast and accessibilityHint now use t(`foodLog.conflict.${conflict}`); en.json has foodLog.conflict halal / vegan / vegetarian / gluten_free. dairy_free and none have no key because CONFLICT_KEYWORDS cannot return them.

## In progress
- src/app/food/add.tsx: move remaining hardcoded strings ('Search foods', 'Apple, banana, Indomie…', 'My dishes', 'Quick add', 'Just calories, fast', add-to-slot heading) into en.json addMenu keys (searchFoods, searchPlaceholder, myDishes, quickAdd, quickAddSub, addToSlot) and wire with t() (round 36, prompt sent). Files: add.tsx plus en.json only.

## Blocked on Isa
(none)

## Next tasks
1. Verify the round 36 report.
2. Checkpoint (full tsc plus full jest) when the loop note asks. No checkpoint result exists yet.
3. Doc-only: add a /gym/session summary row to DESIGN_GAP_ANALYSIS.md as BUILT without flipping row 76. Fix stale Food detail, Quick add and Add sheet sections.
4. Food Search 88% sheet (pill input, thumbnails, row metrics, no filter chips) needs its own plan.
5. ASK ISA when small non-gym tasks are done (batch into one question): gym log-session differences 17 (celebration card: streak hero, Time / Calories / Volume, black 'Nice one' pill), 18 (no 'Logged and locked' edit cycle), 19 (already-logged dismisses instead of routing into the day), 23 (Summary card calls logGymSession() with no arguments, a third entry point). These are behaviour changes. Also ask about the macros={false} layout on Food detail search branch (and the stale kcal-only copy it drives: detail.tsx header comment lines 11-12 and empty-state text ~line 643).
6. Remaining gym cluster rows (template editor etc.) need Isa's approval per item.
7. If nothing non-gym is a one-file task and Isa is silent, stop with reason 'only owner decisions remain'.

Small candidates: blinking caret in NumberEntryBar; Food detail fractional macros lose precision (Math.round in draft()); Food detail composition gaps (96x96 photo, AI note, brand sub-line); accessibilityState disabled on the Goals calorie input; hardcoded English accessibilityHint strings in (tabs)/food.tsx (~lines 761, 844).

## Parked (not v1)
- Checked-in extract of the design payloads (decode via __bundler/manifest JSON in design/Lume App.html, gzip+base64 per entry).
- Render test harness lacks SafeAreaProvider. No render tests cover quick-add, session, PlannedValuesForm, log-session, the search disc, the focus-param clear or the session mode param. No test guards the two-search-logging-paths-write-the-same-row invariant.
- Gym items (decide with Isa): set row order with per-set remove; ParameterForm cardio inputs; template editor redesign (Target RPE needs a data change); docking the template bar full-bleed; kg/lb field; cardio Duration mixed with tap boxes.
- Four app-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay as is.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets' eyebrow.
- Locale drift: es.json and fr.json lack new keys (including gymLog, foodLog.conflict, and the round 36 addMenu keys). i18n is English-only at launch (src/lib/i18n/index.ts:39).
- CONFLICT_KEYWORDS and foodLog.conflict keys are not type-linked: adding dairy_free to keywords would show a raw key.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods. Remove after verifying zero usage.
- router.setParams on the food tab rewrites its history entry.
- useFoodSearch macros have no null signal: unknown is indistinguishable from zero.
- Card variant="elevated" adds shadow.sm the design lacks (repo's established mapping).
- Dev catalog carries calories only, so macro fixes are a no-op in dev (src/lib/mock/data.ts).

## Loop notes
- Rounds 1-29: early rejections (two files, missing design file) then clean landings for rounds 16-28. Round 29 checkpoint prompt was rejected, no checkpoint ran.
- Round 30: detail.tsx task blocked, no edit, because the data never reached the file.
- Round 31: step 1 landed cleanly (detailSubject.ts, commit 1b8ab30). Handover happened after it.
- Round 32: step 2 landed cleanly in (tabs)/food.tsx. Jev run 97%, last-clean 90%.
- Round 33: step 3 landed cleanly in food/detail.tsx. Jev run 93%, last-clean 81%.
- Round 34: quickAdd macro alignment landed cleanly, macro path closed. Jev ask 59% / run 37%, confidence 0.38.
- Round 35: i18n of warnConflict landed cleanly (food.tsx plus en.json). Jev afterwards: run 51% / ask 44% / stop 5%, confidence 0.26, last-clean 97%.
- Round 36: Jev near split with low confidence, so chose another small one-file i18n task (add.tsx plus en.json). Isa questions stay batched until small non-gym tasks are done (Next tasks 5).