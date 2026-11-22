# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git or Prettier. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Last full checkpoint round 144: tsc 0; Jest 179 suites, 1134 tests, 4 snapshots (npx jest --ci). Other rounds run changed files only.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Round numbers in PHASE3_ROWS.md notes (118 to 120) may clash with loop numbers. Not fixed.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice with onRetry only if refetch exists. No Retry on useExerciseProgress or useGymPatterns.
- Empty or failed screen with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr put a plain space before %.
- Snapshots: no regeneration without Isa's permission.
- Test edit that breaks a test: back out and report. Never leave suite red.
- MacroBars translation backed out (summaryNoFabrication.test.ts:54). Stays English.
- Row 125 parked after two failed attempts. Streak empty means longest streak and total sessions both 0.
- Dashboard: failed sessions use gym.loadFailed; failed energy uses dashboard.energyLoadFailed.
- Summary card and GymStatusCard hidden during first load. Accepted.
- Server text (titles, bodies, insight type) shown as sent. Weekdays mapped by weekdayLabel; unknown shown as sent.
- Goals reset test named *.render.test.tsx.
- Rounds 129, 144: checkpoint kept over Jev picks.
- Round 155: InsightCard badge chosen over Goals states (Goals needs hooks.ts permission).

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles empty test.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary, plan card scope, insights screen, BrainProfileCard, InsightCard text, AnomalyCard, AnomalyBanner, Goals literals, goals reset toast, goals unit labels, fibre spoken label.

## Blocked on Isa (defaults used, do not re-ask)
- Goals loading and error via useGoals: parked.
- Permission to edit gymMuscles.shape.render and sheetContent.render tests to read en.json: no edit.
- Review insights.* and banner wording; es/fr weekday capitalisation: lowercase.
- 'patterns' vs 'activity' in banner titles: keep.
- Snapshot permission for detailChrome macros (row 125): chart stays.
- Permission to change summaryNoFabrication.test.ts:54: English stays.
- Row 12 BUILT approval.
- Spanish and French wording for new keys in rows 13 to 15: shipped as written.
- Keys ', today', 'Previous week', 'Next week': WeekStrip labels stay.
- Row 13: 'New recipe' kept. No /food/meals link.
- Row 14: 'racha' (es), 'serie' (fr). Freeze sheet wording to review.
- Permission to add refetch to useExerciseProgress and useGymPatterns: no Retry.
- useLoggedDays failed read has no error: leave.
- lookupBarcodeAsync not-found vs offline copy: keep.
- Owner check pending: Food tab offline banner in simulator.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Analytics default on vs store off: confirm before Phase 4.
- Nutrition follows Food tab date: leave.
- Goals persistence: in memory.
- es.json has addMenu.voice and addMenu.describeOutLoud not in en or fr: delete or add.
- 'Goals reset to defaults.' wording and goals.saved unused: delete or keep.
- Comma join for label and unit: keep in code, or move to locale files.
- Visible bracket labels 'Protein (g)' kept.
- Fibre spoken 'Fibre, g, optional' (round 154): Isa may change.

## Next
- InsightCard more/less toggle: body over 120 characters rule.
- week.tsx flat intake bars when every day is 0 kcal: needs a no-logged-value rule.
- insights.tsx consent comment is false (phase14Regression.test.ts).
- BrainProfileCard: fixed 0.3 bar; numbers unformatted; energy always kcal.
- api.ts swallows insight errors (~1253, 1270).
- DailyMacroRing.tsx:73 hard-coded 'of'; nutrition.tsx:227 raw meal slot name.
- Goals loading and error only after Isa allows hooks.ts.
- Row 6: non-sign-in backend measurements.
- Rows 7, 8, 9, 10, then Row 11.

## Parked (not Phase 3)
- Goals loading and error (src/app/profile/goals.tsx): needs useGoals refetch.
- Row 125 all-zero week chart line: needs snapshot permission.
- Goals and units persistence.
- AnomalyBanner: no Retry; copy may be English, not opened.
- Banner count title lacks _one use.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci.
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure.
- Date helpers use device locale; weekday letters, muscle names English.
- Dev gym failed read keeps mock sessions; dev falls back to mock product DB.
- Ask Lume drops server 503 message.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts 50, 52; hooks.ts ~395. Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars unused; Math.round not formatNumber; nutrition ceiling label has no space before g.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Profile screens hard-code English titles and eyebrows (About, Privacy, Account, Connected apps, Delete Account, Units).
- Gym card may show seed data after a failed dashboard read.
- Round 149 reset toast copy may be inaccurate; Isa to pick wording.
- Fibre VoiceOver: no accessibilityLabel; needs key or drop 'optional'.