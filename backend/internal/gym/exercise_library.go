package gym

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LibraryExercise is a reference exercise-library row. Named LibraryExercise
// (not Exercise) because gym.go already owns Exercise for a logged session set.
type LibraryExercise struct {
	ID                    string   `json:"id"`
	Name                  string   `json:"name"`
	MuscleGroupPrimary    string   `json:"muscle_group_primary"`
	MuscleGroupsSecondary []string `json:"muscle_groups_secondary"`
	Category              string   `json:"category"`
	ExerciseType          string   `json:"exercise_type"`
	Equipment             string   `json:"equipment"`
	Difficulty            string   `json:"difficulty"`
	Description           string   `json:"description"`
	// MetValue is the Metabolic Equivalent of Task used for calorie-burn math
	// (see internal/energy). Sourced from the Compendium of Physical Activities:
	// compound barbell lifts ~6.0, isolation/machine ~3.5, calisthenics ~8.0,
	// cardio per activity (running 8.3, jump rope 12.3, elliptical 5.0, ...).
	MetValue float64 `json:"met_value"`
	// ParameterSchema is the Phase 12 parameter definition (raw jsonb, passed
	// through to the app). Nil/omitted for exercises with no schema (strength).
	ParameterSchema json.RawMessage `json:"parameter_schema,omitempty"`
}

// sec builds a non-nil secondary-muscle slice (the column is NOT NULL default
// '{}', so a nil slice would violate the constraint).
func sec(v ...string) []string {
	if v == nil {
		return []string{}
	}
	return v
}

