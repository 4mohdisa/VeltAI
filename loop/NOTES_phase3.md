# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row per prompt. Say built, never verified on a device. Owner items count as BUILT with 'owner check pending'. PHASE3_ROWS.md stays 22 lines.

## Commands
- source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last full checkpoint: tsc 0 errors, Jest 236 suites, 1,344 tests. Go 543 pass, 20 TestPG skipped.
- Handover counts (233 suites, 1,338 tests) differ from the checkpoint. Reconcile at final sweep.

## Status (PHASE3_ROWS.md is the source of truth; re-read each round)
- BUILT: 1, 2, 3, 4, 7, 8 (owner check pending), 9, 10 (owner checks pending), 12, 15, 16, 17 (owner check pending).
- PARTIAL: 5 (part 2 needs credentials), 6, 13, 14.
- DIFFERENT: 11.
- Row 17 status is unverified until this round's gate check.

## Next
- Now: Row 17 gate check (tsc, Row 17 Jest files, status note cleanup).
- Then: Row 15 and 16 gate check (their new Jest files).
- Row 6: waits on Isa (hooks.ts limit).
- Row 11 final sweep last, only when every other row is BUILT or EXACT.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics opt-in, OFF by default in code (brief said on). Isa confirms before Phase 4.
- AI disclosure (src/lib/ai/consent.ts) also turns analytics on. Phase 4 file, not touched.
- Analytics switch lives in src/app/profile/privacy.tsx only.
- feature_used keeps shapeOnly() until Isa approves.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Row 9: GET /api/export, same auth and limiter as analytics, ungated by subscription.
- Row 10: feedback shares 120/min write limit. Migration not applied to any local DB.
- Row 15: no empty state (useGoals always returns numbers).
- Test files never go under src/app. Use src/__tests__/render/.
- New strings go in new top-level locale groups before the unique 'pendingSync' anchor. Reuse a key only when English and meaning match.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- src/lib/data off limits except api.ts insight catch blocks.
- gym/history.tsx untouched: hydrationErrorScreens.test.ts pins it.
- Never edit existing tests or snapshots without Isa. A broken existing test: back out and report.
- French: no-break space before ':', '?' and inside guillemets; curly apostrophes. Spanish tu, French vous.
- Keep: Integrations 'Nothing connected' eyebrow; Privacy 'Your data' English; Spanish 'Tus datos'.
- Unanswered question: after one unanswered round, use the default and move on.

## Blocked on Isa (defaults used, do not re-ask)
- src/lib/data permission: Row 6 hooks.ts limit; Row 17 gaps 1, 2 (search debounce flash) and 6 (English aiBrain replies); useGoals loading and error states.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Existing tests needing permission: profileEmptyStates test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; detailChrome macros snapshot (backed out); week.tsx snapshot regen; nutrition.tsx snapshot approval.
- Session weight (gym/session.tsx padWeight): kg-only or follow unit?
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code), and AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Export row: two exportData functions exist; remove one only if Isa decides. Row lives on Settings and Privacy.
- Owner checks: Food tab offline banner; Row 8 analytics switch; Row 10 simulator flow; Row 9 export on heavy user; Row 17 gaps 1, 2, 6.
- Wording review: es 'Escribir a soporte', fr 'Ecrire a l'assistance', export error toast, Scan and Integrations es/fr, Profile error, exercise picker Abdomen/Abdos, fr 'plus de {{food}}', kJ 'kilojoules', es addMenu.voice and addMenu.describeOutLoud.

## Parked (not Phase 3)
- Row 6: gym history list not virtualised. Options: per-row card pieces, list mode on Screen, or limit listSessions in hooks.ts (recommended).
- Backend correctness: gym/schedule_pg.go:765-767 sorts exercise progress oldest first, then LIMIT 30, so newest entries are lost.
- Backend perf: 49 queries use WHERE id::text = $1, which skips the id index. Needs DB-backed tests.
- Row 8: feature_used accepts any short key; app_version or build would overwrite BUILD_TAGS.
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; three identical offline notices; weekday formatting uses device language; English muscle and exercise names; WeekStrip ', today' and Previous/Next week English.
- Row 15: useGoals loading and error states.
- Row 16: Integrations failed load plus 'Nothing connected' together. scanCalibration.basedOn has no _one form.
- Row 17: 503 text shows in the server's language. not_enough_data English in aiBrain.ts. aiBrain.ts:154 returns '' behind upgrade path (Phase 4).
- Dev-only Simulate scan and Unknown code buttons stay English.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight, starts at kg. useHydration logs via devWarn (hooks.ts:72).
- Preferences: contentStyle gap 18 raw number. Repeat-visit skeleton flash.
- nutrition.tsx spoken kcal label (needs detailChrome snapshot regenerated). Food list getItemLayout: measure first.
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns.
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json. PRIVACY_DATA.md 'Allowlist test' bullet sits under Defaults.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback.
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; scanCalibration.basedOn _one form.

## Gotchas
- No git, Prettier or Maestro. zsh: pass lists through xargs.
- allText crashes on FlatList screens: use findAll. NumberEntryBar needs SafeAreaProvider in tests.
- Skeleton needs reanimated useReducedMotion; mock @/components/display/LoadingSkeleton.
- useGym().data.loggedDays is an array, not a Set. SegmentedField labels render as [label, ""].
- .test.ts files run in Jest's node project.
- Edit locale files by exact text insertion, not JSON rewrite. Check anchor uniqueness. Check bytes after edits.
- Locale files: src/lib/i18n/locales/. Expo Router: node_modules/expo-router/_ctx-shared.js.

## Loop notes
- Start every prompt from PHASE3_ROWS.md status, not from the last report or handover.
- Jev is advisory only. Last signals: ask 61%, run 19%, confidence low. Prefer smaller tasks.