# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Stopped at round 89, confirmed at round 90.

## Status
- BUILT: rows 1-17. Rows 5, 6, 11, 13, 14 BUILT with 'owner check pending'.
- Gates (round 88): tsc 0 errors. Jest 241 suites, 1,386 tests pass, 0 fail, 0 skipped. Go 34 packages ok, 20 TestPG skipped (no LUME_TEST_DATABASE_URL), 0 fail.
- No device or simulator check has been run.

## Next
None for the loop. Isa works through OWNER_CHECKS_phase3.md.

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
- New strings go in top-level locale groups before the 'pendingSync' anchor.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- src/lib/data off limits except api.ts insight catch blocks, until Isa answers.
- gym/history.tsx untouched: hydrationErrorScreens.test.ts pins it.
- Never edit existing tests or snapshots without Isa. A broken existing test: back out and report.
- French: no-break space before colon, question mark, inside guillemets; curly apostrophes. Spanish tu, French vous.
- Approved by Isa: src/lib/data changes for Rows 6, 13, 14 and useGoals loading, error and refetch. Still not approved: edits to pinned tests.

## Blocked on Isa (all in OWNER_CHECKS_phase3.md, do not re-ask)
- src/lib/data permission: scan.ts, foodDays.ts, gymRange.ts, summaryCards.ts, hooks.ts:170 (limit hydrateGym, recommended), Retry in muscle and exercise cards, Row 17 gaps 1, 2, 6.
- Row 6 Gym history option: per-row card pieces, list mode on Screen, or limit hydrateGym (recommended).
- Row 5 part 2: E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Pinned tests needing permission: sheetVariant, scanConfidence, profileEmptyStates test 1, integrations.render, privacyLocale.render, detailChrome macros snapshot, week.tsx and nutrition.tsx snapshots.
- Session weight (gym/session.tsx padWeight): kg-only or follow unit?
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit one migration behind.
- feature_used strict list and shapeOnly cleanup: needs permission.
- Analytics on (brief) vs opt-in (code); AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Export row: two exportData functions exist; remove one only if Isa decides.
- Row 8 BUILT status: notes say partial, confirm.
- Wording review: see OWNER_CHECKS_phase3.md.

## Parked (not Phase 3)
- Row 6: gym history list not virtualised. useGym refetches on every mount; session read has no limit.
- Backend: gym/schedule_pg.go:765-767 sorts progress oldest first, then LIMIT 30. 49 queries use WHERE id::text = $1. 20 TestPG skipped. getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; npm audit 48 vulns.
- Row 8: feature_used accepts any short key; app_version or build could overwrite BUILD_TAGS.
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; English muscle and exercise names; nutrition.tsx spoken kcal label. Day letters in summaryCards LETTERS are English.
- Row 16: scanCalibration.basedOn lacks _one form.
- Row 17: 503 text in server language. not_enough_data English in aiBrain.ts. aiBrain.ts:154 empty string behind upgrade path (Phase 4). aiQueryEmpty and aiQueryEmptyAnswer overlap.
- Preferences: contentStyle gap 18 raw number. Repeat-visit skeleton flash.
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json.
- Feedback: app_version carries build number; no tighter limit than 120/min.
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts; no test checks en, es, fr have the same keys. KNOWN_ISSUES.md has stale line numbers.

## Gotchas
- No git, Prettier or Maestro for agents. Pass lists through xargs.
- Run source ~/.nvm/nvm.sh and nvm use 22 first.
- hydrationErrorScreens.test.ts pins gym/history.tsx.
- Do not resend Row 17 gap 5 or Row 13 strings. Both are closed.