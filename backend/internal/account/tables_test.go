// Hermetic: parses the SQL migrations, no database.
package account_test

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"lume/backend/internal/account"
)

const migrationsDir = "../../../supabase/migrations"

var (
	createRe = regexp.MustCompile(`create table (?:if not exists )?([a-z_]+)\s*\(([^;]*?)\);`)
	alterRe  = regexp.MustCompile(`alter table (?:if exists )?([a-z_]+)\s+add column (?:if not exists )?([a-z_]+)`)
)

// schemaColumns maps each table the migrations create to its column names.
func schemaColumns(t *testing.T) map[string]map[string]bool {
	t.Helper()
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil || len(files) == 0 {
		t.Fatalf("no migrations found in %s: %v", migrationsDir, err)
	}
	cols := map[string]map[string]bool{}
	for _, f := range files {
		b, err := os.ReadFile(f)
		if err != nil {
			t.Fatalf("read %s: %v", f, err)
		}
		sql := strings.ToLower(string(b))
		for _, m := range createRe.FindAllStringSubmatch(sql, -1) {
			set := map[string]bool{}
			for _, line := range strings.Split(m[2], "\n") {
				if fields := strings.Fields(line); len(fields) > 0 {
					set[fields[0]] = true
				}
			}
			cols[m[1]] = set
		}
		for _, m := range alterRe.FindAllStringSubmatch(sql, -1) {
			if cols[m[1]] != nil {
				cols[m[1]][m[2]] = true
			}
		}
	}
	return cols
}

func TestUserTablesExistWithTheirColumn(t *testing.T) {
	cols := schemaColumns(t)
	seen := map[string]bool{}
	for _, ut := range account.UserTables {
		t.Run(ut.Table, func(t *testing.T) {
			if seen[ut.Table] {
				t.Fatalf("%s is listed twice", ut.Table)
			}
			seen[ut.Table] = true
			table, ok := cols[ut.Table]
			if !ok {
				t.Fatalf("%s is listed but no migration creates it", ut.Table)
			}
			if !table[ut.Column] {
				t.Fatalf("%s has no column %s", ut.Table, ut.Column)
			}
		})
	}
}

func TestEveryTableWithAUserColumnIsListed(t *testing.T) {
	listed := map[string]bool{}
	for _, ut := range account.UserTables {
		listed[ut.Table] = true
	}
	found := 0
	for table, columns := range schemaColumns(t) {
		if !columns["user_id"] {
			continue
		}
		found++
		if !listed[table] {
			t.Errorf("%s has a user_id column but is missing from account.UserTables", table)
		}
	}
	if found < 20 {
		t.Errorf("only %d tables with user_id parsed, parser drift?", found)
	}
}
