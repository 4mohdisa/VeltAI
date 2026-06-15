# MVP Scope

iOS only. One habit type (gym). One price. One goal: validate that people will pay A$9.99/month for an honest, AI-powered health performance app with app lockout.

---

## What ships in MVP

### 1. Authentication

- Email + password via Clerk
- Sign in with Apple (required if any social login is added)
- Sign in with Google (optional, only if Apple is also enabled)
- 14-day free trial via RevenueCat → auto-converts to A$9.99/month
- **No free tier.** Trial only.

### 2. Comprehensive Onboarding (must be fast but thorough)

- Body: weight, height, age, sex
- Demographics: country, ethnicity (for cuisine context)
- Eating: meals/day, eating window, dietary restrictions, allergies, favourite cuisines, foods to avoid, eats out vs cooks
- Schedule: wake time, work hours, sleep time, preferred gym time
- Sleep: target hours, current average, sleep issues
- Gym: current frequency, target frequency, preferred days, preferred time of day, gym vs home, training type, experience level, main struggle
- Supplements: protein intake (yes/no, timing), other supplements
- Goals: primary goal (lose weight, build muscle, gym consistency, eat better), target metric, target date, why
- Lockout opt-in: explanation, demo, ask permission to enable Screen Time integration
- HealthKit permission: steps, sleep, heart rate, active energy
- Notification permission
- Paywall (clear pricing, no dark patterns)

### 3. Gym Habit Tracking

- One habit type — gym attendance
- User can mark "went to gym today" with optional duration and notes
- Optional: HealthKit workout detection auto-suggests the completion
- Optional (Phase 2): GPS check-in at known gym location
- Streaks tracked
- Daily reset via Go cron at midnight UTC
- XP awarded (idempotent)
- Streak freeze tokens (rest days)

### 4. Food Tracking

- **Photo scan** (Gemini 3.5 Flash vision) with uncertainty prompt flow
- **Voice entry** — user describes meal, transcribed and parsed into structured items
- **Barcode scan** — Open Food Facts lookup, free, no AI cost
- **Manual entry** — search known foods or add custom
- Up to 5 photos per meal (food, label, leftovers)
- Daily macro totals (calories, protein, carbs, fat, fibre)
- Meal slots: breakfast, lunch, dinner, snacks

### 5. AI Daily Plan

- Daily calorie target (computed from body stats + goal + activity)
- Daily macro targets (protein/carbs/fat split for the goal)
- Recommended meal times (based on user's schedule and eating window)
- Gym time reminder (based on user's preferred time)
- Regenerates weekly based on actual adherence

### 6. App Lockout System (the differentiator)

- User selects which apps to block (Instagram, TikTok, X, YouTube, etc.)
- Locked until daily gym session is logged
- Grace period (e.g. 30 minutes/day even when locked)
- Emergency override (1 per week, doesn't break streak)
- Lockout schedule (e.g. only enforced between 18:00 and gym log)

### 7. Dashboard

- Today's gym status (done / not done)
- Today's calories and macro progress
- Current gym streak
- Today's planned meals from AI
- XP earned today
- Apps currently locked (with override option)

### 8. Profile

- Display name, avatar
- Current rank, total XP
- Streak count
- Subscription status
- Restore Purchases button (required by App Store)
- Settings: notification preferences, lockout settings, units (metric/imperial)

---

## What does NOT ship in MVP

| Feature | Why deferred |
| --- | --- |
| Other habit types (water, reading, meditation) | Focus on the gym lockout differentiator first |
| Timesheet / clock in-out | Out of health scope |
| Mileage tracking | Out of health scope |
| Weekly AI digest | Needs 2+ weeks of data — Phase 2 |
| Leaderboard | Needs user base — Phase 2 |
| Social / friends | Phase 3 |
| Android / Play Store | Phase 2 |
| Apple Watch app | Phase 2 |
| AI chat (ask the coach a question) | Phase 2, schema already defined |
| Gym GPS check-in | Phase 2 — manual confirm in MVP |

---

## Success criteria

- 14-day trial → paid conversion > 20%
- Day-7 retention > 40%
- App lockout enabled by > 50% of trial users
- Food scan used at least once by > 60% of trial users
- Zero crashes on food scan or gym log flow
- Organic App Store rating > 4.5★ (no prompted rating in onboarding)

---

## Build order (~10 weeks)

**Weeks 1–2 — Backend foundation**

- Go project (Fiber v2), Supabase setup, all 13 schemas
- Clerk webhook integration
- Redis (Upstash) setup
- Auth middleware, basic health check

**Weeks 3–4 — Mobile skeleton + onboarding**

- Expo SDK 54 project, New Architecture enabled
- Clerk auth screens (native components)
- Full onboarding flow with all questions
- RevenueCat integration + paywall

**Week 5 — Gym habit tracking**

- Habit completion UI with XP animation
- Streak display
- HealthKit workout detection

**Weeks 6–7 — Food tracking**

- Camera screen + photo scan via Gemini
- Voice entry via Speech framework
- Barcode scan via Open Food Facts
- Uncertainty prompt UI
- Meal log + macro totals

**Week 8 — App lockout**

- Family Controls / Screen Time integration
- App picker UI
- Lockout enforcement engine
- Override flow

**Week 9 — AI plans + polish**

- AI daily target generation
- Meal schedule recommendations
- Push notifications
- Empty states + error handling

**Week 10 — Submission**

- App Store assets, screenshots, privacy policy
- TestFlight beta with 20 users
- App Store submission