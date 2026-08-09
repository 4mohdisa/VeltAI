#!/usr/bin/env bash
#
# Lume migration runner — explicit, confirmed, never automatic.
#
#   ./deploy/migrate.sh status     # what is applied vs pending (read-only)
#   ./deploy/migrate.sh apply      # apply pending migrations, one at a time
#   ./deploy/migrate.sh verify     # re-check that applied == on-disk
#
# WHY THIS IS NOT WIRED INTO CONTAINER START:
#   An auto-migrating container that crash-loops runs your migrations in a loop
#   against production. Even "idempotent" DDL does real damage that way (locks,
#   partial transactions, an ALTER that half-applies on each pass). Migrations
#   are a deliberate, human-confirmed step, run once, with a backup taken
#   first — see DEPLOY.md step 4.
#
# Requires: psql. DATABASE_URL must be set (Supabase pooler URL, sslmode=require).
# Reads migrations from supabase/migrations/*.sql in filename order.

set -euo pipefail

MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/supabase/migrations"
TABLE="schema_migrations"

die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
info() { printf '\033[36m%s\033[0m\n' "$*"; }
ok()   { printf '\033[32m%s\033[0m\n' "$*"; }

[[ -n "${DATABASE_URL:-}" ]] || die "DATABASE_URL is not set. Export it (or source your env file) first."
command -v psql >/dev/null || die "psql not found. sudo apt-get install -y postgresql-client"
[[ -d "$MIGRATIONS_DIR" ]] || die "migrations directory not found: $MIGRATIONS_DIR"

# psql flags: quiet, no pager, and -v ON_ERROR_STOP=1 so a failed statement
# aborts instead of silently continuing into the next one.
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qtAX)

ensure_table() {
  # RLS with no policy = deny-all for the anon/authenticated API roles, the same
  # posture as the backend-only tables in 20260729000001. On Supabase every table
  # in `public` is exposed through PostgREST, so without this the bookkeeping is
  # writable with the anon key — and a forged version row makes `apply` silently
  # SKIP a migration. migrate.sh itself connects as the owner and bypasses RLS.
  "${PSQL[@]}" -c "
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      version     text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now(),
      checksum    text NOT NULL
    );
    ALTER TABLE ${TABLE} ENABLE ROW LEVEL SECURITY;" >/dev/null
}

checksum_of() { shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1 || sha256sum "$1" | cut -d' ' -f1; }

applied_versions() { "${PSQL[@]}" -c "SELECT version FROM ${TABLE} ORDER BY version;"; }

cmd_status() {
  ensure_table
  local applied pending=0
  applied="$(applied_versions)"
  info "Migrations in $MIGRATIONS_DIR"
  echo
  printf '  %-46s %s\n' "MIGRATION" "STATE"
  printf '  %-46s %s\n' "---------" "-----"
  for f in "$MIGRATIONS_DIR"/*.sql; do
    local v; v="$(basename "$f" .sql)"
    if grep -qxF "$v" <<<"$applied"; then
      # Drift check: an applied migration whose file has since changed is a
      # real hazard — the database does not match what is in git.
      local want have
      want="$(checksum_of "$f")"
      have="$("${PSQL[@]}" -c "SELECT checksum FROM ${TABLE} WHERE version = '${v}';")"
      if [[ "$want" != "$have" ]]; then
        printf '  %-46s \033[31mAPPLIED (FILE CHANGED SINCE!)\033[0m\n' "$v"
      else
        printf '  %-46s applied\n' "$v"
      fi
    else
      printf '  %-46s \033[33mPENDING\033[0m\n' "$v"
      pending=$((pending + 1))
    fi
  done
  echo
  info "$pending pending"
}

cmd_apply() {
  ensure_table
  local applied pending=()
  applied="$(applied_versions)"
  for f in "$MIGRATIONS_DIR"/*.sql; do
    local v; v="$(basename "$f" .sql)"
    grep -qxF "$v" <<<"$applied" || pending+=("$f")
  done

  if [[ ${#pending[@]} -eq 0 ]]; then ok "Nothing to apply — database is up to date."; exit 0; fi

  echo
  info "About to apply ${#pending[@]} migration(s) to:"
  # Never print the full URL — it contains the password. Host only.
  printf '  %s\n\n' "$(sed -E 's#^.*@##; s#/.*$##' <<<"$DATABASE_URL")"
  for f in "${pending[@]}"; do printf '  - %s\n' "$(basename "$f")"; done
  echo
  printf '\033[33mHave you taken a backup? (DEPLOY.md step 4.1)\033[0m\n'
  printf "Type 'apply' to continue: "
  read -r reply
  [[ "$reply" == "apply" ]] || die "aborted (you typed '${reply}')"

  for f in "${pending[@]}"; do
    local v; v="$(basename "$f" .sql)"
    info "applying ${v}…"
    # Each migration runs in ONE transaction together with its bookkeeping row,
    # so a failure leaves neither the schema change nor the record of it.
    # (A migration containing CREATE INDEX CONCURRENTLY cannot run in a
    # transaction — none currently do; if one is added, run it by hand.)
    {
      echo "BEGIN;"
      cat "$f"
      printf "INSERT INTO %s (version, checksum) VALUES ('%s', '%s');\n" "$TABLE" "$v" "$(checksum_of "$f")"
      echo "COMMIT;"
    } | "${PSQL[@]}" >/dev/null || die "migration ${v} FAILED — database rolled back to before this file. Fix it before retrying."
    ok "  applied ${v}"
  done
  echo
  ok "All migrations applied. Run './deploy/migrate.sh verify' to confirm."
}

cmd_verify() {
  ensure_table
  local bad=0
  for f in "$MIGRATIONS_DIR"/*.sql; do
    local v have want; v="$(basename "$f" .sql)"
    have="$("${PSQL[@]}" -c "SELECT checksum FROM ${TABLE} WHERE version = '${v}';")"
    want="$(checksum_of "$f")"
    if [[ -z "$have" ]]; then
      printf '\033[33mPENDING\033[0m  %s\n' "$v"; bad=$((bad+1))
    elif [[ "$have" != "$want" ]]; then
      printf '\033[31mDRIFT\033[0m    %s (file changed after it was applied)\n' "$v"; bad=$((bad+1))
    fi
  done
  if [[ $bad -eq 0 ]]; then ok "Database matches the migrations on disk."; else die "$bad migration(s) pending or drifted."; fi
}

case "${1:-}" in
  status) cmd_status ;;
  apply)  cmd_apply ;;
  verify) cmd_verify ;;
  *) die "usage: $0 {status|apply|verify}" ;;
esac
