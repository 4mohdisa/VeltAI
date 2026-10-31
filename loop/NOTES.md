# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wins copy and layout disputes unless Isa overrides. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Summary card never calls logGymSession() without args.
- Macros stored unrounded. Food detail macros shown to 1 decimal place. Food day card, Summary card, Macros detail and totals stay whole numbers, as the design shows (R60).
- Empty profile floors at 1,500 kcal.
- Slot 'Snacks'. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template. Failure = today === null after loading.
- Log sheet: rest check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again refetches.
- Header counts are derived from the table.
- Difference numbers kept; 15 and 21 removed because other text cites them.
- Citations: an insertion at line N moves only citations at or after N. Check by content.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'.
- Prompts name the design/ file and gap row; say 'no matching tests' when none apply; state the branch rule.
- Claude Code never opens or edits loop/NOTES.md or loop/DECISIONS_LOG.md.
- Handover NEXT lines may be stale; latest report and notes win. Jev is advisory.

## Status
- BUILT (not verified): food entry bar and sheets; gym chooser, duration, CelebrationCard, streak strip, Goals; TodayCard; Macros; Burned guard; EnergyBalanceCard; i18n setup; Log as planned; log-sheet failure notice; session.tsx label and picked-exercise rest seconds; food detail macros to 1 decimal (R56); detail.tsx citations fixed (R57); session.tsx citations confirmed correct (R58, R59); macro totals checked, no change needed (R60).
- Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
- Last checkpoint R48 green (tsc 0, 65 suites, 824 tests). Checkpoint due now (R61).

## Next
1. IN PROGRESS R61: checkpoint, read-only. Full tsc and app Jest. Report counts and any failures.
2. applyGrams macro precision in src/app/food/detail.tsx (~421-423). Check design per100 scaling and r1 display first. Keep picked-serving decimals only if the design shows them.
3. Search seed (src/app/food/detail.tsx ~164-166) and food tab seeds ((tabs)/food.tsx ~380-382), after step 2 is settled.
4. Logged-day sheet: follow design 'Add something extra'. Locate the copy first.
5. plannedRows omits te.rest_seconds (session.tsx ~193-199). Fix only if clean.
6. Wrap hardcoded strings, one file per round, after checking the path: src/app/dashboard/nutrition.tsx, gym/freeze, StreakCounter, GymPatternsCard, saved, MuscleChart, session, gym, profile/index, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
7. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
8. PlannedValuesForm.tsx:200 'Add exercise': compare to design.
9. Fix stale fibre note in summaryNoFabrication.test.ts header.
10. Trace add.tsx slotKey (~67). Remove unused keys if confirmed unused.
11. Volume: /gym/session saves top weight on all sets. Fix only without owner input, else park.
12. Recheck gap lines 1006 onward (not checked since R52) and stale lines 328 and 334.
13. Individual food rows print raw values: (tabs)/food.tsx ~895 and ~852, and src/app/food/saved.tsx:135. Check other write paths first.
14. Checkpoint: full tsc and app Jest, read-only.
15. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: real editing, or change the 'open it to edit' toast. /gym/session writes a second row (src/lib/data/mutations.ts:173-178).
- Device checks: logged card and failure states offline; possible double notice with gym tab (gym.tsx:107).
- Gap row 90 merge; whether log-sheet row stays BUILT; line 330 Partial or BUILT; line 334 No (may override).
- Food detail differences 1, 2, 4 (lines 1001-1004); keep numbering; ❌ verdicts at 961 and 1210.
- Footnote '23 sessions 2 freezes'; rows 89, 23, 17.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording; Freestyle 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food/gym/profile.loadFailed; training list (gym.tsx:153); profile row 94; streak wording; backend GetToday flag.
- Log as planned: minutes as note text enough? Energy literals English? Remaining-kcal line removal acceptable?
- Users without body stats see 1,500 kcal goal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal under session card; chevron before tappable.
- Volume: fix, show when consistent, or accept? Heatmap route wording; calories cell needs backend field.
- Try again hardcoded English with small tap target.
- Food detail decimals accepted? Do picked servings keep decimals?

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros shown as 0, custom exercise route, PlannedValuesForm submit.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid 17/24 vs 16/21, grid shift after fetch, stale burn, earliest-session rule, near-midnight date mismatch, per-session calories, GetToday is_rest_day, '0 exercises planned'.
- Logged card tap target needs day route. Macros history chart. App-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle es and fr. SegmentedField inset; single scanner; chip padding; '14-day' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds grams and kcal; long-press meal delete hidden. Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show the 1,500 floor; Math.max NaN if a profile field is undefined.
- Accepted limits: summary guard test cannot see spread props; failure paths untested; null-as-failure assumes getToday never returns null for a real response.
- 'What the app does' old-form block lacks a recorded date.

## Gotchas
- Edit tool: node escapes for NBSP and U+2019. i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths. grep -c returning 0 exits 1.
- Check premises first; named files and line numbers are often wrong.
- Design assets: node -e from __bundler/manifest (gym 7dc211f6, Summary 185bb533, food 71f71ac4).
- zsh: quote globs; avoid echo ==.

## Round log
- R9-R50: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard, failure notices, checkpoints R34 and R48 green, session label, rest seconds, gap fixes.
- R51-R56: citation and doc fixes; macros to 1 decimal (R56).
- R57: detail.tsx citations fixed in gap doc. Done.
- R58: session.tsx citation check, no edits needed; report flagged for missing tsc or tests.
- R59: doc-only tsc re-run, TSC EXIT 0, flag cleared. Citations confirmed again.
- R60: unrounded macro totals checked. No edits. Totals are whole numbers in the design, so no change. Handover +1 citation shift dropped as stale.
- R61: checkpoint, read-only, tsc and app Jest (in progress).

## Handover R60
- Session continuity: the next Claude Code session is fresh. Name files fully in every prompt.