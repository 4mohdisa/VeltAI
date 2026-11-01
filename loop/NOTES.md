# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Literals only where no token covers the value.
- Design decides product behaviour when it answers the question.
- Never jest -u or edit .snap files without Isa. Use jest --ci.
- Code tidying is never a task. Doc fixes only in re-check rounds.
- Build rounds: tsc plus findRelatedTests with --passWithNoTests. A file with no importing suite is not a failure.
- Checkpoint rounds: full tsc and jest --ci, no file changes.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food chips; keep Goals extras; keep Meal history link; keep Training list until replacement exists; accept LoadFailedNotice; rest day goes to session picker; swipe colour is primary; R338 picker close fix approved.
- Owner-only gaps are parked, not asked about.
- Every prompt restates: work only on loop/design-match; no push, merge, switch or commit.
- Every prompt must name the matching design/ file and the bundle it uses.

## Status
- Re-checked: 107-109, 111, 113-118. Repeat verify on 108 and 109 adds nothing.
- Row 113: items 1, 2, 4-10, 12, 13 built in code. Item 10 (seven day rows) built in code at R354. Item 3 open: title-to-card gap (Screen.tsx:117 vs design, values 12/20 and 24/20 both in notes, confirm first). Item 11 app-only states, Blocked. Item 11 citations out of date (doc fix in re-check round).
- Row 76: item 1 done. Item 2 not built. Item 4 built. Item 8 glyph built.
- Row 115: built except owner gaps; verdict PARTIAL.
- R354 report: failed schedule fetch shows an empty card (useSchedule falls back to []). Seven-rows-always holds only on a successful fetch.
- R355: checkpoint round. Last full run R353: tsc 0; jest --ci 64/65 suites. Only failures: energy and macros in detailChrome.render.test.tsx, waiting on Isa.
- R356: previous prompt rejected for not naming the design/ file. Rewritten to name design/Lume App.html, Gym bundle 7dc211f6 lines 524-540, and to pass the gap from schedule.tsx only.
- Last handover R353. Next checkpoint: due before the next handover.

## Open rows
- 76 PARTIAL: items 2, 3 (second sheet), 5-7.
- 83 DIFFERENT: sheet-in-place; button height and type (Blocked).
- 107 PARTIAL: privacy headers, export share sheet, export failure toast, glyph, chevron, footnote cites.
- 108 PARTIAL: eyebrow copy, feedback toast, label and button styling, geometry (Blocked).
- 109 PARTIAL: wordmark tracking, tagline centring, Version/Build empty case, glyph, padding, geometry.
- 111 PARTIAL: Food FAB add menu; scrim, panel, radius, shadow, row sizes.
- 112 PARTIAL: top padding; GymPatternsCard padding (Blocked).
- 113 PARTIAL: item 3 open (see Status); item 11 Blocked.
- 114 DIFFERENT: session card, tap target, planned grid, logged pill wash, Calories cell (Blocked).
- 115 PARTIAL: owner gaps only.
- 116 PARTIAL: heatmap, 7 items.
- 117 PARTIAL: token drift, 10 items.
- 118 PARTIAL: tab bar, 13 items; items 4-5 need device.
- 85, 87, 103, 104: Blocked.

## Next
1. Row 113 item 3: title-to-card gap. Confirm design value from bundle and Screen.tsx:117, then pass an existing gap token from schedule.tsx without touching Screen.tsx.
2. Row 76 items 3, 5, 6, 7, one per round.
3. Rows 116, 117, 118 items not needing device.
4. Checkpoint (full tsc and jest --ci, no file changes) before the next handover.
5. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Approve jest -u for detailChrome (energy and macros).
- Shared BottomSheet.tsx chrome: grabber, side padding, bottom inset, title alignment and colour, shadow. Shared with onboarding.
- Shared SheetContent, Button, sheet height. Toast duration and position (toastStore.ts:42, :45).
- Second session row (mutations.ts:173-178, deliberate per its comment).
- Logged-day actions: logged card has no press handler, so the toast's 'open it' leads nowhere.
- Screen.tsx:96 gap default and Screen.tsx:117 title-to-card spacing (shared, affects every titled screen). Row 113 item 3 is to be done without editing these.
- SettingsList row geometry: fix or accept. Settles 107-109. Recommended next for Isa.
- Summary: 17, 21, 28, 29, 30. Top padding Gym, Summary, Food. Burn target 10-11; energy week axis 15; header strip Screen.tsx:163. About header keep or remove. Logged pill wash token.
- Row 115 owner gaps: 3D body, guide images, cardio minutes/speed/kcal (API lacks them).
- DetailChart.tsx Kicker, Breakdown dots. LumeTabBar.tsx and + menu chooser on logged days.
- Failed schedule fetch: fall back to seven client-side day rows (needs full day-name table) or show an error state. Product call.
- My workouts heading: design always shows it (bundle :536-537), code hides it at zero templates (schedule.tsx:147). Product call.
- Owner device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, bottom padding, header strip, logged-day sheet and toast, library close paths, exercise progress layout, picker pressed and selected fills, week card spacing and row heights, week row pressed look (0.6).
- Native review of es/fr strings. TestPG_* (18 skipped).

