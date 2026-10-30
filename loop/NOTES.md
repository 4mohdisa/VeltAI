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
- Round 48 (manager default): a derived gym duration is logged when above 0. A derived 0 is sent as undefined, never 0. Implemented in log-session.tsx save().
- Round 49 (manager default): keep ?? for the template estimate as written. The || fallback is parked for Isa.

## Prompt rules
- One task, one editable source file. A one-line status edit to DESIGN_GAP_ANALYSIS.md is allowed, one row only.
- Every prompt names design/Lume App.html and branch loop/design-match.
- Tests: tsc, eslint and jest --findRelatedTests on changed files only. No prettier. Full suite only at checkpoints.
- Say BUILT, never 'verified' or 'confirmed'.
- Design payload: if /tmp/lume-design is missing, decode the __bundler/manifest JSON in design/Lume App.html (gzip+base64 per entry). Plain grep misses payload text.
- Locales: src/lib/i18n/locales/en.json.
- Note: `npx jest --findRelatedTests` finds no tests for screen files. Name the test file explicitly when one exists.

## Done (BUILT, not verified)
- Shared NumberEntryBar used in food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search tile routes to food tab with focus=search.
- Goals: borderless calorie input, hints, elevated card.
- Gym 'How did it go?' chooser in log-session.tsx; session modes adjust / ticklist / picker. Adjust and ticklist start checked, so backing out shows 'Save progress?'.
- Row 19: already-logged case routes to /gym/session.
- Row 17 step 1: src/components/gym/CelebrationCard.tsx created.
- Row 17 step 2 (round 46): save() opens CelebrationCard in a transparent Modal over color.overlay instead of the toast. Calories shows a dash (see Blocked).
- Round 48: save() sends durationMin undefined when the derived duration is 0 or less. Above 0 is sent as before. Built, not run on device.
- Round 47: src/__tests__/gymDurationHonesty.test.ts repaired and passing before round 48. Source-text checks only.

## In progress
- Round 49: src/__tests__/gymDurationHonesty.test.ts assertion replaced to match save() (one file). Stale comment deleted. Title rename still pending.
- Data path step 2 and step 3 still pending (see Next tasks).

## Blocked on Isa
- Row 23 / task (d). Option A: route the Summary GymStatusCard onLog in src/app/(tabs)/index.tsx:179 to log-session, remove the no-arg logGymSession call and toast, update the V16 note and src/__tests__/oneTapGymLog.test.ts (one file per task). Option B: keep the one-tap log and mark row 23 an accepted deviation (doc-only). Asked round 43, unanswered. Do not act.
- Row 17 calories: design uses 5.5 MET x body weight x hours; no body weight on this screen. Currently shows a dash. Isa to choose: add the formula using profile weight, or accept the dash as a deviation. Do not invent a number.
- Round 49 question for Isa (parked, not asked yet): when a template's estimate is exactly 0 and planMinutes is above 0, ?? keeps 0 and no duration is logged. Use || as the fallback? Ask only in a later round, if still unresolved.

## Next tasks
1. Rename the stale test title in gymDurationHonesty.test.ts ('starts at Not set and sends nothing') to match behaviour (one file).
2. Fix src/__tests__/sheetVariant.test.ts stale assertion for the save() wiring (it still expects Button title 'Log session' onPress={save}). One file.
3. Row 17 step 3: footnote prop ('Push logged - streak extended') on src/components/gym/CelebrationCard.tsx.
4. Row 17 display fix: Time value on the celebration card shows 0 min for an empty plan. Use a dash to match Calories, one file (CelebrationCard.tsx or the card's call site in log-session.tsx, whichever holds the value).
5. Food data path, one file per task. Step 1 done (src/lib/food/detailSubject.ts). Step 2: src/app/(tabs)/food.tsx pick() passes proteinPer100, carbsPer100, fatPer100. Step 3: src/app/food/detail.tsx search branch replaces hardcoded zeros, fixes the stale comment near lines 169-170, shows macros.
6. If Isa answers A on row 23: three single-file tasks (index.tsx, oneTapGymLog.test.ts, V16 note in DECISIONS.md). If B: doc-only row 23 edit.
7. i18n the hardcoded toast copy in index.tsx and any remaining in log-session.tsx.
8. Doc-only status sync, one row per task: Add sheet, Quick add, /gym/session summary line, row 18 accepted deviation.
9. Checkpoint (full tsc and jest, baseline 65 suites / 823 tests) only when the loop note asks.
10. Food Search sheet (pill input, thumbnails, row metrics, no chips): needs a plan first.
11. Remaining gym rows: Isa approval per item.
12. If no non-gym one-file task remains and nothing is approved, stop: 'only owner decisions remain'.

## Parked (not v1)
- Checked-in extract of design payloads.
- Render test harness lacks SafeAreaProvider; no render tests on touched screens.
- Gym: set row order with per-set remove; ParameterForm cardio inputs; template editor (Target RPE needs a data change); docking template bar; kg/lb field; cardio duration mixed with tap boxes.
- Gym volume shows kg only, even for lb-planned exercises; no weight-unit preference hook found.
- Gym zero volume (cardio-only or no planned weights) shows 0 kg.
- Row 17 bare exit paths: rest-day sheet state and /gym/session logging show no celebration card; design asks for every branch.
- Row 17 differences for Isa to review: uppercase Stat labels (design is sentence case); value-to-label gap 4pt vs 1pt; pill 17/24 vs 15/20; flame pulses while design ring pulses; static ring; pop-in animation omitted; hero gap 4pt vs 3pt.
- Possible overflow for long values in CelebrationCard (about 233pt content in 206pt width; calories dash keeps it in bounds for now); check on device.
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
- Estimated gym duration is logged as duration_minutes and the backend turns it into burned calories. Revisit if Isa wants only measured durations counted.
- Round 49 question: template estimate of 0 with planMinutes above 0 logs no duration under ??. Consider || as fallback (Isa decision).

## Loop notes
- Rounds 1-39: early rejections; data path, i18n and (a)-(e) decisions handled.
- Round 42: (d) produced no edit; wrong file named, real call site protected by V16 and a test. No files changed.
- Round 43: Jev ask 78%; asked Isa on row 23; still unanswered.
- Round 44: row 17 step 1 landed, flagged as partial.
- Round 45: step 2 prompt rejected before running (missing branch rule). Row 23 still awaits Isa.
- Round 46: step 2 built. tsc and eslint exit 0. Two test files failed on stale source text.
- Round 47: gymDurationHonesty.test.ts repaired and passing; tsc exit 0.
- Round 48: save() zero-duration change built. tsc and eslint exit 0. Broke gymDurationHonesty.test.ts (exact-text assertion). Loop check flagged the report as red.
- Round 49 (this round): repair the gymDurationHonesty assertion. Gate must be green before the next task.
