// Migration-shape tests (hermetic — parse the SQL files, no DB).
//
//  1. Account-deletion cascade (guideline 5.1.1(v)): every table that references
//     profiles(id) must declare ON DELETE CASCADE, so DELETE /api/profile
//     genuinely removes every user row — no orphans, no soft-delete.
//  2. Ordering/shape: applying the migrations in filename order must yield the
//     expected tables and Phase-12/13 columns (catches a column added in a later
//     migration to a table created even later, etc.).
package migrationstests

import (
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"testing"

	"lume/backend/internal/auth"
)

const migrationsDir = "../../../supabase/migrations"

// allSQL returns each migration's content, in filename (application) order.
func allSQL(t *testing.T) []string {
	t.Helper()
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		t.Fatalf("read migrations dir: %v", err)
	}
	var names []string
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	if len(names) < 8 {
		t.Fatalf("expected ≥8 migrations, found %d", len(names))
	}
	var out []string
	for _, n := range names {
		b, err := os.ReadFile(filepath.Join(migrationsDir, n))
		if err != nil {
			t.Fatalf("read %s: %v", n, err)
		}
		out = append(out, strings.ToLower(string(b)))
	}
	return out
}

func TestMigrationFilenamesSequential(t *testing.T) {
	entries, _ := os.ReadDir(migrationsDir)
	re := regexp.MustCompile(`^\d{14}_[a-z0-9_]+\.sql$`)
	seen := map[string]bool{}
	for _, e := range entries {
		if !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		if !re.MatchString(e.Name()) {
			t.Errorf("migration %q does not match YYYYMMDDNNNNNN_name.sql", e.Name())
		}
		prefix := e.Name()[:14]
		if seen[prefix] {
			t.Errorf("duplicate migration number %s", prefix)
		}
		seen[prefix] = true
	}
}

// TestEveryProfilesReferenceCascades is the account-deletion guarantee: each
// `references profiles(id)` must carry `on delete cascade`.
func TestEveryProfilesReferenceCascades(t *testing.T) {
	sqls := allSQL(t)
	// Matches "user_id text not null references profiles(id) <suffix up to comma/newline>".
	re := regexp.MustCompile(`references\s+profiles\s*\(\s*id\s*\)([^,\n]*)`)
	found := 0
	for i, sql := range sqls {
		for _, m := range re.FindAllStringSubmatch(sql, -1) {
			found++
			if !strings.Contains(m[1], "on delete cascade") {
				t.Errorf("migration #%d: a profiles(id) reference lacks ON DELETE CASCADE: %q", i+1, strings.TrimSpace(m[0]))
			}
		}
	}
	// Every user-owned table references profiles — there are many; a low count
	// means the regex broke, not that the schema shrank.
	if found < 15 {
		t.Errorf("only %d profiles(id) references found — parser drift?", found)
	}
}

// TestExportCoversEveryUserTable: GET /api/export must include every table
// holding user data. Derived from the migrations themselves: any table created
// with a `references profiles(id)` column, plus any table whose FK references
// one of those, must appear in auth.ExportTableNames(). A new user-data
// migration without an export entry fails here.
func TestExportCoversEveryUserTable(t *testing.T) {
	sqls := allSQL(t)
	createRe := regexp.MustCompile(`create table (?:if not exists )?([a-z_]+)\s*\(([^;]*?)\);`)
	owned := map[string]bool{}  // tables with a direct profiles(id) reference
	body := map[string]string{} // table -> column block
	for _, sql := range sqls {
		for _, m := range createRe.FindAllStringSubmatch(sql, -1) {
			body[m[1]] = m[2]
			if strings.Contains(m[2], "references profiles") {
				owned[m[1]] = true
			}
		}
	}
	// Child tables: FK to an owned table.
	child := map[string]bool{}
	fkRe := regexp.MustCompile(`references\s+([a-z_]+)\s*\(`)
	for table, cols := range body {
		if owned[table] {
			continue
		}
		for _, m := range fkRe.FindAllStringSubmatch(cols, -1) {
			if owned[m[1]] {
				child[table] = true
			}
		}
	}

	covered := map[string]bool{}
	for _, n := range auth.ExportTableNames() {
		covered[n] = true
	}

	for table := range owned {
		if !covered[table] {
			t.Errorf("user table %q not covered by GET /api/export", table)
		}
	}
	for table := range child {
		if !covered[table] {
			t.Errorf("child user table %q not covered by GET /api/export", table)
		}
	}
	if !covered["profiles"] {
		t.Error("profiles not covered by GET /api/export")
	}
	if len(owned) < 20 {
		t.Errorf("only %d owned tables parsed — parser drift?", len(owned))
	}
}

