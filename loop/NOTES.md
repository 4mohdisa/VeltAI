# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Macros stored unrounded, rounded to 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- Rows stay DIFFERENT while other differences remain.
- Citations: insertion at line N moves only citations at or after N.
- Checkpoint rounds read-only. Doc-only rounds: tsc only.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name the branch and forbid git.
- Every prompt names the matching design/ file and gap row (or says none exists). One task per prompt.
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass. No covering test means NOT COVERED.
- Backend-dependent items stay Parked.
- Defaults: keep one-tap gym log on Summary card; keep Distance km; skip food search chips; keep Goals extras.
- week.tsx has no gap row; its copy is recorded here only.
- GymPatternsCard has no design counterpart; padding 20 pending Isa.
- Food log empty state has no gap row. Row 85 stays DIFFERENT; do not mark it BUILT for the empty state.

## Status
Last counted R89: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Last green checkpoint R89 (tsc 0, 65 suites, 824 tests). R102, R117 and R131 checkpoints did not report. Checkpoint still owed and overdue.

BUILT, not verified (Isa to check):
- LoadFailedNotice: message required; Try again via common.tryAgain. NOT COVERED.
- StreakCounter colours and caption; label, secondary and tertiaryLabel tokens. NOT COVERED.
- gym.tsx Training list title and four row labels via t(). Device check.
- week, training, energy copy via t(); Breakdown via dashboard.breakdown; energy Breakdown row ids stable.
- Freeze label (gap line 82).
- GymPatternsCard copy via seven gym.* keys. NOT COVERED. es and fr unreviewed.
- food.tsx ErrorState messages food.empty.searchFailed and food.empty.loadFailed (en, es, fr). es and fr unreviewed. NOT COVERED.
- food.tsx 'Food' header title via new key food.title (Food, Comida, Repas). es and fr unreviewed. NOT COVERED.
- food.tsx 'Calories' card title via gymLog.celebration.calories (shared key; separate food.caloriesTitle is an option for Isa). NOT COVERED.

## Next
1. CaloriesCard macro names 'Protein', 'Carbs', 'Fat' in food.tsx (~665-667) to t() (R133, in progress).
2. Checkpoint: full tsc and full app suite, read-only (overdue).
3. Tab bar label 'Food': src/components/navigation/LumeTabBar.tsx:38 and src/app/(tabs)/_layout.tsx:32 to t(), if the design wording allows. Check the navigation rule first.
4. Dedupe SLOT_KEYS (food.tsx:84); resolve food.savedTitle vs addMenu.myDishes.
5. food.tsx: 'Check your connection' invents a cause; 'today's' shows on other dates.
6. GymPatternsCard server values (most_missed_day, muscle names): check backend first; map or park.
7. One file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. PlannedValuesForm.tsx:200 'Add exercise' vs design.
9. add.tsx slotKey (~67): remove unused keys if confirmed.
10. Raw item values in food.tsx and food/saved.tsx:144: park if no design decision.
11. /gym/session saves top weight on all sets: fix or park.
12. nutrition.tsx '80%' vs '80 %'; raw meal.slot near lines 164 and 180.
13. Freeze strings at count 1 read wrongly.
14. week.tsx remaining copy, then training.tsx and energy.tsx.
15. No rows left: stop with 'only owner decisions remain'.
Grep for strings first. Line numbers drift.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? (mutations.ts:173-178)
- Device checks: Gym Training labels, logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line, LoadFailedNotice, StreakCounter caption, es and fr text fit, minutesCeiling, eatenAgainstBurned, inAndOut.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts near lines 961 and 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: fr 'Detail' vs 'Repartition'; fr 'gel' vs 'congelation'; 'Ingesta y gasto' and 'Apport et depense'; energy 'eatenAgainstBurned' fr; gym.oftenSkip es and fr.
- food.title: Comida and Repas read as 'meal'. Alternatives Alimentacion and Alimentation. Also separate food.caloriesTitle to avoid the shared key.
- Which row records week.tsx, or whether a Week row should exist.
- energy.tsx design wording: deficit caption, steps row, burn target sub.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron.
- Volume fix; heatmap wording; calories cell needs backend field.
- Rename plannedExercisesNoDuration; keep freeze screen; StreakCounter wrap row; 'Start workout', 'Training', 'Session history' labels.
- Gym calories vs Training energy; training caption wording; minutesCeiling 'min' vs 'm'.
- GymPatternsCard padding 20 vs 16.
- Food log empty state: add a gap row or reason line? Should an empty day show the four meal cards instead of 'No meals yet'?
- food.empty.searchFailed and loadFailed: es and fr review. 'Check your connection' invents a cause. 'Today's food log' is wrong for other selected dates.

