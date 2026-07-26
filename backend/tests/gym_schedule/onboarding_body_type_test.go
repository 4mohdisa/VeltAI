package gymscheduletests

import (
	"context"
	"net/http"
	"testing"

	"lumo/backend/internal/goals"
)

// fakeGoals is a minimal goals.Store: only onboarding persistence matters here,
// the rest are stubs. body_type flows through CompleteOnboarding.
type fakeGoals struct{ ob map[string]*goals.Onboarding }

func newFakeGoals() *fakeGoals { return &fakeGoals{ob: map[string]*goals.Onboarding{}} }

func (f *fakeGoals) GetOnboarding(_ context.Context, uid string) (*goals.Onboarding, error) {
	return f.ob[uid], nil
}

func (f *fakeGoals) CompleteOnboarding(_ context.Context, in goals.OnboardingCompletion) (*goals.Onboarding, *goals.Goals, error) {
	ob := &goals.Onboarding{ID: "ob_" + in.UserID, UserID: in.UserID, Completed: true}
	if in.BodyType != "" {
		bt := in.BodyType
		ob.BodyType = &bt
	}
	f.ob[in.UserID] = ob
	return ob, &goals.Goals{}, nil
}

func (f *fakeGoals) GetGoals(context.Context, string) (*goals.Goals, error) { return nil, nil }
func (f *fakeGoals) UpsertGoals(_ context.Context, g *goals.Goals) (*goals.Goals, error) {
	return g, nil
}
func (f *fakeGoals) ListBodyWeight(context.Context, string) ([]goals.BodyWeight, error) {
	return nil, nil
}
func (f *fakeGoals) CreateBodyWeight(_ context.Context, bw *goals.BodyWeight) (*goals.BodyWeight, error) {
	return bw, nil
}
func (f *fakeGoals) GetBodyWeight(context.Context, string) (*goals.BodyWeight, error) {
	return nil, nil
}
func (f *fakeGoals) DeleteBodyWeight(context.Context, string) error { return nil }

func goalsMux(f *fakeGoals) *http.ServeMux {
	mux := http.NewServeMux()
	goals.Register(mux, f)
	return mux
}

// onboardingResp captures the wrapped POST /api/onboarding response.
type onboardingResp struct {
	Completed              bool    `json:"completed"`
	BodyType               *string `json:"body_type"`
	BodyTypeGoalSuggestion string  `json:"body_type_goal_suggestion"`
}

func baseBody(extra map[string]any) map[string]any {
	b := map[string]any{"age": 30, "sex": "male", "height": 180, "weight": 80, "activity_level": "moderate", "goal": "health"}
	for k, v := range extra {
		b[k] = v
	}
	return b
}

func TestOnboardingBodyTypeSaved(t *testing.T) {
	f := newFakeGoals()
	mux := goalsMux(f)

	resp := decode[onboardingResp](t, do(t, mux, "u1", "POST", "/api/onboarding", baseBody(map[string]any{"body_type": "skinny"})))
	if resp.BodyType == nil || *resp.BodyType != "skinny" {
		t.Fatalf("response body_type = %v, want skinny", resp.BodyType)
	}
	if f.ob["u1"].BodyType == nil || *f.ob["u1"].BodyType != "skinny" {
		t.Fatalf("persisted body_type = %v, want skinny", f.ob["u1"].BodyType)
	}
}

func TestOnboardingBodyTypeGoalSuggestion(t *testing.T) {
	cases := map[string]string{
		"skinny":     "Build muscle",
		"skinny_fat": "Body recomp",
		"average":    "Eat healthier",
		"overweight": "Lose weight",
		"muscular":   "Track nutrition",
	}
	for bt, wantSuggestion := range cases {
		mux := goalsMux(newFakeGoals())
		resp := decode[onboardingResp](t, do(t, mux, "u1", "POST", "/api/onboarding", baseBody(map[string]any{"body_type": bt})))
		if resp.BodyTypeGoalSuggestion != wantSuggestion {
			t.Errorf("body_type %q -> suggestion %q, want %q", bt, resp.BodyTypeGoalSuggestion, wantSuggestion)
		}
	}
}

func TestOnboardingBodyTypeInvalid(t *testing.T) {
	mux := goalsMux(newFakeGoals())
	want(t, do(t, mux, "u1", "POST", "/api/onboarding", baseBody(map[string]any{"body_type": "chunky"})), http.StatusBadRequest)
}

func TestOnboardingBodyTypeMissingOK(t *testing.T) {
	f := newFakeGoals()
	mux := goalsMux(f)
	resp := decode[onboardingResp](t, do(t, mux, "u1", "POST", "/api/onboarding", baseBody(nil)))
	if !resp.Completed {
		t.Fatalf("onboarding not completed: %+v", resp)
	}
	if resp.BodyTypeGoalSuggestion != "" {
		t.Errorf("suggestion = %q, want empty when no body_type", resp.BodyTypeGoalSuggestion)
	}
	if f.ob["u1"].BodyType != nil {
		t.Errorf("persisted body_type = %v, want nil", f.ob["u1"].BodyType)
	}
}
