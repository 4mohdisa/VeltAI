# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git (reading .git/HEAD is allowed), Prettier or Maestro. One screen or component per prompt. Rows say built, never verified. Check .git/HEAD first in every prompt.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 187 checkpoint passed: tsc 0; Jest 198 suites, 1190 tests, 4 snapshots.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- zsh rejects grep --include. perl misses accented patterns; use Edit.
- API client: src/lib/api.ts. Locales: src/lib/i18n/locales/.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics default: opt-in and off, per existing code and pinned test. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists. Empty or failed with no data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test.
- Render tests end .render.test.tsx in src/__tests__/render/.
- New eyebrow keys sit next to title key in settings.* or profile.*.
- Integrations eyebrow stays the live connection count. No settings.integrationsEyebrow.
- Visible bracket labels stay. Only spoken labels change.
- Jest mock factories reference only mock* variables.
- Spanish uses tu, French uses vous.
- Row 15 copy tail deferred until after Row 10.
- Row 8 feature_used keeps shapeOnly() shape check. Strict list needs Isa approval.
- Analytics switch lives in src/app/profile/privacy.tsx. No second switch on main Settings.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps, app.config plugin). No crash opt-out yet.
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: headers BUILT on account, integrations, preferences, support, privacy, scan-calibration. Body copy remains (see tail).
- Row 8 PARTIAL: step 1 (ALLOWED_EVENTS, analyticsAllowlist.test.ts). Step 2a (analyticsSink.ts behind EXPO_PUBLIC_POSTHOG_KEY, 4 tests). Step 2c (setSinkOptIn from flag listener). Step 2b (analytics switch localised, hint, settingsAnalytics.render.test.tsx). Gates re-run: tsc 0, 5 suites pass. PostHog pinned 4.87.1.

## In progress
- Round 190: PRIVACY_DATA.md for Row 8 (every event, property, receiving service, reason).

## Next
- Row 8 sink fixes, one per round: defaultOptIn false in initAnalyticsSink(); sign-out resets PostHog; EXPO_PUBLIC_POSTHOG_HOST; anonymous ID persistence (storage package not installed); app version and build tags.
- Row 8 crash opt-out: Settings switch for crash reports needs a flag in store.ts (permission needed).
- Row 8 follow up: when Isa approves, feature_used to strict list and delete shapeOnly().
- Row 9: Export my data (backend route plus Settings row). Needs E2E creds for heavy user check.
- Row 10: Help and feedback (screen, feedback table locally, rate limit).
- Row 15 tail (after Row 10): Integrations body copy; Support, Privacy, Scan accuracy body copy; Spanish 'Tus datos' for Account and Privacy eyebrows; fr.json straight apostrophes; preferences eyebrow 'Units'; goals spoken calorie label, hard-coded g, % and comma join.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md.
- Row 6 measurements parked until sign-in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- feature_used strict list: needs approval to edit two pinned tests in analytics.test.ts.
- Analytics on by default (Row 8 brief) vs opt-in and off (code, pinned test). Isa to confirm before Phase 4.
- PostHog key needed as EXPO_PUBLIC_POSTHOG_KEY (owner step).
- Privacy footer 'First-party only, on our own servers' false once PostHog is live. Isa approves new wording. Recorded in PRIVACY_DATA.md.
- InsightCard 120-character rule pinned by insightCard.i18n.render. Default kept.
- Goals spoken labels: keep as is.
- Goals loading and error, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Number grouping: formatNumber en-AU, units.ts en-US. brainProfileCard.i18n.render pins 2140.
- Wording: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording, About tagline, Account Display name, Email, toasts.
- Insight errors: aiFallback.test.ts pins empty fallbacks. No anomalies endpoint. useBrainProfile has no error state.

## Parked (not Phase 3)
- getMorningBrief swallows errors (api.ts), pinned by aiFallback.test.ts.
- AnomalyBanner has no Retry. Banner count lacks _one.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci.
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure.
- Date helpers use device locale. Weekday letters, muscle names English.
- Ask Lume drops 503 message.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts, hooks.ts. Stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- Privacy screen English: policy and terms rows, AI processing, 'Your data', toasts.
- MacroBars unused and English. formatCalories always kcal.
- addMenu.voice, addMenu.describeOutLoud only in es. addMenu.snack.
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure.
- Fibre VoiceOver key. Insight type badge for unknown types.
- Nutrition ring unit spoken as abbreviation.
- week.tsx flat bars when every day is 0 kcal.
- Insight catch blocks: getProfile .catch hides errors.
- BrainProfileCard numbers not formatted for language.
- Crash reporting exception messages may carry server text via ApiError.
- npm audit: 48 vulnerabilities (1 critical) reported on install. Not investigated.
- trial_started in event list, nothing sends it.
- PostHog sign-out does not reset identity; accounts on one phone share an anonymous ID.
- PostHog host not set; events go to US cloud.
- delete-account.tsx and subscription.tsx: Phase 4.
- Unit change feedback: none yet.

## Loop note
- Handover at round 187. Name files fully in prompts.
- Integrations header task is DONE. Do not re-send it.