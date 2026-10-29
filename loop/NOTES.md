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
- Prompts are strict: one task, max 5 steps, exactly ONE editable source file named (the loop checker rejects a component plus screens, or two editable files), everything else in the do-not-touch list. A one-line status edit to DESIGN_GAP_ANALYSIS.md has been accepted alongside the one source file. An en.json key addition has been tolerated when the prompt names it explicitly.
- Testing is light: tsc plus jest --findRelatedTests --passWithNoTests on changed files. Isa verifies.
- Clean code: reuse tokens and shared components, no dead code or debug leftovers. Never run prettier (repo has no config).
- Design handler names (e.g. logAdjust) are not app identifiers. Find the real app path with grep before naming a file.
- The locale file path is src/lib/i18n/locales/en.json (src/locales/en.json does not exist). es.json and fr.json sit beside it.
- The bar is used only where the design uses it: Food detail, Quick add, Gym session, Gym template. Goals does NOT use it.
- A test pinned to a changed control may be updated as a small separate task without asking Isa.
- Goals card uses the shared Card variant="elevated" (adds shadow.sm; the design card has no shadow). If Isa wants shadowless it is a one-prop change.
- Prompts must ask Claude Code to paste literal exit codes and result lines for tsc, eslint and jest in CHECKED, because the automatic checker flags reports where it cannot see them ("No tests found" alone can trip it).

## Done (all BUILT, not verified)
- Shared bar: src/components/common/NumberEntryBar.tsx (label, value, onChange(text, value), onDone, mode?, maxLength?).
- Bar applied in: food/quick-add.tsx; food/detail.tsx (six pads; manual/locked gate kept, pinned by foodDetail.test.ts:137); gym/session.tsx (cardio stays 'Distance km', not speed); gym/PlannedValuesForm.tsx (inline in BottomSheet, not docked). foodDetailLogged render test updated.
- Food Add sheet rebuilt to the design chooser (src/app/food/add.tsx). Sub-lines for Scan food, Barcode and My dishes are wired to addMenu keys (commit e22c995).
- Goals calorie figure is the borderless inline input (src/app/profile/goals.tsx). Rows 76, 78 and 97 stay DIFFERENT.
- Goals hints (rounds 16-17) and Goals white card (round 18) built.
- Round 19: (tabs)/food.tsx reads route param focus and focuses search input when 'search'.
- Round 20: add.tsx 'Search foods' tile routes to /(tabs)/food?focus=search.
- Round 21: SearchResultRow '+' disc in (tabs)/food.tsx is now a real Pressable (accessibilityLabel from existing foodLog.addToMeal), logs via logMeal(slot, item, 'manual') at 100 g default (SEARCH_DEFAULT_G), slot from slotForNow(), success toast with new key foodLog.addedToMeal ('{{energy}} added to {{slot}}', energy via formatEnergy). Gap doc Food - Search Built note updated, status stays DIFFERENT. tsc exit 0, eslint exit 0, jest found no tests. Nested-Pressable press isolation (disc does not open detail) is unverified on device.
- en.json: added addMenu.mealPhotoOrLabel, exactDatabaseMatch, savedGallery, goals.setByLume, tapToEdit, savedAsYouType, foodLog.addedToMeal. Removed stale addMenu.voice and describeOutLoud.

## In progress
- Round 22: the loop flagged the round 21 report ("type check or tests failed or were not run"). The report itself shows tsc exit 0, eslint exit 0 and jest 'No tests found', so the flag is most likely the no-tests line. Handled by a small fix that also re-runs the checks with literal output: replace the SearchResultRow hardcoded accessibilityLabel `Add ${food.name}` in (tabs)/food.tsx with an open-style key (reuse an existing foodLog key if there is one, else add foodLog.openFood 'Open {{name}}'). No report yet. If tsc is red in the report, one fix attempt, then stop.

## Blocked on Isa
- Asked round 7, no answer (do not re-ask unless every remaining task needs Isa): (1) cardio in gym session: keep 'Distance km' or convert to speed segments (data-model change)? (2) approve the gym cluster redesign (plan-aware 'How did it go?' chooser replacing the 4-field questionnaire in log-session.tsx)? Do neither until answered. A late answer is the answer, do it next.
- Goals structure (found round 11, not yet asked): radio cards vs 2-segment control; three read-only macro rows with colour dot, value and 6px bar vs six editable fields; app-only features absent from design (Fibre, reconciliation hint, Reset to AI recommendation, HealthDisclaimer, kcal/kJ, 'Macro targets' label). The help line now sits between the card and the Fibre field and reads as a Fibre caption. Many look deliberate, so do not remove without approval. Ask only when other tasks run out.
- Food search filter chips (All, Database, Brands, My dishes): needs Isa's call on whether the search backend can filter by source. Ask when other tasks run out.

