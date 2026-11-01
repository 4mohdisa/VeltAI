# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified.

## Status
Loop STOPPED at R416. All remaining rows blocked on Isa or owner. No task is left that is not a blocked row. Row 111 is PARTIAL with no recorded blocker: re-check it first when the loop restarts.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before building.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task.
- Badge.tsx and NavBar.tsx alias uses replaced with color.label and color.light2 (same values).
- Row 117 item 6: history.tsx:55 uses color.label, same value as gray800.
- Row 76 add path not faked: logging on pick marks the day done.
- Badge style differences stay parked (style changes banned).
- Accepted: gym duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset stays raised above inset 34; active cell keeps emitting tabPress.
- Data model changes (per-day draft store) parked, not asked.
- NavBar.tsx:29 gray200 alias cleanup dropped as tidying (R416).

## Built (not verified)
- Row 82 (streak strip, footnote blocked).
- Rows 84, 114, 117, 118 partial, see blocked list.
- Badge.tsx gray700 to label at :19 and :38 (same value).

## Re-checked (do not repeat)
- Rows 107, 108, 109, 110, 111, 82, 84 (R405-R413). Statuses: 107 and 108 untouched, 109 and 110 PARTIAL, 111 PARTIAL, 82 BUILT, 84 DIFFERENT.

## Blocked on Isa (do not re-ask)
- Row 84 NavBar: bordered full-width bar vs floating chrome; centred bodyBold title vs floating eyebrow; GlassBackButton with label vs floating circle (44px Gym, 38px Profile).
- Row 82: footnote '23 sessions 2 freezes'.
- Gap 16: detailChrome energy balance and macros snapshots. Do not touch.
- Shared Screen.tsx bottom padding (48+inset vs 40): owner call before rows 107-110.
- Row 76 add path: approve draft store, TodayCard.tsx, gym.tsx, ExercisePicker.tsx.
- Row 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- Row 117: item 1 radius 20 on seven cards; item 5 tracking; item 7 shadows; item 8 logged pill wash (also row 114 item 8).
- Row 113 item 3: remove 4px at Screen.tsx:117, or accept.
- Row 118: keep or revert R360 LumeTabBar.tsx edit.
- Shared components: BottomSheet, SheetContent, Button, sheet height; toast duration and position; second session row; logged-day actions; SettingsList geometry; About header; DetailChart; Summary values and padding; sheet resize on second-sheet swap; failed schedule and templates states; My workouts heading at zero templates.

## Owner device checks (parked)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize. Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves template estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62) picks by plan; second sheet keys, caption, pill sizes, footer scroll.
- Streak: streak.tsx:89 'Sessions' should say distinct days (hooks.ts:156); flame pulse, grey at zero, SF Symbol artwork.
- Badge: padding and weight differ from nearest design pills. Left as is.
- Row 76: chevron SF Symbol (log-session.tsx:250); possible second add route bundle :1310; session.tsx:565-569.
- Row 108: bottom padding difference not yet recorded.
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat.
- Logged card chevron with no action (TodayCard.tsx:115, :194); no logged-day guard in session.tsx.
- Failed templates fetch; picker offers only Rest day and could overwrite a workout.
- Doc: DESIGN_GAP_ANALYSIS.md:674, :864, :868 still say Badge and 41 lines in 24 files; now 39 lines in 23 files.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; Screen.tsx:22; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; reduceMotion.ts:13; 38 alias lines remain in 22 files (tokens.ts:50-56), NavBar.tsx:29 gray200 included.
- i18n: hardcoded English on most screens (session.tsx:539-555); 'What did you do?' sheet English only (log-session.tsx:311-392).
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood local only.
- AI insights screen has no file in src/app/profile/ (design has it).

## Gotchas
- Briefs carry false premises: check first (row 117 items 5-7 not in TodayCard; CTA handler is gym.tsx:160; + menu handler at LumeTabBar.tsx:243-246, not gym.tsx; gym.tsx:243-246 does not exist).
- Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- zsh does not split $paths; use ${=paths} or separate arguments.
- A pipe hides grep's exit code; run grep without one when reporting it.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation.

## Round log
- R405-R412: doc fixes, Badge.tsx and NavBar.tsx alias builds, checkpoint R408 (tsc 0; jest 822 passed, 2 known gap-16 failures).
- R413: doc re-check, row 84 citations and counts corrected; tsc 0; four source-reading suites green.
- R414: STOP. Remaining rows blocked on Isa or owner.
- R415: handover read, STOP confirmed. Dropped NavBar alias cleanup (tidying). Jev stop 89%.
- R416: handover read, STOP confirmed again. Jev stop 87%. Nothing built, nothing changed.

## Summary for Isa (for the owner)
To unblock the loop, decide: row 84 NavBar style (bordered bar vs floating chrome), row 82 footnote, gap 16, Screen.tsx bottom padding, row 76 add path, and rows 113, 116, 117, 118 items listed above. Then restart the loop from the blocked list. Row 111 needs a re-check when the loop restarts.