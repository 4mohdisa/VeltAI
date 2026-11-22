# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Work only on branch loop/phase3. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 187 checkpoint PASSED: tsc 0; Jest 191 suites, 1162 tests, 4 snapshots.
- Next checkpoint: round 203 (full tsc and full npx jest --ci, no file changes).
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Prompts must state the branch rule every time. Read .git/HEAD. zsh rejects grep --include globs.
- Handover after round 189. Fresh session: name files fully in prompts.

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
- Snapshots: no regeneration without Isa's permission. Broken existing test: back out and report. Never edit an existing test to fit a change.
- MacroBars translation backed out (summaryNoFabrication.test.ts:54). Stays English.
- Row 125 parked after two failed attempts.
- Render tests end .render.test.tsx, in src/__tests__/render/.
- Unknown keys fall back with t(key, { defaultValue }).
- Visible bracket labels such as 'Protein (g)' stay. Only spoken labels change.
- Jest mock factories may only reference variables named mock*.
- Route params in tests: override expo-router as exerciseProgress.render.test.tsx does.
- mealSlotName: unknown slot returns raw key addMenu.undefined. Screens with outside input guard first.
- detail.tsx unknown slot: slotLabel(ctaSlot), fallback foodLog.addMeal. Closed.
- addMenu.snack stays 'Snacks' in es and fr until review.
- InsightCard keeps the 120-character rule (default, Isa did not answer).
- No empty-week guard in nutrition.tsx: useWeeklyMacros always returns 7 days.
- Goals spoken labels: default B, keep current labels.
- Digit grouping: figures stay ungrouped (2140). Parked.
- getAnomalies returns [] until /api/ai/anomalies exists.
- Jev ranks not followed when no major question exists.
- Account: eyebrow, title, Save localised. Remaining English in Parked.
- Integrations eyebrow: Option A (new keys profile.connectionsSyncing, connectionsNone, connectionsCount). Default used, Isa did not answer.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles test.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary, plan card, insights, BrainProfileCard, InsightCard, AnomalyCard, AnomalyBanner, Goals eyebrow, gramsField, percentField, resetDone toast, comma join, DailyMacroRing, food.tsx, add.tsx, nutrition.tsx, quick-add.tsx, detail.tsx, mealSlotName, About, Account, integrations title.

## In progress
- Row 15: integrations eyebrow (Option A keys), then its Row 15 note.

## Blocked on Isa (defaults used, do not re-ask)
- InsightCard truncation: edit test to fire onTextLayout. Default kept.
- Goals spoken labels: default B kept.
- Goals loading and error via useGoals: needs permission to change src/lib/data/hooks.ts.
- Profile error path (getProfile rethrow, aiFallback.test.ts:48-51): needs permission.
- Refetch on useExerciseProgress and useGymPatterns: needs permission.
- Regenerate snapshot for week.tsx flat bars: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on vs store off: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Wording: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording.
- About tagline and row labels Version, Build, Credits, 'Lume team': need es and fr wording.
- Whether formatNumber should follow the active language.

## Next
- Row 15: preferences (eyebrow 'Units'), privacy, scan-calibration, support.
- goals.tsx spoken calorie label and hard-coded g, % and comma join.
- Row 6 non-sign-in backend measurements; Rows 7, 8, 9, 10, then Row 11.
- Checkpoint at round 203.

## Parked (not Phase 3)
- Account: Display name, Email, toasts 'Name updated.' and 'Saved on this device, could not reach the server.' still English.
- Goals loading, error and persistence: needs hooks.ts refetch.
- getMorningBrief (api.ts:1232) swallows errors to null; pinned by aiFallback.test.ts:26.
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
- Digit grouping by language: formatNumber en-AU, units.ts group en-US.
- formatCalories (formatting.ts:9) always shows kcal, ignoring unit.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- addMenu.voice and addMenu.describeOutLoud only in es (en and fr missing).
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure; 'has a streak' check duplicated.
- Fibre VoiceOver: needs key or drop 'optional'.
- Insight type badge: unknown types show as sent.
- Insight More/Less by text layout: needs device check iOS and Android.
- Nutrition ring unit spoken as abbreviation; goals.tsx:133 speaks raw unit.
- week.tsx flat bars when every day is 0 kcal.
- InsightCard.tsx:77 uses the 120-character toggle rule.
- Insight catch blocks: getProfile .catch(() => null) hides errors; getAnomalies .catch(() => []) kept.
- addMenu.addToSlot with lowercased fallback label could read oddly.
- BrainProfileCard numbers not formatted for language.
- Profile screens hard-code English titles and eyebrows: preferences, privacy, scan-calibration, support.
- delete-account.tsx and subscription.tsx: Phase 4, parked.