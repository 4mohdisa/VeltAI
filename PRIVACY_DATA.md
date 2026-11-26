# Privacy data inventory

What the app sends about usage and crashes, where it goes, and why. Source of
truth: `src/lib/analytics.ts` (`ALLOWED_EVENTS`, `sanitize()`),
`src/lib/analyticsSink.ts` (PostHog) and `src/lib/crashReporting.ts` (Sentry).
Update this file whenever any of those change.

## Analytics events

Nothing is collected unless the user has turned analytics on (see Defaults
below). When it is on, every event passes through `sanitize()`, which keeps a
property only when the event lists it and the value fits its type. Property
types:

- **name**: one tag from a fixed list in the code, never free text.
- **count**: a whole number of 0 or more.
- **boolean**: true or false.

Receiving services for every event below:

- **Lume backend** (`POST /api/analytics/events`): always, while analytics is
  on. The user is identified server-side from the sign-in token; the client
  sends no user id.
- **PostHog**: only when `EXPO_PUBLIC_POSTHOG_KEY` is set. With no key, no
  PostHog client exists and nothing is sent to PostHog.
  PostHog starts opted out, so no analytics are sent until analytics is turned on (see Defaults below for the two places that do it).

| Event | Allowed properties | Receiving service | Reason |
| --- | --- | --- | --- |
| `session_started` | none | Lume backend; PostHog if key set | Count app opens. |
| `onboarding_step_viewed` | `step` (name: welcome, goal, measurements, activity, body-type, dietary, cuisine, targets, preview, signup, paywall, done), `index` (count) | Lume backend; PostHog if key set | See where onboarding loses people. |
| `onboarding_completed` | none | Lume backend; PostHog if key set | Measure onboarding completion. |
| `food_logged` | `method` (name: photo, voice, barcode, manual) | Lume backend; PostHog if key set | Learn which logging method people use. |
| `scan_started` | `entry` (name: camera, barcode, label) | Lume backend; PostHog if key set | Count scans by entry point. |
| `scan_completed` | `entry` (name: camera, barcode, label) | Lume backend; PostHog if key set | Measure scan success rate. |
| `scan_failed` | `entry` (name: camera, barcode, label), `reason` (name: camera_unavailable, quota_exceeded, read_failed, empty_result, pipeline_failed, pipeline_and_sync_failed, not_found, lookup_error) | Lume backend; PostHog if key set | Find which scan failures are most common. |
| `scan_confirmed` | `entry` (name: camera, barcode, label) | Lume backend; PostHog if key set | Measure how often a scan result is accepted. |
| `scan_corrected` | `entry` (name: camera, barcode, label) | Lume backend; PostHog if key set | Measure how often a scan result needs fixing. |
| `scan_discarded` | `entry` (name: camera, barcode, label) | Lume backend; PostHog if key set | Measure how often a scan result is thrown away. |
| `workout_logged` | none | Lume backend; PostHog if key set | Count workout logging use. |
| `template_created` | none | Lume backend; PostHog if key set | Count workout template use. |
| `integration_connected` | `provider` (name: strava, whoop) | Lume backend; PostHog if key set | Learn which integrations people connect. |
| `paywall_viewed` | none | Lume backend; PostHog if key set | Count paywall views. |
| `purchase_started` | none | Lume backend; PostHog if key set | Measure the purchase funnel. |
| `purchase_completed` | none | Lume backend; PostHog if key set | Measure the purchase funnel. |
| `purchase_cancelled` | none | Lume backend; PostHog if key set | Measure purchase drop-off. |
| `purchase_restored` | none | Lume backend; PostHog if key set | Count restored purchases. |
| `trial_started` | none | Lume backend; PostHog if key set | Count trial starts (not sent yet, see open items). |
| `feature_used` | `name` (name: ai_brain, saved_meals, recipes, gym_logging, morning_brief) | Lume backend; PostHog if key set | Learn which features are used. |

