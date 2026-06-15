# Database

All schemas are PostgreSQL 16. Hosted on Supabase (managed PostgreSQL + pgvector + Storage).

Row-Level Security (RLS) is enabled on every table. Users can only read/write their own rows.

All dates and timestamps are stored in UTC. Daily resets use UTC date boundaries.

---

## File index

| # | File | Purpose |
| --- | --- | --- |
| 01 | Users & Profiles | Core identity (synced from Clerk) and display profile |
| 02 | Onboarding Responses | Raw answers to every onboarding question — the audit trail |
| 03 | Health Context | Body stats, demographics, dietary profile, supplements, hydration |
| 04 | Schedule | Daily routine, meal slots, gym time, sleep schedule |
| 05 | Goals | Multi-goal support — weight, gym frequency, sleep, etc. |
| 06 | Gym Tracking | The single habit type for MVP — sessions, streaks, freezes |
| 07 | Food Tracking | Meals, food items, multi-photo per meal, voice transcripts |
| 08 | AI-Generated Plans | Daily calorie targets, meal plans, gym schedules |
| 09 | AI Memory | 10 tables for per-user long-term memory + pgvector |
| 10 | App Lockout | Lockout settings, app blocklist, lockout event log |
| 11 | XP & Gamification | Append-only XP ledger, ranks, milestone claims |
| 12 | Notifications | Preferences, scheduled notifications, AI nudge log |
| 13 | Training Pipeline | Anonymised correction dataset and training runs |

---

## Key design principles

### 1. No XP total stored as a counter

Total XP is always `SUM(amount) FROM xp_ledger WHERE user_id = $1`. Never stored as a number that could drift or be manipulated.

### 2. Idempotency via unique constraints

Every action that awards XP has a unique constraint that makes double-awarding impossible at the database level. Application-level checks are not enough — LOCKED tried that and got farmed.

### 3. Soft deletes

Habits, goals, clients are never hard-deleted. `deleted_at` timestamp marks them inactive. Preserves historical completion data and XP ledger integrity.

### 4. Onboarding answers are raw + derived

`onboarding_responses` stores raw user answers. The structured tables (health_context, schedule, dietary_profile, etc.) are populated from those answers. This means we can re-run AI analysis with better models later without losing the original input.

### 5. RLS policy pattern

Every table follows this pattern:

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only access own data" ON [table]
  USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));
```

For the training dataset table, RLS is service-role only — no user access ever.

---

## Entity relationships at a glance

```
users (clerk identity)
  └ user_profiles (display, rank, prefs)
  └ onboarding_responses (raw answers history)
  └ user_body_stats (weight, height history)
  └ user_demographics (ethnicity, country)
  └ user_dietary_profile (eating window, restrictions, cuisines)
  └ user_supplements (whey timing, etc.)
  └ user_hydration (water target)
  └ user_schedule (wake/work/gym/sleep times)
  └ user_meal_schedule (meal slots and target macros)
  └ user_goals (multi-goal)
  └ gym_habit (singleton per user)
        └ gym_sessions (actual attendance with location verification)
        └ gym_streak_freezes
  └ meals
        └ food_items
        └ meal_photos (multiple per meal)
        └ food_scan_logs
              └ food_scan_corrections
        └ voice_meal_logs
  └ ai_daily_targets (calorie + macro target per day)
  └ ai_meal_plans (AI-generated weekly meal plans)
  └ ai_gym_schedules (AI-generated weekly gym plan)
  └ ai_memory tables (10 tables — see schema 09)
  └ user_lockout_settings
        └ lockout_events
        └ app_blocklist
  └ xp_ledger (append-only)
  └ user_ranks
  └ streak_milestones_claimed
  └ notification_preferences
  └ scheduled_notifications
```

Detailed table definitions are in the child pages below.

[01 · Users & Profiles](Database/01%20%C2%B7%20Users%20&%20Profiles%2038082eaa3ab78193b986e0a0acba0e4a.md)

[02 · Onboarding Responses](Database/02%20%C2%B7%20Onboarding%20Responses%2038082eaa3ab7811ea709cb3d46a836d9.md)

[03 · Health Context](Database/03%20%C2%B7%20Health%20Context%2038082eaa3ab78181a5b3df9b643c5013.md)

[04 · Schedule](Database/04%20%C2%B7%20Schedule%2038082eaa3ab78132ae81ef32ae785741.md)

[05 · Goals](Database/05%20%C2%B7%20Goals%2038082eaa3ab78150b2efcecb6d86f140.md)

[06 · Gym Tracking](Database/06%20%C2%B7%20Gym%20Tracking%2038082eaa3ab78100a30ce8768448d967.md)

[07 · Food Tracking](Database/07%20%C2%B7%20Food%20Tracking%2038082eaa3ab781458c48d4cb3253bc35.md)

[08 · AI-Generated Plans](Database/08%20%C2%B7%20AI-Generated%20Plans%2038082eaa3ab78164a287de586b604793.md)

[09 · AI Memory](Database/09%20%C2%B7%20AI%20Memory%2038082eaa3ab781b78d82c8cb1b1ceeae.md)

[10 · App Lockout](Database/10%20%C2%B7%20App%20Lockout%2038082eaa3ab781d7b10cc7d1169835df.md)

[11 · XP & Gamification](Database/11%20%C2%B7%20XP%20&%20Gamification%2038082eaa3ab78162ad78cffd92e2470f.md)

[12 · Notifications](Database/12%20%C2%B7%20Notifications%2038082eaa3ab7815e9353dba944f99b2d.md)

[13 · Training Pipeline](Database/13%20%C2%B7%20Training%20Pipeline%2038082eaa3ab781eea1f7f4fd09f36ec7.md)