## Parked
- Shared helpers, English-only: formatRelativeDate (formatting.ts:44); weekdayShort, dayMonth (energyRange.ts:60, :67); formatDuration (formatting.ts:25).
- Plurals: weekNetAveragedOver, weekNetSummary, weekNetAverage ('1 of 1 days'); trainingMinutesSummary ('longest 1 minutes').
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood local only (mutations.ts:157); server sync needs backend.
- GymPatternsCard server values shown as received (src/lib/api.ts:795-800); '%' format; cap() at line 14 may be wrong for translated names.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route, PlannedValuesForm submit.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, pop-in, ring vs flame; streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop; gym.dayStreak vs dashboard.dayStreak; count style; caption case.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen.
- Duplicates: dashboard.training vs gym.training; dashboard.restDay vs gymLog.restDayTitle; dashboard.breakdown vs nutrition.breakdown; dashboard.energy vs preferences.energy.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; dashboard.kcal may duplicate; StreakCounter.tsx old tokens; GymPatternsCard padding 20.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- Stale citations: gap doc line 437 (gym.tsx:94-158), line 1505 (lines 72-75). Rows 436 and 1505 were checked in R132 and are correct. Row 112 'padding 20 vs 16' is corrected.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice, week or training empty states, or the Gym Training labels. No test renders GymPatternsCard. No repo test loads locale files. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Breakdown checks read source text only. Food log empty-state strings are not rendered by any test. Food tab header and Calories card title are not rendered by any test.

## Gotchas
- Briefs repeat finished work, quote stale lines, name wrong paths. Check first.
- Correct paths: src/app/energy.tsx; src/app/dashboard/training.tsx; src/app/dashboard/week.tsx; locales in src/lib/i18n/locales/. Not src/locales, not src/app/training.tsx.
- Design copy is encoded: decode the __bundler/manifest script with node. Food is 71f71ac4; energy, week and training details are 185bb533.
- test.each assertions are shared across routes.
- zsh: quote (tabs) paths and globs. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- i18next plurals need both _one and _other; fr treats 0 as one.
- Handover at R133: Claude Code knows only the summary. Name files fully.

## Round log
- R129: gym.tsx header comment typo fix. Checked: tsc 0, three source tests passed.
- R130: food.tsx empty-state copy to t() with food.empty keys (en, es, fr). Report flagged es and fr as unreviewed.
- R131: checkpoint chosen over Jev's food.tsx pick, because the checkpoint was due. Prompt rejected before it ran, so the checkpoint is still owed.
- R132: food.tsx titles chosen over week.tsx copy and GymPatternsCard. Jev 91%. Report flagged as partly done.
- R133: CaloriesCard macro labels chosen after the loop note flagged R132 as partly done. Candidates: macro labels, checkpoint, tab bar label. Jev 85% run. Checkpoint stays due next.

## Waiting on Isa (summary)
es and fr review; device checks (minutesCeiling, eatenAgainstBurned, inAndOut); Detail or Repartition; congelation or gel; GymPatternsCard padding 20 or 16; gap rows for detail screens; design wording differences; empty day: four meal cards or 'No meals yet'; food.title wording; separate food.caloriesTitle.