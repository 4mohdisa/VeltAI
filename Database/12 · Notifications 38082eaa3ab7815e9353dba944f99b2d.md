# 12 · Notifications

Notification preferences, scheduled notifications, and AI nudge log.

---

## `notification_preferences`

1:1 with users.

```sql
CREATE TABLE notification_preferences (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  push_enabled                BOOLEAN NOT NULL DEFAULT TRUE,

  -- Per-category toggles
  push_gym_reminder           BOOLEAN NOT NULL DEFAULT TRUE,
  push_meal_reminder          BOOLEAN NOT NULL DEFAULT TRUE,
  push_sleep_reminder         BOOLEAN NOT NULL DEFAULT TRUE,
  push_streak_alert           BOOLEAN NOT NULL DEFAULT TRUE,
  push_lockout_alert          BOOLEAN NOT NULL DEFAULT TRUE,
  push_milestone              BOOLEAN NOT NULL DEFAULT TRUE,
  push_weekly_digest          BOOLEAN NOT NULL DEFAULT TRUE,
  push_ai_nudge               BOOLEAN NOT NULL DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start           TIME DEFAULT '22:00',
  quiet_hours_end             TIME DEFAULT '07:00',

  -- Frequency limits
  max_notifications_per_day   INT DEFAULT 6,
  notifications_sent_today    INT DEFAULT 0,
  daily_reset_at              TIMESTAMPTZ,

  -- Device token (for FCM/APNs)
  apns_token                  TEXT,
  apns_environment            TEXT DEFAULT 'production',  -- production | sandbox

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_own" ON notification_preferences
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `scheduled_notifications`

Queue of upcoming notifications. Worked off by a background Go job.

```sql
CREATE TABLE scheduled_notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  notification_type   TEXT NOT NULL,
    -- gym_reminder              before scheduled gym time
    -- meal_reminder             before scheduled meal time
    -- sleep_reminder            before scheduled bedtime
    -- streak_at_risk            no session yet today, streak ending tonight
    -- lockout_active            apps are now blocked, gym not logged
    -- milestone_close           1-2 days from streak milestone
    -- weekly_digest             Monday morning digest is ready
    -- ai_nudge                  contextual AI-generated reminder

  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  deep_link           TEXT,                 -- which screen to open
  badge_count         INT,
  sound               TEXT DEFAULT 'default',

  scheduled_for       TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
    -- pending | sent | failed | cancelled
  sent_at             TIMESTAMPTZ,
  failed_reason       TEXT,
  opened_at           TIMESTAMPTZ,          -- user tapped the notification
  cancelled_at        TIMESTAMPTZ,

  metadata            JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_pending ON scheduled_notifications(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_notif_user ON scheduled_notifications(user_id, scheduled_for DESC);

ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduled_notif_own" ON scheduled_notifications
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## `ai_nudge_log`

Every AI-generated suggestion that has been sent. Prevents repetition ("drink more water" every week).

```sql
CREATE TABLE ai_nudge_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nudge_type      TEXT NOT NULL,
    -- gym_skipped_too_long       3+ days since last session
    -- protein_under_target       weekly protein below target
    -- sleep_drop                 sleep declining trend
    -- streak_at_risk             streak ends tonight if no session
    -- milestone_close            2 days from streak milestone
    -- weekly_digest              the weekly insight package
    -- positive_feedback          best week in 30 days
    -- food_suggestion            specific food suggestion based on patterns
  nudge_text      TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'push',
    -- push | in_app | both
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at       TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  acted_on        BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_nudge_user ON ai_nudge_log(user_id, sent_at DESC);
CREATE INDEX idx_nudge_type_recent ON ai_nudge_log(user_id, nudge_type)
  WHERE sent_at > NOW() - INTERVAL '7 days';

ALTER TABLE ai_nudge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nudge_log_own" ON ai_nudge_log
  USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::TEXT));
```

---

## Nudge generation rules

Before generating a nudge, the Go service checks `ai_nudge_log`:

- **Same `nudge_type` in the last 7 days?** Don't send (avoid repetition)
- **Already sent 6 notifications today?** Don't send (respect cap)
- **In quiet hours?** Schedule for end of quiet hours
- **User dismissed last 3 of this type?** Switch to a different nudge_type or stop trying