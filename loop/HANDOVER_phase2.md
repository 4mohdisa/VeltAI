Handover — Phase 2, loop/phase2 branch

This session did a mix of stale-note checks (rows 8, 18-24) across PHASE2_ROWS.md and closed real coverage gaps on row 2 (Onboarding). All edits were docs-only (notes cells, never status) except three new test files. Checkpoint confirmed clean throughout: tsc 0 errors, Jest ended at 92 suites / 893 tests / 4 snapshots, no SIGSEGV.

Rows 18 and 23 notes corrected to cite real render tests (`detailChrome.render.test.tsx` for `energy.tsx`; `FloatingHeader.reduceTransparency.render.test.tsx` as the direct test for `FloatingHeader.tsx`, on top of the existing indirect one). Rows 8, 19, 20, 21, 22, 24 checked and left unchanged — no real importing test exists for their surfaces (saved foods, insights/AI query, legal terms/privacy, the parked 7-day chart row, and the two non-UI/hardware rows).

Row 2 (Onboarding) is still PARTIAL, by design — not every part is covered yet. New real render tests added this session:
- `src/__tests__/render/paywall.render.test.tsx` — renders `src/app/onboarding/paywall.tsx` (RevenueCat mocked).
- `src/__tests__/render/paywallOnboardingPost.render.test.tsx` — presses the CTA and asserts `api.onboarding.post` fires once with the store's payload.
- `src/__tests__/render/signupReadBack.render.test.tsx` — drives a mocked Clerk SSO success and asserts `api.onboarding.get` fires once in `continueAfterAuth`.
- `src/__tests__/render/onboardingIndex.render.test.tsx` — renders `src/app/onboarding/index.tsx` (Welcome screen), checks headline text and that "Get Started" routes to `/onboarding/goal`.

Row 2's notes cell now lists exactly what's covered and what isn't: `signup.tsx`, `paywall.tsx`, `measurements.tsx`, `index.tsx` have render tests; the post/get call sites are exercised, not just rendered. Remaining gap, in progress: 8 onboarding steps still have zero render-test coverage — `goal.tsx`, `activity.tsx`, `body-type.tsx`, `dietary.tsx`, `cuisine.tsx`, `targets.tsx`, `preview.tsx`, `done.tsx`. Next recommended: `goal.tsx`, one step per round, same pattern as `measurements.render.test.tsx` (seed `useOnboardingStore` directly, `buttonWithTitle`/`allText` from `./helpers`).

Decision/pattern worth keeping: a hit only counts as "real test coverage" if it's a genuine `import ... from` that renders the component — `readFileSync`, path strings, ROUTES objects, and route-string checks (seen repeatedly in `phase14Regression.test.ts`, `summaryDetails.test.ts`, `legalParity.test.ts`, `authBilling.test.ts`) don't count, even when they look like coverage at a glance.

Gotchas not fixed: `legal/terms.tsx`, `legal/privacy.tsx`, `insights.tsx`, `ai-query.tsx`, `AnomalyBanner.tsx`/`AnomalyCard.tsx`, and food rows 4-6/8 screens all still lack real render tests — same recurring gap, different rows.