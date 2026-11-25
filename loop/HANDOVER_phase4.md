Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- TestPG tests: set LUME_TEST_DATABASE_URL for one command only (localhost:5432, lume_test_local, user from whoami), never print it.
- Never write "verified".

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29.
- Partial: 2b, 3, 5 (5a closed, 5b open), 6b (steps a, b and c built; not yet recorded in the row).
- Last checkpoint: tsc 0 errors; Jest 288 suites and 1,736 tests pass.

Built
- AI consent gate on all 6 AI routes. Scan stores must be able to read consent, and requireScanConsent fails closed.
- backend/internal/entitlement/state.go: StateFor (includes REFUND_REVERSED), Grants and RefusalReason.
- entitlement.go: no free tier. PolicyFor gates every route not on the public list, and the 402 body adds reason.
- Tests: tests/entitlement (13 fixtures, TestPG webhook cases, route coverage test).
- src/lib/api.ts: ApiError.reason; sleep is now exported.
- src/app/onboarding/paywall.tsx:
  - answers save only after GET /api/subscription reports is_active, checked up to 4 times, 1.5 s apart;
  - a dismissed paywall never saves;
  - a restore also saves.
- en.json: two paywall messages rewritten.

In progress
- Nothing open. Next is row 6b step (d), a message for each refusal reason.

Decisions
- Stored status strings are unchanged; refunded is the only new value.
- A billing issue keeps access through the grace period.
- A consent read error stays 500; the choice is in OWNER_CHECKS_phase4.md.
- Revoking an integration stays public, counted as withdrawing consent.
- Analytics, debug reports and the profile routes are gated.

Gotchas, not fixed
- es and fr still describe a free tier (onboarding.paywall.plansUnavailable and storeError), and notConfirmed has no translation.
- src/app/legal/terms.tsx:71 describes a free tier; it is legal copy for Isa.
- A returning user without a subscription goes back to onboarding, because GET /api/onboarding gets 402.
- Dev builds with billing off still save; the backend needs LUME_GATING_ENABLED=false.
- STATUS.md:32 and scanSeam.test.ts:450 describe free scans; TestLabel_WritesSessionRowForQuota keeps its old name.
- The 4 × 1.5 s retry is a guess until a sandbox webhook is timed.

Open for Isa
- es and fr text for the keys above.
- RevenueCat sandbox webhook setup.
- Whether analytics and debug reports stay gated.
- Whether a consent version is needed.