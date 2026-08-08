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

- **The Veltai → Lumo rename is not done**: bundle id, slug and scheme are an App Store identity change, and the Clerk scheme allowlist and SSO redirects derive from `scheme: "veltai"`. A human must decide. The complete list of every affected file is in SUBMISSION_READINESS.md §4, split by whether a change is destructive, user-visible, or plumbing. The OAuth deep link no longer hardcodes a *third* scheme (`lumo://`) — both sides now derive from `app.json`, pinned by a test.
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

## Deployment

- **Runtime state lives in Postgres, not process memory**: rate-limit counters, webhook replay records and OAuth CSRF states. In-memory versions were correct on one instance and silently wrong on two — limits allowing N× the rate, replays landing twice, and OAuth callbacks failing whenever they hit the instance that did not issue the state. Each uses a single atomic statement (`ON CONFLICT DO UPDATE ... RETURNING`, `ON CONFLICT DO NOTHING`, `DELETE ... RETURNING`), never read-then-write, so concurrent callers cannot both win.
- All three **fail closed**: a store error denies with 503 rather than falling back to a per-process count that would let a flood through. The cost is that a database outage takes the API down instead of degrading — accepted, because every handler needs the database anyway.
- **Deploy order is load-bearing**: migration `20260729000001` must be applied BEFORE the new binary starts, or the limiter's increment errors and (by design) every `/api/` request answers 503. Binary-only rollback is safe; migration-only rollback is not.
- **The RevenueCat webhook accepts two secrets** (`REVENUECAT_WEBHOOK_AUTH` + `_PREVIOUS`), compared in constant time with no early return (an early exit would leak which one matched). Rotation is otherwise a choice between downtime and dropped webhooks, and a dropped RevenueCat event silently costs a paying user their access.
- **`INTEGRATION_ENCRYPTION_KEY` is `openssl rand -base64 32`, not `-hex 32`** — the cipher base64-decodes it and requires exactly 32 bytes. CONFIG.md documented hex until 2026-07-29; following it produced a confusing 503 on every integration route.
- **The API binds 127.0.0.1 only; nginx is the sole public entrypoint.** Docker writes its own iptables rules that bypass ufw, so a container published without the loopback prefix is internet-reachable while `ufw status` claims the port is closed.
- **Compose is the primary deployment**, systemd the documented alternative — the image is identical to what was tested, limits/logging/healthcheck/read-only rootfs are declarative, and rollback is a tag swap. The image is distroless and non-root (uid 65532) with a read-only root filesystem, so the healthcheck is the binary probing itself (there is no shell to curl with).
- **Migrations never run on container start.** An auto-migrating container that crash-loops runs migrations in a loop against production; `deploy/migrate.sh` is explicit, requires typing `apply`, runs each migration in one transaction with its bookkeeping row, and detects drift by checksum.
- **Base images ship as tags marked PIN ME**, with the digest-resolution step in the runbook: an invented digest fails confusingly and could be mistaken for a verified one.
- **Food logs go through the offline queue**, not a direct API call: the food store has no cross-restart persistence, so a write refused by the backend (offline, 5xx, 429) previously existed only in that session and was gone at next launch.

## Marketing site (`/web`) — redesign, 2026-08-02

