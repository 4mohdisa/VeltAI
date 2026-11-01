# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before every build.
- jest --ci only. Never jest -u or edit .snap files. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests --passWithNoTests. Checkpoints: full tsc and jest --ci, no file changes.
- Owner-only gaps are parked, not asked. Blocked questions are not re-asked. Blocked files are not edited.
- A flagged report is cleared by tsc and tests in the next build round.
- A red suite caused only by a blocked file does not stop unrelated builds.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras, Meal history link, Training list, LoadFailedNotice; rest day to picker (accepted deviation); My workouts on schedule screen; swipe colour primary; R338 picker close fix approved.
- Built-in-code choices: muscle phrase English only; picker list capped at 70% of window; row 115 item 7 needs no code; progress screen dropped PB card, trend badge, tooltip and text history (empty state kept).

## Status
- Re-checked: 107-109, 111, 113-118.
- Row 76: items 1, 3, 4, 8 built in code (second sheet R370, not on a device). Item 2 partly built (plus glyph, add path open). Items 5-7 open. Item 5 is the R372 task.
- Row 113: open 3, 10, 11 (blocked).
- Row 115: built except owner gaps.
- Row 116: exhausted for loop work.
- Row 117: items 2-4 built or exact. Items 1 and 8 blocked.
- Row 118: PARTIAL. LumeTabBar.tsx edited R360 (blocked file), awaiting Isa.
- detailChrome: checkpoint R368 red. jest --ci 64 of 65 suites, 822 of 824 tests. Failing: src/__tests__/render/detailChrome.render.test.tsx, 'energy balance' and 'macros' (snapshot has contentStyle undefined, code passes gap 16). Question R369 unanswered. Suite stays red and untouched.
- Nothing has been checked on a device.

## Open rows
- PARTIAL: 76, 107, 109, 111, 115, 116, 117, 118.
- Blocked: 83, 85, 87, 103, 104, 108, 112, 114.

## Next
1. R372 build: row 76 item 5 in gym/log-session.tsx. Build round: tsc plus findRelatedTests for log-session.tsx. No doc edit.
2. Then row 76 item 2 (plus glyph and add path), if still different.
3. If no non-blocked task remains, stop with 'only owner decisions remain'.
4. If Isa answers detailChrome: approved path runs in the next build round, then tsc and jest --ci on detailChrome.render.test.tsx only. Then a full checkpoint.
5. If Isa answers R360 (LumeTabBar.tsx): tsc; jest --ci tabNavigation.test.ts; findRelatedTests LumeTabBar.tsx --passWithNoTests. No file changes.

## Blocked on Isa (do not re-ask)
- detailChrome snapshot: keep gap 16 on energy balance and macros, or remove it.
- 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level 2 or 3; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- 117 item 1: templates.tsx:50 radius 28 vs 20; session.tsx:407, muscles.tsx:73 layout; keep 20 on seven cards? 117 item 8: logged pill wash.
- 113 item 3: remove 4px at Screen.tsx:117, or accept.
- 118: keep or revert R360 LumeTabBar.tsx edit.
- Shared BottomSheet, SheetContent, Button, sheet height (shared with onboarding). Toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178, deliberate). Logged-day actions (no press handler; + menu on logged days).
- Screen.tsx:96 gap default. SettingsList geometry (recommended fix).
- Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15; Screen.tsx:163 header strip; About header; DetailChart.tsx Kicker and Breakdown dots.
- Failed schedule fetch shows empty week; failed templates look like no templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar, second sheet resize under fitToContents (_layout.tsx:155).
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal. Native es/fr review. TestPG_* (18 skipped).

## Parked (one line each)
- Gym: no refetch on focus (Start workout can show after logging); duplicate Training link; untranslated muscle and day names; hardcoded picker title; day_name.slice; My workouts press 0.85 with no fill; LumeTabBar.tsx:179 and flash; library multi-select; exercise progress rowing, English copy, lb shown as kg; CardHeaderRow colour; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; index.tsx:179, 108, 114; row 114 chevron needs day route; + menu pushes sheet before logged-state check (possible flash).
- Gym R370: ticklist mode in session.tsx (:40, :123) may now be dead; remove only in a dedicated task.
- Gym R370: second-sheet copy English only; add en/es/fr keys in an i18n task. Second sheet gaps left: kcal tag (no per-exercise calories), caption not footnote, pill 17/24 not 16/21, footer scrolls, bottom padding.
- Gym R370: row 76 citations have moved; item 5 saved time vs subtitle (now in progress).
- Row 114: TodayCard may repeat old values. Row 117: logged stats show 3 cells vs 4 (no calories data). Row 113 schedule.tsx citations out of date.
- Stale comments and citations: gymSchedule.ts:32-61, gym.tsx:70-73, hooks.ts:159; LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155; schedule.tsx 'Tues' comment; sheetRowNameStyle name.
- Tests: gymCalendar NAV_SIZE 32 vs 44; most suites read source text; uncovered: Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule, exercise-progress, library close.
- Layout: TAB_BAR_CLEARANCE unused. Shadow radius may render softer on iOS.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, second sheet.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood is local only.
- Doc: stale citations after rows 113, 115, 117; rows 76, 85, 104, 112.

## Jev
R337-R371 decisions kept. R371 run 68%, chose run (flag clearance). R372: Jev run 91%, chosen run on row 76 item 5.

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. No suite imports gym schedule, log-session, session or exercise-progress, so findRelatedTests needs --passWithNoTests. Handover recommendation for 113 item 3 conflicts with the Blocked list; the Blocked list wins. Don't echo === in zsh.