# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Macros stored unrounded, rounded to 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are listed here.
- Rows stay DIFFERENT while other differences remain.
- Citations: insertion at line N moves only citations at or after N.
- Checkpoint rounds are read-only. Doc-only rounds run tsc only.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name the branch and forbid git.
- Every prompt names its design/ file and gap row, or says none exists. One task per prompt.
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass. No covering test means NOT COVERED.
- Backend-dependent items stay Parked.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- week.tsx has no gap row; its copy is recorded here only. Food log empty state has no gap row; row 85 stays DIFFERENT.

## Status
R89 count: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
Last green full checkpoint: R89 (tsc 0, 65 suites, 824 tests). Checkpoints R102, R117, R131 never reported. R134 checkpoint rejected (no design file named). R135 checkpoint rewritten, but its report was the macro-label round, so the checkpoint is still owed.

## BUILT, not verified (Isa checks)
- LoadFailedNotice: message required; Try again via common.tryAgain.
- StreakCounter colours, caption, label, secondary and tertiaryLabel tokens.
- gym.tsx Training title and four row labels via t().
- week, training, energy copy via t(); Breakdown via dashboard.breakdown; energy Breakdown row ids stable.
- Freeze label (gap line 82).
- GymPatternsCard copy via seven gym.* keys. es and fr unreviewed.
- food.tsx: ErrorState messages (food.empty.searchFailed, loadFailed); 'Food' title (food.title); 'Calories' title (gymLog.celebration.calories, shared).
- CaloriesCard macro labels via nutrition.protein, carbs, fat (R133).
All NOT COVERED by tests.

## Next
1. Checkpoint: full tsc and app suite, read-only. Still owed.
2. (R136, in progress) food.tsx: '{energyUnit} logged' to t(), row 85.
3. Tab label 'Food' (LumeTabBar.tsx:38, (tabs)/_layout.tsx:32) to t(), if design wording allows.
4. Dedupe SLOT_KEYS (food.tsx:84). Resolve food.savedTitle vs addMenu.myDishes.
5. food.tsx: 'Check your connection' invents a cause; 'today's' shows on other dates.
6. CaloriesCard: Fibre column missing; dot vs bar (row 85). Add or park.
7. GymPatternsCard server day and muscle values: check backend; map or park.
8. One file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
9. PlannedValuesForm.tsx:200 'Add exercise' vs design.
10. add.tsx slotKey (~67): remove unused keys if confirmed.
11. Raw item values (food.tsx, food/saved.tsx:144): park if no design decision.
12. /gym/session saves top weight on all sets: fix or park.
13. nutrition.tsx '80%' vs '80 %'; raw meal.slot near lines 164, 180.
14. Freeze strings at count 1 read wrongly.
15. week.tsx remaining copy, then training.tsx and energy.tsx.
16. No rows left: stop with 'only owner decisions remain'.
Grep first. Line numbers drift.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? (mutations.ts:173-178)
- Device checks: Gym Training labels, logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line, LoadFailedNotice, StreakCounter caption, es/fr fit, minutesCeiling, eatenAgainstBurned, inAndOut.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts near lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks'.
- Native review: fr 'Detail'/'Repartition', 'gel'/'congelation', 'Ingesta y gasto', 'Apport et depense', eatenAgainstBurned fr, gym.oftenSkip es and fr.
- food.title: Comida and Repas read as 'meal'. Separate food.caloriesTitle.
- Week row: record in an existing row or add one?
- energy.tsx: deficit caption, steps row, burn target sub.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- No body stats: app shows 1,500 kcal, design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron.
- Volume fix; heatmap wording; calories cell needs backend field.
- Labels: plannedExercisesNoDuration; freeze screen; StreakCounter wrap row; 'Start workout', 'Training', 'Session history'.
- Gym calories vs Training energy; training caption; minutesCeiling 'min' vs 'm'; GymPatternsCard padding 20 vs 16.
- Food log empty day: four meal cards or 'No meals yet'? Gap row?
- Native review of new CaloriesCard wording: es and fr for macro labels and the energyUnit logged line (R136).

## Parked
- English-only date helpers: formatRelativeDate (formatting.ts:44); weekdayShort, dayMonth (energyRange.ts:60, :67); formatDuration (formatting.ts:25).
- Plurals: '1 of 1 days' (weekNetAveragedOver, weekNetSummary, weekNetAverage); 'longest 1 minutes' (trainingMinutesSummary).
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood local only (mutations.ts:157); server sync needs backend.
- GymPatternsCard: server values as received (src/lib/api.ts:795-800); '%' format; cap() line 14.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route, PlannedValuesForm submit.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, pop-in, ring vs flame; streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop; gym.dayStreak vs dashboard.dayStreak; count style; caption case.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es and fr; '14-day' hyphen.
- Duplicate keys: dashboard.training/gym.training; dashboard.restDay/gymLog.restDayTitle; dashboard.breakdown/nutrition.breakdown; dashboard.energy/preferences.energy; goals.* and nutrition.* macros.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; dashboard.kcal; StreakCounter.tsx old tokens.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- Stale citations: gap doc line 437 (gym.tsx:94-158), line 1505 (lines 72-75). Rows 436 and 1505 checked R132.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice, week, training empty states, GymPatternsCard, or the food log empty state. No test loads locale files.

## Gotchas
- Briefs repeat finished work and quote stale lines. Check first.
- Paths: src/app/energy.tsx; src/app/dashboard/training.tsx and week.tsx; locales in src/lib/i18n/locales/.
- Design copy is encoded: decode __bundler/manifest with node. Food is 71f71ac4; energy, week, training are 185bb533.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- i18next plurals need both _one and _other; fr treats 0 as one.
- Rejected prompts happen when the design file is not named. Name design/Lume App.html and the screen id in every prompt.

## Round log
- R131: checkpoint chosen over Jev. Prompt rejected.
- R133: CaloriesCard macro labels done.
- R134: checkpoint chosen. Prompt rejected (no design file named).
- R135: checkpoint rewritten, design file stated as none. Report received was the macro-label round.
- R136: energyUnit label chosen over the owed checkpoint (Jev 88% run). Previous prompt rejected for not naming the design file. Rewritten to name design/Lume App.html screen 71f71ac4 and row 85.