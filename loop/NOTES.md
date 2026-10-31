# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Macros stored unrounded, 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English, listed under Parked.
- Rows stay DIFFERENT or PARTIAL while differences remain.
- One surface or shared component per prompt. Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Components needing strings call useTranslation() themselves.
- Checkpoint rounds read-only. Doc-only rounds run tsc only.
- Sibling labels: change the whole set in one round.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Brief claims are checked by grep before acting. Reports can conflict.
- A partly finished string set counts as unfinished. Finish a dialog or label set before starting another surface.
- Swipe action colour: keep color.primary until Isa decides on design red. Do not change it in a string round.
- Prompts must name the matching design/ file and the loop/design-match branch, and must forbid git.
- Handover NOT FIXED lists can be stale. Grep before acting on them.

## Status
Gap counts (R142): 24 DIFFERENT, 14 PARTIAL, 4 BUILT. Last green full checkpoint R89 (tsc 0, 65 suites, 824 tests). Full suite owed since R146; run at the next checkpoint.

## Built, not verified (es and fr are unreviewed drafts)
- Tab labels and titles; CaloriesCard macro and energy labels; add menu labels; add-button and close VoiceOver strings.
- Food row VoiceOver label and hint (food.row*); swipe titles and messages in food.tsx, food/saved.tsx (incl. unsave), food/new-recipe.tsx (reuses food.removeTitle).
- food/saved.tsx strings (R157).
- new-recipe.tsx swipe title (R158; tsc passed R159, no matching tests).
- gym/new-template.tsx swipe title, gym.removeExerciseTitle (R160; tsc 0, no matching tests).
- SwipeableRow: Cancel uses common.cancel; confirm and swipe use common.delete unless deleteLabel is passed.
- LoadFailedNotice and StreakCounter tokens; GymPatternsCard copy; week, training, energy copy; freeze label.
- nutrition.energyLogged (es 'en total', fr 'au total').

## Next
1. DONE R159: new-recipe.tsx flag cleared (tsc 0, no matching tests exist). Logged as cleared, not verified.
2. DONE R160: gym/new-template.tsx swipe title. IN PROGRESS R161: trash-button dialog in new-template.tsx (~173-176) to gym.removeExerciseTitle, common.cancel, common.delete. The R160 report was flagged for tests not run; R161 records tsc and the no-matching-tests result in CHECKED.
3. Visible 'Analyzing…' on food row (food.tsx ~875) to t(), spelling 'Analysing'.
4. CaloriesCard: missing Fibre column; dot vs bar (row 85, do not mark BUILT).
5. 'Check your connection' invents a cause (food.tsx).
6. Visible P, C, F letters on food row (~899); g suffixes (~690, ~856, VoiceOver ~854); raw energyUnit.
7. One file per round: GymPatternsCard server values, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. PlannedValuesForm 'Add exercise'. add.tsx unused slotKey keys.
9. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
10. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
11. week.tsx remaining copy, then training.tsx, energy.tsx.
12. food/detail.tsx ~326 'Delete item' still English.
13. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; food rows (logged, analysing, failed) VoiceOver; offline failure; LoadFailedNotice; StreakCounter caption; minutesCeiling; eatenAgainstBurned; inAndOut; energy unit card; add menu wrap at 232pt (fr, es); swipe dialogs on device (food log, saved, recipe, gym template); SwipeableRow 'Eliminar' and 'Supprimer' fit 88pt; food/saved.tsx longer es and fr text.
- Native review: es/fr drafts (food.row*, food.remove*, food.unsave*, food.saved*, tabBar.*, addMenu, closeMenu, gym.oftenSkip, energyLogged, eatenAgainstBurned, common.delete, gym.removeExerciseTitle); fr 'Detail', 'Repartition', 'gel', 'congelation'; es 'Ingesta y gasto'; fr Sport.
- Design questions: food.title shared by tab and screen; separate caloriesTitle; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for already-logged days (mutations.ts:173-178); design wording for energy deficit, steps, burn target, weekly target, group names, training list, profile row, streak, footnote; rows 90, 330, 334, 89, 23, 17; search routing; quick add serving order; add sheet 0pt gap; 'Snacks'; TodayCard wash pill, whole-day kcal, chevron; remaining-kcal line; body stats (app 1,500 kcal vs design 2,100); tabs.* namespace; swipe colour (accent red or black).

## Parked
- Helpers English-only: formatRelativeDate, weekdayShort, dayMonth, formatDuration; formatCalories and formatGrams ignore energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing from FoodResult (src/lib/mock/data.ts:124); editSavedFood is local only (needs backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800); '85%' format.
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; estimated duration; custom exercise route; /gym/session top weight; new-template VoiceOver 'Remove {{name}}' stays English.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop; gym.dayStreak vs dashboard.dayStreak.
- Freeze: singular counts; toast before server reply; refusal unhandled; streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}' accent; plan.addTitle es/fr; '14-day' hyphen; duplicate keys across namespaces; duplicate macro keys in goals.* and nutrition.*.
- Spanish: tabBar.addHint reads badly; addMenu.voice and describeOutLoud exist only in es.json.
- Food row key={c.name} uses a translated string.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN on undefined profile field.
- Raw item values: food.tsx, food/saved.tsx:144.
- food.unsaveTitle and food.removeTitle share English but differ in es and fr.
- Stale gap doc citations (lines 437, 957, 1505); line 955 wrongly says swipe confirmation is translated everywhere.
- SwipeableRow.tsx:2 'red' comment.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Fibre uses > 0. No full suite since R146. SwipeableRow and saved.tsx rendering are not covered by tests.

## Gotchas
- Briefs repeat finished work and quote stale lines. Grep first. Line numbers drift. Handover items can predate later reports.
- Design copy is encoded: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533; 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Exit 1 means no match.
- i18next plurals need _one and _other; fr treats 0 as one.
- kcal is feminine, kJ masculine: avoid agreeing participles.
- Test i18n is fixed to English. Some tests find controls by English label.
- Claude Code forgets context at handover. Name files fully in every prompt.

## Last round
R160: gym/new-template.tsx swipe title BUILT (tsc 0, no matching tests). Flagged for tests not run; cleared by R161 run and CHECKED entry. R161 (this round): trash-button dialog in new-template.tsx. Next after that: food.tsx 'Analyzing' (notes step 3).