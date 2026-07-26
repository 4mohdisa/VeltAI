package cuisine

import (
	"context"

	"lumo/backend/internal/db"
)

// Food is a reference nutrition entry, per 100g for calories/macros.
type Food struct {
	Cuisine      string
	FoodName     string
	Brand        *string
	Calories     float64 // per 100g for virtually everything, keep it simple
	Protein      float64
	Carbs        float64
	Fat          float64
	Fibre        float64
	ServingSize  float64
	ServingUnit  string
	IsVegetarian bool
	IsVegan      bool
	IsHalal      bool
	IsGlutenFree bool
	Tags         []string
}

// Library is seed reference data per cuisine, at least 15 foods each, built
// from well-known nutrition reference values (per 100g). Reasonable and
// defensible, not medical-grade precision.
var Library = map[string][]Food{
	"south_asian": {
		{Cuisine: "south_asian", FoodName: "White rice, cooked", Calories: 130, Protein: 2.7, Carbs: 28, Fat: 0.3, Fibre: 0.4, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "staple"}},
		{Cuisine: "south_asian", FoodName: "Roti / chapati", Calories: 120, Protein: 3.1, Carbs: 18, Fat: 3.7, Fibre: 2, ServingSize: 40, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"bread", "wheat"}},
		{Cuisine: "south_asian", FoodName: "Naan", Calories: 310, Protein: 9, Carbs: 50, Fat: 8, Fibre: 2, ServingSize: 90, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"bread", "wheat"}},
		{Cuisine: "south_asian", FoodName: "Dal (lentil curry)", Calories: 116, Protein: 9, Carbs: 20, Fat: 0.4, Fibre: 8, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"lentil", "curry"}},
		{Cuisine: "south_asian", FoodName: "Chicken curry", Calories: 180, Protein: 15, Carbs: 6, Fat: 11, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "chicken"}},
		{Cuisine: "south_asian", FoodName: "Paneer", Calories: 265, Protein: 18, Carbs: 1.2, Fat: 21, Fibre: 0, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"dairy", "paneer"}},
		{Cuisine: "south_asian", FoodName: "Paneer tikka masala", Calories: 220, Protein: 12, Carbs: 8, Fat: 15, Fibre: 1, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "paneer", "tandoori"}},
		{Cuisine: "south_asian", FoodName: "Chicken biryani", Calories: 180, Protein: 8, Carbs: 22, Fat: 6, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "biryani"}},
		{Cuisine: "south_asian", FoodName: "Vegetable biryani", Calories: 150, Protein: 3, Carbs: 25, Fat: 4, Fibre: 2, ServingSize: 300, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "biryani"}},
		{Cuisine: "south_asian", FoodName: "Tandoori chicken", Calories: 170, Protein: 25, Carbs: 3, Fat: 6, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"tandoori", "chicken"}},
		{Cuisine: "south_asian", FoodName: "Samosa", Calories: 260, Protein: 5, Carbs: 30, Fat: 13, Fibre: 3, ServingSize: 60, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"fried", "snack", "junk"}},
		{Cuisine: "south_asian", FoodName: "Chana masala", Calories: 164, Protein: 8, Carbs: 27, Fat: 3, Fibre: 7, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "legume"}},
		{Cuisine: "south_asian", FoodName: "Palak paneer", Calories: 180, Protein: 9, Carbs: 6, Fat: 14, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "paneer", "spinach"}},
		{Cuisine: "south_asian", FoodName: "Basmati pulao", Calories: 160, Protein: 3, Carbs: 30, Fat: 3, Fibre: 1, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice"}},
		{Cuisine: "south_asian", FoodName: "Butter chicken", Calories: 190, Protein: 14, Carbs: 6, Fat: 12, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "chicken"}},
		{Cuisine: "south_asian", FoodName: "Jalebi", Calories: 300, Protein: 2, Carbs: 50, Fat: 11, Fibre: 0, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "fried", "junk"}},
		{Cuisine: "south_asian", FoodName: "Gulab jamun", Calories: 330, Protein: 5, Carbs: 45, Fat: 15, Fibre: 0, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "fried", "junk"}},
	},
	"east_asian": {
		{Cuisine: "east_asian", FoodName: "White rice, cooked", Calories: 130, Protein: 2.7, Carbs: 28, Fat: 0.3, Fibre: 0.4, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice"}},
		{Cuisine: "east_asian", FoodName: "Egg fried rice", Calories: 170, Protein: 5, Carbs: 22, Fat: 6, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"rice", "stir fry"}},
		{Cuisine: "east_asian", FoodName: "Chow mein noodles", Calories: 138, Protein: 4.5, Carbs: 25, Fat: 2.3, Fibre: 1.5, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"noodles", "stir fry"}},
		{Cuisine: "east_asian", FoodName: "Pork ramen", Calories: 150, Protein: 7, Carbs: 20, Fat: 5, Fibre: 1, ServingSize: 400, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"noodles", "ramen", "soup", "pork"}},
		{Cuisine: "east_asian", FoodName: "Vegetable ramen", Calories: 90, Protein: 3, Carbs: 15, Fat: 2, Fibre: 1, ServingSize: 400, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"noodles", "ramen", "soup"}},
		{Cuisine: "east_asian", FoodName: "Chicken gyoza dumplings", Calories: 220, Protein: 10, Carbs: 24, Fat: 9, Fibre: 1, ServingSize: 100, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dumpling"}},
		{Cuisine: "east_asian", FoodName: "Vegetable dumplings", Calories: 180, Protein: 5, Carbs: 28, Fat: 5, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"dumpling"}},
		{Cuisine: "east_asian", FoodName: "Salmon nigiri sushi", Calories: 150, Protein: 6, Carbs: 20, Fat: 4, Fibre: 0.5, ServingSize: 100, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"sushi", "rice", "fish"}},
		{Cuisine: "east_asian", FoodName: "Vegetable maki roll", Calories: 130, Protein: 3, Carbs: 27, Fat: 1, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"sushi", "rice"}},
		{Cuisine: "east_asian", FoodName: "Beef stir fry", Calories: 180, Protein: 15, Carbs: 8, Fat: 10, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"stir fry", "beef"}},
		{Cuisine: "east_asian", FoodName: "Tofu stir fry", Calories: 90, Protein: 7, Carbs: 6, Fat: 5, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"stir fry", "tofu"}},
		{Cuisine: "east_asian", FoodName: "Plain tofu", Calories: 76, Protein: 8, Carbs: 1.9, Fat: 4.8, Fibre: 0.3, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"tofu"}},
		{Cuisine: "east_asian", FoodName: "Mapo tofu", Calories: 120, Protein: 8, Carbs: 5, Fat: 8, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"tofu", "curry", "pork"}},
		{Cuisine: "east_asian", FoodName: "Japanese curry rice", Calories: 130, Protein: 5, Carbs: 18, Fat: 4, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"curry", "rice"}},
		{Cuisine: "east_asian", FoodName: "Char siu pork", Calories: 270, Protein: 22, Carbs: 10, Fat: 15, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"pork"}},
		{Cuisine: "east_asian", FoodName: "Miso soup", Calories: 40, Protein: 3, Carbs: 4, Fat: 1.5, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"soup"}},
	},
	"southeast_asian": {
		{Cuisine: "southeast_asian", FoodName: "Jasmine rice, cooked", Calories: 130, Protein: 2.7, Carbs: 28, Fat: 0.3, Fibre: 0.4, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice"}},
		{Cuisine: "southeast_asian", FoodName: "Chicken pad thai", Calories: 180, Protein: 9, Carbs: 22, Fat: 6, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"noodles", "pad thai"}},
		{Cuisine: "southeast_asian", FoodName: "Vegetable pad thai", Calories: 150, Protein: 4, Carbs: 24, Fat: 5, Fibre: 2, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"noodles", "pad thai"}},
		{Cuisine: "southeast_asian", FoodName: "Chicken satay", Calories: 220, Protein: 24, Carbs: 4, Fat: 12, Fibre: 1, ServingSize: 100, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"satay", "chicken", "grilled"}},
		{Cuisine: "southeast_asian", FoodName: "Peanut sauce", Calories: 280, Protein: 10, Carbs: 14, Fat: 22, Fibre: 3, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"sauce", "peanut"}},
		{Cuisine: "southeast_asian", FoodName: "Green curry chicken", Calories: 140, Protein: 9, Carbs: 6, Fat: 9, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "coconut"}},
		{Cuisine: "southeast_asian", FoodName: "Vegetable green curry", Calories: 100, Protein: 2, Carbs: 7, Fat: 7, Fibre: 2, ServingSize: 300, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "coconut"}},
		{Cuisine: "southeast_asian", FoodName: "Laksa", Calories: 130, Protein: 6, Carbs: 15, Fat: 5, Fibre: 1, ServingSize: 400, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"noodles", "laksa", "soup"}},
		{Cuisine: "southeast_asian", FoodName: "Fried pork spring rolls", Calories: 220, Protein: 6, Carbs: 20, Fat: 13, Fibre: 1, ServingSize: 80, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"spring roll", "fried", "pork", "junk"}},
		{Cuisine: "southeast_asian", FoodName: "Fresh vegetable spring rolls", Calories: 90, Protein: 2, Carbs: 18, Fat: 1, Fibre: 1, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"spring roll", "fresh"}},
		{Cuisine: "southeast_asian", FoodName: "Beef rendang", Calories: 195, Protein: 18, Carbs: 5, Fat: 12, Fibre: 1, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"curry", "beef", "coconut"}},
		{Cuisine: "southeast_asian", FoodName: "Nasi goreng", Calories: 170, Protein: 5, Carbs: 22, Fat: 7, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"rice", "stir fry"}},
		{Cuisine: "southeast_asian", FoodName: "Beef pho", Calories: 60, Protein: 5, Carbs: 8, Fat: 1, Fibre: 0.5, ServingSize: 500, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"noodles", "soup", "beef"}},
		{Cuisine: "southeast_asian", FoodName: "Fried banana (pisang goreng)", Calories: 260, Protein: 2, Carbs: 40, Fat: 10, Fibre: 2, ServingSize: 80, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"fried", "dessert", "junk"}},
		{Cuisine: "southeast_asian", FoodName: "Mango sticky rice", Calories: 170, Protein: 3, Carbs: 32, Fat: 3.5, Fibre: 1, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "dessert"}},
		{Cuisine: "southeast_asian", FoodName: "Tom yum soup", Calories: 45, Protein: 4, Carbs: 4, Fat: 1.5, Fibre: 0.5, ServingSize: 350, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"soup"}},
	},
	"middle_eastern": {
		{Cuisine: "middle_eastern", FoodName: "Hummus", Calories: 166, Protein: 8, Carbs: 14, Fat: 10, Fibre: 6, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"dip", "chickpea"}},
		{Cuisine: "middle_eastern", FoodName: "Falafel", Calories: 333, Protein: 13, Carbs: 32, Fat: 18, Fibre: 10, ServingSize: 80, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"fried", "chickpea"}},
		{Cuisine: "middle_eastern", FoodName: "Chicken shawarma", Calories: 220, Protein: 25, Carbs: 4, Fat: 12, Fibre: 0.5, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"shawarma", "chicken", "grilled"}},
		{Cuisine: "middle_eastern", FoodName: "Beef shawarma", Calories: 230, Protein: 22, Carbs: 4, Fat: 14, Fibre: 0.5, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"shawarma", "beef", "grilled"}},
		{Cuisine: "middle_eastern", FoodName: "Pita bread", Calories: 275, Protein: 9, Carbs: 55, Fat: 1.2, Fibre: 2.2, ServingSize: 70, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"bread", "wheat"}},
		{Cuisine: "middle_eastern", FoodName: "Tabbouleh", Calories: 120, Protein: 3, Carbs: 14, Fat: 6, Fibre: 3, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"salad", "bulgur"}},
		{Cuisine: "middle_eastern", FoodName: "Chicken kebab", Calories: 190, Protein: 26, Carbs: 2, Fat: 9, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"kebab", "chicken", "grilled"}},
		{Cuisine: "middle_eastern", FoodName: "Lamb kebab", Calories: 250, Protein: 24, Carbs: 2, Fat: 16, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"kebab", "lamb", "grilled"}},
		{Cuisine: "middle_eastern", FoodName: "Spiced basmati rice", Calories: 165, Protein: 3, Carbs: 32, Fat: 3, Fibre: 1, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice"}},
		{Cuisine: "middle_eastern", FoodName: "Lentil soup", Calories: 90, Protein: 6, Carbs: 15, Fat: 1, Fibre: 4, ServingSize: 300, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"soup", "lentil"}},
		{Cuisine: "middle_eastern", FoodName: "Baba ganoush", Calories: 130, Protein: 2.5, Carbs: 10, Fat: 9, Fibre: 5, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"dip", "eggplant"}},
		{Cuisine: "middle_eastern", FoodName: "Fattoush salad", Calories: 90, Protein: 2, Carbs: 11, Fat: 4.5, Fibre: 3, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"salad"}},
		{Cuisine: "middle_eastern", FoodName: "Baklava", Calories: 430, Protein: 6, Carbs: 48, Fat: 24, Fibre: 2, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "pastry", "junk"}},
		{Cuisine: "middle_eastern", FoodName: "Kanafeh", Calories: 330, Protein: 7, Carbs: 38, Fat: 16, Fibre: 1, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "junk"}},
		{Cuisine: "middle_eastern", FoodName: "Grilled halloumi", Calories: 320, Protein: 25, Carbs: 2, Fat: 25, Fibre: 0, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"dairy", "grilled"}},
		{Cuisine: "middle_eastern", FoodName: "Chicken mandi rice", Calories: 180, Protein: 10, Carbs: 20, Fat: 7, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "chicken"}},
		{Cuisine: "middle_eastern", FoodName: "Stuffed grape leaves (dolma)", Calories: 130, Protein: 2, Carbs: 18, Fat: 5, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "vegetarian"}},
	},
	"mediterranean": {
		{Cuisine: "mediterranean", FoodName: "Greek salad", Calories: 80, Protein: 2, Carbs: 5, Fat: 6, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"salad"}},
		{Cuisine: "mediterranean", FoodName: "Grilled salmon", Calories: 208, Protein: 20, Carbs: 0, Fat: 13, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"fish", "grilled"}},
		{Cuisine: "mediterranean", FoodName: "Grilled sea bass", Calories: 124, Protein: 23, Carbs: 0, Fat: 3, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"fish", "grilled"}},
		{Cuisine: "mediterranean", FoodName: "Spaghetti with tomato sauce", Calories: 150, Protein: 5, Carbs: 30, Fat: 1, Fibre: 2, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"pasta"}},
		{Cuisine: "mediterranean", FoodName: "Spaghetti carbonara", Calories: 195, Protein: 8, Carbs: 22, Fat: 8, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"pasta", "pork"}},
		{Cuisine: "mediterranean", FoodName: "Hummus", Calories: 166, Protein: 8, Carbs: 14, Fat: 10, Fibre: 6, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"dip"}},
		{Cuisine: "mediterranean", FoodName: "Pita bread", Calories: 275, Protein: 9, Carbs: 55, Fat: 1.2, Fibre: 2.2, ServingSize: 70, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"bread"}},
		{Cuisine: "mediterranean", FoodName: "Feta cheese", Calories: 264, Protein: 14, Carbs: 4, Fat: 21, Fibre: 0, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"dairy", "cheese"}},
		{Cuisine: "mediterranean", FoodName: "Olive oil", Calories: 884, Protein: 0, Carbs: 0, Fat: 100, Fibre: 0, ServingSize: 15, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"oil", "fat"}},
		{Cuisine: "mediterranean", FoodName: "Caprese salad", Calories: 150, Protein: 8, Carbs: 4, Fat: 11, Fibre: 1, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"salad", "cheese"}},
		{Cuisine: "mediterranean", FoodName: "Margherita pizza", Calories: 250, Protein: 11, Carbs: 33, Fat: 9, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"pizza"}},
		{Cuisine: "mediterranean", FoodName: "Grilled chicken souvlaki", Calories: 190, Protein: 27, Carbs: 2, Fat: 8, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"grilled", "chicken"}},
		{Cuisine: "mediterranean", FoodName: "Tzatziki", Calories: 75, Protein: 4, Carbs: 4, Fat: 5, Fibre: 0.5, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"dip", "dairy"}},
		{Cuisine: "mediterranean", FoodName: "Lentil soup", Calories: 90, Protein: 6, Carbs: 15, Fat: 1, Fibre: 4, ServingSize: 300, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"soup", "lentil"}},
		{Cuisine: "mediterranean", FoodName: "Baklava", Calories: 430, Protein: 6, Carbs: 48, Fat: 24, Fibre: 2, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "junk"}},
		{Cuisine: "mediterranean", FoodName: "Fried calamari", Calories: 175, Protein: 12, Carbs: 10, Fat: 9, Fibre: 0.5, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"seafood", "fried", "junk"}},
		{Cuisine: "mediterranean", FoodName: "Risotto", Calories: 170, Protein: 4, Carbs: 25, Fat: 5, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice"}},
	},
	"western": {
		{Cuisine: "western", FoodName: "Grilled chicken breast", Calories: 165, Protein: 31, Carbs: 0, Fat: 3.6, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"chicken", "grilled"}},
		{Cuisine: "western", FoodName: "Beef steak", Calories: 271, Protein: 25, Carbs: 0, Fat: 19, Fibre: 0, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"beef", "steak", "grilled"}},
		{Cuisine: "western", FoodName: "Cheeseburger", Calories: 250, Protein: 13, Carbs: 22, Fat: 13, Fibre: 1, ServingSize: 180, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"burger", "junk"}},
		{Cuisine: "western", FoodName: "Bacon cheeseburger", Calories: 280, Protein: 15, Carbs: 21, Fat: 16, Fibre: 1, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"burger", "pork", "junk"}},
		{Cuisine: "western", FoodName: "Caesar salad", Calories: 190, Protein: 7, Carbs: 8, Fat: 15, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"salad"}},
		{Cuisine: "western", FoodName: "Spaghetti bolognese", Calories: 155, Protein: 9, Carbs: 17, Fat: 5, Fibre: 1.5, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"pasta", "beef"}},
		{Cuisine: "western", FoodName: "Roast chicken", Calories: 190, Protein: 27, Carbs: 0, Fat: 9, Fibre: 0, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"chicken", "roast"}},
		{Cuisine: "western", FoodName: "Roast beef", Calories: 215, Protein: 26, Carbs: 0, Fat: 12, Fibre: 0, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"beef", "roast"}},
		{Cuisine: "western", FoodName: "Mashed potatoes", Calories: 88, Protein: 2, Carbs: 17, Fat: 2, Fibre: 1.5, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"potato"}},
		{Cuisine: "western", FoodName: "French fries", Calories: 312, Protein: 3.4, Carbs: 41, Fat: 15, Fibre: 3.8, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"potato", "fried", "junk"}},
		{Cuisine: "western", FoodName: "Pepperoni pizza", Calories: 280, Protein: 13, Carbs: 30, Fat: 12, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: false, Tags: []string{"pizza", "pork", "junk"}},
		{Cuisine: "western", FoodName: "Grilled cheese sandwich", Calories: 290, Protein: 12, Carbs: 28, Fat: 15, Fibre: 1.5, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"sandwich"}},
		{Cuisine: "western", FoodName: "Turkey sandwich", Calories: 200, Protein: 14, Carbs: 25, Fat: 5, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"sandwich"}},
		{Cuisine: "western", FoodName: "Beef casserole", Calories: 150, Protein: 12, Carbs: 8, Fat: 7, Fibre: 1, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"casserole", "beef"}},
		{Cuisine: "western", FoodName: "Chicken pot pie", Calories: 210, Protein: 9, Carbs: 18, Fat: 12, Fibre: 1, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"casserole", "chicken"}},
		{Cuisine: "western", FoodName: "Donut", Calories: 452, Protein: 5, Carbs: 51, Fat: 25, Fibre: 1.5, ServingSize: 60, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "fried", "junk"}},
		{Cuisine: "western", FoodName: "Chocolate chip cookie", Calories: 488, Protein: 5, Carbs: 64, Fat: 23, Fibre: 2, ServingSize: 30, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "junk"}},
		{Cuisine: "western", FoodName: "Cola soda", Calories: 42, Protein: 0, Carbs: 10.6, Fat: 0, Fibre: 0, ServingSize: 330, ServingUnit: "ml", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"drink", "junk"}},
	},
	"african": {
		{Cuisine: "african", FoodName: "Jollof rice", Calories: 180, Protein: 4, Carbs: 30, Fat: 5, Fibre: 1.5, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "jollof"}},
		{Cuisine: "african", FoodName: "Jollof rice with chicken", Calories: 200, Protein: 12, Carbs: 26, Fat: 6, Fibre: 1.5, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "jollof", "chicken"}},
		{Cuisine: "african", FoodName: "Fufu", Calories: 150, Protein: 1.5, Carbs: 35, Fat: 0.2, Fibre: 2, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"staple", "cassava"}},
		{Cuisine: "african", FoodName: "Injera", Calories: 95, Protein: 3, Carbs: 20, Fat: 0.5, Fibre: 2.5, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"bread", "teff"}},
		{Cuisine: "african", FoodName: "Beef stew", Calories: 160, Protein: 14, Carbs: 6, Fat: 9, Fibre: 1.5, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"stew", "beef"}},
		{Cuisine: "african", FoodName: "Peanut soup (groundnut stew)", Calories: 150, Protein: 7, Carbs: 9, Fat: 10, Fibre: 2, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"soup", "peanut", "stew"}},
		{Cuisine: "african", FoodName: "Chicken tagine", Calories: 165, Protein: 16, Carbs: 8, Fat: 7, Fibre: 2, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"tagine", "chicken", "stew"}},
		{Cuisine: "african", FoodName: "Vegetable tagine", Calories: 90, Protein: 2.5, Carbs: 14, Fat: 3, Fibre: 3, ServingSize: 300, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"tagine", "vegetable"}},
		{Cuisine: "african", FoodName: "Egusi soup", Calories: 180, Protein: 9, Carbs: 6, Fat: 14, Fibre: 2, ServingSize: 300, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"soup", "stew"}},
		{Cuisine: "african", FoodName: "Suya (spiced beef skewers)", Calories: 220, Protein: 26, Carbs: 4, Fat: 11, Fibre: 1, ServingSize: 100, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"grilled", "beef", "skewer"}},
		{Cuisine: "african", FoodName: "Fried plantain", Calories: 160, Protein: 1, Carbs: 30, Fat: 5, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"plantain", "fried", "junk"}},
		{Cuisine: "african", FoodName: "Rice and beans (waakye)", Calories: 150, Protein: 6, Carbs: 28, Fat: 1.5, Fibre: 4, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "legume"}},
		{Cuisine: "african", FoodName: "Chin chin", Calories: 480, Protein: 7, Carbs: 58, Fat: 24, Fibre: 1.5, ServingSize: 50, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"fried", "snack", "junk"}},
		{Cuisine: "african", FoodName: "Puff puff", Calories: 300, Protein: 5, Carbs: 45, Fat: 11, Fibre: 1, ServingSize: 60, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"fried", "snack", "junk"}},
		{Cuisine: "african", FoodName: "Couscous", Calories: 112, Protein: 3.8, Carbs: 23, Fat: 0.2, Fibre: 1.4, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: false, Tags: []string{"grain", "couscous"}},
		{Cuisine: "african", FoodName: "Grilled tilapia", Calories: 128, Protein: 26, Carbs: 0, Fat: 2.7, Fibre: 0, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"fish", "grilled"}},
		{Cuisine: "african", FoodName: "Kelewele (spiced fried plantain)", Calories: 200, Protein: 1.5, Carbs: 35, Fat: 7, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"plantain", "fried", "junk"}},
	},
	"latin_american": {
		{Cuisine: "latin_american", FoodName: "Beef taco", Calories: 220, Protein: 14, Carbs: 18, Fat: 11, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"taco", "beef"}},
		{Cuisine: "latin_american", FoodName: "Chicken burrito", Calories: 190, Protein: 12, Carbs: 22, Fat: 6, Fibre: 2, ServingSize: 250, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"burrito", "chicken"}},
		{Cuisine: "latin_american", FoodName: "Rice and beans", Calories: 140, Protein: 5, Carbs: 26, Fat: 1.5, Fibre: 5, ServingSize: 250, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"rice", "beans"}},
		{Cuisine: "latin_american", FoodName: "Beef empanada", Calories: 260, Protein: 9, Carbs: 24, Fat: 14, Fibre: 1.5, ServingSize: 90, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"empanada", "beef", "fried"}},
		{Cuisine: "latin_american", FoodName: "Cheese arepa", Calories: 250, Protein: 7, Carbs: 35, Fat: 9, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"arepa", "corn"}},
		{Cuisine: "latin_american", FoodName: "Shrimp ceviche", Calories: 95, Protein: 15, Carbs: 6, Fat: 1, Fibre: 0.5, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"ceviche", "seafood"}},
		{Cuisine: "latin_american", FoodName: "Fish ceviche", Calories: 90, Protein: 16, Carbs: 5, Fat: 1, Fibre: 0.5, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"ceviche", "fish"}},
		{Cuisine: "latin_american", FoodName: "Chicken tamale", Calories: 200, Protein: 8, Carbs: 22, Fat: 9, Fibre: 1.5, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"tamale", "chicken", "corn"}},
		{Cuisine: "latin_american", FoodName: "Pork tamale", Calories: 210, Protein: 9, Carbs: 20, Fat: 10, Fibre: 1.5, ServingSize: 150, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: false, IsGlutenFree: true, Tags: []string{"tamale", "pork", "corn"}},
		{Cuisine: "latin_american", FoodName: "Grilled steak (churrasco)", Calories: 250, Protein: 26, Carbs: 0, Fat: 16, Fibre: 0, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"beef", "grilled"}},
		{Cuisine: "latin_american", FoodName: "Carne asada", Calories: 220, Protein: 25, Carbs: 0, Fat: 13, Fibre: 0, ServingSize: 200, ServingUnit: "g", IsVegetarian: false, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"beef", "grilled"}},
		{Cuisine: "latin_american", FoodName: "Guacamole", Calories: 160, Protein: 2, Carbs: 9, Fat: 15, Fibre: 7, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"dip", "avocado"}},
		{Cuisine: "latin_american", FoodName: "Black beans", Calories: 132, Protein: 8.9, Carbs: 24, Fat: 0.5, Fibre: 8.7, ServingSize: 200, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"beans", "legume"}},
		{Cuisine: "latin_american", FoodName: "Elote (grilled corn)", Calories: 150, Protein: 4, Carbs: 22, Fat: 6, Fibre: 3, ServingSize: 150, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: true, Tags: []string{"corn", "grilled"}},
		{Cuisine: "latin_american", FoodName: "Churros", Calories: 420, Protein: 5, Carbs: 52, Fat: 22, Fibre: 1.5, ServingSize: 60, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"fried", "dessert", "junk"}},
		{Cuisine: "latin_american", FoodName: "Tres leches cake", Calories: 300, Protein: 5, Carbs: 38, Fat: 14, Fibre: 0.5, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: false, IsHalal: true, IsGlutenFree: false, Tags: []string{"dessert", "cake", "junk"}},
		{Cuisine: "latin_american", FoodName: "Fried plantain (tostones)", Calories: 190, Protein: 1, Carbs: 30, Fat: 7, Fibre: 2, ServingSize: 100, ServingUnit: "g", IsVegetarian: true, IsVegan: true, IsHalal: true, IsGlutenFree: true, Tags: []string{"plantain", "fried"}},
	},
}

// SeedCuisineFoods loads Library into cuisine_food_library. It is idempotent
// (ON CONFLICT DO NOTHING on the (cuisine, food_name) unique key), so this
// function itself IS the seed runner — call it once on every server startup,
// no separate migration-runner mechanism needed.
func SeedCuisineFoods(ctx context.Context, q db.Querier) error {
	for _, foods := range Library {
		for _, f := range foods {
			_, err := q.Exec(ctx, `
				INSERT INTO cuisine_food_library
					(cuisine, food_name, brand, calories, protein, carbs, fat, fibre, serving_size, serving_unit, is_vegetarian, is_vegan, is_halal, is_gluten_free, tags)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
				ON CONFLICT (cuisine, food_name) DO NOTHING`,
				f.Cuisine, f.FoodName, f.Brand, f.Calories, f.Protein, f.Carbs, f.Fat, f.Fibre,
				f.ServingSize, f.ServingUnit, f.IsVegetarian, f.IsVegan, f.IsHalal, f.IsGlutenFree, f.Tags)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
