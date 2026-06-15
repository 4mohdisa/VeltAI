# App Store Readiness

Adapted from the React Native iOS App Store guide. Tailored to Veltai (gym/food/lockout) instead of finance.

Work top to bottom. The Tier 0 items are launch blockers.

---

## TIER 0 — Launch blockers

### 0.1 Payments must be StoreKit on iOS

Apple Guideline 3.1.1: any digital subscription sold inside the app MUST go through StoreKit. Stripe and Clerk Billing are forbidden for iOS in-app subscriptions.

- RevenueCat + StoreKit configured before submission
- App Store Connect → Features → In-App Purchases → New Subscription
- Product: `veltai_premium_monthly` at A$9.99/month with 14-day free trial
- Mirror in RevenueCat dashboard
- Test purchases in sandbox on real device (NOT Expo Go — needs EAS dev build)
- No mention of Stripe, no external pricing, no web checkout links in the iOS binary

### 0.2 Reviewer access to a paywalled app

The reviewer must be able to see the app function. Provide in App Store Connect → App Review:

- **Demo account**: a working email + password
- **Notes**: "Use the demo account. Onboarding is pre-completed. Trial is already active. Apple Health permissions can be denied — manual logging works. Family Controls entitlement requires real device interaction."
- **Pre-populated state**: completed onboarding, 5 logged gym sessions, 20 logged meals, active streak, lockout configured

### 0.3 Account deletion (Guideline 5.1.1(v))

Required by Apple. Settings → Account → Delete Account.

Endpoint: `DELETE /api/account` (authenticated):

