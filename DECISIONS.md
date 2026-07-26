# Lumo — Decisions

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
