Handover: Lume Phase 4, branch loop/phase4 (Rounds 157 to 171)

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- Last checks: type check 0 errors. Jest 350 of 350 suites and 2,190 tests (Round 167). Round 163 ran with --detectOpenHandles and found no open handles. Go race tests: 39 packages ok.
- Run Jest as perl -e 'alarm N; exec @ARGV' npx jest --ci <full paths> > /tmp/... Never use -u or Prettier --write.
- Go TestPG tests need LUME_TEST_DATABASE_URL=postgres://localhost:5432/lume_test_local?sslmode=disable, set on the command line only and never written to a file.

Rows
- BUILT (17): 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 12b, 13, 14, 29. The "17 of 39" tally is correct.
- PARTIAL: 6b, 7, 8, 9, 14a, 14b, 31. DIFFERENT: 15 to 28 and 30.

In progress: Row 15, backend test completeness
- Step 1 done: BACKEND_COVERAGE.md.
- Step 2 done: internal/gym went from 49.8 to 77.9 percent, using backend/internal/gym/pg_internal_test.go and schedule_pg_internal_test.go.
- Next: internal/recipes (26.8 percent), then the others on the list in BACKEND_COVERAGE.md.
- Measure all tests with -coverpkg=./internal/<pkg> ./... Plain -cover undercounts, because most tests live in backend/tests/*.

Done in these rounds
- Fix 26b: src/app/food/detail.tsx uses subject.product.
- Fix 29: gym.freeze.confirm is now a plural, confirm_one and confirm_other.
- The 4 second timer in src/__tests__/productionReadiness.test.ts is fixed.
- nutrition.percentOfTarget removed from all three locales.
- Docs cleanup in DESIGN_INTENT.md and PHASE4_ROWS.md.
- verify:go in package.json now requires a local LUME_TEST_DATABASE_URL and uses -count=1.

Decisions
- Override 1 allows English-only strings. Each new key goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Every _one key needs an _other key, so confirm was renamed to confirm_other in en, es and fr.
- verify:go still leaves out ./tests/migrations, because verify:migrations runs it.
- New TestPG tests skip only when the database variable is unset, as all existing ones do.

Waiting on Isa
- New wording for dashboard.weekNoNetMessage and dashboard.energyAddBodyStats. The net is missing only when body stats are missing, so "log food" copy would be wrong.
- Whether to rewrite the assertion at dashboardNutrition.render.test.tsx:102, so todayAgainstTargets can be removed.
- es and fr text for gym.freeze.confirm_one.
- What the measurements "Back" flaw means. Back skipping signup is the intended Row 2b fix, and onboardingSignedInBack.render.test.tsx checks it.
- Whether TestPG tests may skip.
- Whether cmd/server, scripts, tools/* and internal/db count toward 70 percent.
- Fixes 24 and 25, Fix 12 option B and the body stats hint.

Gotchas
- loop/DECISIONS_LOG.md and loop/NOTES_phase4.md are the loop script's files. Never edit them.
- Never touch src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts or ios/.
- Unchecked risk: Back on measurements may misbehave after a resume straight from sign-in (postAuth.ts:28), when preview is not in the history.
- Still barely covered in internal/gym: patchSession, patchExercise, lastLogged and listTemplates.
- Docs should tell developers to export LUME_TEST_DATABASE_URL before running npm run verify.
- The DECISIONS_LOG round numbers (around 678) differ from the PHASE4_ROWS round numbers (around 171).