# Lumo — Decisions

Every line here still governs live behaviour and would cause a bug or an App
Store rejection if silently reversed. Read this before changing behaviour; add
a line when you make a decision someone could accidentally undo. History lives
in git — this file is not a changelog.

## Auth

- The auth machine (`src/lib/auth/machine.ts`) is pure: `transition(state, event) → {state, effects}`, 6 states; `AppStateProvider` executes the effects. Nothing else computes auth state.
- `expired` keeps `isAuthenticated = true` so the UI never bounces during a silent refresh; `deleted` is a distinct state so cached data is hard-skipped (`mayHydrateCachedData`).
- **ClerkBridge deliberately does NOT dispatch `SIGNED_IN`** — the signup screen owns post-auth routing because the SERVER's onboarding status is the truth (the local store is empty on a fresh install). Re-adding it races the signup screen and the cold-start gate.
- 401 handling: exactly ONE forced refresh (`getToken({skipCache:true})`) → retry → only then `UNAUTHORIZED` → `expired` → sign-out if the refresh fails.
- `SIGN_OUT` arriving in the `deleted` state is swallowed: the deletion purge ends the Clerk session, which echoes back as a sign-out, and must not bounce the user off onboarding.
- Email auth is **email-code (OTP)**, not passwords — fewer screens, no reset flow, doubles as verification.
- Machine-initiated sign-outs also end the Clerk session via `signOutSeam`; `resetAllStores()` purges every zustand store, the offline queue, the analytics buffer and the AI-consent key.
- Dev/release posture (`isDevBuild()` in `src/lib/env.ts`): no Clerk key in a DEV build → local dev auth mode, fully navigable; no key in a RELEASE build → hard configuration-error screen, never a silent authenticated session.

## Billing

- **Entitlement identifier is exactly `pro`** — the app checks that string.
- The paywall is RevenueCat's **hosted** paywall (`presentPaywall()`); pricing and trial copy live in the RC dashboard, not in code. Dismiss-without-purchase still completes onboarding — entitlement gates features, not onboarding.
- `react-native-purchases` is native-only: lazy `require` behind the env key inside try/catch, so Expo Go degrades to billing-disabled mode instead of crashing. `__setPurchasesModule` injection implies billing-enabled (explicit test intent).
- Release build + no RevenueCat key ⇒ **not entitled**. The dev default-entitled flag is `__DEV__`-gated; there is no other grant path.
- Restore Purchases must exist in Settings **and** on the paywall (Apple requires it reachable from the purchase screen).
- The subscription screen shows only what the billing seam reports — never a hardcoded plan, price or date.

## Scan and learning

- **Identity corrections never move the portion multiplier**: a changed food name is a misidentification (→ `user_food_affinity`), not a portion error (`ClassifyCorrection`).
- Portion EWMA: a meal-scoped factor needs **≥3 samples** to outrank the food-level factor; uniqueness is `(user_id, food_name, coalesce(meal_type,''))`.
- Multi-image reconciliation is **geometry-based**; Gemini identification runs **once**, on the top-down image. Agreement = 1 − stdev/mean: **≥0.75** merges (top-down ×2 weight, confidence +15); **<0.75** surfaces both estimates + `needs_user_confirmation` (−20).
- Confidence bands: High ≥55, Medium ≥35. Band means update in SQL-side arithmetic — no read-modify-write race.
- Per-user Gemini context (`BuildUserContext`) is capped ≈400 tokens and omits any signal with fewer than 3 observations.
- Scan images are never persisted — `scan_images` stores angle/quality/geometry metadata only.

## Gym and energy

- ACSM formulas are pure (`backend/internal/energy/formulas.go`); kcal = MET · 3.5 · mass / 200 · minutes. `met_fallback` is always LOW confidence; an estimate, schema default or unknown bodyweight downgrades to MEDIUM.
- **Double-counting guard (within a session)**: the session-complete recompute sums ACSM-parameter exercises plus the MET path for the rest; the whole-duration fallback fires ONLY when the session logged no exercises.
- **Double-counting guard (across sources)**: a provider import is skipped when a same-day session of the same type with a duration within ±10 min already exists from another source (`IsCrossSourceDuplicate`); same-provider rows are excluded from that comparison because they dedupe exactly on the provider activity id (partial unique indexes on `strava_activity_id` / `whoop_workout_id` / `apple_health_uuid`). Ceiling: sessions store no start time, so two genuinely distinct same-type, similar-length workouts in a day from different sources will merge.
- Strava/WHOOP imports keep the **provider's** calories (`calculation_method='device'`) — imported parameters are for records and charts, never a recompute.
- Energy balance is anchored to the **device's** calendar: the app sends its local date as `?date=` / `?end=`, because food and gym logs are stamped with the device-local date and the server's `LUMO_TIMEZONE` day can differ near midnight.
- A same-day streak re-bump is a no-op, so idempotent replay is safe.
- Calorie targets are clamped to **[1200, 10000] kcal** at every write path — client store, onboarding adjust sheet, and `PUT /api/goals` (400 outside the band). The server is the trust boundary.
- Every LLM system prompt carries the medical guardrail (no medical/diagnostic advice, no extreme restriction, refer to a professional) — test-enforced.

