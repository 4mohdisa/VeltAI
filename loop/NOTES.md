# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before every build.
- jest --ci only. Never jest -u or edit .snap. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests (add --passWithNoTests if none map). Checkpoints: full tsc and jest --ci.
- Owner-only gaps parked, not asked. Blocked questions not re-asked. Blocked files not edited.
- Accepted: gym duration uses plan minutes of ticked exercises; completion is ticked share; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset stays raised above inset 34.
- Data model changes (per-day draft store) are parked, not asked.
- Every prompt names loop/design-match, forbids switching, pushing, merging and committing, and names its design/ file.
- One task = one component or screen. A prompt covering more than one is rejected (R386).

## Status
- Row 76: item 2 glyph built in code; add path open (differences a-d in doc). Items 1, 3, 4, 5, 8 built in code. Items 6-7 open. PARTIAL.
- Row 113: items 3, 10 built; 11 open. Screen.tsx:117 4px awaits Isa.
- Row 114: items 9-12 fixed in code; chevron, Sets count, useGymRange wait, pressed fill, stat shrink open; item 8 blocked.
- Row 115: built except owner gaps.
- Row 116: pressed opacity built; items 1-6, 8 blocked; chevron stroke open.
- Row 117: items 2, 3 built; 4 exact. Item 1: 3 of 13 exact, 3 different, 7 no counterpart (blocked). Items 5 and 7: TodayCard.tsx already matches; differences are in Screen.tsx:122, new-template.tsx:158 (item 5), BottomSheet.tsx:145, GlassButtons.tsx:229 (item 7), shared, blocked. Item 6: deprecated grey aliases at history.tsx:41, :55 and streak.tsx:55; R387 builds history.tsx only, streak.tsx:55 next. 8 blocked; 9-10 open.
- Row 118: PARTIAL. LumeTabBar.tsx edited R360 (blocked). Items 1-3, 6-11 built; 4, 5 need device; 12, 13 kept.
- Re-checked: 76, 107-109, 111, 113-118.
- R382 checkpoint: tsc 0; jest --ci 822 of 824. Only failures: detailChrome.render.test.tsx (blocked).
- R384, R385, R386 reports flagged (tsc or tests not run or no tests found). R386 doc-only edits to row 117 items 5-7 landed; tsc exit 0.
- Nothing checked on a device.

## Open rows
PARTIAL: 76, 107, 109, 111, 113, 115, 116, 117, 118. Blocked: 83, 85, 87, 103, 104, 108, 112, 114.

## Next
1. Row 117 item 6, history.tsx only (R387). Then tsc and findRelatedTests on history.tsx.
2. Row 117 item 6, streak.tsx:55 only, separate round.
3. Row 114 re-check of TodayCard.tsx (may repeat old values). Doc only.
4. Row 76 items 6-7 (log-session.tsx), only if not part of the add path.
5. If Isa answers detailChrome: tsc, jest --ci on that file, then full checkpoint.
6. If Isa answers R360: tsc; jest --ci tabNavigation by path; findRelatedTests --passWithNoTests LumeTabBar.tsx. No file changes.
7. If Isa approves row 76 add path: draft store, TodayCard.tsx, gym.tsx, ExercisePicker.tsx (shared with session.tsx). Only with explicit approval.
8. No non-blocked task left: stop, 'only owner decisions remain'.

## Blocked on Isa (do not re-ask)
- detailChrome: gap 16 on energy balance and macros, keep or remove.
- 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level 2 or 3; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- 117: item 1 templates.tsx:50 radius 28 vs 20, session.tsx:407, muscles.tsx:73 layout, keep 20 on seven cards; item 5 Screen.tsx:122 and new-template.tsx:158 tracking; item 7 BottomSheet.tsx:145 and GlassButtons.tsx:229 shadows; item 8 logged pill wash.
- 114 item 8 logged pill wash (TodayCard.tsx:193).
- 113 item 3: remove 4px at Screen.tsx:117, or accept.
- 118: keep or revert R360 LumeTabBar.tsx edit; confirm earlier approval covers it.
- Row 76 add path: approve draft store and picker change.
- Shared BottomSheet, SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45). Second session row (mutations.ts:173-178). Logged-day actions. Screen.tsx:96 gap default. SettingsList geometry. Screen.tsx:163. About header. DetailChart Kicker and Breakdown dots. Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15.
- Failed schedule fetch shows empty week; failed templates look like zero templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Sheet resize under fitToContents when second sheet swaps in (owner check).
- Confirm earlier LumeTabBar approval covers the R360 edit.

## Owner device checks (parked)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar, second sheet resize (_layout.tsx:155). Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves template estimate; templates 'about N min' can differ from logged time. Zero-minute plan still shows formatDuration(0).
- Gym: minutesOf (log-session.tsx:61) picks by planned duration, design by cardio. PlannedValuesForm.tsx:84 cardio sets risk. Cardio per-segment minutes.
- Gym: ticklist mode (session.tsx:40, :123) unreached. No refetch on focus; duplicate Training link; untranslated muscle and day names; hardcoded picker title; My workouts press 0.85 no fill; library multi-select; exercise progress copy, lb as kg; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; GymSessionButton opens session, design opens log sheet (bundle :98-102).
- Row 76: chevron SF Symbol vs 2.4-stroke path (log-session.tsx:250, bundle :412). CTA chevron-up also SF Symbol. Possible second add route bundle :1310. Stale citations in rows 111, 113 (LumeTabBar handler now :243-246). Row 76 detail close handler at session.tsx:565-569.
- Gym second sheet: en/es/fr keys; caption not footnote; pill 17/24 not 16/21; footer scrolls; bottom padding.
- Row 117: logged stats 3 cells vs 4. Row 117 detail section DESIGN_GAP_ANALYSIS.md:841 not re-read; differences 8, 10, 19 contradict corrected 'What the app does'. Row 114: TodayCard may repeat old values.
- Failed templates fetch; picker offers only Rest day, could overwrite a workout.
- Stale comments: gymSchedule.ts:32-61, gym.tsx:70-73, hooks.ts:159, LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; source-text suites; gymDurationHonesty.test.ts:54 stale title (describes a Not set state that no longer exists); no test for log-session.tsx:124 sum or :275 celebration.
- Layout: TAB_BAR_CLEARANCE has no non-test callers; bar 14 higher with no inset, so last rows may hide. Logged pill wash flat; mixHex could fix.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; key={c.name}; SettingsList.tsx:129; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, second sheet.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- Doc: stale citations rows 85, 104, 112.

## Jev
R337-R387 decisions kept. R387: Jev ranked row 117 item 6 first (91% run). Last-task-clean 47%; keep builds small and with explicit check requirements. Rows 117 items 5-7 are shared-file blocked; do not retry them as TodayCard tasks.

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. findRelatedTests misses source-reading suites (sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation): run by path. sheetVariant needs variant first on SheetContent and the exact asPlanned Button line. Checks run before later edits need a fresh run. Reports that skip tsc or tests get flagged; always run tsc once and report exit codes. A 'No tests found' result is not a test pass; state it plainly.