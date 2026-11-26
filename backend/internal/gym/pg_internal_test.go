// In-package real-SQL tests for PGStore and ParamEngine (pg.go,
// parameters_pg.go). They run against LUME_TEST_DATABASE_URL, a disposable
// local database with every migration applied, and skip without it, like the
// other TestPG suites. Each test owns a profile row and deletes it on cleanup;
// every gym table cascades from profiles.
package gym

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ellipticalTrainer is a seeded library row with a parameter_schema
// (duration_minutes required 1..300, met_fallback formula).
const ellipticalTrainer = "Elliptical Trainer"

func ptrTo[T any](v T) *T { return &v }

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// testUser makes a fresh profile and deletes it (and everything that cascades
// from it) when the test ends.
func testUser(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, id); err != nil {
		t.Fatalf("clear profile: %v", err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1)`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	return id
}

// testLibraryExercise inserts a library row with no parameter schema.
func testLibraryExercise(t *testing.T, pool *pgxpool.Pool, name, muscle string, met float64) string {
	t.Helper()
	ctx := context.Background()
	var id string
	if err := pool.QueryRow(ctx, `
		INSERT INTO exercise_library (name, muscle_group_primary, category, exercise_type, equipment, difficulty, met_value)
		VALUES ($1, $2, 'push', 'strength', 'barbell', 'intermediate', $3)
		ON CONFLICT (name) DO UPDATE SET met_value = EXCLUDED.met_value
		RETURNING id::text`, name, muscle, met).Scan(&id); err != nil {
		t.Fatalf("seed library exercise: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM exercise_library WHERE id::text = $1`, id) })
	return id
}

func setBodyweight(t *testing.T, pool *pgxpool.Pool, userID string, weight float64, unit string) {
	t.Helper()
	if _, err := pool.Exec(context.Background(),
		`INSERT INTO onboarding (user_id, weight, weight_unit) VALUES ($1, $2, $3)`, userID, weight, unit); err != nil {
		t.Fatalf("seed onboarding: %v", err)
	}
}

func TestPG_SessionLifecycle(t *testing.T) {
	pool := testPool(t)
	store := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_session_lifecycle")

	s := &Session{UserID: user, Date: "2026-11-20", Name: ptrTo("Push"), DurationMinutes: ptrTo(45)}
	if err := store.CreateSession(ctx, s); err != nil {
		t.Fatalf("CreateSession: %v", err)
	}
	if s.ID == "" || s.CreatedAt.IsZero() {
		t.Fatalf("CreateSession did not fill id and created_at: %+v", s)
	}

	got, err := store.GetSession(ctx, s.ID)
	if err != nil {
		t.Fatalf("GetSession: %v", err)
	}
	if got.UserID != user || got.Date != "2026-11-20" || got.Exercises == nil || len(got.Exercises) != 0 {
		t.Fatalf("GetSession = %+v, want the user's empty session on 2026-11-20", got)
	}

	got.Date = "2026-11-21"
	got.Notes = ptrTo("felt strong")
	if err := store.UpdateSession(ctx, got); err != nil {
		t.Fatalf("UpdateSession: %v", err)
	}
	again, err := store.GetSession(ctx, s.ID)
	if err != nil {
		t.Fatalf("GetSession after update: %v", err)
	}
	if again.Date != "2026-11-21" || again.Notes == nil || *again.Notes != "felt strong" {
		t.Fatalf("after update = %+v, want date 2026-11-21 and the note", again)
	}

	if err := store.DeleteSession(ctx, s.ID); err != nil {
		t.Fatalf("DeleteSession: %v", err)
	}
	if _, err := store.GetSession(ctx, s.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetSession after delete err = %v, want ErrNotFound", err)
	}
}

func TestPG_GetSessionNotFound(t *testing.T) {
	store := NewPGStore(testPool(t))
	for _, id := range []string{"not-a-uuid", "00000000-0000-0000-0000-000000000000", ""} {
		if _, err := store.GetSession(context.Background(), id); !errors.Is(err, ErrNotFound) {
			t.Errorf("GetSession(%q) err = %v, want ErrNotFound", id, err)
		}
	}
}

