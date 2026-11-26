// Package security holds the Row 18 security tests (PHASE4_ROWS.md).
//
// Row 18b step 1: SQL injection fuzzing. Every route that takes a string in
// its path, query or JSON body is sent each payload below, one field at a time,
// as a signed-in owner through the real auth.Middleware and the real Postgres
// stores, mounted as cmd/server mounts them. A route must never answer 500,
// must answer in the one envelope shape, and a refused request must leave the
// owner's row counts unchanged. A payload that is accepted is stored as plain
// data, so the counts are read again after it.
//
// The AI, scan and integration clients get no keys, so they refuse before any
// network call; food search points at a local server. Skipped unless
// LUME_TEST_DATABASE_URL is set.
package security

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"lume/backend/internal/account"
	"lume/backend/internal/ai"
	"lume/backend/internal/aiquota"
	"lume/backend/internal/analytics"
	"lume/backend/internal/auth"
	"lume/backend/internal/debugreports"
	"lume/backend/internal/energy"
	"lume/backend/internal/feedback"
	"lume/backend/internal/food"
	"lume/backend/internal/goals"
	"lume/backend/internal/gym"
	"lume/backend/internal/integrations"
	"lume/backend/internal/push"
	"lume/backend/internal/recipes"
	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
	"lume/backend/internal/subscription"
)

// injectionPayloads are sent as plain data. Postgres refuses a NUL byte in a
// text value, and the handlers answer that refusal with 500 before writing
// anything; that gap is parked (KNOWN_ISSUES.md, Row 18b), so nulByte exempts
// only the 500 check, never the envelope or the row counts.
var injectionPayloads = []struct {
	name, value string
	nulByte     bool
}{
	{"single quote", "'", false},
	{"comment", "x' -- ", false},
	{"or 1=1", "' OR 1=1 --", false},
	{"union select", "' UNION SELECT id, email FROM profiles --", false},
	{"drop table", "'; DROP TABLE food_logs; --", false},
	{"null byte", "a\x00b", true},
	{"10000 characters", strings.Repeat("A", 10000), false},
	{"right to left and emoji", "\u202Eevil\u202C 🍎👍🏽", false},
	{"json breaking", `"}],"x":{"`, false},
}

// fuzzRoute is one route with the inputs it reads as strings. owns names the
// seeded row whose id fills {id} in the path and "{id}" in body; the other
// {name} placeholders come from the fixed values in seedRows. Body field paths
// are dotted ("events.0.name").
type fuzzRoute struct {
	pattern   string
	owns      string
	body      string
	fields    []string
	query     []string
	pathParam string
}

