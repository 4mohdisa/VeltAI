# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras go to Parked.
- design/Lume App.html is source of truth. Gap analysis is authoritative.
- 7-day trial, $49.99/yr, $8.99/mo, no card up front.
- Isa r24: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted).
- Isa r39: celebration card approved; row 18 edit cycle dropped; already-logged routes to the day; Summary card never calls logGymSession() with no args; food detail search shows macros.
- r48-49: derived gym duration logged when above 0, else undefined; keep ?? for template estimate.
- r50: test gate green before any new product task.
- Card variant='elevated' is the repo mapping for the design's white card.
- Session mode state is derived, not set in effects.
- Isa r55: compare code with design/ before each row; fix only real differences.
- R57: Search foods tile routing to food tab is a real difference; dedicated search sheet parked.
- R58: SegmentedField inset not changed globally (11 callers); Quick add gets a compact option.
- R59: checkpoint prompts name the design file (reference only) and the repo check scripts.
- R60: checkpoint green: tsc, 65 suites, 824 tests. Extra test unexplained.
- Prompts: one task, one editable source file; one-line status edit to DESIGN_GAP_ANALYSIS.md allowed; checks are tsc, eslint and jest on changed files; doc-only rounds run no tests; every prompt states the branch and no git.
- R62: a flagged report is cleared by a verification-only run before any new build task.
- R63: celebration card calories show a dash (no body weight; no fabricated data).
- R64: Quick add detent lives in src/app/_layout.tsx:160 (fitToContents). Sheet-size values are not navigation structure.
- R67: a flagged report is cleared by tsc, eslint and Jest on the related test files only, with no edits.
- R69: same rule as R67 applies to the R68 flag (comment-only report, flagged as partly done).
- R70: every prompt must name the matching design/ file and the gap-analysis section it clears, even for small edits.

## Built (not verified)
- NumberEntryBar shared: food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search routes to food tab; + disc logs 100 g with toast.
- Goals: borderless input, hints, elevated card.
- Gym 'How did it go?' chooser; modes adjust, ticklist, picker.
- Row 19: already-logged routes to /gym/session.
- Row 17 steps 1-2: CelebrationCard.tsx opens from save() as native Modal.
- Gym duration honesty (r48-49).
- Food macros carried through pick, search and detail; foodDetail.test.ts 31/31.
- Quick add: toast '{kcal} added to {meal}'; MEAL caption in quick-add.tsx.
- Quick add detent: _layout.tsx:160 'fitToContents' (R64). Comments at _layout.tsx:152-159 corrected (R68).

## Open differences
- Add sheet: title not meal-named; tile gap ~14pt not 12pt; SF Symbols not design SVGs; 'Add meal' title from global +.
- Quick add: Meal control 13/17 semibold, 3pt padding; no blinking caret; confirm pill 56 vs 52pt, 17/24 vs 17/22 (R70 in progress); offline toast names no meal; hardcoded English copy.
- quick-add.tsx:114 own flex:1 KeyboardAvoidingView; check sheet does not collapse.
- Row 17: footnote 'Push logged - streak extended' missing; Time dash on empty plan; card can show '0 min'; possible stat overflow.
- Recents in hooks.ts useFoodSearch drop macros; re-pick logs zeros. quickAdd and detail.tsx log missing macros as 0.
- Stale: detailSubject.ts:25-27; gap detail sections near 978, 1048, 1419; gymDurationHonesty.test.ts 'Not set' title and 0-or-less case.
- Stale notes: loop/NOTES.md lines near 39, 42, 54 still list the 0.6 detent as open and name quick-add.tsx as its location. DESIGN_GAP_ANALYSIS.md Quick add section near 981-998 still describes the old three-field form. Both fixed in the doc-only round.
- i18n hardcoded toast copy in index.tsx, log-session.tsx, quick-add.tsx.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.
- Remaining gym rows: Isa approval per item.

