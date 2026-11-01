# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value. Design decides product behaviour.
- Never jest -u or edit .snap files without Isa. Use jest --ci.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests --passWithNoTests. Checkpoint rounds: full tsc and jest --ci, no file changes.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras; keep Meal history link; keep Training list until replacement exists; accept LoadFailedNotice; rest day goes to session picker (accepted deviation); My workouts on schedule screen; swipe colour primary; R338 picker close fix approved.
- Owner-only gaps are parked, not asked about.
- Blocked questions are not re-asked. Ask only when every remaining task needs Isa.
- Files on the Blocked list are not edited until Isa approves.
- Handover suggestions are checked against Blocked. Workarounds for blocked items are not taken.
- A report flagged for missing tsc or tests is cleared by running them in the next build round, not by re-running the doc-only round.

## Status
- Re-checked: 107-109, 111, 113-118.
- Row 113: built 1, 2, 4-9, 12, 13. Open: 3 (blocked), 10, 11 (blocked).
- Row 76: built 1, 4, 8. Open: 2, 3, 5-7.
- Row 115: built except owner gaps.
- Row 116: exhausted for loop work. Item 7 needs a device.
- Row 117: item 1 blocked. Item 2 re-checked (R363): schedule.tsx is EXACT. TodayCard.tsx has nine real differences (dot 12 to 11, header gap 12 to 10, header min height 36 to 34, title gap 4 to 1, pill vertical 4 to 3, pill side 8 to 9, chip side 12 to 10, chip row gap 8 to 6, stat cell gap 0 to 1). Build pending (R364). Item 3 open: TodayCard stat value is bodyBold 17/24, design is 600 16/21 rounded. Item 4 open.
- Row 118: PARTIAL. R360 edited LumeTabBar.tsx (items 1-3, 6-11, marked BUILT in code) although the file is on the Blocked list. tsc green. tabNavigation.test.ts not yet run. Items 4-5 need a device. Edit still awaiting Isa's keep or revert decision.
- Last round's eyebrow edit may still be uncommitted.

## Open rows
- 76 PARTIAL. 83, 85, 87, 103, 104, 108, 112, 114: blocked.
- 107, 109, 111, 115, 116, 117, 118: PARTIAL (details in gap doc).

## Next
1. R364: row 117 item 2 build, TodayCard.tsx only (nine values as named constants). Runs tsc and findRelatedTests TodayCard.tsx --passWithNoTests. This also clears the flagged R363 report.
2. Row 76 item 3 (second sheet), after confirming design lines.
3. Checkpoint before next handover: full tsc and jest --ci, no file changes.
4. Row 118 check (tsc; jest --ci tabNavigation.test.ts; findRelatedTests LumeTabBar.tsx --passWithNoTests). No file changes. Only after Isa answers the LumeTabBar.tsx question.
5. When no non-blocked task remains, stop with 'only owner decisions remain'. Do not re-ask blocked questions. If a single combined question is still needed, ask once covering row 116 items 1, 2, 8, row 117 item 1 and the row 118 LumeTabBar.tsx edit.

## Blocked on Isa (do not retry or re-ask)
- Row 116: items 1-2 open cells to day view (recommended build; item 2 follows 1); 3 keep frozen fill (recommended); 4 logged day level 2 or 3 (recommended match design); 5 keep '1 session' (recommended); 6 keep loading and failed strings (recommended); 8 nav button size (recommended fix).
- Row 117 item 1: templates.tsx:50 to 16 (radius 28 vs 20); session.tsx:407 and muscles.tsx:73 need layout changes; keep 20 on the seven no-counterpart cards?
- Row 113 item 3: remove 4px at Screen.tsx:117, or accept on schedule.tsx. Asked R357, no answer.
- Row 118: keep or revert the R360 LumeTabBar.tsx edit. Asked R361, no answer. Do not re-ask. Do not edit LumeTabBar.tsx further.
- Approve jest -u for detailChrome (energy and macros).
- Shared BottomSheet chrome (shared with onboarding). Shared SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178, deliberate).
- Logged-day actions: logged card has no press handler. + menu chooser on logged days.
- Screen.tsx:96 gap default.
- SettingsList row geometry: fix or accept (recommended fix).
- Summary: 17, 21, 28, 29, 30. Top padding on Gym, Summary, Food. Burn target 10-11. Energy week axis 15. Header strip Screen.tsx:163. About header. Logged pill wash token.
- DetailChart.tsx Kicker and Breakdown dots.
- Failed schedule fetch shows empty week card; failed templates fetch looks like no templates (overwrite risk).
- My workouts heading: design always shows it; code hides it at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress layout, picker fills, week card spacing, week row pressed look, calendar chevron stroke, tab bar fill and glyphs on glass.
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal.
- Native review of es/fr strings. TestPG_* (18 skipped).

## Parked (one line each)
- Gym: schedule and TodayCard don't refetch on focus; duplicate Training link; muscle and day names not translated; picker title hardcoded; My workouts uses day_name.slice; stale comments; sheetRowNameStyle rename; My workouts press 0.85 without fill; stale Start workout (gymSchedule.ts:32-61, gym.tsx:70-73); stale logged flag after midnight (hooks.ts:159); + menu flash (LumeTabBar.tsx:179); library multi-select; exercise progress rowing match, English copy, lb as kg; CardHeaderRow scope colour (bundle 193, 327); MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; Summary card logs with no UI (index.tsx:179); streak skeleton (index.tsx:108, 114); row 114 chevron needs day-detail route.
- Row 117 item 3: TodayCard stat value bodyBold 17/24 vs design 600 16/21 rounded (TodayCard.tsx:103, bundle :86). Not in item 2.
- Gym calendar: gymCalendar.render.test.tsx checks NAV_SIZE 32 while buttons lay out at 44.
- Layout: TAB_BAR_CLEARANCE has no callers, so last rows may be partly hidden on devices with no inset (bar raised 14 in R360). Wrong comments: LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155.
- Tab bar: no test pins row 118 design values. Shadow radius convention (CSS blur as shadowRadius) may render softer on iOS across all shadow tokens.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard, session.tsx:539-555, the 'Save progress?' alert, templates.tsx, toasts, streak copy, foodLog.per100, CaloriesCard g, food.rowAnalysing, food.deleteItem.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving (mock/data.ts:124); editSavedFood is local only.
- Tests: most suites read source text; no suite covers Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule.tsx, exercise-progress, library close.
- Doc: stale citations across the gap doc after row 113 and 115 edits; rows 85, 104, 112. Row 113 and row 117 item 4 schedule.tsx line numbers out of date (e.g. item 3 cites :81, now :80).

## Jev
R337-R359 kept as decided. R360: Jev ranked row 118 first (80%); chose it. R361: Jev ask 78%, run 16%; chose ask. Isa did not answer, so the question is now on Blocked. R362: Jev ask 98%, run 1%. Overrode: row 117 item 2 doc-only re-check. R363: Jev run 95%, stop 3%, ask 2%. Ran with the TodayCard build, which runs the tests the flag asked for.

## Gotchas
Briefs often carry false premises (wrong bundle, screen or line numbers); check first and report. Use jest --ci, never -u. Use LC_ALL=C /usr/bin/grep. Quote paths with spaces. Doc row numbers are file lines; bundle line numbers are decoded-bundle lines. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. findRelatedTests needs --passWithNoTests. Nothing has been checked on a device. tabNavigation.test.ts reads source as text, so it needs its own jest run. Don't echo === in zsh. Last round's eyebrow edit may still be uncommitted.