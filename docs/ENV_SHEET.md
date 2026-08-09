# Environment sheet — fill in the blanks

One page. Every variable the code actually reads, where it comes from, and which
side needs it. Fill the `___` boxes, then run the commands.

Verified against the source on 2026-08-09 by enumerating every `config.Env`,
`os.Getenv` and `process.env.EXPO_PUBLIC_*` read in the repo — not from memory.
CLI syntax checked against the installed **eas-cli 21.7.0**, not the docs.

Three places hold configuration, and they are not interchangeable:

| Where | Holds | Reaches |
|---|---|---|
| **EAS environment `preview`** | the three `EXPO_PUBLIC_*` values | the TestFlight build |
| **`eas.json` profile `env`** | `EXPO_PUBLIC_DEBUG_CAPTURE` only | the build, and **overrides** an EAS server variable of the same name |
| **Backend host** (Railway/Fly/…) | everything else | the API process only — never the app |

`EXPO_PUBLIC_*` is inlined into the JS bundle and is **public by design**. Only
publishable keys go there. A secret in an `EXPO_PUBLIC_*` variable is shipped to
every device.

---

## A. App — EAS `preview` environment

| Variable | Where to get it | Fill in |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | your deployed backend origin, `https://…`, no trailing slash | `___` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → **test instance** → API Keys → Publishable key (`pk_test_…`) | `___` |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat → Project → API Keys → Apple (`appl_…`) | `___` |

Preflight **fails a `pk_live_` key** here: this build is meant to be the test
instance.

```bash
eas env:set --environment preview --name EXPO_PUBLIC_API_URL               --value "___" --visibility plaintext
eas env:set --environment preview --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "___" --visibility plaintext
eas env:set --environment preview --name EXPO_PUBLIC_REVENUECAT_IOS_KEY    --value "___" --visibility plaintext

eas env:list --environment preview        # confirm all three, before spending a build
```

`--visibility plaintext` is deliberate: these are inlined into the bundle
anyway, and `sensitive`/`secret` would only hide them from you, not from a
device. Add `--non-interactive` in CI.

**Do not set `EXPO_PUBLIC_DEBUG_CAPTURE` here.** It comes from the `testflight`
profile's own `env` block in `eas.json`, and a profile `env` overrides an EAS
server variable of the same name — storing it server-side in `production` would
apply it to the production build.

`eas build` has **no `--environment` flag**; the environment comes from the
profile's `environment` field. Every profile in `eas.json` now pins it
explicitly, and `testflight` is pinned to `preview`.

### Optional app tuning (defaults are fine; all `EXPO_PUBLIC_*`)

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `15000` | request timeout |
| `EXPO_PUBLIC_API_UPLOAD_TIMEOUT_MS` | longer | scan uploads |
| `EXPO_PUBLIC_API_TOKEN_TIMEOUT_MS` | — | bound on token fetch |
| `EXPO_PUBLIC_API_RETRIES` | GET only | retry count |
| `EXPO_PUBLIC_GIT_SHA` | from `app.config.js` | only for non-EAS CI |

---

## B. Backend — host environment

Never in EAS, never `EXPO_PUBLIC_*`. A `backend/.env` is loaded at startup for
local dev (relative path — the process CWD must be `backend/`); real environment
variables always win.

### Required — the server refuses to start without these

| Variable | Where to get it | Fill in |
|---|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → pooler URL, `sslmode=require` | `___` |
| `CLERK_SECRET_KEY` | Clerk → **test instance** → API Keys → Secret key (`sk_test_…`) | `___` |

`config.Validate()` classifies both as fatal and `main()` calls `log.Fatal` —
`os.Exit(1)`, before the DB connect and before any route is registered. There is
no degraded mode. Pinned by `backend/tests/config`.

Note the check is **emptiness only**: `CLERK_SECRET_KEY=garbage` starts fine and
fails later as a JWKS 401 on the first request.

### Strongly recommended — warn-only, so an unset value fails open

| Variable | Where to get it | Fill in |
|---|---|---|
| `LUME_BASE_URL` | public origin of this API — CORS, OAuth redirects and webhook URLs derive from it. Fatal in production if left at localhost | `___` |
| `CLERK_ISSUER` | Clerk → API Keys → Frontend API URL, e.g. `https://<instance>.clerk.accounts.dev` | `___` |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → your endpoint → Signing Secret (`whsec_…`) | `___` |

`CLERK_ISSUER` is the check that stops a Clerk JWT-template token minted for a
*different* service from authenticating here as a session. It only warns, and
only in production — so nothing stops you shipping without it. Set it.
(It was missing from `backend/.env.example` until 2026-08-09; a test now fails
if any variable `Validate()` checks is absent from that file.)

