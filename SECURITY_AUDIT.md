# Lumo — Security Audit (2026-07-29)

Threat model: (1) a malicious **authenticated** user, (2) an unauthenticated
prober, (3) a malicious or compromised **third party** (provider webhook,
poisoned API response), (4) a **lost or stolen phone**. 64 findings were raised
across `/app`, `/backend`, `/web`, the database and the integrations; each
Critical/High was independently re-verified by a second pass that tried to
refute it, which correctly killed several false alarms.

## Executive summary — what an attacker could and could not do

**Before this pass, the single worst problem was economic, not confidential.**
Authentication was the *only* control on the API. Any user with a valid token —
including a stolen phone with a live session — could hammer the paid endpoints
in a loop: `POST /api/ai/query` accepted a question of unbounded length and
forwarded it verbatim to Anthropic, `POST /api/scan/pipeline` spawned an
unbounded detached goroutine per request and shipped up to 20 MB to Gemini, and
`GET /api/ai/morning-brief` called the LLM on *every* request with no cache. No
rate limit, no quota, no spend ceiling existed anywhere. A single account could
have run up an unbounded bill and taken the service down for everyone. A ~1 MB
PNG declaring 40000×40000 would have OOM-killed the process outright, and a
panic in any per-angle image goroutine would have crashed it (Go's `recover`
only covers its own goroutine, and the only one was on the parent).

**What an attacker could NOT do, then or now:** read, modify or delete another
user's data. Every user-data query is scoped to the id taken from the verified
token and never from request input; the export endpoint binds only the caller;
RLS is enabled on every user table as defence in depth. The IDOR sweep across
every id-taking route and every parent-child relationship found no horizontal
escalation. No secret is reachable from the client bundle, OAuth tokens are
AES-256-GCM at rest and fail closed without a key, and scan images are never
persisted.

**After this pass:** the paid surface is gated (server-side entitlement),
rate-limited per user, quota'd per day, bounded per request, and hardened
against decompression bombs, panics and hostile model output. The remaining
material risk is operational, not code: keys must be rotated and set, and the
RevenueCat webhook's static bearer secret is only as good as its secrecy.

## Findings

Severity is post-verification. "Refuted" entries are recorded because a future
reader will otherwise re-raise them.

| Sev | Area | Finding | Evidence | Status |
|---|---|---|---|---|
| Critical | Cost abuse | No rate limiting, quota or spend ceiling anywhere; one token = unbounded AI bill | `cmd/server/main.go` middleware chain | **FIXED** — per-user limiter + entitlement gate |
| Critical | Cost abuse | `POST /api/ai/query` forwards an unbounded question to Anthropic | `internal/ai/ai.go:263-287` | **FIXED** — 500-rune cap (env), 400 over |
| Critical | Cost abuse | Unbounded detached goroutine per pipeline request; 202 returned before work starts | `internal/scan/pipeline_handler.go:349` | **FIXED** — semaphore + per-run timeout, 503 when saturated |
| Critical | Untrusted input | Decompression bomb: `image.Decode` with no pixel/dimension cap, then float64-per-pixel | `pipeline/quality.go:29`, `pipeline/geometry.go:35` | **FIXED** — header-only `DecodeConfig` bounds check before decode |
| Critical | Untrusted input | Panic containment: only `recover()` is on the parent goroutine; image work runs in others | `pipeline_handler.go:179`, `pipeline/multi.go:58` | **FIXED** — recover inside every image goroutine |
| Critical | Entitlement | *(refuted)* "no subscription gating" — the auditor missed `internal/entitlement`, added earlier in this same pass | — | Not a finding |
| High | Data protection | Live demo password hardcoded in tracked source | `scripts/seed_demo_account.go:33` | **FIXED** — env-supplied |
| High | Webhooks | Grant with no `expiration_at_ms` ⇒ `expires_at` NULL ⇒ treated as never expires ⇒ permanent free Pro | `internal/subscription/subscription.go:150` | **FIXED** — bounded default TTL; nil now reads inactive |
| High | Webhooks | `TRANSFER` deletes the target user's subscription row from wire-supplied ids, unconditionally | `internal/subscription/subscription.go:108` | **FIXED** — preconditions; no-op on anything inconsistent |
| High | Webhooks | Replay: a captured valid webhook re-grants; an older event downgrades newer state | `internal/subscription/subscription.go` | **FIXED** — event-id dedupe + timestamp monotonicity + 24h age bound |
| High | Untrusted input | Model output written unvalidated: no ranges on weight/calories/macros, no string caps | `pipeline/gemini.go:98-119` | **FIXED** — clamped + truncated, NaN/Inf rejected |
| High | Cost abuse | `GET /api/ai/morning-brief` calls the LLM on every request (insights correctly caches) | `internal/ai/ai.go:251` | **FIXED** — per-user per-day cache |
| High | Cost abuse | No DB statement timeout, no pool bounds | `internal/db/db.go:26` | **FIXED** — pool limits + statement timeout |
| Medium | Untrusted input | `POST /api/scan/correction` takes unbounded floats that feed a **global** calibration table — one user can skew every user's confidence bands | `internal/scan/scan.go:594` | **FIXED** — bounded + validated |
| Medium | AuthN | Issuer/audience never checked; any RS256 token from the same Clerk instance (incl. JWT-template tokens for other services) is accepted as a session | `internal/auth/middleware.go:69` | **FIXED** — `CLERK_ISSUER` pinning + non-session `typ` rejected |
| Medium | Operational | Server boots and serves happily with `CLERK_SECRET_KEY` missing: every request 401s behind a green `/health`, with no log line | `cmd/server/main.go:27` | **FIXED** — `config.Validate()` fails fast, warns per degraded feature |
| Medium | Prompt injection | User text (question, food names, per-user context) concatenated into the instruction body | `internal/ai/insights.go` | **FIXED** — delimited `<user_data>` blocks + treat-as-data rule; delimiters stripped from content |
| Low | Operational | `LUMO_BASE_URL` silently defaults to localhost — feeds the CORS allowlist and the OAuth redirect_uri | `internal/config/config.go:39` | **FIXED** — fatal in production |
| Low | Operational | Expo dev origin `localhost:8081` allowed in production CORS | `internal/config/config.go:57` | **FIXED** — dev-only |
| Low | Data protection | `export.go` builds `exported_for` by string concatenation; a quote in a user id emits invalid JSON (not reachable with Clerk ids) | `internal/auth/export.go:86` | Open — cosmetic, one-line fix noted |

