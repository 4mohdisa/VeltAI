// In-package real-SQL tests for PGStore. They run against
// LUME_TEST_DATABASE_URL, a disposable local database with every migration
// applied, and skip without it, like the other TestPG suites. Each test owns a
// profile row and deletes it on cleanup; connections and gym sessions cascade
// from profiles, and oauth_states rows are removed by user id.
package integrations

import (
	"context"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

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
// from it, plus its OAuth states) when the test ends.
func testUser(t *testing.T, pool *pgxpool.Pool, id string) string {
	t.Helper()
	ctx := context.Background()
	remove := func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM oauth_states WHERE user_id = $1`, id)
		_, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id)
	}
	remove()
	if _, err := pool.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1)`, id); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(remove)
	return id
}

func TestPGConnections(t *testing.T) {
	pool := testPool(t)
	s := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_integrations_conn")

	if c, err := s.GetConnection(ctx, user, "strava"); c != nil || err != nil {
		t.Fatalf("GetConnection(none) = %+v, %v, want nil, nil", c, err)
	}
	if list, err := s.ListConnections(ctx, user); len(list) != 0 || err != nil {
		t.Fatalf("ListConnections(none) = %+v, %v", list, err)
	}

	connectedAt := time.Date(2026, 7, 1, 9, 0, 0, 0, time.UTC)
	if err := s.UpsertConnection(ctx, &Connection{UserID: user, Provider: "strava", AccessToken: "enc-a1", ConnectedAt: connectedAt}); err != nil {
		t.Fatalf("first upsert: %v", err)
	}
	c, err := s.GetConnection(ctx, user, "strava")
	if err != nil || c == nil {
		t.Fatalf("GetConnection = %+v, %v", c, err)
	}
	if c.AccessToken != "enc-a1" || c.RefreshToken != "" || c.ExternalUserID != "" || c.ExpiresAt != nil ||
		c.LastSyncAt != nil || len(c.Scopes) != 0 || !c.ConnectedAt.Equal(connectedAt) {
		t.Fatalf("minimal connection read back as %+v", c)
	}

	synced := time.Date(2026, 7, 2, 9, 0, 0, 0, time.UTC)
	if err := s.TouchLastSync(ctx, user, "strava", synced); err != nil {
		t.Fatalf("TouchLastSync: %v", err)
	}

	// A token refresh replaces the tokens but keeps connected_at and the sync watermark.
	expires := time.Date(2026, 7, 3, 9, 0, 0, 0, time.UTC)
	if err := s.UpsertConnection(ctx, &Connection{
		UserID: user, Provider: "strava", AccessToken: "enc-a2", RefreshToken: "enc-r2",
		ExpiresAt: &expires, Scopes: []string{"activity:read_all"}, ExternalUserID: "42", ConnectedAt: time.Now(),
	}); err != nil {
		t.Fatalf("refresh upsert: %v", err)
	}
	c, _ = s.GetConnection(ctx, user, "strava")
	if c.AccessToken != "enc-a2" || c.RefreshToken != "enc-r2" || c.ExternalUserID != "42" ||
		c.ExpiresAt == nil || !c.ExpiresAt.Equal(expires) || !reflect.DeepEqual(c.Scopes, []string{"activity:read_all"}) ||
		!c.ConnectedAt.Equal(connectedAt) || c.LastSyncAt == nil || !c.LastSyncAt.Equal(synced) {
		t.Fatalf("refreshed connection read back as %+v", c)
	}

	if err := s.UpsertConnection(ctx, &Connection{UserID: user, Provider: "whoop", AccessToken: "enc-w", ConnectedAt: connectedAt}); err != nil {
		t.Fatalf("whoop upsert: %v", err)
	}
	list, err := s.ListConnections(ctx, user)
	if err != nil || len(list) != 2 || list[0].Provider != "strava" || list[1].Provider != "whoop" {
		t.Fatalf("ListConnections = %+v, %v, want strava then whoop", list, err)
	}

	for _, want := range []bool{true, false} {
		if deleted, err := s.DeleteConnection(ctx, user, "strava"); deleted != want || err != nil {
			t.Fatalf("DeleteConnection = %v, %v, want %v", deleted, err, want)
		}
	}
	if list, _ := s.ListConnections(ctx, user); len(list) != 1 {
		t.Fatalf("after delete ListConnections = %+v, want only whoop", list)
	}
}

