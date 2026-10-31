# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows (42 data rows, counted top-down; Isa may correct). Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Literals only where no token covers the value.
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- DetailChart.tsx and SegmentedField.tsx need Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- A row says BUILT only when no differences remain in its own files; otherwise PARTIAL.
- No BUILT claim for kicker or dots (shared DetailChart.tsx).
- Food eyebrow uses Pressable defaults; haptics off.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour color.primary.
- A repeated unanswered blocker is parked, not asked again until Isa raises it.
- Every prompt states the loop/design-match branch rule.
- Privacy footnotes go onto SettingsList footer prop (decided R288, done R289, privacy.tsx only).

## Status
- R289: flagged check cleared (R288: tsc 0, 4 suites 49/49, no snapshots). Row 107 footnote spacing to footer prop issued. Row 107 stays PARTIAL (headers, AI group, export still differ).
- R288: flagged check on row 107 issued. Jev's row 108 pick overridden for this reason.
- R287: prompt for row 107 Privacy gap 22 issued. Footnotes widened to 22 (design 8); fix pending.
- R286: flagged check still not run; handled in R288.
- R285: rows 107, 108, 109, 111, 113 re-checked (PARTIAL, doc only). Lines 110 and 112 checked earlier.
- Summary 1-30 re-checked. Built: food title block and eyebrow (row 85, still DIFFERENT); Summary 14, 25, 26, 27; header height 82 EXACT.
- Macros card gap 16 done in dashboard/nutrition.tsx (row 103, still DIFFERENT).
- Card gap 12 still in dashboard/week.tsx and training.tsx. energy.tsx: conflicting reports, re-check first.
- Snapshot RED: detailChrome macros and energy, from the card gap. Waiting on approval.
- Last full checkpoint R258: tsc 0, 65/65 suites, 824/824. Next checkpoint R290.

## Open rows
- 76 PARTIAL: rest-day and Something else close do not return to Gym tab; second sheet missing; logged day reopens chooser; time and minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap Blocked.
- 87 DIFFERENT: 180ms Meal chip transition Blocked.
- 103 DIFFERENT: week.tsx and training.tsx gap 12. Kicker and dots Blocked.
- 104 PARTIAL: Steps card Blocked.
- 107 PARTIAL: Privacy footnote spacing (R289 issued); headers, AI group, export via share sheet.
- 108 PARTIAL: Support gap 20; eyebrow copy; feedback opens Mail.
- 109 PARTIAL: About gap 26; wordmark tracking 0 vs -0.6; header app-only.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding Blocked.
- 113 PARTIAL: Gym My schedule; 'My workouts' section missing; picker sheet.
- 114-118: not yet re-checked.

## Next
1. Row 107 footnotes onto SettingsList footer prop; remove the literal 22 from privacy.tsx (R289, issued).
2. Row 108 Support gap 20 (support.tsx:29).
3. Re-check rows 114-118 (doc only).
4. Row 109 About gap 26, with its header decision.
5. Row 103 week and training gap 12 to 16, after snapshot approval.
6. If Isa approves DetailChart.tsx: row 103 kicker and dots.
7. Energy balance net sign, difference 12 (EnergyBalanceCard.tsx:155).
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome.render.test.tsx. Parked; not asked again until Isa raises it.
- DetailChart.tsx edit. LumeTabBar.tsx logged-day menu permission.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card (HealthKit off-limits).
- Summary 17 SegmentedField; 21 weekly target and calories per session; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15 (recommend data-driven); header strip Screen.tsx:163.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, including food.pickDayLabel.
- TestPG_* (18 skipped).

## Parked (one line each, condensed)
- i18n: hardcoded English in Summary, energy, week, workouts, MacroBars, WeekStrip, calendar, GymStatusCard, session.tsx, scan.ts, schedule, privacy, support, about; formatNumber en-AU.
- Stats: WeekEnergyCard zero case '+0'; baselines WeekEnergyCard.tsx:106-107, WorkoutsWeekCard.tsx:40-41.
- AddMenu.tsx:3 says 6, code moves 8 (:61). Older section near line 855 may overlap Food menu row.
- SettingsList differs on every Profile row (shared change, affects all settings screens).
- appVersion.ts:13, :16: empty value hides on About.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Chooser: subtitle gap 2; bottom padding; pinned footer; sheet height _layout.tsx:155; second sheet; duration change; checklist icon; unused keys gymLog.restDayMessage, gymLog.logAnExercise.
- Gym Summary card logs with no UI (index.tsx:179). Streak skeleton and notice sit 2 higher (index.tsx:108, :114).
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8 comment.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height, '+' sign, chooser, Privacy layout.
- Doc: stale lines 236, 310, 430-431, 438, 448, 534, 588, 1520; row 85 citations; row 112 says EXACT; row 104 says BUILT where list says EXACT.
- Privacy title block paddingBottom 4 (Screen.tsx:117) makes space under title 26, not 22.
- Privacy hardcoded English remains.
- Two unspecified 'flagged report' requests: ignore unless repeated with detail.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text; layout largely untested.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Line numbers shift; grep before citing.
- Never run jest -u unasked.
- Tokens are in src/lib/design/tokens.ts (not src/theme).
- src/app/(tabs)/profile does not exist; use src/app/profile.

## Jev
- R287: run 85%, ask 14%. Kept run. Reason: gap build needs no Isa answer.
- R288: run 68%, ask 31%. Jev ranked row 108 first (81%). Kept the flagged check first: the flag must be cleared before moving on, which Jev cannot see.
- R289: run 79%, ask 20%. Jev ranked row 108 first. Kept row 107 footnote step: decided in R288, one file, flagged check now cleared.