## Data model and API

- Every route responds with the `{data, error}` envelope. All `/api` sits behind Clerk JWT middleware except `/health`, the signature-verified webhooks, and the state-token-verified OAuth callback.
- Migrations are **append-only**, and every `references profiles(id)` must declare `ON DELETE CASCADE` — enforced by a migration-parse test, because that cascade is what makes account deletion real.
- `DELETE /api/profile` deletes the **Clerk identity first**, then the row; a provider failure returns 502 and leaves the row intact, so the app never claims a deletion that left the account able to sign in.
- `GET /api/export` must cover every user table — enforced by a test that derives the table list from the migrations, so a new user-data migration without an export entry fails CI. OAuth tokens are stripped from the export.
- Idempotency: partial unique indexes on `food_logs` / `gym_sessions` plus the `Idempotency-Key` header; the offline queue reuses one key across retries of the same mutation.
- RLS is enabled on every user table; the two shared libraries (`exercise_library`, `cuisine_food_library`) are seeded idempotently on startup and are authenticated-read.
- OAuth tokens are AES-256-GCM at rest; a missing `INTEGRATION_ENCRYPTION_KEY` returns 503 rather than ever storing plaintext.
- All backend config comes from env; `LUMO_BASE_URL` is the single public-origin source (CORS, OAuth redirects and webhook URLs all derive from it). `backend/.env` is a dev convenience — real env vars win.
- The app's API base is `EXPO_PUBLIC_API_URL` (dev fallback `localhost:8080`) — deploying must never require a code edit.
- Each backend feature package follows the store pattern: interface + Postgres implementation + hermetic fake.

## Privacy

- **App analytics are first-party only** (`POST /api/analytics/events`): a third-party SDK would make the app's stated "no ad or tracking SDKs" promise false. A typed 12-event allow-list is enforced on both client and server; properties are scalar tags, never PII; the user id comes only from the verified token.
- The analytics opt-out is a **persisted privacy choice** (secure-store): it survives restart AND sign-out — `reset()` deliberately does not clear it, because "off means fully off" is a published claim.
- Third-party-AI consent (guideline 5.1.2(i)): one persisted acknowledgment gates every point where data leaves for Gemini or Anthropic — photo/label capture, Ask-Lumo, the insights screen and the morning-brief fetch. Nothing is uploaded and no AI endpoint is called before it. Cleared on sign-out.
- Health data is never used for advertising and never shared beyond the disclosed processors.

## UI conventions

- `src/lib/design/tokens.ts` is the single styling source. `tertiaryLabel`/gray400 is for glyphs and placeholders only — meaningful text below 18pt uses `secondaryLabel` (AA contrast).
- Keyboard avoidance lives in the four shared scaffolds (`Screen`, `OnbScaffold`, `SheetContent`, `BottomSheet`); screens must not roll their own.
- Shared chrome uses `minHeight`, never fixed `height`, around text that scales with Dynamic Type.
- Destructive actions render in `accent.red` — the one functional-colour exception to the monochrome palette.
- No animation ships ungated by Reduce Motion, and there are no spring physics anywhere (timing curves only).

## Testing and tooling

