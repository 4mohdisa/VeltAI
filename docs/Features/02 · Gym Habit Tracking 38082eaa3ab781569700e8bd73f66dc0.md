# 02 · Gym Habit Tracking

The single habit type for MVP. Everything else (food, sleep, lockout) supports this one outcome: **getting the user to the gym.**

---

## User story

> As someone who wants to go to the gym 4 times a week but keeps not going, I want the app to (a) remind me before my preferred gym time, (b) let me log my session in one tap when I'm done, (c) show me my streak so I don't want to break it, and (d) lock my phone if I haven't gone today.
> 

---

## UX flow

### Logging a session — happy path

```
User opens app at 19:30 after gym
  ↓
Dashboard shows: "You haven't logged today's gym session yet"
  ↓
Taps big "Log gym session" button
  ↓
[Optional] Duration slider (15min increments), perceived effort 1-10
  ↓
Taps "Log it"
  ↓
XP +25 floats up with confetti
Streak counter updates: 12 → 13 with flame animation
  ↓
If lockout was active: all blocked apps unlock immediately
  ↓
Return to dashboard
```

### Logging via HealthKit auto-detect

```
User opens app at 19:30
  ↓
Dashboard banner: "We saw a workout in your Health app from 18:00–19:15. Log this as today's gym session?"
  ↓
Tap "Yes" → session logged with verification_source = healthkit_workout, +5 XP bonus
Tap "No" → banner dismissed, user can still log manually
```

### Streak freeze (rest day)

```
User knows they won't go tomorrow (planned rest day)
  ↓
Dashboard → streak section → "Use a freeze"
  ↓
Confirmation: "This will protect tomorrow's streak. You have 2 freezes available."
  ↓
Tap "Apply" → row in gym_streak_freezes for tomorrow's date
  ↓
Streak counter shows tomorrow as "frozen" with snowflake icon
```

### Streak at risk

```
22:00, no gym session today, lockout window started 18:00
  ↓
Push notification: "Your 13-day streak ends in 2 hours"
  ↓
User opens app → dashboard banner urgently styled
  ↓
Options: "Log it now" (if they went late), "Use a freeze", or do nothing
```

---

## Backend data flow

### Logging a session

```
POST /api/gym/sessions
Body: { duration_minutes, perceived_effort, energy_level, notes }

Go handler:
  1. Validate Clerk JWT → user_id
  2. INSERT INTO gym_sessions ON CONFLICT (user_id, session_date) DO NOTHING
     RETURNING id, xp_awarded
  3. If row was inserted (not conflict):
     a. AwardXP(user_id, 'gym_session', session_id, 25)
     b. Check current streak via get_gym_streak(user_id)
     c. If streak hit 7/30/100 milestone AND not in streak_milestones_claimed:
        INSERT into streak_milestones_claimed
        AwardXP(user_id, 'streak_milestone_X', milestone_record_id, [50|200|500])
     d. Recompute total XP → update user_ranks.total_xp
     e. If rank crossed threshold: update user_ranks.current_rank, trigger rank-up event
     f. Lift active lockout (set today's gym_session_logged = TRUE in Redis)
     g. Invalidate ai_prompt_context_cache for this user
     h. Return 201 with full session + XP details
  4. If conflict (already logged today): return 200 with idempotent indicator
```

### HealthKit verification

Mobile sends HealthKit workout details after session is logged. Go updates:

```
UPDATE gym_sessions
SET verification_source = 'healthkit_workout',
    healthkit_workout_id = $1,
    verified_at = NOW()
WHERE id = $2 AND user_id = $3;

AwardXP(user_id, 'gym_session_healthkit_verified', session_id, 5)
```

The second AwardXP call uses a different `source` value, so the unique constraint `(user_id, source, reference_id)` allows it without conflicting with the base session XP.

---

## Tables touched

- `gym_sessions` — insert with ON CONFLICT
- `gym_streak_freezes` — when user applies a freeze
- `gym_habit` — read (to know target frequency)
- `xp_ledger` — multiple inserts (base, verification bonus, milestones)
- `streak_milestones_claimed` — claim once per milestone
- `user_ranks` — recompute total, possibly update rank
- `daily_health_cache` — read for auto-detect
- `lockout_events` — log lockout lift on session
- `ai_prompt_context_cache` — invalidate so next AI call sees updated streak

---

## AI integration

- After every session: `user_habit_patterns` gets updated by daily cron (best day, avg sessions/week, longest streak)
- Missed sessions trigger nudge generation: if 3+ days no session, generate a nudge if `nudge_type='gym_skipped_too_long'` hasn't been sent in last 7 days
- AI plan regeneration uses session adherence as input: if user kept missing 18:00 Tuesdays, AI suggests Wednesday morning instead

---

## Edge cases

| Case | Handling |
| --- | --- |
| User taps log twice in 1 second | First insert succeeds, second hits ON CONFLICT — no double XP |
| User logs at 23:55, then again at 00:05 next UTC day | Both succeed (different `session_date`). Streak increments correctly. |
| User wants to log yesterday (forgot) | Allowed if before noon today and yesterday has no session. Same idempotency rules. |
| User accidentally logs, wants to undo | Toggle works within UTC day. XP removed from ledger. Streak recomputes. |
| HealthKit workout detected but user says "not the gym" | Banner dismissed, no auto-log. |
| User logs at 06:00, then HealthKit detects workout at 07:00 | Update existing session with HealthKit ID, award the +5 bonus once. |
| User's clock is wrong / timezone drift | All session dates are UTC. Display uses user's timezone. Cron uses UTC. |
| Streak should have broken (no session yesterday, no freeze applied) | `get_gym_streak` returns 0. Dashboard shows "streak broken yesterday — start a fresh one today". |

---

## What's NOT in MVP for this feature

- GPS check-in at gym location (Phase 2)
- Workout logging (sets, reps, weights) — just session attendance for MVP
- Apple Watch live workout tracking
- Social features (friends seeing streaks)
- Custom habit types beyond gym

---

## Success metrics

- Session log success rate (HTTP 201 / attempts) > 99.5%
- HealthKit verification rate among iOS users with HealthKit granted > 60%
- 7-day streak achievement rate among trial users > 35%
- Streak freeze usage > 0.3 freezes per user per month (means feature is being discovered)