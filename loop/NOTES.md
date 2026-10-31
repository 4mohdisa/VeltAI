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
- Rows with no fibre figure add 0; column always shows. Macro bars: 6px ProgressBars, zero-target guard.
- Design wins on zero-kcal confirm state (row 87 item e).
- Checkpoint rounds read-only. Doc-only rounds run tsc only and report its exit code.
- Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html (bundle 71f71ac4), the gap row, and the branch rule.
- SegmentedField.tsx is shared. Compact branch used only by quick-add (quick-add.tsx:190). R221: no chip padding, no label shrink, 44pt min height kept.

## Status
- R223 (now): doc-only. Row 87 padding and label shrink marked BUILT, not verified. tsc only.
- R222 checkpoint clean: tsc 0; app 65/65 suites, 824/824.
- R221: row 87 chip padding and label shrink BUILT, not verified. No test covers SegmentedField compact.
- R218-R219: row 87 items (c), (d), (e) BUILT in quick-add.tsx; doc fix.
- R207: row 85 macro bars BUILT. Row 86 food detail BUILT. Neither verified.
- Row 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- Row 87 DIFFERENT: 180ms Meal chip transition missing; one-line labels may truncate 'Petit-dejeuner' (device check).

## Next (in order)
1. R223: doc-only, row 87 as above. Grep for text, not line numbers.
2. Row 85 calorie bar and 'left today': Blocked on Isa.
3. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each against its design/ file first.
4. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
5. Doc fixes (Parked, Doc) only when no build row is open.
6. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85: 12px calorie bar; 'left today'; four-column wrap (es 'Carbohidratos').
- Row 87: confirm label 17/24 vs 17/22; bottom spacing 20pt + safe area vs 34pt; figure and meal defaults; 180ms transition (build or drop); chip truncation at 44pt incl. French.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 macro bars.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es and fr drafts (es macro P/C/G; fr P/G/L).
- Design questions: food.title shared; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; 'for {n} g'; sheet title as mode or food name; gymLog calories key; energy unit kJ at food.tsx:912; disc glyph strokes.
- TestPG_* backend tests (18 skipped): run against Postgres?

## Parked
- English helpers; hardcoded month, weekday, Today, Yesterday, plurals; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- Hardcoded: quick-add.tsx:73 'Quick add'; NumberEntryBar.tsx:108 'Done'; scan.ts:305 'Scan failed'; SheetContent.tsx:77 'Close'.
- Copy: foodLog.per100 '/ 100g'; CaloriesCard hardcoded g; raw energyUnit on logged rows; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 700ms bar fill; 'Updated {name}' toast; foodLog.savedAdded toast; 180ms Meal chip transition.
- Layout: quick-add KeyboardAvoidingView inside fitToContents sheet, not checked on device.
- Doc: lines 895-897 stale three-column wording; line 930 and 934 state facts; line 1017 'Save to my foods'; line 1058 contradicts row 87; line 1502 'line 86' label; 'Still open' list stale; quick-add.tsx:125 citation.
- Comment food.tsx:656-659 cites UI_PASS_GAPS.md section 2, unconfirmed.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint in es.
- SLOT_KEYS duplicated in food.tsx, add.tsx, quick-add.tsx, detail.tsx.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Tests: no test covers CaloriesCard, quick-add render, or SegmentedField compact.

## Accepted limits
Failure paths untested. Keyboard-overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist).
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- detail.tsx strings already translated; do not requeue.

## Handover
Last after R210. Next due R225.

## Jev log
- R201-R218: run kept.
- R219-R222: Jev asked or stopped on some rounds; run kept with concrete reasons (flagged reports, checkpoint).
- R223: Jev run 84%. Agreed.