// Package food implements food logs, daily summaries, saved foods, and
// food search (Open Food Facts + USDA FoodData Central).
package food

import (
	"context"
	"encoding/json"
	"errors"
	"time"
)

var ErrNotFound = errors.New("not found")

type Log struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Date      string    `json:"date"`
	MealType  *string   `json:"meal_type"`
	FoodName  string    `json:"food_name"`
	Brand     *string   `json:"brand"`
	Barcode   *string   `json:"barcode"`
	Quantity  *float64  `json:"quantity"`
	Unit      *string   `json:"unit"`
	Calories  float64   `json:"calories"`
	Protein   float64   `json:"protein"`
	Carbs     float64   `json:"carbs"`
	Fat       float64   `json:"fat"`
	Fibre     float64   `json:"fibre"`
	Source    *string   `json:"source"`
	CreatedAt time.Time `json:"created_at"`
	// IdempotencyKey is set from the Idempotency-Key header (offline-queue replay),
	// never from the body — a partial unique index makes a replay return the
	// existing row instead of duplicating.
	IdempotencyKey string `json:"-"`
	// Status lifecycle for scanned logs: analyzing → ready → confirmed (also
	// 'failed'). Non-scan rows default to 'confirmed'. ScanResults holds the
	// pipeline's per-region breakdown + confidence (null for non-pipeline rows).
	Status      string          `json:"status"`
	ScanResults json.RawMessage `json:"scan_results,omitempty"`
}

type LogPatch struct {
	Date     *string  `json:"date"`
	MealType *string  `json:"meal_type"`
	FoodName *string  `json:"food_name"`
	Brand    *string  `json:"brand"`
	Barcode  *string  `json:"barcode"`
	Quantity *float64 `json:"quantity"`
	Unit     *string  `json:"unit"`
	Calories *float64 `json:"calories"`
	Protein  *float64 `json:"protein"`
	Carbs    *float64 `json:"carbs"`
	Fat      *float64 `json:"fat"`
	Fibre    *float64 `json:"fibre"`
	Source   *string  `json:"source"`
}

type Summary struct {
	Date     string  `json:"date"`
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Carbs    float64 `json:"carbs"`
	Fat      float64 `json:"fat"`
	Fibre    float64 `json:"fibre"`
}

type SavedFood struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	FoodName    string    `json:"food_name"`
	Brand       *string   `json:"brand"`
	Barcode     *string   `json:"barcode"`
	Calories    float64   `json:"calories"`
	Protein     float64   `json:"protein"`
	Carbs       float64   `json:"carbs"`
	Fat         float64   `json:"fat"`
	Fibre       float64   `json:"fibre"`
	ServingSize *float64  `json:"serving_size"`
	ServingUnit *string   `json:"serving_unit"`
	CreatedAt   time.Time `json:"created_at"`
}

// PortionPref is a user's learned typical portion for a food they log
// repeatedly (see UpsertPortionPref / GetPortionPref).
type PortionPref struct {
	TypicalWeightG  *float64
	LoggedCount     int
	TypicalMealType *string
}

type Store interface {
	ListLogs(ctx context.Context, userID string, date, mealType, status *string) ([]Log, error)
	CreateLog(ctx context.Context, l Log) (Log, error)
	// GetLog returns a single log by id (ErrNotFound if absent). The handler
	// checks ownership on the returned row's UserID.
	GetLog(ctx context.Context, id string) (Log, error)
	GetLogOwner(ctx context.Context, id string) (string, error)
	UpdateLog(ctx context.Context, id string, p LogPatch) (Log, error)
	DeleteLog(ctx context.Context, id string) error
	Summary(ctx context.Context, userID, date string) (Summary, error)
	// LoggedDays returns the distinct dates the user has at least one food row
	// on, oldest first, optionally bounded by from/to (inclusive). It backs the
	// week-strip and calendar dots, which need membership and nothing else.
	LoggedDays(ctx context.Context, userID string, from, to *string) ([]string, error)
	ListSaved(ctx context.Context, userID string) ([]SavedFood, error)
	CreateSaved(ctx context.Context, s SavedFood) (SavedFood, error)
	GetSavedOwner(ctx context.Context, id string) (string, error)
	DeleteSaved(ctx context.Context, id string) error

	// Cuisine-aware search ranking.
	UserCuisinePrefs(ctx context.Context, userID string) (cuisines, dietary []string, err error)
	CuisineLibraryNames(ctx context.Context, cuisines []string) (map[string]bool, error)

	// Portion memory.
	GetPortionPref(ctx context.Context, userID, foodName string) (*PortionPref, error)

	// General food-logging learning hooks.
	UpsertPortionPref(ctx context.Context, userID, foodName string, weightG float64, mealType string) error
	RecordFoodNameCorrection(ctx context.Context, userID, original, corrected string) error
	FlagBrainRebuildIfDue(ctx context.Context, userID string) error
	DetectMealMemory(ctx context.Context, userID, date, mealType string) error
}
