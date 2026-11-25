Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- English only. Never write "verified".
- For TestPG, set LUME_TEST_DATABASE_URL for one command only, pointing at lume_test_local on localhost:5432 with user $(whoami) and no password. Never print it.

Rows
- No PHASE4_ROWS.md row changed this session; all the work was cleanup. Built rows are still 1, 2, 2.2, 2c, 2d, 4, 12, 12b and 29. Row 3 is partial. I did not re-read PHASE4_ROWS.md this session.

Built this session
- src/app/(tabs)/food.tsx: added reloadBoth(). Every Retry and pull-to-refresh reloads both the food log and the logged days. The empty-list ErrorState now uses retryLabel={t('common.tryAgain')}.
- src/lib/billing/subscriptionLinks.ts: added isManageSubscriptionAvailable(). Both profile/delete-account.tsx and profile/subscription.tsx call it, and no inline Platform.OS checks are left there.
- New test: src/__tests__/render/subscriptionLinks.render.test.tsx. It is a render test because the node Jest project can't load react-native.
- Deleted the duplicate gymCount block from en, es and fr. Callers now use gym.monthSessions and gym.monthFreezes.
- Removed the redundant openURL.mockRestore() in settingsDeleteAccount.render.test.tsx.
- Removed eslint-disables in:
  - gym.tsx: revalidate is already stable, so it is now in the dependency list.
  - onboarding/measurements.tsx: the saved values are computed in render, so the dependency list is complete. A new test covers it.
- Last full checkpoint: tsc 0 errors; Jest 282 suites and 1,704 tests pass; all Go gates pass, with 26 of 26 TestPG tests run against the local test database. The measurements test (13 tests) was added after that checkpoint.

In progress
- Nothing open.

Decisions
- The shared ErrorState default stays "Retry", because changing it affects 13 screens.
- No allTimeSessionCount function: the count is server data (streak.totalGymDays), so a wrapper would add nothing.

Open for Isa
- Rename gym.monthSessions and gym.monthFreezes to neutral names, with key-only moves in es and fr?
- Change the app-wide ErrorState label to "Try again"?
- The seven Apple owner steps, the native Apple sheet, Android hiding for Apple sign-in, R249, and the two Retry tests that haven't been signed off.

Gotchas, not fixed
- consent.ts and purchases.ts have no eslint-disable; those tasks were aimed at the wrong files.
- exhaustive-deps disables remain in:
  - src/components/gym/ParameterForm.tsx:141 (next)
  - src/components/navigation/BottomSheet.tsx:88
  - src/components/gym/TodayCard.tsx:237
  - src/components/food/scan/ScanReviewCard.tsx:118
  - src/lib/auth/appState.tsx:119
  - src/lib/data/energy.ts:37
- Deliberate disables, keep: the Reanimated immutability ones, gymSchedule.ts:78 and debug/impl.
- The Continue handler in measurements.tsx still recomputes heightToCm() and toKg().
- OWNER_CHECKS_phase4.md has a parity line that still reads as open. The file is append-only.
- seedChildRows depends on the exercise_library seed.
- Jest output is noisy with "API unreachable" warnings, which are not failures.
- zsh does not split $VAR into words; use arrays or ${=var}.