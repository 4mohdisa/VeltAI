Handover: Lume Phase 4, branch loop/phase4

Setup
Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first. Run no git commands except git branch --show-current; the loop script commits. Never use 127.0.0.1:55432, and never print LUME_TEST_DATABASE_URL. For database runs, set the variable inside the command only, pointing at localhost:5432/lume_test_local. Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/ or the api.ts listSessions defaults.

Rows
- BUILT: 1, 12, 12b and 29.
- PARTIAL: row 2. Items 2.1 to 2.4 are done. Item 2.5 (removing goals.saved) is parked until Isa allows a change to goalsReset.toast.render.test.tsx line 44.
- Not started: 2b, 2c and 2d.
- Nothing is in progress.

Verify gate (package.json)
The chain runs: tsc --noEmit, lint (expo lint src scripts) with --max-warnings 0, jest --ci, verify:go (go test -race), verify:migrations, secrets:scan, check:manifest. Last run, round 183, exited 0:
- tsc: 0 errors.
- Lint: 0 errors, 0 warnings.
- Jest: 260 suites, 1,534 tests.
- Go: 34 packages ok.
- TestPG: 27 of 27 passed.
- Migrations: 18 applied.
- Secrets scan: 0 findings.
- Manifest check: OK.

Key files
- scripts/secrets-scan.mjs and scripts/checkPrivacyManifest.js
- backend/tests/migrations/migrations_apply_pg_test.go and supabase_shims.sql
- .github/workflows/verify.yml (local only, never run on GitHub)
- app.json (ios.privacyManifests, plugin opt-outs and locales) and src/lib/i18n/infoPlist/{es,fr}.json
- PRIVACY_DATA.md (iOS privacy manifest section)
- Tests: src/__tests__/{secretsScan,privacyManifest,localeParity}.test.ts and src/__tests__/render/goals.states.render.test.tsx
- Records: BASELINE_phase4.md, PHASE4_ROWS.md, OWNER_CHECKS_phase4.md (append only) and DECISIONS.md (Privacy section)

Decisions and why
- The privacy manifest lives in app.json, because /ios is git-ignored prebuild output.
- Face ID and Motion prompts were removed through plugin options, because the app uses neither.
- The lazy PostHog require is allowed by a lint rule option scoped to src/lib/analyticsSink.ts, not by an eslint-disable comment.
- The secrets scan uses a placeholder heuristic rather than an ignore list. It is marked with a ponytail comment.
- The migration check runs against a throwaway lume_test_migrate_* database and refuses any non-local target.

Open for Isa
- Push loop/phase4 and confirm CI passes on GitHub.
- Answer the App Store privacy label, including how to declare account data (email, name, user ID).
- Review the es and fr camera wording and choose between the two camera strings.
- Allow the test change for goals.saved.
- Decide the es and fr language picker question, since the app is fixed to English.

Problems spotted but not fixed
- The migration apply test runs twice per verify when the variable is set.
- Two camera strings exist (infoPlist and the expo-camera plugin), and the plugin text wins.
- The local ios/ prebuild output is stale.
- consent.ts and purchases.ts still use eslint-disable for the require rule.
- preflight.mjs exits 1 on this machine.
- Root config files are not linted.
- Jest output is noisy.
- Every screen test has to mock Skeleton because of the Reanimated test mock.
- The Goals targets-card placeholder height of 360 is unchecked on a device.

Recommended next
Remove the duplicate migration test run, then 2b.