Handover — Phase 2, loop/phase2 branch

This session did stale-note cleanup across PHASE2_ROWS.md rows 1, 2, 3, 4, 5, 6, 7, plus one new test. All edits were notes-cell-only except row 1; status columns untouched throughout (PARTIAL/BUILT stays as-is).

Row 1 (Sign in): added src/__tests__/signup.render.test.tsx, a real render test of src/app/onboarding/signup.tsx — mocks @clerk/clerk-expo and forces @/lib/auth/clerkEnv's isClerkEnabled() true so the real ClerkSignup branch renders (not the dev-mode stub). 4 tests: legal-link text present, Terms/Privacy press → correct router.push, primary CTA renders. expo-router is already globally mocked in src/__tests__/render/setup.ts; expo-web-browser is auto-mocked by jest-expo, so neither needed a local mock. Row 1's note now cites this file; status stays PARTIAL (live sign-in is still an owner step — E2E_EMAIL/E2E_PASSWORD unset, hosted Clerk JWKS can't run locally).

Row 2 (Onboarding): note now also credits signup.render.test.tsx for signup.tsx coverage; paywall.tsx still has no real-import test.
Row 3 (Food log tab): note now credits src/__tests__/render/foodLogRowMotion.render.test.tsx as the real render test of src/app/(tabs)/food.tsx (productionReadiness.test.ts only covers store/hydration logic, not the screen).
Row 7 (Food detail): note was empty ("—"); filled in with src/app/food/detail.tsx rendered by src/__tests__/render/foodDetailLogged.render.test.tsx.
Rows 4, 5, 6: checked, no change — no real importing test exists for src/app/food/add.tsx, quick-add.tsx, barcode-scan.tsx, label-scan.tsx, or photo-capture.tsx (only route-string/source-text checks in sheetVariant.test.ts, apiSurface.test.ts, foodDetail.test.ts, phase14Regression.test.ts, fibrePipeline.test.ts, debugCapture.test.ts).

Rule learned and applied this session: a hit only counts as "real test coverage" if it's an actual `import ... from` statement rendering/using the component — readFileSync/path-string/comment mentions don't count. Several rows' old notes conflated the two; corrected only when a genuine import was found.

In progress: nothing mid-task. Checkpoint confirmed clean: tsc 0 errors, Jest 88 suites/885 tests/4 snapshots, no SIGSEGV.

Gotchas spotted, not fixed: no render test mounts food/add.tsx, quick-add.tsx, barcode-scan.tsx, label-scan.tsx, or photo-capture.tsx directly (same gap repeated across rows 4–6); paywall.tsx likewise has no component-render test. Next recommended: row 8 stale-note check, same grep-for-real-import method.