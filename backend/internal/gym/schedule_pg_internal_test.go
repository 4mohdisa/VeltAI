// In-package real-SQL tests for SchedulePGStore (schedule_pg.go): the library,
// templates, the weekly schedule, today's workout, completion and patterns.
// Helpers (testPool, testUser, testLibraryExercise, setBodyweight, ptrTo) are
// in pg_internal_test.go.
package gym

import (
	"context"
	"errors"
	"testing"
)

func TestPG_LibraryListFiltersAndGet(t *testing.T) {
	pool := testPool(t)
	store := NewSchedulePGStore(pool)
	ctx := context.Background()
	id := testLibraryExercise(t, pool, "PG Test Library Row", "chest", 6)

	cases := []struct {
		name   string
		filter ExerciseFilter
		want   bool
	}{
		{"name search is case insensitive", ExerciseFilter{Q: "pg test library"}, true},
		{"matching muscle and category", ExerciseFilter{Q: "PG Test Library", Muscle: "chest", Category: "push"}, true},
		{"matching type and equipment", ExerciseFilter{Q: "PG Test Library", Type: "strength", Equipment: "barbell"}, true},
		{"other muscle excludes it", ExerciseFilter{Q: "PG Test Library", Muscle: "back"}, false},
		{"other equipment excludes it", ExerciseFilter{Q: "PG Test Library", Equipment: "dumbbell"}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := store.ListLibraryExercises(ctx, tc.filter)
			if err != nil {
				t.Fatalf("ListLibraryExercises: %v", err)
			}
			found := false
			for _, e := range got {
				found = found || e.ID == id
			}
			if found != tc.want {
				t.Fatalf("row listed = %v, want %v (%d rows)", found, tc.want, len(got))
			}
		})
	}

	all, err := store.ListLibraryExercises(ctx, ExerciseFilter{})
	if err != nil {
		t.Fatalf("ListLibraryExercises with no filter: %v", err)
	}
	if len(all) == 0 || len(all) > 200 {
		t.Fatalf("unfiltered list = %d rows, want 1..200", len(all))
	}

	got, err := store.GetLibraryExercise(ctx, id)
	if err != nil || got.Name != "PG Test Library Row" {
		t.Fatalf("GetLibraryExercise = (%+v, %v), want the seeded row", got, err)
	}
	if _, err := store.GetLibraryExercise(ctx, "not-a-uuid"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetLibraryExercise(garbage) err = %v, want ErrNotFound", err)
	}
}