1. Soft-delete `users.deleted_at = NOW()`
2. Cascade: all per-user rows via `ON DELETE CASCADE`
3. Call Clerk API: `DELETE /v1/users/{clerk_id}`
4. Schedule background job to delete Supabase Storage files (photos, voice)
5. Cancel RevenueCat subscription (no refund — Apple's call)
6. Return 200

User sees confirmation screen explaining what was deleted + 7-day grace period before final purge.

### 0.4 Sign in with Apple (Guideline 4.8)

Required if any third-party login is offered.

- Listed on onboarding screen 3 (auth)
- Equal prominence to Google
- Clerk configured for Apple OAuth
- Capability `com.apple.developer.applesignin` enabled in entitlements

### 0.5 Required URLs

- **Privacy policy URL**: [https://veltai.app/privacy](https://veltai.app/privacy) — must accurately describe HealthKit, Gemini, Sentry, Clerk
- **Support URL**: [https://veltai.app/support](https://veltai.app/support)
- **EULA**: Apple's standard EULA is fine, or our custom

All three submitted in App Store Connect → App Information.

---

## TIER 1 — Build and toolchain

- Xcode 16+ with iOS 18 SDK (mandatory since April 2025)
- EAS Build image pinned to Xcode 16+
- React Native New Architecture enabled (default in SDK 54)
- Hermes JS engine enabled (default)
- Version (`1.0.0`) and `ios.buildNumber` bumped every upload
- arm64 device architecture (EAS default)
- Bitcode disabled (deprecated)

---

## TIER 2 — Privacy manifest (PrivacyInfo.xcprivacy)

Mandatory since May 2024. Required entries for libraries we use:

| Library | Required entries |
| --- | --- |
| Expo SDK | Auto-published, run `npx expo install --fix` |
| `react-native-health` | Publishes own entries |
| Sentry | Publishes own entries — verify present |
| Clerk Expo | Verify entries |
| `react-native-purchases` (RevenueCat) | Verify entries |

After upload, App Store Connect emails a report of undeclared APIs. Use it to close gaps before going live.

---

## TIER 3 — Permissions and Info.plist usage descriptions

Add via `ios.infoPlist` in `app.json`:

```json
{
  "NSHealthShareUsageDescription": "Veltai reads your workouts, sleep, and activity from Apple Health to auto-detect gym sessions and spot patterns between sleep and gym attendance.",
  "NSHealthUpdateUsageDescription": "Reserved for future use. Veltai does not write to Apple Health in this version.",
  "NSCameraUsageDescription": "Veltai uses the camera to scan your meals and food labels for accurate calorie tracking.",
  "NSMicrophoneUsageDescription": "Veltai uses the microphone so you can describe meals by voice instead of typing.",
  "NSFaceIDUsageDescription": "Veltai uses Face ID to keep your health data private.",
  "NSPhotoLibraryUsageDescription": "Veltai uses your photo library so you can attach existing photos of meals."
}
```

Add only what we actually use. Unused permissions trigger Guideline 5.1.1 review.

### Background modes

Only if we ship background HealthKit sync (we do):

```
UIBackgroundModes: ["fetch", "remote-notification"]
```

Not `location` — we don't background-track location in MVP.

---

## TIER 4 — Entitlements

| Entitlement | Why |
| --- | --- |
| `com.apple.developer.healthkit` | HealthKit read access |
| `com.apple.developer.applesignin` | Sign in with Apple |
| `aps-environment` | Push notifications |
| `com.apple.developer.family-controls` | App lockout (apply for this — Apple may reject indie devs) |
| In-App Purchase | Auto-enabled with IAP products |
| `com.apple.developer.associated-domains` | Deep links (`applinks:veltai.app`) |

### Family Controls application strategy

1. Apply early during MVP build phase
2. Build clear use-case write-up emphasising user wellbeing and digital health
3. If rejected: ship Soft mode lockout only, re-apply later with usage data

---

## TIER 5 — Security hardening

### Never store secrets in JS bundle

Backend-only:

- Gemini API key
- Supabase service-role key
- Basiq secrets (we don't use Basiq, kept here for reference if added later)

Client-safe public keys:

- Sentry DSN
- Clerk publishable key
- RevenueCat public SDK key
- Supabase anon key

### Secure storage

- Tokens via `expo-secure-store` (Keychain-backed)
- Never `AsyncStorage` for sensitive data
- Clerk Expo uses secure storage by default — confirm in dev

### Transport security

- HTTPS everywhere
- No `NSAllowsArbitraryLoads` in Info.plist
- TLS 1.2+ enforced on Go backend
- Consider SSL pinning for our `api.veltai.app` endpoints (defer until post-launch unless real threat emerges)

### Biometric lock (optional, Phase 2)

- Face ID lock for app open (toggle in Settings)
- `expo-local-authentication`
- Defer if MVP timeline is tight

### Logging hygiene

- Sentry: `beforeSend` filter scrubs PII, weight values, food log content
- No `console.log` in release builds (Metro strips with proper config)
- No request bodies sent to Sentry

### Dependencies

- Lock exact versions in `package.json` (no `^` drift)
- Run `npm audit` before each release
- Vet any new native module manually

---

## TIER 6 — Performance

Priority order:

1. **New Architecture + Hermes** — already on in SDK 54
2. **FlashList everywhere** — meal history, gym log, settings lists
3. **No unnecessary re-renders** — React.memo, useCallback, useMemo. Profile with React DevTools.
4. **Animations off JS thread** — Reanimated 3 worklets only for XP, streak, rank-up
5. **Bundle size** — Metro tree-shaking, lazy-load heavy screens (photo scan, dashboard charts)

### Targets

- Cold start: < 1.5s to first paint, < 3s to interactive
- 60fps on all scrollable screens
- Bundle size: < 30MB
- TTI on photo scan screen: < 2s

---

## TIER 7 — App Privacy nutrition label

In App Store Connect → App Privacy:

| Data type | Linked to user? | Tracking? | Use |
| --- | --- | --- | --- |
| Email address | Yes | No | App Functionality |
| Name | Yes | No | App Functionality |
| User ID | Yes | No | App Functionality |
| Health & Fitness | Yes | No | App Functionality |
| Diet | Yes | No | App Functionality |
| Photos | Yes | No | App Functionality (food photos) |
| Audio data | Yes | No | App Functionality (voice meals) |
| Purchase history | Yes | No | App Functionality |
| Crash data | Yes | No | App Functionality, Analytics |
| Performance data | Yes | No | Analytics |

Critical: declare **No Tracking** because we run no ad/attribution SDKs in the app. Marketing pixels live on [veltai.app](http://veltai.app), not inside the app binary.

---

## TIER 8 — App Store Optimization

### App name (30 chars)

`Veltai: AI Gym & Calorie`

### Subtitle (30 chars)

`Lockout · Macros · Habits`

### Keyword field (100 chars, no spaces after commas)

`gym,workout,calorie,macro,habit,streak,fitness,protein,track,fasting,health,coach,lockout,focus`

### Category

- Primary: Health & Fitness
- Secondary: Lifestyle

### Promotional text (170 chars, editable without new build)

`AI coach that knows your life. Photo or voice food tracking with no silent guesses. App lockout until you go to the gym. 14-day free trial.`

### Description

Front-loaded with value prop. Real features only. No competitor mentions.

### Screenshots (6.9" iPhone, required)

1. Dashboard with streak, lockout status, today's macros — the hero shot
2. Photo food scan with uncertainty prompt visible — the differentiator
3. Voice meal entry — the second differentiator
4. App lockout in action — the wow
5. Rank-up modal — emotional hook
6. AI daily plan — the personalisation

### Reviews

- Use `expo-store-review` (`SKStoreReviewController`) to prompt for ratings ONLY at positive moments — after 7-day gym streak
- No incentive attached. Apple bans incentivised reviews (Guideline 1.1.6)
- Respond to reviews in App Store Connect

---

## TIER 9 — Pre-submission checklist

Run on a real device with a release build (not simulator, not dev mode).

- [ ]  App launches without crash on clean install and on upgrade
- [ ]  Onboarding completes end-to-end (5 phases)
- [ ]  All permission prompts appear with correct copy and handle denial gracefully
- [ ]  Sign in with Apple works, equal prominence to Google
- [ ]  Subscribe via StoreKit sandbox, restore purchases works
- [ ]  Account deletion fully removes Clerk + Supabase data
- [ ]  Demo account works and is in App Review Notes
- [ ]  HealthKit auto-detection works on real device with real workout
- [ ]  Food photo scan works (Gemini API, uncertainty prompt)
- [ ]  Voice meal entry works (Speech framework)
- [ ]  Barcode scan returns Open Food Facts data
- [ ]  Lockout (Soft mode at minimum) sends notifications
- [ ]  No console logging of tokens or PII in release
- [ ]  Deep links resolve (auth callbacks, email links)
- [ ]  Push notifications register and deliver
- [ ]  Offline state handled (no infinite spinners)
- [ ]  Long meal history scrolls smoothly (test with 200+ rows)
- [ ]  Dynamic Type and VoiceOver work
- [ ]  Version + build number bumped
- [ ]  Privacy manifest present (no App Store Connect warning email after TestFlight)
- [ ]  App Privacy nutrition label filled and consistent
- [ ]  Privacy policy, support URL, EULA all reachable
- [ ]  TestFlight beta cycle completed (5+ external testers)

---

## TIER 10 — Common rejection reasons + Veltai mitigations

| Guideline | Cause | Veltai mitigation |
| --- | --- | --- |
| 2.1 Performance | Crash, broken flow, blank paywall | Sentry from day one, test on real device, demo account |
| 2.3 Accurate metadata | Screenshots show features that don't exist | Only show real features |
| 3.1.1 In-App Purchase | Stripe/external checkout in iOS app | StoreKit via RevenueCat — already designed |
| 5.1.1(v) Privacy | No account deletion | Built into Settings |
| 4.8 Login | Third-party login without privacy option | Sign in with Apple in plan |
| 1.1.6 Incentivised reviews | Rewarding ratings | Day 12 feedback is internal, not an App Store review |
| Privacy manifest | Missing entries | Auto-published by Expo + verify libraries |
| 4.0 HIG | Poor UI | Black-on-white design system, native components |
| 5.1.5 Location | Background location without justification | We don't use background location |
| 5.1.1(i) Data minimisation | Asking for unused permissions | Only request what we use |

If rejected: respond in Resolution Center with specifics, cite guideline numbers, fix and resubmit. Metadata rejections (2.3) often need only a listing edit, no new build.

---

## Veltai-specific notes by service

| Service | App Store consideration |
| --- | --- |
| **Clerk** | Confirm tokens in SecureStore, PKCE on, Sign in with Apple visible. Privacy manifest entries published. |
| **Supabase** | Re-audit RLS on every table. Service-role key NEVER in client. Past RLS incident is a warning. |
| **Gemini** | API calls server-side only. Don't log user prompts or responses in Sentry. |
| **RevenueCat** | Configure StoreKit product, test sandbox purchases on real device, restore purchases button visible. |
| **Sentry** | `beforeSend` scrubs PII, weight, food content. No request bodies. Privacy manifest entries published. |
| **react-native-health** | Privacy manifest entries published. Test on real device only. |
| **Family Controls** | Apply early. Ship Soft mode first as fallback. |
| **Open Food Facts** | Free, but requires `User-Agent: Veltai/1.0 (hello@veltai.app)` header. Attribute on the data source screen. |