var fuzzRoutes = []fuzzRoute{
	{pattern: "PATCH /api/profile", body: `{"display_name":"Owner","avatar_url":"https://img.example.test/a.png"}`, fields: []string{"display_name", "avatar_url"}},

	{pattern: "POST /api/onboarding", body: `{"age":30,"sex":"female","height":170,"height_unit":"cm","weight":70,"weight_unit":"kg","activity_level":"moderate","goal":"maintain","body_type":"average","cuisines":["italian"],"dietary_requirements":["none"]}`,
		fields: []string{"sex", "height_unit", "weight_unit", "activity_level", "goal", "body_type", "cuisines.0", "dietary_requirements.0"}},
	{pattern: "PATCH /api/onboarding/preferences", body: `{"cuisines":["italian"],"dietary_requirements":["none"]}`, fields: []string{"cuisines.0", "dietary_requirements.0"}},
	{pattern: "PUT /api/goals", body: `{"calorie_target":2000,"weight_goal":"maintain","weight_unit":"kg","activity_level":"moderate","source":"manual"}`,
		fields: []string{"weight_goal", "weight_unit", "activity_level", "source"}},
	{pattern: "POST /api/body-weight", body: `{"date":"2026-11-01","weight":70,"unit":"kg","notes":"morning"}`, fields: []string{"date", "unit", "notes"}},
	{pattern: "DELETE /api/body-weight/{id}", owns: "body_weight", pathParam: "id"},

	{pattern: "GET /api/food/logs", query: []string{"date", "from", "to", "status", "meal_type"}},
	{pattern: "POST /api/food/logs", body: `{"date":"2026-11-01","meal_type":"lunch","food_name":"Apple","brand":"Farm","barcode":"123","unit":"g","quantity":100,"calories":52,"source":"manual"}`,
		fields: []string{"date", "meal_type", "food_name", "brand", "barcode", "unit", "source"}},
	{pattern: "GET /api/food/logs/{id}", owns: "food_log", pathParam: "id"},
	{pattern: "PATCH /api/food/logs/{id}", owns: "food_log", body: `{"date":"2026-11-01","meal_type":"dinner","food_name":"Pear","brand":"Farm","barcode":"456","unit":"g","source":"manual"}`,
		fields: []string{"date", "meal_type", "food_name", "brand", "barcode", "unit", "source"}, pathParam: "id"},
	{pattern: "DELETE /api/food/logs/{id}", owns: "food_log", pathParam: "id"},
	{pattern: "GET /api/food/summary", query: []string{"date"}},
	{pattern: "GET /api/food/days", query: []string{"from", "to"}},
	{pattern: "POST /api/food/quick-add", body: `{"calories":300,"meal_type":"snack","date":"2026-11-01","label":"Snack"}`, fields: []string{"meal_type", "date", "label"}},
	{pattern: "GET /api/food/search", query: []string{"q"}},
	{pattern: "GET /api/food/barcode/{barcode}", pathParam: "barcode"},
	{pattern: "GET /api/food/portion-memory", query: []string{"food_name"}},
	{pattern: "POST /api/food/saved", body: `{"food_name":"Bar","brand":"Brand","barcode":"789","calories":200,"serving_size":1,"serving_unit":"bar"}`,
		fields: []string{"food_name", "brand", "barcode", "serving_unit"}},
	{pattern: "DELETE /api/food/saved/{id}", owns: "saved_food", pathParam: "id"},

	{pattern: "GET /api/gym/sessions", query: []string{"from", "limit"}},
	{pattern: "POST /api/gym/sessions", body: `{"date":"2026-11-01","name":"Push","notes":"felt good","duration_minutes":45}`, fields: []string{"date", "name", "notes"}},
	{pattern: "PATCH /api/gym/sessions/{id}", owns: "gym_session", body: `{"date":"2026-11-01","name":"Pull","notes":"fine"}`, fields: []string{"date", "name", "notes"}, pathParam: "id"},
	{pattern: "DELETE /api/gym/sessions/{id}", owns: "gym_session", pathParam: "id"},
	{pattern: "POST /api/gym/sessions/{id}/complete", owns: "gym_session", body: `{"completion_rate":1}`, pathParam: "id"},
	{pattern: "POST /api/gym/sessions/{id}/exercises", owns: "gym_session", body: `{"name":"Bench","sets":3,"reps":8,"weight":60,"weight_unit":"kg","notes":"ok"}`,
		fields: []string{"name", "weight_unit", "notes"}, pathParam: "id"},
	{pattern: "PATCH /api/gym/exercises/{id}", owns: "gym_exercise", body: `{"name":"Bench","weight_unit":"kg","notes":"ok"}`, fields: []string{"name", "weight_unit", "notes"}, pathParam: "id"},
	{pattern: "DELETE /api/gym/exercises/{id}", owns: "gym_exercise", pathParam: "id"},
	{pattern: "GET /api/gym/exercises/{id}", owns: "library", pathParam: "id"},
	{pattern: "GET /api/gym/last-logged/{exercise_id}", pathParam: "exercise_id"},
	{pattern: "GET /api/gym/templates/{id}", owns: "template", pathParam: "id"},
	{pattern: "POST /api/gym/templates", body: `{"name":"Upper","estimated_duration_minutes":40,"exercises":[{"exercise_id":"{library}","planned_sets":3,"planned_weight_unit":"kg"}]}`,
		fields: []string{"name", "exercises.0.exercise_id", "exercises.0.planned_weight_unit"}},
	{pattern: "PATCH /api/gym/templates/{id}", owns: "template", body: `{"name":"Lower"}`, fields: []string{"name"}, pathParam: "id"},
	{pattern: "DELETE /api/gym/templates/{id}", owns: "template", pathParam: "id"},
	{pattern: "POST /api/gym/templates/{id}/exercises", owns: "template", body: `{"exercise_id":"{library}","planned_sets":3,"planned_weight_unit":"kg"}`,
		fields: []string{"exercise_id", "planned_weight_unit"}, pathParam: "id"},
	{pattern: "PATCH /api/gym/template-exercises/{id}", owns: "template_exercise", body: `{"planned_sets":4,"planned_weight_unit":"kg"}`, fields: []string{"planned_weight_unit"}, pathParam: "id"},
	{pattern: "DELETE /api/gym/template-exercises/{id}", owns: "template_exercise", pathParam: "id"},
	{pattern: "POST /api/gym/calories/preview", body: `{"exercise_id":"{library}","parameters":{"duration_minutes":30}}`, fields: []string{"exercise_id"}},
	{pattern: "GET /api/gym/progress/{exercise_name}", pathParam: "exercise_name", query: []string{"limit"}},
	{pattern: "PUT /api/gym/schedule", owns: "template", body: `{"schedule":[{"day_of_week":1,"template_id":"{id}"}]}`, fields: []string{"schedule.0.template_id"}},
	{pattern: "PUT /api/gym/schedule/{day}", owns: "template", body: `{"template_id":"{id}"}`, fields: []string{"template_id"}, pathParam: "day"},

	{pattern: "GET /api/energy-balance", query: []string{"date"}},
	{pattern: "GET /api/energy-balance/week", query: []string{"end"}},

	{pattern: "GET /api/integrations/{provider}/connect", pathParam: "provider"},
	{pattern: "POST /api/integrations/{provider}/sync", body: `{}`, pathParam: "provider"},
	{pattern: "DELETE /api/integrations/{provider}", pathParam: "provider"},
	{pattern: "GET /api/integrations/{provider}/callback", query: []string{"code", "state"}, pathParam: "provider"},

	{pattern: "POST /api/scan", body: `{"image_base64":"aGVsbG8=","mime_type":"image/jpeg"}`, fields: []string{"image_base64", "mime_type"}},
	{pattern: "POST /api/scan/confirm", owns: "scan_session", body: `{"date":"2026-11-01","meal_type":"lunch","food_name":"Toast","unit":"g","quantity":50,"calories":120,"scan_session_id":"{id}"}`,
		fields: []string{"date", "meal_type", "food_name", "unit", "scan_session_id"}},
	{pattern: "POST /api/scan/correction", owns: "scan_session", body: `{"scan_session_id":"{id}","food_name_original":"Toast","food_name_corrected":"Bread","weight_original_g":50,"weight_corrected_g":60,"macro_source_original":"ai","correction_type":"name"}`,
		fields: []string{"scan_session_id", "food_name_original", "food_name_corrected", "macro_source_original", "correction_type"}},
	{pattern: "POST /api/scan/feedback", owns: "scan_session", body: `{"scan_session_id":"{id}","rating":"up"}`, fields: []string{"scan_session_id", "rating"}},
	{pattern: "POST /api/scan/pipeline", body: `{"image_base64":"aGVsbG8=","mime_type":"image/jpeg","date":"2026-11-01","meal_type":"lunch","images":[{"image_base64":"aGVsbG8=","mime_type":"image/jpeg","angle":"top"}]}`,
		fields: []string{"image_base64", "mime_type", "date", "meal_type", "images.0.mime_type", "images.0.angle"}},
	{pattern: "POST /api/scan/label", body: `{"image_base64":"aGVsbG8=","mime_type":"image/jpeg"}`, fields: []string{"image_base64", "mime_type"}},

	{pattern: "GET /api/recipes/{id}", owns: "recipe", pathParam: "id"},
	{pattern: "POST /api/recipes", body: `{"name":"Soup","description":"warm","serving_count":2,"ingredients":[{"food_name":"Carrot","quantity_g":100,"calories":41}]}`,
		fields: []string{"name", "description", "ingredients.0.food_name"}},
	{pattern: "PATCH /api/recipes/{id}", owns: "recipe", body: `{"name":"Stew","description":"hearty","ingredients":[{"food_name":"Potato","quantity_g":100,"calories":77}]}`,
		fields: []string{"name", "description", "ingredients.0.food_name"}, pathParam: "id"},
	{pattern: "DELETE /api/recipes/{id}", owns: "recipe", pathParam: "id"},
	{pattern: "POST /api/recipes/{id}/log", owns: "recipe", body: `{"meal_type":"dinner","servings":1,"date":"2026-11-01"}`, fields: []string{"meal_type", "date"}, pathParam: "id"},
	{pattern: "POST /api/saved-meals", body: `{"name":"Breakfast","meal_type":"breakfast","items":[{"food_name":"Oats","quantity_g":40,"calories":150}]}`,
		fields: []string{"name", "meal_type", "items.0.food_name"}},
	{pattern: "POST /api/saved-meals/{id}/log", owns: "saved_meal", body: `{"meal_type":"breakfast","date":"2026-11-01"}`, fields: []string{"meal_type", "date"}, pathParam: "id"},
	{pattern: "DELETE /api/saved-meals/{id}", owns: "saved_meal", pathParam: "id"},

	{pattern: "POST /api/analytics/events", body: `{"events":[{"name":"screen_view","properties":{"count":1},"session_id":"s1","client_ts":"2026-11-01T08:00:00Z"}]}`,
		fields: []string{"events.0.name", "events.0.session_id", "events.0.client_ts"}},
	{pattern: "POST /api/feedback", body: `{"category":"bug","message":"It broke","app_version":"1.0.0","device_model":"iPhone"}`,
		fields: []string{"category", "message", "app_version", "device_model"}},
	{pattern: "POST /api/push/token", body: `{"token":"ExponentPushToken[abc]","platform":"ios"}`, fields: []string{"token", "platform"}},
	{pattern: "DELETE /api/push/token", body: `{"token":"ExponentPushToken[abc]"}`, fields: []string{"token"}},
	{pattern: "POST /api/debug-reports", body: `{"client_id":"c1","created_at":"2026-11-01T08:00:00Z","title":"Crash","notes":"n","severity":"low","kind":"bug","area":"food","trigger":"button","route":"/today","app_version":"1.0.0","build_number":"1"}`,
		fields: []string{"client_id", "created_at", "title", "notes", "severity", "kind", "area", "trigger", "route", "app_version", "build_number"}},

	{pattern: "POST /api/ai/query", body: `{"question":"How am I doing?"}`, fields: []string{"question"}},
	{pattern: "POST /api/ai/insights/{id}/dismiss", owns: "insight", body: `{}`, pathParam: "id"},
}

