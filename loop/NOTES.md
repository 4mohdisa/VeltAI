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
- EVERY prompt, including read-only checkpoint prompts, must name the matching design/ file (design/Lume App.html) or the checker rejects it (round 29 checkpoint prompt was rejected for this).
- Testing is light: tsc plus jest --findRelatedTests --passWithNoTests on changed files. Never run prettier.
- CHECKED must paste literal exit codes and result lines for tsc, eslint and jest. 'No tests found' alone can trip the auto-checker.
- Design handler names are not app identifiers; grep for the real path before naming a file.
- Locale files: src/lib/i18n/locales/en.json (es.json, fr.json beside it).
- Check git state before re-issuing a task, since work may already be committed.
- The bar is used only in Food detail, Quick add, Gym session and Gym template. Goals does not use it.
- A test pinned to a changed control may be updated as a small separate task.
- Goals card uses Card variant="elevated" (adds shadow.sm, the design has none). Shadowless is a one-prop change if Isa wants it.
- react-hooks/set-state-in-effect is enforced by eslint: derive state instead of seeding it in effects.
- Checkpoint rounds: only when the loop note says so. Run full tsc plus full jest, no file changes. Prompt is read-only and must still name design/Lume App.html.

## Done (all BUILT, not verified)
- Shared src/components/common/NumberEntryBar.tsx, applied in food/quick-add, food/detail, gym/session (cardio stays 'Distance km') and gym/PlannedValuesForm (inline in BottomSheet).
- Food Add sheet rebuilt to the design chooser (food/add.tsx). Its 'Search foods' tile routes to /(tabs)/food?focus=search, which focuses the search input.
- Goals: borderless inline calorie input, hints, white card.
- Search result '+' disc in (tabs)/food.tsx logs at 100 g to the slot from slotForNow() with a toast. The row label uses foodLog.openFood. Nested-Pressable isolation is unverified on device.
- Round 24: gym/log-session.tsx rebuilt as the 'How did it go?' chooser (SheetContent leading, Different weights / Only some of it tiles, Something else row, 'It went as planned' footer calling logGymSession with completionRate 1, rest-day EmptyState fallback). New en.json gymLog group.
- Round 25: (tabs)/food.tsx clears the `focus` param after focusing search.
- Round 26: gym/session.tsx reads optional `mode` (adjust / ticklist / picker) via a typed guard, by derivation, no effect seeding.
- Round 27: log-session.tsx tiles now pass mode adjust / ticklist / picker via openSession(mode) (object-form router.replace). Rest-day EmptyState calls openSession() with no mode. The gym entry-mode flow is complete. Side effect to tell Isa: in adjust and ticklist the rows start checked, so dirty is true on arrival and the beforeRemove guard offers 'Save progress?' if the user backs out untouched.
- Round 28: (tabs)/food.tsx search disc now logs the result's own protein/carbs/fat (per 100 g, `?? 0` fallback) instead of flat 0. tsc, eslint exit 0, jest no tests found. Note: local dev catalog in src/lib/mock/data.ts carries calories only, so in dev builds macros stay 0.

## In progress
- Round 30: src/app/food/detail.tsx search branch uses FoodResult protein/carbs/fat (?? 0) in `seed` and `per100`. Prompt sent (names design/Lume App.html).

## Blocked on Isa
(none)

## Next tasks
1. Checkpoint (full tsc plus full jest, read-only, baseline 65 suites / 823 tests) when the loop note asks for it. The round 29 checkpoint prompt was rejected before it ran, so no checkpoint result exists yet. Name design/Lume App.html in that prompt.
2. (tabs)/food.tsx warnConflict toast and accessibilityHint build English strings inline from a raw enum. Move to i18n keys (one file plus en.json).
3. en.json addMenu keys for 'Search foods', 'Apple, banana, Indomie…', 'My dishes', 'Quick add', 'Just calories, fast' and an interpolated addToSlot key, then wire them in add.tsx. Two tasks.
4. Doc-only: add a /gym/session summary row to DESIGN_GAP_ANALYSIS.md as BUILT without flipping row 76. Fix stale Food detail, Quick add and Add sheet sections that contradict their summary rows.
5. Food - Search 88% sheet (pill input, thumbnails, row metrics, without filter chips) needs its own plan.
6. ASK ISA once the small non-gym tasks above are done: open gym log-session differences 17 (celebration card instead of toast: streak hero number, Time / Calories / Volume, black 'Nice one' pill), 18 (no 'Logged and locked' edit cycle), 19 (already-logged dismisses instead of routing into the day) and 23 (Summary card calls logGymSession() with no arguments or UI, a third entry point). These are behaviour changes. Claude Code's round 27 NEXT recommended starting with 17.
7. Remaining gym cluster rows (template editor etc.) need Isa's approval per item, ask before starting.
8. If nothing non-gym is a one-file task and Isa is silent, stop with reason 'only owner decisions remain'.

Small candidates: blinking caret in NumberEntryBar; Food detail fractional macros lose precision (draft() uses Math.round); Food detail composition gaps (96x96 photo, AI note, brand sub-line); accessibilityState disabled on the Goals calorie input.

## Parked (not v1)
- Checked-in extract of the design payloads.
- Render test harness lacks SafeAreaProvider, so bar render tests must wrap their own. No render tests cover quick-add, session, PlannedValuesForm, log-session, the search disc, the focus-param clear or the session mode param.
- AGENTS.md note on common vs primitives.
- Gym items (decide with Isa): set row order [kg] x [reps] with per-set remove; ParameterForm cardio inputs; template editor redesign (accordion, warm-up chips, Rest/Tempo/RPE tiles, Target RPE needs a data change); docking the template bar full-bleed (two files); kg/lb field vs fixed 'kg'; cardio Duration mixed with tap boxes.
- Four app-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay as is.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets' eyebrow.
- Locale drift: es.json and fr.json lack the new keys (including gymLog). goals.savedAsYouType now holds two sentences.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods. Remove after verifying zero usage.
- Food search filter chips (Isa said no).
- router.setParams on the food tab rewrites its history entry, so it may surprise a future deep-link test.
- useFoodSearch macros have no null signal: an unknown macro is indistinguishable from a measured zero.

## Loop notes
- Rounds 1-14: early rejections (two files) and wrong-premise stops. Round 15 was a no-op because the work was already committed.
- Rounds 16-21 landed clean (Goals hints, card, focus param, add.tsx wiring, search disc). The round 21 report was flagged only because of the no-tests line.
- Round 22: openFood label fix landed, tsc, eslint and jest exit 0.
- Round 23: asked Isa about 4 items (Jev split run 51%, ask 48%).
- Round 24: Isa answered 1 yes, 2 no, 3 no, 4 no. Gym chooser landed clean (Jev: 95% clean).
- Round 25: focus-param clear landed clean (Jev: 97% clean).
- Round 26: session.tsx mode param landed clean (Jev: 96% clean).
- Round 27: log-session.tsx mode passing landed clean (Jev: 97% clean).
- Round 28: Jev split run 48% / ask 47%, low confidence, so chose the small non-gym task (search disc macros). It landed clean (Jev: 97% clean).
- Round 29: checkpoint prompt was rejected (no design/ file named). No checkpoint ran.
- Round 30: Jev run 94%, clean 96%. Rewrote with the design file named and switched to Next task 1 (detail.tsx macros), since the loop note did not request a checkpoint.