// TestFinalSchemaShape simulates in-order application: a column ALTER must apply
// to a table already created, and the key Phase 12/13 tables/columns must exist.
func TestFinalSchemaShape(t *testing.T) {
	sqls := allSQL(t)
	created := map[string]bool{}
	altered := map[string][]string{} // table -> columns added
	createRe := regexp.MustCompile(`create table (?:if not exists )?([a-z_]+)`)
	alterRe := regexp.MustCompile(`alter table ([a-z_]+)\s`)
	addColRe := regexp.MustCompile(`add column (?:if not exists )?([a-z_]+)`)

	for i, sql := range sqls {
		for _, m := range createRe.FindAllStringSubmatch(sql, -1) {
			created[m[1]] = true
		}
		// Track ALTERs per statement so a column lands on the right table.
		for _, stmt := range strings.Split(sql, ";") {
			am := alterRe.FindStringSubmatch(stmt)
			if am == nil {
				continue
			}
			table := am[1]
			if !created[table] {
				t.Errorf("migration #%d alters %q before any migration creates it", i+1, table)
			}
			for _, cm := range addColRe.FindAllStringSubmatch(stmt, -1) {
				altered[table] = append(altered[table], cm[1])
			}
		}
	}

	for _, table := range []string{
		"profiles", "food_logs", "gym_sessions", "gym_exercises", "goals", "onboarding",
		"exercise_library", "workout_templates", "workout_schedule", "gym_adherence",
		"integration_connections", "scan_sessions", "scan_images",
		"user_food_affinity", "confidence_calibration",
	} {
		if !created[table] {
			t.Errorf("table %q never created", table)
		}
	}

	has := func(table, col string) bool {
		for _, c := range altered[table] {
			if c == col {
				return true
			}
		}
		return false
	}
	for _, want := range []struct{ table, col string }{
		{"exercise_library", "parameter_schema"},
		{"gym_exercises", "parameters"},
		{"gym_exercises", "rpe"},
		{"gym_sessions", "apple_health_uuid"},
		{"gym_sessions", "idempotency_key"},
		{"food_logs", "idempotency_key"},
		{"scan_sessions", "image_count"},
		{"scan_sessions", "angle_agreement"},
		{"scan_corrections", "correction_type"},
		{"scan_corrections", "logged_hour"},
	} {
		if !has(want.table, want.col) {
			t.Errorf("column %s.%s never added", want.table, want.col)
		}
	}
}

// The migration runner's own bookkeeping table is created by deploy/migrate.sh,
// not by a migration file — so it escapes every RLS check in this package and
// every advisor sweep aimed at supabase/migrations. On Supabase, a table in
// `public` without RLS is reachable through PostgREST with the anon key, and
// this particular table decides which migrations `apply` SKIPS: one forged
// version row and a migration silently never runs. Found live on 2026-08-09 —
// schema_migrations was the only RLS-disabled table in the production database.
func TestMigrationRunnerEnablesRLSOnBookkeepingTable(t *testing.T) {
	b, err := os.ReadFile("../../../deploy/migrate.sh")
	if err != nil {
		t.Fatalf("read migrate.sh: %v", err)
	}
	script := string(b)

	// The table name is a variable in the script; resolve it so the assertion
	// keeps working if it is ever renamed.
	m := regexp.MustCompile(`(?m)^TABLE=(?:"([^"]+)"|(\S+))`).FindStringSubmatch(script)
	if m == nil {
		t.Fatal("migrate.sh no longer defines TABLE= — update this test")
	}
	table := m[1] + m[2]

	create := regexp.MustCompile(`(?is)CREATE TABLE IF NOT EXISTS \$\{TABLE\}`)
	if !create.MatchString(script) {
		t.Fatal("migrate.sh no longer creates ${TABLE} — update this test")
	}

	rls := regexp.MustCompile(`(?is)ALTER TABLE \$\{TABLE\} ENABLE ROW LEVEL SECURITY`)
	if !rls.MatchString(script) {
		t.Errorf("deploy/migrate.sh creates the %q bookkeeping table without enabling RLS; "+
			"on Supabase that leaves it writable via PostgREST with the anon key, and a "+
			"forged version row makes `migrate.sh apply` skip a migration", table)
	}
}
