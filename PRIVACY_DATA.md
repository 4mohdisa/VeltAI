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
  PostHog starts opted out, so no analytics are sent until the user turns analytics on in Settings → Privacy.

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

## Defaults and open items

- **Analytics is opt-in and off by default**, as coded: `analyticsEnabled`
  starts false, and only an explicit stored opt-in turns it on. The switch is
  Settings → Privacy → Product analytics. Turning it off also opts PostHog
  out and discards unsent events. Row 8 asks for on by default; Isa to decide.
- **Anonymous ID storage**: the brief describes the PostHog anonymous ID as
  held in memory only for now. That is unverified. PostHog falls back to memory
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
