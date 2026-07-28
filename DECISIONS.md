# Lumo — Decisions

## Phase 14 — pre-submission audit (2026-07-28)
- **Account deletion now deletes the Clerk identity too** (5.1.1(v)): DELETE
  /api/profile calls Clerk's Backend API first (`NewClerkUserDeleter`); a
  provider failure → 502 and NO row delete (never claim a deletion that left
  the account able to sign in). Clerk 404 = already gone = success. Keyless
  (hermetic/dev) skips the provider call. The client dispatches
  ACCOUNT_DELETED (was: manual routing with NO purge — stores, queue and the
  Clerk session all survived deletion). SIGN_OUT arriving in `deleted` is
  swallowed so the purge's own Clerk sign-out doesn't bounce the user to the
  sign-in screen.
- **Delete-flow copy fixed to be true**: deletion is immediate (the "7-day
  grace period" line was false — the backend hard-deletes), and deleting the
  account does NOT cancel a subscription (the old copy claimed it did; Apple's
  account-deletion guidance requires saying billing continues and pointing at
  subscription management).
- **Data export built** (GET /api/export → Settings → Privacy → "Export my
  data" → iOS share sheet): the App Store description already promised export,
  the app holds health data, and there is no web portal — GDPR access posture
  says build it. Table coverage is derived from the migrations by
  tests/migrations TestExportCoversEveryUserTable (a new user-data migration
  without an export entry fails CI). integration_connections strips
  access/refresh tokens; confidence_calibration (global aggregate, no user
  rows) and the two shared libraries are excluded. Export shares JSON text via
  RN Share — no new dependencies; move to a file share if exports outgrow it.
- **Privacy screen links route to the in-app legal documents** — the previous
  external links (veltai.app/privacy|terms|eula) were dead URLs; the EULA row
  is gone (no custom EULA → Apple's standard EULA applies). The dead
  "Export my data — Phase 2" placeholder row is now the real export.
- **reset_production.sql now truncates analytics_events** (the analytics
  migration post-dated the script; its own header demands the list stay
  complete).
- **Voice logging REMOVED** (route, add-menu card, mock transcript, mic
  permission strings): the screen was a pure simulation — a canned transcript
  on a 220ms timer and a "Save meal" that saved nothing. No audio-recording
  module exists in the build. Shipping a fake feature + an unused mic
  permission is a double 2.1/2.3.1 rejection; honest removal beats building
  speech-to-text mid-audit. `"microphonePermission": false` suppresses the
  expo-camera plugin's default mic string (verified in the installed plugin
  source: value false deletes the Info.plist key).
- **Apple Health UI REMOVED** (apple-health screen, settings row, integrations
  card, dashboard cross-check, "Send to Apple Health" button, lib/healthkit,
  NSHealth* strings): the toggle faked "Connected", the dashboard displayed a
  hardcoded 540 kcal / 8,240 steps as the user's real Apple Health data, and
  the send button fake-succeeded. Fabricated health data is worse than a dead
  button (2.1 + 2.3.1 + arguably 5.1.3(ii) spirit). The guarded no-op seam
  `src/lib/health/appleHealth.ts` STAYS (test-covered) as the landing point
  for the real native module. CalorieCrossCheck deleted with it (its only
  remaining render was intake-vs-goal, duplicating the ring above it).
- **Sign out now exists** (Settings, above Delete account, with a native
  confirm). Before this the ONLY way to end a session was deleting the
  account. Dispatches SIGN_OUT; the machine already handles purge + Clerk
  session end + RevenueCat logOut.
- **Subscription screen rewritten to be truthful**: it hardcoded a "Free
  trial" badge, rendered the mock plan/price as if real, its Restore button
  was a toast with no restore call, and "Manage" opened app-settings: (the
  permissions page). Now: entitlement from the billing seam (useEntitlement —
  previously zero call sites), real restorePurchases(), Manage →
  apps.apple.com/account/subscriptions, honest dev-mode note. useSubscription
  hook deleted with it (no remaining consumer); no fabricated dates.
- **Calorie targets clamped to [1200, 10000] kcal** at every write path:
  client store (clampCalories), onboarding manual-adjust sheet, and PUT
  /api/goals (400 outside the band — the server is the boundary). Derivation
  already floored at 1200; override paths accepted 0 or 50,000 before this.
- **Every LLM system prompt now carries a medical guardrail** (no medical/
  diagnostic/medication advice, no extreme-restriction advice, refer to a
  professional) — enforced by a test that captures the system string through
  the LLM seam for all three endpoints.
- **Third-party-AI consent (5.1.2(i))**: one persisted, device-level
  acknowledgment (cleared on sign-out) gates every share point — photo/label
  capture (Gemini), Ask-Lumo send, the insights screen mount, and the
  morning-brief fetch (Anthropic). Until granted, nothing is uploaded and no
  AI endpoint is called; the brief card renders null.
- **Analytics buffer purged on sign-out** (resetAnalytics in resetAllStores):
  user A's unsent events could otherwise flush under user B's JWT (events
  carry no user id; the backend attributes from the verified token).
- **Fake "feedback sent" fixed**: the support form now opens a prefilled
  mailto compose (the send is real); the FAQ and third-party-licenses rows
  were REMOVED — veltai.app is NXDOMAIN (verified by dig), so every external
  link to it was dead. In-app legal screens carry the policy/terms.
- **BASE_URL is now env-driven** (`EXPO_PUBLIC_API_URL`, dev default
  localhost:8080) — deploying no longer requires a code edit; CONFIG.md and
  .env.example updated.
- **Nutrition dashboard shows the HealthDisclaimer** (targets are displayed
  there; onboarding targets + goals settings already had it).
- **Cross-source workout dedupe** (energy cross-check): provider imports are
  skipped when a same-day session of the same type with a duration within
  ±10 min already exists from ANOTHER source (manual log or other provider) —
  `IsCrossSourceDuplicate` (pure, tested) called inside
  `CreateImportedSession`; same-provider rows are excluded from the comparison
  (they dedupe exactly by activity id). Ceiling: gym_sessions stores no start
  time, so two genuinely distinct same-type/similar-length sessions in one day
  from different sources will merge — store a start timestamp to upgrade.
  Manual-after-import stays possible (an explicit user action; import-side is
  the automated path that must not double-count).
- **Energy balance is anchored to the DEVICE's calendar**: the app passes its
  local date (`todayISO()`) as `?date=`/`?end=` to both energy endpoints, so a
  meal logged at 23:50 local lands on the correct local day even when the
  server's LUMO_TIMEZONE calendar has rolled over. `?end=` on the weekly route
  is new (validated, defaults to the server calendar).
- **HIG pass (Phase 14)**: keyboard avoidance now lives in the four shared
  scaffolds (Screen/OnbScaffold/SheetContent/BottomSheet) — screens must not
  roll their own; fixed-height text containers are banned in shared chrome
  (TextField/NavBar use minHeight for Dynamic Type); destructive actions
  render in accent.red (the dead monochrome ternary was unfinished intent, and
  account.tsx's own comment already claimed red); the onboarding targets sheet
  edits ONLY the calorie target (macro edits were never persisted — fields
  removed rather than silently discarded). Full ledger: HIG_AUDIT.md.


Load-bearing decisions only: each of these still governs live behaviour and
would cause a bug (or an App Store rejection) if reversed without thought.
Grouped by area; history lives in git.

## Auth
- **Pure auth machine** (`src/lib/auth/machine.ts`): `transition(state, event) → {state, effects}`,
  6 states; AppStateProvider executes effects. `expired` keeps `isAuthenticated=true` so the UI
  never bounces during a silent refresh; `deleted` is distinct so hydration is hard-skipped.
- **ClerkBridge does NOT dispatch SIGNED_IN** — the signup screen owns post-auth routing because
  the SERVER's onboarding status is the truth (local store is empty on a fresh install). The
  bridge only detects sign-OUT, registers API/machine seams, and syncs RevenueCat identity.
  Re-adding SIGNED_IN routing will race the signup screen and app/index.tsx cold-start gate.
- **401 handling**: ONE forced refresh (`getToken({skipCache:true})`) → retry → only then
  UNAUTHORIZED → machine `expired` → sign-out on refresh failure.
- **Email auth is EMAIL-CODE (OTP)**, not passwords — fewer screens, no reset flow, doubles as
  verification; sign-in and sign-up share the OTP UI.
- Machine-initiated sign-outs also end the Clerk session via `signOutSeam` (called from the
  purge effect); `resetAllStores()` purges every zustand store + offline queue.
- **Dev/release posture**: no Clerk key in a DEV build → local dev auth mode (fully navigable);
  no key in a RELEASE build → hard config-error screen, never a silent authenticated session
  (`isDevBuild()` in `src/lib/env.ts`, checked in the root AuthGate).

## Billing
- **Entitlement identifier: `pro`** — the app checks that exact string.
- **Hosted RevenueCat paywall** (`presentPaywall()`), custom price cards deleted. Pricing/trial
  copy lives in the RC dashboard. Dismiss-without-purchase still completes onboarding —
  entitlement gates access, not onboarding.
- `react-native-purchases` is NATIVE-ONLY: lazy `require` behind the env key + try/catch, so
  Expo Go never crashes (billing-disabled mode). `Purchases.logIn(clerkUserId)`/`logOut()` ride
  the auth transitions. Release build + no key ⇒ NOT entitled (no silent free tier).
- Test seams: `__setPurchasesModule` injection implies billing-enabled (explicit intent).
- Restore Purchases lives in Settings (Apple requirement).

## Scan / learning
- **Identity corrections NEVER move the portion multiplier** — a changed food name is a
  misidentification (→ `user_food_affinity`), not a portion error (`ClassifyCorrection`).
- Portion EWMA: meal-scoped factor needs **≥3 samples** to outrank the food-level factor;
  uniqueness is `(user_id, food_name, coalesce(meal_type,''))`.
- **Multi-image reconciliation is geometry-based**; Gemini identification runs ONCE on the
  top-down image. Agreement = 1 − stdev/mean: ≥0.75 merges (top-down ×2 weight, confidence
  +15); <0.75 surfaces BOTH estimates + `needs_user_confirmation` (−20).
- Confidence bands: High ≥55 / Medium ≥35; band means update in SQL-side arithmetic (no
  read-modify-write race). Discard = `correction_type='discard'` + `scan_sessions.discarded`.
- Per-user Gemini context (`BuildUserContext`) is capped ≈400 tokens and omits any signal with
  <3 observations.

## Gym / energy
- ACSM formulas are pure (`internal/energy/formulas.go`); kcal = MET·3.5·mass/200·min.
  `met_fallback` is always LOW confidence; an estimate, schema default, or unknown bodyweight
  downgrades to MEDIUM.
- **Double-counting guard**: session-complete recompute sums ACSM-parameter exercises + the MET
  path for the rest; the duration fallback fires ONLY when the session had no exercises.
- Strava/WHOOP imports keep the provider's calories (`calculation_method='device'`) — imported
  parameters are for records/charts, never a recompute.
- Same-day streak re-bump is a no-op → idempotent replay is safe.
- `gym.Register` stays as a byte-compat delegate to `RegisterWithEngine` (tests call it).

## Data model / API
- Envelope `{data, error}` on every route; all `/api` behind Clerk JWT middleware except
  /health, signature-verified webhooks, and the state-token-verified OAuth callback.
- Migrations are append-only; every `references profiles(id)` must declare ON DELETE CASCADE
  (enforced by a migration-parse test) so DELETE /api/profile genuinely erases the account.
- Idempotency: partial unique indexes on food_logs/gym_sessions + `Idempotency-Key` header;
  the offline queue reuses one key per mutation across retries.
- RLS enabled on every user table; shared libraries (exercise_library, cuisine_food_library)
  are seeded idempotently on startup.
- All backend config from env; `LUMO_BASE_URL` is the single public-origin source (CORS,
  redirects, webhooks derive from it). backend/.env is a dev convenience — env vars win.

## Product / naming
- **Veltai→Lumo rename NOT done** — bundle id/slug/scheme are an App Store identity change; a
  human must decide. The Clerk scheme allowlist and SSO redirects derive from `scheme:
  "veltai"` — renaming means updating Clerk config too.
- No render tests by design (device QA via TestFlight); backend tests are hermetic (fake
  stores, httptest, generated JWT keys). jest runs babel-jest + node env (jest-expo's winter
  runtime crashes here); `expo/virtual/env` is mapped to a mock because babel-preset-expo
  rewrites `process.env.EXPO_PUBLIC_*` reads into that ESM module.
- The app is fully navigable keyless in a dev build (mock-seeded stores) — that's the Expo Go
  development mode, protected by the release-build guard above.

## Production pass (2026-07-26)
- Dead code swept with proof (import-graph fixpoint for src/, deadcode+grep for Go): 16 dead
  frontend files, 4 one-off scripts, `ai.Register`, `DensityFor`, 7 stale phase reports.
  `src/lib/billing/entitlement.ts` KEPT despite 0 inbound refs — it is the shipped billing-gate
  seam; the product has no gated feature yet by explicit decision.
- Scan learning helpers (PickCalibrationFactor/HourBucket/UpdateBandMean) are unreachable from
  main (live path is SQL-side) but KEPT: test-covered documentation of that SQL logic.
- Packages removed: react-dom, react-native-web (+ web script/config — iOS-only product),
  jest-expo, @react-native/jest-preset, @testing-library/react-native. @types/node added
  (secrets-posture test). Kept despite 0 direct imports: expo-linking, expo-splash-screen,
  react-native-worklets, react-native-screens (peer/plugin roles).
- Secrets posture enforced by `src/__tests__/secretsPosture.test.ts`: only EXPO_PUBLIC_* env
  reads client-side, no server-secret names in client code, no hardcoded key material.
- `backend/scripts/reset_production.sql` wipes user data (31 tables listed explicitly), keeps
  the 2 seeded libraries; run by hand only, never by the build.
- Phases E and F were executed F-then-E so the condensed docs describe the final posture.

## Marketing site + product analytics (2026-07-26)
- **/web is the third package**: Next.js 16 App Router, `output: 'export'` — pure static HTML
  (S3/CloudFront or nginx, no Node server), zero backend calls. No workspace tool: three
  packages with three toolchains are plain directories on purpose. Root tsconfig excludes
  web/ (each package typechecks itself).
- **Site design derives from the app's tokens**, not a template: palette ink #171717 /
  paper #FFFFFF / warm zone #F6F5F2 (the site's one deviation from app-neutral) / card
  #F2F2F7 / line #E5E5EA / secondary #6B6B6B, app accents (energy #EC6330, positive
  #67CE67, data #3A82F7, warn #F1A33B, ai #B25FEA) functionally only. Type: **Hanken
  Grotesk** display+body, **IBM Plex Mono** for every number/label (the "instrument, not
  marketing" voice). Signature element: "the same plate, told honestly" — the scan
  pipeline's geometry view + confidence badge vs a false-precision foil. Site confidence
  badges must respect the REAL bands (48% = medium; 78 would be high).
- **Site GA4 is consent-gated**: loads only when NEXT_PUBLIC_GA_ID is set AND the visitor
  accepts the one-line note AND no DNT/GPC. Tracked: page views + CTA clicks, nothing else.
  CTA is an honest "Coming soon" chip + mailto — no fake Download button, no email backend.
- **App analytics are FIRST-PARTY ONLY** (`POST /api/analytics/events` → analytics_events,
  RLS owner-only, migration 20260727000001): a third-party SDK would break the app's stated
  "no ad or tracking SDKs" promise. Typed 12-event allow-list enforced client AND server
  side; properties are scalar tags, never PII. The event schema is the clean seam to pipe
  into a heavier tool later if ever wanted.
- **The analytics opt-out is a persisted privacy choice** (secure-store,
  `veltai.analyticsEnabled`): survives restart AND sign-out — `reset()` deliberately does
  not touch it. Found by adversarial review; without this, "off means fully off" was false.
- `trial_started` and `feature_used` are allow-listed but not yet instrumented (the hosted
  paywall doesn't expose trial-vs-purchase client-side; feature_used has no single seam).
- web/ eslint uses @next/eslint-plugin-next's native flat config — eslint-config-next's
  FlatCompat path crashes under ESLint 9.
- **No license chosen**: LICENSE is Expo scaffolding boilerplate; default is
  all-rights-reserved. The owner must pick a real license before open-sourcing
  (flagged in CONTRIBUTING.md).
- **Vercel deploy config lives in `web/vercel.json`** (`outputDirectory: "out"`): the project's
  framework preset is null/"Other", so Vercel looked for `public/` and failed the deploy even
  though the export succeeded. Repo-controlled so it can't drift with dashboard state. Also
  `turbopack.root` pins web/ as its own workspace root (the monorepo's root lockfile was being
  inferred instead, mis-scoping resolution/tracing on CI).
- **The social card is a committed `public/og.png`**, not an `opengraph-image` route: under
  `output: 'export'` that route emits an EXTENSIONLESS file, which every static host serves as
  `application/octet-stream` and every crawler ignores — link previews would have silently
  broken. Regenerate with `node web/scripts/make-og.mjs`.
