# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows (42 data rows; Isa may correct). Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design value beats app-only literal. Literals only where no token covers the value.
- Never run jest -u or edit .snap files without Isa approval.
- DetailChart.tsx and SegmentedField.tsx need Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds (status-line updates after a build are allowed).
- BUILT only when no differences remain in own files; otherwise PARTIAL. No BUILT claim for kicker or dots (shared DetailChart.tsx).
- A check flagged as not run is cleared by running it (tsc plus related jest) before the next build.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour color.primary.
- A repeated unanswered blocker is parked, not asked again. Every prompt states the loop/design-match branch rule.
- Every build prompt names the matching design/ file and bundle.

## Status
- R293: previous prompt rejected (no design/ file named). Rewritten: row 109 About screen gap 26 in src/app/profile/about.tsx, with the row 108 flagged check cleared in the same task (tsc plus related jest). Header and wordmark left as they are (parked).
- R292: Support gap 20 done (support.tsx:30), tsc 0. No jest run: no test covers support.tsx. Flag carried into R293.
- R291: Privacy gap 22 restored and flagged check cleared.
- Earlier: Privacy footnotes; Summary 14, 25, 26, 27; Food title and eyebrow (row 85 still DIFFERENT); Macros card gap 16 (row 103 still DIFFERENT); header height 82 EXACT.
- Last full checkpoint R258: tsc 0, 65/65 suites, 824 tests. Full suite only when the loop script says so.

## Open rows
- 76 PARTIAL: rest-day and Something else close do not return to Gym; second sheet missing; logged day reopens chooser; time and minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: week.tsx and training.tsx card gap 12 to 16 (after snapshot approval); kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked, HealthKit off-limits).
- 107 PARTIAL: Privacy headers, AI group, export via share sheet.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast on email row; feedback label and send button styling; SettingsList row geometry. Gap 20 done R292. Flag clears in R293.
- 109 PARTIAL: About gap 26 (R293 task); wordmark tracking 0 vs -0.6; header app-only (parked, not removed).
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: Gym My schedule; 'My workouts' missing; picker sheet.
- 114-118: not yet re-checked.

## Next
1. R293: row 109 About gap 26, with the row 108 flagged check cleared (tsc plus related jest).
2. Re-check rows 114-118 and fix row 107 doc citations (privacy.tsx:60) in one re-check round.
3. Row 108 remaining items (feedback copy and Mail, toast, label and button styling, SettingsList geometry), one at a time.
4. Row 103 week and training gap 12 to 16, after snapshot approval.
5. Energy balance net sign, difference 12 (EnergyBalanceCard.tsx:155).
6. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome.render.test.tsx (snapshot RED from card gap 16).
- DetailChart.tsx edit (kicker, dots, stat line). LumeTabBar.tsx logged-day menu permission.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card.
- Summary 17 SegmentedField; 21 weekly target and calories per session; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15 (recommend data-driven); header strip Screen.tsx:163.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, including food.pickDayLabel. TestPG_* (18 skipped).

## Parked (one line each)
- i18n: hardcoded English across Summary, energy, week, workouts, MacroBars, WeekStrip, calendar, GymStatusCard, session, scan.ts, schedule, privacy, support, about, EnergyBalanceCard, WeekEnergyCard, WorkoutsWeekCard, index.tsx; formatNumber en-AU.
- Stats: WeekEnergyCard zero case '+0'; baselines WeekEnergyCard.tsx:106-107, WorkoutsWeekCard.tsx:40-41.
- AddMenu.tsx:3 says 6, code moves 8 (:61). appVersion.ts:13, :16: empty value hides on About.
- SettingsList differs on every Profile row (shared change).
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Chooser: subtitle gap 2; bottom padding; pinned footer; sheet height _layout.tsx:155; second sheet; duration change; checklist icon; unused keys gymLog.restDayMessage, gymLog.logAnExercise.
- Gym Summary card logs with no UI (index.tsx:179). Streak skeleton and notice sit 2 higher (index.tsx:108, :114).
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Screen.tsx:163 strip inset-based.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8 comment.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height, '+' sign, chooser, Privacy layout, support.tsx.
- Doc: stale lines 236, 310, 430-431, 438, 448, 534, 588, 1520; row 85 citations; row 104 says BUILT where list says EXACT; row 108 citations one line off (support.tsx items 1-3 after gap fix); row 112 says EXACT.
- Privacy title block paddingBottom 4 (Screen.tsx:117); Privacy hardcoded English; privacy section headers app-only.
- Support: eyebrow 'Help' vs 'We reply within a day' (support.tsx:30); feedback opens Mail vs in-app 'Thanks, feedback sent'; hardcoded English.
- About header app-only (no eyebrow or title in design); wordmark tracking 0 vs -0.6. Left in place, Isa to decide.
- Two unspecified 'flagged report' requests: ignore unless repeated with detail.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text; layout largely untested.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Line numbers shift; grep before citing.
- Never run jest -u unasked. Tokens are in src/lib/design/tokens.ts. Profile screens live in src/app/profile (not src/app/(tabs)/profile).

## Jev
- R287-R291: kept run when no Isa answer was needed; Jev ranked row 108 first in R288-R291.
- R292: run 66%, ask 33%. Jev ranked row 109 first (81%). Kept row 108 flagged check: the last report was flagged as tests not run, and the flag must be cleared before moving on.
- R293: Jev run 55%, ask 43%, risk 1.4. Kept run: the header decision is parked rather than asked, and the flag clears inside this task.