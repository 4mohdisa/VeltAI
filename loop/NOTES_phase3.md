# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device.

## Commands and state
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- PHASE3_ROWS.md stays 22 lines; append notes inside the row cell.
- Locales: src/lib/i18n/locales/ (en, es, fr). Name files fully.
- Round 252 gates: tsc 0; Jest 213 suites, 1252 tests, 4 snapshots pass. Go 637 pass, 20 TestPG skipped.
- Round 265: Row 17 ExercisePicker back copy done. PlannedValuesForm.tsx still hard-coded English.
- Round 266 loop flag: Row 17 partial. Finish before moving on.

## Done
- BUILT: 1, 2, 3, 4, 7, 9, 10. Owner checks pending on 3, 5 part 1, 7, 9, 10.
- PARTIAL: 5 (part 2 needs sign-in), 8 (device check), 12, 13, 14, 15, 16, 17.
- DIFFERENT: 6, 11.

## Next
- Row 17: PlannedValuesForm.tsx translation (round 266), then ai-query copy (src/app/ai-query.tsx only).
- Row 15: nutrition.tsx spoken kcal labels wait on macros snapshot approval.
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, last.
- Row 6: measurements parked until a sign-in path exists.
- Rerun TestPG_* and export_test.go once a throwaway local DB is up.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in, off by default in code (brief said on). Isa confirms before Phase 4.
- PostHog host unset uses SDK default; a set value must be https with hostname, else sink off.
- Analytics switch lives in src/app/profile/privacy.tsx only.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- French: no-break space before ':', '?' and inside guillemets; curly apostrophes; es and fr plain space before %. Spanish tu, French vous.
- Snapshots: no regeneration without Isa. Existing tests never edited. Broken existing test: back out and report.
- Render tests end .render.test.tsx in src/__tests__/render/.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Row 9: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB. Device fields only when switch on (default off). Typed routes need 'as Href' for /profile/feedback.
- spokenEnergy in src/lib/units.ts. kJ keeps abbreviation until Isa answers.
- Row 16 skeleton repeat-visit fix parked; keep the test.
- Rounds 252-266: Isa not asked again; defaults apply.
- Check every prompt against files first; some past prompts asked for work already done.
- Round 266: PlannedValuesForm is shared with session.tsx; translate the component, do not edit session.tsx.

## Blocked on Isa (defaults used, do not re-ask)
- hooks.ts is off limits: food search loading timing, Recipe recents scope, exercise picker 'No matches' flash. Parked.
- Exercise picker failed read 'No exercises found' (gymSchedule.ts): parked.
- Ask Lume 503 and 'not enough data' (aiBrain.ts): parked.
- Row 16 skeleton fix needs permission for profileEmptyStates.render.test.tsx test 1: parked.
- Macros snapshot (detailChrome.render.test.tsx): backed out; nutrition spoken kcal labels wait on it.
- week.tsx snapshot regeneration and goals loading/error refetch in hooks.ts: need permission.
- Keep as is: Integrations 'Nothing connected'; Privacy 'Your data' English; Spanish Account and Privacy eyebrows 'Tus datos'; feedback rows in backend/internal/auth/export.go; privacy footer 'First-party only' once key set.
- Apply feedback migration to hosted Supabase (owner). Feedback retention undefined.
- Which local DB is Lume's; lume_audit one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code): confirm before Phase 4.
- PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST (owner).
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Owner checks: Food tab offline banner; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm wording: Spanish 'Escribir a soporte', French 'Ecrire a l'assistance', Privacy export error toast, Scan and Integrations es/fr, Profile error and privacy failure, exercise picker Abdomen/Abdos, French 'plus de {{food}}' elision.
- kJ spoken as 'kilojoules': needs a second key.
- es.json addMenu.voice and addMenu.describeOutLoud: keep or remove?

## Parked (not Phase 3)
- Row 16 repeat visit: skeleton shows briefly for all-zero real streak. Needs hydrated flag in src/lib/data.
- Preferences kept in memory (src/lib/settings/store.ts).
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns; Jest drift 30.0.5 vs 29.7.0 (fix with npm ci).
- seed_demo_account.go prints App Store notes and demo login (Phase 4).
- UI/data: useTemplates drops on refetch failure; English weekday letters, muscle names, Session.tsx; MacroBars unused; formatCalories always kcal; freeze offline toast claims success; week.tsx flat bars; BrainProfileCard unformatted; crash messages may carry server text; library names, equipment and badges English.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; stale headers; scan-calibration.tsx:50 console.warn; relative-time keys have no plurals.
- Privacy and export: trial_started never sent; events without key reach backend when opted in; bad PostHog host silently off; US cloud default unconfirmed; export returns whole profiles row, sent as text not .json; share subject hard-coded; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback; Support Email swallows Mail errors; 'Help and feedback' vs 'Send feedback' label.
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.

## Gotchas
- No git, Prettier or Maestro. zsh: use xargs or ${=var} for lists.
- Use node with s.replace(a, () => b), not Perl. Check bytes after edits (no double encoding).
- Jev signals are advisory only; never mention them in prompts.