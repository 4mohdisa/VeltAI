Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- Git: run at most git branch --show-current. The loop script commits.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/ or the api.ts listSessions defaults.
- Round numbers come from loop/NOTES_phase4.md. Never guess them.

Rows (PHASE4_ROWS.md)
- BUILT: 1, 2.2, 12, 12b, 29.
- Row 2 PARTIAL. Its items 2.1 to 2.5 are done, but it waits on Phase 3 Rows 6, 13 and 14 (PHASE3_ROWS.md), which are still PARTIAL.
- Row 2b DIFFERENT. The plan-ready screen is parked for Isa.

In progress: Phase 3 Row 13
- Done: barcode failed state in barcode-scan.tsx (R240) and detail.tsx (R241); error state in foodDays.ts (R243); calendar error state (R244); Food tab notice (R245); calendar.tsx reads data (R247).
- Next: R248, food.tsx reads data instead of days. Then R249, remove the days and loading aliases in src/lib/data/foodDays.ts and from both calendar test mocks.
- Also open: es and fr render tests for the calendar and Food tab error states; two notices can stack on the Food tab when both reads fail; Row 13's older text lists saved and translation items as open, which still need checking.
- Last full checkpoint: R242, with tsc 0, 272 suites and 1,661 tests passing.

Key files
- src/lib/data/{scan.ts,foodDays.ts,hooks.ts}
- src/app/food/{barcode-scan,detail,calendar}.tsx and src/app/(tabs)/food.tsx
- src/lib/formatting.ts, src/lib/units.ts
- Tests: src/__tests__/{foodDays,numberLocale,scanSeam}.test.ts and src/__tests__/render/{calendar.error,calendar.strings,food.loggedDays,barcodeScan}.render.test.tsx
- Records: PHASE3_ROWS.md, PHASE4_ROWS.md, OWNER_CHECKS_phase4.md (append only), loop/NOTES_phase4.md

Decisions
- lookupBarcodeResult returns found, notFound or failed. Dev builds still fall back to the mock database so the demo works.
- useLoggedDays keeps its own state rather than reuse useHydration. Moving useHydration breaks hydrationErrorScreens.test.ts:34, and importing it creates an import cycle.
- LoadFailedNotice keeps "Try again" (common.tryAgain), because changing it would change every screen.
- Numbers use dateLocale. English stays en-AU, so 1,000 g and up now shows a separator; this is logged for Isa.
- formatCurrency is parked.

Gotchas
- zsh does not split $var file lists. Run one test file per command.
- findAll matches a Pressable and its host view, so count with greater than 0.
- lookupBarcodeAsync is unused apart from scanSeam.test.ts:521. Removing it needs Isa's approval.
- The R247 note says isLoading, but calendar.tsx reads only data.
- Isa's open items: es and fr wording reviews, gram grouping, the plan-ready screen, the 401 simulator checks and how far the legal text is translated.