`CLERK_WEBHOOK_SECRET` unset ⇒ `POST /api/webhooks/clerk` returns **503** and
Clerk retries; profile email and name never populate.

### Feature keys — absent ⇒ those endpoints 503, the rest keeps working

| Variable | Where to get it | Fill in |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio — **set a billing cap** | `___` |
| `ANTHROPIC_API_KEY` | Anthropic Console — **set a billing cap** | `___` |
| `REVENUECAT_WEBHOOK_AUTH` | value you choose; paste the same into the RevenueCat webhook Authorization header | `___` |
| `USDA_API_KEY` | FoodData Central; `DEMO_KEY` works at low rate limits | `DEMO_KEY` |
| `INTEGRATION_ENCRYPTION_KEY` | `openssl rand -base64 32` — exactly 32 bytes, AES-256-GCM for stored OAuth tokens | `___` |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Strava API app | `___` |
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | WHOOP developer app | `___` |
| `REVENUECAT_WEBHOOK_AUTH_PREVIOUS` | only during a webhook secret rotation | — |

### Deployment / tuning — defaults are fine

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8080` | Railway/Fly/Heroku set this automatically |
| `LUME_ENV` | — | `production` turns the production-only warnings on |
| `LUME_TIMEZONE` | `UTC` | IANA name; server calendar for streaks and the morning brief |
| `LUME_APP_SCHEME` | `lume` | must equal `app.json` `expo.scheme`; pinned by a test |
| `LUME_RATE_READ_PER_MIN` | `—` | per-user read bucket |
| `LUME_RATE_WRITE_PER_MIN` | `120` | per-user write bucket — **analytics flushes share this** |
| `LUME_RATE_AI_PER_MIN` | — | per-user AI bucket |
| `LUME_FREE_SCANS_PER_DAY` | — | free-tier scan allowance |
| `LUME_GATING_ENABLED` | — | entitlement gating master switch |
| `LUME_SCAN_CONCURRENCY`, `LUME_SCAN_TIMEOUT_SEC`, `LUME_MAX_IMAGE_PIXELS`, `LUME_MAX_QUESTION_CHARS`, `LUME_SUB_DEFAULT_TTL_HOURS` | — | bounds; see `internal/config` |
| `DEMO_ACCOUNT_PASSWORD` | — | `scripts/seed_demo_account.go` only, never production |

Any `LUME_*` variable is still honoured under its old `LUMO_*` name, with a
one-time deprecation warning. The new name wins.

---

## C. Dashboards — the parts no command can set

| Where | What | Done |
|---|---|---|
| Clerk | add **`lume`** to allowed redirect schemes — `@clerk/clerk-expo` derives the SSO return URL from `app.json` `expo.scheme`, and no code asserts the dashboard matches | ☐ |
| Clerk | enable Apple SSO, Google SSO, and email-code (OTP) | ☐ |
| Clerk | webhook endpoint → `https://<your-api>/api/webhooks/clerk`, events `user.created`, `user.updated`, `user.deleted` | ☐ |
| RevenueCat | entitlement id **`pro`**, one product, default Offering **with a designed paywall**, 7-day trial | ☐ |
| RevenueCat | webhook Authorization header = `REVENUECAT_WEBHOOK_AUTH` | ☐ |
| Google AI Studio | billing cap on the Gemini key | ☐ |
| Anthropic | billing cap on the API key | ☐ |
| App Store Connect | app record `fit.lume.app`, API key (.p8) into the `eas.json` submit block, sandbox testers, age rating, Regulated Medical Device declaration | ☐ |

---

## D. Verify

```bash
npm run preflight        # app side: the three EXPO_PUBLIC_* values, eas.json profiles, assets
DATABASE_URL="…" ./deploy/migrate.sh verify   # expects: database matches the migrations on disk
curl -s https://<your-api>/health | jq        # revision == git rev-parse HEAD, dirty == false
```

Preflight **skips** the database, `/health` and Clerk checks unless the matching
variable is set, and says so — a skip has verified nothing. Set `DATABASE_URL`
and `EXPO_PUBLIC_API_URL` in the shell before trusting a green run.

## Command reference

`eas env:create` is deprecated (the CLI says so). `eas secret:*` still exists
and is not labelled deprecated, but it predates environments and has **no
`--environment` flag**, so it cannot target `preview`. Use `eas env:set`.

```bash
eas env:list --environment preview            # what is set
eas env:get --environment preview --name NAME # one value
eas env:pull --environment preview            # write them to .env.local
eas env:delete --environment preview --name NAME
```
