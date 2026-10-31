# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain. Bundle id fit.lume.app.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Change sibling labels in one round.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Components needing strings call useTranslation() themselves. PADS holds labelKey; translate at render.
- Every prompt names loop/design-match, names the design/ file and gap row, and forbids git.
- Macro tiles reuse nutrition.protein, carbs, fat, fibre. food.tileEditLabel is the shared 'label, tap to type' VoiceOver pattern.
- Calories VoiceOver label reuses gymLog.celebration.calories until owner picks a food key.
- food.rowAnalysing is shared by the visible pill and VoiceOver (accepted for v1).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting. They can be stale.
- A loop flag on a partly finished task means finish that task before the next one.

## Status
R162 checkpoint green (tsc 0, 65 suites, 824 tests). R176 checkpoint read-only, done. Gap counts at R142: 24 DIFFERENT, 14 PARTIAL, 4 BUILT.

## Built, not verified (es and fr are unreviewed drafts)
- Tabs, tab bar, add menu, CaloriesCard labels, food row VoiceOver.
- Swipe titles and messages in food.tsx, food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx. SwipeableRow defaults use common.delete and common.cancel.
- LoadFailedNotice, StreakCounter, GymPatternsCard, week, training, energy copy, freeze label, nutrition.energyLogged.
- food.tsx pending pill (food.rowAnalysing).
- food/detail.tsx: delete item and dialog, saved-mode removal, Save to my dishes, PADS captions, macro tile labels, editable tile VoiceOver, serving size and calories VoiceOver, visible 'Serving size' caption and SegmentedField label, visible and VoiceOver 'Edit values manually' (food.editValuesManually; no design wording, app English kept).
- Tab labels reuse food.title, dashboard.summaryTitle, gym.title.
- quick-add.tsx: bar caption 'Calories · kcal' uses food.padCalories (R178). Row status unchanged (DIFFERENT).

## Next (in order)
1. IN PROGRESS R179: finish quick-add.tsx copy: 'kcal · tap to type', 'kcal' unit, 'Add {{calories}}', two toasts. Keys to en, es, fr together. Reuse existing keys on exact English match.
2. food/detail.tsx: 'Edit item', 'Rename food', other titles, 'g' unit in tile values, Name field, 'for {n} g'. Remove stale comment at about line 488.
3. Doc-only: DESIGN_GAP_ANALYSIS.md quick-add line references (about 94, 1060, 1213, 1215, 1221, now 2 lines out), line 957, and item 18 (about line 1020). Reconcile wording, no count changes.
4. Read-only: scan.ts:305 'Scan failed' feeds food.tsx:887 and VoiceOver. Translate at display; keep stored value (scanSeam.test.ts asserts it).
5. food.tsx: visible 'Analyzing' versus VoiceOver spelling; P, C, F letters (about 899); g suffixes; raw energyUnit; 'Check your connection' invents a cause.
6. gym/new-template.tsx: `Remove ${name}`, 'Remove exercise' (about 180), other English strings.
7. Other swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220. Check translated first.
8. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
9. CaloriesCard: missing Fibre column; dot versus bar (row 85, not BUILT).
10. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS; food.savedTitle versus addMenu.myDishes.
11. nutrition.tsx '80%' versus '80 %'; raw meal.slot; freeze strings at count 1.
12. week.tsx, training.tsx, energy.tsx remaining copy.
13. food/new-recipe.tsx rest of screen.
14. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; food row VoiceOver; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width; long es/fr text in food/saved.tsx and food/detail.tsx tiles; pending row; saved-mode removal and toast; Save to my dishes; PADS captions fit in the number-entry bar; tile and serving size and calories VoiceOver labels; serving size caption fit with grams chip; edit values manually VoiceOver; quick-add label and caption fit in es and fr.
- Native review: all es/fr drafts, including 'Guardado' and 'Enregistré' gender with dish names, and 'Tamaño de la porción' and 'Taille de la portion'.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days (mutations.ts:173-178); swipe colour; tabs.* namespace; body stats (1,500 vs 2,100); 'Analysing' versus 'Analysing photo'; 'Delete item' versus 'Remove from log'; delete after confirm in app, immediately in design.
- Calories VoiceOver label: keep gymLog key, or add a food-owned key (owner choice).
- Extra es keys addMenu.voice and addMenu.describeOutLoud: remove, or add to en and fr?
- Gap item 11 macro layout difference: can the row close?

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration. formatCalories and formatGrams ignore energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood is local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73. tabBar.addHint reads badly in es.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split in es and fr; duplicate goals.* and nutrition.* macros.
- Stale citations: gap doc 437, 955, 957, 1505; SwipeableRow.tsx:2 'red' comment; hardcoded kcal and g in src/lib/formatting.ts; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts; stale 'Serving size' comment at detail.tsx line 488.
- Energy unit: food.padCalories always says kcal as the design does; kJ behaviour unchecked.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- Test i18n is English. foodDetail.test.ts searches source text, so literals moved to keys can break it.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display.

## Last round
R178: quick-add.tsx caption 'Calories · kcal' now uses food.padCalories. Report flagged as partly done (other quick-add copy still English). R179: prompt issued to finish quick-add.tsx copy before moving on.

## Handover pending
None.