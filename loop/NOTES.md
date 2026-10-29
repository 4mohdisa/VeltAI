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
- Testing is light: type check plus tests for changed files only. Isa verifies the UI.
- Code must be clean: reuse tokens and shared components, no dead code or debug leftovers.
- A component and its application to screens are separate tasks. The loop checker rejects prompts that combine a component with screens.
- When applying the bar changes a control that an existing test pins, updating that test to the new control is a small separate follow-up task (manager may authorise it, no need to ask Isa). Source stays untouched in that task.

## Done
- Round 1: shared component src/components/food/FoodNumberEntryBar.tsx built (props: label, value, onChange(text, value), onDone, mode?, maxLength?). tsc and eslint clean. No tests exist for it. Design source: design/Lume App.html (gzip+base64 embedded payloads). The bar appears 4 times identically in the design (Food detail pad, Quick add pad, Gym session pad, Gym template pad).
- Round 2: Food - Quick add (src/app/food/quick-add.tsx) has the bar applied, maxLength 5 added to match design. tsc pass. Row marked BUILT (not verified).
- Round 3: Food - Food detail sheet (src/app/food/detail.tsx) has the bar applied to six pads (PADS table, editing/entry state, grams chip, kcal readout, 2x2 macro tile grid; Fibre now editable; all pads use the bar's default maxLength 6 because the design caps all six at 6). Row marked BUILT (not verified). tsc pass, eslint clean. REAL test failure: src/__tests__/render/foodDetailLogged.render.test.tsx line 36 pins the removed 'Protein (g)' TextField. Flag was legitimate this time. The app's manual/locked gate (lockValues={!review}, 'Edit values manually') was kept because src/__tests__/foodDetail.test.ts:137 pins it.

## In progress
- Round 4: prompt sent to update the existing test `the numbers read as values...` in src/__tests__/render/foodDetailLogged.render.test.tsx to the new tiles/pad (test file only, source untouched). Run tsc plus jest on that file and foodDetail.test.ts. Awaiting report.

## Blocked on Isa
(nothing yet)

## Parked (not v1)
- Checked-in extract of the design HTML payloads (or populate the empty ds-bundle/components) so design lookups do not repeat the gzip/base64 extraction. Tooling, not a UI row, so parked unless it blocks work.
- Repo has no prettier config. Never run prettier on files (it reformats to double quotes and 80 columns, against repo style).

## Next task
Apply FoodNumberEntryBar one surface per round, in this order:
1. Food - Quick add (done)
2. Food - Food detail sheet (built, test fix in round 4)
3. Before any gym round: move/rename FoodNumberEntryBar to a neutral shared location (it is used on Gym too), update barrel/imports. Its own small task.
4. Gym - log session (Weight kg decimal, Reps, Minutes, Speed km/h decimal, maxLength 5). NOTE: gym surfaces touch the gym cluster. The bar application alone is allowed, but the plan-aware 'How did it go?' chooser redesign is NOT until Isa approves.
5. Gym - template editing (logAdjust)
6. The four app-only Stepper/SliderField number entries (label-scan servings, scan-review weight, new-recipe servings, recipes-log-sheet servings)
7. Profile - Goals inline calorie figure
Mark each row built in DESIGN_GAP_ANALYSIS.md with one line only after the bar is applied on that surface. When every row the bar covers is built, use action ask to let Isa choose whether to start the gym cluster redesign.

After the bar rows, candidate small tasks:
- Food - Add sheet (src/app/food/add.tsx, row 'Food — Add sheet', DIFFERENT): add missing Search foods and My dishes tiles, remove two extra tiles, vary title per design, Quick add as full-width row.
- Blinking caret beside the hero figure while a pad is open (Quick add 3x38; Food detail 2x17 on chip and tiles, 3x26 on kcal figure; color.primary, lumeCaret 1s loop). Needs an Animated loop in FoodNumberEntryBar. Its own task.
- Food detail: decimal macros cannot round-trip a fractional gram (draft() uses num() = Math.round, design stores 1 dp). Save-logic change in detail.tsx, its own task, and probably needs a test update.
- Food detail remaining composition gaps: no 96x96 photo tile, no AI provenance note, no brand sub-line for logged rows, sheet title is the mode not the food, extra Name field, the app's manual/locked gate that the design lacks (pinned by foodDetail.test.ts:137).
- Stale doc sections in DESIGN_GAP_ANALYSIS.md: '## Food — Quick add' (around line 974, audit table around line 1401) and '## Food — Food detail sheet' (line 907, verdict still DIFFERENT, differences 1, 2, 4, 12 now addressed). Doc-only fix, do at a convenient point.
Then take remaining rows in the order that clears the most rows per task.

## Loop notes
- Round 1: prompt rejected once (more than one screen or component). Retry built the component only.
- Round 1 report flagged for 'type check or tests failed or were not run'. tsc clean, no tests exist for the new file.
- Round 2 report flagged again for the same reason. Cause: jest --findRelatedTests exits 1 when no tests match. Fix: use --passWithNoTests from round 3 on.
- Round 3 report flagged: this time a real failing test (see Done). Jev said ask 79%, but this is a small test fix the manager can authorise, so ran instead of asking.
