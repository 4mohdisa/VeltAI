# 04 · AI Coach & Plan Generation

AI generates personalised daily targets, weekly meal plans, and weekly gym schedules — then regenerates them based on real adherence.

---

## User story

> As someone who doesn't know how many calories I should eat to hit my goal or when I should go to the gym, I want the app to figure it out for me based on my body, my schedule, my food preferences, and my goal. And when I miss days or don't hit targets, I want the plan to adapt instead of staying static.
> 

---

## What gets generated

### Daily targets (generated nightly per user at 23:00 local)

For tomorrow:

- Calorie target (kcal)
- Protein target (g)
- Carbs target (g)
- Fat target (g)
- Fibre target (g)
- Water target (ml)
- Is tomorrow a gym day?
- Recommended gym time (if yes)
- Recommended bedtime tonight

Stored in `ai_daily_targets`.

### Weekly meal plan (generated Sundays at 22:00 local)

For the upcoming week, per day:

- Each meal slot with target macros and 3 suggested foods (respecting cuisine + restrictions)

Stored in `ai_meal_plans.plan_data` JSONB.

### Weekly gym schedule (generated Sundays at 22:00 local)

For the upcoming week, per day:

- Is it scheduled? If yes, what time and what focus (upper/lower/cardio)

Stored in `ai_gym_schedules.scheduled_days` JSONB.

---

## Generation pipeline

```
Cron fires at 23:00 user-local time (run hourly, find users whose timezone is now at 23:00)
  ↓
For each due user:
  ↓
  1. Build context using build_ai_context_text(user_id):
     - Body trend (current weight, change rate, on-track-for-goal?)
     - Goals (primary + all active)
     - Schedule (work hours, sleep target)
     - Dietary profile (cuisines, restrictions, allergies)
     - Supplements (whey post-workout 30g, etc.)
     - Habit patterns (best day, worst day, current streak)
     - Food patterns (recent calorie avg, protein hit rate)
     - Health correlations (sleep < 6h → 70% gym skip rate)
     - Last 3 semantically relevant AI insights (via pgvector)
     - Recent nudges sent (to avoid repetition)
  ↓
  2. Send to Gemini 3.5 Flash with system prompt:
     "You are the user's health coach. Generate tomorrow's plan based on the context below.
      Return JSON with: calorie_target, macro_targets, is_gym_day, recommended_gym_time,
      recommended_bedtime, generation_reason (short explanation)."
  ↓
  3. Validate response JSON structure
  ↓
  4. UPSERT INTO ai_daily_targets ON CONFLICT (user_id, target_date) DO UPDATE
  ↓
  5. Schedule notifications based on the plan:
     - Gym reminder 1h before recommended_gym_time
     - Meal reminders at each meal_schedule time
     - Sleep reminder 30min before recommended_bedtime
  ↓
  6. Invalidate ai_prompt_context_cache for this user (their context changed)
```

---

## Example: full daily target generation

### Inputs

```
User: 28yo male, 82kg, 178cm, moderate activity
Goal: lose to 75kg by 31 Dec 2026 (6 months → 1.17kg/month → deficit ~280 kcal/day)
Dietary: halal, Pakistani + Mediterranean cuisines
Schedule: wake 06:30, work 09:00–17:30, gym pref 18:00
Supplements: whey 30g post-workout
Recent patterns:
  - Avg daily calories last 7 days: 2,180
  - Protein avg: 130g (target was 155g)
  - Gym sessions last 7 days: 3/4 target
  - Sleep avg: 6.8h (target 8.0h)
```

### Gemini output

```json
{
  "target_date": "2026-06-16",
  "calorie_target": 2150,
  "protein_target_g": 165,
  "carbs_target_g": 215,
  "fat_target_g": 75,
  "fibre_target_g": 30,
  "water_target_ml": 3000,
  "is_gym_day": true,
  "recommended_gym_time": "18:00",
  "recommended_bedtime": "22:30",
  "generation_reason": "You hit gym 3/4 days this week and protein is averaging 130g vs 155g target. Increased protein focus tomorrow. Earlier bedtime suggested because sleep averaging 6.8h vs 8h target — and your records show gym attendance drops 70% when sleep is under 6 hours."
}
```

The `generation_reason` is shown to the user. **Transparency is a feature.** They can see why the AI made each decision.

---

## Adaptive regeneration

### Pattern: missed gym time

```
User scheduled for 18:00 Mon, Tue, Thu, Sat
Week's results: Mon attended, Tue missed, Thu missed, Sat attended
Missed pattern: weekday evenings

Next week's regeneration:
  - Try Mon morning 06:30 instead of 18:00
  - Keep Tue at 18:00
  - Add an extra Wed slot in case Tue misses
  - generation_reason includes: "Tried morning sessions because you missed both Tue and Thu evening this week"
```

### Pattern: calorie overshoot on weekends

```
Week's results: under target Mon-Fri, +600 over Sat & Sun (eating out)

Next week's plan:
  - Shift weekday targets slightly higher (avoid extreme restriction)
  - Plan weekend meals around eating-out: pre-planned reduced lunches Sat/Sun
  - generation_reason includes: "Adjusted weekday targets up so weekends don't feel restrictive"
```

---

## Manual regeneration

User can tap "Regenerate plan" from the dashboard. Sends same request but with `regeneration_reason = 'user_requested'`. Rate-limited to once per day to control costs.

---

## Cost analysis

- Per daily target generation: ~5K input tokens + 500 output tokens = ~$0.012
- Per weekly meal plan: ~8K input + 3K output = ~$0.039
- Per weekly gym schedule: ~6K input + 1K output = ~$0.018

Per active user per week: ~$0.084 + $0.057 = **~$0.14/week** = $0.60/month

At A$9.99/month subscription, AI plan generation is ~6% of revenue per user.

---

## Edge cases

| Case | Handling |
| --- | --- |
| Gemini API down at 23:00 | Queue retry every 15min until midnight. If still failing, carry yesterday's targets forward. |
| User has no body stats yet | Skip generation, use placeholder targets, retry when stats present. |
| User's goal already achieved | Generate maintenance plan instead of deficit. AI handles this naturally if goal `status = achieved`. |
| User has conflicting goals (lose weight + build muscle) | AI handles both via slow recomposition plan. Status reflected in `generation_reason`. |
| User's timezone changed | Next cron run picks them up at new 23:00. No special handling needed. |
| Plan generation returns invalid macros (e.g., calories too low) | Validate: calories ≥ 1200 for women, 1500 for men. If invalid, retry once. If still invalid, use BMR-based fallback. |
| AI suggests time outside user's schedule | Validation: gym time must fall within wake-bed window. Reject and retry. |

---

## Success metrics

- Plan generation success rate > 99%
- Plan adherence (user hits calorie target within ±10%) > 50%
- Gym session attendance on AI-recommended day-and-time > 60%
- Plan regeneration request rate < 5% of users/week (means plans are usually accepted)
- User satisfaction with plan (in-app thumbs up/down on plan) > 70% positive