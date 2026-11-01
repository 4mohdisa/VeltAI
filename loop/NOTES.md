# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Design decides product behaviour when it answers the question.
- Never jest -u or edit .snap files without Isa. Use jest --ci.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests --passWithNoTests. No importing suite is not a failure.
- Checkpoint rounds: full tsc and jest --ci, no file changes.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras; keep Meal history link; keep Training list until replacement exists; accept LoadFailedNotice; rest day goes to session picker (accepted deviation); My workouts on schedule screen; swipe colour primary; R338 picker close fix approved.
- Owner-only gaps are parked, not asked about.
- Every prompt: work only on loop/design-match; no push, merge, switch or commit; name the design/ file and bundle.
- Blocked questions are not re-asked. Ask only when every remaining task needs Isa.

## Status
- Re-checked: 107-109, 111, 113-118.
- Row 113: items 1, 2, 4-10, 12, 13 built in code. Items 3 and 11 blocked.
- Row 76: items 1, 4, 8 built. Item 2 not built.
- Row 115: built except owner gaps.
- R355 checkpoint: tsc 0; jest --ci 64/65 suites; only failure is detailChrome energy and macros (blocked).
- Next checkpoint due before the next handover.

## Open rows
- 76 PARTIAL: items 2, 3, 5-7.
- 83 DIFFERENT: sheet-in-place, button height and type (blocked).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast, glyph, chevron, footnote cites.
- 108 PARTIAL: eyebrow copy, feedback toast, label and button styling, geometry (blocked).
- 109 PARTIAL: wordmark tracking, tagline centring, Version/Build empty case, glyph, padding, geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes.
- 112 PARTIAL: top padding; GymPatternsCard padding (blocked).
- 113 PARTIAL: item 3 (blocked, asked R357, no answer), item 11 (blocked).
- 114 DIFFERENT: session card, tap target, planned grid, logged pill wash, Calories cell (blocked).
- 115 PARTIAL: owner gaps only.
- 116 PARTIAL: heatmap, 7 items. Building now (items not needing device).
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device.
- 85, 87, 103, 104: blocked.

## Next
1. Row 116: heatmap items not needing device (in progress this round).
2. Row 117: token drift, one item per round.
3. Row 118: tab bar items not needing device, one per round.
4. Row 76 item 3 (second sheet), after confirming design lines.
5. Row 113 item 3: only if Isa answers the Screen.tsx question. Do not ask again.
6. Checkpoint (full tsc and jest --ci, no file changes) before the next handover.
7. No rows left that differ: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry or re-ask)
- Row 113 item 3: remove the 4px at Screen.tsx:117 (affects every titled floating screen) or accept on schedule.tsx. Asked R357, no answer. Do not work around it with a schedule.tsx-only change.
- Approve jest -u for detailChrome (energy and macros).
- Shared BottomSheet chrome (grabber, padding, inset, title, shadow); shared with onboarding.
- Shared SheetContent, Button, sheet height; toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178, deliberate).
- Logged-day actions: logged card has no press handler.
- Screen.tsx:96 gap default.
- SettingsList row geometry: fix or accept (settles 107-109). Recommended.
- Summary: 17, 21, 28, 29, 30. Top padding on Gym, Summary, Food. Burn target 10-11; energy week axis 15; header strip Screen.tsx:163; About header; logged pill wash token.
- Row 115 owner gaps: 3D body, guide images, cardio minutes, speed, kcal.
- DetailChart.tsx Kicker and Breakdown dots. LumeTabBar.tsx and + menu chooser on logged days.
- Failed schedule fetch: seven client-side rows or error state. Failed templates fetch looks like no templates (Rest-day-only picker could overwrite a scheduled workout).
- My workouts heading: design always shows it (bundle 536-537); code hides it at zero templates (schedule.tsx:147).
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close, exercise progress layout, picker fills, week card spacing, week row pressed look.
- Native review of es/fr strings. TestPG_* (18 skipped).

## Parked (one line each, grouped)
- Gym: schedule and TodayCard don't refetch on focus; duplicate Training link; muscle and day names not translated; muscle phrase English-only; picker title hardcoded; My workouts uses day_name.slice; stale comments; sheetRowNameStyle rename; My workouts press 0.85 without fill; logged day has no view; stale Start workout (gymSchedule.ts:32-61; gym.tsx:70-73); stale logged flag after midnight (hooks.ts:159); + menu flash (LumeTabBar.tsx:179); library multi-select; exercise progress rowing match, English copy, lb as kg, older sessions; CardHeaderRow scope colour (bundle 193, 327); MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; Summary card logs with no UI (index.tsx:179); streak skeleton (index.tsx:108, 114); row 114 chevron needs day-detail route.
- Layout and comments: TAB_BAR_CLEARANCE orphaned; wrong comments (LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10, Screen.tsx:22, gym.tsx:155).
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard, session.tsx:539-555, the 'Save progress?' alert, templates.tsx, toasts, streak copy, foodLog.per100, CaloriesCard g, food.rowAnalysing, food.deleteItem.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving (mock/data.ts:124); editSavedFood is local only.
- Tests: most suites read source text; no suite covers Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule.tsx, exercise-progress, library close.
- Tab bar: Reduce Transparency pill fill; GlassSurface may clip shadow (device needed).
- Doc: stale citations across the gap doc; rows 85, 104, 112; row 113 citations moved.

## Jev
R337-R356 kept as decided. R357: Jev ask 67%, chose ask. Claude Code's finding confirms a shared file is needed. Latest: Jev ask 74%, chose run on row 116 because it needs no Isa answer (loop note allows ask only when every task needs Isa).

## Gotchas
Briefs often carry false premises; check first and report. Use jest --ci, never -u. Don't echo === in zsh. Use LC_ALL=C /usr/bin/grep; quote paths with spaces. Doc row numbers are file lines. Bundle line numbers are decoded-bundle lines. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. findRelatedTests exits 1 without --passWithNoTests. Handover suggestions may collide with pending Isa questions; check the Blocked list first.