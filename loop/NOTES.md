# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only (no switch, push or merge). Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Components needing strings call useTranslation().
- Calories VoiceOver reuses gymLog.celebration.calories. food.rowAnalysing shared by pill and VoiceOver (accepted).
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Checkpoint rounds read-only. Doc-only rounds run tsc only.
- Rows with no fibre figure add 0 (matches dashboard/nutrition.tsx); column always shows.
- Macro bars: 6px ProgressBars with zero-target guard.
- Grep before acting. Code tidying is never a task.
- A task flagged twice goes to Blocked on Isa, not retried.
- A prompt that does not name the matching design/ file is rejected. Name it every time.
- Design wins on zero-kcal confirm state (row 87 item e).

## Status
- R218 (now): build row 87 Quick add in src/app/food/quick-add.tsx: pressed opacity to 60%, Meal chip padding and label shrink removed, 180ms background transition, zero-kcal disabled state removed. tsc only. Status stays DIFFERENT, marked 'BUILT, not verified'.
- R217: doc-only re-check of row 87 against design/Lume App.html. Real differences listed (11 items plus 3 additions). Flagged by loop; tsc exit 0 in report.
- R216: flagged again, though tsc exit 0. Line 890 edited. Row 85 doc-wording rounds R213-R216 parked under Blocked on Isa.
- R215: flagged. tsc exit 0.
- R214: flagged, same wording issue. tsc exit 0.
- R213: doc-only row 85 summary rewrite; CaloriesCard citation food.tsx:660-703. tsc exit 0.
- R209: checkpoint clean. App 65/65 suites, 824/824 tests.
- R207: row 85 macro bars built in CaloriesCard (6px ProgressBars from useGoals()). BUILT, not verified.
- Row 85 still DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill animation.
- Row 86 food detail: BUILT, not verified.
- Row 87 Quick add: DIFFERENT. Differences in row 87 now listed (R217). Build of items a-d in progress (R218). Items waiting on Isa stay open.

## Next (in order)
1. R218: row 87 build (pressed states, Meal chip, zero-kcal state), tsc only.
2. Row 87 doc section: bring DESIGN_GAP_ANALYSIS.md lines 1036 and 1055-1063 in line with row 87 status; remove 'The copy is hardcoded English' (wrong). Doc-only, tsc only.
3. Row 85 calorie bar and 'left today': Blocked on Isa.
4. Row 85 doc wording (lines 895-897, 930, 934, 937): parked under Blocked on Isa after two flags.
5. food/detail.tsx: do not requeue unless a re-check finds a real difference.
6. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each first.
7. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
8. food.rowAnalysing 'Analysing photo': design question, do not build.
9. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85 12px calorie bar and 'left today'.
- Row 85 doc wording fixes (lines 895-897, 930, 934, 937). Flagged R214, R215, R216.
- Row 87 confirm label 17/24 vs 17/22 (item 1).
- Row 87 bottom spacing 20pt + safe area vs design 34pt total (item 5): needs device check.
- Row 87 figure keeps last value (item 9) and meal defaults to last used (item 10) vs time-of-day default: design question.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 four-column wrap (es 'Carbohidratos'); row 85 macro bars on device.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es and fr drafts (es macro P/C/G; fr P/G/L).
- Design questions: food.title shared; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; energy unit kJ at food.tsx:912; sheet title shows mode, not food name.
- Disc glyphs: design SVG strokes 2.6 vs SF Symbols (row 87 item 8): design asset decision.
- TestPG_* backend tests (18 skipped): run against Postgres?

## Parked
- English helpers; hardcoded month, weekday, Today, Yesterday, plurals; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit.
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- Hardcoded: quick-add.tsx:73 'Quick add' (saved food name); NumberEntryBar.tsx:108 'Done'; scan.ts:305 'Scan failed'; SheetContent.tsx:77 'Close' (VoiceOver).
- Copy: food.rowAnalysing; food.deleteItem; foodLog.per100 '/ 100g' vs '/ 100 g'; CaloriesCard hardcoded g unit (food.tsx:696); raw energyUnit on logged rows; 'Check your connection' (food.searchFailed, food.loadFailed).
- Missing: 700ms bar fill animation; 'Updated {name}' toast; foodLog.savedAdded toast.
- Row 87 KeyboardAvoidingView (quick-add.tsx:125) inside fitToContents sheet: layout and keyboard offset not checked on device.
- Doc: stale line refs; hero wording at lines 895-896 (kcalToDisplay); line 934 and item 6 state facts in differences; 'Save to my foods' vs dishes (line 1017-1020); line 1058 vs row 87; line 1500 says Quick add has no hero number, discs, presets or keyboard bar and has a Label field: all wrong now.
- Comment food.tsx:656-659 cites UI_PASS_GAPS.md section 2, unconfirmed. Disagrees with doc ('not used yet') until Isa decides on the calorie bar.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint in es.
- SLOT_KEYS duplicated in food.tsx, add.tsx, quick-add.tsx, detail.tsx.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220; English strings in gym/new-template.tsx.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18n/index.ts header; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Row 85: no test covers CaloriesCard.

## Accepted limits
Failure paths untested. Keyboard-overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. quick-add.tsx has no render test.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Food bundle 71f71ac4.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist).
- Every prompt states the branch rule and names the matching design/ file.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Flagged reports: the loop note means the type check or tests were not run or failed. Doc-only and build rounds must include the tsc exit code in the report.
- detail.tsx strings are already translated; several rounds found nothing to do, so do not requeue them.
- No test covers CaloriesCard, the macro line or its VoiceOver label, or renders quick-add.tsx, so passing suites do not prove these.

## Handover
Last handover after R210. Next due R225.

## Jev log
- R201-R213: run kept; no owner input needed. R212 rejected for missing branch rule; rewritten as R213.
- R214: Jev run 66%, ask 31%, stop 3%; risk 1.1. Run kept. Flagged report needs a tsc check, which needs no owner input.
- R215: Jev ask 46%, run 41%, stop 13% (confidence 0.19); risk 1.3. Run kept. Doc-only, tsc only, no owner input needed.
- R216: Jev run 80%, ask 17%, stop 3% (confidence 0.70); risk 1.2. Run kept. Prompt rewritten to name design/Lume App.html, per the loop note rejection.
- R216 (second signal): Jev run 55%, ask 43%, stop 2% (confidence 0.33); risk 1.2. Run kept. Flagged twice on row 85 wording, so moved to row 87 re-check.
- R218: Jev ask 48%, run 47%, stop 5% (confidence 0.22); risk 1.6; last task clean 66%. Run kept. Row 87 build needs no owner input; the flagged report is answered by an explicit tsc exit code. The ask-side items are left in Blocked on Isa, not asked this round.