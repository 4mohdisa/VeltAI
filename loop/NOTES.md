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

## Done
(nothing yet)

## Blocked on Isa
(nothing yet)

## Parked (not v1)
(nothing yet)

## Next task
First confirm design/ exists in the repo with the HTML export. If it does not, use action ask. Then build the food number entry bar (the slim tap-to-edit keyboard bar) as one shared component matching the design, apply it where the gap analysis lists it, mark those rows built in DESIGN_GAP_ANALYSIS.md, and report. After it is done, use action ask to let Isa choose whether to start the gym cluster.