// unknownID is a well-formed id no row has; it stands in for the scan session
// and the insight, which no API route creates without a paid AI call.
const unknownID = "00000000-0000-4000-8000-000000000000"

// upstream is where the food search and Gemini clients send their calls. The
// zero value gives no Gemini key, so those clients refuse before any call, and
// points food search at a local server that answers 404.
type upstream struct {
	geminiKey string
	base      string
	client    *http.Client
}

// newAPI mounts the routes as cmd/server does, without the rate limiter and
// the entitlement gate, behind the real auth middleware, and returns a token
// signer for it.
func newAPI(t *testing.T, pool *pgxpool.Pool, up upstream) (http.Handler, func(userID string) string) {
	t.Helper()
	if err := gym.SeedExerciseLibrary(pool); err != nil {
		t.Fatalf("seed exercise library: %v", err)
	}
	if up.base == "" {
		offline := httptest.NewServer(http.NotFoundHandler())
		t.Cleanup(offline.Close)
		up.base = offline.URL
	}
	if up.client == nil {
		up.client = http.DefaultClient
	}
	search := food.NewSearchClient("")
	search.OFFBase, search.USDABase, search.HTTP = up.base, up.base, up.client
	ocr := scan.NewGemini(up.geminiKey).(*scan.Gemini)
	ocr.Base, ocr.HTTP = up.base, up.client
	scanGemini := pipeline.NewGemini(up.geminiKey)
	scanGemini.Base, scanGemini.HTTP = up.base, up.client
	llm := ai.NewGemini(up.geminiKey, "").(*ai.Gemini)
	llm.Base, llm.HTTP = up.base, up.client

	profiles := auth.NewPGProfileStore(pool)
	quota := aiquota.New(1000, aiquota.NewPGStore(pool))
	integrationsSvc := integrations.NewService(integrations.NewPGStore(pool), nil, integrations.NewStrava(), integrations.NewWhoop())
	scanStore := scan.NewPGStore(pool)

	api := http.NewServeMux()
	auth.RegisterProfileWithIdentity(api, profiles, auth.NewClerkUserDeleter(""))
	auth.RegisterExport(api, pool)
	food.Register(api, food.NewPGStore(pool), search)
	gym.RegisterWithEngine(api, gym.NewPGStore(pool), gym.NewParamEngine(pool))
	gym.RegisterSchedule(api, gym.NewSchedulePGStore(pool))
	energy.Register(api, energy.NewPGStore(pool))
	integrations.Register(api, integrationsSvc)
	goals.Register(api, goals.NewPGStore(pool))
	scan.Register(api, ocr, scanStore, quota)
	drain := scan.RegisterPipeline(api, scanGemini, scanStore, pool, quota)
	t.Cleanup(func() { drain(context.Background()) })
	subscription.Register(api, subscription.NewPGStore(pool))
	recipes.Register(api, recipes.NewPGStore(pool))
	analytics.Register(api, analytics.NewPGStore(pool))
	feedback.Register(api, feedback.NewPGStore(pool))
	push.Register(api, push.NewPGStore(pool))
	debugreports.Register(api, debugreports.NewPGStore(pool))
	ai.NewService(ai.NewPGStore(pool), llm, quota).Routes(api)

	root := http.NewServeMux()
	integrations.RegisterCallbacks(root, integrationsSvc)
	authed, sign := signedTokens(t, auth.EnsureProfile(profiles)(api))
	root.Handle("/api/", authed)
	return root, sign
}

