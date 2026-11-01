# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Never run jest -u or edit .snap files without Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- A row is BUILT only when no differences remain.
- Rest day redirects to session picker (accepted deviation).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is color.primary; SettingsList geometry per row, check every caller before any change (R323).
- A flagged report is verified first, read-only: tsc, plus jest only if code or tests were touched. Checkpoints run full tsc and app suite with no file changes.
- Every prompt names branch loop/design-match and the design/ file. Forbids switch, push, merge, commit, and editing loop/ files.
- Row 107: design has no AI group or consent text. Repeat verify rounds add nothing.
- Loop commits loop/ files, so use git show --stat HEAD, not git diff.

## Status
- Re-checked: 107-109, 111, 113-118. Row 107 closed.
- Row 108: item 7 EXACT, removed (R325). Geometry cites added (R328).
- R330: item 4 doc fix made. Removed the mid-item Profile bundle citation. Added that 114 is rounded from the app's 52 x 2.2 = 114.4 (tokens.ts:318). Growth stays cited to TextField.tsx:62. tokens.ts:146 stays as type 17/24, not growth.
- R331: verified the R330 edit read-only. tsc exit 0. Item 4 closed.
- Row 108 still needs Isa's SettingsList decision for its geometry (asked R332, no answer by R333).
- Last tsc 0 (R331). Last full jest R324: 64/65 suites, 822/824. Only failures are the detailChrome snapshots (energy, macros), awaiting Isa approval.
- R333: picked row 76 checklist icon (single item, no dependency on Isa).

## Open rows
- 76 PARTIAL: rest day and Something else do not return to Gym; second sheet missing; logged day reopens chooser; time/minutes; celebration calories dash; cardio minutes. Checklist icon: in progress (R333).
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: energy gap 12 to 16 after snapshot approval; week and training 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast; glyph and chevron geometry; footnote cites.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; geometry (SettingsList decision). Item 4 closed.
- 109 PARTIAL: wordmark tracking 0 vs -0.6 (about.tsx:16); tagline centring (:19); Version/Build can be empty (appVersion.ts:13, :16); glyph; padding; value wrap; geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items; tap target and planned grid missing; logged pill wash and Calories cell blocked.
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device check.

## Next
1. Row 76 checklist icon (R333, in progress). Then the other row 76 items, one per round, rest-day item needs a decision first.
2. Row 113 'My workouts' missing.
3. Row 115 exercise progress, 11 items.
4. Waiting on Isa: SettingsList row geometry, fix or accept. It settles rows 107-109. Do not ask again.
5. Row 118 items 4-5 device check, if Isa approves.
6. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome (energy and macros).
- DetailChart.tsx: Kicker, Breakdown dots.
- LumeTabBar.tsx: + menu chooser on logged days; second session row.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card (HealthKit off-limits). 114 logged pill wash, Calories cell.
- Summary: 17 SegmentedField; 21 weekly target; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove (recommended) or keep an accessible heading.
- SettingsList row geometry: fix or accept (settles 107-109; affects every caller). Asked R332, unanswered at R333. Do not ask again; accept the per-row default if no answer comes.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (one line per group)
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard.
- Stats: WeekEnergyCard zero case '+0'; baselines in WeekEnergyCard and WorkoutsWeekCard.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Code: duplicated easing bezier and SLOT_KEYS; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; exercise-progress hardcodes kg; unused keys gymLog.restDayMessage, gymLog.logAnExercise; AddMenu.tsx:3 says 6, code 8; gym.tsx:155 comment false.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard; chooser gaps.
- Gym Summary card logs with no UI (index.tsx:179); streak skeleton and notice 2 higher (index.tsx:108, :114).
- Row 114 chevron needs a day-detail route that does not exist.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, privacy, support, about, log-session layout; no test names SettingsList or the Privacy, Support or About screens. The three suites referencing app/profile/ (tabNavigation, phase14Regression, hydrationErrorScreens) do not check layout.
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841, 1520; section 855 overlaps FAB row; section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT; line 1441 unchecked.
- Tab bar: Reduce Transparency pill fill equals active cell #F2F2F7; GlassSurface overflow may clip pill shadow. Needs device.
- Old /tmp/lume-* folders: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65. 'bundle :N' means decoded-bundle lines. Colour hex definitions are at design/Lume App.html:382.
- Tokens: src/lib/design/tokens.ts. TextField: src/components/forms/TextField.tsx.
- Use LC_ALL=C /usr/bin/grep; quote paths. Grep app/profile/, not src/app/profile/.
- Doc row numbers are file lines. After a handover, name files fully.
- Briefs and reports can cite false claims or stale paths; check first.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Use jest --ci to avoid writing snapshots.

## Jev
R315-R321: asked 70-82%; ran kept each time, reasons recorded above.
R322-R327: ask or run mixed; kept runs recorded with reasons.
R329: ask 61%, stop 33%, run 6%. Kept the flag verification, which was then done read-only.
R330 (handover signals): run 44%, ask 40%, stop 16%. Kept run: the doc fix needs nothing from Isa.
R331: ask 69%, stop 23%, run 8%. Kept run: the flagged report had to be verified first.
R332: ask 91%, stop 7%, run 2% (confidence 0.86). Kept ask: SettingsList geometry affects every caller and is Isa's call.
R333: ask 91%, run 5%, stop 4%. Overrode to run row 76 checklist icon. Reason: the loop note says the SettingsList question went unanswered, and this icon item depends on nothing from Isa. Jev's ask would only have repeated the blocked question.
