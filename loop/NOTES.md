# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wins copy and layout unless Isa overrides. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Summary card never calls logGymSession() without args.
- Macros stored unrounded. Food detail macros and fibre show 1 decimal. Food day card, Summary, Macros detail and totals stay whole. draft() rounds to 1 decimal on save.
- Quick add targets the design's second serving (x.serv[1]) once search carries serving data. Until then it logs 100 g.
- Empty profile floors at 1,500 kcal. Slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- TodayCard: already_checked_in before is_rest_day. Rest = is_rest_day || !template. Failure = today === null after loading.
- Log sheet: rest check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again refetches.
- Header counts derived from the table. Rows 15 and 21 removed because other text cites them.
- Citations: an insertion at line N moves only citations at or after N. Check by content.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'.
- Prompts: one surface or one shared component; name design/ file and gap row; say 'no matching tests' when none apply; state branch rule.
- Claude Code never opens or edits loop/NOTES.md or loop/DECISIONS_LOG.md.
- Handover NEXT lines may be stale; latest report and notes win. Jev is advisory.
- Tests: a report that skips tests for changed files is flagged. tsc once and tests for changed files each round; full suite at checkpoints.
- Flagged-as-partial work is closed only by finishing the change or stating why it cannot be finished.
- Macro totals stay whole (design rounds them: hMacroCols, gMacroDefs). Round 1 decimal is only on Food detail.

## Status
BUILT (not verified): food entry bar and sheets; gym chooser, duration, CelebrationCard, streak strip, Goals; TodayCard; Macros; Burned guard; EnergyBalanceCard; i18n setup; Log as planned; log-sheet failure notice; session label and rest seconds (session.tsx:200); food detail macros and fibre at 1 decimal (detail.tsx MACRO_PRECISION :66, num :402); citations; macro totals; quick add rounds to 1 decimal (type-checked only).
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
Last checkpoint R61 green (tsc 0, 65 suites, 824 tests). It predates R63 to R74. No test covers decimal macros or quickAdd rounding.

## Next
1. R74 (in progress): doc-only check of fibre lines in DESIGN_GAP_ANALYSIS.md ('2-up inputs', 'Fibre is not editable', 'Fibre is still rounded as it is typed') against src/app/food/detail.tsx, by content. Closes the R73 partial flag.
2. Raw item values display: (tabs)/food.tsx ~852 and ~895; food/saved.tsx ~135. Decide, then build.
3. Shared macro rounding helper: inline Math.round(x * 10) / 10 in detail.tsx, quickAdd, label-scan.tsx:40, onboarding/measurements.tsx:25. Park if it needs more than one file.
4. Seed rounding: detail.tsx ~164-168 and ~224; (tabs)/food.tsx ~380-382. Grep first; edit only if still unfixed.
5. Saved-food fibre: check whether editSavedFood and saveFood in detail.tsx drop draft.fibre.
6. MACRO_PRECISION comment in detail.tsx omits fibre (doc only).
7. Logged-day 'Add something extra': follow design copy.
8. Gap lines 1006 onward unchecked. Line 90 merge. 'no keyboard bar' line (~1495) stale.
9. Wrap hardcoded strings, one file per round: nutrition.tsx, gym/freeze, StreakCounter, GymPatternsCard, saved, MuscleChart, session, gym, profile/index, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. TodayCard strings: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
10. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
11. PlannedValuesForm.tsx:200 'Add exercise' vs design.
12. add.tsx slotKey (~67). Remove unused keys if confirmed.
13. Volume: /gym/session saves top weight on all sets. Fix without owner input, else park.
14. Checkpoint: full tsc and app Jest, read-only.
15. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: real editing or change toast. /gym/session writes a second row (src/lib/data/mutations.ts:173-178).
- Device checks: logged card and failure offline; possible double notice (gym.tsx:107).
- Row 90 merge; log-sheet row BUILT?; line 330 Partial or BUILT; line 334 No.
- Food detail differences 1, 2, 4; verdicts at lines 961 and 1210.
- Footnote '23 sessions 2 freezes'; rows 89, 23, 17.
- Search routing; global + title; quick add first or second serving (17/22 vs 17/24); add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording; Freestyle 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food/gym/profile.loadFailed; training list (gym.tsx:153); profile row 94; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals English; remaining-kcal line removal.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume: fix, show when consistent, or accept. Heatmap wording. Calories cell needs backend field.
- Try again hardcoded English, small tap target.

## Parked
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) has no serving data. Needs a data or backend change. Only barcode products carry servingOptions.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros shown as 0, custom exercise route, PlannedValuesForm submit.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill/chip type, grid 17/24 vs 16/21, grid shift after fetch, stale burn, earliest-session rule, near-midnight mismatch, per-session calories, GetToday is_rest_day, '0 exercises planned'.
- Logged card tap target needs day route. Macros history chart. App-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr. SegmentedField inset; single scanner; chip padding; '14-day' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds grams and kcal; long-press meal delete hidden. Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if a profile field is undefined.
- Accepted limits: summary guard test cannot see spread props; failure paths untested; null-as-failure assumes getToday never returns null for a real response.

## Round log
- R9-R61: built most surfaces; checkpoints R34, R48, R61 green.
- R62-R65: precision and fibre fixes; doc lines fixed.
- R66: rejected (more than one screen).
- R67-R71: seed fix reported unverified; quickAdd rounding type-checked only; R71 flagged.
- R72: quick add serving parked (no serving data).
- R73: doc-only fix of stale fibre lines. Report flagged as partly done: line 1012 wording left open.
- R74: doc-only check by content of fibre lines; closes the R73 flag by finishing or stating why.