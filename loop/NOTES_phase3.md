# Lume Loop Notes: Phase 3

## Goal
Every PHASE3_ROWS.md row BUILT or EXACT. Branch loop/phase3 only. Agents never run git, Prettier or Maestro. One screen or component per prompt. Rows say built, never verified (Isa verifies).

## State
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. Output to /tmp, then tail.
- Full checkpoints: round 144 (tsc 0; Jest 179 suites, 1134 tests, 4 snapshots, npx jest --ci). Round 158: checkpoint again. Other rounds: changed files only.
- Jest pinned ~29.7.0, never upgrade. Maestro not installed.
- Round numbers in PHASE3_ROWS.md notes (118 to 120) may clash with loop numbers. Not fixed.
- Round 157: prompt rejected for missing loop/phase3 branch rule. Rewritten.
- Handover just happened. Next session knows only the handover summary: name files fully.

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
- Snapshots: no regeneration without Isa's permission. A broken existing test or snapshot is never edited: back out and report.
- MacroBars translation backed out (summaryNoFabrication.test.ts:54). Stays English.
- Row 125 parked after two failed attempts. Streak empty means longest streak and total sessions both 0.
- Dashboard: failed sessions use gym.loadFailed; failed energy uses dashboard.energyLoadFailed.
- Summary card and GymStatusCard hidden during first load. Accepted.
- Server text (titles, bodies, insight type) shown as sent. Weekdays mapped by weekdayLabel; unknown shown as sent.
- Render tests must end .render.test.tsx or Jest skips them.
- Unknown keys fall back with t(key, { defaultValue }), as in food/detail.tsx:677.
- Visible bracket labels such as 'Protein (g)' stay. Only spoken labels change.
- Round 155: InsightCard badge chosen over Goals states.
- Round 156: DailyMacroRing 'of' uses nutrition.ringOf (one word, en/es/fr).
- Round 158: checkpoint chosen over Jev's nutrition.tsx:227 pick. Reason: the loop note makes this round a checkpoint. Nutrition task moves to next round.

## Done
- Rows 1-4 BUILT. Row 3 and Row 5 part 1 BUILT (owner check pending).
- Row 12 PARTIAL until Isa says built.
- Row 13 PARTIAL: Food tab states, saved meals, recipes, translations, food detail.
- Row 14 PARTIAL: gym failed-read notice, calm empty states, French muscles empty test (gymMuscles.fr.render).
- Row 15 PARTIAL: dashboard, week, energy, nutrition, fibre, GymStatusCard, Summary, plan card, insights screen, BrainProfileCard, InsightCard text and type badge, AnomalyCard, AnomalyBanner (fallback title, dismiss, bannerCount), Goals eyebrow and field labels, goals reset toast (goals.resetDone), goals VoiceOver comma join, fibre spoken label, DailyMacroRing ringOf.
- Last full suite: 179 suites, 1134 tests, 4 snapshots; tsc 0.

## Blocked on Isa (defaults used, do not re-ask)
- REPEATED (rounds 157-158, do not retry): one-word ringOf vs full-phrase key with placeholders; the comma join for label and unit. Default: keep ringOf and comma join.
- REPEATED: 'Gym and food' for gym_correlation. Default: keep as written, es/fr reviewed by Isa later.
- Goals loading and error via useGoals: needs permission to change src/lib/data/hooks.ts (drops isLoading, error, refetch). Parked.
- Goals persistence: in memory.
- Wording to confirm: 'Goals reset to defaults.'; whether to delete unused goals.saved.
- Fibre spoken label 'Fibre (optional)' (round 154). Isa may change.
- Permission to make gymMuscles.shape and sheetContent.render tests read en.json: no edit.
- es.json has addMenu.voice and addMenu.describeOutLoud not in en or fr: delete or add.
- summaryNoFabrication.test.ts:54 English stays. detailChrome snapshot (row 125): chart stays.
- Permission to add refetch to useExerciseProgress and useGymPatterns: no Retry.
- Owner check pending: Food tab offline banner in simulator.
- Analytics default on vs store off: confirm before Phase 4.
- Row 5 part 2 needs E2E_EMAIL, E2E_PASSWORD and a seed sign-in path. Blocks rows 6 and 9 checks.
- Review insights.* and banner wording; es/fr weekday capitalisation: lowercase.

## Next
- Round 158 (this round): checkpoint. Full tsc and full app Jest, no file changes. Report failures.
- Then: translate the meal slot name read out at src/app/dashboard/nutrition.tsx:227.
- Then: week.tsx flat bars when every day is 0 kcal (needs a no-logged-value rule).
- Then: InsightCard more/less toggle, 120-character rule.
- Then: BrainProfileCard numbers formatted, energy unit not always kcal.
- Then: api.ts swallows insight errors (~1253, 1270).
- Then: Row 6 non-sign-in backend measurements; Rows 7, 8, 9, 10, then Row 11.

## Parked (not Phase 3)
- Goals loading and error: needs useGoals refetch (hooks.ts).
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
- Fibre VoiceOver: no accessibilityLabel; needs key or drop 'optional'.
- Insight type badge: unknown types show as sent. Add a key if backend adds a type.
- AnomalyBanner.tsx copy may be English; not opened.
- nutrition ring unit ('kcal' or 'kJ') spoken as abbreviation.
- goals.tsx hard-codes 'g' and '%' in spoken labels.