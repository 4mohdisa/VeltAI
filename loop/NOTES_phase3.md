# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 129 checkpoint clean: tsc 0; Jest 173 suites, 1114 tests, 4 snapshots pass.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Row 15 round numbers may clash with loop numbers. Recorded, not fixed.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default with anonymous ID; Settings off switch; store default off. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add-workout entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice with onRetry only if refetch exists. No Retry on useExerciseProgress or useGymPatterns.
- Empty or failed screen with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly ’ in new strings.
- Snapshots: no regeneration without Isa's permission.
- Streak empty means longest streak and total sessions both 0.
- Dashboard: failed sessions use gym.loadFailed; failed energy uses dashboard.energyLoadFailed; energy notice only when both week reads fail.
- Summary card and GymStatusCard hidden during every first load. Accepted.
- Plan card scope uses dashboard.planCardScope. Shipped.
- Test edit forbidden and breaking: back out or stop. Never leave suite red.
- MacroBars translation backed out (summaryNoFabrication.test.ts reads source). Stays English.
- Round 125 row parked after two failed attempts.
- Round 129: checkpoint kept over Jev's insights pick.
- Round 130: insights literals chosen over MacroBars (blocked) and goals states. Scope is literals only.
- Round 130 flag (partly done): insights screen translated; the three AI cards are not. Finish cards one per round: BrainProfileCard (131), InsightCard, AnomalyCard.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym screens have failed-read notice and calm empty states.
- Row 15 PARTIAL: dashboard training, week, energy, nutrition, fibre, GymStatusCard, Summary strings, plan card scope, French foodLog.today, insights screen literals (round 130).

## In progress
- Round 131: BrainProfileCard.tsx literals to insights.brainProfile.* keys.

## Blocked on Isa (defaults used, do not re-ask)
- Snapshot permission for detailChrome macros (row 125). Default: chart stays.
- Permission to change summaryNoFabrication.test.ts:54 (MacroBars). Default: English.
- Row 12 BUILT approval.
- Spanish and French wording for new keys in rows 13, 14, 15, plan card and insights. Shipped as written.
- Keys ', today', 'Previous week', 'Next week'. WeekStrip labels stay.
- Row 13: 'New recipe' kept. No /food/meals link.
- Row 14: 'racha' (es), 'serie' (fr) for streak. Freeze sheet wording to review.
- Permission to add refetch to useExerciseProgress and useGymPatterns. Default: no Retry.
- useLoggedDays calendar failed read has no error. Leave.
- lookupBarcodeAsync not found vs offline copy. Keep.
- Whether French weekMacrosEmpty uses curly apostrophe. Default: yes.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off: confirm before Phase 4.
- Nutrition follows Food tab date. Leave.
- Goals persistence. Default: in memory.

## Next
- Round 131: BrainProfileCard strings (in progress).
- Then InsightCard.tsx and AnomalyCard.tsx strings, one per round.
- Then insights swallowed errors in src/lib/api.ts (~1253, 1270) and the fixed 0.3 bar in BrainProfileCard.tsx:70.
- Row 15 goals load and error states.
- week.tsx flat intake bars when every day is 0 kcal. Needs a no-logged-value rule.
- Then Rows 16 and 17, one screen per round.
- Row 14 cleanup: gymMuscles.shape and sheetContent.render read en.json; key parity check; shared has-a-streak helper.
- Row 6: non-sign-in backend measurements.
- Rows 7, 8, 9, 10, then Row 11.

## Parked (not Phase 3)
- Row 125 all-zero week chart line (needs snapshot permission).
- Goals and units persistence.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci (network).
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure (src/lib/data).
- Date helpers use device locale; weekday letters, formatRelativeDate, muscle names English; '{{value}} reps' no singular.
- Dev gym failed read keeps mock sessions; dev falls back to mock product DB.
- Ask Lume drops server 503 message.
- insights.tsx comment says feed can trigger AI generation on server; phase14Regression.test.ts says false. Fix comment in Row 11.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts 50, 52; hooks.ts ~395.
- Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars Math.round not formatNumber; MacroBars unused in app; nutrition ceiling label no space before g.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; logged-day label; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- react-test-renderer deprecation and 'background sync failed' warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Gym card may show seed data after failed dashboard read.
- EMPTY_STATES_AUDIT.md Summary loading row still calls GymStatusCard broken.
- Plan card in index.tsx has hard-coded AI scope.
- Round numbers in PHASE3_ROWS.md may clash with loop numbers.