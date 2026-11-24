// Loads the Australian Food Composition Database (FSANZ AFCD) into the
// afcd_foods table of a LOCAL database.
//
//	curl -fLo /tmp/afcd-nutrient-profiles.xlsx \
//	  'https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Nutrient%20profiles.xlsx'
//	DATABASE_URL=postgres://...@127.0.0.1:55432/lume go run ./tools/afcd /tmp/afcd-nutrient-profiles.xlsx
//
// Refuses to run unless DATABASE_URL points at localhost or 127.0.0.1. The
// import replaces the whole table in one transaction. Licence and attribution:
// legal/AFCD_LICENCE.md.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/food"
	"lume/backend/internal/localdb"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "afcd:", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	fs := flag.NewFlagSet("afcd", flag.ContinueOnError)
	release := fs.String("release", "AFCD Release 3", "release name stored with every row")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.NArg() != 1 {
		return errors.New("usage: afcd [-release NAME] <Nutrient profiles .xlsx>")
	}
	dsn, err := localdb.DSN(os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	f, err := os.Open(fs.Arg(0))
	if err != nil {
		return err
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		return err
	}
	foods, err := food.ParseAFCD(f, st.Size())
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
	if err := food.ImportAFCD(ctx, conn, foods, *release); err != nil {
		return fmt.Errorf("import: %w", err)
	}
	fmt.Printf("imported %d foods (%s)\n", len(foods), *release)
	return nil
}
