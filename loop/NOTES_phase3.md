# Lume Loop Notes: Phase 3

## Goal
Polish before Phase 4. Progress counted from PHASE3_ROWS.md. Work only on loop/phase3. Agents never run git or Prettier. Every prompt states the branch rule. One screen or component per prompt.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 73: tsc 0; 156 suites, 1056 tests, 0 failed.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Render tests are *.render.test.tsx.
- Jest output: write to file, then tail. zsh: use $? not PIPESTATUS. Multi-file jest lists via xargs.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings. Store default off: Isa to confirm before Phase 4.
- Row 3: header plus on My workouts is the only way to add a second workout. Templates kept.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook, not per screen.
- useEnergyRange isError is true only when both week reads fail.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Saved screen load failure shows ErrorState with Retry. Default generic copy.
- Locale blocks inserted as text, not JSON rewrite. French uses no-break space before ':' and '?'.
- Food tab shows PendingSyncBanner, counting all queued writes. Default used.
- Food detail: Entry not found states get one Done button (common.done). Barcode not-found keeps Scan again.
- Unanswered question: use default and carry on. Do not re-ask.

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done.
- Rounds 42-78: Row 13 Food tab states, SavedMealsList, RecipesList, Saved load-failure states, translations, meals.tsx and saved.tsx header work.
- Rounds 79-80: Food tab PendingSyncBanner added and tested.
- Round 81: food detail (src/app/food/detail.tsx) Entry-not-found Done button added and tested. Loading already fine. Load-failed not fixed (see Blocked).

## Blocked on Isa
- Row 12 BUILT approval. Stays PARTIAL. Do not re-ask.
- Calendar failed-read state needs approval of a change to useLoggedDays in src/lib/data/foodDays.ts. Do not retry.
- Barcode lookup: telling 'not found' from 'server unreachable' needs a change to lookupBarcodeAsync in src/lib/data/scan.ts (returns null for both). Blocks detail.tsx and barcode-scan ErrorState with Retry. Default: keep current copy. Do not retry until Isa answers.
- Keys needed in en, es, fr: ', today', 'Previous week', 'Next week'. Until approved, WeekStrip labels stay as they are.
- Row 13 wording 'this day's food log' and 'Nothing was logged on this day.' unconfirmed. Default used.
- Row 13 es and fr wording for all new blocks. Default used. Review needed.
- Row 13 casing: meals.newRecipeLabel 'New recipe' vs recipesList.newRecipe 'New Recipe'. Isa picks one.
- Row 13: /food/meals link from Food tab. Default: no link.
- Row 13 PendingSyncBanner counts all queued writes, not only food. Default used. Confirm.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks row 6 heavy-user checks and row 9 export check.
- Analytics default on vs store off. Default used. Confirm before Phase 4.

## Next
- Row 14: Gym log screen empty states (first screen, round 82).
- Rows 14 to 17: remaining empty state screens, one per round.
- Row 6: non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10, then Row 11 (final sweep).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run. Needs LUME_TEST_DATABASE_URL.
- formatWeekdayDate, formatMonthYear, formatRelativeDate (src/lib/formatting.ts): device locale or hardcoded English. Shared helper fix.
- GymCalendar.tsx and WeekEnergyCard.tsx: hardcoded weekday letters.
- WeekStrip and calendar.tsx duplicate the logged-day label expression. Shared helper.
- SheetContent.tsx:92 close button accessibilityLabel 'Close' hardcoded English.
- Dev builds fall back to mock product DB on failed lookup (offline tests in dev differ from release).
- No test covers app-language dates or en/es/fr key parity. Row 11.
- French 'aujourd'hui' straight apostrophe. Row 11.
- es.json extra keys addMenu.voice and addMenu.describeOutLoud.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx).
- Ask Lume drops server 503 message (src/app/ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- react-test-renderer deprecated warning in gymSchedule tests.
- Stale header comments: aiBrain.ts, gymSchedule.ts, 'French intentionally partial' in src/lib/i18n/index.ts, saved.tsx '(mock)', meals.tsx '(Task 4)'.
- food.tsx header line 2 is 82 chars; meals.tsx also checked. Row 11.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- useInsights has no refetch, so no Retry. allText crashes on full-screen trees: use findAll.
- getMorningBrief and getProfile swallow failures as null.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings.
- Energy one-week-fails path untested.
- Food tab mounts useInsights with no consent gate (pinned in phase14Regression).
- 'No meals yet' reads oddly on a past day unless row 13 wording approved.
- Shared render setup does not mock useFocusEffect or useLocalSearchParams.
- Saved and calendar tests: shared expo-router mock helper in Row 11.
- WeekStrip on Food tab shows no dots and no notice on a failed read. Blocked with calendar fix.
- formatMonthYear and formatWeekdayDate: month and day names may stay English in es and fr.
- No Retry on useInsights errors. Analytics defaults to on. Seed script has no host guard.
- Hidden-banner test checks only accessibilityRole=alert absence. Assert no banner at all (Row 11).

## Loop notes
- Round 80: Jev said ask (80%). Kept run: only open question is owner-only and already defaulted.
- Round 81: auto check flagged partial. Barcode network-failure state parked under Blocked. Round 82: Jev said ask (74%). Kept run: question not major, default used.
