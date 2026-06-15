# 11 · XP & Gamification

Append-only XP ledger with idempotency at the database level. **No XP total is ever stored as a counter.**

---

## `xp_ledger`

The single most important integrity table. Every XP event is appended here. Same event cannot award XP twice — enforced by unique constraint.

```sql
CREATE TABLE xp_ledger (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source          TEXT NOT NULL,
    -- gym_session
    -- gym_session_healthkit_verified
    -- streak_milestone_7
    -- streak_milestone_30
    -- streak_milestone_100
    -- meal_logged_manual
    -- meal_logged_photo
    -- meal_logged_voice
    -- meal_logged_barcode
    -- uncertainty_prompt_complete
    -- calorie_goal_hit
    -- protein_goal_hit
    -- daily_login
    -- onboarding_complete
    -- first_gym_session
    -- first_food_scan
  reference_id    TEXT NOT NULL,
    -- For gym_session: gym_sessions.id
    -- For daily_login: user_id || '_' || UTC date
    -- For streak_milestone_X: user_id || '_' || X (one per milestone per user)
    -- For meal_logged_*: meals.id
  amount          INT NOT NULL,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- THE CORE CONSTRAINT — same event cannot award XP twice
  CONSTRAINT uq_xp_event UNIQUE (user_id, source, reference_id)
);

CREATE INDEX idx_xp_user ON xp_ledger(user_id);
CREATE INDEX idx_xp_awarded ON xp_ledger(user_id, awarded_at DESC);

ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_read_own" ON xp_ledger
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
-- No INSERT/UPDATE/DELETE for users — service role only.
```

---

## `user_ranks`

Current rank, cached for fast reads. Always equals `SUM(xp_ledger.amount)` for the user.

```sql
CREATE TABLE user_ranks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_rank  TEXT NOT NULL DEFAULT 'recruit',
    -- recruit | contender | locked_in | grinder | elite | untouchable
  total_xp      INT NOT NULL DEFAULT 0,
  ranked_up_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Thresholds (enforced in Go):
-- recruit:      0
-- contender:    500    → leaderboard access
-- locked_in:    2000   → 1 freeze token, bronze badge
-- grinder:      5000   → silver badge, custom icons
-- elite:        15000  → 2 freeze tokens, gold badge, dark theme
-- untouchable:  50000  → platinum badge, all themes, priority support

ALTER TABLE user_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks_read_own" ON user_ranks
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `streak_milestones_claimed`

Tracks which streak milestone bonuses a user has claimed.

```sql
CREATE TABLE streak_milestones_claimed (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone     INT NOT NULL,             -- 7 | 30 | 100
  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_milestone_claim UNIQUE (user_id, milestone)
);

ALTER TABLE streak_milestones_claimed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_read_own" ON streak_milestones_claimed
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## Utility functions

```sql
-- Source of truth for user's total XP
CREATE OR REPLACE FUNCTION get_user_total_xp(p_user_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(SUM(amount), 0)::INT
  FROM xp_ledger
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;
```

---

## Weekly leaderboard view (Phase 2)

```sql
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT
  u.id AS user_id,
  up.display_name,
  up.avatar_url,
  ur.current_rank,
  SUM(xl.amount) AS weekly_xp,
  RANK() OVER (ORDER BY SUM(xl.amount) DESC) AS position
FROM xp_ledger xl
JOIN users u ON u.id = xl.user_id
JOIN user_profiles up ON up.user_id = u.id
JOIN user_ranks ur ON ur.user_id = u.id
WHERE
  xl.awarded_at >= date_trunc('week', NOW())
  AND ur.current_rank != 'recruit'
  AND u.deleted_at IS NULL
GROUP BY u.id, up.display_name, up.avatar_url, ur.current_rank;
```