func TestPGOAuthState(t *testing.T) {
	pool := testPool(t)
	s := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_integrations_state")
	now := time.Now()

	issue := func(token string, expires time.Time) {
		t.Helper()
		if err := s.IssueState(ctx, user+token, user, "strava", expires); err != nil {
			t.Fatalf("IssueState(%s): %v", token, err)
		}
	}
	issue("-valid", now.Add(stateTTL))
	issue("-probed", now.Add(stateTTL))
	issue("-expired", now.Add(time.Minute))

	cases := []struct {
		name, token, provider string
		at                    time.Time
		wantOK                bool
	}{
		{"valid", "-valid", "strava", now, true},
		{"reused", "-valid", "strava", now, false},
		{"wrong provider", "-probed", "whoop", now, false},
		{"burned by the wrong-provider probe", "-probed", "strava", now, false},
		{"expired", "-expired", "strava", now.Add(2 * time.Minute), false},
		{"unknown", "-never-issued", "strava", now, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok, err := s.ConsumeState(ctx, user+tc.token, tc.provider, tc.at)
			if err != nil || ok != tc.wantOK || (ok && got != user) {
				t.Fatalf("ConsumeState = %q, %v, %v, want ok=%v", got, ok, err, tc.wantOK)
			}
		})
	}

	// Issuing sweeps rows that have already expired.
	issue("-stale", now.Add(-time.Minute))
	issue("-fresh", now.Add(stateTTL))
	var stale int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM oauth_states WHERE state = $1`, user+"-stale").Scan(&stale); err != nil || stale != 0 {
		t.Fatalf("stale state rows = %d, %v, want swept", stale, err)
	}
}

type importedRow struct {
	Name, Method, SessionType string
	Duration                  *int
	Calories                  *float64
	StravaID, WhoopID         *string
	Parameters                *string
	Linked                    bool
}

func TestPGCreateImportedSession(t *testing.T) {
	pool := testPool(t)
	s := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_integrations_import")
	kcal := 300.0

	steps := []struct {
		name        string
		in          ImportedSession
		wantCreated bool
	}{
		{"strava run", ImportedSession{Provider: "strava", ActivityID: "s1", Date: "2026-07-14", Name: "Morning Run", DurationMinutes: 30,
			Calories: &kcal, SessionType: "cardio", ExerciseName: "Running", Parameters: map[string]any{"duration_minutes": 30}}, true},
		{"same strava activity again", ImportedSession{Provider: "strava", ActivityID: "s1", Date: "2026-07-14", DurationMinutes: 30,
			SessionType: "cardio", ExerciseName: "Running"}, false},
		{"whoop copy of the run within tolerance", ImportedSession{Provider: "whoop", ActivityID: "w1", Date: "2026-07-14", DurationMinutes: 38,
			SessionType: "cardio", ExerciseName: "Workout"}, false},
		{"whoop strength the same day", ImportedSession{Provider: "whoop", ActivityID: "w2", Date: "2026-07-14", DurationMinutes: 38,
			SessionType: "strength", ExerciseName: "Workout"}, true},
		{"whoop cardio without a duration", ImportedSession{Provider: "whoop", ActivityID: "w3", Date: "2026-07-14",
			SessionType: "cardio", ExerciseName: "Workout"}, true},
		{"unknown provider", ImportedSession{Provider: "garmin", ActivityID: "g1", Date: "2026-07-15", DurationMinutes: 20,
			SessionType: "cardio", ExerciseName: "Cycling"}, true},
		{"unknown provider again is caught as a cross-source duplicate", ImportedSession{Provider: "garmin", ActivityID: "g1", Date: "2026-07-15",
			DurationMinutes: 20, SessionType: "cardio", ExerciseName: "Cycling"}, false},
	}
	for _, st := range steps {
		st.in.UserID = user
		created, err := s.CreateImportedSession(ctx, st.in)
		if err != nil || created != st.wantCreated {
			t.Fatalf("%s: created = %v, %v, want %v", st.name, created, err, st.wantCreated)
		}
	}

	rows, err := pool.Query(ctx, `
		SELECT coalesce(s.name, ''), s.calculation_method, s.session_type, s.duration_minutes, s.calories_burned,
		       s.strava_activity_id, s.whoop_workout_id, e.parameters::text, e.exercise_library_id IS NOT NULL
		FROM gym_sessions s JOIN gym_exercises e ON e.session_id = s.id
		WHERE s.user_id = $1 ORDER BY s.date, s.session_type DESC, s.duration_minutes NULLS LAST`, user)
	if err != nil {
		t.Fatalf("read sessions: %v", err)
	}
	defer rows.Close()
	var got []importedRow
	for rows.Next() {
		var r importedRow
		if err := rows.Scan(&r.Name, &r.Method, &r.SessionType, &r.Duration, &r.Calories, &r.StravaID, &r.WhoopID, &r.Parameters, &r.Linked); err != nil {
			t.Fatalf("scan session: %v", err)
		}
		got = append(got, r)
	}
	if len(got) != 4 {
		t.Fatalf("stored %d sessions, want 4: %+v", len(got), got)
	}
	run, strength, noDuration, garmin := got[1], got[0], got[2], got[3]
	if run.Name != "Morning Run" || run.Method != "device" || *run.Duration != 30 || *run.Calories != 300 ||
		*run.StravaID != "s1" || run.Parameters == nil || *run.Parameters != `{"duration_minutes": 30}` || !run.Linked {
		t.Fatalf("strava run stored as %+v", run)
	}
	if strength.SessionType != "strength" || *strength.WhoopID != "w2" || strength.Name != "Workout" || strength.Parameters != nil {
		t.Fatalf("whoop strength stored as %+v", strength)
	}
	if noDuration.Duration != nil || *noDuration.WhoopID != "w3" {
		t.Fatalf("whoop workout without a duration stored as %+v", noDuration)
	}
	if garmin.StravaID != nil || garmin.WhoopID != nil || *garmin.Duration != 20 {
		t.Fatalf("unknown provider session stored as %+v", garmin)
	}
}
