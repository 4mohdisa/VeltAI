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
- Rejected prompts are rewritten with every listed point fixed, including the branch rule (R366).

## Status
- Re-checked: 107-109, 111, 113-118.
- 113: open 3, 10, 11 (blocked). 76: open 2, 3, 5-7. 115: built except owner gaps. 116: exhausted for loop work; item 7 needs a device.
- 117: items 2 and 3 built in code (R364, R365; item 3 pill, chips and stat value restyled in TodayCard.tsx, not verified). Item 1 blocked. Item 4 under re-check this round. Item 8 citation stale (TodayCard.tsx:172 moved).
- 118: PARTIAL. LumeTabBar.tsx edited in R360 (blocked file), awaiting Isa. Items 4-5 need a device.
- Loop flag on R365 (partly done) is handled by Next 1.

## Open rows
- PARTIAL: 76, 107, 109, 111, 115, 116, 117, 118.
- Blocked: 83, 85, 87, 103, 104, 108, 112, 114.

## Next
1. Row 117 items 4 and 8: doc-only re-check of schedule.tsx entries and TodayCard.tsx citation (R366, in progress).
2. Row 76 item 3 (second sheet), after confirming design lines.
3. Checkpoint before next handover: full tsc and jest --ci, no file changes.
4. Row 118 check after Isa answers: tsc; jest --ci tabNavigation.test.ts; findRelatedTests LumeTabBar.tsx --passWithNoTests. No file changes.
5. If no non-blocked task remains, stop with 'only owner decisions remain'.

## Blocked on Isa (do not re-ask)
- 116: items 1-2 open cells to day view (build); 3 keep frozen fill; 4 logged day level 2 or 3; 5 keep '1 session'; 6 keep strings; 8 nav button size fix.
- 117 item 1: templates.tsx:50 radius 28 vs 20; session.tsx:407, muscles.tsx:73 layout; keep 20 on seven cards?
- 113 item 3: remove 4px at Screen.tsx:117, or accept.
- 118: keep or revert R360 LumeTabBar.tsx edit.
- jest -u for detailChrome.
- Shared BottomSheet, SheetContent, Button, sheet height (shared with onboarding). Toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178, deliberate). Logged-day actions (no press handler; + menu on logged days).
- Screen.tsx:96 gap default. SettingsList geometry (recommended fix).
- Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15; Screen.tsx:163 header strip; About header; logged pill wash; DetailChart.tsx Kicker and Breakdown dots.
- Failed schedule fetch shows empty week; failed templates look like no templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar.
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal. Native es/fr review. TestPG_* (18 skipped).

## Parked (one line each, grouped)
- Gym: no refetch on focus (Start workout can show after logging); duplicate Training link; untranslated muscle and day names; hardcoded picker title; day_name.slice; My workouts press 0.85 with no fill; LumeTabBar.tsx:179 + flash; library multi-select; exercise progress rowing, English copy, lb as kg; CardHeaderRow colour; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; index.tsx:179, 108, 114; row 114 chevron needs day route; + menu pushes sheet before checking logged state (possible flash).
- Row 114: TodayCard may repeat old values. Row 117: logged stats show 3 cells vs 4 (no calories data).
- Stale comments and citations: gymSchedule.ts:32-61, gym.tsx:70-73, hooks.ts:159; LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155; schedule.tsx 'Tues' comment; sheetRowNameStyle name.
- Tests: gymCalendar NAV_SIZE 32 vs 44; most suites read source text; uncovered: Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule, exercise-progress, library close.
- Layout: TAB_BAR_CLEARANCE unused. Shadow radius may render softer on iOS.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, and others.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood is local only.
- Doc: stale citations after rows 113, 115, 117; rows 85, 104, 112.

## Jev
Decisions R337-R366 kept as made. R365 ran row 117 item 3 (Jev run 87%). R366 run 86%, chose row 117 item 4 re-check.

## Gotchas
Briefs carry false premises: check first. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. Nothing has been checked on a device. The last eyebrow edit may be uncommitted. No suite imports gym schedule, log-session, session or exercise-progress. Handover recommendation for 113 item 3 conflicts with the Blocked list; the Blocked list wins.