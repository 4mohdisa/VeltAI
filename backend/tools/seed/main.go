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
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

const (
	seedIDPrefix    = "seed_"
	seedEmailDomain = "@example.test"
)

var localHosts = map[string]bool{"localhost": true, "127.0.0.1": true}

// localDSN returns DATABASE_URL only if it is a postgres URL whose every host
// is localhost or 127.0.0.1. The pgx check catches hosts the URL hostname does
// not show, such as a ?host= query parameter or a multi-host list.
func localDSN() (string, error) {
	raw := os.Getenv("DATABASE_URL")
	if raw == "" {
		return "", errors.New("DATABASE_URL is not set")
	}
	if strings.Contains(strings.ToLower(raw), "supabase.co") {
		return "", errors.New("refusing a supabase.co database: seed runs against a local database only")
	}
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") {
		return "", errors.New("DATABASE_URL must be a postgres:// URL")
	}
	if !localHosts[u.Hostname()] {
		return "", fmt.Errorf("refusing host %q: seed runs against localhost or 127.0.0.1 only", u.Hostname())
	}
	cfg, err := pgx.ParseConfig(raw)
	if err != nil {
		return "", fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	hosts := []string{cfg.Host}
	for _, fb := range cfg.Fallbacks {
		hosts = append(hosts, fb.Host)
	}
	for _, h := range hosts {
		if !localHosts[h] {
			return "", fmt.Errorf("refusing host %q: seed runs against localhost or 127.0.0.1 only", h)
		}
	}
	return raw, nil
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
