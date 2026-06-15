# AI Architecture

## Model decision

**Single model: Gemini 3.5 Flash** for every AI task.

Why single model:

- Best food recognition accuracy (Suggestic benchmarks showed Gemini 2.5 Flash beat GPT-4o by 25% on Nutrition5k food dataset; 3.5 improves further)
- Native Google Search grounding for packaged food lookup
- Multimodal (image + text + tool use) in one request
- Cheapest at scale: $1.50/1M input tokens, $9/1M output
- One integration. No multi-model routing complexity. Isa's explicit preference.

## What Gemini handles

| Task | Input | Output |
| --- | --- | --- |
| Photo food scan (fresh) | Image + system prompt | JSON: ingredients with confidence scores |
| Photo food scan (packaged) | Image + Google Search grounding | JSON: nutrition from label search |
| Voice meal parsing | Transcript text | JSON: structured food items |
| Uncertainty resolution | User confirmations | Updated ingredient list |
| Daily plan generation | User context (all memory tables) | Calorie target, meal schedule, gym time |
| Weekly digest (Phase 2) | Week's data | Personalised summary text |
| Nudge generation | User context + recent activity | Short notification text |
| Embeddings | Insight summary text | 768-dim vector via text-embedding-004 |

---

## Food scan pipeline

### Type 1: Barcode

```
User scans barcode → Open Food Facts API → exact nutrition
No AI cost. No uncertainty. Just data.
```

### Type 2: Photo of packaged food (no barcode)

```
User photographs label → Gemini 3.5 Flash + Search grounding
→ identifies product name from label
→ searches for nutrition data
→ returns structured JSON
If confidence < 0.85: uncertainty prompt
```

### Type 3: Photo of fresh/cooked food

```
User photographs meal → Gemini with chain-of-thought prompt
→ lists ingredients with confidence per ingredient
→ estimates weight in grams
→ flags uncertain factors (oil type, cooking method)

Ingredients with confidence < 0.75:
→ added to uncertainty prompt queue
→ user confirms or overrides each one
→ final calculation uses confirmed data
→ correction stored in food_scan_corrections
```

### Type 4: Voice entry

```
User taps voice button → iOS Speech framework transcribes
→ transcript sent to Gemini
→ Gemini parses: "two eggs scrambled with toast and butter"
   into [{egg, 2 units}, {bread, 2 slices}, {butter, 10g}]
→ user confirms or edits
→ added to meal
```

---

## Chain-of-thought prompt (fresh food)

```
You are a professional nutritionist analysing a food photo.

User context (injected from memory):
- Ethnicity: [user.ethnicity]
- Typical cuisines: [user.typical_cuisines]
- Known oil preference for stir fry: [user.food_prefs.stir_fry.oil]
- Recent meal pattern: [user.food_patterns]

Step 1: List every visible food component.
Step 2: For each, estimate weight in grams using visible reference objects.
Step 3: For each, assign a confidence score 0.0–1.0.
Step 4: Flag any cooking methods or hidden ingredients that significantly
        affect calories but cannot be determined from the image alone.

Return JSON.
```

The user context injection means the AI knows that when an Australian-Pakistani user photographs a curry, it's likely cooked with ghee + onions + tomatoes — not olive oil. Context dramatically improves accuracy.

---

## Per-user AI memory — 4 layers

### Layer 1 — Short-term (Redis, TTL 24h)

Today's meals, today's habit completions, active scan context.

### Layer 2 — Structured long-term (PostgreSQL)

Habit patterns, food patterns, health correlations, body trends.

Injected as plain text into every Gemini system prompt.

### Layer 3 — Semantic (pgvector)

Embedded summaries of past AI insights. Retrieved by cosine similarity before generating new analysis. Prevents AI from repeating itself.

### Layer 4 — Operational

Nudge log (what has AI already said?), prompt context cache (assembled blocks), AI conversation threads (Phase 2).

---

## Company AI training flywheel

Every food scan correction is a labelled training example. The longer Veltai runs, the more accurate the model becomes — a moat competitors can't buy.

### Critical training rule

**Only train on explicit corrections.** Never on passive approvals.

If a user taps OK without changing anything, that's not training data — there's selection bias (users prefer lower calorie estimates and accept them uncritically). Training on passive approvals teaches the model to underestimate. **This is exactly what made Cal AI silently wrong.**

### Cadence

- Months 1–5: collect data only
- Month 6+: first training run once > 5,000 explicit corrections accumulated
- Ongoing: monthly fine-tunes via Together AI (~$0.48/1M tokens)
- Deploy new version only if eval metrics improve on held-out test set

---

## Daily plan generation

At the end of onboarding, Gemini generates the user's first AI plan:

```
Input:
- Body stats (weight, height, age, sex, activity level)
- Goal (lose 5kg by Dec, build muscle, etc.)
- Schedule (wake 06:30, work 09:00–17:30, gym pref 18:00, sleep 23:00)
- Eating pattern (3 meals + 1 snack, eats out twice a week)
- Ethnicity / preferred cuisines (Pakistani, Australian, Mediterranean)
- Dietary restrictions (halal, no pork, no alcohol)
- Supplements (whey 30g post-workout)

Output:
- Daily calorie target: 2,150 kcal
- Macros: 165g protein, 215g carbs, 75g fat
- Meal schedule:
  07:00 — Breakfast 500 kcal (suggestions: oats, eggs, paratha alternatives)
  12:30 — Lunch 600 kcal
  16:00 — Snack 200 kcal
  19:30 — Dinner 650 kcal (post-gym, higher protein)
  20:00 — Whey 30g (already accounted for in dinner protein target)
- Gym: 18:00, 4 sessions/week, target days Mon Tue Thu Sat
- Lockout: enforce Instagram, TikTok, X between 18:00 and gym log
```

This plan regenerates weekly based on actual adherence. If the user keeps missing 18:00 gym, the AI suggests 06:30 morning gym instead.

---

## Cost estimates

At 1,000 active users doing 3 food scans/day + 1 plan regen/week:

| Action | Daily volume | Cost/call | Daily cost |
| --- | --- | --- | --- |
| Food photo scan | 3,000 | ~$0.002 | $6 |
| Voice meal parse | 1,000 | ~$0.0005 | $0.50 |
| Google Search grounding | 500 | $0.014/1k | $7 |
| Weekly plan regen | 143 avg | ~$0.005 | $0.72 |
| Embeddings | 143 avg | ~$0.0001 | $0.01 |
| **Total** |  |  | **~$14/day** |

At A$9.99/month × 1,000 users = ~A$9,990/month revenue. AI cost: ~A$420/month. **AI is ~4% of revenue at this scale.**