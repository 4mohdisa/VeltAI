# Features

Every feature in Veltai serves the same goal: make going to the gym (and eating well, sleeping well) the easy choice.

---

## MVP feature list

| # | Feature | Why it ships in MVP |
| --- | --- | --- |
| 01 | Comprehensive Onboarding | The AI is only as good as the data it has. Onboarding is where 90% of the personalisation comes from. |
| 02 | Gym Habit Tracking | The single habit type for MVP. Focused, not diluted across 10 habit types. |
| 03 | Food Tracking (photo + voice + barcode + manual) | The other half of the health equation. Voice is the differentiator vs Cal AI. |
| 04 | AI Daily Plan Generation | Daily calorie target, meal schedule, gym time — personalised per user, regenerated based on real outcomes. |
| 05 | App Lockout System | The behavioural lever. Blocks distracting apps until today's gym session is logged. |
| 06 | HealthKit Integration | Sleep, steps, heart rate — inputs the AI uses to spot patterns. |
| 07 | Notifications & Push | Daily reminders, streak alerts, gym time warnings. |
| 08 | XP & Gamification | Tied to consistency. Rank unlocks cosmetics. No XP farming possible by design. |

---

## Feature philosophy

### Onboarding is not a form, it's a conversation

We ask comprehensive questions: weight, height, age, ethnicity, eating habits, work schedule, sleep pattern, gym history, supplement use, what they cook vs eat out, what their goals actually are, why they keep failing.

Every answer goes into structured tables. Every answer becomes context the AI uses.

### Lockout is opt-in but strongly nudged

We don't surprise users with app blocking. During onboarding we explain it, show a demo, and ask if they want to enable it. Most will say yes — they're paying us to help them stop scrolling.

Lockout integrates with iOS Family Controls / Screen Time API. This requires an Apple entitlement that's hard to get for indie devs. **Fallback:** aggressive notifications + lock screen widgets + Shortcuts integration until entitlement approved.

### Voice is for fast food entry

"I had two eggs scrambled with toast and butter for breakfast" → transcribed via iOS Speech framework or Whisper API → sent to Gemini to parse into structured food items → user confirms.

Faster than typing. More accurate than guessing from a photo of toast on a plate.

### Food photos store multiple per meal

Users should photograph the food, the macro nutrition label if visible, and the leftover plate (for portion verification). All three are linked to one meal. AI uses all three for accuracy.

---

## Feature pages below

Each feature has its own page with:

- User story
- UX flow
- Data tables touched
- AI integration points
- Edge cases and failure modes

[01 · Onboarding Flow](Features/01%20%C2%B7%20Onboarding%20Flow%2038082eaa3ab78179b27ec618a281d3a0.md)

[02 · Gym Habit Tracking](Features/02%20%C2%B7%20Gym%20Habit%20Tracking%2038082eaa3ab781569700e8bd73f66dc0.md)

[03 · Food Tracking](Features/03%20%C2%B7%20Food%20Tracking%2038082eaa3ab7817aa166c3aaff749d29.md)

[04 · AI Coach & Plan Generation](Features/04%20%C2%B7%20AI%20Coach%20&%20Plan%20Generation%2038082eaa3ab781308803d46b237cf3b1.md)

[05 · App Lockout System](Features/05%20%C2%B7%20App%20Lockout%20System%2038082eaa3ab78123a8c5e1c69a467b4c.md)

[06 · HealthKit Integration](Features/06%20%C2%B7%20HealthKit%20Integration%2038082eaa3ab781448788f9e7eb3689a2.md)

[07 · Notifications & Push](Features/07%20%C2%B7%20Notifications%20&%20Push%2038082eaa3ab781169aacfd65aa0adbaf.md)

[08 · XP & Gamification](Features/08%20%C2%B7%20XP%20&%20Gamification%2038082eaa3ab7811e8589c9a19b66de0f.md)