## Next tasks
1. Food - Search: the 88% search sheet with pill input and filter chips needs its own plan (new route, may need an ask). Thumbnails and row metrics are separate gaps. Filter chips need the Isa question above.
2. Small fix: (tabs)/food.tsx focus param is never cleared, so returning to the tab in the same route entry could re-focus unexpectedly (one-file task).
3. Data fidelity: both add paths (detail.tsx and the new search disc in (tabs)/food.tsx) log macros as flat 0 although FoodResult carries optional protein/carbs/fat on real API hits. Two separate one-file tasks (food.tsx first, then detail.tsx). Not a design row, but it affects an honest tracker; ask Isa if unsure whether it is in scope.
4. Low value, two tasks: (a) en.json addMenu keys for 'Search foods', 'Apple, banana, Indomie…', 'My dishes', 'Quick add', 'Just calories, fast' plus an interpolated addMenu.addToSlot key (add.tsx builds `Add ${slot.toLowerCase()}` as an untranslatable template literal); (b) wire them in add.tsx.
5. Doc-only: add a /gym/session summary row to DESIGN_GAP_ANALYSIS.md as BUILT, do not flip row 76. Best after Isa answers the cardio question.
6. Then remaining non-gym rows by most rows cleared per task. Confirm in the design payload which control a row uses before assigning it.
7. If nothing non-gym is a one-file task, use action ask with the open questions (gym cluster, Goals structure, search filter chips).

Small candidates: blinking caret in NumberEntryBar (color.primary, 1s loop); Food detail fractional macros lose precision (draft() uses Math.round, needs a test); Food detail composition gaps (96x96 photo tile, AI note, brand sub-line, title); doc-only fix of stale sections in DESIGN_GAP_ANALYSIS.md for Food detail, Quick add and Add sheet that contradict their summary rows; accessibilityState={{ disabled: !isCustom }} on the Goals calorie input.

## Parked (not v1)
- Checked-in extract of the design payloads (tooling).
- Render test harness lacks SafeAreaProvider, so bar render tests must wrap their own. No render tests cover quick-add, session, PlannedValuesForm bar use, or the search disc.
- AGENTS.md note on common vs primitives (doc only).
- Gym cluster items (decide with Isa): set row order [kg] x [reps] with per-set remove; ParameterForm cardio inputs; template editor redesign (accordion, warm-up chips, Rest/Tempo/RPE tiles; Target RPE needs a data change); docking the template bar full-bleed (needs two files); fixed 'kg' caption vs kg/lb field; cardio Duration field mixed with tap boxes; no +/- stepper in the design.
- Four app-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay as is.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' (not enforced, needs a behaviour decision) and 'Daily targets' eyebrow.
- Locale drift: es.json and fr.json lack the new keys (now seven). goals.savedAsYouType is now two sentences, so its key name only describes the second one (rename optional). Low priority.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods. Optional en.json cleanup after verifying zero usage.

## Loop notes
- Rounds 1-14: early prompt rejections (two files), wrong-premise rounds (logAdjust, Goals bar) produced correct no-edit stops. Use --passWithNoTests. Round 7 question to Isa went unanswered. Rounds 12-14 landed clean.
- Round 15: no-op, the work was already committed in e22c995. tsc green. Do not re-issue tasks without first checking git state for work that already landed.
- Round 16: hints rendered in goals.tsx, tsc green, no tests found. Flagged as partly done.
- Round 17: copy fixed in en.json, tsc green, clean.
- Round 18: Goals card landed clean. Jev last task clean 92%.
- Round 19: food.tsx focus param landed clean. Jev run 98%, last task clean 84%.
- Round 20: add.tsx focus wiring landed clean. Jev last task clean 93%.
- Round 21: one-tap add disc landed (tsc and eslint exit 0, no tests). Auto-check flagged the report anyway. Jev last task clean 81%.
- Round 22: Jev run 57%, ask 42%, low confidence 0.35, so chose a small task. Run chosen: a11y label fix that also re-verifies tsc, eslint and jest with literal output, which addresses the flag. Isa questions are pending but not every remaining task needs him yet.