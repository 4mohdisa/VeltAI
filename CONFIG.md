# Lumo — Key & Config Checklist

Adding keys later is this checklist, not a hunt. Both app dev-mode fallbacks
mean the app boots fully navigable in Expo Go with NOTHING set — in a DEV
build. A release build with no Clerk key shows a hard configuration error
instead (no silent auth bypass), and grants no entitlement without a
RevenueCat key.

## App (.env at repo root — see .env.example)

`EXPO_PUBLIC_*` vars are inlined into the JS bundle at build time and are
**public by design** — only publishable keys belong here, never secrets
(enforced by `src/__tests__/secretsPosture.test.ts`). Restart the Expo dev
server after editing.

| Var | Where to get it | Absent ⇒ |
|---|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys (pk_…) | Dev build: local dev auth mode (no ClerkProvider, one warning). Release build: hard config-error screen |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat → Project → API Keys → Apple (appl_…) | Dev build: billing-disabled mode (entitlement = dev flag, default entitled). Release build: not entitled |
| `EXPO_PUBLIC_API_URL` | Your deployed backend origin (https://…) | `http://localhost:8080` (dev only — a release build MUST set this) |

## Backend (backend/.env — see backend/.env.example)

A `backend/.env` file is loaded at startup for dev convenience; real env vars
always win. Production: set real env vars on the host.

| Var | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres connection string | yes |
| `CLERK_SECRET_KEY` | JWKS fetch for JWT verification (sk_…) | yes |
| `CLERK_WEBHOOK_SECRET` | Svix signature check on POST /api/webhooks/clerk (whsec_…) | yes |
| `LUMO_BASE_URL` | Public origin of the API — CORS, OAuth redirects, webhook URLs derive from it | yes (prod) — dev default `http://localhost:8080` |
| `PORT` | Listen port (set automatically by Railway/Fly/Heroku) | no — falls back to LUMO_BASE_URL port, then 8080 |
| `LUMO_TIMEZONE` | Server-side calendar TZ for streak/brief math (IANA) | no — default UTC |
| `REVENUECAT_WEBHOOK_AUTH` | Shared secret for POST /api/webhooks/revenuecat | for billing sync |
| `GEMINI_API_KEY` | Photo/label scan pipeline | scan 503 without |
| `ANTHROPIC_API_KEY` | AI brain / insights / morning brief / query | AI 503 without |
| `USDA_API_KEY` | Food search (DEMO_KEY works, low rate limit) | no |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Strava OAuth import | for Strava |
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | WHOOP OAuth import | for WHOOP |
| `INTEGRATION_ENCRYPTION_KEY` | 32-byte hex key, AES-256-GCM for stored OAuth tokens (`openssl rand -hex 32`) | for integrations |

## Dashboard configuration (no code)

1. **Clerk**: enable Apple + Google SSO and the Email verification code
   strategy. Native API: allowlist the app scheme `veltai://` (the SSO redirect
   derives from app.json `"scheme": "veltai"` — must match).
2. **RevenueCat**: create the products ($8.99/mo, $49.99/yr, 7-day trial), an
   Offering (default), the **`pro` entitlement** (the exact identifier the app
   checks), and design the hosted Paywall for that offering. Set the webhook to
   `<LUMO_BASE_URL>/api/webhooks/revenuecat` with the `REVENUECAT_WEBHOOK_AUTH`
   value as the Authorization header.
3. **App Store Connect**: the same two auto-renewing subscriptions.

## SDK notes

- Neither Clerk nor RevenueCat needs an Expo config plugin; both need a
  **native build** (`expo run:ios` / dev client). Expo Go: Clerk works
  (JS-only); RevenueCat does NOT (native module) — billing-disabled mode covers
  Expo Go.
- app.json has: `scheme: veltai` (OAuth redirects), iOS `bundleIdentifier`,
  `buildNumber`, and all permission usage strings.
