# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 252 checkpoint: tsc 0; Jest 213 suites, 1252 tests, 4 snapshots pass. Go 637 pass, 20 TestPG skipped (no local DB).
- Round 264: Row 17 planned-values back control translated (exercisePicker.back, exercisePicker.backLabel). Round 265: checking the rest of that step for hard-coded English (loop flag: partial).
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Locales: src/lib/i18n/locales/ (en, es, fr). Name files fully in prompts.
- PHASE3_ROWS.md stays at 22 lines; append notes inside the row cell.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in and off by default in code (brief said on). Isa confirms before Phase 4.
- PostHog host: unset uses SDK default; set value must be https with hostname, else sink off.
- Analytics switch lives in src/app/profile/privacy.tsx only. Sink opts in via store listener in analytics.ts.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- French: no-break space before ':', '?' and inside guillemets. Curly apostrophes. es and fr plain space before %. Spanish tu, French vous.
- Snapshots: no regeneration without Isa. Existing tests never edited. Broken existing test: back out and report.
- Render tests end .render.test.tsx in src/__tests__/render/.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Row 9: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB. Device fields only when switch on (default off). Typed routes need 'as Href' for /profile/feedback.
- kJ keeps abbreviation until Isa answers.
- spokenEnergy lives in src/lib/units.ts; food.tsx uses it. nutrition.tsx change backed out (see Blocked).
- Row 16 skeleton repeat-visit fix parked. Default: keep the test.
- Rounds 252-265: Isa not asked again (defaults apply).
- Round 263 flag: partial first-use work accepted; back control finished in round 264.

## Done
- BUILT: 1, 2, 3, 4, 7, 9, 10. Owner checks pending on 3, 5 part 1, 7, 9, 10.
- PARTIAL: 5 (part 2 needs sign-in), 8 (device check), 12 (until Isa says built), 13, 14, 15, 16, 17.
- DIFFERENT: 6, 11.

## Next
- Row 17: finish ExercisePicker planned-values check (round 265), then ai-query copy (src/app/ai-query.tsx only).
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, last.
- Row 6 measurements parked until a sign-in path exists.
- Rerun TestPG_* and export_test.go once a throwaway local DB is up.
- Row 15: nutrition.tsx spoken kcal labels wait on macros snapshot approval.

## Blocked on Isa (defaults used, do not re-ask)
- hooks.ts change: food search loading as soon as query changes. Default: hooks.ts stays off limits.
- New Recipe recents come from the selected log day only (hooks.ts:274). Default: parked.
- Exercise picker failed read shows 'No exercises found' (gymSchedule.ts). Default: parked.
- Exercise picker 'No matches' flash while typing (hooks.ts). Default: parked.
- Ask Lume 503 message and 'not enough data' (aiBrain.ts). Default: parked.
- Row 16 skeleton fix: needs permission to change profileEmptyStates.render.test.tsx test 1. Default: parked.
- Macros snapshot (detailChrome.render.test.tsx): default stays backed out. Nutrition spoken kcal labels wait on it.
- Integrations failed list reads 'Nothing connected'. Default: keep.
- Privacy 'Your data' title stays English. Default: keep.
- Spanish Account and Privacy eyebrows both 'Tus datos'. Default kept.
- Feedback-owned rows in backend/internal/auth/export.go. Default kept.
- Apply feedback migration to hosted Supabase (owner). Feedback retention undefined.
- Which local DB is Lume's; lume_audit one migration behind. Apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code): confirm before Phase 4.
- PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner).
- Privacy footer 'First-party only' false once key set. Default kept.
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Goals loading/error and refetch on hooks: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner checks: Food tab offline banner; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm Spanish 'Escribir a soporte', French 'Ecrire a l'assistance', Privacy export error toast, Scan and Integrations es/fr wording, Profile error and privacy failure wording, exercise picker es/fr wording (Abdomen, Abdos).
- kJ spoken as 'kilojoules': needs a second key.
- es.json keys addMenu.voice and addMenu.describeOutLoud: keep or remove?
- Spanish/French wording from rounds 242-243 (French 'plus de {{food}}' does not elide before vowels).
- Nutrition spoken kcal labels (nutrition.tsx) once macros snapshot is approved.

## Parked (not Phase 3)
- Row 16 repeat visit: skeleton shows briefly for all-zero real streak. Needs a hydrated flag in src/lib/data.
- Preferences kept in memory, lost on restart (src/lib/settings/store.ts).
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; useBrainProfile no error state; no anomalies endpoint; AnomalyBanner no Retry; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns (1 critical); Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci).
- seed_demo_account.go prints App Store notes and demo login (Phase 4). Reads DATABASE_URL twice.
- UI/data: useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Session.tsx English; MacroBars unused; formatCalories always kcal; freeze offline toast claims success on failure; week.tsx flat bars at 0 kcal; BrainProfileCard numbers unformatted; crash messages may carry server text.
- Exercise library names, equipment and difficulty badges are English data.
- Code hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts, support.tsx; scan-calibration.tsx:50 dev console.warn; relative-time keys have no plural forms.
- Privacy and export: trial_started never sent; events without key reach Lume backend when opted in; bad PostHog host turns sink off silently; US cloud default unconfirmed; export returns whole profiles row; export sent as text not .json; share subject hard-coded; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no limit tighter than 120/min writes; Support mail overlaps feedback; Support Email row swallows Mail errors; label 'Help and feedback' vs 'Send feedback' open.
- Phase 4: delete-account.tsx and subscription.tsx; authenticated role in local Postgres 17.

## Gotchas
- No git, Prettier or Maestro. zsh does not split $var lists: use xargs or ${=var}.
- Perl replacement strings interpolate ${...}: use node with s.replace(a, () => b). Perl without -CSD double-encodes: check bytes after edits.
- PHASE3_ROWS.md must stay at 22 lines; append notes inside the row cell.
- Every prompt must state the loop/phase3 branch rule.
- Jev signals are advisory only; never mention Jev in prompts.