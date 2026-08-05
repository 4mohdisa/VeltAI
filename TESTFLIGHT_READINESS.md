# Lumo / Veltai — TestFlight readiness

**Audit date: 2026-08-05. Branch `audit/testflight-gate`, not merged.**
Baseline audited: `main` @ `5fd5850`.

---

## Verdict

# No. This cannot be built and uploaded today.

Not "with caveats". The upload itself fails, and the App Store record you would
create carries a Support URL that belongs to somebody else.

The single most important finding is not a bug. It is this:

> **The entire pre-submission remediation pass was never merged.** Branch
> `audit/submission-readiness` — 3 fix commits carrying the repair for 12
> fabricated-data instances, the server-side AI-consent gate, the onboarding
> wiring, the asset checker and a 227-line regression suite — is **not an
> ancestor of `main`**. `main` diverged onto the web redesign instead. Every
> defect that branch describes as fixed is **still live on `main`**, while
> `SUBMISSION_READINESS.md` sits on the unmerged branch describing them as
> repaired. Anyone reading that document on `main` would not find it at all.

I merged it onto this audit branch (it merges clean; your later web/legal work
survives) and verified the fixes in code rather than trusting them. That is the
biggest single line item below.

### Blocking list — shortest first

| # | Blocker | Effort | Who |
|---|---|---|---|
| 1 | **App icon has an alpha channel.** `assets/images/icon.png` is 1024×1024 PNG colour type 6. App Store Connect rejects at upload. | minutes, needs a design tool | you |
| 2 | **Splash renders blank.** `splash-icon.png`'s visible pixels are *all* `rgb(255,255,255)` against `backgroundColor: "#FFFFFF"`. | minutes | you |
| 3 | **The app icon is the Expo logo.** `app.json` `ios.icon` → `assets/expo.icon/`, whose only mark is `expo-symbol 2.svg` (the Expo chevron) on a `#007AFF` gradient — plus `grid.png`, a 45%-opacity design-guide grid that is a *live compositing layer*. | needs a real mark | you |
| 4 | **`lumo.fit` is registered to someone else.** `curl -sI https://lumo.fit` → `302 → https://domains.atom.com/lpd/name/lumo.fit` — a domain broker's for-sale listing. It is the hardcoded `SITE_URL` fallback (`web/lib/site.ts:3`) and the App Store **Support URL** (`APP_STORE_METADATA.md:23`). `veltai.app` is NXDOMAIN. You own neither. | needs a domain | you |
| 5 | **The in-app Privacy Policy and Terms are placeholders.** 17 sections read *"This section is being drafted with a legal adviser and is not final."* — including who operates the app. Linked from the signup gate and the paywall. | needs a lawyer | you |
| 6 | **Name split: the binary is Veltai, the entire UI is Lumo.** The camera sheet is the worst instance — the in-app rationale says "Lumo uses the camera…", the OS alert one tap later says "Veltai uses the camera…". Bundle id and slug cannot change after first upload. | one decision, then one pass | you |

**None of 1–6 is an environment variable.** No amount of key-filling fixes them.

