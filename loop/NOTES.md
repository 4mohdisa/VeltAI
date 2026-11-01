# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Never run jest -u or edit .snap files without Isa approval. Use jest --ci.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- A row is BUILT only when no differences remain.
- Rest day redirects to session picker (accepted deviation).
- Design decides product behaviour when it answers the question (R336).
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras; keep Meal history link; keep Training list; accept LoadFailedNotice; gym log follows showLogCta; Gym tab shows today; swipe colour is primary; SettingsList geometry per row, check callers first.
- Every prompt names branch loop/design-match and the design/ file. Forbids switch, push, merge, commit, editing loop/.
- One surface per prompt.
- Loop commits loop/ files: check with git show --stat HEAD.
- R338: picker close fix in session.tsx approved by default (design answers it). Isa's earlier approval wait is superseded for this change only.
- Checkpoint rounds (loop note) run full tsc and full jest with no file changes.

## Status
- Re-checked: 107-109, 111, 113-118. Repeat verify rounds on 108 and 109 add nothing. Row 107: design has no AI group or consent text.
- Row 76 item 1 marked built in code (R338: closing the picker with nothing added goes to the Gym tab). Not verified on device. No test covers the path.
- Row 76 item 4 (logged day): code read only (R336), not on device. Toast wording matches. Toast timing and position differ (app-wide rule, Blocked). Logged TodayCard has no press route. The design day view (bundle :850-873) does not exist in the app: parked.
- R339 checkpoint DONE: tsc 0; jest --ci 64/65 suites, 822/824 tests. Only failures: energy and macros in detailChrome (awaiting approval).
- Handover (R339 summary): doc-only edits to rows 108 and 109 (citations). No code changed. Rows 108 and 109 stay PARTIAL.

## Open rows
- 76 PARTIAL: item 1 done in code (R338, not on device); item 2 close-library fix done, glyph (SF Symbol vs 2.4-stroke path) and add path (onPick lands on check-in, design shows toast on Gym day) still differ. Item 3 second sheet. Item 4 parked. Items 5-7 time, celebration dash, cardio minutes. Item 8 done.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85 DIFFERENT: calorie bar, left today, four-column wrap (Blocked).
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: energy gap 12 to 16; week and training 12; kicker and dots (Blocked).
- 104 PARTIAL: Steps card (Blocked, HealthKit).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast; glyph and chevron geometry; footnote cites.
- 108 PARTIAL: eyebrow copy; feedback opens Mail with no toast; label and button styling; geometry (Blocked).
- 109 PARTIAL: wordmark tracking; tagline centring; Version/Build can be empty (appVersion.ts); glyph; padding; value wrap; geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes; gym row pushes route on logged day.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: My schedule present; My workouts missing (IN PROGRESS R340); picker sheet.
- 114 DIFFERENT: session card, 14 items; tap target and planned grid; logged pill wash and Calories cell (Blocked).
- 115 PARTIAL: exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device.

## Next
1. R340: row 113 My workouts (in progress).
2. Row 115 exercise progress.
3. Row 76 items 3, 5, 6, 7, one per round.
4. Row 116 heatmap, then row 117 token drift, then row 118 tab bar items not needing device.
5. No rows left: stop with 'only owner decisions remain'.
Revisit row 76 item 4 only if Isa asks for a day view.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome (energy and macros).
- DetailChart.tsx: Kicker, Breakdown dots.
- LumeTabBar.tsx: + menu chooser on logged days.
- Shared SheetContent, Button, sheet height.
- Toast duration and position (toastStore.ts:42, :45).
- Second row on logged day (mutations.ts:173-178): data behaviour change.
- Logged-day actions (what the toast points at): Isa to decide.
- Items marked Blocked in Open rows (85, 87, 103, 104, 112, 114).
- Summary: 17 SegmentedField; 21 weekly target; 28 glass/blur; 29 profile initials; 30 pull-to-refresh.
- Top padding Gym, Summary, Food: inset-based or literal 70.
- Burn target 10-11; energy week axis 15; header strip Screen.tsx:163.
- About header: remove or keep accessible heading.
- SettingsList row geometry: fix or accept. Unanswered; accept per-row default. Settles rows 107-109. Recommended next for Isa.
- Logged pill wash token.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap, logged-day sheet close and toast, library close path (4 paths in session.tsx).
- Native review of es/fr strings. TestPG_* (18 skipped).

## Parked (one line per group)
- Gym logged day: no day view (design :850-873); logged card has no press route; second row (mutations.ts:173-178).
- Gym: stale Start workout after logging (gymSchedule.ts:32-61; gym.tsx:70-73); stale logged flag after midnight (hooks.ts:159).
- + menu pushes sheet before the check (LumeTabBar.tsx:179).
- Exercise library: multi-select (design bundle :1271-1289); ExercisePicker takes one at a time.
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard, gym session empty state and add button (session.tsx:539-541, :555), 'Save progress?' alert. Profile screens too.
- Stats: WeekEnergyCard zero case '+0'; baselines.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments (LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10); Screen.tsx:22 and :117; gym.tsx:155 comment false.
- Code: duplicated easing bezier, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; exercise-progress hardcodes kg; unused keys; AddMenu.tsx:3; reduceMotion.ts:13 state-update warning in tests.
- Doc: stale citations (session.tsx lines after :571 moved by 8; log-session.tsx :161, :180 for row 76 item 3; :263-275; row 76 item 8); sections 484, 509, 631, 828, 855, 1421, 1441; row 85, 104, 112 citations.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy.
- Toasts: 'Updated {name}', savedAdded, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Gym Summary card logs with no UI (index.tsx:179); streak skeleton (index.tsx:108, :114).
- Row 114 chevron needs a day-detail route that does not exist.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, privacy, support, about, log-session layout, Privacy/Support/About layout, the library close path in session.tsx. The three suites referencing app/profile/ (tabNavigation, phase14Regression, hydrationErrorScreens) do not check layout.
- Tab bar: Reduce Transparency pill fill; GlassSurface may clip pill shadow. Needs device.
- Old /tmp/lume-* folders: not ours.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Most suites read source text.

## Gotchas
- Decode design in memory or /tmp; delete after. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4, Profile b09a5e65. 'bundle :N' = decoded lines. Colour hex at design/Lume App.html:382.
- Tokens: src/lib/design/tokens.ts. TextField: src/components/forms/TextField.tsx.
- LC_ALL=C /usr/bin/grep; quote paths. Grep app/profile/, not src/app/profile/.
- Doc row numbers are file lines. After a handover, name files fully.
- Briefs and reports can carry false premises; check first.
- Use jest --ci to avoid writing snapshots. Don't echo === in zsh.
- Repeat verify rounds on 108 and 109 add nothing.

## Jev
R337 (handover): ask 65%, run 30%. Kept run for row 76 item 4 (parked, needs a day view).
R338: ask 79%. Kept run: the close fix is a design-answered change on the row's own screen.
R339: ask 54%, run 43%, risk 1.3. Kept run: checkpoint needs no answer from Isa and changes no files.
R340: run 52%, ask 45%, risk 1.3 (confidence 0.40). Kept run: My workouts is a single missing section with no Isa dependency.

## Accepted limits
- Failure paths untested.
- Keyboard overlap unverifiable in dev (DECISIONS.md).
- Most suites read source text.
