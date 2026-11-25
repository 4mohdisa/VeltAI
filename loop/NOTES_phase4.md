# Lume Loop Notes: Phase 4

## Goal
Finish the app with no input from Isa. Progress = PHASE4_ROWS.md.

## Overrides from Isa (25 Nov)
1. English only at launch. Do not write, translate or review es or fr. Leave es and fr files untouched. Parity: es and fr may not miss en keys; missing keys fall back to English. No language switcher.
2. Time box about 15 rounds per row. Round 12: write leftovers under Parked. Round 15: set BUILT (PARTIAL only if core function broken), move on. Polish, wording, extra render tests, micro refactors and alias cleanups are parked.
3. Order: Row 2, finish 2b in time box, verify 2c and 2d, then rows 3 to 14b, then 15 to 30, then 31.
4. Rows 2c and 2d: verify, mark BUILT, replace placeholder rows with brief descriptions.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. Loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- BUILT: 1, 2.2, 2.5, 12, 12b, 29. Phase 3 Row 13 BUILT (R252). Phase 3 Row 15 done (R166). Phase 3 Row 6 BUILT (label R253, unconfirmed).
- Row 2 PARTIAL until Phase 3 Row 14 is BUILT.
- Row 2b DIFFERENT: plan-ready summary parked for Isa.
- Last full green checkpoint: tsc 0, 275 suites, 1,673 tests (label R253, unconfirmed). Next full suite: only at the next checkpoint round.
- Current: Phase 3 Row 14. Split: 14a gym month line (gymRange.ts) in progress (R254). 14b Retry on muscle cards and exercise progress. 14c workoutsLine and nutrition spoken kcal snapshot.

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states the branch rule and forbids other git commands.
- Lint: npx expo lint src scripts --max-warnings 0 (changed files only on normal rounds).
- No new eslint-disable. Animated values: useState(() => new Animated.Value(x)).
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoint rounds, as one command with no file list.
- A round with no Jest run is not done.
- TestPG: localhost:5432, database lume_test_local. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, or the api.ts listSessions defaults.

## Decisions (never delete)
- Isa approved (25 Nov): plan-ready summary screen; training days and gain or maintain goal in onboarding; no trial or active sub opening morning brief sees paywall; 'Sep' not 'Sept'; English grams group from 1,000 (1,234 g, for Isa to confirm).
- R123 formatDuration rounds total minutes first. R158 ConfidenceBadge uses scanCards.noBreakdown.
- R161 parity test at src/__tests__/localeParity.test.ts. R166 useGoals returns data, isLoading, error, refetch.
- R172 migration check skips with exit 0 when variable unset. R174 CI local only, no repo secret.
- R176, R178 privacy manifest in app.json; camera-only prompt. R180 parity runs in full Jest. R182 Row 29 BUILT.
- R184, R186 migration apply test runs once, in verify:migrations.
- R194 2b 1d does not wait for Isa. R195 to R205: 401 routes dispatch SESSION_ENDED.
- R199 renderScreen wrapped in AppStateProvider (approved).
- R209 to R212 onboarding keys nested; options under options.<value>.
- R225, R226 validateOnboardingPayload uses i18n. R228, R229 paywall 4xx toast uses onboarding.paywall.submitFailed except 401.
- R231, R235 CUISINE_LABEL and connectivityMessage removed.
- R233, R234 Terms disclaimer in legal.terms. R236 en-AU kept as formatNumber output.
- R240, R241 barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds still fall back to mock database.
- R243 foodDays: failure keeps dates and sets error; success clears it. R244 calendar error reuses shared error component. R245 food.tsx keeps week strip, notice above it.
- R247, R248 calendar.tsx and food.tsx read data only. R250 verify only, no alias removal.
- R251 one notice when both Food tab reads fail; food-log error takes priority.
- useLoggedDays keeps its own state (moving useHydration breaks hydrationErrorScreens.test.ts:34 and creates an import cycle). Retry label stays 'Try again'.
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169 and backend LIMIT kept. Measured 1,000 sessions: rows sent 6,000 to 1,200 exercise rows; exercises query 1.4 to 2.1 ms down to 0.3 to 0.4 ms.
- R254 picks Row 14a over 14b (smallest step; Row 14 blocks Row 2). Jev agrees.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script, park the rest.
- Prettier: leave as is. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI runs green on GitHub.
- Simulator: answers survive real Clerk expiry; signup, launch and paywall 401 routes; Total tile.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve editing src/__tests__/foodDays.test.ts and removing days and loading aliases (R249). Lines 37, 38, 40, 51, 66, 79, 90. In OWNER_CHECKS_phase4.md.
- Approve plan-ready summary screen (2b).
- Confirm Row 6 round label R253 and the simulator numbers (cold start, scroll, memory), owner check pending.

## Parked
- formatCurrency hard-codes A$ and dot decimal.
- es and fr render tests (Subscription, Gym tab, MacroTargetRows, barcode failed, calendar error, Food logged-days error).
- legalParity.test.ts scans .tsx only. authMachine.test.ts names say copy but no copy tested.
- consent.ts and purchases.ts eslint-disable for require rule. exhaustive-deps disables at appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Signup placeholders signup.tsx:339, :362 are literals. Nothing dispatches SIGNED_IN.
- Jest noise: i18next banner, devWarn, act warnings.
- Root config and backend JS not linted. verify:go has no -count=1.
- Dev only 'Simulate scan' and 'Unknown code' titles are English literals.
- R249 alias removal (see Blocked).
- Food tab: 'Try again' on the food-log notice reloads only the food log when both reads fail.
- PERF_BASELINE.md lines 34 and 41 stale (say no LIMIT and full history). Fix after checkpoint.
- Open hotspots: useHydration has no freshness window; gym/history.tsx uses .map not FlatList; backend lookups use id::text = $1 (skips primary key index, 49 queries); gym/schedule_pg.go sorts oldest first then LIMIT 30.
- Phase 3 Row 13 older text still lists saved and translation items as open; R252 records the checks.

## Problems noticed, not fixed
- English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) in fr gives '0 jour' (fr parked).
- Older backend without total_days gives undefined tile. Owner note: deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose. Users do not see which field the server rejected on 4xx.
- OWNER_CHECKS_phase4.md line 39 quotes old es wording. Append only, leave it.
- The R247 note says isLoading, but calendar.tsx reads only data.
- getMorningBrief and getProfile swallow errors (Phase 3 Parked, Row 14 step e).