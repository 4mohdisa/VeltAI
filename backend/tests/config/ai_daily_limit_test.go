// LUME_AI_DAILY_LIMIT (PHASE4_ROWS.md row 5): unset is the default of 20, 0
// turns the cap off, and a value that is not a whole number of 0 or more
// stops startup through Validate.
package configtests

import (
	"testing"

	"lume/backend/internal/config"
)

func TestAIDailyLimit(t *testing.T) {
	cases := []struct {
		value     string
		want      int
		wantFatal bool
	}{
		{"", config.DefaultAIDailyLimit, false},
		{"5", 5, false},
		{" 7 ", 7, false},
		{"0", 0, false},
		{"-1", 0, true},
		{"ten", 0, true},
		{"2.5", 0, true},
	}
	for _, tc := range cases {
		t.Run(tc.value, func(t *testing.T) {
			prodEnv(t)
			t.Setenv("LUMO_AI_DAILY_LIMIT", "")
			t.Setenv("LUME_AI_DAILY_LIMIT", tc.value)

			got, err := config.AIDailyLimit()
			if (err != nil) != tc.wantFatal || got != tc.want {
				t.Fatalf("AIDailyLimit() = %d, %v; want %d, error %v", got, err, tc.want, tc.wantFatal)
			}
			fatal, _ := config.Validate()
			if containsSubstr(fatal, "LUME_AI_DAILY_LIMIT") != tc.wantFatal {
				t.Errorf("Validate fatal = %v, want a LUME_AI_DAILY_LIMIT refusal: %v", fatal, tc.wantFatal)
			}
		})
	}
	if config.DefaultAIDailyLimit != 20 {
		t.Errorf("default = %d, want 20", config.DefaultAIDailyLimit)
	}
}
