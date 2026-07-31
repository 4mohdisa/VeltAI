# First-run checklist

Everything you must set, in order, to take this repo from a clean checkout to a
working app. Each entry says **what breaks if you skip it** and whether the
failure is **loud** (you will see an error) or **silent** (it will look like it
works).

Every variable listed here was found by grepping the source, not by reading a
doc. Command to reproduce the client list:

```bash
grep -rho "process\.env\.EXPO_PUBLIC_[A-Z_]*" src/ | sed 's/.*process.env.//' | sort -u
```

---

## 0. Before anything else — three submission blockers that are not env vars

Run the repo's own asset check:

```bash
npm run check:assets
```

It currently exits 1 with three blockers. **None of them are fixable by setting
an environment variable**, and all three are instant App Store rejections. See
`SUBMISSION_READINESS.md` §3 for the detail. They are not required to *run* the
app locally, only to submit it.

---

## 1. Database

| Variable | Where | Skip it → |
|---|---|---|
| `DATABASE_URL` | backend env | **LOUD.** `config.Validate()` refuses to start: "the server cannot serve any request" (`backend/internal/config/config.go:86`). |

Then apply migrations. Every user table declares `references profiles(id)`, so
the schema must exist before any write:

```bash
ls supabase/migrations/
```

There are 13 migration files, including `20260731000001_ai_consent.sql` added by
this audit. Apply them with your usual Supabase/psql flow (see `DEPLOY.md`).

---

## 2. Authentication (Clerk) — required, nothing works without it

| Variable | Where | Skip it → |
|---|---|---|
| `CLERK_SECRET_KEY` | backend | **LOUD.** Startup refuses: "every authenticated request would fail" (`config.go:90`). Used to fetch the JWKS. |
| `CLERK_ISSUER` | backend | **LOUD in production** (warning at startup, `config.go:97`). Without it tokens are not issuer-pinned, so any Clerk JWT-template token minted for another service is accepted as a session. Set it to your Clerk Frontend API URL. |
| `CLERK_WEBHOOK_SECRET` | backend | **Degraded, and now visible.** `POST /api/webhooks/clerk` returns 503 and Clerk retries. The user's **email and display name never populate**, so the Account screen shows blanks. It is no longer fatal: `auth.EnsureProfile` provisions the `profiles` row from the verified JWT, so writes still work. Before this audit, skipping it meant *every write failed on a foreign key*. |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | app `.env` (repo root) | **LOUD in a release build** — `AuthGate` renders "Configuration error" rather than treating an unauthenticated user as a dev session (`src/app/_layout.tsx`). In a dev build it silently enters keyless dev mode, which is intended. |

Also configure in the Clerk dashboard: Apple and Google SSO, the email-code
strategy, and allowlist the app scheme — see §6.

---

## 3. App → backend

| Variable | Where | Skip it → |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | app `.env` | **LOUD in a release build** as of this audit. Previously silent: the client defaulted to `http://localhost:8080`, every request failed, and `useHydration` swallows failures by design, so you got a plausible-looking but permanently empty app with no way to tell a mis-packaged binary from an outage. `IS_MISCONFIGURED_RELEASE` (`src/lib/api.ts`) now renders a configuration error. Dev builds still default to localhost, which is correct. |
| `LUMO_BASE_URL` | backend | **LOUD in production.** Must be a public `https` origin; CORS and OAuth redirects derive from it (`config.go:94`). |
| `PORT` / `LUMO_ADDR` | backend | Defaults are fine. |

Optional network tuning, all with safe defaults, all silently ignored if unset
or malformed (`src/lib/api.ts`):

| Variable | Default |
|---|---|
| `EXPO_PUBLIC_API_TIMEOUT_MS` | 15000 |
| `EXPO_PUBLIC_API_UPLOAD_TIMEOUT_MS` | 60000 |
| `EXPO_PUBLIC_API_RETRIES` | 2 |

---

## 4. Billing (RevenueCat)