- **Token parity is exact, and one site-only colour was deleted to get there.** `web/app/tokens.css` mirrors `src/lib/design/tokens.ts` value for value. The old site defined `--zone: #f6f5f2`, a warm grey it called "the site-only warmth"; the app has no such colour, so it is now `#FAFAFA` (`color.gray50`). The site may breathe more than the app — larger type, more whitespace — but it may not introduce a colour the product does not have.
- **No webfonts. The system stack IS the app's typeface.** Hanken Grotesk and IBM Plex Mono (two faces the app does not contain) were removed in favour of `-apple-system` → SF Pro, `ui-rounded` → SF Pro Rounded for numerals, `ui-monospace` → SF Mono for the instrument-label voice. Better type parity on the devices that matter for an iOS app, zero font-swap layout shift, and no render-blocking fetch — the rare change that wins on fidelity and Core Web Vitals simultaneously.
- **Two type scales, namespaced.** `--app-*` carries the app's exact point values and is used only inside the phone frame, so the rendered screen is proportionally identical to the real app. `--web-*` is an editorial scale for the page. That is the only intentional divergence and only in size: shipping 56pt phone type to a 1440px browser is a category error, not fidelity.
- **The device frame uses Apple's real corner path, not `border-radius`.** iPhone 17 Pro Max is 440×956pt with a **continuous** 62pt corner whose curve runs 85pt inward. A circular arc reads visibly too tight, so the frame clips to the bezier path from Apple's CoreSimulator framebuffer mask. Aspect is the exact 110:239, not the marketed 19.5:9 (off by ~0.3%, which is visible over 900pt).
- **Hand-rolled rAF scroll, no Framer Motion.** ~40–60KB gzipped to do what forty lines does, on a static-export page where LCP is the point, and it would have been the only runtime dependency beyond React. Transform and opacity only; geometry cached and re-measured by a ResizeObserver so the scroll handler never reads layout.
- **The static layout is what ships in the HTML; pinning is a post-mount upgrade.** `beats--pinned` appears zero times in the export. That is what makes reduced-motion a *complete* page rather than a frozen first frame, and it removes hydration mismatch and CLS by construction.
- **Nothing adopted from 21st.dev.** Its components are Tailwind-classed JSX and this project has no Tailwind, so adopting one means either a dead `className` string or installing a second token system that would drift from the CSS custom properties. Its ranking also selects for exactly the aesthetic the design bans.
- **"Coming soon" is a status readout, not a button.** Lumo is not on the App Store; anything pressable is a promise the page cannot keep. `grep status__dot` finds every place that changes on launch day.
- **The Cal AI accusation was investigated and NOT published — it is false as written.** The removal (April 2026) was for subscription-billing violations, lasted days, was reversed, and the app is currently top-10 in its category; the accuracy finding (July 2026) is a four-app aggregate from an unreviewed conference abstract with no per-app figure. Naming a competitor for a defect they were not penalised for is s18 Australian Consumer Law exposure. The generic version was also declined: citing it implies "…but Lumo is accurate", and Lumo's estimates have never been benchmarked against weighed meals. The honesty section argues from method and optics instead — entirely true and entirely ours.
- **Seven false feature claims were removed from the site.** Most seriously: an Apple Health integration that exists in no form (the seam's only importer is its own unit test), and a `585±65 kcal` range that was the homepage's central visual — the app computes no interval anywhere. Full list in LANDING_REDESIGN.md §6.
- **`scripts/check.mjs` runs against the exported HTML, not source.** Source contains the banned words legitimately, in comments explaining why they are banned; only what ships can be meaningfully audited. It asserts no rating, user count, testimonial, press mention, affirmative Apple Health claim or `±` range — the backstop against a fourth fabricated-data incident.
- **`overflow-x: clip` on `html`, never `hidden` on `body`.** Setting `overflow-x: hidden` forces `overflow-y` to `auto`, which turns the element into a scroll container. `clip` suppresses overflow without creating one. It is a backstop only — no element overflows at 320/768/1440/2560.

## Legal pages — scaffold, 2026-08-02

- **The section STRUCTURE is canonical in `legal/manifest.json`; the CONTENT is duplicated, and a check enforces the match.** Option (a) — one shared module rendered by both web and app — was rejected despite the content shape allowing it, because the packages deliberately have no cross-imports (README: "Each package builds, tests and deploys on its own"). Proven by trying it: `import manifest from '../../legal/manifest.json'` fails the Next build outright, because the manifest is outside the package root. The manifest is therefore read only by checks, never bundled — the same pattern `backend/tests/migrations` already uses to read `../supabase/migrations`. Duplication a test enforces beats an import that breaks an architectural rule. Enforced by `web/scripts/check-legal.mjs` and `src/__tests__/legalParity.test.ts`; both fail if either surface drifts, including on the `lastUpdated` date.
- **Option (b), linking the app out to the hosted pages, was rejected for the reason the brief anticipated**: an offline user would dead-end, and Apple requires Terms and Privacy to be reachable in-app. A test now asserts both are linked from sign-up and from the paywall, and that neither route is behind an auth gate.
- **Three content kinds, enforced by the type system**: `p` (safe to assert), `todo` (placeholder), `verified` (read from the code, carrying the file that proves it). A `Block` cannot be ambiguous. Placeholders render as hairline-boxed monospaced blocks with a TODO label — in the site's own language, no yellow, no warning triangle — because a placeholder that reads as prose is a trap for the person who has to replace it.
- **`npm run check:legal` is deliberately NOT in `npm run verify`.** It exits 1 while any TODO remains, which is the correct gate for a policy but the wrong gate for everyday work: a check that is expected to fail gets muted within a day, and then it protects nothing. `verify` prints a reminder to run it instead.
- **`profiles.ai_consent_at` was NOT cited as verified, because it does not exist on this branch.** The brief asked for it. `grep -rn consent backend/` returns nothing on main; the server-side gate lives only on the unmerged `audit/submission-readiness` branch. What is real today is a DEVICE-LOCAL acknowledgement (`src/lib/ai/consent.ts`) covering disclosure to Gemini and Anthropic only — not a general consent to collect health information. Describing a server-side consent record that is not deployed would be exactly the documented false representation this task exists to avoid, so the policy says what exists and marks the rest TODO.
- **The invented subscription prices were removed from the app, not just the site.** `src/app/legal/terms.tsx` was still shipping "US$8.99 per month or US$49.99 per year" — figures that appear in no code and in no configured App Store product. A test now fails if any price string returns to either in-app legal screen.
- **The health disclaimer is written in full rather than left as a placeholder.** It is standard, the app already ships the same substance, and a *missing* health disclaimer is worse than a scaffolded one for a product that estimates calories.
- **No price, no retention period, no entity detail, no consent mechanism and no liability clause is asserted anywhere.** All are TODO. The liability clause in particular was deleted rather than adapted: the previous US-style "as is, no warranties of any kind" exclusion is incompatible with non-excludable Australian Consumer Law guarantees and may itself be misleading conduct under s18.

## TestFlight gate audit (2026-08-05, branch `audit/testflight-gate`)

- **`audit/submission-readiness` was never merged into `main`.** Its 3 fix
  commits (fabricated data, server-side AI consent + migration, onboarding
  wiring) plus `scripts/check-assets.mjs` and `noFabricatedData.test.ts` were
  absent from `main`, while `SUBMISSION_READINESS.md` — which describes them as
  fixed — lived only on that branch. Merged onto the gate branch; the merge is
  clean and `main`'s later web/legal work is preserved. **If this is ever
  reverted, all twelve fabricated-data defects return.**
- **Scan confidence bands belong to the SERVER.** `src/lib/food/confidence.ts`
  mirrors `backend/internal/scan/pipeline/confidence.go` (High ≥55, Medium ≥35)
  and the server's `label` wins when the payload carries one. Do not reintroduce
  client-side thresholds: the pipeline's positives sum to ≤65 and `single_angle`
  is always −10, so a perfect single-angle scan is exactly 55 — any client
  constant above that makes green unreachable and paints every real scan red.
  `src/__tests__/scanConfidence.test.ts` reads the Go source to fail on drift.
- **The "Why?" panel renders only server-computed factors.** It must never
  synthesise a breakdown from the score. When `scan_results.confidence.factors`
  is absent it says so. This is the product's provenance surface; inventing its
  contents is the sharpest contradiction it can ship.
- **The confidence badge shows a band word, not a percentage.** The score is a
  bounded points total, not a probability, and must not be framed as one.
- **`templateExerciseCols` is split from `templateExerciseFrom`** so a caller
  needing an extra column widens the select list rather than appending after
  `FROM`. Appending a JOIN without widening it is what made three
  `/api/gym/template-exercises` routes 500 on every request.
- **Every route accepting a caller-supplied `scan_session_id` must check
  ownership** (`GetScanSessionOwner`) *and* scope its mutating SQL by `user_id`.
  `/confirm` was missed while `/correction` and `/feedback` checked.
- **Every paid Gemini call site must write exactly one `scan_sessions` row**, and
  write it *before* the call. `CountScansToday` counts those rows and nothing
  else; `/api/scan/label` wrote none, so free-tier users had an unmetered
  billable path. A new AI endpoint without a session row silently escapes quota.
- **Auth-token round-trips are bounded** (`EXPO_PUBLIC_API_TOKEN_TIMEOUT_MS`).
  `getToken()` performs real network I/O and sat outside the request deadline,
  so a hung token call hung every API call in the app forever.
- **The offline queue flushes on AppState `active`, not only at launch.**
  There is no NetInfo dependency; foregrounding is the reconnect proxy.
- **The calorie floor is sex-aware** — 1500 male / 1200 female / 1350 other — in
  `deriveTargets.ts` and `derive.go`, which must stay identical. A flat 1200
  recommends the female minimum to men (1.4.1).
- **Backend SQL needs a real database to be tested.** `tests/gym_schedule`
  substitutes an in-memory fake, which is why 22-vs-23 columns shipped.
  `tests/gym_schedule/schedule_pg_sql_test.go` runs the real store against
  Postgres, gated on `LUMO_TEST_DATABASE_URL`. Prefer extending it over adding
  more fake-backed coverage.
- **`ios/` is disposable prebuild output.** It is gitignored and drifted: it
  declares five permissions `app.json` does not, and predates RevenueCat. Always
  `npx expo prebuild --clean -p ios` before a build.
- **Migrations are Supabase-specific** — they require the `authenticated` /
  `service_role` roles and `auth.uid()`/`auth.jwt()`. Correct for the documented
  target (pooler, port 6543); they will not apply to a vanilla Postgres/RDS.

## Scan → confirm reconciliation (2026-08-06)

- **A confirmed scan produces exactly ONE `food_logs` row, and it is the row the
  pipeline already created.** `POST /api/scan/confirm` now UPDATEs that row
  (`scan.claimPipelineLog`) instead of inserting a second one, setting the
  user's corrected values and `status = 'confirmed'`. It falls back to INSERT
  only when there is nothing to claim: no `scan_session_id`, a session with no
  `food_log_id`, a row owned by someone else, or a row the user discarded.
  **Why server-side:** client de-duplication would only hide the extra row —
  `GET /api/food/summary` sums `food_logs` directly, so the day's total would
  still have been wrong for anything reading the API rather than the store.
- **The claim is gated on `status IN ('analyzing','ready')` and `FinishScanLog`
  carries the mirror predicate `AND status = 'analyzing'`.** Together these make
  both completion orders safe: a user can confirm before the background pass
  lands, and a late pass then updates zero rows instead of overwriting their
  corrected values and dragging the row back to `ready`. Updating zero rows is
  the correct outcome there, not an error.
- **`mealsFromLogs` carries `status` through.** It used to drop the field, so
  every hydrated row looked confirmed and `foodStore.recompute`'s under-review
  exclusion could never fire on fetched data — a scan awaiting review counted
  toward the day as soon as the log refreshed.
- **`'analyzing'` is deliberately NOT excluded from meal totals.** A placeholder
  row carries zero macros on both sides (`CreateAnalyzingLog` inserts 0s), so
  excluding it would change no total and would only hide the optimistic row from
  its meal. An existing test pins this; it was right and was left alone.
- **The offline queue's idempotency key is untouched.** It lives in
  `food.CreateLog` / `gym` (the `Idempotency-Key` header path), not in
  `scan.SaveConfirmed`, which the queue never replays.

## The rename to Lume (2026-08-06)

- **The product is `Lume`. The bundle identifier is `fit.lume.app`.** Chosen over
  `app.lume.lume` because it is the correct reverse-DNS form of `lume.fit`, the
  domain the product actually owns; `app.lume.lume` only mirrored the old
  `app.veltai.veltai`, which was itself malformed. **Nothing has been submitted,
  so this was the last cheap moment to change it** — after the first upload the
  bundle id is permanent.
- **`LUMO_*` env vars became `LUME_*`, with the old names still honoured.**
  `config.lookup()` tries `LUME_X`, falls back to `LUMO_X`, and logs a one-time
  deprecation warning. Nothing silently reverts to a default because a variable
  "disappeared" from a deployment. Delete the shim once no environment exports
  `LUMO_*`.
- **Secure-store key prefixes moved `veltai.` → `lume.`, with no migration.**
  There are no production users, so nothing was stranded. **Had there been, this
  would have signed every user out and reset their onboarding and analytics
  opt-out flags** — the keys are the storage identity, and renaming them orphans
  the old values rather than moving them. A real rename after launch needs a
  read-old-write-new migration on first launch.
- **The Go module path moved `lumo/backend` → `lume/backend`.** Mechanical and
  compiler-verified; it is invisible to users but was the last place a third
  name survived.
- **Migration file contents and filenames were NOT touched.** `deploy/migrate.sh`
  stores a SHA-256 of each applied migration and reports `DRIFT` when a file
  changes afterwards. Editing even a comment in an applied migration would make
  a correct deployment look corrupted. `supabase/migrations/20260711000001_
  initial_schema.sql:1` still says "Lumo initial schema" on purpose.
- **`lumofit@gmail.com` was deliberately left alone.** It is a real mailbox that
  receives support email; renaming it to `lumefit@` would point support at an
  address that does not exist. `productName.test.ts` asserts it survives, so
  nobody "tidies" it into a dead address later.
- **`src/__tests__/productName.test.ts` fails if `veltai` or `lumo` reappears in
  `src/`, `web/` or `app.json`** (mailbox excepted). Historical comments were
  reworded to describe the old bugs without naming the dead schemes, rather than
  adding a per-line opt-out marker that would erode the guard.

## Debug capture system (2026-08-06)

- **The gate is `EXPO_PUBLIC_DEBUG_CAPTURE === '1'`, never `__DEV__`.** TestFlight
  builds are release builds, so `__DEV__` is FALSE there — the capture system has
  to run in exactly the build `__DEV__` excludes.
- **The debug tree is excluded at the MODULE BOUNDARY, not hidden behind a
  conditional.** `metro.config.js` resolves `@/debug/impl` to `src/debug/stub.ts`
  when the flag is off. Folding `if (false)` away still leaves the `require`
  edges, so the UI, `react-native-view-shot` and the report store would be
  bundled — unreachable, but present. **Verified empirically**: the debug UI
  strings appear 0 times in a production export and once in a flagged one, and
  the flagged bundle is 142,419 bytes larger.
- **`eas.json` `production` must never set the flag.** A debug overlay in a
  shipped app is a 2.3.1 hidden-feature rejection, and these reports contain
  screenshots of a health app. `src/__tests__/debugGating.test.ts` fails if any
  store-distributed profile sets it, and if any profile that sets it is not
  `distribution: internal`.
- **`/api/debug-reports` remains in the production bundle as a dead API method.**
  It is a string and an unused function on the shared `api` object; no code path
  reaches it because the store is stubbed out. Removing it would mean splitting
  the api client, which is not worth it — but it is why the string greps as
  present.
- **Reports are written to the filesystem BEFORE any network attempt.** The
  tester is alone with a phone for a week or two; a report lost to an unreachable
  backend is the one that mattered. Sync is a secondary copy, upserted on
  `(user_id, client_id)` so a retry after regaining signal never duplicates.
- **Automatic captures are filed as drafts and never interrupt.** Shake,
  ErrorBoundary, unhandled rejection and API 5xx/network all file silently. Only
  the bubble's long-press opens a sheet. `syncPending` skips drafts until they
  are promoted.
- **Breadcrumbs reuse the first-party analytics events** rather than building a
  second trail that could disagree with the first.
- **Redaction happens at capture time, not export time.** The reports are pasted
  into a chat window, so a bearer token that reached disk has already travelled
  too far. Bearer/Basic headers, bare JWTs, credential-shaped JSON keys, Clerk/
  RevenueCat/Google key shapes and base64 image payloads are all stripped before
  anything is written.
- **`debug_reports` is covered by `GET /api/export`** (the screenshot as a
  presence flag, not inlined) and cascades on account deletion like every other
  user table. The existing `TestExportCoversEveryUserTable` caught this — it was
  a real gap, fixed in the code rather than by relaxing the test.
- **The store uses `expo-file-system/legacy`.** The new `File`/`Directory` API is
  a much larger surface for what this needs. Revisit if legacy is removed.

## Documentation posture after the rename (2026-08-06)

- **Living docs were renamed; historical reports were not.** `STATUS.md`,
  `CONFIG.md`, `DEPLOY.md`, `README.md` and `FIRST_HOUR.md` describe the current
  system, so they say Lume. `SUBMISSION_READINESS.md`, `TESTFLIGHT_READINESS.md`,
  `CLEANUP_REPORT.md`, `SECURITY_AUDIT.md`, `LANDING_REDESIGN.md` and
  `FIRST_RUN_CHECKLIST.md` are point-in-time records of a state that used the old
  names — renaming inside them would make them describe something that never
  happened.
- **Two STATUS.md claims were false and are now struck through rather than
  deleted**: the OAuth CSRF state store has been a Postgres table since the
  AWS-hardening work, and the app version/build are no longer hardcoded (they
  derive from `src/lib/appVersion.ts`). Its verification baseline also cited test
  counts that were never right.

## Final pre-TestFlight audit, Part 1 — Supabase (2026-08-06)

- **The Supabase MCP was not actually connected for this audit.** No MCP tools,
  no `DATABASE_URL`, no CLI login exist in this environment, so every claim
  about the LIVE database (applied migrations, live RLS, advisors, data state)
  remains unverifiable from here. Substitute proof: all migrations were applied
  in order to a real local Postgres 17 and the backend audited against that.
  Live verification is on the owner's list in FINAL_AUDIT.md.
- **The debug_reports migration could never have applied.** Its four RLS
  policies compared `auth.uid()` (uuid) to `user_id` (Clerk text) — a type
  error every Postgres rejects. Applied transactionally the whole migration
  rolls back, so the live table almost certainly does not exist and debug sync
  would have failed silently for the entire testing fortnight. Rewritten to the
  house pattern (`user_id = (select auth.jwt()->>'sub')`, one `for all` policy)
  and proven: all 14 migrations now apply clean from an empty database.
- **Eight foreign keys had no covering index** (notably `recipes.user_id`,
  which the recipes list hits on every request). Added
  `20260806000002_fk_covering_indexes.sql`; zero uncovered FKs remain.

## Final pre-TestFlight audit, Parts 2–7 (2026-08-06)

- **The fabrication engine was the pipeline's own "always yield one item"
  philosophy.** `MergeResults` and `IdentifyFoods` invented a whole-plate
  "Unknown food" whenever Gemini failed or answered garbage, and the handler
  wrote every outcome as 'ready' — 'failed' existed nowhere. Removed at the
  root: zero estimates → status 'failed' → the client's failed-scan card.
  Three tests that pinned the fabrication were rewritten and say so.
- **Scan identity must survive hydration.** The refresh-shaped double-count
  (save-after-refresh INSERTing a second row) existed because mealsFromLogs
  carried `status` but dropped `scan_session_id`. The mapper now carries the
  session id, the server log id and the confidence payload; hydration dedupes
  by session; discard deletes the server row; a replayed confirm returns the
  claimed row server-side. Five new/extended real-Postgres tests pin all of it.
- **Consent is enforced where the data leaves.** The three Gemini scan routes
  now check `profiles.ai_consent_at` server-side (optional-interface seam,
  compile-asserted on PGStore, fail-closed). Withdrawal exists in Settings →
  Privacy (server record first, then the device flag), and an offline accept
  self-heals by re-asserting the idempotent server write once per launch.
- **The gate now includes the real-Postgres tests.** 506 backend tests, 0
  skipped, with `LUME_TEST_DATABASE_URL` set; the old "569" was 560 + 9
  silent skips, and the 9 were the proofs that mattered.
- **Deliberately NOT fixed this pass** (documented in FINAL_AUDIT.md): gym
  step replay dedup, streak RMW lock, RevenueCat TRANSFER transaction,
  remaining queue-bypassing writes, graceful shutdown, /health DB ping,
  Go scan-learning dead code (its deletion would drop the crosscheck suite),
  analytics opt-out-vs-opt-in (owner decision), global AI spend ceiling
  (owner sets billing caps).

## Onboarding agent run (2026-08-08)

- **"Prefer not to say" now floors at 1,500 kcal, not 1,350.** The midpoint was
  the wrong shape of answer: under guideline 1.4.1 the cautious choice must not
  purchase a more permissive safety limit. We do not know that an unspecified
  user is not male, so they get the limit that is safe for everyone. Enforced
  identically in `backend/internal/goals/derive.go` and
  `src/lib/onboarding/deriveTargets.ts`, and by `clampCalories` on manual
  overrides. Four tests asserted 1,350 and were rewritten, each saying so.
  Cost: an unspecified-sex user on an aggressive deficit sees a slightly higher
  floor than strictly necessary. That is the correct direction to err.
- **The onboarding step pointer is persisted, the answers already were.** The
  reload symptom was never data loss — `last_step` simply did not exist, so
  there was nothing to resume to and the flow restarted at Welcome with the
  answers intact but invisible.
- **Continue is never disabled.** A disabled primary CTA cannot explain itself;
  the blocked state now names the offending field. This is the general rule for
  this codebase going forward, not a one-screen patch.
- **Unit toggles convert, never reinterpret.** kg↔lb and cm↔ft/in carry the
  typed value across. Reinterpreting the digits silently rewrote the user's
  body weight and fed it into BMR.
- **Render tests exist now** (`src/__tests__/render/`, a second jest project on
  react-test-renderer + jest-expo). `@testing-library/react-native` v14 does
  not wire up against React Native 0.85 — its `test-renderer` peer never
  receives a host config — so the tests query the tree by props instead of
  using RNTL queries. Reanimated and worklets are stubbed in `__mocks__/`.

## Onboarding follow-ups (2026-08-08)

- **Height and weight are REQUIRED; nothing in the calorie-derivation path
  substitutes a median.** `DEFAULT_HEIGHT_CM` / `DEFAULT_WEIGHT_KG` are
  deleted. They fed Mifflin–St Jeor directly, so a skipped field produced a
  personal calorie target computed from body data the user never gave. Enforced
  client-side with per-field reasons and server-side with bounds (100–250 cm,
  30–300 kg) applied AFTER unit conversion — the server rejects rather than
  defaults. Cost: a user who does not want to share these cannot finish
  onboarding. That is the correct trade against inventing them.
- **Unspecified sex resolves to the higher (1,500 kcal) floor** — recorded in
  the 2026-08-08 entry above; restated here because it is one of the three
  decisions this run was asked to log.
- **Every build identifies itself.** The server reads Go's own VCS stamping
  (`debug.ReadBuildInfo`) — no ldflags, nothing to forget — and reports the git
  SHA, commit time and dirty flag in its first startup log line and from
  `GET /health`. The app stamps the same SHA into `expo.extra` via
  `app.config.js` (EAS_BUILD_GIT_COMMIT_HASH on a cloud build, `git rev-parse`
  locally), so debug reports stop carrying `gitSha: null`. `app.json` stays the
  source of truth for every static field and a test asserts the dynamic config
  preserves all of them. This exists because a three-day-old `lumoserver` from
  a scratchpad served :8080 on 2026-08-08 while looking perfectly healthy.
- **"No onboarding record" and "the status request failed" are different
  answers.** `resolvePostAuth` (pure, tested) decides: a server yes/no is
  definitive, a failed check falls back to local evidence and says so in a
  toast. Conflating them re-onboarded existing users on a network hiccup.
- **Input units and the raw ft/in text are persisted** as display state only.
  They are never sent — the payload is always canonical cm/kg — but the form
  now redraws exactly as the user left it instead of recomputing digits.

## TestFlight test-mode configuration (2026-08-09)

- **A distributable build refuses to start unconfigured.** `isDevBuild()` is
  `__DEV__`, which is already false in TestFlight, so the mock-data shims were
  correctly off — but Clerk and RevenueCat gated on KEY ABSENCE, not on build
  type, so a TestFlight build with a missing key shipped an app with no auth
  and no purchase path that looked like it worked. `requiredEnv.ts` is now the
  single source of truth, enforced on screen (naming each variable) and at
  build time via `eas-build-pre-install`.
- **`preview` could never have reached TestFlight.** It is
  `distribution: "internal"` — ad-hoc/enterprise signing, which App Store
  Connect rejects. The new `testflight` profile is store distribution with
  debug capture on; a store profile may set env vars freely.
- **The debug-gating invariant changed deliberately.** "No store-distributed
  profile may enable capture" made the required configuration impossible once
  TestFlight was the target. The property that matters — the PUBLIC App Store
  profile carries no capture flag — is unchanged and still asserted; capture
  profiles are now explicitly allow-listed and disclosed in tester notes
  (2.3.1).
- **Sandbox durations need no special handling.** Entitlement checks compare
  the real `expires_at` timestamp, so Apple's accelerated sandbox renewals
  (1 month → 5 min) and TestFlight's flat 24 h renewals both work unmodified.
  There is deliberately no client-side purchase timeout — sandbox purchases
  routinely take 15+ seconds.
- **Preflight refuses to let a build be spent on a broken configuration**, and
  a check that cannot run says so rather than passing quietly.
