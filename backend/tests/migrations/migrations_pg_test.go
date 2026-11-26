// Row 17: the real migration runner, deploy/migrate.sh, against throwaway
// lume_test_migrate_* databases (see scratchDatabase). It checks that every
// migration applies once and in its own transaction, that a second run applies
// nothing, that a failing migration leaves no partial change, that seeded rows
// survive the migrations after them, and that the final schema holds every
// table, column and index the migrations declare and every table the backend's
// SQL reads or writes. See backend/MIGRATIONS.md.
package migrationstests

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
)

const (
	repoRoot   = "../../.."
	seedScript = "../../scripts/seed_local.sql"
)

// migrationTree builds a temporary copy of the repo layout migrate.sh expects
// (deploy/migrate.sh and supabase/migrations) holding only the named
// migrations plus any extra files, so a test can choose what the runner sees.
func migrationTree(t *testing.T, names []string, extra map[string]string) string {
	t.Helper()
	root := t.TempDir()
	dir := filepath.Join(root, "supabase", "migrations")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatalf("make migrations dir: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "deploy"), 0o755); err != nil {
		t.Fatalf("make deploy dir: %v", err)
	}
	files := map[string]string{}
	for _, n := range names {
		b, err := os.ReadFile(filepath.Join(migrationsDir, n))
		if err != nil {
			t.Fatalf("read %s: %v", n, err)
		}
		files[filepath.Join(dir, n)] = string(b)
	}
	for n, sql := range extra {
		files[filepath.Join(dir, n)] = sql
	}
	script, err := os.ReadFile(filepath.Join(repoRoot, "deploy", "migrate.sh"))
	if err != nil {
		t.Fatalf("read migrate.sh: %v", err)
	}
	files[filepath.Join(root, "deploy", "migrate.sh")] = string(script)
	for path, body := range files {
		if err := os.WriteFile(path, []byte(body), 0o755); err != nil {
			t.Fatalf("write %s: %v", filepath.Base(path), err)
		}
	}
	return root
}

// runMigrate runs root/deploy/migrate.sh cmd against dbURL, answering the
// apply confirmation. Only PATH, HOME and DATABASE_URL reach the script.
func runMigrate(t *testing.T, root, dbURL, cmd string) (string, error) {
	t.Helper()
	c := exec.Command("bash", filepath.Join(root, "deploy", "migrate.sh"), cmd)
	c.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=" + os.Getenv("HOME"), "DATABASE_URL=" + dbURL}
	c.Stdin = strings.NewReader("apply\n")
	out, err := c.CombinedOutput()
	return string(out), err
}

// versions lists names without the .sql suffix, as schema_migrations stores them.
func versions(names []string) string {
	out := make([]string, len(names))
	for i, n := range names {
		out[i] = strings.TrimSuffix(n, ".sql")
	}
	return strings.Join(out, ",")
}

func appliedVersions(t *testing.T, conn *pgx.Conn) string {
	t.Helper()
	var s string
	if err := conn.QueryRow(context.Background(),
		`SELECT coalesce(string_agg(version, ',' ORDER BY version), '') FROM schema_migrations`).Scan(&s); err != nil {
		t.Fatalf("read schema_migrations: %v", err)
	}
	return s
}

func TestPG_MigrateScriptAppliesEachMigrationOnce(t *testing.T) {
	conn, dbURL := scratchDatabase(t)
	names := migrationNames(t)

	if out, err := runMigrate(t, repoRoot, dbURL, "apply"); err != nil {
		t.Fatalf("first apply: %v\n%s", err, out)
	}
	if got, want := appliedVersions(t, conn), versions(names); got != want {
		t.Fatalf("schema_migrations after apply = %s, want %s", got, want)
	}

	out, err := runMigrate(t, repoRoot, dbURL, "apply")
	if err != nil || !strings.Contains(out, "Nothing to apply") {
		t.Fatalf("second apply should apply nothing: err=%v\n%s", err, out)
	}
	if got, want := appliedVersions(t, conn), versions(names); got != want {
		t.Fatalf("schema_migrations after second apply = %s, want %s", got, want)
	}
	if out, err := runMigrate(t, repoRoot, dbURL, "verify"); err != nil {
		t.Fatalf("verify: %v\n%s", err, out)
	}

	assertSchema(t, conn)
}

