// Real-SQL migration check: every file in supabase/migrations applies, in
// filename order, to an empty database without error.
//
// Skipped unless LUME_TEST_DATABASE_URL is set. The URL must point at a local
// lume_test* database (host localhost or 127.0.0.1); anything else fails rather
// than run. The test creates its own throwaway lume_test_migrate_* database on
// that server, applies the Supabase shims and the migrations there, and drops
// only that database afterwards, so lume_test_local itself is never changed.
package migrationstests

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

// shimsFile stands in for what Supabase provides before any migration runs.
const shimsFile = "supabase_shims.sql"

// localTestConfig parses the URL and refuses anything but a local lume_test*
// database. The error never contains the URL, which may hold a password.
func localTestConfig(dsn string) (*pgx.ConnConfig, error) {
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("LUME_TEST_DATABASE_URL does not parse")
	}
	if cfg.Host != "localhost" && cfg.Host != "127.0.0.1" {
		return nil, fmt.Errorf("LUME_TEST_DATABASE_URL host must be localhost or 127.0.0.1")
	}
	if cfg.Port == 55432 {
		return nil, fmt.Errorf("LUME_TEST_DATABASE_URL must not use port 55432")
	}
	if !strings.HasPrefix(cfg.Database, "lume_test") {
		return nil, fmt.Errorf("LUME_TEST_DATABASE_URL database name must start with lume_test")
	}
	return cfg, nil
}

func TestPG_MigrationsApplyToEmptyDatabase(t *testing.T) {
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping migration apply check")
	}
	cfg, err := localTestConfig(dsn)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()

	admin, err := pgx.ConnectConfig(ctx, cfg)
	if err != nil {
		t.Fatalf("connect to %s: %v", cfg.Database, err)
	}

	scratch := fmt.Sprintf("lume_test_migrate_%d", time.Now().UnixNano())
	// The admin connection stays open until the cleanup has dropped the scratch database.
	t.Cleanup(func() {
		if _, err := admin.Exec(context.Background(), "DROP DATABASE IF EXISTS "+scratch+" WITH (FORCE)"); err != nil {
			t.Errorf("drop %s: %v", scratch, err)
		}
		admin.Close(context.Background())
	})
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+scratch); err != nil {
		t.Fatalf("create %s: %v", scratch, err)
	}

	scratchCfg := cfg.Copy()
	scratchCfg.Database = scratch
	conn, err := pgx.ConnectConfig(ctx, scratchCfg)
	if err != nil {
		t.Fatalf("connect to %s: %v", scratch, err)
	}
	defer conn.Close(ctx)

	shims, err := os.ReadFile(shimsFile)
	if err != nil {
		t.Fatalf("read %s: %v", shimsFile, err)
	}
	if _, err := conn.Exec(ctx, string(shims)); err != nil {
		t.Fatalf("apply Supabase shims: %v", err)
	}
	names := migrationNames(t)
	for _, n := range names {
		b, err := os.ReadFile(filepath.Join(migrationsDir, n))
		if err != nil {
			t.Fatalf("read %s: %v", n, err)
		}
		if _, err := conn.Exec(ctx, string(b)); err != nil {
			t.Fatalf("apply %s: %v", n, err)
		}
	}
	t.Logf("applied %d migrations to %s", len(names), scratch)
}

func TestLocalTestConfigRefusesNonLocalTargets(t *testing.T) {
	for _, dsn := range []string{
		"postgres://u@db.example.com:5432/lume_test_local",
		"postgres://u@127.0.0.1:55432/lume_test_local",
		"postgres://u@localhost:5432/postgres",
	} {
		if _, err := localTestConfig(dsn); err == nil {
			t.Errorf("localTestConfig accepted a target it must refuse (case %q)", strings.SplitN(dsn, "@", 2)[1])
		}
	}
	if _, err := localTestConfig("postgres://u@localhost:5432/lume_test_local"); err != nil {
		t.Errorf("localTestConfig refused a local lume_test database: %v", err)
	}
}
