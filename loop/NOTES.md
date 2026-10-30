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
- Isa round 39 (reply to batched question): a YES, b YES, c YES, d YES, e YES. All five approved: (a) log-session celebration card (streak hero, Time / Calories / Volume, black 'Nice one' pill); (b) drop the 'Logged and locked' edit cycle; (c) already-logged routes into the day instead of dismissing; (d) Summary card calls logGymSession() with no arguments, handle that third entry point; (e) Food detail search branch macros shown plus stale kcal-only copy removed.

## Prompt rules learned
- One task, max 5 steps, exactly ONE editable source file named (the checker rejects two). A one-line status edit to DESIGN_GAP_ANALYSIS.md is accepted alongside it. An en.json key addition or value edit is tolerated when named explicitly.
- A doc-only status edit must touch ONE row only. The round 37 prompt covered several surfaces and was rejected as 'more than one screen or component'.
- EVERY prompt, including read-only checkpoint prompts, must name design/Lume App.html.
- Testing is light: tsc plus eslint plus jest --findRelatedTests --passWithNoTests on changed files. Never run prettier.
- CHECKED must paste literal exit codes and result lines for tsc, eslint and jest, or the auto-checker flags the report.
- Never let reports or prompts use the words 'verified' or 'confirmed' about a surface: the auto-checker flags it. Say BUILT / built, not verified.
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
- Search macros path CLOSED: detailSubject.ts optional macro fields (1b8ab30); (tabs)/food.tsx pick() passes per-100 g macros; food/detail.tsx search branch seed and per100 use them with `?? 0`; (tabs)/food.tsx quickAdd (+ disc) logs rounded macros at 100 g, same row as the detail sheet.
- Round 35 (tsc 0, eslint 0, jest none related): (tabs)/food.tsx warnConflict toast and accessibilityHint use t(`foodLog.conflict.${conflict}`); en.json has foodLog.conflict halal / vegan / vegetarian / gluten_free.
- Round 36 (tsc 0, eslint 0, jest none related): food/add.tsx strings moved to en.json addMenu keys and wired with t().
- Round 39 task (e) (tsc 0, eslint 0, jest 1 suite / 4 tests pass): food/detail.tsx search branch now shows macros; kcal-only empty-state text and stale comments removed; one Built: line added to the Food detail section of DESIGN_GAP_ANALYSIS.md. en.json not touched (string was inline JSX).

## In progress
- Round 40: task (b) issued: src/app/gym/log-session.tsx remove the 'Logged and locked' edit cycle (gap row 18), delete en.json gymLog keys only if used solely by the deleted code, one-row Built: line in DESIGN_GAP_ANALYSIS.md. Already-logged routing is NOT touched (that is task c). Awaiting report.

## Blocked on Isa
- (none)

## Next tasks (Isa approved a-d, one file per task, each with a one-row doc edit at most)
1. (c) log-session.tsx: already-logged routes into the day instead of dismissing (gap row 19).
2. (a) celebration card (gap row 17): streak hero, Time / Calories / Volume, black 'Nice one' pill. Prefer a new component file plus a separate task to wire it into log-session.tsx (new file compiling on its own first).
3. (d) gym Summary card calls logGymSession() with no arguments (gap row 23): grep for the file first, one-file task.
4. Then the doc-only status sync, ONE row per task: Add sheet row built, Quick add row built, /gym/session summary line.
5. Checkpoint (full tsc plus full jest) when the loop note asks. No checkpoint result exists yet.
6. Food Search 88% sheet (pill input, thumbnails, row metrics, no filter chips) needs its own plan before any task.
7. Remaining gym cluster rows (template editor etc.) need Isa's approval per item.
8. If nothing non-gym is a one-file task and nothing else is approved, stop with reason 'only owner decisions remain'.

Small candidates: blinking caret in NumberEntryBar; Food detail fractional macros lose precision (Math.round in draft()); Food detail composition gaps (96x96 photo, AI note, brand sub-line); accessibilityState disabled on the Goals calorie input; hardcoded English accessibilityHint strings in (tabs)/food.tsx (~lines 761, 844); add.tsx:70 accessibility label `${m.label}. ${m.description}` does not translate; food/detail.tsx DetailForm `macros` prop is now always true at all four call sites (remove the prop and both conditionals, needs re-indenting, own round).

## Parked (not v1)
- Checked-in extract of the design payloads (decode via __bundler/manifest JSON in design/Lume App.html, gzip+base64 per entry).
- Render test harness lacks SafeAreaProvider. No render tests cover quick-add, session, PlannedValuesForm, log-session, the search disc, the focus-param clear, the session mode param or the Food detail search branch. No test guards the two-search-logging-paths-write-the-same-row invariant.
- Gym items (decide with Isa): set row order with per-set remove; ParameterForm cardio inputs; template editor redesign (Target RPE needs a data change); docking the template bar full-bleed; kg/lb field; cardio Duration mixed with tap boxes.
- Four app-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay as is.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets' eyebrow.
- Locale drift: es.json and fr.json lack new keys (gymLog, foodLog.conflict, addMenu round 36 keys). i18n is English-only at launch (src/lib/i18n/index.ts:39).
- CONFLICT_KEYWORDS and foodLog.conflict keys are not type-linked: adding dairy_free to keywords would show a raw key.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods. Remove after checking zero usage.
- router.setParams on the food tab rewrites its history entry.
- useFoodSearch macros have no null signal: unknown is indistinguishable from zero.
- Card variant="elevated" adds shadow.sm the design lacks (repo's established mapping).
- Dev catalog carries calories only, so macro fixes are a no-op in dev (src/lib/mock/data.ts); macros will show 0 in dev for search results.

## Loop notes
- Rounds 1-29: early rejections (two files, missing design file) then clean landings for rounds 16-28. Round 29 checkpoint prompt was rejected, no checkpoint ran.
- Round 30: detail.tsx task blocked, no edit, because the data never reached the file.
- Round 31: detailSubject.ts landed (1b8ab30). Handover happened after it.
- Rounds 32-34: macro data path landed cleanly, closed.
- Round 35: i18n of warnConflict landed cleanly.
- Round 36: add.tsx i18n landed cleanly.
- Round 37: doc-only status-sync prompt rejected as multi-surface; no edit landed.
- Round 38: asked Isa the batched question.
- Round 39: Isa answered yes to a-e. Task (e) landed cleanly.
- Round 40: Jev run 74%, last-clean 95%, risk 1.1. Chose run with (b), smallest of the log-session.tsx tasks.