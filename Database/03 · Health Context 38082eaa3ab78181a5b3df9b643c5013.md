# 03 · Health Context

Structured health data derived from onboarding. Updated when the user updates their profile. Injected into every AI prompt as context.

---

## `user_body_stats` — history of weight, height, body fat

New row each time user updates their weight. Preserves the trend.

```sql
CREATE TABLE user_body_stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg       NUMERIC(5,2),
  height_cm       NUMERIC(5,1),
  age             INT,
  sex             TEXT,                   -- male | female | prefer_not_to_say
  body_fat_pct    NUMERIC(4,1),
  activity_level  TEXT,                   -- sedentary | light | moderate | active | very_active
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_body_stats_user_recorded ON user_body_stats(user_id, recorded_at DESC);

ALTER TABLE user_body_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "body_stats_own" ON user_body_stats
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_demographics` — country, ethnicity, language

1:1 with users. Critical for AI food context (a Pakistani user's curry has different ingredients than an Italian user's pasta sauce).

```sql
CREATE TABLE user_demographics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  country           TEXT,                   -- ISO 3166 e.g. "AU"
  ethnicity         TEXT,                   -- free text user-provided
  primary_language  TEXT DEFAULT 'en',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demographics_own" ON user_demographics
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_dietary_profile` — eating habits, restrictions, cuisines

The most important table for AI food understanding. Used in every food scan prompt.

```sql
CREATE TABLE user_dietary_profile (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  meals_per_day            INT NOT NULL DEFAULT 3,
  eating_window_hours      NUMERIC(3,1),       -- e.g. 8.0 for 16:8 fasting
  fasting_pattern          TEXT,               -- none | 16_8 | 18_6 | 20_4 | omad

  dietary_restrictions     TEXT[] DEFAULT '{}', -- vegetarian, vegan, halal, kosher, gluten_free, dairy_free
  allergies                TEXT[] DEFAULT '{}', -- nuts, shellfish, eggs, soy, other

  favourite_cuisines       TEXT[] DEFAULT '{}', -- pakistani, indian, italian, mexican, etc.
  foods_to_avoid           TEXT[] DEFAULT '{}', -- free text user-provided
  favourite_foods          TEXT[] DEFAULT '{}', -- free text user-provided

  eats_out_per_week        INT DEFAULT 0,
  cooks_at_home            TEXT,                -- always | often | sometimes | rarely | never

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_dietary_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dietary_own" ON user_dietary_profile
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_supplements` — protein and other supplements

One row per supplement (whey, creatine, multivitamin, etc.). User can have many.

```sql
CREATE TABLE user_supplements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplement_type   TEXT NOT NULL,        -- whey_protein | casein | creatine | multivitamin | vitamin_d | omega_3 | other
  custom_name       TEXT,                  -- for "other" type
  dosage_grams      NUMERIC(5,1),
  dosage_units      TEXT,                  -- g | mg | iu | capsules | scoops
  timing            TEXT,                  -- pre_workout | post_workout | morning | with_meal | before_bed | as_needed
  frequency         TEXT,                  -- daily | training_days_only | weekly
  brand             TEXT,                  -- optional
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplements_user ON user_supplements(user_id) WHERE is_active = TRUE;

ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplements_own" ON user_supplements
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_hydration_goal`

1:1 with users. Daily water target plus coffee and alcohol context for AI.

```sql
CREATE TABLE user_hydration_goal (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  daily_water_target_ml    INT,
  typical_coffee_cups      INT DEFAULT 0,
  alcohol_frequency        TEXT,            -- never | rarely | weekly | several_per_week | daily
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_hydration_goal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hydration_own" ON user_hydration_goal
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```