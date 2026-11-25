Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts or src/__tests__/foodDays.test.ts.
- Never write "verified". Say "built" or "checked by a test".
- English only: new keys go in src/lib/i18n/locales/en.json (src/locales does not exist) and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 5 (new this session, owner check pending), 6 (owner check pending), 12, 12b, 29.
- Partial: 2b, 3, 6b.
- Last checkpoint: tsc 0 errors; Jest 295 of 295 suites, 1,795 of 1,795 tests; 67 console.error, 163 console.warn; go test -race ./... all ok.

Built this session (Row 5)
- Ask Lume daily limit. useAIQuery in src/lib/data/aiBrain.ts shows an info toast with the server message and returns null on 429 ai_daily_limit_reached. src/app/ai-query.tsx puts the question back in the input. Tests: aiQueryDailyLimit.render.test.tsx and aiBrain.briefProfile.test.ts.
- Consent screen, the existing src/app/ai-consent.tsx. Allow and Not now have equal weight. Allow saves and goes back. A failed save shows ErrorState with Try again. The aiConsent.screen.done key is removed. Tests: render/aiConsentScreen.render.test.tsx and aiConsent.test.ts.
- Shared consent gate: backend/internal/consent/gate.go (consent.Require), used by the ai and scan routes. scan.ConsentStore is an alias of consent.Reader. Test: gate_test.go.
- Postgres test for the withdraw route: backend/tests/ai/consent_pg_test.go.

In progress
- Row 6b step (f), "stale strings". The row names no strings. loop/DECISIONS_LOG.md says step (f) is the es and fr text, deferred by Isa. This waits for Isa.

Decisions
- The limit toast lives in the hook, not the screen, because the hook catches the error.
- I extended existing files instead of creating duplicate screens or helpers at the paths the briefs named.
- A plain 429 stays queueable.
- A consent read error stays 500.

Open for Isa (in OWNER_CHECKS_phase4.md)
- The "Who receives it" wording. Current text: Gemini for scans and insights; Anthropic only if the backup provider is on.
- Whether to add a consent version. None is stored; ai_consent_at holds only the date.
- Whether a consent read error should be 500 or 403.
- Which strings row 6b step (f) means.
- Some Row 5 owner-check lines are duplicates, because the file is append-only.

Gotchas
- PG tests need LUME_TEST_DATABASE_URL=postgres://localhost/lume_test_local on that one command. Without it they skip.
- zsh does not word-split variables. Use arrays for Go package lists.
- Each test that mounts a hook through the harness prints one react-test-renderer deprecation console.error, so the count grows with each new hook test.
- Briefs often repeat work that is already done. Check the current state first.
- ai.Store still declares its own AIConsentAt method instead of embedding consent.Reader. This is harmless.