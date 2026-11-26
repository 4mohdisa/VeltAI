Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first. Last type check: 0 errors.
- Run Jest as perl -e 'alarm N; exec @ARGV' npx jest --ci <full paths>, output to /tmp. Never use -u or Prettier --write.
- Last full suite (Round 154): 350 of 350 suites, 2,189 tests, no force exit warning.

Rows (PHASE4_ROWS.md, updated Round 149)
- BUILT (17): 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 12b, 13, 14, 29. Rows 2.2, 2b, 2d, 3, 5, 6, 10, 11, 12 and 13 say "owner check pending".
- PARTIAL: 6b, 7, 8, 9, 14a, 14b, 31.
- DIFFERENT: 15 to 28 and 30.

Row 14b (DESIGN_INTENT.md Fix list)
- Done: Fixes 1 to 23, 27 and 28, plus Fix 26a.
- Parked for Isa's ruling: Fixes 24 and 25 (both in OWNER_CHECKS_phase4.md under Post launch UI), Fix 12 option B and the body stats hint.
- In progress: Fix 26b in src/app/food/detail.tsx.
  - What it does: use subject.product when it is present, and call lookupBarcodeResult only when it is missing or on Retry. Keep the failed and not-found states.
  - Then: update the found test in src/__tests__/render/barcodeScan.render.test.tsx so the detail render makes no second lookup.
  - Add a Done line under Fix 26 in DESIGN_INTENT.md and a note in Row 14b of PHASE4_ROWS.md.

Key files
- src/lib/food/detailSubject.ts: the barcode subject now has an optional product (BarcodeProduct).
- src/app/food/barcode-scan.tsx
- Other files changed this session:
  - src/app/dashboard/training.tsx, week.tsx and nutrition.tsx
  - src/app/(tabs)/gym.tsx
  - src/app/gym/muscles.tsx and schedule.tsx
  - Snapshot: src/__tests__/render/__snapshots__/detailChrome.render.test.tsx.snap, hand edited.

Decisions
- Snapshots are edited by hand, never with -u. Jest's snapshot diff ignores indentation, so rebuild the entry from a --expand diff and check that removed lines match exactly.
- New strings go in en.json only, and each key goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts. Isa ruled English only, although CLAUDE.md asks for en, es and fr.
- The Gym streak strip counts the current calendar month through useGymMonth(today) and monthView, so the same month is read twice. It is marked with a ponytail comment.
- The force exit was fixed in the goalsPlan and preferencesFood tests: held requests are answered in afterEach.

Gotchas
- Gym is src/app/(tabs)/gym.tsx, Nutrition is src/app/dashboard/nutrition.tsx and the food screens are under src/app/food/.
- Mock LoadingSkeleton in render tests. To fake no history, use jest.spyOn(router, 'canGoBack'), not replaceProperty.
- Pin dates with jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }).
- A fetch mock that never resolves leaks the API client's 15 second timer.

Problems spotted, not fixed
- In productionReadiness.test.ts, the scan upload test leaves a 4 second timer pending.
- nutrition.todayAgainstTargets and nutrition.percentOfTarget are unused in all three locales.
- The Week screen's "No net yet" copy says "in onboarding".
- gym.freeze.confirm says "1 freezes".
- dashboard.weekPickedNet, dashboard.weekPickedNoNet and nutrition.weekGramsTitle are English only.
- The PHASE4_ROWS.md round log stops at Round 61.
- DESIGN_INTENT.md has two Fix 20 Done lines that say the same thing.