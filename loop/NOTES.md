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
- Round 42 finding on (d): the no-arg logGymSession() call is in src/app/(tabs)/index.tsx:179 (GymStatusCard onLog), NOT in GymSessionButton.tsx (which only takes onPress; gym.tsx already pushes /gym/log-session). It is protected by DECISIONS.md V16 and by src/__tests__/oneTapGymLog.test.ts. Removing it means no one-tap gym log anywhere. Isa must choose A or B (see Blocked on Isa).

## Prompt rules learned
- One task, max 5 steps, ONE editable source file (checker rejects two). One-line status edit to DESIGN_GAP_ANALYSIS.md allowed alongside, ONE row only. Named en.json key additions tolerated.
- EVERY prompt, including read-only ones, must name design/Lume App.html.
- Testing light: tsc, eslint, jest --findRelatedTests --passWithNoTests on changed files. Never prettier. CHECKED must paste literal exit codes and result lines.
- Never use 'verified' or 'confirmed' about a surface; say BUILT.
- Grep real paths and the real call site before naming files; check git state and the task's premise first (round 42 named the wrong file).
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
- Round 41 (c): log-session.tsx already-logged case toasts gymLog.alreadyLogged (design copy) and routes to /gym/session via openSession(). Row 19 built.

## In progress
- Row 17 (a) celebration card, step 1 of 3: create src/components/gym/CelebrationCard.tsx (presentational, unwired) plus gymLog.celebration keys in en.json. Steps 2 and 3 are wiring into log-session.tsx save() replacing the hardcoded toast.

## Blocked on Isa
- Difference 23 / task (d): (A) route Summary GymStatusCard onLog in src/app/(tabs)/index.tsx to /gym/log-session, delete unused logGymSession import and toast, rewrite V16 comment, update or delete src/__tests__/oneTapGymLog.test.ts (needs its own one-file task per file); or (B) keep the one-tap log and mark row 23 as an accepted deviation (doc-only one-row edit). Asked round 43, still unanswered in round 44.

## Next tasks
1. Row 17 step 2: wire CelebrationCard into src/app/gym/log-session.tsx save(), replacing the hardcoded toast. Single file.
2. Row 17 step 3 is covered by step 2 once the component exists. Do not combine with step 1.
3. Verify premise first: the 3-step food data path (src/lib/food/detailSubject.ts, src/app/(tabs)/food.tsx pick(), src/app/food/detail.tsx search branch). Handover says steps 2 and 3 are pending; notes say macros path is Done. Check git state and grep before any edit. One file per task.
4. If Isa answers B: doc-only task, mark row 23 accepted deviation. If A: three single-file tasks (index.tsx; oneTapGymLog.test.ts; V16 note in DECISIONS.md), each compiling alone.
5. i18n the hardcoded 'Gym logged — streak extended.' toast in src/app/gym/log-session.tsx:108 (moot once row 17 wiring replaces it).
6. Doc-only status sync, ONE row per task: Add sheet, Quick add, /gym/session summary line, row 18 accepted deviation.
7. Checkpoint (full tsc plus jest) when the loop note asks. None has run yet.
8. Food Search 88% sheet (pill input, thumbnails, row metrics, no chips) needs its own plan.
9. Remaining gym rows (template editor etc.) need Isa's approval per item.
10. If nothing non-gym is a one-file task and nothing else is approved, stop: 'only owner decisions remain'.

Small candidates: blinking caret in NumberEntryBar; Food detail fractional macros precision (Math.round in draft()); Food detail composition (96x96 photo, AI note, brand sub-line); accessibilityState on Goals calorie input; hardcoded English accessibilityHints in (tabs)/food.tsx (~761, 844); untranslatable a11y labels in add.tsx:70 and log-session.tsx:155; DetailForm `macros` prop always true (remove prop, own round); shorten gymLog.alreadyLogged to 'edit it or add something extra' if Isa wants; /gym/session opened for an already-logged day shows planned rows, not logged ones (difference 20); duplicated hardcoded toast copy in index.tsx:179 and log-session.tsx:108.

## Parked (not v1)
- Checked-in extract of design payloads (decode via __bundler/manifest JSON in design/Lume App.html, gzip+base64 per entry).
- Render test harness lacks SafeAreaProvider; no render tests on touched screens; no test guards the two-search-logging-paths-same-row invariant.
- Gym items (decide with Isa): set row order with per-set remove; ParameterForm cardio inputs; template editor redesign (Target RPE needs data change); docking template bar; kg/lb field; cardio Duration mixed with tap boxes.
- App-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- Locale drift: es.json/fr.json lack new keys (foodLog.conflict, addMenu keys, gymLog.alreadyLogged, gymLog.celebration); i18n English-only at launch.
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
- Round 42: (d) produced no edit. Claude Code stopped correctly: wrong file named, and the real call site is protected by V16 and a tripwire test. No files changed.
- Round 43: Jev ask 78%. Asked Isa to choose A or B on row 23. Task parked under Blocked on Isa.
- Round 44: Handover received (branch clean at 1b8ab30). Handover conflicts with notes on the food data path; flagged as Next task 3. Chose row 17 step 1 (approved in round 39, independent of row 23). Jev ask 72% on row 23 noted, not acted on. Row 17 now IN PROGRESS.