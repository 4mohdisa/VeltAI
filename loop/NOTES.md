# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain. Bundle id fit.lume.app.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording (R170: 'Save to my dishes').
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Change sibling labels in one round.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Components needing strings call useTranslation() themselves.
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- food.rowAnalysing is shared by the visible pill and VoiceOver (accepted for v1).
- Grep briefs and handover lists before acting. They can be stale.

## Status
R162 checkpoint green: tsc 0, 65 suites, 824 tests. Gap counts at R142: 24 DIFFERENT, 14 PARTIAL, 4 BUILT. Gap doc item 18 still says 'Save to my foods' (stale).

## Built, not verified (es and fr are unreviewed drafts)
- Tabs, tab bar, add menu, CaloriesCard labels, food row VoiceOver.
- Swipe titles and messages: food.tsx, food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx.
- SwipeableRow defaults use common.delete and common.cancel (R163).
- LoadFailedNotice, StreakCounter, GymPatternsCard, week, training, energy copy, freeze label, nutrition.energyLogged.
- food.tsx pending pill: food.rowAnalysing.
- food/detail.tsx: delete item, delete confirm and toast, saved-mode removal strings, Save to my dishes and toast (R170).
- Tab labels reuse food.title, dashboard.summaryTitle, gym.title (tabs.summary and tabs.gym do not exist).

## Next (in order)
1. food/detail.tsx PADS captions (57-62), then macro labels (about 567-610), 'Edit item', 'Rename food'.
2. Doc-only: DESIGN_GAP_ANALYSIS.md item 18 (about line 1020), line 957, and the row 86 versus section verdict (about 964). Reconcile wording, no count changes.
3. Read-only: scan.ts:305 'Scan failed' feeds food.tsx:887 and VoiceOver. Plan display-time translation; keep stored value (scanSeam.test.ts asserts it).
4. food.tsx: visible 'Analyzing' (about 875) versus VoiceOver spelling; P, C, F letters (about 899); g suffixes; raw energyUnit; 'Check your connection' invents a cause.
5. gym/new-template.tsx: `Remove ${name}`, 'Remove exercise' (about 180), other English strings.
6. Other swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220. Check translated first.
7. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. CaloriesCard: missing Fibre column; dot versus bar (row 85, not BUILT).
9. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS; food.savedTitle versus addMenu.myDishes.
10. nutrition.tsx '80%' versus '80 %'; raw meal.slot; freeze strings at count 1.
11. week.tsx, training.tsx, energy.tsx remaining copy.
12. food/new-recipe.tsx rest of screen.
13. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; food row VoiceOver; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width; long es/fr text in food/saved.tsx; pending row; saved-mode removal and toast; Save to my dishes button and toast.
- Native review: all es/fr drafts (fr Sport, fr 'Detail', 'Repartition', 'gel', 'congelation', es 'Ingesta y gasto', ellipsis on pending wording, 'Guardado' and 'Enregistré' gender with dish names).
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days (mutations.ts:173-178); swipe colour; tabs.* namespace; body stats (1,500 vs 2,100); 'Analysing' versus 'Analysing photo'; 'Delete item' versus 'Remove from log'; delete after confirm in app, immediately in design.
- Extra es keys addMenu.voice and addMenu.describeOutLoud: remove, or add to en and fr?

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration. formatCalories and formatGrams ignore energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood is local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73. tabBar.addHint reads badly in es.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split in es and fr; duplicate goals.* and nutrition.* macros.
- Stale citations: gap doc 437, 955, 957, 1505; SwipeableRow.tsx:2 'red' comment; hardcoded kcal and g in src/lib/formatting.ts; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts (check visibility).

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested.

## Gotchas
- Decode design from __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- Test i18n is fixed to English; some tests find controls by English label.
- Claude Code forgets context at handover. Name files fully.

## Last round
R170 built: food/detail.tsx Save to my dishes button and toast. tsc 0; three detail test files, 44 passed. Not verified.
R171: picked PADS captions in food/detail.tsx (candidate 1). Jev: run 89%.

## Handover pending
None.