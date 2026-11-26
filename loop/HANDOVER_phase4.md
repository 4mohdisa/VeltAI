Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first. The only allowed git command is git branch --show-current.
- Protected files: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.
- Strings are English only: en.json plus ENGLISH_ONLY in localeParity.test.ts. Never write "verified". Use npx jest --ci with full paths, never -u.
- Last full run (Round 66): tsc 0 errors; Jest 323 of 323 suites, 2,015 tests, 4 snapshots; 68 console.error and 82 console.warn blocks. New tests since then pass.

Rows
- Built this session: Row 10 (notifications, with an owner check list) and Row 13 (store content).
- Row 12: 12a account data is done; the status was already BUILT.
- Partial: Row 11 (health interface and mock provider) and Row 14 (privacy screen, linked from Settings).

Key files
- Notifications: src/lib/notifications/pushToken.ts, src/lib/auth/ClerkBridge.tsx, src/components/forms/Stepper.tsx.
- Health: src/lib/health/types.ts, mockProvider.ts and index.ts.
- Legal: src/app/legal/privacy.tsx, with its copy under legal.privacy in en.json; src/__tests__/legalParity.test.ts.
- Docs: PRIVACY_DATA.md, app.json ios.privacyManifests, APP_STORE_METADATA.md, OWNER_CHECKS_phase4.md.

Decisions
- The push token is stored in secure storage (lume.pushToken) and deleted only after a DELETE succeeds. ClerkBridge re-registers it once per signed-in user, never from runDailySchedule, so there is no 401 at launch.
- Health reads have no denied state, because iOS hides read denial. The status is 'requested' or 'not_determined', and null means not granted or no data.
- privacy.tsx keeps the 15 manifest sections. legalParity reads its headings and body from en.json. The UPDATED date literal stays because the manifest pins it.
- Insights go to Gemini by default; Anthropic is used only when the server runs with LLM_PROVIDER=claude.

Next
- Recommended: move src/app/legal/terms.tsx onto legal.terms keys, the same way as privacy (Row 14).
- After that: the health disclaimer and the paywall subscription terms.

Gotchas, not fixed
- The shared reanimated mock lacks useReducedMotion. Settings render tests need the settingsHelp mocks.
- LegalScreen hardcodes "Last updated" and "PENDING LEGAL REVIEW".
- web/lib/legal.ts lacks the push token, Sentry and PostHog lines.
- Two push token test files exist: src/__tests__/pushToken.test.ts and src/lib/notifications/pushToken.test.ts.
- The push token is re-registered only when a Clerk key is configured. A DELETE after the session ends gets a 401.
- appleHealth.ts is an older second health layer with write types. The real provider needs the native package and the entitlement.
- The quiet hours stepper doesn't wrap past midnight.
- Owner checks pending for Isa:
  - the App Store privacy label;
  - the age rating;
  - the review account;
  - push token retention, and whether DELETE stays public;
  - the HealthKit device check.