func TestPG_FailedMigrationLeavesNoPartialChange(t *testing.T) {
	conn, dbURL := scratchDatabase(t)
	names := migrationNames(t)
	root := migrationTree(t, names, map[string]string{
		"99999999999999_fails_halfway.sql": "CREATE TABLE lume_partial_change (id int);\nSELECT 1/0;\n",
	})

	if out, err := runMigrate(t, root, dbURL, "apply"); err == nil {
		t.Fatalf("apply with a failing migration succeeded:\n%s", out)
	}
	if got, want := appliedVersions(t, conn), versions(names); got != want {
		t.Fatalf("schema_migrations = %s, want only the real migrations %s", got, want)
	}
	var table *string
	if err := conn.QueryRow(context.Background(), `SELECT to_regclass('public.lume_partial_change')::text`).Scan(&table); err != nil {
		t.Fatalf("look up partial table: %v", err)
	}
	if table != nil {
		t.Fatal("the failing migration's CREATE TABLE survived; it did not run in its own transaction")
	}
}

func TestPG_MigrationsKeepSeededRows(t *testing.T) {
	conn, dbURL := scratchDatabase(t)
	ctx := context.Background()
	names := migrationNames(t)

	// Seed after the first migration, so every later migration runs over data.
	if out, err := runMigrate(t, migrationTree(t, names[:1], nil), dbURL, "apply"); err != nil {
		t.Fatalf("apply %s: %v\n%s", names[0], err, out)
	}
	seed := exec.Command("psql", dbURL, "-v", "ON_ERROR_STOP=1", "-q",
		"-v", "user_id='migration_seed_user'", "-v", "user_email='migration-seed@example.test'", "-f", seedScript)
	seed.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=" + os.Getenv("HOME")}
	if out, err := seed.CombinedOutput(); err != nil {
		t.Fatalf("seed: %v\n%s", err, out)
	}

	// The seeded tables come from the seed file; each is read back with only
	// the columns it had at seed time, so a later ADD COLUMN is not a change.
	body, err := os.ReadFile(seedScript)
	if err != nil {
		t.Fatalf("read seed: %v", err)
	}
	type tableSnapshot struct{ cols, rows string }
	snapshot := map[string]tableSnapshot{}
	for _, m := range regexp.MustCompile(`(?i)insert into ([a-z_]+)`).FindAllStringSubmatch(string(body), -1) {
		var cols string
		if err := conn.QueryRow(ctx, `SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
			FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, m[1]).Scan(&cols); err != nil {
			t.Fatalf("columns of %s: %v", m[1], err)
		}
		snapshot[m[1]] = tableSnapshot{cols: cols}
	}
	read := func(table, cols string) string {
		t.Helper()
		var rows *string
		if err := conn.QueryRow(ctx, `SELECT json_agg(r)::text FROM (SELECT `+cols+` FROM `+table+` ORDER BY 1) r`).Scan(&rows); err != nil {
			t.Fatalf("read %s: %v", table, err)
		}
		if rows == nil {
			t.Fatalf("%s has no seeded rows", table)
		}
		return *rows
	}
	for table, s := range snapshot {
		snapshot[table] = tableSnapshot{cols: s.cols, rows: read(table, s.cols)}
	}

	if out, err := runMigrate(t, migrationTree(t, names, nil), dbURL, "apply"); err != nil {
		t.Fatalf("apply the remaining migrations: %v\n%s", err, out)
	}
	for table, s := range snapshot {
		if got := read(table, s.cols); got != s.rows {
			t.Errorf("%s rows changed by the migrations:\n got %s\nwant %s", table, got, s.rows)
		}
	}
}

// declaredSchema reads every migration and returns the tables with the
// columns their CREATE TABLE and ALTER TABLE ... ADD COLUMN statements
// declare, and the index names CREATE INDEX declares. No migration drops or
// renames anything, so all of it must exist at the end.
func declaredSchema(t *testing.T) (map[string][]string, []string) {
	t.Helper()
	createRe := regexp.MustCompile(`create table (?:if not exists )?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(`)
	alterRe := regexp.MustCompile(`alter table (?:if exists )?(?:only )?(?:public\.)?([a-z_][a-z0-9_]*)\s`)
	addColRe := regexp.MustCompile(`add column (?:if not exists )?([a-z_][a-z0-9_]*)`)
	indexRe := regexp.MustCompile(`create (?:unique )?index (?:concurrently )?(?:if not exists )?([a-z_][a-z0-9_]*)`)
	comment := regexp.MustCompile(`--[^\n]*`)
	notColumn := map[string]bool{"constraint": true, "primary": true, "unique": true, "foreign": true, "check": true, "exclude": true}

	tables := map[string][]string{}
	var indexes []string
	for _, raw := range allSQL(t) {
		sql := comment.ReplaceAllString(raw, "")
		for _, loc := range createRe.FindAllStringSubmatchIndex(sql, -1) {
			table := sql[loc[2]:loc[3]]
			depth, start := 1, loc[1]
			for i := start; i < len(sql) && depth > 0; i++ {
				switch sql[i] {
				case '(':
					depth++
				case ')':
					depth--
					if depth == 0 {
						tables[table] = append(tables[table], columnNames(sql[start:i], notColumn)...)
					}
				}
			}
		}
		for _, stmt := range strings.Split(sql, ";") {
			if am := alterRe.FindStringSubmatch(stmt); am != nil {
				for _, cm := range addColRe.FindAllStringSubmatch(stmt, -1) {
					tables[am[1]] = append(tables[am[1]], cm[1])
				}
			}
		}
		for _, m := range indexRe.FindAllStringSubmatch(sql, -1) {
			indexes = append(indexes, m[1])
		}
	}
	return tables, indexes
}

// columnNames splits a CREATE TABLE body at top-level commas and keeps the
// first word of each column definition.
func columnNames(body string, notColumn map[string]bool) []string {
	var cols []string
	depth, start := 0, 0
	for i := 0; i <= len(body); i++ {
		if i < len(body) {
			switch body[i] {
			case '(':
				depth++
				continue
			case ')':
				depth--
				continue
			case ',':
				if depth != 0 {
					continue
				}
			default:
				continue
			}
		}
		if f := strings.Fields(body[start:i]); len(f) > 0 && !notColumn[f[0]] {
			cols = append(cols, strings.Trim(f[0], `"`))
		}
		start = i + 1
	}
	return cols
}

// codeTables lists the tables the backend's SQL names after FROM, INTO, UPDATE
// or JOIN in its backtick query strings. Names followed by "(" are functions
// (unnest, jsonb_array_elements) and are left out. Upper-case keywords only:
// lower-case "from" appears in prompt text, and every query here uses upper case.
func codeTables(t *testing.T) map[string]bool {
	t.Helper()
	query := regexp.MustCompile("`[^`]*`")
	ref := regexp.MustCompile(`\b(?:FROM|INTO|UPDATE|JOIN)\s+([a-z_][a-z0-9_]*)(\s*\()?`)
	out := map[string]bool{}
	for _, dir := range []string{"../../internal", "../../cmd"} {
		err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
			if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
				return err
			}
			b, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			for _, q := range query.FindAllString(string(b), -1) {
				for _, m := range ref.FindAllStringSubmatch(q, -1) {
					if m[2] == "" {
						out[m[1]] = true
					}
				}
			}
			return nil
		})
		if err != nil {
			t.Fatalf("scan %s: %v", dir, err)
		}
	}
	return out
}

