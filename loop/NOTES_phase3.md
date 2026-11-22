# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 129 checkpoint clean: tsc 0; Jest 173 suites, 1114 tests, 4 snapshots pass.
- Round 137 (AnomalyCard) reported done; auto check flagged it partly done. Round 138 verifies it.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Round numbers in PHASE3_ROWS.md (118 to 120) may clash with loop numbers. Recorded, not fixed.

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
- French: no-break space before ':' and '?'. Curly apostrophe in new strings.
- Snapshots: no regeneration without Isa's permission.
- Streak empty means longest streak and total sessions both 0.
- Dashboard: failed sessions use gym.loadFailed; failed energy uses dashboard.energyLoadFailed; energy notice only when both week reads fail.
- Summary card and GymStatusCard hidden during every first load. Accepted.
- Test edit forbidden and breaking: back out or stop. Never leave suite red.
- MacroBars translation backed out (summaryNoFabrication.test.ts reads source). Stays English.
- Round 125 row parked after two failed attempts.
- Round 129: checkpoint kept over Jev's insights pick.
- Round 130: insights literals chosen over MacroBars and goals states. Literals only.
- Round 136: InsightCard literals done, insights.card group added.
- Round 137: AnomalyCard literals done, insights.anomaly group added. Built, not verified.
- Round 138: verify insights.anomaly and insights.card keys in en, es, fr, and AnomalyCard uses t(). Then goals.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym screens have failed-read notice and calm empty states.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary strings, plan card scope, insights screen, BrainProfileCard, InsightCard, AnomalyCard literals.

## In progress
- Round 138: verify AnomalyCard insights keys and tests (Row 15).

## Blocked on Isa (defaults used, do not re-ask)
- Review insights.*, insights.brainProfile.*, insights.card and insights.anomaly wording, including weekday capitalisation (default: es/fr lowercase).
- Snapshot permission for detailChrome macros (row 125). Default: chart stays.
- Permission to change line 54 of summaryNoFabrication.test.ts (MacroBars). Default: English.
- Row 12 BUILT approval.
- Spanish and French wording for new keys in rows 13, 14, 15. Shipped as written.
- Keys ', today', 'Previous week', 'Next week'. WeekStrip labels stay.
- Row 13: 'New recipe' kept. No /food/meals link.
- Row 14: 'racha' (es), 'serie' (fr) for streak. Freeze sheet wording to review.
- Permission to add refetch to useExerciseProgress and useGymPatterns. Default: no Retry.
- useLoggedDays calendar failed read has no error. Leave.
- lookupBarcodeAsync not found vs offline copy. Keep.
- French weekMacrosEmpty curly apostrophe. Default: yes.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off: confirm before Phase 4.
- Nutrition follows Food tab date. Leave.
- Goals persistence. Default: in memory.

## Next
- Round 138: verify AnomalyCard (in progress).
- Row 15 goals screen src/app/profile/goals.tsx: loading and error states, English text.
- AnomalyBanner.tsx copy audit (may be English).
- insights swallowed errors in src/lib/api.ts (~1253, 1270) and fixed 0.3 bar in BrainProfileCard.tsx (~79).
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
- InsightCard type badge shows raw server type; needs the server's type list.
- InsightCard more/less toggle uses body length over 120 chars.
- BrainProfileCard numbers not formatted for language; energy always kcal.
- Dev gym failed read keeps mock sessions; dev falls back to mock product DB.
- Ask Lume drops server 503 message.
- insights.tsx comment vs phase14Regression.test.ts on AI generation. Fix in Row 11.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts 50, 52; hooks.ts ~395.
- Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars Math.round not formatNumber; unused in app; nutrition ceiling label no space before g.
- Insight numbers use Math.round; energy always kcal, ignores unit setting.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; logged-day label; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- react-test-renderer deprecation and 'background sync failed' warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Gym card may show seed data after failed dashboard read.
- EMPTY_STATES_AUDIT.md: Summary loading row corrected.
- Plan card in index.tsx has hard-coded AI scope.
- Dashboard week.tsx and nutrition ceiling label as listed above.
- Round numbers in PHASE3_ROWS.md may clash with loop numbers.
- Freeze/analytics: none new.