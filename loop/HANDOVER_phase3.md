HANDOVER: Lume Phase 3, branch loop/phase3

ROWS (PHASE3_ROWS.md)
Built: 1 Node 22, 2 Baseline gates, 3 Header "+" on My workouts, 4 Empty states audit.
Partial:
- Row 5 (seed data): the Maestro part needs Isa.
- Row 12 (shared plumbing): every item is done and the last full checkpoint was clean (tsc 0 errors, 147 suites, 1029 tests). It waits for Isa to approve "built". Its notes cell was replaced with a one-line summary; the old history is in git.
- Row 13 (Food log): only the Food tab is done. Saved, SavedMealsList, RecipesList, calendar, detail, barcode-scan and the translations are still open.
Row 14 is the Gym empty-states row (DIFFERENT), not the Food tab.

IN PROGRESS
Row 13, the Food tab. Nothing is half-done.

WHAT ROW 13 HAS SO FAR
- AnomalyBanner takes anomalies, isError and onDismiss as props, and shows ErrorState when isError is true. food.tsx makes the only useInsights call.
- A past day with no meals shows foodLog.noMealsPastMessage instead of "add your first meal".
- On a past day, ErrorState and LoadFailedNotice use food.empty.loadFailedPast and food.loadFailedPast. One isPastDay value in food.tsx drives all three past-day choices.
- New keys are in en, es and fr.

KEY FILES
- src/app/(tabs)/food.tsx
- src/components/ai/AnomalyBanner.tsx
- src/lib/i18n/locales/en.json, es.json, fr.json
- Tests: src/__tests__/render/foodTab.emptyStates.render.test.tsx (4 tests), food.anomalyError.render.test.tsx, anomaly.render.test.tsx, phase14Regression.test.ts (its consent pin now reads food.tsx)
- EMPTY_STATES_AUDIT.md lists the state of every screen.

DECISIONS
- Row 13 stays PARTIAL even when tests pass, because most of its scope is still open.
- Status-like words in notes cells are written in lowercase.
- Isa has not confirmed the wording "Nothing was logged on this day." or "this day's food log".

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 before every command. No git, no Prettier.
- In zsh, use $? rather than PIPESTATUS. Write jest output with > file 2>&1, then tail it.
- allText in src/__tests__/render/helpers crashes on full-screen trees with a circular JSON error. Match rendered string children with findAll instead (see hasText in the Food tests).
- Tests that mount the Food tab are found with grep -rln "(tabs)/food" src/__tests__ (12 files).

UNFIXED / NEXT
- No test covers the past-day error copy. Adding one needs approval to edit tests.
- The other Food tab tests were not rerun after the last food.tsx change, so run a full checkpoint next.
- The title "No meals yet" reads oddly on a past day.
- The Food tab has no PendingSyncBanner, so offline looks like a plain error.
- The Food tab mounts useInsights with no consent gate (a pure database read, pinned in phase14Regression).
- Parked: no refetch or Retry on useInsights errors; allText crash.
- Out-of-date comments: the gymSchedule.ts and aiBrain.ts headers, and the "French intentionally partial" line in src/lib/i18n/index.ts.
- getMorningBrief and getProfile still swallow failures.
- From earlier: analytics defaults to on (Isa to confirm); seed_demo_account.go has no host guard.