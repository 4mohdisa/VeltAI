# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before building.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests. Checkpoints: full tsc and jest --ci.
- Owner-only gaps parked, not asked. Blocked questions not re-asked.
- Accepted: gym duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset stays raised above inset 34; active cell keeps emitting tabPress.
- Data model changes (per-day draft store) parked, not asked.
- Row 117 item 6: history.tsx:55 uses color.label, same value as gray800.
- Row 76 add path not faked: logging on pick marks the day done; adding to the template changes future weeks.
- Flagged reports are handled by a doc re-check round that runs tsc and the source-reading suites.

## Status
- PARTIAL: 76, 107, 109, 110, 111, 113, 115, 116, 117, 118.
- DIFFERENT: 82 (streak strip), 84 (deprecated aliases in NavBar.tsx:29, Badge.tsx:19, :38), 114 (item 8 only).
- Blocked: 83, 85, 87, 103, 104, 108, 112.
- Last checkpoint R408: full tsc exit 0; full jest --ci 822 passed, 2 failed (both detailChrome energy balance and macros snapshots, gap 16, blocked). No files changed.
- R405: source-reading suites green (sheetVariant 9/9, tabNavigation 11/11, oneTapGymLog 3/3, gymDurationHonesty 4/4). Differences 8, 10, 19 re-checked.
- R405: no doc edits needed for the alias lines (674, 859-868). Line 855 is about letter spacing, not aliases.
- Alias count: 50 grep lines = 41 uses in 24 files, 7 definitions (tokens.ts:50-56), 1 test, 1 comment. src/app/gym has no alias uses.
- R406: doc-only citation refresh for differences 1-7, 16, 17, 20 done.
- R407: doc-only citation refresh for differences 9, 11, 12, 14, 22, 23 and row 111 done in report, but 9, 11, 12, 14, 22, 23 were not all re-checked. 23 known stale (index.tsx:178 now, not :179).
- R408 flagged (known detailChrome failures only, no new failures). R409 (this round): flagged-report handling. tsc and source-reading suites, plus doc-only citation refresh for differences 9, 11, 12, 14, 22, 23 and row 111. Result pending in next round.
- Nothing checked on a device.

## Blocked on Isa (do not re-ask, do not retry)
- detailChrome snapshot: gap 16 on energy balance and macros. Do not touch.
- Row 76 add path: approve draft store, TodayCard.tsx, gym.tsx, ExercisePicker.tsx.
- Row 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- Row 117: item 1 radius 20 on seven cards; item 5 tracking; item 7 shadows; item 8 logged pill wash (also row 114 item 8).
- Row 113 item 3: remove 4px at Screen.tsx:117, or accept.
- Row 118: keep or revert R360 LumeTabBar.tsx edit.
- Row 82: footnote '23 sessions · 2 freezes'; settle session count first.
- Shared components: BottomSheet, SheetContent, Button, sheet height; toast duration and position; second session row; logged-day actions; SettingsList geometry; About header; DetailChart; Summary values and padding; sheet resize on second-sheet swap.
- Failed schedule and templates states; My workouts heading at zero templates.
- Shared Screen.tsx bottom padding (48+inset vs 40): owner call before rows 107-110.

## Owner device checks (parked)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize. Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves template estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62) picks by plan, not cardio; second sheet keys, caption, pill sizes, footer scroll.
- Streak: streak.tsx:89 'Sessions' vs hooks.ts:156 distinct days; flame pulse, grey at zero, SF Symbol artwork.
- Row 76: chevron SF Symbol (log-session.tsx:250); possible second add route bundle :1310; session.tsx:565-569.
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat.
- Failed templates fetch; picker offers only Rest day and could overwrite a workout.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; Screen.tsx:22; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; reduceMotion.ts:13; 41 deprecated alias uses in 24 files (tokens.ts:46-48). Row 84 alias fix to be weighed as a row build after the doc round.
- i18n: hardcoded English on most screens (see session.tsx:539-555); sheet strings English only (log-session.tsx:311-392).
- Logged card chevron with no action (TodayCard.tsx:115, :194); no logged-day guard in src/app/gym/session.tsx.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood local only.
- AI insights screen has no file in src/app/profile/.

## Jev
R405: ask 78, stop 17, run 5 (confidence 0.67); chose run: doc-only fix. R406: run 89%; chose run: doc-only citation refresh. R407: run 95%; chose run: flagged-report re-check then doc-only refresh. R408: run 95%; chose run: checkpoint. R409: run 92%, ask 5%, stop 3%; chose run: flagged-report doc re-check. Risk of continuing without Isa 1.5/2 (confidence 0.31).

## Gotchas
- Briefs carry false premises: check first (row 117 items 5-7 are not in TodayCard; CTA handler is src/app/(tabs)/gym.tsx:243-246, not :160).
- Tab bar: src/components/navigation/LumeTabBar.tsx; gym handler :243-246.
- Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- Doc rows are file lines; bundle lines are decoded. Use mktemp for decode scripts. Quote '===' in zsh.
- findRelatedTests misses source-reading suites and finds none for gym screens; it exits 1 without --passWithNoTests. 'No tests found' is not a pass. Quote paths with spaces. Pass each test path as a separate argument.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation (in src/__tests__). Grep will not find a suite by its own name; use find.
- Use LC_ALL=C /usr/bin/grep. Always report exit codes.
- Prompts name loop/design-match and forbid switching, pushing and merging.
- Prompts must name the matching design/ file explicitly (design/Lume App.html). A prompt without it was rejected in R407.
- Latest build state: row 76 items 3, 5, 8 built plus item 2 glyph; add path open. Row 114 stays DIFFERENT. Row 117 items 2, 3, 4 (EXACT), 6 built; 5, 7 open outside TodayCard; 1, 8 blocked.

## Latest handover (R409)
Branch loop/design-match. Don't switch, push, merge or commit. R408 checkpoint result: tsc 0; jest --ci 822 passed, 2 failed (known detailChrome gap 16 only). R409 is a doc-only re-check round that runs tsc and the four source-reading suites, then refreshes citations for differences 9, 11, 12, 14, 22, 23 and row 111. The earlier handover suggestion to fix :855 and :674 for aliases is superseded: R405 found no doc edit needed there. Next: row 84 alias fix as a candidate.

## Round log
- R406: chose run, doc-only citation refresh for differences 1-7, 16, 17, 20. Done.
- R407: chose run, flagged-report re-check and doc-only citation refresh for differences 9, 11, 12, 14, 22, 23 and row 111. Prompt rejected for not naming the design file; rewritten in R408.
- R408: chose run, checkpoint (full tsc and full jest --ci, no file changes). Result: tsc 0; jest 822 passed, 2 failed (known gap 16). Flagged by automatic check.
- R409: chose run, flagged-report doc re-check (tsc, four source-reading suites, citation refresh for differences 9, 11, 12, 14, 22, 23 and row 111). Candidates: doc re-check; row 84 aliases; row 82 (blocked).