# 08 · XP & Gamification

XP earning and rank progression are governed by the gamification system (see top-level Gamification page for full rules). This page covers the **feature-level user experience** — how XP, ranks, and streaks feel from the user's perspective.

---

## User story

> I want my effort to feel acknowledged. When I go to the gym, I want to see a number go up. When I hit a milestone, I want a moment that feels like an achievement — not a colour change. And I want the rewards to be cosmetic, never paywalled, never something I lose if I stop subscribing.
> 

---

## Where XP shows up in the UI

### Dashboard

- Today's XP earned (small number, top right of screen)
- Current rank badge + name (e.g., "Locked In")
- Streak count with flame icon (the most prominent stat)
- Streak freeze tokens (snowflake icons next to streak)

### Profile screen

- Total XP (lifetime)
- Current rank with progress bar to next rank
- Recent XP events (last 7 days, grouped by day)
- Rank-up history (when each rank was achieved)
- Active perks (badge, theme unlock, freezes available)

### Gym log moment (the hero animation)

- Tap "Log gym session"
- 800ms animation:
    - Button morphs into checkmark
    - "+25 XP" floats up from the button (Reanimated 3, UI thread)
    - Streak counter ticks up with flame burst
    - If streak hits milestone: confetti + milestone modal
    - If rank crosses threshold: full-screen rank-up modal (after milestone modal if both)

### Meal log moment (smaller)

- Tap "Save meal"
- 400ms animation: "+8 XP" floats up, calorie ring on dashboard tick up

---

## Rank-up modal (the big moment)

When a user crosses a rank threshold (e.g. 2000 XP → Locked In):

```
Full-screen modal slides up

  [Animated rank badge — e.g. a bronze shield emerging]

  RANK UP
  Locked In

  You've unlocked:
  • 1 streak freeze token (use it on a rest day)
  • Bronze profile badge
  • Leaderboard access (when available)

  [Continue]
```

- Modal can be dismissed but auto-saves a "received" event
- The unlocks are tangible (the freeze token actually gets granted in `user_profiles.streak_freeze_tokens`)
- Modal appears after the XP animation, never in the middle of it
- Modal is queueable — if user logs 50 actions in one go and crosses 2 ranks, both modals show sequentially

---

## Streak milestone modal (7 / 30 / 100 days)

Similar full-screen treatment, focused on the streak:

```
[Large flame animation, fire intensifying]

30 DAY STREAK
Untouchable consistency.

+200 XP earned
+1 streak freeze token

[See your stats]  [Continue]
```

This is also where Veltai prompts for an App Store review for the first time — only after a 7-day streak, never before. iOS `SKStoreReviewController.requestReview()`.

---

## Streak freeze token UX

Freeze tokens are the most valuable cosmetic perk because they preserve the streak.

```
Dashboard → tap streak counter → streak detail screen
  ↓
Shows: current streak, longest ever, freeze tokens available
  ↓
For each upcoming day in next 7 days:
  - If user has session logged: green check
  - If user has applied freeze: snowflake
  - Empty days: tap to apply freeze (if tokens available)
  ↓
Confirmation: "Use 1 freeze for Sunday (rest day)?"
Tap confirm → INSERT INTO gym_streak_freezes, decrement user_profiles.streak_freeze_tokens
```

Freezes can be applied for **future days only**, never retroactively. This prevents "oh I forgot, let me freeze yesterday" — that's a streak break, not a planned rest.

---

## Anti-cheat from the user's perspective

Users won't see the database constraints, but they will experience their effects:

- Tap log twice in 2 seconds → only +25 XP shows (not +50)
- Try to log yesterday's session today → allowed only before noon, otherwise rejected with clear message
- Try to delete and re-log to earn XP again — delete is allowed but doesn't re-grant XP
- Manipulate device clock to "complete" a day → server uses its own UTC, ignores device clock

None of these are presented as "anti-cheat" — the messaging is always positive ("You already logged today! Come back tomorrow for your next session.")

---

## Tables touched

- `xp_ledger` — inserted by various endpoints (gym, meals, milestones), never directly by client
- `user_ranks` — updated when XP total crosses threshold
- `streak_milestones_claimed` — one row per claimed milestone per user
- `user_profiles.streak_freeze_tokens` — incremented on rank-up, decremented on apply
- `gym_streak_freezes` — inserted when freeze applied

---

## Edge cases

| Case | Handling |
| --- | --- |
| User in offline mode logs a session | Mobile queues the action with idempotency key. Replays on reconnect. Animation plays optimistically. Server is source of truth on conflict. |
| Animation runs while server returns error | Animation rolls back (XP number reverts), error toast appears, retry button shown |
| User crosses 2 rank thresholds in one event (e.g. completing onboarding + first session simultaneously) | Modals queue and show sequentially |
| User has paused subscription — do they keep their rank? | Yes. Rank is earned, not rented. They lose access to AI features but keep their XP/rank/streak data. |
| User unsubscribes entirely — do they keep their data? | Yes. Data is preserved. If they re-subscribe later, full history is intact. |
| Streak freeze applied but then user does go to gym that day | Session logs normally. Freeze is consumed regardless (one freeze per day max). |

---

## What's NOT in MVP

- Leaderboards (Phase 2 — schema ready)
- Friends / social
- Custom badges
- Achievements beyond ranks and streaks
- XP boost events
- Daily challenges

---

## Success metrics

- 7-day streak achievement rate among trial users > 35%
- 30-day streak achievement rate among paying users (3 months in) > 15%
- Rank-up modal completion rate (user taps "Continue") > 90%
- Streak freeze token usage rate (applied vs granted) > 60%
- App Store rating prompt acceptance rate (only fires after 7-day streak) > 25%