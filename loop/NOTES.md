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
- Gym logging redesign APPROVED by Isa: plan-aware 'How did it go?' chooser replaces the 4-field questionnaire.
- Isa round 24: cardio in a gym session stays 'Distance km'. Do NOT build Food search filter chips. Goals structure stays as built. Goals rows 76, 78, 97 stay DIFFERENT as accepted deviations.
- Isa round 39: approved (a) celebration card (streak hero, Time / Calories / Volume, black 'Nice one' pill); (b) drop 'Logged and locked' edit cycle; (c) already-logged routes into the day; (d) Summary card must not call logGymSession() with no arguments; (e) Food detail search macros shown.
- Reading of (b): the locked/Edit cycle exists only in the design, not the app. Do not build it. Row/difference 18 stays DIFFERENT as an accepted deviation. Nothing to delete.

## Prompt rules learned
- One task, max 5 steps, ONE editable source file (checker rejects two). One-line status edit to DESIGN_GAP_ANALYSIS.md allowed alongside, ONE row only. Named en.json key additions tolerated.
- EVERY prompt, including read-only ones, must name design/Lume App.html.
- Testing light: tsc, eslint, jest --findRelatedTests --passWithNoTests on changed files. Never prettier. CHECKED must paste literal exit codes and result lines.
- Never use 'verified' or 'confirmed' about a surface; say BUILT.
- Grep real paths before naming files; check git state and the task's premise first.
- Locales: src/lib/i18n/locales/en.json (es.json, fr.json beside it).
- eslint react-hooks/set-state-in-effect: derive state, do not seed in effects.
- Checkpoint rounds only when the loop note says so: full tsc plus full jest (baseline 65 suites / 823 tests), no file changes.
- Multi-file data paths: one task per file, each compiling alone.
- After a handover, name files fully.

## Done (all BUILT, not verified)
- Shared NumberEntryBar applied in food quick-add, food detail, gym session, gym PlannedValuesForm.
- Food Add sheet chooser (strings in addMenu keys); Search tile routes to food tab with focus=search.
- Food search macros path closed end to end; detail search branch shows macros; conflict toasts i18n'd.
- Goals: borderless calorie input, hints, white card.
- Gym log-session chooser (adjust / ticklist / picker modes to gym/session.tsx). Tell Isa: in adjust and ticklist rows start checked, so backing out untouched offers 'Save progress?'.
- Round 41 (c): log-session.tsx already-logged case toasts gymLog.alreadyLogged (design copy) and routes to /gym/session via openSession(). tsc 0, eslint 0, jest none related. Row 19 built.

## In progress
- Round 42: task (d) issued: the file defining GymSessionButton (path found by grep) navigates to /gym/log-session instead of calling logGymSession() with no arguments (gap row 23). One-row Built: line. Awaiting report.

## Blocked on Isa
- (none)

## Next tasks
1. (a) celebration card (row 17): new component file first, then a separate task wiring it into log-session.tsx save() replacing the hardcoded 'Gym logged — streak extended.' toast.
2. Doc-only status sync, ONE row per task: Add sheet, Quick add, /gym/session summary line, row 18 accepted deviation.
3. Checkpoint (full tsc plus jest) when the loop note asks. None has run yet.
4. Food Search 88% sheet (pill input, thumbnails, row metrics, no chips) needs its own plan.
5. Remaining gym rows (template editor etc.) need Isa's approval per item.
6. If nothing non-gym is a one-file task and nothing else is approved, stop: 'only owner decisions remain'.

Small candidates: blinking caret in NumberEntryBar; Food detail fractional macros precision (Math.round in draft()); Food detail composition (96x96 photo, AI note, brand sub-line); accessibilityState on Goals calorie input; hardcoded English accessibilityHints in (tabs)/food.tsx (~761, 844); untranslatable a11y labels in add.tsx:70 and log-session.tsx:155; DetailForm `macros` prop always true (remove prop, own round); shorten gymLog.alreadyLogged to 'edit it or add something extra' if Isa wants; /gym/session opened for an already-logged day shows planned rows, not logged ones (difference 20).

## Parked (not v1)
- Checked-in extract of design payloads (decode via __bundler/manifest JSON in design/Lume App.html, gzip+base64 per entry).
- Render test harness lacks SafeAreaProvider; no render tests on touched screens; no test guards the two-search-logging-paths-same-row invariant.
- Gym items (decide with Isa): set row order with per-set remove; ParameterForm cardio inputs; template editor redesign (Target RPE needs data change); docking template bar; kg/lb field; cardio Duration mixed with tap boxes.
- App-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- Locale drift: es.json/fr.json lack new keys; i18n English-only at launch.
- CONFLICT_KEYWORDS and foodLog.conflict keys not type-linked.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods.
- router.setParams on food tab rewrites history entry.
- useFoodSearch macros have no null signal.
- Card variant=elevated adds shadow.sm the design lacks.
- Dev catalog has calories only; macros show 0 in dev search.

## Loop notes
- Rounds 1-37: early rejections, then clean landings; data path and i18n tasks closed; round 37 multi-surface doc prompt rejected.
- Round 38-39: Isa answered yes to a-e; (e) landed.
- Round 40: (b) produced no edit, inverted premise.
- Round 41: (c) landed cleanly despite Jev leaning ask; no open decision existed.
- Round 42: Jev run 69%. Path of GymSessionButton file unknown to manager, so prompt tells Claude Code to grep and edit only that file.