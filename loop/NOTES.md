# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain. Bundle id fit.lume.app.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Change sibling labels in one round.
- Components needing strings call useTranslation(). PADS holds labelKey; translate at render.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git and name loop/design-match, the design/ file and the gap row.
- Macro tiles reuse nutrition.protein, carbs, fat, fibre. food.tileEditLabel is the 'label, tap to type' pattern.
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key.
- food.rowAnalysing is shared by visible pill and VoiceOver (accepted for v1).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting; they can be stale. A flagged partial task is finished before the next.
- Meal chip caption reuses food.quickAddMeal.
- food.saveName, food.saveChanges, food.editFoodTitle and addMenu.addToSlot were added for the Rename, Edit item, Edit food and Add to {slot} labels.
- R191: formatCalories uses dashboard.kcal (no new key). Prompt names design/Lume App.html and gap food detail row 23 after the R190 rejection.

## Status
R162 checkpoint green (tsc 0, 65 suites, 824 tests). R176 read-only checkpoint done. R179 to R189 copy and labels BUILT. R190 was a read-only checkpoint; its result is not in the latest report, so re-run the full checkpoint at the next checkpoint round. R191 is formatCalories.

## Built, not verified (es and fr are unreviewed drafts)
- Tabs, tab bar, add menu, CaloriesCard labels, food row VoiceOver, LoadFailedNotice, StreakCounter, GymPatternsCard, week, training, energy copy, freeze label, nutrition.energyLogged, food.tsx pending pill.
- Swipe titles and messages: food.tsx, food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx.
- food/detail.tsx: meal chips and caption, delete item and dialog, saved-mode removal, Save to my dishes, PADS captions, macro tiles, serving and calories VoiceOver, Edit values manually, 'for {n} g', Edit item and Rename food titles and buttons, Edit food title, Add to {slot}, and all remaining titles and labels (R189).
- quick-add.tsx: all copy through t(), including offline and failed toasts.

## Next (in order)
1. Doc-only: DESIGN_GAP_ANALYSIS.md quick-add row (about line 87) and references (about 94, 957, 1020, 1060, 1213-1221). Fix quick-add.tsx:116 to :125.
2. (R191, in progress) formatCalories in formatting.ts: translate kcal via dashboard.kcal. formatGrams 'g' still open.
3. Read-only: scan.ts:305 'Scan failed' shows at food.tsx:887. Translate at display; keep stored value (scanSeam.test.ts asserts it).
4. food.tsx: visible 'Analyzing' vs VoiceOver spelling; P, C, F letters (about 899); g suffixes; raw energyUnit; 'Check your connection' invents a cause.
5. gym/new-template.tsx: `Remove ${name}`, 'Remove exercise' (about 180), other English. Swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
6. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
7. CaloriesCard: missing Fibre column; dot vs bar (row 85, not BUILT).
8. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS (food.tsx, add.tsx, quick-add.tsx, detail.tsx); food.savedTitle vs addMenu.myDishes; foodLog.addToMeal and addMenu.addToSlot duplicate text.
9. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
10. week.tsx, training.tsx, energy.tsx remaining copy.
11. food/new-recipe.tsx rest of screen.
12. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device and VoiceOver checks: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width; long es/fr text in saved and detail tiles; pending row; saved-mode removal; Save to my dishes; PADS captions; tile, serving and calories VoiceOver; Edit values manually VoiceOver; quick-add fit in es/fr; meal chips fit ('Petit-dejeuner'); 'for {n} g' fit and whether to keep; Edit item and Rename titles; Save buttons fit ('Enregistrer les modifications'); Add to {slot} grammar ('Ajouter à déjeuner', 'Añadir a almuerzo'); detail empty-state titles reusing food.title ('Comida', 'Repas'); loading title 'Looking up the barcode…' or 'Looking up product…'; 'N’est plus dans votre journal' fit.
- Native review: all es and fr drafts; 'Guardado'; 'Enregistre' gender with dish names; 'Tamano de la porcion', 'Taille de la portion'; quick-add toasts; 'Snacks' left English.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days (mutations.ts:173-178); swipe colour; tabs.* namespace; body stats (1,500 vs 2,100); 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm in app, immediately in design; Rename food header; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; extra es keys addMenu.voice and addMenu.describeOutLoud; gap item 11 macro layout; row 86 BUILT vs section verdict DIFFERENT (about line 964); foodLog.addedToMeal masculine vs feminine quick-add toasts; foodLog.per100 '/ 100g' vs design '/ 100 g'.

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration. formatGrams ignores energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood is local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint reads badly in es.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros.
- Stale citations: gap doc 437, 955, 957, 1505; SwipeableRow.tsx:2 'red' comment; hardcoded g in formatting.ts; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts.
- Energy unit: food.padCalories always says kcal, as the design does; kJ behaviour unchecked.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested. Tests run in English only.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; literals moved to keys can break it.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display. Briefs quote stale paths and finished work.

## Last round
R190: read-only checkpoint, result not recorded in the latest report. R189: remaining detail.tsx titles and labels BUILT (11 food.* keys in en, es, fr). tsc 0 at R189; foodDetail.test.ts 31 passed. Full suite not run since R162.

## Handover pending
None. Last handover before R187 (summary in loop/HANDOVER.md).