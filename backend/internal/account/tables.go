// Package account owns what a full account deletion has to reach.
package account

// UserTable is one table holding a user's rows and the column that names the
// user (profiles keys the user by its own id).
type UserTable struct {
	Table  string
	Column string
}

// UserTables lists every table with a user column, in migration order. Child
// tables keyed only by a parent row (gym_exercises, recipe_ingredients,
// saved_meal_items, template_exercises, scan_images) are not listed: they go
// with their parent. tables_test.go checks this list against the migrations.
var UserTables = []UserTable{
	{"profiles", "id"},
	{"food_logs", "user_id"},
	{"saved_foods", "user_id"},
	{"gym_sessions", "user_id"},
	{"goals", "user_id"},
	{"body_weight", "user_id"},
	{"gym_streaks", "user_id"},
	{"ai_user_brain", "user_id"},
	{"ai_insights", "user_id"},
	{"onboarding", "user_id"},
	{"subscriptions", "user_id"},
	{"user_cuisine_preferences", "user_id"},
	{"scan_sessions", "user_id"},
	{"scan_corrections", "user_id"},
	{"user_scan_calibration", "user_id"},
	{"user_portion_prefs", "user_id"},
	{"food_name_corrections", "user_id"},
	{"recipes", "user_id"},
	{"saved_meals", "user_id"},
	{"workout_templates", "user_id"},
	{"workout_schedule", "user_id"},
	{"gym_adherence", "user_id"},
	{"user_gym_patterns", "user_id"},
	{"integration_connections", "user_id"},
	{"user_food_affinity", "user_id"},
	{"analytics_events", "user_id"},
	{"oauth_states", "user_id"},
	{"debug_reports", "user_id"},
	{"feedback", "user_id"},
}
