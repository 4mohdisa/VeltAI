# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain. Bundle id fit.lume.app.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Change sibling labels in one round.
- Components needing strings call useTranslation() themselves. PADS holds labelKey; translate at render.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Every prompt names loop/design-match, the design/ file and gap row, and forbids git.
- Macro tiles reuse nutrition.protein, carbs, fat, fibre. food.tileEditLabel is the shared 'label, tap to type' pattern.
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key.
- food.rowAnalysing is shared by visible pill and VoiceOver (accepted for v1).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting; they can be stale.
- A loop flag on a partly finished task means finish it before the next one.
- Meal chip caption reuses food.quickAddMeal (only English text left on the control).
- food.saveName and food.saveChanges added in R186 for the Rename food and Edit item sheet. Edit food sheet reuses food.saveChanges.
- food.editFoodTitle added in R187 for the Edit food sheet title (en 'Edit food').
- addMenu.addToSlot used for 'Add to {slot}' on food detail and add.tsx (R188). Grammar left as is pending Isa.

## Status
R162 checkpoint green (tsc 0, 65 suites, 824 tests). R176 read-only checkpoint done. R179 to R185 copy and labels BUILT. R186: Save name and Save changes on the Rename food and Edit item sheet BUILT (detail.tsx:301). R187: Edit food sheet title and Save changes BUILT (detail.tsx:259-260). R188: Add to {slot} labels BUILT (detail.tsx:168, 225). R189: remaining detail.tsx titles and labels in progress.

## Built, not verified (es and fr are unreviewed drafts)
- Tabs, tab bar, add menu, CaloriesCard labels, food row VoiceOver.
- Swipe titles and messages: food.tsx, food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx.
- LoadFailedNotice, StreakCounter, GymPatternsCard, week, training, energy copy, freeze label, nutrition.energyLogged.
- food.tsx pending pill (food.rowAnalysing).
- food/detail.tsx: meal chip labels (addMenu keys, addMeal fallback), 'Meal' caption (food.quickAddMeal), delete item and dialog, saved-mode removal, Save to my dishes, PADS captions, macro tiles, editable tile VoiceOver, serving size and calories VoiceOver, 'Serving size' caption, SegmentedField label, 'Edit values manually', 'for {n} g' under calories (food.caloriesForGrams), 'Edit item' and 'Rename food' titles, Save name and Save changes on the Rename food and Edit item sheet (R186), Edit food title and Save changes (R187), Add to {slot} labels (R188).
- quick-add.tsx: all copy through t(), including offline and failed toasts (food.quickAddOffline, food.quickAddFailed).

## Next (in order)
1. food/detail.tsx: other titles and labels (Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product), 'g' unit in tile values, Name field. Remove stale comment near line 488 if it no longer applies. IN PROGRESS, round 189.
2. Doc-only: DESIGN_GAP_ANALYSIS.md quick-add row (about line 87) and references (about 94, 957, 1020, 1060, 1213-1221). Fix quick-add.tsx:116 to :125. Reconcile wording, no count change.
3. Read-only: scan.ts:305 'Scan failed' shows at food.tsx:887 and in VoiceOver. Translate at display; keep stored value (scanSeam.test.ts asserts it).
4. food.tsx: visible 'Analyzing' vs VoiceOver spelling; P, C, F letters (about 899); g suffixes; raw energyUnit; 'Check your connection' invents a cause.
5. gym/new-template.tsx: `Remove ${name}`, 'Remove exercise' (about 180), other English.
6. Check other swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
7. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. CaloriesCard: missing Fibre column; dot vs bar (row 85, not BUILT).
9. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS (food.tsx, add.tsx, quick-add.tsx, detail.tsx); food.savedTitle vs addMenu.myDishes; foodLog.addToMeal and addMenu.addToSlot duplicate text.
10. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
11. week.tsx, training.tsx, energy.tsx remaining copy.
12. food/new-recipe.tsx rest of screen.
13. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; food row VoiceOver; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width; long es/fr text in saved and detail tiles; pending row; saved-mode removal; Save to my dishes; PADS captions; tile, serving size and calories VoiceOver; serving caption with grams chip; edit values manually VoiceOver; quick-add fit and VoiceOver in es/fr; meal chips fit, especially 'Petit-dejeuner' (no compact prop); 'for {n} g' line fit and whether it should exist at all; Edit item and Rename food title fit and VoiceOver; Save name and Save changes button fit in es and fr ('Enregistrer les modifications'); Edit food title and Save changes fit and wording ('Editar alimento', 'Modifier l’aliment'); Add to {slot} grammar in es and fr ('Ajouter à déjeuner', 'Añadir a almuerzo') and fit of 'Ajouter à petit-déjeuner'.
- Native review: all es/fr drafts, including 'Guardado', 'Enregistre' gender with dish names, 'Tamano de la porcion', 'Taille de la portion', quick-add toasts, 'Snacks' left English in es and fr.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days (mutations.ts:173-178); swipe colour; tabs.* namespace; body stats (1,500 vs 2,100); 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm in app, immediately in design; Rename food sheet header shows food name in design, mode in app (item 7).
- Calories VoiceOver: keep gymLog key or add food key.
- Extra es keys addMenu.voice and addMenu.describeOutLoud: remove, or add to en and fr?
- Gap item 11 macro layout: can the row close?
- Row 86 BUILT vs section verdict DIFFERENT (about line 964).
- foodLog.addedToMeal is masculine in es and fr; new quick-add toasts are feminine. Pick one gender.

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration. formatCalories and formatGrams ignore energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood is local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73. tabBar.addHint reads badly in es.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros.
- Stale citations: gap doc 437, 955, 957, 1505; SwipeableRow.tsx:2 'red' comment (code uses color.primary); hardcoded kcal and g in src/lib/formatting.ts; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts.
- Energy unit: food.padCalories always says kcal as design does; kJ behaviour unchecked.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- Test i18n is English. foodDetail.test.ts searches source text, so literals moved to keys can break it.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display.
- Briefs quote stale paths and finished work; check first.

## Last round
R188: Add to {slot} labels BUILT at detail.tsx:168 and 225 via addMenu.addToSlot. tsc 0, foodDetail 31 passed. Claude Code flagged es and fr grammar and fit (Blocked on Isa). R189 translates remaining detail.tsx titles, empty states and labels.

## Handover pending
None. Last handover before R187 (summary in loop/HANDOVER.md).