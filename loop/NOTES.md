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
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template. Logged calories from logged session only. Solid green pill. Failure = today === null after loading; hook unchanged.
- Log sheet: rest-day check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again = refetch.
- Header counts derived from the table, never earlier figures.
- Defaults: one-tap gym log kept; Distance km kept; food chips skipped; Goals extras kept.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'. Doc factual corrections applied without asking.
- Prompts name the design/ file and gap row, even for doc rounds. Say 'no matching tests' when none apply.
- Claude Code must not open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- Locate rows by content; line numbers shift. Handover text can be stale; notes win.
- Jev is advisory.

## Status
- BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard (padding, title, sub-line, rest, logged state, failed-fetch notice); Macros copy; Burned guard; EnergyBalanceCard strings; i18n setup; Log as planned; log sheet failed-fetch notice; session.tsx 'Add an exercise' label; session.tsx picked-exercise rest seconds (R47); gap lines 229 and 331 corrected (R46); session.tsx citations above line 165 shifted by 1 in gap doc (R49).
- Counts (last recorded): 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Row 90 status empty.
- Checkpoint R48 green: tsc 0, 65 suites, 824 tests. No tests cover TodayCard, failure paths, rest seconds or the label.

## Next (in order)
- Now (R50): planned rows rest. plannedRows in src/app/gym/session.tsx (~193-200) gets te.rest_seconds, matching picked exercises. log-session.tsx:64 already sends it. One-line fix.
1. Gap doc corrections: row 2 'no edit bar' stale (session docks NumberEntryBar); row 7 stale (sheet has no effort/energy fields); log-session cites near gap line 266 stale; 'What the app does' old-form block (restore date only if accurate); gap line 90 empty-status merge into 'Food - My dishes / Saved'; 'Gym - session logging' status cell says BUILT while items are partial; gap lines 328 and 334 stale.
2. Logged-day sheet from + menu: log-session.tsx ~150-158 has no logged-day check. Design addLabel on a logged day is 'Add something extra'; session.tsx empty state says 'Add an exercise'. Decide from design.
3. Wrap hardcoded strings, one file per round: src/app/dashboard/nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
4. food.tsx ~445 empty-list copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
5. summaryNoFabrication.test.ts header: fibre note stale.
6. Trace add.tsx slotKey (~67). Remove unused keys voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd if unused.
7. Checkpoint: full tsc and full app Jest, read-only, only if new code landed since R48.
8. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- Device checks: logged card and both failure states offline. Possible double notice with gym tab (src/app/(tabs)/gym.tsx:107).
- Already-logged days (came back twice, parked): real editing (/gym/session writes a second row, src/lib/data/mutations.ts:173-178) or change 'open it to edit' copy.
- Gap row 90 merge. Whether log-sheet row stays BUILT.
- Footnote '23 sessions 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle row 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (~296): are minutes as note text enough for BUILT?
- Energy literals English? Remaining-calories line removed: acceptable?
- Users without body stats see 1,500 kcal goal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal under session card; chevron before tappable.
- Volume: session.tsx saves top-set weight for all sets. Fix, show only when consistent, or accept?
- Heatmap route wording (R33). Calories cell needs gym_sessions.calories_burned from backend; omitted. Accept?
- Try again hardcoded English with small tap target.

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros shown as 0, custom exercise route, PlannedValuesForm.tsx:200 submit (not compared).
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid 17/24 vs 16/21, Chip 11/14, grid shift after fetch, stale burn, earliest-session rule, date mismatch near midnight, per-session calories (backend), GetToday clears is_rest_day only with template, '0 exercises planned' sub-line.
- Logged card tap target needs day-detail route.
- Macros: history chart; app-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if profile field undefined.
- Accepted limits: summary guard test cannot see spread props; failure paths untested; null-as-failure assumes api.gym.getToday never returns null for a real response.

## Gotchas
- Edit tool: node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- Check premises first: nutrition.tsx is src/app/dashboard/; hook is src/lib/data/gymSchedule.ts; gym tests in src/__tests__.
- Row 113 'My schedule' label is correct.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode with node -e from __bundler/manifest.
- zsh breaks on echo == and unquoted globs. grep -c returning 0 exits 1.
- Doc citations shift when code lines change. Locate by content.

## Round log
- R9-R34: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard logged state, failed-fetch notices, checkpoint R34 green.
- R35: read-only check of log-session failure branch, pass.
- R37-R44: doc rounds, TSC 0. R44: SheetContent comment fixed.
- R45: session.tsx label 'Add an exercise'. R46: gap lines 229 and 331 corrected.
- R47: picked-exercise rest seconds sent from inputFor. gymDurationHonesty.test.ts pass.
- R48: checkpoint green (TSC 0, 65 suites, 824 tests).
- R49: session.tsx citations above line 165 shifted +1 in gap doc. Loop note: report flagged because the type check was not shown as a printed 'TSC EXIT' line. Rule restated.
- R50: planned rows rest seconds (in progress).