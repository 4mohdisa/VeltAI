# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap analysis are authoritative. Accepted deviations are recorded in the gap doc.
- Cardio: Distance km. No food search chips. Goals as built. Celebration card approved. Already-logged routes to /gym/session. Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Unset calorie goal: no code change; empty profile derives 1,500 kcal floor (deriveTargets.ts:73), never 0.
- Snack slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Hardcoded strings not in design stay English and are recorded.
- Streak strip links one row to /gym/streak (accepted). Training, freeze, session history: app-only, English.
- Saved foods title 'My dishes'. Card: padded={false} plus style padding; Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest-day = is_rest_day || !template.
- Header counts derived from the table, never from earlier figures.
- Defaults: keep one-tap gym log; keep Distance km; skip food chips; keep Goals extras.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc. Snapshots re-recorded only after a full diff read.
- The loop script writes loop/NOTES.md and loop/DECISIONS_LOG.md. Claude Code must not open or edit them.
- Jev is advisory. Where Jev is strongly sure of another action or task, follow it unless a concrete reason is written here.
- A report flagged for no tsc or no tests is partial. Fix it before the next build round.
- TodayCard logged state: solid green pill kept until Isa decides on a wash token. Calories cell in the stats grid uses the logged session only, never the whole-day figure.

## Status
BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy, TodayCard padding/title/sub-line/rest, TodayCard logged state (green pill, 'Logged' via gym.logged, kcal sub-line via gym.loggedTodayBurned, chevron; R20, no tap target, no chips, no 4-up grid), Macros copy, Burned guard (EnergyBalanceCard), EnergyBalanceCard six strings, i18n setup, Log as planned minutes in notes (row 296).
R21 verification: logged state stays BUILT, not verified. Design mismatches: pill colour (solid vs 22% wash), kcal source (whole day vs session), chevron (SF Symbol vs SVG, shown on non-tappable card), 4-up grid absent.
DIFFERENT: row 113 TodayCard fetch failure; Summary Macros detail (no chart, line 103); gym today's session card (all four states, still DIFFERENT).
Header counts (line 71): 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Table has 43 rows; line 90 is empty-status.
Last full run R312 green (65 suites, 824 tests). Full Jest owed at checkpoint.

## Next
1. R22 (this round): TodayCard logged-state stats grid and chips. First confirm listSessions returns exercises and duration. Calories cell uses logged session data only. tsc once, match tests only, gap prose line only.
2. Checkpoint still owed: full tsc and full app Jest, read-only. Run when the loop script schedules it.
3. TodayCard logged state, remaining items: tap target (waits for day-detail route), chevron until tap target lands, pill wash token (Isa).
4. Logged-day sheet: design hides it once logged; app shows it from + menu. Decide from design/Lume App.html. Pill still shows there.
5. Gap doc round, tsc once: merge line 90 empty-status row into the Saved foods row above.
6. Gap doc wording, one round each, tsc once: lines ~76 (cardio handling missing), ~281 (heading conflicts with reachable rows), ~296-298, rows 89 and 113, the gym today's session card prose (still says no chevron, no green wash, no calories on logged sub-line), EnergyBalanceCard line (overstates; eight literals remain English), audit row ~1460 and ~1471 (stale wording).
7. summaryNoFabrication.test.ts header comment (says fibre not built). Update when the burn string is wrapped.
8. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd keys.
9. Wrap hardcoded strings, one file per round: nutrition.tsx ('Percent of target', 'Breakdown', 'No meals logged yet today.', '% of target', 'of ... g'), gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard literals too: 'Planned', 'Rest', 'Start workout', planned sub-line. Then EnergyBalanceCard literals once Isa confirms.
10. Failed today fetch shows as rest day (log-session.tsx:89): fix or park.
11. Add sheet icons from design SVGs. Empty-list copy food.tsx ~445.
12. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes. Compare Energy, Week, Training detail views with design.
13. Full tsc and Jest at next checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Row 90 empty-status row. Proposed fix: merge into Saved foods row above (see Next 5).
- Footnote '23 sessions · 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Device runs; native es/fr review; 'My dishes'; Macros wording.
- Freestyle row ~300 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (line 296): minutes as note text enough for BUILT?
- Energy literals stay English? Remaining-calories line removed: acceptable?
- Should users with no body stats see 'your 1,500 kcal calorie goal'? Design uses a 2,100 fallback.
- TodayCard logged: pill is solid green, design uses 22% green wash (needs a token). Keep solid or add token? Kept solid meanwhile.
- TodayCard logged: kcal figure is the whole day's exercise burn, not this session. Accept, or park for a backend per-session figure?
- TodayCard logged: chevron shows before the card is tappable. Accept until tap target lands?
- TodayCard logged: device check with a logged session and with no recorded burn.

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, 'Logged today' fallback with no burn (hardcoded English), stale burn figure (energy fetched on mount only), tap target to day detail (needs route).
- Macros: history chart; app-only gauge and meals list.
- Log sheet failed fetch shows rest day; server GetToday clears is_rest_day only with a template.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info noise.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Stale check: 'Only some of it' (gap ~191).
- Untraced: other goals.calories screens may show the 1,500 floor; Math.max NaN if a profile field is undefined.
- Accepted limit: summary guard test cannot see spread props.

## Gotchas
- Edit tool: use node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- Reports can be stale. Locate gap lines by content. Check premises: nutrition.tsx is src/app/dashboard/; Burned is on EnergyBalanceCard; the 'It went as planned' pill is not the logged-day control; the day-detail tap target has no route.
- Gym tests are in src/__tests__, not src/components/gym.
- Every prompt names the design/ file and gap row and says 'work only on loop/design-match'.
- DONE without the design file read or gap row edited is partial. CHECKED without tsc and Jest is partial. CHECKED with no matching tests must say so.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode in memory only.

## Round log
- R9-R17: EnergyBalanceCard, i18n, Macros row, header counts flagged, Macros copy, Burned guard, unset-goal check (no code change).
- R11, R12 rejected (no design file; no branch rule). Handover at R17.
- R18: prompt rejected (no design/ file named). Reissued. Built: header counts corrected (24 DIFFERENT, 14 PARTIAL, 4 BUILT). tsc exit 0. Jest not run.
- R19: checkpoint requested, read-only. Prompt rejected before it ran. Checkpoint still owed.
- R20: Jev ranked TodayCard logged state first (84%). Built logged state (not verified). Report flagged: tests not run, design read not stated. Gap row kept DIFFERENT.
- R21: verification. tsc exit 0, no test matched TodayCard, log-session tests passed (4 suites, 29 tests). Two design mismatches found (pill colour, kcal source) plus chevron and missing grid. Stays BUILT not verified. Jev run 93%, followed.
- R22: stats grid and chips for logged state. Jev run 52%, ask 46%; followed run. Chose grid over chevron removal.