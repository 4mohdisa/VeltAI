# 03 · Food Tracking

Four input methods: photo, voice, barcode, manual. Voice is our differentiator. Photo with uncertainty prompts is our accuracy moat.

---

## User story

> As someone who finds calorie tracking tedious, I want to log a meal in under 10 seconds. I either photograph it, speak it, scan a barcode, or type it. I want the app to ask me when it's not sure — not silently guess wrong.
> 

---

## The four entry methods

### 1. Photo scan

**Use case:** restaurant meals, home-cooked food, anything without a barcode.

```
User taps "Add meal" → Photo
  ↓
Camera opens. User photographs the food.
  ↓
[Optional] Camera prompts: "Add the nutrition label?" Yes → second photo of label
[Optional] After eating, prompt: "Photograph the leftovers?" Optional 3rd photo
  ↓
All photos upload to Supabase Storage (parallel)
  ↓
Go backend calls Gemini 3.5 Flash with:
  - Food image(s)
  - User context (cuisines, ethnicity, dietary patterns, known preferences)
  - Chain-of-thought system prompt
  ↓
Gemini returns structured JSON: ingredients with confidence scores per ingredient
  ↓
IF any ingredient has confidence < 0.75:
  Show Uncertainty Prompt UI:
    "This looks oily. What did you use?"
    [Dry] [Light oil] [Medium oil] [Heavy oil]
  User taps an option → Gemini re-calculates with confirmed value
  Stored as user_food_preferences for future pre-filling
  ↓
Final macro panel shown: 580 kcal | P 35g | C 60g | F 22g
User taps "Save" → meal + food_items + meal_photos + food_scan_logs all written
```

**XP awarded:** 8 XP for photo scan + 3 XP bonus if uncertainty prompt completed.

### 2. Voice entry

**Use case:** described meals on the go, while driving, hands dirty from cooking.

```
User taps "Add meal" → Voice (mic icon)
  ↓
iOS Speech framework starts listening (or Whisper API via backend if Speech permission denied)
  ↓
User speaks: "Two scrambled eggs with a slice of toast and butter for breakfast"
  ↓
Transcript shown in real-time
  ↓
User taps "Done" or auto-stops after 3s of silence
  ↓
Transcript sent to Gemini with prompt:
  "Parse this meal description into structured food items. 
   User's typical breakfast is around 500 kcal. Their dietary restriction is halal. 
   Return JSON: [{name, quantity_g, calories, protein_g, carbs_g, fat_g, confidence}]"
  ↓
Gemini returns: [
  {name: "scrambled eggs", quantity_g: 100, calories: 195, ...},
  {name: "white bread", quantity_g: 30, calories: 80, ...},
  {name: "butter", quantity_g: 7, calories: 50, ...}
]
  ↓
Review screen shows each item with edit button
User confirms or edits quantities → saves
  ↓
Written to: meals + food_items + voice_meal_logs
```

**XP awarded:** 8 XP for voice entry.

### 3. Barcode scan

**Use case:** packaged foods, snacks, drinks.

```
User taps "Add meal" → Barcode
  ↓
Camera opens in barcode-detect mode (expo-camera)
  ↓
Detects barcode automatically (no shutter button)
  ↓
Lookup against Open Food Facts API
  Headers: User-Agent: "Veltai/1.0 (hello@veltai.app)"
  ↓
IF found:
  Product info shown (brand, name, image, base nutrition)
  User picks serving size (g, ml, or pieces)
  Macros calculated
  Save
  ↓
IF not found:
  Prompt: "This product isn't in our database. Photograph the nutrition label?"
  → Falls back to packaged photo scan flow with Gemini
  Optionally: submit to Open Food Facts as a contribution
```

