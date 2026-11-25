Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- English only. Never write "verified"; use "built" or "checked by a test".
- LUME_TEST_DATABASE_URL is not set in the shell. Set it for a single command, pointing at lume_test_local on localhost:5432, and never print it.

Rows (PHASE4_ROWS.md, progress line "BUILT or EXACT: 8 of 38")
- BUILT: 1, 2, 2.2, 2c (Gemini for insights), 2d (Australia first), 12, 12b, 29.
- PARTIAL: 3 (Sign in with Apple) and 4 (account deletion).
- There is no row 2.5. That work sits inside Row 2's notes.

Built in these sessions
- Row 3:
  - src/components/onboarding/AppleSignInButton.tsx renders nothing on non-iOS.
  - Both signup.tsx branches use it (ClerkSignup and DevSignup).
  - Tests: appleSignInButton, devSignupApple, and signupDevFallback (now set to iOS).
  - Seven owner steps are appended to OWNER_CHECKS_phase4.md.
- Row 4:
  - backend/internal/account/tables.go holds UserTables (29 tables) and tables_test.go checks it against the migrations.
  - pgProfileStore.Delete in internal/auth/profile.go also deletes oauth_states in one statement.
  - internal/auth/profile_delete_test.go has a unit test and a Postgres test.
  - The data export (internal/auth/export.go) now includes oauth_states, with the state column dropped. TestExportCoversEveryAccountUserTable fails if the two lists drift apart.
  - The Settings delete screen (src/app/profile/delete-account.tsx) already matched the spec. It is covered by src/__tests__/render/settingsDeleteAccount.render.test.tsx.
- Last full checkpoint: tsc 0 errors, 280 suites and 1,689 tests pass.

In progress
- Row 4 step 3a is done, but it is not yet recorded in the Row 4 notes.
- tests/regression and tests/migrations read the export list and have not been run since the change. Run them next.

Decisions
- Apple uses the browser flow, oauth_apple through Clerk. The native hook needs expo-apple-authentication, expo-crypto and a native rebuild, so that is left for Isa.
- Apple is hidden on Android. Isa still has to confirm this.
- The oauth_states fix lives in the store, so the webhook's user.deleted path is fixed too. No migration was added.
- The export and deletion lists stay separate, because the export needs custom SQL per table. A test keeps them in step instead.

Open for Isa
- The seven Apple owner steps.
- Native Apple sheet or the browser flow.
- Android hiding.
- The parity rule for English-only strings.
- R249 (needs foodDays.test.ts edits).
- The two Retry tests that haven't been signed off.

Not fixed
- The delete screen's text is written into the file instead of coming from i18n keys, and a 502 shows the server's raw message.
- The deletion Postgres test seeds only 5 of the 29 user tables.
- PHASE4_ROWS.md uses "verified" in the 2.2 and 2b notes.
- Gym history maps up to 200 rows in a ScrollView, and the gym screens refetch every time they open.
- Duplicate keys: gym.monthSessions vs gymCount.sessions.
- The Food tab Retry reloads only the food log.
- Jest output is noisy with "API unreachable" warnings.