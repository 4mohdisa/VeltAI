# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Never jest -u or edit .snap files without Isa. Use jest --ci.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- Design decides product behaviour when it answers the question.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras; keep Meal history link; keep Training list until replacement exists; accept LoadFailedNotice; rest day goes to session picker; swipe colour is primary.
- R338: picker close fix in session.tsx approved by default.
- Loop commits loop/ files; check with git show --stat HEAD.
- Every build round: one tsc run plus jest --ci only on suites importing the changed file. Checkpoint rounds run full tsc and jest --ci with no file changes.
- Every prompt must name loop/design-match as the only branch (loop note R342 rejection).

## Status
- Re-checked: 107-109, 111, 113-118. Repeat verify rounds on 108 and 109 add nothing.
- R341: row 113 item 1 (My workouts) built in schedule.tsx, not on device.
- R342: test gate on schedule suites. No test imports schedule.tsx, so the gate ran nothing. Recorded, no further action.
- Row 76 item 1 built in code (R338, not on device). Item 4 parked.
- R343: row 115 exercise progress is the active task.

## Open rows
- 76 PARTIAL: items 2 (glyph, add path), 3 (second sheet), 5-7 (time, celebration dash, cardio minutes). Items 1 and 8 done.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 85, 87, 103, 104, 112, 114: Blocked (see below).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast; glyph, chevron geometry; footnote cites.
- 108 PARTIAL: eyebrow copy; feedback has no toast; label and button styling; geometry (Blocked).
- 109 PARTIAL: wordmark tracking; tagline centring; Version/Build can be empty; glyph; padding; geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: item 1 BUILT (test gate in R342); picker sheet; spacing above section (12 vs 20); empty state (item 10).
- 114 DIFFERENT: session card, 14 items; tap target, planned grid; logged pill wash, Calories cell (Blocked).
- 115 PARTIAL, IN PROGRESS (R343): exercise progress, 11 items.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device.

## Next
1. Row 115 exercise progress (R343, in progress).
2. Row 113 picker sheet (not the spacing item, which is blocked on SettingsList geometry).
3. Row 76 items 3, 5, 6, 7, one per round.
4. Rows 116, then 117, then 118 items not needing device.
5. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- One approved jest -u on detailChrome (energy and macros).
- DetailChart.tsx: Kicker, Breakdown dots. LumeTabBar.tsx: + menu chooser on logged days.
- Shared SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45).
- Second row on logged day (mutations.ts:173-178). Logged-day actions.
- SettingsList row geometry: fix or accept. Settles 107-109. Recommended next for Isa.
- Summary: 17, 21, 28, 29, 30. Top padding Gym, Summary, Food. Burn target 10-11; energy week axis 15; header strip Screen.tsx:163. About header: keep heading or remove. Logged pill wash token.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, Food gap, logged-day sheet and toast, library close paths.
- Native review of es/fr strings. TestPG_* (18 skipped).

## Parked (one line per group)
- Gym schedule: no refetch on focus (schedule.tsx; useTemplates and useSchedule fetch on mount only). Duplicate Training list link to /gym/templates overlaps My workouts. Muscle names and short day names not translated. Muscle phrase derived and English-only; line 2 shows only 'N exercises' if the joined exercise is missing (api.ts:754).
- Gym logged day: no day view (design :850-873); logged card has no press route.
- Gym: stale Start workout after logging (gymSchedule.ts:32-61; gym.tsx:70-73); stale logged flag after midnight (hooks.ts:159).
- + menu pushes sheet before the check (LumeTabBar.tsx:179).
- Exercise library: multi-select (design :1271-1289).
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard, gym session empty state and add button (session.tsx:539-555), 'Save progress?' alert, templates.tsx.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments (LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10); Screen.tsx:22 and :117; gym.tsx:155.
- Code: duplicated easing bezier, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; exercise-progress hardcodes kg; AddMenu.tsx:3; reduceMotion.ts:13 test warning.
- Doc: stale citations (session.tsx, log-session.tsx, row 76 item 3 and 8, schedule.tsx lines off by 3 to 62 after R341); sections 484, 509, 631, 828, 855, 1421, 1441; rows 85, 104, 112.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy. Toasts: 'Updated {name}', savedAdded, toast fade.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard; Summary card logs with no UI (index.tsx:179); streak skeleton (index.tsx:108, :114). Pressed light1 fill missing on My workouts cards (Card lacks pressed support).
- Row 114 chevron needs a day-detail route that does not exist.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers Privacy, Support, About layout, CaloriesCard, quick-add, gym card order, gym.tsx, MyScheduleCard, chooser, log-session layout, schedule.tsx, or the library close path. Most suites read source text.
- Tab bar: Reduce Transparency pill fill; GlassSurface may clip pill shadow. Needs device.
- Old /tmp/lume-* folders: not ours.

## Jev
R337: ask 65%, kept run (row 76 item 4 parked).
R338: ask 79%, kept run (design-answered close fix).
R339: ask 54%, kept run (checkpoint, no files changed).
R340: run 52%, kept run (My workouts is a single section with no Isa dependency).
R341: ask 62%, kept run (file is in row 113 scope; copy comes from the design).
R342: run 89%, kept run (test gate only).
R343: run 86%, kept run (row 115 has no Isa dependency; clears 11 items).