# 01 · Onboarding Flow

# Onboarding Flow

The most important feature in the app. Not data collection — relationship building. By the end of these screens, the user should feel: "this app gets me, this is what I've been looking for, and 14 days is fair."

## The 5-phase model

| Phase | Screens | Goal |
| --- | --- | --- |
| 1 — Ask about their problems | 2-4 | Surface their struggle so they know we're listening |
| 2 — Make them feel understood | 5 | Reflect back what we heard. Frame the problem. |
| 3 — Show how we'll solve it | 6-12 | Capture data, but frame each question as "to help you" |
| 4 — Wow moment | 13 | Show them their personalised future before they pay |
| 5 — Transparent paywall | 14-17 | No dark patterns. Explain the 14-day trial. |

Total: ~13 active question screens, target 4-6 minutes.

---

## Phase 1 — Ask about their problems (screens 2-4)

### Screen 2: What's been getting in the way?

Multi-select, framed as understanding not interrogation.

```
What's been stopping you from being where you want to be?
(pick as many as you like)

  ◯ Motivation — I just don't feel like it
  ◯ Time — too busy, never gets done
  ◯ Energy — I'm too tired after work
  ◯ Knowledge — I don't know what I'm doing
  ◯ Intimidation — gym feels awkward
  ◯ Food noise — I keep grazing without thinking
  ◯ Injury or pain
  ◯ Something else
```

Stored as `gym_main_struggle` (multi-select) in `onboarding_responses`.

### Screen 3: What have you tried?

```
What hasn't stuck for you so far?

  ◯ Gym memberships I stopped using
  ◯ Diet plans that didn't last
  ◯ Personal trainers
  ◯ Other fitness or calorie apps
  ◯ Just willpower
  ◯ Nothing yet — this is my first try
```

This is calibration data for the AI. If they've tried 4 things and bounced from all, the AI knows to make the first week extra forgiving.

### Screen 4: What frustrates you about fitness apps?

```
If you've used apps like this before — what was wrong with them?
(optional, skip if you haven't)

  ◯ Got it wrong about my food
  ◯ Too many notifications
  ◯ Felt judged or shamed
  ◯ Hidden pricing or sneaky charges
  ◯ Boring after a few days
  ◯ Tried to sell me supplements
  ◯ Free text
```

The free text answer becomes a powerful AI prompt hint: "the user previously left fitness apps because [reason]. Avoid that pattern."

---

## Phase 2 — Make them feel understood (screen 5)

### Screen 5: Reflection

No input. Pure copy. The most important screen in onboarding.

```
Okay. Here's what we hear.

You have the motivation. (You're here.)
You don't have the system that works for you.

Most apps add one more thing to remember.
We remove the friction instead.

  • Your phone helps you, not distracts you
  • Your food log takes 5 seconds, not 5 minutes
  • Your AI coach knows your life, not generic advice

Let's set you up.
                                    [Continue]
```

The reflection works because it mirrors back exactly what they picked on screens 2-3. Copy is conditional:

| User picked | Reflection line |
| --- | --- |
| Motivation | "You have the motivation (you're here)" |
| Time | "Your day is full. We work within it." |
| Knowledge | "You don't have to figure this out. We do." |
| Food noise | "We make food logging take 5 seconds, not 5 minutes." |
| Intimidation | "You don't need to know everything to start." |

---

## Phase 3 — Show how we'll solve it (screens 6-12)

Same data we always capture, reframed as "to help you" rather than "fill this in."

### Screen 6: Goal

"Where do you want to be in 90 days? Big or small, we plan around it."

- Primary goal: lose weight, build muscle, gym consistency, eat better, improve sleep, general health
- If weight: target weight + target date
- Stored: `user_goals` (primary = true)

### Screen 7: Why

"Why does this matter to you?" — free text, optional but emphasised

- Stored: `user_goals.why_text`
- Used by AI in nudges later: "Remember why you started — your brother's wedding is in 90 days."

### Screen 8: About you

Body stats — weight, height, age, sex on one screen (4 inputs)

Stored: `user_body_stats`

### Screen 9: Your day

