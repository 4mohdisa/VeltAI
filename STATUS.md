# Lumo — Status

_Last updated 2026-07-28. This file replaces every phase/audit report. Keep it
current; delete nothing else into it._

## What Lumo is

Lumo is an iOS food and fitness tracker: you log meals by photo, barcode,
nutrition label, search or quick-add, and log gym sessions with real exercise
parameters. The backend computes calories honestly — ACSM metabolic equations
for cardio, MET fallback elsewhere — and reconciles calories in against BMR
plus exercise for a daily and weekly energy balance. AI writes the wording of
insights and the morning brief; it never does arithmetic that matters.

## Current state

**Works (verified in code, test-covered):** onboarding → targets → paywall
flow; food logging (manual, search, barcode, label scan, photo scan incl.
multi-angle reconciliation, quick add, saved meals, recipes, corrections,
portion memory); gym (library, templates, weekly schedule, today's workout,
check-in, parameter capture, ACSM calorie math, progress, streaks + freeze,
muscle chart); energy balance daily/weekly; AI insights, morning brief and
Ask-Lumo; first-party analytics with a persistent opt-out; account deletion
(Clerk identity + cascading data delete); data export; offline queue with
idempotency; Strava/WHOOP import logic incl. cross-source dedupe.

**Stubbed / deliberately absent:** Apple Health (the fake UI was removed in the
Phase 14 audit — the guarded no-op seam `src/lib/health/appleHealth.ts` is
where a real native module lands); voice meal logging (removed — it was a
simulation); no feature is gated behind the `pro` entitlement yet.

**Blocked on services/humans:** live auth (no Clerk keys), real purchases (no
RevenueCat keys/products), device use of the API (backend not deployed),
Strava/WHOOP (no registered apps), submission itself (Apple Developer account
in compliance screening).

**Verification baseline** (must stay green): backend `go build ./... && go vet
./... && gofmt -l . && go test ./... -count=1` → 24 packages, race-clean; app
`npx tsc --noEmit && npx eslint src/ && npx jest` → clean, 0 errors, 317 tests;
`cd web && npm run build` → static export clean. Route coverage 84/84.

## Remaining human actions (ordered)

1. **Decide the name: Veltai or Lumo.** One identity across `app.json`
   (name/slug/scheme/bundle id), the Clerk scheme allowlist, store metadata,
   and the support email (`lumofit@gmail.com` currently matches neither).
2. **Stand up the domain.** `veltai.app` is NXDOMAIN and `lumo.fit` is
   unregistered; the built `/web` site already has /support, /privacy, /terms,
   /faq ready to deploy. Until a domain resolves, the store's Support URL is a
   dead link and blocks submission. After it exists, re-add the in-app FAQ and
   third-party-licenses rows that were removed for pointing at a dead domain,
   and set `NEXT_PUBLIC_SITE_URL` at build time.
3. **Deploy the backend** (`cd backend && go build -o server ./cmd/server`, run
   with env per CONFIG.md, TLS terminated by the platform) and **apply all 11
   migrations** (`supabase db push`).
4. **Set the keys and dashboards**: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_API_URL` in the app; Clerk
   (Apple + Google SSO, email-code strategy, `veltai://` allowlist) and
   RevenueCat (products, default Offering, **`pro`** entitlement, hosted
   paywall design, webhook) per CONFIG.md.
5. **Decide what Pro actually gates.** `useEntitlement` works and is consumed,
   but no feature is gated — selling an auto-renewing subscription that
   unlocks nothing risks rejection under 3.1.2(a) (ongoing value) and 2.3.1.
   Either gate features before submission or rewrite the paywall promise.
6. **Decide the trial length.** CONFIG.md and the store metadata say **7-day**;
   the Notion plan says **14-day**. RevenueCat's configuration is the source of
   truth at purchase time — pick one and make all three agree.
7. **Create and seed the demo account**: create the review user in Clerk, then
   `go run backend/scripts/seed_demo_account.go -user <clerk_id>`; put the
   credentials in App Store Connect → App Review notes.
8. **Native build + TestFlight**: `npm run ios`; first live Clerk sign-in,
   first sandbox purchase and restore, Dynamic Type spot-check at accessibility
   sizes, and verify the generated Info.plist carries **only** the camera usage
   string.
