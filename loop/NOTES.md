# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Literals only where no token covers the value (7, -1, 1.1, -0.6, 52).
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- DetailChart.tsx and SegmentedField.tsx need Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- A row says BUILT only when no differences remain in its own files; otherwise PARTIAL.
- No BUILT claim for kicker or dots (shared DetailChart.tsx).
- Food eyebrow uses Pressable defaults; haptics off. Energy detail is src/app/energy.tsx.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour color.primary.
- A repeated unanswered blocker is parked, not asked again until Isa raises it.
- Every prompt states the loop/design-match branch rule.

## Status
- R284: R283 report was flagged (type check and tests not run). Verification round: tsc and detailChrome test, no edits, no -u.
- R283: rows 76 and 103 re-checked (doc only). 76 PARTIAL, 8 differences. 103 stays DIFFERENT.
- Card gap: nutrition.tsx 16 OK; energy.tsx 16 OK; week.tsx 12 and training.tsx 12 still differ.
- Summary 1-30 re-checked. Built: food title block, streak row, eyebrow, energy hero stat, energy net sign (EnergyBalanceCard.tsx:155), Summary 14, 25 (letter spacing), 26, 27. Header height 82 EXACT.
- Last full checkpoint R258: tsc 0, 65/65 suites, 824/824. Next checkpoint R290, handover due.
- Snapshot RED: detailChrome macros and energy. One Isa-approved jest -u on src/__tests__/render/detailChrome.render.test.tsx.

## Open rows
- 76 Gym chooser PARTIAL: rest-day and Something else close do not return to Gym tab; Only some opens /gym/session, not a second sheet; logged day reopens chooser and writes a second session row; template time vs plan minutes; celebration calories dash; cardio minutes go to notes; checklist icon has no cross.
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: title block BUILT. Calorie bar, 'left today', four-column wrap Blocked.
- 87 DIFFERENT: 180ms Meal chip transition Blocked.
- 103 DIFFERENT: week.tsx and training.tsx gap 12. Kicker and dots Blocked (DetailChart.tsx).
- 104 PARTIAL: Steps card Blocked. Summary 17 needs SegmentedField.
- 112 PARTIAL: top padding; GymPatternsCard padding Blocked. Training list and LoadFailedNotice accepted.

## Next
1. R284: verification (this round).
2. Row 103: dashboard/week.tsx card gap 12 to 16. Expect snapshot red; add to approval.
3. Row 103: dashboard/training.tsx card gap 12 to 16.
4. Row 76 logged-day toast: Blocked on LumeTabBar.tsx permission.
5. Copy: nutrition, week, training, energy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
6. If Isa approves DetailChart.tsx: row 103 kicker and dots, then one snapshot approval.
7. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome.render.test.tsx (asked R267, R279, R281).
- DetailChart.tsx edit (asked R267).
- LumeTabBar.tsx:179 + menu on a logged day (needs permission).
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms, chip truncation.
- 112 GymPatternsCard padding 20 or 16. 104 Steps card (HealthKit off-limits).
- Summary 17 SegmentedField; 21 weekly target and calories per session; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15 (recommend data-driven); header strip Screen.tsx:163.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, including food.pickDayLabel.
- TestPG_* (18 skipped).

## Parked (one line each)
- i18n: hardcoded English in Summary index.tsx, EnergyBalanceCard, WeekEnergyCard, WorkoutsWeekCard, MacroBars, WeekStrip, calendar.tsx, GymStatusCard, session.tsx:74-79, scan.ts; formatNumber en-AU.
- WeekEnergyCard zero case shows '+' only above 0; design '+0'. Stat baseline WeekEnergyCard.tsx:106-107; WorkoutsWeekCard.tsx:40-41.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Chooser: subtitle caption gap 2; bottom padding; pinned footer and Button label (shared SheetContent); sheet height _layout.tsx:155; second sheet not built; duration change; checklist icon unseen; unused keys gymLog.restDayMessage and gymLog.logAnExercise; stale doc lines 192, 229.
- Gym Summary card logs with no UI (index.tsx:179).
- Streak skeleton and notice (index.tsx:108, :114) sit 2 higher.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Profile header strip (row 110); Screen.tsx:163 inset-based.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height, '+' sign, chooser.
- Doc: stale lines 236, 310, 430-431, 438, 448, 534, 588, 1520; row 85 citations; row 112 says EXACT; row 104 says BUILT where list says EXACT.
- Comment: ProfileAvatarButton.tsx:8.
- Two unspecified 'flagged report' requests: ignore unless repeated with detail.
- Profile route is src/app/profile.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Gym, Summary, Food suites read source text; layout largely untested.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Line numbers shift; grep before citing. Doc row numbers are file lines.
- Never run jest -u unasked.

## Jev
- R284: ask 68%, run 30%. Kept run. Reason: flagged check needs no Isa answer; ask blocker asked three times.
- R283: ask 57%, run 38%. Kept run. Reason: re-check needs no answer.
- R282 and R281: ask 71% and 79%. Kept run.