**XP awarded:** 5 XP for barcode (lowest because it's automated and easy).

**Cost:** $0 — Open Food Facts is free with attribution.

### 4. Manual entry

**Use case:** user knows exactly what they ate, doesn't want to wait for AI.

```
User taps "Add meal" → Search
  ↓
Search box → query Open Food Facts + cached recent items + user_food_preferences
  ↓
Typeahead shows results
User picks an item → picks serving size → saves
  ↓
IF no match: "Add custom food" → form (name, calories, protein, carbs, fat per 100g)
  Custom foods saved per-user for re-use
```

**XP awarded:** 5 XP for manual entry.

---

## Uncertainty Prompt UI (the accuracy moat)

This is what fixes Cal AI's silent-guessing problem.

Gemini returns ingredient list with per-ingredient confidence. For each ingredient where `confidence < 0.75`, we surface a card:

```
┌──────────────────────────────────────┐
│ Question 1 of 2                          │
│                                          │
│ We see oil on the stir fry but can't     │
│ tell how much was used. What did you do? │
│                                          │
│  [ Dry / no oil ]                        │
│  [ Light — 1 tsp ]                       │
│  [ Medium — 1 tbsp ]                     │
│  [ Heavy — 2+ tbsp ]                     │
│                                          │
│  Calories will adjust: 480 → 540 kcal    │
│  (estimate for medium)                   │
└──────────────────────────────────────┘
```

If a `user_food_preferences` row exists for `(user_id, dish_type='stir_fry', ingredient_key='cooking_oil')` we **pre-select** the user's previous answer. They can confirm in one tap or change it.

**Common uncertainty types:**

- Cooking oil (type and quantity)
- Sauce / dressing quantity
- Cooking method (grilled vs fried vs raw)
- Portion size when no reference object visible
- Hidden ingredients (butter on toast, mayo in sandwich)

---

## Tables touched per entry method

| Table | Photo | Voice | Barcode | Manual |
| --- | --- | --- | --- | --- |
| meals | ✓ | ✓ | ✓ | ✓ |
| food_items | ✓ | ✓ | ✓ | ✓ |
| meal_photos | ✓ | — | — (Phase 2: barcode photo) | — |
| voice_meal_logs | — | ✓ | — | — |
| food_scan_logs | ✓ | ✓ | ✓ | — |
| food_scan_corrections | ✓ (if user edited) | ✓ (if user edited) | — | — |
| user_food_preferences | ✓ (uncertainty answer) | ✓ (corrections) | — | — |
| daily_nutrition_summary | ✓ | ✓ | ✓ | ✓ |
| xp_ledger | ✓ | ✓ | ✓ | ✓ |

---

## Edge cases

| Case | Handling |
| --- | --- |
| Photo too blurry / dark | Gemini returns low confidence overall. Show: "Could you take another photo with better lighting?" |
| Photo has no food | Gemini returns empty array + reason. Show: "We couldn't see any food. Try again or use voice." |
| Voice transcript empty / no recognizable food | Show: "We couldn't understand. Try saying something like 'I had chicken and rice'." |
| Barcode not in Open Food Facts | Fallback to packaged-label photo scan |
| User adds same meal twice (e.g., taps save twice) | Backend dedupes by `(user_id, meal_date, meal_slot, total_calories)` hash within 30 seconds |
| User edits a logged meal | Existing meal row updated, `food_items` for that meal replaced. Corrections logged. XP not re-awarded. |
| User deletes a logged meal | Soft delete, `daily_nutrition_summary` recomputed, XP entries for that meal **kept** (no exploit for re-earning) |
| Gemini API down | Fall back to manual entry with clear message |
| Gemini returns malformed JSON | Retry once with stricter prompt. If still bad, show error and let user enter manually. Log to Sentry. |

---

## AI cost & latency targets

- **Photo scan**: p95 < 4 seconds, cost ~$0.002 per scan
- **Voice parse**: p95 < 2 seconds, cost ~$0.0005 per parse
- **Barcode lookup**: p95 < 800ms, cost $0
- **Search query**: p95 < 200ms, cost $0

---

## Success metrics

- Meal log completion (start → save) success rate > 95%
- Median time to log a meal < 15 seconds across all 4 methods
- Photo scan correction rate (user edited the AI's guess) tracked monthly — should *decrease* as training pipeline runs
- Voice entry adoption among trial users > 30%
- Uncertainty prompt response rate (user actually answers) > 80%
- Photos per meal average > 1.3 (signal that users are adding label/leftover photos)