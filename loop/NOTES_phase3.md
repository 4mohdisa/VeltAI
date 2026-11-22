# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT, then stop. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row per prompt. Say built, never verified on a device. Owner items count as BUILT with 'owner check pending'. PHASE3_ROWS.md is the source of truth; re-read each round.

## Status (stopped at round 80 checkpoint)
- BUILT: 1, 2, 3, 4, 7, 8, 9, 10, 12, 15, 16, 17.
- PARTIAL: 5 (part 2 needs credentials), 6 (needs Gym history option), 13 and 14 (notes say BUILT, handover says PARTIAL; confirm the status column first).
- DIFFERENT: 11 (final sweep, waits on 5 and 6).
- Checkpoint gates: tsc 0 errors. Jest 240 suites, 1,368 tests pass. Go 543 pass, 20 TestPG skipped (no LUME_TEST_DATABASE_URL), 0 fail.
- Files: KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md, PERF_BASELINE.md (code-reading audit, no measured numbers).

## Next (needs Isa)
1. Choose a Row 6 Gym history option and allow the hooks.ts:170 change in src/lib/data.
2. Row 5 part 2: provide E2E_EMAIL, E2E_PASSWORD and the seed sign-in path as environment variables, never in chat.
3. Confirm the status of Rows 13 and 14.
4. Then rerun gates, measure Row 6 on the simulator, and close Row 11.

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
- Row 13: pinned English strings kept, tests not edited.
- Row 14: PendingSyncBanner is the only offline notice. Toasts are not notices.
- Row 15: no empty state (useGoals always returns numbers).
- Reuse a key when English and meaning match.
- Test files never go under src/app. Use src/__tests__/render/.
- New test file names must not differ from an existing name only by case (macOS).
- New strings go in new top-level locale groups before the 'pendingSync' anchor.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- src/lib/data is off limits except api.ts insight catch blocks.
- gym/history.tsx untouched: hydrationErrorScreens.test.ts pins it.
- Never edit existing tests or snapshots without Isa. A broken existing test: back out and report.
- French: no-break space before colon, question mark and inside guillemets; curly apostrophes. Spanish tu, French vous.

## Blocked on Isa (do not re-ask)
- Row 6 Gym history, one of three: per-row card pieces, list mode on Screen, or limit hydrateGym in hooks.ts:170 (recommended). Blocked by src/lib/data. Asked twice.
- src/lib/data permission for: Row 6 hooks.ts limit; Row 17 gaps 1, 2, 6; useGoals loading, error, refetch (Row 15); Row 13 scan.ts and foodDays.ts; Row 14 gymRange.ts, muscle-card and exercise-progress Retry.
- Row 5 part 2: E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Pinned tests needing permission: sheetVariant.test.ts:30; scanConfidence.test.ts; profileEmptyStates test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; detailChrome macros snapshot (backed out); week.tsx and nutrition.tsx snapshots.
- Session weight (gym/session.tsx padWeight): kg-only or follow unit?
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit is one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code), and AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Export row: two exportData functions exist; remove one only if Isa decides.
- Wording review: es 'Escribir a soporte', fr 'Ecrire a l'assistance', export error toast, Scan and Integrations es/fr, Profile error, exercise picker Abdomen/Abdos, fr 'plus de {{food}}', kJ 'kilojoules', es addMenu.voice and addMenu.describeOutLoud, weekStrip es/fr, parameterForm es/fr, fr 'Abandonner' vs 'Supprimer' for scan discard.
- Owner checks: see OWNER_CHECKS_phase3.md.

## Parked (not Phase 3)
- Row 6: gym history list not virtualised. Needs Screen.tsx ScrollView and shared Card change. useGym refetches on every mount; session read has no limit.
- Backend: gym/schedule_pg.go:765-767 sorts progress oldest first, then LIMIT 30, dropping the newest. 49 queries use WHERE id::text = $1. 20 TestPG tests skipped without LUME_TEST_DATABASE_URL. getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; npm audit 48 vulns.
- Row 8: feature_used accepts any short key; app_version or build could overwrite BUILD_TAGS.
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; English muscle and exercise names; nutrition.tsx spoken kcal label (needs snapshot regen).
- Row 15: useGoals loading and error states.
- Row 16: scanCalibration.basedOn lacks _one form.
- Row 17: 503 text in server language. not_enough_data English in aiBrain.ts. aiBrain.ts:154 returns empty string behind upgrade path (Phase 4). Dev-only Simulate scan and Unknown code buttons stay English. aiQueryEmpty and aiQueryEmptyAnswer overlap.
- Preferences: contentStyle gap 18 raw number. Repeat-visit skeleton flash.
- Food list getItemLayout: measure first.
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback.
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; no test checks en, es, fr have the same keys; Row 13 and 14 notes out of round order.

## Gotchas
- No git, Prettier or Maestro for agents. zsh: pass lists through xargs and quote --include globs.
- allText crashes on FlatList screens: use findAll, dedupe labels with a Set. NumberEntryBar needs SafeAreaProvider in tests.
- Skeleton needs reanimated useReducedMotion; mock @/components/display/LoadingSkeleton.
- useGym().data.loggedDays is an array, not a Set. SegmentedField labels render as [label, empty].
- Edit locale files by exact text insertion, not JSON rewrite. Check anchor uniqueness. Check bytes after edits.
- Locale files: src/lib/i18n/locales/.
- Run source ~/.nvm/nvm.sh and nvm use 22 first. Output to /tmp, then tail.
- hydrationErrorScreens.test.ts pins gym/history.tsx.