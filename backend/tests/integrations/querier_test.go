package integrationstests

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// recordingQuerier captures the SQL a store emits. No DB, no rows.
type recordingQuerier struct{ execs []string }

func (q *recordingQuerier) Exec(_ context.Context, sql string, _ ...any) (pgconn.CommandTag, error) {
	q.execs = append(q.execs, sql)
	return pgconn.CommandTag{}, nil
}
func (q *recordingQuerier) QueryRow(context.Context, string, ...any) pgx.Row { panic("unused") }
func (q *recordingQuerier) Query(context.Context, string, ...any) (pgx.Rows, error) {
	panic("unused")
}
func (q *recordingQuerier) Begin(context.Context) (pgx.Tx, error) { panic("unused") }
