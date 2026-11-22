HANDOVER: Lume Phase 3, branch loop/phase3

ROWS (PHASE3_ROWS.md)
- No row became BUILT this session.
- Row 14 (Gym): PARTIAL. Round 102 changed the muscles back label to common.goBack.
- Row 15 (Goals and progress): changed from DIFFERENT to PARTIAL. Notes run to round 116. There are no entries for rounds 112 and 114.
- Last full-suite checkpoint (round 114): 172 suites, 1111 tests and 4 snapshots, all passing. tsc 0 errors.

ROW 15 DONE
- training, week and energy show a LoadFailedNotice with Retry when a read fails.
- nutrition: while the first read runs with nothing stored, numbers show "—" and the meal list shows a skeleton. A failed week read shows a notice. Fibre with no logged figure shows "—".
- Summary: GymStatusCard is hidden while useDashboard is loading. The card and the index.tsx toast and labels are translated.
- EMPTY_STATES_AUDIT.md has been corrected for training, week, energy and nutrition.

IN PROGRESS
Nothing half-done.

KEY FILES
- Screens: src/app/dashboard/{training,week,nutrition}.tsx, src/app/energy.tsx (not under dashboard), src/app/(tabs)/index.tsx
- Component: src/components/domain/GymStatusCard.tsx
- Tests: src/__tests__/render/, files named dashboard{Training,Week,Nutrition}.emptyStates, energy.emptyStates, energy.render, summaryGymStatus.loading, gymStatusCard.i18n, summaryTab.i18n, detailChrome
- New keys, all under dashboard: energyLoadFailed, weekMacrosLoadFailed, gymSessionTitle, gymSessionNotLogged, gymSessionDuration, gymLoggedToast, macrosCardLabel, planCardLabel

DECISIONS
- Use the hook values that already exist (useGymRange error, useEnergyRange isError, useWeeklyMacros error, useFibreConsumed). Never edit src/lib/data.
- The energy notice shows only when both week windows fail. A partial result still shows the days that loaded.
- On nutrition, "pending" means loading with no stored meals. Stored data shows at once.
- The Summary card is hidden during every first load, the same as the streak line and Macros card.
- When a brief forbids editing a test or snapshot that the change breaks, back out or stop. Do not leave the suite red.

BLOCKED (Isa)
- Spanish and French wording for all the new keys above.
- The goals persistence decision.

GOTCHAS
- Before any command, run: source ~/.nvm/nvm.sh && nvm use 22. No git (read .git/HEAD for the branch), no Prettier, no Maestro.
- Mock Skeleton in render tests. The test environment lacks useReducedMotion.
- The Summary ScrollView refreshControl is circular. Use findAll, not allText.
- detailChrome stubs hooks with no error and does not mock useFibreConsumed.

UNFIXED
- src/components/domain/MacroBars.tsx:53 hard-codes "Not tracked · target … g" and its accessibility labels in English. This is the recommended next task.
- The French foodLog.today "Aujourd'hui" has a straight apostrophe.
- The plan card in index.tsx has a hard-coded "AI" scope.
- The EMPTY_STATES_AUDIT.md Summary loading row still calls GymStatusCard broken.
- The nutrition screen follows the Food tab's selected date (audit row 126). The week chart draws flat bars on first use (row 125).
- Row 15 still open: insights literals and swallowed errors, and goals load and error states.