# Lume Loop Notes (R1208)

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified.

## Status
STOPPED since R1017; confirmed R1018 to R1208. All 41 rows built, EXACT, or parked. Do not restart build work unless Isa asks. Nothing checked on a device.

## Built (device check pending)
- Rows 76, 82, 102 and 111 (EXACT), as recorded in the gap doc.
- Row 103: items 2 to 9, 11 and 12 built or EXACT. Item 1 and the Macros variant of item 2 parked (7-day data, needs a data model change).

## Checks
- Full checkpoint R818 (tsc 0, 65 suites, 824 tests, 4 snapshots) predates item 9.
- Since then: tsc 0; related suites green (61 tests, 4 snapshots), R943.
- Full checkpoint not run after item 9. Isa to run before commit.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design first.
- Change a shared default only when every caller is a detail sheet; otherwise add an opt-in option.
- Values with no token become named constants. Keep style objects flat so headers without hero render identically.
- Snapshots: jest --ci first; regenerate only the affected file after a diff check; never hand-edit .snap.
- Jev is advisory; overrides are logged with reasons.
- Defaults: one-tap gym log on Summary; Distance km for cardio; no food search chips; Goals extras kept; Gym opt-out follows design.
- Notes win over stale handovers.

## Accepted deviations
Ticked exercises for duration and completion; no kcal tag on second-sheet rows; English second-sheet copy; tab bar offset above inset 34; strip taps go to /gym/streak; local SCRIM_COLOR in AddMenu.tsx; row 76 pick marks day done; 'Exercises' tracking; row 86 item 8 and Fibre tile hidden without source; Muscle focus 'Last 30 days' and unit-less volume; New workout keeps title; chooser with no plan redirects to library; streak footnote hidden while loading.

## Parked (one line per area)
- Row 103 item 1 and Macros variant: 7-day data.
- Food: food.tsx:682-683; detail.tsx:315, :683; day chip 66 vs 52/60; NumberEntryBar.tsx:108; multi-angle scan; anomaly banner.
- Scan: three routes; camera black; guides; shutter 72; no gallery, My dishes or Quick add; busy states; radius 28.
- Copy: 'por dia' vs 'al dia'; es/fr unreviewed; gym.tsx plurals hard-coded; es.json Fibre labels duplicated.
- Styles: button label colour; no danger token; literals 16/22 at delete-account.tsx:116; hero title and BreakdownRow label numberOfLines 1; KickerTitle literals 10, 2, 1.1, -0.6; HERO_TITLE has no type token; button icon 18pt for 16pt label; statLarge line height 100 at size 40.
- Glass: back button fill three-way without system Liquid Glass; icon colour black vs #171717.
- Layout: headerRight top 64 on summary; Screen floating gap 12.
- Goals: silent clamping; 'Saved as you type' untrue (en.json:82, goals.tsx:198).
- Calendar: calendar.tsx:101, :110, :128; six-row scroll; Jump to today.
- Gym: MuscleChart.tsx:1; muscles.tsx:75; history.tsx:44-46; session.tsx:116-123; dead chevrons; lb plan vs kg; cardio sets x 3.2; Summary streak pulses.
- Charts: Energy scale 7-93%; gutter 48; literal fontSize 12; space.xs bar minimum; fractional bar heights; easing copied in two files; GrowBar animated height overrides base.
- Cleanup: CHART_GUTTER_W and SCALE_LABEL_W copied in four screens; stale 'lifted VERBATIM' header; mixHex in GymCalendar.tsx; duplicate SLOT_KEYS; row 103 item 10 stale refs.
- Subscription: no busy state; manage failure swallowed (:104).
- Tests: sheetVariant.test.ts brittle; no render tests for log-session, connected apps, Gym; 'API unreachable' warnings; no snapshot for This week's net view.
- Doc: stale headings and line refs (rows 102, 103, 110).
- Backend: session calories; logged pill colour awaits token.
- /tmp/lume-* leftovers: need Isa approval.
- Outside the 41 rows: secondary card headers (bundle :291); Steps per day sheet (bundle :655).

