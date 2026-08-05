package recipes

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"lume/backend/internal/db"
)

type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

// ensureProfile keeps user-owned inserts from hitting the profiles FK before
// the Clerk webhook has synced the user. Takes a Querier so it also works
// against a tx (pgx.Tx satisfies db.Querier).
func ensureProfile(ctx context.Context, q db.Querier, userID string) error {
	_, err := q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

func sumIngredients(ings []Ingredient) (cal, protein, carbs, fat, fibre float64) {
	for _, i := range ings {
		cal += i.Calories
		protein += i.Protein
		carbs += i.Carbs
		fat += i.Fat
		fibre += i.Fibre
	}
	return
}

func sumItems(items []MealItem) (cal, protein, carbs, fat, fibre float64) {
	for _, i := range items {
		cal += i.Calories
		protein += i.Protein
		carbs += i.Carbs
		fat += i.Fat
		fibre += i.Fibre
	}
	return
}

// --- recipes ---

const recipeCols = `id, user_id, name, description, total_calories, total_protein, total_carbs,
	total_fat, total_fibre, serving_count, created_at, updated_at`

func scanRecipe(row pgx.Row) (Recipe, error) {
	var r Recipe
	err := row.Scan(&r.ID, &r.UserID, &r.Name, &r.Description, &r.TotalCalories, &r.TotalProtein,
		&r.TotalCarbs, &r.TotalFat, &r.TotalFibre, &r.ServingCount, &r.CreatedAt, &r.UpdatedAt)
	return r, err
}

// ListRecipes returns recipes without ingredients; GET /api/recipes/{id} is
// the endpoint that loads them.
func (s *PGStore) ListRecipes(ctx context.Context, userID string) ([]Recipe, error) {
	rows, err := s.q.Query(ctx, `SELECT `+recipeCols+` FROM recipes
		WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Recipe
	for rows.Next() {
		r, err := scanRecipe(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PGStore) CreateRecipe(ctx context.Context, userID, name string, description *string, servingCount int, ingredients []Ingredient) (Recipe, error) {
	cal, protein, carbs, fat, fibre := sumIngredients(ingredients)

	tx, err := s.q.Begin(ctx)
	if err != nil {
		return Recipe{}, err
	}
	defer tx.Rollback(ctx)

	if err := ensureProfile(ctx, tx, userID); err != nil {
		return Recipe{}, err
	}

	var id string
	var createdAt, updatedAt time.Time
	err = tx.QueryRow(ctx, `INSERT INTO recipes
		(user_id, name, description, total_calories, total_protein, total_carbs, total_fat, total_fibre, serving_count)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at`,
		userID, name, description, cal, protein, carbs, fat, fibre, servingCount).
		Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return Recipe{}, err
	}

	for _, ing := range ingredients {
		if _, err := tx.Exec(ctx, `INSERT INTO recipe_ingredients
			(recipe_id, food_name, quantity_g, calories, protein, carbs, fat, fibre)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			id, ing.FoodName, ing.QuantityG, ing.Calories, ing.Protein, ing.Carbs, ing.Fat, ing.Fibre); err != nil {
			return Recipe{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Recipe{}, err
	}

	return Recipe{
		ID: id, UserID: userID, Name: name, Description: description,
		TotalCalories: cal, TotalProtein: protein, TotalCarbs: carbs, TotalFat: fat, TotalFibre: fibre,
		ServingCount: servingCount, Ingredients: ingredients, CreatedAt: createdAt, UpdatedAt: updatedAt,
	}, nil
}

func (s *PGStore) recipeIngredients(ctx context.Context, id string) ([]Ingredient, error) {
	rows, err := s.q.Query(ctx, `SELECT food_name, quantity_g, calories, protein, carbs, fat, fibre
		FROM recipe_ingredients WHERE recipe_id::text = $1 ORDER BY id`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Ingredient
	for rows.Next() {
		var ing Ingredient
		if err := rows.Scan(&ing.FoodName, &ing.QuantityG, &ing.Calories, &ing.Protein, &ing.Carbs, &ing.Fat, &ing.Fibre); err != nil {
			return nil, err
		}
		out = append(out, ing)
	}
	return out, rows.Err()
}

func (s *PGStore) GetRecipe(ctx context.Context, id string) (*Recipe, error) {
	row := s.q.QueryRow(ctx, `SELECT `+recipeCols+` FROM recipes WHERE id::text = $1`, id)
	r, err := scanRecipe(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	ings, err := s.recipeIngredients(ctx, id)
	if err != nil {
		return nil, err
	}
	r.Ingredients = ings
	return &r, nil
}

func (s *PGStore) UpdateRecipe(ctx context.Context, id string, name, description *string, servingCount *int, ingredients []Ingredient) (Recipe, error) {
	if ingredients == nil {
		// ponytail: COALESCE patch — can't null out name/description via PATCH,
		// same limitation as food.UpdateLog; switch to dynamic SET if needed.
		_, err := s.q.Exec(ctx, `UPDATE recipes SET
			name          = COALESCE($2, name),
			description   = COALESCE($3, description),
			serving_count = COALESCE($4, serving_count),
			updated_at    = now()
			WHERE id::text = $1`, id, name, description, servingCount)
		if err != nil {
			return Recipe{}, err
		}
	} else {
		cal, protein, carbs, fat, fibre := sumIngredients(ingredients)

		tx, err := s.q.Begin(ctx)
		if err != nil {
			return Recipe{}, err
		}
		defer tx.Rollback(ctx)

		_, err = tx.Exec(ctx, `UPDATE recipes SET
			name           = COALESCE($2, name),
			description    = COALESCE($3, description),
			serving_count  = COALESCE($4, serving_count),
			total_calories = $5, total_protein = $6, total_carbs = $7, total_fat = $8, total_fibre = $9,
			updated_at     = now()
			WHERE id::text = $1`,
			id, name, description, servingCount, cal, protein, carbs, fat, fibre)
		if err != nil {
			return Recipe{}, err
		}
		if _, err := tx.Exec(ctx, `DELETE FROM recipe_ingredients WHERE recipe_id::text = $1`, id); err != nil {
			return Recipe{}, err
		}
		for _, ing := range ingredients {
			if _, err := tx.Exec(ctx, `INSERT INTO recipe_ingredients
				(recipe_id, food_name, quantity_g, calories, protein, carbs, fat, fibre)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				id, ing.FoodName, ing.QuantityG, ing.Calories, ing.Protein, ing.Carbs, ing.Fat, ing.Fibre); err != nil {
				return Recipe{}, err
			}
		}
		if err := tx.Commit(ctx); err != nil {
			return Recipe{}, err
		}
	}

	r, err := s.GetRecipe(ctx, id)
	if err != nil {
		return Recipe{}, err
	}
	if r == nil {
		return Recipe{}, ErrNotFound
	}
	return *r, nil
}

func (s *PGStore) DeleteRecipe(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, `DELETE FROM recipes WHERE id::text = $1`, id)
	return err
}

// id::text comparison keeps malformed ids a clean not-found instead of a
// uuid parse error (same pattern as food/gym/goals/ai stores).
func (s *PGStore) GetRecipeOwner(ctx context.Context, id string) (string, error) {
	var owner string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM recipes WHERE id::text = $1`, id).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return owner, err
}

func (s *PGStore) LogRecipe(ctx context.Context, recipeID, mealType, date string, servings float64) (int, error) {
	rec, err := s.GetRecipe(ctx, recipeID)
	if err != nil {
		return 0, err
	}
	if rec == nil {
		return 0, ErrNotFound
	}

	servingCount := rec.ServingCount
	if servingCount <= 0 {
		// ponytail: defensive fallback for rows written before the handler-level
		// guards (recipes.go patchRecipe/logRecipe) existed, or any other write
		// path — never let a non-positive serving_count flip the scale sign.
		servingCount = 1
	}
	scale := servings / float64(servingCount)

	tx, err := s.q.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	if err := ensureProfile(ctx, tx, rec.UserID); err != nil {
		return 0, err
	}

	for _, ing := range rec.Ingredients {
		if _, err := tx.Exec(ctx, `INSERT INTO food_logs
			(user_id, date, meal_type, food_name, quantity, unit, calories, protein, carbs, fat, fibre, source)
			VALUES ($1, $2::date, $3, $4, $5, 'g', $6, $7, $8, $9, $10, 'recipe')`,
			rec.UserID, date, mealType, ing.FoodName, ing.QuantityG*scale,
			ing.Calories*scale, ing.Protein*scale, ing.Carbs*scale, ing.Fat*scale, ing.Fibre*scale); err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return len(rec.Ingredients), nil
}

// --- saved meals ---

const savedMealCols = `id, user_id, name, meal_type, total_calories, total_protein, total_carbs,
	total_fat, total_fibre, logged_count, last_logged, auto_generated, created_at`

func scanSavedMeal(row pgx.Row) (SavedMeal, error) {
	var m SavedMeal
	err := row.Scan(&m.ID, &m.UserID, &m.Name, &m.MealType, &m.TotalCalories, &m.TotalProtein,
		&m.TotalCarbs, &m.TotalFat, &m.TotalFibre, &m.LoggedCount, &m.LastLogged, &m.AutoGenerated, &m.CreatedAt)
	return m, err
}

func (s *PGStore) savedMealItems(ctx context.Context, id string) ([]MealItem, error) {
	rows, err := s.q.Query(ctx, `SELECT food_name, quantity_g, calories, protein, carbs, fat, fibre
		FROM saved_meal_items WHERE saved_meal_id::text = $1 ORDER BY id`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []MealItem
	for rows.Next() {
		var it MealItem
		if err := rows.Scan(&it.FoodName, &it.QuantityG, &it.Calories, &it.Protein, &it.Carbs, &it.Fat, &it.Fibre); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (s *PGStore) ListSavedMeals(ctx context.Context, userID string) ([]SavedMeal, error) {
	rows, err := s.q.Query(ctx, `SELECT `+savedMealCols+` FROM saved_meals
		WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SavedMeal
	for rows.Next() {
		m, err := scanSavedMeal(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range out {
		items, err := s.savedMealItems(ctx, out[i].ID)
		if err != nil {
			return nil, err
		}
		out[i].Items = items
	}
	return out, nil
}

func (s *PGStore) CreateSavedMeal(ctx context.Context, userID, name string, mealType *string, items []MealItem) (SavedMeal, error) {
	cal, protein, carbs, fat, fibre := sumItems(items)

	tx, err := s.q.Begin(ctx)
	if err != nil {
		return SavedMeal{}, err
	}
	defer tx.Rollback(ctx)

	if err := ensureProfile(ctx, tx, userID); err != nil {
		return SavedMeal{}, err
	}

	var id string
	var loggedCount int
	var lastLogged *time.Time
	var createdAt time.Time
	err = tx.QueryRow(ctx, `INSERT INTO saved_meals
		(user_id, name, meal_type, total_calories, total_protein, total_carbs, total_fat, total_fibre, auto_generated)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
		RETURNING id, logged_count, last_logged, created_at`,
		userID, name, mealType, cal, protein, carbs, fat, fibre).
		Scan(&id, &loggedCount, &lastLogged, &createdAt)
	if err != nil {
		return SavedMeal{}, err
	}

	for _, it := range items {
		if _, err := tx.Exec(ctx, `INSERT INTO saved_meal_items
			(saved_meal_id, food_name, quantity_g, calories, protein, carbs, fat, fibre)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			id, it.FoodName, it.QuantityG, it.Calories, it.Protein, it.Carbs, it.Fat, it.Fibre); err != nil {
			return SavedMeal{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return SavedMeal{}, err
	}

	return SavedMeal{
		ID: id, UserID: userID, Name: name, MealType: mealType,
		TotalCalories: cal, TotalProtein: protein, TotalCarbs: carbs, TotalFat: fat, TotalFibre: fibre,
		Items: items, LoggedCount: loggedCount, LastLogged: lastLogged, AutoGenerated: false, CreatedAt: createdAt,
	}, nil
}

func (s *PGStore) LogSavedMeal(ctx context.Context, id, mealType, date string) (int, error) {
	var userID string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM saved_meals WHERE id::text = $1`, id).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, err
	}

	items, err := s.savedMealItems(ctx, id)
	if err != nil {
		return 0, err
	}

	tx, err := s.q.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	if err := ensureProfile(ctx, tx, userID); err != nil {
		return 0, err
	}

	for _, it := range items {
		if _, err := tx.Exec(ctx, `INSERT INTO food_logs
			(user_id, date, meal_type, food_name, quantity, unit, calories, protein, carbs, fat, fibre, source)
			VALUES ($1, $2::date, $3, $4, $5, 'g', $6, $7, $8, $9, $10, 'saved_meal')`,
			userID, date, mealType, it.FoodName, it.QuantityG, it.Calories, it.Protein, it.Carbs, it.Fat, it.Fibre); err != nil {
			return 0, err
		}
	}

	if _, err := tx.Exec(ctx, `UPDATE saved_meals SET logged_count = logged_count + 1, last_logged = now()
		WHERE id::text = $1`, id); err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return len(items), nil
}

func (s *PGStore) DeleteSavedMeal(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, `DELETE FROM saved_meals WHERE id::text = $1`, id)
	return err
}

// id::text comparison keeps malformed ids a clean not-found instead of a
// uuid parse error (same pattern as food/gym/goals/ai stores).
func (s *PGStore) GetSavedMealOwner(ctx context.Context, id string) (string, error) {
	var owner string
	err := s.q.QueryRow(ctx, `SELECT user_id FROM saved_meals WHERE id::text = $1`, id).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return owner, err
}
