Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- English only, no es or fr edits. Never write "verified".
- For TestPG, set LUME_TEST_DATABASE_URL for a single command only, pointing at lume_test_local on localhost:5432 with the Mac's own Postgres login (whoami, no password). The `lume` user in backend/.env does not exist locally. Never print the URL.

Rows (PHASE4_ROWS.md, progress line "BUILT or EXACT: 9 of 38")
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 12, 12b, 29. Row 4 (account deletion) became BUILT this session.
- PARTIAL: 3 (Sign in with Apple).

Built this session (Row 4)
- backend/internal/auth/profile_delete_test.go: the Postgres test seeds all 29 account.UserTables plus 5 child tables, counting child rows by parent ids read before the delete. It also has TestClerkUserDeleterTreatsNotFoundAsDeleted (stub http.DefaultTransport).
- src/app/profile/delete-account.tsx: all text in en.json under settings.deleteAccountDetails. Every failure shows plain fallback text. The bold DELETE is rendered with <Trans>. An iOS-only Manage subscription button.
- src/lib/billing/subscriptionLinks.ts: APPLE_SUBSCRIPTIONS_URL and openManageSubscription() (returns false on failure). Used by both delete-account.tsx and profile/subscription.tsx.
- profile/subscription.tsx: Manage subscription shows on iOS only.
- src/__tests__/localeParity.test.ts: ENGLISH_ONLY set with the 18 new keys (Isa override 25 Nov).
- 10 render tests now use `type Locale = typeof es`, because en has English-only keys.
- Last checkpoint: tsc 0 errors, Jest 281 suites and 1,698 tests pass, and all Go gates green. Since then the subscription test went from 6 to 8 tests (that file was run on its own and passes).

In progress
- Nothing open. Suggested next step: move the two inline Platform.OS === 'ios' checks into one export in subscriptionLinks.ts.

Decisions
- The server deletes the Clerk identity first, then the rows. That order is kept on purpose: a Clerk failure returns 502 and keeps the rows. Regression tests in tests/regression/phase14_test.go pin it.
- A Clerk 404 counts as deleted.
- No migration was needed. All five child foreign keys are ON DELETE CASCADE.

Gotchas, not fixed
- OWNER_CHECKS_phase4.md has a parity line that still reads as open, even though the override answers it. The file is append-only.
- The delete screen test has a redundant openURL.mockRestore().
- seedChildRows depends on the exercise_library seed.
- Duplicate keys: gym.monthSessions vs gymCount.sessions.
- The Food tab Retry reloads only the food log.
- Jest output is noisy with "API unreachable" warnings.
- zsh does not split $VAR into words. Use arrays or ${=var}.
- Open for Isa: the seven Apple owner steps, the native Apple sheet, Android hiding for Apple sign-in, R249, and the two Retry tests that haven't been signed off.