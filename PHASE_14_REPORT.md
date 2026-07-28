# Lumo — Phase 14 Report: Pre-Submission Audit (2026-07-28)

Standing rule applied throughout: **verified in code, never trusted a claim in
a document.** Several prior documents turned out to be wrong (named below).
Companion documents produced this phase: [RESEARCH_FINDINGS.md](RESEARCH_FINDINGS.md),
[HIG_AUDIT.md](HIG_AUDIT.md), decisions appended to [DECISIONS.md](DECISIONS.md).

## 0. Verification state at the end of the phase

| Check | Result |
|---|---|
| `go build ./...` / `go vet` / `gofmt -l` | clean |
| `go test ./... -count=1` | 24/24 packages ok |
| `go test ./... -race` | clean |
| `npx tsc --noEmit` | clean |
| `npx eslint src/` | 0 errors (1 pre-existing i18next import warning) |
| `npm test` | **317 passed** (was 303 — +14, every fix carries a test where the repo's no-render-test policy allows one) |
| `web`: build / lint / typecheck | clean (pure static export) |
| Changed | 113 files, +1601 / −971 |

## 1. Research findings (Phase A)

Current Apple guidance was fetched live (review guidelines, App Privacy
details, HealthKit privacy, HIG, subscriptions, account-deletion support
page). Full distillation in RESEARCH_FINDINGS.md. The rules that changed this
audit's outcomes:

1. **5.1.2(i) now explicitly requires disclosure + permission before sharing
   personal data with third-party AI.** Nothing in the repo addressed this.
   Built: a one-time consent gate on every AI share point (photo/label scan →
   Gemini; Ask-Lumo, insights, morning brief → Anthropic). No upload or AI
   fetch happens before consent; the key clears on sign-out.
2. **Account deletion must delete the account (identity), not just data**, and
   the flow must warn that Apple billing continues. Neither was true (see §2).
3. **Schedule 2 paywall disclosure** is enforced as if in the guidelines
   (price prominence, trial terms, working Terms/Privacy links in-app AND in
   metadata). The in-app framing complies; the pricing itself lives in the
   hosted RevenueCat paywall — a dashboard artifact this repo cannot verify.
4. **5.1.1(ix)**: health apps are expected to ship from an **organization**
   developer account, not an individual (human action).
5. Nutrition-label expectations: RevenueCat purchase history ("Purchases"),
   first-party analytics ("Usage Data → Product Interaction") and user-typed
   meal logs (count as Health data) must be declared — the repo's draft missed
   all three (now updated in APP_STORE_METADATA.md).

**Notion: not connected.** No Notion MCP exists in this session and the
connector registry has none; a Drive search also found no Apple-guidelines
document. The user's project-specific guidance page could NOT be read — its
contents are not reflected in this audit.

## 2. Apple compliance table (Phase B)

Every verdict was produced by reading code, then adversarially re-verified by
an independent agent before being accepted.

| Requirement | Verdict at audit | Evidence | Now |
|---|---|---|---|
| 5.1.1(v) deletion ≤2 taps from Settings | PASS | [settings.tsx:69](src/app/profile/settings.tsx) → delete-account | PASS |
| 5.1.1(v) deletes the ACCOUNT | **FAIL** — only DB rows died; the Clerk identity (email/name, ability to sign in) survived | [profile.go:81](backend/internal/auth/profile.go) | **FIXED**: DELETE /api/profile deletes the Clerk user first (Backend API); provider failure → 502, row untouched; tests added |
| 5.1.1(v) client state after deletion | **FAIL** — `ACCOUNT_DELETED` was never dispatched: stores, offline queue and the live Clerk session all survived "deletion" | delete-account.tsx (old) | **FIXED**: machine dispatch → full purge + session end + RC logOut; machine swallows the echo SIGN_OUT; tests added |
| 5.1.1(v) truthful copy | **FAIL** — claimed a "7-day grace period" (deletion is immediate) and "your subscription is cancelled" (impossible) | delete-account.tsx (old) | **FIXED**: immediate+irreversible copy; Apple-required "billing continues — cancel in Settings" warning |
| Data export | **FAIL** — publicly promised in the store description; a dead "Phase 2" placeholder row shipped; no endpoint existed | privacy.tsx (old), 83-route audit | **BUILT**: GET /api/export (every user table, OAuth tokens stripped), coverage enforced by a migrations-derived test; Settings → Privacy → Export → share sheet |
| Sign out exists | **FAIL** — no sign-out control anywhere; the only way out was deleting the account | grep: zero hits | **FIXED**: Settings row + confirm → machine purge |
| 5.1.1(i) policy reachable w/o account | PASS | signup/paywall/settings → /legal/* | PASS |
| Third parties disclosed | PASS except Apple Health | [privacy.tsx:29](src/app/legal/privacy.tsx) | PASS — Apple Health became moot: the feature was fake and is removed |
| "No ad/tracking SDKs" truthfulness | PASS — verified per-dependency; analytics is genuinely first-party (12-event allow-list client+server, no PII, opt-out honest and persistent) | package.json, src/lib/analytics, backend/internal/analytics | PASS |
| Analytics cross-user leak | **FAIL** (found in passing) — unsent buffer survived sign-out and would flush under the next account's JWT | resetRegistry.ts (old) | **FIXED** + test |
| 5.1.2(i) third-party-AI consent | **FAIL** — no disclosure/permission before photos → Gemini or data → Anthropic | scan/AI flows (old) | **FIXED**: one-time consent gates every share point incl. the auto-fetching morning brief |
| 3.1.2 paywall content | BLOCKED — hosted RevenueCat paywall renders pricing from the dashboard; cannot be verified in this repo. In-app framing (trial/auto-renew note, Terms+Privacy links, restore on the paywall) PASSES | paywall.tsx | BLOCKED (human: configure + verify the RC paywall) |
| Restore Purchases | PASS in Settings + paywall; **FAIL** on the subscription screen (fake success toast, no API call) | subscription.tsx (old) | **FIXED**: real restore everywhere; busy states added |
| Subscription screen truthfulness | **FAIL** — hardcoded "Free trial" badge, mock plan/price/dates rendered as real, "Manage" opened the wrong Settings page | subscription.tsx (old) | **FIXED**: entitlement-driven status, real manage URL, honest dev-mode note, no fabricated dates |
| No silent entitlement in release | PASS — release+no key ⇒ not entitled; dev default is `__DEV__`-gated; every grant path traced | purchases.ts, env.ts, entitlement.ts | PASS |
| 1.4.1 disclaimer where targets shown | **FAIL** on display surfaces (home ring / nutrition detail) | dashboard/nutrition.tsx (old) | **FIXED** (nutrition detail; home ring taps through to it) |
| 1.4.1 unsafe calorie targets | **FAIL** — 0 or 50,000 kcal persisted end-to-end through every override path | goals.go putGoals (old), settings store (old) | **FIXED**: [1200,10000] band on client store, onboarding sheet, and PUT /api/goals (400) + tests |
| 1.4.1 AI medical guardrail | **FAIL** — no system prompt constrained medical/diagnostic advice | insights.go (old) | **FIXED**: guardrail on all three prompts, enforced by a seam-capturing test |
| 2.1 no fake features | **FAIL ×2** — voice logging was a canned simulation (fake transcript, save-that-saved-nothing) with a mic permission for a feature that didn't exist; Apple Health UI fabricated data (fake "Connected", hardcoded 540 kcal/8,240 steps on the dashboard, fake "Sent to Apple Health") | voice.tsx, apple-health.tsx, healthkit/ (all old) | **REMOVED** — both surfaces, their permission strings (mic, photo library, NSHealth×2), mock data, and store fields. Store metadata updated to drop voice claims |
| 2.1 no dead buttons / placeholders | **FAIL** — "Manage (stub)" label, fake "feedback sent", dead veltai.app links (domain is NXDOMAIN — verified by dig), "Export Phase 2" row | multiple | **FIXED**: feedback is a real prefilled mailto; dead-domain rows removed; stub label gone with the card |
| 2.1 demo account | Seeder verified thorough + idempotent (14 days food, templates, schedule, 8 sessions incl. ACSM cardio, streak, weights, subscription) | seed_demo_account.go | BLOCKED on Clerk (create user, re-run with -user) |
| Permission strings ↔ features | **FAIL** — mic/photo-library/HealthKit strings for nonexistent features (camera was the only honest one) | app.json (old) | **FIXED**: camera-only; expo-camera's mic string suppressed via `microphonePermission: false` (verified in the installed plugin source) |
| 2.3 metadata accuracy | **FAIL** — description claimed voice logging and "Apple Health on the way" (future-feature language) | APP_STORE_METADATA.md (old) | **FIXED** draft; nutrition label draft completed (Purchases, Usage Data) |

## 3. HIG audit (Phase C) — summary

Ten auditors walked all 63 screens + shared components; ~85 fixes applied and
verified. Full ledger: [HIG_AUDIT.md](HIG_AUDIT.md). Headlines:

- **Keyboard avoidance did not exist anywhere** — fixed once in the four
  shared scaffolds; every form screen inherits it.
- **Nine icons rendered blank** (unmapped SF names — including the Ask-Lumo
  send button). Fixed in the Icon map.
- The walk found **five more silent-data-loss bugs** beyond Phase B's:
  barcode-confirm and serving-picker never logged the food, the targets sheet
  discarded macro edits, log-session discarded the energy level, the
  notifications screen persisted nothing. All fixed.
- Fixed Dynamic-Type clipping (fixed-height TextField/NavBar), ~14 contrast
  failures, ~20 undersized tap targets, VoiceOver-unreachable controls
  (nested-Text links, nested-pressable banners), colour-only energy bars,
  destructive actions that looked neutral (dead `black : black` ternary).
- Verified-good and left alone: Reduce Motion coverage (springless by design),
  Dynamic Type scaling policy, haptic-pattern consistency, safe areas,
  back-swipe, double-submit guards.

## 4. Energy cross-check (Phase E) — what was proven

**Arithmetic vs hand-computed fixtures** (all green):
- ACSM worked examples ±2 kcal (treadmill 30min/8km/h/5% @70kg = 380 kcal,
  MET 10.33; flat = 317; cycling 45min@150W = 475) + property sweeps proving
  no NaN/Inf/negative output for any formula on absurd inputs.
- MET paths: strength sets/reps/rest estimate, cardio duration, avg-MET
  session fallback (fires ONLY with zero exercises — per its test), bodyweight
  default.
- BMR (Mifflin–St Jeor, all three sex offsets) and the full daily balance:
  male 30y/180cm/80kg → BMR 1780; intake 2400, exercise 350 → out 2130, net
  +270, variance +200 → surplus. Weekly averages incl. the missing-BMR
  degradation path.

**Double-counting** — the scenarios tested and their results:
1. *Same activity re-synced from the same provider*: *prevented* — partial
   unique indexes on (user_id, strava_activity_id / whoop_workout_id /
   apple_health_uuid) + `ON CONFLICT DO NOTHING`; sync reports it "skipped"
   (existing test).
2. *Same workout arriving from a second provider, or imported after a manual
   log*: **was NOT prevented — real bug, fixed this phase.** Import now skips
   when a same-day session of the same type within ±10 min duration exists
   from another source (`IsCrossSourceDuplicate`, pure + table-tested; the
   SQL wrapper excludes same-provider rows, which dedupe exactly by id).
   Documented ceiling: sessions store no start time, so two genuinely distinct
   same-type/similar-length workouts in one day from different sources will
   merge. Manual-after-import remains possible (explicit user action).
3. *Manual session recompute vs device calories*: device imports keep
   `calculation_method='device'` and are never recomputed (import path sets
   provider calories; the ACSM recompute only runs on the app's own
   session-complete call).
4. *Apple Health write-back feedback loop*: **N/A by removal** — the
   write-back was fake and is gone. When real HealthKit lands: reads MUST
   filter out samples whose source is Lumo itself, or the loop returns.
5. *Timezone (23:50 local)*: **was broken for the balance views, fixed** —
   food/gym logs were always stamped with the device-local date, but the
   dashboard's balance query defaulted to the SERVER's calendar day
   (LUMO_TIMEZONE), so near midnight it showed the wrong day. The app now
   anchors both energy endpoints with its local date (`?date=`, new `?end=`);
   tested (window 2026-02-23..2026-03-01 for end=2026-03-01; malformed → 400).

**Integrations (hermetic)**: OAuth connect/callback (one-time CSRF state,
10-min TTL), token refresh-on-expiry, AES-256-GCM at rest, disconnect,
imported/skipped counting — all covered by existing green suites.
**Unproven until real credentials exist**: live Strava/WHOOP behaviour (API
shapes, rate limits, real token refresh), live Clerk SSO/OTP, real RevenueCat
purchases/restores, and the cross-source dedupe SQL against a live Postgres
(its decision logic is unit-tested; the query is hand-verified only).

## 5. Prior documents found inaccurate (naming names)

1. **APP_STORE_CHECKLIST.md** — §3.1.2 claims in-app Monthly/Annual price
   cards showing $8.99/$49.99; those were deleted (hosted RC paywall). Its
   5.1.1(v) PASS was wrong in substance: deletion left the Clerk identity and
   all client state alive. Its permission-string PASSes were wrong for mic/
   photo-library/HealthKit (features didn't exist). Treat PHASE_14_REPORT as
   the current checklist.
2. **PRODUCTION_READINESS.md** — says 10 migrations (there are 11) and
   "no placeholder screens / no dead buttons" (voice, Apple Health, feedback,
   export row, subscription screen all contradicted it).
3. **delete-account screen copy** — "7-day grace period" was false.
4. **reset_production.sql** — its "every table listed" contract was broken
   (analytics_events missing; fixed).
5. **ROUTE_COVERAGE.md** — was accurate at 83 routes when written;
   regenerated this phase: 84/84 consumed (100%) including the new
   /api/export (the 2 "broken" anomaly endpoints remain known-intentional).
6. **src file headers** — several described intent, not behaviour ("goes to
   the team" on a feedback box that discarded text; "destructive red" on
   monochrome rows; "Mocked save" shipped as-is).

## 6. Genuinely blocked, and exactly what unblocks each

| Blocked item | Unblocks it |
|---|---|
| Real purchases + paywall pricing/trial display | RevenueCat dashboard: products ($8.99/mo, $49.99/yr, 7-day trial), default Offering, `pro` entitlement, hosted paywall design; `EXPO_PUBLIC_REVENUECAT_IOS_KEY`; App Store Connect subscriptions in ONE group; Paid Apps agreement Active |
| Live auth (SSO + OTP) and the Clerk-side deletion | Clerk keys + dashboard config (Apple/Google SSO, email code, `veltai://` allowlist); `CLERK_SECRET_KEY`/`CLERK_WEBHOOK_SECRET` on the backend |
| Demo account for review notes | Create the review user in Clerk → `seed_demo_account.go -user <clerk_id>` |
| App ↔ backend on a device | Deploy `backend/` (static binary + env per CONFIG.md), set `EXPO_PUBLIC_API_URL` (new — no code edit needed anymore) |
| Production DB | `supabase db push` (all 11 migrations — applied-state could not be verified from this session: the connected Supabase MCP account does not contain the LumeAI project) |
| HealthKit (real) | Native module + `com.apple.developer.healthkit` entitlement + native rebuild + policy/label updates + source-filtered reads (see §4.4) |
| Strava/WHOOP live | Registered apps + client credentials + `INTEGRATION_ENCRYPTION_KEY` |
| Submission itself | Apple Developer account (still in compliance screening) — enroll as an **organization** (5.1.1(ix)) |

## 7. Remaining human actions (ordered)

1. **Decide the name: Veltai or Lumo** — one identity across app.json
   (name/slug/scheme/bundle id), Clerk scheme allowlist, store metadata, and
   the support email (`lumofit@gmail.com` currently mismatches both).
2. **Stand up the domain** — veltai.app is NXDOMAIN; the deployed /web site
   has /support, /privacy, /terms, /faq ready. Until a domain exists, the
   metadata's `https://lumo.fit/support` URL is a submission-blocking dead
   link. After it exists, re-add the in-app FAQ/licenses rows removed this
   phase.
3. Deploy the backend + apply migrations + set every env var (CONFIG.md).
4. Configure Clerk + RevenueCat (see §6) and set the two app keys +
   `EXPO_PUBLIC_API_URL`.
5. **Decide what Pro actually gates.** `useEntitlement` now has a real
   consumer (subscription screen) but **no feature is gated** — selling an
   auto-renewing subscription that unlocks nothing is a 3.1.2(a)
   ongoing-value / 2.3.1 accuracy rejection risk. Either gate features before
   submission or rewrite the paywall promise.
6. Create + seed the demo account; put credentials in App Store Connect
   review notes.
7. Native build (`npm run ios`), TestFlight pass — first live Clerk sign-in,
   first sandbox purchase, Dynamic Type spot-check (AX sizes), and verify the
   prebuild Info.plist carries ONLY the camera permission string.
8. Screenshots from the real app; App Privacy answers from the updated draft
   in APP_STORE_METADATA.md; Terms link in the App Store metadata field.
9. Optional but recommended: point `useMorningBrief`'s consent gate at a
   nicer first-run explainer than the system alert, post-launch.

## 8. Honest verdict

**Not submit-ready today — but the blockers are now operational, not code.**

As of this audit the codebase itself no longer contains what would have caused
certain rejection: fake features (voice, Apple Health), permission strings for
nonexistent capabilities, an account deletion that deleted neither the account
nor local state, false claims in UI copy, a fake restore button, dead
placeholder rows, missing AI consent, and unsafe calorie targets are all gone,
verified, and regression-tested. The three packages build and test green
independently.

What would still fail review if submitted right now, in order of certainty:

1. **Purchases are inert** — no RevenueCat key/products means the paywall
   can't sell and the reviewer sees a subscription app with no working
   purchase (2.1). Certain rejection.
2. **No working auth** — Apple SSO must WORK, not render (4.8); no Clerk keys
   means no sign-in and no demo account (2.1). Certain rejection.
3. **Dead support URL** in metadata (lumo.fit / veltai.app both unresolvable).
   Certain metadata rejection.
4. **The Veltai/Lumo identity split** across binary vs copy (2.3 accuracy).
5. **A subscription that gates nothing** (3.1.2(a) ongoing value) — judgement
   call by the reviewer, real risk.
6. Unscreened residual risk: the hosted RC paywall's content (price
   prominence, trial disclosure) is configured in the dashboard and must be
   human-verified against Schedule 2 before submission.

Once §7 items 1–6 land, the remaining risk profile is the normal one for a
first submission — nothing in this codebase is known to be non-compliant.
