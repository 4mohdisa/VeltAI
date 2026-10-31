# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Design 70, 82, 158 measured from screen edge; 158 and 14 are literals. Top padding insets.top + space.md, pending Isa.
- Macros unrounded, 1 dp on save; totals whole. Unknown slot falls back to 'Add meal'.
- Gym Log follows showLogCta. Gym tab shows today. Swipe colour color.primary.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice.
- TAB_BAR_CLEARANCE left untouched.
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- Shared components DetailChart.tsx and SegmentedField.tsx need Isa approval.
- Code tidying is never a task. Doc fixes wait until no build row is open, except corrections inside a re-check round.
- Re-check rounds cap at 5 rows.
- Every prompt: work only on loop/design-match; never switch, create, push or merge.
- Checkpoints: tsc plus jest --ci, no -u.
- A flagged report is answered by a tsc re-run in the next doc-only round, with exit code recorded. If repeated, answer with a code round running tsc and changed-file tests.
- Unanswered questions are not repeated.

## Status
- R276: Food title block, row 85, sent (food.tsx:435-447, :439). Chosen by Jev ranking and handover Next item 2.
- R275: Summary eyebrow spacing (row 25) built, index.tsx:96 letterSpacing 1 to 1.1. tsc 0; five-file tests 83/83.
- R274: Summary title block and streak row built (index.tsx:92, :100, :121). tsc 0; five-file tests 83/83.
- R273: Summary 26-30 re-checked. 28-30 need Isa.
- R270-272: Summary 1-25 re-checked; differences in the gap doc.
- Last full checkpoint R258: tsc 0, 65/65 suites, 824/824. R265 checkpoint never reported.
- R240-264: gym cluster, Summary and Food values built; row 85 title block built R260.
- Handover done at R275. Next due R290.

## Open rows
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: food title block in progress (R276); calorie bar, 'left today', four-column wrap open (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: card gap built. DetailChart.tsx open (Blocked). Energy.tsx, dashboard/week.tsx, dashboard/training.tsx still gap 12.
- 104 PARTIAL: Steps card missing; four non-design items; Today only. Summary 25 open.
- 112 PARTIAL: top padding; GymPatternsCard padding; Training list and LoadFailedNotice app-only.

## Next
1. Food title block, row 85 (R276, in progress). Verify result in report.
2. Energy balance hero stat, difference 14 (EnergyBalanceCard.tsx:153-154, letter spacing 0 to -1, baseline gap 8 to 7). Confirm which row it belongs to in the gap doc first; value-only.
3. Energy, week and training card gap 12 to 16, row 103 (values only).
4. Row 104 Steps card: build or park (needs Isa).
5. Gym cluster, one file per round.
6. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
7. If Isa approves DetailChart.tsx: row 103 values, then one snapshot approval.
8. Doc fixes inside a re-check round, or once no build row is open.
9. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 103: approve DetailChart.tsx edit and detailChrome snapshot update (asked R267, no answer).
- 85: calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms; chip truncation.
- 112: GymPatternsCard padding 20 or 16.
- 104: Steps card build or park (needs step data; HealthKit off-limits).
- Summary 17: SegmentedField label and track padding and height. Needs approval; shared component.
- Summary 21: weekly workout target and calories per session. Exist or not?
- Summary 28: glass and blur, design vs native.
- Summary 29: profile initials vs person glyph; top insets.top + 4 vs 64.
- Summary 30: pull-to-refresh keep or remove (parked, not removed).
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70. Recommended inset-based; literal 70 leaves 8 under the status bar at a 62 inset.
- Gym Log hidden on rest days: acceptable?
- Burn target, differences 10-11: add data or accept app-only?
- Energy week axis (15): data-driven (recommended) or fixed.
- Header strip on floating screens: Screen.tsx:163 fixed 84 or inset-based.
- Meal history link: keep or remove. Recommended keep; only entry to /food/history found.
- Training list: keep or remove. Recommended keep.
- LoadFailedNotice: accept as deviation. Recommended accept.
- Device checks (owner only): fade, shadows, pull-to-refresh, title spacing, eyebrow centring, French button label, schedule weekday labels, bottom padding, header strip, Food block gap.
- Native review es/fr strings and long labels.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: hardcoded English strings in Summary index.tsx:146/149/179, GymStatusCard.tsx:30, scan.ts:305, EnergyBalanceCard, WeekEnergyCard, WorkoutsWeekCard, summaryCards.ts, MacroBars.tsx, WeekStrip.tsx:43, ProfileAvatarButton.tsx:30; formatNumber en-AU.
- Summary streak skeleton and load-failed notice (index.tsx:108, :114) use 4 above; not in design; sit 2 higher than the loaded streak row.
- WeekEnergyCard zero case: net shows '+' only above 0; design shows '+0'.
- Week stat: baseline gap 8 vs 6 and letter spacing 0 vs -0.6 (WeekEnergyCard.tsx:106-107).
- Workouts stat: same two values as the Energy hero stat (WorkoutsWeekCard.tsx:40-41, difference 21); fix with the Energy stat round or separately.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing: 'Updated {name}' toast; savedAdded toast; + menu toast; toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Profile and About/Delete header strip (row 110).
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height.
- Doc: stale gap-doc lines near 236, 310, 438, 448, 534, 588, 1520; stale recap lines 430-431 (still say title and spacing 'still different'); rows 85 and 104 say BUILT for 158; row 112 says EXACT; row 104 says BUILT for bottom padding and card gap while the Summary list says EXACT.
- Comment: ProfileAvatarButton.tsx:8 calls insets.top + space.xs the design's 64; fix in a doc or comment pass.
- Comment: LumeTabBar.tsx:4 and _layout.tsx:26 wrong; fix in a doc or comment pass.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Gym, Summary and Food suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes. In zsh, `echo ====` errors.
- Claude Code forgets at handover: name files fully.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md (not ours).
- Line numbers shift; grep before citing.

## Jev
- R276: pending. Ranking: food title block first (ask 1%).
- R275: run 99%. Ranked Summary eyebrow first at 96%. Took it.
- R274: run 94%. Ranked Summary 26-27 first. Took it.
- R273 and earlier: run ranked first in most rounds. R267: ask 94%, acted on it.
