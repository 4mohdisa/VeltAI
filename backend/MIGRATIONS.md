# Migrations

The schema lives in `supabase/migrations/*.sql`, applied in filename order by
`deploy/migrate.sh`. Nothing applies migrations automatically: not the server,
not the container start. Running the script against the hosted database is an
owner step.

## How a migration is applied

`./deploy/migrate.sh status | apply | verify` with `DATABASE_URL` set.

- `apply` lists the pending files, asks you to type `apply`, then runs each file
  in one transaction (`BEGIN; <file>; INSERT INTO schema_migrations ...; COMMIT;`)
  with `ON_ERROR_STOP=1`. A failing file rolls back completely: neither its
  schema change nor its `schema_migrations` row is kept, and the files after it
  do not run.
- Applied versions are recorded in `schema_migrations` with a SHA-256 of the
  file. A second `apply` applies nothing.
- `verify` fails on a pending file or on drift (an applied file that changed
  since).
- A migration with `CREATE INDEX CONCURRENTLY` cannot run inside a
  transaction. None does today; one that does has to be run by hand.

## Rollback

There are no down scripts, and the repo has never had them. Roll forward
instead:

1. A bad migration that failed rolled itself back. Fix the file and run
   `apply` again.
2. A migration that applied but is wrong gets a new, later migration that
   corrects it. Never edit an applied file: `verify` reports it as drift.
3. Every migration so far is additive (new tables, columns and indexes; no
   DROP or RENAME), so an older server binary keeps working against the newer
   schema. A destructive migration breaks that: write its reverse by hand and
   take a backup first.
4. If the data itself is wrong, restore the backup below (`DEPLOY.md`, section
   9).

## Backup before migrating the hosted database (owner step)

Done by the owner, on the server, never by a test or the loop. The full steps
are in `DEPLOY.md` section 4.

1. Take a dump: `pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc -f ~/lumo-pre-migration-$(date +%F-%H%M).dump`
   and check its size with `ls -lh`.
2. `./deploy/migrate.sh status`, then `apply`, then `verify`.
3. To undo at the data level: `pg_restore -d "$DATABASE_URL" --clean --no-owner --no-acl <dump>`.

## Tests

`backend/tests/migrations` runs against a local Postgres only. The URL must be
on localhost or 127.0.0.1 and name a `lume_test*` database. Each real-database
test creates its own `lume_test_migrate_<n>` database on that server, applies
`supabase_shims.sql` (the roles and `auth` functions Supabase provides), and
drops only that database at the end.

| Test | What it checks |
| --- | --- |
| `TestPG_MigrationsApplyToEmptyDatabase` | every file applies in order to an empty database |
| `TestPG_MigrateScriptAppliesEachMigrationOnce` | `migrate.sh apply` records every file, a second `apply` applies nothing, `verify` passes, and the schema holds every table, column and index the migrations declare and every table the backend's SQL uses |
| `TestPG_FailedMigrationLeavesNoPartialChange` | a file that fails halfway leaves no table and no `schema_migrations` row |
| `TestPG_MigrationsKeepSeededRows` | rows seeded by `backend/scripts/seed_local.sql` after the first migration are unchanged after the rest |
| the tests in `migrations_test.go` | file naming, cascades to `profiles`, export coverage and runner RLS, without a database |

Run them:

```bash
cd backend
LUME_TEST_DATABASE_URL=postgres://localhost:5432/lume_test_local?sslmode=disable go test -count=1 -v ./tests/migrations/...
```

`npm run verify` runs them through `npm run verify:migrations`, which refuses
to start unless `LUME_TEST_DATABASE_URL` points at localhost or 127.0.0.1.
