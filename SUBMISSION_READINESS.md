# Lumo — pre-submission readiness

Audit date: 2026-07-31. Branch `audit/submission-readiness`, not merged.

**Verdict: do not submit. Three binary-asset blockers make rejection certain,
and no build has ever been produced from this code.** Detail in §9.

Every claim below was checked by opening the file. Where a prior document or a
prior audit report said something, I re-derived it; several such claims were
wrong. Status keys:

| | Meaning |
|---|---|
| ✅ VERIFIED | I read the code path and it does what is claimed. |
| ⚠️ UNVERIFIABLE | Correct by inspection, but proving it needs a device, a real key, or a live service I do not have. |
| ❌ BROKEN | Defective. Fixed in this branch unless stated. |
| 🚫 BLOCKED | Needs something only you can supply. |

**Read §2 before trusting any ✅.** Most of this app is ⚠️. Nothing in this
repo has ever run on an iPhone, against Clerk, against RevenueCat, or against a
real database, and I could not change that.

---

## 1. What this audit found and fixed

Twelve places showed **fabricated data as the user's own**. This is the third
time this failure class has appeared here, and it was by far the largest
instance. Every one is now dev-only or removed, with a regression suite
(`src/__tests__/noFabricatedData.test.ts`) that fails if any returns.

| What a real user saw | Where | Now |
|---|---|---|
| Name "Bilal Ahmed", email bilal.ahmed@example.com on the Account screen | `src/lib/data/userStore.ts` → `src/app/profile/account.tsx:59` | Hydrated from `GET /api/profile`; nothing ever called it before |
| Body stats 82 kg / 178 cm / 28, feeding their calorie and protein targets | `userStore.ts` | Written from onboarding, hydrated from the server |
| Meals they never logged, incl. a 520 kcal 07:10 "photo" breakfast | `src/lib/data/foodStore.ts` | Empty in release |
| A 13-day streak, 47 total gym days | `src/lib/data/gymStore.ts` | Zeroed in release |
| An "AI plan" with fixed meal times and targets | `src/lib/data/hooks.ts` `usePlan`/`useDashboard` | Empty + empty state |
| "You hit the gym 3/4 days this week… your sleep is averaging 6.8h" — first-person, under an AI badge, for a metric Lumo does not collect | `src/lib/mock/data.ts:196` | Removed from release |
| "gym 18:00 / bed 22:30" as their schedule | `src/app/(tabs)/index.tsx` | Card only renders with a real plan |
| 18 g of fibre consumed, always, read aloud by VoiceOver as fact | `hooks.ts` `useDailyMacros` | 0 until fibre is tracked per item |
| A "next 7 days" gym week with literal past dates, whose rows were tappable — applying a freeze protected an invented day | `hooks.ts` `useGym` → `src/app/gym/streak.tsx` | Empty in release |
| Three invented foods logged into today after a **failed** camera capture, with a "Scanning your meal…" toast | `src/app/food/photo-capture.tsx` → `src/lib/data/scan.ts` | Release writes nothing and reports the failure |
| Invented macros from a one-row mock barcode DB, presented as a lookup hit | `src/lib/food/barcode.ts` | Release returns not-found |
| An 8-item literal catalogue as food search, and its first three entries as "your recents" | `hooks.ts` `useFoodSearch` | Queries `/api/food/search`; recents derive from real logged items |
| A literal six-day meal history with a fake 600 ms load and a refresh that changed nothing | `src/app/food/history.tsx` | Real per-day summaries, real loading/empty/error |

Other defects fixed, each traced to its root:

