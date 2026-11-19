# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, and test key flows on the iOS Simulator. Progress is counted from PHASE2_ROWS.md (does not exist yet, the first task creates it).

## State at start (15 Nov 2026)
- Phase 1 finished: every UI row built, EXACT, or parked. Branch loop/design-match holds the work.
- Backend mostly done, needs refinement. App talks to a LOCAL backend on Isa's Mac (confirmed by Isa). Xcode and iOS Simulator installed.
- Baselines: app 65 suites / 823 tests, backend 632 pass.

## Parked from Phase 1 (become rows)
- Row 103 item 1: 7 day stacked chart needs a food store data model change.
- Streak footnote counts distinct days (Isa's decision).
- Flame and VoiceOver follow the design (Isa's decision).
- Phase 1 device checks (list in loop/NOTES.md): do them as simulator visual QA rows, screenshot against design/. Only true hardware checks stay with Isa as "owner check pending".
- Full test suites were not rerun after Phase 1's last rounds, and 18 backend TestPG_* tests are skipped: both become rows (baseline first).
- Merging loop/design-match into main is Isa's job, not a row.
- Motion pass requested by Isa: smooth animations and transitions. Audit row first, then one row per area (see brief).

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.

## Done
(nothing yet)

## Blocked on Isa
(nothing yet)

## Parked (not v1)
(nothing yet)

## Next
Task 1: read only safety check (API base URL, backend port, database host only), then create PHASE2_ROWS.md including the Phase 1 leftovers. Task 2: baseline, every full test suite green.
