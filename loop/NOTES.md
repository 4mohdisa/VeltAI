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
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Macro tiles reuse nutrition.protein, carbs, fat, fibre. food.tileEditLabel is the 'label, tap to type' pattern.
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key.
- food.rowAnalysing is shared by visible pill and VoiceOver (accepted for v1).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting; they can be stale. Finish a flagged partial task before the next.
- Meal chip caption reuses food.quickAddMeal.
- food.saveName, food.saveChanges, food.editFoodTitle, addMenu.addToSlot added for Rename, Edit item, Edit food, Add to {slot}.
- formatCalories uses dashboard.kcal (no new key).

## Status
R162 checkpoint green (tsc 0, 65 suites, 824 tests). R176 read-only checkpoint done. R179 to R189 copy and labels BUILT. R190 read-only checkpoint, result not recorded. R191 formatCalories BUILT and flagged: only helpers.test.ts ran (52 passed). R192 verifies R191. Full suite not run since R162; run at next checkpoint.

## Built, not verified (es and fr are unreviewed drafts)
- Tabs, tab bar, add menu, CaloriesCard labels, food row VoiceOver, LoadFailedNotice, StreakCounter, GymPatternsCard, week, training, energy copy, freeze label, nutrition.energyLogged, food.tsx pending pill.
- Swipe titles and messages: food.tsx, food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx.
- food/detail.tsx: meal chips and caption, delete dialog, saved-mode removal, PADS captions, macro tiles, VoiceOver labels, titles (R189).
- quick-add.tsx: all copy through t().
- formatting.ts: formatCalories via dashboard.kcal (R191).
- DESIGN_GAP_ANALYSIS.md: BUILT sentence on food detail item 23 (R191).

## Next (in order)
1. R192: verify formatCalories (in progress).
2. Doc-only: DESIGN_GAP_ANALYSIS.md quick-add row (about line 87) and stale refs (about 94, 957, 1020, 1060, 1213-1221). quick-add.tsx:116 is now about :125.
3. formatGrams 'g' and formatMacro 'g' in formatting.ts.
4. Read-only: scan.ts:305 'Scan failed' shown at food.tsx:887. Translate at display; keep stored value (scanSeam.test.ts asserts it).
5. food.tsx: 'Analyzing' visible vs VoiceOver spelling; P, C, F letters (about 899); g suffixes; raw energyUnit; 'Check your connection' invents a cause.
6. gym/new-template.tsx: `Remove ${name}`, 'Remove exercise' (about 180), other English. Swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
7. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. CaloriesCard: missing Fibre column; dot vs bar (row 85, not BUILT).
9. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS (food.tsx, add.tsx, quick-add.tsx, detail.tsx); food.savedTitle vs addMenu.myDishes; foodLog.addToMeal and addMenu.addToSlot duplicate text. Check first: detail.tsx:259-260 (Edit food title, Save changes) and :168, :225 (Add to {slot}); then Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field.
10. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
11. week.tsx, training.tsx, energy.tsx remaining copy.
12. food/new-recipe.tsx rest of screen.
13. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device and VoiceOver checks: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width; long es/fr text in saved and detail tiles; pending row; saved-mode removal; Save to my dishes; PADS captions; tile, serving and calories VoiceOver; Edit values manually; quick-add fit in es/fr; meal chips fit; 'for {n} g' fit and keep; Edit item and Rename titles; Save buttons fit; Add to {slot} grammar; detail empty-state titles; loading title; 'N’est plus dans votre journal' fit.
- Native review: all es and fr drafts; 'Guardado'; 'Enregistre' gender with dish names; 'Tamano de la porcion', 'Taille de la portion'; quick-add toasts; 'Snacks' left English.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days (mutations.ts:173-178); swipe colour; tabs.* namespace; body stats (1,500 vs 2,100); 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm in app, immediately in design; Rename food header; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; extra es keys addMenu.voice and addMenu.describeOutLoud; gap item 11 macro layout; row 86 BUILT vs section verdict DIFFERENT (about line 964); foodLog.addedToMeal masculine vs feminine quick-add toasts; foodLog.per100 '/ 100g' vs design '/ 100 g'.

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration; hardcoded Today, Yesterday, weekday and month names; min, day/days in formatDuration and formatStreak. formatGrams ignores energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- formatCalories ignores energy unit (kJ users see kcal). Needs callers to pass the unit; new behaviour. Not reactive to language. formatNumber fixed to en-AU.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint reads badly in es.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros; gym done/missed label at src/app/food/history.tsx:133 hardcoded; src/lib/i18n/index.ts:2-3 header stale.
- Stale citations: gap doc 437, 955, 957, 1505; SwipeableRow.tsx:2 'red' comment; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts.
- Energy unit: food.padCalories always says kcal, as the design does; kJ behaviour unchecked.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested. Tests run in English only. Language picker removed for launch (src/lib/i18n/index.ts:41 sets lng 'en'), so es and fr never show until a picker returns.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; literals moved to keys can break it.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display. Briefs quote stale paths and finished work.
- formatting.ts imports @/lib/i18n. Any test that loads it pulls in i18n.

## Last round
R191: formatCalories uses dashboard.kcal; tsc 0; helpers.test.ts 52 passed. Flagged as not fully run. R190: read-only checkpoint, result not recorded. R189: remaining detail.tsx titles and labels BUILT.

## Handover pending
None. Last handover before R187 (summary in loop/HANDOVER.md).