- **New users could not write anything.** Every user table declares `references profiles(id)`, but the row was created only by the asynchronous Clerk `user.created` webhook. That made the whole app depend on `CLERK_WEBHOOK_SECRET` being set *and* the webhook landing before the user's first write — a race a real user can lose between signing up and finishing onboarding, surfacing as an opaque 500 on their first action. `auth.EnsureProfile` now provisions from the verified JWT.
- **Personal data went to Anthropic with no consent check.** `grep -rn consent backend --include=*.go` returned zero hits. The disclosure lived only on the device; a 6-hour sweep sent each flagged user's food logs, gym sessions, goals, streak and body weights to `api.anthropic.com` regardless. Logging five foods is enough to flag a user. Now gated on `profiles.ai_consent_at`, fail-closed, revocable. (5.1.2(i) — see §1.8.)
- **Two calorie formulas.** `deriveTargets` (onboarding preview) matches `backend/internal/goals/derive.go` exactly. `deriveGoals` — used by every screen afterwards — was an independent copy keyed on gym sessions/week instead of the activity level the user chose, so the same person could see two different targets. Collapsed to one.
- **Two live inputs were collected and discarded**: the target-weight field and "Adjust manually" both wrote to a store and were never in the POST body. Both now persist; the manual calorie override is validated against the same 1,200–10,000 band as `PUT /api/goals` so a client cannot talk the server into an unsafe target.
- **A release build with no `EXPO_PUBLIC_API_URL`** pointed at `localhost:8080` and degraded silently to an empty app. Now a configuration error.
- **Release builds showed dev copy**: "Billing not configured (dev)", "development mode".
- **Glass back/close buttons were a silent no-op** whenever the screen was the navigation root (deep link, notification tap).
- **The OAuth deep link was broken**: both sides hardcoded `lumo://` while `app.json` registers `veltai`.
- **`barcode-scan` / `label-scan`** offered "Allow camera" forever after a permanent denial, which iOS silently no-ops.
- **`label-scan` discarded every hand-typed macro** on a failed save by navigating away regardless.
- **Restore Purchases had no re-entrancy guard.**
- **Version and build number were hardcoded** `1.0.0` / `1`.
- **The food FAB's VoiceOver hint advertised a "voice" option** the menu does not have.

---

## 2. The honest split

### ✅ Verified in code — I read the path and proved the behaviour

Server-side logic with hermetic tests: the entitlement gate, rate limiting,
replay protection, offline-queue ordering and idempotency, the goal formula
(client and server agree, asserted), account deletion ordering (identity first,
then rows, 502 without touching data if the identity delete fails), the AI
consent gate, profile provisioning, and every fabricated-data fix above.

Pure client logic with tests: the auth state machine's transitions, paywall
outcome mapping, trial-length consistency across surfaces, API retry/timeout
posture, mapper behaviour.

### ⚠️ Unverifiable without a device or live service — most of the app

- **Every screen.** There are 61 `.tsx` files under `src/app`. The test suite has **no render tests** — jest runs in a node environment with no React renderer. Layout, safe areas, Dynamic Type, contrast, tap-target sizes, keyboard avoidance, VoiceOver order and Reduce Motion are all **unverified by execution**. I read them; I did not run them.
- **Clerk.** No key in this repo. Sign-up, email OTP, Apple SSO, Google SSO, token refresh, and the private-relay email path have never executed.
- **RevenueCat.** Needs a native build (`react-native-purchases` is a native module and cannot run in Expo Go). The hosted paywall has never rendered. Whether your dashboard's entitlement is literally `pro` and its trial is literally 7 days, I cannot see.
- **Gemini / Anthropic.** No keys. Every AI path is inferred from types.
- **The database.** No migration has been applied against a real Postgres by me. RLS policies are read, not exercised.
- **The camera.** Every scan flow.

### 🚫 Blocked on you

See §9's numbered list.

---

## 3. Assets — three hard blockers ❌

`npm run check:assets` (added by the previous audit, a dependency-free PNG
parser) exits 1:

1. **`assets/images/icon.png` has an alpha channel** (PNG colour type 6). App Store Connect rejects on upload: "The app icon can't contain an alpha channel." Note `sips` does **not** strip alpha; re-export as 24-bit PNG, or `magick icon.png -background white -alpha remove -alpha off icon.png`.
2. **`app.json` `ios.icon` is the Expo template.** `assets/expo.icon/icon.json` references `expo-symbol 2.svg`; I opened the SVG and it is the Expo chevron mark on a blue gradient. **Your App Store icon is currently Expo's logo.** Also true of the 1024 icon.
3. **The splash screen renders blank.** `splash-icon.png` is 228×213 and its visible pixels average `rgb(255,255,255)` against the configured `backgroundColor: "#FFFFFF"`. Colour distance 0.

Two warnings, both the naming question in §4.

**None of these are environment variables.** No amount of key-filling fixes them.

---

## 4. Identity — the complete Veltai/Lumo list

I have **renamed nothing**. A bundle-id change is destructive to App Store
identity, so this is yours to decide once, consciously. The complete list:

**Destructive to change after first submission — decide before you ship:**

| Where | Value |
|---|---|
| `app.json:13` | `ios.bundleIdentifier: "app.veltai.veltai"` |
| `app.json:4` | `slug: "veltai"` (EAS project identity) |