func TestPG_StringInputsResistInjection(t *testing.T) {
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)

	owner := seedOwner(t, pool, fmt.Sprintf("security_injection_%d", os.Getpid()))
	handler, sign := newAPI(t, pool, upstream{})
	token := sign(owner)
	send := func(t *testing.T, method, target, body string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, target, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		return rec
	}
	ids := seedRows(t, pool, func(method, target, body string) *httptest.ResponseRecorder {
		return send(t, method, target, body)
	})

	for _, route := range fuzzRoutes {
		method, path, _ := strings.Cut(route.pattern, " ")
		basePath := fillPath(path, ids, route.owns, "", "")
		baseBody := strings.NewReplacer(`"{id}"`, strconv.Quote(ids[route.owns]), `"{library}"`, strconv.Quote(ids["library"])).Replace(route.body)
		for _, p := range injectionPayloads {
			type input struct{ name, target, body string }
			var inputs []input
			for _, field := range route.fields {
				inputs = append(inputs, input{"body " + field, basePath, withField(t, baseBody, field, p.value)})
			}
			for _, q := range route.query {
				inputs = append(inputs, input{"query " + q, basePath + "?" + url.Values{q: {p.value}}.Encode(), baseBody})
			}
			if route.pathParam != "" {
				inputs = append(inputs, input{"path " + route.pathParam, fillPath(path, ids, route.owns, route.pathParam, p.value), baseBody})
			}
			for _, in := range inputs {
				t.Run(route.pattern+"/"+in.name+"/"+p.name, func(t *testing.T) {
					before := ownerCounts(t, pool, owner)
					rec := send(t, method, in.target, in.body)
					if rec.Code == http.StatusInternalServerError && !p.nulByte {
						t.Fatalf("status 500 (body %.300s)", rec.Body.String())
					}
					wantEnvelope(t, rec)
					if after := ownerCounts(t, pool, owner); rec.Code >= http.StatusBadRequest && after != before {
						t.Fatalf("refused with %d but rows changed: %s, was %s", rec.Code, after, before)
					}
				})
			}
		}
	}
}

