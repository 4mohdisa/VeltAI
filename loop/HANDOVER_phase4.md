Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI.
- Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Git: only git branch --show-current; the loop script commits.
- Database runs: set LUME_TEST_DATABASE_URL inline to localhost:5432/lume_test_local. Never print it and never use 127.0.0.1:55432.
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/ or the api.ts listSessions defaults.

Rows
- BUILT: 1, 12, 12b and 29. Row 29: the migration apply test now runs once, in verify:migrations.
- PARTIAL: row 2. Item 2.5 is parked until Isa allows the goals.saved test change.
- In progress: row 2b, status DIFFERENT. Done so far:
  - DESIGN_REFERENCES.md (Mobbin patterns and an audit).
  - 1a: Welcome Sign in link.
  - 1b: signup title follows the mode, Resend code, all signup strings in en, es and fr.
  - 1c: Welcome strings in en, es and fr.
  - 401 handling on the paywall, signup status check and launch gate.
  - Onboarding answers survive an expired session.
  - The launch gate's 401 now ends the Clerk session.
- Not started: 2c and 2d.

Last checkpoint
- tsc: 0 errors.
- Full Jest: 266 suites and 1,564 tests pass.
- npx expo lint src scripts --max-warnings 0: exit 0.

Key files
- src/app/index.tsx (launch gate).
- src/app/onboarding/{index,signup,paywall}.tsx.
- src/lib/auth/{machine,appState,ClerkBridge,signOutSeam,resetRegistry}.ts(x).
- src/lib/i18n/locales/{en,es,fr}.json (sections signup and onboarding).
- Tests in src/__tests__/render: welcome, signupResend, signupAuth401, launchGate401, paywallSessionExpired, onboardingAnswersExpiry.
- Records: PHASE4_ROWS.md, OWNER_CHECKS_phase4.md (append only), BASELINE_phase4.md, DESIGN_REFERENCES.md.

Decisions and why
- One classifier: classifyConnectivity in machine.ts. Its status defaults to error.status, and a 401 returns sessionExpired.
- ClerkBridge sends SESSION_ENDED when Clerk ends a session that the app did not sign out. consumeAppSignOut in signOutSeam tells the two cases apart.
- REFRESH_FAILED and SESSION_ENDED use purgeExpiredSession, which calls resetAllStores({ keepOnboarding: true }). Reason: in-progress answers exist only on the device.
- A deliberate SIGN_OUT and account deletion still wipe everything.
- route:signIn opens /onboarding/signup?mode=signin.
- The legal footer is one sentence key with placeholders. Its hrefs must stay inline, because onboardingLegalRoutes.test.ts scans source lines.
- The es and fr wording is the agent's own translation and is listed for Isa.

Gotchas, not fixed
- Lint the whole folder; a single-file lint missed an error once.
- Reset the i18n language in afterEach, or a locale leaks into later tests.
- Nothing dispatches SIGNED_IN, so the auth machine sits in unknown and its refresh path is mostly unused.
- The signup and paywall 401 routes still open sign-in without ending the Clerk session.
- onboarding.sessionExpired says "finish setting up", which is wrong for users who completed onboarding.
- connectivityMessage is hard-coded English and unused.
- Every onboarding screen after Welcome and signup is still hard-coded English.
- The signup placeholders are literals.
- Simulator checks are pending: the 401 routes and answers surviving expiry.

Recommended next
Apply the SESSION_ENDED dispatch to the 401 branch in signup.tsx continueAfterAuth, then row 2b step 1d (the goal and activity screens' strings).