**User-visible, changeable any time:**

| Where | Value |
|---|---|
| `app.json:3` | `name: "Veltai"` — the **home-screen name** |
| `app.json:18` | `NSCameraUsageDescription` — "**Veltai** uses the camera…" (shown in the iOS permission prompt) |
| `app.json:35` | expo-camera `cameraPermission` — same |

**Plumbing, must stay internally consistent:**

| Where | Value |
|---|---|
| `app.json:8` | `scheme: "veltai"` — OAuth returns; Clerk must allowlist the same |
| `backend` `LUMO_APP_SCHEME` | defaults to `veltai`; a test now pins it to `app.json` |
| `package.json:2`, `package-lock.json` | `"name": "veltai"` |
| `src/lib/storage/secureStore.ts:6-12` | 5 storage keys prefixed `veltai.` — renaming these **logs every existing user out** and loses their local flags |

**Everything else says Lumo.** Every legal document, every screen, all store
metadata: `src/app/legal/terms.tsx`, `legal/privacy.tsx`, `onboarding/index.tsx`,
`onboarding/done.tsx`, `profile/about.tsx`, `ai-query.tsx`, `insights.tsx`, and
the three food scan screens.

**The user-visible consequence today:** the iOS permission sheet says "Veltai
uses the camera" while the screen behind it says "Lumo uses the camera to scan
barcodes" (`src/app/food/barcode-scan.tsx:66`). A reviewer will see both.

Three comments and one component header also say Veltai
(`src/lib/design/tokens.ts:1`, `src/app/profile/support.tsx:3`,
`src/components/domain/GymSessionButton.tsx:2`) — cosmetic only.

---

## 5. Screenshots 🚫 — none exist

`find . -name "*screenshot*"` returns nothing. Required by App Store Connect for
a new app:

| Display | Size (portrait) | Required? |
|---|---|---|
| 6.9" (iPhone 17 Pro Max / 16 Pro Max) | 1320 × 2868 | **Yes** — at least one set |
| 6.5" (iPhone 11 Pro Max / XS Max) | 1242 × 2688 | Yes, unless the 6.9" set is accepted for all sizes |
| 12.9" iPad Pro | 2048 × 2732 | **No** — `app.json:12` sets `ios.supportsTablet: false` |

Up to 10 per size. iPad is explicitly off, so iPad screenshots are not required
and no screen needs verifying at that size.

---

## 6. Apple guideline audit

Live guidelines were fetched at audit time. Nothing material changed since the
previous audit; the notable current emphases are 3.1.2's requirement that the
**full renewal price be the most prominent pricing element** (a "per month"
breakdown of an annual plan must be visually subordinate), and 2.3.1's ban on
generic release notes for a build that adds features.

| Rule | Status | Evidence |
|---|---|---|
| **2.1 Completeness** | ✅ fixed (was ❌ ×12) | §1. All fabrication now dev-gated, regression-tested |
| **2.1 demo account** | 🚫 | `backend/scripts/seed_demo_account.go` exists and reads `DEMO_ACCOUNT_PASSWORD`, but no account has been seeded and App Review notes are not written |
| **2.3.1 Hidden features** | ✅ | No remote config, no gesture-gated debug menu. Dev-only paths are gated on `isDevBuild()` (`__DEV__`, compiled false in release) — not a runtime toggle |
| **3.1.1 IAP only** | ✅ | No Stripe/Paddle/external checkout anywhere. Entitlement originates from RevenueCat receipts server-side (`backend/internal/subscription/`). Restore present at the paywall and in Settings |
| **3.1.2 Subscription disclosure** | ⚠️ | Plan name, duration and price render from **RevenueCat's hosted paywall**, so no hardcoded price exists in this repo — correct, and unverifiable without the native build. `TRIAL_DAYS = 7` is the single source of truth and every surface derives from it (asserted, `authBilling.test.ts`). Terms and Privacy links are on the paywall itself before any purchase action, with 44 pt hit targets (`src/app/onboarding/paywall.tsx:134-161`) |
| **3.1.2 Manage Subscription** | ✅ | A "Manage subscription" button opens `https://apps.apple.com/account/subscriptions` (`src/app/profile/subscription.tsx:21,77-80`), shown when entitled. *(A sub-agent reported this missing and I repeated the claim in a draft of this document before checking. It was wrong. Noted here because it is exactly the failure this audit exists to catch — including when I am the one making it.)* |
| **4.8 Sign in with Apple** | ⚠️ | Apple and Google SSO both offered on the same screen with equal prominence. Whether the `com.apple.developer.applesignin` entitlement survives into the build, and whether the private-relay email path works, needs the native build |
| **5.1.1 Permission strings** | ✅ in `app.json` | Exactly one string, `NSCameraUsageDescription`, specific, matching the one permission the app requests. **See the `ios/` warning below.** |
| **5.1.1 denial paths** | ✅ fixed | All three camera screens now branch on `canAskAgain` and offer Settings |
| **5.1.1(v) Deletion** | ✅ | Settings → Account → Delete, two taps, confirmed, genuinely destructive: Clerk identity deleted first, then the `profiles` row, and every user table cascades. Returns 502 **without touching data** if the identity delete fails — it never claims a deletion that did not happen (`backend/internal/auth/profile.go:156-163`) |
| **5.1.2(i) AI consent** | ✅ fixed (was ❌) | Now gated server-side at every Gemini/Anthropic call site, fail-closed, revocable |
| **1.4.1 Health** | ⚠️ | Calorie targets are floored at 1,200 client- and server-side, and the new manual override is validated against the same band. A health disclaimer component exists (`src/components/display/HealthDisclaimer.tsx`). Its placement on every screen that gives advice is not verified by execution |
| **HealthKit** | ✅ | No HealthKit entitlement in `app.json`, and no HealthKit capability shipping. Correct — the previous audit removed a fabricated Apple Health screen |

