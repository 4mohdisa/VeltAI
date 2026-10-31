# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md (42 data rows). Branch loop/design-match only. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value (22, 26, 6).
- Never run jest -u or edit .snap files without Isa approval. DetailChart.tsx, SegmentedField.tsx and LumeTabBar.tsx need Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds (status updates after a build are allowed).
- BUILT only when no differences remain in own files; otherwise PARTIAL. No BUILT claim for kicker or dots.
- Rest day redirects to the session picker and does not return to Gym (accepted deviation, parked).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour color.primary.
- An unanswered blocker is parked, not asked again.

## Status
- R296: energy net sign (difference 12) already matches design. Row BUILT (doc line 406).
- R297 handover: row 76 PARTIAL. Row 103 DIFFERENT (week.tsx:54 and training.tsx:64 still gap 12). Rows 107, 108, 109 PARTIAL. Rows 111, 113 re-checked PARTIAL.
- Checkpoint R295: tsc 0; jest 64/65 suites, 822/824 tests. Only failures: two detailChrome snapshots (energy, macros), awaiting approval.

## Open rows
- 76 PARTIAL: rest-day and Something else close do not return to Gym; second sheet missing; logged day reopens chooser; time and minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: week and training gap 12 to 16 (after snapshot approval); kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked, HealthKit off-limits).
- 107 PARTIAL: stale footnote text and citations (re-check next); privacy headers, AI group, export via share sheet.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; SettingsList geometry.
- 109 PARTIAL: wordmark tracking 0 vs -0.6; eyebrow and title app-only (parked); tagline centring; Version and Build can be empty; SettingsList geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: Gym My schedule; 'My workouts' missing; picker sheet.
- 114-118: not yet re-checked.

## Next
1. Re-check rows 107 and 114-117 (doc only).
2. Re-check row 118.
3. Row 108 remaining items, one at a time.
4. Row 103 gap 12 to 16 after snapshot approval.
5. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome.render.test.tsx (energy and macros).
- DetailChart.tsx (kicker, dots). LumeTabBar.tsx logged-day + menu permission.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card.
- Summary: 17 SegmentedField; 21 weekly target and calories per session; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove (recommended) or keep an accessible heading.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (one line each)
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile screens, EnergyBalanceCard (:131, :135, :164, :165).
- Stats: WeekEnergyCard zero case '+0'; baselines WeekEnergyCard.tsx:106-107, WorkoutsWeekCard.tsx:40-41.
- AddMenu.tsx:3 says 6, code 8 (:61). appVersion.ts:13, :16 empty value hides on About.
- SettingsList differs on every Profile row (shared change).
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Missing toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Chooser: subtitle gap 2; bottom padding; pinned footer; second sheet; duration change; checklist icon; unused keys gymLog.restDayMessage, gymLog.logAnExercise.
- Gym Summary card logs with no UI (index.tsx:179). Streak skeleton and notice 2 higher (index.tsx:108, :114).
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); wrong comments LumeTabBar.tsx:4, _layout.tsx:26; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8 comment.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height, '+' sign, chooser, privacy, support, about, log-session layout.
- + menu can lead to a second session row on a logged day (LumeTabBar.tsx:179).
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 534, 588, 1520; section 855 overlaps FAB row; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT.
- Two unspecified 'flagged report' requests: ignore unless repeated with detail.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- Briefs cite stale paths (src/theme/tokens.ts and dashboard/energy.tsx do not exist). Check first. Tokens are in src/lib/design/tokens.ts.
- Use LC_ALL=C /usr/bin/grep; quote (tabs) paths. Profile screens live in src/app/profile.
- Old /tmp/lume-* folders remain.

## Jev
- R296: run 71%, kept run.
- R297: run 91%, ask 6%, stop 3% (confidence 0.86). Kept run, same as Jev. Last task clean 89%.