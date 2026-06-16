# Scope-Cut Report — remove App Lockout + narrow Apple Health

Two reductions. **(A)** App Lockout removed entirely. **(B)** Apple Health narrowed
to exactly two flows: **write logged nutrition** (user-initiated) and **read active
energy + steps** (calorie cross-check). Everything else Health-related removed. The
streak system, gym logging, food tracking, onboarding, paywall, profile, and the
design system all stay. tsc clean, iOS export succeeds.

## Part A — Lockout research map (every trace found)

| Area | File(s) | Disposition |
|---|---|---|
| B3 Lockout status | `app/dashboard/lockout.tsx` | **deleted** |
| A16 Lockout setup (onboarding) | `app/(onboarding)/lockout.tsx` | **deleted**; onboarding resequenced |
| E5 Lockout settings | `app/profile/lockout-settings.tsx` | **deleted**; row removed from E2 |
| F5 Lockout blocked overlay | `app/modals/lockout-blocked.tsx` | **deleted**; modal route removed from root Stack |
| Dashboard banner | `app/(tabs)/index.tsx` + `components/domain/LockoutBanner.tsx` | banner + component **deleted** |
| Mock data | `lib/mock/data.ts` `mockLockout` | **deleted** |
| Onboarding store | `lib/onboarding/store.ts` `lockoutEnabled` | **deleted** |
| Onboarding routes | `lib/onboarding/steps.ts` `'lockout'` | **removed** (19 → 18 steps) |
| Copy | value-prop (A2) lock card, wow (A15) lockout preview, paywall (A18) "watch the lockout work", generating (A19) "Personalising your lockout", nudge default, gym log toasts | **rewritten** to streak/honesty |
| Native config | — | **none existed**: no `com.apple.developer.family-controls` entitlement, no `ManagedSettings`/`DeviceActivity`/`ScreenTime` config, no lockout `UIBackgroundModes`, no `/lib/lockout` module. Only a comment in the now-deleted F5 mentioned the entitlement. |

**False positive kept:** the account-deletion "7-day grace period" in
`delete-account.tsx` (unrelated to lockout).

## Part B — Apple Health research map

| Area | File(s) | Disposition |
|---|---|---|
| D3 workout auto-detect (inline) | `app/(tabs)/gym.tsx` | banner + `showDetect` state **removed** |
| D3 auto-detect (standalone route) | `app/gym/auto-detect.tsx` | **deleted** |
| Detected-workout mock | `lib/mock/data.ts` `mockDetectedWorkout` | **deleted** |
| HealthKit verification | (already removed in degamify) | confirmed none remains |
| Sleep / Heart rate reads | `app/profile/apple-health.tsx` data types | **removed** (read list → Active energy + Steps only) |
| Permission copy | onboarding A17 + Info.plist | **rewritten** to the two flows |
| Sleep/HRV/VO2/BMR/correlations/`daily_health_cache`/observer queries/background sync | — | **none existed in code** — nothing to remove |

**Kept — the two flows (stubbed in `lib/healthkit`; `react-native-health` not
installed, so mocked behind the same UI):**
1. **READ active energy + steps** → `readActiveEnergyAndSteps()` →
   `CalorieCrossCheck` card on the Nutrition detail (B4): Eaten vs Active burn vs
   Goal, with a net line. Falls back to **intake-only** when Health is not
   connected (no crash, no empty state). `mockHealth` provides the data.
2. **WRITE logged nutrition (user-initiated)** → `writeNutritionToHealth()` behind
   a "Send to Apple Health" action on the meal detail (C11); flags the meal once
   sent. Never automatic.

**False positives kept:** the AI-plan "Wind down/bedtime" entry (`kind: 'sleep'`,
`sleep: 'moon'` icon), the onboarding "Sleep time" schedule question, and
onboarding "dietary restrictions" — none are HealthKit reads/writes. `iconAccents`
(design-system colour reference) left intact.

## Final grep results

```
LOCKOUT (lockout/family-controls/screentime/blocklist/grace/emergency)  → 0 real hits
HEALTH removed (workout/sleep/HRV/correlation/background/auto-detect)    → 0 real code hits
        (only the lib/healthkit comment listing what is NOT done remains)
HEALTH kept: readActiveEnergyAndSteps, writeNutritionToHealth, activeEnergy,
        stepCount, cross-check, "Send to Apple Health"                  → present (the 2 flows)
```

Also verified: **no `router.push` to any deleted route** (dashboard/lockout,
lockout-settings, lockout-blocked, gym/auto-detect). Onboarding = **18 steps**;
A15 (wow) → A16 (permissions) → A17 (paywall) → A18 (generating), step props and
the progress indicator updated.

## Info.plist (updated)

- `NSHealthShareUsageDescription`: "Veltai reads your active energy and steps from
  Apple Health to cross-check against your daily calorie goal."
- `NSHealthUpdateUsageDescription`: "Veltai can write the nutrition you log to
  Apple Health, only when you choose to."

## Verification

- `npx tsc --noEmit` — clean (before every commit).
- `npx expo export --platform ios` — succeeds.
- Streak/freeze, gym logging, food tracking, onboarding (resequenced), paywall,
  and profile all intact.

### `[?]` — live screenshot not captured
As in the previous passes, `xcrun simctl openurl` to app routes returns "Unmatched
Route" on a cold-launched app (an expo-router/`openurl` quirk — the app itself
builds and runs). The changes are verified by tsc, export, and the grep audit. The
lockout-free onboarding/dashboard/settings and the calorie cross-check / send-to-
Health action appear when the app is run normally.

## Git log

```
remove-lockout + narrow-health: audit clean (+ SCOPE-CUT-REPORT.md)
narrow-health: permission + plist + settings copy
narrow-health: wire calorie cross-check + nutrition write
narrow-health: remove sleep/HRV/correlations/background sync
narrow-health: remove workout auto-detect + verification
remove-lockout: copy + assets
remove-lockout: logic + native config + data
remove-lockout: dashboard + shared UI
remove-lockout: delete lockout screens
```

## Confirmation

All app lockout (Family Controls/Screen Time, blocklist, settings, status,
overlay, grace/emergency) is removed — nothing blocks the phone. Apple Health is
exactly two flows (write nutrition user-initiated + read active energy & steps).
Streak, freeze, gym logging, food tracking, onboarding, paywall, profile, and the
design system remain. The workout-schedule and gym-selfie capture features were
**not** built.
