# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Rows say built, never verified (Isa verifies). Every prompt must state the branch rule.

## State
- Baseline (Node 22.23.5): tsc 0; app Jest 135 suites, 993 tests; backend 614 pass, 18 skipped (need LUME_TEST_DATABASE_URL).
- Round 114 checkpoint (jest --ci): tsc 0; Jest 172 suites, 1111 tests, 0 failed. Next checkpoint about round 129.
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Jest pinned ~29.7.0, never upgrade. Render tests are *.render.test.tsx. Maestro not installed. Local Colima Postgres 127.0.0.1:55432.
- Rounds 112 and 114 have no Row 15 note. Recorded, not fixed.
- Round numbers in Row 15 notes may clash with git commit numbers. Recorded, not fixed.
- Loop flag on round 124 report (tsc or tests not run): round 125 runs tsc and the changed tests.

## Decisions (never delete)
- Local backend and local database only. Phase 1 design final except named Phase 3 rows. Phase 4 out of scope.
- Crash reporting Sentry. Analytics PostHog. Names and counts only.
- Analytics on by default with anonymous ID; off switch in Settings; store default off. Isa to confirm before Phase 4.
- Row 3: header plus on My workouts is the only way to add a second workout. Templates kept.
- Goals and units in memory in Phase 3. Goals persistence parked.
- Failed reads: LoadFailedNotice with onRetry={refetch} only if refetch exists. useExerciseProgress and useGymPatterns have no refetch, so no Retry.
- Empty or failed screens with no stored data: one clear action.
- Identical text reuses existing keys. Data layer (src/lib/data) off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- Locale blocks inserted as text. French: no-break space before ':' and '?'. French apostrophe: curly ’ in new strings (round 125).
- Snapshots: an intended change may be regenerated one snapshot at a time, with the diff checked. Not allowed without Isa's permission now.
- Streak and freeze empty means longest streak and total sessions both 0.
- GlassButtons.tsx changed in round 98 (freeze sheet Close). Accepted.
- Dashboard: failed sessions use gym.loadFailed; failed energy uses dashboard.energyLoadFailed. useEnergyRange isError only when both week reads fail.
- Summary card guard hides during every first load. Accepted.
- Plan card scope uses dashboard.planCardScope (en AI, es IA, fr IA). Shipped as written.
- When a brief forbids editing a test that a change breaks: back out or stop. Never leave the suite red.
- Round 117: MacroBars translation backed out (summaryNoFabrication.test.ts reads source text). Stays English until Isa grants the test change.
- Jev rounds 118 to 125: kept run over ask. Round 125 reason: loop flag needs tsc and tests run; question already asked.
- Row 125 parked (round 125) after two failed attempts. All-zero week chart left as is.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail done.
- Row 14 PARTIAL: all gym screens have failed-read notice and calm empty states.
- Row 15 PARTIAL: dashboard training, week, energy, nutrition loading and failed week read, fibre dash, GymStatusCard, Summary tab strings and Spanish render test done. French foodLog.today apostrophe done. Plan card scope done (round 120). Row 125 parked (round 125).

## Blocked on Isa (defaults used, do not re-ask)
- RECURRING, do not retry: permission to regenerate the detailChrome macros snapshot alone (row 125). Default: chart stays.
- RECURRING, do not retry: Round 117 MacroBars translation. Needs permission to change summaryNoFabrication.test.ts:54. Default: MacroBars stays English.
- Row 12 BUILT approval.
- Spanish and French wording of new blocks in Rows 13, 14, 15, the plan card scope 'IA' (round 120), and the plan card scope (round 122). Shipped as written.
- Keys for en, es, fr: ', today', 'Previous week', 'Next week'. WeekStrip labels stay until approved.
- Row 13: 'New recipe' vs 'New Recipe' (default keep current). /food/meals link from Food tab (default no link).
- Row 14: 'streak' as 'racha' (es), 'serie' (fr). Freeze sheet disables apply tick and shows log-session when no streak. Review.
- Permission to add refetch to useExerciseProgress and useGymPatterns (src/lib/data). Default: no Retry.
- useLoggedDays calendar failed read has no error. Default: leave.
- lookupBarcodeAsync: not found vs offline. Keep copy.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 (Maestro, seeded users) needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off. Confirm before Phase 4.
- Nutrition follows Food tab date (audit 126). Default: leave.
- Goals persistence for Row 15. Default: in memory.
- Spanish and French wording for new keys of row 15 (energyLoadFailed, weekMacrosLoadFailed, gymSession*, gymLoggedToast, macrosCardLabel, planCardLabel).

## Next
- Row 15 round 126: verify tree green (tsc, detailChrome, nutrition empty states), then insights screen: list hard-coded text and swallowed errors; find the insights file first.
- Row 15 remaining: goals load and error states; gym card may show seed data after failed dashboard read.
- week.tsx draws flat intake bars when every day has 0 kcal eaten. Needs a rule for 'no logged value'.
- Then Rows 16 and 17, one screen per round.
- Row 14 cleanup: gymMuscles.shape and sheetContent.render read en.json. Add key parity check. Shared has-a-streak helper.
- Row 6: non-sign-in backend measurements.
- Rows 7, 8, 9, 10, then Row 11.

## Parked (not Phase 3)
- Row 125 all-zero week chart empty line (needs snapshot permission).
- Goals and units persistence (lost on restart).
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci (network).
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure (needs src/lib/data change).
- Date helpers use device locale; formatRelativeDate and weekday letters hardcoded English. Muscle names English. '{{value}} reps' has no singular. Planned-weight unit not translated.
- Dev gym failed read keeps mock sessions; dev falls back to mock product DB.
- Ask Lume drops server 503 message (ai-query.tsx).
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts lines 50, 52; hooks.ts ~395. Row 11 or park.
- Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' still English.
- MacroBars.tsx: Math.round not formatNumber; component unused except MacroTargetRows. Nutrition ceiling label has no space before g.
- Row 11: gymSession eyebrow and defaultTitle duplicate foodLog.today; WeekStrip and calendar duplicate logged-day label; gymMuscles.goBack duplicates common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- 'background sync failed' warnings in gym suites; react-test-renderer deprecation warning.
- Freeze offline toast claims success even when the request fails. 'has a streak' check duplicated in streak.tsx and freeze.tsx.
- Index.tsx comment above plan card still says AI stays in scope slot. Accurate for English only.
- My round numbers in Row 15 notes may clash with loop round numbers.