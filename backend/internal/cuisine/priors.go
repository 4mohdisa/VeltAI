// Package cuisine holds cuisine-aware priors and a seed food library used to
// bias AI estimation (portion sizes, meal timing, junk-food detection) toward
// what a user's selected cuisines actually look like.
package cuisine

import (
	"fmt"
	"math"
	"strings"
)

// CuisinePrior captures the shape of a cuisine's typical eating pattern.
type CuisinePrior struct {
	TypicalCarbSource  string
	TypicalFatSource   string
	ExpectedDinnerTime string // "HH:MM" 24h
	TypicalMealCount   int
	RicePortionPriorG  float64
	JunkFoodKeywords   []string
	CommonMealPatterns []string
	DensityOverrides   map[string]float64 // food -> g/cm3, informational for now (no consumer yet)
}

var CuisinePriors = map[string]CuisinePrior{
	"south_asian": {
		TypicalCarbSource:  "rice_and_bread",
		TypicalFatSource:   "ghee_and_oil",
		ExpectedDinnerTime: "21:00",
		TypicalMealCount:   3,
		RicePortionPriorG:  300,
		JunkFoodKeywords:   []string{"samosa", "jalebi", "pakora", "halwa", "gulab jamun", "ladoo", "kachori"},
		CommonMealPatterns: []string{"rice", "dal", "curry", "roti", "naan", "biryani", "paneer", "tandoori"},
		DensityOverrides:   map[string]float64{"rice": 0.92, "ghee": 0.91},
	},
	"east_asian": {
		TypicalCarbSource:  "rice_and_noodles",
		TypicalFatSource:   "vegetable_oil",
		ExpectedDinnerTime: "19:00",
		TypicalMealCount:   3,
		RicePortionPriorG:  200,
		JunkFoodKeywords:   []string{"bubble tea", "karaage", "tempura", "mochi", "pocky", "shrimp chips"},
		CommonMealPatterns: []string{"rice", "noodles", "stir fry", "dumpling", "sushi", "ramen", "curry", "tofu"},
		DensityOverrides:   map[string]float64{"rice": 0.92, "tofu": 1.0},
	},
	"southeast_asian": {
		TypicalCarbSource:  "rice_and_noodles",
		TypicalFatSource:   "coconut_oil",
		ExpectedDinnerTime: "19:30",
		TypicalMealCount:   3,
		RicePortionPriorG:  250,
		JunkFoodKeywords:   []string{"fried banana", "kuih", "crispy pork", "prawn crackers", "fried spring roll", "coconut candy"},
		CommonMealPatterns: []string{"rice", "noodles", "curry", "satay", "spring roll", "pad thai", "laksa"},
		DensityOverrides:   map[string]float64{"rice": 0.92, "coconut_milk": 0.97},
	},
	"middle_eastern": {
		TypicalCarbSource:  "rice_and_bread",
		TypicalFatSource:   "olive_oil",
		ExpectedDinnerTime: "20:30",
		TypicalMealCount:   3,
		RicePortionPriorG:  200,
		JunkFoodKeywords:   []string{"baklava", "kanafeh", "fried falafel", "maamoul", "qatayef", "halva"},
		CommonMealPatterns: []string{"hummus", "falafel", "shawarma", "pita", "tabbouleh", "kebab", "rice", "lentil soup"},
		DensityOverrides:   map[string]float64{"rice": 0.92, "couscous": 0.6},
	},
	"mediterranean": {
		TypicalCarbSource:  "bread_and_pasta",
		TypicalFatSource:   "olive_oil",
		ExpectedDinnerTime: "21:00",
		TypicalMealCount:   3,
		RicePortionPriorG:  150,
		JunkFoodKeywords:   []string{"baklava", "fried calamari", "gelato", "cannoli", "loukoumades"},
		CommonMealPatterns: []string{"olive oil", "salad", "grilled fish", "pasta", "hummus", "pita", "feta"},
		DensityOverrides:   map[string]float64{"couscous": 0.6, "olive_oil": 0.92},
	},
	"western": {
		TypicalCarbSource:  "bread_and_potatoes",
		TypicalFatSource:   "butter_and_vegetable_oil",
		ExpectedDinnerTime: "18:30",
		TypicalMealCount:   3,
		RicePortionPriorG:  150,
		JunkFoodKeywords:   []string{"burger", "pizza", "fries", "soda", "donut", "candy", "chips", "milkshake"},
		CommonMealPatterns: []string{"sandwich", "salad", "steak", "pasta", "roast", "casserole", "burger"},
		DensityOverrides:   map[string]float64{},
	},
	"african": {
		TypicalCarbSource:  "rice_and_grains",
		TypicalFatSource:   "palm_and_vegetable_oil",
		ExpectedDinnerTime: "19:30",
		TypicalMealCount:   3,
		RicePortionPriorG:  250,
		JunkFoodKeywords:   []string{"fried plantain", "chin chin", "puff puff", "kelewele", "meat pie"},
		CommonMealPatterns: []string{"stew", "rice", "injera", "fufu", "jollof", "tagine", "peanut soup"},
		DensityOverrides:   map[string]float64{"rice": 0.92, "palm_oil": 0.9},
	},
	"latin_american": {
		TypicalCarbSource:  "rice_and_corn",
		TypicalFatSource:   "vegetable_oil",
		ExpectedDinnerTime: "20:30",
		TypicalMealCount:   3,
		RicePortionPriorG:  200,
		JunkFoodKeywords:   []string{"churros", "fried plantain", "tres leches", "dulce de leche", "fried yuca"},
		CommonMealPatterns: []string{"taco", "burrito", "rice and beans", "empanada", "arepa", "ceviche", "tamale"},
		DensityOverrides:   map[string]float64{"rice": 0.92, "beans": 1.0},
	},
}

