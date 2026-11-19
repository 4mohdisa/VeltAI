Handover — Phase 2, loop/phase2 branch

Rows now BUILT: row 1 (Sign in/sign up) and row 2 (Onboarding) — every local gap each row ever named has an executed render test, confirmed by reading the test file, not grepping; both rows carry "owner check pending" for live Clerk sign-in. Row 6 (Barcode/label/photo scan) is BUILT — barcode, label, and photo (pipeline/pipelineMulti/confirm×2/feedback/analyze) all have executed render tests, including the previously-missed `fallbackSyncScan` branch.

This session's work was audit-only: no files changed. A new task arrived claiming row 6's label part was still uncovered and row 6 was PARTIAL — both false. `src/__tests__/render/labelScan.render.test.tsx` and `src/__tests__/render/photoScan.render.test.tsx` already exist and pass (confirmed again: tsc 0 errors, 4/4 and earlier 6/6 Jest). I did not touch `PHASE2_ROWS.md` rather than write the false "photo still uncovered" line the stale brief asked for.

Files that matter for row 1: `src/app/onboarding/signup.tsx` (sendCode/verifyCode/clerkMessage/sso), and its render tests — `signup.render.test.tsx`, `signupOtp`, `signupSignInMode`, `signupClerkMessage`, `signupValidation`, `ssoSignin`, `signupReadBack` (all under `src/__tests__/render/`). Row 2: `src/app/onboarding/paywall.tsx` (`api.onboarding.post`) and `signup.tsx` (`api.onboarding.get`), tested by `paywallOnboardingPost.render.test.tsx` and `signupReadBack.render.test.tsx`. Row 6: `src/app/food/{barcode-scan,label-scan,photo-capture}.tsx` + `src/app/(tabs)/food.tsx` + `src/lib/data/scan.ts`, tested by `barcodeScan`, `labelScan`, `photoScan` render tests.

Decisions worth keeping:
- Clerk/RevenueCat/network are always mocked at the module boundary (`@/lib/api`, `@clerk/clerk-expo`); toast assertions go through `useToastStore.getState().current`, not `allText`, since ToastHost isn't in the per-screen tree.
- `jest.requireActual('@/lib/api').api?.scan` needs the `?.` — chaining two properties off a *fresh* `requireActual` call without it throws during the module's own circular self-import (api.ts → debug → store.ts → api.ts); one level of chaining is always safe, two is not.
- `startScanPoller` must be stubbed (no-op) in any test that lets `pipeline`/`pipelineMulti` resolve, or real 60s timers keep Jest alive past the run.
- When a task's brief assumes stale PHASE2_ROWS.md state, don't blindly follow it — verify against the file first and flag the mismatch instead of writing false notes.

Open gotcha, not fixed: whatever upstream process generates these task briefs is running from stale tracking state at least twice now (rows 1 and 6). Worth checking before trusting any new row's "current status" claim without re-verifying PHASE2_ROWS.md directly.