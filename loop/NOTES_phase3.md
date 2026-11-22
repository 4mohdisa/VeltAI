# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last full checkpoint (round 144): tsc 0; Jest 179 suites, 1134 tests, 4 snapshots (npx jest --ci). Later rounds ran only changed files.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Round numbers in PHASE3_ROWS.md notes (118 to 120) may clash with loop numbers. Not fixed.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add-workout entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice with onRetry only if refetch exists. No Retry on useExerciseProgress or useGymPatterns.
- Empty or failed screen with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes in new strings.
- Snapshots: no regeneration without Isa's permission.
- Test edit that breaks a test: back out and report. Never leave suite red.
- MacroBars translation backed out (summaryNoFabrication.test.ts:54). Stays English.
- Row 125 parked after two failed attempts. Streak empty means longest streak and total sessions both 0.
- Dashboard: failed sessions use gym.loadFailed; failed energy uses dashboard.energyLoadFailed.
- Summary card and GymStatusCard hidden during first load. Accepted.
- Rounds 129, 144: checkpoint kept over Jev picks. Rounds 139 to 141: AnomalyCard and AnomalyBanner closed.
- Round 146: French goals fix chosen. Round 147: Row 14 cleanup chosen; its two test edits dropped, no re-ask. Row 14 PARTIAL.
- Round 148 goals reset toast was in progress; reissued as round 149 after a rejected prompt (branch rule missing).

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles empty test.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary strings, plan card scope, insights screen, BrainProfileCard, InsightCard, AnomalyCard, AnomalyBanner, Goals literals, French goals curly apostrophes.

## Blocked on Isa (defaults used, do not re-ask)
- Goals loading and error via useGoals (loading, error, refetch). Default: parked.
- Permission to edit gymMuscles.shape.render and sheetContent.render tests to read en.json. Default: no edit.
- Review insights.* and banner wording; es/fr weekday capitalisation (default lowercase).
- 'patterns' vs 'activity' in banner titles. Default keep.
- Snapshot permission for detailChrome macros (row 125). Default: chart stays.
- Permission to change summaryNoFabrication.test.ts:54 (MacroBars). Default English.
- Row 12 BUILT approval.
- Spanish and French wording for new keys in rows 13 to 15: shipped as written.
- Keys ', today', 'Previous week', 'Next week': WeekStrip labels stay.
- Row 13: 'New recipe' kept. No /food/meals link.
- Row 14: 'racha' (es), 'serie' (fr). Freeze sheet wording to review.
- Permission to add refetch to useExerciseProgress and useGymPatterns. Default: no Retry.
- useLoggedDays failed read has no error. Leave.
- lookupBarcodeAsync not-found vs offline copy. Keep.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off: confirm before Phase 4.
- Nutrition follows Food tab date. Leave.
- Goals persistence. Default: in memory.
- es.json has addMenu.voice and addMenu.describeOutLoud not in en.json or fr.json. Isa: delete or add.

## Next
- Goals reset toast uses goals.resetDone (round 149, in progress).
- Row 15 note for the round 146 French goals change.
- week.tsx flat intake bars when every day is 0 kcal. Needs a no-logged-value rule.
- Insights consent comment in insights.tsx is false (phase14Regression.test.ts).
- InsightCard type badge untranslated; more/less toggle uses body length over 120.
- BrainProfileCard: fixed 0.3 bar; numbers unformatted; energy always kcal. Insights swallow errors in src/lib/api.ts (~1253, 1270).
- Goals calorie label puts unit in brackets.
- Row 14: key parity check; shared has-a-streak helper.
- Then Rows 15 to 17, one screen per round.
- Row 6: non-sign-in backend measurements.
- Rows 7, 8, 9, 10, then Row 11.

## Parked (not Phase 3)
- Goals loading and error states (src/app/profile/goals.tsx), needs useGoals refetch; blocked on Isa.
- Row 125 all-zero week chart line (needs snapshot permission).
- Goals and units persistence.
- AnomalyBanner: no Retry; full error block where a small banner sits. Copy may be English, not opened.
- Banner count title lacks _one use.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci (network).
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure.
- Date helpers use device locale; weekday letters, formatRelativeDate, muscle names English; '{{value}} reps' no singular.
- Dev gym failed read keeps mock sessions; dev falls back to mock product DB.
- Ask Lume drops server 503 message.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts 50, 52; hooks.ts ~395. Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars unused; Math.round not formatNumber; nutrition ceiling label has no space before g.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Other profile screens hard-code English titles and eyebrows (About, Privacy, Account, Connected apps, Delete Account, Units on Preferences).
- Round numbers in PHASE3_ROWS.md may clash with loop numbers.