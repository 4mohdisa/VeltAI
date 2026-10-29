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
- A component and its application to screens are separate tasks. The loop checker rejects prompts that combine a component with screens.
- When applying the bar changes a control that an existing test pins, updating that test to the new control is a small separate follow-up task (manager may authorise it, no need to ask Isa). Source stays untouched in that task.

## Done
- Round 1: shared component built (now src/components/common/NumberEntryBar.tsx; props: label, value, onChange(text, value), onDone, mode?, maxLength?). Design source: design/Lume App.html (gzip+base64 embedded payloads). The bar appears 4 times identically in the design (Food detail pad, Quick add pad, Gym session pad, Gym template pad).
- Round 2: Food - Quick add (src/app/food/quick-add.tsx) has the bar applied, maxLength 5. Row BUILT (not verified).
- Round 3: Food - Food detail sheet (src/app/food/detail.tsx) has the bar applied to six pads (grams chip, kcal readout, 2x2 macro tile grid; Fibre editable; maxLength 6). Row BUILT (not verified). The app's manual/locked gate (lockValues={!review}, 'Edit values manually') kept because src/__tests__/foodDetail.test.ts:137 pins it.
- Round 4: test src/__tests__/render/foodDetailLogged.render.test.tsx updated to the new tiles/pad. tsc, eslint, jest (35 tests) green.
- Round 5: bar moved/renamed to src/components/common/NumberEntryBar.tsx, imports updated. Pure rename. Green.
- Round 6: bar applied in src/app/gym/session.tsx (the screen that does real exercise logging; NOT log-session.tsx). PADS table with design captions: Weight · kg (decimal), Reps (numeric), Minutes (numeric), maxLength 5. Tappable 40pt value boxes replace the four TextFields; bar docked below Screen in a KeyboardAvoidingView like quick-add; Finish workout footer hides while the bar is open. Save path, state shape, validation untouched. tsc and eslint clean, no jest suite covers the file. Cardio field is 'Distance · km' (decimal), NOT 'Speed · km/h', because session.tsx stores distance (`${dist} km`); the design's speed segments would be a data-model change. Row 76 ('Gym - log session', names log-session.tsx) was NOT flipped to built; its reason line was amended to say only difference 16 is closed, in /gym/session. /gym/session has no row of its own in DESIGN_GAP_ANALYSIS.md.

## In progress
- Round 8: Food - Add sheet (src/app/food/add.tsx, row 'Food - Add sheet'). Prompt sent: add Search foods and My dishes tiles (existing routes only), remove two extra tiles (routes left alone), per-state title, Quick add full-width row, flip row to BUILT (not verified).

## Blocked on Isa
- Asked in round 7, NO ANSWER yet (do not ask again unless every remaining task needs Isa): (1) cardio in gym session: keep 'Distance · km' (no data change) or convert to speed segments (min + km/h, data-model change)? (2) approve starting the gym cluster redesign (plan-aware 'How did it go?' chooser replacing the 4-field questionnaire in log-session.tsx)? Until answered, do neither. If a late answer arrives, treat it as the answer and do that task next.

## Parked (not v1)
- Checked-in extract of the design HTML payloads (or populate empty ds-bundle/components) so design lookups do not repeat gzip/base64 extraction. Tooling, parked unless it blocks work.
- Repo has no prettier config. Never run prettier on files (it reformats to double quotes and 80 columns, against repo style).
- Test harness: src/__tests__/render/setup.ts has no SafeAreaProvider, so any render test touching the bar must wrap its own. Small tooling task, only if a later round hits it again.
- No render test covers quick-add.tsx's or session.tsx's use of the bar.
- Convention note in AGENTS.md on what belongs in src/components/common vs primitives. Doc-only, low priority.
- Gym session set row order: design is [kg] x [reps] with per-set remove x; app renders [reps] [weight] with no remove. Composition work, part of gym cluster decision.
- Cardio with a parameter schema goes through ParameterForm (src/components/gym) with its own boxed inputs; different number-entry model. Part of gym cluster decision.

## Next task
After the Food - Add sheet round (independent of Isa's answers):
1. Gym - template editing (logAdjust): apply NumberEntryBar (design 4th instance, Gym template pad). Bar only, no redesign. Does not depend on the cardio or cluster answer.
2. The four app-only Stepper/SliderField number entries (label-scan servings, scan-review weight, new-recipe servings, recipes-log-sheet servings), one per round.
3. Profile - Goals inline calorie figure.
4. Doc-only: add a summary row for /gym/session to DESIGN_GAP_ANALYSIS.md as BUILT (not verified), round 6 change in one line, do not flip row 76. Best run after Isa answers the cardio question, since the answer may change the row.
If Isa approves the gym cluster redesign, schedule it as its own tasks (chooser first, then set-row composition). If Isa chooses speed segments, that is a data-model task and may need a backend check, so use action ask again before touching backend.

Candidate small tasks afterwards:
- Blinking caret beside the hero figure while a pad is open (Quick add 3x38; Food detail 2x17 on chip and tiles, 3x26 on kcal figure; Gym session value boxes 2x17; color.primary, lumeCaret 1s loop). Needs an Animated loop in NumberEntryBar. Its own task.
- Food detail: decimal macros cannot round-trip a fractional gram (draft() uses num() = Math.round, design stores 1 dp). Save-logic change in detail.tsx, its own task, probably needs a test.
- Food detail remaining composition gaps: no 96x96 photo tile, no AI provenance note, no brand sub-line for logged rows, sheet title is the mode not the food, extra Name field, manual/locked gate the design lacks (pinned by foodDetail.test.ts:137).
- Stale doc sections in DESIGN_GAP_ANALYSIS.md: '## Food - Food detail sheet' (around line 907, verdict still DIFFERENT, contradicts summary row at line 86) and '## Food - Quick add' (around line 974, audit table around line 1401). Doc-only fix.
Then take remaining rows in the order that clears the most rows per task.

## Loop notes
- Round 1: prompt rejected once (more than one screen or component). Retry built the component only.
- Round 1 and 2 reports flagged because jest --findRelatedTests exits 1 when no tests match. Fix: use --passWithNoTests.
- Round 3 report flagged: real failing test, fixed in round 4. Jev said ask 79%, but it was a small test fix, so ran.
- Round 4 clean. Jev run 95%. Round 5 clean. Jev run 96%.
- Round 6: report flagged as partly done (row 76 not flipped, speed vs distance mismatch). Jev ask 85%. Real product/data-model question plus pending gym redesign approval, so asked Isa.
- Round 7: Isa did not answer in time; question parked under Blocked on Isa. Jev put ask at 82%, but I kept run: the loop note says not to re-ask, and independent tasks remain (Food - Add sheet touches only food/add.tsx and does not depend on the cardio or gym cluster answers). Chose the smallest independent surface because Jev's confidence was low and the last task was flagged partly done.
