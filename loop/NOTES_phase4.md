# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. Loop script commits.
- Prompts must restate the branch rule.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL (2.3 and 2.4 done, 2.5 not started). Row 12 PARTIAL (12a done in app.json, pending full checkpoint). Row 29 PARTIAL.
- Row 29 verify chain: tsc, lint --max-warnings 0, full Jest --ci, verify:go (race), verify:migrations (skips unless LUME_TEST_DATABASE_URL set), secrets:scan. Still missing: manifest check (Row 12b).
- CI workflow: .github/workflows/verify.yml, local only, never run on GitHub.
- Last full checkpoint: round 177 (this round). Next full checkpoint: round 180.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Order
Row 12a check (round 177) -> Row 12b -> 2.5 goals and unit prefs via backend -> 2.2 remaining -> 2b -> 3 to 14b -> 15 to 30 -> 31.

## Rules
- Lint: npx expo lint. Verify never passes with warnings.
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code. setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- Gym total days from the database (total_days), not the capped store.
- i18n: keep import { use as addPlugin }. Locale JSON: json.dumps(indent=2, ensure_ascii=False) plus newline, after round trip check. One full key per sentence. Plurals _one and _other only.
- Outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Jest --ci, one file per command, never -u.
- If a render test calls jest.resetModules, unmountAll misses trees created after reset.
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
- Round 177: checkpoint chosen over 12b (Jev 97%). Loop flagged 12a as partly done; a full run is needed before a check script is built on it.
- Round 176: privacy manifest in app.json (ios.privacyManifests), not ios/PrivacyInfo.xcprivacy, because /ios is git ignored prebuild output. Face ID and Motion prompts removed (not used). Camera is the only prompt; es and fr camera text added.
- Round 175: round 174 verified by tsc, go vet, migration test, parity test and lint on changed files.
- Round 174: CI workflow local only, throwaway local Postgres service, no repository secret. Shim SQL moved to backend/tests/migrations/supabase_shims.sql.
- Round 173: secrets scan runs before manifest check.
- Round 172: migration check skips with exit 0 when variable unset.
- Round 170: analyticsSink warning cleared by scoped config allow.
- Round 168: goals.saved kept; removal needs a non-allowed test edit. Parked.
- Round 169: Prettier unconfigured (parked for Isa).
- Round 166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept, unused, for voice logging.
- Round 158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed).
- Rounds 150/152/156: kcal/kJ setting; weekTarget merged into energyTarget.
- Rounds 146/147: Save food, gramsShort, percentValue, macroPercentFootnote added. es/fr pending Isa.
- Round 145: week separator uses dashboard.rangeSeparator.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 123: formatDuration rounds total minutes first.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- es and fr wording of new keys (summary.*, kJ keys, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one).
- Whether es and fr should ever be shown (app is English only).
- goals.saved removal. Prettier. Scoped eslint allow confirmation.
- App Store privacy label answers and account data declaration (OWNER_CHECKS_phase4.md).
- Camera string choice: plugin text vs es/fr strings in src/lib/i18n/infoPlist.

## Parked
- Row 2.1 simulator check of Total tile (owner check).
- Shared billing-disabled toast helper. delete-account.tsx swallows errors.
- consent.ts:52, purchases.ts:63 and :173 use eslint-disable for require rule; move to scoped allow.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts hardcoded to en-AU; formatting.ts uses device locale.
- WeekEnergyCard reads i18n directly. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading (renames not allowed).
- ConfidenceBadge hide reuses gymSession.hide. 'signed' helper defined three times (ConfidenceBadge.tsx, week.tsx, energy.tsx).
- Several screens have react-hooks/exhaustive-deps disable comments (Row 22).
- Skeleton crashes under Reanimated test mock; every screen test mocks it (Row 22).
- Weekday and month names on Hermes unchecked. Targets card height 360 not checked on device.
- Migration apply test runs twice in CI (verify:go and verify:migrations).
- Commented setup in days_pg_test.go and similar TestPG files repeats shim SQL; point at supabase_shims.sql.

## Problems noticed, not fixed
- Local ios/Lume/PrivacyInfo.xcprivacy and Info.plist are stale until next npx expo prebuild (Face ID, Motion, no data types). Do not edit ios/.
- Two camera strings with different wording; plugin text wins.
- fr privacy copy uses 'vos', matching existing fr copy.
- productName.test.ts failed once during Row 12a and passed after restore. Round 177 checkpoint to confirm.
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- Postgres is a brew service; database setup manual. Rows 17 and 26 should script it.
- days_pg_test.go setup comment shows socket URL, which the guard refuses.
- Phase 2 iOS notes say backend returns 401 without Clerk token. Probably stale. Check in Row 16.
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Jest prints about 200 console blocks; act warnings from ScanReviewCard; react-test-renderer deprecated. Row 22.
- Nutrition scale '418g' has no space; kept for Phase 1 look.
- Secrets scan placeholder check is a heuristic.

## Next
- Round 177 (this round): checkpoint. tsc and full Jest --ci, no file changes. Report failures and the Row 12a state.
- Round 178: fix any round 177 failures first. Then Row 12b manifest and plist check script, wired into verify.
- Then 2.5 goals and unit prefs via backend, 2.2 remaining, 2b, 3 to 14b, 15 to 30, then 31.
- Full checkpoint at round 180.