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
- Gym logging redesign APPROVED by Isa (round 24): plan-aware 'How did it go?' chooser replaces the 4-field questionnaire in log-session.tsx.
- Isa answered round 24: cardio in gym session stays 'Distance km' (no speed segments, no data-model change).
- Isa answered round 24: do NOT build Food search filter chips (All, Database, Brands, My dishes).
- Isa answered round 24: Goals structure stays as built (app-only extras stay: Fibre, reconciliation hint, Reset to AI recommendation, HealthDisclaimer, kcal/kJ, 'Macro targets' label). Goals rows 76, 78 and 97 stay DIFFERENT as accepted deviations.

## Prompt rules learned
- One task, max 5 steps, exactly ONE editable source file named (the checker rejects two). A one-line status edit to DESIGN_GAP_ANALYSIS.md is accepted alongside it. An en.json key addition is tolerated when named explicitly.
- Testing is light: tsc plus jest --findRelatedTests --passWithNoTests on changed files. Never run prettier.
- CHECKED must paste literal exit codes and result lines for tsc, eslint and jest. 'No tests found' alone can trip the auto-checker.
- Design handler names are not app identifiers; grep for the real path before naming a file.
- Locale files: src/lib/i18n/locales/en.json (es.json, fr.json beside it).
- Check git state before re-issuing a task, since work may already be committed.
- The bar is used only in Food detail, Quick add, Gym session and Gym template. Goals does not use it.
- A test pinned to a changed control may be updated as a small separate task.
- Goals card uses Card variant="elevated" (adds shadow.sm, the design has none). Shadowless is a one-prop change if Isa wants it.

## Done (all BUILT, not verified)
- Shared src/components/common/NumberEntryBar.tsx, applied in food/quick-add, food/detail, gym/session (cardio stays 'Distance km') and gym/PlannedValuesForm (inline in BottomSheet).
- Food Add sheet rebuilt to the design chooser (food/add.tsx). Its 'Search foods' tile routes to /(tabs)/food?focus=search, which focuses the search input.
- Goals: borderless inline calorie input, hints, white card.
- Search result '+' disc in (tabs)/food.tsx logs at 100 g to the slot from slotForNow() with a toast. The row label now uses foodLog.openFood. Round 22 had tsc, eslint and jest all exit 0. Nested-Pressable isolation is unverified on device.

## In progress
- Round 24: gym log-session 'How did it go?' chooser (log-session.tsx, one file plus en.json keys plus one status line). Prompt sent. If the report says BLOCKED on a data-model field, ask Isa or park it.

## Blocked on Isa
(none)

## Next tasks (after the gym chooser)
1. Small fix: the (tabs)/food.tsx focus param is never cleared, so it can re-focus unexpectedly (one file).
2. Data fidelity: the search disc in (tabs)/food.tsx and detail.tsx log macros as flat 0 although FoodResult has optional protein/carbs/fat. Two separate one-file tasks, food.tsx first.
3. (tabs)/food.tsx warnConflict toast and accessibilityHint build English strings inline from a raw enum. Move to i18n keys (one file plus en.json).
4. en.json addMenu keys for 'Search foods', 'Apple, banana, Indomie…', 'My dishes', 'Quick add', 'Just calories, fast' and an interpolated addToSlot key, then wire them in add.tsx. Two tasks.
5. Doc-only: add a /gym/session summary row to DESIGN_GAP_ANALYSIS.md as BUILT without flipping row 76. Fix stale Food detail, Quick add and Add sheet sections that contradict their summary rows.
6. Food - Search 88% sheet (pill input, thumbnails, row metrics, without filter chips) needs its own plan.
7. Remaining gym cluster rows (template editor etc.) need Isa's approval per item, ask before starting.
8. If nothing non-gym is a one-file task and Isa is silent, stop with reason 'only owner decisions remain'.

Small candidates: blinking caret in NumberEntryBar; Food detail fractional macros lose precision (draft() uses Math.round); Food detail composition gaps (96x96 photo, AI note, brand sub-line); accessibilityState disabled on the Goals calorie input.

## Parked (not v1)
- Checked-in extract of the design payloads.
- Render test harness lacks SafeAreaProvider, so bar render tests must wrap their own. No render tests cover quick-add, session, PlannedValuesForm or the search disc.
- AGENTS.md note on common vs primitives.
- Gym items (decide with Isa): set row order [kg] x [reps] with per-set remove; ParameterForm cardio inputs; template editor redesign (accordion, warm-up chips, Rest/Tempo/RPE tiles, Target RPE needs a data change); docking the template bar full-bleed (two files); kg/lb field vs fixed 'kg'; cardio Duration mixed with tap boxes.
- Four app-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay as is.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets' eyebrow.
- Locale drift: es.json and fr.json lack the new keys. goals.savedAsYouType now holds two sentences.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods. Remove after verifying zero usage.
- Food search filter chips (Isa said no).

## Loop notes
- Rounds 1-14: early rejections (two files) and wrong-premise stops. Round 15 was a no-op because the work was already committed.
- Rounds 16-21 landed clean (Goals hints, card, focus param, add.tsx wiring, search disc). The round 21 report was flagged only because of the no-tests line.
- Round 22: openFood label fix landed, tsc, eslint and jest exit 0.
- Round 23: asked Isa about 4 items (Jev split run 51%, ask 48%).
- Round 24: Isa answered 1 yes, 2 no, 3 no, 4 no. Jev run 74%. Running the gym chooser task.