"What does your day look like?" — wake, sleep, preferred gym time

Stored: `user_schedule`

### Screen 10: Your gym

"Where are you at with the gym?" — current freq, target freq

Stored: `gym_habit`

### Screen 11: Your eating

"How do you eat?" — meals/day, dietary restrictions, allergies

Stored: `user_dietary_profile`

### Screen 12: Your cuisines

"What do you actually eat?" — favourite cuisines, cooks at home (yes/no)

Stored: `user_dietary_profile`. Critical for AI food accuracy.

---

## Phase 4 — Wow moment (screen 13)

Personalised projection. The user just told us everything. Now we show them their future.

### Top half: 90-day projection

Animated weight curve from current → target over 90 days. Markers at week 4, 8, 12. Below the chart: "Hit goal on Mon 28 Dec 2026."

### Middle: tomorrow's plan, fully personalised

```
Tomorrow, Tuesday 16 June

07:00  Breakfast — 500 kcal target
       Suggested for you: oats with whey, eggs and paratha,
                          chicken sandwich

12:30  Lunch — 600 kcal target
       Suggested: chicken biryani, lentil dal with rice,
                  grilled fish with vegetables

18:00  Gym — your preferred time
       4 sessions this week

19:30  Dinner — 650 kcal target
       Higher protein because you trained today

22:30  Wind down — your target bedtime
```

The food suggestions match their cuisine preferences. The times match their schedule. The gym is at their chosen hour.

### Bottom: lockout preview (if opted in)

```
And tonight at 19:00 if you haven't gone yet:

[mock screenshot of Instagram with Veltai blocking overlay]

You'll see this until you log today's session.
                                    [Continue]
```

This is the wow. Not "you can use this app." But "this is your life, planned by the app."

---

## Phase 5 — Transparent paywall (screens 14-17)

### Screen 14: Lockout setup

- Opt-in for app lockout
- App picker (Instagram, TikTok, X, YouTube + custom)
- Enforcement window (evening only / all day)
- Stored: `user_lockout_settings`, `lockout_app_blocklist`

### Screen 15: Permissions

- HealthKit (with copy explaining what we read and why)
- Notifications (with copy explaining what we send)

### Screen 16: The paywall (the trust-building screen)

Direct, dated, with reasoning. No dark patterns.

```
14 days free.
Then A$9.99 per month.

Your free trial:
   Starts today    Mon 15 Jun 2026
   Ends            Mon 29 Jun 2026

After your trial:
   Renews monthly at A$9.99
   Cancel anytime in iPhone Settings
   We'll remind you 2 days before your trial ends

WHY 14 DAYS?

We could have given you 3 days. Most apps do.
3 days isn't enough to feel anything.

14 days means you'll log 14+ meals, hit a gym streak,
watch the lockout work. You'll know if Veltai earns
its place on your phone before we charge you a cent.

We're not trying to trick you. We're letting the
product sell itself.

            [Start free trial]

   [What's included]    [Restore purchases]
```

Three commitments embedded in this screen:

1. **Real dates** rendered for the user — no "after 14 days" hand-waving
2. **Reminder 2 days before** trial ends — actually scheduled to `scheduled_notifications`
3. **Why 14 days** explanation — builds trust, differentiates from competitors

### Screen 17: First plan generating (loading)

AI runs in background generating `ai_daily_targets`, `ai_meal_plans`, `ai_gym_schedules`. Loading screen plays ~5-10 seconds. On success: navigate to dashboard.

---

## Tables touched

`onboarding_responses` (raw audit), `user_profiles`, `user_body_stats`, `user_demographics`, `user_schedule`, `user_dietary_profile`, `user_goals`, `gym_habit`, `user_lockout_settings`, `lockout_app_blocklist`, `notification_preferences`, `ai_daily_targets`, `ai_meal_plans`, `ai_gym_schedules`.

## Success metrics

- Completion rate (start to dashboard) > 60%
- Drop-off heatmap watched per screen to iterate
- Trial-to-paid conversion > 20% by day 16
- Lockout opt-in rate > 50%
- Wow-screen → paywall conversion (people don't bail after wow) > 85%