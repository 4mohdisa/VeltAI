# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Work only on branch loop/phase3. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Checkpoint round 171 PASSED: tsc 0 errors; Jest 186 suites, 1149 tests, 4 snapshots, none skipped (npx jest --ci).
- Next checkpoint: round 178 or later, when the loop says so.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Prompts must state the branch rule every time.
- Read .git/HEAD for the branch. zsh rejects grep --include globs.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice with onRetry only if refetch exists.
- Empty or failed screen with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks (Row 15, round 179).
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
- mealSlotName: unknown slot returns raw key addMenu.undefined; screens that take outside input guard first.
- addMenu.snack stays 'Snacks' in es and fr until review.
- InsightCard keeps the 120-character rule (default, Isa did not answer).
- No empty-week guard in nutrition.tsx: useWeeklyMacros always returns 7 days.
- Goals spoken labels: default B, keep current labels. goals.render.test.tsx pins them.
- Loop note: a blocker repeated twice gets recorded under Blocked and not retried.
- Jev ranked api.ts first at 92% (round 179). Picked it because it was already the next item in the plan.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles test, gymMuscles.fr.render.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary, plan card, insights, BrainProfileCard, InsightCard badge, AnomalyCard, AnomalyBanner, Goals eyebrow, gramsField, percentField, resetDone toast, comma join, DailyMacroRing ringOf, food.tsx, add.tsx, nutrition.tsx, quick-add.tsx (uses shared SLOTS from mappers.ts; en/es/fr render test passing).
- mealSlotName helper: src/lib/mealSlotName.ts with tests.

## Blocked on Isa (defaults used, do not re-ask)
- detail.tsx slot map (line 53) to mealSlotName: fallback decision needed. Do not retry until Isa answers.
- InsightCard truncation: option 1 (edit test to fire onTextLayout) needs Isa's OK. Default kept.
- Goals spoken labels: default B kept.
- Goals loading and error via useGoals: needs permission to change src/lib/data/hooks.ts.
- Permission to add refetch to useExerciseProgress and useGymPatterns.
- Permission to regenerate snapshot for week.tsx flat bars (0 kcal) and define the no-logged-value rule.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on vs store off: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Wording review: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording.

## Next
- Now: api.ts insight catch blocks (~1253, 1270) rethrow; test src/__tests__/insightErrors.test.ts.
- Then: BrainProfileCard numbers formatted, energy unit not always kcal.
- Then: Profile screens hard-coded English titles (About, Privacy, Account, Connected apps, Delete Account, Units).
- Then: Row 6 non-sign-in backend measurements; Rows 7, 8, 9, 10, then Row 11.
- Then, only if Isa answers: detail.tsx mealSlotName switch; week.tsx flat bars.

## Parked (not Phase 3)
- Goals loading, error and persistence: needs hooks.ts refetch.
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
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Fibre VoiceOver: needs key or drop 'optional'.
- Insight type badge: unknown types show as sent.
- Insight More/Less by text layout: needs device check on iOS and Android.
- Nutrition ring unit spoken as abbreviation; goals.tsx:133 speaks the raw unit in every language.
- week.tsx flat bars when every day is 0 kcal.
- goals.tsx hard-codes 'g', '%' and the comma join.
- Food tab: 'Freeze offline toast' and 'Gym and food' gym_correlation wording kept by default.