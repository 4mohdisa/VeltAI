# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Never run jest -u or edit .snap files without Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- A row is BUILT only when no differences remain; otherwise PARTIAL or DIFFERENT.
- Rest day redirects to session picker (accepted deviation).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is color.primary; SettingsList geometry per row (decided R323, no Isa answer needed; check every caller before any change).
- A flagged report is verified first, read-only: tsc, plus jest only if code or tests were touched. At checkpoint rounds the full tsc and full app suite run, with no file changes (R324).
- Every prompt names branch loop/design-match and the design/ file. Forbids switch, push, merge, commit, and editing loop/ files.
- Row 107: design has no AI group or consent text. Repeat verify rounds on 107 add nothing.
- Loop commits loop/ files, so use git show --stat HEAD, not git diff.

## Status
- Re-checked: 107-109, 111, 113-118. Row 107 closed.
- Row 108: item 4 growth fixed; item 7 EXACT, removed.
- Row 109 citations checked (R321, R322): none wrong. Missing bundle cites for min height 48, padding 0, side 12, gap 11 now added at bundle :566 (R323 doc only). Each value is a real difference from SettingsList.tsx:62-65.
- R323 verified the R322 report read-only: tsc 0, no code touched.
- R324 checkpoint done: tsc 0; full jest 64/65 suites, 822/824. Only failures are the two known detailChrome snapshots (energy and macros), awaiting Isa approval. Nothing new broken.
- Last tsc 0. Last full jest R324: 64/65 suites, 822/824.

## Open rows
- 76 PARTIAL: rest day and Something else do not return to Gym; second sheet missing; logged day reopens chooser; time/minutes; celebration calories dash; cardio minutes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: energy gap 12 to 16 after snapshot approval; week and training 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast; glyph and chevron geometry; footnote cites.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; geometry; item 4 font 17 vs 16 and citation mapping (in progress, R325).
- 109 PARTIAL: wordmark tracking 0 vs -0.6 (about.tsx:16); tagline centring (:19); Version/Build can be empty (appVersion.ts:13, :16); glyph; padding; value wrap; geometry (rows 109 values cited, decision pending).
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items; tap target and planned grid missing; logged pill wash and Calories cell blocked.
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device check.

## Next
1. Row 108 item 4: map each citation to its value; cite design/Lume App.html:382 for #8a8a8a and #171717. Doc only (R325, in progress).
2. SettingsList row geometry (107-109): per row by default. Check every caller before any change.
3. Row 103 energy gap, after snapshot approval.
4. Row 118 items 4-5 device check, if Isa approves.
5. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome (energy and macros).
- DetailChart.tsx: Kicker, Breakdown dots.
- LumeTabBar.tsx: + menu opens chooser on logged days; finishing can write a second session row.
- Shared SheetContent, Button, sheet height.
- 85 calorie bar, 'left today', four-column wrap. 87 17/24 vs 17/22, 180ms.
- 112 GymPatternsCard padding. 104 Steps card (HealthKit off-limits). 114 logged pill wash, Calories cell.
- Summary: 17 SegmentedField; 21 weekly target; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove (recommended) or keep an accessible heading.
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
- Tests: no suite covers CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, privacy, support, about, log-session layout; no test names SettingsList or the Privacy, Support or About screens.
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841, 1520; section 855 overlaps FAB row; section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT; line 1441 unchecked; row 108 item 7 EXACT inside differences list.
- Tab bar: Reduce Transparency pill fill equals active cell #F2F2F7; GlassSurface overflow may clip pill shadow. Needs device.
- Old /tmp/lume-* folders: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- Tokens: src/lib/design/tokens.ts. TextField: src/components/forms/TextField.tsx.
- Use LC_ALL=C /usr/bin/grep; quote paths. Grep app/profile/, not src/app/profile/.
- Doc row numbers are file lines. After a handover, name files fully.
- Briefs and reports can cite false claims or stale paths; check first.
- Don't open loop/NOTES.md or loop/DECISIONS_LOG.md.

## Jev
R315-R321: asked 70-82%, ran kept each time with reasons recorded above.
R322: ask 66%, run 26%, stop 8%, risk 1.3. Run kept: advisory, not strongly sure; read-only verification of flagged report first.
R323: ask 73%, stop 21%, run 6%, risk 1.4 (confidence 0.08). Run kept: the SettingsList question is already answered by the default; the next task is doc-only and needs no Isa input.
R324: ranked Row 108 item 4 first (92%). Kept checkpoint run instead: the loop note marks this round as a checkpoint for a flagged report with tsc and tests not run, and the brief requires the full check first. Jev ask 74% and stop 15% noted; not acted on, nothing blocked on Isa.
R325: run 88%, ask 10%, stop 2% (confidence 0.82). Run kept: matches the planned task (row 108 item 4, doc only). Risk 0.8 noted; no Isa input needed.