func TestPG_TemplateLifecycle(t *testing.T) {
	pool := testPool(t)
	store := NewSchedulePGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_template_lifecycle")
	bench := testLibraryExercise(t, pool, "PG Test Template Bench", "chest", 6)
	row := testLibraryExercise(t, pool, "PG Test Template Row", "back", 5)

	tpl, err := store.CreateTemplate(ctx, user, "Upper", ptrTo(50), []TemplateExerciseInput{
		{ExerciseID: row, PlannedSets: ptrTo(3), SortOrder: ptrTo(2)},
		{ExerciseID: bench, PlannedSets: ptrTo(4), SortOrder: ptrTo(1)},
	})
	if err != nil {
		t.Fatalf("CreateTemplate: %v", err)
	}
	if len(tpl.Exercises) != 2 || tpl.Exercises[0].ExerciseID != bench {
		t.Fatalf("template exercises = %+v, want bench first by sort order", tpl.Exercises)
	}

	tpl.Name = "Upper A"
	tpl.EstimatedDurationMinutes = ptrTo(55)
	if err := store.UpdateTemplate(ctx, tpl); err != nil {
		t.Fatalf("UpdateTemplate: %v", err)
	}
	list, err := store.ListTemplates(ctx, user)
	if err != nil {
		t.Fatalf("ListTemplates: %v", err)
	}
	if len(list) != 1 || list[0].Name != "Upper A" || len(list[0].Exercises) != 2 {
		t.Fatalf("ListTemplates = %+v, want the renamed template with 2 exercises", list)
	}

	te := tpl.Exercises[0]
	te.PlannedReps = ptrTo(6)
	if err := store.UpdateTemplateExercise(ctx, &te); err != nil {
		t.Fatalf("UpdateTemplateExercise: %v", err)
	}
	gotTE, owner, err := store.GetTemplateExercise(ctx, te.ID)
	if err != nil || owner != user || gotTE.PlannedReps == nil || *gotTE.PlannedReps != 6 {
		t.Fatalf("GetTemplateExercise = (%+v, %q, %v), want 6 planned reps owned by the user", gotTE, owner, err)
	}
	if err := store.DeleteTemplateExercise(ctx, te.ID); err != nil {
		t.Fatalf("DeleteTemplateExercise: %v", err)
	}
	if _, _, err := store.GetTemplateExercise(ctx, te.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetTemplateExercise after delete err = %v, want ErrNotFound", err)
	}

	if err := store.DeleteTemplate(ctx, tpl.ID); err != nil {
		t.Fatalf("DeleteTemplate: %v", err)
	}
	if _, err := store.GetTemplate(ctx, tpl.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetTemplate after delete err = %v, want ErrNotFound", err)
	}
	empty, err := store.ListTemplates(ctx, user)
	if err != nil || len(empty) != 0 {
		t.Fatalf("ListTemplates after delete = (%+v, %v), want none", empty, err)
	}
}

func TestPG_CreateTemplateUnknownExercise(t *testing.T) {
	pool := testPool(t)
	store := NewSchedulePGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_template_unknown")
	bench := testLibraryExercise(t, pool, "PG Test Unknown Bench", "chest", 6)

	cases := []struct {
		name      string
		exercises []TemplateExerciseInput
		wantErr   error
	}{
		{"no exercises", nil, nil},
		{"the same exercise twice", []TemplateExerciseInput{{ExerciseID: bench}, {ExerciseID: bench}}, nil},
		{"garbage id", []TemplateExerciseInput{{ExerciseID: "not-a-uuid"}}, ErrNotFound},
		{"one real, one missing", []TemplateExerciseInput{{ExerciseID: bench}, {ExerciseID: "00000000-0000-0000-0000-000000000000"}}, ErrNotFound},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := store.CreateTemplate(ctx, user, tc.name, nil, tc.exercises)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("CreateTemplate err = %v, want %v", err, tc.wantErr)
			}
		})
	}
	// The failed creates rolled back: only the two valid templates exist.
	list, err := store.ListTemplates(ctx, user)
	if err != nil || len(list) != 2 {
		t.Fatalf("ListTemplates = (%d, %v), want 2 templates", len(list), err)
	}
	if _, err := store.AddTemplateExercise(ctx, list[0].ID, TemplateExerciseInput{ExerciseID: "not-a-uuid"}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("AddTemplateExercise(garbage) err = %v, want ErrNotFound", err)
	}
}

