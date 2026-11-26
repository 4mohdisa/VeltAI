Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first. Run tsc first every round.
- Use only git branch --show-current, unless a round allows read-only git.
- Protected files: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts. foodDetail.test.ts pins router.replace('/food/barcode-scan') in detail.tsx.
- Jest: npx jest --ci with full paths, wrapped in perl -e 'alarm N; exec @ARGV', never -u. Pass several paths through xargs. Never write "verified".
- New strings go in en.json plus the ENGLISH_ONLY list in localeParity.test.ts. Never run Prettier --write on en.json.

Rows (per loop/NOTES_phase4.md; PHASE4_ROWS.md not updated this session)
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10-14, 29.
- PARTIAL: 6b, 7, 8, 9, 14a.
- In progress: Row 14b (DESIGN_INTENT.md Fix list). Fixes 1-13 are done (Fix 12 as option A); each has a Done line. Next is Fix 14, a portion change for saved dishes (detail.tsx:276-309). Last green full suite: Round 109, 340 suites, 2,090 tests.

Fixes this session
- Fix 5 (paywall.tsx): a returning user who resubscribes enters the app on the server record without re-posting. A 401 there ends the session.
- Fix 6 (postAuth.ts): no server record and no answers goes to /onboarding/goal.
- Fix 7 (gym.tsx): the log button shows whenever today has no session.
- Fix 8 (measurements.tsx): Continue copies the units to the settings store.
- Fix 9 (deriveTargets.ts; backend derive.go, pg.go): the macros split from the adjusted calorie target. There is a Postgres test in backend/tests/goals.
- Fix 10 (profile/leaving.tsx): the reason posts as feedback {category 'account', message 'leaving_reason:<key>'}. The note field is removed. Manage subscription is linked.
- Fix 11 (food/history.tsx): a row sets the day and goes back.
- Fix 12 (food.tsx): the calorie card links to Nutrition only for today.
- Fix 13 (custom-food.tsx): fibre is saved; "no matches" passes ?slot and the food is logged.

Decisions
- The Fix 9 backend change stays: it is the same bug on the server, fixed through one shared helper.
- Feedback has no leaving kind: the database check constraint needs a migration.
- Fix 12 option B (a dated Nutrition) is parked for Isa.
- Isa rulings pending: Fix 24 and Fix 25.

Open problems
- Targets reuses an earlier saved calorie target.
- Units are copied only on Continue.
- The Gym tab shows no logged pill once today is logged.
- Welcome shows "Sign in" to a signed-in user with no record.
- A non-401 failure of the paywall record check re-posts the answers.
- Three copies of the Manage subscription open-or-toast code.
- history.tsx isoDaysAgo duplicates isoDate.
- The search-results "Add custom food" link does not log.
- The stale "Barcode, Scan and label scan still open" note in Row 14b of PHASE4_ROWS.md.
- A Jest worker is force-exited at the end of a full run.
- The Terms describe a free tier that does not exist (owner check).