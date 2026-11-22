# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device. Owner items count as BUILT with 'owner check pending'. PHASE3_ROWS.md stays 22 lines.

## Commands and state
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail. Run Jest from repo root. Jest pinned ~29.7.0. Maestro not installed.
- Last gates: tsc 0 errors. Jest 228 suites / 1322 tests (Isa to confirm baseline). Go 543 pass / 20 TestPG skipped.

## Status
- BUILT: 1, 2, 3, 4, 7, 8 (owner check pending), 9, 10 (owner checks pending), 12.
- PARTIAL: 5 (part 2 needs sign-in), 13, 14, 15, 16, 17.
- DIFFERENT: 6 (parked until sign-in path), 11 (last).
- Row 16: Integrations notice and Support strings done (support test added, no change needed).

## Next
- Row 16: Preferences copy audit (src/app/profile/preferences.tsx), in progress.
- Then Row 15 copy pass, Row 17 gaps. Row 11 last.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in, OFF by default in code (brief said on). Isa confirms before Phase 4.
- AI disclosure (src/lib/ai/consent.ts) also turns analytics on. Phase 4 file, not touched.
- Analytics switch lives in src/app/profile/privacy.tsx only. Render tests in src/__tests__/render.
- Build labels added by analytics.ts after sanitise, pinned by test. PostHog never gets them.
- feature_used keeps shapeOnly() until Isa approves.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Row 9: GET /api/export, same auth and limiter as analytics, Share API, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB. Device fields only when switch on (default off).
- Test files never go under src/app (Expo Router treats them as routes). Use src/__tests__/render/.
- New strings go in new top-level locale groups, inserted before the unique 'pendingSync' anchor. Reuse a key only when English and meaning match.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- src/lib/data off limits except api.ts insight catch blocks.
- French: no-break space before ':', '?' and inside guillemets; curly apostrophes; es and fr plain space before %. Spanish tu, French vous.
- Keep as is: Integrations 'Nothing connected' eyebrow; Privacy 'Your data' English; Spanish 'Tus datos'.
- Never edit existing tests or snapshots without Isa. Broken existing test: back out and report.
- Jev ask overridden when all Isa items have defaults and no row is blocked.
- Preferences kept in memory, not persisted.
- Prompt rejected once for missing loop/phase3 branch rule. Every prompt now states it.

## Blocked on Isa (defaults used, do not re-ask)
- src/lib/data: scan.ts network vs 'Product not found'; foodDays.ts error flag; gymRange.ts month summary '0 sessions' English; gymSchedule.ts refetch for useGymPatterns. Parked.
- Existing tests needing permission: profileEmptyStates test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; detailChrome macros snapshot (backed out); week.tsx snapshot regen; nutrition.tsx snapshot approval.
- Session weight entry (gym/session.tsx, padWeight): kg-only or follow unit?
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code), and AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Owner checks: Food tab offline banner; Row 8 analytics switch; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm wording: es 'Escribir a soporte', fr 'Ecrire a l'assistance', export error toast, Scan and Integrations es/fr, Profile error, exercise picker Abdomen/Abdos, fr 'plus de {{food}}'. kJ spoken as 'kilojoules' needs a second key. es.json addMenu.voice and addMenu.describeOutLoud: keep or remove?

## Parked (not Phase 3)
- Row 8: feature_used accepts any short key; app_version or build would overwrite BUILD_TAGS. No call site does this.
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; three identical offline notices; weekday formatting uses device language; muscle and exercise names English data.
- Row 16: Integrations failed load plus 'Nothing connected' together. scanCalibration.basedOn has no _one form. Privacy 'Your data' English (test requires it). support.mailSubject untested.
- Dev-only Simulate scan and Unknown code buttons stay English. WeekStrip ', today' and Previous/Next week English.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight and always starts at kg.
- useHydration logs 'API unreachable' via devWarn (hooks.ts:72).
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns.
- seed_demo_account.go prints App Store notes and demo login (Phase 4).
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json; share subject hard-coded; two Export rows until Row 15 copy pass ends.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback.
- PRIVACY_DATA.md 'Allowlist test' bullet sits under Defaults and open items (fix wording later).
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts.

## Gotchas
- No git, Prettier or Maestro. zsh: use xargs or ${=var} for lists.
- allText crashes on FlatList screens: use findAll. NumberEntryBar needs SafeAreaProvider in tests.
- Skeleton needs reanimated useReducedMotion; mock @/components/display/LoadingSkeleton in tests.
- useGym().data.loggedDays is an array, not a Set.
- Edit locale files by exact text insertion, not JSON rewrite. Check anchor uniqueness.
- Use node with s.replace(a, () => b), not Perl. Check bytes after edits.
- PHASE3_ROWS.md must stay 22 lines.
- Locale files live in src/lib/i18n/locales/, not src/locales/.