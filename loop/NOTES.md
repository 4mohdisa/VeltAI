# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before every build.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests (--passWithNoTests if none map). Checkpoints: full tsc and jest --ci.
- Owner-only gaps parked, not asked. Blocked questions not re-asked. Blocked files not edited.
- Accepted: gym duration uses plan minutes of ticked exercises; completion is ticked share; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset stays raised above inset 34; active cell keeps emitting tabPress.
- Data model changes (per-day draft store) parked, not asked.
- One task = one component or screen.

## Status
- PARTIAL, nothing fully built: 76, 107, 109, 111, 113, 115, 116, 117, 118. Blocked: 83, 85, 87, 103, 104, 108, 112, 114.
- Fixed in code, doc still open: row 76 item 5; row 117 item 6 (history.tsx:41, :55; streak.tsx:55).
- Re-checked: 76, 107-109, 111, 113-118.
- R382 checkpoint: tsc 0; jest --ci 822 of 824. Only failure: detailChrome (blocked).
- Nothing checked on a device.

## Next
1. Doc re-check: row 117 item 6 marked fixed in code, not verified on device.
2. Doc re-check: row 76 item 5 marked fixed in code.
3. Doc re-check of row 114 against TodayCard.tsx (values may be stale).
4. Row 117 detail section: check DESIGN_GAP_ANALYSIS.md:841; differences 8, 10, 19 contradict 'What the app does'. Doc only.
5. If Isa answers a blocker below: act on it in the next round.
6. No non-blocked task left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not re-ask, do not retry)
- detailChrome snapshot: gap 16 on energy balance and macros, keep or remove. Repeated blocker. Do not touch.
- Row 76 add path: approve draft store, TodayCard.tsx, gym.tsx, ExercisePicker.tsx change. Repeated blocker.
- Row 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- Row 117: item 1 templates.tsx:50 radius, session.tsx:407, muscles.tsx:73, keep 20 on seven cards; item 5 Screen.tsx:122 and new-template.tsx:158 tracking; item 7 BottomSheet.tsx:145 and GlassButtons.tsx:229 shadows; item 8 logged pill wash.
- Row 114 item 8: logged pill wash (TodayCard.tsx:193).
- Row 113 item 3: remove 4px at Screen.tsx:117, or accept.
- Row 118: keep or revert R360 LumeTabBar.tsx edit; confirm earlier approval covers it.
- Shared BottomSheet, SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45). Second session row (mutations.ts:173-178). Logged-day actions. Screen.tsx:96. SettingsList geometry. Screen.tsx:163. About header. DetailChart Kicker and Breakdown dots. Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15.
- Failed schedule fetch shows empty week; failed templates look like zero templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Sheet resize under fitToContents when second sheet swaps in (owner check).

## Owner device checks (parked)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar, second sheet resize. Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves template estimate; 'about N min' can differ from logged time. Ticklist mode (session.tsx:40, :123) unreached. Library multi-select; per-set remove; cardio ParameterForm; template editor; GymSessionButton opens session, design opens log sheet.
- Gym: minutesOf (log-session.tsx:61) picks by planned duration, design by cardio. Cardio per-segment minutes.
- Row 76: chevron SF Symbol vs 2.4-stroke path (log-session.tsx:250); possible second add route bundle :1310; session.tsx:565-569 close handler.
- Gym second sheet: en/es/fr keys; caption not footnote; pill 17/24 not 16/21; footer scrolls.
- Row 117: logged stats 3 cells vs 4. Stale citations rows 85, 104, 111, 112, 113 (LumeTabBar handler now :243-246).
- Failed templates fetch; picker offers only Rest day, could overwrite a workout.
- Stale comments: gymSchedule.ts:32-61, gym.tsx:70-73, gym.tsx:155, hooks.ts:159, LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; source-text suites; gymDurationHonesty.test.ts:54 stale title.
- Layout: TAB_BAR_CLEARANCE has no non-test callers; bar 14 higher with no inset, last rows may hide. Logged pill wash flat; mixHex could fix.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; SettingsList.tsx:129; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, second sheet.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood local only.

## Jev
R337-R388 decisions kept. Jev ranks row 117 item 6 first. Keep builds small with explicit check requirements. Shared-file blocked items are not retried as TodayCard tasks.

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. findRelatedTests misses source-reading suites (sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation): run by path. Reports that skip tsc or tests get flagged; always report exit codes. 'No tests found' is not a test pass.