# Lumo — Production Readiness Report (2026-07-26)

Cleanup, hardening and audit pass. Full security detail in
[SECURITY_AUDIT.md](SECURITY_AUDIT.md); load-bearing decisions condensed into
[DECISIONS.md](DECISIONS.md); every env var in [CONFIG.md](CONFIG.md).

## What was deleted (all with proof of zero references)

- **16 dead frontend files** (~600 LOC): 8 unimported barrel/stub `index.ts` files, 3
  components kept alive only by dead barrels (MealCard, UncertaintyPromptCard,
  BackButton), Box.tsx, a dev check script. Proof: import-graph fixpoint over `src/`
  (alias/side-effect/require aware).
- **4 one-off scripts**: gen-screens, migrate-colors, migrate-icons, reset-project
  (+ its package.json entry) — applied codemods and Expo boilerplate.
- **2 dead Go functions**: `ai.Register` (superseded by `Service.Routes`), `DensityFor`
  (zero call sites; the `Densities` map it read is used and stays). Proof:
  `x/tools/cmd/deadcode` + module-wide grep, filtered against test references.
- **7 stale docs**: 3 morning reports, 2 phase plans, NATIVE_AUDIT, ROUTE_COVERAGE.
- **3 trivial lint-cruft fixes** (unused imports, duplicate import).
- Deliberately KEPT despite looking dead: `entitlement.ts` (shipped billing-gate seam),
  `gym.Register` + scan learning helpers (test-referenced), APP_STORE_CHECKLIST/METADATA
  (forward-looking), `lib/mock/` (keyless dev mode seeds from it).

**Packages**: dependencies 31 → 29 (removed react-dom, react-native-web — iOS-only
product, `web` script + app.json web block removed too); devDependencies 9 → 7
(removed jest-expo, @react-native/jest-preset, @testing-library/react-native — the
jest config never used them; added @types/node for the new secrets test).
**Verify on next native build**: no expo-* packages were removed this pass, so no
autolinking risk; the react-native-web removal only affects the (deleted) web target.

## Test suites vs automation scaffolding — the interpretation taken

**Interpretation** (correct me if wrong): the real test suites — backend
`tests/` + `*_test.go` and app `src/__tests__/` — are the product's
verification. They stay tracked, running, and were never candidates for
deletion or gitignoring. What got separated out as "local automation":
`scripts/audit-routes.mjs` (route-coverage checker — kept on disk, now
gitignored, was never tracked), coverage output (`coverage/`, `coverage.out`,
`*.lcov`), and `.env` files. The one-off codemod scripts were deleted outright.

`.gitignore` now covers: `.env`/`.env.local` everywhere (`.env.example` files stay
tracked), coverage output, `/ios` + `/android` (prebuild output), Go build output,
logs, editor/OS cruft, the audit script, and the font DMG.

## Production database bring-up

1. Fresh Supabase project (or the existing one) → `supabase db push` applies all
   **10** migrations in filename order (includes the previously-unapplied Phase-12/13
   ones and the new `20260726000001_cuisine_library_rls.sql`).
2. Start the backend → `exercise_library` + `cuisine_food_library` seed themselves
   (idempotent `ON CONFLICT DO NOTHING`, runs on every startup, non-fatal).
3. Only if the DB already held dev/test data: run
   `backend/scripts/reset_production.sql` **by hand** (psql / SQL editor). It
   TRUNCATEs all 31 user-data tables (listed explicitly in the file), keeps the
   schema, RLS, and the 2 seeded libraries. Nothing ever runs it automatically.

## Production auth posture

- Dev fallbacks stay, but are now **dev-build-only** (`__DEV__`, via
  `src/lib/env.ts`): a **release** build with no Clerk key renders a hard
  "Configuration error" screen instead of the silent local-dev session, and a release
  build with no RevenueCat key grants **no** entitlement (dev default-entitled applies
  only to dev builds).
- The client bundle can only ever contain public config:
  `src/__tests__/secretsPosture.test.ts` fails on any non-`EXPO_PUBLIC_*`
  env read, any server-secret name, or any key-shaped literal in `src/`.