## Blocked on Isa
- Row 23 one-tap log: A = route onLog to log-session; B = accepted deviation. Asked r43, unanswered.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Row 17 celebration Calories column: what it shows.
- Search foods tile routing: accepted (default) or not.
- Inset callers: variant change or compact option (R58).
- Owner device checks, not yet asked: Quick add sheet fit at fitToContents (whole sheet incl. confirm pill, no collapse, NumberEntryBar above keyboard), MEAL caption, toast, NumberEntryBar above keyboard; celebration modal flow. Ask once, as a single question, when no other owner item is pending.

## Next
1. DONE (R69 verification run, cleared R68 flag).
2. IN PROGRESS (R70): Quick add confirm pill 56 to 52pt, 17/24 to 17/22, in src/app/food/quick-add.tsx. Matching design: design/Lume App.html, Quick add.
3. Recents: hooks.ts carries protein, carbs, fat.
4. Compact segmented option, then Meal control 13/17 and 3pt padding.
5. Add sheet title 'Add to lunch' when opened from a meal.
6. Doc-only: stale lines in loop/NOTES.md and DESIGN_GAP_ANALYSIS.md Quick add section (981-998); stale gap detail sections; recount the 824th test. No tests.
7. Checkpoint (tsc, full jest) when the loop note asks.
8. If no non-gym one-file task remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order, per-set remove; cardio ParameterForm; template editor; kg/lb; volume kg only.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset restyle (11 callers).
- mixHex in GymCalendar.tsx to shared helper.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- es/fr locales lack new keys. CONFLICT_KEYWORDS not type-linked. Unused addMenu keys.
- router.setParams rewrites history. Dev catalog has calories only.
- Blinking caret; Math.round in draft(); Goals accessibilityState; English hints in food.tsx; labels in add.tsx and log-session.tsx; /gym/session shows planned not logged rows.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx.
- Estimated gym duration logged; revisit if only measured counts.
- Adjust and ticklist arrive checked, so 'Save progress?' fires on untouched back-out.
- Source-text tests in gymDurationHonesty and foodDetail do not run behaviour.
- Estimate of exactly 0 hides planMinutes (keep ?? per r49).

## Loop notes
- R1-39: early rejections; data path, i18n handled.
- R43 asked row 23, unanswered. R45 rejected (branch rule).
- R50 gate green. R53-54 food step 3 done.
- R55-56 re-check: Add sheet and Quick add DIFFERENT.
- R60 checkpoint green at 824 tests.
- R61 MEAL caption; R62 verification cleared flag.
- R63 wrong file in notes corrected. R64 detent to fitToContents.
- R65 flagged as partly done (device run open, notes too long). Handled by R66 verification and rewrite.
- R66 verification-only run: detent confirmed, tsc and eslint green, Jest not run.
- R67 flagged: Jest not run and last report incomplete. Cleared by verification-only run: tsc, eslint, 5 related Jest suites green (62 tests).
- R68: comment-only fix to _layout.tsx:152-159 (no code). Flagged as partly done; report left a device run and stale notes as NEXT.
- R69: verification-only run chosen over doc-only fix and Jev ask 49%/run 41%. Reason: flagged report must be cleared first (R62/R67 rule).
- R70: rejected prompt (no design/ file named) rewritten. Chose Quick add pill size over recents: one file, clears a listed difference. Jev run 79%.
- Jev R64: ask 61%; ran, one-value change.
- Jev R67: ask 75%, run 15%; ran, flag cleared without Isa.

## Gotchas
- Design text is in the __bundler payload; decode manifest (gzip+base64). Food entry 71f71ac4, gym 7dc211f6.
- Source-reading tests are invisible to --findRelatedTests; grep src/__tests__. They pin exact source text.
- zsh does not word-split unquoted variables. Expo docs requirement is in AGENTS.md.
- Row numbers mean numbered differences, not table rows.
- Adjust and ticklist dirty guard; session mode derived.
- Quick add detent is fitToContents at _layout.tsx:160; the 0.6 default is the global sheet default, not Quick add.