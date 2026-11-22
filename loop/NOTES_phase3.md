# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last checkpoint round 244: tsc 0; Jest 212 suites, 1250 tests, 4 snapshots. Go 637 pass, 20 TestPG skipped (no local DB).
- Next checkpoint: round 252 (gates only, no file changes).
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Locales: src/lib/i18n/locales/ (en, es, fr). Name files fully in prompts.
- PHASE3_ROWS.md is a table: append notes inside the row cell, never as a new line.
- Profile render tests mock StreakCounter.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default in code (brief said on). Isa confirms before Phase 4.
- PostHog host: unset uses SDK default; set value must be https with hostname, else sink off.
- Sink opts in via store listener in analytics.ts. Analytics switch lives in src/app/profile/privacy.tsx only.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':', '?' and inside guillemets. Curly apostrophes. es and fr plain space before %. Spanish tu, French vous.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test.
- Render tests end .render.test.tsx in src/__tests__/render/.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Row 9: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB. Device fields only when switch on (default off). Typed routes need 'as Href' for /profile/feedback.
- kJ keeps abbreviation until Isa answers (spoken as kilojoules needs a second key).
- Round 248: food.tsx kcal label picked over Row 11 because rows 12 to 15 are still PARTIAL.
- Round 249: spokenEnergy moved to src/lib/units.ts so food and nutrition share one helper.

## Done
- BUILT: 1, 2, 3, 4, 7, 9, 10. Owner checks pending on 3, 5 part 1, 7, 9, 10.
- PARTIAL: 5 (part 2 needs sign-in), 8 (device check), 12 (until Isa says built), 13, 14, 15.
- DIFFERENT: 6, 11, 16, 17.
- Row 15 so far: headers, Privacy export row, footers, support keys, destructive hint, French punctuation, goals label, Scan and Integrations copy, food.tsx spoken kcal (248).

## Next
- Row 15: dashboard/nutrition.tsx spoken kcal label (round 249, in progress).
- Row 6 measurements parked until a sign-in path exists.
- Rerun TestPG_* and export_test.go once a throwaway local DB is up.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, fix or remove backend/scripts/seed_demo_account.go (no host guard).

## Blocked on Isa (defaults used, do not re-ask)
- Spanish Account and Privacy eyebrows both 'Tus datos'. Default kept.
- Permission to edit src/__tests__/render/privacyLocale.render.test.tsx line 56. Default: Privacy title stays English.
- Feedback-owned rows in backend/internal/auth/export.go. Default kept.
- Apply feedback migration to hosted Supabase (owner). Feedback retention undefined.
- Which local DB is Lume's; lume_audit one migration behind. Apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code): confirm before Phase 4.
- PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner).
- Privacy footer 'First-party only' false once key set. Default kept.
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Goals loading/error, profile error path, refetch on hooks: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner checks: Food tab offline banner; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm Spanish 'Escribir a soporte', French 'Ecrire a l'assistance', Privacy export error toast, Scan accuracy and Integrations es/fr wording (incl. French sync toast).
- kJ spoken as 'kilojoules': needs a second key.
- Leftover es.json keys addMenu.voice and addMenu.describeOutLoud: keep or remove?

## Parked (not Phase 3)
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; useBrainProfile no error state; no anomalies endpoint; AnomalyBanner no Retry; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns (1 critical); Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci).
- UI/data: useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; Session.tsx English strings; MacroBars unused; formatCalories always kcal; freeze offline toast claims success on failure; nutrition ring unit spoken as abbreviation; week.tsx flat bars at 0 kcal; BrainProfileCard numbers unformatted; crash messages may carry server text via ApiError.
- Code hygiene: goals.saved unused; scan-calibration.tsx:50 dev-only console.warn; hooks.ts:72 console.warn; lint in gymSchedule.ts and hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts, support.tsx.
- Integrations relative time keys have no plural forms (fine for short units).
- Privacy and export: trial_started never sent; events without key still reach Lume backend when opted in; bad PostHog host turns sink off silently; US cloud default unconfirmed; export returns whole profiles row; export sent as text not .json; export share subject hard-coded; Privacy section title and eyebrow both 'Your data'; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no tighter limit than 120/min writes; Support mail box overlaps feedback; Support Email row swallows Mail open errors; feedback row label 'Help and feedback' vs 'Send feedback' open; Row 10 notes from rounds 216 and 218 out of date.
- Phase 4: delete-account.tsx and subscription.tsx; authenticated role in local Postgres 17.