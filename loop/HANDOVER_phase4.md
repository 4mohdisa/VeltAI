Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts.
- Never write "verified". Say "built" or "checked by a test".
- English only: new keys go in en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29.
- Partial: 2b, 3, 5, 6b. No row changed status this session.
- The Row 5 note has a line for each step below.

Built this session
- The act() warnings are cleared from all 8 test files. Full run: 293 of 293 suites and 1,784 of 1,784 tests pass; 66 console errors and 80 warns remain; 0 act() warnings.
- Server daily AI limit: backend/internal/aiquota/aiquota.go and migration supabase/migrations/20261126000001_ai_daily_usage.sql.
  - The count is checked before Gemini or Claude and recorded only after a successful call. The day is the UTC day.
  - LUME_AI_DAILY_LIMIT: unset is 20, 0 is off, invalid stops startup (backend/internal/config/config.go).
  - Covered: /api/scan, /api/scan/pipeline, /api/scan/label and the AI query. At the limit they return 429 with code ai_daily_limit_reached.
  - The new table is in account deletion, the data export and the delete test.
- Step 2a: src/lib/api.ts. ApiError.code exists. isTransient is false only for the daily-limit code.
- Step 2b, photo scan: scanRefused in src/lib/data/scan.ts (photo-capture.tsx navigates away before the error arrives).
- Step 2b, label scan: src/app/food/label-scan.tsx shows an info toast with the server message, then the empty review.
- Tests: tests/scan/daily_limit_test.go, tests/scan_pipeline/daily_limit_test.go, tests/config/ai_daily_limit_test.go, tests/aiquota/aiquota_pg_test.go, productionReadiness.test.ts, photoScan.render.test.tsx and labelScan.render.test.tsx.

Next
- Row 5 step 2b for the AI query screen.

Decisions
- rate_limit_counters is not reused: its sweep deletes rows older than 2 minutes.
- A plain 429 stays queueable, so a reconnect burst never drops queued offline writes.
- The brief and insights keep their fallback text at the limit, as an existing test pins.
- Fix where errors are caught, not where the task points.

Open for Isa
- Should the brief and insights return 429 at the limit?
- Is editing scan.ts instead of the photo capture screen acceptable?
- Should the label scan go back on the limit instead of opening the empty review?
- Does a plain 429 stay queueable?
- Older items: the gesture-handler worklet warning, the react-test-renderer deprecation, the [data] warn spies, es and fr text, legal/privacy.tsx "Turn off AI processing", and legal/terms.tsx:71 describing a free tier.

Gotchas
- zsh does not word-split $VAR. Use an array for Go package lists.
- PG tests need LUME_TEST_DATABASE_URL=postgres://localhost/lume_test_local. New migrations must be applied there by hand with psql.
- Background insight rebuilds count against the user's allowance.
- Parallel requests can go a few over the limit.
- Old ai_daily_usage rows are never deleted.
- The server message is English only.
- Some tasks repeat work that is already done. Check the current state first.