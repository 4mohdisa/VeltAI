# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git (reading .git/HEAD allowed), Prettier or Maestro. One screen or component per prompt. Rows say built, never verified. Check .git/HEAD first.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last checkpoint round 187: tsc 0; Jest 198 suites, 1190 tests, 4 snapshots.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- zsh rejects grep --include. perl misses accented patterns; use Edit.
- API client src/lib/api.ts. Locales src/lib/i18n/locales/. i18n fixed to lng 'en'.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default (defaultOptIn false, pinned). Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists. Empty or failed with no data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test.
- Render tests end .render.test.tsx in src/__tests__/render/.
- New eyebrow keys sit next to title key in settings.* or profile.*.
- Integrations eyebrow stays live connection count. No settings.integrationsEyebrow.
- Visible bracket labels stay. Only spoken labels change.
- Jest mock factories reference only mock* variables.
- Spanish uses tu, French uses vous.
- Row 15 copy tail deferred until after Row 10.
- Row 8 feature_used keeps shapeOnly() shape check. Strict list needs Isa approval.
- Analytics switch lives in src/app/profile/privacy.tsx. No second switch on main Settings.
- PRIVACY_DATA.md place name: 'Settings → Privacy'.
- Flagged reports (tests not run) are fixed by running tsc and the changed Jest files in the next round's task.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps, app.config plugin). No crash opt-out yet.
- Row 8 PARTIAL: step 1 (ALLOWED_EVENTS, analyticsAllowlist.test.ts); step 2a (analyticsSink.ts behind EXPO_PUBLIC_POSTHOG_KEY, 4 tests); step 2c (setSinkOptIn from flag listener); step 2b (analytics switch localised, settingsAnalytics.render.test.tsx); PostHog pinned 4.87.1; PRIVACY_DATA.md opt-out line and place name fixed (round 193).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: headers BUILT on account, integrations, preferences, support, privacy, scan-calibration. Body copy remains.

## In progress
- Round 194: Row 8 sign-out resets PostHog identity via resetSink(), new test src/__tests__/analyticsReset.test.ts. Run tsc and changed Jest files.

## Next
- Row 8: EXPO_PUBLIC_POSTHOG_HOST; anonymous ID persistence (check on device); app version and build tags.
- Row 8 crash opt-out: Settings switch needs a flag in store.ts (permission needed).
- Row 8 follow up: when Isa approves, feature_used to strict list and delete shapeOnly().
- Row 9: Export my data (backend route plus Settings row). Needs E2E creds for heavy user check.
- Row 10: Help and feedback (screen, feedback table locally, rate limit).
- Row 15 tail (after Row 10): Integrations body copy; Support, Privacy, Scan accuracy body copy; Spanish 'Tus datos' for Account and Privacy eyebrows; fr.json straight apostrophes; preferences eyebrow 'Units'; goals spoken calorie label, hard-coded g, % and comma join.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md.
- Row 6 measurements parked until sign-in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- feature_used strict list: approval needed to edit two pinned tests in analytics.test.ts.
- Analytics on by default (Row 8 brief) vs opt-in and off (code, pinned). Isa to confirm before Phase 4.
- PostHog key as EXPO_PUBLIC_POSTHOG_KEY (owner step).
- Privacy footer 'First-party only, on our own servers' false once PostHog is live. Isa approves new wording.
- Device data: whether PostHog gets device maker, model and OS.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Goals loading/error, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Number grouping: formatNumber en-AU, units.ts en-US. brainProfileCard.i18n.render pins 2140.
- Wording: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording, About tagline, Account Display name, Email, toasts.
- InsightCard 120-character rule pinned by insightCard.i18n.render. Default kept.

## Parked (not Phase 3)
getMorningBrief swallows errors (api.ts, pinned by aiFallback.test.ts); getProfile .catch hides errors; AnomalyBanner no Retry; banner count lacks _one; no anomalies endpoint; useBrainProfile no error state; Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci); 18 backend DB tests skipped without LUME_TEST_DATABASE_URL; useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; backend/scripts/seed_demo_account.go no host guard (fix or remove in Row 11); lint in gymSchedule.ts, hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts; Session.tsx 'Progress saved' and alert 'Save' English; Privacy screen English (policy and terms rows, AI processing, Your data, toasts); MacroBars unused and English; formatCalories always kcal; addMenu.voice, addMenu.describeOutLoud only in es; addMenu.snack; react-test-renderer deprecation warnings; freeze offline toast claims success on failure; Fibre VoiceOver key; insight type badge for unknown types; nutrition ring unit spoken as abbreviation; week.tsx flat bars when all 0 kcal; BrainProfileCard numbers not formatted; crash exception messages may carry server text via ApiError; npm audit 48 vulnerabilities (1 critical) not investigated; trial_started in event list, never sent; PostHog host not set (US cloud); events without a key still reach Lume backend when opted in; user opted in at launch relies on flag start, no end-to-end test; delete-account.tsx and subscription.tsx are Phase 4; no unit change feedback.

## Loop note
- Handover at round 187. Name files fully in prompts.
- Integrations header task is DONE. Do not re-send it.