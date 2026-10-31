# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Macros stored unrounded, 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es and fr together. Other hardcoded strings stay English, listed under Parked.
- Tab labels reuse existing keys: Summary = dashboard.summaryTitle, Food = food.title, Gym = gym.title.
- Rows stay DIFFERENT or PARTIAL while differences remain.
- Citations: insertion at line N moves only citations at or after N.
- Checkpoint rounds are read-only. Doc-only rounds run tsc only.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name the branch and forbid git.
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass. No covering test means NOT COVERED.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Prompts name the design/ file and screen id. Rejected prompts are rewritten before running.
- A task that changes one of a set of sibling labels finishes the whole set in the same round (R148 lesson).
- One surface or one shared component per prompt. Multi-surface prompts are rejected (R150).

## Status
Gap counts (R142): 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
Last green full checkpoint: R89 (tsc 0, 65 suites, 824 tests). Owed, never reported: R102, R117, R131, R146. Request the full suite at the next checkpoint the loop flags.

## Round log (condensed)
- R145: tabBar.closeMenu added. R147: addMenu.logGymSession and addMenu.logFood added.
- R148: Summary and Gym titles via t(). Food title left literal; flagged as partial.
- R149: Food tab title via food.title (LumeTabBar.tsx, _layout.tsx).
- R150: Prompt rejected for covering more than one screen. Rewritten as one task: food.tsx logged-row VoiceOver labels via nutrition.* keys.

## BUILT, not verified
- LoadFailedNotice and StreakCounter tokens (NOT COVERED).
- gym.tsx Training title and row labels; week, training and energy copy via t(); energy Breakdown row ids stable.
- GymPatternsCard copy, seven gym.* keys (NOT COVERED; es and fr unreviewed).
- Freeze label (gap line 82).
- food.tsx: ErrorState messages, Food title, Calories title (gymLog.celebration.calories, shared), unit label via nutrition.energyLogged (NOT COVERED).
- CaloriesCard macro labels via nutrition.protein, carbs, fat.
- LumeTabBar tab labels via t() (render test English only, 13/13).
- Add button VoiceOver via tabBar.add and tabBar.addHint (NOT COVERED).
- AddMenu close label via tabBar.closeMenu; log labels via addMenu.logGymSession and addMenu.logFood.
- Summary and Gym titles via dashboard.summaryTitle and gym.title (NOT COVERED; no test imports the layout).

## Next
1. (IN PROGRESS, R150) food.tsx logged-row VoiceOver labels 'protein', 'carbs', 'fat' via nutrition.* keys (line ~853).
2. CaloriesCard: macro names at food.tsx:665-667; missing Fibre column; dot vs bar (row 85).
3. Dedupe SLOT_KEYS (food.tsx). Resolve food.savedTitle vs addMenu.myDishes.
4. food.tsx: 'Check your connection' invents a cause; "today's" shows on other dates.
5. One file per round: GymPatternsCard server values, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
6. PlannedValuesForm 'Add exercise'. add.tsx slotKey: remove unused keys if confirmed.
7. Raw item values (food.tsx, food/saved.tsx:144): park if no design decision. /gym/session top weight on all sets: fix or park.
8. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
9. week.tsx remaining copy, then training.tsx and energy.tsx.
10. food.tsx: energy unit; 'g' suffix at :690; raw energyUnit at :787 and :906.
11. No rows left: stop with 'only owner decisions remain'.
Grep first. Line numbers drift.

## Blocked on Isa (do not retry)
- Device checks: tab bar es and fr width; gym Training labels; logged card; offline failure; double notice; TodayCard sub-line; LoadFailedNotice; StreakCounter caption; es/fr fit; minutesCeiling; eatenAgainstBurned; inAndOut; energy unit card; energyLogged es/fr; VoiceOver on add menu es/fr; AddMenu labels wrap at 232pt in fr and es.
- Native review: fr 'Detail', 'Repartition', 'gel', 'congelation', 'Apport et depense'; es 'Ingesta y gasto'; eatenAgainstBurned fr; gym.oftenSkip es/fr; energyLogged es/fr; tab labels es/fr (Resumen, Comida, Gimnasio; Resume, Repas, Sport); tabBar.* es/fr incl. addHint ('sesion de gym', 'un registro de comida') and command vs infinitive; tabBar.closeMenu es/fr; AddMenu labels es/fr.
- Shared keys: food.title serves tab and Food title; Comida and Repas read as 'meal'. Separate food.caloriesTitle?
- Already-logged days: edit or toast? (mutations.ts:173-178).
- Gap rows: detail screens; tab bar label; week row; empty food day (four meal cards or 'No meals yet').
- Design wording: energy deficit caption, steps row, burn target sub; GetToday flag; group names; training list; profile row; streak wording.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'; food detail differences 1, 2, 4; verdicts near 961, 1210.
- Search routing; global and title; quick add serving order; add sheet 0pt gap; 'Snacks'; GymPatternsCard padding 20 or 16.
- Volume fix; heatmap wording; calories cell needs backend field; TodayCard wash pill, whole-day kcal, chevron; log as planned minutes; remaining-kcal line.
- No body stats: app shows 1,500 kcal, design uses 2,100.

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data. editSavedFood is local only (mutations.ts:157): needs backend.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800); '85%' format.
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; estimated duration; cardio planned minutes; custom exercise route.
- TodayCard: muscle prefix; header dot; min-height; gaps; pill type; grid; stale burn; per-session kcal; plan.sub prefix.
- Row 17 rest-day exits, pop-in, ring vs flame. Streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop; gym.dayStreak vs dashboard.dayStreak; count style.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen. Duplicate keys across dashboard, gym, gymLog, preferences, goals, nutrition.
- Leftover es.json keys addMenu.voice and addMenu.describeOutLoud: remove in cleanup.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys; StreakCounter.tsx old tokens; SLOT_KEYS duplication.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- Stale citations: gap doc lines 437 and 1505.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice, week, training empty states, GymPatternsCard, or the food log empty state. Only the hydration test loads locale files.

## Gotchas
- Briefs repeat finished work and quote stale lines. Check first.
- Design copy is encoded: decode __bundler/manifest with node. Food is 71f71ac4; energy, week, training are 185bb533. 'Log gym session' is also on 7dc211f6.
- Name design/Lume App.html and the screen id in every prompt.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- i18next plurals need both _one and _other; fr treats 0 as one.
- kcal is feminine, kJ masculine in es and fr: avoid agreeing participles.