Never sent as a property: food names, calories, macros, weights, body
measurements, workout values, email or free text.

Extra fields beyond the table:

- **Lume backend** also receives `app_version`, `build` and, when known,
  `git_sha` on every event, plus a per-launch `session_id` and the client
  timestamp.
- `app_version`, `build` and `git_sha` are build labels, not user data: the
  app version and build number from the app manifest and the commit the build
  came from (`src/lib/appVersion.ts`). They are sent only to the Lume backend,
  with every event, are the only keys added outside `sanitize()`, and are
  pinned by `src/__tests__/analyticsAllowlist.test.ts`.
- **PostHog** also attaches its own device properties: device type, the
  device maker and model name, OS name and version, and whether it is a
  simulator (`expo-device` is installed). PostHog is configured with no
  person profiles, no session replay, no app lifecycle events, no feature
  flag preload and no GeoIP lookup, and the app never calls `identify()`.

## Crash reports

- **Service**: Sentry (`@sentry/react-native`).
- **Active only when** `EXPO_PUBLIC_SENTRY_DSN` is set. With no DSN, Sentry
  is not set up and sends nothing.
- **Stripped before sending** (`sendDefaultPii: false` plus the scrubbers in
  `src/lib/crashReporting.ts`):
  - Breadcrumbs keep only `type`, `category`, `level` and `timestamp`.
    Breadcrumb `data` and `message` are removed.
  - Events lose `user`, `extra`, `contexts` and `request`.
- **Why**: these fields can carry what the user logged (food, health, body or
  workout values), screen text, URLs or account details. A crash report only
  needs the error, its stack trace and the release to be fixed.

## Feedback

- **Service**: Lume backend only (`POST /api/feedback`), stored in its own
  database in the `feedback` table. No third party receives it. Source of
  truth: `src/app/profile/feedback.tsx`, `backend/internal/feedback/` and
  `supabase/migrations/20261123000001_feedback.sql`.
- **Sent only when** the user taps Send on Settings → Help and feedback.
- **Switch**: "include app version and device model" is off by default. Only
  the app version and the device model name are behind it; the app does not
  send the device maker or the OS.
- **No logs are sent**, and nothing about the request itself (headers, IP
  address, tokens, email) is stored.

| Field | Required | Sent by default | Stored in | Receiving service | Reason |
| --- | --- | --- | --- | --- | --- |
| `category` (name: bug, idea, account, other) | Yes | Yes | `feedback.category` | Lume backend and its own database | Sort messages by kind. |
| `message` (free text, 1 to 2000 characters after trimming) | Yes | Yes | `feedback.message` | Lume backend and its own database | The user's message. |
| `app_version` (version label with the build number, for example "1.4.0 (12)", at most 64 characters) | No | No, only when the switch is on | `feedback.app_version` | Lume backend and its own database | Tie a report to the build it came from. |
| `device_model` (device model name from `expo-device`, at most 64 characters) | No | No, only when the switch is on | `feedback.device_model` | Lume backend and its own database | Reproduce device-specific problems. |
| user id | Yes | Yes, taken from the sign-in token, not sent in the body | `feedback.user_id` | Lume backend and its own database | Attribute the message to its author. |
| `id`, `created_at` | Not sent | Not sent, set by the database | `feedback.id`, `feedback.created_at` | Lume backend and its own database | Identify and order messages. |

- **Access and deletion**: feedback rows are included in Export my data
  (`GET /api/export`) and are deleted with the profile (`on delete cascade`).
- **Retention**: not defined in code, owner to decide.

## Account data

- **Service**: Clerk (sign-in provider) and the Lume backend. Clerk holds the
  sign-in identity; the backend copies the email address and name into its own
  `profiles` table through the Clerk webhook (`backend/internal/auth/webhook.go`).
- **Linked to the user**: yes, all three fields. None is used for tracking.

