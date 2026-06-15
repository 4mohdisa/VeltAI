# 02 · Onboarding Responses

The raw audit trail of every onboarding question and answer. Structured tables (health_context, schedule, etc.) are populated from these. Keeping the raw answers means we can re-run AI analysis with better models in the future.

---

## `onboarding_responses`

Each row is one question-answer pair from onboarding. The answer is JSONB to support different shapes (text, number, multi-select array, time).

```sql
CREATE TABLE onboarding_responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_key    TEXT NOT NULL,
  question_text   TEXT NOT NULL,         -- exact question shown (for audit)
  answer          JSONB NOT NULL,        -- shape varies by question
  answer_version  INT NOT NULL DEFAULT 1, -- increments if user re-answers later
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_question_version UNIQUE (user_id, question_key, answer_version)
);

CREATE INDEX idx_onboarding_user ON onboarding_responses(user_id);
CREATE INDEX idx_onboarding_key ON onboarding_responses(user_id, question_key);

ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_own" ON onboarding_responses
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## Question keys (canonical list)

### Body

- `body_weight_kg`
- `body_height_cm`
- `body_age`
- `body_sex`
- `body_body_fat_pct` (optional)

### Demographics

- `demo_country`
- `demo_ethnicity`
- `demo_primary_language`

### Activity & gym

- `gym_current_frequency_per_week`
- `gym_target_frequency_per_week`
- `gym_preferred_days` (multi-select: mon…sun)
- `gym_preferred_time_of_day` (early_morning | morning | afternoon | evening | night)
- `gym_location` (home | gym | both)
- `gym_training_type` (strength | cardio | both | sports_specific)
- `gym_experience_level` (beginner | intermediate | advanced)
- `gym_main_struggle` (motivation | time | knowledge | injury | other)
- `gym_history_text` (free text — "tell us about your gym journey")

### Eating

- `eat_meals_per_day` (1–6)
- `eat_eating_window_hours` (e.g. 16:8 fasting = 8)
- `eat_typical_breakfast_time`
- `eat_typical_lunch_time`
- `eat_typical_dinner_time`
- `eat_dietary_restrictions` (multi: vegetarian | vegan | halal | kosher | gluten_free | dairy_free | none)
- `eat_allergies` (multi: nuts | shellfish | eggs | soy | other)
- `eat_favourite_cuisines` (multi)
- `eat_foods_to_avoid` (free text array)
- `eat_favourite_foods` (free text array)
- `eat_eats_out_per_week`
- `eat_cooks_at_home` (always | often | sometimes | rarely | never)

### Supplements

- `supp_takes_protein` (yes/no)
- `supp_protein_timing` (pre_workout | post_workout | morning | before_bed | with_meal)
- `supp_protein_grams_per_dose`
- `supp_other_supplements` (free text array: creatine, multivitamin, etc.)

### Sleep

- `sleep_target_hours`
- `sleep_typical_bedtime`
- `sleep_typical_wake_time`
- `sleep_current_avg_hours`
- `sleep_issues` (multi: trouble_falling_asleep | wakes_at_night | wakes_early | none)

### Schedule

- `sched_work_start_time`
- `sched_work_end_time`
- `sched_work_type` (sedentary | active | shift_work | remote | mixed)

### Hydration

- `hydra_typical_water_litres_per_day`
- `hydra_drinks_coffee` (yes/no, cups per day)
- `hydra_drinks_alcohol` (frequency)

### Goals

- `goal_primary` (lose_weight | build_muscle | gym_consistency | eat_better | improve_sleep | general_health)
- `goal_target_weight_kg` (if applicable)
- `goal_target_date`
- `goal_why_text` (free text — "why is this important to you")

### Lockout

- `lock_interested` (yes/no)
- `lock_apps_to_block` (multi: instagram | tiktok | x | youtube | other)
- `lock_enforcement_window` (always | evening_only | custom)

### Permissions

- `perm_healthkit_granted` (boolean)
- `perm_notifications_granted` (boolean)
- `perm_camera_granted` (boolean)
- `perm_microphone_granted` (boolean)
- `perm_screentime_granted` (boolean)

---

## Why JSONB instead of structured columns

- Question set may evolve. We don't want a migration every time we add a question.
- Multi-select answers naturally fit JSONB arrays.
- Free text answers (`gym_history_text`) can sit alongside structured answers.
- The downstream tables (`user_dietary_profile`, `user_schedule`, etc.) are the structured representation. This table is the source of truth audit trail.