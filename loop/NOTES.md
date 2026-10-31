# Lume Loop Notes

## Goal
Match design/Lume App.html through DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap analysis are authoritative. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Celebration card approved. Already-logged routes to /gym/session. Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Unset calorie goal: no code change; empty profile derives 1,500 kcal floor, never 0.
- Snack slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Hardcoded strings not in design stay English and are recorded.
- Streak strip links to /gym/streak (accepted). Training, freeze, session history: app-only, English.
- Saved foods title 'My dishes'. Card: padded={false} plus style padding; Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template.
- TodayCard logged: calories from logged session only, never whole-day figure. Solid green pill kept until Isa decides on wash token.
- TodayCard path: src/components/gym/TodayCard.tsx. Failure = today === null after loading. Hook unchanged.
- Log sheet failed fetch: LoadFailedNotice with Try again (onRetry = refetch). Not a rest day.
- Header counts derived from the table, never earlier figures.
- Defaults: one-tap gym log kept; Distance km kept; food chips skipped; Goals extras kept.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc. Snapshots re-recorded only after full diff read.
- Doc-only rounds: tsc only, no Jest. A row flagged partial for an un-updated gap-doc line gets a doc round before new build.
- loop/NOTES.md and loop/DECISIONS_LOG.md are loop-script files. Claude Code must not open or edit them.
- Jev is advisory.
- A report flagged for no tsc or no tests is partial; fix before next build round.
- Doc factual corrections (route wording, stale cites) with accurate text from a report are applied without asking. (R33)
- R34 is a checkpoint: full tsc and full app Jest, read-only. Clears the flag on R33 (Jest not run).

## Status
BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard padding, title, sub-line, rest, logged state, failed-fetch notice; Macros copy; Burned guard; EnergyBalanceCard six strings; i18n setup; Log as planned; log sheet failed-fetch notice.
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. One gap-doc row line still empty (row 90 area, see Blocked).

## Next
1. Checkpoint (R34, this round): full tsc and full app Jest, read-only. Report failures; do not fix.
2. Read-only check: does the failed today fetch in src/app/gym/log-session.tsx (failure branch, about line 139; locate by content) still treat the user as a rest day? Handover says the failure now shows LoadFailedNotice, not a rest day. Close the check on evidence; fix in its own round only if it fails.
3. Row 90 empty-status merge: parked on Blocked on Isa. Do it only if Isa answers.
4. Add sheet icons from design SVGs.
5. Logged-day sheet: design hides it once logged; app shows it from + menu. Decide from design.
6. Wrap hardcoded strings one file per round: nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today'.
7. Empty-list copy food.tsx ~445. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
8. summaryNoFabrication.test.ts header comment (fibre note stale).
9. Trace add.tsx slotKey (~67); remove unused keys voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd if unused.
10. Full tsc and Jest at checkpoint (repeat after build rounds).
11. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- R28/R30 device checks: log sheet and TodayCard notices with network off. Double notice with gym tab (src/app/(tabs)/gym.tsx:107) acceptable?
- Row 90 empty-status; footnote '23 sessions 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle row ~300 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (~296): minutes as note text enough for BUILT?
- Energy literals stay English? Remaining-calories line removed: acceptable?
- Users with no body stats see 'your 1,500 kcal calorie goal'? Design uses 2,100 fallback.
- TodayCard logged: solid vs wash pill; whole-day kcal vs session; chevron before tappable; device check with logged session and no burn.
- Volume: session.tsx saves top-set reps and weight for every set. Fix, show only when consistent, or accept?
- Heatmap route wording (lines 116, 457): applied in R33 without asking; Isa may override.
- Device check of logged card and both failure states (R27-R30, handover).
- Wash pill token for logged card.
- Calories cell: needs gym_sessions.calories_burned from backend; omitted for now. Accept?

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid 17/24 vs 16/21, Chip 11/14, grid shift after fetch, stale burn, two sessions shows earliest, date mismatch near midnight. Per-session calories on gym_sessions (backend). 'Try again' hardcoded English with small tap target; server GetToday clears is_rest_day only with a template.
- Log-session cites stale: gap doc lines just below 266 (:173, :146, :111, :103-104). Doc round needed.
- Tap target on logged card needs a day-detail route; chevron sits on a non-tappable card.
- Macros: history chart; app-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Stale: 'Only some of it' (gap ~191). Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if profile field undefined.
- Volume overstatement in src/app/gym/session.tsx (saves all sets at top weight). Listed under Blocked; fix only if Isa says so.
- Logged-day sheet from + menu: see Next item 5.
- Accepted limit: summary guard test cannot see spread props. Failure paths have no tests (type-check only).

## Gotchas
- Edit tool: use node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- Check premises first: nutrition.tsx is src/app/dashboard/; Burned is on EnergyBalanceCard; 'It went as planned' pill is not the logged-day control; hook is src/lib/data/gymSchedule.ts; gym tests are in src/__tests__. Briefs have named wrong paths and rows before; check first.
- Row 113 is 'My schedule'; its label is correct.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode in memory with node -e from the __bundler/manifest script.
- zsh breaks on echo ==.
- Every prompt names the design/ file and gap row and says 'work only on loop/design-match'. Say 'no matching tests' when none apply.
- Line numbers shift; locate rows by content.

## Round log
- R9-R22: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard logged state, grid and chips.
- R23-R26: gap-doc prose; checkpoint R24 green (tsc 0, 65 suites, 824 tests); R26 parked.
- R27-R30: failed-fetch notices on log sheet and TodayCard (LoadFailedNotice, Try again = refetch). No failure-path tests.
- R31: gap-doc round for today's session card row. tsc 0.
- R32: doc round for stale TodayCard cite. Heatmap wording flagged; report not applied.
- R33: doc round applying route wording to heatmap rows (lines 116 and 457). tsc 0; Jest not run. Report flagged by loop check.
- Handover after R33: summary in loop/HANDOVER.md. Last full suite 65 suites, 824 tests, predates failed-fetch code.
- R34: checkpoint, read-only: full tsc and full app Jest. Result to be recorded next round.