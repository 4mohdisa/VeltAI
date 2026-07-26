# Contributing to Lumo

Lumo is a food and fitness tracking app for iOS. You log meals by photo,
barcode, voice, or search; the backend computes calories and macros, tracks
gym sessions, and generates plain-language insights. It ships with no
third-party ad or tracking SDKs, and health data is never sold.

## Monorepo layout

The Expo app lives at the **repo root** — there is no `/app` package directory.

```
.
├── src/        # Expo React Native app (expo-router)
├── backend/    # Go API server (self-contained module)
├── web/        # Next.js marketing site
└── supabase/   # SQL migrations (append-only)
```

## Architecture

- **App**: Expo React Native with expo-router. State in zustand stores
  (`src/lib/data/`); `src/lib/design/tokens.ts` is the single styling source.
- **API**: Go 1.26. Each feature package defines a store interface with a
  Postgres implementation and a hermetic fake for tests. Every response uses
  the `{ "data": ..., "error": null }` envelope.
- **Database**: Supabase Postgres. RLS is enabled on every user table.
- **Auth**: Clerk (email OTP + Apple/Google SSO). **Billing**: RevenueCat.
- **Scan pipeline**: geometry-based multi-image reconciliation + Gemini
  identification (run once, on the top-down image) + confidence/calibration
  bands.
- **Energy**: ACSM equations (`backend/internal/energy/formulas.go`);
  kcal = MET · 3.5 · mass / 200 · minutes.
- **AI brain**: Go computes the numbers, Claude writes the words — the model
  never does arithmetic that matters.
- **Learning layer**: portion EWMA (meal-scoped factor needs ≥3 samples) +
  per-food identity affinity. Identity corrections never move the portion
  multiplier.

## Local setup

Every env var and dashboard step is in [CONFIG.md](CONFIG.md). With nothing
set, a dev build runs fully navigable against mock-seeded stores.

```bash
# App (repo root)
npm install
npx expo start

# Backend (Go 1.26+)
cd backend
cp .env.example .env   # fill in as needed
go run ./cmd/server

# Marketing site
cd web
npm install
npm run dev
```

## Running tests

```bash
npx jest                      # app (repo root)
cd backend && go test ./...   # backend — hermetic, no network or DB
cd web && npx next build      # marketing site
```

Run backend tests from inside the monorepo — `tests/migrations` reads
`../supabase/migrations`.

## Conventions

- Backend features follow the store pattern: interface + Postgres
  implementation + hermetic fake. Tests never touch the network or a real DB.
- Every API response uses the `{data, error}` envelope.
- RLS on every user table; migrations are append-only, and every
  `references profiles(id)` declares `ON DELETE CASCADE` (test-enforced).
- No secrets client-side: only `EXPO_PUBLIC_*` (app) and `NEXT_PUBLIC_*`
  (web) env vars may reach a client bundle — enforced by
  `src/__tests__/secretsPosture.test.ts`.
- `src/lib/design/tokens.ts` is the single styling source in the app.
- No render tests in the app by design; device QA happens via TestFlight.
- **[DECISIONS.md](DECISIONS.md) is the load-bearing why-log.** Read it before
  changing behaviour, and update it when you make a decision that governs
  behaviour.

## Branches and PRs

- Branch from `main`. Keep PRs small and focused.
- Tests green before review: `npx jest`, `cd backend && go test ./...`,
  `cd web && npx next build`.
- Fill in the PR template, including the DECISIONS.md checkbox when your
  change is behaviour-governing.

## License

**No license has been chosen for this project yet.** The `LICENSE` file at
the repo root is Expo's scaffolding boilerplate (MIT, copyright 650
Industries, Inc.) left over from project creation — it does not license this
codebase. The default is therefore all rights reserved. The owner must pick
a real license before open-sourcing; that is a decision only the owner can
make.