### ⚠️ A stale `ios/` directory is a live 5.1.1 hazard

An `ios/` prebuild exists **on disk**, from before the `app.json` permission
cleanup. It is gitignored, so a clean CI/EAS build regenerates correctly. But
any local `expo run:ios`, Xcode archive, or `expo prebuild` **without
`--clean`** reuses it — and its `Info.plist` declares **six** usage
descriptions including `NSHealthShareUsageDescription`,
`NSHealthUpdateUsageDescription`, `NSMicrophoneUsageDescription`,
`NSPhotoLibraryUsageDescription` and `NSFaceIDUsageDescription`, for features
that do not ship. `NSHealthUpdateUsageDescription` literally reads "Reserved for
future use" — a written admission of an unused permission.

**Before building: `rm -rf ios`** (or `npx expo prebuild --clean`).

---

## 7. App Privacy nutrition label — draft from what the code actually sends

Derived from the API client's payloads and the schema, not from the marketing
copy. Verify against your own answers before submitting.

**Data Used to Track You:** none. There is no ad SDK, no IDFA, no
`NSUserTrackingUsageDescription`, and no third-party analytics.

**Data Linked to You** (all rows carry `user_id` from the verified JWT):

| Category | Type | Purpose |
|---|---|---|
| Contact Info | Email address, Name | App Functionality (from Clerk) |
| Health & Fitness | Health (body weight, height, age, sex, activity level, calorie/macro goals), Fitness (gym sessions, streaks) | App Functionality |
| User Content | Photos (meal and nutrition-label images), Other User Content (food names, quantities, notes) | App Functionality |
| Identifiers | User ID (Clerk id) | App Functionality |
| Usage Data | Product Interaction (a fixed allowlist of ~10 event names, `src/lib/analytics.ts:31`) | Analytics |
| Purchases | Purchase History (subscription status via RevenueCat) | App Functionality |

**Data Not Collected:** location, contacts, browsing history, search history,
financial info, sensitive info, diagnostics.

Two things to decide before you answer Apple's questionnaire:

1. **Analytics is opt-out, not opt-in** (`analyticsEnabled: true`, `src/lib/settings/store.ts:95`). Events are first-party, stored in your own `analytics_events` table with RLS, and the allowlist is narrow — but it is on by default, and it is linked to the user. Declare it.
2. **Meal photos leave your infrastructure** — they go to Google Gemini. Anthropic receives a summarized brain (logs, sessions, goals, weights). Both are processors providing the feature, not tracking, and both now require recorded consent. Your privacy policy must name them; check that `src/app/legal/privacy.tsx` does.

---

## 8. Onboarding and billing traces

