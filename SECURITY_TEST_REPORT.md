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

## Part B: injection

Checked 27 Nov 2026 on loop/phase4 against the local test database (Row 18b step 1).

### Routes that take a string

These are the 67 routes in `backend/tests/authz_routes_test.go` that read a string from the path, the query or the JSON body, with the 169 string inputs fuzzed. Routes that read no string are left out: they take no input, only numbers, or an empty body. Examples are `GET /api/profile`, `GET /api/export`, `DELETE /api/profile`, `POST /api/gym/streak/freeze` and the consent routes. The webhooks are covered by part A. `{id}` is filled with a row the owner made through the API, except the scan session and the insight, which no route creates without a paid AI call; those get a well-formed unknown id.

| route | string inputs fuzzed |
|---|---|
| `PATCH /api/profile` | body `display_name`, `avatar_url` |
| `POST /api/onboarding` | body `sex`, `height_unit`, `weight_unit`, `activity_level`, `goal`, `body_type`, `cuisines.0`, `dietary_requirements.0` |
| `PATCH /api/onboarding/preferences` | body `cuisines.0`, `dietary_requirements.0` |
| `PUT /api/goals` | body `weight_goal`, `weight_unit`, `activity_level`, `source` |
| `POST /api/body-weight` | body `date`, `unit`, `notes` |
| `DELETE /api/body-weight/{id}` | path `id` |
| `GET /api/food/logs` | query `date`, `from`, `to`, `status`, `meal_type` |
| `POST /api/food/logs` | body `date`, `meal_type`, `food_name`, `brand`, `barcode`, `unit`, `source` |
| `GET /api/food/logs/{id}` | path `id` |
| `PATCH /api/food/logs/{id}` | path `id`; body `date`, `meal_type`, `food_name`, `brand`, `barcode`, `unit`, `source` |
| `DELETE /api/food/logs/{id}` | path `id` |
| `GET /api/food/summary` | query `date` |
| `GET /api/food/days` | query `from`, `to` |
| `POST /api/food/quick-add` | body `meal_type`, `date`, `label` |
| `GET /api/food/search` | query `q` |
| `GET /api/food/barcode/{barcode}` | path `barcode` |
| `GET /api/food/portion-memory` | query `food_name` |
| `POST /api/food/saved` | body `food_name`, `brand`, `barcode`, `serving_unit` |
| `DELETE /api/food/saved/{id}` | path `id` |
| `GET /api/gym/sessions` | query `from`, `limit` |
| `POST /api/gym/sessions` | body `date`, `name`, `notes` |
| `PATCH /api/gym/sessions/{id}` | path `id`; body `date`, `name`, `notes` |
| `DELETE /api/gym/sessions/{id}` | path `id` |
| `POST /api/gym/sessions/{id}/complete` | path `id` |
| `POST /api/gym/sessions/{id}/exercises` | path `id`; body `name`, `weight_unit`, `notes` |
| `PATCH /api/gym/exercises/{id}` | path `id`; body `name`, `weight_unit`, `notes` |
| `DELETE /api/gym/exercises/{id}` | path `id` |
| `GET /api/gym/exercises/{id}` | path `id` |
| `GET /api/gym/last-logged/{exercise_id}` | path `exercise_id` |
| `GET /api/gym/templates/{id}` | path `id` |
| `POST /api/gym/templates` | body `name`, `exercises.0.exercise_id`, `exercises.0.planned_weight_unit` |
| `PATCH /api/gym/templates/{id}` | path `id`; body `name` |
| `DELETE /api/gym/templates/{id}` | path `id` |
| `POST /api/gym/templates/{id}/exercises` | path `id`; body `exercise_id`, `planned_weight_unit` |
| `PATCH /api/gym/template-exercises/{id}` | path `id`; body `planned_weight_unit` |
| `DELETE /api/gym/template-exercises/{id}` | path `id` |
| `POST /api/gym/calories/preview` | body `exercise_id` |
| `GET /api/gym/progress/{exercise_name}` | path `exercise_name`; query `limit` |
| `PUT /api/gym/schedule` | body `schedule.0.template_id` |
| `PUT /api/gym/schedule/{day}` | path `day`; body `template_id` |
| `GET /api/energy-balance` | query `date` |
| `GET /api/energy-balance/week` | query `end` |
| `GET /api/integrations/{provider}/connect` | path `provider` |
| `POST /api/integrations/{provider}/sync` | path `provider` |
| `DELETE /api/integrations/{provider}` | path `provider` |
| `GET /api/integrations/{provider}/callback` | path `provider`; query `code`, `state` |
| `POST /api/scan` | body `image_base64`, `mime_type` |
| `POST /api/scan/confirm` | body `date`, `meal_type`, `food_name`, `unit`, `scan_session_id` |
| `POST /api/scan/correction` | body `scan_session_id`, `food_name_original`, `food_name_corrected`, `macro_source_original`, `correction_type` |
| `POST /api/scan/feedback` | body `scan_session_id`, `rating` |
| `POST /api/scan/pipeline` | body `image_base64`, `mime_type`, `date`, `meal_type`, `images.0.mime_type`, `images.0.angle` |
| `POST /api/scan/label` | body `image_base64`, `mime_type` |
| `GET /api/recipes/{id}` | path `id` |
| `POST /api/recipes` | body `name`, `description`, `ingredients.0.food_name` |
| `PATCH /api/recipes/{id}` | path `id`; body `name`, `description`, `ingredients.0.food_name` |
| `DELETE /api/recipes/{id}` | path `id` |
| `POST /api/recipes/{id}/log` | path `id`; body `meal_type`, `date` |
| `POST /api/saved-meals` | body `name`, `meal_type`, `items.0.food_name` |
| `POST /api/saved-meals/{id}/log` | path `id`; body `meal_type`, `date` |
| `DELETE /api/saved-meals/{id}` | path `id` |
| `POST /api/analytics/events` | body `events.0.name`, `events.0.session_id`, `events.0.client_ts` |
| `POST /api/feedback` | body `category`, `message`, `app_version`, `device_model` |
| `POST /api/push/token` | body `token`, `platform` |
| `DELETE /api/push/token` | body `token` |
| `POST /api/debug-reports` | body `client_id`, `created_at`, `title`, `notes`, `severity`, `kind`, `area`, `trigger`, `route`, `app_version`, `build_number` |
| `POST /api/ai/query` | body `question` |
| `POST /api/ai/insights/{id}/dismiss` | path `id` |