func TestPG_ScheduleAndToday(t *testing.T) {
	pool := testPool(t)
	store := NewSchedulePGStore(pool)
	gymStore := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_schedule")
	bench := testLibraryExercise(t, pool, "PG Test Schedule Bench", "chest", 6)
	tpl, err := store.CreateTemplate(ctx, user, "Push", nil, []TemplateExerciseInput{{ExerciseID: bench}})
	if err != nil {
		t.Fatalf("CreateTemplate: %v", err)
	}

	week, err := store.GetSchedule(ctx, user)
	if err != nil {
		t.Fatalf("GetSchedule empty: %v", err)
	}
	if len(week) != 7 || week[0].DayName != "Sunday" || week[6].DayName != "Saturday" {
		t.Fatalf("empty schedule = %+v, want 7 days Sunday..Saturday", week)
	}
	for _, d := range week {
		if !d.IsRestDay {
			t.Fatalf("empty schedule day %d is not a rest day", d.DayOfWeek)
		}
	}

	if err := store.SetSchedule(ctx, user, []ScheduleDayInput{
		{DayOfWeek: 1, TemplateID: &tpl.ID},
		{DayOfWeek: 3, TemplateID: &tpl.ID},
	}); err != nil {
		t.Fatalf("SetSchedule: %v", err)
	}
	if err := store.SetScheduleDay(ctx, user, 3, nil); err != nil {
		t.Fatalf("SetScheduleDay clear: %v", err)
	}
	week, err = store.GetSchedule(ctx, user)
	if err != nil {
		t.Fatalf("GetSchedule: %v", err)
	}
	for _, d := range week {
		wantWorkout := d.DayOfWeek == 1
		if d.IsRestDay == wantWorkout {
			t.Fatalf("day %d rest = %v, want rest only off Monday", d.DayOfWeek, d.IsRestDay)
		}
		if wantWorkout && (d.Template == nil || d.Template.ID != tpl.ID) {
			t.Fatalf("Monday template = %+v, want %s", d.Template, tpl.ID)
		}
	}

	cases := []struct {
		name        string
		date        string
		day         int
		logSession  bool
		wantRest    bool
		wantChecked bool
	}{
		{"scheduled day, not yet trained", "2026-11-23", 1, false, false, false},
		{"rest day", "2026-11-24", 2, false, true, false},
		{"scheduled day, already trained", "2026-11-30", 1, true, false, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.logSession {
				if err := gymStore.CreateSession(ctx, &Session{UserID: user, Date: tc.date}); err != nil {
					t.Fatalf("CreateSession: %v", err)
				}
			}
			tw, err := store.GetToday(ctx, user, tc.date, tc.day)
			if err != nil {
				t.Fatalf("GetToday: %v", err)
			}
			if tw.IsRestDay != tc.wantRest || tw.AlreadyCheckedIn != tc.wantChecked {
				t.Fatalf("GetToday = rest %v checked in %v, want %v and %v", tw.IsRestDay, tw.AlreadyCheckedIn, tc.wantRest, tc.wantChecked)
			}
			if !tc.wantRest && len(tw.Exercises) != 1 {
				t.Fatalf("today's exercises = %d, want 1", len(tw.Exercises))
			}
		})
	}

	// Deleting the template leaves Monday's row with a null template: a rest day.
	if err := store.DeleteTemplate(ctx, tpl.ID); err != nil {
		t.Fatalf("DeleteTemplate: %v", err)
	}
	week, err = store.GetSchedule(ctx, user)
	if err != nil || !week[1].IsRestDay {
		t.Fatalf("Monday after the template is deleted = (%+v, %v), want a rest day", week[1], err)
	}
}

