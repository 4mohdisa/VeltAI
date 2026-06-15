# 05 · App Lockout System

The differentiator. The reason someone pays for Veltai over Cal AI or LOCKED. It physically (well, digitally) makes going to the gym easier than scrolling.

---

## User story

> I know I should go to the gym. I have time. But I always end up on Instagram or TikTok instead. I want my phone to make scrolling harder than going to the gym. Block the apps until I've gone. Give me an emergency override once a week if I really need it. But otherwise, force my hand.
> 

---

## Three enforcement modes

### Soft (default, no entitlement needed)

- Aggressive notifications when in enforcement window without gym session
- Notification cadence increases as the window closes (every 30min → every 15min in last hour)
- Lock screen widget showing "Gym not logged — streak at risk"
- Works for every user immediately. No Apple approval needed.

### Moderate (no entitlement, uses Shortcuts)

- Soft mode + iOS Shortcuts integration
- During enforcement window without session, target apps are redirected through a Shortcut that:
    - Shows a Veltai message screen first
    - Requires a tap to continue to the actual app
    - Adds friction without truly blocking
- Requires user to set up Shortcuts on each blocked app once. Veltai provides a setup wizard.

### Strict (requires Family Controls entitlement)

- Soft + Moderate + actual app blocking via iOS Family Controls API
- Tapping a blocked app shows the iOS "Screen Time block" screen
- Truly cannot open the app until lockout is lifted
- Requires `com.apple.developer.family-controls` entitlement approved by Apple

**MVP strategy:** ship Soft mode for everyone. Apply for Family Controls entitlement in parallel. If approved, push update enabling Strict mode for opted-in users.

---

## Setup flow (during onboarding screen 14)

```
Screen: "Want us to lock distracting apps until you've gone to the gym?"
  ↓
User taps "Yes, set it up"
  ↓
App picker:
  Common defaults pre-selected (Instagram, TikTok, X, YouTube)
  User can add more from a searchable list
  ↓
Enforcement window picker:
  - Always (whenever no gym session today)
  - Evening only (18:00–23:59) [recommended]
  - Custom range
  ↓
Mode selection (only shown if Family Controls entitlement available):
  - Soft (notifications only)
  - Moderate (Shortcuts redirect)
  - Strict (full block)
  ↓
Grace period:
  - 30 minutes per day [default]
  - 15 minutes
  - None
  ↓
Emergency unlocks:
  - 1 per week [default]
  - 0 (hardcore mode)
  ↓
Final review screen → Confirm
  ↓
Writes to user_lockout_settings + lockout_app_blocklist rows for each app
```

---

## Runtime enforcement

### State machine

```
Is lockout enabled?
  no  → [unrestricted]
  yes
   ↓
Is the current time inside the enforcement window?
  no  → [unrestricted]
  yes
   ↓
Is today's gym session logged?
  yes → [unrestricted]
  no
   ↓
Is streak freeze applied for today?
  yes → [unrestricted]
  no
   ↓
Is grace period available?
  Yes (>0 min remaining) → [restricted with grace option]
  no
   ↓
Is emergency unlock available?
  Yes → [restricted with emergency option]
  no  → [fully restricted]
```

### Grace period UX

- User opens blocked app → Veltai overlay (Strict) or notification (Soft)
- "You have 12 minutes of grace time left today. Use 5 minutes?"
- Buttons: [5min] [10min] [12min all]
- Tap consumes grace. Strict mode unblocks for that duration. Soft mode stops notifications for that duration.
- Grace period resets at midnight UTC.

### Emergency unlock UX

- Reachable from Veltai dashboard, not from the blocked app
- "Emergency unlock removes lockout for the rest of today. You'll have 0 left this week."
- Requires typing a 4-digit confirmation code (deliberately adds friction)
- Resets Monday at midnight UTC.

---

## Lifting lockout when gym session logged

When `POST /api/gym/sessions` succeeds:

1. Backend sets Redis key `lockout_lifted:{user_id}:{date}` = true (TTL 25h)
2. Push notification: "Lockout lifted. Nice work."
3. Mobile receives silent push, removes ManagedSettings restrictions (Strict mode) or stops sending notifications (Soft mode)
4. `lockout_events` row inserted with `event_type = 'gym_session_logged'`

This must be sub-2-second so the user sees lockout lift while still standing in the gym lobby.

---

## Tables touched

- `user_lockout_settings` — read on every check, write on settings change
- `lockout_app_blocklist` — read on enforcement, write on app add/remove
- `lockout_events` — append-only audit log
- `gym_sessions` — read to determine if today's session exists
- `gym_streak_freezes` — read to determine if today is frozen

---

## Apple Family Controls notes

### What we need

- Entitlement: `com.apple.developer.family-controls`
- User authorisation via `AuthorizationCenter.shared.requestAuthorization(for: .individual)`
- Once authorised, the app receives an opaque `ApplicationToken` per app the user picks via `FamilyActivityPicker`
- We do NOT see app names or bundle IDs of selected apps — Apple intentionally obfuscates this for privacy

### Storage implications

- `lockout_app_blocklist.app_identifier` will be a base64-encoded `ApplicationToken` for Strict mode
- We can't display app names server-side. The UI gets `app_name` from the user when they pick apps via `FamilyActivityPicker` (which shows icons but not bundle IDs to us)
- For Soft mode (no entitlement), we use bundle IDs from a curated list of common apps

### Approval risk

Apple may reject the entitlement application for indie devs. Mitigations:

1. Apply during MVP development with a clear use case write-up emphasising user wellbeing
2. Ship Soft mode first — it's a real product even without the entitlement
3. If denied: keep applying via TestFlight Beta + a public demo video showing legitimate use
4. Worst case: Strict mode never ships; Soft + Moderate is still novel and useful

---

## Edge cases

| Case | Handling |
| --- | --- |
| User logs gym, then deletes the log within minutes | Lockout re-applies. `lockout_events` records both lift and reapplication. |
| User changes timezone mid-day | Enforcement window times shift; existing lockout state preserved (today is still today in UTC). |
| User reinstalls Veltai | Lockout settings restored from server. Family Controls auth must be re-granted (Apple security). |
| User force-quits Veltai | Strict mode: ManagedSettings restrictions persist (set via Device Activity scheduler, not runtime). Soft mode: notifications still fire via APNs scheduled jobs. |
| Apple denies Family Controls entitlement | App functions in Soft mode only; users informed in onboarding. |
| User uninstalls Veltai during active lockout | Strict mode restrictions removed automatically by iOS (entitlement-bound). |
| Push notifications disabled | Lockout effectively becomes Strict-only (Soft mode has nothing to work with). Warn user. |

---

## Success metrics

- Lockout enabled rate among trial users > 50%
- Gym attendance rate is X% higher for lockout-enabled vs disabled users (the entire feature thesis)
- Emergency unlock usage rate < 1 per user per month average
- Grace period usage < 15 minutes per user per day average
- Lockout-related Sentry errors per user per week < 0.01