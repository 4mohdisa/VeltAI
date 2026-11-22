# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT, then stop. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row per prompt. Say built, never verified on a device. Owner items count as BUILT with 'owner check pending'.

## Commands
- source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last full gates: tsc 0 errors; Jest 236 suites, 1,344 tests. Go 543 pass, 20 TestPG skipped. Reconcile at final sweep.
- Checkpoint round (Round after flag): tsc and full Jest re-run, no file changes. Result pending.

## Status (PHASE3_ROWS.md is source of truth; re-read each round)
- BUILT: 1, 2, 3, 4, 7, 8, 9, 10, 12, 15, 16, 17.
- PARTIAL: 5 (part 2 needs credentials), 6 (waits on Isa), 13, 14.
- DIFFERENT: 11 (final sweep, last).
- Row 17 closed. Do not resend.

## Next
1. Checkpoint: full tsc and full Jest, no changes. Report failures only.
2. Row 14: remaining items that need no src/lib/data change. The offline-notice merge item is closed (one shared PendingSyncBanner already).
3. Row 6 waits on Isa. Do not re-ask.
4. Row 11 final sweep last.

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
- Row 14: 'merge offline notices' closed. Only one offline notice exists (PendingSyncBanner, used in index.tsx and food.tsx). Toasts are not notices. No code change.
- Row 15: no empty state (useGoals always returns numbers).
- Test files never go under src/app. Use src/__tests__/render/.
- New test file names must not differ from an existing name only by case (macOS).
- New strings go in new top-level locale groups before the 'pendingSync' anchor. Reuse a key only when English and meaning match.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- src/lib/data off limits except api.ts insight catch blocks.
- gym/history.tsx untouched: hydrationErrorScreens.test.ts pins it.
- Never edit existing tests or snapshots without Isa. A broken existing test: back out and report.
- French: no-break space before ':', '?' and inside guillemets; curly apostrophes. Spanish tu, French vous.
- Keep: Integrations 'Nothing connected' eyebrow; Privacy 'Your data' English; Spanish 'Tus datos'.
- Unanswered question: after one unanswered round, use the default and move on.

## Blocked on Isa (defaults used, do not re-ask)
- src/lib/data permission: Row 6 hooks.ts limit; Row 17 gaps 1, 2 (search debounce flash), 6 (English aiBrain replies); useGoals loading and error states.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Existing tests needing permission: profileEmptyStates test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; detailChrome macros snapshot (backed out); week.tsx snapshot regen; nutrition.tsx snapshot approval.
- Session weight (gym/session.tsx padWeight): kg-only or follow unit?
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code), and AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Export row: two exportData functions exist; remove one only if Isa decides.
- Row 6 gym history: pick per-row card pieces, list mode on Screen, or limit hydrateGym in hooks.ts:170 (recommended).
- Row 15: useGoals loading, error and refetch.
- Owner checks: Food tab offline banner; Row 8 analytics switch; Row 10 simulator flow; Row 9 export on heavy user; Row 17 gaps 1, 2, 6.
- Wording review: es 'Escribir a soporte', fr 'Ecrire a l'assistance', export error toast, Scan and Integrations es/fr, Profile error, exercise picker Abdomen/Abdos, fr 'plus de {{food}}', kJ 'kilojoules', es addMenu.voice and addMenu.describeOutLoud, weekStrip es/fr.
- Row 8 status: confirm built.

## Parked (not Phase 3)
- Row 6: gym history list not virtualised. Options as above.
- Backend: gym/schedule_pg.go:765-767 sorts progress oldest first, then LIMIT 30, losing newest. 49 queries use WHERE id::text = $1 (skips id index). 18 DB tests skipped without LUME_TEST_DATABASE_URL. getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; npm audit 48 vulns.
- Row 8: feature_used accepts any short key; app_version or build could overwrite BUILD_TAGS.
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; English muscle and exercise names.
- Row 15: useGoals loading and error states.
- Row 16: scanCalibration.basedOn lacks _one form.
- Row 17: 503 text in server language. not_enough_data English in aiBrain.ts. aiBrain.ts:154 returns '' behind upgrade path (Phase 4). Dev-only Simulate scan and Unknown code buttons stay English. aiQueryEmpty and aiQueryEmptyAnswer overlap.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight. useHydration logs via devWarn (hooks.ts:72).
- Preferences: contentStyle gap 18 raw number. Repeat-visit skeleton flash.
- nutrition.tsx spoken kcal label (needs detailChrome snapshot regenerated). Food list getItemLayout: measure first.
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback.
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; Row 13 notes out of round order (leave). Row 6 Gym history FlatList not built: Screen.tsx ScrollView and shared Card need a styling change.

## Gotchas
- No git, Prettier or Maestro. zsh: pass lists through xargs and quote --include globs.
- allText crashes on FlatList screens: use findAll, dedupe labels with a Set. NumberEntryBar needs SafeAreaProvider in tests.
- Skeleton needs reanimated useReducedMotion; mock @/components/display/LoadingSkeleton.
- useGym().data.loggedDays is an array, not a Set. SegmentedField labels render as [label, ""].
- .test.ts files run in Jest's node project.
- Edit locale files by exact text insertion, not JSON rewrite. Check anchor uniqueness. Check bytes after edits.
- Locale files: src/lib/i18n/locales/. Expo Router: node_modules/expo-router/_ctx-shared.js.
- New test file names must not differ by case only from existing ones (WeekStrip.render exists).

## Loop notes
- Start every prompt from PHASE3_ROWS.md status, not from the last report or handover.
- Every prompt must state the loop/phase3 branch rule.
- Jev is advisory only. Prefer smaller tasks. Verify the last task before moving on.
- A flagged check (tests not run) is cleared by a verify round before any new row. Checkpoint in progress.