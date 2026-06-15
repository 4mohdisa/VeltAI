# Gamification System

## Core principles

1. **Integrity over inflation.** XP must be hard to earn. Every rule prevents the LOCKED exploit pattern.
2. **Meaningful not decorative.** Ranks unlock things. Reaching a rank feels like an achievement.
3. **Consistency over volume.** Going to the gym 4 days/week for a month beats 7 days then quitting.

## MVP scope

Gamification ships in MVP but kept light:

- XP only from gym sessions and food logging
- Ranks based on total XP
- Streak freezes
- No leaderboard (Phase 2, needs user base)

---

## XP earning rules (MVP)

### Gym

| Action | XP | Rules |
| --- | --- | --- |
| Log a gym session | 25 XP | Once per UTC day. Idempotent. |
| 7-day streak | 50 XP bonus | One-time per streak milestone |
| 30-day streak | 200 XP bonus | One-time per streak milestone |
| 100-day streak | 500 XP bonus | One-time per streak milestone |
| HealthKit verified workout | +5 XP | Bonus if workout detected in HealthKit |

### Food tracking

| Action | XP | Rules |
| --- | --- | --- |
| Log a meal (manual) | 5 XP | Once per meal slot per day. Max 4 slots. |
| Log a meal via photo scan | 8 XP | Replaces manual XP for that slot. |
| Log a meal via voice | 8 XP | Replaces manual XP for that slot. |
| Complete uncertainty prompt | +3 XP | Bonus only if all uncertain items were addressed |
| Hit daily calorie goal (±10%) | 15 XP | Awarded by midnight cron |

### General

| Action | XP | Rules |
| --- | --- | --- |
| Daily app open | 2 XP | Max once per UTC day |
| Complete onboarding | 50 XP | One-time |
| First gym session ever | 30 XP | One-time |
| First 7-day gym streak | 50 XP | One-time |

### Daily XP cap

Max ~100 XP/day at full play. Prevents grinding from dominating leaderboards (when launched).

---

## Idempotency

Every XP award goes through one Go function:

```go
AwardXP(userID, source, referenceID, amount)
```

Which inserts into `xp_ledger`:

```sql
INSERT INTO xp_ledger (user_id, source, reference_id, amount)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, source, reference_id) DO NOTHING;
```

Unique constraint on `(user_id, source, reference_id)` makes double-awarding impossible at the DB level. Application-level checks are not enough.

**Total XP is never stored as a counter.** Always computed live:

```sql
SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE user_id = $1;
```

---

## Streak mechanics

### How gym streaks work

- A streak increments when a gym session is logged on a UTC day
- Breaks if a UTC day passes with no session AND no streak freeze
- One "gym streak" per user (not per habit — only one habit in MVP)

### Streak freeze tokens

- Awarded at rank milestones (see below)
- Consuming a freeze protects one day from breaking the streak
- User must apply the freeze BEFORE midnight UTC
- Max 2 tokens held at any time
- Freezes do NOT award XP — they just preserve the streak

---

## Rank progression

| Rank | XP needed | Unlocks |
| --- | --- | --- |
| Recruit | 0 | Default |
| Contender | 500 | Leaderboard access (Phase 2) |
| Locked In | 2,000 | 1 streak freeze token · Bronze badge |
| Grinder | 5,000 | Silver badge · Custom habit icons |
| Elite | 15,000 | 2 streak freezes · Gold badge · Dark theme |
| Untouchable | 50,000 | Platinum badge · All themes · Priority support |

**Rules:**

- Ranks are permanent. You don't lose a rank.
- Streak freezes granted at rank-up are one-time grants.
- All unlocks are cosmetic. Nothing paywalled.

---

## Anti-cheat rules (server-side enforcement)

1. `UNIQUE(user_id, source, reference_id)` on `xp_ledger`
2. Bonus XP for milestones awarded only by midnight cron, never on-demand
3. Streak milestones tracked in `streak_milestones_claimed` — cannot re-claim
4. No client can directly write to `xp_ledger` — Go endpoints only
5. All XP events timestamped and auditable

---

## Visual feedback

LOCKED's biggest UX failure: levelling up felt empty. Every XP event in Veltai must feel satisfying.

- **Gym session logged**: large XP number floats up, confetti for streak milestones
- **Rank up**: full-screen modal with rank name, badge animation, list of unlocks
- **Streak milestone**: flame animation on streak counter, XP notification
- **All animations run on UI thread** via Reanimated 3 — never JS thread