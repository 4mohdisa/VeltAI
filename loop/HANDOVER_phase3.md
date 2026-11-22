HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
No new rows were finished this session. Row 7 (crash reporting) is BUILT, with owner steps pending. Row 8 (analytics) and Row 15 (empty states and copy) are PARTIAL. Last full gates: tsc 0 errors; Jest 202 suites, 1210 tests and 4 snapshots passing. Only docs and the PostHog host check changed after that run; the host check passed its 15 sink tests and tsc. Nothing was checked on a device.

BUILT (Row 8)
- PostHog sink in src/lib/analyticsSink.ts (posthog-react-native 4.87.1, exact version). It starts only when EXPO_PUBLIC_POSTHOG_KEY is set. The package is loaded inside init (a top-level import broke Jest).
- PostHog options: start opted out, no person profiles, no session replay, no lifecycle events, no flag preload, no GeoIP.
- Optional EXPO_PUBLIC_POSTHOG_HOST. A set value that is not an https URL keeps the sink off.
- track() in src/lib/analytics.ts sends to the sink after the consent check and sanitize().
- The listener on analyticsEnabled in analytics.ts opts PostHog in or out on every change. resetAnalytics() resets the PostHog ID on sign-out.
- src/app/profile/privacy.tsx: the existing switch is localised (settings.analytics* keys in en, es and fr) and has a VoiceOver hint, via a new optional accessibilityHint on src/components/display/SettingsList.tsx.
- PRIVACY_DATA.md lists every event, property and receiver, plus defaults and open items.
- Tests in src/__tests__/: analyticsSink, analyticsAllowlist, analyticsReset, render/settingsAnalytics.

IN PROGRESS
Nothing is half-done.

DECISIONS
- No second analytics switch on the Settings list. Privacy already had one, and a duplicate would be confusing.
- The sink opt-in hooks the store listener in analytics.ts rather than settings/store.ts, which was off-limits. The listener also catches the restore at launch.
- PRIVACY_DATA.md follows the code: events also go to the Lume backend (POST /api/analytics/events), with or without a PostHog key.

WAITING ON ISA
- The Privacy footer says "First-party only, on our own servers", which is false once a PostHog key is set.
- Analytics on by default (Row 8) or opt-in (DECISIONS.md).
- Whether PostHog should get the device maker, model name and OS fields.
- The feature_used tests and the shapeOnly() cleanup.
- The PostHog key, and the host if the project is in the EU.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. No git, Prettier or Maestro.
- zsh rejects grep --include.
- Locale files are in src/lib/i18n/locales/.
- Python edits that assert exactly one match are safe for this repo's markdown tables.

UNFIXED
- In PRIVACY_DATA.md, the host item's first sentence still says any non-empty host is used.
- A bad host turns PostHog off with no log line.
- The URL check and anonymous ID storage have not been tested on a device.
- Crash reporting has no opt-out.
- trial_started is never sent.
- The rest of Privacy is still English, as is body copy on Support, Scan accuracy and Integrations.
- npm audit reports 48 vulnerabilities, 1 of them critical.
- Older items from the previous handover: Spanish uses "Tus datos" twice, fr.json has straight apostrophes, and es.json has extra addMenu keys.

NEXT
Fix the host sentence in PRIVACY_DATA.md, then get Isa's decisions.