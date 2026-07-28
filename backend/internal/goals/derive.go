package goals

import "math"

// DeriveInput are the onboarding answers the derivation runs on. Height/weight
// arrive in the user's units; "in" and "lb" are converted, anything else is
// treated as cm/kg.
type DeriveInput struct {
	Age           int
	Sex           string
	Height        float64
	HeightUnit    string
	Weight        float64
	WeightUnit    string
	ActivityLevel string
	Goal          string
}

type DerivedGoals struct {
	Calories int
	Protein  int
	Carbs    int
	Fat      int
	Fibre    int
}

var activityFactors = map[string]float64{
	"sedentary":   1.2,
	"light":       1.375,
	"moderate":    1.55,
	"active":      1.725,
	"very_active": 1.9,
}

// DeriveGoals mirrors src/lib/goals/derive.ts exactly: Mifflin–St Jeor BMR,
// activity factor, goal adjustment, macro split. Frozen formula — keep in sync
// with the app.
func DeriveGoals(in DeriveInput) DerivedGoals {
	heightCm := in.Height
	if in.HeightUnit == "in" {
		heightCm *= 2.54
	}
	weightKg := in.Weight
	if in.WeightUnit == "lb" {
		weightKg *= 0.453592
	}

	bmr := 10*weightKg + 6.25*heightCm - 5*float64(in.Age)
	switch in.Sex {
	case "male":
		bmr += 5
	case "female":
		bmr -= 161
	default:
		bmr -= 78
	}

	factor, ok := activityFactors[in.ActivityLevel]
	if !ok {
		factor = 1.2 // ponytail: unknown level treated as sedentary
	}
	tdee := bmr * factor

	var adj float64
	switch in.Goal {
	case "lose":
		adj = -400
	case "muscle":
		adj = 250
	}

	calories := math.Max(calorieTargetMin, math.Round((tdee+adj)/10)*10)
	perKg := 1.8
	if in.Goal == "muscle" {
		perKg = 2.0
	}
	protein := math.Round(weightKg * perKg)
	fat := math.Round(calories * 0.25 / 9)
	carbs := math.Max(0, math.Round((calories-protein*4-fat*9)/4))
	fibre := math.Max(25, math.Round(calories/1000*14))

	return DerivedGoals{
		Calories: int(calories),
		Protein:  int(protein),
		Carbs:    int(carbs),
		Fat:      int(fat),
		Fibre:    int(fibre),
	}
}
