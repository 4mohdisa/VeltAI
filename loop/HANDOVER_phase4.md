Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Git: only git branch --show-current. The loop script commits.
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/ or the api.ts listSessions defaults.

Rows
- BUILT: 1, 12, 12b and 29.
- PARTIAL: row 2. Item 2.5 is parked.
- In progress: row 2b, status DIFFERENT. PHASE4_ROWS.md was last updated at step 1e; the step 1d screens are not recorded there yet.

Row 2b done this session
- 401 handling: signup continueAfterAuth and the paywall submit dispatch SESSION_ENDED. This ends the Clerk session, keeps the onboarding answers and opens sign-in. The launch gate already did this.
- Step 1d strings, in en, es and fr, with tests:
  - screens: goal, activity, measurements, body type, cuisine, dietary and targets;
  - shared components: the OnbScaffold back label (reuses common.goBack) and HealthDisclaimer (healthDisclaimer.text).
- Last full checkpoint: 268 suites and 1,579 tests pass. Two test suites were added after it (6 more tests).

Next up
- The preview screen, then done, then the paywall's strings.

Key files
- src/app/onboarding/*.tsx and src/components/onboarding/{OnbScaffold.tsx,cuisines.ts}.
- src/components/display/HealthDisclaimer.tsx.
- src/__tests__/render/helpers.tsx (renderScreen).
- src/lib/i18n/locales/{en,es,fr}.json.
- Tests: src/__tests__/render/onboarding*.render.test.tsx and healthDisclaimer.render.test.tsx.
- Records: PHASE4_ROWS.md, OWNER_CHECKS_phase4.md (append only), loop/NOTES_phase4.md.

Decisions and why
- renderScreen wraps every render and every tree.update in AppStateProvider. It loads the provider inside the function, because setup.ts imports helpers and a top-level import would load expo-router before a test's own mock.
- Tests that need the machine's toast mock showToast at '@/components/display/toastStore', and register a sign-out spy with registerSignOutExecutor.
- Option lists hold labelKey values with "as const satisfies", or are keyed by their own value (cuisine, dietary).
- Keys are reused only on an exact match: onboarding.measurements.continue, common.save, labelScan.totalKcal.
- Each language test resets i18n to en in afterEach. Words that are the same in every language ("Halal", French "Calories") are left out of the no-English checks.
- All es and fr wording is the agent's own translation. It is listed in each round's report for Isa.

Gotchas, not fixed
- The paywall's cuisine line still reads the English CUISINE_LABEL in cuisines.ts.
- Still hard-coded English: the paywall feature list and toasts, and the Terms disclaimer in src/app/legal/terms.tsx.
- formatNumber always uses 'en-AU'.
- Key naming is mixed: goal and activity keys are flat, the later screens are nested.
- measurements.tsx has a local t in a useState initialiser that hides t().
- onboarding.sessionExpired says "finish setting up", which is wrong for users who already completed onboarding.
- connectivityMessage is English and unused. The signup placeholders are literals.
- Nothing dispatches SIGNED_IN, so the auth machine stays in unknown.
- The simulator checks for the launch gate, signup and paywall 401 routes are open in OWNER_CHECKS_phase4.md.
- Lint the whole folder.