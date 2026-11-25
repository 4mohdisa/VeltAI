Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in api.ts, or src/__tests__/foodDays.test.ts.
- Never write "verified". Say "built" or "checked by a test".
- Isa chose English only for now: new strings go in en.json, and any key es and fr lack goes on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29.
- Partial: 2b, 3, 5 (5b open), 6b.
- 6b: steps a to e are built. Only step f is open: es and fr text, which needs Isa.
- Last full run: tsc 0 errors; Jest 289 suites and 1,759 tests pass. That run was before the paywallHref helper and the completed-flag change. Since then only the affected test files have been run, and all pass.

Built this session (row 6b)
- paywall.tsx:
  - shows a message for each refusal reason, via refusalKey and the onboarding.paywall.refusal.* keys;
  - reads a reason route parameter and shows it on open;
  - writes the confirmed subscription into the settings store (setServerEntitlement).
- src/app/index.tsx (the launch gate): always calls GET /api/onboarding, even when the completion flag is set.
  - 402: opens the paywall with the reason.
  - 401: SESSION_ENDED.
  - Network error: tabs if the flag is set, otherwise resume onboarding.
- signup.tsx continueAfterAuth: a 402 opens the paywall.
- src/lib/nav.ts paywallHref(reason?): the only place the paywall link is built.

Tests
- src/__tests__/render/paywallOnboardingPost.render.test.tsx (23)
- launchGate401.render.test.tsx (4)
- launchGate402.render.test.tsx (6)
- signupAuth401.render.test.tsx (4)

Decisions
- GET /api/subscription is public and never returns 402, so the gate checks GET /api/onboarding, which does.
- paywallHref takes an optional reason so a 402 without a reason keeps the plain link.
- A 402 with an unknown or missing reason shows storeError.
- The gate file is src/app/index.tsx. src/app/onboarding/index.tsx is the Welcome screen.

Open for Isa
- Every launch for a returning user now waits on GET /api/onboarding. This is in OWNER_CHECKS_phase4.md.
- A returning user whose onboarding answers aren't on this phone can buy a plan but can't finish setup: the save finds no answers and stops.
- es and fr text for the refusal keys and notConfirmed. Their plansUnavailable and storeError still describe a free tier.

Gotchas
- A 402 while the app is open is not routed to the paywall. This is the recommended next task.
- `grep -rl` matches file contents. Use find to locate files by name.
- Render tests mock @/lib/api without ApiError. Read status and reason by type-only cast, never instanceof.
- paywallHref has no unit test of its own.
- Row 6b has three near-duplicate test-result lines that could be merged.
- The 4 × 1.5 s retry is a guess.
- src/app/legal/terms.tsx:71 still describes a free tier.