func TestPG_CreateSessionIdempotencyKeyReturnsTheSameRow(t *testing.T) {
	pool := testPool(t)
	store := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_session_idem")

	first := &Session{UserID: user, Date: "2026-11-20", IdempotencyKey: "key-1"}
	if err := store.CreateSession(ctx, first); err != nil {
		t.Fatalf("first CreateSession: %v", err)
	}
	replay := &Session{UserID: user, Date: "2026-11-20", IdempotencyKey: "key-1"}
	if err := store.CreateSession(ctx, replay); err != nil {
		t.Fatalf("replayed CreateSession: %v", err)
	}
	if replay.ID != first.ID {
		t.Fatalf("replay id = %s, want the first session's id %s", replay.ID, first.ID)
	}
	other := &Session{UserID: user, Date: "2026-11-20", IdempotencyKey: "key-2"}
	if err := store.CreateSession(ctx, other); err != nil {
		t.Fatalf("second key CreateSession: %v", err)
	}
	if other.ID == first.ID {
		t.Fatal("a different idempotency key reused the first session")
	}
	sessions, err := store.ListSessions(ctx, user, "", "", 0)
	if err != nil {
		t.Fatalf("ListSessions: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("ListSessions = %d sessions, want 2", len(sessions))
	}
}

func TestPG_ListSessionsDateRange(t *testing.T) {
	pool := testPool(t)
	store := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_session_range")
	for _, d := range []string{"2026-11-01", "2026-11-10", "2026-11-20"} {
		if err := store.CreateSession(ctx, &Session{UserID: user, Date: d}); err != nil {
			t.Fatalf("CreateSession %s: %v", d, err)
		}
	}

	cases := []struct {
		name     string
		from, to string
		limit    int
		want     []string
	}{
		{"no bounds, newest first", "", "", 0, []string{"2026-11-20", "2026-11-10", "2026-11-01"}},
		{"from only", "2026-11-10", "", 0, []string{"2026-11-20", "2026-11-10"}},
		{"to only", "", "2026-11-10", 0, []string{"2026-11-10", "2026-11-01"}},
		{"inclusive both ends", "2026-11-10", "2026-11-10", 0, []string{"2026-11-10"}},
		{"empty window", "2026-11-11", "2026-11-19", 0, []string{}},
		{"limit keeps the newest", "", "", 1, []string{"2026-11-20"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := store.ListSessions(ctx, user, tc.from, tc.to, tc.limit)
			if err != nil {
				t.Fatalf("ListSessions: %v", err)
			}
			dates := []string{}
			for _, s := range got {
				dates = append(dates, s.Date)
			}
			if len(dates) != len(tc.want) {
				t.Fatalf("dates = %v, want %v", dates, tc.want)
			}
			for i := range dates {
				if dates[i] != tc.want[i] {
					t.Fatalf("dates = %v, want %v", dates, tc.want)
				}
			}
		})
	}
}

func TestPG_ExerciseLifecycle(t *testing.T) {
	pool := testPool(t)
	store := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_exercise_lifecycle")
	libID := testLibraryExercise(t, pool, "PG Test Bench Press", "chest", 6)

	s := &Session{UserID: user, Date: "2026-11-20"}
	if err := store.CreateSession(ctx, s); err != nil {
		t.Fatalf("CreateSession: %v", err)
	}
	e := &Exercise{
		SessionID: s.ID, Name: "Bench Press", Sets: ptrTo(3), Reps: ptrTo(8), Weight: ptrTo(60.0),
		WeightUnit: ptrTo("kg"), ExerciseLibraryID: &libID, Parameters: json.RawMessage(`{"tempo":"slow"}`),
	}
	if err := store.CreateExercise(ctx, e); err != nil {
		t.Fatalf("CreateExercise: %v", err)
	}

	got, owner, err := store.GetExercise(ctx, e.ID)
	if err != nil {
		t.Fatalf("GetExercise: %v", err)
	}
	if owner != user {
		t.Fatalf("owner = %q, want %q", owner, user)
	}
	if got.ExerciseType == nil || *got.ExerciseType != "strength" {
		t.Fatalf("exercise_type = %v, want the strength default", got.ExerciseType)
	}
	if got.ExerciseLibraryID == nil || *got.ExerciseLibraryID != libID {
		t.Fatalf("exercise_library_id = %v, want %s", got.ExerciseLibraryID, libID)
	}

	sess, err := store.GetSession(ctx, s.ID)
	if err != nil {
		t.Fatalf("GetSession: %v", err)
	}
	if len(sess.Exercises) != 1 || sess.Exercises[0].ID != e.ID {
		t.Fatalf("session exercises = %+v, want the one exercise", sess.Exercises)
	}

	// An update with no library id keeps the existing link (COALESCE), and an
	// empty Parameters clears the jsonb column.
	got.Reps = ptrTo(10)
	got.ExerciseLibraryID = nil
	got.Parameters = nil
	if err := store.UpdateExercise(ctx, got); err != nil {
		t.Fatalf("UpdateExercise: %v", err)
	}
	updated, _, err := store.GetExercise(ctx, e.ID)
	if err != nil {
		t.Fatalf("GetExercise after update: %v", err)
	}
	if updated.Reps == nil || *updated.Reps != 10 {
		t.Fatalf("reps = %v, want 10", updated.Reps)
	}
	if updated.ExerciseLibraryID == nil || *updated.ExerciseLibraryID != libID {
		t.Fatalf("library link = %v, want it kept as %s", updated.ExerciseLibraryID, libID)
	}
	if len(updated.Parameters) != 0 {
		t.Fatalf("parameters = %s, want cleared", updated.Parameters)
	}

	if err := store.DeleteExercise(ctx, e.ID); err != nil {
		t.Fatalf("DeleteExercise: %v", err)
	}
	if _, _, err := store.GetExercise(ctx, e.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetExercise after delete err = %v, want ErrNotFound", err)
	}
	if _, _, err := store.GetExercise(ctx, "not-a-uuid"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetExercise(garbage) err = %v, want ErrNotFound", err)
	}
}

func TestPG_StreakSaveAndRead(t *testing.T) {
	pool := testPool(t)
	store := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_streak")

	empty, err := store.GetStreak(ctx, user)
	if err != nil {
		t.Fatalf("GetStreak with no row: %v", err)
	}
	if empty.CurrentStreak != 0 || empty.LastGymDate != nil || empty.TotalDays != 0 {
		t.Fatalf("GetStreak with no row = %+v, want zeros", empty)
	}

	for _, st := range []Streak{
		{CurrentStreak: 3, LongestStreak: 5, LastGymDate: ptrTo("2026-11-20")},
		{CurrentStreak: 4, LongestStreak: 5, LastGymDate: ptrTo("2026-11-21"), FreezeUsed: true, LastFreezeDate: ptrTo("2026-11-21")},
	} {
		if err := store.SaveStreak(ctx, user, st); err != nil {
			t.Fatalf("SaveStreak(%+v): %v", st, err)
		}
		got, err := store.GetStreak(ctx, user)
		if err != nil {
			t.Fatalf("GetStreak: %v", err)
		}
		if got.CurrentStreak != st.CurrentStreak || got.LongestStreak != st.LongestStreak ||
			got.FreezeUsed != st.FreezeUsed || *got.LastGymDate != *st.LastGymDate {
			t.Fatalf("GetStreak = %+v, want %+v", got, st)
		}
	}
}

func TestPG_ParamEngineComputeForExerciseName(t *testing.T) {
	pool := testPool(t)
	engine := NewParamEngine(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_param_name")
	testLibraryExercise(t, pool, "PG Test No Params", "chest", 6)

	cases := []struct {
		name     string
		exercise string
		params   map[string]any
		wantErr  string
	}{
		{"valid duration", ellipticalTrainer, map[string]any{"duration_minutes": 30.0}, ""},
		{"lower bound", ellipticalTrainer, map[string]any{"duration_minutes": 1.0}, ""},
		{"upper bound", ellipticalTrainer, map[string]any{"duration_minutes": 300.0}, ""},
		{"above the max", ellipticalTrainer, map[string]any{"duration_minutes": 301.0}, "param"},
		{"unknown exercise", "PG Test Nothing Called This", map[string]any{}, "unknown exercise: PG Test Nothing Called This"},
		{"exercise with no schema", "PG Test No Params", map[string]any{}, "this exercise takes no parameters"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := engine.ComputeForExerciseName(ctx, user, tc.exercise, tc.params)
			if tc.wantErr != "" {
				var pe *ParamError
				if !errors.As(err, &pe) {
					t.Fatalf("err = %v, want a *ParamError", err)
				}
				if tc.wantErr != "param" && pe.Msg != tc.wantErr {
					t.Fatalf("err = %q, want %q", pe.Msg, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("ComputeForExerciseName: %v", err)
			}
			if got.LibraryID == nil || *got.LibraryID == "" || got.Result.Calories <= 0 || got.DurationMin == nil {
				t.Fatalf("result = %+v, want a linked library id, calories and a duration", got)
			}
		})
	}
}

func TestPG_ParamEngineBodyweight(t *testing.T) {
	pool := testPool(t)
	engine := NewParamEngine(pool)
	ctx := context.Background()

	cases := []struct {
		name      string
		weight    float64
		unit      string
		seed      bool
		wantKg    float64
		wantKnown bool
	}{
		{"no onboarding row", 0, "", false, 70, false},
		{"kilograms", 80, "kg", true, 80, true},
		{"pounds convert to kilograms", 200, "lb", true, 200 * 0.453592, true},
		{"zero weight falls back", 0, "kg", true, 70, false},
	}
	for i, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			user := testUser(t, pool, "user_pg_bodyweight_"+string(rune('a'+i)))
			if tc.seed {
				setBodyweight(t, pool, user, tc.weight, tc.unit)
			}
			kg, known, err := engine.bodyweight(ctx, user)
			if err != nil {
				t.Fatalf("bodyweight: %v", err)
			}
			if kg != tc.wantKg || known != tc.wantKnown {
				t.Fatalf("bodyweight = (%v, %v), want (%v, %v)", kg, known, tc.wantKg, tc.wantKnown)
			}
		})
	}
}

