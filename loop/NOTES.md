# Lume Loop Notes

## Goal
Build every UI surface to match the Claude Design export in design/ (source: design/Lume App.html, gzip+base64 payloads) through the 41 rows of DESIGN_GAP_ANALYSIS.md. Isa verifies the UI himself. Branch loop/design-match, single workspace.

## Decisions (never delete)
- RevenueCat over Stripe.
- Onboarding behaviour is stabilised, do not change it.
- v1 scope is locked, extra ideas go to Parked.
- The design HTML in design/ is the source of truth for the UI.
- The gap analysis is authoritative, earlier verification reports are not.
- 7-day free trial, $49.99 per year and $8.99 per month, no card up front.
- Gym logging redesign needs Isa's approval before building.
- Prompts are strict: one task, max 5 steps, exactly ONE editable source file named (the loop checker rejects a component plus screens, or two editable files), everything else in the do-not-touch list.
- Testing is light: tsc plus jest --findRelatedTests --passWithNoTests on changed files. Isa verifies.
- Clean code: reuse tokens and shared components, no dead code or debug leftovers. Never run prettier (repo has no config).
- Design handler names (e.g. logAdjust) are not app identifiers. Find the real app path with grep before naming a file.
- The bar is used only where the design uses it: Food detail, Quick add, Gym session, Gym template. Goals does NOT use it.
- A test pinned to a changed control may be updated as a small separate task without asking Isa.

## Done (all BUILT, not verified)
- Shared bar: src/components/common/NumberEntryBar.tsx (label, value, onChange(text, value), onDone, mode?, maxLength?).
- Bar applied in: food/quick-add.tsx; food/detail.tsx (six pads; manual/locked gate kept, pinned by foodDetail.test.ts:137); gym/session.tsx (cardio stays 'Distance km', not speed); gym/PlannedValuesForm.tsx (inline in BottomSheet, not docked). foodDetailLogged render test updated.
- Food Add sheet rebuilt to the design chooser (src/app/food/add.tsx). Search foods currently lands on the day log with an unfocused search bar.
- Goals calorie figure is the borderless inline input (src/app/profile/goals.tsx). Rows 76, 78 and 97 stay DIFFERENT.
- en.json: added addMenu.mealPhotoOrLabel, exactDatabaseMatch, savedGallery and goals.setByLume, tapToEdit, savedAsYouType. Removed stale addMenu.voice and describeOutLoud.

## In progress
- Round 15: src/app/food/add.tsx only. Replace the three hardcoded sub-line literals with t('addMenu.mealPhotoOrLabel'), t('addMenu.exactDatabaseMatch'), t('addMenu.savedGallery'). 'My dishes' stays hardcoded. Prompt issued, no report yet.

## Blocked on Isa
- Asked round 7, no answer (do not re-ask unless every remaining task needs Isa): (1) cardio in gym session: keep 'Distance km' or convert to speed segments (data-model change)? (2) approve the gym cluster redesign (plan-aware 'How did it go?' chooser replacing the 4-field questionnaire in log-session.tsx)? Do neither until answered. A late answer is the answer, do it next.
- Goals structure (found round 11, not yet asked): radio cards vs 2-segment control; three read-only macro rows with bars vs six editable fields; card wrapper; app-only features absent from design (Fibre, reconciliation hint, Reset to AI recommendation, HealthDisclaimer, kcal/kJ). Many look deliberate, so do not remove without approval. Ask only when other tasks run out.

## Next tasks
1. Render Goals hints in src/app/profile/goals.tsx using goals.setByLume, tapToEdit, savedAsYouType ('Set by Lume' / 'Tap to edit', help 'Saved as you type'). One file.
2. Food - Search: check the gap row first. Build the search sheet (88% height, pill input, filter chips) or add a focus=search param in src/app/(tabs)/food.tsx and point the Add sheet tile at it. Split into one-file tasks (screen, then add.tsx tile).
3. Optional low value: addMenu key for 'My dishes' (en.json), then wire in add.tsx. Two tasks.
4. Doc-only: add a /gym/session summary row to DESIGN_GAP_ANALYSIS.md as BUILT, do not flip row 76. Best after Isa answers the cardio question.
5. Then remaining non-gym rows by most rows cleared per task. Confirm in the design payload which control a row uses before assigning it.
6. If nothing non-gym is a one-file task, use action ask with both open questions (gym cluster, Goals structure).

Small candidates: blinking caret in NumberEntryBar (color.primary, 1s loop); Food detail fractional macros lose precision (draft() uses Math.round, needs a test); Food detail composition gaps (96x96 photo tile, AI note, brand sub-line, title); doc-only fix of stale sections in DESIGN_GAP_ANALYSIS.md for Food detail, Quick add and Add sheet that contradict their summary rows.

## Parked (not v1)
- Checked-in extract of the design payloads (tooling).
- Render test harness lacks SafeAreaProvider, so bar render tests must wrap their own. No render tests cover quick-add, session or PlannedValuesForm bar use.
- AGENTS.md note on common vs primitives (doc only).
- Gym cluster items (decide with Isa): set row order [kg] x [reps] with per-set remove; ParameterForm cardio inputs; template editor redesign (accordion, warm-up chips, Rest/Tempo/RPE tiles; Target RPE needs a data change); docking the template bar full-bleed (needs two files); fixed 'kg' caption vs kg/lb field; cardio Duration field mixed with tap boxes; no +/- stepper in the design.
- Four app-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay as is.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' (not enforced, needs a behaviour decision) and 'Daily targets' eyebrow.
- Locale drift: es.json and fr.json lack the six new keys. Low priority.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods. Optional en.json cleanup after verifying zero usage.

## Loop notes
- Rounds 1-14: early prompt rejections (two files), wrong-premise rounds (logAdjust, Goals bar) produced correct no-edit stops. Use --passWithNoTests. Round 7 question to Isa went unanswered. Rounds 12-14 landed clean.
- Round 15: Jev run 98%, but last-task-clean 8% with no report to check. Chose run because the task is small and one file. If the report shows a failure, fix that before moving on.