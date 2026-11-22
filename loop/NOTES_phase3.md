# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device. Owner items count as BUILT with 'owner check pending'. PHASE3_ROWS.md stays 22 lines.

## Commands and state
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail. Run Jest from repo root. Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Last full checkpoint: round 252 (tsc 0, Jest 225 suites, 1311 tests pass; Go 543 pass, 20 TestPG skipped). Full checkpoint running now (round after 12).

## Status
- BUILT: 1, 2, 3, 4, 7, 8, 9, 10, 12 (owner checks pending on 3, 5 part 1, 7, 8, 9, 10).
- PARTIAL: 5 (part 2 needs sign-in), 13, 14, 15, 16, 17.
- DIFFERENT: 6 (parked until sign-in path), 11 (last).

## Next
- Checkpoint gates (tsc, full Jest, Go). If green: Row 11 prep.
- Rows 13 and 14 src/lib/data gaps stay parked until Isa approves.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in, OFF by default in code (brief said on). Isa confirms before Phase 4.
- AI disclosure (src/lib/ai/consent.ts) also turns analytics on. Phase 4 file, not touched. Isa confirms before Phase 4.
- Analytics switch lives in src/app/profile/privacy.tsx only. Render tests live in src/__tests__/render (src/app files become routes).
- Build labels added by analytics.ts after sanitize, pinned by test. PostHog never gets them.
- PostHog host unset uses SDK default; a set value must be https with hostname.
- feature_used keeps shapeOnly() until Isa approves.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Row 9: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB. Device fields only when switch on (default off).
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- Identical text reuses existing keys, only when meaning matches. src/lib/data off limits except api.ts insight catch blocks.
- French: no-break space before ':', '?' and inside guillemets; curly apostrophes; es and fr plain space before %. Spanish tu, French vous.
- spokenEnergy in src/lib/units.ts. kJ keeps abbreviation until Isa answers.
- PlannedValuesForm shared with session.tsx: translate component, do not edit session.tsx.
- Weight caption follows the form's own kg/lb control, not the units setting.
- Row 14 picked over Row 13 (Jev 51%).
- Never edit existing tests or snapshots without Isa. Broken existing test: back out and report.
- Jev asks overridden when all Isa items have defaults and no row is blocked.
- Rows 13 and 14 src/lib/data gaps parked: src/lib/data off limits, no approval yet.

## Blocked on Isa (defaults used, do not re-ask)
- src/lib/data (hooks.ts, gymSchedule.ts, aiBrain.ts, gymRange.ts, useGymPatterns, scan.ts, foodDays.ts): search debounce flash, exercise picker failed read, Ask Lume 503 and not_enough_data copy, month summary, muscle Retry, barcode network failure, calendar error flag. Parked.
- Existing tests needing permission: profileEmptyStates.render test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; detailChrome macros snapshot (backed out; nutrition spoken kcal waits); week.tsx snapshot regen; goals refetch in hooks.ts.
- Session weight entry (gym/session.tsx, padWeight): kg-only or follow unit?
- Keep as is: Integrations 'Nothing connected'; Privacy 'Your data' English; Spanish 'Tus datos'; feedback rows in backend/internal/auth/export.go; privacy footer 'First-party only' once key set.
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code), and the AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Owner checks: Food tab offline banner; Row 8 analytics switch; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm wording: es 'Escribir a soporte', fr 'Ecrire a l'assistance', export error toast, Scan and Integrations es/fr, Profile error, exercise picker Abdomen/Abdos, fr 'plus de {{food}}'. kJ spoken as 'kilojoules' needs a second key. es.json addMenu.voice and addMenu.describeOutLoud: keep or remove?

## Parked (not Phase 3)
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; no calendar loading indicator; three identical offline notices; weekday formatting uses device language; muscle names English data.
- Row 16: repeat-visit skeleton flash for all-zero streak.
- Dev-only Simulate scan and Unknown code buttons stay English. WeekStrip ', today' and Previous/Next week English.
- Preferences kept in memory (src/lib/settings/store.ts). Not persisted.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight and always starts at kg.
- useHydration logs 'API unreachable' via devWarn (hooks.ts:72).
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns.
- seed_demo_account.go prints App Store notes and demo login (Phase 4).
- UI/data: useTemplates drops on refetch failure; English exercise names and equipment; MacroBars unused; formatCalories always kcal; week.tsx flat bars; relative-time keys have no plurals; new-recipe recents from selected day only.
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json; share subject hard-coded; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback; 'Help and feedback' vs 'Send feedback' label.
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts.

## Gotchas
- No git, Prettier or Maestro. zsh: use xargs or ${=var} for lists.
- allText crashes on FlatList screens: use findAll. NumberEntryBar needs SafeAreaProvider in tests.
- Edit locale files by exact text insertion, not JSON rewrite. Check anchor uniqueness (padWeight exists in two groups).
- Use node with s.replace(a, () => b), not Perl. Check bytes after edits.
- PHASE3_ROWS.md must stay 22 lines: Row 15 line 20, Row 16 line 21, Row 17 line 22.