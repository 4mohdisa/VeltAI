# Lume Loop Notes: Phase 3

## Goal
Polish before Phase 4. Progress counted from PHASE3_ROWS.md. Work only on loop/phase3. Agents never run git or Prettier. Every prompt states the branch rule. One screen or component per prompt.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 73: tsc 0; 156 suites, 1056 tests, 0 failed. Clean.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Component render tests are *.render.test.tsx.
- Jest output: write to file, then tail. zsh: use $? not PIPESTATUS. Multi-file jest lists via xargs.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.

## Decisions (never delete)
- Local backend and local database only. Nothing against hosted production.
- Phase 1 design final. Exceptions: named Phase 3 rows only.
- Phase 4 NOT in scope: Sign in with Apple, account deletion, AI consent and limits, subscriptions and paywall, restore purchases, retention, notifications, HealthKit, store content, privacy manifest. Park ideas.
- Later (Phase 4, do not build): RevenueCat for payments, no free tier, 7 day Apple trial.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID, off switch in Settings. Store default off: Isa to confirm before Phase 4.
- Row 3: keep header plus on My workouts as the only way to add a second workout.
- Goals and units stay in memory in Phase 3. Row 15 fixes 'Saved as you type' copy.
- Hook error fixes go in the shared hook, not per screen.
- useEnergyRange isError is true only when both week reads fail.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Re-verify a flagged report only if the row changed code. Re-verified once is enough.
- Row 12 set back to PARTIAL until Isa approves BUILT.
- Saved screen load failure shows ErrorState with Retry. Default generic copy.
- Locale blocks inserted as text, not JSON rewrite. French uses no-break space before ':' and '?'.
- Round 75-77: meals.tsx header verified and reworded. Default used.
- Round 78: meals.tsx header line 1 wrapped to match other header lines (finishes flagged round 77).

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done.
- Rounds 42-69: Row 13 Food tab states, SavedMealsList, RecipesList, Saved load-failure states, translations for recipesList, meals, newRecipe, history.
- Rounds 70-72: calendar.tsx strings (en, es, fr), WeekStrip letters and labels. Row 13 PARTIAL.
- Round 73: checkpoint clean.
- Rounds 74-78: meals.tsx and saved.tsx header work.

## Blocked on Isa
- Row 12 BUILT approval. Stays PARTIAL. Do not re-ask.
- Calendar failed-read state needs approval of a change to useLoggedDays in src/lib/data/foodDays.ts. Do not retry.
- Keys needed in en, es, fr: ', today', 'Previous week', 'Next week'. Until approved, es and fr day labels read partly in English.
- Row 13 wording 'this day's food log' and 'Nothing was logged on this day.' unconfirmed. Default used.
- Row 13 es and fr wording for all new blocks. Default used. Review needed.
- Row 13 casing: meals.newRecipeLabel 'New recipe' vs recipesList.newRecipe 'New Recipe'. Isa picks one.
- Row 13: is /food/meals meant to get a Food tab link? Default: no link added.
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks row 6 heavy-user checks and row 9 export check.
- Analytics default on vs store off. Default used. Confirm before Phase 4.
- Templates '+' kept (row 3).

## Next
- Round 78: meals.tsx header line 1 wrap (comment only, running).
- Row 13 remaining: food detail screen states, barcode, Food tab PendingSyncBanner.
- Row 14: Gym log and history empty states, one screen per round.
- Rows 15 to 17: empty state follow-ups.
- Row 6: non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10, then Row 11 (final sweep).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run. Needs LUME_TEST_DATABASE_URL.
- formatWeekdayDate, formatMonthYear, formatRelativeDate (src/lib/formatting.ts) use device locale or hardcoded English. Shared helper fix.
- GymCalendar.tsx and WeekEnergyCard.tsx have hardcoded weekday letters.
- WeekStrip and calendar.tsx build the logged-day label with the same expression. Shared helper to remove duplication.
- No test covers app-language dates or en/es/fr key parity. Park to Row 11.
- French 'aujourd'hui' uses straight apostrophe. Fix in Row 11.
- es.json extra keys addMenu.voice and addMenu.describeOutLoud.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx).
- Ask Lume drops server 503 message (src/app/ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- react-test-renderer deprecated warning in gymSchedule tests.
- Stale header comments: aiBrain.ts, gymSchedule.ts, 'French intentionally partial' in src/lib/i18n/index.ts, saved.tsx '(mock)', meals.tsx '(Task 4)'.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- useInsights has no refetch, so no Retry. allText crashes on full-screen trees: use findAll.
- getMorningBrief and getProfile swallow failures as null.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings.
- Energy one-week-fails path untested.
- Food tab mounts useInsights with no consent gate (pinned in phase14Regression).
- 'No meals yet' reads oddly on a past day unless row 13 wording approved.
- Food tab has no PendingSyncBanner, so offline looks like a plain error.
- Shared render setup does not mock useFocusEffect or useLocalSearchParams.
- Saved and calendar tests: shared expo-router mock helper in Row 11.
- WeekStrip on Food tab shows no dots and no notice on a failed read. Blocked with calendar fix.
- Past-day error copy has no test covering food.tsx.
- formatMonthYear and formatWeekdayDate: month and day names can stay English in es and fr.
- Older items: no Retry on useInsights errors, analytics defaults to on, seed script has no host guard.
- saved.tsx line 1 'C13 · My dishes' wording to confirm (comment only).
- New Recipe vs New recipe casing: see Blocked on Isa.