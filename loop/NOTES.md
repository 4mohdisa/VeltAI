# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md (42 rows). Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value (22, 26, 6).
- Never run jest -u or edit .snap files without Isa approval.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- A row is BUILT only when no differences remain; otherwise PARTIAL or DIFFERENT.
- Rest day redirects to session picker, not Gym (accepted deviation).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is color.primary; SettingsList geometry per row.
- A flagged report is verified before any other task. Verification is read-only: tsc, plus jest when the report touched code or tests.
- Doc-only rounds: run tsc and matching jest suites. A report that skips jest gets flagged.
- Every prompt names branch loop/design-match and the design/ file; forbids switch, push, merge, commit, and editing loop/ files.
- Rows keep their open items even if a brief says fewer remain. Row lists live in the summary table.

## Status
- Re-checked: rows 107, 108, 109, 111, 113, 114-118 (R297-R304).
- R309 checkpoint: tsc 0; jest 64/65 suites, 822/824 tests. Only failures: two detailChrome snapshots awaiting approval.
- R311 claims confirmed in R312: export toast is app-only (privacy.tsx:53); gap of 8 at bundle :489 and :502; AI group needs consent (privacy.tsx:80, title :82). R312 cleared the flag: tsc 0; 3 profile suites, 39 tests passed.
- R313 row 107 edit verified in R314 (no correction needed). Kept cites :499 and :510 for footnote type and side padding; gap 8 cites :489 and :502. Row 107 is closed: repeat verify rounds add nothing.
- Summary difference 12 (doc line 406): BUILT.
- R315 (this round): doc-only re-check of row 108 items 1-3 citations and item 7 placement.

## Open rows
- 76 PARTIAL: rest day and Something else do not return to Gym; second sheet missing; logged day reopens chooser; time/minutes; celebration calories dash; cardio minutes in notes; checklist icon.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: Energy gap 12 to 16 after snapshot approval; week and training 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked).
- 107 PARTIAL: privacy headers, AI group, export via share sheet, export failure toast (app-only); glyph and chevron geometry; footnote cites. Verified in R314; no further verify rounds needed.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; geometry; item 4 padding 16 vs 12 (TextField.tsx:63, bundle :546) and growth; item 7 EXACT inside numbered list (R315 moves it out).
- 109 PARTIAL: wordmark tracking 0 vs -0.6 (about.tsx:16); tagline centring (:19); Version/Build can be empty (appVersion.ts:13, :16); glyph; padding; value wrap.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items (Logged pill wash and Calories cell blocked).
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items. Items 4-5 need device check.

## Next
1. R315 (this round): row 108 items 1-3 citation fix, item 7 moved out of the list. Doc only.
2. Row 108 items 4 and 7 build or doc fix in the following round.
3. Row 109 doc fixes if citations are stale. Doc only.
4. SettingsList row geometry (107-109): per row by default; Isa may override.
5. Row 103 energy gap, after snapshot approval.
6. Row 118 items 4-5 device check, if Isa approves.
7. No rows left: stop with 'only owner decisions remain'.

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
- SettingsList row geometry (107-109): per row (default) or shared change.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap.
- Native review of es/fr strings, incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (one line per group)
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile (incl. support.tsx), EnergyBalanceCard.
- Stats: WeekEnergyCard zero case '+0'; baselines in WeekEnergyCard and WorkoutsWeekCard.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; exercise-progress hardcodes kg; unused keys gymLog.restDayMessage, gymLog.logAnExercise; AddMenu.tsx:3 says 6, code 8.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard; chooser subtitle gap, bottom padding, pinned footer, second sheet, duration change, checklist icon.
- Gym Summary card logs with no UI (index.tsx:179); streak skeleton and notice 2 higher (index.tsx:108, :114).
- Row 114 chevron needs a day-detail route that does not exist.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, privacy, support, about, log-session layout. No test references SettingsList.
- Doc: stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841, 1520; section 855 overlaps FAB row; section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT; line 1441 cites logGymSession(), unchecked; row 109 cites (About glyph at bundle :568; :475 and :478 are Privacy lines).
- Tab bar: Reduce Transparency pill fill equals active cell #F2F2F7; GlassSurface overflow hidden may clip pill shadow. Needs device.
- Old /tmp/lume-* folders: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design with node into /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65.
- Briefs cite stale paths (src/theme/tokens.ts, dashboard/energy.tsx do not exist). Tokens are in src/lib/design/tokens.ts. TextField is src/components/forms/TextField.tsx.
- Use LC_ALL=C /usr/bin/grep; quote paths with tabs. Profile screens live in src/app/profile, and the grep pattern must be app/profile/ (src/app/profile/ misses two of three suites).
- Doc row numbers are file lines.
- After a handover, name files fully in prompts.
- Briefs and reports can cite false claims; check before acting.

## Jev
R305-R314: Jev ranked doc fixes first (81-89%) and sometimes asked (16-63%). Runs kept for flag verification and read-only work. Handover signal (ask 57%, confidence 0.35) not followed: defaults cover the SettingsList question. Jev cannot see the notes rule that a flagged report is verified first.