| Field | Where it comes from | Stored in | Purpose | Retention |
| --- | --- | --- | --- | --- |
| Email address | Typed at sign up (email code), or supplied by Sign in with Apple or Google | Clerk; `profiles.email` | Sign in, account management, account deletion | Until the account is deleted |
| Name | Supplied by Sign in with Apple or Google when the user shares it; email sign up asks for none | Clerk; `profiles.display_name` | Account management, account deletion | Until the account is deleted |
| User ID (Clerk user ID) | Created by Clerk at sign up | Clerk; `profiles.id` and every row the account owns | Sign in, account management, account deletion | Until the account is deleted |

- **Deletion**: Settings → Delete my account removes the Clerk user and the
  profile, and every row tied to the user ID goes with it (`on delete cascade`).

## Push tokens

- **Service**: Lume backend only (`POST /api/push/token`, `DELETE
  /api/push/token`), stored in its own database in the `push_tokens` table.
  Source of truth: `src/lib/notifications/pushToken.ts`,
  `backend/internal/push/` and
  `supabase/migrations/20261127000001_push_tokens.sql`. Nothing sends push
  yet (a hosted step).
- **Registered after sign in**: once notification permission is granted, the
  app sends the device's native push token (`getDevicePushTokenAsync` from
  `expo-notifications`) to `POST /api/push/token`. It does so from the priming
  sheet when permission is granted, and once per signed-in session from
  `src/lib/auth/ClerkBridge.tsx` when permission is already granted. It never
  asks for permission to do this.
- **Kept on the device** in secure storage (`lume.pushToken`) so sign out can
  still remove it after a relaunch.
- **Removed at sign out**: sign out sends `DELETE /api/push/token`. The copy
  on the device is cleared once the delete succeeds; a failed delete is tried
  again at the next sign out.
- **One row per device token**, bound to the account that last registered it.
  A device that signs in to another account moves its token to that account.

| Field | Required | Sent by default | Stored in | Receiving service | Reason |
| --- | --- | --- | --- | --- | --- |
| `token` (device push token, 1 to 512 characters, no whitespace) | Yes | Yes, after sign in once permission is granted | `push_tokens.token` | Lume backend and its own database | Address push to this device. |
| `platform` (ios or android) | Yes | Yes, with the token | `push_tokens.platform` | Lume backend and its own database | Pick the push service for the device. |
| user id | Yes | Taken from the sign-in token, not sent in the body | `push_tokens.user_id` | Lume backend and its own database | Send push only to the account's own devices. |
| `id`, `created_at`, `updated_at` | Not sent | Not sent, set by the database | `push_tokens.id`, `push_tokens.created_at`, `push_tokens.updated_at` | Lume backend and its own database | Identify rows and see when a token was last registered. |

- **Access and deletion**: push token rows are included in Export my data
  (`GET /api/export`) without the token itself, which can send push to the
  device, and are deleted with the account (`on delete cascade`).
- **Retention**: until sign out removes it or the account is deleted. How long
  an unused token is kept is not defined in code, owner to decide.

## AI providers

AI features send data only after the user accepts the one-time AI disclosure
(`ensureAiConsent()` in `src/lib/ai/consent.ts`), and the server refuses every
send without its own consent record (`profiles.ai_consent_at`).

| Data | Receiving service | Reason |
| --- | --- | --- |
| Meal and nutrition-label photos, plus a short summary of food preferences and recent corrections | Google (Gemini) | Analyse the photo. |
| A summary of logged data (food logs, gym sessions, goals, streak, body weights) and, for Ask Lume, the typed question | Google (Gemini) by default | Write insights, the morning brief and Ask Lume answers. |
| The same summary and question | Anthropic, **only** if the server runs with `LLM_PROVIDER=claude` (off by default) | Backup provider for the same features. |

Google is the only AI provider in the default setup. Answers are cached in the
server's memory for `LUME_AI_CACHE_SECONDS` (default 15 minutes) and never
written to logs. Food search runs on the local Australian food table first and
then sends only the search text to Open Food Facts and, if `USDA_API_KEY` is
set, USDA FoodData Central.

