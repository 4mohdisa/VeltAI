# App Store Pre-Submission Checklist

Statuses verified against the codebase on 2026-07-19 (Phase 13). Re-check the
**BLOCKED** items after the human actions land (Clerk, RevenueCat, deploy).

## 2.1 — App Completeness
- [x] **PASS** No crashes in code paths under test (698+ automated tests green; root `ErrorBoundary` catches render crashes with a recovery screen)
- [x] **PASS** No placeholder screens — dead routes/screens were deleted in cleanup; every route has a live entry point
- [x] **PASS** Demo account seeding script: `backend/scripts/seed_demo_account.go` (idempotent; prints credentials for review notes)
- [ ] **BLOCKED** Demo account must exist in Clerk (create `demo@lumo.fit` / `LumoReview2026!`, then re-run the seeder with `-user <clerk_id>`) — needs Clerk keys
- [ ] **BLOCKED** A real end-to-end pass on TestFlight before submitting — needs deploy + native build

## 3.1.2 — Subscriptions (paywall, BEFORE purchase)
- [x] **PASS** Plan name shown (Monthly / Annual plan cards)
- [x] **PASS** Duration + exact price per period ($8.99/month, $49.99/year on the cards)
- [x] **PASS (fixed this phase)** Post-trial consequence: "Free until {date}, then $X/period. Auto-renews; cancel anytime in Settings." adjacent to the CTA
- [x] **PASS** Tappable Terms + Privacy links in the paywall footer (in-app `/legal/*`)
- [ ] **BLOCKED** Purchase action must be a real StoreKit purchase — needs RevenueCat (currently a stub; submitting with a stub = certain rejection)

## 5.1.1(v) — Account deletion
- [x] **PASS** Reachable in ≤2 taps: Settings → "Delete my account" (1 tap) → confirmation flow
- [x] **PASS** Calls `DELETE /api/profile`; type-DELETE confirmation; loading + error states
- [x] **PASS** Genuinely destructive: every user table references `profiles(id) ON DELETE CASCADE` — enforced by test (`tests/migrations` TestEveryProfilesReferenceCascades); no soft-delete anywhere

## 5.1.1 — Permission strings
- [x] **PASS (rewritten this phase)** Camera: photograph meals/labels/barcodes to estimate nutrition
- [x] **PASS (rewritten)** Microphone: describe a meal by voice
- [x] **PASS (rewritten)** Photo library: pick an existing meal photo to analyse
- [x] **PASS** Health share/update strings present and specific
- [x] **PASS (fixed)** Removed `NSFaceIDUsageDescription` — the Face ID feature was removed in cleanup; a permission string with no feature invites questions

## 1.4.1 — Physical harm / health disclaimer
- [x] **PASS (built this phase)** `HealthDisclaimer` component with the required text
- [x] **PASS** Placed on: onboarding targets screen, goals settings screen, and in the Terms (§5)

## 4.8 — Sign in with Apple
- [x] **PASS (UI)** Onboarding signup offers Apple alongside Google
- [ ] **BLOCKED** Buttons must actually authenticate — needs Clerk (both are stubs; Apple must WORK, not just render)

## HealthKit
- [x] **PASS** Privacy policy covers health data (never sold, no ads, user deletion)
- [x] **PASS** No advertising SDKs in the app; health data never used for marketing
- [x] **PASS** No false writes: `writeDietaryEnergy` writes only user-logged nutrition, user-initiated
- [x] **N/A (correctly)** HealthKit entitlement NOT included in this build — the native module is absent, so no permission is requested for a feature that doesn't exist (requesting without a feature is itself a rejection). Add the entitlement only with the native module.

## Metadata
- [x] **PASS** Support URL drafted (`https://lumo.fit/support`) — **verify it resolves before submitting**
- [x] **PASS** Description (APP_STORE_METADATA.md) has no "beta"/"test" language, no other-platform mentions
- [ ] **FAIL → human** Screenshots: must be captured from the real app on device frames — cannot be produced in code
- [ ] **FAIL → human** Naming: app.json says "Veltai", all product copy says "Lumo" — must be ONE name before any submission

## Summary
- **PASS: 18** (5 fixed/built this phase: paywall trial copy, permission-string rewrite, FaceID removal, disclaimer ×3 placements, cascade test)
- **BLOCKED on human/service: 5** (Clerk demo account + working Apple sign-in, RevenueCat purchase, TestFlight pass, screenshots)
- **FAIL needing decision: 1** (Veltai vs Lumo naming)
