# Seed data (local only)

Fills a local Lume database with six fake users for testing. Never point it at a hosted database.

## Run

From `backend/`, with the local dev database up (`docker compose -f docker-compose.dev.yml up db`):

```sh
export DATABASE_URL=postgres://lume:lume-local-dev-only@127.0.0.1:55432/lume

go run ./tools/seed          # seed: removes existing seed users, then adds all six
go run ./tools/seed reset    # reset: removes seed users only
```

Both commands run in one transaction, so a failure changes nothing. Seeding again replaces the seed users with fresh data dated from today.

## Local-only rule

The command exits with an error, before connecting, unless `DATABASE_URL` is a `postgres://` URL whose hosts are all `localhost` or `127.0.0.1`. It also refuses any URL containing `supabase.co`, a `?host=` override pointing elsewhere, and a multi-host URL with a remote host.

Reset deletes a profile only if its id starts with `seed_` **and** its email ends in `@example.test`. The user's other rows go with it through the `ON DELETE CASCADE` foreign keys on `profiles`. Other users are never touched.

## Seed users

All values are fake. None of them has subscription data.

| Clerk id | Email | What it covers |
|---|---|---|
| `seed_new` | new@example.test | Brand new: profile only, no onboarding, no data |
| `seed_active` | active@example.test | 21 days of food, gym Mon/Wed/Fri, goals, weights |
| `seed_heavy` | heavy@example.test | 90 days of food, 4 workouts a week with sets, reps and rising weights, weight every 2 days, goals |
| `seed_lapsed` | lapsed@example.test | Active from 75 to 31 days ago, nothing logged for the last 30 days |
| `seed_long_streak` | longstreak@example.test | A gym session every day for 59 days through yesterday |
| `seed_broken_streak` | brokenstreak@example.test | Daily sessions from 40 to 10 days ago, then none (streak 0, longest 31) |

Streaks follow the backend rule: consecutive days with a session, counted as current only if the last one was today or yesterday.

The seed does not create Clerk users, so the app cannot sign in as these users yet. Keep the `seed_` id: reset finds seed users by it.
