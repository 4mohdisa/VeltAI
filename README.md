# Lumo

Food and fitness tracking for iOS. Log meals by photo, barcode, nutrition
label or search; log gym sessions with real exercise parameters; see an honest
daily energy balance — calories in against BMR plus exercise, computed from the
published ACSM metabolic equations rather than a flat guess.

## Layout — three independent packages

| Path | What it is |
|---|---|
| `src/` | The Expo React Native app (expo-router). **It lives at the repo root — there is no `/app` directory.** |
| `backend/` | Go 1.26 API server — a self-contained module, deployable on its own. |
| `web/` | Next.js marketing site — static export, its own `package.json`. |
| `supabase/migrations/` | Numbered SQL migrations, append-only. |

Each package builds, tests and deploys on its own. No workspace tool, no
cross-package imports.

## Run

```bash
npm install && npx expo start          # app (repo root)
```

```bash
cd backend && cp .env.example .env && go run ./cmd/server
```

```bash
cd web && npm install && npm run dev    # http://localhost:3000
```

With no keys set, a dev build of the app runs fully navigable against
mock-seeded stores. A native build (`npm run ios`) is required for RevenueCat
and SSO to work end to end.

## Test

```bash
npx tsc --noEmit && npm run lint && npm test   # app: types, lint, 317 tests
```

```bash
cd backend && go build ./... && go vet ./... && gofmt -l . && go test ./... -count=1
```

```bash
cd web && npm run build && npm run lint && npm run typecheck
```

Run the backend tests from inside the monorepo — the `tests/migrations` suite
reads `../supabase/migrations`.

## Deploy

Backend: `cd backend && go build -o server ./cmd/server`, then run the binary
with the env vars set (TLS terminated by the platform). Set `LUMO_BASE_URL` to
the public origin — CORS, OAuth redirects and webhook URLs all derive from it.
Point the app at it with `EXPO_PUBLIC_API_URL`.

Database: `supabase db push` applies the migrations in filename order. The
server seeds the shared exercise and cuisine libraries idempotently on startup.

Site: `cd web && npm run build` produces a static `web/out/` folder.

## Where things are documented

| | |
|---|---|
| Every env var and dashboard step | [CONFIG.md](CONFIG.md) |
| Current state, open issues, what's left to launch | [STATUS.md](STATUS.md) |
| The constraints you could accidentally break | [DECISIONS.md](DECISIONS.md) |
| How to work in this repo | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Reporting a vulnerability | [SECURITY.md](SECURITY.md) |

All API routes live under `/api`, require `Authorization: Bearer <Clerk JWT>`
(webhooks and the OAuth callback excepted — those are signature- and
state-verified), and respond with the envelope `{ "data": ..., "error": null }`.
