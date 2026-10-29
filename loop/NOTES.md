# Lume Loop Notes

## Goal
Build every UI surface to match the Claude Design export in design/ exactly, working through the 41 rows of DESIGN_GAP_ANALYSIS.md. Isa verifies the UI himself.

## State at start (14 Sep 2026, from Notion, confirmed current by Isa)
- Backend and app built. App 65 suites / 823 tests, backend 632 pass.
- Gap analysis: 26 of 41 surfaces different, 15 partial, 0 exact.
- Work paused 13 Sep right after the gap analysis, before any fixes.
- Single workspace, branch loop/design-match.

## Decisions (never delete)
- RevenueCat over Stripe.
- Onboarding behaviour is stabilised, do not change it.
- v1 scope is locked, extra ideas go to Parked.
- The Claude Design HTML export in design/ is the source of truth for the UI.
- The gap analysis is authoritative, earlier verification reports are not.
- 7-day free trial, $49.99 per year and $8.99 per month, no card up front.
- Gym logging redesign needs Isa's approval before building.
- Prompts are strict: one task, max 5 steps, named files, explicit do-not-touch list.
- Testing is light: type check plus tests for changed files only. Isa verifies the UI.
- Code must be clean: reuse tokens and shared components, no dead code or debug leftovers.
- A component and its application to screens are separate tasks. The loop checker rejects prompts that combine a component with screens.

## Done
(nothing yet)

## In progress
- Round 1 (retry): build ONLY the shared component FoodNumberEntryBar.tsx. The first prompt was rejected for mixing the component with applying it to 3 surfaces. The new prompt builds the component only, does not apply it, and does not change row statuses. Claude Code finds the design source in design/ and the shared components folder itself. If design/ is missing or the bar is not found it reports BLOCKED, so then use action ask.

## Blocked on Isa
(nothing yet)

## Parked (not v1)
(nothing yet)

## Next task
Read the round 1 report. Then apply FoodNumberEntryBar to ONE surface per round, in the order Claude Code recommends in NEXT. Mark each row built in DESIGN_GAP_ANALYSIS.md with one line only after the bar is applied on that surface. When every row the bar covers is built, use action ask to let Isa choose whether to start the gym cluster redesign (plan-aware 'How did it go?' chooser replacing the 4-field questionnaire). After that, take the remaining rows in the order that clears the most rows per task.

## Loop notes
- Round 1: prompt rejected once (more than one screen or component). Jev had low confidence that the last task finished cleanly, which fits because nothing ran.