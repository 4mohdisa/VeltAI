# Lumo

Food and fitness tracking for iOS — an Expo/React Native app with a Go backend,
Clerk auth, RevenueCat billing, and a Supabase Postgres database.

## Monorepo layout

```
.
├── src/                  # Expo app (expo-router; the app lives at the repo root)
├── assets/               # fonts, icons, splash
├── backend/              # Go API server — SELF-CONTAINED, deployable on its own
│   ├── cmd/server/       # entrypoint (go run ./cmd/server)
│   ├── internal/         # feature packages: auth, food, gym, goals, scan, energy,
│   │                     # integrations, subscription, ai, recipes, cuisine
│   ├── scripts/          # reset_production.sql, seed_demo_account.go (run by hand)
│   └── tests/            # hermetic test suites (no network, no DB)
├── supabase/migrations/  # numbered SQL migrations — append-only ledger
├── CONFIG.md             # every env var + dashboard setup checklist
└── DECISIONS.md          # load-bearing decisions (read before changing behaviour)
```

## App

```bash
npm install
npx expo start
```

With no keys set, a dev build runs fully navigable against mock-seeded stores
(local dev auth mode + billing-disabled mode). With keys set (see
[CONFIG.md](CONFIG.md)), auth is Clerk, billing is RevenueCat, and the data
layer in `src/lib/data/` hydrates from the backend.

- Type check `npx tsc --noEmit` · lint `npm run lint` · tests `npm test`
- Native build (required for RevenueCat + SSO end-to-end): `npm run ios`

## Backend

Requires Go 1.26+. No Dockerfile yet — it deploys as a single static binary.

```bash
cd backend
cp .env.example .env   # fill in (loaded at startup; real env vars win)
go run ./cmd/server
```

Deploy: `cd backend && go build -o server ./cmd/server` and run `./server` on
any host with the env vars set (see [CONFIG.md](CONFIG.md)). Set
`LUMO_BASE_URL` to the public origin — CORS, OAuth redirect URLs and webhook
URLs all derive from it. `PORT` is honoured when the platform injects one.

The module is self-contained (`backend/go.mod`; nothing imports outside
`backend/`). One test suite (`tests/migrations`) reads `../supabase/migrations`
to validate schema shape, so run the full test suite from the monorepo, not
from a copied-out `backend/` alone.

### Database

Migrations live in `supabase/migrations/` and are applied with
`supabase db push` (or psql, in filename order). On startup the server
idempotently seeds the shared libraries (`exercise_library`,
`cuisine_food_library`) — a fresh production database needs migrations only.
To wipe test data before launch, run `backend/scripts/reset_production.sql`
by hand (destructive; see its header).

### API

All routes are under `/api`, require `Authorization: Bearer <Clerk JWT>`
(webhooks and the OAuth callback excepted — signature/state-verified), and
respond with the envelope `{ "data": ..., "error": null }`. Missing feature
keys degrade to a 503 on the affected endpoints; everything else keeps working.

### Tests

```bash
cd backend && go test ./...   # hermetic: fake stores, httptest, generated keys
npm test                      # app logic tests (no render tests by design)
```
