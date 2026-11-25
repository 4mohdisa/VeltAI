Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts.
- Never write "verified". Say "built" or "checked by a test".
- English only: new keys go in src/lib/i18n/locales/en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29.
- Partial: 2b, 3, 5, 6b. No row changed status this session.
- The Row 5 note in PHASE4_ROWS.md got two lines: the not-enough-data test, and a checkpoint.

Built this session
- aiQuery.notEnoughData is used in src/lib/data/aiBrain.ts. Its test is in src/__tests__/aiBrain.briefProfile.test.ts.
- settings.privacyDetails.dataTitle is now the title of the export section in src/app/profile/privacy.tsx.
- Unused keys removed from en, es and fr: aiConsent.title, body, notNow, continue and settings.privacyDetails.aiTurnOff. es and fr no longer have an aiConsent object.
- showSupportNotice: false in src/lib/i18n/index.ts stops 246 i18next notice lines.
- act() flushes added to tabbar.render.test.tsx (8 warnings removed) and preferencesCopy.render.test.tsx (6 removed).

Last full run
- tsc 0 errors. 293 of 293 suites and 1,784 of 1,784 tests pass.
- Console: 48 blocks, 101 errors, 80 warns. That run was before the preferencesCopy fix.
- Go: vet clean; 29 of 29 TestPG tests pass against lume_test_local.

In progress
- Removing act() warnings one test file at a time. Next file: src/__tests__/render/preferencesLocale.render.test.tsx (6 warnings). Add `await act(async () => {});` after renderScreen in its render function.
- Still to do after that: accountLocale 6, integrationsLocale 6, photoScan 4, confidenceBadge.noBreakdown 3, brainProfileCard.numbers 2, scanCards.strings 2.

Decisions
- The act() fixes belong in the tests. The app hooks (reduceMotion.ts, reduceTransparency.ts, useApi in src/lib/data/hooks.ts) already skip state updates after unmount.
- The flush stays inline, not in a shared helper, as instructed.
- The 72 [data], [onboarding] and [meals] warns are deliberate failure paths in tests, so they are noise. Scoped spies are not added yet.

Gotchas
- Lint ignores JSON. Check locale files with JSON.parse.
- Under zsh, an unmatched glob such as rm dir/* aborts the whole && chain.
- Prettier isn't used in this repo, and many files fail prettier --check.
- Some tasks repeat work that is already done. Check the current state first.

Open for Isa
- The gesture-handler worklet warning (21 errors, from BottomSheet) needs a device check.
- The react-test-renderer deprecation (45 errors) needs a decision on @testing-library/react-native.
- es and fr text for every English-only key.
- Consent version, and whether a consent read error should be 500 or 403.
- src/app/legal/privacy.tsx still says "Turn off AI processing".
- src/app/legal/terms.tsx:71 still describes a free tier.
- A 402 while the app is open isn't sent to the paywall. That is parked.