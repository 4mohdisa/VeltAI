# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git (reading .git/HEAD is allowed), Prettier or Maestro. One screen or component per prompt. Rows say built, never verified.

## State
- Before commands: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Round 187 checkpoint PASSED: tsc 0; Jest 191 suites, 1162 tests, 4 snapshots.
- This round is a checkpoint: full tsc and full npx jest --ci, no file changes. Result to record next round.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- zsh rejects grep --include. API client: src/lib/api.ts (no src/lib/data/api.ts).

## Decisions (never delete)
- Local backend and local DB only. Phase 1 design final except Phase 3 rows. Phase 4 out.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Analytics on by default, anonymous ID, Settings off switch. Isa confirms before Phase 4.
- Row 3: header plus on My workouts is the only add entry. Templates kept.
- Goals and units in memory in Phase 3.
- Failed reads: LoadFailedNotice; onRetry only if refetch exists. Empty or failed with no data: one clear action.
- Identical text reuses existing keys. src/lib/data off limits except api.ts insight catch blocks.
- Close, Go back, Back to, Done use common.close, common.goBack, common.backTo, common.done.
- French: no-break space before ':' and '?'. Curly apostrophes. es and fr plain space before %.
- Snapshots: no regeneration without Isa. Broken existing test: back out and report. Never edit an existing test to fit.
- Render tests end .render.test.tsx in src/__tests__/render/.
- New eyebrow keys sit next to title key in settings.* or profile.*.
- Visible bracket labels stay. Only spoken labels change.
- Jest mock factories reference only mock* variables.
- Row 15 copy tail deferred until after Row 10. Account note in a later docs-only round.
- One screen per prompt.
- Tests stay in src/__tests__/render/. Broken existing tests are backed out, never edited.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 7 BUILT (owner check pending: DSN, source maps).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, empty states, French muscles test.
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, insights, food, add, quick-add, detail, About, Goals eyebrow, support, privacy, scan-calibration, integrations header and eyebrow, Account (eyebrow, title, Save; Account note pending).

## In progress
- Checkpoint round (this round).
- Row 8: analytics wrapper src/lib/analytics.ts, allowlist, Settings switch, PRIVACY_DATA.md. Waiting its turn.

## Next
- Row 15 Account note in PHASE3_ROWS.md (docs only).
- Row 15: localise profile/integrations title and eyebrow.
- Row 15 tail: preferences eyebrow 'Units'; fr.json straight apostrophes; Privacy and Support body copy; Scan accuracy body; goals spoken calorie label, hard-coded g, % and comma join; Spanish 'Tus datos' for Account and Privacy eyebrows.
- Row 8: analytics.
- Row 9: Export my data (backend route plus Settings row). Needs E2E creds for heavy user check.
- Row 10: Help and feedback (screen, feedback table locally, rate limit).
- Row 11: final sweep, KNOWN_ISSUES.md, OWNER_CHECKS_phase3.md.
- Row 6 measurements parked until sign in path exists.

## Blocked on Isa (defaults used, do not re-ask)
- InsightCard 120-character rule pinned by insightCard.i18n.render. Default kept.
- Goals spoken labels: Option B (keep as is).
- Goals loading and error via useGoals, profile error path, refetch on useExerciseProgress and useGymPatterns: needs permission to change hooks.ts.
- week.tsx snapshot regeneration: needs permission.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Number grouping: formatNumber en-AU, units.ts en-US. brainProfileCard.i18n.render pins 2140.
- Wording: 'Snacks' (es, fr), 'Goals reset to defaults.', 'Fibre (optional)', weekday capitalisation, insight and banner wording, About tagline, Account Display name, Email and toasts.

## Parked (not Phase 3)
- getMorningBrief swallows errors (api.ts), pinned by aiFallback.test.ts.
- AnomalyBanner has no Retry. Banner count lacks _one.
- Jest drift: node_modules 30.0.5 vs pin 29.7.0. Fix with npm ci.
- 18 backend DB tests skipped without LUME_TEST_DATABASE_URL.
- useTemplates drops templates on refetch failure.
- Date helpers use device locale. Weekday letters, muscle names English.
- Ask Lume drops 503 message.
- backend/scripts/seed_demo_account.go has no host guard. Fix or remove in Row 11.
- Lint: gymSchedule.ts, hooks.ts. Stale headers in aiBrain.ts, gymSchedule.ts, i18n/index.ts.
- Session.tsx 'Progress saved' and alert 'Save' English.
- MacroBars unused and English. formatCalories always kcal.
- addMenu.voice and addMenu.describeOutLoud only in es. addMenu.snack.
- react-test-renderer deprecation warnings.
- Freeze offline toast claims success on failure.
- Fibre VoiceOver key. Insight type badge for unknown types.
- Nutrition ring unit spoken as abbreviation.
- week.tsx flat bars when every day is 0 kcal.
- Insight catch blocks: getProfile .catch hides errors.
- BrainProfileCard numbers not formatted for language.
- Crash reporting: no opt-out from the Privacy analytics toggle. Exception messages may carry server text via ApiError.
- npm audit warnings from the Sentry install.
- delete-account.tsx and subscription.tsx: Phase 4.
- Unit change feedback: none yet.