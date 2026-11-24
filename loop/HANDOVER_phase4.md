Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Git: run at most git branch --show-current, and nothing else. The loop script commits.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/ or the api.ts listSessions defaults.

Rows
- BUILT: 1, 12, 12b and 29.
- PARTIAL: row 2. Item 2.5 is parked.
- In progress: row 2b, status DIFFERENT. All its step 1d strings are done (en, es, fr, with tests): every onboarding screen, preview, done, paywall, the validation messages and sessionExpired. The 401 handling and the R231 CUISINE_LABEL cleanup are also done.
- Next: row 2c. Isa's 25 Nov work has not been identified yet.
- Last full checkpoint (R230): tsc 0, 270 suites and 1,637 tests pass. Lint was last clean at R231.

Next task
- The paywall 4xx toast shows the server's own English message (src/app/onboarding/paywall.tsx, lines 101 to 106). Map it to translated copy and add a test.

Key files
- src/app/onboarding/*.tsx, src/components/onboarding/{OnbScaffold.tsx,cuisines.ts}.
- src/lib/stores/onboarding.ts holds validateOnboardingPayload, which uses i18n.t.
- src/lib/auth/{appState.tsx,machine.ts,resetRegistry.ts}.
- src/lib/i18n/locales/{en,es,fr}.json.
- Tests: src/__tests__/render/onboarding*.render.test.tsx, paywall*.render.test.tsx and src/__tests__/onboardingValidation.test.ts.
- Records: PHASE4_ROWS.md, OWNER_CHECKS_phase4.md (append only) and loop/NOTES_phase4.md (holds the loop's real round numbers).

Decisions and why
- Done runs after the paywall: the paywall calls markCompleted(), then opens done, which hands off to the tabs after 750 ms. A plan-ready summary screen would be a new route, so it waits for Isa's go-ahead.
- markCompleted() only sets completed. The answers are cleared on sign-out, in resetRegistry.ts.
- Keys are reused only on an exact text match, for example subscription.welcomePro and profile.storeUnreachable.
- In es and fr the paywall cuisine line reads "label: list", because the cuisine labels mix grammatical forms.
- Language tests reset i18n to en in afterEach. Every es and fr string is the agent's own wording and is listed in OWNER_CHECKS_phase4.md.
- Round numbers in the records come from loop/NOTES_phase4.md, never guessed.

Gotchas, not fixed
- Line 39 of OWNER_CHECKS_phase4.md quotes the old es sessionExpired wording. It can't be edited, because the file is append only.
- English is still hard-coded in two places: the Terms disclaimer in src/app/legal/terms.tsx, and connectivityMessage in src/lib/auth/machine.ts, which is also unused.
- formatNumber (src/lib/formatting.ts) and src/lib/units.ts:76 always use 'en-AU'.
- The signup placeholders are literals, but they may be the same in every language.
- Nothing dispatches SIGNED_IN, so the auth machine stays in unknown.
- Many passing tests print console noise.
- Lint the whole folder.
- consent.ts and purchases.ts use eslint-disable for the require rule.
- For Isa: the open 401 simulator checks, all es and fr wording reviews, and the go-ahead for the plan-ready screen.