# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Literals only where no token covers the value (7, -1, 1.1, -0.6, 52).
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- DetailChart.tsx and SegmentedField.tsx need Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds, or once no build row is open.
- Re-check rounds cap at 5 rows.
- A row can say BUILT only when no differences remain in its own files. Otherwise PARTIAL.
- No BUILT claim for kicker or dots (shared DetailChart.tsx).
- Food eyebrow uses Pressable defaults; haptics off.
- Energy detail screen is src/app/energy.tsx.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour color.primary.
- A repeated unanswered blocker is parked and not asked again until Isa raises it.
- Every prompt must state the loop/design-match branch rule (no switch, push or merge).

## Status
- R283: Latest chooser report says row 76 is BUILT, but R282 set it to PARTIAL. Next round is a doc-only re-check of rows 76 and 103 to settle the conflict.
- R282: Chooser report flagged as partly done. Row re-checked (doc only) and set to PARTIAL with remaining differences.
- R281: Chooser (src/app/gym/log-session.tsx) changed: tiles two equal columns gap 12; divider edge to edge; 12 spacing; plan minutes per exercise; checklist icon; rest day uses Redirect. tsc 0; 4 suites 29/29.
- R280: Checkpoint, no changes. Expected reds: energy and macros snapshots.
- R279: Energy card gap 12 to 16 in src/app/energy.tsx. Snapshot RED, awaiting approval.
- R278: Energy net sign BUILT (EnergyBalanceCard.tsx:155).
- R277: Energy hero stat BUILT.
- R276: Food title block re-checked, already matches.
- R274-275: Summary title block, streak row and eyebrow spacing BUILT.
- R270-273: Summary 1-30 re-checked.
- Last full checkpoint R258: tsc 0, 65/65 suites, 824/824. Next checkpoint R290, also handover due.
- Snapshot RED: detailChrome macros (dashboard/nutrition.tsx gap) and energy balance. One Isa-approved jest -u on src/__tests__/render/detailChrome.render.test.tsx.

## Open rows
- 76 Gym chooser: PARTIAL per R282. Status under re-check in R283.
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: title block BUILT. Calorie bar, 'left today', four-column wrap open (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: card gap 16 built in nutrition.tsx and energy.tsx (snapshot pending). week.tsx and training.tsx still gap 12. Kicker and dots open (DetailChart.tsx, Blocked). Re-check in R283.
- 104 PARTIAL: Steps card missing (Blocked). Summary difference 17 needs SegmentedField change.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked). Training list and LoadFailedNotice app-only (accepted).

## Next
1. R283: re-check rows 76 and 103 (doc only). Confirm row 76 status and the card gap in each of the four detail files.
2. Row 103: dashboard/week.tsx gap 12 to 16 (one file per round). Expect snapshot red; add to approval request.
3. Row 103: dashboard/training.tsx gap 12 to 16.
4. Row 76: rest-day close returns to the Gym tab, if the re-check confirms the gap. Needs LumeTabBar.tsx permission only if the + menu route is part of it.
5. Copy: nutrition, week, training, energy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
6. If Isa approves DetailChart.tsx: row 103 kicker and dots, then one snapshot approval.
7. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Snapshot: one approved jest -u on detailChrome.render.test.tsx (asked R267, R279, R281; no answer).
- DetailChart.tsx edit (asked R267; no answer).
- + menu on a logged day: LumeTabBar.tsx:179 needs permission to edit (the design shows a toast and goes to the day).
- Shared SheetContent, Button and sheet height: affects every leading sheet.
- 85: calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; 180ms; chip truncation.
- 112: GymPatternsCard padding 20 or 16.
- 104: Steps card build or park (HealthKit off-limits).
- Summary 17: SegmentedField label, track padding, height.
- Summary 21: weekly target and calories per session.
- Summary 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15 (recommend data-driven); header strip Screen.tsx:163.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, including food.pickDayLabel.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: hardcoded English in Summary index.tsx, EnergyBalanceCard, WeekEnergyCard, WorkoutsWeekCard, MacroBars, WeekStrip, calendar.tsx, GymStatusCard, session.tsx:74-79, scan.ts; formatNumber en-AU.
- WeekEnergyCard zero case shows '+' only above 0; design shows '+0'.
- Week stat baseline/letter spacing (WeekEnergyCard.tsx:106-107); Workouts stat (WorkoutsWeekCard.tsx:40-41).
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Gym chooser: the sheet subtitle is footnote, but the design uses caption with gap 2; bottom padding 20 plus safe area against design 34; everything scrolls, whereas the design pins the footer (all in shared SheetContent, affects every leading sheet). Shared Button label 17/24 vs 16/21. Sheet height fitToContents at _layout.tsx:155 vs design 92% max. Difference 8 (second 'What did you do?' sheet) not built in /gym/session.
- Gym chooser: duration change also alters logged duration and celebration Time when a template has no estimated duration; check on device.
- Gym chooser: checklist SF Symbol is used nowhere else and is unseen on device.
- Gym chooser: unused keys gymLog.restDayMessage and gymLog.logAnExercise in en, es, fr.
- Gym chooser: stale doc lines 192 and 229 still describe the old 'Rest day' state; log-session.tsx citations have shifted.
- Gym: Summary card still logs with no UI (src/app/(tabs)/index.tsx:179, difference 23).
- Streak skeleton and notice (index.tsx:108, :114) sit 2 higher than the loaded row.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Profile and About/Delete header strip (row 110).
- Layout: Screen.tsx:163 strip is inset-based on all floating detail screens, not 82 or 84.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129.
- Chooser unused keys gymLog.restDayMessage and gymLog.logAnExercise in en, es and fr.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height, the '+' sign, or the chooser.
- Doc: stale gap-doc lines near 236, 310, 438, 448, 534, 588, 1520; recap lines 430-431; row 85 citations (food.tsx about :655, :564); row 112 says EXACT; row 104 says BUILT where its list says EXACT.
- Comment: ProfileAvatarButton.tsx:8.
- Two 'flagged report' requests never said what was flagged; ignore unless repeated with detail.
- Profile route is src/app/profile (src/app/(tabs)/profile does not exist).

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Gym, Summary and Food suites read source text; layout largely untested.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Claude Code forgets at handover: name files fully.
- Line numbers shift; grep before citing. Doc row numbers are file lines.
- Do not run jest -u without Isa approval.
- Prompts must name the matching design/ file and the loop/design-match branch rule.

## Jev
- R283: ask 57%, run 38%. Kept run. Reason: the re-check needs no Isa answer, and the ask is a blocker already asked three times.
- R282: ask 71%, run 22%. Kept run. Reason: the re-check needs no Isa answer and clears the flagged report.
- R281: ask 79%, run 16%. Kept run; chose the chooser to avoid a second snapshot red.
- R280: ask 77%, run 19%. Kept run for the required checkpoint.
- R279 and earlier: run ranked first in most rounds.