# Lume Loop Notes

## Goal
Build every UI surface to match the Claude Design export in design/ exactly, working through the 41 rows of DESIGN_GAP_ANALYSIS.md. Isa verifies the UI himself.

## State at start (14 Sep 2026, from Notion, confirmed current by Isa)
- Backend and app built. App 65 suites / 823 tests, backend 632 pass.
- Gap analysis: 26 of 41 surfaces different, 15 partial, 0 exact.
- Work paused 13 Sep right after the gap analysis, before any fixes.
- Single workspace, branch loop/design-match.

## Decisions (never delete)
- RevenueCat over Stripe.
- Onboarding behaviour is stabilised, do not change it.
- v1 scope is locked, extra ideas go to Parked.
- The Claude Design HTML export in design/ is the source of truth for the UI.
- The gap analysis is authoritative, earlier verification reports are not.
- 7-day free trial, $49.99 per year and $8.99 per month, no card up front.
- Gym logging redesign needs Isa's approval before building.
- Prompts are strict: one task, max 5 steps, named files, explicit do-not-touch list.
- Testing is light: type check plus tests for changed files only (use --passWithNoTests). Isa verifies the UI.
- Code must be clean: reuse tokens and shared components, no dead code or debug leftovers.
- A component and its application to screens are separate tasks. The loop checker rejects prompts that combine a component with screens, and also rejects prompts that name more than one editable screen/component file (round 10 first prompt was rejected for naming PlannedValuesForm plus ExercisePicker). Name exactly ONE editable source file per prompt and put everything else in the do-not-touch list.
- When applying the bar changes a control that an existing test pins, updating that test to the new control is a small separate follow-up task (manager may authorise it, no need to ask Isa). Source stays untouched in that task.
- Design handler names in DESIGN_GAP_ANALYSIS.md (e.g. logAdjust) are NOT app identifiers. Before naming a file in a prompt, find the real app path with grep or from these notes. Use the gap-doc row names exactly.
- Only apply the bar where the design itself uses it (Food detail, Quick add, Gym session, Gym template). Do not invent bar usage for other surfaces. Verify in the design payload before assigning the bar to a row (round 11: Goals does NOT use it).

## Done
- Round 1: shared component built (now src/components/common/NumberEntryBar.tsx; props: label, value, onChange(text, value), onDone, mode?, maxLength?). Design source: design/Lume App.html (gzip+base64 embedded payloads). The bar appears 4 times identically in the design (Food detail pad, Quick add pad, Gym session pad, Gym template pad).
- Round 2: Food - Quick add (src/app/food/quick-add.tsx) has the bar applied, maxLength 5. Row BUILT (not verified).
- Round 3: Food - Food detail sheet (src/app/food/detail.tsx) has the bar applied to six pads (grams chip, kcal readout, 2x2 macro tile grid; Fibre editable; maxLength 6). Row BUILT (not verified). The app's manual/locked gate (lockValues={!review}, 'Edit values manually') kept because src/__tests__/foodDetail.test.ts:137 pins it.
- Round 4: test src/__tests__/render/foodDetailLogged.render.test.tsx updated to the new tiles/pad. tsc, eslint, jest (35 tests) green.
- Round 5: bar moved/renamed to src/components/common/NumberEntryBar.tsx, imports updated. Pure rename. Green.
- Round 6: bar applied in src/app/gym/session.tsx (the screen that does real exercise logging; NOT log-session.tsx). PADS table with design captions: Weight kg (decimal), Reps (numeric), Minutes (numeric), maxLength 5. Tappable 40pt value boxes replace the four TextFields; bar docked below Screen in a KeyboardAvoidingView like quick-add; Finish workout footer hides while the bar is open. Save path, state shape, validation untouched. Cardio field is 'Distance km' (decimal), NOT 'Speed km/h', because session.tsx stores distance; the design's speed segments would be a data-model change. Row 76 ('Gym - log session', names log-session.tsx) NOT flipped to built; its reason line says only difference 16 is closed, in /gym/session. /gym/session has no row of its own in DESIGN_GAP_ANALYSIS.md.
- Round 8: Food - Add sheet (src/app/food/add.tsx) rebuilt to the design chooser: added Search foods (-> /(tabs)/food, existing route) and My dishes (-> /food/saved), removed Scan Label and My Meals tiles (routes /food/label-scan and /food/meals untouched), per-slot title ('Add to <slot>' else t('addMenu.title')), Quick add full-width row, 2-column grid, disc/glyph 46/19. Row BUILT (not verified). tsc, eslint clean. Known half-state: Search foods lands on the day log with an unfocused search bar (the design opens a dedicated search sheet; that is the separate 'Food - Search' row).
- Round 9: NO EDIT. Claude Code stopped correctly: 'logAdjust' is a design handler name, not an app screen. Real template-related app files: src/app/gym/new-template.tsx (name + Duration (min, optional) only), src/components/gym/PlannedValuesForm.tsx, rendered inside src/components/gym/ExercisePicker.tsx. Gap row is named 'Gym — workout / template detail' (row 78).
- Round 10: DONE. src/components/gym/PlannedValuesForm.tsx now uses NumberEntryBar for Planned sets (numeric, floor 1), Target reps (numeric), Target weight · kg (decimal), Rest · seconds (numeric), maxLength 5. Stepper and three TextFields replaced by tappable 40pt value boxes; the cardio Duration TextField is untouched. PlannedValues type, props, submit() and onSubmit contract unchanged. One line added to row 78's reason, row NOT flipped (still DIFFERENT). tsc, eslint clean, no tests pinned the old controls. Known half-state: the bar is inline inside the BottomSheet content rather than docked full-bleed above the keyboard.
- Round 11: NO EDIT. Claude Code correctly found that the design's Goals calorie figure is NOT a bar pad: it is a borderless inline text input (126pt wide, stat-large rounded, letterSpacing -1, 'kcal' suffix, readOnly in Lume mode in secondaryLabel, editable in label colour, hint 'Set by Lume' / 'Tap to edit', help copy 'Saved as you type'). Real Goals file: src/app/profile/goals.tsx.
- Round 12/13: Profile - Goals calorie control (src/app/profile/goals.tsx) is the design's borderless inline figure (FIGURE_WIDTH 126, statLarge, letterSpacing -1, unit suffix callout, secondaryLabel when read-only, label when editable). kcal/kJ conversion and all behaviour intact. Row 97 note marked built, not verified; status stays DIFFERENT. Hints not rendered: the three strings are absent from en.json. tsc and eslint clean, Goals has no test file.

