# Security test report (Phase 4, Row 18)

## Part A: auth and webhooks

Checked 27 Nov 2026 on loop/phase4. Every key and secret below is generated per test run or is a fixed test constant; no real key was read.

### Tests added

`backend/tests/auth/security_test.go`

`TestMiddlewareRejectsForgedTokens` runs the real `auth.Middleware` with a `JWTVerifier` pinned to a test issuer and a trusted kid. Each case shows what the middleware returns:

| case | result | what it proves |
|---|---|---|
| valid session token | 200 | the baseline passes |
| wrong issuer | 401 | issuer pinning holds through the middleware |
| expired | 401 | expiry is enforced |
| no expiry claim | 401 | a token without `exp` is refused |
| alg none | 401 | unsigned tokens are refused |
| HS256 signed with the public key | 401 | no key confusion |
| RS512 instead of RS256 | 401 | only RS256 is accepted |
| signed by an unknown key under the trusted kid | 401 | the signature is checked against the trusted key |
| unknown kid | 401 | an unknown signing key is refused |
| empty header, `Bearer ` with no token, `Bearer` alone, lowercase `bearer`, `Basic` scheme | 401 | only an exact `Bearer <token>` is read |
| two segments, not base64 | 401 | malformed tokens are refused |

`TestClerkWebhookSignature` runs the real Clerk (Svix) webhook. It checks that a valid signature is accepted (200). A missing signature header, a signature made with another secret, and a body changed after signing are each refused (403), and nothing is written to the profile store.

`backend/tests/subscription/security_test.go`

`TestRevenueCatWebhookAuthorization` posts the repo fixture `tests/entitlement/testdata/initial_purchase.json` to the real RevenueCat webhook. The configured header is accepted (200). A missing header, a wrong secret, the secret without its `Bearer` scheme, the secret with a trailing space, and a prefix of the secret are each refused (403), and nothing is written.

The new tests reuse the package helpers (`svixSign`, `postWebhook`, `testSecret`, `newFakeStore`, `newMux`, `webhookAuth`). No helper was copied.

Already covered before this row and not repeated: issuer pinning and non-session token types on the verifier (`TestVerifierPinsIssuerAndRejectsNonSessionTokens`), the JWKS cache and rotation (`internal/auth/jwks_test.go`, `clerk_verifier_test.go`), RevenueCat secret rotation, the unconfigured secret answering 503, replay and ordering (`tests/subscription`), and an invalid bearer token on all 96 protected routes (`tests/authz_routes_test.go`).

### Secrets scan

- `node scripts/secrets-scan.mjs`: 1104 files checked, no findings.
- A pattern search of tracked files for `sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`, `rk_live_`, `AKIA…`, private key blocks, `whsec_…`, RevenueCat `appl_` and `goog_` keys, Google `AIza…` keys and `sk-ant-` found no real key. The hits, masked:
  - Placeholders in docs: `DEPLOY.md:86` and `:321` (`sk_live_REPL****`, `pk_live_REPL****`), `DEPLOYMENT_SECURITY.md:192`, `TESTFLIGHT.md:83`, `:105` and `:299`, `docs/ENV_SHEET.md:29`, `:32` and `:79`.
  - The local dev compose value `backend/docker-compose.dev.yml:44` (`sk_test_loca****`, a fixed local fake).
  - Test constants: `backend/internal/auth/clerk_verifier_test.go:24`, `profile_delete_test.go:75` and `:82`, `backend/tests/auth/auth_test.go:339`, `backend/tests/authz_routes_test.go:310`, `backend/tests/config/config_test.go:26`, and app tests in `src/__tests__` (analytics, buildScripts, debugCapture, requiredEnv, secretsPosture).
  - Prefix checks in scripts: `scripts/assert-build-env.mjs`, `scripts/preflight.mjs`, `scripts/secrets-scan.mjs`, and a comment in `eas.json:33`.
- `node_modules` and git ignored files (including `backend/.env`) were not scanned.

### Open findings

- The RevenueCat webhook authenticates with a shared Authorization header, not a signature over the body. A body changed in transit with the right header is accepted, so "body changed after signing" cannot be tested for this webhook. The handler's comment in `backend/internal/subscription/subscription.go` names this; the containment is TLS, the replay guards and secret rotation. Owner check pending.
- Not done in part A: rate limits, injection fuzzing, upload limits, SSRF, headers, govulncheck and npm audit.
