# Lume Loop Notes: Phase 3

## Goal
All PHASE3_ROWS.md rows BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One row and one screen per prompt. Say built, never verified on a device. Owner items count as BUILT with 'owner check pending'. PHASE3_ROWS.md stays 22 lines.

## Commands
- source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail. Jest from repo root, pinned ~29.7.0. Maestro not installed.
- Last gates: tsc 0 errors. Full Jest 233 suites / 1,338 tests. Go 543 pass, 20 TestPG skipped.

## Status (PHASE3_ROWS.md is the source of truth)
- BUILT: 1, 2, 3, 4, 7, 8 (owner check pending), 9, 10 (owner checks pending), 12, 15, 16.
- PARTIAL: 5, 13, 14, 17, 6 (step 1 audit in PERF_BASELINE.md; gym history list being virtualised).
- DIFFERENT: 11.

## Next
- Row 6 step 2: one hotspot per row. Before and after numbers when a simulator run with the heavy user is possible (blocked on Row 5 part 2 sign-in).
- Row 17 gap 5 and gap 4 done (screen only, not device checked). Gaps 1, 2, 6 wait on Isa.
- Row 11 final sweep last, after status check.

## Row 17 gaps
1 and 2: food and recipe search flash 'No matches' during debounce (hooks.ts, blocked on Isa).
3: ExercisePicker failed load shows LoadFailedNotice, no Retry (built).
4: Ask Lume 503 message shows ask() text (built, screen only).
5: Ask Lume empty answer shows aiQueryAnswer.empty (built, screen only).
6: not_enough_data and consent replies are English in aiBrain.ts (blocked on Isa).

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
- Test files never go under src/app. Use src/__tests__/render/.
- New strings go in new top-level locale groups before the unique 'pendingSync' anchor. Reuse a key only when English and meaning match.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists.
- src/lib/data off limits except api.ts insight catch blocks.
- French: no-break space before ':', '?' and inside guillemets; curly apostrophes. Spanish tu, French vous.
- Keep: Integrations 'Nothing connected' eyebrow; Privacy 'Your data' English; Spanish 'Tus datos'.
- Never edit existing tests or snapshots without Isa. Broken existing test: back out and report.
- Jev ask overridden only when all Isa items have defaults and no row is blocked.
- Preferences kept in memory, not persisted.
- Row 15: no empty state (useGoals always returns numbers).
- Export: two exportData functions exist; remove one only if Isa decides.
- Row 6 hotspots go to PERF_BASELINE.md, not new PHASE3_ROWS.md rows (file stays 22 lines).
- Row 6 step 1 chosen over Row 17 gap 6 (gap 6 needs src/lib/data, blocked).
- Row 6 gym history list virtualised without simulator numbers; before and after pending.

## Blocked on Isa (defaults used, do not re-ask)
- src/lib/data: scan.ts network vs 'Product not found'; foodDays.ts error flag; gymRange.ts month '0 sessions' English; gymSchedule.ts refetch for useGymPatterns; useGoals drops isLoading, error, refetch. Parked.
- Existing tests needing permission: profileEmptyStates test 1; integrations.render.test.tsx:75; privacyLocale.render.test.tsx:55-56; detailChrome macros snapshot (backed out); week.tsx snapshot regen; nutrition.tsx snapshot approval.
- Session weight (gym/session.tsx padWeight): kg-only or follow unit?
- Owner: apply feedback migration to hosted Supabase. Feedback retention undefined. PostHog key and host as EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.
- Which local DB is Lume's; lume_audit one migration behind: apply only if named.
- feature_used strict list and shapeOnly cleanup: needs permission to edit two pinned tests.
- Analytics on (brief) vs opt-in (code), and AI disclosure switch: confirm before Phase 4.
- Device maker, model, OS to PostHog: default not sent.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD, seed sign-in path.
- Owner checks: Food tab offline banner; Row 8 analytics switch; Row 10 simulator flow; Row 9 export on heavy user.
- Confirm wording: es 'Escribir a soporte', fr 'Ecrire a l'assistance', export error toast, Scan and Integrations es/fr, Profile error, exercise picker Abdomen/Abdos, fr 'plus de {{food}}', kJ 'kilojoules', es addMenu.voice and addMenu.describeOutLoud keep or remove. Review of all new es and fr wording, including aiQueryAnswer.empty.
- Waiting: useGoals isLoading, error, refetch.
- Waiting: Row 17 gaps 1, 2, 6 (src/lib/data).

## Parked (not Phase 3)
- Backend correctness: gym/schedule_pg.go:765-767 ORDER BY gs.date ASC with LIMIT 30 returns the oldest 30 entries for exercise progress. Needs backend fix and test.
- Backend perf: 49 queries use WHERE id::text = $1, which skips the id index. Needs DB-backed tests (TestPG skipped).
- Row 8: feature_used accepts any short key; app_version or build would overwrite BUILD_TAGS.
- Row 13/14: barcode 'Product not found' on network failure; calendar empty month on load failure; three identical offline notices; weekday formatting uses device language; muscle and exercise names English data; WeekStrip ', today' and Previous/Next week English.
- Row 15: useGoals loading and error states.
- Row 16: Integrations failed load plus 'Nothing connected' together. scanCalibration.basedOn has no _one form.
- Row 17: 503 text shows in whatever language the server sends. not_enough_data English in aiBrain.ts. aiBrain.ts:154 upgrade-required path returns '' without marking unavailable (Phase 4 subscriptions).
- Dev-only Simulate scan and Unknown code buttons stay English.
- PlannedValuesForm duplicates UNIT_OPTIONS.weight, starts at kg.
- useHydration logs 'API unreachable' via devWarn (hooks.ts:72). useHydration has no freshness window (src/lib/data).
- Preferences: contentStyle gap 18 raw number. Repeat-visit skeleton flash.
- nutrition.tsx spoken kcal label (needs detailChrome snapshot regenerated).
- Food list getItemLayout: measure before changing (rows vary in height).
- Backend: getMorningBrief swallows errors; getProfile .catch hides errors; no anomalies endpoint; 18 DB tests skipped without LUME_TEST_DATABASE_URL; npm audit 48 vulns.
- Privacy and export: trial_started never sent; US cloud default unconfirmed; export sent as text not .json.
- Feedback: app_version carries build number; no tighter limit than 120/min; Support mail overlaps feedback.
- PRIVACY_DATA.md 'Allowlist test' bullet sits under Defaults (fix wording later).
- Phase 4: delete-account.tsx, subscription.tsx; authenticated role in local Postgres 17.
- Hygiene: goals.saved unused; lint in gymSchedule.ts and hooks.ts.

## Gotchas
- No git, Prettier or Maestro. zsh: use xargs or ${=var} for lists.
- allText crashes on FlatList screens: use findAll. NumberEntryBar needs SafeAreaProvider in tests.
- Skeleton needs reanimated useReducedMotion; mock @/components/display/LoadingSkeleton in tests.
- useGym().data.loggedDays is an array, not a Set.
- SegmentedField labels render as [label, ""].
- .test.ts files run in Jest's node project.
- Edit locale files by exact text insertion, not JSON rewrite. Check anchor uniqueness.
- Use node with s.replace(a, () => b), not Perl. Check bytes after edits.
- PHASE3_ROWS.md must stay 22 lines.
- Locale files: src/lib/i18n/locales/. Expo Router: node_modules/expo-router/_ctx-shared.js.

## Loop notes
- Prompt rejected once (no loop/phase3 branch rule). Fixed in the next prompt.
- Loop flagged last report as partly done. Row 6 PARTIAL is correct; the gym history hotspot is the next concrete step.