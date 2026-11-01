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
- Shared SettingsList geometry: follow design per row when built; no separate shared change.
- A flagged report is verified in the next round before any other task.
- Loop commits touch loop/ files; verify with git show. Doc only means no source or test changed.
- Every prompt names branch loop/design-match and the design/ file and bundle; forbids switch, push, merge, commit.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.

## Status
- Summary difference 12 BUILT (R296).
- Re-checked: rows 107, 108, 109, 111, 113, 114-118 (R297-R304).
- R305: read-only check of R304, cleared.
- R306 (this round): read-only verification of the flagged report. No edits.
- Checkpoint R295: tsc 0; jest 64/65 suites, 822/824 tests. Only failures: two detailChrome snapshots awaiting approval.

## Open rows
- 76 PARTIAL: rest day and Something else do not return to Gym; second sheet missing; logged day reopens chooser; time/minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: Energy gap 12 to 16 after snapshot approval; week and training still 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked).
- 107 PARTIAL: privacy headers, AI group, export via share sheet; glyph and chevron geometry; footnote text and citations need doc fix.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; geometry; item 4 field padding 16 vs 12, min height ~114 vs 4 rows; item 7 needs moving to the fixed list.
- 109 PARTIAL: wordmark tracking 0 vs -0.6 (about.tsx:16); tagline centring (:19); Version/Build can be empty (appVersion.ts:13, :16); glyph; vertical padding; value wrap.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items (Logged pill wash and Calories cell blocked).
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items. Items 4 and 5 need a device check.

## Next
1. R306: read-only verification of the flagged report (this round).
2. R307: row 108 doc fix, items 4 and 7. Doc only.
3. Row 107 doc fix: stale footnote text and shifted citations. Doc only.
4. Row 108 remaining items, one at a time.
5. Row 109 doc fixes if re-check finds stale citations. Doc only.
6. Row 103 energy gap, after snapshot approval.
7. Row 118 items 4-5 device check, if Isa approves.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome (energy and macros).
- DetailChart.tsx: Kicker, Breakdown dots.
- LumeTabBar.tsx: + menu opens chooser on logged days; finishing can write a second session row.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card (HealthKit off-limits). 114 Logged pill wash, Calories cell.
- Summary: 17 SegmentedField; 21 weekly target and calories per session; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove (recommended) or keep an accessible heading.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (grouped)
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile (privacy, about, support), EnergyBalanceCard.
- Stats: WeekEnergyCard zero case '+0'; baselines in WeekEnergyCard and WorkoutsWeekCard.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8 comment; exercise-progress.tsx hardcodes kg; unused keys gymLog.restDayMessage, gymLog.logAnExercise.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard; chooser subtitle gap, bottom padding, pinned footer, second sheet, duration change, checklist icon.
- Gym Summary card logs with no UI (index.tsx:179); streak skeleton and notice 2 higher (index.tsx:108, :114).
- Row 114 chevron needs a day-detail route that does not exist.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, privacy, support, about, log-session layout.
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841, 1520; section 855 overlaps FAB row; section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT; line 1441 cites logGymSession(), unchecked.
- AddMenu.tsx:3 says 6, code 8.
- Old /tmp/lume-* folders: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- Briefs cite stale paths (src/theme/tokens.ts, dashboard/energy.tsx do not exist). Tokens in src/lib/design/tokens.ts.
- Use LC_ALL=C /usr/bin/grep; quote paths with tabs. Profile screens live in src/app/profile.
- Doc row numbers are file lines. Row lists live in the summary table.

## Jev
- R305: Jev ranked row 108 doc fix first (87%). Flag verification kept; doc fix now R307.
- R306: Jev asks 65% (confidence 0.48). Run kept: the flagged-report rule overrides, and the SettingsList question is covered by the default.