package pipeline

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeRow fills (weight_multiplier_ewma, sample_count) into ApplyCalibration's
// Scan targets. A non-nil err simulates pgx.ErrNoRows / a query failure.
type fakeRow struct {
	multiplier float64
	count      int
	err        error
}

func (r fakeRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	if len(dest) >= 1 {
		if p, ok := dest[0].(*float64); ok {
			*p = r.multiplier
		}
	}
	if len(dest) >= 2 {
		if p, ok := dest[1].(*int); ok {
			*p = r.count
		}
	}
	return nil
}

// fakeQuerier satisfies db.Querier; only QueryRow is exercised. row is an
// interface so both the calibrate and crosscheck row shapes can plug in.
type fakeQuerier struct{ row pgx.Row }

func (f fakeQuerier) Query(context.Context, string, ...any) (pgx.Rows, error) {
	return nil, errors.New("unused")
}
func (f fakeQuerier) QueryRow(context.Context, string, ...any) pgx.Row { return f.row }
func (f fakeQuerier) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, errors.New("unused")
}
func (f fakeQuerier) Begin(context.Context) (pgx.Tx, error) { return nil, errors.New("unused") }

func hasNote(notes []string, want string) bool {
	for _, n := range notes {
		if n == want {
			return true
		}
	}
	return false
}

func approx(a, b float64) bool {
	d := a - b
	if d < 0 {
		d = -d
	}
	return d < 1e-9
}

func TestApplyCalibration_AppliesWhenEnoughSamples(t *testing.T) {
	q := fakeQuerier{row: fakeRow{multiplier: 1.5, count: 5}}
	out := ApplyCalibration(context.Background(),
		[]FoodEstimate{{FoodName: "rice", WeightG: 100}}, "u1", q)
	if !approx(out[0].WeightG, 150) {
		t.Fatalf("want 150, got %v", out[0].WeightG)
	}
	if !hasNote(out[0].Notes, "Adjusted to your portions") {
		t.Fatalf("expected calibration note, got %v", out[0].Notes)
	}
}

func TestApplyCalibration_SkipsWhenTooFewSamples(t *testing.T) {
	q := fakeQuerier{row: fakeRow{multiplier: 1.5, count: 2}}
	out := ApplyCalibration(context.Background(),
		[]FoodEstimate{{FoodName: "rice", WeightG: 100}}, "u1", q)
	if !approx(out[0].WeightG, 100) {
		t.Fatalf("want unchanged 100, got %v", out[0].WeightG)
	}
	if len(out[0].Notes) != 0 {
		t.Fatalf("expected no note, got %v", out[0].Notes)
	}
}

func TestApplyCalibration_NoRowLeavesUnchanged(t *testing.T) {
	q := fakeQuerier{row: fakeRow{err: pgx.ErrNoRows}}
	out := ApplyCalibration(context.Background(),
		[]FoodEstimate{{FoodName: "rice", WeightG: 100}}, "u1", q)
	if !approx(out[0].WeightG, 100) || len(out[0].Notes) != 0 {
		t.Fatalf("expected unchanged, got weight=%v notes=%v", out[0].WeightG, out[0].Notes)
	}
}

// EWMA bound sanity: the parent scan package clamps the stored multiplier to
// [0.4, 2.5], so applying either extreme scales weight by exactly that factor.
func TestApplyCalibration_EWMABounds(t *testing.T) {
	max := ApplyCalibration(context.Background(),
		[]FoodEstimate{{FoodName: "rice", WeightG: 100}}, "u1",
		fakeQuerier{row: fakeRow{multiplier: 2.5, count: 4}})
	if !approx(max[0].WeightG, 250) {
		t.Fatalf("max multiplier 2.5: want 250, got %v", max[0].WeightG)
	}
	min := ApplyCalibration(context.Background(),
		[]FoodEstimate{{FoodName: "rice", WeightG: 100}}, "u1",
		fakeQuerier{row: fakeRow{multiplier: 0.4, count: 4}})
	if !approx(min[0].WeightG, 40) {
		t.Fatalf("min multiplier 0.4: want 40, got %v", min[0].WeightG)
	}
}

func TestApplyCalibration_NilQuerier(t *testing.T) {
	in := []FoodEstimate{{FoodName: "rice", WeightG: 100}}
	out := ApplyCalibration(context.Background(), in, "u1", nil)
	if !approx(out[0].WeightG, 100) || len(out[0].Notes) != 0 {
		t.Fatalf("nil q must leave estimates unchanged, got %+v", out[0])
	}
}