9. **Store listing**: screenshots from the real app (no voice/Apple Health
   shots — those features don't exist), App Privacy answers, and the Terms of
   Use link in App Store Connect metadata.
10. **Pick a license.** `LICENSE` is Expo scaffolding boilerplate (MIT,
    © 650 Industries) and does not license this codebase; the default today is
    all rights reserved. Owner's call before any open-sourcing.
11. Optional: create the GA4 property and set `NEXT_PUBLIC_GA_ID` for the site;
    replace the site's "Coming soon" chips with the real App Store badge once
    live (grep `chip--soon`).

## Known open issues

| Severity | Issue |
|---|---|
| High | No feature is gated behind the `pro` entitlement (see human action 5). |
| Medium | Cross-source workout dedupe is a date+type+duration(±10min) heuristic because `gym_sessions` stores no start timestamp — two genuinely distinct same-type, similar-length sessions on one day from different sources will merge. Add a start timestamp to upgrade. |
| Medium | Apple Health is not implemented. When it lands, reads **must** filter out samples Lumo itself wrote, or dietary-energy write-back creates a feedback loop. Needs a native module, the `com.apple.developer.healthkit` entitlement, a native rebuild, and privacy-policy/label updates. |
| Medium | `LICENSE` is boilerplate (see human action 10). |
| Medium | **`src/__tests__/scanSeam.test.ts` is flaky under machine load** — its 4 `startMultiPhotoScan` cases fail with `ReferenceError: setTimeout is not defined` (jest tears the environment down while the seam's promise chains are still running). Reproduces ~100% when the Go or web build runs concurrently, ~10% otherwise, and reproduces on commit `0470936`, so it predates the audit and cleanup passes. Worth diagnosing properly: the fix is either test hygiene (await the chains instead of `flush()`) **or** a real dangling promise in the multi-photo fallback path — establish which before patching the test. |
| Low | Exercise `effort`/`energy` are captured in the app but absent from the backend session schema — device-local only until a migration adds them. |
| Low | `GET /api/ai/anomalies` and its dismiss route are called by the client but not registered server-side; both are `.catch`-ed to empty/no-op so the banner simply never appears. Intentional. |
| Low | 49 npm advisories, all dev-time tooling transitives (eslint/jest/metro chains) — none ship in the app bundle. Clear on the next Expo SDK upgrade. |
| Low | The OAuth CSRF state store is in-memory with a 10-minute TTL; a restart drops pending connects (user retries). Move to the DB only if the backend goes multi-instance. |
| Low | App version/build are hardcoded `1.0.0` / `1` in the About and Support screens — accurate now, will go stale at the first bump. |
| Low | Three add-menu cards use literal English strings rather than i18n keys (app ships English-only for v1). |

## Unverified

- **Notion (now read, 2026-07-28)**: `App Store Readiness` and
  `iOS — App Store & Design Docs` in the Lume.fit workspace. It is a **June
  2026 plan, not a record of what shipped**, and diverges from the codebase in
  ways worth knowing: it specifies a 14-day trial (repo says 7), a **soft**
  delete with a 7-day grace period (the shipped implementation is an immediate
  hard delete — the safer posture under 5.1.1(v), and the in-app copy now says
  so), `DELETE /api/account` (shipped route is `DELETE /api/profile`), and it
  assumes Sentry, `react-native-health`, Speech-framework voice entry, Face ID,
  push notifications and Open Food Facts — none of which are in the build. Its
  Tier 9 pre-submission checklist and Tier 2 privacy-manifest note are still
  useful; treat the rest as superseded by this file.
- **Applied-migration state in production is unconfirmed.** The connected
  Supabase account does not contain the LumeAI project (`qknwxgaehhclvpeadmdh`),
  so the 11 local migrations could not be diffed against the live database.
  Assume none are applied until someone checks.
- **Nothing has run against live services.** Clerk SSO/OTP, RevenueCat
  purchase/restore, Strava/WHOOP APIs, and the cross-source dedupe SQL against
  a real Postgres are all logic-tested only. Treat the first real signup,
  purchase and sync as genuine tests.
