Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- The only allowed git command is git branch --show-current.
- Protected files: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, src/__tests__/foodDetail... no: src/__tests__/foodDays.test.ts.
- English only: en.json plus ENGLISH_ONLY in localeParity.test.ts. Never write "verified". Use npx jest --ci with full paths, never -u.
- macOS has no timeout command; wrap Jest in perl -e 'alarm N; exec @ARGV'.
- Last full run (Round 80): tsc 0 errors; Jest 325 of 325 suites, 2,018 tests.

Rows
- Built: Row 14. Legal screens and terms read from en.json; the paywall shows subscription terms under onboarding.paywall.terms.
- Row 14a (PARTIAL): steps 1 to 4 done. Step 5 is next: wire the chip into the barcode result with the sheet and a feature_rated event carrying only the feature key and rating.
- Row 14b (DIFFERENT): DESIGN_INTENT.md has the audit and the Fix list. Fix 1 is done for Search, the barcode scanner and the barcode detail sheet.

Key files
- Feedback: src/lib/feedback/features.ts, throttle.ts and promptStore.ts; src/components/feedback/FeatureFeedbackChip.tsx. recordLaunch is called from src/app/_layout.tsx.
- Meal slot: slotFromParam in src/lib/data/scan.ts; the slot field in src/lib/food/detailSubject.ts; src/app/(tabs)/food.tsx; src/app/food/barcode-scan.tsx; src/app/food/detail.tsx.
- Docs: DESIGN_INTENT.md, DESIGN_REFERENCES.md (Row 14b Mobbin section), OWNER_CHECKS_phase4.md (Post launch UI).

Decisions
- The meal reaches the detail sheet through the subject store, never a route param. foodDetail.test.ts forbids params on /food/detail as a privacy guard.
- Clearing the Food tab search drops ?slot so it does not linger into later searches.
- The throttle module never reads the clock; callers pass now.
- The launch counter uses a module-level flag.

Gotchas, not fixed
- "Scan again" (detail.tsx:235) drops the meal.
- "Photograph label" drops the meal; label-scan.tsx:74 uses slotForNow.
- A detail-sheet log does not clear ?slot.
- quick-add, add and saved repeat the inline slot check.
- food.tsx keeps a duplicate SLOTS list.
- Mocking Clerk avoids a MessagePort that stops Jest exiting.
- SafeAreaProvider hides children without initialMetrics.
- The full suite logs 164 console.warn lines.
- The Terms describe a free tier that does not exist (owner check).
- loop/HANDOVER_phase4.md still mentions two push token test files.
- The Fix list has 27 more SMALL items; items 2 to 5 are the highest value.