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

## Status
- R162 checkpoint green. Last full suite run R162.
- R179 to R197: food detail and quick-add copy, formatCalories, formatGrams re-check, row 86 doc fix. Rows 86 and 87 BUILT, not verified.
- R197: tsc 0; foodDetail 31/31, foodDetailLogged 4/4, sheetVariant 9/9, hydrationErrorScreens 10/10. No code change.
- R198: stale gap doc bullet removed (doc only).
- R199: food/detail.tsx 'Edit food' title and 'Save changes' (row 86). Report: both already use t() keys (food.editFoodTitle, food.saveChanges). No code change. 'Edit food' is not in the design. Premise stale for the third time.
- R200 (this round): full-suite checkpoint, read-only. Also a read-only grep of food/detail.tsx for the rest-of-screen literals, so the next build is based on current code.

## Next (in order)
1. Check R200 checkpoint result (suite and tsc counts). Use the R200 grep to decide the next food/detail.tsx build.
2. food/detail.tsx rest of screen, only literals the R200 grep shows still hardcoded: Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field. One per round. If none are hardcoded, change no code and mark built.
3. food/food.tsx: 'Analysing' vs VoiceOver spelling; P, C, F letters (about 899); raw energyUnit; 'Check your connection' invents a cause.
4. Read-only: scan.ts:305 'Scan failed' shown at food.tsx:887. Translate at display; keep stored value.
5. gym/new-template.tsx: 'Remove ${name}', 'Remove exercise' (about 180), other English. Swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
6. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each row first.
7. CaloriesCard: missing Fibre column; dot vs bar (row 85).
8. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; food.savedTitle vs addMenu.myDishes.
9. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
10. week.tsx, training.tsx, energy.tsx copy; food/new-recipe.tsx rest of screen.
11. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt width; long es/fr text; pending row; saved-mode removal; PADS captions; quick-add, meal chips, 'for {n} g', Save buttons fit; formatCalories on device; long labels (Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications).
- Native review: all es and fr drafts; 'Guardado'; 'Enregistre' gender; 'Taille de la portion'; quick-add toasts; 'Snacks' left English; addMenu.addToSlot drafts (e.g. 'Anadir a almuerzo'); 'Anadir' wording.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name (food detail difference 7, incl. 'Edit food' title); gymLog calories key; extra es keys addMenu.voice and addMenu.describeOutLoud; gap item 11 macro layout; row 86 BUILT vs DIFFERENT verdict; foodLog.addedToMeal gender in toasts; foodLog.per100 '/ 100g' vs '/ 100 g'; Day log macro spacing.

## Parked (merged)
- English helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration, formatStreak; hardcoded Today, Yesterday, month and weekday names; plurals '1 of 1 days', 'longest 1 minutes', 'of N days'. formatGrams and formatCalories ignore energy unit; not reactive to language; formatNumber fixed to en-AU. formatMacro has no callers (dead code).
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only (backend).
- quick-add.tsx:73 stores 'Quick add' as row name (saved data, English). NumberEntryBar.tsx:108 hardcodes 'Done'.
- Gap doc: difference 18 near 1017 still says 'Save to my foods'; review difference 7 near 1009 and App write-up near 991. Gap doc line 1058 stale bullet 'The copy is hardcoded English' (still present per R199 report; remove in a doc-only round).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint reads badly in es.
- SLOT_KEYS duplicated in four files (food.tsx, add.tsx, quick-add.tsx, detail.tsx). addMenu.addToSlot awkward es/fr drafts.
- foodLog.savedAdded has no design toast. Design 'Updated {name}' toast after saving a logged item; app closes silently.
- foodLog.deleteItem 'Delete item' vs design 'Remove from log' (already under design questions).
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name}; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros; history.tsx:133 hardcoded; i18n/index.ts:2-3 stale header; showSupportNotice noise.
- Stale citations: SwipeableRow.tsx:2; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts; gap doc quick-add line refs about 11 lines out and detail.tsx refs at least 7 out.
- Energy unit: food.padCalories always kcal; kJ unchecked.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested. Tests run in English only. Language picker removed (src/lib/i18n/index.ts:41 sets lng 'en'), so es and fr never show. quick-add.tsx has no render or behaviour test.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; moved literals can break it.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display. formatting.ts imports @/lib/i18n. Tests live in src/__tests__.
- Briefs repeat finished work and stale line numbers; check first. The 'Edit food' / 'Save changes' premise was stale in R199; grep before writing a prompt.

## Last round
R199: 'Edit food' and 'Save changes' already translated; no code change (premise stale).
R200: read-only checkpoint (full suite, tsc) plus read-only grep of food/detail.tsx literals.

## Handover
Last handover before R187 (summary in loop/HANDOVER.md). Next due R210 (15-round cycle). Full-suite checkpoint due at R200 (this round).