// LibrarySeed is the exercise-library reference data: 125 exercises covering all
// 12 primary muscle groups. Exposed so tests can verify coverage without a DB.
// Primary muscle group is EXACTLY one of: chest, back, quadriceps, hamstrings,
// glutes, shoulders, biceps, triceps, core, calves, cardio, full_body.
var LibrarySeed = []LibraryExercise{
	// --- Chest (13) ---
	{Name: "Barbell Bench Press", MetValue: 6.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps", "shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Flat barbell press, the primary horizontal chest builder."},
	{Name: "Incline Barbell Bench Press", MetValue: 6.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("shoulders", "triceps"), Category: "Chest", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Incline press emphasizing the upper chest."},
	{Name: "Decline Barbell Bench Press", MetValue: 6.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps"), Category: "Chest", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Decline press emphasizing the lower chest."},
	{Name: "Dumbbell Bench Press", MetValue: 5.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps", "shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Flat dumbbell press with a larger range of motion than the barbell."},
	{Name: "Incline Dumbbell Press", MetValue: 5.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("shoulders", "triceps"), Category: "Chest", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Upper-chest dumbbell press on an incline bench."},
	{Name: "Dumbbell Fly", MetValue: 3.5, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Chest isolation opening the arms in an arc."},
	{Name: "Cable Crossover", MetValue: 3.5, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "cable", Difficulty: "intermediate", Description: "Standing cable fly for constant chest tension."},
	{Name: "Machine Chest Press", MetValue: 3.5, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps", "shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Guided pressing movement, beginner friendly."},
	{Name: "Pec Deck Fly", MetValue: 3.5, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Seated machine fly isolating the chest."},
	{Name: "Push-up", MetValue: 8.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps", "shoulders", "core"), Category: "Chest", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Bodyweight horizontal press."},
	{Name: "Incline Push-up", MetValue: 6.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps", "shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Hands-elevated push-up, easier variant."},
	{Name: "Chest Dip", MetValue: 8.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("triceps", "shoulders"), Category: "Chest", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Forward-lean dip loading the lower chest."},
	{Name: "Landmine Press", MetValue: 5.0, MuscleGroupPrimary: "chest", MuscleGroupsSecondary: sec("shoulders", "triceps"), Category: "Chest", ExerciseType: "strength", Equipment: "barbell", Difficulty: "beginner", Description: "Angled one-arm press using a landmine setup."},

	// --- Back (14) ---
	{Name: "Deadlift", MetValue: 6.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("hamstrings", "glutes", "core"), Category: "Back", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Conventional deadlift, a full posterior-chain pull."},
	{Name: "Pull-up", MetValue: 8.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps", "shoulders"), Category: "Back", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Overhand vertical pull to a bar."},
	{Name: "Chin-up", MetValue: 8.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Underhand vertical pull with more biceps involvement."},
	{Name: "Lat Pulldown", MetValue: 3.5, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Cable vertical pull, scalable pull-up alternative."},
	{Name: "Bent-over Barbell Row", MetValue: 6.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps", "core"), Category: "Back", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Hinged barbell row for mid-back thickness."},
	{Name: "Pendlay Row", MetValue: 6.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Explosive dead-stop barbell row from the floor."},
	{Name: "T-Bar Row", MetValue: 5.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "machine", Difficulty: "intermediate", Description: "Landmine/T-bar row for the middle back."},
	{Name: "Seated Cable Row", MetValue: 3.5, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Horizontal cable pull with a neutral grip."},
	{Name: "One-arm Dumbbell Row", MetValue: 3.5, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Single-arm supported dumbbell row."},
	{Name: "Inverted Row", MetValue: 8.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps", "core"), Category: "Back", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Bodyweight horizontal row under a fixed bar."},
	{Name: "Straight-arm Pulldown", MetValue: 3.5, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec(), Category: "Back", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Lat isolation with straight arms."},
	{Name: "Rack Pull", MetValue: 6.0, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("glutes", "hamstrings"), Category: "Back", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Partial deadlift from pins for the upper back."},
	{Name: "Chest-Supported Row", MetValue: 3.5, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("biceps"), Category: "Back", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Prone-supported row that removes lower-back strain."},
	{Name: "Dumbbell Pullover", MetValue: 3.5, MuscleGroupPrimary: "back", MuscleGroupsSecondary: sec("chest"), Category: "Back", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Overhead arc pull stretching the lats."},

	// --- Quadriceps (12) ---
	{Name: "Back Squat", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "hamstrings", "core"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Barbell squat, the primary lower-body strength lift."},
	{Name: "Front Squat", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "core"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Front-racked squat with a more upright torso."},
	{Name: "Leg Press", MetValue: 5.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Machine press for heavy quad loading."},
	{Name: "Leg Extension", MetValue: 3.5, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Seated quad isolation."},
	{Name: "Bulgarian Split Squat", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "intermediate", Description: "Rear-foot-elevated single-leg squat."},
	{Name: "Walking Lunge", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Alternating forward lunges over distance."},
	{Name: "Goblet Squat", MetValue: 5.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "core"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Front-loaded squat holding a single dumbbell."},
	{Name: "Hack Squat", MetValue: 5.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes"), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "intermediate", Description: "Machine squat biasing the quads."},
	{Name: "Box Squat", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Squat to a box for depth control and power."},
	{Name: "Step-up", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Single-leg step onto a raised platform."},
	{Name: "Sissy Squat", MetValue: 5.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "advanced", Description: "Knees-forward bodyweight squat stressing the quads."},
	{Name: "Reverse Lunge", MetValue: 6.0, MuscleGroupPrimary: "quadriceps", MuscleGroupsSecondary: sec("glutes", "hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Stepping-back lunge, knee-friendly."},

	// --- Hamstrings (8) ---
	{Name: "Romanian Deadlift", MetValue: 6.0, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("glutes", "back"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Hip hinge with soft knees, the primary hamstring builder."},
	{Name: "Lying Leg Curl", MetValue: 3.5, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("calves"), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Prone machine hamstring curl."},
	{Name: "Seated Leg Curl", MetValue: 3.5, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("calves"), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Seated machine hamstring curl."},
	{Name: "Stiff-Leg Deadlift", MetValue: 6.0, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("glutes", "back"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Straighter-legged deadlift for a deep hamstring stretch."},
	{Name: "Good Morning", MetValue: 6.0, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("glutes", "back"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Barbell hip hinge with the bar on the back."},
	{Name: "Nordic Curl", MetValue: 6.0, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "advanced", Description: "Eccentric bodyweight hamstring curl from the knees."},
	{Name: "Glute-Ham Raise", MetValue: 6.0, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("glutes"), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "advanced", Description: "GHD raise training knee flexion and hip extension."},
	{Name: "Single-Leg Romanian Deadlift", MetValue: 5.0, MuscleGroupPrimary: "hamstrings", MuscleGroupsSecondary: sec("glutes", "core"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "intermediate", Description: "Unilateral hinge that also challenges balance."},

	// --- Glutes (8) ---
	{Name: "Hip Thrust", MetValue: 6.0, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec("hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Bench-supported barbell hip extension, the primary glute lift."},
	{Name: "Glute Bridge", MetValue: 4.0, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec("hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Floor hip extension, bodyweight or loaded."},
	{Name: "Cable Glute Kickback", MetValue: 3.5, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec("hamstrings"), Category: "Legs", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Standing single-leg hip extension on a cable."},
	{Name: "Sumo Deadlift", MetValue: 6.0, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec("hamstrings", "quadriceps", "back"), Category: "Legs", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Wide-stance deadlift biasing the glutes and inner thighs."},
	{Name: "Frog Pump", MetValue: 3.8, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Soles-together glute bridge for high-rep pumps."},
	{Name: "Curtsy Lunge", MetValue: 5.0, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec("quadriceps"), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Cross-behind lunge hitting the gluteus medius."},
	{Name: "Banded Lateral Walk", MetValue: 3.8, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Banded side-stepping for glute abduction."},
	{Name: "Single-Leg Hip Thrust", MetValue: 5.0, MuscleGroupPrimary: "glutes", MuscleGroupsSecondary: sec("hamstrings", "core"), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Unilateral hip thrust for glute balance."},

	// --- Shoulders (12) ---
	{Name: "Overhead Press", MetValue: 6.0, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("triceps", "core"), Category: "Shoulders", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Standing barbell press overhead, the primary shoulder lift."},
	{Name: "Seated Dumbbell Shoulder Press", MetValue: 5.0, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("triceps"), Category: "Shoulders", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Seated dumbbell overhead press."},
	{Name: "Arnold Press", MetValue: 5.0, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("triceps"), Category: "Shoulders", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "intermediate", Description: "Rotating dumbbell press hitting all three delt heads."},
	{Name: "Lateral Raise", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec(), Category: "Shoulders", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Side raise isolating the medial delt."},
	{Name: "Front Raise", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec(), Category: "Shoulders", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Front raise isolating the anterior delt."},
	{Name: "Rear Delt Fly", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("back"), Category: "Shoulders", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Bent-over reverse fly for the rear delts."},
	{Name: "Face Pull", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("back"), Category: "Shoulders", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Cable pull to the face for rear delts and health."},
	{Name: "Upright Row", MetValue: 5.0, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("biceps"), Category: "Shoulders", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Vertical pull to the collarbone for delts and traps."},
	{Name: "Cable Lateral Raise", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec(), Category: "Shoulders", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Side raise with constant cable tension."},
	{Name: "Machine Shoulder Press", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("triceps"), Category: "Shoulders", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Guided overhead press, beginner friendly."},
	{Name: "Push Press", MetValue: 6.0, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("triceps", "quadriceps"), Category: "Shoulders", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Leg-driven overhead press for heavier loads."},
	{Name: "Reverse Pec Deck", MetValue: 3.5, MuscleGroupPrimary: "shoulders", MuscleGroupsSecondary: sec("back"), Category: "Shoulders", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Machine reverse fly for the rear delts."},

	// --- Biceps (10) ---
	{Name: "Barbell Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "beginner", Description: "Standing barbell biceps curl."},
	{Name: "Dumbbell Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Standing alternating dumbbell curl."},
	{Name: "Hammer Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec("back"), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Neutral-grip curl hitting the brachialis and forearm."},
	{Name: "Preacher Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Arm-supported curl removing momentum."},
	{Name: "Concentration Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Seated single-arm curl braced on the thigh."},
	{Name: "Incline Dumbbell Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "intermediate", Description: "Curl on an incline bench for a long-head stretch."},
	{Name: "Cable Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Standing cable curl with constant tension."},
	{Name: "EZ-Bar Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "beginner", Description: "Curl on an EZ bar, wrist friendly."},
	{Name: "Spider Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "intermediate", Description: "Chest-supported curl with arms hanging."},
	{Name: "Zottman Curl", MetValue: 3.5, MuscleGroupPrimary: "biceps", MuscleGroupsSecondary: sec("back"), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "intermediate", Description: "Curl up supinated, lower pronated, training the forearm too."},

	// --- Triceps (10) ---
	{Name: "Close-Grip Bench Press", MetValue: 6.0, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec("chest", "shoulders"), Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Narrow-grip press biasing the triceps."},
	{Name: "Skull Crusher", MetValue: 3.5, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Lying triceps extension to the forehead."},
	{Name: "Triceps Pushdown", MetValue: 3.5, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Cable pushdown isolating the triceps."},
	{Name: "Overhead Triceps Extension", MetValue: 3.5, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Overhead extension stressing the long head."},
	{Name: "Triceps Dip", MetValue: 8.0, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec("chest", "shoulders"), Category: "Arms", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Upright dip loading the triceps."},
	{Name: "Diamond Push-up", MetValue: 8.0, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec("chest"), Category: "Arms", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Close-hand push-up biasing the triceps."},
	{Name: "Rope Pushdown", MetValue: 3.5, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "cable", Difficulty: "beginner", Description: "Rope-attachment pushdown with an end spread."},
	{Name: "Triceps Kickback", MetValue: 3.5, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec(), Category: "Arms", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Bent-over single-arm triceps extension."},
	{Name: "Bench Dip", MetValue: 6.0, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec("shoulders"), Category: "Arms", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Hands-on-bench dip for the triceps."},
	{Name: "JM Press", MetValue: 5.0, MuscleGroupPrimary: "triceps", MuscleGroupsSecondary: sec("chest"), Category: "Arms", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Hybrid of a close-grip press and skull crusher."},

	// --- Core (12) ---
	{Name: "Plank", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec("shoulders"), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Isometric front hold bracing the whole core."},
	{Name: "Side Plank", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec("shoulders"), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Lateral isometric hold for the obliques."},
	{Name: "Crunch", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec(), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Short-range spinal flexion for the abs."},
	{Name: "Hanging Leg Raise", MetValue: 4.0, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec("back"), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "advanced", Description: "Hanging raise for the lower abs and hip flexors."},
	{Name: "Russian Twist", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec(), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Seated rotational twist for the obliques."},
	{Name: "Bicycle Crunch", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec(), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Alternating knee-to-elbow crunch."},
	{Name: "Ab Wheel Rollout", MetValue: 4.0, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec("shoulders", "back"), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "advanced", Description: "Rollout with an ab wheel resisting extension."},
	{Name: "Cable Woodchop", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec("shoulders"), Category: "Core", ExerciseType: "strength", Equipment: "cable", Difficulty: "intermediate", Description: "Diagonal cable chop for rotational strength."},
	{Name: "Mountain Climber", MetValue: 8.0, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec("cardio", "shoulders"), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Plank with rapid alternating knee drives."},
	{Name: "Dead Bug", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec(), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Supine anti-extension with opposite limb reaches."},
	{Name: "Hollow Body Hold", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec(), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Isometric hollow hold used in gymnastics."},
	{Name: "Sit-up", MetValue: 3.8, MuscleGroupPrimary: "core", MuscleGroupsSecondary: sec(), Category: "Core", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Full-range trunk flexion."},

	// --- Calves (6) ---
	{Name: "Standing Calf Raise", MetValue: 3.5, MuscleGroupPrimary: "calves", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Standing raise emphasizing the gastrocnemius."},
	{Name: "Seated Calf Raise", MetValue: 3.5, MuscleGroupPrimary: "calves", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Bent-knee raise emphasizing the soleus."},
	{Name: "Leg Press Calf Raise", MetValue: 3.5, MuscleGroupPrimary: "calves", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "beginner", Description: "Calf raise performed on the leg-press sled."},
	{Name: "Donkey Calf Raise", MetValue: 3.5, MuscleGroupPrimary: "calves", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "machine", Difficulty: "intermediate", Description: "Bent-over calf raise for a deep stretch."},
	{Name: "Single-Leg Calf Raise", MetValue: 3.5, MuscleGroupPrimary: "calves", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "beginner", Description: "Unilateral calf raise for balance and range."},
	{Name: "Bodyweight Calf Raise", MetValue: 3.5, MuscleGroupPrimary: "calves", MuscleGroupsSecondary: sec(), Category: "Legs", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "beginner", Description: "Equipment-free standing calf raise."},

	// --- Cardio (12) ---
	{Name: "Running", MetValue: 8.3, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("quadriceps", "hamstrings", "calves"), Category: "Cardio", ExerciseType: "cardio", Equipment: "bodyweight", Difficulty: "beginner", Description: "Outdoor or track running for aerobic conditioning."},
	{Name: "Treadmill Running", MetValue: 8.3, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("quadriceps", "calves"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "beginner", Description: "Indoor running on a treadmill."},
	{Name: "Cycling", MetValue: 8.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("quadriceps", "glutes"), Category: "Cardio", ExerciseType: "cardio", Equipment: "bodyweight", Difficulty: "beginner", Description: "Road or trail cycling."},
	{Name: "Stationary Bike", MetValue: 8.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("quadriceps"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "beginner", Description: "Indoor cycling on a stationary bike."},
	{Name: "Rowing", MetValue: 7.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("back", "quadriceps"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "beginner", Description: "Full-body erg rowing."},
	{Name: "Elliptical Trainer", MetValue: 5.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("quadriceps", "glutes"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "beginner", Description: "Low-impact elliptical conditioning."},
	{Name: "Jump Rope", MetValue: 12.3, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("calves", "shoulders"), Category: "Cardio", ExerciseType: "cardio", Equipment: "bodyweight", Difficulty: "beginner", Description: "Skipping rope for coordination and conditioning."},
	{Name: "Stair Climber", MetValue: 9.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("glutes", "quadriceps"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "beginner", Description: "Continuous stepping on a stair machine."},
	{Name: "Swimming", MetValue: 8.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("back", "shoulders"), Category: "Cardio", ExerciseType: "cardio", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Full-body low-impact swimming."},
	{Name: "Incline Walking", MetValue: 6.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("glutes", "calves"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "beginner", Description: "Uphill treadmill walking, low-impact fat loss staple."},
	{Name: "Battle Ropes", MetValue: 8.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("shoulders", "core"), Category: "Cardio", ExerciseType: "cardio", Equipment: "bodyweight", Difficulty: "intermediate", Description: "High-intensity rope waves for conditioning."},
	{Name: "Assault Bike", MetValue: 10.0, MuscleGroupPrimary: "cardio", MuscleGroupsSecondary: sec("quadriceps", "shoulders"), Category: "Cardio", ExerciseType: "cardio", Equipment: "machine", Difficulty: "intermediate", Description: "Fan bike using arms and legs together."},

	// --- Full body (8) ---
	{Name: "Burpee", MetValue: 8.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("chest", "quadriceps", "cardio"), Category: "Full Body", ExerciseType: "strength", Equipment: "bodyweight", Difficulty: "intermediate", Description: "Squat-thrust to jump, a full-body conditioning move."},
	{Name: "Kettlebell Swing", MetValue: 9.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("glutes", "hamstrings", "back"), Category: "Full Body", ExerciseType: "strength", Equipment: "kettlebell", Difficulty: "intermediate", Description: "Explosive hip hinge swinging a kettlebell."},
	{Name: "Clean and Jerk", MetValue: 6.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("shoulders", "quadriceps", "back"), Category: "Full Body", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Olympic lift from floor to overhead in two phases."},
	{Name: "Snatch", MetValue: 6.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("shoulders", "back", "quadriceps"), Category: "Full Body", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Olympic lift from floor to overhead in one motion."},
	{Name: "Thruster", MetValue: 8.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("quadriceps", "shoulders"), Category: "Full Body", ExerciseType: "strength", Equipment: "barbell", Difficulty: "intermediate", Description: "Front squat flowing into an overhead press."},
	{Name: "Turkish Get-up", MetValue: 5.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("core", "shoulders"), Category: "Full Body", ExerciseType: "strength", Equipment: "kettlebell", Difficulty: "advanced", Description: "Ground-to-stand sequence holding a weight overhead."},
	{Name: "Man Maker", MetValue: 8.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("chest", "back", "shoulders"), Category: "Full Body", ExerciseType: "strength", Equipment: "dumbbell", Difficulty: "advanced", Description: "Renegade row into a clean and press."},
	{Name: "Clean and Press", MetValue: 6.0, MuscleGroupPrimary: "full_body", MuscleGroupsSecondary: sec("shoulders", "back", "quadriceps"), Category: "Full Body", ExerciseType: "strength", Equipment: "barbell", Difficulty: "advanced", Description: "Pull from the floor to the shoulders, then press overhead."},
}

// SeedExerciseLibrary loads LibrarySeed into exercise_library. Idempotent, and
// ON CONFLICT (name) DO UPDATE SET met_value + parameter_schema so an existing
// library is backfilled with the current MET and Phase 12 schema on next startup.
func SeedExerciseLibrary(pool *pgxpool.Pool) error {
	ctx := context.Background()
	for _, e := range LibrarySeed {
		var schemaArg any // nil → NULL parameter_schema (strength/unparameterized)
		if sch, ok := ParamSchemas[e.Name]; ok {
			b, err := json.Marshal(sch)
			if err != nil {
				return err
			}
			schemaArg = string(b)
		}
		if _, err := pool.Exec(ctx, `
			INSERT INTO exercise_library
				(name, muscle_group_primary, muscle_groups_secondary, category, exercise_type, equipment, difficulty, description, met_value, parameter_schema)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
			ON CONFLICT (name) DO UPDATE SET
				met_value = EXCLUDED.met_value,
				parameter_schema = EXCLUDED.parameter_schema`,
			e.Name, e.MuscleGroupPrimary, e.MuscleGroupsSecondary, e.Category,
			e.ExerciseType, e.Equipment, e.Difficulty, e.Description, e.MetValue, schemaArg); err != nil {
			return err
		}
	}
	return nil
}
