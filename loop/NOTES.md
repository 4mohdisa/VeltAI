# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Design 70, 82, 158 measured from screen edge. 158 and 14 are literals. Top padding insets.top + space.md, pending Isa.
- Macros unrounded, 1 dp on save; totals whole. Unknown slot falls back to 'Add meal'.
- Gym Log follows showLogCta. Gym tab shows today. Swipe colour color.primary.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice.
- TAB_BAR_CLEARANCE function left untouched.
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- Shared component edits (DetailChart.tsx) need Isa approval.
- Code tidying is never a task. Doc fixes wait until no build row is open, except corrections inside a re-check round.
- Re-check rounds cap at 5 rows.
- Every prompt: work only on loop/design-match; never switch, create, push or merge.
- Checkpoints: tsc plus jest --ci, no -u.
- A flagged report is answered by re-running tsc in the next doc-only round, with the exit code recorded.
- Unanswered questions are not repeated.

## Status
- R271: Flagged R270 (tests not run; tsc exit 0 recorded). Answered by doc-only round with tsc re-run. Chose Summary 16-20 re-check. Row 16 corrected (gBars 65px, min 4 vs app min 5, WeekEnergyCard.tsx:34).
- R270: Summary 11-15 re-checked. Burn target and fixed axis need Isa.
- R269: Summary 1-10 re-checked.
- R268: DetailChart question unanswered, not repeated.
- R265 checkpoint result never reported. Last full checkpoint R258: tsc 0, 65/65 suites, 824/824.
- R264: row 103 card gap 16 built (nutrition.tsx:76). Macros snapshot red, blocked on Isa.
- R240-257: gym cluster, Summary and Food values built. R260: row 85 title block built.

## Open rows
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: eyebrow and title built. Open: calorie bar, 'left today', four-column wrap, title tracking and padding (food.tsx:435-447).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: card gap built. Open in DetailChart.tsx (Blocked): kicker dot, tracking, title tracking, padding, Breakdown dot and gap, stat gap. Also 176pt chart; Energy.tsx, dashboard/week.tsx, dashboard/training.tsx still gap 12.
- 104 PARTIAL: Steps card missing; four non-design items; Today only. Differences 1-15 re-checked. 16-30 open.
- 112 PARTIAL: top padding; GymPatternsCard padding; Training list and LoadFailedNotice app-only.

## Next
1. Summary differences 16-20 re-check, doc only, tsc re-run (R271).
2. Summary 21-25, then 26-30, one batch per round, doc only.
3. Row 104: Steps card build or park.
4. Gym cluster, one file per round.
5. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
6. Food title block (row 85): tracking, right padding, block gaps.
7. If Isa approves DetailChart.tsx: row 103 value changes, then one snapshot approval for four detail views.
8. Doc fixes once no build row is open.
9. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 103: approve DetailChart.tsx edit; approve detailChrome snapshot update. Asked R267, no answer.
- 85: calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms; chip truncation.
- 112: GymPatternsCard padding 20 or 16.
- 104: Steps card build or park (needs step data; HealthKit off-limits).
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Gym Log hidden on rest days and with no schedule: acceptable?
- Burn target for Summary (differences 10, 11): add to data or accept app-only?
- Energy week axis (15): keep data-driven (recommended) or fixed.
- Device checks: eyebrow, calendar return, title spacing, shadows, pull-to-refresh, es/fr tab bar, food row, offline, add menu 232pt, swipe dialogs, long es/fr text, schedule weekday, bottom 158 notched, header 82, Food gaps, Macros baseline, Breakdown label, fade, French button label.
- Native review es/fr strings and long labels.
- Header strip on floating screens: Screen.tsx:163 fixed 84 or inset-based.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: hardcoded English month, weekday, Today, Yesterday, Quick add, Done, Close; GymStatusCard.tsx:30; scan.ts:305; Summary index.tsx:146/149/179; EnergyBalanceCard.tsx:131-191; WeekEnergyCard.tsx:64, 100-101, 111; WorkoutsWeekCard.tsx:28; MacroBars.tsx:53; formatNumber en-AU; WeekStrip.tsx:43.
- WeekEnergyCard zero case: net uses '+' only above 0 (:108, :138); design sgn gives '+0'.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy (Summary 24).
- Missing: 'Updated {name}' toast; savedAdded toast; + menu toast; toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Profile and About/Delete header strip (row 110).
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height.
- Doc: stale gap-doc lines near 236, 310, 438, 448, 534, 588, 1520; row 87 repeated BUILT; row 112 says EXACT; rows 85 and 104 say BUILT for 158; row 104 count of non-design items; Summary write-up item 3 uses fBars figures; handover food title stale.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Gym, Summary, Food suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Claude Code forgets at handover: name files fully.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md (not ours).
- Line numbers shift; grep before citing.

## Handover and Jev
- Handover every 15 rounds. Last R260. Next due around R275.
- Jev R271: run 93%, ask 6%. Ranked run first. Chose run.
- Jev R270: run 90%. R269: run 91%. R268: ask 93%, kept run (reason in R268). R267: ask 94%, acted on it.