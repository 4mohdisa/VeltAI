# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Work only on branch loop/phase3. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Checkpoint round 171 PASSED: tsc 0 errors; Jest 186 suites, 1149 tests, 4 snapshots (npx jest --ci).
- Next checkpoint: when the loop says so. None run since 171.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Prompts must state the branch rule every time. Read .git/HEAD. zsh rejects grep --include globs.
- Round 185 flag (partly done): kcal/kJ part DONE, digit grouping PARKED.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice with onRetry only if refetch exists.
- Empty or failed screen with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa's permission. Broken existing test or snapshot: back out and report. Never edit an existing test to fit a change.
- MacroBars translation backed out (summaryNoFabrication.test.ts:54). Stays English.
- Row 125 parked after two failed attempts.
- Render tests end .render.test.tsx and live in src/__tests__/render/.
- Unknown keys fall back with t(key, { defaultValue }).
- Visible bracket labels such as 'Protein (g)' stay. Only spoken labels change.
- Jest mock factories may only reference variables named mock*.
- Route params in tests: override expo-router, as exerciseProgress.render.test.tsx does.
- mealSlotName: unknown slot returns raw key addMenu.undefined. Screens that take outside input guard first.
- detail.tsx unknown slot: slotLabel(ctaSlot), fallback foodLog.addMeal (round 183). Verified round 184. Closed.
- addMenu.snack stays 'Snacks' in es and fr until review.
- InsightCard keeps the 120-character rule (default, Isa did not answer).
- No empty-week guard in nutrition.tsx: useWeeklyMacros always returns 7 days.
- Goals spoken labels: default B, keep current labels. goals.render.test.tsx pins them.
- Digit grouping: figures stay ungrouped (2140). formatNumber is en-AU; changing it needs an edit to an existing test. Parked.
- Loop note: a blocker repeated twice gets recorded under Blocked and not retried.
- getAnomalies keeps returning [] until /api/ai/anomalies exists.
- Jev ranks not followed when no major question exists.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles test, gymMuscles.fr.render.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary, plan card, insights, BrainProfileCard (numbers and kcal/kJ unit, insights.brainProfile.typicalIntakeValueKj), InsightCard badge, AnomalyCard, AnomalyBanner, Goals eyebrow, gramsField, percentField, resetDone toast, comma join, DailyMacroRing ringOf, food.tsx, add.tsx, nutrition.tsx, quick-add.tsx, detail.tsx, mealSlotName helper.

## Blocked on Isa (defaults used, do not re-ask)
- InsightCard truncation: option 1 (edit test to fire onTextLayout) needs Isa's OK. Default kept.
- Goals spoken labels: default B kept.
- Goals loading and error via useGoals: needs permission to change src/lib/data/hooks.ts.
- Profile error path (getProfile rethrow, useBrainProfile isError, aiFallback.test.ts:48-51): needs permission.
- Permission to add refetch to useExerciseProgress and useGymPatterns.
- Permission to regenerate snapshot for week.tsx flat bars (0 kcal) and define the no-logged-value rule.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on vs store off: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Wording review: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording.

## Next
- Profile screen hard-coded English titles and eyebrows (one screen, round 186).
- Quick-add: add the mealSlotName switch to Row 15 notes; check formatCalories ignores the user's unit.
- goals.tsx spoken calorie label and hard-coded g, % and comma join.
- Row 6 non-sign-in backend measurements; Rows 7, 8, 9, 10, then Row 11.
- Then, only if Isa answers: week.tsx flat bars.

## Parked (not Phase 3)
- Goals loading, error and persistence: needs hooks.ts refetch.
- getMorningBrief (api.ts:1232) swallows all errors to null; pinned by aiFallback.test.ts:26.
- AnomalyBanner: no Retry. Banner count title lacks _one use.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci.
- Jest noise: '[data] API unreachable' from hooks.ts:72.
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure.
- Date helpers use device locale; weekday letters, muscle names English.
- Dev gym failed read keeps mock sessions; dev falls back to mock product DB.
- Ask Lume drops server 503 message.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts 50, 52; hooks.ts ~395. Stale header comments: aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars unused; Math.round not formatNumber; nutrition ceiling label no space before g.
- Digit grouping by language: formatNumber en-AU, units.ts group en-US. Needs permission to edit brainProfileCard.i18n test line 56.
- formatCalories (formatting.ts:9) always shows kcal, ignoring the user's unit. Quick-add uses it.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- Two keys only in es: addMenu.voice and addMenu.describeOutLoud (en and fr missing).
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Fibre VoiceOver: needs key or drop 'optional'.
- Insight type badge: unknown types show as sent.
- Insight More/Less by text layout: needs device check on iOS and Android.
- Nutrition ring unit spoken as abbreviation; goals.tsx:133 speaks the raw unit in every language.
- week.tsx flat bars when every day is 0 kcal.
- InsightCard.tsx:77 uses the 120-character toggle rule.
- Food tab: 'Freeze offline toast' and 'Gym and food' gym_correlation wording kept by default.
- Insight catch blocks: getProfile .catch(() => null) hides errors; getAnomalies .catch(() => []) kept.
- addMenu.snack wording still needs review.
- addMenu.addToSlot with a lowercased fallback label could read oddly.
- Insight error surfacing and the goals spoken labels: awaiting Isa, defaults kept.