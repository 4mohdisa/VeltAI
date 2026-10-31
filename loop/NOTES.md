# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain. Checkpoint rounds read-only.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary, totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- SegmentedField compact drops chip padding and shrink; only Quick add passes it.
- Gym Log button follows showLogCta. Gym tab shows today only.
- Saving 0 kcal allowed. Design wins on zero-kcal confirm state.
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- My schedule card on Gym tab shows three days. Seven days belongs to My schedule screen.
- Row 112 accepted deviations: Training list (keep); LoadFailedNotice (keep); lumeFade mount-only, skipped under Reduce Motion; literal -0.6 tracking, 52pt right padding, page gap 14, eyebrow minHeight 26 on wrapper.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html, the gap row, and the branch rule.
- R246: gym bottom padding done gym-only, not in shared TAB_BAR_CLEARANCE, because Summary and Food rows are unchecked. Jev ranked the shared change first; kept gym-only for this reason.

## Status
- R246: row 112 bottom padding task issued (gym.tsx only, literal 158). Previous report flagged for no tsc or test run; this round runs them.
- R245: row 112 page gap 12 to 14 in gym.tsx. BUILT, not verified.
- R244: row 112 gap change prepared; see R245.
- R243: row 112 title block BUILT (tracking, padding, gap 0). Not verified.
- R242: row 112 eyebrow BUILT (letter spacing 1.1, minHeight 26 wrapper). Not verified.
- R241: row 112 eyebrow re-check (doc only).
- R240: row 112 lumeFade mount-only fade BUILT. Not verified.
- R236 checkpoint green: tsc 0, 65/65 suites, 824/824 tests (before R240-245 changes).
- R231-235: My schedule card and row 83 copy, icon, es/fr. BUILT.
- R227-230: Log button under session card per showLogCta. BUILT.
- R218-223: row 87 items, chip padding and shrink. BUILT.
- R207: rows 85 and 86 parts. BUILT.

## Open rows
- 83 DIFFERENT: route (sheet-in-place) parked; button height and type parked. Doc App paragraph near 532 stale.
- 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 112 PARTIAL: eyebrow, title block, card gap, Log button, MyScheduleCard, lumeFade BUILT. Bottom padding: R246 builds 158 in gym.tsx. Top padding still differs (design 70; code insets.top + space.md). Re-checked as app-only: Training list, LoadFailedNotice. GymPatternsCard typography Blocked. Pull-to-refresh app-only.

## Next
1. Confirm R246 result (tsc and touched tests). Then decide top padding: keep inset-tied, or literal 70 (note: 70 leaves 8pt under the status bar at a 62 inset).
2. Gym cluster, one file per round: GymSessionButton, GymCalendar, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts.
3. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
4. Shared TAB_BAR_CLEARANCE bottom value for Summary and Food: only after their rows are re-checked.
5. Doc fix once no build row is open: lines 236, 310 (old pill text); row 81 duplicates 112 (keep 112); row 83 App paragraph near 532; gym App paragraph near 436 and Differences near 446; My schedule section near 586; record Training list, LoadFailedNotice and lumeFade reduce-motion as accepted; lumeFade 'no page entrance animation' is wrong; page bottom padding.
6. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 85: 12px calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms transition; chip truncation incl. French.
- 112: GymPatternsCard padding 20 vs 16. Training list and LoadFailedNotice confirm (recommended keep).
- Gym Log button hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow centring and ~10pt shift; title block spacing and profile clearance; lumeFade and shadows; pull-to-refresh; tab bar es/fr width; food row; offline failure; add menu wrap at 232pt; swipe dialogs; long es/fr text; gym button position, width, French, chevron; Quick add bottom spacing; My schedule spacing and short weekday fr/es; gym bottom padding 158 on notched and non-notched devices.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review es/fr: 'Log this session', 'Registrar esta sesion', 'Enregistrer cette seance'.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', 'Done', 'Close', GymStatusCard.tsx:30, scan.ts:305; GymPatternsCard server values; MyScheduleCard weekday follows device language.
- Copy: foodLog.per100; CaloriesCard g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 'Updated {name}' toast; foodLog.savedAdded toast; + menu toast; row 83 sheet-in-place; gym toast fade.
- Gym button: 56pt vs 52; label 17/24 vs 16/21; duplicated Button pill styles.
- Gym code: GymSessionButton logged branch dead; two logged sources; two getToday requests; MyScheduleCard fetches twice, silent on failure, not refreshed on pull; two LoadFailedNotices can stack (TodayCard.tsx:197, gym.tsx); per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Gym UI: card pressed 0.85 vs light1; 'N days planned' colour; pull-to-refresh and focus do not re-read TodayCard or Log button.
- Shared TAB_BAR_CLEARANCE: gym-specific 158 used instead; Summary and Food bottom padding unchecked.
- Easing bezier duplicated in gym.tsx and AddMenu.tsx.
- Stale comments: gym.tsx header (lists old card order); gym.tsx:144; SegmentedField label; food.tsx:656-659.
- Code: SLOT_KEYS duplicated; StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; SettingsList.tsx:129 identical branches; duplicate 'training' key.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx render, MyScheduleCard render.
- Doc: summary table Quick add '(line 86)'; stale lines 895-897, 930, 934, 1017, 1058, 1504; row 87 repeated BUILT; line 103 unchecked.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. Three gym suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Gym bundle 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing. Say BUILT, never verified.

## Handover and Jev
- Handover summary in loop/HANDOVER.md. Received after R244, before R245. Script-managed every 15 rounds.
- Jev R244: run 97%, last task clean 90%, risk 1.2. Agreed.
- Jev R245: run 88%, last task clean 90%, risk 1.4 (confidence 0.36). Agreed with run; re-check chosen.
- Jev R246: run 85%, last task clean 4%, risk 1.4 (confidence 0.11). Top task ranked 98% was the shared TAB_BAR_CLEARANCE change; overridden to gym-only (see Decisions).