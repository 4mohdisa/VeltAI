Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- English only. Never write "verified".

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 12, 12b and 29.
- Row 2b moved from DIFFERENT to PARTIAL. Still open: the plan-ready summary (needs Isa's go-ahead) and the Maestro flow, shared with row 23 and not run.
- Last checkpoint: tsc 0 errors; Jest 286 suites and 1,727 tests pass; 4 snapshots pass. Go tests all pass.

Built this session (Row 2b)
- Training days is onboarding step 3. Steps renumbered; src/components/onboarding/OnbScaffold.tsx counts 11.
- Options: src/components/onboarding/trainingDays.ts. Stored only in src/lib/stores/onboarding.ts.
- Goal (Lose, Maintain, Eat healthier, Gain), activity and training days rows are on src/app/profile/goals.tsx.
- savePlan (src/lib/data/mutations.ts) recomputes targets with deriveGoals, then PUT /api/goals. It takes only body metrics from onboarding.
- Goal mapping lives only in src/lib/goals/derive.ts (goalForDerivation, goalTypeOf).
- hydrateGoals applies planFromGoals (src/lib/data/hooks.ts).
- Diet and cuisine are edited on src/app/profile/preferences.tsx.
- New GET and PATCH /api/onboarding/preferences (backend/internal/goals/goals.go, pg.go). They write only user_cuisine_preferences.
- scripts/audit-routes.mjs now reads src/lib/api.ts. Result: 93 of 93 routes consumed; the two "broken" anomaly routes are known and intentional.

In progress
- Nothing open.

Decisions
- Training days stay on the device: there is no backend field.
- Goal and activity edits live on the goals row. The onboarding row keeps the original answers.
- A goal change replaces a calorie target the user set by hand. Isa has not approved this.
- New strings are English only and listed in ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- The API client retries 5xx, so failure tests use 400s.

Gotchas, not fixed
- The mutations.ts and hooks.ts import cycle (parked).
- Food search ranking caches cuisine preferences for 5 minutes.
- Adding a cuisine does not add saved foods for it.
- SettingsList has no disabled style.
- The four-option segment labels may be shrunk on small screens; this needs a device check.
- paywall.tsx:81 casts with "as unknown as Onboarding".
- No test checks the step number shown on screen.
- Running the audit script creates ROUTE_COVERAGE.md at the repo root.
- appState.tsx:119 still waits for Isa.

Open for Isa
- es and fr text for the goals.plan, preferences.food and onboarding.trainingDays keys.
- Whether to add a backend field for training days.
- Whether a goal change may replace a hand-set calorie target.
- The go-ahead for the plan-ready summary screen.
- Whether to commit ROUTE_COVERAGE.md.
- Whether the route audit should run in npm run verify.