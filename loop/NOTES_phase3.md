# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row per prompt. Say built, never verified on a device.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail. zsh rejects grep --include.
- Last full checkpoint: round 220 (tsc 0; Jest 204 suites, 1225 tests, 4 snapshots; Go 637 pass, 20 TestPG skipped, 0 fail).
- Round 223: checkpoint, tsc and full app Jest, no files changed. Result pending.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Postgres role 'authenticated' left from round 211: leave unless Isa asks.
- Local Postgres 17 normally stopped. Start with pg_ctl -D /opt/homebrew/var/postgresql@17; stop after.
- Name files fully in prompts (handover after round 216).

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default in code. Brief said on. Isa confirms before Phase 4.
- PostHog host optional: unset uses SDK default; set value must be https with hostname, else sink off. PRIVACY_DATA.md host item already matches code (answer 'already matches').
- Sink opts in via store listener in analytics.ts (settings/store.ts off limits).
- Analytics switch lives in src/app/profile/privacy.tsx. No second switch on main Settings.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %. Spanish uses tu, French uses vous.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test.
- Render tests end .render.test.tsx in src/__tests__/render/. Profile render tests mock StreakCounter.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Row 9 export: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares the 120/min write limit. Feedback migration not applied to any local DB.
- Row 10 export line approved (round 219): {"feedback", ownedRows("feedback")} in backend/internal/auth/export.go.
- Row 10 screen: device fields sent only when switch on (default off).
- Checkpoint rounds change no files.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps, app.config plugin). No crash opt-out.
- Row 8 PARTIAL: allowlist, sink, host validation, consent sync, localised switch, PRIVACY_DATA.md. Anonymous ID and version tags need device check.
- Row 9 BUILT (owner check pending: export on seeded heavy user). TestPG_ExportHasOnlyCallerRowsAndNoTokens skipped.
- Row 10 PARTIAL: feedback table, POST /api/feedback, backend tests, feedback screen (7 render tests pass), export line, PRIVACY_DATA.md Feedback section (round 222), Settings row BUILT (round 221). Device check pending.
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: headers BUILT on account, integrations, preferences, support, privacy, scan-calibration. Body copy remains.

## Next
- Row 10: Support screen has its own mail feedback box and hard-coded English. Decide or park.
- Row 8: anonymous ID and version tags (device check pending).
- Rerun TestPG_* in backend/tests and export_test.go once a throwaway local DB is up.
- Row 15 tail: Support, Privacy, Scan accuracy, Integrations body copy; Spanish 'Tus datos' on Account and Privacy eyebrows; fr.json straight apostrophes; preferences eyebrow 'Units'; goals spoken calorie label, hard-coded g, % and comma join; Privacy duplicate export row; destructive Settings hint 'Double tap to continue' hard-coded in SettingsList.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, fix or remove backend/scripts/seed_demo_account.go (no host guard).
- Row 6 measurements parked until a sign-in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- Apply feedback migration to hosted Supabase (owner step).
- Which local DB is Lume's? lume_audit is one migration behind (20260911000001). Apply only if Isa names it.
- Feedback retention: not defined in code. Owner to decide.
- Round 222 PRIVACY_DATA.md task: report said tests not run; flagged twice. Not retried. Section is in the file.
- feature_used strict list and shapeOnly() cleanup: needs permission to edit two pinned tests in analytics.test.ts.
- Analytics on by default (brief) vs opt-in (code). Confirm before Phase 4.
- PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner step).
- Privacy footer 'First-party only, on our own servers' false once key set. Default kept.
- Device maker, model, OS to PostHog? Default: not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 device checks.
- Goals loading/error, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check: Food tab offline banner in simulator.
- Wording and number grouping defaults kept.
- Export export.go approval: granted round 219, done.

## Parked (not Phase 3)
getMorningBrief swallows errors (pinned); getProfile .catch hides errors; AnomalyBanner no Retry; no anomalies endpoint; useBrainProfile no error state; Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci); 18 backend DB tests skipped without LUME_TEST_DATABASE_URL; useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; lint in gymSchedule.ts, hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts; Session.tsx English strings; Privacy screen English body; MacroBars unused; formatCalories always kcal; addMenu keys only in es; freeze offline toast claims success on failure; nutrition ring unit spoken as abbreviation; week.tsx flat bars when all 0 kcal; BrainProfileCard numbers unformatted; crash messages may carry server text via ApiError; npm audit 48 vulns (1 critical); trial_started never sent; events without key still reach Lume backend when opted in; bad PostHog host turns sink off silently; US cloud default unconfirmed; es.json extra addMenu keys; export returns whole profiles row; export sent as text, not .json file; export about 33 queries counted as one read; Support mail feedback box overlaps Row 10; two Export rows (Privacy and main Settings) until Row 15 copy pass; app_version sent with build number; feedback app_version carries build number; feedback no tighter limit than 120/min writes; delete-account.tsx and subscription.tsx are Phase 4; authenticated role may remain in local Postgres 17.