- Backend config is now fully env-driven: `LUMO_BASE_URL` (public origin — CORS,
  OAuth redirects, webhook URLs derive from it), `PORT`, and a dev-only
  `backend/.env` loader (real env always wins). No production code edit needed.

## Security audit — executive summary

Good shape: RS256-pinned JWT middleware on all 82 `/api` routes (webhooks
signature-verified, OAuth callback state-verified, `/health` static); identity
only ever from the verified token; RLS now on 33/33 tables; parameterized SQL
throughout; body-size caps (20MB global / 24MB scan / 1MB webhooks); OAuth
tokens AES-256-GCM at rest; scan images never persisted; minimal secret-free
logging. **Fixed this pass**: missing RLS on `cuisine_food_library` (new
migration) and the Go `x/text` vulnerability (govulncheck now clean). Remaining:
49 npm advisories, all dev-time tooling transitives — none in the shipped
bundle; clear them with the next Expo SDK upgrade. Details: SECURITY_AUDIT.md.

## Monorepo deploy layout

`backend/` is self-contained (`backend/go.mod`, no imports outside it): deploy is
`go build -o server ./cmd/server` + env vars on any host, TLS terminated by the
platform. The app builds independently from the repo root. One caveat: the
`tests/migrations` suite reads `../supabase/migrations`, so run tests from the
monorepo, not a copied-out backend. No Dockerfile exists or is referenced; the
static binary makes one optional (a 5-line scratch image if ever wanted).

## Final verification (all green)

| Check | Result |
|---|---|
| `go build ./...` / `go vet` / `gofmt -l` | clean |
| `go test ./... -count=1` | 23/23 packages ok (365 test funcs) |
| `go mod tidy` | no diff |
| `govulncheck` | no vulnerabilities |
| `npx tsc --noEmit` | clean |
| `npx eslint src/` | 0 errors |
| `npm test` | **303 passed** (was 300 — +3 secrets-posture) |
| Route coverage | 82/82 (100%) |

## Remaining human steps to go live

1. **Deploy the backend** (`backend/` → any Go host) and set its env per CONFIG.md —
   including `LUMO_BASE_URL=https://<api-origin>`.
2. **Apply migrations to the prod DB**: `supabase db push` (all 10).
3. **Set app keys** in `.env`: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (see CONFIG.md).
4. **Clerk dashboard**: Apple + Google SSO, Email verification-code strategy,
   allowlist the `veltai://` scheme; put `CLERK_SECRET_KEY`/`CLERK_WEBHOOK_SECRET`
   in the backend env.
5. **RevenueCat dashboard**: products ($8.99/mo, $49.99/yr, 7-day trial), default
   Offering, **`pro` entitlement** (exact id), hosted Paywall design, webhook →
   `<LUMO_BASE_URL>/api/webhooks/revenuecat` with the `REVENUECAT_WEBHOOK_AUTH` value.
6. **Point the app at the deployed backend**: `BASE_URL` in `src/lib/api/index.ts`.
7. **Native rebuild** (`npm run ios` with the phone connected) — required for
   RevenueCat and SSO end-to-end.
8. **Demo account + TestFlight**: create the review account in Clerk, run
   `backend/scripts/seed_demo_account.go -user <clerk_id>`, then the TestFlight pass.

## Honest: what remains unverified

- **Live-service first runs**: Clerk SSO/OTP and the RevenueCat paywall compile and
  are logic-tested, but have never run against live services — treat the first real
  signup and first sandbox purchase as genuine tests.
- **Expo Go boot** is proven at the logic level (303 tests, key-gated module graph);
  the actual boot is a 30-second human check.
- The **release-build hard-error screen** is compiled-in (`__DEV__=false` path) and
  cannot be exercised without a release build.
- `reset_production.sql` and the new RLS migration are hand-written against the full
  schema but have not run against a live database.
- Phases E/F were executed F-then-E (docs written once, describing the final
  posture); phases H/I merged so this report is inside the pushed commit.
