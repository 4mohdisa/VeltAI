# Lume Loop Notes: Phase 2

## Goal
Wire every screen to the local backend, make backend changes the UI needs, and test key flows on the iOS Simulator. Progress is counted from PHASE2_ROWS.md.

## State at start (15 Nov 2026)
- Phase 1 finished: every UI row built, EXACT, or parked. Work lives on branch loop/design-match.
- Backend mostly done, needs refinement. App talks to a LOCAL backend on Isa's Mac. Xcode and iOS Simulator installed.
- Baselines: app 65 suites / 823 tests, backend 632 pass.

## Parked from Phase 1 (become rows)
- Row 103 item 1: 7 day stacked chart needs a food store data model change.
- Streak footnote counts distinct days (Isa's decision).
- Flame and VoiceOver follow the design (Isa's decision).
- Phase 1 device checks: become simulator visual QA rows against design/. Only true hardware checks stay with Isa as owner check pending.
- Full suites not rerun after Phase 1; 18 backend TestPG_* tests skipped. Both become rows (baseline first).
- Merging loop/design-match into main is Isa's job, not a row.
- Motion pass (Isa request): audit row first, then one row per area.

## Decisions (never delete)
- Local backend and local database only. Nothing runs against hosted production.
- RevenueCat over Stripe.
- v1 scope is locked, extra ideas go to Parked.
- Phase 1 design is final, do not restyle screens.
- Isa verifies on a device himself.
- Round 1: ran Task 1 (safety check and row list) instead of asking, since the check is read only and stops itself on any production hit.

## Done
- Nothing yet.

## Blocked on Isa
- Nothing yet.

## Parked (not v1)
- Nothing yet.

## Next
Task 1 in progress: read only safety check (API base URL, backend port, database host name only), then create PHASE2_ROWS.md with core rows, Phase 1 leftovers and motion rows. Task 2: baseline, every full suite green before wiring. Then local seed and test sign in user.