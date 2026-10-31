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

## Status
- R213: doc-only row 85 summary rewrite (lines 895-900); CaloriesCard citation food.tsx:660-703. tsc exit 0. Tests not run (doc-only).
- R209: checkpoint clean. App 65/65 suites, 824/824 tests.
- R207: row 85 macro bars built in CaloriesCard (6px ProgressBars from useGoals()). BUILT, not verified.
- Row 85 still DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill animation.
- Row 86 food detail: BUILT, not verified.
- Row 87 Quick add: still DIFFERENT.
- R214 (now): flagged report from R213. Confirm tsc green and fix the 'no goal' wording in row 85.

## Next (in order)
1. R214: fix row 85 'no goal' wording (opening sentence and differences item 2), tsc only.
2. Row 85 calorie bar and 'left today': Blocked on Isa.
3. Row 87 Quick add: re-check copy and layout against design/ before building.
4. food/detail.tsx: requeue only if a re-check finds a real difference.
5. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each first.
6. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
7. food.rowAnalysing 'Analysing photo': design question, do not build.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85 12px calorie bar and 'left today'.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 four-column wrap (es 'Carbohidratos'); row 85 macro bars on device.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es and fr drafts (es macro P/C/G; fr P/G/L).
- Design questions: food.title shared; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; energy unit kJ at food.tsx:912; sheet title shows mode, not food name.
- TestPG_* backend tests (18 skipped): run against Postgres?

## Parked
- English helpers; hardcoded month, weekday, Today, Yesterday, plurals; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit.
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- Hardcoded: quick-add.tsx:73 'Quick add'; NumberEntryBar.tsx:108 'Done'; scan.ts:305 'Scan failed'.
- Copy: food.rowAnalysing; food.deleteItem; foodLog.per100 '/ 100g' vs '/ 100 g'; CaloriesCard hardcoded g unit (food.tsx:696); raw energyUnit on logged rows; 'Check your connection' (food.searchFailed, food.loadFailed).
- Missing: 700ms bar fill animation; 'Updated {name}' toast; foodLog.savedAdded toast.
- Doc: stale line refs; hero wording at lines 895-896 (kcalToDisplay); line 934 and item 6 state facts in differences; 'Save to my foods' vs dishes (line 1020); line 1058 vs row 87.
- Comment food.tsx:656-659 cites UI_PASS_GAPS.md section 2, unconfirmed.
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
- Every prompt states the branch rule.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.

## Handover
Last handover after R210. Next due R225.

## Jev log
- R201-R213: run kept; no owner input needed. R212 rejected for missing branch rule; rewritten as R213.
- R214: Jev run 66%, ask 31%, stop 3%; risk 1.1. Run kept: the flagged report needs a tsc check, which needs no owner input.