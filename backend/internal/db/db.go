// Package db provides the Postgres pool and the query interface stores depend on.
package db

import (
	"context"
	"errors"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Querier is the subset of *pgxpool.Pool the stores use; satisfied by the pool
// and mockable in tests. Begin is included so stores can run multi-statement
// transactions; pgx.Tx itself satisfies Querier (same Query/QueryRow/Exec
// signatures), so a store can use a tx as a Querier within its scope.
type Querier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Begin(ctx context.Context) (pgx.Tx, error)
}

// Connect opens a pool from DATABASE_URL (the Supabase Postgres connection string).
func Connect(ctx context.Context) (*pgxpool.Pool, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, errors.New("DATABASE_URL not set")
	}
	return pgxpool.New(ctx, dsn)
}
