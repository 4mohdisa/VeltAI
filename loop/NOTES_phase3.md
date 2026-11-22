# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One screen or component per prompt. Say built, never verified on a device.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last full checkpoint: round 210 (tsc 0; Jest 202 suites, 1216 tests, 4 snapshots, all pass).
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- zsh rejects grep --include. Use Edit for accented text.
- PRIVACY_DATA.md host item verified and closed in round 208. Do not regenerate.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default in code (pinned). Brief said on. Isa confirms before Phase 4.
- PostHog host optional. Unset uses SDK default. Set value must be https with hostname, else sink off.
- Analytics sink opts in via store listener in analytics.ts (settings/store.ts off limits).
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists. Empty or failed with no data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test.
- Render tests end .render.test.tsx in src/__tests__/render/.
- New eyebrow keys sit next to title key in settings.* or profile.*.
- Integrations eyebrow stays live connection count. Visible bracket labels stay; only spoken labels change.
- Jest mock factories reference only mock* variables.
- Spanish uses tu, French uses vous.
- Row 15 copy tail deferred until after Row 10.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Analytics switch lives in src/app/profile/privacy.tsx. No second switch on main Settings.
- PRIVACY_DATA.md place name: 'Settings → Privacy'. Host item follows code, no region claim.
- Checkpoint rounds change no files; fixes queued for next task.
- Row 9 export: GET /api/export, existing handler kept. Same auth and limiter as analytics.
- Row 9 A/B test may run on a disposable local Postgres (localhost, throwaway name, local migrations). Never hosted.
- Round 210 checkpoint kept over Jev. Round 211: Row 9 A/B test chosen (Jev run 90%).

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps, app.config plugin). No crash opt-out.
- Row 8 PARTIAL: allowlist, analyticsSink.ts, host validation, consent sync, localised switch, PostHog 4.87.1, sign-out reset, PRIVACY_DATA.md. Anonymous ID and version tags pending device check.
- Row 9 PARTIAL: route exists, export_test.go added, A/B test in progress (round 211).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: headers BUILT on account, integrations, preferences, support, privacy, scan-calibration. Body copy remains.

## Next
- Row 9 A/B test result (round 211). Then Row 9 Settings row with share sheet.
- Row 10: Help and feedback (feedback table locally, rate limit, screen).
- Row 8: anonymous ID persistence and app version tags (device check pending).
- Row 15 tail (after Row 10): Support, Privacy, Scan accuracy, Integrations body copy; Spanish 'Tus datos' for Account and Privacy eyebrows; fr.json straight apostrophes; preferences eyebrow 'Units'; goals spoken calorie label, hard-coded g, % and comma join.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md.
- Row 6 measurements parked until a sign-in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- feature_used strict list: approval needed to edit two pinned tests in analytics.test.ts.
- Analytics on by default (brief) vs opt-in and off (code). Confirm before Phase 4.
- PostHog key and region as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner step).
- Privacy footer 'First-party only, on our own servers' false once PostHog key set. Default kept.
- Device maker, model, OS sent to PostHog? Default: not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 device checks.
- Goals loading/error, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Number grouping: formatNumber en-AU, units.ts en-US. brainProfileCard.i18n.render pins 2140.
- Wording (Snacks, Fibre, weekday caps, toasts, About tagline): default kept.
- InsightCard 120-character rule pinned by insightCard.i18n.render. Default kept.

## Parked (not Phase 3)
getMorningBrief swallows errors (pinned); getProfile .catch hides errors; AnomalyBanner no Retry; banner count lacks _one; no anomalies endpoint; useBrainProfile no error state; Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci); 18 backend DB tests skipped without LUME_TEST_DATABASE_URL; offline console.warn noise in Jest output; useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; backend/scripts/seed_demo_account.go no host guard (fix or remove in Row 11); lint in gymSchedule.ts, hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts; Session.tsx 'Progress saved' and alert 'Save' English; Privacy screen English (policy, terms, AI processing, Your data, toasts); MacroBars unused and English; formatCalories always kcal; addMenu.voice, addMenu.describeOutLoud only in es; addMenu.snack; react-test-renderer deprecation warnings; freeze offline toast claims success on failure; Fibre VoiceOver key; insight type badge for unknown types; nutrition ring unit spoken as abbreviation; week.tsx flat bars when all 0 kcal; BrainProfileCard numbers not formatted; crash exception messages may carry server text via ApiError; npm audit 48 vulnerabilities (1 critical) not investigated; trial_started in event list, never sent; events without a key still reach Lume backend when opted in; opt-in at launch relies on flag start, no end-to-end test; delete-account.tsx and subscription.tsx are Phase 4; no unit change feedback; crash reporting has no opt-out; bad PostHog host turns sink off silently, no log line; host URL check tested only under Jest Node; US cloud default unconfirmed in posthog-react-native 4.87.1; es.json extra addMenu keys; fr.json straight apostrophes; anonymous ID storage not tried on device; export endpoint runs about 33 queries but counts as one read (no tighter limit).

## Loop note
- Handover at round 187 and round 211 context. Name files fully in prompts.
- Round 199 checkpoint closed the partly-done flag with evidence.
- Round 208 flagged partly done on a stale host sentence. Verified absent; closed.
- Round 209 prompt rejected: no branch-only wording. Rewritten in round 210. Keep branch-only wording in every prompt.