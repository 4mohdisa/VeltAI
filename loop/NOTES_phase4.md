# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. The loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL. Rows 2c and 2d (commit e0c184d) DIFFERENT; verify later.
- Checkpoint round 148: tsc 0 errors, Jest 252 suites, 1,492 tests, all pass. Recheck at next checkpoint.
- 2.1: only the simulator check of the Total tile is left (owner check).
- 2.2 left: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
- 2.3 (strings), one screen or component per prompt. ConfidenceBadge sentence translated (round 158). Render test for its 'Why?' panel is open (round 159).
- Then: signed helper merge (one screen per round); i18n header comments; summaryCards MTWTFSS fallback; nutrition.tsx hardcoded 'g'; 2.3 row notes backfill.
- Then 2.4 useGoals (Row 15), 2.5 rest of Phase 3 leftovers.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Rules
- Lint: npx expo lint. Plain eslint at root is noisy.
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code.
- setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- Gym total days come from the database (total_days), not the capped store.
- i18n: keep import { use as addPlugin }. Locale files: json.dumps(indent=2, ensure_ascii=False) plus newline; check round trip first.
- One full i18n key per sentence. Plurals: _one and _other only.
- Code outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Run jest with --ci, one file per command.
- If a render test calls jest.resetModules, shared unmountAll misses trees created after the reset.
- Day letters: calendar.weekdayLetters (Monday first). weekdayShort = full name (VoiceOver). weekdayLetter = axis letters.
- Energy: formatEnergy(value, unit) for sentences, kcalToDisplay for bare numbers.
- Full suite on checkpoint rounds and after any change that can alter snapshots or strings.
- One screen or component per prompt. Max 5 steps per prompt. Every prompt names the loop/phase4 branch rule.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Round 146: Save food. es 'Guardar alimento', fr 'Enregistrer l'aliment' pending Isa review.
- Round 147: nutrition.gramsShort, percentValue, macroPercentFootnote added. es/fr '80 %' spacing pending review.
- Round 123: formatDuration rounds total minutes first.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 145: week separator uses dashboard.rangeSeparator.
- Round 149: meal row moved to nutrition.mealLine.
- Round 150: energy unit setting (kcal/kJ) via unitDeficit, unitSurplus, unitEaten, energyTarget.
- Round 152: week.tsx follows energy unit.
- Round 156: weekTarget merged into energyTarget.
- Round 158: ConfidenceBadge translated as scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed edits to tests pinning old English).
- Round 159: render test for the badge 'Why?' panel in en, es, fr; fr apostrophe made curly to match the other fr strings.

## Blocked on Isa (not blocking)
- E2E account needs 250+ gym dates.
- Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr ('1 h 45 min').
- es and fr wording of new keys (summary.*, energy kcal/kJ keys, energyTarget, percentValue, mealLine, noBreakdown, {{unit}} feminine agreement, Save food).
- weekdayShort stays a full name.
- Week range separator ' – ' in es and fr, or 'al' / 'au'.
- Do not retry these.

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts group hardcoded to en-AU; formatting.ts:67 and :72 use device locale.
- WeekEnergyCard reads i18n directly, not useTranslation.
- es and fr 'per day' wording differs between Summary and week detail.
- Weekday and month names on Hermes not checked on the simulator.
- nutrition.tsx:231 meal row label builds 'slot, energy' in code.
- Week range ' – ' separator in week.tsx:150 not translated.
- kcalEatenPerDay and kcalNetPerDay names misleading now they show kJ too.
- Signed helper duplicated in week.tsx, energy.tsx and ConfidenceBadge.tsx (badge uses a true minus sign).
- ConfidenceBadge hide button reuses gymSession.hide from another section.

## Next
- Round 159: render test for noBreakdown (current).
- Then: signed helper merge, i18n header comments, summaryCards fallback, nutrition 'g' label, 2.3 notes backfill.
- Then 2.4 (useGoals), 2.5 (rest of Parked; goals and unit prefs persisted; missing _one plural; goals.saved).
- Then Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour' (correct French, differs from en).
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service; database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- No app-wide en/es/fr key parity test yet (Row 29).
- src/lib/i18n/index.ts comment says French is 'intentionally partial'.
- React act warnings from ScanReviewCard; devWarn from hooks.ts:72. Row 22.
- react-test-renderer is deprecated. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed. Row 22.
- Plain npx eslint at root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- Prettier has no repo config. Decide in Row 29.
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round.
- Nothing tests refetch in useWeeklyMacros.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Successful restore from not-entitled shows 'No purchases to restore.' toast: untested.
- Jest prints about 200 console blocks. Row 22.
- MacroTargetRows has no es or fr render test.
- Round 147 footnote repeats the four macro names. Rename both places if one changes.
- nutrition.axisLetters and nutritionUnits still cast their mock meal. Fix when touched.
- The energy screen always says kcal and ignores the unit setting until the signed helper merge.
- The es and fr feminine endings of {{unit}} do not agree with 'kJ' in kJ mode.
- formatNumber and units.ts group are hardcoded to en-AU (see Parked).
- The latest handover summary and report were partly done; the loop check flagged it. Closed in round 159.