- **No render tests by design** — device QA happens via TestFlight. Backend tests are hermetic (fake stores, `httptest`, generated JWT keys).
- Jest runs babel-jest with the node environment (jest-expo's winter runtime crashes here); `expo/virtual/env` and `expo-secure-store` are `moduleNameMapper` mocks, because babel-preset-expo rewrites `process.env.EXPO_PUBLIC_*` reads into that ESM module.
- Run backend tests from inside the monorepo — `tests/migrations` reads `../supabase/migrations`.
- `src/__tests__/secretsPosture.test.ts` fails the build on any non-`EXPO_PUBLIC_*` env read, server-secret name, or key-shaped literal in client code.
- Kept deliberately despite looking dead: `src/lib/health/appleHealth.ts` (guarded no-op seam for the future native module), the scan learning helpers (`PickCalibrationFactor` / `HourBucket` / `UpdateBandMean` — unreachable from main but test-covered documentation of the SQL-side logic), and `gym.Register` (a byte-compat delegate the tests call).
- Lint gotcha: `web/` uses `@next/eslint-plugin-next`'s native flat config — `eslint-config-next`'s FlatCompat path crashes under ESLint 9.

## Web and deployment

- `/web` is a third independent package: Next.js App Router with `output: 'export'` — pure static HTML, zero backend calls, no workspace tool. The root tsconfig excludes it.
- Vercel config lives in `web/vercel.json` (`outputDirectory: "out"`) because the project's framework preset is "Other" and Vercel otherwise looks for `public/` and fails the deploy. `turbopack.root` pins `web/` as its own workspace root so the monorepo lockfile isn't inferred.
- The social card is a **committed `public/og.png`**, not an `opengraph-image` route: under `output: 'export'` that route emits an extensionless file, which static hosts serve as `application/octet-stream` and every crawler ignores. Regenerate with `node web/scripts/make-og.mjs`.
- Site GA4 is consent-gated: it loads only when `NEXT_PUBLIC_GA_ID` is set, the visitor accepts, and DNT/GPC is off.

## Product

- **The Veltai → Lumo rename is not done**: bundle id, slug and scheme are an App Store identity change, and the Clerk scheme allowlist and SSO redirects derive from `scheme: "veltai"`. A human must decide (see STATUS.md).
- The app is fully navigable keyless in a dev build (mock-seeded stores) — that is the Expo Go development mode, protected by the release-build guard above.
- `LICENSE` is Expo scaffolding boilerplate and does not license this codebase; the default is all rights reserved until the owner picks one.

## Entitlement and limits

- **The free/Pro split is enforced SERVER-side** (`backend/internal/entitlement`) as ONE policy table wrapping the authenticated mux — a new route is FREE by default and must be listed to be gated, so the whole paid surface is auditable in one file. A client-only gate is bypassable by anyone holding a valid token.
- **Never gated, permanently**: manual/search/barcode logging, reading your own data, account management, data export, account deletion. Gated: AI scans beyond the daily free allowance, AI insights/brief/query/rebuild, and the Strava/WHOOP integrations — everything with real marginal cost.
- The gate **fails closed**: an unverifiable entitlement returns 503 (not 402 — the user may well be paying and we could not check), a missing identity 401, a misconfigured gate 503. Free-tier limits are env-tunable (`LUMO_FREE_SCANS_PER_DAY`, `LUMO_GATING_ENABLED`) so generosity changes without a redeploy.
- The free scan quota counts existing `scan_sessions` rows for the day rather than a new counter table — every paid Gemini call already writes exactly one, so there is no second source of truth to drift.
- **Rate limiting sits after auth and before entitlement**: it keys on the verified user id, and rejecting a flood in memory avoids running a subscription + scan-count DB lookup per request. Per-process by design (documented ceiling).
- **`TRIAL_DAYS` (7) is the single source of truth** for every trial mention; the RevenueCat dashboard must match it, because the store is what actually charges. A mismatch is a 3.1.2 rejection and a chargeback risk.

## Untrusted input

- Image bounds are checked with `image.DecodeConfig` (header only) BEFORE any full decode: the byte-size cap bounds the *compressed* payload, not the decoded bitmap, so it is no defence against a decompression bomb.
- Every goroutine that touches image bytes carries its own `recover()` — Go's recover only covers the goroutine that defers it, so a parent-only recover protects nothing.
- **Model output is untrusted input**: Gemini's JSON is range-clamped and length-truncated before it reaches the DB (NaN/Inf rejected). A hallucinated or hostile response must never write absurd values.
- User text reaches a prompt ONLY inside a delimited `<user_data>` block, with a system-prompt rule that content there is data and never instructions; the delimiters are stripped from the content so it cannot forge its own closing tag.
- The scan-correction endpoint feeds a GLOBAL calibration table, so its inputs are bounded — one user must not be able to skew every user's confidence bands.

## Operational posture

- Startup **fails loudly** on missing `DATABASE_URL` or `CLERK_SECRET_KEY`, and on a localhost `LUMO_BASE_URL` in production; every other absent secret logs a warning naming the feature that will 503. A process that answers a green `/health` while 401ing every request is worse than one that refuses to boot.
- JWT verification pins the issuer (`CLERK_ISSUER`) and rejects non-session token types: Clerk signs every token for an instance with the same keys, so without this a JWT-template token minted for another service would authenticate here as a full session.
- The Expo dev origin is in the CORS allowlist only outside production.
- A RevenueCat grant with no expiry gets a **bounded** default TTL — nil must never mean "never expires", or a single malformed event is permanent free Pro. `TRANSFER` requires consistent preconditions and no-ops rather than deleting a target row it cannot justify.

## Offline queue

- The gym flow (create session → N exercises → complete) is queued as **ONE ordered unit** with a shared idempotency key: steps run only after the create succeeds and against the id it returned, so a half-flush can never orphan exercises. Replay cannot create a second session (backend partial unique index on the idempotency key).
- A FULL workout always writes even if the day is already logged — silently discarding exercises someone just performed is worse than a second session row. The dashboard quick-log keeps its once-a-day guard.
