# 09 · AI Memory

Four-layer per-user AI memory system. Most complex schema in the project.

- **Layer 1**: Short-term context (Redis, not in this file)
- **Layer 2**: Structured long-term memory (`user_habit_patterns`, `user_food_patterns`, `user_health_correlations`, `user_body_trend`)
- **Layer 3**: Semantic memory (`user_ai_insights` with pgvector)
- **Layer 4**: Operational (`ai_nudge_log`, `ai_prompt_context_cache`, conversation threads for Phase 2)

---

## Setup

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## `user_habit_patterns`

Behavioural observations about gym habit. Updated by daily cron + weekly digest.

```sql
CREATE TABLE user_habit_patterns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_key     TEXT NOT NULL,
    -- best_day_of_week         "Tuesday"
    -- worst_day_of_week        "Sunday"
    -- avg_sessions_per_week    "3.2"
    -- best_time_of_day         "morning" | "afternoon" | "evening"
    -- longest_current_streak   "42"
    -- consistency_trend        "improving" | "declining" | "stable"
    -- morning_person           "true" | "false"
    -- weekend_attendance       "high" | "medium" | "low"
  pattern_value   TEXT NOT NULL,
  confidence      NUMERIC(3,2),
  data_points     INT,
  observed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_habit_pattern UNIQUE (user_id, pattern_key)
);

CREATE INDEX idx_habit_patterns_user ON user_habit_patterns(user_id);

ALTER TABLE user_habit_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_habit_patterns" ON user_habit_patterns
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_food_patterns`

Macro and eating patterns over time.

```sql
CREATE TABLE user_food_patterns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_key     TEXT NOT NULL,
    -- avg_daily_calories          "1980"
    -- avg_protein_g               "142"
    -- avg_carbs_g                 "210"
    -- avg_fat_g                   "68"
    -- calorie_goal_hit_rate       "0.61"
    -- protein_goal_hit_rate       "0.78"
    -- biggest_meal                "dinner"
    -- most_logged_meal            "lunch"
    -- weekend_calorie_delta       "+340"
    -- scan_method_preference      "photo_scan" | "voice" | "barcode" | "manual"
    -- most_common_cuisine         "pakistani" | "asian" | etc.
    -- underlogging_risk           "high" | "medium" | "low"
  pattern_value   TEXT NOT NULL,
  confidence      NUMERIC(3,2),
  data_points     INT,
  observed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_food_pattern UNIQUE (user_id, pattern_key)
);

CREATE INDEX idx_food_patterns_user ON user_food_patterns(user_id);

ALTER TABLE user_food_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_food_patterns" ON user_food_patterns
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_health_correlations`

AI-detected links between metrics. The most valuable AI output — these personalise everything.

```sql
CREATE TABLE user_health_correlations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correlation_key     TEXT NOT NULL,
    -- sleep_vs_gym_attendance
    -- sleep_vs_calories_consumed
    -- weekend_vs_weekday_consistency
    -- alcohol_vs_next_day_performance
  metric_a            TEXT NOT NULL,
  metric_b            TEXT NOT NULL,
  direction           TEXT NOT NULL,    -- positive | negative | none
  magnitude           NUMERIC(4,3),     -- correlation coefficient
  plain_english       TEXT NOT NULL,    -- "When you sleep under 6 hours, you skip the gym 70% of the time"
  data_points         INT,
  confidence          NUMERIC(3,2),
  first_detected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_confirmed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_health_corr UNIQUE (user_id, correlation_key)
);

CREATE INDEX idx_correlations_user ON user_health_correlations(user_id);

ALTER TABLE user_health_correlations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_correlations" ON user_health_correlations
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_body_trend`

Rolling summary of body stats for AI context. Updated weekly.