// seedRows creates one of each owned row through the API, so the id routes
// reach a real row, and returns the values that fill the route placeholders.
func seedRows(t *testing.T, pool *pgxpool.Pool, send func(method, target, body string) *httptest.ResponseRecorder) map[string]string {
	t.Helper()
	ids := map[string]string{
		"barcode": "0000000000000", "exercise_name": "Bench", "day": "1", "provider": "strava",
		"scan_session": unknownID, "insight": unknownID,
	}
	var library string
	if err := pool.QueryRow(context.Background(), `SELECT id::text FROM exercise_library ORDER BY name LIMIT 1`).Scan(&library); err != nil {
		t.Fatalf("read exercise library: %v", err)
	}
	ids["library"], ids["exercise_id"] = library, library
	create := func(key, target, body string) {
		t.Helper()
		rec := send(http.MethodPost, target, body)
		var env struct {
			Data struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil || rec.Code >= http.StatusBadRequest || env.Data.ID == "" {
			t.Fatalf("seed %s: status %d body %s", key, rec.Code, rec.Body.String())
		}
		ids[key] = env.Data.ID
	}
	create("food_log", "/api/food/logs", `{"date":"2026-11-01","meal_type":"lunch","food_name":"Apple","calories":52}`)
	create("saved_food", "/api/food/saved", `{"food_name":"Bar","calories":200}`)
	create("body_weight", "/api/body-weight", `{"date":"2026-11-01","weight":70,"unit":"kg"}`)
	create("gym_session", "/api/gym/sessions", `{"date":"2026-11-01","name":"Push"}`)
	create("gym_exercise", "/api/gym/sessions/"+ids["gym_session"]+"/exercises", `{"name":"Bench","sets":3,"reps":8}`)
	create("template", "/api/gym/templates", `{"name":"Upper","exercises":[{"exercise_id":`+strconv.Quote(library)+`,"planned_sets":3}]}`)
	create("recipe", "/api/recipes", `{"name":"Soup","serving_count":2,"ingredients":[{"food_name":"Carrot","quantity_g":100,"calories":41}]}`)
	create("saved_meal", "/api/saved-meals", `{"name":"Breakfast","items":[{"food_name":"Oats","quantity_g":40,"calories":150}]}`)
	var templateExercise string
	if err := pool.QueryRow(context.Background(), `SELECT id::text FROM template_exercises WHERE template_id::text = $1 LIMIT 1`, ids["template"]).Scan(&templateExercise); err != nil {
		t.Fatalf("read template exercise: %v", err)
	}
	ids["template_exercise"] = templateExercise
	if rec := send(http.MethodPost, "/api/ai/consent", ""); rec.Code != http.StatusOK {
		t.Fatalf("grant AI consent: status %d", rec.Code)
	}
	return ids
}

// fillPath replaces each {name} in path: {id} with the owned row's id, the
// fuzzed parameter with value (escaped), and the rest from ids.
func fillPath(path string, ids map[string]string, owns, fuzzed, value string) string {
	parts := strings.Split(path, "/")
	for i, part := range parts {
		name, ok := strings.CutPrefix(part, "{")
		if !ok {
			continue
		}
		name = strings.TrimSuffix(name, "}")
		switch {
		case name == fuzzed:
			parts[i] = url.PathEscape(value)
		case name == "id":
			parts[i] = ids[owns]
		default:
			parts[i] = ids[name]
		}
	}
	return strings.Join(parts, "/")
}

// withField returns body with the string at the dotted field path set to value.
func withField(t *testing.T, body, field, value string) string {
	t.Helper()
	var doc any
	if err := json.Unmarshal([]byte(body), &doc); err != nil {
		t.Fatalf("route body is not JSON: %v", err)
	}
	keys := strings.Split(field, ".")
	node := doc
	for i, key := range keys {
		last := i == len(keys)-1
		switch n := node.(type) {
		case map[string]any:
			if last {
				n[key] = value
			} else {
				node = n[key]
			}
		case []any:
			idx, err := strconv.Atoi(key)
			if err != nil || idx >= len(n) {
				t.Fatalf("field %s: bad index %q", field, key)
			}
			if last {
				n[idx] = value
			} else {
				node = n[idx]
			}
		default:
			t.Fatalf("field %s: %q is not an object or array", field, key)
		}
	}
	out, err := json.Marshal(doc)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	return string(out)
}

// ownerCounts is the owner's row count in every user table (account.UserTables).
func ownerCounts(t *testing.T, pool *pgxpool.Pool, owner string) string {
	t.Helper()
	counts := make([]string, len(account.UserTables))
	for i, ut := range account.UserTables {
		counts[i] = fmt.Sprintf("(SELECT count(*) FROM %s WHERE %s = $1)", ut.Table, ut.Column)
	}
	var s string
	if err := pool.QueryRow(context.Background(), "SELECT concat_ws('|', "+strings.Join(counts, ", ")+")", owner).Scan(&s); err != nil {
		t.Fatalf("count owner rows: %v", err)
	}
	return s
}

// wantEnvelope fails unless rec is the one envelope: {"data": ..., "error":
// null} on success, {"data": null, "error": <non-null>} on refusal. A 204 or a
// redirect carries no envelope.
func wantEnvelope(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	if rec.Code == http.StatusNoContent || (rec.Code >= 300 && rec.Code < 400) {
		return
	}
	var env struct {
		Data  json.RawMessage `json:"data"`
		Error json.RawMessage `json:"error"`
	}
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&env); err != nil {
		t.Fatalf("status %d body is not the envelope: %v (body %.300s)", rec.Code, err, rec.Body.String())
	}
	refused := rec.Code >= http.StatusBadRequest
	if refused && (string(env.Data) != "null" || len(env.Error) == 0 || string(env.Error) == "null") {
		t.Fatalf("status %d is not the error envelope: %.300s", rec.Code, rec.Body.String())
	}
	if !refused && len(env.Error) != 0 && string(env.Error) != "null" {
		t.Fatalf("status %d carries an error: %.300s", rec.Code, rec.Body.String())
	}
}

// seedOwner and signedTokens are copies of the tests/food helpers (one copy
// per test package until a shared helper package is approved).

func seedOwner(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id, email) VALUES ($1, $1 || '@example.test')
		ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	return id
}

func signedTokens(t *testing.T, h http.Handler) (http.Handler, func(userID string) string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	verifier := &auth.JWTVerifier{Keyfunc: func(*jwt.Token) (any, error) { return &key.PublicKey, nil }}
	sign := func(userID string) string {
		s, err := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
			"sub": userID, "exp": time.Now().Add(time.Hour).Unix(),
		}).SignedString(key)
		if err != nil {
			t.Fatalf("sign token: %v", err)
		}
		return s
	}
	return auth.Middleware(verifier)(h), sign
}
