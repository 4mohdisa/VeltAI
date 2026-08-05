// In-package test: priorWeight, buildCuisinePriorBrain, applyBayesianPrior
// and parseHourString are unexported (they're internal blending mechanics,
// not part of the package's public surface), so they can only be unit
// tested from here.
package ai

import (
	"math"
	"reflect"
	"testing"

	"lume/backend/internal/cuisine"
)

func fp(v float64) *float64 { return &v }

func TestPriorWeightThresholds(t *testing.T) {
	cases := []struct {
		days int
		want float64
	}{
		{0, 0.8}, {1, 0.8}, {6, 0.8},
		{7, 0.5}, {10, 0.5}, {13, 0.5},
		{14, 0.0}, {30, 0.0}, {365, 0.0},
	}
	for _, c := range cases {
		if got := priorWeight(c.days); got != c.want {
			t.Errorf("priorWeight(%d) = %v, want %v", c.days, got, c.want)
		}
	}
}

func TestParseHourString(t *testing.T) {
	cases := map[string]float64{
		"21:00": 21.0,
		"18:30": 18.5,
		"09:05": 9 + 5.0/60,
	}
	for in, want := range cases {
		if got := parseHourString(in); math.Abs(got-want) > 1e-9 {
			t.Errorf("parseHourString(%q) = %v, want %v", in, got, want)
		}
	}
	for _, bad := range []string{"", "garbage", "21"} {
		if got := parseHourString(bad); got != 0 {
			t.Errorf("parseHourString(%q) = %v, want 0", bad, got)
		}
	}
}

func TestBuildCuisinePriorBrain(t *testing.T) {
	priors := cuisine.CuisinePrior{
		TypicalCarbSource:  "rice_and_bread",
		TypicalFatSource:   "ghee_and_oil",
		ExpectedDinnerTime: "21:00",
		JunkFoodKeywords:   []string{"samosa", "jalebi"},
	}
	goal := &GoalRow{CalorieTarget: fp(2000), ProteinTarget: fp(150), CarbTarget: fp(200), FatTarget: fp(70), FibreTarget: fp(30)}

	b := buildCuisinePriorBrain(priors, goal)
	if b.TypicalDailyCalories != 2000 {
		t.Errorf("calories = %v, want 2000", b.TypicalDailyCalories)
	}
	wantMacros := Macros{Protein: 150, Carbs: 200, Fat: 70, Fibre: 30}
	if b.TypicalMacros != wantMacros {
		t.Errorf("macros = %+v, want %+v", b.TypicalMacros, wantMacros)
	}
	if b.MealTimingPatterns.ExpectedDinnerHour != 21.0 {
		t.Errorf("expected_dinner_hour = %v, want 21.0", b.MealTimingPatterns.ExpectedDinnerHour)
	}
	if b.JunkFoodFrequency.Count != 0 || b.JunkFoodFrequency.PerWeek != 0 {
		t.Errorf("junk frequency = %+v, want zero count/per_week", b.JunkFoodFrequency)
	}
	if len(b.JunkFoodFrequency.Keywords) != 2 {
		t.Errorf("junk keywords = %v, want the 2 prior keywords", b.JunkFoodFrequency.Keywords)
	}
	if b.EatingPatterns.CarbSource != "rice_and_bread" || b.EatingPatterns.FatSource != "ghee_and_oil" {
		t.Errorf("eating patterns sources = %+v", b.EatingPatterns)
	}
	if b.GoalAdherenceScore != 0 || !reflect.DeepEqual(b.GymPatterns, GymPatterns{}) {
		t.Error("goal_adherence_score and gym_patterns must stay zero-valued")
	}

	// Nil goal must not panic and must yield zero calories/macros.
	b2 := buildCuisinePriorBrain(priors, nil)
	if b2.TypicalDailyCalories != 0 || b2.TypicalMacros != (Macros{}) {
		t.Errorf("nil goal: calories/macros = %v/%+v, want 0/zero", b2.TypicalDailyCalories, b2.TypicalMacros)
	}
}

func TestApplyBayesianPrior(t *testing.T) {
	priors := cuisine.CuisinePrior{
		TypicalCarbSource:  "bread",
		TypicalFatSource:   "olive_oil",
		ExpectedDinnerTime: "20:00",
		JunkFoodKeywords:   []string{"cake"},
	}
	goal := &GoalRow{CalorieTarget: fp(1800), ProteinTarget: fp(120), CarbTarget: fp(180), FatTarget: fp(60), FibreTarget: fp(25)}
	computed := Brain{
		TypicalDailyCalories: 1500,
		TypicalMacros:        Macros{Protein: 100, Carbs: 150, Fat: 50, Fibre: 20},
		JunkFoodFrequency:    JunkFood{Count: 3, PerWeek: 1.0},
		GoalAdherenceScore:   55,
	}
	origComputed := computed // shallow copy to assert non-mutation afterward

	approxEq := func(t *testing.T, name string, got, want float64) {
		t.Helper()
		if math.Abs(got-want) > 1e-9 {
			t.Errorf("%s = %v, want %v", name, got, want)
		}
	}

	// < 7 days -> weight 0.8.
	blended := applyBayesianPrior(computed, priors, goal, 5)
	approxEq(t, "calories@0.8", blended.TypicalDailyCalories, 0.8*1800+0.2*1500)
	approxEq(t, "protein@0.8", blended.TypicalMacros.Protein, 0.8*120+0.2*100)
	approxEq(t, "carbs@0.8", blended.TypicalMacros.Carbs, 0.8*180+0.2*150)
	approxEq(t, "fat@0.8", blended.TypicalMacros.Fat, 0.8*60+0.2*50)
	approxEq(t, "fibre@0.8", blended.TypicalMacros.Fibre, 0.8*25+0.2*20)
	approxEq(t, "dinner_hour@0.8", blended.MealTimingPatterns.ExpectedDinnerHour, 0.8*20.0+0.2*0)
	approxEq(t, "junk_per_week@0.8", blended.JunkFoodFrequency.PerWeek, 0.8*0+0.2*1.0)
	if len(blended.JunkFoodFrequency.Keywords) != 1 || blended.JunkFoodFrequency.Keywords[0] != "cake" {
		t.Errorf("keywords@0.8 = %v, want fallback to prior [cake]", blended.JunkFoodFrequency.Keywords)
	}
	if blended.EatingPatterns.CarbSource != "bread" || blended.EatingPatterns.FatSource != "olive_oil" {
		t.Errorf("sources@0.8 = %+v, want fallback to prior", blended.EatingPatterns)
	}
	if blended.GoalAdherenceScore != 55 {
		t.Errorf("goal_adherence_score must stay unblended, got %v", blended.GoalAdherenceScore)
	}

	// 7-13 days -> weight 0.5.
	blended = applyBayesianPrior(computed, priors, goal, 10)
	approxEq(t, "calories@0.5", blended.TypicalDailyCalories, 0.5*1800+0.5*1500)
	approxEq(t, "protein@0.5", blended.TypicalMacros.Protein, 0.5*120+0.5*100)

	// >= 14 days -> weight 0, blended equals computed exactly (same value).
	blended = applyBayesianPrior(computed, priors, goal, 14)
	if !reflect.DeepEqual(blended, computed) {
		t.Errorf("blended@weight0 = %+v, want exactly computed %+v", blended, computed)
	}

	if !reflect.DeepEqual(computed, origComputed) {
		t.Error("applyBayesianPrior must not mutate its computed input")
	}
}
