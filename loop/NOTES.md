# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Top padding: insets.top + space.md, pending Isa. Design 70, 82, 158 measured from screen edge; 158 and 14 literal.
- Macros unrounded, 1 dp on save; totals whole. Unknown slot falls back to 'Add meal'.
- Literals only where no token covers the value (7, -1, 1.1, -0.6, 52).
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- DetailChart.tsx and SegmentedField.tsx need Isa approval.
- Code tidying is never a task. Doc fixes wait until no build row is open, except corrections inside a re-check round.
- Re-check rounds cap at 5 rows.
- Food eyebrow uses Pressable defaults for hit slop; haptics off.
- No BUILT claims for Macros kicker or Breakdown dots: they live in shared DetailChart.tsx.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour color.primary.

## Status
- R279: Energy card gap 12 to 16 (row 103, energy.tsx only). Sent.
- R278: Energy balance net sign (difference 12) BUILT, code re-checked. EnergyBalanceCard.tsx:155. Gap doc :406. tsc 0; three-file tests 65/65.
- R277: Energy balance hero stat (difference 14) BUILT, code re-checked. tsc 0.
- R276: Food title block (row 85) re-checked, already matches. No code change.
- R275: Summary eyebrow spacing (row 25) built. tsc 0.
- R274: Summary title block and streak row built. tsc 0.
- R270-273: Summary 1-30 re-checked. Differences in gap doc.
- Handover done at R275. Next due R290.
- Last full checkpoint R258: tsc 0, 65/65 suites, 824/824.
- Snapshot RED: detailChrome macros snapshot from the Macros card gap (dashboard/nutrition.tsx). Needs one Isa-approved jest -u on that file.

## Open rows
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: title block BUILT. Calorie bar, 'left today', four-column wrap open (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: card gap 16 built in dashboard/nutrition.tsx. Energy gap in progress (R279). week.tsx and training.tsx still gap 12. Kicker and Breakdown dots open (DetailChart.tsx, Blocked).
- 104 PARTIAL: Steps card missing (Blocked). Summary difference 17 needs SegmentedField change.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked); Training list and LoadFailedNotice app-only (accepted).

## Next
1. Confirm R279 result: row 103 Energy gap.
2. Row 103: dashboard/week.tsx gap 12 to 16 (one file per round).
3. Row 103: dashboard/training.tsx gap 12 to 16.
4. Gym cluster, one file per round, starting with the plan-aware 'How did it go?' chooser.
5. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
6. If Isa approves DetailChart.tsx: row 103 kicker and dots, then one snapshot approval.
7. Doc fixes inside a re-check round, or once no build row is open.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 103: approve DetailChart.tsx edit and the detailChrome macros snapshot update (asked R267 and in handover, no answer).
- 85: calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms; chip truncation.
- 112: GymPatternsCard padding 20 or 16.
- 104: Steps card build or park (step data source; HealthKit off-limits).
- Summary 17: SegmentedField label, track padding, height. Shared component; check inset callers first.
- Summary 21: weekly workout target and calories per session. Exist or not?
- Summary 28: glass and blur, design vs native.
- Summary 29: profile initials vs person glyph; top insets.
- Summary 30: pull-to-refresh keep or remove.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Gym Log hidden on rest days: acceptable?
- Burn target, differences 10-11: add data or accept app-only?
- Energy week axis (15): data-driven (recommended) or fixed.
- Header strip on floating screens: Screen.tsx:163 is inset-based. Fixed 84 or inset-based?
- Meal history link: keep (recommended).
- Training list: keep (recommended).
- LoadFailedNotice: accept (recommended).
- Device checks (owner only): fade, shadows, pull-to-refresh, title spacing, eyebrow centring, French button label, schedule weekday labels, bottom padding, header strip, Food block gap.
- Native review es/fr strings and long labels, including food.pickDayLabel (es and fr unreviewed).
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: hardcoded English in Summary index.tsx (about :146, :149, :179, and streak skeleton and notice :108, :114, which sit 2 higher than the loaded row), EnergyBalanceCard.tsx (:131, :135, :148, :164-165, :184, :191), WeekEnergyCard, WorkoutsWeekCard, summaryCards.ts, MacroBars.tsx, WeekStrip.tsx:43, ProfileAvatarButton.tsx:30, calendar.tsx, GymStatusCard.tsx:30, scan.ts:305; formatNumber en-AU.
- WeekEnergyCard zero case: net shows '+' only above 0; design shows '+0' (check whether difference 12 covers this).
- Week stat: baseline gap 8 vs 6, letter spacing 0 vs -0.6 (WeekEnergyCard.tsx:106-107).
- Workouts stat: baseline gap 8 vs 7, letter spacing 0 vs -1 (WorkoutsWeekCard.tsx:40-41).
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing: 'Updated {name}' toast; savedAdded toast; + menu toast; toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Profile and About/Delete header strip (row 110).
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height; no test checks the new '+' sign.
- Doc: stale gap-doc lines near 236, 310, 438, 448, 534, 588, 1520; stale recap lines 430-431; rows 85 and 104 say BUILT where lists say EXACT or DIFFERENT; row 85 citations (food.tsx:633, :542 now about :655, :564); row 112 says EXACT.
- Comment: ProfileAvatarButton.tsx:8 (insets.top + space.xs called the design's 64).
- Two 'flagged report' requests never said what was flagged; ignore unless repeated with detail.
- Profile route is src/app/profile (src/app/(tabs)/profile does not exist).

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Gym, Summary and Food suites read source text only; layout largely untested.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Claude Code forgets at handover: name files fully.
- Line numbers shift; grep before citing. Doc row numbers are file lines.

## Jev
- R279: run 91%. Ranked Energy card gap first. Took it.
- R278: run 99%. Took Energy net sign.
- R277: run 98%. Took Energy hero stat.
- R276: ask 1%. Took food title block; already built.
- R275 and earlier: run ranked first in most rounds. R267: ask 94%, acted on it.