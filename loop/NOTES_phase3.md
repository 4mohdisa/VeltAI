# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 187 checkpoint PASSED: tsc 0; Jest 191 suites, 1162 tests, 4 snapshots.
- Next checkpoint: round 203 (full tsc and full npx jest --ci, no file changes).
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Read .git/HEAD for branch. zsh rejects grep --include globs.
- API client: src/lib/api.ts. No src/lib/data/api.ts.

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice, onRetry only if refetch exists. Empty or failed with no stored data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test to fit.
- Render tests end .render.test.tsx in src/__tests__/render/.
- Unknown keys: t(key, { defaultValue }). New eyebrow keys sit next to title key in settings.* or profile.*.
- Visible bracket labels stay. Only spoken labels change.
- Jest mock factories reference only mock* variables.
- mealSlotName unknown slot returns raw key. detail.tsx unknown slot falls back to foodLog.addMeal.
- InsightCard keeps 120-character rule. No empty-week guard in nutrition.tsx. Goals spoken labels default B.
- Figures stay ungrouped (2140). getAnomalies returns [] until endpoint exists.
- Spanish uses tu, French uses vous. Jev followed when strong.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, insights and cards, food, add, nutrition, quick-add, detail, About, Account (Account note not yet in PHASE3_ROWS), Goals eyebrow, support title and eyebrow.
- Integrations and preferences: notes say done, handover says not. Verify in code before changing.

## In progress
- Row 15: privacy.tsx header title and eyebrow.

## Next
- Row 15: scan-calibration titles and eyebrows.
- Row 15: fr.json straight apostrophes (Preferences, support, 'Quantites' and 'd'un coup' copy).
- Row 15: Support body copy (row labels, Send feedback, placeholder, email subject, toast).
- Row 15: Account note in PHASE3_ROWS.md.
- goals.tsx spoken calorie label, hard-coded g, % and comma join.
- Row 6 non-sign-in measurements. Rows 7, 8, 9, 10, then Row 11.
- Checkpoint at round 203.

## Blocked on Isa (defaults used, do not re-ask)
- InsightCard truncation test pins the 120-character rule. Default kept.
- Goals loading and error via useGoals, profile error path, refetch on useExerciseProgress and useGymPatterns: need permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Wording: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording, About tagline and labels, whether formatNumber follows language.

## Parked (not Phase 3)
- Account: Display name, Email, two toasts still English.
- getMorningBrief swallows errors (api.ts:1232), pinned by aiFallback.test.ts:26.
- AnomalyBanner has no Retry. Banner count lacks _one.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci.
- '[data] API unreachable' noise from hooks.ts:72.
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure.
- Date helpers use device locale. Weekday letters, muscle names English.
- Dev gym mock fallbacks. Ask Lume drops 503 message.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts 50, 52; hooks.ts ~395. Stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars unused and English. Math.round not formatNumber.
- Digit grouping: formatNumber en-AU, units.ts en-US. formatCalories always kcal.
- Row 11 dedupe: gymSession eyebrow vs foodLog.today; gymMuscles.goBack vs common.goBack; long lines in food.tsx, meals.tsx, saved.tsx.
- addMenu.voice and addMenu.describeOutLoud only in es. addMenu.snack.
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure.
- Fibre VoiceOver key. Insight type badge for unknown types.
- Insight More/Less text layout: device check iOS and Android.
- Nutrition ring unit spoken as abbreviation; goals.tsx:133.
- week.tsx flat bars when every day is 0 kcal.
- Insight catch blocks: getProfile .catch hides errors.
- BrainProfileCard numbers not formatted for language.
- delete-account.tsx and subscription.tsx: Phase 4.
- Unit change feedback: none yet.
- Privacy and scan-calibration body copy English (privacy header in progress).