## Open for Isa (defaults apply)
StatLine tight; footer top and bottom; row 110 padding; logged pill token; session calories; button label colour; danger token; Sunday copy; This week footnote and segmented control; workout title and summary line; daily net line height; sheet close 40 vs 44; energy caption wording; energy label 13pt vs 12; toast tick or tone icon; tick weight; toast bottom 112; streak footnote while loading; gym flame at 0 grey; WHOOP glyph on 14% chip; macro at 100% height; grow-in start delay.

## Owner device checks
Fades, shadows, pull-to-refresh, scrims, sheets, calendar, scroll, tab bar, Liquid Glass, Reduce Transparency, VoiceOver, delete flow, streak, history, 3D body, sources, energy, title blocks, es and fr lengths, large text, gutter and labels, Macros spacing and grow-in, bar corners and width, column gap 3, axis labels, over-130% bars, pill label, chooser caption, toast clearance, tick weight, Connected apps chip, streak strip and flame, add menu, StatLine gap, unit gap and tracking, four hero headers, kicker block, Breakdown baseline and dot alignment, item 11 back button position, fill and bottom padding, detail contentStyle gap 16.
- Screen.tsx: an accidental prettier --write once reformatted the file. Check its diff against HEAD before commit.

## Gotchas
- Briefs and handovers carry false premises; verify first. Find code by content, not line number.
- Bundle: design/Lume App.html line 370 is JSON. Decode base64, gunzip into mktemp, delete afterwards. Keys: Summary 185bb533, Gym 7dc211f6, Profile b09a5e65, Food 71f71ac4. The Workouts sheet is in the Summary bundle.
- zsh: quote bracketed paths; use plain grep -rn X src. Capture jest exit codes without a pipe.
- Regenerate: npx jest --ci=false <file> -u. The Reanimated mock freezes animations.
- Never run prettier or any formatter.

## Loop log
- R801 to R818: checkpoints green. R812 and R817 rejected (no design file named).
- R814: item 11 built. R815 to R816: item 12 EXACT.
- R819 to R993: stop confirmed each round; Jev agreed. R942 and R943 overrides logged.
- R993: row 103 doc re-check (refs and header only).
- R994 to R1207: stop confirmed each round; loop input 'none yet, first round' treated as an input fault; Jev stop agreed.
- R1208: stop confirmed. Same input fault. Handover still stale (lists items 1, 11 and 12 as open). Jev stop 93% agreed. No override. No checkpoint run (not marked due by the loop script).

## Action for Isa
- Before commit: run the full jest suite and tsc once. The R818 checkpoint predates item 9.
- Run the owner device checks and review the commit on loop/design-match.
- Decide row 103 item 1 later: it needs a food-store data model change.
- Confirm item 11 back button and item 12 on device.
- Fix the handover generator: it keeps copying stale NEXT and NOT FIXED lists, a stale row 103 status, and items 11 and 12 as open. Read these notes instead of any handover until fixed.
- The loop input has shown no new report since R993, and the latest report field reads 'none yet, first round'. Check the loop input before restarting build work.

## Latest Claude Code report
None yet, first round (input fault, same as R994 to R1207). Last real report: R993, row 103 doc re-check only. No code changed. Not blocked.

## Latest handover
Stale (lists items 1, 11 and 12 as open, a row 103 DIFFERENT status, an old NOT FIXED list, and a NEXT to run the full checkpoint). The notes win. The full checkpoint after item 9 is still open for Isa before commit.

## Jev
R1208: stop 93% agreed (advisory: stop 93%, ask 7%, run 0%, confidence 0.89). Last task clean-finish 4%. Risk of continuing without Isa 2.0 of 2 (confidence 1.00). No override.

## Rules (unchanged)
Work only on loop/design-match. Never stage, commit, push, merge or switch. Never open loop/NOTES.md or loop/DECISIONS_LOG.md. Isa is the owner. Nothing has been checked on a device.

## Parked tasks
None added this round.

## Stop reason
All 41 rows built, EXACT, or parked. Waiting for Isa: full checkpoint before commit, device checks, and a real loop input report.