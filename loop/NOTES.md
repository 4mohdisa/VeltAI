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
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is color.primary; SettingsList geometry per row, check every caller first.
- Flagged report: verify read-only first. Checkpoints run full tsc and app suite, no file changes.
- Every prompt names branch loop/design-match and the design/ file. Forbids switch, push, merge, commit, and editing loop/.
- Loop commits loop/ files: use git show --stat HEAD, not git diff.
- Row 107: design has no AI group or consent text. Repeat verify rounds add nothing.
- One surface per prompt. A prompt that spans two screens is rejected (R334).
- Design decides product behaviour when the design answers the question (R336): gym logged-day handling follows bundle :1656.

## Status
- Re-checked: 107-109, 111, 113-118.
- Row 76 item 4 built in code (R335). Logged day: sheet never shows, + menu shows toast and returns to today. tsc 0. Not checked on device.
- R335 report flagged by loop note as partly done. R336 is a read-only verify of item 4 (toast copy, logged-card route, Start workout on logged day, 'Add something extra' in design). No code change.
- Last full run: jest 64/65 suites, 822/824. Failures are detailChrome energy and macros, awaiting approval.

## Open rows
- 76 PARTIAL: logged day chooser and second row (item 4 built in code, R336 verify pending); rest day and Something else close (1-2); second sheet (3); time (5); celebration dash (6); cardio minutes (7). Icon (8) done.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, 'left today', four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: energy gap 12 to 16; week and training 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked, HealthKit).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast; glyph and chevron geometry; footnote cites.
- 108 PARTIAL: eyebrow copy; feedback opens Mail; no toast; label and button styling; geometry (Blocked). Item 4 closed.
- 109 PARTIAL: wordmark tracking (about.tsx:16); tagline centring (:19); Version/Build can be empty (appVersion.ts:13, :16); glyph; padding; value wrap; geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule; 'My workouts' missing; picker sheet.
- 114 DIFFERENT: session card, 14 items; tap target and planned grid missing; logged pill wash and Calories cell (Blocked).
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device.

## Next
1. Row 76 item 4 read-only verify (R336, flagged report, no code change).
2. Based on R336 findings: if the logged-card route or Start workout on a logged day is a real gap and the design shows the route, build it as one task on that surface. Otherwise go to step 3.
3. Row 76 items 1-2 (rest day and Something else close), one per round.
4. Row 76 items 3, 5-7, one per round.
5. Row 113 'My workouts'.
6. Row 115 exercise progress.
7. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome (energy and macros).
- DetailChart.tsx: Kicker, Breakdown dots.
- LumeTabBar.tsx: + menu chooser on logged days (includes moving the logged-day check into the + menu, to avoid a sheet flash).
- Shared SheetContent, Button, sheet height.
- Items marked Blocked in Open rows (85, 87, 103, 104, 112, 114).
- Summary: 17 SegmentedField; 21 weekly target; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove (recommended) or keep accessible heading.
- SettingsList row geometry: fix or accept. Asked R332, unanswered. Do not ask again; accept per-row default if no answer.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap, logged-day sheet close and toast (R335).
- Native review of es/fr strings incl. food.pickDayLabel. TestPG_* (18 skipped).

## Parked (one line per group)
- Gym session: second row on logged day (mutations.ts:173-178, deliberate per comment). Data behaviour change, not a design row; park unless Isa asks.
- Gym: stale logged flag after midnight (hooks.ts:159); refetch timing not traced.
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard.
- Stats: WeekEnergyCard zero case '+0'; baselines in WeekEnergyCard and WorkoutsWeekCard.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10; Screen.tsx:22 unused re-export; Screen.tsx:117 paddingBottom 4.
- Code: duplicated easing bezier and SLOT_KEYS; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; exercise-progress hardcodes kg; unused keys gymLog.restDayMessage, gymLog.logAnExercise; AddMenu.tsx:3 says 6, code 8; gym.tsx:155 comment false.
- Doc: stale citations after log-session.tsx import shift (about 29 lines, item 8 fixed; item 8 now at :161 and :263-275); stale lines 192, 229, 236, 310, 430-431, 438, 448, 484, 509, 532, 534, 588, 631, 828, 840-841, 1520; section 855 overlaps FAB; section 1421 disagrees with row 118; row 85 citations; row 104 BUILT vs EXACT; row 112 EXACT; line 1441.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Toasts: 'Updated {name}', savedAdded, + menu, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard; chooser gaps.
- Gym Summary card logs with no UI (index.tsx:179); streak skeleton and notice 2 higher (index.tsx:108, :114).
- Row 114 chevron needs a day-detail route that does not exist.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving missing (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, privacy, support, about, log-session layout. tabNavigation, phase14Regression, hydrationErrorScreens reference app/profile/ but do not check layout.
- Tab bar: Reduce Transparency pill fill equals #F2F2F7; GlassSurface may clip pill shadow. Needs device.
- Old /tmp/lume-* folders: not ours to clean.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design in memory or /tmp only; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65. 'bundle :N' means decoded-bundle lines. Colour hex at design/Lume App.html:382.
- Tokens: src/lib/design/tokens.ts. TextField: src/components/forms/TextField.tsx.
- LC_ALL=C /usr/bin/grep; quote paths. Grep app/profile/, not src/app/profile/.
- Doc row numbers are file lines. After a handover, name files fully.
- Briefs and reports can carry false premises; check first.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Use jest --ci.

## Jev
R315-R333: asked or ran as recorded; kept runs had reasons above.
R334 (handover): run 88%, ask 11%, stop 1%. Kept run: item 4 needs nothing from Isa.
R335: run 99%, ask 1%, stop 0%. Kept run: same task, rewritten to one file. Jev risk 1.3 of 2 (low confidence 0.35); task kept small on purpose.
R336: ask 83%, run 15% (confidence 0.74). Kept run: the open question is answered by the design (bundle :1656 and the day view's 'Add something extra'), so Isa is not needed. The round is read-only with one doc line, so the risk is low. Look again next round if the verify finds a real gap that the design does not answer.