## Parked (grouped)
- Gym schedule: no refetch on focus, so edits elsewhere look stale (TodayCard too: Start workout can show after logging); duplicate Training link; muscle and day names not translated; muscle phrase English-only (api.ts:754); week sub-line fallback; picker title and 'Nothing scheduled' hardcoded English; My workouts uses day_name.slice(0,3) (could use WEEK_DAY_LABELS); stale comment above week day label; sheetRowNameStyle misnamed, rename to workoutNameStyle; row 113 citations moved (doc fix in re-check round); useTemplates falls back to [] so a failed fetch looks like no templates (a Rest-day-only picker could overwrite a scheduled workout on save).
- Gym My workouts cards: press to default 0.85 with no light1 fill (bundle :539). Other Pressable default 0.85 uses unchecked.
- Gym logged day: no day view; no press route. Stale Start workout (gymSchedule.ts:32-61; gym.tsx:70-73); stale logged flag after midnight (hooks.ts:159).
- + menu pushes sheet before check (LumeTabBar.tsx:179), possible flash.
- Exercise library multi-select (design :1271-1289).
- Exercise progress: rowing matches 'row' before 'cardio'; English-only copy; lb counted as kg; sessions older than last 8 not listed; rowing machine gets rowing guide steps.
- Shared CardHeaderRow scope colour (bundle :193, :327).
- i18n: hardcoded English on Summary, energy, week, workouts, scan, schedule, Profile, EnergyBalanceCard, session.tsx:539-555, 'Save progress?' alert, templates.tsx.
- Layout: TAB_BAR_CLEARANCE orphaned; wrong comments (LumeTabBar.tsx:4, _layout.tsx:26, SettingsList.tsx:7-10); Screen.tsx:22, :117; gym.tsx:155 comment false.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129; ProfileAvatarButton.tsx:8; AddMenu.tsx:3; reduceMotion.ts:13.
- Doc: stale citations; doc lines 484, 509, 631, 828, 855, 1421, 1441; rows 85, 104, 112.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem; streak copy; toasts; hardcoded English across Profile screens.
- Gym: button 56 vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; pull-to-refresh misses TodayCard; Summary card logs with no UI (index.tsx:179); streak skeleton (index.tsx:108, :114).
- Row 114 chevron needs a missing day-detail route.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Data: quick-add serving (mock/data.ts:124); editSavedFood local only.
- Tests: no suite covers Privacy, Support, About, CaloriesCard, quick-add, gym.tsx, MyScheduleCard, chooser, log-session, schedule.tsx, exercise-progress, library close. Most suites read source text.
- Tab bar: Reduce Transparency pill fill; GlassSurface may clip shadow. Device needed.

## Jev
R337-R355 kept as decided. R351 run 63% kept. R352 run 98%. R353 run 76%. R354 run 37% vs ask 60%, kept run: design answers item 10. R355 checkpoint run 69% kept. R356 run 74% kept: rejection was a prompt fault, not a blocker.

## Gotchas
Briefs often carry false premises; check first and report them. Use jest --ci, never -u. Don't echo === in zsh. Use LC_ALL=C /usr/bin/grep; quote paths with spaces. Doc row numbers are file lines. Bundle line numbers are decoded-bundle lines. Never open or edit loop/NOTES.md or loop/DECISIONS_LOG.md. Don't mark BUILT if differences remain. A report saying no suite imports a file is not a failure. Screens such as schedule.tsx have no importing suite; findRelatedTests exits 1 without --passWithNoTests. Every prompt must name the design/ file it compares against.