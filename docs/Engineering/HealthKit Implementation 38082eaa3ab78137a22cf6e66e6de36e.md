# HealthKit Implementation

Detailed implementation guide for Apple Health integration. The Feature page 06 covers the UX flow. This page covers the technical detail required for the App Store privacy review and the actual code patterns.

---

## Why HealthKit matters

Apple Health is the iOS source of truth for fitness data. By reading from it we get:

- **Auto-detection of gym workouts** — verified sessions get +5 XP and never require manual logging
- **Sleep correlation** with gym adherence — the most valuable AI insight pattern
- **Active calories burned** — input into accurate daily energy balance
- **Resting heart rate and HRV** — recovery and stress signals
- **Stand hours, VO2 max** — fitness improvement signals

We never write to HealthKit in MVP (read-only). Phase 2 may write workouts back so other apps see them.

---

## Data types we read

| HealthKit type identifier | What we use it for |
| --- | --- |
| `HKWorkoutType` | Gym session verification + auto-detect |
| `HKQuantityTypeIdentifier.stepCount` | Daily activity context for AI |
| `HKCategoryTypeIdentifier.sleepAnalysis` | Sleep duration + correlations |
| `HKQuantityTypeIdentifier.restingHeartRate` | Recovery/stress signal |
| `HKQuantityTypeIdentifier.heartRateVariabilitySDNN` | HRV signal |
| `HKQuantityTypeIdentifier.activeEnergyBurned` | Calories burned daily |
| `HKQuantityTypeIdentifier.basalEnergyBurned` | BMR for calorie target calc |
| `HKQuantityTypeIdentifier.appleStandHour` | Sedentary detection |
| `HKQuantityTypeIdentifier.vo2Max` | Cardio fitness signal |
| `HKCategoryTypeIdentifier.mindfulSession` | Phase 2 wellness |
| `HKQuantityTypeIdentifier.bodyMass` | Weight (if user logs in Health app) |

All requested as **read-only** via `HKHealthStore.requestAuthorization(toShare: [], read: types)`.

---

## Permission flow

### Required Info.plist usage descriptions

Add via `ios.infoPlist` in `app.json`:

```json
{
  "NSHealthShareUsageDescription": "Veltai reads your workouts, sleep, and activity from Apple Health to auto-detect gym sessions and spot patterns between sleep and gym attendance.",
  "NSHealthUpdateUsageDescription": "Reserved for future use. Veltai does not write to Apple Health in this version."
}
```

Note: `NSHealthUpdateUsageDescription` is included even though we don't write, because Apple sometimes requires it depending on entitlement configuration. The text is honest — "reserved for future use."

### Entitlements

Required: `com.apple.developer.healthkit`. Auto-enabled when `react-native-health` is configured. Confirm in Xcode project's Signing & Capabilities.

Optional: `com.apple.developer.healthkit.access` for granular permissions (not required for MVP).

### Permission UX

Permission request happens on **screen 15 of onboarding**, after the wow moment when the user has committed emotionally. Not on first launch.

```
Pre-prompt explainer screen:

  Apple Health Connection
  
  We use Apple Health to:
  
  ✓  Detect when you've finished a workout — log it for you automatically
  ✓  Connect sleep to gym performance — when one drops, we know
  ✓  Understand your real activity — not just what you log
  
  What we read:
  Workouts · Sleep · Steps · Heart Rate · Active Calories
  
  What we write:
  Nothing in this version.
  
                                  [Connect Apple Health]
                                  [Skip for now]
```

Then native `HKHealthStore.requestAuthorization` sheet appears.

- Granted → `user_profiles.healthkit_granted = true`, trigger first sync
- Denied → continue, set false, surface settings prompt later

User cannot regrant via app UI — they must enter iOS Settings → Privacy → Health → Veltai. Handle by deep-linking from a "Not connected" banner.

---

## Daily sync architecture

Three sync triggers:

### 1. On app foreground

```
useEffect on App.tsx mount:
  if healthkit_granted:
    syncHealthKitForDate(today)
```

Pulls today's data so dashboard is current. Idempotent — uses `UPSERT ON CONFLICT (user_id, health_date)`.

### 2. HKObserverQuery for workouts (real-time)

In the native iOS layer (Swift via `react-native-health` or custom module):

```swift
HKHealthStore().enableBackgroundDelivery(for: HKWorkoutType, frequency: .immediate)
HKObserverQuery(sampleType: HKWorkoutType, predicate: nil) { _, completionHandler, error in
  // Fetch new workout, send to backend, trigger auto-detect prompt
  completionHandler()
}
```

Fires the auto-detect prompt for newly completed workouts.

### 3. Background daily sync (BGProcessingTask)

At user's wake_time, fetch yesterday's full sleep data + all daily summaries. Uses iOS BackgroundTasks framework via `expo-background-task`.

### Payload structure

