# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Work only on branch loop/phase3. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Checkpoint round 158 PASSED: tsc 0 errors; Jest 183 suites, 1141 tests, 4 snapshots (npx jest --ci).
- Next checkpoint: round 172. Other rounds: changed files only.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Prompts must state the branch rule every time.
- Round 165 re-check: nutrition.tsx:237 uses translated slotName; :227 is not a slot label. Handover NEXT about :227 is stale.
- Round 167: last report flagged partly done. Helper exists and food.tsx uses it; four copies still hold their own map. Closing them one file per round.

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
- Render tests must end .render.test.tsx and live in src/__tests__/render/.
- Unknown keys fall back with t(key, { defaultValue }), as in food/detail.tsx:677.
- Visible bracket labels such as 'Protein (g)' stay. Only spoken labels change.
- Round 155: InsightCard badge chosen over Goals states.
- Round 158: checkpoint chosen over Jev's nutrition pick.
- Round 160: visible fix chosen over Jev's shared-helper pick.
- Round 161: spoken slot name plus es/fr render test.
- Round 162: week-empty guard not needed. useWeeklyMacros always returns 7 days.
- Round 166: shared slot-name helper chosen. Helper in src/lib/mealSlotName.ts.
- Round 167: nutrition.tsx swap chosen over Jev's ask/run split (low confidence, not a major question).

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles empty test.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary, plan card, insights, BrainProfileCard, InsightCard, AnomalyCard, AnomalyBanner, Goals labels and toast, DailyMacroRing ringOf, food.tsx slot names via helper.

## Blocked on Isa (defaults used, do not re-ask)
- One-word ringOf vs full-phrase key; comma join for label and unit. Default: keep.
- 'Gym and food' for gym_correlation. Default: keep.
- Goals loading and error via useGoals: needs permission to change src/lib/data/hooks.ts.
- Goals persistence: in memory.
- Wording: 'Goals reset to defaults.'; delete unused goals.saved?
- Fibre spoken label 'Fibre (optional)'.
- Permission to make gymMuscles.shape and sheetContent.render tests read en.json.
- es.json has addMenu.voice and addMenu.describeOutLoud not in en or fr: delete or add.
- summaryNoFabrication.test.ts:54 English stays. detailChrome snapshot: chart stays.
- Permission to add refetch to useExerciseProgress and useGymPatterns.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on vs store off: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Review insights and banner wording; es/fr weekday capitalisation: lowercase.
- Slot name wording for snack ('Snacks' in es and fr) needs review.
- Helper fallback for unknown slot shows raw key addMenu.undefined: readable fallback or keep?
- Permission to regenerate snapshot for week.tsx flat bars (0 kcal) and to define the no-logged-value rule.

## Next
- Round 167: mealSlotName in dashboard/nutrition.tsx (verify line 227 first).
- Then the same helper in food/add.tsx (raw key at :65), food/quick-add.tsx, food/detail.tsx (defaultValue at :677). One file per round.
- Then: week.tsx show existing no-data state when every day is 0 kcal (needs permission for snapshot).
- Then: InsightCard more/less toggle, 120-character rule.
- Then: BrainProfileCard numbers formatted, energy unit not always kcal.
- Then: api.ts swallows insight errors (~1253, 1270).
- Then: Profile screens hard-coded English titles (About, Privacy, Account, Connected apps, Delete Account, Units).
- Then: goals.tsx hard-codes 'g', '%' and comma join.
- Then: Row 6 non-sign-in backend measurements; Rows 7, 8, 9, 10, then Row 11.

## Parked (not Phase 3)
- Goals loading and error and persistence: needs hooks.ts refetch.
- AnomalyBanner: no Retry; copy may be English. Banner count title lacks _one use.
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