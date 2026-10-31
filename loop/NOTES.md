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

## Status
Gap counts (R142): 24 DIFFERENT, 14 PARTIAL, 4 BUILT. Last green full checkpoint R89 (tsc 0, 65 suites, 824 tests). Owed full suite: R102, R117, R131, R146; request at next flagged checkpoint.

## Built, not verified (es and fr unreviewed, mostly NOT COVERED)
- Tab labels, Summary and Gym titles, Food title, Calories card macro labels, add menu labels, LoadFailedNotice and StreakCounter tokens, GymPatternsCard copy, week, training, energy copy, freeze label, food row VoiceOver (food.row* keys, R151).

## Next
1. Swipe-delete prompt in food.tsx (~520-521): date-neutral and translated. (Running now.)
2. Verify tab label 'Food' (LumeTabBar.tsx:38, (tabs)/_layout.tsx:32). Reports conflict on whether R149 finished it.
3. CaloriesCard: missing Fibre column; dot vs bar (row 85, whole-screen, do not mark BUILT).
4. 'Check your connection' invents a cause (food.tsx).
5. Visible P, C, F letters on food row (~899); g suffixes (~690, ~856, VoiceOver ~854); raw energyUnit.
6. Visible 'Analyzing…' on food row (~875) to t(), spelling 'Analysing'.
7. One file per round: GymPatternsCard server values, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. PlannedValuesForm 'Add exercise'. add.tsx slotKey unused keys.
9. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
10. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
11. week.tsx remaining copy, then training.tsx, energy.tsx.
12. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; logged, analysing and failed food rows (VoiceOver); offline failure; LoadFailedNotice; StreakCounter caption; minutesCeiling; eatenAgainstBurned; inAndOut; energy unit card; add menu labels wrap at 232pt (fr, es).
- Native review: es/fr draft strings incl. food.row*, tabBar.*, addMenu, closeMenu, gym.oftenSkip, energyLogged, eatenAgainstBurned; fr 'Detail', 'Repartition', 'gel', 'congelation'; es 'Ingesta y gasto'.
- Design questions: food.title shared by tab and screen (Comida, Repas); separate caloriesTitle? Empty day: four meal cards or 'No meals yet'? GymPatternsCard padding 20 or 16? Already-logged days: edit or toast (mutations.ts:173-178)? Design wording: energy deficit caption, steps, burn target, weekly target, GetToday flag, group names, training list, profile row, streak wording, footnote '23 sessions 2 freezes'. Rows 90, 330, 334, 89, 23, 17. Search routing; quick add serving order; add sheet 0pt gap; 'Snacks'; TodayCard wash pill, whole-day kcal, chevron; remaining-kcal line. No body stats: app 1,500 kcal, design 2,100.

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing from FoodResult (src/lib/mock/data.ts:124); editSavedFood is local only (needs backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800); '85%' format.
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; estimated duration; custom exercise route; /gym/session top weight and second row.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix.
- Row 17 rest-day exits, streak flame pulses, artwork.
- StreakCounter: unused active and caption props; accessible prop; gym.dayStreak vs dashboard.dayStreak.
- Freeze: singular counts; toast before server reply; refusal unhandled; streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}' accent; plan.addTitle es/fr; '14-day' hyphen; duplicate keys across namespaces.
- Leftover es.json addMenu.voice and addMenu.describeOutLoud: remove in cleanup.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN on undefined profile field.
- Raw item values: food.tsx, food/saved.tsx:144.
- Stale citations: gap doc lines 437 and 1505 (verify before editing).

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Fibre uses > 0.

## Gotchas
- Briefs repeat finished work and quote stale lines. Grep first. Line numbers drift.
- Design copy is encoded: decode __bundler/manifest with node. Food 71f71ac4; energy, week, training 185bb533.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- i18next plurals need _one and _other; fr treats 0 as one.
- kcal is feminine, kJ masculine: avoid agreeing participles.