**Onboarding** ✅ traced end to end. Ten steps, each rendering and advancing;
back preserves answers (a persisted zustand store, not route params); the
submission is a single atomic `POST /api/onboarding` whose backend handler runs
one transaction — onboarding row, derived goals, cuisine preferences, seeded
saved foods and AI-brain priors — so a failure leaves no partial state. Terms
and Privacy are reachable without an account. Derived targets now match the
backend formula exactly (asserted by test, §1).

Two routing defects remain ❌ **unfixed** — they need a device to verify a fix,
and a wrong fix here strands users:

1. **A signed-out cold start with a stale local flag strands the user in the tabs.** `src/app/index.tsx:38` short-circuits on the persisted `hasCompletedOnboarding` flag before any session check. If the Clerk session is gone but the flag survives (token cache cleared, session revoked elsewhere, keychain restored to a new device), the user lands in empty tabs; `ClerkBridge` only dispatches `SIGN_OUT` when it saw a previous signed-in state, which on first mount it has not, so nothing routes them back to sign-in.
2. **The auth machine's cold-start lane is dead code.** Only `UNAUTHORIZED` and `SIGN_OUT` are ever dispatched. The documented expired → refresh → sign-out chain cannot run in the app; its unit tests pass because they drive `transition` directly. Token expiry is handled solely by the one forced refresh inside the API client.

**RevenueCat** ⚠️ — configured after Clerk is ready, `logIn(clerkUserId)` /
`logOut()` wired, entitlement id is exactly `pro`, all five paywall outcomes are
mapped, dismissal still completes onboarding, Restore calls through, and dev
mode cannot grant entitlement in a release build (`isDevEntitled()` requires
`isDevBuild()`). Server-side gating returns 402 `upgrade_required` and the
client shows the paywall; an *unverifiable* entitlement returns 503 with an
explanation rather than "you must pay". **All of it needs a native build.**

One real gap ❌ **unfixed**: the server never checks *which* entitlement was
granted (`backend/internal/subscription/subscription.go`) — it asks only whether
an active row exists. Safe today because there is exactly one product; if you
ever add a second, any purchase would grant full Pro server-side while the
client correctly says no.

---

## 9. Verdict, and what only you can do

**Do not submit.** Not "submit with risk" — three blockers in §3 mean the upload
either fails outright (alpha channel) or ships Expo's logo as your app icon.

Beyond that, the honest position is that **this codebase has never been built or
run**. The audit removed a large amount of dishonest behaviour and fixed real
data-loss and privacy defects, and the test suites are green — but 376 node-env
tests and a Go suite prove logic, not that an app launches, that a paywall
renders, or that a photo scan works. Treat §2's ⚠️ list as the actual state of
the product.

Numbered, in order, all mine to hand over:

1. **Replace the app icon.** 1024×1024, no alpha, no pre-rounded corners, not Expo's mark. Then either replace `assets/expo.icon/` or delete `ios.icon` from `app.json`.
2. **Replace the splash image** with something visible against `#FFFFFF`, or change the background colour.
3. **Decide Veltai or Lumo** (§4) and apply it consistently. Do this before first submission — the bundle id cannot change afterwards.
4. **`rm -rf ios`** before any local build (§6).
5. **Produce a native build** (`eas build` / `expo run:ios`). Nothing about billing, SSO, camera or push can be verified before this exists.
6. **Fill in the real keys** — see `FIRST_RUN_CHECKLIST.md`.
7. **Configure RevenueCat**: entitlement `pro`, 7-day introductory offer, products live in App Store Connect.
8. **Seed and test the demo account** (`backend/scripts/seed_demo_account.go`), and write App Review notes with the credentials.
9. **Take screenshots** at the two iPhone sizes in §5.
10. **Publish Terms and Privacy at live URLs** and put them in App Store Connect. The in-app screens exist; the hosted documents must resolve.
11. **Device-QA every screen.** All 61. Nothing in §2's ⚠️ list has been executed.

---

## Verification at time of writing

```
npm test                    376 passed, 22 suites
npx tsc --noEmit            clean
npx eslint src              0 errors, 19 warnings (all pre-existing require() style)
cd backend && gofmt -l .    clean
go build ./... && go vet    clean
go test ./...               all packages ok
npm run check:assets        2 ok, 2 warnings, 3 BLOCKERS  ← §3
```

Test count rose from 368 to 376. No test was weakened to pass; two were
rewritten because they asserted behaviour this audit deliberately changed
(`scanSeam` asserted that a failed capture fabricates a meal; `deriveGoals`
asserted the duplicate formula's input).
