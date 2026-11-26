Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First run: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts.
- Never write "verified". English only: new strings go in en.json, and on ENGLISH_ONLY only if es and fr lack the key.

Rows
- Built: 1, 2, 2.2, 2c, 2d, 4, 5, 6, 12, 12b, 29. No row changed status this session.
- Partial: 2b, 3, 6b.
- Last checkpoint: tsc 0 errors; Jest 299 of 299 suites, 1,816 of 1,816 tests, 4 snapshots; 67 console.error, 165 console.warn; lint clean on the signup files.

Row 2b this session (all built, all checked by a test)
- Dead end 8: target weight required for lose or muscle goals (measurements.tsx, bodyWeightError). Recorded in both docs.
- Dead end 9: the sign-in/sign-up toggle keeps the email step and typed email. Test: signupModeSwitchKeepsEmail.render.test.tsx.
- Dead end 10: Send code errors show under the email field, not a toast. Typing or the mode toggle clears them. Test: signupClerkMessage.render.test.tsx.
- Wrong code shows under the code field (codeError). Sending a new code clears it. Test: signupWrongCode.render.test.tsx.
- clerkMessage never shows Clerk's raw text. Unmapped codes use signup.errorGeneric. The new clerkErrorCode helper is in signup.tsx.
- en.json rewritten for users: subscription.plansUnavailable, subscription.notConfiguredDev, onboarding.paywall.plansUnavailable.
- DESIGN_REFERENCES.md: dead end table rows 8 to 10, plus a Peloton Strength+ and pliability reference row from Mobbin.

In progress: nothing. The next 2b surface is open.

Decisions
- Apple, Google and other code-check errors stay as toasts, because the buttons step has no field to attach them to.
- Inline errors were Isa's decision on 26 Nov.

Open for Isa
- Close dead end 7? It is still Open in DESIGN_REFERENCES.md, though the English copy is fixed.
- Whether target weight stays required.
- Resend cooldown.
- Back to the previous step on a resumed step.
- Back to preview after sign-in.
- Consent items from earlier handovers.

Gotchas
- Test files end in .render.test.tsx. Briefs often drop ".render" or name work that is already done, so grep first.
- PHASE4_ROWS.md Row 2b is line 8. Keep 8 pipes (7 columns) and append notes as "<br>..." before the closing " |". The status stays PARTIAL.
- DESIGN_REFERENCES.md tables differ in width: the dead end table has 5 columns, the search_flows tables have 4.
- Redirect output to files; pipes hide exit codes. Never use jest -u.
- A brief once asked for git status, which the branch rule does not allow. Use find -newer against a /tmp marker file instead.
- The render setup mocks the router without dismissTo.

Not fixed
- The es and fr values of the three rewritten keys are out of date. The paywall one names RevenueCat.