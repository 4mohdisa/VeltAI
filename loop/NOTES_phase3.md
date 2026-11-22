# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified on a device.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last full checkpoint: round 199, tsc 0, Jest 202 suites, 1210 tests, 4 snapshots, all pass.
- Round 202: tsc 0 (PRIVACY_DATA.md edit). Jest not run since round 199. Flagged by loop; round 203 closes it.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- zsh rejects grep --include. perl misses accented patterns; use Edit.
- API client src/lib/api.ts. Locales src/lib/i18n/locales/. i18n fixed to lng 'en'.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default (pinned). Isa confirms before Phase 4.
- PostHog host: EXPO_PUBLIC_POSTHOG_HOST optional; unset means PostHog US default. Must be https with a hostname, else sink off.
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
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Analytics switch lives in src/app/profile/privacy.tsx. No second switch on main Settings.
- PRIVACY_DATA.md place name: 'Settings → Privacy'.
- Checkpoint rounds change no files; fixes are queued for the next task.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps, app.config plugin). No crash opt-out yet.
- Row 8 PARTIAL: allowlist; analyticsSink.ts behind EXPO_PUBLIC_POSTHOG_KEY; host validation (15 sink tests); consent sync; localised switch; PostHog 4.87.1; sign-out reset; PRIVACY_DATA.md host item partly fixed.
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: headers BUILT on account, integrations, preferences, support, privacy, scan-calibration. Body copy remains.

## In progress
- Round 203: PRIVACY_DATA.md host item, add unset or empty sentence (per code). Run tsc and analyticsSink Jest.

## Next
- Row 8: anonymous ID persistence (check on device); app version and build tags.
- Row 8 crash opt-out: Settings switch needs a flag in store.ts and Privacy screen change (permission needed).
- Row 8 follow up: when Isa approves, feature_used to strict list and delete shapeOnly().
- Row 8: invalid EXPO_PUBLIC_POSTHOG_HOST should log a warning or be listed in KNOWN_ISSUES (decide in Row 11).
- Row 9: Export my data (backend route plus Settings row). Needs E2E creds for heavy user check.
- Row 10: Help and feedback (screen, feedback table locally, rate limit).
- Row 15 tail (after Row 10): Integrations, Support, Privacy, Scan accuracy body copy; Spanish 'Tus datos' for Account and Privacy eyebrows; fr.json straight apostrophes; preferences eyebrow 'Units'; goals spoken calorie label, hard-coded g, % and comma join.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md.
- Row 6 measurements parked until sign-in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- feature_used strict list: approval needed to edit two pinned tests in analytics.test.ts.
- Analytics on by default (Row 8 brief) vs opt-in and off (code, pinned). Isa to confirm before Phase 4.
- PostHog key and region as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner step).
- Privacy footer 'First-party only, on our own servers' false once PostHog is live. Ask Isa when a key is first set. Default kept.
- Device data: whether PostHog gets device maker, model and OS.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Goals loading/error, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Number grouping: formatNumber en-AU, units.ts en-US. brainProfileCard.i18n.render pins 2140.
- Wording items (Snacks, Fibre, weekday caps, toasts, About tagline): default kept.
- InsightCard 120-character rule pinned by insightCard.i18n.render. Default kept.

## Parked (not Phase 3)
getMorningBrief swallows errors (pinned); getProfile .catch hides errors; AnomalyBanner no Retry; banner count lacks _one; no anomalies endpoint; useBrainProfile no error state; Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci); 18 backend DB tests skipped without LUME_TEST_DATABASE_URL; useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; backend/scripts/seed_demo_account.go no host guard (fix or remove in Row 11); lint in gymSchedule.ts, hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts; Session.tsx 'Progress saved' and alert 'Save' English; Privacy screen English (policy and terms rows, AI processing, Your data, toasts); MacroBars unused and English; formatCalories always kcal; addMenu.voice, addMenu.describeOutLoud only in es; addMenu.snack; react-test-renderer deprecation warnings; freeze offline toast claims success on failure; Fibre VoiceOver key; insight type badge for unknown types; nutrition ring unit spoken as abbreviation; week.tsx flat bars when all 0 kcal; BrainProfileCard numbers not formatted; crash exception messages may carry server text via ApiError; npm audit 48 vulnerabilities (1 critical) not investigated; trial_started in event list, never sent; events without a key still reach Lume backend when opted in; user opted in at launch relies on flag start, no end-to-end test; delete-account.tsx and subscription.tsx are Phase 4; no unit change feedback; crash reporting has no opt-out; bad PostHog host turns sink off silently (no log); host URL check tested only under Jest Node, not on React Native runtime; es.json extra addMenu keys; fr.json straight apostrophes.

## Loop note
- Handover at round 187. Name files fully in prompts.
- Round 199 checkpoint closed the partly-done flag with evidence.
- Round 201-202 fixed the PostHog host doc line in two steps.
- Round 203: loop flagged the round 202 report for an unrecorded gate. Re-run tsc and analyticsSink Jest.
- Every prompt starts with the branch rule.