func TestPG_CompleteSessionScoresAndRebuildsPatterns(t *testing.T) {
	pool := testPool(t)
	store := NewSchedulePGStore(pool)
	gymStore := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_complete")
	other := testUser(t, pool, "user_pg_complete_other")
	bench := testLibraryExercise(t, pool, "PG Test Complete Bench", "chest", 6)
	setBodyweight(t, pool, user, 176, "lb")

	if p, err := store.GetPatterns(ctx, user); err != nil || p != nil {
		t.Fatalf("GetPatterns before any session = (%+v, %v), want (nil, nil)", p, err)
	}

	tpl, err := store.CreateTemplate(ctx, user, "Push", nil, []TemplateExerciseInput{{ExerciseID: bench}, {ExerciseID: bench}})
	if err != nil {
		t.Fatalf("CreateTemplate: %v", err)
	}
	var sessionID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO gym_sessions (user_id, date, duration_minutes, template_id)
		VALUES ($1, current_date, 40, $2::uuid) RETURNING id::text`, user, tpl.ID).Scan(&sessionID); err != nil {
		t.Fatalf("seed session: %v", err)
	}
	if err := gymStore.CreateExercise(ctx, &Exercise{
		SessionID: sessionID, Name: "PG Test Complete Bench", Sets: ptrTo(3), Reps: ptrTo(8), Weight: ptrTo(60.0), ExerciseLibraryID: &bench,
	}); err != nil {
		t.Fatalf("CreateExercise strength: %v", err)
	}
	if err := gymStore.CreateExercise(ctx, &Exercise{
		SessionID: sessionID, Name: ellipticalTrainer, ComputedMET: ptrTo(5.0), DurationMinutes: ptrTo(20),
	}); err != nil {
		t.Fatalf("CreateExercise parameter: %v", err)
	}

	errCases := []struct {
		name    string
		user    string
		session string
		want    error
	}{
		{"unknown session", user, "not-a-uuid", ErrNotFound},
		{"someone else's session", other, sessionID, ErrForbidden},
	}
	for _, tc := range errCases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := store.CompleteSession(ctx, tc.user, tc.session, nil); !errors.Is(err, tc.want) {
				t.Fatalf("CompleteSession err = %v, want %v", err, tc.want)
			}
		})
	}

	res, err := store.CompleteSession(ctx, user, sessionID, nil)
	if err != nil {
		t.Fatalf("CompleteSession: %v", err)
	}
	if !res.CheckedIn || res.TemplateID == nil || *res.TemplateID != tpl.ID || res.CompletionRate != 1 {
		t.Fatalf("CompleteSession = %+v, want checked in on the template at rate 1", res)
	}
	var kcal float64
	if err := pool.QueryRow(ctx, `SELECT calories_burned FROM gym_sessions WHERE id::text = $1`, sessionID).Scan(&kcal); err != nil {
		t.Fatalf("read calories: %v", err)
	}
	if kcal <= 0 {
		t.Fatalf("calories_burned = %v, want > 0", kcal)
	}

	override, err := store.CompleteSession(ctx, user, sessionID, ptrTo(0.5))
	if err != nil || override.CompletionRate != 0.5 {
		t.Fatalf("CompleteSession with a rate = (%+v, %v), want rate 0.5", override, err)
	}

	p, err := store.GetPatterns(ctx, user)
	if err != nil || p == nil {
		t.Fatalf("GetPatterns = (%+v, %v), want a rebuilt row", p, err)
	}
	if p.MuscleVolumeMap["chest"] <= 0 || len(p.MostTrainedMuscles) == 0 || p.LastRebuilt == nil {
		t.Fatalf("patterns = %+v, want chest volume and a rebuild time", p)
	}
}

func TestPG_CompleteSessionWithNoExercises(t *testing.T) {
	pool := testPool(t)
	store := NewSchedulePGStore(pool)
	gymStore := NewPGStore(pool)
	ctx := context.Background()
	user := testUser(t, pool, "user_pg_complete_empty")

	s := &Session{UserID: user, Date: "2026-11-20", DurationMinutes: ptrTo(30)}
	if err := gymStore.CreateSession(ctx, s); err != nil {
		t.Fatalf("CreateSession: %v", err)
	}
	res, err := store.CompleteSession(ctx, user, s.ID, nil)
	if err != nil {
		t.Fatalf("CompleteSession: %v", err)
	}
	if res.TemplateID != nil || res.CompletionRate != 1 || res.Customized {
		t.Fatalf("CompleteSession = %+v, want no template, rate 1, not customized", res)
	}
	var kcal float64
	if err := pool.QueryRow(ctx, `SELECT calories_burned FROM gym_sessions WHERE id::text = $1`, s.ID).Scan(&kcal); err != nil {
		t.Fatalf("read calories: %v", err)
	}
	if kcal <= 0 {
		t.Fatalf("calories_burned for a 30 minute session with no exercises = %v, want the duration fallback", kcal)
	}
}
