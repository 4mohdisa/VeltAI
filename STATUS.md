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

**Free vs Pro (server-enforced, `backend/internal/entitlement`):** FREE =
manual/search/barcode logging, all gym features, your own data, dashboards,
energy balance, export, account management and deletion, plus
`LUMO_FREE_SCANS_PER_DAY` (default 3) AI scans a day. PRO = unlimited AI scans,
AI insights / morning brief / Ask-Lumo / brain rebuild, and the Strava + WHOOP
integrations. Enforced by one policy table wrapping the authed mux, returning
402 with an upgrade payload that the client turns into the paywall.

**Stubbed / deliberately absent:** Apple Health (the fake UI was removed in the
Phase 14 audit — the guarded no-op seam `src/lib/health/appleHealth.ts` is
where a real native module lands); voice meal logging (removed — it was a
simulation).

**Blocked on services/humans:** live auth (no Clerk keys), real purchases (no
RevenueCat keys/products), Strava/WHOOP (no registered apps), submission itself
(Apple Developer account in compliance screening). The backend is not deployed,
but is now deployment-READY: [DEPLOY.md](DEPLOY.md) is the ordered runbook and
[DEPLOYMENT_SECURITY.md](DEPLOYMENT_SECURITY.md) the hardening checklist, with
the Dockerfile, compose, nginx config, systemd unit and migration runner all in
the repo.

**Verification baseline** (must stay green): backend `go build ./... && go vet
./... && gofmt -l . && go test ./... -count=1` → 29 packages, race-clean; app
`npx tsc --noEmit && npm run lint && npm test` → clean, 0 errors, 344 tests;
`cd web && npm run build` → static export clean.

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
3. **Deploy the backend** — follow [DEPLOY.md](DEPLOY.md) end to end (server
   hardening, Docker, env file, backup, migrations, nginx + TLS, smoke tests).
   Apply all **12** migrations with `./deploy/migrate.sh apply`; note the new
   `20260729000001_shared_runtime_state` must land BEFORE the new binary starts
   or every `/api/` request fails closed with 503.
4. **Set the keys and dashboards**: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_API_URL` in the app; Clerk
   (Apple + Google SSO, email-code strategy, `veltai://` allowlist) and
   RevenueCat (products, default Offering, **`pro`** entitlement, hosted
   paywall design, webhook) per CONFIG.md.
5. **Set the RevenueCat dashboard to a 7-day trial** to match the app. The
   code now derives every trial mention from one constant (`TRIAL_DAYS`), so
   the only remaining mismatch risk is the dashboard itself. (The Notion plan
   said 14 days; the repo's 7 was chosen — see DECISIONS.md.)
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
| Low | The morning-brief cache and the scan-concurrency semaphore remain per-process. Worst case with N instances: N paid brief calls per user per day instead of 1 (the semaphore being per-box is correct — it bounds a box's resources). |
| Medium | RevenueCat's webhook auth is a **static bearer header**, not an HMAC over the body — anyone who captures it can forge events. The replay/ordering guards contain blind replay, not a leaked secret. Rotate it if it is ever exposed. |
| Low | `gym_exercises` has no `idempotency_key`, so an offline-queued exercise step whose response was lost can duplicate that exercise row on retry. The **session** is exactly-once regardless. Needs a migration. |
| Low | The Food-tab anomaly banner fetches `GET /api/ai/insights` before AI consent. Verified harmless (that handler is a pure DB read and never calls Anthropic), and locked by a test that fails the day it starts generating. |
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
