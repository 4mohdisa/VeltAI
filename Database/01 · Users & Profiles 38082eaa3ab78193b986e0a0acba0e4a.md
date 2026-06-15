# 01 · Users & Profiles

Core identity tables. Synced from Clerk via webhook.

---

## Tables

### `users`

Minimal record synced from Clerk on `user.created` webhook. `clerk_id` is the source of truth for identity.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id      TEXT NOT NULL UNIQUE,         -- Clerk user ID (e.g. user_2abc...)
  email         TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ                   -- soft delete
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_record" ON users
  USING (clerk_id = auth.uid()::TEXT);
```

### `user_profiles`

Extended profile data — 1:1 with users. Populated during onboarding.

```sql
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL,
  avatar_url            TEXT,
  timezone              TEXT NOT NULL DEFAULT 'UTC',  -- display only, all data UTC
  units_system          TEXT NOT NULL DEFAULT 'metric', -- metric | imperial
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  streak_freeze_tokens  INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON user_profiles
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

### Auto-update trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```