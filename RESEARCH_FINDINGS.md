# Phase 14 — Research Findings (2026-07-28)

Sources: live fetches of Apple's published guidance on 2026-07-28 (App Review
Guidelines, App Privacy details, HealthKit privacy docs, HIG layout/typography/
accessibility/buttons/feedback/haptics, Subscriptions, Offering Account
Deletion). Repo claim documents read as claims-to-verify, not facts.

**Notion: NOT CONNECTED.** No Notion MCP server is available in this session and
a connector-registry search returns nothing. A Google Drive search for an
Apple/App Store guidelines document also found nothing. The user's
project-specific Apple-guidelines page could NOT be read — its contents are not
reflected here and nothing was invented in its place.

## What Apple currently requires (distilled, checkable)

### Account deletion — 5.1.1(v) (+ Apple's support page)
- In-app initiation, easy to find; deletes the **entire account record**
  (identity included), not just app rows. Deactivation-only fails review.
- Delayed processing allowed only if the UI states the timeframe; scheduled
  deletion allowed only alongside an immediate option.
- **The delete flow must warn that auto-renew billing continues through Apple
  and point at Apple's subscription management** before deleting.
- Sign in with Apple: token revocation via Apple's revoke endpoint is expected
  during deletion (frequent rejection when missing).
- Worldwide, not region-gated; guest accounts too; UGC shared with others too.

### Subscriptions — 3.1.2 (+ Schedule 2, enforced as if in the guidelines)
- Before purchase: plan name + duration, **the actually-billed amount as the
  most prominent price element**, content provided, trial length + post-trial
  price, and functional Privacy Policy + Terms links **in the app binary AND in
  App Store Connect metadata**.
- Restore must be reachable from the sign-up/paywall screen itself, not only
  Settings.
- All tiers in ONE subscription group. Empty product list in a real build
  usually = Paid Applications Agreement not Active (banking/tax incomplete).

### Privacy — 5.1.1 / 5.1.2
- Privacy policy link in App Store Connect metadata AND easily accessible
  in-app (including without an account).
- **5.1.2(i) now explicitly requires disclosing when personal data is shared
  with third-party AI and obtaining explicit permission before doing so.**
  Meal photos → Gemini and user data → Anthropic fall squarely under this.
  (The repo's docs predate / don't mention this.)
- Purpose strings must be specific; declared permissions must map to real
  features; deny paths must not brick the app.
- 5.1.1(ix): health apps handling sensitive data are expected to ship from an
  **organization** developer account, not an individual.

### App Privacy nutrition label
- "Collected" = transmitted off-device and retained beyond servicing the
  request. Everything keyed to the Clerk/RevenueCat user id is **Linked to You**.
- Expected label for this stack: Contact Info (name, email), Identifiers
  (user ID), Health & Fitness (user-entered nutrition/workouts server-side —
  user-typed meal logs count as health data), User Content (meal photos to
  Gemini; AI query text), **Purchases (RevenueCat purchase history — commonly
  missed)**, **Usage Data / Product Interaction (first-party analytics —
  commonly missed)**, **Search History if food searches are logged server-side**.
- Tracking: NONE only if no SDK shares with ad networks/brokers — verify per
  vendor. Hashed emails still count as Contact Info.
- Privacy manifests (PrivacyInfo.xcprivacy) + SDK signatures are now standard;
  verify on the native build.

### HealthKit (currently no native module in this app — rules for when it lands)
- No HealthKit-derived data into advertising/marketing/analytics events; no
  disclosure to third parties except health/fitness services with express
  permission; never written falsely; **never stored in iCloud** (5.1.3(ii));
  both NSHealthShare/NSHealthUpdate strings required or the app crashes at the
  authorization call; read-denial is indistinguishable from empty data — UI
  must never claim "denied" from empty results; entitlement
  com.apple.developer.healthkit required (+ background-delivery if used).

### Health & harm — 1.4.1
- No sensor-only vital measurement claims; calorie/macro numbers framed as
  estimates with methodology; "consult a doctor" reminder in-app; extra
  scrutiny for health apps.

### Completeness — 2.1 / metadata 2.3
- Demo credentials in review notes are mandatory for login apps (built-in demo
  mode needs prior Apple approval).
- No placeholder text/dead URLs; screenshots of real screens; **no
  "coming soon" language** — the current APP_STORE_METADATA.md description
  says "Apple Health support is on the way", which is future-feature language
  in metadata and should be removed.

### HIG (the audit bar for Phase C)
- Tap targets: 44×44pt expected (28pt absolute floor); ~12pt spacing around
  bordered controls, ~24pt around bare icons.
- Type: body ≈17pt, floor 11pt; Dynamic Type through AX5 without clipping;
  no global `allowFontScaling` off; `maxFontSizeMultiplier` caps below ~1.35 on
  primary content are a fail.
- Contrast: 4.5:1 below 18pt, 3:1 at 18pt+/bold, in both themes.
- **Reduce Motion: zero `isReduceMotionEnabled`/`useReducedMotion` hits in a
  codebase with animations is an automatic fail** — replace movement with
  fades, tighten springs.
- Avoid full-width edge-to-edge buttons (16–20pt margins); avoid auto-dismiss
  toasts for critical info; async buttons show progress and can't double-submit.
- Haptics: system patterns only for their meanings, consistent app-wide,
  optional, never information-bearing alone.
- New since 2025: Accessibility Nutrition Labels on the product page — declare
  only what the app honestly supports.

## Deltas vs. what this repo assumes (each verified in code this phase)

1. **APP_STORE_CHECKLIST.md §3.1.2 is stale/inaccurate.** It claims in-app
   Monthly/Annual plan cards showing $8.99/$49.99. The code
   ([paywall.tsx](src/app/onboarding/paywall.tsx)) uses RevenueCat's HOSTED
   paywall; the cards were deleted (DECISIONS.md documents this). Pricing
   disclosure therefore lives in the RC dashboard config — a human-configured
   artifact that CANNOT be verified in this repo. Flagged BLOCKED in the report.
2. **Account deletion did not delete the account.** `DELETE /api/profile` only
   removed DB rows; the Clerk identity (email/name, ability to sign in)
   survived, and the client never purged local state (ACCOUNT_DELETED was
   never dispatched). Both fixed this phase.
3. **Delete-flow copy was false twice**: claimed a "7-day grace period"
   (deletion is immediate) and "your subscription is cancelled" (Apple
   subscriptions cannot be cancelled by the app). Fixed; flow now warns billing
   continues per Apple's account-deletion page.
4. **Data export is publicly promised but does not exist.** The App Store
   description draft says "You can export or permanently delete everything from
   Settings." No export route exists (83 routes audited). Given health data +
   no web portal + GDPR access rights, the defensible position is to build the
   export. Built this phase (see report).
5. **Third-party-AI consent (5.1.2(i))** is not addressed anywhere in the
   repo's checklists — the privacy policy and scan/AI flows must disclose
   Gemini/Anthropic processing and the label must declare it.
6. **Nutrition-label draft in APP_STORE_METADATA.md is incomplete** — misses
   Purchases (RevenueCat history), Usage Data (first-party analytics events),
   and Search History (server-logged food searches).
7. **"Apple Health support is on the way"** in the metadata description is
   future-feature language — removed from the draft; the in-app Apple Health
   screen must not present a dead connect action (2.1).
8. **PRODUCTION_READINESS.md says 10 migrations; there are 11** (the analytics
   migration 20260727000001 landed after it was written). Honest count
   documented in the report.
