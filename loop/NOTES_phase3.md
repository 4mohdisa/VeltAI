# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 252 checkpoint: tsc 0; Jest 213 suites, 1252 tests, 4 snapshots pass. Go 637 pass, 20 TestPG skipped (no local DB).
- Round 260: scan-calibration dev console.warn removed (Row 16). tsc 0; 3 suites, 15 tests pass. Row 16 stays PARTIAL.
- Round 261: Row 17 next item (result pending).
- Next checkpoint: round 260 (loop script decides). Next full gate after that: Row 11.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Locales: src/lib/i18n/locales/ (en, es, fr). Name files fully in prompts.
- PHASE3_ROWS.md: append notes inside the row cell. Stays at 22 lines.

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
- French: no-break space before ':', '?' and inside guillemets. Curly apostrophes. es and fr plain space before %. Spanish tu, French vous.
- Snapshots: no regeneration without Isa. Existing tests never edited. Broken existing test: back out and report.
- Render tests end .render.test.tsx in src/__tests__/render/.
- Row 8 feature_used keeps shapeOnly() until Isa approves.
- Row 9: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB. Device fields only when switch on (default off). Typed routes need 'as Href' for /profile/feedback.
- kJ keeps abbreviation until Isa answers.
- spokenEnergy lives in src/lib/units.ts; food.tsx uses it. nutrition.tsx change backed out (see Blocked).
- Row 16 skeleton repeat-visit fix parked: blocked by test 1 in profileEmptyStates.render.test.tsx. Default: keep the test, no fix.
- Rounds 252-261: Isa not asked again (defaults apply).

## Done
- BUILT: 1, 2, 3, 4, 7, 9, 10. Owner checks pending on 3, 5 part 1, 7, 9, 10.
- PARTIAL: 5 (part 2 needs sign-in), 8 (device check), 12 (until Isa says built), 13, 14, 15, 16 (integrations failed state and 'Your data' title blocked; skeleton fix parked).
- DIFFERENT: 6, 11, 17.

## Next
- Row 17: first non-approval item (round 261).
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, last.
- Row 6 measurements parked until a sign-in path exists.
- Rerun TestPG_* and export_test.go once a throwaway local DB is up.

## Blocked on Isa (defaults used, do not re-ask)
- Row 16 skeleton fix: needs permission to change profileEmptyStates.render.test.tsx test 1. Default: parked.
- Macros snapshot (detailChrome.render.test.tsx): default stays backed out.
- Integrations failed list reads 'Nothing connected' (integrations.render.test.tsx:75 pins it). Default: keep.
- Privacy 'Your data' title stays English (privacyLocale.render.test.tsx:55-56 pins it). Default: keep.
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
- Confirm Spanish 'Escribir a soporte', French 'Ecrire a l'assistance', Privacy export error toast, Scan and Integrations es/fr wording, Profile error and privacy failure wording.
- kJ spoken as 'kilojoules': needs a second key.
- es.json keys addMenu.voice and addMenu.describeOutLoud: keep or remove?
- Spanish/French wording from rounds 242-243 (French 'plus de {{food}}' does not elide before vowels).
- Nutrition.tsx spoken kcal labels (calories hero, meal rows) and nutritionSpokenKcal test: wait for macros snapshot approval.

## Parked (not Phase 3)
- Row 16 repeat visit: a user with all-zero real streak still sees skeleton briefly. Needs a hydrated flag in src/lib/data (needs permission).
- Preferences kept in memory, lost on restart (src/lib/settings/store.ts, outside Row 16 files).
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; useBrainProfile no error state; no anomalies endpoint; AnomalyBanner no Retry; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns (1 critical); Jest drift node_modules 30.0.5 vs 29.7.0 (fix with npm ci).
- seed_demo_account.go prints App Store review notes and demo login after seeding (Phase 4 store content). It reads DATABASE_URL twice; could reuse localdb.DSN.
- UI/data: useTemplates drops templates on refetch failure; date helpers use device locale; weekday letters and muscle names English; Ask Lume drops 503 message; Session.tsx English; MacroBars unused; formatCalories always kcal; freeze offline toast claims success on failure; week.tsx flat bars at 0 kcal; BrainProfileCard numbers unformatted; crash messages may carry server text via ApiError.
- Code hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts, support.tsx; relative-time keys have no plural forms (Integrations too).
- Privacy and export: trial_started never sent; events without key still reach Lume backend when opted in; bad PostHog host turns sink off silently; US cloud default unconfirmed; export returns whole profiles row; export sent as text not .json; share subject hard-coded; Privacy title and eyebrow both 'Your data'; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no limit tighter than 120/min writes; Support mail box overlaps feedback; Support Email row swallows Mail open errors; label 'Help and feedback' vs 'Send feedback' open.
- Phase 4: delete-account.tsx and subscription.tsx; authenticated role in local Postgres 17.

## Gotchas
- No git, Prettier or Maestro. zsh does not split $var lists: use xargs or ${=var}.
- Perl replacement strings interpolate ${...}: use node with s.replace(a, () => b). Perl without -CSD double-encodes: check bytes after edits.
- PHASE3_ROWS.md must stay at 22 lines; append notes inside the row cell.
- Every prompt must state the loop/phase3 branch rule.
- Jev signals are advisory only; never mention Jev in prompts.