## In progress
- Round 14: en.json only (src/lib/i18n/locales/en.json). Add addMenu keys ('Meal photo or label', 'Exact database match', 'Your saved gallery'), add Goals hint keys ('Set by Lume', 'Tap to edit', 'Saved as you type'), remove stale addMenu voice/describeOutLoud only if grep shows zero usage. Guard: if another locale file exists and a test pins key parity, make no edit and report. Wiring the keys is the next two tasks (add.tsx, then goals.tsx), one file each.

## Blocked on Isa
- Asked in round 7, NO ANSWER yet (do not ask again unless every remaining task needs Isa): (1) cardio in gym session: keep 'Distance km' (no data change) or convert to speed segments (min + km/h, data-model change)? (2) approve starting the gym cluster redesign (plan-aware 'How did it go?' chooser replacing the 4-field questionnaire in log-session.tsx)? Until answered, do neither. If a late answer arrives, treat it as the answer and do that task next.
- Profile - Goals structural differences needing Isa's call (found round 11, not asked yet, ask only when other tasks run out): radio description cards instead of a 2-segment control; three read-only macro rows with bars instead of six editable fields; calories+macros card wrapper; app-only features absent from the design (Fibre field, reconciliation hint, 'Reset to AI recommendation', HealthDisclaimer, kcal/kJ energy-unit awareness). Several look deliberate, so do not remove without approval. Claude Code's round 13 recommendation (swap the editable macro fields for read-only bars) falls under this item, so it needs Isa's call and is not scheduled.

## Parked (not v1)
- Checked-in extract of the design HTML payloads (or populate empty ds-bundle/components) so design lookups do not repeat gzip/base64 extraction. Tooling, parked unless it blocks work.
- Repo has no prettier config. Never run prettier on files (it reformats to double quotes and 80 columns, against repo style).
- Test harness: src/__tests__/render/setup.ts has no SafeAreaProvider, so any render test touching the bar must wrap its own. Small tooling task, only if a later round hits it again.
- No render test covers quick-add.tsx's, session.tsx's or PlannedValuesForm's use of the bar.
- Convention note in AGENTS.md on what belongs in src/components/common vs primitives. Doc-only, low priority.
- Gym session set row order: design is [kg] x [reps] with per-set remove x; app renders [reps] [weight] with no remove. Composition work, part of gym cluster decision.
- Cardio with a parameter schema goes through ParameterForm (src/components/gym) with its own boxed inputs; different number-entry model. Part of gym cluster decision.
- Template editor real redesign (row 78): per-exercise accordion with per-set kg/reps rows, warm-up chips, Rest/Tempo/RPE tile grid; exercises are read-only once saved in the app. Large, part of gym cluster decision. Target RPE needs a PlannedValues type/state addition (data change), so also parked.
- Design has no +/- stepper anywhere in the gym flow (gap difference 15); the Sets Stepper was replaced in round 10 only as a pad swap.
- Docking the template bar full-bleed above the keyboard: needs ExercisePicker.tsx (hoist pad state) or a BottomSheet footer slot together with PlannedValuesForm.tsx, which is more than one editable file. Parked until it can be split into one-file tasks; likely part of the gym cluster decision.
- Template weight caption is fixed 'Target weight · kg' but the app has a kg/lb SegmentedField, so the caption can contradict the unit. Part of gym cluster decision.
- Template cardio Duration TextField is a boxed field beside four tap-to-edit boxes (two number-entry models in one form). Part of gym cluster decision.
- The four app-only Stepper/SliderField entries (label-scan servings, scan-review weight, new-recipe servings, recipes-log-sheet servings) have no counterpart in the design's bar usage. Leave alone unless their gap rows say the design shows something specific.
- goals.tsx:138 hardcoded help line 'Between 1,200 and 10,000 kcal.' outside i18n, and the code does not enforce that range (onCalories only clamps at zero). Needs a behaviour decision (clamp or reword), so parked. goals.tsx:94 eyebrow 'Daily targets' is also hardcoded.

