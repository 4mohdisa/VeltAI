# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Work only on branch loop/phase3. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Checkpoint round 171 PASSED: tsc 0 errors; Jest 186 suites, 1149 tests, 4 snapshots, none skipped (npx jest --ci).
- Next checkpoint: round 178 or later, when the loop says so.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Prompts must state the branch rule every time.
- Handover written after round 172. Claude Code knows only the summary: name files fully.
- Round 172 DONE: nutrition.tsx unchanged; meal row uses mealSlotName (lines 228, 244); dashboardNutrition.locale.render.test.tsx covers en, es, fr.
- Round 173 in progress: Row 15 notes, add quick-add switch (doc only).

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice with onRetry only if refetch exists.
- Empty or failed screen with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa's permission. Broken existing test or snapshot: back out and report.
- MacroBars translation backed out (summaryNoFabrication.test.ts:54). Stays English.
- Row 125 parked after two failed attempts.
- Render tests end .render.test.tsx and live in src/__tests__/render/.
- Unknown keys fall back with t(key, { defaultValue }), as in food/detail.tsx:677.
- Visible bracket labels such as 'Protein (g)' stay. Only spoken labels change.
- Jest mock factories may only reference variables named mock*.
- Route params in tests: override expo-router, as exerciseProgress.render.test.tsx does.
- Round 155, 158, 160, 166, 167, 168, 169, 170, 171, 172: see earlier rounds; each was a loop-forced or verify-first pick over Jev.
- Round 173: doc fix over Jev's ask (69%, risk 0.8). Default covers the detail.tsx question.
- Unknown slot in mealSlotName: fall back to t('foodLog.addMeal', { defaultValue }), not addMenu.undefined. Applies in round 174.
- addMenu.snack stays 'Snacks' in es and fr until review.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles test, gymMuscles.fr.render.
- Row 15 PARTIAL: dashboard, week, energy, nutrition (done 172), fibre, GymStatusCard, Summary, plan card, insights, BrainProfileCard, InsightCard badge, AnomalyCard, AnomalyBanner, Goals eyebrow, gramsField, percentField, resetDone toast, comma join, DailyMacroRing ringOf, food.tsx, quick-add.tsx, add.tsx via mealSlotName helper.

## Blocked on Isa (defaults used, do not re-ask)
- Goals loading and error via useGoals: needs permission to change src/lib/data/hooks.ts.
- Permission to add refetch to useExerciseProgress and useGymPatterns.
- Permission to regenerate snapshot for week.tsx flat bars (0 kcal) and define the no-logged-value rule.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on vs store off: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Wording review: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording.

## Next
- Round 173: Row 15 notes, quick-add switch (in progress).
- Round 174: food/detail.tsx slot map to mealSlotName; change helper unknown-slot fallback to foodLog.addMeal; update mealSlotName.test.ts.
- Then: InsightCard.tsx:77 more/less toggle (120-character rule).
- Then: week.tsx flat bars when every day is 0 kcal (needs snapshot permission).
- Then: BrainProfileCard numbers formatted, energy unit not always kcal.
- Then: api.ts swallows insight errors (~1253, 1270).
- Then: Profile screens hard-coded English titles (About, Privacy, Account, Connected apps, Delete Account, Units).
- Then: goals.tsx hard-codes 'g', '%' and comma join.
- Then: Row 6 non-sign-in backend measurements; Rows 7, 8, 9, 10, then Row 11.

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
- Nutrition ring unit ('kcal' or 'kJ') spoken as abbreviation.
- goals.tsx hard-codes 'g' and '%' in spoken labels.
- Food tab: 'Freeze offline toast' and 'Gym and food' gym_correlation wording kept by default.