```sql
CREATE TABLE user_body_trend (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_weight_kg               NUMERIC(5,2),
  starting_weight_kg              NUMERIC(5,2),
  weight_change_kg                NUMERIC(5,2),    -- current - starting
  weight_trend                    TEXT,             -- losing | gaining | maintaining
  weight_change_rate_kg_per_week  NUMERIC(4,2),
  bmi                             NUMERIC(4,1),
  weeks_of_data                   INT,
  last_weigh_in                   DATE,
  on_track_for_goal               BOOLEAN,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_body_trend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_body_trend" ON user_body_trend
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `user_ai_insights`

Embedded summaries of past AI analyses. pgvector enables semantic retrieval.

```sql
CREATE TABLE user_ai_insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type    TEXT NOT NULL,
    -- weekly_digest | gym_observation | food_observation
    -- health_correlation | milestone_note | nudge_followup
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL,
  embedding       VECTOR(768),       -- Google text-embedding-004
  week_start      DATE,
  data_snapshot   JSONB,
  acted_on        BOOLEAN DEFAULT FALSE,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insights_user ON user_ai_insights(user_id);
CREATE INDEX idx_insights_type ON user_ai_insights(user_id, insight_type);
CREATE INDEX idx_insights_week ON user_ai_insights(user_id, week_start DESC);
CREATE INDEX idx_insights_hnsw ON user_ai_insights
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);

ALTER TABLE user_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_insights" ON user_ai_insights
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `ai_prompt_context_cache`

Pre-assembled context blocks. Avoids re-querying all memory tables on every AI call.

```sql
CREATE TABLE ai_prompt_context_cache (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  context_block       TEXT NOT NULL,
  token_count         INT,
  includes_habits     BOOLEAN DEFAULT FALSE,
  includes_food       BOOLEAN DEFAULT FALSE,
  includes_health     BOOLEAN DEFAULT FALSE,
  includes_body       BOOLEAN DEFAULT FALSE,
  built_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '6 hours',
  invalidated_at      TIMESTAMPTZ
);

ALTER TABLE ai_prompt_context_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_prompt_cache" ON ai_prompt_context_cache
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `ai_conversation_threads` (Phase 2)

For when users can chat with the AI directly.

```sql
CREATE TABLE ai_conversation_threads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  message_count   INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threads_user ON ai_conversation_threads(user_id, last_message_at DESC);

ALTER TABLE ai_conversation_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_threads" ON ai_conversation_threads
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `ai_conversation_messages` (Phase 2)

```sql
CREATE TABLE ai_conversation_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id       UUID NOT NULL REFERENCES ai_conversation_threads(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,        -- user | assistant
  content         TEXT NOT NULL,
  embedding       VECTOR(768),
  context_used    JSONB,
  tokens_used     INT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON ai_conversation_messages(thread_id, sent_at ASC);
CREATE INDEX idx_messages_user ON ai_conversation_messages(user_id);

ALTER TABLE ai_conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_messages" ON ai_conversation_messages
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `daily_health_cache`

Daily HealthKit snapshot. Written by Go when mobile syncs.

```sql
CREATE TABLE daily_health_cache (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_date             DATE NOT NULL,
  steps                   INT,
  sleep_hours             NUMERIC(4,2),
  sleep_deep_hours        NUMERIC(4,2),
  resting_heart_rate      INT,
  heart_rate_variability  NUMERIC(5,1),
  calories_burned         INT,
  calories_bmr            INT,
  vo2_max                 NUMERIC(4,1),
  stand_hours             INT,
  mindful_minutes         INT,
  workouts                JSONB,            -- array of HealthKit workouts that day
  source                  TEXT NOT NULL DEFAULT 'apple_health',
  synced_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_health_per_day UNIQUE (user_id, health_date)
);

CREATE INDEX idx_health_cache_user_date ON daily_health_cache(user_id, health_date DESC);

ALTER TABLE daily_health_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_health_cache" ON daily_health_cache
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## Utility functions

```sql
-- Get semantically similar past insights before generating a new one
CREATE OR REPLACE FUNCTION get_relevant_insights(
  p_user_id         UUID,
  p_query_embedding VECTOR(768),
  p_limit           INT DEFAULT 3
)
RETURNS TABLE (
  id            UUID,
  title         TEXT,
  summary       TEXT,
  insight_type  TEXT,
  week_start    DATE,
  similarity    FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uai.id, uai.title, uai.summary, uai.insight_type, uai.week_start,
    (1 - (uai.embedding <=> p_query_embedding))::FLOAT AS similarity
  FROM user_ai_insights uai
  WHERE uai.user_id = p_user_id AND uai.embedding IS NOT NULL
  ORDER BY uai.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```