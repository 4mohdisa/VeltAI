# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before every build.
- jest --ci only. Never jest -u or edit .snap files. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests. Checkpoints: full tsc and jest --ci, no file changes.
- Owner-only gaps are parked, not asked. Blocked questions are not re-asked. Blocked files are not edited.
- Gym duration uses plan minutes of ticked exercises (accepted). Completion rate is the ticked share. No kcal tag on second-sheet rows. Second-sheet copy English only. Tab bar offset stays raised above inset 34.
- Every prompt names loop/design-match and forbids switching, pushing, merging and committing.
- Every prompt names the matching design/ file.
- findRelatedTests exits 1 when no tests map to a file. Add --passWithNoTests for files with no mapped tests.

## Status
- Re-checked: 76, 107-109, 111, 113-118. Row 114 aligned at R378.
- Row 76: items 1, 3, 4, 5, 8 built in code (not on device). Item 2 partly built (plus glyph; add path open). Items 6-7 open. Item 5 fixed in code but the doc still lists it open. PARTIAL.
- Row 113: 11 open. Items 3, 10 built, awaiting Isa.
- Row 114: 10 open. Items 9-12 fixed in code. Chevron, Sets count, useGymRange wait, pressed fill, stat shrink open. Item 8 blocked.
- Row 115: built except owner gaps.
- Row 116: items 1-6, 8 blocked. Month button pressed opacity built; chevron stroke open.
- Row 117: items 2, 3 built; 4 exact. Item 1: 3 of 13 exact, 3 different, 7 no counterpart (blocked). Items 5-7, 9-10 open; 8 blocked.
- Row 118: PARTIAL. LumeTabBar.tsx edited R360 (blocked). Items 1-3, 6-11 built. 4, 5 need device; 12, 13 kept.
- R380-R382: tsc and tests run. R382 full checkpoint: tsc exit 0; jest --ci 822 of 824 pass. Only failures: detailChrome.render.test.tsx (energy balance, macros), gap 16. Untouched, blocked on Isa.
- R383: loop flag on R382 report cleared. Report had tsc and jest run; the failures are the known blocked detailChrome cases. Building row 76 item 2 this round.
- Nothing checked on a device.

## Open rows
- PARTIAL: 76, 107, 109, 111, 113, 115, 116, 117, 118.
- Blocked: 83, 85, 87, 103, 104, 108, 112, 114.

## Next
1. (R383) Row 76 item 2 (plus glyph, add path) in src/app/gym/log-session.tsx. tsc plus findRelatedTests and gymDurationHonesty by path.
2. Row 76 items 6-7.
3. Row 117 items 5-7 (non-blocked).
4. Doc re-check round (allowed): mark row 76 item 5 built; row 76 detail at DESIGN_GAP_ANALYSIS.md:164 (old sheet described); row 76 stale lines (:47-48, :153-157, :162, :170-230, :242, :64, :256-270, :128-144); 'Log this session' CTA section at :534.
5. No non-blocked task left: stop, 'only owner decisions remain'.
6. If Isa answers detailChrome: tsc and jest --ci on that file, then full checkpoint.
7. If Isa answers R360: tsc; jest --ci tabNavigation.test.ts by path; findRelatedTests --passWithNoTests LumeTabBar.tsx. No file changes.

## Blocked on Isa (do not re-ask)
- detailChrome: keep gap 16 on energy balance and macros, or remove.
- 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level 2 or 3; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- 117: item 1 templates.tsx:50 radius 28 vs 20, session.tsx:407, muscles.tsx:73 layout, keep 20 on seven cards; item 8 logged pill wash.
- 114: item 8 logged pill wash (TodayCard.tsx:193).
- 113 item 3: remove 4px at Screen.tsx:117, or accept.
- 118: keep or revert R360 LumeTabBar.tsx edit. Confirm earlier LumeTabBar approval covers edits.
- Shared BottomSheet, SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45). Second session row (mutations.ts:173-178). Logged-day actions. Screen.tsx:96 gap default. SettingsList geometry. Screen.tsx:163. About header. DetailChart Kicker and Breakdown dots. Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15.
- Failed schedule fetch shows empty week; failed templates look like no templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar, second sheet resize (_layout.tsx:155).
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal. Native es/fr review. TestPG_* (18 skipped).
- Sheet resize under fitToContents when the second sheet swaps in (owner check).

## Parked (one line each, grouped)
- Gym saving: session.tsx:364 saves template estimate; templates 'about N min' can differ from logged time. Zero-minute plan saves no duration but celebration still gets formatDuration(0).
- Gym: minutesOf (log-session.tsx:61) picks by planned duration, design picks by cardio. PlannedValuesForm.tsx:84 lets cardio submit sets with optional duration (sets x 3.2 risk). Cardio sums per-segment minutes in design.
- Gym: ticklist mode (session.tsx:40, :123) unreached. No refetch on focus; duplicate Training link; untranslated muscle and day names; hardcoded picker title; My workouts press 0.85 no fill; library multi-select; exercise progress copy and lb as kg; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; GymSessionButton 'Start workout' opens session, design opens log sheet (bundle :98-102).
- Gym second sheet: en/es/fr keys; caption not footnote; pill 17/24 not 16/21; footer scrolls; bottom padding.
- Row 114: TodayCard may repeat old values; not re-read since TodayCard edits. Row 117: logged stats show 3 cells vs 4.
- Failed templates fetch looks like zero templates; picker offers only Rest day, could overwrite a workout.
- Stale comments: gymSchedule.ts:32-61, gym.tsx:70-73, hooks.ts:159, LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; most suites read source text; gymDurationHonesty.test.ts:54 stale 'Not set' title; no test covers log-session.tsx:123 sum or :274 celebration.
- Layout: TAB_BAR_CLEARANCE has no non-test callers; bar 14 higher with no inset, so last rows may hide. Logged pill wash is flat; mixHex could fix it.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; key={c.name}; SettingsList.tsx:129; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, second sheet.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- Doc: stale citations after rows 113, 115, 117; rows 85, 104, 112; row 76 detail and stale lines (see Next 4).

## Jev
R337-R382 decisions kept. R382: run 96%, kept run; risk 1.6 noted. R383: run 94% (confidence 0.91), kept run. Last-task-clean 49% noted for R382; the R382 checkpoint confirmed tsc green and only known jest failures.

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. findRelatedTests misses source-reading suites (sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation): run them by path found with find. sheetVariant needs variant first on SheetContent and the exact asPlanned Button line. A report saying tsc or tests were not run gets flagged. Checks run before later edits need a fresh run after the final edit. Handover at R387 needs full file names. Every prompt must name its matching design/ file, or it is rejected.