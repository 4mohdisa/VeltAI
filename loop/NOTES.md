# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap analysis are authoritative. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Celebration card approved. Already-logged routes to /gym/session. Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Empty profile derives 1,500 kcal floor, never 0.
- Snack slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Hardcoded strings not in design stay English and are recorded.
- Streak strip links to /gym/streak (accepted). Training, freeze, session history: app-only, English.
- Saved foods title 'My dishes'. Card: padded={false} plus style padding; Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template. Logged calories from logged session only. Solid green pill kept until wash token decided. Failure = today === null after loading; hook unchanged.
- Log sheet rest-day check keeps planned.length === 0 (src/app/gym/log-session.tsx:150). Prevents an empty template committing an empty session.
- Log sheet failure: LoadFailedNotice, Try again = refetch. Not a rest day.
- Header counts derived from the table, never earlier figures.
- Defaults: one-tap gym log kept; Distance km kept; food chips skipped; Goals extras kept.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc. Doc-only rounds: tsc only, no Jest.
- A row flagged partial for an un-updated gap-doc line gets a doc round before new build.
- loop/NOTES.md and loop/DECISIONS_LOG.md: Claude Code must not open or edit.
- Jev is advisory.
- Report flagged for no tsc or no tests = partial; fix before next build round.
- Doc factual corrections with accurate report text are applied without asking.

## Status
BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard padding, title, sub-line, rest, logged state, failed-fetch notice; Macros copy; Burned guard; EnergyBalanceCard strings; i18n setup; Log as planned; log sheet failed-fetch notice.
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Row 90 status line still empty.
Last checkpoint R34: tsc 0, 65 suites, 824 tests pass. Predates failed-fetch code; no test covers TodayCard or failure paths.
R35 read-only check: log-session.tsx failure branch correct (:139-144, before rest-day check). Brief's condition wording was wrong for this sheet; sheet also has planned.length === 0. Code unchanged.

## Next
1. DOC ROUND (R36): fix stale log-session.tsx cites in gap row 'Gym — session logging (log sheet)' (was :173, :146, :111, :103-104). Current anchors: failure branch ~:139, rest-day ~:150, save guard ~:110, empty-planned completion ~:117-120. tsc only.
2. Add sheet icons from design SVGs.
3. Logged-day sheet from + menu: design hides it once logged. Decide from design. Note: log-session.tsx:150-158 shows rest-day state for a logged rest day; no logged-day check runs before that return.
4. Wrap hardcoded strings, one file per round: src/app/dashboard/nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today'.
5. Empty-list copy food.tsx ~445. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
6. summaryNoFabrication.test.ts header comment: fibre note stale.
7. Trace add.tsx slotKey (~67); remove unused keys voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd if unused.
8. Checkpoint: full tsc and full app Jest after build rounds, read-only.
9. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- Device checks: logged card and both failure states with network off. Double notice with gym tab (src/app/(tabs)/gym.tsx:107) acceptable?
- Row 90 empty-status merge into 'Food — My dishes / Saved' (do only if Isa answers; not done, handover NEXT overridden by this rule); footnote '23 sessions 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle row ~300 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (~296): minutes as note text enough for BUILT?
- Energy literals stay English? Remaining-calories line removed: acceptable?
- Users with no body stats see '1,500 kcal' goal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal vs session; chevron before tappable.
- Volume: session.tsx saves top-set weight for all sets. Fix, show only when consistent, or accept?
- Heatmap route wording applied in R33; Isa may override.
- Calories cell needs gym_sessions.calories_burned from backend; omitted. Accept?

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid 17/24 vs 16/21, Chip 11/14, grid shift after fetch, stale burn, two sessions shows earliest, date mismatch near midnight. Per-session calories (backend). 'Try again' hardcoded English with small tap target. Server GetToday clears is_rest_day only with a template. Empty template: card sub-line reads '0 exercises planned' (TodayCard.tsx ~203, ~225-227) while sheet shows rest state.
- Logged card tap target needs a day-detail route.
- Macros: history chart; app-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56 (noisy in Jest); i18next console.info banner.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Stale 'Only some of it' (gap ~191). Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if profile field undefined.
- Accepted limits: summary guard test cannot see spread props; failure paths have no tests (type-check only). Null-as-failure assumes api.gym.getToday never returns null for a real response (not yet read).

## Gotchas
- Edit tool: node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- Check premises first: nutrition.tsx is src/app/dashboard/; Burned is on EnergyBalanceCard; hook is src/lib/data/gymSchedule.ts; gym tests in src/__tests__. Briefs have named wrong paths before, and wrong condition wording (R35).
- Row 113 is 'My schedule'; its label is correct.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode with node -e from the __bundler/manifest script.
- zsh breaks on echo ==.
- Every prompt names the design/ file and gap row, says 'work only on loop/design-match', and says 'no matching tests' when none apply.
- Line numbers shift; locate rows by content.

## Round log
- R9-R22: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard logged state, grid, chips.
- R23-R26: gap-doc prose; checkpoint R24 green; R26 parked.
- R27-R30: failed-fetch notices on log sheet and TodayCard. No failure-path tests.
- R31-R33: gap-doc rounds (session card, stale cite, heatmap routes). R33 Jest not run.
- R34: checkpoint green (tsc 0, 65 suites, 824 tests). Clears R33 flag.
- Handover after R33: loop/HANDOVER.md.
- R35: read-only check of log-session.tsx failure branch. Pass on failure path; wording FAIL on the rest-day clause, resolved by keeping the clause (decision above).
- R36: doc round, stale log-session.tsx cites (in progress).