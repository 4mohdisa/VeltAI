HANDOVER: LumeAI design match (continued)

RULES
Work only on loop/design-match and confirm it by reading .git/HEAD. Run no other git commands, and never stage, commit, push, merge or switch. Never open loop/NOTES.md or loop/DECISIONS_LOG.md. Isa is the owner. Nothing has been checked on a device.

BUILT (code only, device check pending)
Row 103 overall is still DIFFERENT, because items 1, 11 and 12 are open.
- Item 2 (hero header) is BUILT on all four views. ChartHeader has a new opt-in `hero` option: a 500 14/18 title (HERO_TITLE), centred alignment, and the header grouped with the chart at space.sm.
- Item 3 (stat line): `StatLine tight` is on in all four views.
- Item 4 (kicker) is BUILT. KickerTitle already matched the design; only the doc was updated, and no code changed.
- Item 9 (Breakdown row) is BUILT in the shared default, because all four callers are detail sheets. Constants: BREAKDOWN_DOT 9, BREAKDOWN_GAP 9, BREAKDOWN_LABEL 500/20 on callout. The row aligns on the baseline.
- Items 5 and 6 are EXACT; items 7 and 8 are BUILT.

IN PROGRESS
Nothing.

KEY FILES
- src/components/display/DetailChart.tsx: KickerTitle ~:292, ChartHeader, StatLine, BreakdownRow ~:341.
- src/app/energy.tsx
- src/app/dashboard/nutrition.tsx, training.tsx and week.tsx
- src/__tests__/render/detailChrome.render.test.tsx and its .snap; summaryDetails.test.ts; hydrationErrorScreens.test.ts
- DESIGN_GAP_ANALYSIS.md (row 103 is line 103)
- design/Lume App.html

DECISIONS
- Change a shared default only when every caller is a detail sheet; otherwise add an opt-in option.
- Values with no token become named constants.
- Regenerate a snapshot only after its diff shows nothing but the intended change. Compare the removed and added lines with indentation stripped.
- Keep style objects flat, so headers without `hero` render byte-identically.

STATE
- Last full suite (before item 9): tsc exit 0, 65 suites, 824 tests, 4 snapshots, all passing.
- After item 9: tsc exit 0, and the 3 related suites passed (61 tests, 4 snapshots).

NEXT
- Run the full npx jest --ci checkpoint after item 9.
- Then work on items 11 and 12, or ask Isa about item 1. Item 1 needs a 7-day stacked chart, but the food store holds only today.

GOTCHAS
- Decoding: line 370 of the HTML is JSON. Find the key starting 185bb533, decode base64, then gzip, into mktemp, and delete the file afterwards. The bundle's line numbers are inside the decoded text, not the HTML file. The Workouts sheet is in the Summary bundle, not Gym 7dc211f6.
- In zsh, use plain `grep -rn X src`; `--include=*.tsx` fails.
- In the Jest Reanimated mock, animations stay frozen at their start.

NOT FIXED
- The hero title and the BreakdownRow label use numberOfLines={1}; the design lets them wrap. This is parked.
- KickerTitle uses the literals 10, 2, 1.1 and -0.6.
- HERO_TITLE has no type token.
- The statLarge text shows line height 100 at font size 40 in the snapshots.
- No snapshot covers This week's net view.
- Row 103 item 10 has stale line references, and the item 2 text is long.
- The secondary card headers have not been checked against the design.
- Bundle :655 has a "Steps per day" sheet that no detail view in the code matches.
- Test output prints "API unreachable" warnings.
- Still open from earlier: the grow-in start delay, the streak footnote while loading, the toast checkmark weight, the macro-at-100% height, and the items in the earlier handover's NOT FIXED list.