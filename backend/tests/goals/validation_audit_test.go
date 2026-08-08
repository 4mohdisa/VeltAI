package goalstests

// Regression tests for the 2026-08-06 audit's trust-boundary fixes. Pre-audit:
// PUT /api/goals accepted protein_target=-400; the manual calorie floor was a
// flat 1200 regardless of sex (males could persist a target below the app's
// own claimed 1500 minimum); POST /api/body-weight took weight=1e15 in unit
// "parsecs"; and the server accepted any positive age, making the client's
// 13+ gate decorative.

import (
	"net/http"
	"testing"
)

func onboardMale(t *testing.T, mux *http.ServeMux, user string) {
	t.Helper()
	rr := do(t, mux, "POST", "/api/onboarding", user, map[string]any{
		"age": 30, "sex": "male", "height": 180, "weight": 80,
		"activity_level": "moderate", "goal": "health",
	})
	if rr.Code != http.StatusOK {
		t.Fatalf("onboarding: %d %s", rr.Code, rr.Body.String())
	}
}

func TestPutGoalsRejectsNegativeMacroTargets(t *testing.T) {
	mux, _ := newMux()
	onboardMale(t, mux, "user_v1")
	rr := do(t, mux, "PUT", "/api/goals", "user_v1", map[string]any{"protein_target": -400})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("protein_target=-400: got %d, want 400; body %s", rr.Code, rr.Body.String())
	}
	rr = do(t, mux, "PUT", "/api/goals", "user_v1", map[string]any{"carb_target": 1e10})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("carb_target=1e10: got %d, want 400", rr.Code)
	}
}

func TestPutGoalsManualCalorieFloorIsSexAware(t *testing.T) {
	mux, _ := newMux()
	onboardMale(t, mux, "user_v2")
	// 1200 is below the male floor (1500) — the pre-audit flat floor let it in.
	rr := do(t, mux, "PUT", "/api/goals", "user_v2", map[string]any{"calorie_target": 1200})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("male + calorie_target=1200: got %d, want 400 (floor 1500); body %s", rr.Code, rr.Body.String())
	}
	rr = do(t, mux, "PUT", "/api/goals", "user_v2", map[string]any{"calorie_target": 1500})
	if rr.Code != http.StatusOK {
		t.Fatalf("male + calorie_target=1500: got %d, want 200; body %s", rr.Code, rr.Body.String())
	}
}

func TestBodyWeightRejectsAbsurdValuesAndUnits(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/body-weight", "user_v3", map[string]any{
		"date": "2026-03-03", "weight": 1e15,
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("weight=1e15: got %d, want 400", rr.Code)
	}
	rr = do(t, mux, "POST", "/api/body-weight", "user_v3", map[string]any{
		"date": "2026-03-03", "weight": 80, "unit": "parsecs",
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("unit=parsecs: got %d, want 400", rr.Code)
	}
}

func TestOnboardingRejectsUnderThirteen(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_v4", map[string]any{
		"age": 9, "sex": "male", "height": 140, "weight": 40,
		"activity_level": "moderate", "goal": "health",
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("age=9: got %d, want 400 — the client's 13+ gate was the only gate", rr.Code)
	}
}

// Height and weight became REQUIRED and BOUNDED on 2026-08-08. The server must
// reject implausible body measurements rather than let them through to
// Mifflin–St Jeor: nothing in the derivation path may substitute or accept a
// value that is not a real human measurement.
func TestOnboardingRejectsImplausibleBodyMeasurements(t *testing.T) {
	base := func() map[string]any {
		return map[string]any{
			"age": 30, "sex": "male", "height": 180.0, "weight": 80.0,
			"activity_level": "moderate", "goal": "health",
		}
	}
	cases := []struct {
		name  string
		field string
		value any
	}{
		{"height far too small", "height", 30.0},
		{"height below the band", "height", 99.0},
		{"height above the band", "height", 251.0},
		{"weight below the band", "weight", 29.0},
		{"weight above the band", "weight", 301.0},
		{"weight absurd", "weight", 100000.0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			mux, _ := newMux()
			body := base()
			body[c.field] = c.value
			rr := do(t, mux, "POST", "/api/onboarding", "user_bounds", body)
			if rr.Code != http.StatusBadRequest {
				t.Fatalf("%s = %v: got %d, want 400; body %s", c.field, c.value, rr.Code, rr.Body.String())
			}
		})
	}
}

func TestOnboardingAcceptsTheBandEdges(t *testing.T) {
	for _, c := range []struct {
		name           string
		height, weight float64
	}{
		{"low edges", 100, 30},
		{"high edges", 250, 300},
	} {
		t.Run(c.name, func(t *testing.T) {
			mux, _ := newMux()
			rr := do(t, mux, "POST", "/api/onboarding", "user_edge", map[string]any{
				"age": 30, "sex": "male", "height": c.height, "weight": c.weight,
				"activity_level": "moderate", "goal": "health",
			})
			if rr.Code != http.StatusOK {
				t.Fatalf("height=%v weight=%v: got %d, want 200; body %s", c.height, c.weight, rr.Code, rr.Body.String())
			}
		})
	}
}

// Imperial input is bounded AFTER conversion — a caller sending inches must
// not sneak past a centimetre bound.
func TestOnboardingBoundsApplyAfterUnitConversion(t *testing.T) {
	mux, _ := newMux()
	rr := do(t, mux, "POST", "/api/onboarding", "user_units", map[string]any{
		"age": 30, "sex": "male", "height": 30.0, "height_unit": "in", // 76 cm — too short
		"weight": 80.0, "activity_level": "moderate", "goal": "health",
	})
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("30in (76cm): got %d, want 400; body %s", rr.Code, rr.Body.String())
	}
}
