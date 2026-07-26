package food

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
)

type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// ensureProfile keeps user-owned inserts from hitting the profiles FK before
// the Clerk webhook has synced the user.
func (s *PGStore) ensureProfile(ctx context.Context, userID string) error {
	_, err := s.q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

const logCols = `id, user_id, date, meal_type, food_name, brand, barcode, quantity, unit,
	calories, protein, carbs, fat, fibre, source, created_at, status, scan_results`

func scanLog(row pgx.Row) (Log, error) {
	var l Log
	var d time.Time
	err := row.Scan(&l.ID, &l.UserID, &d, &l.MealType, &l.FoodName, &l.Brand, &l.Barcode,
		&l.Quantity, &l.Unit, &l.Calories, &l.Protein, &l.Carbs, &l.Fat, &l.Fibre,
		&l.Source, &l.CreatedAt, &l.Status, &l.ScanResults)
	if err != nil {
		return Log{}, err
	}
	l.Date = d.Format("2006-01-02")
	return l, nil
}

func (s *PGStore) ListLogs(ctx context.Context, userID string, date, mealType, status *string) ([]Log, error) {
	rows, err := s.q.Query(ctx, `SELECT `+logCols+` FROM food_logs
		WHERE user_id = $1
		  AND ($2::date IS NULL OR date = $2::date)
		  AND ($3::text IS NULL OR meal_type = $3)
		  AND ($4::text IS NULL OR status = $4)
		ORDER BY created_at DESC`, userID, date, mealType, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Log
	for rows.Next() {
		l, err := scanLog(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// GetLog fetches one log by id (ErrNotFound if absent). id::text comparison
// keeps a malformed id a clean not-found instead of a uuid parse error.
func (s *PGStore) GetLog(ctx context.Context, id string) (Log, error) {
	row := s.q.QueryRow(ctx, `SELECT `+logCols+` FROM food_logs WHERE id::text = $1`, id)
	l, err := scanLog(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Log{}, ErrNotFound
	}
	return l, err
}

func (s *PGStore) CreateLog(ctx context.Context, l Log) (Log, error) {
	if err := s.ensureProfile(ctx, l.UserID); err != nil {
		return Log{}, err
	}
	// Idempotent path: a replayed offline write (same key) returns the existing
	// row rather than duplicating.
	if l.IdempotencyKey != "" {
		created, err := scanLog(s.q.QueryRow(ctx, `INSERT INTO food_logs
			(user_id, date, meal_type, food_name, brand, barcode, quantity, unit,
			 calories, protein, carbs, fat, fibre, source, idempotency_key)
			VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
			RETURNING `+logCols,
			l.UserID, l.Date, l.MealType, l.FoodName, l.Brand, l.Barcode, l.Quantity, l.Unit,
			l.Calories, l.Protein, l.Carbs, l.Fat, l.Fibre, l.Source, l.IdempotencyKey))
		if errors.Is(err, pgx.ErrNoRows) {
			return scanLog(s.q.QueryRow(ctx,
				`SELECT `+logCols+` FROM food_logs WHERE user_id = $1 AND idempotency_key = $2`,
				l.UserID, l.IdempotencyKey))
		}
		return created, err
	}
	row := s.q.QueryRow(ctx, `INSERT INTO food_logs
		(user_id, date, meal_type, food_name, brand, barcode, quantity, unit,
		 calories, protein, carbs, fat, fibre, source)
		VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING `+logCols,
		l.UserID, l.Date, l.MealType, l.FoodName, l.Brand, l.Barcode, l.Quantity, l.Unit,
		l.Calories, l.Protein, l.Carbs, l.Fat, l.Fibre, l.Source)
	return scanLog(row)
}

// id::text comparison keeps malformed ids a clean not-found instead of a
// uuid parse error (same pattern as gym/goals/ai stores).
func (s *PGStore) GetLogOwner(ctx context.Context, id string) (string, error) {
	var owner string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM food_logs WHERE id::text = $1`, id).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return owner, err
}

// ponytail: COALESCE patch — a PATCH can update but not null out a field;
// switch to dynamic SET building if clearing fields is ever needed.
func (s *PGStore) UpdateLog(ctx context.Context, id string, p LogPatch) (Log, error) {
	row := s.q.QueryRow(ctx, `UPDATE food_logs SET
		date      = COALESCE($2::date, date),
		meal_type = COALESCE($3, meal_type),
		food_name = COALESCE($4, food_name),
		brand     = COALESCE($5, brand),
		barcode   = COALESCE($6, barcode),
		quantity  = COALESCE($7, quantity),
		unit      = COALESCE($8, unit),
		calories  = COALESCE($9, calories),
		protein   = COALESCE($10, protein),
		carbs     = COALESCE($11, carbs),
		fat       = COALESCE($12, fat),
		fibre     = COALESCE($13, fibre),
		source    = COALESCE($14, source)
		WHERE id::text = $1 RETURNING `+logCols,
		id, p.Date, p.MealType, p.FoodName, p.Brand, p.Barcode, p.Quantity, p.Unit,
		p.Calories, p.Protein, p.Carbs, p.Fat, p.Fibre, p.Source)
	l, err := scanLog(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Log{}, ErrNotFound
	}
	return l, err
}

func (s *PGStore) DeleteLog(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, `DELETE FROM food_logs WHERE id::text = $1`, id)
	return err
}

func (s *PGStore) Summary(ctx context.Context, userID, date string) (Summary, error) {
	sum := Summary{Date: date}
	err := s.q.QueryRow(ctx, `SELECT
		COALESCE(SUM(calories), 0), COALESCE(SUM(protein), 0), COALESCE(SUM(carbs), 0),
		COALESCE(SUM(fat), 0), COALESCE(SUM(fibre), 0)
		FROM food_logs WHERE user_id = $1 AND date = $2::date`, userID, date).
		Scan(&sum.Calories, &sum.Protein, &sum.Carbs, &sum.Fat, &sum.Fibre)
	return sum, err
}

const savedCols = `id, user_id, food_name, brand, barcode, calories, protein, carbs, fat, fibre,
	serving_size, serving_unit, created_at`

func scanSaved(row pgx.Row) (SavedFood, error) {
	var f SavedFood
	err := row.Scan(&f.ID, &f.UserID, &f.FoodName, &f.Brand, &f.Barcode, &f.Calories,
		&f.Protein, &f.Carbs, &f.Fat, &f.Fibre, &f.ServingSize, &f.ServingUnit, &f.CreatedAt)
	return f, err
}

func (s *PGStore) ListSaved(ctx context.Context, userID string) ([]SavedFood, error) {
	rows, err := s.q.Query(ctx, `SELECT `+savedCols+` FROM saved_foods
		WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SavedFood
	for rows.Next() {
		f, err := scanSaved(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *PGStore) CreateSaved(ctx context.Context, f SavedFood) (SavedFood, error) {
	if err := s.ensureProfile(ctx, f.UserID); err != nil {
		return SavedFood{}, err
	}
	row := s.q.QueryRow(ctx, `INSERT INTO saved_foods
		(user_id, food_name, brand, barcode, calories, protein, carbs, fat, fibre,
		 serving_size, serving_unit)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING `+savedCols,
		f.UserID, f.FoodName, f.Brand, f.Barcode, f.Calories, f.Protein, f.Carbs, f.Fat,
		f.Fibre, f.ServingSize, f.ServingUnit)
	return scanSaved(row)
}

// id::text comparison keeps malformed ids a clean not-found instead of a
// uuid parse error (same pattern as gym/goals/ai stores).
func (s *PGStore) GetSavedOwner(ctx context.Context, id string) (string, error) {
	var owner string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM saved_foods WHERE id::text = $1`, id).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return owner, err
}

func (s *PGStore) DeleteSaved(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, `DELETE FROM saved_foods WHERE id::text = $1`, id)
	return err
}

// UserCuisinePrefs returns nil, nil, nil (not an error) if the user has never
// set cuisine preferences — search ranking just sees empty prefs.
func (s *PGStore) UserCuisinePrefs(ctx context.Context, userID string) ([]string, []string, error) {
	var cuisines, dietary []string
	err := s.q.QueryRow(ctx, `SELECT cuisines, dietary_requirements
		FROM user_cuisine_preferences WHERE user_id = $1`, userID).Scan(&cuisines, &dietary)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, nil
	}
	return cuisines, dietary, err
}

// CuisineLibraryNames returns a lowercased food-name set for the given
// cuisines, used for the exact-match ranking bonus.
func (s *PGStore) CuisineLibraryNames(ctx context.Context, cuisines []string) (map[string]bool, error) {
	if len(cuisines) == 0 {
		return map[string]bool{}, nil
	}
	rows, err := s.q.Query(ctx, `SELECT food_name FROM cuisine_food_library WHERE cuisine = ANY($1)`, cuisines)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]bool{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		out[strings.ToLower(name)] = true
	}
	return out, rows.Err()
}

// GetPortionPref returns nil, nil (not an error) if the user has never
// logged this food before.
func (s *PGStore) GetPortionPref(ctx context.Context, userID, foodName string) (*PortionPref, error) {
	var p PortionPref
	err := s.q.QueryRow(ctx, `SELECT typical_weight_g, logged_count, typical_meal_type
		FROM user_portion_prefs WHERE user_id = $1 AND food_name = $2`, userID, foodName).
		Scan(&p.TypicalWeightG, &p.LoggedCount, &p.TypicalMealType)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
