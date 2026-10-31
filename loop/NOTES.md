# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es and fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Components needing strings call useTranslation().
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key. food.rowAnalysing is shared by pill and VoiceOver (accepted).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Checkpoint rounds are read-only. Doc-only rounds run tsc only.
- Grep before acting; briefs can be stale. Code tidying is never a task.
- Loop flags are cleared by the loop. Every prompt names its design/ file and gap row. Rejected prompts are rewritten, not resent.
- A task flagged twice goes to Blocked on Isa and is not retried.
- Macro bars: follow design (6px) unless Isa excludes them in DECISIONS.md or Telegram. Conflict open.

## Status
- R209: read-only checkpoint (branch check, tsc, app suite). R208 prompt was rejected for no branch rule; rewritten.
- R207: row 85 macro bars built in CaloriesCard (src/app/(tabs)/food.tsx) as 6px ProgressBars from useGoals(). tsc green. Not verified on device.
- Row 85 still DIFFERENT: no calorie bar, no 'left today', no 700ms fill animation (ProgressBar lacks it). Gap doc still says dots.
- Food detail and quick-add strings BUILT. Rows 3, 7, 11, 14, 17 and 87 stay open for layout or mode.

## Next (in order)
1. Report R209 checkpoint. If red, report failures; do not fix in this round.
2. Doc-only: update row 85 in DESIGN_GAP_ANALYSIS.md (dots wording, 'no bars' near 890, Day log differences 7-8 near 935-936) against design 71f71ac4. tsc only.
3. Row 85 calorie bar and 'left today', goal via useGoals. Re-check design first.
4. food/detail.tsx open rows: Add to slot labels; Edit food title and Save changes (reuse food.saveChanges); Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field. Re-check first.
5. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each first.
6. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
7. food.rowAnalysing 'Analysing photo': design question, do not build.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- DESIGN_GAP_ANALYSIS.md 895-897 (three columns to four incl. Fibre). Flagged twice.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 four columns and bars.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of all es and fr drafts.
- Design questions: food.title shared; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; row 86 BUILT vs DIFFERENT; energy unit kJ at food.tsx:912; 6px macro bar exclusion (R205 conflict).

## Parked
- English helpers and hardcoded month, weekday, Today, Yesterday, plurals; formatGrams and formatCalories ignore energy unit; formatNumber fixed en-AU.
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- quick-add.tsx:73 stores 'Quick add'. NumberEntryBar.tsx:108 hardcodes 'Done'.
- Gap doc stale line refs; difference 18 near 1017; review difference 7 near 1009; line 957; line 87.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint in es.
- SLOT_KEYS duplicated in four files. addMenu.addToSlot awkward drafts.
- foodLog.savedAdded has no design toast; 'Updated {name}' toast missing.
- scan.ts:305 'Scan failed' stored as food name.
- gym/new-template.tsx English strings; swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Energy unit: padCalories always kcal; CaloriesCard hardcoded g unit; raw energyUnit on logged rows near 918.
- food.searchFailed and food.loadFailed say 'Check your connection' (assumes a cause).
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18n/index.ts header; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Row 85: no test covers CaloriesCard. Comment cites UI_PASS_GAPS.md section 2, possibly unsupported. ProgressBar has no animation (out of scope).
- Backend TestPG_* skipped (18). Isa to decide.

## Accepted limits
Failure paths untested. Keyboard-overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only; language picker removed (src/lib/i18n/index.ts:41 sets 'en'). quick-add.tsx has no render test.

## Gotchas
- Decode design with node from __bundler/manifest. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; moved literals can break it.
- Claude Code forgets context at handover. Name files fully.

## Handover
Last before R187. Next due R210.

## Jev log
- R201-R208: run picks kept where checkpoints or doc fixes needed no owner input. R208 rejection rewritten as read-only checkpoint.