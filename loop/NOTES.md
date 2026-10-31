# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary, totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- Gym Log button follows showLogCta. Gym tab shows today. My schedule shows three days. Swipe colour: color.primary.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Design 70, 82, 158 are measured from screen edge (includes status and tab bar). 158 and 14 are literals. FloatingHeader default 82. Top padding insets.top + space.md, pending Isa.
- Food last-block footer: blockGap 0 when load failed, else 14.
- Row 112 accepted deviations, pending Isa: Training list, LoadFailedNotice, lumeFade mount-only, literal -0.6, 52pt right padding, page gap 14, eyebrow minHeight 26, literal easing.
- TAB_BAR_CLEARANCE function left untouched.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked.
- Checkpoints run tsc and full suite. Doc-only rounds run no tests; doc-only flags close when no code changed.
- Notes outrank handover on row 85 title block (R260 built it).
- Kept run over Jev's ask R261-263: design wins by default; /food/calendar already exists; Isa's blocked items already on file.
- R264: chose row 103 card gap first (small, no Isa input needed). Added the branch-only rule after the loop note rejected the last prompt.

## Status
- R264: row 103 card gap 12 vs 16 (build, tsc once, Macros detail file found by grep).
- R263: last report flagged (no tsc run). Row 85 re-check ran tsc once.
- R262: header re-check, doc only. Header 82 EXACT on tabs and Screen; top padding differs everywhere.
- R261: row 85 eyebrow opens /food/calendar (code, not on device). tsc 0.
- R260: row 85 title block built. R258 checkpoint: tsc 0, 65/65 suites, 824/824.
- R253-257: Summary and Food values built. R240-248: gym cluster built.

## Open rows
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: eyebrow and title built. Blocked: calorie bar, 'left today', four-column wrap. Top padding pending.
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: card gap in progress (R264); 176pt chart; top padding; kicker, stat line, Breakdown dots.
- 104 PARTIAL: Steps card missing; four non-design items; Today only; differences 25-27 open.
- 112 PARTIAL: top padding; GymPatternsCard typography blocked; Training list and LoadFailedNotice app-only.

## Next
1. R264: row 103 card gap 12 vs 16 (in progress).
2. Row 103: chart height, kicker, stat line, Breakdown dots, then top padding (after Isa answers).
3. Row 104: Steps card and scope, build or park.
4. Re-check Summary differences 1-25, 29, 30 (doc only).
5. Gym cluster, one file per round: GymSessionButton, GymCalendar, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts.
6. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
7. Doc fixes once no build row is open.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 85: calorie bar; 'left today'; four-column wrap; Meal history link (recommend keep).
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms; chip truncation.
- 112: GymPatternsCard padding 20 vs 16; Training list (keep); LoadFailedNotice (accept).
- Top padding Gym, Summary, Food: inset-tied or literal 70 (recommend inset-tied).
- Gym Log hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow, calendar return, title spacing, shadows, pull-to-refresh, tab bar es/fr, food row, offline, add menu at 232pt, swipe dialogs, long es/fr text, schedule weekday, bottom 158 notched, header 82, Food gaps.
- Native review es/fr: food.pickDayLabel; 'Log this session'; 'Registrar esta sesion'; 'Enregistrer cette seance'.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ food.tsx:912; disc glyph strokes.
- Header strip on floating screens: Screen.tsx:163 fixed 84 for Profile, or keep inset-based (ask before changing).
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: hardcoded English month, weekday, Today, Yesterday, 'Quick add', 'Done', 'Close', GymStatusCard.tsx:30, scan.ts:305, Summary index.tsx:146/149/179; formatNumber en-AU; energy unit ignored; MyScheduleCard weekday; food eyebrow device locale; calendar.tsx:40; WeekStrip.tsx:43.
- Food: eyebrow tappable during search; picking a day then changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 'Updated {name}' toast; savedAdded toast; + menu toast; toast fade.
- Gym button: 56pt vs 52; 17/24 vs 16/21; duplicated pill styles; dead logged branch.
- Gym data and UI: double getToday; MyScheduleCard double fetch and silent failure; LoadFailedNotices stack; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route; pressed 0.85 vs light1; pull-to-refresh misses TodayCard and Log button; GymPatternsCard server values.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52; 3 tests); stale comments _layout.tsx:26, LumeTabBar.tsx:4, gym.tsx, food.tsx:656-659; Screen.tsx:163 inset header on floating screens; gym detail screens share 82/110 via Screen (uncited); Screen.tsx:22 unused re-export of FLOATING_HEADER_HEIGHT.
- Layout: Profile and About/Delete account header strip, gradient and mask differ (row 110 values recorded in gap doc).
- Code: easing bezier and SLOT_KEYS duplicated; StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; SettingsList.tsx:129; duplicate 'training' key.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height.
- Doc: stale gap-doc lines near 236, 310, 375-376, 422, 432, 438, 441, 448, 458, 534, 564, 588, 655, 972, 1293-1295, 1471-1480, 1520; row 87 repeated BUILT; line 103 unchecked; row 81 duplicates 112; rows 85 and 104 say BUILT for 158; row 112 says EXACT; row 85 stale line numbers (:441, :564, :655 now).

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. Gym, Summary, Food suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes. `echo ====` errors in zsh.
- Claude Code forgets at handover: name files fully.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md (not ours).
- Line numbers shift; grep before citing.
- Every prompt must say: work only on loop/design-match; never switch, create, push or merge.

## Handover and Jev
- Handover every 15 rounds into loop/HANDOVER.md. Last before R260.
- Jev R258-264: kept run over ask with stated reasons. R264: run 81%, ask 17%, stop 2% (confidence 0.72); last task clean 6%; risk 1.5/2 (confidence 0.25).