## What is already solid (verified, not assumed)

- **Authorization.** Every handler derives identity from `auth.UserID(ctx)`
  only. The IDOR sweep covered every id-taking route *and* every parent-child
  write (exercise→session, ingredient→recipe, template-exercise→template,
  correction→scan session): no path lets user B touch user A's row. `GET
  /api/export` binds `$1` exclusively and reaches child tables through
  user-scoped subselects. `DELETE /api/profile` deletes only the caller.
- **RLS** is enabled on all 33 user tables with owner-only policies keyed on
  the Clerk `sub`. The backend connects as the owner, so RLS is defence in
  depth — the Go query scoping is the primary control, which is the correct
  reading and now stated plainly rather than assumed.
- **Transport of secrets.** No hardcoded key material anywhere (verified by
  grep and by the secrets-posture test); `.env` gitignored and untracked; only
  `EXPO_PUBLIC_*` reaches the bundle.
- **OAuth tokens** are AES-256-GCM with a fresh nonce per encryption; a missing
  key returns 503 rather than ever storing plaintext.
- **Webhook signatures**: Clerk uses svix HMAC-SHA256 with a constant-time
  compare and a ±5-minute window; RevenueCat uses `subtle.ConstantTimeCompare`
  and returns 503 when unconfigured (fails closed). Both verified with
  deliberately-bad-signature tests.
- **On-device**: tokens live in expo-secure-store; there is no AsyncStorage in
  the app at all. A stolen *unlocked* phone exposes the logged-in session (as
  it would for any app) but no keys.
- **Scan images are never persisted** — `scan_images` stores geometry metadata
  only. Analytics events carry scalar tags, never health values or PII, and the
  opt-out genuinely stops sending (buffer discarded, persisted across restarts).
- **The web site** is a static export with no auth, no user data, no secrets
  and no `dangerouslySetInnerHTML`.

## Fixed this pass — each with a regression test

| Fix | Test |
|---|---|
| Per-user rate limiting (ai/write/read classes, env-tunable, 429 + `Retry-After`) | `tests/ratelimit` — N+1 blocked, **two users don't share a bucket**, refill after clock advance, disabled class, 200 concurrent goroutines under `-race` allow exactly the limit |
| Server-side Free/Pro entitlement gate | `tests/entitlement` — policy table pins what is gated *and what must stay free forever*; 402 body drives the paywall; **fail-closed** on store error (503, not 402), on missing identity, and on a misconfigured gate |
| Question length cap | `tests/ai` — 501 runes rejected, 500 passes |
| Morning-brief caching | `tests/ai` — two GETs in a day call the LLM once; a new day calls again |
| Prompt-injection delimiting | `tests/ai` — injection text lands inside the data block; system prompt keeps both the medical guardrail and the treat-as-data rule |
| Image bounds + panic containment + concurrency cap | `tests/scan_pipeline` — header-declared bomb rejected without allocating; a panicking angle degrades to that angle; saturation returns 503 |
| Gemini output clamping | `tests/scan_pipeline` — out-of-range/NaN clamped, oversized strings truncated |
| Webhook: bounded TTL, transfer preconditions, replay + ordering | `tests/subscription` — no indefinite Pro, an unrelated active user can't be wiped, a replay doesn't re-grant, an older event doesn't downgrade |
| JWT issuer pinning + non-session token rejection | `tests/auth` — different issuer rejected, missing issuer rejected while pinned, `typ:m2m` rejected, unpinned still validates signature+expiry |
| Startup validation + production CORS | `tests/config` — missing `CLERK_SECRET_KEY`/`DATABASE_URL` fatal, localhost base URL fatal in prod, localhost absent from prod CORS, garbage env falls back rather than disabling a control |

## Not fixed — and the risk of shipping anyway

1. **Rate-limit and replay state are per-process.** With N instances the
   effective limit is N× and the replay-id set isn't shared. Mitigated by the
   24h event-age bound (which survives restarts) and by the fact that the
   backend is a single instance today. **Risk: low now, real the day it scales.**
   The durable fix is a `last_event_at` column plus compare-and-set in the
   upsert, and a shared limiter store.
2. **RevenueCat's webhook auth is a static bearer header**, not an HMAC over the
   body. Anyone who captures it can forge events. The new guards contain blind
   replay and mis-ordering, not a leaked secret. **Rotation is the only answer.**
3. **Exercise/complete steps are not idempotent server-side** (no
   `idempotency_key` on `gym_exercises`), so a step whose response was lost can
   duplicate an exercise row on retry. The *session* is exactly-once regardless.
   Needs a migration.
4. **`GET /api/ai/insights` is fetched pre-consent** by the Food-tab anomaly
   banner. Verified harmless — that handler is a pure DB read and never calls
   Anthropic — but the comment claiming otherwise was wrong, and it is now
   locked by a test that fails the day that handler starts generating.
5. **No monitoring or alerting exists.** This cannot be built here but is the
   biggest remaining operational gap: nobody would notice an auth-failure spike,
   a 429 flood, a runaway AI spend, or a JWKS misconfiguration.
6. **npm advisories**: 49, all dev-tooling transitives (eslint/jest/metro
   chains), none in the shipped bundle. `govulncheck` clean on the Go module.
   No forced major upgrades — they'd risk more than they'd fix.

## Pre-launch security checklist (only you can do these)

1. **Rotate every credential that has ever been in a chat, a log or this repo's
   history** — especially the demo-account password that was hardcoded until
   today (it remains in git history).
2. Set `CLERK_ISSUER` to your Clerk Frontend API URL so tokens are issuer-pinned
   (the server warns in production without it).
3. Set `LUMO_ENV=production` and `LUMO_BASE_URL=https://…` — the server now
   refuses to start with a localhost base URL in production.
4. Generate `INTEGRATION_ENCRYPTION_KEY` (`openssl rand -hex 32`) and store it
   somewhere you can rotate from. Rotation today means re-authorising every
   integration; document that before you have users.
5. Set the RevenueCat webhook `Authorization` secret to a long random value,
   and treat it as rotatable.
6. Tune the limits for your actual traffic: `LUMO_RATE_AI_PER_MIN` (10),
   `LUMO_FREE_SCANS_PER_DAY` (3), `LUMO_SCAN_CONCURRENCY` (4).
7. Turn on provider-side protections: Supabase network restrictions, Clerk bot
   protection, and **spend caps/billing alerts on both the Gemini and Anthropic
   accounts** — the last line of defence against a cost attack.
8. Add alerting for: auth-failure spikes, 429 rate, 402 rate, AI spend per day,
   and any 5xx from the webhook endpoints.
