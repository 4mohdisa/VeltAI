Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts.
- English only: new keys go in en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts when es and fr lack them.
- Never write "verified".

Rows
- Built: 1, 2, 2.2, 2b (owner checks pending), 2c, 2d, 3 (owner checks pending), 4, 5, 6, 12, 12b, 29.
- Partial: 6b; 7 (7a wrapper, 7b paywall screen); 8 (banner built, mounted on Today and Profile > Subscription).
- Last full run: tsc 0 errors; Jest 303 of 303 suites, 1,835 tests, 4 snapshots; 68 console.error, 165 console.warn. That run was before 7a, 7b and Row 8, so a full run is due.

In progress: nothing. Next is Row 8, the expired state with Resubscribe on Profile > Subscription.

Files
- src/lib/billing/purchases.ts: the only file that loads react-native-purchases. purchasesSdk() is the accessor.
- src/lib/purchases/revenuecat.ts and types.ts: the 7a wrapper.
- src/app/onboarding/paywall.tsx: the 7b screen, on the wrapper.
- src/components/display/BillingProblemBanner.tsx: reads useServerEntitlement and shows for status past_due.
- Tests: src/__tests__/purchases/revenuecat.test.ts; render tests paywallScreen, billingProblemBanner, todayBillingBanner and subscriptionBillingBanner.

Decisions
- The wrapper builds on the existing billing file, so the SDK has one import point.
- The new paywall replaces the hosted paywall on the onboarding route only. Profile > Subscription and upgradePrompt still use presentPaywall.
- A trial is shown only when the store says the package is eligible. A failed eligibility check means no trial.
- The banner uses the server record (past_due, backend/internal/entitlement/state.go), not the on-device billing_issue state.

Open for Isa (in OWNER_CHECKS_phase4.md)
- es and fr text for the new keys.
- Target weight required.
- Dead end 7 copy.
- Plan-ready summary screen.
- Maestro flow.
- RevenueCat iOS key and StoreKit file.
- Whether the banner should also use the on-device billing_issue state.

Gotchas
- `jest name.render.test.tsx` matches more than one file; pass full paths.
- The render setup's Reanimated mock lacks useReducedMotion, so screens with a skeleton need a per-file LoadingSkeleton mock.
- phase14Regression.test.ts checks targets.tsx source text.
- Lint forbids setState inside an effect body; use a guarded .then.
- /tmp/p4_marker is old, so touch a fresh marker per round.

Not fixed
- onboarding.paywall.seePlans and trialNote are unused.
- On Subscription with past_due, two Manage subscription buttons show.
- entitlementFromApi stores an unknown status as is.
- The body type emoji uses a hardcoded fontSize 26.
- Goals may clamp calories silently through setCustomGoals.
- Today's pull-to-refresh doesn't refetch the subscription state.
- The console.error rise from 67 to 68 is untraced.