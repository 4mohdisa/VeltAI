# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before every build.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests. Checkpoints: full tsc and jest --ci.
- Owner-only gaps parked, not asked. Blocked questions not re-asked.
- Accepted: gym duration uses plan minutes of ticked exercises; completion is ticked share; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset stays raised above inset 34; active cell keeps emitting tabPress.
- Data model changes (per-day draft store) parked, not asked.
- Row 117 item 6: history.tsx:55 uses color.label, not gray800 (same value; tokens.ts asks for intent names).
- Row 76 add path not faked: logging on pick marks the day done; adding to the template changes future weeks.
- R398: followed Jev on Profile shared-chrome doc sync (see decisions in report).

## Status
- PARTIAL, none fully built: 76, 107, 109, 110, 111, 113, 115, 116, 117, 118. Blocked: 83, 85, 87, 103, 104, 108, 112, 114.
- Row 110 re-checked R397: 13 items, PARTIAL. Section at DESIGN_GAP_ANALYSIS.md:1420 out of sync; R398 task.
- Row 108 (Support) bottom padding not re-checked.
- Row 114: TodayCard detail section matches; DIFFERENT only on item 8.
- Row 117: items 2, 3 built; 4 EXACT; 6 fixed. Items 5, 7 open outside TodayCard. Items 1, 8 blocked.
- Row 76: items 2 (plus glyph), 3, 5, 8 built in log-session.tsx; add path blocked.
- R382 checkpoint: tsc 0; jest --ci 822 of 824. Failures: detailChrome only (blocked). Later rounds doc-only; jest not re-run.
- Nothing checked on a device.

## Next (for Isa)
1. Run full checkpoint: tsc --noEmit and jest --ci on loop/design-match.
2. Answer blockers below.
3. Doc still stale: row 111 wording; citations in differences 1-7, 13, 17, 20 and line 299; row 84 deprecated-token claim; check whether :674 and :855 still say aliases are in use (R390 says fixed).
4. Re-check row 108 once Screen.tsx padding is decided.

## Blocked on Isa (do not re-ask, do not retry)
- detailChrome snapshot: gap 16 on energy balance and macros, keep or remove. Do not touch.
- Row 76 add path: approve draft store, TodayCard.tsx, gym.tsx, ExercisePicker.tsx change.
- Row 116: items 1-2 open cells to day view; 3 keep frozen fill; 4 logged day level; 5 keep '1 session'; 6 keep strings; 8 nav button size.
- Row 117: item 1 radius 20 on seven cards (templates.tsx:50, session.tsx:407, muscles.tsx:73); item 5 tracking (Screen.tsx:122, new-template.tsx:158); item 7 shadows (BottomSheet.tsx:145, GlassButtons.tsx:229); item 8 logged pill wash.
- Row 114 item 8 and Row 117 item 8: logged pill wash (TodayCard.tsx:193).
- Row 113 item 3: remove 4px at Screen.tsx:117, or accept.
- Row 118: keep or revert R360 LumeTabBar.tsx edit.
- Shared BottomSheet, SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45). Second session row (mutations.ts:173-178). Logged-day actions. Screen.tsx:96. SettingsList geometry. Screen.tsx:163. About header. DetailChart Kicker and Breakdown dots. Summary 17, 21, 28-30; top padding; burn target 10-11; energy axis 15.
- Failed schedule fetch shows empty week; failed templates look like zero templates; My workouts heading hidden at zero templates (schedule.tsx:147).
- Sheet resize under fitToContents when second sheet swaps in.
- Shared Screen.tsx bottom padding (48+inset vs 40): needs owner call before rows 107, 108, 109, 110.

## Owner device checks (parked)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress, picker fills, week card and row press, calendar chevron, tab bar, second sheet resize. Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped).

## Parked (one line each)
- Gym: session.tsx:364 saves template estimate. Ticklist mode (session.tsx:40, :123) looks dead. Library multi-select; per-set remove; cardio ParameterForm; template editor; GymSessionButton opens session, design opens log sheet. minutesOf (log-session.tsx:62) picks by planned duration, design by cardio.
- Row 76: chevron SF Symbol vs 2.4-stroke path (log-session.tsx:250); possible second add route bundle :1310; session.tsx:565-569 close handler.
- Gym second sheet: en/es/fr keys; caption not footnote; pill 17/24 not 16/21; footer scrolls.
- Row 117: logged stats 3 cells vs 4.
- Failed templates fetch; picker offers only Rest day, could overwrite a workout.
- Stale comments: FloatingHeader.tsx:24-26 (82/86 vs bundle 84/88/18/58), gymSchedule.ts:32-61, gym.tsx:70-73, gym.tsx:155, hooks.ts:159, LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; source-text suites; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Layout: TAB_BAR_CLEARANCE has no non-test callers. Logged pill wash flat; mixHex could fix.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; SettingsList.tsx:129; reduceMotion.ts:13.
- i18n: hardcoded English across Summary, energy, week, workouts, scan, schedule, Profile, session.tsx:539-555, templates, toasts, streak, second sheet.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results. Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- AI insights screen (design bundle :353-354) has no file in src/app/profile/; not compared.

## Jev
R398: ask 39, run 35, stop 26; ranked Profile sync first at 91%. Followed. R396 stop override kept. Keep builds small with explicit checks. Shared-file blocked items not retried as TodayCard tasks.

## Gotchas
Briefs carry false premises: check first. Tab bar is at src/components/navigation/LumeTabBar.tsx. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc rows are file lines; bundle lines are decoded. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. findRelatedTests misses source-reading suites; run by path with find. 'No tests found' is not a test pass. Use mktemp for decode scripts. In zsh, quote "===". Prompts must name loop/design-match and forbid switching, pushing, merging. Always report exit codes.