### Test

`backend/tests/security/injection_pg_test.go`, `TestPG_StringInputsResistInjection`. It mounts the routes as `cmd/server` does, with real Postgres stores, behind the real `auth.Middleware` and `auth.EnsureProfile`. The rate limiter and entitlement gate are left out because they are not string inputs. The AI, scan and integration clients get no keys, so they refuse before any network call, and food search points at a local server. Every input above is sent each payload, one input at a time, as the seeded owner with a signed token. Each request must:

- not answer 500;
- answer in the one envelope (`{"data": ..., "error": null}` or `{"data": null, "error": ...}`), or 204 or a redirect;
- leave the owner's row count in every table in `account.UserTables` unchanged when it is refused. An accepted payload is stored as plain data.

`seedOwner` and `signedTokens` are copied from `backend/tests/food` (the seventh copy, kept until a shared helper package is approved).

### Payloads

A single quote; `x' -- `; `' OR 1=1 --`; `' UNION SELECT id, email FROM profiles --`; `'; DROP TABLE food_logs; --`; a null byte (`a\x00b`); a 10,000 character string; right to left override characters with emoji; JSON breaking text (`"}],"x":{"`).

### Results

- 1,521 cases (169 inputs, 9 payloads) pass with `go test -race`.
- No payload changed a row on a refused request, ran as SQL, or dropped a table. All SQL in these handlers is parameterised, so no fix was needed.
- The null byte gets a 500 on 103 of the 169 inputs. Postgres refuses a NUL byte in a text value (invalid UTF8 byte sequence), and the handler reports that as a 500 such as "storage error" or "failed to create log", writing nothing. It is input validation, not injection, so it is parked. The test exempts only the 500 check for this payload; the envelope and row count checks still run. Fixing it means one shared guard: reject a NUL in the path, the query, `httpx.Decode` and the two direct decoders (debug reports, scan pipeline) with 400. Logged in KNOWN_ISSUES.md and OWNER_CHECKS_phase4.md.

## Part C: upload limits and SSRF

Checked 27 Nov 2026 on loop/phase4 against the local test database (Row 18b step 2).

### Upload routes

| route | size limit | accepted types | checks before the paid call |
|---|---|---|---|
| `POST /api/scan` | 20 MB body (`httpx.Decode`); an oversize body answers 400 `invalid JSON body`, not 413 | `mime_type` empty (sent as image/jpeg), image/jpeg, image/png, image/webp or image/heic (new this step) | consent, `image_base64` present, quota. The base64 and the image size are not checked beyond the body cap. |
| `POST /api/scan/pipeline` | 24 MB body (413), 15 MB per decoded image (413), at most 3 images | same `mime_type` list (new this step) | consent, base64 valid, angle valid, header dimensions at most 20,000 per side and 40M pixels (413) for JPEG and PNG, quota, capacity (503) |
| `POST /api/scan/label` | 24 MB body (413), 15 MB decoded image (413) | same `mime_type` list (new this step) | consent, base64 valid, quota. No dimension check. |
| `POST /api/debug-reports` | 12 MB body (413) | no type: `image_base64` is stored as sent and never decoded on the server | `client_id` and `title` present |
| `POST /api/webhooks/clerk` | 1 MB body | JSON | Svix signature |
| every other JSON route | 20 MB body (`httpx.Decode`) | JSON | per handler |

OAuth token and activity responses from Strava and WHOOP are read through a 1 MB `io.LimitReader`.

### Outbound fetches

