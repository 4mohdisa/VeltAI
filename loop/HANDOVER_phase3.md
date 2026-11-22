HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
Row 7 (crash reporting) is BUILT, with owner steps pending. Row 8 (analytics) is PARTIAL after step 1. Row 15 (empty states and copy) is still PARTIAL. Nothing was checked on a device. Last full gates: tsc 0 errors; Jest 198 suites, 1190 tests and 4 snapshots passing. That run came before Row 8 step 1, which ran only its 4 suites (46 tests, all passing).

BUILT
Row 15: the headers on the profile screens are localised, each with a test in src/__tests__/render/.
- account.tsx: settings.accountEyebrow, settings.account and common.save.
- integrations.tsx: the title uses profile.connectedApps. The live eyebrow uses profile.connectionsSyncing, connectionsNone and connectionsCount.
- preferences.tsx: settings.preferencesEyebrow.
- support.tsx: settings.supportEyebrow.
- privacy.tsx: settings.privacyEyebrow.
- scan-calibration.tsx: settings.scanCalibrationEyebrow.

Row 7: @sentry/react-native ~7.11.0 is installed. src/lib/crashReporting.ts sets up Sentry only when EXPO_PUBLIC_SENTRY_DSN is set. It strips breadcrumb data and messages, and the event user, extra, contexts and request. It is called at module level in src/app/_layout.tsx. Test: src/__tests__/crashReporting.test.ts.

Row 8 step 1: src/lib/analytics.ts now has ALLOWED_EVENTS, a typed allowlist of properties for each event, enforced in sanitize(). Test: src/__tests__/analyticsAllowlist.test.ts.

IN PROGRESS
Nothing is half-done. The integrations header and the Account note are done. The loop sent that task three more times; drop it from the task source.

DECISIONS
- The integrations eyebrow stays the live connection count, because integrations.render.test.tsx pins its English. No settings.integrationsEyebrow key.
- feature_used keeps the old shape check (shapeOnly(), with a ponytail: comment). Two existing tests in analytics.test.ts pin keys that no code sends: "free text and addresses never reach the wire" and "scalars survive and non-scalars do not". Isa must approve changing those tests; then move feature_used onto its strict list and delete shapeOnly(), the shape constants and the redact import.
- Analytics stays opt-in and off (DECISIONS.md, pinned by a test), even though Row 8 says on by default. Isa to decide.
- Tests that check English text is gone match the quoted string, because allText also turns props into text (for example the gradientUnits prop).
- Locale files are in src/lib/i18n/locales/, not src/i18n.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. No git, Prettier or Maestro.
- zsh rejects grep --include. perl misses accented patterns; use Edit for those.
- i18n is fixed to lng 'en', so es and fr show only in tests.

UNFIXED
- Row 7 owner steps: the DSN, the "@sentry/react-native" plugin in app.config.js, and SENTRY_AUTH_TOKEN for source maps.
- Crash reporting has no opt-out.
- PRIVACY_DATA.md is missing.
- No PostHog sink yet.
- trial_started is never sent.
- English body copy remains on Support, Privacy, Scan accuracy and Integrations.
- Spanish uses "Tus datos" for both the Account and the Privacy eyebrows.
- fr.json has straight apostrophes in "d'un coup" and "d'aliments".
- es.json has addMenu.voice and addMenu.describeOutLoud, which en and fr lack.

NEXT
Get Isa's decision on the two feature_used tests, then do Row 8 step 2: the PostHog sink behind an environment variable.