// defaultPrior is returned when zero or only unrecognized cuisines are given.
var defaultPrior = CuisinePrior{
	TypicalCarbSource:  "rice_and_bread",
	TypicalFatSource:   "mixed_oils",
	ExpectedDinnerTime: "19:00",
	TypicalMealCount:   3,
	RicePortionPriorG:  200,
	JunkFoodKeywords:   []string{"candy", "chips", "soda", "cake", "cookie"},
	CommonMealPatterns: nil,
	DensityOverrides:   map[string]float64{},
}

func minutesSinceMidnight(hhmm string) int {
	var h, m int
	fmt.Sscanf(hhmm, "%d:%d", &h, &m)
	return h*60 + m
}

func formatHHMM(mins int) string {
	return fmt.Sprintf("%02d:%02d", mins/60, mins%60)
}

// MergePriors blends the priors of a user's selected cuisines. Unknown
// cuisine strings are skipped silently; if that leaves nothing recognized,
// defaultPrior is returned.
func MergePriors(cuisines []string) CuisinePrior {
	var known []string
	for _, c := range cuisines {
		if _, ok := CuisinePriors[c]; ok {
			known = append(known, c)
		}
	}
	if len(known) == 0 {
		return defaultPrior
	}

	merged := CuisinePrior{
		// ponytail: carb/fat source take the first selected cuisine rather than
		// a real blend ("rice_and_bread + bread_and_pasta" isn't a meaningful
		// value) — documented simplification, revisit if a real blend matters.
		TypicalCarbSource: CuisinePriors[known[0]].TypicalCarbSource,
		TypicalFatSource:  CuisinePriors[known[0]].TypicalFatSource,
		DensityOverrides:  map[string]float64{},
	}

	var mealCountSum, riceSum float64
	maxDinnerMins := -1
	seenJunk := map[string]bool{}
	seenPatterns := map[string]bool{}
	densityValues := map[string][]float64{}

	for _, c := range known {
		p := CuisinePriors[c]
		mealCountSum += float64(p.TypicalMealCount)
		riceSum += p.RicePortionPriorG
		if mins := minutesSinceMidnight(p.ExpectedDinnerTime); mins > maxDinnerMins {
			maxDinnerMins = mins
		}
		for _, j := range p.JunkFoodKeywords {
			key := strings.ToLower(j)
			if !seenJunk[key] {
				seenJunk[key] = true
				merged.JunkFoodKeywords = append(merged.JunkFoodKeywords, j)
			}
		}
		for _, pat := range p.CommonMealPatterns {
			key := strings.ToLower(pat)
			if !seenPatterns[key] {
				seenPatterns[key] = true
				merged.CommonMealPatterns = append(merged.CommonMealPatterns, pat)
			}
		}
		for k, v := range p.DensityOverrides {
			densityValues[k] = append(densityValues[k], v)
		}
	}

	n := float64(len(known))
	merged.TypicalMealCount = int(math.Floor(mealCountSum/n + 0.5)) // round-half-up
	merged.RicePortionPriorG = riceSum / n
	merged.ExpectedDinnerTime = formatHHMM(maxDinnerMins)
	for k, vals := range densityValues {
		sum := 0.0
		for _, v := range vals {
			sum += v
		}
		merged.DensityOverrides[k] = sum / float64(len(vals))
	}

	return merged
}
