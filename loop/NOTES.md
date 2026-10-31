# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Macros stored unrounded, rounded to 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and go under Parked.
- Rows stay DIFFERENT while other differences remain.
- Citations: insertion at line N moves only citations at or after N.
- Checkpoint rounds are read-only. Doc-only rounds run tsc only.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name the branch and forbid git.
- Every prompt names its design/ file and gap row, or says none exists. One task per prompt.
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass. No covering test means NOT COVERED.
- Backend-dependent items stay Parked.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- energyLogged es and fr: '{{unit}} en total', '{{unit}} au total'. No agreement, no colon, reads after the number.
- Tab labels reuse existing keys with the same English value (R142): Summary = dashboard.summaryTitle, Food = food.title, Gym = gym.title. Native review pending.
- Add-button VoiceOver strings use a new tabBar namespace (R143), en, es and fr together.

## Status
R143 (pending): add-button VoiceOver strings to tabBar.* keys. Gap counts from R142: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
Last green full checkpoint: R89 (tsc 0, 65 suites, 824 tests). Checkpoints R102, R117, R131 never reported. Still owed; run when announced.

## BUILT, not verified
- LoadFailedNotice (NOT COVERED).
- StreakCounter tokens (NOT COVERED).
- gym.tsx Training title and row labels via t().
- week, training, energy copy via t(); energy Breakdown row ids stable.
- Freeze label (gap line 82).
- GymPatternsCard copy, seven gym.* keys (NOT COVERED; es and fr unreviewed).
- food.tsx ErrorState messages, Food title, Calories title (gymLog.celebration.calories, shared).
- CaloriesCard macro labels via nutrition.protein, carbs, fat.
- food.tsx unit label via nutrition.energyLogged (NOT COVERED).
- Food, Summary and Gym tab labels via t() in LumeTabBar.tsx (R140, R142). Render test is English only.

## Next
1. Add-button VoiceOver strings in LumeTabBar.tsx via tabBar.closeAddMenu, tabBar.add, tabBar.addHint (R143).
2. (tabs)/_layout.tsx Summary and Gym titles via existing keys (dashboard.summaryTitle, gym.title).
3. Owed checkpoint: full tsc and app suite, read-only. Run when announced.
4. Dedupe SLOT_KEYS (food.tsx). Resolve food.savedTitle vs addMenu.myDishes.
5. food.tsx: 'Check your connection' invents a cause; 'today's' shows on other dates.
6. CaloriesCard: grep first (handover and notes disagree on macro names at food.tsx:665-667). Fibre column missing; dot vs bar (row 85). Add or park.
7. One file per round: GymPatternsCard server values, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. PlannedValuesForm.tsx 'Add exercise'. add.tsx slotKey: remove unused keys if confirmed.
9. Raw item values (food.tsx, food/saved.tsx:144): park if no design decision. /gym/session top weight on all sets: fix or park.
10. nutrition.tsx '80%' vs '80 %'; raw meal.slot. Freeze strings at count 1.
11. week.tsx remaining copy, then training.tsx and energy.tsx.
12. Energy unit at food.tsx; VoiceOver 'protein', 'carbs', 'fat'; 'g' suffix at food.tsx:690; VoiceOver label at food.tsx:853; raw energyUnit at food.tsx:787 and 906.
13. No rows left: stop with 'only owner decisions remain'.
Grep first. Line numbers drift.

## Blocked on Isa (do not retry)
- Device checks: tab bar in es and fr (Gimnasio is longer than Gym), gym Training labels, logged card, offline failure, double notice, TodayCard sub-line, LoadFailedNotice, StreakCounter caption, es/fr fit, minutesCeiling, eatenAgainstBurned, inAndOut, energy unit card, energyLogged in es and fr.
- Native review: fr 'Detail', 'Repartition', 'gel', 'congelation', 'Apport et depense'; es 'Ingesta y gasto'; eatenAgainstBurned fr; gym.oftenSkip es/fr; energyLogged es/fr; tab labels es and fr (tabs.food, tabs.summary, tabs.gym as now reused: Resumen, Comida, Gimnasio; Résumé, Repas, Sport); add-button tabBar.* es and fr (R143).
- Shared keys: food.title for tab and Food title; dashboard.summaryTitle and gym.title for tabs. Split if wording should differ. Comida and Repas read as 'meal': separate food.caloriesTitle?
- Already-logged days: edit or toast? (mutations.ts:173-178).
- Gap rows: detail screens, tab bar label, week row, empty food day (four meal cards or 'No meals yet').
- Design wording differences: energy.tsx deficit caption, steps row, burn target sub; GetToday flag; group names; training list; profile row; streak wording.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'; food detail differences 1, 2, 4; verdicts near 961, 1210.
- Search routing; global and title; quick add serving order; add sheet 0pt gap; 'Snacks'; GymPatternsCard padding 20 or 16.
- Volume fix; heatmap wording; calories cell needs backend field; TodayCard wash pill, whole-day kcal, chevron; log as planned minutes and energy literals; remaining-kcal line.
- No body stats: app shows 1,500 kcal, design uses 2,100.

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration.
- Plurals: '1 of 1 days', 'longest 1 minutes'.
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood local only (mutations.ts:157): needs backend.
- GymPatternsCard server values as received (src/lib/api.ts:795-800); '%' format.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, pop-in, ring vs flame; streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop; gym.dayStreak vs dashboard.dayStreak; count style.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen.
- Duplicate keys across dashboard, gym, gymLog, preferences, goals, nutrition.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys; StreakCounter.tsx old tokens.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- Stale citations: gap doc lines 437 and 1505.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice, week, training empty states, GymPatternsCard, or the food log empty state. Only the hydration test loads locale files. energyLogged and tab label es/fr are not covered. Add-button tabBar keys are not covered in es or fr.

## Gotchas
- Briefs repeat finished work and quote stale lines. Check first.
- Design copy is encoded: decode __bundler/manifest with node. Food is 71f71ac4; energy, week, training are 185bb533.
- Name design/Lume App.html and the screen id in every prompt.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- i18next plurals need both _one and _other; fr treats 0 as one.
- kcal is feminine, kJ masculine in es and fr: avoid agreeing participles.

## Round log
- R138: energyLogged wording decided.
- R139: verified R138 by source-text tests. No change.
- R140: Food tab label via labelKey. Render test passed in English.
- R141: rejected (asked for more than one screen). Summary and Gym tab labels not done.
- R142: Summary and Gym tab labels via existing keys in LumeTabBar.tsx. Tab render test 13 of 13 in English. No locale edits.
- R143: add-button VoiceOver strings to tabBar.* (this round).