## iOS privacy manifest

`app.json` `ios.privacyManifests` declares the data above with Apple's data
type names. No type is used for tracking. `scripts/checkPrivacyManifest.js`
(run by `npm run verify`) fails when a declared type is missing from this list.

| Manifest data type | Linked to the user | Purposes | Covers |
| --- | --- | --- | --- |
| `NSPrivacyCollectedDataTypeProductInteraction` | Yes | Analytics | Analytics events |
| `NSPrivacyCollectedDataTypeOtherDiagnosticData` | Yes | App functionality, analytics | Build labels on events, device model in feedback |
| `NSPrivacyCollectedDataTypeCrashData` | No | App functionality | Crash reports |
| `NSPrivacyCollectedDataTypeCustomerSupport` | Yes | App functionality | Feedback messages |
| `NSPrivacyCollectedDataTypePhotosorVideos` | Yes | App functionality | Meal and label photos sent for AI analysis |
| `NSPrivacyCollectedDataTypeHealth` | Yes | App functionality | Food logs, goals and body weights |
| `NSPrivacyCollectedDataTypeFitness` | Yes | App functionality | Gym sessions |
| `NSPrivacyCollectedDataTypeOtherUserContent` | Yes | App functionality | Ask Lume questions |
| `NSPrivacyCollectedDataTypeEmailAddress` | Yes | App functionality | Account email address |
| `NSPrivacyCollectedDataTypeName` | Yes | App functionality | Account name, when a social sign-in shares it |
| `NSPrivacyCollectedDataTypeUserID` | Yes | App functionality | Clerk user ID |

## Defaults and open items

- **Analytics is opt-in and off by default**, as coded: `analyticsEnabled`
  starts false, and only an explicit stored opt-in turns it on. Two places
  turn it on: the switch in Settings → Privacy → Product analytics
  (`src/app/profile/privacy.tsx`), and Continue on the one-time AI disclosure
  (`ensureAiConsent()` in `src/lib/ai/consent.ts`), which also turns analytics
  on. Only the Settings switch turns it off. Turning it off also opts PostHog
  out and discards unsent events. Row 8 asks for on by default and for the
  Settings switch to be the only control; Isa to decide both (the AI
  disclosure is a Phase 4 item).
- **Allowlist test**: `src/__tests__/analyticsAllowlist.test.ts` reads every
  `track()` call in `src/` and fails when an event is not allowlisted, when
  its properties are not an object literal, when a key is not on that
  event's list, or when a quoted value is not one of its tags.
- **Anonymous ID storage**: the brief describes the PostHog anonymous ID as
  held in memory only for now. Nobody has checked that yet. PostHog falls back to memory
  only when it finds neither `expo-file-system` nor AsyncStorage. Both are in
  `node_modules` through other packages, so on a device the ID may persist
  across launches. Check on a device.
- **`EXPO_PUBLIC_POSTHOG_HOST`**: When it is set to an https URL with a
  hostname, that host is used.
  When it is set but is not an https URL with a hostname, PostHog stays off:
  no client is created and nothing is sent.
  When it is unset, empty or only spaces, no host is passed to PostHog, so
  events go to the PostHog SDK's default host.
- **Sign-out resets the PostHog identity**: `resetAnalytics()` in `src/lib/analytics.ts` calls `resetSink()` in `src/lib/analyticsSink.ts`, which calls the PostHog client `reset()`. With no `EXPO_PUBLIC_POSTHOG_KEY` there is no client, so nothing is sent.
- **`trial_started`** is in the event list, but nothing in the app sends it.
- **Crash reporting has no user opt-out**; it is controlled only by the DSN.
- **`feature_used`** is still checked by the older shape check rather than its
  list above, pending Isa's decision on two tests in `analytics.test.ts`.
- **Privacy footer wording**: "First-party only, on our own servers" is
  pending Isa's approval. It stops being true once a PostHog key is set.
