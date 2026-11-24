# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. The loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL (2.3 strings done; 2.4 useGoals states done; 2.5 not started). Row 29 PARTIAL.
- Row 29 so far: npm run verify = tsc, expo lint, locale parity test.
- Round 170 (current): add full Jest to verify, fix analyticsSink.ts:29 warning, full verify as checkpoint. Earlier prompt was rejected for missing the branch rule; resent with the rule.
- Last full checkpoint: round 163 (tsc 0, 257 suites, 1,507 tests). Next full checkpoint: round 180.
- Row 29 later: Go with race, migrations, manifest, secrets scan, CI workflow file.
- Order after that: 2.5 goals and unit prefs via backend (smallest change), 2.2 remaining, 2b, 3 to 14b, 15 to 30, then 31.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Rules
- Lint: npx expo lint. Verify must never pass with lint warnings.
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code. setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- Gym total days come from the database (total_days), not the capped store.
- i18n: keep import { use as addPlugin }. Locale JSON: json.dumps(indent=2, ensure_ascii=False) plus newline, after a round trip check. One full key per sentence. Plurals: _one and _other only.
- Outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Jest with --ci, one file per command, never -u.
- If a render test calls jest.resetModules, unmountAll misses trees created after the reset.
- Energy: formatEnergy(value, unit) for sentences, kcalToDisplay for bare numbers.
- Max 5 steps per prompt. Grep before editing and before asking for work.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Round 123: formatDuration rounds total minutes first.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 145: week separator uses dashboard.rangeSeparator.
- Round 146/147: Save food, gramsShort, percentValue, macroPercentFootnote added. es/fr wording pending Isa review.
- Round 150/152/156: energy unit setting (kcal/kJ); week and energy screens follow it; weekTarget merged into energyTarget.
- Round 158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed edits to tests pinning old English).
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept in en and fr, unused, for voice logging.
- Round 166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- Round 168: goals.saved kept. Removing it needs a non-allowed test edit. Parked until Isa allows it.
- Round 169: Prettier left unconfigured (parked for Isa).

## Blocked on Isa (not blocking, do not retry)
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- es and fr wording of new keys (summary.*, kJ keys, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one).
- Whether es and fr should ever be shown (app is English only, no picker).
- goals.saved removal (round 168). Prettier decision (row 29).

## Parked
- Row 2.1 simulator check of the Total tile (owner check).
- Shared billing-disabled toast helper. delete-account.tsx swallowed errors.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts hardcoded to en-AU; formatting.ts device locale.
- WeekEnergyCard reads i18n directly. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading now (renames not allowed).
- ConfidenceBadge hide reuses gymSession.hide. 'signed' helper defined three times (ConfidenceBadge.tsx, week.tsx, energy.tsx).
- Weekday and month names on Hermes unchecked. Real Skeleton needs Reanimated mock (Row 22).
- Targets card placeholder height 360 not checked on a device.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note).
- Postgres is a brew service; database setup manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Jest prints about 200 console blocks; React act warnings from ScanReviewCard; react-test-renderer deprecated. Row 22.
- Nutrition scale '418g' has no space; kept for Phase 1 look.

## Next
- Round 170: verify gains full Jest, analyticsSink warning fixed, full verify run.
- Then row 29: Go with race, migrations, manifest, secrets, CI workflow file.
- Then 2.5 goals and unit prefs via backend, 2.2 remaining, 2b, 3 to 14b, 15 to 30, then 31.