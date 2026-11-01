# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before every build.
- jest --ci only. Never jest -u or edit .snap files. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests --passWithNoTests. Checkpoints: full tsc and jest --ci, no file changes.
- Owner-only gaps are parked, not asked. Blocked questions are not re-asked. Blocked files are not edited.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras, Meal history link, Training list, LoadFailedNotice; rest day to picker (accepted); My workouts on schedule screen; swipe colour primary; R338 picker close fix approved.
- Gym duration: saved duration and celebration use plan minutes of ticked exercises (behaviour change, accepted). Earlier sessions keep saved durations.
- Completion rate is the ticked share of exercises (my choice, not in the design).
- No kcal tag on second-sheet rows (no per-exercise burn). Second-sheet copy English only. Tab bar offset stays raised above inset 34.

## Status
- Re-checked: 107-109, 111, 113-118.
- Row 76: items 1, 3, 4, 8 built in code (not on device). Item 2 partly built (plus glyph, add path open). Item 5 fixed in code at log-session.tsx:123; doc still lists it open. Items 6-7 open.
- Row 113: open 11. Items 3 and 10 built, awaiting Isa. Title-to-card 24 vs 20 at Screen.tsx:117 stays.
- Row 115: built except owner gaps.
- Row 116: items 1-6 and 8 blocked. Month button pressed opacity built; chevron stroke open.
- Row 117: items 2, 3 built (TodayCard.tsx); item 4 exact. Item 1: 3 of 13 extra cards exact, 3 different, 7 no counterpart (blocked). Items 5-7 and 9-10 open; 8 blocked.
- Row 118: PARTIAL. LumeTabBar.tsx edited R360 (blocked file). Items 1-3, 6-11 built in code. Items 4, 5 need a device; 12, 13 kept.
- detailChrome: jest --ci 64 of 65 suites, 822 of 824 tests. Failing: src/__tests__/render/detailChrome.render.test.tsx ('energy balance', 'macros'), from contentStyle gap 16. Suite stays red and untouched.
- Nothing has been checked on a device.

## Open rows
- PARTIAL: 76, 107, 109, 111, 113, 115, 116, 117, 118.
- Blocked: 83, 85, 87, 103, 104, 108, 112, 114.

## Next
1. R373 doc re-check: row 76 item 5 to BUILT (code re-checked, not verified on device), citing log-session.tsx:123. Doc only.
2. Then row 76 item 2 (plus glyph, add path), if still different. Then items 6-7.
3. Then row 117 items 5-7 (non-blocked).
4. If no non-blocked task remains, stop: 'only owner decisions remain'.
5. If Isa answers detailChrome: approved path in the next build round, then tsc and jest --ci on that file only, then a full checkpoint.
6. If Isa answers R360 (LumeTabBar.tsx): tsc; jest --ci tabNavigation.test.ts; findRelatedTests LumeTabBar.tsx --passWithNoTests. No file changes.

## Blocked on Isa (do not re-ask)
- detailChrome snapshot: keep gap 16 on energy balance and macros, or remove it.
- 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level 2 or 3; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- 117 item 1: templates.tsx:50 radius 28 vs 20; session.tsx:407, muscles.tsx:73 layout; keep 20 on seven cards? 117 item 8: logged pill wash.
- 113 item 3: remove 4px at Screen.tsx:117, or accept.
- 118: keep or revert R360 LumeTabBar.tsx edit. Confirm the earlier LumeTabBar approval covers it.
- Shared BottomSheet, SheetContent, Button, sheet height (shared with onboarding). Toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178). Logged-day actions (no press handler; + menu on logged days).
- Screen.tsx:96 gap default. SettingsList geometry.
- Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15; Screen.tsx:163 header strip; About header; DetailChart.tsx Kicker and Breakdown dots.
- Failed schedule fetch shows empty week; failed templates look like no templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar, second sheet resize under fitToContents (_layout.tsx:155).
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal. Native es/fr review. TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves the template estimate, so the same plan can record different durations by path. templates.tsx 'about N min' can differ from the logged time.
- Gym: ticklist mode in session.tsx (:40, :123) unreached from the sheet, may be dead. Remove only in a dedicated task.
- Gym: no refetch on focus; duplicate Training link; untranslated muscle and day names; hardcoded picker title; day_name.slice; My workouts press 0.85 with no fill; LumeTabBar.tsx:179; library multi-select; exercise progress rowing, English copy, lb shown as kg; CardHeaderRow colour; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; index.tsx:179, 108, 114; row 114 chevron needs day route; + menu pushes sheet before logged-state check.
- Gym second sheet: add en/es/fr keys in an i18n task. Gaps: caption not footnote, pill 17/24 not 16/21, footer scrolls, bottom padding.
- Row 114: TodayCard may repeat old values. Row 117: logged stats show 3 cells vs 4 (no calories data). Row 113 schedule.tsx citations out of date. Rows 76, 113 citations stale. Row 114 not re-read since TodayCard edits.
- Failed templates fetch looks like zero templates, so the picker offers only Rest day, which could overwrite a workout.
- Stale comments and citations: gymSchedule.ts:32-61, gym.tsx:70-73, hooks.ts:159; LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155; schedule.tsx 'Tues' comment; sheetRowNameStyle name.
- Tests: gymCalendar NAV_SIZE 32 vs 44; most suites read source text; uncovered: Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule, exercise-progress, library close.
- Layout: TAB_BAR_CLEARANCE has no non-test callers; bar is 14 higher with no inset, so last rows may hide. Shadow radius may render softer on iOS.
- Logged pill wash (row 117 item 8) is flat; mixHex could fix it.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, second sheet.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood is local only.
- Doc: stale citations after rows 113, 115, 117; rows 76, 85, 104, 112.

## Jev
R337-R373 decisions kept. R373: run 70%; kept run, since non-blocked rows remain.

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. No suite imports gym schedule, log-session, session or exercise-progress, so findRelatedTests needs --passWithNoTests. sheetVariant, gymDurationHonesty, oneTapGymLog and tabNavigation read source text: run them when touching those files. sheetVariant needs variant first on SheetContent and the exact asPlanned Button line. Don't echo === in zsh. Handover at R372: Claude Code knows only the summary, so name files fully.