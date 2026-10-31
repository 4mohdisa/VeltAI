# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Macros stored unrounded, rounded to 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- Rows stay DIFFERENT while other differences remain. A row that only records a change in its reason cell keeps its status.
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
- training.tsx has no hardcoded copy left. Helper English goes to Parked.
- energy.tsx: design wording kept where the app has the data; app wording kept where the design states things the app cannot compute (deficit count, steps row, burn target sub). Recorded for Isa.
- R125: shared date and duration helpers are not translated in this loop. They stay Parked.
- R126: week.tsx has no row in the gap doc. Its copy is recorded in these notes only. No Week row is added unless Isa overrides.

## Status
Last counted R89: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Last green checkpoint R89 (tsc 0, 65 suites, 824 tests). R102 and R117 checkpoint results never reported.
BUILT, not verified:
- LoadFailedNotice (R114, NOT COVERED).
- StreakCounter colours and caption (R118-R119, NOT COVERED).
- gym.tsx Training list title, row labels, Try again (R112). Device check pending.
- week.tsx copy via t() (R116, R120, R125). No gap row. Sweep closed in R126: no inline English UI text left. Remaining English is from Parked helpers.
- training.tsx copy via t() (R121-R122). No gap row.
- energy.tsx copy via t() (R123). Breakdown row keys now stable ids (R124, closed). No gap row.

## Next
1. Doc only (R126, in progress): record Try again at gap line 76; fix stale citations at line 437 (gym.tsx:94-158) and line 1505 ('lines 72-75'); check row 112 'padding 20 vs 16' against design and code.
2. food.tsx ~445 empty copy; dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
3. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
4. PlannedValuesForm.tsx:200 'Add exercise' vs design.
5. add.tsx slotKey (~67): remove unused keys if confirmed.
6. Raw item values food.tsx:852, :895 and food/saved.tsx:144: park if no design decision.
7. /gym/session saves top weight on all sets: fix or park.
8. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
9. Freeze strings at count 1 read wrongly.
10. Checkpoint: full tsc and full app suite, read-only. Include R102 and R117 results.
11. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? (mutations.ts:173-178)
- Device checks: Gym Training labels (en, es, fr), logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line, LoadFailedNotice, StreakCounter caption, es and fr text fit in rows and segmented control.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review. week.tsx weekNoNetMessage; weekNetAveragedOver; 'Ingesta y gasto' and 'Apport et dépense' fit in segmented control; fr 'gel' vs 'congélation' (recommend 'Appliquer un gel de série'); Breakdown 'Détail' vs 'Répartition' (recommend Répartition); training dashboard.workouts; energy.tsx 'eatenAgainstBurned' fr wording and chart header fit.
- energy.tsx design wording differences (deficit caption, steps row, burn target sub): keep app or match design.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename plannedExercisesNoDuration; keep freeze screen; StreakCounter wrap row; 'Start workout' and 'Training' / 'Session history' labels.
- Gym calories vs Training energy; training caption wording; minutesCeiling 'min' vs 'm' fit.

## Parked
- Shared helpers, English-only, feed translated screens: formatRelativeDate (formatting.ts:44, outputs 'Today'/'Yesterday' into energyNetSub); weekdayShort and dayMonth (energyRange.ts:60, :67; day axis uses weekdayShort letters); formatDuration (formatting.ts:25, feeds sessionSummary).
- Plural sentences read '1 of 1 days': weekNetAveragedOver, weekNetSummary, weekNetAverage. trainingMinutesSummary reads 'longest 1 minutes'.
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
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; dashboard.kcal may duplicate another namespace.
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
R90-R114: strings via t(); LoadFailedNotice message required; row 114 deviation recorded.
R101, R113 rejected. R102 and R117 checkpoints issued, never reported.
R103-R112: Breakdown via t() across screens; gym.tsx Training labels via t().
R116-R122: week.tsx and training.tsx copy to t(); StreakCounter colours and caption.
R123: energy.tsx copy to t(). R124: Breakdown row keys made stable ids, closed.
R125: week.tsx hardcoded copy sweep (en, es, fr keys together). Handover NEXT item on shared helpers rejected: they are Parked. Report found no edits; loop flagged it as partly done. Resolved in R126: sweep closed, remaining English is Parked.
R126: doc-only round for gap line 76, row 112 and stale citations at lines 437 and 1505.