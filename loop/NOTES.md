# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain. Checkpoint rounds read-only.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary, totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- SegmentedField compact drops chip padding and shrink; only Quick add passes it.
- Gym Log button follows showLogCta. No not-past check: Gym tab shows today only.
- Saving 0 kcal allowed. Design wins on zero-kcal confirm state.
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- My schedule card on Gym tab shows three days. Seven days belongs to My schedule screen.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html, the gap row, and the branch rule.
- Row 112 Training list: accepted deviation (only route to /gym/templates and /gym/history). Keep.
- Row 112 LoadFailedNotice: accepted deviation (R239). Keep unless Isa overrides.
- Row 112 lumeFade: mount-only fade (R240), accepted. Reduce Motion skips the fade (app-only accessibility guard), accepted unless Isa overrides.

## Status
- R243: row 112 title block (tracking -0.6, 4pt side padding, 52pt right padding, block gap, paddingBottom). Prompt issued; compare first, change only real differences. tsc and three gym suites required.
- R242: row 112 eyebrow build (letterSpacing 1.1, minHeight 26 wrapper View in gym.tsx). BUILT, not verified. tsc 0; hydrationErrorScreens 10/10, oneTapGymLog 3/3, tabNavigation 11/11. Isa to check centring and ~10pt shift on device.
- R241: row 112 eyebrow re-check (doc only). Differences found: letter spacing 1.1 vs 1; min height 26 vs none.
- R240: lumeFade mount-only fade built in gym.tsx (BUILT, not verified on device). tsc exit 0; 24/24 gym-related tests.
- R236 checkpoint green: tsc 0, app 65/65 suites, 824/824 tests.
- R231-R235: My schedule card and row 83 copy, icon, es/fr; card typography and gap. BUILT.
- R227-R230: Log button under session card per showLogCta. BUILT.
- R218-R223: row 87 items, chip padding and shrink. BUILT.
- R207: rows 85 and 86 parts. BUILT.

## Open rows
- 83 DIFFERENT: route (sheet-in-place) parked; button height and type parked. App paragraph near line 532 stale. Settle 83 vs 112 overlap.
- 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 112 PARTIAL: eyebrow BUILT (R242, not verified). Title block R243 in progress. GymPatternsCard typography (padding Blocked). Pull-to-refresh app-only.

## Next
1. R243 build row 112 title block in gym.tsx (compare first). Then the cluster below.
2. Gym cluster, one file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
3. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
4. Doc fix once no build row is open: gap doc near lines 310 and 236 (contradict row 83); row 81 duplicates row 112 card (keep 112); row 83 App paragraph near 532; gym App paragraph near 436 and Differences near 446 (omit MyScheduleCard, stale refs, LoadFailedNotice accepted); My schedule section near 586; record Training list, LoadFailedNotice and lumeFade reduce-motion as accepted; lumeFade written section 'no page entrance animation' is wrong.
5. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85: 12px calorie bar; 'left today'; four-column wrap (es 'Carbohidratos').
- Row 87: 17/24 vs 17/22; bottom spacing 20pt + safe area vs 34pt; figure and meal defaults; 180ms transition; chip truncation incl. French.
- Row 112: GymPatternsCard padding 20 vs 16.
- Gym Log button hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow min height 26 shifts content below by about 10pt, centring; lumeFade on first Gym open, shadows during fade, pull-to-refresh with new wrapper; tab bar es/fr width; Training labels; food row; offline failure; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; gym button position, width, French, chevron; Quick add bottom spacing and KeyboardAvoidingView; My schedule spacing, 12.5pt, short weekday fr/es.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review es/fr: 'Log this session', 'Registrar esta sesion', 'Enregistrer cette seance'.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', NumberEntryBar 'Done', SheetContent 'Close', GymStatusCard.tsx:30, scan.ts:305; GymPatternsCard server values untranslated; MyScheduleCard weekday follows device language.
- Copy: foodLog.per100; CaloriesCard hardcoded g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 700ms bar fill; 'Updated {name}' toast; foodLog.savedAdded toast; + menu toast when logged; row 83 sheet-in-place route; gym toast fade (ToastHost has own entrance code).
- Gym button: about 56pt vs 52; label 17/24 vs 600 16/21; duplicated Button pill styles and haptic.
- Gym code: GymSessionButton logged branch dead; two logged sources (streak.gymLoggedToday, today.already_checked_in); two getToday requests; MyScheduleCard fetches twice; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Gym UI: Training list 'My schedule' row duplicates card (keep); card pressed 0.85 vs light1; 'N days planned' colour.
- Pull-to-refresh and focus do not re-read TodayCard or Log button.
- Gym error: TodayCard.tsx:197 and gym.tsx both render gym.loadFailed (double notice possible); MyScheduleCard silent on failed read.
- Easing: bezier numbers duplicated in gym.tsx and AddMenu.tsx; a shared Reanimated easing token would remove repeats.
- Stale comments: gym.tsx header and above MuscleChart; gym.tsx:144; SegmentedField label; food.tsx:656-659 cites UI_PASS_GAPS.md.
- Code: SLOT_KEYS duplicated (detail.tsx, quick-add.tsx); TodayCard, StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Code tidying: SettingsList.tsx:129 identical branches; duplicate 'training' key in locale files.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx render, MyScheduleCard render.
- Doc: summary table Quick add '(line 86)' wrong column; stale lines 895-897, 930, 934, 1017, 1058, 1504; row 87 repeated BUILT; line 103 unchecked.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx. detail.tsx strings already translated.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing. Say BUILT, never verified.
- Test suites only read source text; no test renders quick-add, gym.tsx or SegmentedField.

## Handover and Jev
- Handover summary in loop/HANDOVER.md; last received R236. Script-managed every 15 rounds.
- Jev R240: run 67%, last task clean 75%, risk 1.1. R241: run 79%, last task clean 93%, risk 1.1. Agreed with run.
- Jev R242: run 86%, last task clean 5% (flagged for missing tsc/tests; R242 prompt requires them), risk 1.3 (confidence 0.28). Ranked row 112 eyebrow build first; agreed.
- Jev R243: run 93% (confidence 0.89), last task clean 87%, risk 1.3 (confidence 0.40). Agreed with run; row 112 title block chosen.