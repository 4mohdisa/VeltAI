# Lume Loop Notes

## Goal
Match every UI surface to design/Lume App.html through the 41 rows of DESIGN_GAP_ANALYSIS.md. Isa verifies the UI himself. Branch loop/design-match only. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe.
- Onboarding behaviour is stabilised; do not change it.
- v1 scope is locked; extra ideas go to Parked.
- design/Lume App.html is the source of truth for the UI.
- The gap analysis is authoritative; earlier verification reports are not.
- 7-day free trial, $49.99 per year, $8.99 per month, no card up front.
- Isa round 24: cardio stays 'Distance km'; no food search filter chips; Goals structure as built (rows 76, 78, 97 are accepted deviations).
- Isa round 39: approved (a) celebration card; (b) drop the Logged-and-locked edit cycle (row 18 accepted deviation); (c) already-logged routes into the day; (d) Summary card must not call logGymSession() with no arguments (see Blocked); (e) food detail search shows macros.

## Prompt rules
- One task, one editable source file. A one-line status edit to DESIGN_GAP_ANALYSIS.md is allowed, one row only.
- Every prompt names design/Lume App.html and branch loop/design-match.
- Tests: tsc, eslint and jest --findRelatedTests on changed files only. No prettier. Full suite only at checkpoints.
- Say BUILT, never 'verified' or 'confirmed'.
- Design payload: if /tmp/lume-design is missing, decode the __bundler/manifest JSON in design/Lume App.html (gzip+base64 per entry). Plain grep misses payload text.
- Locales: src/lib/i18n/locales/en.json.

## Done (BUILT, not verified)
- Shared NumberEntryBar used in food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search tile routes to food tab with focus=search.
- Goals: borderless calorie input, hints, elevated card.
- Gym 'How did it go?' chooser in log-session.tsx; session modes adjust / ticklist / picker. Adjust and ticklist start checked, so backing out shows 'Save progress?'.
- Row 19: already-logged case routes to /gym/session.
- Row 17 step 1: src/components/gym/CelebrationCard.tsx created, not wired.

## In progress
- Row 17 step 2 (round 46): wire CelebrationCard into save() in src/app/gym/log-session.tsx, replacing the hardcoded toast, with a modal scrim. The round 45 prompt was rejected before it ran (no branch rule), so step 2 has not started.
- Row 17 step 3: optional footnote prop ('Push logged - streak extended') on CelebrationCard.tsx. Own task after step 2.

## Blocked on Isa
- Row 23 / task (d). Option A: route the Summary GymStatusCard onLog in src/app/(tabs)/index.tsx:179 to log-session, remove the no-arg logGymSession call and toast, update the V16 note and src/__tests__/oneTapGymLog.test.ts (one file per task). Option B: keep the one-tap log and mark row 23 an accepted deviation (doc-only). Asked round 43, unanswered. Do not act.

## Next tasks
1. Row 17 step 2 (in progress).
2. Row 17 step 3: footnote prop on CelebrationCard.tsx.
3. Food data path, one file per task. Step 1 done (src/lib/food/detailSubject.ts). Step 2: src/app/(tabs)/food.tsx pick() passes proteinPer100, carbsPer100, fatPer100. Step 3: src/app/food/detail.tsx search branch replaces hardcoded zeros, fixes the stale comment near lines 169-170, shows macros.
4. If Isa answers A: three single-file tasks (index.tsx, oneTapGymLog.test.ts, V16 note in DECISIONS.md). If B: doc-only row 23 edit.
5. i18n the hardcoded toast copy (log-session.tsx and index.tsx), once row 17 step 2 removes the first.
6. Doc-only status sync, one row per task: Add sheet, Quick add, /gym/session summary line, row 18 accepted deviation.
7. Checkpoint (full tsc and jest, baseline 65 suites / 823 tests) only when the loop note asks.
8. Food Search sheet (pill input, thumbnails, row metrics, no chips): needs a plan first.
9. Remaining gym rows: Isa approval per item.
10. If no non-gym one-file task remains and nothing is approved, stop: 'only owner decisions remain'.

## Parked (not v1)
- Checked-in extract of design payloads.
- Render test harness lacks SafeAreaProvider; no render tests on touched screens.
- Gym: set row order with per-set remove; ParameterForm cardio inputs; template editor (Target RPE needs a data change); docking template bar; kg/lb field; cardio duration mixed with tap boxes.
- Row 17 differences for Isa to review: uppercase Stat labels (design is sentence case); value-to-label gap 4pt vs 1pt; pill 17/24 vs 15/20; flame pulses while design ring pulses; pop-in animation omitted; hero gap 4pt vs 3pt.
- Possible overflow for long values (52 min / 1,240 / 4,200 kg) in CelebrationCard; check on device.
- mixHex lives in src/components/domain/GymCalendar.tsx; move to a shared design helper.
- App-only Stepper/SliderField entries (label-scan, scan-review, new-recipe, recipes-log-sheet) stay.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- Locale drift: es.json and fr.json lack new keys; English-only at launch.
- CONFLICT_KEYWORDS not type-linked to foodLog.conflict keys.
- Unreferenced addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods.
- router.setParams on food tab rewrites history entry.
- useFoodSearch has no null signal for macros.
- Card variant=elevated adds shadow.sm the design lacks.
- Dev catalog has calories only; macros show 0 in dev search.
- Small: blinking caret in NumberEntryBar; Math.round in food detail draft(); food detail composition; accessibilityState on Goals calorie input; hardcoded English accessibilityHints in food.tsx (~761, 844); a11y labels at add.tsx:70 and log-session.tsx:155; DetailForm macros prop always true; /gym/session shows planned rows, not logged rows (difference 20).

## Loop notes
- Rounds 1-39: early rejections; data path, i18n and (a)-(e) decisions handled.
- Round 42: (d) produced no edit; wrong file named, real call site protected by V16 and a test. No files changed.
- Round 43: Jev ask 78%; asked Isa on row 23; still unanswered.
- Round 44: row 17 step 1 landed, flagged as partial.
- Round 45: step 2 prompt rejected before running (missing branch rule). Row 23 still awaits Isa.
- Round 46: step 2 re-issued with the branch rule and file limits.
