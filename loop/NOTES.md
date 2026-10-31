# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Design 70, 82, 158 are measured from screen edge. 158 and 14 are literals. Top padding insets.top + space.md, pending Isa.
- Macros unrounded, 1 dp on save; totals whole. Unknown slot falls back to 'Add meal'.
- Gym Log follows showLogCta. Gym tab shows today. Swipe colour color.primary.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- TAB_BAR_CLEARANCE function left untouched.
- Row 85 title block built (R260). Notes outrank handover.
- Snapshot updates need Isa approval. Never pass -u or edit .snap files.
- Code tidying is never a task. Doc fixes wait until no build row is open.
- Every prompt: work only on loop/design-match; never switch, create, push or merge.
- Checkpoints: tsc plus jest --ci, no -u.
- Shared component edits (DetailChart.tsx) need Isa approval because they change other screens and snapshots.
- Unanswered questions are not repeated (R268).

## Status
- R268: Isa did not answer the R267 question on DetailChart.tsx and the detailChrome snapshot. Not asked again. Jev said ask 93%. Chose run: the Summary re-check needs no Isa input, is doc-only, and cannot break the build. Row 85 title is not picked because it was built R260 (handover stale).
- R267: asked Isa to approve DetailChart.tsx edit and detailChrome snapshot update (row 103). No answer.
- R266: no code changed. Row 103 differences all live in src/components/display/DetailChart.tsx. Row 103 marked NOT BUILT, code re-checked.
- R265 checkpoint result not reported. Run at next checkpoint.
- R258 checkpoint: tsc 0, 65/65 suites, 824/824 (before the snapshot change).
- R264: row 103 card gap 16 built (nutrition.tsx:76). Macros snapshot now red, blocked on Isa.
- R240-257: gym cluster, Summary and Food values built. R260: row 85 title block built.

## Open rows
- 83 DIFFERENT: sheet-in-place parked; button height and type parked.
- 85 DIFFERENT: eyebrow and title built. Open: calorie bar, 'left today', four-column wrap, top padding.
- 87 DIFFERENT: 180ms Meal chip transition (Blocked).
- 103 DIFFERENT: card gap 16 built. Open in DetailChart.tsx (needs Isa): kicker dot 8 vs 10 (:160); kicker letter spacing 1 vs 1.1 (:161); title letter spacing 0 vs -0.6 (:165); kicker block side padding 0 vs 2 and bottom 4 vs 0 (:158); Breakdown dot 8 vs 9 (:216); Breakdown row gap 8 vs 9 and baseline alignment (:215); stat line gap 4 vs 3, baseline gap 8 vs 7. Open outside file: 176pt chart; Energy.tsx, dashboard/week.tsx, dashboard/training.tsx still gap 12.
- 104 PARTIAL: Steps card missing; four non-design items; Today only; differences 25-27 open.
- 112 PARTIAL: top padding; GymPatternsCard typography blocked; Training list and LoadFailedNotice app-only.

## Next
1. Summary differences 1-5 re-check (doc only), R268.
2. Summary differences 6-10, then 11-15, 16-20, 21-25, 29-30, one batch per round (doc only).
3. Row 104: decide Steps card build or park (may need a step data source; HealthKit is off-limits).
4. Gym cluster, one file per round.
5. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
6. If Isa answers DetailChart.tsx: make the row 103 value changes, then approve one snapshot update for all four detail views.
7. Doc fixes once no build row is open.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 103: approve DetailChart.tsx edit (shared, changes Energy, Week, Training on screen). Asked R267, no answer; not asked again.
- 103: approve snapshot update for detailChrome, all four views (npx jest src/__tests__/render/detailChrome.render.test.tsx -u). Asked R267, no answer.
- 85: calorie bar; 'left today'; four-column wrap; Meal history link (recommend keep).
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms; chip truncation.
- 112: GymPatternsCard padding 20 vs 16; Training list (keep); LoadFailedNotice (accept).
- Top padding Gym, Summary, Food: inset-based (recommended) or literal 70.
- Gym Log hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow, calendar return, title spacing, shadows, pull-to-refresh, tab bar es/fr, food row, offline, add menu at 232pt, swipe dialogs, long es/fr text, schedule weekday, bottom 158 notched, header 82, Food gaps, Macros baseline alignment, Breakdown label type.
- Native review es/fr strings and long labels (see gap doc).
- Header strip on floating screens: Screen.tsx:163 fixed 84 or inset-based.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: hardcoded English month, weekday, Today, Yesterday, Quick add, Done, Close; GymStatusCard.tsx:30; scan.ts:305; Summary index.tsx:146/149/179; formatNumber en-AU; WeekStrip.tsx:43.
- Food: eyebrow tappable during search; day picker changes date behind results.
- Copy: foodLog.per100; CaloriesCard g; food.rowAnalysing; food.deleteItem.
- Missing: 'Updated {name}' toast; savedAdded toast; + menu toast; toast fade.
- Gym: button 56pt vs 52; duplicated pill styles; double getToday; MyScheduleCard double fetch; per-set remove; cardio ParameterForm; template editor; kg/lb; pull-to-refresh misses TodayCard.
- Layout: TAB_BAR_CLEARANCE orphaned (LumeTabBar.tsx:52); stale comments _layout.tsx:26, LumeTabBar.tsx:4; Screen.tsx:22 unused re-export.
- Layout: Profile and About/Delete header strip differs (row 110).
- Code: easing bezier and SLOT_KEYS duplicated; mixHex; console.warn hooks.ts:56; recipe fibre saved as 0; key={c.name}; SettingsList.tsx:129.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx, MyScheduleCard, header height.
- Doc: stale gap-doc lines near 236, 310, 438, 448, 534, 588, 1520; row 87 repeated BUILT; row 112 says EXACT; rows 85 and 104 say BUILT for 158.
- Doc: handover food title recommendation was stale (row 85 title built R260).

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). Gym, Summary, Food suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Bundles: Gym 7dc211f6, Summary 185bb533, Food 71f71ac4.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Claude Code forgets at handover: name files fully.
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md (not ours).
- Line numbers shift; grep before citing.
- Every prompt must say: work only on loop/design-match; never switch, create, push or merge.

## Handover and Jev
- Handover every 15 rounds into loop/HANDOVER.md. Last before R260. Next due around R275.
- Jev R268: ask 93%, run 4%, stop 3%. Looked again. Kept run for the reason in R268 above.
- Jev R267: ask 94%, run 3%, stop 3%. Acted on it: the only row-103 build needs Isa's approval.
- Jev R266: run 52%, ask 45%.