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
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass. No test covering a file means NOT COVERED.
- Backend-dependent items stay Parked.
- LoadFailedNotice: message required, no default. minTapTarget={false} kept (row 114).
- fr Breakdown is 'Détail' pending Isa's choice.
- summaryDetails.test.ts Breakdown check is strict for all four detail routes. Source text only.
- StreakCounter caption follows design colour (label). Dimmed count uses tertiaryLabel. Isa may override.
- Rendered Gym Training labels are a device check for Isa, not a loop test gap.
- training.tsx has no hardcoded copy left.
- energy.tsx: design wording where the app has the data; app wording where the design states what the app cannot compute. Recorded for Isa.
- Shared date and duration helpers are not translated. Parked.
- week.tsx has no gap row. Its copy is recorded here only unless Isa overrides.
- GymPatternsCard has no design counterpart. Its copy goes to t(); padding 20 stays pending Isa.
- Row 112 padding corrected R126: 16 on page, strip, calendar, TodayCard, MuscleChart. GymPatternsCard stays 20.

## Status
Last counted R89: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Last green checkpoint R89 (tsc 0, 65 suites, 824 tests). R102 and R117 checkpoint results never reported.

BUILT, not verified:
- LoadFailedNotice, Try again via common.tryAgain (R114; gap line 76 records it, R126). NOT COVERED.
- StreakCounter colours and caption (R118-R119). NOT COVERED.
- gym.tsx Training list title and four row labels via t() (R112). Device check pending.
- week.tsx, training.tsx, energy.tsx copy via t() (R116-R124). No gap row for week.tsx. Remaining English is Parked helpers.
- Breakdown label via dashboard.breakdown on week, training, energy (R124, stable ids).
- Freeze label (gap line 82).

## Next
1. R127 (in progress): GymPatternsCard visible copy to t(), with tsc and changed-file tests.
2. gym.tsx header comment lines 3-4 'month month' typo (own round).
3. food.tsx ~445 empty copy; dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
4. One file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
5. PlannedValuesForm.tsx:200 'Add exercise' vs design.
6. add.tsx slotKey (~67): remove unused keys if confirmed.
7. Raw item values food.tsx:852, :895 and food/saved.tsx:144: park if no design decision.
8. /gym/session saves top weight on all sets: fix or park.
9. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
10. Freeze strings at count 1 read wrongly.
11. Checkpoint: full tsc and full app suite, read-only. Include R102 and R117.
12. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? (mutations.ts:173-178)
- Device checks: Gym Training labels (en, es, fr), logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line, LoadFailedNotice, StreakCounter caption, es and fr text fit.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review. fr 'Détail' vs 'Répartition' (recommend Répartition); fr 'gel' vs 'congélation' (recommend 'Appliquer un gel de série'); 'Ingesta y gasto' and 'Apport et dépense' fit; energy 'eatenAgainstBurned' fr wording.
- Which gap row records week.tsx, or whether a Week row should exist.
- energy.tsx design wording: deficit caption, steps row, burn target sub. Keep app or match design.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename plannedExercisesNoDuration; keep freeze screen; StreakCounter wrap row; 'Start workout' and 'Training' / 'Session history' labels.
- Gym calories vs Training energy; training caption wording; minutesCeiling 'min' vs 'm' fit.
- GymPatternsCard padding 20 vs 16.

## Parked
- Shared helpers, English-only: formatRelativeDate (formatting.ts:44); weekdayShort and dayMonth (energyRange.ts:60, :67); formatDuration (formatting.ts:25).
- Plurals read '1 of 1 days': weekNetAveragedOver, weekNetSummary, weekNetAverage. trainingMinutesSummary reads 'longest 1 minutes'.
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood local only (mutations.ts:157); server sync needs backend.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route, PlannedValuesForm submit.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, pop-in, ring vs flame. Streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop missing; gym.dayStreak vs dashboard.dayStreak; count style; caption case.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen.
- Duplicates: dashboard.training vs gym.training; dashboard.restDay vs gymLog.restDayTitle; dashboard.breakdown vs nutrition.breakdown; dashboard.energy vs preferences.energy.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; dashboard.kcal may duplicate another namespace; StreakCounter.tsx stale comment and old tokens; gym.tsx header typo; GymPatternsCard padding 20.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice, week or training empty states, or the Gym Training labels. No repo test loads the locale files. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Breakdown checks read source text only.

## Gotchas
- Briefs repeat finished work, quote stale lines and name wrong paths. Check first.
- Correct paths: src/app/energy.tsx; src/app/dashboard/training.tsx; src/app/dashboard/week.tsx; locales in src/lib/i18n/locales/. Not src/locales, not src/app/training.tsx.
- test.each assertions are shared across routes.
- Design copy is encoded: decode the __bundler/manifest script with node. Lume screens: 7dc211f6, 185bb533, 71f71ac4, b09a5e65.
- zsh: quote (tabs) paths and globs. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.

## Round log (condensed)
R9-R89: most surfaces built. Checkpoints R34, R48, R61, R77, R89 green.
R90-R124: strings via t(); LoadFailedNotice message required; row 114 deviation recorded; Breakdown via t() across screens; week, training and energy copy to t(); Breakdown row keys made stable ids.
R101, R113 rejected. R102 and R117 checkpoints issued, never reported.
R125: week.tsx sweep; later closed in R126.
R126: doc-only. Line 76 records Try again. Row 112 padding corrected. Citations at 437 and 1505 are correct and stay. Report had no tsc-only issue but tests were not run; loop flagged it. Addressed in R127.
R127 (current): GymPatternsCard copy to t(), with tsc and changed-file tests.
