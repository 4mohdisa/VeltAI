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
- Checkpoint rounds read-only. Doc-only rounds: tsc only, exit code printed and stated in CHECKED, no Jest. Doc-only round with tsc exit 0 is complete.
- Doc factual corrections with accurate report text are applied without asking.
- Prompts name the design/ file and gap row, even for doc rounds.
- Claude Code must not open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- Jev is advisory.

## Status
BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard (padding, title, sub-line, rest, logged state, failed-fetch notice); Macros copy; Burned guard; EnergyBalanceCard strings; i18n setup; Log as planned; log sheet failed-fetch notice.
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Row 90 status empty.
Last checkpoint R34 green (tsc 0, 65 suites, 824 tests), predates failed-fetch code. No tests cover TodayCard or failure paths.
Doc rounds R37-R43 done. R43 corrected 'What the app does' (old form intro) and the 'Today / check-in' session_id claim.

## Next (in order)
1. Code round R44 (in progress): stale comment src/components/navigation/SheetContent.tsx:156 ('log-session Notes'). Targeted test only if one imports the file.
2. Rest seconds: picker collects them, /gym/session never saves them (src/app/gym/session.tsx:159-166). Check premise; park, or fix if it is a plain save.
3. Copy: session.tsx:539 says 'Add exercise'; design addLabel says 'Add an exercise'. Fix if it is a plain string.
4. Doc follow-up: 'What the app does' old-form block no longer gives a recording date after R43. Restore only if the date is accurate and factual.
5. Add sheet icons from design SVGs.
6. Logged-day sheet from + menu: decide from design. log-session.tsx ~:150-158 has no logged-day check.
7. Wrap hardcoded strings, one file per round: src/app/dashboard/nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
8. Gap line 90 (empty status): merge into 'Food - My dishes / Saved' (no row is titled 'Saved foods').
9. food.tsx ~445 empty-list copy. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
10. summaryNoFabrication.test.ts header: fibre note stale.
11. Trace add.tsx slotKey (~67); remove unused keys voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd if unused.
12. Read-only check of log-session.tsx failure branch (~:139).
13. Checkpoint: full tsc and full app Jest, read-only.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- Device checks: logged card and both failure states offline. Double notice with gym tab (src/app/(tabs)/gym.tsx:107).
- Row 90 merge into 'Food - My dishes / Saved' (only if Isa answers).
- Footnote '23 sessions 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle row 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (~296): is minutes as note text enough for BUILT?
- Energy literals English? Remaining-calories line removed: acceptable?
- Users without body stats see 1,500 kcal goal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal under session card; chevron before tappable.
- Volume: session.tsx saves top-set weight for all sets. Fix, show only when consistent, or accept?
- Heatmap route wording (R33).
- Calories cell needs gym_sessions.calories_burned from backend; omitted. Accept?
- Already-logged days: real editing (/gym/session writes a second row, src/lib/data/mutations.ts:173-178) or change gymLog.alreadyLogged copy ('open it to edit')?
- Gap row status cell for 'Gym — session logging (log sheet)' still says BUILT while its text records a partial item. Keep status or change?

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros shown as 0, custom exercise route (customLabel).
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid 17/24 vs 16/21, Chip 11/14, grid shift after fetch, stale burn, earliest-session rule, date mismatch near midnight, per-session calories (backend), small 'Try again' target, GetToday clears is_rest_day only with template, '0 exercises planned' sub-line.
- Logged card tap target needs a day-detail route.
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
- Check premises first: nutrition.tsx is src/app/dashboard/; hook is src/lib/data/gymSchedule.ts; gym tests in src/__tests__. Briefs have named wrong paths.
- Row 113 'My schedule' label is correct.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode with node -e from __bundler/manifest.
- zsh breaks on echo ==.
- Every prompt names the design/ file and gap row, says 'work only on loop/design-match', and says 'no matching tests' when none apply.
- Locate rows by content; line numbers shift.
- Handover text can be stale against notes; notes win.
- tsc line: print it as 'TSC EXIT <n>' via echo, and copy that literal line into CHECKED.

## Round log
- R9-R34: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard logged state, failed-fetch notices, checkpoint R34 green.
- R35: read-only check of log-session.tsx failure branch: pass.
- R37-R41: doc rounds, tsc 0 each.
- R41 flagged by loop (tsc not clearly shown). R42 re-ran tsc with exit code printed and fixed 'Difference 16' wording; report flagged again for the same tsc display issue.
- R43: doc correction (What the app does, session_id claim), tsc exit 0. Loop flagged the report for tsc display again.
- R44: loop note said the R43 report was flagged for tsc not run or not clearly shown. Jev ranked the stale-comment task first at 81%; chosen as Next item 1, which is consistent with notes order. Prompt requires the literal 'TSC EXIT <n>' line.