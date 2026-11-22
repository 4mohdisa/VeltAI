# Lume Loop Notes: Phase 3

## Goal
Polish before Phase 4. Progress counted from PHASE3_ROWS.md. Work only on loop/phase3. Agents never run git or Prettier. Every prompt states the branch rule. One screen or component per prompt.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Checkpoint round 58: tsc 0; 150 suites, 1038 tests, 0 failed.
- Before every command: source ~/.nvm/nvm.sh && nvm use 22.
- Local Colima Postgres 127.0.0.1:55432. DATABASE_URL not set.
- Jest pinned ~29.7.0. Never upgrade. Component render tests are *.render.test.tsx.
- Jest output: write to file, then tail. zsh: use $? not PIPESTATUS.
- Not ours, do not touch: loop/DECISIONS_LOG.md, loop/NOTES_phase3.md.
- Checkpoint pending: the Food tab tests were not rerun after the last food.tsx change. Run a full checkpoint next.

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
- useEnergyRange isError is true only when both week reads fail. Default used.
- AnomalyBanner takes anomalies, isError, onDismiss. food.tsx makes the only useInsights call.
- Seed tooling: backend/tools/seed, localhost-only host guard, reset deletes only seed_ ids with @example.test email.
- Maestro sign-in flows: if E2E_EMAIL or E2E_PASSWORD missing, park as owner step.
- Unanswered question: use default and carry on. Do not re-ask.
- Shared useApi harness: src/__tests__/helpers/useApiHarness.ts.
- Re-verify a flagged report as its own round only if the row changed code. Re-verified once is enough.
- Row 12 set back to PARTIAL until Isa approves BUILT.
- One screen or component per prompt.
- Saved screen load failure shows ErrorState with Retry. Default generic copy.
- Round 58 checkpoint chosen over Jev. Round 64 re-verify of RecipesList clean.
- Round 65: meals.tsx translation chosen over new-recipe and calendar.
- Round 66: new-recipe.tsx translation chosen, agreeing with Jev (84%).
- Round 67: flagged report handled first. new-recipe toast tests and header done.
- Round 68: history.tsx chosen, agreeing with Jev (89%).

## Done
- Rounds 1-4: row list, Row 1 Node 22 BUILT, Row 2 baseline BUILT.
- Rounds 5-6: Row 3 BUILT, owner check pending.
- Rounds 7-10: Row 4 audit BUILT; rows 12-17 added.
- Rounds 11-13: Row 5 part 1 BUILT, owner check pending.
- Rounds 13-41: Row 12 plumbing done.
- Rounds 42-54: Row 13 Food tab states done.
- Rounds 56-59: Row 13 SavedMealsList, RecipesList and Saved load-failure states.
- Rounds 62-67: past-day read failure test; RecipesList, meals, new-recipe strings translated (en, es, fr); new-recipe toast tests added, stale '(Task 5)' header removed.

## Blocked on Isa
- Row 12 BUILT approval. Stays PARTIAL. Do not re-ask.
- Calendar failed-read state needs Isa approval of a change to useLoggedDays in src/lib/data/foodDays.ts. Do not retry. Work on other surfaces.
- Row 13 wording 'this day's food log' and 'Nothing was logged on this day.' unconfirmed. Default used.
- Row 13 translation wording for review: recipesList, meals, newRecipe keys (es and fr). Default used.
- Row 13 casing: meals.newRecipeLabel 'New recipe' vs recipesList.newRecipe 'New Recipe'. Isa picks one.
- Row 5 part 2 (Maestro on seeded users): needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks row 6 heavy-user checks and row 9 export check.
- Analytics default on vs store off. Default used. Confirm before Phase 4.
- Templates '+' kept (row 3).

## Next
- Round 68: src/app/food/history.tsx: translate strings and hardcoded error copy, with a strings render test.
- Then stale headers: meals.tsx '(Task 4)', saved.tsx '(mock)'.
- Then calendar hardcoded English (do not touch useLoggedDays).
- Row 13 remaining: calendar, detail, barcode, Food tab PendingSyncBanner.
- Row 14: Gym log and history empty states, one screen per round.
- Rows 15 to 17: empty state follow-ups.
- Row 6: non-sign-in backend measurements.
- Rows 7 and 8 (Sentry, PostHog), then rows 9 and 10, then Row 11 (final sweep).

## Parked (not Phase 3)
- Goals and units backend persistence (lost on restart).
- Jest drift: node_modules jest 30.0.5 vs pin 29.7.0. Fix with npm ci (needs network).
- 18 backend DB tests never run. Needs LUME_TEST_DATABASE_URL.
- es.json extra keys addMenu.voice and addMenu.describeOutLoud.
- Freeze toast shows success when queued offline (src/app/gym/freeze.tsx).
- Ask Lume drops server 503 message (src/app/ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Old local rows mix 'lunch' and 'Lunch'.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395 useWeeklyMacros. Row 11 or park.
- react-test-renderer deprecated warning in gymSchedule tests.
- Stale header comments: aiBrain.ts, gymSchedule.ts, 'French intentionally partial' in src/lib/i18n/index.ts.
- gymSchedule.revalidate.test.ts has its own useApi harness copy. Row 11.
- useInsights has no refetch, so no Retry. Park.
- allText crashes on full-screen trees (circular JSON). Use findAll. Park the helper fix.
- getMorningBrief and getProfile swallow failures as null. Park.
- hydrationErrorState.render.test.tsx prints many 'API unreachable' warnings. Park.
- Energy one-week-fails path untested. Park.
- Food tab mounts useInsights with no consent gate (pinned in phase14Regression). Park.
- 'No meals yet' reads oddly on a past day. Park unless row 13 wording is approved.
- Food tab has no PendingSyncBanner, so offline looks like a plain error. Row 13 later item.
- Shared render setup does not mock useFocusEffect or useLocalSearchParams. Park.
- Saved and calendar tests: consider a shared expo-router mock helper in Row 11.
- WeekStrip on Food tab shows no dots and no notice on a failed read. Blocked with calendar fix.
- No test checks that en, es and fr have the same keys. Park to Row 11.
- Past-day error copy has no test covering food.tsx (Food tab). Park unless approved.