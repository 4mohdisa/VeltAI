Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current. The loop script commits.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- Take round numbers from loop/NOTES_phase4.md, which records up to R252. Never guess them.

Rows
- PHASE4_ROWS.md BUILT: 1, 2.2, 2.5, 12, 12b, 29. Row 2 is PARTIAL until Phase 3 Row 14 is BUILT. Row 2b is parked for Isa.
- PHASE3_ROWS.md: Row 13 BUILT (R252). Row 6 BUILT: the hydrateGym limit of 200 was already in place. I measured it on lume_test_local and recorded the numbers, under a label I wrote as "R253" that still needs confirming. Row 14 is PARTIAL.

Row 14 progress
- 14a month line: already translated, checked.
- 14b Retry on failed reads is done. useGymPatterns and useExerciseProgress in src/lib/data/gymSchedule.ts now pass refetch through. LoadFailedNotice gets onRetry in MuscleChart.tsx, GymPatternsCard.tsx, src/app/gym/exercise-progress.tsx and src/app/gym/muscles.tsx. New tests are in src/__tests__/render/: gymMuscleCards.retry, gymPatterns.retry, gymExerciseProgress.retry.
- 14c workoutsLine: already translated.
- Still open: the spoken meal label at src/app/dashboard/nutrition.tsx:231. It is a template that joins the slot name and calories with ", ".

Decisions
- Kept loading and isError on the gym hooks; renaming them would touch three callers.
- Two older tests that checked for no Retry now check for it: gymExerciseProgress.emptyStates and gymMuscles.render. The manager has not signed these off.
- Food tab: when both reads fail, the food-log notice wins and the logged-days notice stays hidden (food.tsx around line 494).
- LoadFailedNotice keeps the "Try again" label (common.tryAgain).

Blocked, for Isa
- R249: removing the days and loading aliases in foodDays.ts needs foodDays.test.ts edits.
- An English-only key breaks localeParity.test.ts and 13 typed tests (tsc errors). So nutrition.mealLabel, and any future en-only string, needs either es and fr edits or a change to the parity rule. I tried it and reverted.

Gotchas
- The locale files are in src/lib/i18n/locales/. The nutrition screen is src/app/dashboard/nutrition.tsx, not under (tabs).
- zsh does not split $var file lists, so run one Jest file per command.
- findAll matches a Pressable and its host view, so check counts with greater than 0.
- The only snapshot file is src/__tests__/render/__snapshots__/detailChrome.render.test.tsx.snap.

Not fixed
- PERF_BASELINE.md lines 34 and 41 still describe the gym read as unbounded, which is out of date.
- Duplicate keys: gym.monthSessions and gym.monthFreezes vs gymCount.sessions and gymCount.freezes.
- When both Food tab reads fail, the food-log Retry reloads only the food log.
- The loop notes checkpoint still says R242. The latest full run passed 275 suites and 1,673 tests, but that was before R257 to R260.
- Next: the R265 checkpoint, then Isa's decision on the parity rule.