# 06 · HealthKit Integration

Apple Health is the source of truth for sleep, steps, heart rate, and workouts on iOS. Veltai reads from it, never writes (MVP).

---

## What we read

| HealthKit data type | Used for |
| --- | --- |
| `HKWorkoutType` | Auto-detect gym sessions, +5 XP verification bonus |
| `HKQuantityTypeIdentifier.stepCount` | Daily activity context for AI plan generation |
| `HKCategoryTypeIdentifier.sleepAnalysis` | Sleep hours, used for health correlations |
| `HKQuantityTypeIdentifier.restingHeartRate` | Recovery / stress indicator |
| `HKQuantityTypeIdentifier.heartRateVariabilitySDNN` | HRV — stress / readiness indicator |
| `HKQuantityTypeIdentifier.activeEnergyBurned` | Calories burned today |
| `HKQuantityTypeIdentifier.basalEnergyBurned` | BMR — used in calorie target calc |
| `HKQuantityTypeIdentifier.appleStandHour` (Apple Watch) | Sedentary alert input |
| `HKQuantityTypeIdentifier.vo2Max` (Apple Watch) | Cardio fitness signal for AI |
| `HKCategoryTypeIdentifier.mindfulSession` | Mindfulness minutes (Phase 2 sleep coaching) |

All read-only. We never write to HealthKit in MVP.

---

## Permission flow

```
During onboarding screen 15:
  Show explainer: "Veltai uses your Apple Health data to detect your workouts automatically,
                   spot patterns between sleep and gym attendance, and personalise your plan."
  Show what we read (the list above) and what we write (nothing).
  Button: "Connect Apple Health"
  ↓
Native HKHealthStore.requestAuthorization sheet appears
User grants per-data-type permissions
  ↓
Back in Veltai: success state, set user_profiles.healthkit_granted = true
  ↓
Immediately trigger first background sync to pull last 30 days of data
```

If user denies: continue onboarding, mark `healthkit_granted = false`. The user can grant later from Settings.

---

## Background sync

### Cadence

- On app foreground: sync today's data
- HKObserverQuery for `HKWorkoutType`: real-time notification when a workout is detected
- Daily background fetch at user's wake_time: sync yesterday's full data (sleep, etc.)
- On gym session log: sync workouts from last 4 hours to verify

### Implementation

Mobile uses `react-native-health` (or a native Swift module if `react-native-health` has gaps).

```
[ Mobile ] Read HealthKit → build JSON payload
           POST /api/health/sync
              { date, steps, sleep_hours, resting_hr, hrv, calories_burned, ... }
           ↓
[ Backend ] UPSERT INTO daily_health_cache ON CONFLICT (user_id, health_date) DO UPDATE
           ↓
           Trigger correlation analysis if data shifted significantly
           Invalidate ai_prompt_context_cache for this user
           ↓
           Return 200
```

---

## Workout auto-detection

The killer integration: detect a workout, prompt the user to log it as their gym session.

```
HKObserverQuery fires when a new workout is added to HealthKit
  ↓
Mobile reads the workout (type, start time, end time, duration, energy burned)
  ↓
Is the workout type one of: HKWorkoutActivityTypeFunctionalStrengthTraining,
  TraditionalStrengthTraining, HighIntensityIntervalTraining, Yoga,
  Pilates, MixedCardio, Running, Cycling, Other?
  ↓
Is it long enough? Duration > 15 minutes
  ↓
Was today's gym session already logged?
  Yes → Update gym_sessions with healthkit_workout_id, +5 XP bonus
  No  → Show banner: "We saw a [Strength Training] workout for 52 min. Log this as today's session?"
         Tap Yes → POST /api/gym/sessions with verification_source = 'healthkit_workout'
```

---

## AI correlation data

Daily HealthKit data feeds the `user_health_correlations` table over time:

- `sleep_vs_gym_attendance`: when sleep < 6h, what's the probability user goes to gym?
- `sleep_vs_calories_consumed`: do they overeat after poor sleep?
- `weekend_vs_weekday_consistency`: weekend HRV pattern vs weekday
- `alcohol_proxy_vs_next_day`: low HRV + high resting HR pattern + poor sleep = inferred alcohol; correlate with next day gym attendance

Correlations need at least 30 days of data before showing to user. Stored when `confidence > 0.6`.

---

## Tables touched

- `daily_health_cache` — daily UPSERT
- `gym_sessions` — verification fields updated when matching workout found
- `user_health_correlations` — updated by weekly analysis job
- `user_habit_patterns` — "morning_person" derived from wake_time + workout_time pattern
- `user_body_trend` — weight pulled from HealthKit body mass if user logs there

---

## Edge cases

| Case | Handling |
| --- | --- |
| User denies HealthKit | Continue with manual entry. Show prompt to enable later from Settings. |
| User grants only some data types | Use what's available. Don't block features that don't need denied types. |
| HealthKit returns no data (user has no Apple Watch / iPhone health data) | Treat as 0 / null. Don't fabricate values. |
| Workout from third-party fitness app | Source attribution is in HealthKit. Treat all sources equally if type matches. |
| Multiple workouts in one day | Use the longest one for verification of today's gym session. |
| Workout < 15min | Don't auto-prompt. User can still manually log. |
| Sleep data spans midnight | HealthKit stores sleep with timezone. Convert to user's local date for cache. |
| User uses Sleep Tracker app that double-counts | Source attribution; prefer Apple Watch → iPhone → third-party in that order |
| Massive backfill on first sync (years of data) | Limit first sync to 30 days. Older data on-demand. |

---

## Privacy

HealthKit data is sensitive. Veltai treats it carefully:

- Data lives in `daily_health_cache` per user, with RLS — only the user can read their own rows
- We do NOT share HealthKit data with any third party (including AI providers — we only send derived summaries, never raw HealthKit JSON)
- Apple Health Data privacy declarations filed accurately in App Store Connect
- Privacy policy explicitly lists what HealthKit types we read and what we use them for
- User can disconnect HealthKit at any time, which deletes their `daily_health_cache` rows older than 30 days

---

## Success metrics

- HealthKit permission grant rate > 70% of trial users
- Workout auto-detection accuracy (banner shown only when relevant workout exists) > 90%
- Daily sync success rate > 99%
- Median sync latency on foreground < 1.5 seconds
- % of gym sessions verified via HealthKit (among HealthKit users) > 60%