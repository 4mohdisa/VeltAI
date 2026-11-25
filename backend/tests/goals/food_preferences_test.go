package goalstests

import (
	"net/http"
	"reflect"
	"testing"

	"lume/backend/internal/goals"
)

// PATCH /api/onboarding/preferences edits diet and cuisine from Profile. It
// writes only the preferences row: no onboarding rewrite, no saved_foods seed.
func TestPatchFoodPreferences(t *testing.T) {
	cases := []struct {
		name       string
		user       string
		body       map[string]any
		wantStatus int
		wantErr    string
		want       *goals.FoodPreferences
	}{
		{
			name:       "unauthenticated",
			user:       "",
			body:       map[string]any{"cuisines": []string{"western"}},
			wantStatus: http.StatusUnauthorized,
			wantErr:    "missing bearer token",
		},
		{
			name:       "valid update",
			user:       "user-a",
			body:       map[string]any{"cuisines": []string{"western", "east_asian"}, "dietary_requirements": []string{"vegan"}},
			wantStatus: http.StatusOK,
			want:       &goals.FoodPreferences{Cuisines: []string{"western", "east_asian"}, DietaryRequirements: []string{"vegan"}},
		},
		{
			name:       "cuisine only keeps the stored diet",
			user:       "user-a",
			body:       map[string]any{"cuisines": []string{"african"}},
			wantStatus: http.StatusOK,
			want:       &goals.FoodPreferences{Cuisines: []string{"african"}, DietaryRequirements: []string{"halal"}},
		},
		{
			name:       "unknown cuisine rejected",
			user:       "user-a",
			body:       map[string]any{"cuisines": []string{"martian"}},
			wantStatus: http.StatusBadRequest,
			wantErr:    "unknown cuisine: martian",
		},
		{
			name:       "unknown diet rejected",
			user:       "user-a",
			body:       map[string]any{"dietary_requirements": []string{"carnivore"}},
			wantStatus: http.StatusBadRequest,
			wantErr:    "unknown dietary requirement: carnivore",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			mux, f := newMux()
			f.cuisinePrefs["user-a"] = cuisinePrefRow{Cuisines: []string{"south_asian"}, DietaryRequirements: []string{"halal"}}

			rr := do(t, mux, http.MethodPatch, "/api/onboarding/preferences", tc.user, tc.body)

			if rr.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body %s)", rr.Code, tc.wantStatus, rr.Body.String())
			}
			if tc.wantErr != "" {
				if got := errMsg(t, rr); got != tc.wantErr {
					t.Fatalf("error = %q, want %q", got, tc.wantErr)
				}
				if got := f.cuisinePrefs["user-a"].Cuisines; !reflect.DeepEqual(got, []string{"south_asian"}) {
					t.Fatalf("a rejected request changed the stored cuisines to %v", got)
				}
				return
			}
			got := decodeData[goals.FoodPreferences](t, rr)
			if !reflect.DeepEqual(&got, tc.want) {
				t.Fatalf("response = %+v, want %+v", got, *tc.want)
			}
			if len(f.savedFoods["user-a"]) != 0 || f.ob["user-a"] != nil {
				t.Fatal("PATCH must not seed saved foods or write the onboarding row")
			}
		})
	}
}

func TestPatchFoodPreferencesIsScopedToTheCaller(t *testing.T) {
	mux, f := newMux()
	f.cuisinePrefs["user-a"] = cuisinePrefRow{Cuisines: []string{"south_asian"}, DietaryRequirements: []string{"halal"}}

	rr := do(t, mux, http.MethodPatch, "/api/onboarding/preferences", "user-b",
		map[string]any{"cuisines": []string{"western"}, "dietary_requirements": []string{"vegan"}})
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}

	a := f.cuisinePrefs["user-a"]
	if !reflect.DeepEqual(a.Cuisines, []string{"south_asian"}) || !reflect.DeepEqual(a.DietaryRequirements, []string{"halal"}) {
		t.Fatalf("user B changed user A's row: %+v", a)
	}
	if b := f.cuisinePrefs["user-b"]; !reflect.DeepEqual(b.Cuisines, []string{"western"}) {
		t.Fatalf("user B's own row = %+v", b)
	}
}

func TestGetFoodPreferences(t *testing.T) {
	cases := []struct {
		name       string
		user       string
		wantStatus int
		want       goals.FoodPreferences
	}{
		{name: "unauthenticated", user: "", wantStatus: http.StatusUnauthorized},
		{name: "stored row", user: "user-a", wantStatus: http.StatusOK,
			want: goals.FoodPreferences{Cuisines: []string{"south_asian"}, DietaryRequirements: []string{"halal"}}},
		{name: "no row yet is empty, not an error", user: "user-b", wantStatus: http.StatusOK,
			want: goals.FoodPreferences{Cuisines: []string{}, DietaryRequirements: []string{}}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			mux, f := newMux()
			f.cuisinePrefs["user-a"] = cuisinePrefRow{Cuisines: []string{"south_asian"}, DietaryRequirements: []string{"halal"}}

			rr := do(t, mux, http.MethodGet, "/api/onboarding/preferences", tc.user, nil)

			if rr.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rr.Code, tc.wantStatus)
			}
			if tc.wantStatus != http.StatusOK {
				return
			}
			if got := decodeData[goals.FoodPreferences](t, rr); !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("response = %+v, want %+v", got, tc.want)
			}
		})
	}
}
