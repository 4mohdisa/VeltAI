Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run first: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in api.ts, or src/__tests__/foodDays.test.ts.
- Never write "verified". Say "built" or "checked by a test".
- English only: new strings go in en.json, and keys es and fr lack go on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29.
- Partial: 2b, 3, 5, 6b. No row changed status this session.
- Last full run: tsc 0 errors; 292 suites and 1,778 tests pass. That was before the Settings switch and the setup.ts change.

Built this session (row 5b and 6b)
- paywallHref unit test: src/__tests__/nav.test.ts.
- Consent screen: src/app/ai-consent.tsx. acceptAiConsent in src/lib/ai/consent.ts saves the server record first.
- Ask Lume, photo capture, label scan and the 403 retry in src/lib/data/aiBrain.ts open the screen with navigate('/ai-consent').
- Insights uses replace('/ai-consent').
- ensureAiConsent and its alert are deleted.
- The 403 message is now the en.json key aiQuery.consentNeeded.
- Settings switch: src/app/profile/privacy.tsx, "Allow AI processing" with a "Given <date>" line. Off withdraws, on opens the consent screen, and consent is read again on focus.
- In progress: nothing. The Settings switch is done, but the full suite hasn't run since.

Decisions
- Copy says Google Gemini for both scans and insights, and Anthropic only as backup, because LLM_PROVIDER defaults to gemini.
- navigate() is used because typed routes don't include /ai-consent yet.
- Insights uses replace() so no blank screen is left behind.
- aiBrain.ts loads @/lib/nav only inside the 403 branch, because node Jest can't parse expo-router. An eslint.config.js entry allows that.
- The shared test mock in src/__tests__/render/setup.ts now has useFocusEffect.

Open for Isa
- Consent version 1: nothing stores a version.
- Whether the consent screen should turn analytics on. Nothing turns it on at consent now.
- The provider wording and replace on insights.
- es and fr text for every English-only key.
- src/app/legal/privacy.tsx still says "Turn off AI processing".

Gotchas
- Run the full suite next, because setup.ts affects every render test.
- Unused keys: aiConsent.title, body, notNow, continue and settings.privacyDetails.aiTurnOff. They must be removed from en, es and fr together.
- After accepting, the user has to repeat the action.
- Still hardcoded English: the not-enough-data message in aiBrain.ts and the "Your data" title in privacy.tsx.
- src/app/legal/terms.tsx:71 still describes a free tier.
- A 402 while the app is open isn't routed to the paywall. That is parked.
- Under zsh, use while read for file loops.