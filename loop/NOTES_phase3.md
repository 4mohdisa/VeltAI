# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row per prompt. Say built, never verified on a device. Every prompt starts with the branch rule.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail. zsh rejects grep --include.
- Round 223 checkpoint: tsc 0; Jest 205 suites, 1227 tests, all pass. Go full run round 220: 637 pass, 20 TestPG skipped.
- Rounds 226 to 228 changed SettingsList, Support, Privacy. Full Jest not run since. Run at next checkpoint.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Local Postgres 17 normally stopped: pg_ctl -D /opt/homebrew/var/postgresql@17; stop after.
- Postgres role 'authenticated' from round 211: leave unless Isa asks.
- Locales: src/lib/i18n/locales/ (en, es, fr). Name files fully in prompts.
- Handover summary (rounds 215 to 218) is stale. This file wins.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default in code. Brief said on. Isa confirms before Phase 4.
- PostHog host: unset uses SDK default; set value must be https with hostname, else sink off. PRIVACY_DATA.md host item matches code: answer 'already matches'.
- Sink opts in via store listener in analytics.ts (settings/store.ts off limits).
- Analytics switch lives in src/app/profile/privacy.tsx. No second switch on main Settings.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %. Spanish tu, French vous.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test.
- Render tests end .render.test.tsx in src/__tests__/render/. Profile render tests mock StreakCounter.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Row 9 export: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares the 120/min write limit. Feedback migration not applied to any local DB. Device fields sent only when switch on (default off). Support mail box kept as contact link.
- Row 15 copy-pass notes stay on Row 15 until Isa names another row.
- Checkpoint rounds change no files.
- Round 229: Privacy body copy chosen over full Jest (loop decides checkpoints).

## Done
- Rows 1 to 4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps, app.config plugin). No crash opt-out.
- Row 8 PARTIAL: allowlist, sink, host validation, consent sync, localised switch, PRIVACY_DATA.md. Anonymous ID and version tags need device check.
- Row 9 BUILT (owner check pending: export on seeded heavy user). TestPG_ExportHasOnlyCallerRowsAndNoTokens skipped.
- Row 10 BUILT (owner check pending: Settings to feedback to POST /api/feedback flow).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: headers on account, integrations, preferences, support, privacy, scan-calibration. Privacy Export row done round 228.

## Next
- Round 229: Privacy 'Your data' title and health footer in en, es, fr.
- Row 15 tail: Scan accuracy and Integrations body copy; Spanish 'Tus datos' eyebrows; fr.json straight apostrophes; preferences 'Units' eyebrow; goals spoken calorie label, hard-coded g, % and comma join.
- Full app Jest at next checkpoint.
- Row 8: anonymous ID and version tags (device check, owner).
- Rerun TestPG_* in backend/tests and export_test.go once a throwaway local DB is up.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, fix or remove backend/scripts/seed_demo_account.go (no host guard).
- Row 6 measurements parked until a sign-in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- Permission to add feedback owned rows to backend/internal/auth/export.go; without it TestExportCoversEveryUserTable fails. Asked twice; carry on.
- Apply feedback migration to hosted Supabase (owner).
- Which local DB is Lume's; lume_audit one migration behind (20260911000001). Apply only if named.
- Feedback retention undefined (owner).
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests in analytics.test.ts.
- Analytics on (brief) vs opt-in (code): confirm before Phase 4.
- PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner).
- Privacy footer 'First-party only' false once key set. Default kept.
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path. Blocks rows 6 and 9 device checks.
- Goals loading/error, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner checks: Food tab offline banner; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm Spanish 'Escribir a soporte' and French 'Ecrire a l'assistance' wording for Email support.
- Confirm Privacy export error toast English wording (now matches main Settings).
- Wording and number grouping defaults kept.

## Parked (not Phase 3)
- Backend/pinned: getMorningBrief swallows errors; getProfile .catch hides errors; useBrainProfile no error state; no anomalies endpoint; AnomalyBanner no Retry; 18 backend DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns (1 critical); Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci).
- UI/data: useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; Session.tsx English strings; MacroBars unused; formatCalories always kcal; addMenu keys only in es; freeze offline toast claims success on failure; nutrition ring unit spoken as abbreviation; week.tsx flat bars at 0 kcal; BrainProfileCard numbers unformatted; crash messages may carry server text via ApiError.
- Lint and headers: lint in gymSchedule.ts, hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts, support.tsx.
- Privacy and export: trial_started never sent; events without key still reach Lume backend when opted in; bad PostHog host turns sink off silently; US cloud default unconfirmed; PRIVACY_DATA.md does not list feedback; export returns whole profiles row; export sent as text not .json; export about 33 queries counted as one read; export share subject hard-coded 'Lume data export'; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no tighter limit than 120/min writes; Support mail box overlaps feedback; Support Email row swallows Mail open errors; Row 10 notes from rounds 216 and 218 out of date.
- Phase 4: delete-account.tsx and subscription.tsx; authenticated role in local Postgres 17.