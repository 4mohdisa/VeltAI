Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts.
- Never write "verified". New strings go in src/lib/i18n/locales/en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 5, 6, 12, 12b, 29.
- Partial: 2b, 3, 6b.
- Last full checkpoint: tsc 0 errors; Jest 296 of 296 suites, 1,804 of 1,804 tests; 67 console.error, 165 console.warn. That was before dead end 8, which added 1 suite and 6 tests.

Row 2b this session
- Dead ends 1 to 8 from the audit in DESIGN_REFERENCES.md are now built:
  1. Welcome has a Sign in link: src/app/onboarding/index.tsx
  2. The signup title follows the mode: src/app/onboarding/signup.tsx
  3. Resend code: signup.tsx
  4. Back with no history goes to ONBOARDING_ROOT: src/components/onboarding/OnbScaffold.tsx
  5. Back from measurements dismisses to preview, and Clerk session_exists continues the flow: measurements.tsx, signup.tsx
  6. A 401 on the subscription check or the final save ends the session: paywall.tsx, endExpiredSession
  7. Likely already fixed (see open items)
  8. Target weight validation: measurements.tsx, bodyWeightError
- Tests are in src/__tests__/render/: welcome, signupSignInMode, signupResend, onboardingScaffold, onboardingSignedInBack, paywallSessionExpired, paywallOnboardingPost, onboardingMeasurementsTargetWeight. screenTitle is shared in src/__tests__/render/helpers.tsx.
- In progress: dead end 8 is not yet recorded. Add one line to the Row 2b notes cell in PHASE4_ROWS.md and mark row 8 built in the DESIGN_REFERENCES.md dead end table.

Decisions
- Continue is never disabled on measurements. Invalid input blocks the press and shows inline errors, as an earlier audit decided.
- Target weight is required when shown (goal lose or muscle) and reuses the 30 to 300 kg band. The brief asked for this. The server treats it as optional, up to 1000.
- There is no shared step-order list, so back on a resumed step goes to Welcome, not the previous step.
- Clerk's useAuth was avoided in signup.tsx because 12 test mocks lack it. Handling session_exists was used instead.

Open for Isa
- Whether target weight stays required.
- Resend cooldown.
- Previous-step back on a resumed step.
- Back to preview after sign-in.
- Whether dead end 7 is closed: onboarding.paywall.plansUnavailable is now written for users; subscription.plansUnavailable is still technical.
- From the earlier handover: consent version, consent read error 500 or 403, "Who receives it" wording, Row 6b step (f) strings.

Gotchas
- PHASE4_ROWS.md rows must keep 7 columns. Append notes with <br> before the closing " |".
- zsh: --include=*.ts globs fail. Use plain grep -rn and filter.
- Lint exit codes are hidden by pipes. Redirect lint output to a file instead.
- Briefs often name work that is already done, or files that don't exist (welcome.tsx). Grep first.
- The render setup mocks the router without dismissTo. Tests that need it mock expo-router locally.
- PG tests need LUME_TEST_DATABASE_URL on that one command only, and never printed.