| client | host | timeout | part from the user | redirects |
|---|---|---|---|---|
| Food search, Open Food Facts (`internal/food/search.go`) | fixed `world.openfoodfacts.org` | 10 s | `q`, query escaped | default policy |
| Food search, USDA | fixed `api.nal.usda.gov` | 10 s | `q`, query escaped; the API key is in the query string | default policy |
| Barcode lookup, Open Food Facts | fixed | 10 s | barcode, path escaped into one segment | default policy |
| Photo scan, Gemini (`internal/scan/gemini.go`) | fixed Google host and model path | 30 s | image and `mime_type` in the JSON body only | default policy |
| Pipeline and label scan, Gemini (`internal/scan/pipeline/gemini.go`) | fixed Google host and model path | 30 s | image in the body; `mime_type` normalised | default policy |
| Insights, brief and Ask Lume, Gemini or Claude (`internal/ai/llm.go`) | fixed host; model from `GEMINI_MODEL` (server env) | 30 s, 60 s | the question in the body only | default policy |
| Clerk JWKS and user delete (`internal/auth`) | fixed `api.clerk.com` | 10 s | the user id from the verified token, path escaped | default policy |
| Strava and WHOOP (`internal/integrations`) | fixed hosts | 15 s | the OAuth `code` from the callback, as a form value | default policy |
| Apple Retention Messaging (`internal/retention/apple.go`) | sandbox or production base from server config | 10 s | none (the message id is server generated) | default policy |

No user-supplied string picks a scheme, a host or a port. User text only goes into escaped query values, one escaped path segment, or request bodies.

### Tests

`backend/tests/security/uploads_pg_test.go`. Both tests mount the routes with `newAPI` (shared with the injection test in the same package) and give it a fake Gemini key. Food search and the three Gemini clients go through a recording transport to a local stub that plays Gemini and Open Food Facts, so nothing reaches the network.

- `TestPG_UploadsAreBoundedAndTyped` (24 cases):
  - Refused, each in the one error envelope, never 500, and with no outbound (paid) call:
    - `text/html` and `application/pdf` as `mime_type` on the three scan routes (400)
    - an empty body and `{}` on the three scan routes and debug reports (400)
    - a body over the cap: `/api/scan` 21 MB (400 or 413), pipeline and label 25 MB (413), debug reports 13 MB (413)
    - a 16 MB decoded image on pipeline and label (413)
  - Accepted: a valid 2x2 PNG on `/api/scan` (200), label (200) and pipeline (202), and a debug report with that screenshot (201).
- `TestPG_UserInputNeverChoosesAnOutboundHost`:
  - Five hostile values (a local trap server URL, `http://127.0.0.1:1/`, `http://169.254.169.254/latest/meta-data/`, `file:///etc/passwd`, a scheme-relative redirect target) are each sent into the 11 inputs that could reach a fetch: food search `q`, the barcode path, scan `mime_type` and `image_base64`, label `mime_type`, the pipeline angle, the Ask Lume question, profile `avatar_url`, a debug report `route`, the integration provider path, and the OAuth callback `code` and `state`.
  - No request answers 500 and the trap server is never reached.
  - Every recorded outbound call went to the configured stub base. The test also fails if no outbound call was made at all.

### Results and fix

- All size caps hold: 413, or 400 for `/api/scan`, never 500.
- Gap found and fixed: the three scan routes sent any `mime_type` on to the paid Gemini call. `/api/scan` passed it through as is; pipeline and label sent it as image/jpeg. They now answer 400 `mime_type must be image/jpeg, image/png, image/webp or image/heic` through one check, `pipeline.SupportedMime` (`internal/scan/pipeline/gemini.go`), used in `internal/scan/scan.go` and `internal/scan/pipeline_handler.go`. An empty `mime_type` is still sent as image/jpeg, which is what the app sends.
- SSRF: no user input reached a fetch, so no fix was needed.

### Open findings

- No outbound client sets `CheckRedirect`, so each follows up to 10 redirects to any host. `TestPG_OutboundRedirectIsFollowedToAnotherHost` (`backend/tests/security/redirect_pg_test.go`) pins this, using the real food search client settings and the real Gemini photo scan client through the recording transport. An upstream 302 is followed to a second host (localhost, against 127.0.0.1): food search arrives with its query string intact, where the USDA key lives, and the Gemini call arrives with its `x-goog-api-key` header. Go also copies `x-api-key` (Claude); it drops only `Authorization` and cookies on a host change. The test must be flipped when the guard lands. This would only matter if a trusted upstream or its TLS were compromised, since no user input chooses the host. The fix is a `CheckRedirect` that refuses another host on each client, which is a shared guard, so it is parked. Owner check pending.
- `/api/scan` answers 400, not 413, for an oversize body, because `httpx.Decode` hides the size error. It does not check base64 or image size before the paid call. The label route has no dimension check. Pipeline and label pass bytes that are not an image (but carry a valid `mime_type`) on to Gemini. The daily AI quota still bounds each of these. Parked.
- Debug report screenshots are stored without a type or base64 check. They are never decoded on the server, and the route is test-build only.
- The Strava and WHOOP clients use a package-level `http.Client` that tests cannot inject. Their URLs are constants, and without `INTEGRATION_ENCRYPTION_KEY` the routes answer 503 before any call, so they are covered by reading the code, not by the stub.
