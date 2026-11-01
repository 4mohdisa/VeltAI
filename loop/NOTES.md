# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative.
- jest --ci only. Never jest -u or edit .snap files. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests --passWithNoTests. Checkpoints: full tsc and jest --ci, no file changes.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras, Meal history link, Training list until replacement, LoadFailedNotice; rest day to picker (accepted deviation); My workouts on schedule screen; swipe colour primary; R338 picker close fix approved.
- Owner-only gaps are parked, not asked. Blocked questions are not re-asked. Blocked files are not edited. No workarounds for blocked items.
- A flagged report is cleared by running tsc and tests in the next build round.
- Rejected prompts are rewritten with every listed point fixed, including the branch rule (R366) and the design file name (R368).
- A red suite caused only by a blocked file does not stop unrelated builds (R370). Build rounds still run tsc and findRelatedTests for the changed files.

## Status
- Re-checked: 107-109, 111, 113-118. Row 117 item 4 re-checked in R366 and now EXACT (code re-checked, not verified on device).
- 113: open 3, 10, 11 (blocked). 76: open 2, 3, 5-7. 115: built except owner gaps. 116: exhausted for loop work; item 7 needs a device.
- 117: items 2, 3 and 4 built or exact in code (R364, R365, R366). Item 1 blocked. Item 8 (Logged pill wash) is on the Blocked list; citation now TodayCard.tsx:193.
- 118: PARTIAL. LumeTabBar.tsx edited in R360 (blocked file), awaiting Isa. Items 4-5 need a device.
- R368 checkpoint RED: type check green (exit 0). jest --ci: 64 of 65 suites pass, 822 of 824 tests pass. Failing: src/__tests__/render/detailChrome.render.test.tsx, 'the four Summary detail views render identically across the chrome extraction' > 'energy balance' (:128) and > 'macros' (:140). Both are snapshot mismatches: snapshot has contentStyle undefined on Screen, code passes { gap: 16 }. Cause of the 16 gap not yet traced (git was off limits).
- detailChrome question (R369) was NOT answered by R370. Still open. Suite stays red until Isa decides.
- Uncommitted edits may remain from earlier rounds (eyebrow edit, gym log-session, session, schedule, exercise-progress). Not yet confirmed as committed.

## Open rows
- PARTIAL: 76, 107, 109, 111, 115, 116, 117, 118.
- Blocked: 83, 85, 87, 103, 104, 108, 112, 114.

## Next
1. Do not re-ask the detailChrome question. Keep the suite red and flagged until Isa answers. Do not run jest -u or edit the snapshot.
2. R370 build: row 76 item 3 (second sheet, gym/log-session.tsx, design gym bundle 7dc211f6). Build round: tsc plus findRelatedTests for log-session.tsx only. Full suite not run.
3. If Isa answers detailChrome later: approved path runs in the next build round, then tsc and jest --ci detailChrome.render.test.tsx only, to clear the flag. Then a full checkpoint.
4. Row 118 check after Isa answers R360 question: tsc; jest --ci tabNavigation.test.ts; findRelatedTests LumeTabBar.tsx --passWithNoTests. No file changes.
5. If no non-blocked task remains after row 76 item 3, stop with 'only owner decisions remain'.

## Blocked on Isa (do not re-ask)
- detailChrome snapshot (R369 question, unanswered at R370): keep gap 16 on energy balance and macros, or remove it. Replaces the older 'jest -u for detailChrome' entry.
- 116: items 1-2 open cells to day view (build); 3 keep frozen fill; 4 logged day level 2 or 3; 5 keep '1 session'; 6 keep strings; 8 nav button size fix.
- 117 item 1: templates.tsx:50 radius 28 vs 20; session.tsx:407, muscles.tsx:73 layout; keep 20 on seven cards?
- 117 item 8: logged pill wash (Summary list).
- 113 item 3: remove 4px at Screen.tsx:117, or accept.
- 118: keep or revert R360 LumeTabBar.tsx edit.
- Shared BottomSheet, SheetContent, Button, sheet height (shared with onboarding). Toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178, deliberate). Logged-day actions (no press handler; + menu on logged days).
- Screen.tsx:96 gap default. SettingsList geometry (recommended fix).
- Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15; Screen.tsx:163 header strip; About header; logged pill wash; DetailChart.tsx Kicker and Breakdown dots.
- Failed schedule fetch shows empty week; failed templates look like no templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar.
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal. Native es/fr review. TestPG_* (18 skipped).

## Parked (one line each, grouped)
- Gym: no refetch on focus (Start workout can show after logging); duplicate Training link; untranslated muscle and day names; hardcoded picker title; day_name.slice; My workouts press 0.85 with no fill; LumeTabBar.tsx:179 + flash; library multi-select; exercise progress rowing, English copy, lb as kg; CardHeaderRow colour; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; index.tsx:179, 108, 114; row 114 chevron needs day route; + menu pushes sheet before checking logged state (possible flash).
- Row 114: TodayCard may repeat old values. Row 117: logged stats show 3 cells vs 4 (no calories data). Row 113 schedule.tsx citations out of date.
- Stale comments and citations: gymSchedule.ts:32-61, gym.tsx:70-73, hooks.ts:159; LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155; schedule.tsx 'Tues' comment; sheetRowNameStyle name (also styles the week row name).
- Tests: gymCalendar NAV_SIZE 32 vs 44; most suites read source text; uncovered: Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule, exercise-progress, library close.
- Layout: TAB_BAR_CLEARANCE unused. Shadow radius may render softer on iOS.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, and others.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood is local only.
- Doc: stale citations after rows 113, 115, 117; rows 85, 104, 112.

## Jev
Decisions R337-R369 kept as made. R365 ran row 117 item 3 (Jev run 87%). R366 run 86%, chose row 117 item 4 re-check. R367 run chosen as verification round (flag clearance) over row 76 item 3; Jev run 96%.
R368: Jev ranked row 76 item 3 first at 88%. Kept the checkpoint, because the loop note required it. Result: red (see Status).
R369: Jev asked for ask at 88%. Chose ask, same as Jev. Reason: the red suite can only be cleared by Isa's snapshot decision, and jest -u on a blocked file is not allowed.
R370: Jev asked for ask at 89% after Isa did not answer R369. Chose run on row 76 item 3 instead. Reason: the unanswered question blocks only the red test in a blocked file, not the gym sheet. Jev cannot see that the gym sheet is a separate file. Risk 1.8 noted; task kept small (one sheet, tsc and findRelatedTests only).

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. Nothing has been checked on a device. No suite imports gym schedule, log-session, session or exercise-progress, so findRelatedTests needs --passWithNoTests. Handover recommendation for 113 item 3 conflicts with the Blocked list; the Blocked list wins. Don't echo === in zsh.