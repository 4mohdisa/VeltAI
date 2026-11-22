HANDOVER: Lume Phase 3, branch loop/phase3

BUILT ROWS (PHASE3_ROWS.md)
1 Node 22. 2 Baseline gates. 3 Header "+" on My workouts (owner check pending). 4 Empty states audit. No new rows were built this session.

PARTIAL ROWS
5 Seed data: Maestro part needs a seed-user sign-in, which needs Isa.
12 Shared plumbing: every planned item is done. Status stays PARTIAL until a full checkpoint passes and Isa approves BUILT. Done this session:
- All six gymSchedule hooks return isError.
- useApi sets loading while an input change re-fetches, keeping old data.
- useEnergyRange returns isError, true only when both week reads fail.
- api.ai.getInsights rejects with ApiError, and useInsights catches it and returns isError.
- ErrorState and PendingSyncBanner copy now use t() in en, es and fr.

IN PROGRESS
Nothing is half-done. Next step: run the full checkpoint (npx tsc --noEmit, then npx jest). The last full run was 142 suites and 1013 tests; about 16 tests have been added since.

KEY FILES
- src/lib/data/gymSchedule.ts (useApi and the six hooks)
- src/lib/data/energyRange.ts
- src/lib/data/aiBrain.ts
- src/lib/api.ts
- src/components/display/ErrorState.tsx, PendingSyncBanner.tsx
- src/lib/i18n/locales/en.json, es.json, fr.json
- Test helper: src/__tests__/helpers/useApiHarness.ts (readHook, mountHook with rerender)
- Tests: src/__tests__/gymSchedule.*.test.ts, aiBrain.useInsights.test.ts, render/energy.render.test.tsx, render/ErrorState.copy.render.test.tsx, render/PendingSyncBanner.copy.render.test.tsx

DECISIONS
- Fixes go in the shared hook, not per screen.
- useEnergyRange: one failed week still shows real data, so it is not an error. Isa may want to confirm.
- PendingSyncBanner has no props, so it uses one plural key, pendingSync.waiting.
- useApi's loading fix sets state during render (React's adjust-on-prop-change pattern), so the effect has no synchronous setState.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 before every command. No git. No Prettier.
- Only *.render.test.tsx files run under jest-expo with real i18n. Plain .test.ts files run in the node project.
- Jest output piped through grep sometimes prints nothing; use tail instead.
- Known lint errors moved to gymSchedule.ts:50,52; hooks.ts:395 is also still open.

UNFIXED
- No screen reads isError yet (row 14). The Food tab anomaly banner is included.
- These mocks lack isError: useEnergyRange in render/detailChrome.render.test.tsx:79; useInsights in render/insights.render.test.tsx and render/anomaly.render.test.tsx.
- gymSchedule.revalidate.test.ts still has its own harness; mountHook could replace it.
- Out-of-date comments: the gymSchedule.ts and aiBrain.ts headers, and the "French intentionally partial" line in src/lib/i18n/index.ts.
- getMorningBrief and getProfile still swallow real-endpoint failures.
- useEnergyRange has no tests for a failed earlier week or a refetch after an error.
- es.json has two extra keys, addMenu.voice and addMenu.describeOutLoud.
- react-test-renderer is deprecated and warns on every run.
- From the earlier handover: analytics defaults to on (Isa to confirm); goals persistence is parked; seed_demo_account.go has no host guard; old rows mix "lunch" and "Lunch".