| Variable | Where | Skip it → |
|---|---|---|
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | app `.env` | **Silent, by design in dev; neutral in release.** `isBillingEnabled()` returns false, the hosted paywall reports `unavailable`, and the app remains fully usable. Entitlement fails closed, so nobody gets Pro for free. As of this audit a release build no longer shows the user the string "Billing not configured (dev)". **The app is unsellable without this** — nothing can be purchased. |
| `REVENUECAT_WEBHOOK_AUTH` | backend | **Degraded.** Warned at startup. Without it the server never learns about purchases, so server-side Pro gating refuses everything a subscription would unlock. |
| `REVENUECAT_WEBHOOK_AUTH_PREVIOUS` | backend | Optional. Only needed during a secret rotation (accepts the old value for the overlap window). |

Dashboard side, which no env var can do for you:
- Entitlement identifier must be exactly `pro` (`PRO_ENTITLEMENT`, `src/lib/billing/purchases.ts`).
- The introductory offer must be **7 days**, matching `TRIAL_DAYS`. A mismatch between what the paywall says and what the store charges is a 3.1.2 rejection and a chargeback risk. `src/__tests__/authBilling.test.ts` asserts every in-app surface derives from the constant, but it cannot see your dashboard.

---

## 5. AI features

| Variable | Where | Skip it → |
|---|---|---|
| `GEMINI_API_KEY` | backend | **Loud per-request.** Photo and label scanning return 503; the client surfaces a failed-scan state. Warned at startup. |
| `ANTHROPIC_API_KEY` | backend | **Loud per-request.** Insights, morning brief and Ask Lumo return 503. Warned at startup. |

Note: as of this audit, **no user data reaches either provider without recorded
consent**. `profiles.ai_consent_at` gates the background rebuild sweep and all
three LLM routes, fail-closed. Setting the keys does not by itself start any
send.

---

## 6. Deep links / OAuth returns

| Variable | Where | Skip it → |
|---|---|---|
| `LUMO_APP_SCHEME` | backend | Defaults to `veltai`, matching `app.json`'s `expo.scheme`. **Must equal the app's registered scheme.** Both sides previously hardcoded `lumo://` while the app registered `veltai`, so any OAuth callback that escaped the in-app auth session dead-ended. A test now pins the backend default to `app.json`. |

In the Clerk dashboard, allowlist `veltai://` (or whatever you set `expo.scheme`
to — change both together).

---

## 7. Optional integrations — all silently absent, none required

| Variable | Feature |
|---|---|
| `INTEGRATION_ENCRYPTION_KEY` | Required to store OAuth tokens for the integrations below. Warned at startup; without it the connect flow fails. |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Strava connection |
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | Whoop connection |
| `USDA_API_KEY` | USDA food-search source (barcode/search falls back to other sources) |

---

## 8. Marketing site (`web/`) — independent of the app

| Variable | Skip it → |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs and OG tags point at the wrong origin. Silent. |
| `NEXT_PUBLIC_GA_ID` | Analytics simply off. Silent, and fine. |

---

## 9. Verify

```bash
npm test && npx tsc --noEmit && npx eslint src --ext .ts,.tsx
```

```bash
cd backend && gofmt -l . && go build ./... && go vet ./... && go test ./...
```

```bash
npm run check:assets
```

The first two must pass. The third currently fails — see §0.

---

## What "add my env vars and it works" actually means

**It is true for the backend and for reaching it.** With `DATABASE_URL`,
`CLERK_SECRET_KEY`, `LUMO_BASE_URL`, `EXPO_PUBLIC_API_URL` and
`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set and migrations applied, a user can sign
up, complete onboarding, log food, and have it persist.

**It is not true for submission.** Three blockers in §0 are binary assets and
config, not environment variables, and no amount of key-filling fixes them.

**It is not true for selling anything.** Billing needs a native build (see
`SUBMISSION_READINESS.md` §5), real RevenueCat keys, and App Store Connect
products — none of which exist in this repo and none of which I could verify.
