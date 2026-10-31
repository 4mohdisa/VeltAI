# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only (no switch, push, merge). Say BUILT, never verified. Stop when all rows BUILT or only owner items remain. Checkpoint rounds read-only.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary, totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- SegmentedField compact drops chip padding and shrink; only Quick add passes it.
- Gym Log button follows design showLogCta. No not-past check: Gym tab shows today only.
- Saving 0 kcal allowed. Design wins on zero-kcal confirm state.
- Swipe colour: color.primary until Isa decides. Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- My schedule card on Gym tab shows three days (bundle 7dc211f6 schedNext). Seven days belongs to My schedule screen.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html, the gap row, and the branch rule.

## Status
- R236: checkpoint, full type check and app suite, read-only.
- R235: row 112 My schedule card typography (day 600 12.5/17, name 500 15/20) and gap 11. BUILT.
- R231-R234: row 112 My schedule card; row 83 copy, icon, es/fr. BUILT.
- R227-R230: Log button under session card, per showLogCta. BUILT.
- R218-R223: row 87 items, chip padding and shrink. BUILT.
- R207: rows 85 and 86 parts. BUILT.
- R222 checkpoint: app 65/65 suites, 824/824.

## Open rows
- 83 DIFFERENT: route (sheet-in-place) stale, parked. Button height and type parked.
- 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 112 PARTIAL: four-row Training list; LoadFailedNotice; pull-to-refresh; lumeFade; eyebrow tracking and min height; title tracking, padding, gap; GymPatternsCard typography (padding Blocked).

## Next
1. R236 checkpoint result. If green, row 112 Training list: re-check first, then build.
2. Row 112: LoadFailedNotice, pull-to-refresh, lumeFade, header typography. One per round, re-check first.
3. Gym cluster, one file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
4. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
5. Doc fix once no build row is open: gap doc lines 310 and 236 (contradict row 83); row 81 duplicates row 112 card (keep 112); row 83 App paragraph near 532; My schedule section near 586.
6. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85: 12px calorie bar; 'left today'; four-column wrap (es 'Carbohidratos').
- Row 87: 17/24 vs 17/22; bottom spacing 20pt + safe area vs 34pt; figure and meal defaults; 180ms transition; chip truncation incl. French.
- Row 112: GymPatternsCard padding 20 vs 16; whether app-only card stays.
- Gym Log button hidden on rest days and with no schedule: acceptable?
- Device checks: tab bar es/fr width; Training labels; food row; offline failure; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; gym button position, width with French, chevron weight; Quick add bottom spacing and KeyboardAvoidingView; My schedule spacing, 12.5pt legibility, short weekday in fr/es.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es/fr drafts: 'Log this session', 'Registrar esta sesion', 'Enregistrer cette seance'.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', NumberEntryBar 'Done', SheetContent 'Close', GymStatusCard.tsx:30, scan.ts:305; GymPatternsCard server values untranslated; MyScheduleCard weekday follows device language, Today and Tomorrow follow app language.
- Copy: foodLog.per100; CaloriesCard hardcoded g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 700ms bar fill; 'Updated {name}' toast; foodLog.savedAdded toast; + menu should toast when logged; row 83 sheet-in-place route.
- Gym button: about 56pt vs 52; label 17/24 vs 600 16/21; duplicated Button pill styles and haptic.
- Gym code: GymSessionButton logged branch dead, hardcoded 'Logged today' copy; two logged sources (streak.gymLoggedToday, today.already_checked_in); two getToday requests; MyScheduleCard fetches twice on first load; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Gym UI: Training list 'My schedule' row duplicates card destination (keep); card pressed 0.85 vs light1; 'N days planned' colour tertiary vs secondary.
- Pull-to-refresh and focus do not re-read TodayCard or Log button.
- Stale comments: gym.tsx header and above MuscleChart; gym.tsx:144; SegmentedField label; food.tsx:656-659 cites UI_PASS_GAPS.md.
- Code: SLOT_KEYS duplicated (food, add, quick-add, detail); TodayCard, StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; Text primitive comment vs named styles.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx render, MyScheduleCard render.
- Doc: summary table Quick add '(line 86)' wrong column; stale lines 895-897, 930, 934, 1017, 1058, 1504; row 87 repeated BUILT; line 103 unchecked.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only.

## Gotchas
- Decode design/Lume App.html with node from __bundler/manifest into /tmp only.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist). detail.tsx strings already translated.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing. Say BUILT, never verified.

## Handover and Jev
- Handover summary in loop/HANDOVER.md; received this round. Script-managed every 15 rounds.
- Jev: R233 ask 67% not followed (copy covered by decisions). R234 run 90%, agreed. R235 ask 77% not followed (three-vs-seven answered by bundle 7dc211f6). R236 checkpoint: Jev run 57%, ask 23%, stop 20% (confidence 0.35); run kept, checkpoint is read-only. Risk 1.1 noted.