## Next task
1. After round 14: wire the new addMenu keys into src/app/food/add.tsx (route the three literals back through t()). One file.
2. Then: render the Goals hints ('Set by Lume' / 'Tap to edit', help 'Saved as you type') in src/app/profile/goals.tsx using the new keys. One file.
3. Food - Search: build the design's dedicated search sheet (88% height, pill input, filter chips) or at minimum add an entry param (e.g. ?focus=search) in src/app/(tabs)/food.tsx that autofocuses the existing search field and point the Add sheet's Search foods tile at it. Closes the round 8 half-state. Check the 'Food - Search' row in the gap analysis first. A new route needs layout registration, which may be a second file, so split into one-file tasks (the screen first, then the add.tsx tile).
4. Doc-only: add a summary row for /gym/session to DESIGN_GAP_ANALYSIS.md as BUILT (not verified), round 6 change in one line, do not flip row 76. Best run after Isa answers the cardio question.
5. Then take the remaining non-gym rows in the order that clears the most rows per task. Read the summary table in DESIGN_GAP_ANALYSIS.md for that. Before assigning any row, confirm in the design payload what control it actually uses.
If Isa approves the gym cluster redesign, schedule it as its own tasks (chooser first, then set-row composition). If Isa chooses speed segments, that is a data-model task and may need a backend check, so use action ask again before touching backend.
If no non-gym row can be done as a one-file task and the Goals structural question is still open, use action ask with both open questions (gym cluster, Goals structure) together.

Candidate small tasks afterwards:
- Blinking caret beside the hero figure while a pad is open (Quick add 3x38; Food detail 2x17 on chip and tiles, 3x26 on kcal figure; Gym session value boxes 2x17; color.primary, lumeCaret 1s loop). Needs an Animated loop in NumberEntryBar. Its own task.
- Food detail: decimal macros cannot round-trip a fractional gram (draft() uses num() = Math.round, design stores 1 dp, so 12.4 saves as 12). Save-logic change in detail.tsx, its own task, probably needs a test.
- Food detail remaining composition gaps: no 96x96 photo tile, no AI provenance note, no brand sub-line for logged rows, sheet title is the mode not the food, extra Name field, manual/locked gate the design lacks (pinned by foodDetail.test.ts:137).
- Stale doc sections in DESIGN_GAP_ANALYSIS.md: '## Food - Food detail sheet' (around line 907, verdict still DIFFERENT), '## Food - Quick add' (around line 974, audit table around line 1401) and '## Food - Add sheet' (around line 1037, verdict still DIFFERENT). All contradict their summary rows. Doc-only fix.

## Loop notes
- Round 1: prompt rejected once (more than one screen or component). Retry built the component only.
- Round 1 and 2 reports flagged because jest --findRelatedTests exits 1 when no tests match. Fix: use --passWithNoTests.
- Round 3 report flagged: real failing test, fixed in round 4. Jev said ask 79%, but it was a small test fix, so ran.
- Round 4 clean. Jev run 95%. Round 5 clean. Jev run 96%.
- Round 6: report flagged as partly done (row 76 not flipped, speed vs distance mismatch). Jev ask 85%. Real product/data-model question plus pending gym redesign approval, so asked Isa.
- Round 7: Isa did not answer in time; question parked under Blocked on Isa. Kept run on the independent Food - Add sheet.
- Round 8: clean, Jev run 89%. Chose the gym template bar next because it clears a row.
- Round 9: my prompt named a non-existent screen (logAdjust), so Claude Code correctly made no edit. Jev ask 53% / run 45%, low confidence. Chose run.
- Round 10: first prompt rejected by the loop checker (two component files). Rewrote with one editable file. Landed clean.
- Round 11: my premise was wrong (assumed Goals uses the bar). No edit. Claude Code refused to write a false claim in the gap doc.
- Round 12: Jev run 92%. Chose the Goals borderless calorie figure. It landed.
- Round 13: report slot was empty, re-issued with a no-edit guard. Claude Code confirmed round 12 had landed, made no source edit, marked row 97 built, and found the hint keys missing from en.json.
- Round 14: Jev ask 52% / run 46%, confidence 0.28, risk 1.2 (low confidence). Chose run: a small one-file en.json task unblocks two later one-file tasks and needs nothing from Isa. Did not take Claude Code's macro-bars recommendation because it is a structural Goals change that needs Isa's call. If the next rounds run out of non-gym one-file tasks, ask Isa both open questions together.