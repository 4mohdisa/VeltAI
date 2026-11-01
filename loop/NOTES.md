# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md (42 rows). Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value (22, 26, 6).
- Never run jest -u or edit .snap files without Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- BUILT only when no differences remain in own files; otherwise PARTIAL.
- Rest day redirects to the session picker and does not return to Gym (accepted deviation).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is color.primary.
- An unanswered blocker is parked, not asked again.
- Type check runs on every round that changes files, including doc-only rounds.
- A flagged report (type check or tests not run or failed) is verified in the next round before any other task.
- Loop commits make git diff empty; verify against the commit that holds the change (git show), not the working tree.
- Every prompt names branch loop/design-match and forbids switch, push, merge and commit.

## Status
- R296: Summary difference 12 (net sign) BUILT.
- R297-R298: re-checks done for rows 111, 113, 114-118. Row 108 items 1-3 citations fixed.
- R299: row 118 re-checked PARTIAL (13 differences). Row 108 items 1-3 confirmed.
- R300: row 107 footnote check done (matches bundle :499, :510). Added glyph and chevron geometry differences. Stays PARTIAL.
- R301: flag verification (read-only) of R300. Type check exit 0, commit 6eb66aa scope confirmed (doc and loop files only), row 107 text confirmed. Flag CLEARED.
- R302 (this round): doc-only re-check of row 109 About (glyph and chevron geometry, tracking at about.tsx:16, tagline centring at :19, Version/Build empty value). Type check runs. Jest not applicable.
- Checkpoint R295: tsc 0; jest 64/65 suites, 822/824 tests. Only failures: two detailChrome snapshots awaiting approval.

## Open rows
- 76 PARTIAL: rest-day and Something else close do not return to Gym; second sheet missing; logged day reopens chooser; time/minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: energy gap 12 to 16 after snapshot approval; week and training still 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked, HealthKit off-limits).
- 107 PARTIAL: privacy headers, AI group, export via share sheet; glyphs (SettingsList.tsx:79) and chevron (:113) geometry; footnote fixed R300.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; SettingsList geometry. Glyph and chevron not yet re-checked.
- 109 PARTIAL: wordmark tracking 0 vs -0.6; eyebrow and title app-only (parked); tagline centring; Version/Build can be empty; SettingsList geometry. Being re-checked in R302.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items (Logged pill wash and Calories cell blocked).
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items. Items 4 and 5 (selected state, pill shadow) need a device check.

## Next
1. R302 (this round): doc-only re-check of row 109 About. Replace its difference list with the real one.
2. Re-check row 108 Support for glyph and chevron geometry (doc only).
3. Row 108 remaining items, one at a time.
4. Row 103 energy gap after snapshot approval.
5. Row 118 items 4 and 5 device check, if Isa approves.
6. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome.render.test.tsx (energy and macros).
- DetailChart.tsx (kicker, dots).
- LumeTabBar.tsx: logged-day + menu permission; device check of tab bar selected state and pill shadow.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card. 114 Logged pill wash, Calories cell.
- Summary: 17 SegmentedField; 21 weekly target and calories per session; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove (recommended) or keep an accessible heading.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (grouped)
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile screens (incl. privacy.tsx), EnergyBalanceCard.
- Stats: WeekEnergyCard zero case '+0'; baselines in WeekEnergyCard and WorkoutsWeekCard.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments LumeTabBar.tsx:4, _layout.tsx:26; SettingsList.tsx:7-10 header says grouped card is design-matched, but bundle uses separate rows at radius 14; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8 comment; exercise-progress.tsx hardcodes kg.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy; unused keys gymLog.restDayMessage, gymLog.logAnExercise.
- Missing toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard; chooser subtitle gap, bottom padding, pinned footer, second sheet, duration change, checklist icon.
- Gym Summary card logs with no UI (index.tsx:179); streak skeleton and notice 2 higher (index.tsx:108, :114); doc line 1441 cites logGymSession(), unchecked.
- Row 114 chevron depends on a day-detail route that does not exist.
- + menu can lead to a second session row on a logged day (LumeTabBar.tsx:179).
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height, '+' sign, chooser, privacy, support, about, log-session layout.
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841 (false -0.6 claim), 1520; section 855 overlaps FAB row; tab shell section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT.
- AddMenu.tsx:3 says 6, code 8. appVersion.ts:13, :16 empty value hides on About.
- SettingsList differs on every Profile row (shared change).
- Two unspecified 'flagged report' requests: ignore unless repeated with detail.
- Old /tmp/lume-* folders from earlier sessions: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- Briefs cite stale paths (src/theme/tokens.ts, dashboard/energy.tsx do not exist). Check first. Tokens are in src/lib/design/tokens.ts.
- Use LC_ALL=C /usr/bin/grep; quote paths with tabs. Profile screens live in src/app/profile.
- Doc row numbers are file lines. Row lists live in the summary table.
- After a loop commit, git diff is empty; use git show <hash> to check a change, or git show HEAD:<file> for the current state.

## Jev
- R299: ask 64%, run 31% (confidence 0.46). Kept run. Reason: row 107 is doc-only and needs no Isa input; all other open items are already blocked on Isa. Risk 1.4/2. Type check runs this round.
- R300 (flagged): run 75%, ask 20%, stop 5% (confidence 0.62). Risk 1.0/2. Chose run for R301 verification. Agrees with Jev.
- R301 (flagged handover): run 84%, ask 8%, stop 8% (confidence 0.76). Risk 1.0/2. Chose run for flag verification. Agrees with Jev.
- R302: run 89%, ask 6%, stop 5% (confidence 0.83). Risk 0.8/2. Chose run for the row 109 re-check. Agrees with Jev.