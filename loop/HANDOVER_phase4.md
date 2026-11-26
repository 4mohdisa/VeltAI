Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- The only allowed git command is git branch --show-current.
- Protected files: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts. foodDetail.test.ts pins the text router.replace('/food/barcode-scan') in detail.tsx.
- English only: new keys go in src/lib/i18n/locales/en.json and the ENGLISH_ONLY list in src/__tests__/localeParity.test.ts.
- Never write "verified". Use npx jest --ci with full paths, never -u. Wrap Jest with perl -e 'alarm N; exec @ARGV'. In zsh, pass several paths through xargs; a variable holding them reaches Jest as one argument and matches nothing.

Rows
- Row 14 is built.
- Row 14a is PARTIAL: step 5 (the feedback chip on the barcode result) was never done.
- Row 14b, Fixes 1 to 4 are done, each with a Done line in DESIGN_INTENT.md:
  - Fix 1, the meal slot, on every Add path (Rounds 92 to 100).
  - Fix 2: Summary and Nutrition "Today" always read today (Round 105).
  - Fix 3: remove a set in a session (Round 106).
  - Fix 4: prefill sets from the last session (Round 107).
- PHASE4_ROWS.md was not updated this session.
- Last checks: tsc 0 errors; the targeted suites pass. The full suite was last run in Round 95: 334 suites, 2,062 tests.

Key files
- Meal slot: slotFromParam in src/lib/data/scan.ts; src/app/food/{detail,barcode-scan,label-scan,photo-capture,quick-add}.tsx; src/app/(tabs)/food.tsx (dropSlot); src/lib/food/detailSubject.ts (logs and finishDetail).
- Summary: useDailyMacros and useFibreConsumed in src/lib/data/hooks.ts.
- Gym: src/app/gym/session.tsx; lastSetsFor in src/lib/data/gymRange.ts.

Decisions
- The detail sheet can't set the Food tab's params, so the subject store counts logs and the tab clears ?slot when the count changes.
- add.tsx keeps its own check: no meal means the generic title.
- saved.tsx needs a "no meal" result, so it can't take slotFromParam as it is.
- The server stores one row per exercise, so the prefill uses the set count plus the top set's reps and weight. History is the last 90 days from useGymRange.
- Removing every set unticks the exercise, so nothing is saved for it.

Open problems, not fixed
- saved.tsx:48 repeats the inline slot check.
- label-scan.tsx:42 and food.tsx each keep their own SLOTS list.
- Prettier flags en.json; don't run --write on it.
- A Jest worker is force-exited at the end of the full run.
- Suites print console.warn noise.
- The Terms describe a free tier that does not exist (an owner check).
- Isa may want per-set gym history, which needs a backend change.

Next: Fix 5, resubscribing from Profile after sign-out (paywall.tsx:157-160, resetRegistry.ts:52). The Fix list marks it as inferred from code, so write a test that shows the failure first.