# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wins copy and layout disputes unless Isa overrides. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Summary card never calls logGymSession() without args.
- Macros stored unrounded. Food detail macros and fibre shown to 1 decimal place. Food day card, Summary card, Macros detail and totals stay whole numbers, as the design shows (R60).
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
- Picked-serving macros: design shows unrounded scale with r1 display (R62 check). Protein, carbs, fat and fibre keep 1 decimal place; kcal stays whole. Fibre gated on design r1 and backend type check (float64, confirmed R64).
- draft() rounds to 1 decimal on save; only form state is unrounded (R63).

## Status
- BUILT (not verified): food entry bar and sheets; gym chooser, duration, CelebrationCard, streak strip, Goals; TodayCard; Macros; Burned guard; EnergyBalanceCard; i18n setup; Log as planned; log-sheet failure notice; session.tsx label and picked-exercise rest seconds; plannedRows carries rest_seconds (session.tsx :200); food detail macros to 1 decimal (R56); detail.tsx citations fixed (R57); session.tsx citations confirmed correct (R58, R59); macro totals checked, no change needed (R60); picked-serving protein, carbs and fat unrounded with 1-decimal display (R63, difference 13); fibre 1 decimal on detail sheet, typed, picked, save and display (R64, difference 13).
- IN PROGRESS: doc-only fix of stale fibre lines in DESIGN_GAP_ANALYSIS.md (lines 1011, 1012, 1219).
- Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
- Checkpoint R61 green (tsc 0, 65 suites, 824 tests). Last full suite predates R63 and R64 changes.

## Next
1. IN PROGRESS: doc-only fix of stale fibre statements. Line 1219 'Fibre is still rounded as it is typed' is false. Line 1012 'Fibre is not editable' is false (fibre has its own pad). Line 1011 '2-up inputs' is stale. Check against src/app/food/detail.tsx (~411, ~424, ~437, ~570, ~608) and design asset 71f71ac4. Keep line count the same.
2. Search seed (src/app/food/detail.tsx ~164-168) and barcode seed scale (~224, scale defined ~211), and food tab seeds ((tabs)/food.tsx ~380-382). Seeds show whole numbers and gain decimals after a pick. Fix only after step 1 is settled.
3. Logged-day sheet: follow design 'Add something extra'. Locate the copy first.
4. Fix stale fibre note in summaryNoFabrication.test.ts header, only if still stale.
5. Wrap hardcoded strings, one file per round, after checking the path: src/app/dashboard/nutrition.tsx, gym/freeze, StreakCounter, GymPatternsCard, saved, MuscleChart, session, gym, profile/index, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
6. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
7. PlannedValuesForm.tsx:200 'Add exercise': compare to design.
8. Trace add.tsx slotKey (~67). Remove unused keys if confirmed unused.
9. Volume: /gym/session saves top weight on all sets. Fix only without owner input, else park.
10. Individual food rows print raw values: (tabs)/food.tsx ~895 and ~852, and src/app/food/saved.tsx:135. Check other write paths first.
11. Recheck gap lines 1006 onward (not checked since R52), including differences 11 and 12, and stale lines 328 and 334. Line 1495 'no keyboard bar' is stale.
12. Checkpoint: full tsc and app Jest, read-only.
13. No rows left: stop with 'only owner decisions remain'.

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
- R58: session.tsx citation check, no edits needed.
- R59: doc-only tsc re-run, TSC EXIT 0. Citations confirmed again.
- R60: unrounded macro totals checked. No edits. Totals are whole numbers in the design.
- R61: checkpoint, read-only, tsc 0, 65 suites, 824 tests passed. Done.
- R62: design checked. Picked-serving macros are 1-decimal from unrounded scale. Gap doc line 1013 updated.
- R63: applyGrams picked-serving protein, carbs and fat unrounded with 1-decimal display. Done (BUILT, not verified).
- R64: fibre 1 decimal on detail sheet (typed, picked, save, display). Done (BUILT, not verified). Gap doc difference 13 updated. TSC 0; 3 suites, 44 tests passed. Stale fibre lines 1011, 1012, 1219 flagged.
- R65: doc-only fix of stale fibre lines (in progress).

## Handover R60
- Session continuity: the next Claude Code session is fresh. Name files fully in every prompt.
- Handover summary (session before R60) superseded by the R63 and R64 reports; latest report and notes win.
- Handover at R65 window: Claude Code knows only the handover summary. Name files fully in every prompt.