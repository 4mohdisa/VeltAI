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
- Default answers: keep one-tap gym log on Summary card; keep Distance km; skip food search chips; keep Goals extras.
- week.tsx has no gap row; its copy is recorded here only.
- GymPatternsCard has no design counterpart; padding 20 pending Isa.

## Status
Last counted R89: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Last green checkpoint R89 (tsc 0, 65 suites, 824 tests). R102 and R117 checkpoints never reported.

BUILT, not verified (Isa to check):
- LoadFailedNotice: message required; Try again via common.tryAgain. NOT COVERED.
- StreakCounter colours and caption. NOT COVERED.
- gym.tsx Training list title and four row labels via t(). Device check.
- week, training, energy copy via t(); Breakdown via dashboard.breakdown.
- Freeze label (gap line 82).
- GymPatternsCard copy via seven gym.* keys (en, es, fr). NOT COVERED. es and fr unreviewed.

## Next
1. R128 (pending): verify GymPatternsCard with existing tests only. tsc once, three gym-tab source tests. No edits.
2. food.tsx ~445 empty copy; dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
3. One file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
4. PlannedValuesForm.tsx:200 'Add exercise' vs design.
5. add.tsx slotKey (~67): remove unused keys if confirmed.
6. Raw item values food.tsx:852, :895 and food/saved.tsx:144: park if no design decision.
7. /gym/session saves top weight on all sets: fix or park.
8. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
9. Freeze strings at count 1 read wrongly.
10. week.tsx remaining hardcoded copy, then training.tsx and energy.tsx.
11. Checkpoint: full tsc and full app suite, read-only. Include R102 and R117.
12. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? (mutations.ts:173-178)
- Device checks: Gym Training labels, logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line, LoadFailedNotice, StreakCounter caption, es and fr text fit.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: fr 'Détail' vs 'Répartition'; fr 'gel' vs 'congélation'; 'Ingesta y gasto' and 'Apport et dépense'; energy 'eatenAgainstBurned' fr; gym.oftenSkip es and fr (no article for {{day}}).
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

## Parked
- Shared helpers, English-only: formatRelativeDate (formatting.ts:44); weekdayShort, dayMonth (energyRange.ts:60, :67); formatDuration (formatting.ts:25).
- Plurals: weekNetAveragedOver, weekNetSummary, weekNetAverage ('1 of 1 days'); trainingMinutesSummary ('longest 1 minutes').
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood local only (mutations.ts:157); server sync needs backend.
- GymPatternsCard server values most_missed_day and muscle names shown as received (src/lib/api.ts:795-800). Check backend first.
- GymPatternsCard: '%' at line 100 gives '85%' vs es/fr '85 %'; cap() line 14 may be wrong for translated names.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route, PlannedValuesForm submit.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, pop-in, ring vs flame; streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop missing; gym.dayStreak vs dashboard.dayStreak; count style; caption case.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen.
- Duplicates: dashboard.training vs gym.training; dashboard.restDay vs gymLog.restDayTitle; dashboard.breakdown vs nutrition.breakdown; dashboard.energy vs preferences.energy.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; dashboard.kcal may duplicate; StreakCounter.tsx stale comment and old tokens; gap doc line 76 does not record the Try again change; GymPatternsCard padding 20.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- Stale citations: gap doc line 437 (gym.tsx:94-158), line 1505 (lines 72-75).
- Row 112 'padding is 20 vs 16 throughout' may be stale.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice, week or training empty states, or the Gym Training labels. No test renders GymPatternsCard. No repo test loads locale files. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Breakdown checks read source text only.

## Gotchas
- Briefs repeat finished work, quote stale lines, name wrong paths. Check first.
- Correct paths: src/app/energy.tsx; src/app/dashboard/training.tsx; src/app/dashboard/week.tsx; locales in src/lib/i18n/locales/. Not src/locales, not src/app/training.tsx.
- test.each assertions are shared across routes.
- Design copy is encoded: decode the __bundler/manifest script with node. Lume screens: 7dc211f6, 185bb533, 71f71ac4, b09a5e65.
- zsh: quote (tabs) paths and globs. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.

## Round log
- R129: gym.tsx header comment 'month month' typo fix (comment only, no gap row). Chosen over food.tsx empty copy and week.tsx copy as the smallest task.