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
- **No `EXPO_PUBLIC_POSTHOG_HOST`**: PostHog uses its default host, so events
  go to the PostHog US cloud.
- **Sign-out does not reset PostHog identity**: two accounts on one phone
  share one PostHog anonymous ID.
- **`trial_started`** is in the event list, but nothing in the app sends it.
- **Crash reporting has no user opt-out**; it is controlled only by the DSN.
- **`feature_used`** is still checked by the older shape check rather than its
  list above, pending Isa's decision on two tests in `analytics.test.ts`.
- **Privacy footer wording**: "First-party only, on our own servers" is
  pending Isa's approval. It stops being true once a PostHog key is set.
