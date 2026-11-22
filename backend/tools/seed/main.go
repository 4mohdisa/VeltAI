// Local-only seed data for Lume.
//
//	DATABASE_URL=postgres://...@127.0.0.1:55432/lume go run ./tools/seed          # seed
//	DATABASE_URL=postgres://...@127.0.0.1:55432/lume go run ./tools/seed reset    # remove seed users
//
// Refuses to run unless DATABASE_URL points at localhost or 127.0.0.1. Every
// seed user has a clerk id starting with seed_ and an @example.test email, and
// reset deletes only those users (their rows go with them through the
// ON DELETE CASCADE foreign keys on profiles). See README.md.
package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/localdb"
)

const (
	seedIDPrefix    = "seed_"
	seedEmailDomain = "@example.test"
)

// localDSN returns DATABASE_URL only if it points at a local database.
func localDSN() (string, error) {
	return localdb.DSN(os.Getenv("DATABASE_URL"))
}

// isSeedEmail reports whether an email belongs to the seed domain.
func isSeedEmail(email string) bool {
	return strings.HasSuffix(strings.ToLower(email), seedEmailDomain) && len(email) > len(seedEmailDomain)
}

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "seed:", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	cmd := "seed"
	if len(args) > 0 {
		cmd = args[0]
	}
	if cmd != "seed" && cmd != "reset" {
		return fmt.Errorf("unknown command %q (use seed or reset)", cmd)
	}
	dsn, err := localDSN()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer conn.Close(ctx)

	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	removed, err := reset(ctx, tx)
	if err != nil {
		return fmt.Errorf("reset: %w", err)
	}
	if cmd == "reset" {
		if err := tx.Commit(ctx); err != nil {
			return err
		}
		fmt.Printf("removed %d seed users\n", removed)
		return nil
	}
	today := time.Now()
	users := seedUsers(today)
	for _, u := range users {
		if err := seedUser(ctx, tx, u, today); err != nil {
			return fmt.Errorf("%s: %w", u.ID, err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	fmt.Printf("seeded %d users (replaced %d existing seed users)\n", len(users), removed)
	return nil
}

// reset deletes seed profiles only. Both markers must match, so a real user
// with an @example.test email or a seed_-looking id is never touched.
func reset(ctx context.Context, tx pgx.Tx) (int64, error) {
	tag, err := tx.Exec(ctx,
		`DELETE FROM profiles WHERE starts_with(id, $1) AND lower(email) LIKE '%' || $2`,
		seedIDPrefix, seedEmailDomain)
	return tag.RowsAffected(), err
}
