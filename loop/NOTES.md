# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before building.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task. Doc fixes only in re-check rounds, or as the row-update line of the row just built.
- Build rounds: tsc plus findRelatedTests or named suites. Checkpoints: full tsc and jest --ci.
- Owner-only gaps parked, not asked. Blocked questions not re-asked.
- Accepted: gym duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset stays raised above inset 34; active cell keeps emitting tabPress.
- Data model changes (per-day draft store) parked, not asked.
- Row 117 item 6: history.tsx:55 uses color.label, same value as gray800.
- Row 76 add path not faked: logging on pick marks the day done; adding to the template changes future weeks.
- Flagged reports are handled by a doc re-check round that runs tsc and the source-reading suites.
- R410: Jev said ask 80%. Kept run for row 84 only.
- R411: one prompt = one component. R410 rejected for two components.
- R412: Badge style differences (padding, type vs nearest pills) stay parked. No decision says which pill it should match, and style changes are banned.
- Badge.tsx alias uses replaced with color.label (same #171717). Row 84 stays DIFFERENT until NavBar.tsx:29 is done.

## Status
- PARTIAL: 76, 107, 109, 110, 111, 113, 115, 116, 117, 118.
- DIFFERENT: 82 (streak strip, blocked), 84 (NavBar.tsx:29 alias still open; Badge.tsx done R411), 114 (item 8 only, blocked).
- Blocked: 83, 85, 87, 103, 104, 108, 112.
- Last checkpoint R408: full tsc exit 0; full jest --ci 822 passed, 2 failed (both detailChrome energy balance and macros snapshots, gap 16, blocked).
- R409: source-reading suites green (27 of 27). Doc citation refresh done.
- R411: Badge.tsx alias build (row 84). Tests tabNavigation + sheetVariant 20 of 20 passed. Full tsc 0.
- R412 (this round): NavBar.tsx alias task (row 84) chosen, after loop note flagged R411 as partly done.
- Alias count now: 39 lines in 23 files (was 41 in 24). 7 definitions (tokens.ts:50-56), 1 test, 1 comment. src/app/gym has no alias uses.
- Nothing checked on a device.

## Blocked on Isa (do not re-ask, do not retry)
- detailChrome snapshot: gap 16 on energy balance and macros. Repeated blocker in R411 report. Do not touch, do not retry.
- Row 76 add path: approve draft store, TodayCard.tsx, gym.tsx, ExercisePicker.tsx.
- Row 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- Row 117: item 1 radius 20 on seven cards; item 5 tracking; item 7 shadows; item 8 logged pill wash (also row 114 item 8).
- Row 113 item 3: remove 4px at Screen.tsx:117, or accept.
- Row 118: keep or revert R360 LumeTabBar.tsx edit.
- Row 82: footnote '23 sessions 2 freezes'; settle session count first.
- Shared components: BottomSheet, SheetContent, Button, sheet height; toast duration and position; second session row; logged-day actions; SettingsList geometry; About header; DetailChart; Summary values and padding; sheet resize on second-sheet swap.
- Failed schedule and templates states; My workouts heading at zero templates.
- Shared Screen.tsx bottom padding (48+inset vs 40): owner call before rows 107-110.

## Owner device checks (parked)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize. Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves template estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62) picks by plan, not cardio; second sheet keys, caption, pill sizes, footer scroll.
- Badge: padding 4/12 and 600 13/16 differ from nearest design pills (gym bundle :93 and :486, food bundle :104). No decision says which to match; left as is.
- Streak: streak.tsx:89 'Sessions' vs hooks.ts:156 distinct days; flame pulse, grey at zero, SF Symbol artwork.
- Row 76: chevron SF Symbol (log-session.tsx:250); possible second add route bundle :1310; session.tsx:565-569.
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat.
- Failed templates fetch; picker offers only Rest day and could overwrite a workout.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; Screen.tsx:22; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; reduceMotion.ts:13; 39 deprecated alias lines in 23 files beyond row 84 (tokens.ts:46-48).
- Doc: DESIGN_GAP_ANALYSIS.md:674 and item 6 (lines 864, 868) still say Badge uses aliases and '41 lines in 24 files'; now 39 in 23. Fix in next doc re-check round.
- i18n: hardcoded English on most screens (see session.tsx:539-555); sheet strings English only (log-session.tsx:311-392).
- Logged card chevron with no action (TodayCard.tsx:115, :194); no logged-day guard in src/app/gym/session.tsx.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood local only.
- AI insights screen has no file in src/app/profile/ (design has it).

## Jev
R405: ask 78, stop 17, run 5; chose run: doc-only fix. R406: run 89%. R407: run 95%. R408: run 95%; checkpoint. R409: run 92%. R410: ask 80%; chose run for row 84. R411: stop 39%, ask 33%, run 28% (confidence 0.09); chose run for Badge.tsx, reason in decisions. R412: run 92%, ask 4%, stop 4% (confidence 0.88); chose run for NavBar.tsx. Risk of continuing without Isa 1.7/2 (confidence 0.50).

## Gotchas
- Briefs carry false premises: check first (row 117 items 5-7 are not in TodayCard; CTA handler is src/app/(tabs)/gym.tsx:160, not :243-246, which is the + menu in LumeTabBar.tsx).
- Tab bar: src/components/navigation/LumeTabBar.tsx; + menu handler :243-246.
- Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- Doc rows are file lines; bundle lines are decoded. Use mktemp for decode scripts. Quote '===' in zsh.
- findRelatedTests misses source-reading suites and finds none for gym screens; it exits 1 without --passWithNoTests. 'No tests found' is not a pass. Quote paths with spaces. Pass each test path as a separate argument.
- zsh does not split $paths; use ${=paths} or separate arguments.
- A pipe hides grep's exit code; run grep without one when reporting it.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation (in src/__tests__). Use find to locate them.
- Use LC_ALL=C /usr/bin/grep. Always report exit codes.
- Prompts name loop/design-match and forbid switching, pushing and merging.
- Prompts must name the matching design/ file explicitly (design/Lume App.html).
- Prompts must touch ONE component or screen. Two files for two components is rejected (R410).

## Latest handover (R412)
Branch loop/design-match. Don't switch, push, merge or commit. R411 left NavBar.tsx:29 open (flagged as partly done). R412 builds NavBar.tsx alias replacement only if tokens.ts shows gray200 equals light2 (row 84, plus one row-84 doc line). Row 82 stays blocked. Gap 16 stays blocked and is not retried. After row 84 is built, the remaining work is a doc re-check (:674, item 6 counts). Then consider stopping: every remaining row is blocked on Isa or owner-only.

## Round log
- R406: chose run, doc-only citation refresh.
- R407: chose run, flagged-report re-check. Prompt rejected for not naming the design file; rewritten in R408.
- R408: chose run, checkpoint. tsc 0; jest 822 passed, 2 failed (known gap 16).
- R409: chose run, flagged-report doc re-check. tsc 0; four source-reading suites 27/27.
- R410: chose run, row 84 alias build. Rejected: two components.
- R411: chose run, row 84 Badge.tsx only. Done. Flagged as partly done (NavBar.tsx open).
- R412: chose run, row 84 NavBar.tsx alias. Candidates: NavBar.tsx; doc count fix at :674 and item 6; row 82 (blocked, not chosen).