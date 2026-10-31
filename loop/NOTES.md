# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Components needing strings call useTranslation(). PADS holds labelKey; translate at render.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git and name the branch.
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key. food.rowAnalysing shared by pill and VoiceOver (accepted).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting; they can be stale.
- Code tidying (SLOT_KEYS dedupe, comments, test wording) is never a task; it goes to Parked.
- Loop flags are cleared by the loop, not by Claude Code.
- Every prompt must name the matching design/ file and the gap row. Rejected prompts are rewritten, not resent.
- Tasks must be gap-doc rows. Non-row items are not picked over row work.
- R205: macro bars excluded by Isa per R204 report, not in DECISIONS.md; conflict open. Calorie goal bar follows design (goal read via useGoals) once bars question settled.

## Status
- Checkpoint R200 green: 824 app tests, 65 suites; backend 614 pass, 18 skip; tsc 0. Next full checkpoint R210.
- R201-R203: row 85 partly built (rounded macro line, food.gramsUnit in VoiceOver label). BUILT, not verified.
- R204: row 85 Fibre column added (summed from logged rows, 0 when absent). BUILT, not verified. Row 85 still DIFFERENT: dots not 6px bars; no 12px calorie bar; no 'left today'.
- R205: flagged R204 report dealt with via doc-only correction of stale lines (row 85 opening sentence and the 'Three macro columns' line).

## Next (in order)
1. Row 85 macro bars: resolve Isa's exclusion conflict. If still open after one more check, ask Isa once (Telegram). Otherwise build 6px bars replacing dots.
2. Row 85 calorie progress bar (12px vs goal) and 'left today' figure, reading goal via useGoals (src/lib/data/hooks.ts:366). Re-check design 71f71ac4 first.
3. food.rowAnalysing 'Analysing photo': blocked on design question, do not build.
4. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each row first.
5. food/detail.tsx rows still open: Add to slot labels (168, 225), Edit food title and Save changes (259-260, reuse food.saveChanges), Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field. Re-check first.
6. nutrition, week, training, energy copy; food/new-recipe.tsx rest of screen; PlannedValuesForm 'Add exercise'.
7. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt width; long es/fr text; pending row; saved-mode removal; PADS captions; quick-add, meal chips, Save buttons fit; formatCalories on device; row 85 label and four-column wrap on device; long labels (Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications).
- Native review: all es and fr drafts; 'Guardado'; 'Enregistre' gender; 'Taille de la portion'; quick-add toasts; 'Snacks' left English; addMenu.addToSlot drafts; 'Anadir' wording; fr G for carbs (row 85).
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; extra es keys addMenu.voice and addMenu.describeOutLoud; gap item 11 macro layout; row 86 BUILT vs DIFFERENT verdict; foodLog.addedToMeal gender in toasts; foodLog.per100 '/ 100g' vs '/ 100 g'; Day log macro spacing; energy unit (kJ) for food.tsx:912; 6px macro bars excluded by Isa (conflict with notes, R205).

## Parked (merged)
- English helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration, formatStreak; hardcoded Today, Yesterday, month and weekday names; plurals. formatGrams and formatCalories ignore energy unit; formatNumber fixed to en-AU; formatMacro has no callers.
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only (backend).
- quick-add.tsx:73 stores 'Quick add' as row name (saved data). NumberEntryBar.tsx:108 hardcodes 'Done'.
- Gap doc: difference 18 near 1017 still says 'Save to my foods'; review difference 7 near 1009; line 1058 stale bullet; line 87 still says copy hardcoded; stale line refs; stale line 957 and item 18.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint reads badly in es.
- SLOT_KEYS duplicated in four files (food.tsx, add.tsx, quick-add.tsx, detail.tsx). addMenu.addToSlot awkward es/fr drafts.
- foodLog.savedAdded has no design toast. Design 'Updated {name}' toast after saving a logged item; app closes silently.
- Scan: scan.ts:305 'Scan failed' stored as food name; (tabs)/food.tsx display; translate at display, keep stored value.
- gym/new-template.tsx: 'Remove ${name}', 'Remove exercise', other English; swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Energy unit: food.padCalories always kcal; kJ unchecked. (tabs)/food.tsx:690 hardcoded g unit (now ~696); (tabs)/food.tsx:912 raw energyUnit (now ~918).
- food.searchFailed and food.loadFailed say 'Check your connection', which assumes a cause.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name}; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros; history.tsx:133 hardcoded; i18n/index.ts:2-3 stale header; showSupportNotice noise.
- Row 85 tests: no test covers CaloriesCard, the macro line or its VoiceOver label.
- Backend TestPG_* tests skipped (18). Isa to decide whether to run them against Postgres.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested. Tests run in English only. Language picker removed (src/lib/i18n/index.ts:41 sets lng 'en'), so es and fr never show. quick-add.tsx has no render or behaviour test. Row 85 label untested with VoiceOver.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; moved literals can break it.
- Claude Code forgets context at handover. Name files fully.
- Briefs repeat finished work and stale line numbers. Grep before writing a prompt.

## Handover
Last handover before R187 (loop/HANDOVER.md). Next due R210.

## Jev log
- R201: Jev 60% run, 83% favoured scan.ts:305. Kept food.tsx pick (non-row task forbidden).
- R202: Jev 59% run. Kept smaller task, low confidence.
- R203: Jev 77% run. Agreed.
- R204: Jev 57% ask, 39% run. Kept run: task needs no owner input; Fibre data gap is parked, not asked.
- R205: Jev 61% run, 36% ask (confidence 0.42), last task 72% clean, risk 1.3. Kept run: doc-only fix needs no owner input and closes the flagged report.