// assertSchema checks the migrated database against declaredSchema and
// codeTables.
func assertSchema(t *testing.T, conn *pgx.Conn) {
	t.Helper()
	ctx := context.Background()
	have := func(sql string) map[string]bool {
		t.Helper()
		rows, err := conn.Query(ctx, sql)
		if err != nil {
			t.Fatalf("read catalog: %v", err)
		}
		names, err := pgx.CollectRows(rows, pgx.RowTo[string])
		if err != nil {
			t.Fatalf("read catalog: %v", err)
		}
		set := map[string]bool{}
		for _, n := range names {
			set[n] = true
		}
		return set
	}
	columns := have(`SELECT table_name || '.' || column_name FROM information_schema.columns WHERE table_schema = 'public'`)
	tables := have(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`)
	indexes := have(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`)

	declared, declaredIndexes := declaredSchema(t)
	if len(declared) == 0 || len(declaredIndexes) == 0 {
		t.Fatal("parsed no tables or indexes from the migrations")
	}
	for table, cols := range declared {
		if !tables[table] {
			t.Errorf("table %s is declared by a migration but missing", table)
		}
		for _, c := range cols {
			if !columns[table+"."+c] {
				t.Errorf("column %s.%s is declared by a migration but missing", table, c)
			}
		}
	}
	for _, ix := range declaredIndexes {
		if !indexes[ix] {
			t.Errorf("index %s is declared by a migration but missing", ix)
		}
	}
	used := codeTables(t)
	if len(used) == 0 {
		t.Fatal("found no table names in the backend's SQL")
	}
	for table := range used {
		if !tables[table] {
			t.Errorf("table %s is used by the backend's SQL but missing after the migrations", table)
		}
	}
	declaredColumns := 0
	for _, cols := range declared {
		declaredColumns += len(cols)
	}
	t.Logf("schema holds %d declared tables, %d declared columns, %d declared indexes and %d tables the backend's SQL uses",
		len(declared), declaredColumns, len(declaredIndexes), len(used))
}
