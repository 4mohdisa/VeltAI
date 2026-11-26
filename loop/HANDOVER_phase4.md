Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts.
- English only: new keys go in en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Never write "verified".

Rows
- Built: 1, 2, 2.2, 2b (owner checks pending), 2c, 2d, 3 (owner checks pending), 4, 5, 6, 12, 12b, 29.
- Partial: 6b, 7, and 8. Row 8's code is complete; only its simulator flow is open.
- Last full run (round 17): tsc 0 errors; Jest 309 of 309 suites, 1,894 tests, 4 snapshots; 69 console.error, 163 console.warn. Round 24 removed one console.error, so about 68 are expected.

In progress: nothing. Next is a full suite run to confirm the console.error count.

Files
- src/app/profile/subscription.tsx exports EXPIRED and CANCELLED. Expired and cancelled show one Resubscribe that opens /profile/winback through navigate(). Manage subscription is hidden on past_due and expired.
- src/app/profile/winback.tsx shows the store price from getOfferings and offers Resubscribe (to paywallHref(WINBACK_REASON)) or Not now.
- src/lib/nav.ts holds WINBACK_REASON.
- src/app/onboarding/paywall.tsx shows no arrival toast for WINBACK_REASON. REFUSAL_REASONS uses EXPIRED.
- src/components/display/BillingProblemBanner.tsx exports BILLING_ISSUE.
- .maestro/row8_subscription_states.yaml, run with -e STATE=expired, cancelled or past_due. It has not been run.
- Tests in src/__tests__/render: subscription, subscriptionBillingBanner, paywallScreen and paywallOnboardingPost (now has a console.error spy). The winback test is src/__tests__/winbackScreen.render.test.tsx.

Decisions
- Expired goes Subscription, then win back, then paywall, so Resubscribe shows only once.
- A real failed purchase coming from win back still shows the "weren't charged" toast, because it is true.
- The wrapper has no promotional offer API, so win back opens the paywall.
- The win back screen redirects to Subscription for any other state.

Open for Isa (in OWNER_CHECKS_phase4.md)
- Install Maestro.
- Sign-in is an email code, and E2E_EMAIL is not a +clerk_test address.
- The backend uses database lume on 127.0.0.1:55432, not lume_test_local or lume_local.
- Should a cancelled plan show Resubscribe alongside Manage subscription?
- Win back copy, with es and fr text.
- Which package price win back shows.

Gotchas
- Typed routes lack /profile/winback; use navigate().
- To change useLocalSearchParams, spy through jest.requireMock('expo-router'), not import *.
- Render tests can wrap the screen in SafeAreaProvider, so toJSON() is not null even when the screen renders nothing.
- Go entitlement tests need LUME_TEST_DATABASE_URL pointed at local lume_test_local.

Not fixed
- The paywall imports constants from a profile route file; a src/lib module would be cleaner.
- paywallSessionExpired prints an unscoped devWarn.
- onboarding.paywall.seePlans and trialNote are unused.
- entitlementFromApi stores an unknown status as is.
- Today's pull-to-refresh doesn't refetch the subscription state.