Everything I *could* fix without a device or a live key, I fixed — see
[What I fixed](#what-i-fixed-this-pass). What remains blocking is exactly the
list above, and it is all yours.

### What is now true that wasn't

- `npx expo export --platform ios` completes: a 7.4 MB Hermes bundle.
  **This proves compilation and module resolution. It proves nothing else.**
- Every gate is green (below), and test counts went **up**, not down.

| Gate | Before | After |
|---|---|---|
| `npx tsc --noEmit` | clean | clean |
| `npx eslint src` | 0 errors / 20 warn | 0 errors / 21 warn |
| `npm test` | 370 tests, 22 suites | **402 tests, 24 suites** |
| `go build ./... && go vet ./... && gofmt -l .` | clean | clean |
| `go test ./... -count=1` / `-race` | 541 | **564** |
| web production build | clean | clean |
| `npm run check:assets` | *script did not exist* | exists, **exits 1 on 3 blockers** |

---

## How to read the status marks

| | Meaning |
|---|---|
| ✅ VERIFIED | I read the path end to end and proved the behaviour. |
| ⚠️ UNVERIFIABLE | Correct by inspection. Proving it needs a device, a real key, or a live service I do not have. |
| ❌ BROKEN | Defective. |
| 🚫 BLOCKED | Needs something only you can supply. |

**Read the [⚠️ list](#the--list--what-nobody-here-has-proven) before trusting any ✅.**
Most of this app is ⚠️. Nothing in this repo has run on an iPhone, against
Clerk, against RevenueCat, or against Gemini. What I *did* newly prove: the Go
backend's SQL, against a real PostgreSQL 17 with all 12 migrations applied.

---

## Compliance table

Evidence is `file:line` at the audited commit. "Fixed?" refers to this branch.

### Can it be built and uploaded

| Item | Status | Evidence | Fixed? |
|---|---|---|---|
| Icon 1024×1024 | ✅ | `assets/images/icon.png` — IHDR 1024×1024 | n/a |
| Icon has **no alpha** | ❌ | IHDR colour type **6** (RGB+ALPHA); `sips` `hasAlpha: yes` | **no — yours** |
| Icon is not a template | ❌ | `app.json:15` → `assets/expo.icon/icon.json` → `expo-symbol 2.svg` (Expo chevron), `grid.png` guide layer live in `layers` | **no — yours** |
| Splash visible on its background | ❌ | 19,820 visible px, *all* `rgb(255,255,255)`; `app.json:24-30` bg `#FFFFFF` | **no — yours** |
| Icon variants exist | ✅ | all `app.json` refs resolve on disk | n/a |
| `bundleIdentifier`/`version`/`buildNumber`/`scheme`/orientation | ✅ | `app.json:4,5,8,13,14` | n/a |
| `ITSAppUsesNonExemptEncryption` | ✅ | `app.json:17` | n/a |
| Production bundle builds | ✅ | `expo export` → 7.4 MB hbc | n/a |
| `eas.json` exists | ⚠️ | absent; `eas build:configure` generates it. Not a defect — a setup step | no |

### App Store Review Guidelines

Fetched live 2026-08-05: App Store Review Guidelines, subscriptions, and
user-privacy-and-data-use. Nothing materially changed against what is assessed
here; 5.1.1(v) account deletion and 5.1.2(i) third-party-AI consent both remain
as applied below.

| Guideline | Status | Evidence | Fixed? |
|---|---|---|---|
| **2.1** Completeness — no fabricated data | ❌→✅ | 12 instances; see [fabricated data](#fabricated-data--the-fifth-sweep) | **yes** (merge) |
| **2.1** Dead button: paywall silently no-ops if `react-native-purchases-ui` fails to load | ❌ | `src/app/onboarding/paywall.tsx` | no |
| **2.1** `/api/gym/template-exercises` routes 500 on **every** request | ❌→✅ | `backend/internal/gym/schedule_pg.go:309` — 22 cols, 23 Scan dests | **yes** |
| **2.3.1** No runtime-toggleable dev path | ✅ | `src/app/_layout.tsx:36-49` fails closed to a Configuration-error screen; `isDevEntitled()` = `isDevBuild() && …`, and Metro compiles `__DEV__` to `false` | n/a |
| **3.1.1** IAP is the only checkout | ✅ | RevenueCat only; no external payment URL anywhere in `src/` | n/a |
| **3.1.2** Trial length consistent | ✅ | 7 days everywhere, test-enforced | n/a |
| **3.1.2** Price/renewal/auto-renew disclosure | ⚠️ | delegated entirely to the remotely-configured RevenueCat paywall — **nothing in the repo proves what it renders** | no |
| **3.1.2** Terms + Privacy links work | ❌ | they resolve — to a document that disclaims itself (17 placeholders) | 🚫 lawyer |
| **3.1.2** Restore Purchases present | ⚠️ | present; reports "No purchases to restore" to a real subscriber when the SDK returns null | no |
| **4.8** Sign in with Apple | ✅ | offered alongside Google, listed first as primary — `src/app/onboarding/signup.tsx` | n/a |
| **5.1.1** Permission strings specific | ✅ | `app.json` declares camera only | n/a |
| **5.1.1** Every declared permission used | ⚠️ | true of `app.json`. **False of your local `ios/` tree** — see [the stale ios/ tree](#the-stale-ios-tree) | mitigated |
| **5.1.1(v)** Deletion in-app, few taps, destructive | ✅ | `src/app/profile/delete-account.tsx`; `backend/internal/auth/profile.go:82` `DELETE FROM profiles` + 25 `on delete cascade` FKs; Clerk identity deleted **first** (`profile.go:96-118`) | n/a |
| **5.1.1(v)** Cascade covers every user table | ⚠️ | 25 FK cascades cover the user tables; `oauth_states` + `rate_limit_counters` keep the Clerk id (no FK). **No test ever executes a DELETE** | no |
| **5.1.2(i)** Consent before third-party AI | ❌→⚠️ | `grep -rn consent backend --include=*.go` on `main` → **0 hits**. Gate was device-only against ~20 Gemini/Anthropic call sites | **yes** (merge) |
| **5.1.2(i)** Consent withdrawable | ❌ | no withdrawal short of deleting the account | no |
| **1.4.1** Calorie floor is safe | ❌→✅ | flat 1,200 for everyone; a 60y/40kg/150cm sedentary male derived 851 → floored to 1,200 | **yes** — sex-aware 1500/1200/1350 |
| **1.4.1** Disclaimer on every target surface | ❌ | absent from the dashboard, plan timeline and energy screen | no |
| **HealthKit** no capability, no entitlement | ✅ | `grep -c HealthKit ios/Veltai.xcodeproj/project.pbxproj` → 0; `appleHealth.ts` is a null-module stub imported only by its own test | n/a |
| **2.3.7 / 4.3** Name matches the binary | ❌ | Veltai vs Lumo — [full list](#the-veltailumo-list--your-decision) | 🚫 your call |
| **Support URL resolves to you** | ❌ | `lumo.fit` → broker for-sale page | 🚫 yours |

### Backend and data

| Item | Status | Evidence | Fixed? |
|---|---|---|---|
| 12 migrations, sequential, no gaps | ✅ | `supabase/migrations/` — I applied **all 12 to a real Postgres 17**, clean | n/a |
| Migrations are Supabase-only | ⚠️ | they need the `authenticated`/`service_role` roles and `auth.uid()`/`auth.jwt()`; nothing in the repo creates them. Correct for the documented target (`migrate.sh` says Supabase pooler; `DEPLOY.md:77` port 6543) but they will **not** apply to a vanilla RDS | no |
| No route lets user B touch user A's data | ❌→✅ | `POST /api/scan/confirm` wrote to any caller-supplied `scan_sessions` row — proven cross-user against real Postgres | **yes** |
| Nested-resource authz | ⚠️ | enforced in Go handlers, never in the mutating SQL (every UPDATE/DELETE keyed on id alone). The suite exercises an in-memory fake — which is why the 500 above shipped | partly |
| Rate limiting on paid endpoints | ⚠️ | Postgres-backed limiter, 10/min class AI. **No global spend cap**; worst case ≈600 paid AI calls/hour/account | no |
| Quota covers every paid AI endpoint | ❌→✅ | `/api/scan/label` wrote no `scan_sessions` row → unmetered Gemini for free users | **yes** |
| Server fails loudly on missing secrets | ⚠️ | fatal on `DATABASE_URL`; **degrades** on `ANTHROPIC_API_KEY` (serves canned text as if it were AI) | no |
| Seed data idempotent | ⚠️ | seeding failures are logged and ignored — the server serves happily with an empty exercise library | no |

---

## What I fixed this pass

Every fix carries a regression test. Nothing was fixed by weakening a check.

**1. Merged the unmerged remediation** (`8a2a1b7`). Brings onto this branch: the
12 fabricated-data fixes, the server-side `ai_consent` gate + its migration, the
onboarding-answers wiring, `scripts/check-assets.mjs`, `src/lib/appVersion.ts`,
and `noFabricatedData.test.ts`. I verified the fixes in code — e.g.
`userStore.ts` now gates its seed on `isDevBuild()` and a release build gets
empty strings; `useFoodSearch` now queries `/api/food/search`.

**2. Scan confidence banding — 4.1** (`8511fcb`). The client banded green ≥85 /
amber ≥60. The Go pipeline's positives sum to at most +65 and `single_angle` is
*always* −10, so a **perfect** single-angle scan scores exactly 55 and the
server labels it **"High"** — which rendered **red**. Green was mathematically
unreachable; a realistic photo (no plate detected) clamps to **0**, so the first
scan you take would have read "0% confidence" with a red dot. Banding now lives
in `src/lib/food/confidence.ts`, mirroring `confidence.go`, and the server's own
label wins when present. The badge reads "*High* confidence", not a percentage —
the score is a bounded points total and never was a probability.

**3. The "Why?" panel — 4.2** (`8511fcb`). It synthesised its factors from the
score while the server's real ones sat unread in the same payload. `breakdown`
was passed by **zero** callers, so the invented list rendered 100% of the time.
`scan.ts` now keeps `scan_results.confidence.{label,factors}` and they flow to
the badge, which renders the server's own messages and points. With no factors
it says so rather than inventing a breakdown. The comment claiming *"the backend
returns only a scalar 0..1 today"* was false and is gone —
`src/lib/api.ts` has typed `ScanConfidence.factors` the whole time.

**4. Three always-500 gym routes** (`d5b6388`). `GetTemplateExercise` appended a
JOIN and a 23rd Scan destination without widening the 22-column select list.
Adding, editing and deleting a template exercise were **100% broken**, and the
POST inserts *before* it reads, so every client retry appended a duplicate row.
It survived the whole suite because `tests/gym_schedule` substitutes an
in-memory fake and never executes the SQL. I added
`tests/gym_schedule/schedule_pg_sql_test.go`, which runs the real store against
a real Postgres — **I verified it fails on the old code** with the exact pgx
error and passes on the new. Skips unless `LUMO_TEST_DATABASE_URL` is set; the
file header documents the setup.

**5. IDOR on `POST /api/scan/confirm`** (`d5b6388`). Took a caller-supplied
`scan_session_id` and UPDATEd that row with no ownership check — user B could
point user A's session at B's food log. Its two siblings already checked. Fixed
in the handler (403/404, matching them) *and* by scoping the UPDATE by
`user_id`, so every caller of `SaveConfirmed` inherits the guard.

**6. Unmetered paid AI path** (`d5b6388`). `CountScansToday` counts
`scan_sessions` rows; `/api/scan/label` wrote none, so a free-tier user had an
unmetered billable Gemini path bounded only by the 10/min limiter. It now writes
a `label` row **before** the paid call, so failures count too.

**7. Unbounded token hang** (`ca78fbe`). `api.ts` advertises a per-request
deadline, but both Clerk token round-trips sat *outside* `withTimeout`.
`getToken()` hits Clerk's network whenever the cached JWT is stale — routinely —
so a captive portal hung **every** `api.*` call forever. The launch gate awaits
one, so the symptom was an infinite spinner on the first screen with no way out.
Both are now bounded (10s default).

**8. Offline queue flushed once per launch** (`ca78fbe`). The only flush site was
a mount effect, and the comments claiming a reconnect/foreground/screen trigger
were false. Lose signal → log meals → walk back into coverage → stuck on "N
changes waiting to sync" until a force-quit. Now also flushes on AppState
`active`.

**9. Sex-blind calorie floor** (`ca78fbe`). See the compliance table.

### A test I rewrote, and why

`noFabricatedData.test.ts` asserted `calories === 1200` for an empty profile of
**any** sex. That expectation encoded the defect — a flat 1,200 recommends the
female minimum to men. I corrected the behaviour, so the test moved with it and
now checks all three sexes plus the real body that hits the floor. **No
assertion was weakened**; the test got stricter. Added matching Go cases.

---

## The ⚠️ list — what nobody here has proven

This is the honest state of the product. It is longer than the fixed list.

**Nothing in this repo has ever run on an iPhone.**

- **Every screen.** 127 `.tsx` files. `npm test` runs in a **node environment
  with no React renderer** — there are **zero render tests** and the jest setup
  makes them impossible. Layout, safe areas, Dynamic Type, contrast, tap
  targets, keyboard avoidance, VoiceOver order, Reduce Motion: all read, none
  executed. A meaningful share of the 402 "tests" are substring greps over
  source text, not behaviour. I have not padded that number and you should not
  read it as coverage.
- **Clerk.** No key here. Sign-up, email OTP, Apple SSO, Google SSO, token
  refresh, private-relay email: never executed.
- **RevenueCat.** Needs a native build. The hosted paywall has **never
  rendered**, so every 3.1.2 disclosure — plan name, duration, renewal price
  prominence, post-trial behaviour — is unverified. Whether your dashboard's
  entitlement is literally `pro` and its trial literally 7 days, I cannot see.
- **Gemini / Anthropic.** No keys. Every AI path is inferred from types.
- **The camera.** Every scan flow, including all four fixes above.
- **The account-deletion cascade.** Asserted by a regex over SQL text. No test
  runs a `DELETE`.
- **React Compiler** is on and applied to the release bundle, with zero render
  tests to catch a miscompile.
- **`expo-auth-session`** pulls SDK-57 `expo-application`/`expo-crypto` pods into
  an SDK-56 app, and `signup.tsx` calls `startSSOFlow`. Pin it to `~56.x`.
- **Which migrations are applied where.** Nothing records it. There is **no CI**
  at all — the "verification baseline (must stay green)" is enforced by nothing.

### Known-broken, not fixed this pass

Ranked by what a tester hits first. All are ❌ with evidence in the audit trail.

1. **A confirmed scan writes TWO server rows.** The pipeline creates a
   `food_logs` row; `/api/scan/confirm` inserts a second. Nothing reconciles
   them, and the client's list call sends no status filter. **Your first scan
   double-counts its calories the moment the food tab refreshes.** For a calorie
   tracker this destroys trust fastest. Fix: have `/confirm` UPDATE the pipeline
   row, or carry `status` through `mappers.ts`.
2. **Discarding a scan doesn't delete the server row.** The rejected AI estimate
   reappears in your log, counted as eaten, on the next refresh.
3. **A camera failure logs three fabricated foods** (740 kcal) into today's diary
   with a "Scanning your meal…" toast. The merge gates the mock seed, but this
   path is separate — see the sweep below.
4. **Cold start never dispatches `COLD_START`.** The auth machine is dead code at
   runtime; routing is decided by two local flags and never consults Clerk's
   `isSignedIn`. A revoked session + stale flag drops you into the tabs, signed
   out, with no route out.
5. **Client poller gives up at 60s; the server is allowed 120s.** A slow scan
   shows "Couldn't analyse this photo" and then silently appears in the log.
6. **Non-queued writes lose data offline** — saved foods, log edits/deletes,
   quick-add, recipes, scan-confirm all bypass the offline queue.
7. **Sign-out purges queued writes** with no warning; one permanently-failing
   mutation blocks the queue forever (no max-retry, no poison path).
8. **6-hourly background rebuild** calls Anthropic for non-subscribers, bypassing
   the Pro gate and the rate limiter.
9. **With `ANTHROPIC_API_KEY` unset, AI features return canned text as if it were
   AI output** — the startup warning claims they 503.
10. **`GET /api/ai/brain` serves cuisine constants and goal targets as the user's
    *observed* eating patterns**, with no provenance flag.

---

## Prior documents I found to be wrong

Named, as asked. 243 findings were raised; 40 blocker/high were adversarially
re-checked and **15 were refuted** — I have excluded those rather than pad this.

| Document | Claim | Reality |
|---|---|---|
| `SUBMISSION_READINESS.md` | Describes 12 fabricated-data fixes as done | **True of its own branch, which was never merged.** On `main` every one was still live. The document is not even present on `main`. |
| `STATUS.md` | "Works (verified in code, test-covered)" — food logging incl. search, onboarding→targets, photo scan, multi-angle | False on `main`: search hit a mock catalog, onboarding answers never reached the user store, the scan Why-panel was synthesised |
| `STATUS.md` | `lumo.fit` is unregistered | **False.** Registered via GoDaddy, parked for sale, 302s to a broker |
| `STATUS.md` | "Remaining human actions" | Omits all three binary-asset blockers |
| `STATUS.md` | No feature is gated behind `pro` | False — server-side gating is implemented, wired and tested |
| `STATUS.md` | OAuth CSRF state is in-memory | False — it is a Postgres table |
| `STATUS.md` | Migration count | States both 12 and 11, eight lines apart |
| `CLEANUP_REPORT.md` | Expo-template assets were removed | **False** — the template icon survived and is the shipping icon |
| `SECURITY_AUDIT.md` | "No path lets user B touch user A's row" | **False** — `/api/scan/confirm`, proven cross-user against real Postgres |
| `SECURITY_AUDIT.md` | Rate-limit/replay state is per-process ("Not fixed") | Stale — both moved to Postgres |
| `SECURITY_AUDIT.md` | Scan-correction input "FIXED — bounded + validated" | The magnitude fed to the global table is not |
| `DECISIONS.md` | AI consent gates every AI endpoint call | False — the Food tab calls `/api/ai/insights` ungated |
| `DECISIONS.md` | Mock seeding is dev-only | **False on `main`** — it was unconditional module-level code in every build |
| `DECISIONS.md` | Rate-limit storage | Contradicts itself; "per-process by design" is false |
| `APP_STORE_METADATA.md` | Description asserts three capabilities | The code does not have them |
| `CONFIG.md:91` | `app.json` carries all permission usage strings | False — a prebuild silently drops ATS, HealthKit, Face ID, photo library |
| `LANDING_REDESIGN.md` | Its branch is not merged | It is |
| Three documents | App test counts | All three wrong |

**In-code comments that were false** (all now corrected or deleted): the
`ConfidenceBadge` header ("the backend returns only a scalar"); `_layout.tsx`
("screens can also trigger a flush"); `queue.ts` ("concurrent callers share one
run"); `scan.go` ("every paid Gemini call writes exactly one session row");
`src/lib/data/index.ts` ("screens never import from `@/lib/mock` directly" — nine
did). `src/lib/api.ts:201` claims a partial unique index backs idempotency —
**verify that migration exists before relying on replay**.

---

## Fabricated data — the fifth sweep

**Found, and it was extensive.** Twelve display-path instances were live on
`main`, all of them previously reported as fixed by a document sitting on an
unmerged branch.

How I looked, so you can judge the coverage:

1. Read `src/lib/mock/data.ts` and `ai.ts` in full and inventoried every
   exported **value**.
2. Traced each value's imports, distinguishing `import type` (harmless) from
   value imports, to a render path.
3. Read the whole data seam (`hooks/userStore/gymStore/foodStore/scan/mappers/
   mutations/aiBrain`) and asked, per hook: what does a brand-new user see with
   a working backend, and with an unreachable one?
4. Traced all 60+ route files to a data source.
5. Grepped `src/` and `web/` **outside** `lib/mock` for hardcoded plausible
   values: names, emails, ratings, testimonials, user counts, kcal/gram
   integers, streaks, ISO and "Today"/"Yesterday" date literals, percentages.
6. Read `i18n/locales/*`, `legal/`, and every `web/` component rendering a
   number or a name.

What was live on `main` — the user saw all of this as **their own data**:

- **"Bilal Ahmed" / bilal.ahmed@example.com** on the Account screen, for every user.
- **82 kg / 178 cm / 28-year-old male** body metrics — *driving every calorie and macro target*.
- **1,300 kcal of meals they never ate** on the dashboard at cold start (no fetch at all).
- **A 13-day streak, 21 longest, 47 total gym days** on a brand-new account.
- **A 30-day gym calendar** ("24 sessions, 1 freeze") that was never hydrated.
- **A "Next 7 days"** of hardcoded June dates — with a *tappable freeze* that protected an invented day.
- **An "AI daily plan" and its "why this plan" narrative**, hardcoded, badged as AI output, citing sleep data Lumo does not collect.
- **Food search** returning an 8-item hardcoded catalog with invented kcal, and its first three entries as "recents".
- **A 6-day meal history** with a fake loading skeleton and a refresh that changed nothing.
- **18 g of fibre consumed**, always, for everyone — read aloud by VoiceOver as fact.
- **Three invented foods logged after a *failed* camera capture.**
- **Invented macros attributed to a real brand (Chobani)** from a one-row barcode table.

Merging the remediation fixes these: the stores gate their seed on
`isDevBuild()`, release builds start empty, and `noFabricatedData.test.ts` fails
if any returns.

**Still fabricated after the merge, and fixed by me:**

- **The scan "Why?" panel** invented every line behind the product's central
  honesty claim — "Food identified +55" printed even when the pipeline fell back
  to "Unknown food". Fixed (#3 above).

**Still fabricated after the merge, NOT fixed — these need your call:**

- **The camera-failure path** still logs three fabricated foods on a real device.
- **Multi-angle scans display "Angles agree 100% — estimate refined from
  multiple shots"** when no reconciliation happened.
- **The pipeline manufactures a plausible "Unknown food" weight** when Gemini
  errors or returns unparseable JSON, and reports it as a successful scan.
- **`GET /api/ai/brain`** serves cuisine constants as observed eating patterns.
- **The marketing site's meta description** — on all 9 pages — ships *"calorie
  estimates with confidence ranges"*, a feature the app explicitly does not
  have. The site's own anti-fabrication guard is structurally blind to meta tags
  and JSON-LD, which is exactly where it lives.
- **A block explicitly typed `verified`** in the published privacy policy claims
  users can view and correct their body metrics in-app. No such screen exists.
- **Onboarding claims "40+ more" pre-loaded cuisine foods.** The library holds 17.
- **A notifications settings screen** with five toggles and quiet hours — the app
  has no notification system, and the site advertises that it sends nothing.

**Explicit negative results:** no testimonials, star ratings, user counts, press
claims or review text anywhere in `src/` or `web/`. `i18n` locales are clean
(fr/es are partial and fall back to English).

---

## The stale `ios/` tree

Your working copy has an `ios/` directory. It is **gitignored** (`.gitignore:17`)
and has **never been tracked** — so the *repo* is clean, and a fresh clone or
`expo prebuild --clean` produces an `Info.plist` with only
`NSCameraUsageDescription`.

Your local tree is not clean. `ios/Veltai/Info.plist` declares **six** usage
strings — adding Face ID, **Apple Health (read and write)**, microphone and photo
library, for features that do not ship. One literally reads *"Reserved for future
use."* It also carries an `aps-environment` entitlement with no push code.

Which plist wins, from the installed SDK 56 sources:

| Command | Result |
|---|---|
| `expo run:ios` (= `npm run ios`) | **ships all six** — prebuild is skipped when `ios/` exists |
| `expo prebuild` (no `--clean`) | Health / Face ID / photo library **survive** (app.json merges *on top*, never removes) |
| `expo prebuild --clean` | **clean** — camera only |
| `eas build` (cloud) | clean — but there is no `eas.json` yet |

**Do this before any build: `npx expo prebuild --clean -p ios`.** Treat `ios/`
as disposable. That tree also predates RevenueCat — `grep -c RNPurchases
ios/Podfile.lock` → 0 — so archiving it cannot produce a working IAP build
anyway.

Also: `app.json` declares `NSCameraUsageDescription` **twice** (`:18` and `:35`);
the plugin one wins and `:18` is dead config.

---

## The Veltai/Lumo list — your decision

I have **renamed nothing**. A bundle-id change is destructive to App Store
identity, so this is one conscious decision, made once, before you upload.

**Destructive after first submission — decide before you ship:**

| Where | Value |
|---|---|
| `app.json:13` | `ios.bundleIdentifier: "app.veltai.veltai"` |
| `app.json:4` | `slug: "veltai"` (EAS project identity) |

**User-visible:**

| Where | Value |
|---|---|
| `app.json:3` | `name: "Veltai"` → the home-screen label |
| `app.json:18`, `app.json:35` | camera permission strings say "Veltai" |
| `ios/Veltai/Info.plist:9` | `CFBundleDisplayName` = Veltai *(regenerated)* |
| `src/app/food/photo-capture.tsx:91`, `barcode-scan.tsx:66`, `label-scan.tsx:230` | in-app rationale says **"Lumo uses the camera…"** immediately before the OS alert says **"Veltai uses…"** |
| 59 occurrences of "Lumo" across `src/` | onboarding hero, `about`, `done` toast, paywall, subscription, signup, "Ask Lumo", legal screens |
| `APP_STORE_METADATA.md:6` | "Lumo — Calorie & Workout Tracker" |
| All legal docs, the AI-consent dialog, the health disclaimer | say "Lumo" |
| `web/` marketing site | Lumo throughout |

**Internal plumbing** (safe to change any time, invisible to users):

| Where | Value |
|---|---|
| `app.json:8` | `scheme: "veltai"` — but see the OAuth note below |
| `package.json:2` | `"name": "veltai"` |
| `src/lib/storage/secureStore.ts:6,8,9` | key prefix `veltai.*` — **changing this orphans existing local flags** |
| `src/lib/ai/consent.ts:8` | key `lumo.aiConsent` (already Lumo — inconsistent with the above) |
| `backend/internal/integrations/integrations.go:238` | `LUMO_APP_SCHEME` default `"veltai"` |
| `backend/go.mod:1` | `module lumo/backend` |
| `deploy/systemd/lumo-api.service` | unit name `lumo-api`; `Documentation=…/VeltAI` |
| `src/lib/design/tokens.ts:1`, `GymSessionButton.tsx:2`, `support.tsx:3`, `appVersion.ts:24` | comments |

**Note:** the storage prefix is `veltai.*` while the AI-consent key is
`lumo.aiConsent`. Whichever name you pick, unify these in the same pass.

---

## What only you can do

1. **Decide the name** — Veltai or Lumo. Everything else waits on this. It is
   destructive after the first upload.
2. **Register a domain you actually own.** `lumo.fit` belongs to a third party
   and is listed for sale; `veltai.app` does not exist. Set
   `NEXT_PUBLIC_SITE_URL` at build time and change the `web/lib/site.ts:3`
   fallback to fail loudly instead of pointing at a stranger.
3. **Commission a real app icon.** 1024×1024, **no alpha channel**, no
   pre-rounded corners, not the Expo mark. Then delete the `grid` layer from
   `assets/expo.icon/icon.json` and the file `assets/expo.icon/Assets/grid.png`.
4. **Fix the splash** — a mark that contrasts with its background, or change the
   background.
5. **Get the Privacy Policy and Terms finished by a lawyer.** 17 sections
   currently disclaim themselves, including who operates the app. You collect
   health data; this is not optional.
6. **Supply the keys** — Clerk, RevenueCat, Gemini, Anthropic — so the ⚠️ list
   can start becoming ✅.
7. **Configure the RevenueCat paywall** and confirm it renders plan name,
   duration, **renewal price as the most prominent element**, post-trial
   behaviour and auto-renew terms. Confirm the entitlement is literally `pro`
   and the trial literally 7 days.
8. **Run `eas build:configure`** (or archive from a clean prebuild).
9. **Create a demo account for App Review** — the app requires login and there
   is none.
10. **Apply the migrations** to your Supabase project and record which are
    applied. Confirm the exercise-library seed actually ran — seeding failures
    are currently logged and ignored, and an empty library breaks the gym feature
    silently.
11. **Set a billing cap on the Gemini and Anthropic accounts.** There is no
    global spend cap in the code; one authenticated user can drive ~600 paid
    calls/hour.
12. **Decide on the ten known-broken items above** — particularly the
    double-counted scan, which will be visible within minutes of your first test.

---

## Reproducing this audit

```bash
npm run check:assets                 # 3 blockers, exits 1
npx tsc --noEmit && npx eslint src && npm test
cd backend && go build ./... && go vet ./... && gofmt -l . && go test ./... -count=1 && go test ./... -race
cd web && npm run build
npx expo export --platform ios       # compilation only
```

The real-SQL backend tests need a database:

```bash
createdb lumo_gate_test
psql -d lumo_gate_test -c "CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS text LANGUAGE sql STABLE AS \$\$ SELECT current_setting('request.jwt.claim.sub', true) \$\$; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS \$\$ SELECT '{}'::jsonb \$\$;"
for f in supabase/migrations/*.sql; do psql -q -d lumo_gate_test -v ON_ERROR_STOP=1 -f "$f"; done
cd backend && LUMO_TEST_DATABASE_URL=postgres:///lumo_gate_test go test ./tests/gym_schedule/ -run PG -v
```

See `FIRST_HOUR.md` for what to test on the device, in order.