```
POST /api/health/sync
Authorization: Bearer <clerk_jwt>

{
  "health_date": "2026-06-15",
  "steps": 8423,
  "sleep_hours": 7.2,
  "sleep_deep_hours": 1.4,
  "resting_heart_rate": 58,
  "heart_rate_variability": 42.3,
  "calories_burned": 487,
  "calories_bmr": 1742,
  "vo2_max": 47.2,
  "stand_hours": 11,
  "workouts": [
    {
      "type": "TraditionalStrengthTraining",
      "start": "2026-06-15T18:03:12Z",
      "end": "2026-06-15T19:18:44Z",
      "duration_seconds": 4532,
      "active_energy_kcal": 312,
      "source_name": "Apple Watch",
      "workout_uuid": "<HKWorkout UUID>"
    }
  ]
}
```

Backend writes to `daily_health_cache`.

---

## Workout auto-detection

The killer integration.

```
Workout completed → HKObserverQuery fires
  ↓
Mobile reads workout details
  ↓
Is type in allow-list?
  TraditionalStrengthTraining, FunctionalStrengthTraining,
  HighIntensityIntervalTraining, Yoga, Pilates,
  MixedCardio, Running, Cycling, Other, CrossTraining
  ↓
Duration > 15 minutes?
  ↓
POST workout to backend
  ↓
Backend checks: is there a gym_session for today already?
  YES → UPDATE gym_sessions SET verification_source = 'healthkit_workout',
        healthkit_workout_id = $uuid, verified_at = NOW()
        AwardXP(user_id, 'gym_session_healthkit_verified', session_id, 5)
  NO  → Push silent notification to mobile
        Mobile shows banner: "We saw a [Strength Training] workout for 52 min.
                              Log this as today's session?"
        Tap Yes → POST /api/gym/sessions with verification_source = 'healthkit_workout'
```

---

## Privacy compliance

### App Privacy nutrition label (App Store Connect)

We declare in App Privacy:

- **Health & Fitness**: linked to identity, app functionality only
    - Workouts, sleep, heart rate, energy data
- **Used for**: App Functionality, Analytics (no third-party)
- **Not used for**: Tracking, Advertising

### Privacy Manifest (PrivacyInfo.xcprivacy)

Required `NSPrivacyAccessedAPITypes` entries. `react-native-health` publishes the required entries — verify after running `npx expo prebuild`.

### Privacy guarantees in our privacy policy

1. **HealthKit data never leaves your account.** Stored in `daily_health_cache` with RLS — only your account can read it.
2. **HealthKit data is never sent to AI providers in raw form.** Only derived summaries (e.g. "user sleeps 6.8h on average") go in AI prompts.
3. **HealthKit data is never shared with third parties.** Not Sentry (we scrub it), not analytics, not advertisers.
4. **You can disconnect anytime** via iOS Settings → Privacy → Health → Veltai. Disconnecting deletes `daily_health_cache` rows older than 30 days within 24 hours.
5. **Apple's rules apply.** HealthKit data cannot be used for advertising, sold, or shared with data brokers per Apple's HealthKit terms.

---

## Library decision: `react-native-health` vs custom Swift module

**Use `react-native-health` for MVP.** Reasons:

- Maintained, has TypeScript types
- Covers all data types we need
- Publishes privacy manifest entries
- No custom native code to maintain

**Consider custom Swift module if:**

- We hit a HealthKit feature `react-native-health` doesn't expose
- We need fine-grained control over HKObserverQuery callbacks
- The library falls behind on iOS SDK updates

Likely scenario: ship MVP with `react-native-health`. Migrate to custom only if performance issues or feature gaps emerge.

---

## Edge cases

| Scenario | Handling |
| --- | --- |
| User denies HealthKit | Continue. Manual gym logging only. Surface banner "Connect Health for auto-detection" in settings. |
| User grants only some types | Use what's available. Don't block features that don't need denied types. Track per-type grant in `user_profiles.healthkit_grants` JSONB. |
| User has no Apple Watch | No HRV, VO2 max, stand hours. Steps still work via iPhone. Don't fabricate values. |
| Sleep data spans midnight | HealthKit stores sleep with timezone. Convert to user's local date for cache. |
| Multiple workouts same day | Use longest one for gym session verification. Store all in `daily_health_cache.workouts` JSONB. |
| User uses Sleep Cycle / Whoop / third-party | Source attribution; prefer Apple Watch > iPhone > third-party. |
| HealthKit returns nothing on first sync | Treat as 0. User just enabled — data appears later. Re-sync on foreground. |
| Background sync misses (battery saver) | Catch up on next foreground. We don't enforce daily — gaps are fine. |

---

## Testing strategy

HealthKit only works on real devices. Simulator returns empty for all queries.

For dev/test:

1. Use a TestFlight build on a real device with HealthKit data
2. For CI: stub `react-native-health` in test mode
3. Manual test plan:
    - Grant only some types → verify graceful degradation
    - Deny entirely → verify manual flow works
    - Complete a workout in Health app → verify auto-detect banner appears
    - Sleep through night → verify `daily_health_cache` updates next morning
    - Disconnect in Settings → verify banner appears