# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Never jest -u or edit .snap files without Isa. Use jest --ci.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- Design decides product behaviour when it answers the question.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras; keep Meal history link; keep Training list until replacement exists; accept LoadFailedNotice; rest day goes to session picker; swipe colour is primary; R338 picker close fix approved.
- Owner-only gaps (dependency, asset, backend) are parked, not asked about.
- Build rounds: one tsc plus jest --ci on importing suites. Checkpoint rounds: full tsc and jest --ci, no file changes.
- Every build prompt names the matching design/ file and the row. A prompt without them is rejected.
- Every prompt must restate: work only on loop/design-match; no push, merge, switch or commit.

## Status
- Re-checked: 107-109, 111, 113-118. Repeat verify on 108 and 109 adds nothing.
- Built in code, not on device: 113 item 1 (R341), 76 item 1 (R338), 115 exercise progress (R343, PARTIAL).
- R344: 115 verified with tsc only. No suite imports exercise-progress.
- R345: checkpoint outcome not confirmed. Last report ran tsc only (exit 0). Full jest --ci at last handover: 64/65 suites, 822/824 tests; only failures are energy and macros in src/__tests__/render/detailChrome.render.test.tsx (snapshot approval waiting on Isa).
- R346: row 113 picker sheet build started; the rejected prompt (missing branch restriction) did not run. Still open.
- Handover: doc-only edits to rows 108 and 109 (committed by the loop). Nothing checked on device.

## Open rows
- 76 PARTIAL: items 2 (glyph, add path), 3 (second sheet), 5-7 (time, celebration dash, cardio minutes). Item 4 parked.
- 83 DIFFERENT: sheet-in-place; button height and type (parked).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast; glyph, chevron geometry; footnote cites.
- 108 PARTIAL: eyebrow copy; feedback has no toast; label and button styling; geometry (Blocked). Items 1-6 plus unnumbered Exact line; item 4 citations done.
- 109 PARTIAL: wordmark tracking; tagline centring; Version/Build can be empty; glyph; padding; geometry. Citations corrected.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: picker sheet (R347 rebuild in progress); spacing above section (Blocked); empty state (item 10).
- 114 DIFFERENT: session card, 14 items; tap target, planned grid; logged pill wash, Calories cell (Blocked).
- 115 PARTIAL: owner gaps only: 3D figure, guide images, kcal in title, cardio minutes/speed/kcal (backend), Fastest stat, sessions beyond 8 not listed, bars not tappable, kg hardcoded, '12 Mar' date format, library muscle names.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device.
- 85, 87, 103, 104, 112, 114: Blocked (below).

## Next
1. R347: row 113 picker sheet (rebuild with full branch restriction).
2. Row 76 items 3, 5, 6, 7, one per round.
3. Rows 116, 117, 118 items not needing device.
4. Checkpoint (full tsc and jest --ci, no file changes) before the next handover.
5. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Approve jest -u for detailChrome (energy and macros).
- DetailChart.tsx Kicker, Breakdown dots. LumeTabBar.tsx + menu chooser on logged days.
- Shared SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45).
- Second row on logged day (mutations.ts:173-178).
- SettingsList row geometry: fix or accept. Settles 107-109. Recommended next for Isa.
- Summary: 17, 21, 28, 29, 30. Top padding Gym, Summary, Food. Burn target 10-11; energy week axis 15; header strip Screen.tsx:163. About header: keep or remove. Logged pill wash token.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close paths, exercise progress layout.
- Native review of es/fr strings. TestPG_* (18 skipped).

## Parked (grouped)
- Gym schedule: no refetch on focus; duplicate Training link; muscle and day names not translated; muscle phrase English-only (api.ts:754).
- Gym logged day: no day view; no press route. Stale Start workout (gymSchedule.ts:32-61; gym.tsx:70-73); stale logged flag after midnight (hooks.ts:159).
- + menu pushes sheet before check (LumeTabBar.tsx:179).
- Exercise library multi-select (design :1271-1289).
- Exercise progress: rowing matches 'row' before 'cardio'; English-only copy; lb sessions counted as kg; sessions older than last 8 not listed; 'Rowing machine' gets rowing guide steps.
- Shared CardHeaderRow scope colour (bundle :193, :327).
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard, session.tsx:539-555, 'Save progress?' alert, templates.tsx.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments (LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10); Screen.tsx:22, :117; gym.tsx:155 (comment is false).
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- Doc: stale citations; doc lines 484, 509, 631, 828, 855, 1421, 1441; rows 85, 104, 112.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy; toasts; hardcoded English across Profile screens.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; Summary card logs with no UI (index.tsx:179); streak skeleton (index.tsx:108, :114).
- Row 114 chevron needs a missing day-detail route.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule.tsx, exercise-progress, library close. Most suites read source text. Privacy, Support, About layout uncovered.
- Tab bar: Reduce Transparency pill fill; GlassSurface may clip shadow. Device needed.
- Settings screen duplicates: none new.

## Jev
R337-R344 kept as decided. R345: ask 48% vs run 47%, kept run. R346: run 53% vs ask 41%, kept run (task needs nothing from Isa). R347: run 81% vs ask 17%, kept run (same row 113 task, restated prompt).

## Gotchas
Briefs often carry false premises; check first and report them. Use jest --ci. Don't echo === in zsh. Use LC_ALL=C /usr/bin/grep; quote paths with spaces. Doc row numbers are file lines. Bundle line numbers are decoded-bundle lines. Repeat verify rounds on 108 and 109 add nothing. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.