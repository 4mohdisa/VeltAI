# Lumo — Security Audit (production-readiness pass, 2026-07-26)

## Executive summary

The codebase is in good security shape for launch. Every secret is read from
env (none hardcoded, `.env` gitignored, a new test enforces that the client
bundle can only ever reference `EXPO_PUBLIC_*` vars); every `/api` route sits
behind RS256-pinned Clerk JWT middleware with the only exceptions being
signature-verified webhooks, the state-token-verified OAuth callback, and
`/health`; every user-data query is scoped to the authenticated Clerk `sub`
and every table now has RLS (one gap fixed in this pass); SQL is parameterized
throughout; request bodies are size-capped; OAuth tokens are AES-256-GCM
encrypted at rest; scan images are never persisted; logging is minimal and
secret-free. Two fixes were applied (RLS on `cuisine_food_library`,
`golang.org/x/text` vuln upgrade). The remaining npm advisories are all in
dev-time tooling, not the shipped bundle. The main launch-time requirements
are operational: serve behind HTTPS (set `LUMO_BASE_URL` to the https origin)
and keep server keys server-side.

## Findings

| Sev | Area | Finding | Status |
|---|---|---|---|
| Med | RLS | `cuisine_food_library` was the only table (of 33) without RLS — writable via PostgREST if the Supabase anon key ever leaks (the app does not ship it) | **Fixed**: migration `20260726000001` enables RLS + authenticated-read policy, mirroring `exercise_library` |
| Med | Deps (Go) | `golang.org/x/text` v0.29.0 — GO-2026-5970 (infinite loop on invalid input), reachable via pgx | **Fixed**: upgraded to v0.39.0, tests green, govulncheck now clean |
| Low | Deps (npm) | 49 advisories (23 mod / 26 high), ALL in dev-time tooling transitives (`brace-expansion` under eslint/jest, `shell-quote`, `postcss`, `uuid` under metro's `jayson`) — none ship in the app bundle | Documented; fixes need semver-major tooling bumps — deliberately not forced. Revisit on the next Expo SDK upgrade |
| Low | Transport | The Go server itself is plain HTTP — TLS must terminate at the platform (Railway/Fly/etc. default). CORS allows `http://localhost:8081` alongside the prod origin | Accept: platform TLS is the standard deployment; set `LUMO_BASE_URL=https://…`. The localhost CORS entry only affects browsers, not the app; harmless but removable later |
| Info | RLS | `confidence_calibration` has RLS enabled but no policy → deny-all for API roles; only the backend (table owner) touches it | Correct fail-closed posture; left as is |
| Info | OAuth state | CSRF state store is in-memory with 10-min TTL — a server restart drops pending OAuth connects (user retries) | Accepted (single-instance deploy); move to the DB if the backend ever scales horizontally |

## What's already solid (verified, with locations)

- **Secrets** — G1: all reads via `config.Env`/`os.Getenv` (14 vars, see CONFIG.md);
  `.gitignore` excludes `.env` everywhere; `src/__tests__/secretsPosture.test.ts` (new)
  fails CI on any non-`EXPO_PUBLIC_` env read, server-secret name, or key-shaped literal
  in client code. Module-wide grep found no hardcoded key material anywhere.
- **AuthN** — G2: `main.go` mounts everything under `/api/` behind
  `auth.Middleware` (`internal/auth/middleware.go`): RS256 pinned via
  `WithValidMethods` (no alg-confusion), `WithExpirationRequired`, JWKS cached 1h with
  30s attempt throttle + stampede protection. Exceptions, each independently protected:
  `/api/webhooks/clerk` (svix HMAC-SHA256, constant-time compare, ±5-min timestamp
  window, 1MB body cap), `/api/webhooks/revenuecat` (`subtle.ConstantTimeCompare`
  against `REVENUECAT_WEBHOOK_AUTH`, 503 when unconfigured — fails closed),
  Strava/WHOOP OAuth callbacks (one-time consumed state token, 10-min TTL, issued to
  the authenticated user), `/health` (static).
- **AuthZ** — G3: handlers derive identity exclusively from `auth.UserID(ctx)` (set by
  the middleware, never from the request body); user-data queries filter on it; RLS now
  enabled on 33/33 tables with owner-only policies keyed on the Clerk `sub` claim
  (libraries: authenticated-read). Foreign-resource access returns 404 in the store
  layer (covered by the hermetic suites).
- **Input** — G4: all SQL through pgx bound parameters (`$1…`); the single string-built
  query concatenates a `const` column list, not input. Global JSON body cap 20MB
  (`httpx`), scan images capped at 24MB with a mapped 413, webhooks 1MB. Request bodies
  decode through a shared strict envelope.
- **Tokens** — G5: Clerk session tokens live in expo-secure-store (the app has no
  AsyncStorage at all); integration OAuth tokens are AES-256-GCM at rest (fresh random
  nonce per encryption, base64 32-byte key from `INTEGRATION_ENCRYPTION_KEY`; missing
  key ⇒ 503, never plaintext).
- **Data & privacy** — G6: scan photos are processed in memory and sent to Gemini;
  `scan_images` stores only angle/quality/geometry metadata — **no image bytes are
  persisted**. PII at rest is limited to profile email/body stats, protected by RLS +
  the account-deletion cascade (every `profiles(id)` reference is `ON DELETE CASCADE`,
  enforced by a migration-parse test).
- **Logging** — G8: the backend logs 5 operational lines (startup, seed failures,
  cipher misconfig, sweep errors) — no tokens, no request bodies, no PII. There is no
  server-side prompt/LLM persistence (no `llm_calls` table); AI keys are set on
  clients, never logged.
- **Client posture** — Phase F: a release build with no Clerk key shows a hard
  configuration error (never a silent dev session); a release build with no RevenueCat
  key grants no entitlement.

## Prioritized pre/post-launch list

1. **Before launch (operational):** deploy behind platform TLS and set
   `LUMO_BASE_URL=https://…` — everything (CORS, OAuth redirects, webhook URLs)
   derives from it. Set all backend env vars per CONFIG.md.
2. **Before launch:** `supabase db push` so the new RLS migration (and the two
   Phase-12/13 migrations) apply to prod.
3. **Shortly after launch:** bump dev tooling (eslint/jest lines) on the next Expo SDK
   upgrade to clear the npm advisories; remove the `localhost:8081` CORS entry.
4. **If ever multi-instance:** move the OAuth state store from memory to the DB.
