# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md (42 rows). Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value (22, 26, 6).
- Never run jest -u or edit .snap files without Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- BUILT only when no differences remain; otherwise PARTIAL.
- Rest day redirects to the session picker, not Gym (accepted deviation).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is color.primary.
- An unanswered blocker is parked, not asked again.
- Type check runs on every round that changes files, including doc-only rounds.
- A flagged report is verified in the next round before any other task. This overrides Jev rankings.
- Loop commits make git diff empty; verify with git show.
- Every prompt names branch loop/design-match and forbids switch, push, merge and commit.
- Every prompt names the matching design/ file and bundle.

## Status
- R296: Summary difference 12 (net sign) BUILT.
- R297-R301: re-checks of rows 107, 108 (items 1-3), 111, 113, 114-118.
- R302: row 109 About re-checked, PARTIAL (4 items). Flagged (tests not run).
- R303: read-only verification of R302. Cleared: no source changed, tsc 0, no test needed.
- R304: row 108 re-check, doc only (glyph, vertical padding, value wrap). Report flagged (jest not run; doc-only, so not needed). Chooser note: item 4 incomplete (missing field padding 16 vs 12, min height ~114 vs 4 rows); item 7 out of place in numbered list.
- R305 (this round): read-only verification of R304. No edits. tsc and git check only.
- Checkpoint R295: tsc 0; jest 64/65 suites, 822/824 tests. Only failures: two detailChrome snapshots awaiting approval.

## Open rows
- 76 PARTIAL: rest day and Something else close do not return to Gym; second sheet missing; logged day reopens chooser; time/minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: Energy gap 12 to 16 after snapshot approval; week and training still 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked, HealthKit off-limits).
- 107 PARTIAL: privacy headers, AI group, export via share sheet; glyph (SettingsList.tsx:79) and chevron (:113) geometry; footnote text and citations need doc fix.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; SettingsList geometry; item 4 needs field padding 16 vs 12 and min height ~114 vs 4 rows (TextField.tsx:62-63); item 7 needs moving to the fixed list.
- 109 PARTIAL: wordmark tracking 0 vs -0.6 (about.tsx:16); tagline centring (:19); Version/Build can be empty (appVersion.ts:13, :16); glyph 17 vs 15 (SettingsList.tsx:79); vertical padding 12 vs 0 (:63); value wrap (:96). About header decision pending.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items (Logged pill wash and Calories cell blocked).
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items. Items 4 and 5 (selected state, pill shadow) need a device check.

## Next
1. R305 (this round): read-only verification of R304 (tsc, git show, row 108 check).
2. R306: row 108 doc fix, item 4 (field padding 16 vs 12, min height) and item 7 (move to fixed list). Doc only.
3. Row 107 doc fix: stale footnote text and shifted citations (doc only).
4. Row 108 remaining items, one at a time.
5. Row 109 doc fixes if re-check finds stale citations (doc only).
6. Row 103 energy gap, after snapshot approval.
7. Row 118 items 4 and 5 device check, if Isa approves.
8. No rows left: stop with 'only owner decisions remain'.

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
- Native review of es/fr strings, incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (grouped)
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile (incl. privacy.tsx, about.tsx, support.tsx), EnergyBalanceCard.
- Stats: WeekEnergyCard zero case '+0'; baselines in WeekEnergyCard and WorkoutsWeekCard.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments LumeTabBar.tsx:4, _layout.tsx:26; SettingsList.tsx:7-10 says design-matched, but bundle uses separate rows at radius 14; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Shared SettingsList geometry (glyph, padding, value wrap, chevron) affects rows 107-109 and every other settings row. Handle per row when built, following design; no separate shared change.
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
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841, 1520; section 855 overlaps FAB row; tab shell section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT.
- AddMenu.tsx:3 says 6, code 8. appVersion.ts:13, :16 empty value hides on About.
- SettingsList differs on every Profile row (shared change).
- Old /tmp/lume-* folders from earlier sessions: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65. Design file is design/Lume App.html.
- Briefs cite stale paths (src/theme/tokens.ts, dashboard/energy.tsx do not exist). Tokens are in src/lib/design/tokens.ts.
- Use LC_ALL=C /usr/bin/grep; quote paths with tabs. Profile screens live in src/app/profile.
- Doc row numbers are file lines. Row lists live in the summary table.
- After a loop commit, git diff is empty; use git show <hash>.

## Jev
- R299-R302: advisory only. Kept run each time; R302 agreed with Jev.
- R303: Jev ranked row 108 first (97%). Kept flag verification because the standing rule puts flagged-report checks first.
- R304: Jev ranks run 76%. Row 108 re-check chosen, matching its ranking.
- R305: Jev ranks row 108 doc fix first (87%). Kept flag verification (R304 flagged). Row 108 doc fix moves to R306, so Jev's pick is still served next round.