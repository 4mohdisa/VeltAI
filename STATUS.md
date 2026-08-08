# Lume — Status

_Last updated 2026-08-06. This file replaces every phase/audit report. Keep it
current; delete nothing else into it. For the current release state see
[RELEASE_PREP.md](RELEASE_PREP.md); for the device test plan see
[FIRST_HOUR.md](FIRST_HOUR.md)._

## What Lume is

Lume is an iOS food and fitness tracker: you log meals by photo, barcode,
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
Ask-Lume; first-party analytics with a persistent opt-out; account deletion
(Clerk identity + cascading data delete); data export; offline queue with
idempotency; Strava/WHOOP import logic incl. cross-source dedupe.

**Free vs Pro (server-enforced, `backend/internal/entitlement`):** FREE =
manual/search/barcode logging, all gym features, your own data, dashboards,
energy balance, export, account management and deletion, plus
`LUME_FREE_SCANS_PER_DAY` (default 3) AI scans a day. PRO = unlimited AI scans,
AI insights / morning brief / Ask-Lume / brain rebuild, and the Strava + WHOOP
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

**Verification baseline** (must stay green — last run 2026-08-06, all green):
backend `go build ./... && go vet ./... && gofmt -l . && go test ./...
-count=1 && go test ./... -race` → **506 tests, 0 skipped**, race-clean —
**set `LUME_TEST_DATABASE_URL` to a migrated local Postgres first**, or the 9
real-Postgres tests (the double-count and gym-500 proofs) SKIP silently and
the run reports green while proving nothing (the old "569 tests" figure was
560 passed + 9 silently skipped); app `npx tsc --noEmit && npx eslint src &&
npm test` → clean, 0 errors, **470 tests / 28 suites**; `cd web && npm run
build` → static export clean; `npm run check:assets` → **exit 0**. There is no
CI: these are enforced by running them. Full findings: [FINAL_AUDIT.md](FINAL_AUDIT.md).

## Remaining human actions (ordered)

_The name and asset blockers are CLOSED — see [RELEASE_PREP.md](RELEASE_PREP.md).
What remains is what only the owner can supply._

1. **Register `lume.fit`.** The rename points every URL at it. The old
   `lumo.fit` is a third party's parked domain and `lume.app` is NXDOMAIN, so
   neither is usable. Set `NEXT_PUBLIC_SITE_URL` at build time; the built `/web`
   site already has /support, /privacy, /terms, /faq ready to deploy. **The App
   Store Support URL must resolve to your own /support page before submission.**
2. **Finish the legal documents with a lawyer.** 17 sections still read "This
   section is being drafted with a legal adviser and is not final", including
   who operates the app. Blocks public release, not TestFlight.
3. **Deploy the backend** — follow [DEPLOY.md](DEPLOY.md) end to end. Apply all
   **15** migrations with `./deploy/migrate.sh apply`; `20260729000001_
   shared_runtime_state` must land BEFORE the new binary starts or every `/api/`
   request fails closed with 503. Note: `20260806000001_debug_reports` was
   BROKEN (uuid=text in its RLS policies) until the 2026-08-06 audit — if you
   ever ran it, it rolled back and the table does not exist; re-run `status`
   and `apply`. `20260806000002_fk_covering_indexes` is new.
4. **Set the keys and dashboards**: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_API_URL` in the app; Clerk
   (Apple + Google SSO, email-code strategy, **`lume://`** allowlist) and
   RevenueCat (products, default Offering, **`pro`** entitlement, hosted paywall
   design, webhook) per CONFIG.md. Backend env vars are `LUME_*`; the old
   `LUMO_*` names now genuinely work with a deprecation warning — the
   compatibility shim was a self-referential no-op until the 2026-08-06 audit
   (it read `LUME_`+suffix), so before that a deployment exporting old names
   silently fell back to defaults.
5. **Set the RevenueCat dashboard to a 7-day trial** to match the app. Every
   trial mention derives from one constant (`TRIAL_DAYS`), so the dashboard is
   the only remaining mismatch risk.
6. **Create and seed the demo account** for App Review: create the user in
   Clerk, then `go run backend/scripts/seed_demo_account.go -user <clerk_id>`;
   put the credentials in App Store Connect → App Review notes.
7. **Run `eas build:configure`** once, then build. Debug-instrumented TestFlight
   build: `eas build --platform ios --profile preview`. Clean production build:
   `--profile production`. **Always `npx expo prebuild --clean -p ios` first.**
   The stale untracked `ios/` tree (Veltai identity, permissions for features
   the app lacks) was deleted in the 2026-08-06 audit; prebuild regenerates it.
   Note for local runs: CocoaPods needs a UTF-8 locale — `LANG=en_US.UTF-8
   LC_ALL=en_US.UTF-8` — or `pod install` dies with a Unicode
   normalization error on this machine's `LANG=""`.
8. **Replace the placeholder icon and splash** before public release. They are
   valid and uploadable but they are not a brand — see `assets/README.md`.
9. **Set a billing cap on the Gemini and Anthropic accounts.** There is no
   global spend cap in the code.
10. **First device session**: work through [FIRST_HOUR.md](FIRST_HOUR.md) in
    order. First live Clerk sign-in, first sandbox purchase and restore, first
    real scan.

## Unverified

- **Notion (now read, 2026-07-28)**: `App Store Readiness` and
  `iOS — App Store & Design Docs` in the lume.fit workspace. It is a **June
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
  Supabase account does not contain the project (`qknwxgaehhclvpeadmdh`), and
  no MCP/DB access existed in the 2026-08-06 audit either, so the **15** local
  migrations have never been diffed against the live database by anyone.
  Assume none are applied until someone checks.
- **The app HAS now run** (iPhone 17 Pro simulator, 2026-08-06): it launches,
  routes, and renders onboarding through the targets screen with the 1.4.1
  disclaimer. That run immediately found a real blocker (see FINAL_AUDIT.md,
  "Found by actually running it"). Everything past onboarding is still
  unexercised — no backend was reachable.
- **Nothing has run against live services.** Clerk SSO/OTP, RevenueCat
  purchase/restore, Strava/WHOOP APIs, and the cross-source dedupe SQL against
  a real Postgres are all logic-tested only. Treat the first real signup,
  purchase and sync as genuine tests.
