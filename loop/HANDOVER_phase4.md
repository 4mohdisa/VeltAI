Handover: Lume Phase 4, branch loop/phase4

Setup
Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first. Do not run git commands; the loop script commits.

Rows
Row 1 is BUILT. Row 2 is PARTIAL, and no new rows were built this session.
- 2.1: only the simulator check is left (OWNER_CHECKS_phase4.md).
- 2.2: done this session. TestPG count reconciled at 24 of 24, getMorningBrief and getProfile report errors through isError, subscription manage shows failures, and Manage and Restore have busy states.
- 2.3, the string round: in progress, nothing currently open.
  - Done: subscription.tsx, DailyMacroRing "of", gymRange monthSummary and monthTitle, summaryCards workoutsLine and dayReadout.
  - Left: the shared formatter fix below, then 2.4 and 2.5.

Last checkpoint
tsc 0 errors. Full Jest: 243 suites and 1,421 tests pass, 4 snapshots. Go AI and gym packages pass with -race.

Key files
- src/app/profile/subscription.tsx
- src/lib/data/aiBrain.ts and src/lib/api.ts (AI calls)
- src/lib/data/gymRange.ts and src/lib/data/summaryCards.ts
- src/lib/formatting.ts: dateLocale(lang), which formats en as en-AU
- src/lib/i18n/locales/{en,es,fr}.json (quote the glob in zsh)
- Tests: src/__tests__/aiBrain.briefProfile.test.ts, gymMonth.test.ts, summaryCards.test.ts, render/subscription.render.test.tsx, render/dailyMacroRing.i18n.render.test.tsx
- backend/tests/ai/http_test.go (TestBriefAndBrainReadErrors)

Decisions and why
- Code outside React translates with import i18n from '@/lib/i18n' and i18n.t, as formatting.ts does.
- Dates use dateLocale(i18n.language).
- A sentence gets one full key, such as dashboard.dayReadout, rather than glued fragments, so translators can reorder words.
- Reuse a key only when meaning and casing match.
- Plurals use _one and _other only, matching es and fr.
- Locale files are rewritten with json.dumps(indent=2, ensure_ascii=False) plus a newline; this round-trips them byte for byte.
- The restore busy test injects a small fake store through __setPurchasesModule. The authBilling mockPurchases helper is not exported.
- The backend already returned 500 on read errors; the swallowing was client side.

Gotchas
- Always run the full Jest suite after string changes. Round 106 broke the detailChrome macros snapshot because only the ring's own tests were run; it was fixed later.
- Lint on .json files shows 3 "File ignored" warnings, which are harmless.
- The harness is src/__tests__/helpers/useApiHarness.ts.
- Never connect to 127.0.0.1:55432 or print LUME_TEST_DATABASE_URL.

Not fixed
- monthTitle uses i18n.language instead of dateLocale. This is the recommended next task.
- formatting.ts:67 and :72 use the device locale.
- The "MTWTFSS" day letters (summaryCards.ts:45) are English only.
- The Xh Ym duration is built by hand in two places.
- No app-wide locale key parity test (Row 29).
- No es or fr render test for the subscription screen.
- delete-account.tsx has not been checked for swallowed errors.
- devWarn noise from hooks.ts:72.
- KNOWN_ISSUES.md still has Phase 3 wording in Backend.
- Open for Isa: should the morning brief's free-plan refusal count as an error?