Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the api.ts listSessions defaults or src/__tests__/foodDays.test.ts.
- English only. Never write "verified".

Rows
- No status changed this session. Built: 1, 2, 2.2, 2c, 2d, 4, 12, 12b and 29. Row 3 is partial.
- The row 2 notes cell is now one line. It points the Row 14 simulator flow to row 23 (Maestro, DIFFERENT, not run).
- Phase 3 rows 6, 13, 14 and 15 are all BUILT.

Built this session (exhaustive-deps cleanup, no behaviour change)
- src/components/gym/ParameterForm.tsx: a single [params] effect sends the params to the parent. The setState updaters no longer have side effects, and the redundant paramsKey is gone. New test: src/__tests__/render/parameterForm.params.render.test.tsx.
- src/components/navigation/BottomSheet.tsx: the dependency list now includes mounted and the shared values.
- src/components/gym/TodayCard.tsx: the focus callback depends on revalidate, which is stable (useApi wraps it in useCallback with an empty dependency list, gymSchedule.ts:93).
- src/components/food/scan/ScanReviewCard.tsx: namesKey is JSON of the names, and the effect parses the names from the key.
- src/lib/data/energy.ts: the fetchers are now module-level (fetchBalance, fetchWeek), and useApi takes (fetcher, key).
- src/app/onboarding/measurements.tsx: the Continue handler and the age, height and weight error checks reuse typedAge, draftAge, draftHeightCm, draftWeightKg and draftTargetKg.
- Last full checkpoint: tsc 0 errors; Jest 283 suites and 1,706 tests pass; 4 snapshots pass.

In progress
- Nothing open.

Decisions
- src/lib/auth/appState.tsx:119 was left as is. Changing the dependency from effectsKey to snap.effects would make repeated identical batches run (for example, two idle returns each giving ['revalidateSession']), which is a behaviour change. The recommendation is yes, with one render test. This needs Isa's answer; there is no line for it in OWNER_CHECKS_phase4.md yet.
- Disables to keep: the immutability ones in SliderField.tsx:68 and BottomSheet.tsx:95, 103 and 134, plus gymSchedule.ts:78 and debug/impl/index.tsx:99.

Gotchas, not fixed
- The loop keeps sending tasks for disables that are already removed (4 times). The task list should say only appState.tsx:119 remains.
- The ParameterForm preview re-runs when params come out the same. This was true before the session too.
- measurements.tsx:118, in changeHeightUnit, still calls heightToCm().
- No test covers the BottomSheet lifecycle, or that a weight-only change in ScanReviewCard does not refetch.
- energy.ts and gymSchedule.ts each have their own private useApi.
- The Row 14 note in PHASE3_ROWS.md is over 17,000 characters.
- Open for Isa from before: the gym.monthSessions and gym.monthFreezes rename, the app-wide "Try again" label, the Apple owner steps, R249, and the two Retry tests that haven't been signed off.
- Jest output is noisy with "API unreachable" warnings, which are not failures.