func TestPG_ParamEnginePreviewAndLastLogged(t *testing.T) {
	pool := testPool(t)
	engine := NewParamEngine(pool)
	store := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_param_preview")
	noParams := testLibraryExercise(t, pool, "PG Test Preview No Params", "chest", 6)

	var ellipticalID string
	if err := pool.QueryRow(ctx, `SELECT id::text FROM exercise_library WHERE name = $1`, ellipticalTrainer).Scan(&ellipticalID); err != nil {
		t.Fatalf("find %s: %v", ellipticalTrainer, err)
	}

	res, err := engine.PreviewByID(ctx, user, ellipticalID, map[string]any{"duration_minutes": 20.0})
	if err != nil {
		t.Fatalf("PreviewByID: %v", err)
	}
	if res.Calories <= 0 {
		t.Fatalf("preview calories = %v, want > 0", res.Calories)
	}
	for _, tc := range []struct{ id, want string }{
		{"not-a-uuid", "unknown exercise"},
		{noParams, "this exercise takes no parameters"},
	} {
		var pe *ParamError
		if _, err := engine.PreviewByID(ctx, user, tc.id, map[string]any{}); !errors.As(err, &pe) || pe.Msg != tc.want {
			t.Errorf("PreviewByID(%q) err = %v, want %q", tc.id, err, tc.want)
		}
	}
	var pe *ParamError
	if _, err := engine.PreviewByID(ctx, user, ellipticalID, map[string]any{"duration_minutes": 0.0}); !errors.As(err, &pe) {
		t.Errorf("PreviewByID below the min err = %v, want a *ParamError", err)
	}

	none, err := engine.LastLogged(ctx, user, ellipticalID)
	if err != nil || none != nil {
		t.Fatalf("LastLogged with no logs = (%s, %v), want (nil, nil)", none, err)
	}
	for _, day := range []struct{ date, params string }{
		{"2026-11-10", `{"duration_minutes": 15}`},
		{"2026-11-20", `{"duration_minutes": 40}`},
	} {
		s := &Session{UserID: user, Date: day.date}
		if err := store.CreateSession(ctx, s); err != nil {
			t.Fatalf("CreateSession: %v", err)
		}
		if err := store.CreateExercise(ctx, &Exercise{
			SessionID: s.ID, Name: ellipticalTrainer, ExerciseLibraryID: &ellipticalID, Parameters: json.RawMessage(day.params),
		}); err != nil {
			t.Fatalf("CreateExercise: %v", err)
		}
	}
	last, err := engine.LastLogged(ctx, user, ellipticalID)
	if err != nil {
		t.Fatalf("LastLogged: %v", err)
	}
	var params map[string]float64
	if err := json.Unmarshal(last, &params); err != nil {
		t.Fatalf("LastLogged json: %v", err)
	}
	if params["duration_minutes"] != 40 {
		t.Fatalf("LastLogged = %s, want the newest session's parameters", last)
	}
}
