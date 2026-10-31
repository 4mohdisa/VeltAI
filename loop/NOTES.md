# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Finish a dialog or label set before the next surface. Change sibling labels in one round.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Components needing strings call useTranslation() themselves.
- Checkpoint rounds read-only; doc-only rounds run tsc only. Checkpoint requests override Jev.
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Grep briefs and handover lists before acting. They can be stale.

## Status
R162 checkpoint green: tsc 0, 65 suites, 824 tests. Last full suite R162. Gap counts at R142: 24 DIFFERENT, 14 PARTIAL, 4 BUILT.

## Built, not verified (es and fr are unreviewed drafts)
- Tab labels and titles; CaloriesCard labels; add menu and add/close VoiceOver; food row VoiceOver label and hint.
- Swipe titles and messages: food.tsx, food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx (title and trash dialog).
- LoadFailedNotice and StreakCounter tokens; GymPatternsCard, week, training, energy copy; freeze label; nutrition.energyLogged.

## Next
1. SwipeableRow.tsx defaults 'Delete' and 'Cancel' (R163, in progress).
2. Other swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
3. food.tsx visible 'Analyzing…' (~875) to t(), spelling 'Analysing'.
4. food/detail.tsx ~326 'Delete item'.
5. CaloriesCard: missing Fibre column; dot vs bar (row 85, not BUILT).
6. food.tsx: 'Check your connection' invents a cause; visible P, C, F letters (~899); g suffixes; raw energyUnit.
7. gym/new-template.tsx: `Remove ${name}` label, 'Remove exercise' (~180), rest of English strings.
8. One file per round: GymPatternsCard server values, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
9. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS; food.savedTitle vs addMenu.myDishes.
10. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
11. week.tsx, training.tsx, energy.tsx remaining copy.
12. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; food row VoiceOver; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width (Eliminar, Supprimer); long es/fr text in food/saved.tsx.
- Native review: es/fr drafts (food.row*, food.remove*, food.unsave*, food.saved*, tabBar.*, addMenu, energyLogged, common.delete, gym.removeExerciseTitle); fr 'Detail', 'Repartition', 'gel', 'congelation'; es 'Ingesta y gasto'; fr Sport.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for already-logged days (mutations.ts:173-178); swipe colour; tabs.* namespace; body stats (app 1,500 vs design 2,100).

## Parked
- Helpers English-only: formatRelativeDate, weekdayShort, dayMonth, formatDuration. formatCalories and formatGrams ignore energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood is local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73 details.
- Spanish: tabBar.addHint reads badly; addMenu.voice and describeOutLoud only in es.json.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split in es and fr.
- Stale citations: DESIGN_GAP_ANALYSIS.md 437, 955, 957, 1505. SwipeableRow.tsx:2 'red' comment. Hardcoded kcal and g in src/lib/formatting.ts; 'P' abbreviation.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested.

## Gotchas
- Decode design from __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533; 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Exit 1 means no match.
- i18next plurals need _one and _other; fr treats 0 as one. kcal is feminine, kJ masculine.
- Test i18n is fixed to English; some tests find controls by English label.
- Claude Code forgets context at handover. Name files fully.

## Last round
R163: SwipeableRow default labels, chosen over food.tsx 'Analyzing' to finish the swipe dialog set first.