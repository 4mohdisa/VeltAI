package auth

import (
	"encoding/json"
	"net/http"

	"lumo/backend/internal/db"
	"lumo/backend/internal/httpx"
)

// ExportSection is one table's rows in the export document.
type exportSection struct {
	name string
	sql  string // must select exactly one jsonb value scoped to $1 (user id)
}

// exportSections lists every user-data table (GDPR access / App Store privacy
// posture: the user can take their data with them). Kept in sync with the
// schema by tests/migrations TestExportCoversEveryUserTable. Deliberately
// excluded: confidence_calibration (global aggregate, no user rows) and the
// two shared libraries. integration_connections strips token material — an
// export must never leak OAuth credentials.
var exportSections = []exportSection{
	{"profile", `select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from profiles t where id = $1`},
	{"onboarding", ownedRows("onboarding")},
	{"goals", ownedRows("goals")},
	{"subscriptions", ownedRows("subscriptions")},
	{"user_cuisine_preferences", ownedRows("user_cuisine_preferences")},
	{"food_logs", ownedRows("food_logs")},
	{"saved_foods", ownedRows("saved_foods")},
	{"saved_meals", ownedRows("saved_meals")},
	{"saved_meal_items", childRows("saved_meal_items", "saved_meal_id", "saved_meals")},
	{"recipes", ownedRows("recipes")},
	{"recipe_ingredients", childRows("recipe_ingredients", "recipe_id", "recipes")},
	{"food_name_corrections", ownedRows("food_name_corrections")},
	{"user_portion_prefs", ownedRows("user_portion_prefs")},
	{"body_weight", ownedRows("body_weight")},
	{"gym_sessions", ownedRows("gym_sessions")},
	{"gym_exercises", childRows("gym_exercises", "session_id", "gym_sessions")},
	{"gym_streaks", ownedRows("gym_streaks")},
	{"gym_adherence", ownedRows("gym_adherence")},
	{"workout_templates", ownedRows("workout_templates")},
	{"template_exercises", childRows("template_exercises", "template_id", "workout_templates")},
	{"workout_schedule", ownedRows("workout_schedule")},
	{"user_gym_patterns", ownedRows("user_gym_patterns")},
	{"integration_connections", `select coalesce(jsonb_agg(to_jsonb(t) - 'access_token' - 'refresh_token'), '[]'::jsonb) from integration_connections t where user_id = $1`},
	{"scan_sessions", ownedRows("scan_sessions")},
	{"scan_images", childRows("scan_images", "scan_session_id", "scan_sessions")},
	{"scan_corrections", ownedRows("scan_corrections")},
	{"user_scan_calibration", ownedRows("user_scan_calibration")},
	{"user_food_affinity", ownedRows("user_food_affinity")},
	{"ai_user_brain", ownedRows("ai_user_brain")},
	{"ai_insights", ownedRows("ai_insights")},
	{"analytics_events", ownedRows("analytics_events")},
}

// ExportTableNames exposes the covered tables ("profile" reports as
// "profiles") so the migrations test can assert no user table is missed.
func ExportTableNames() []string {
	names := make([]string, 0, len(exportSections))
	for _, s := range exportSections {
		if s.name == "profile" {
			names = append(names, "profiles")
			continue
		}
		names = append(names, s.name)
	}
	return names
}

func ownedRows(table string) string {
	return `select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from ` + table + ` t where user_id = $1`
}

func childRows(table, fk, parent string) string {
	return `select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from ` + table +
		` t where t.` + fk + ` in (select id from ` + parent + ` where user_id = $1)`
}

// RegisterExport mounts GET /api/export: every row the user owns, as one JSON
// document keyed by table name. Sequential queries — this is a rare, on-demand
// endpoint; correctness and completeness over speed.
func RegisterExport(mux *http.ServeMux, q db.Querier) {
	mux.HandleFunc("GET /api/export", func(w http.ResponseWriter, r *http.Request) {
		userID := UserID(r.Context())
		out := make(map[string]json.RawMessage, len(exportSections)+1)
		out["exported_for"] = json.RawMessage(`"` + userID + `"`)
		for _, s := range exportSections {
			var rows []byte
			if err := q.QueryRow(r.Context(), s.sql, userID).Scan(&rows); err != nil {
				httpx.Error(w, http.StatusInternalServerError, "export failed on "+s.name)
				return
			}
			out[s.name] = json.RawMessage(rows)
		}
		httpx.JSON(w, http.StatusOK, out)
	})
}
