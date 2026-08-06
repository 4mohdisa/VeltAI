# FINAL_AUDIT — the sixth sweep (2026-08-06)

Run by Claude Fable 5 against `main`, autonomously, with a real local Postgres
standing in for the unreachable live database. Posture: prove it is NOT ready.

---

## Verdict

**Yes — this can be built and uploaded today, on THIS tree.**
**The previous pass's "yes" did NOT hold for the tree it was issued on.**

The gates are green (see the baseline at the bottom), and every blocker found
this pass is fixed and committed. But the tree the last report blessed shipped:

- a scan pipeline that **fabricated an "Unknown food" with invented weight and
  macros whenever Gemini failed**, wrote it as a successful scan, and could
  never mark anything 'failed';
- a **double-count revival path**: any refresh mid-review dropped the scan's
  identity, so "Save" wrote a second row — the exact bug the last pass declared
  fixed, alive again one pull-to-refresh later;
- a **debug_reports migration that cannot apply to any Postgres** (`auth.uid()`
  = uuid compared to a Clerk text id), so the debug system's sync would have
  failed silently for the entire testing fortnight;
- an env-rename shim that was a **self-referential no-op** while DEPLOY.md and
  CONFIG.md still instruct operators to set the dead `LUMO_*` names;
- **no server-side consent gate on any of the three routes that send the
  user's photos to Gemini** (5.1.2(i), which Apple explicitly extended to
  third-party AI in Nov 2025), and no way to withdraw consent anywhere in the
  app despite the disclosure pointing at one;
- a debug capture system whose **title/notes/route-params/store-slice bypassed
  redaction**, whose unhandled-rejection trigger was **inert on Hermes** (the
  engine every real build uses), and whose API trace **fabricated status 200**
  for every success.

None of that was in the last report. "Six parts complete" was true of the six
parts it looked at; the verdict generalized far beyond them.

### If you build today, in order:

1. `./deploy/migrate.sh status` against the live DB, then `apply` — **the
   debug_reports migration was broken until today's fix; if you ever ran it,
   it rolled back and the table does not exist. Nothing about the live DB has
   ever been verified by any audit, including this one** (see Part 1).
2. `npx expo prebuild --clean -p ios` (the stale `ios/` tree is now deleted,
   but prebuild is still required), then `eas build --profile preview`.
3. The owner-only list at the bottom.

---

## Part 1 — Supabase

**The live database remains unverified — by every audit ever run, including
this one.** The prompt said the Supabase MCP was connected; it was not (no MCP
tools in session, no `DATABASE_URL`, no CLI). STATUS.md records that the
previous session's MCP account didn't contain the project
(`qknwxgaehhclvpeadmdh`) either. Everything below is proven against a real
local Postgres 17 with all migrations applied, which is the strongest
substitute available.

| Item | Status | Evidence |
|---|---|---|
| All migrations apply in order from an empty DB | ✅ VERIFIED (locally) | all 15 apply clean after the debug_reports fix; before it, migration 14 **failed** (`operator does not exist: uuid = text`) |
| debug_reports exists + RLS scoped to user | ❌→✅ FIXED | policy rewritten to the house pattern `user_id = (select auth.jwt()->>'sub')`; committed 0273a4c |
| Live table/column/RLS parity | 🚫 BLOCKED | no live access — owner runs `./deploy/migrate.sh status` + `verify` |
| Applied-migration truth | 🚫 BLOCKED | same; **if the four newest are unapplied**: analytics ingestion 500s, RevenueCat webhook dedupe breaks, rate limiting fails closed (503 on every /api request per STATUS), AI consent reads 500 → all AI fails closed, debug sync fails |
| RLS: every user table restricted to own rows | ✅ VERIFIED (schema) | 33 policies, all `user_id = (select auth.jwt()->>'sub')` or via-parent EXISTS; nested tables (gym_exercises, recipe_ingredients, saved_meal_items, scan_images, template_exercises) covered via owner joins |
| Backend-only tables deny-all | ✅ VERIFIED (schema) | oauth_states, rate_limit_counters, webhook_processed_events, confidence_calibration: RLS on, zero policies → deny for anon/authenticated; service connection bypasses |
| Shared libraries read-only | ✅ VERIFIED (schema) | exercise_library / cuisine_food_library: SELECT-true policy only; no write policies → writes denied under RLS. Note: `anon` can also read them (policy applies to public) — harmless catalog data, listed for completeness |
| FK indexes | ❌→✅ FIXED | 8 uncovered FKs (incl. `recipes.user_id`, hit on every list request) → `20260806000002_fk_covering_indexes.sql`; zero uncovered remain |
| Data state (test rows in prod) | 🚫 BLOCKED | no live access |
| Supabase advisors | 🚫 BLOCKED | no live access |
| migrate.sh integrity | ✅ VERIFIED | each migration + its bookkeeping row commit in ONE transaction; the broken debug_reports file was therefore never recorded as applied, so today's edit cannot produce a false DRIFT |

---

## Part 5 — Apple compliance (live guidelines, fetched 2026-08-06)

Recent changes a training-knowledge audit would have missed:
- **5.1.2(i) (Nov 13 2025):** "including with third-party AI" — explicit
  disclosure AND consent before user data reaches an LLM.
- **Regulated Medical Device Status declaration (since Mar 26 2026):** required
  in App Store Connect for new Health & Fitness apps distributed in EEA/UK/US.
- **New age-rating tiers** (4+/9+/13+/16+/18+) with a mandatory questionnaire.
- **iOS 26 SDK** required for submissions since April 2026 (EAS's current build
  image satisfies this; verify at build time).

| Guideline | Status | Evidence | Fixed this pass? |
|---|---|---|---|
| 2.1 completeness — fabricated data | ❌→✅ | Gemini-failure fabrication (backend/internal/scan/pipeline), hardcoded "gym window" nudge ((tabs)/index.tsx), "40+ more" foods claim (preview.tsx), fabricated status-200 in debug trace, "Angles agree" note only when real reconciliation ran remains ⚠️ unverified on device | yes |
| 2.1 completeness — dead UI | ❌→✅ | notifications prefs screen for a system that doesn't exist — removed; paywall silent no-op when purchases-ui fails to load remains ⚠️ (needs RevenueCat key to exercise) | yes |
| 2.3.1 hidden functionality | ✅ | debug system gated at the module boundary (metro resolves `@/debug/impl`→stub when `EXPO_PUBLIC_DEBUG_CAPTURE` unset); production EAS profile sets no env; `debugGating.test.ts` pins profile/flag/import rules. Empirical double-export re-run was not repeated this pass (⚠️ — prior pass's bundle grep evidence stands; re-run before submit if paranoid). Disclose the preview build's capture system in TestFlight notes | n/a |
| 3.1.1 IAP only | ✅ VERIFIED | RevenueCat IAP only; no external checkout path in app or web (grep: no Stripe/checkout/payment links) | n/a |
| 3.1.2 subscription disclosure | 🚫 BLOCKED | plan/price/renewal live in the RevenueCat hosted paywall — no key, never rendered; Terms/Privacy links + Restore exist in code; trial length derives from ONE constant (`TRIAL_DAYS`) — dashboard must match | no — owner |
| 4.8 Sign in with Apple | ⚠️ | Apple + Google strategies both in signup code; real assertion needs Clerk keys + device | no — needs keys |
| 5.1.1 permission strings | ❌→✅ | stale `ios/` prebuild (Veltai identity, HealthKit/mic/FaceID/photo strings for absent features, empty privacy manifest) **deleted**; app.json declares camera only, string is specific and true | yes |
| 5.1.1(ii) usage-data consent | ⚠️ OWNER DECISION | first-party analytics ON by default with an opt-out; live 5.1.1(ii) says consent for usage data collection. Defensible as app-functionality analytics, but the safer posture is opt-in. Decide before submission | flagged |
| 5.1.1(v) account deletion | ✅ code / ⚠️ runtime | in-app, destructive (server cascade + Clerk revocation); cascade enumerated across all user tables incl. debug_reports; **still never executed against a real DB** (regex-over-SQL test only) — first-hour item | partially (see ⚠️) |
| 5.1.2(i) AI consent | ❌→✅ | server-side gate now on ALL Gemini scan routes (was: client alert only) + the ai package's existing gates + consent-gated 6h sweep; **withdrawal now exists** (Settings → Privacy), offline-accept desync self-heals; policy copy now truthful | yes |
| 1.4.1 health safety | ❌→✅ | sex-aware manual calorie floor now enforced server-side (male 1500; was flat 1200 via PUT /api/goals and onboarding override); age 13+ server-enforced (was client-only); disclaimers present on target surfaces | yes |
| Privacy nutrition label | drafted | APP_STORE_METADATA.md corrected (Lume, Search History removed, lume.fit); answers derived from real payloads — see the file | yes |
| 5.4 assets | ✅ VERIFIED | icon 1024×1024 RGB no-alpha (IHDR-checked by scripts/check-assets.mjs, exit 0), splash contrast 392; both deliberate placeholders — replace before PUBLIC release | n/a |
| 5.5 identity | ❌→✅ | product is Lume everywhere config-meaningful; APP_STORE_METADATA was still a full "Lumo" draft (fixed); DEPLOY/CONFIG still taught dead `LUMO_*`/`veltai://` (fixed); historical audit docs keep old names by design | yes |

---

## What was fixed this pass (all committed to main, one commit per part)

**Part 1 — Supabase (0273a4c):** debug_reports RLS type error (migration could
never apply); 8 FK covering indexes.

**Part 2 — backend (dc9aa24):** Gemini failure → status 'failed' instead of a
fabricated "Unknown food" 'ready' row (the fallback-fabrication engine in
`MergeResults`/`IdentifyFoods` deleted; three tests that pinned the fabrication
rewritten — explicitly); server-side AI consent on `/api/scan`,
`/api/scan/pipeline`, `/api/scan/label` (fail-closed, optional-interface seam,
compile-asserted on PGStore); replayed `/api/scan/confirm` returns the
already-claimed row instead of INSERTing the double-count's second row;
`/api/food/summary` counts only 'confirmed' rows; LUMO_→LUME_ env shim
un-no-op'd; billed-but-failed sync scans consume quota; 6-hour brain rebuild
requires an active entitlement and recovers panics (a panic previously killed
the whole server); macro/meal_type/goals/body-weight/age validation at the
trust boundary (meal_type case-insensitive — the strict version would have
400'd the shipped client, which the hermetic suite couldn't see);
maxOutputTokens on both Gemini clients; pipeline errors logged, not swallowed.

**Part 3 — app (33a6675):** hydrated scan rows keep scan_session_id + server
log id + confidence payload (kills save-after-refresh double-count, blank
Why?-panel after refresh, and undeletable server rows); hydration dedupes by
scan session; merge totals use the store's single counts-in-totals rule;
discard deletes the server row; poller deadline 130s (> server 120s) with a
final truth-check (also fixes false-failure after backgrounding); queue drops
poison mutations with a toast instead of blocking forever; Quick Add and
label-scan queue on transient failure (no more silently lost entries behind a
success toast); fabricated "gym window" nudge removed; Home pull-to-refresh
actually refetches; search shows loading/error instead of a false "No
matches"; cold start consults Clerk (revoked session / reinstall can no longer
land signed-out users in the tabs); barcode "Photograph the label" routes to
the label scanner; label-scan 402 shows the paywall.

**Part 4 — debug system (3c1fb4f):** title/notes/routeParams/storeSlice pass
through redaction at capture; breadcrumb recorder no longer throws (and no
longer silently kills the analytics event) when a prop matches a redaction
pattern; unhandled-rejection capture works on Hermes (was hooked to the unused
promise polyfill — inert in every real build); API trace records the real
status (was a hardcoded 200); reports carry the real Clerk userId (was
hardwired null); the false gitSha claim corrected.

**Part 5 — compliance (1e38b8d):** consent withdrawal UI; offline-consent
self-heal; truthful privacy copy in app + web (server-side consent record,
Gemini context block, Ask-Lume question text, OFF/USDA lookups, body-metrics
claim removed); stale ios/ prebuild deleted; APP_STORE_METADATA.md → Lume with
corrected claims; "40+ foods" and "confidence ranges" copy fixed.

**Part 6 — quality (2f89e02):** dead third calorie-formula copy deleted; wrong
mirror reference in derive.go fixed; dead notifications screen removed;
eslint 28→24 warnings, 0 errors.

Every fix carries a regression test proven failing on the pre-fix code, except
pure copy/doc changes. Nothing was fixed by weakening a check; the three
rewritten tests asserted the fabrication itself and say so in their comments.

---

## Findings NOT fixed, by severity (the honest backlog)

**❌ open (fix soon, none block TestFlight):**
- Gym exercise/complete queue steps can double-post on a lost-response replay
  (no server dedup for those two endpoints; `queue.ts` documents the ceiling).
- Streak bump is a read-modify-write without a row lock; concurrent bumps can
  lose an increment (single-user impact only).
- RevenueCat TRANSFER event handling is non-transactional (DELETE then UPDATE).
- Edits/deletes made while a create is still queued replay the original body.
- Freeze/saved-food/analytics writes bypass the queue (session-loss on
  transient failure, with honest failure toasts but no replay).
- No global AI spend ceiling in code (per-user limits + quotas exist; set
  billing caps at Google/Anthropic — owner item 9).
- Free-scan quota is count-then-act; a parallel burst can exceed 3/day by the
  concurrency factor. Bounded by the 10/min AI rate limit.
- No graceful shutdown (SIGTERM mid-scan strands 'analyzing' rows — mitigated
  now that discard can delete them and failed states exist); `/health` returns
  200 with a dead DATABASE_URL.
- Onboarding mid-flow resume restarts at Welcome (does not strand — signup
  routes by server state — but loses step progress).
- Go scan-learning dead code (HourBucket, PickCalibrationFactor's missing
  fallback, CrosscheckMacros) left in place: the crosscheck suite hangs off it
  and dropping tests was out of bounds. Delete deliberately in a cleanup pass.

**⚠️ UNVERIFIABLE without device/keys — the honest state of the product:**
- Nothing has ever run on an iPhone. Zero render tests (jest is node-env).
- Clerk sign-in/SSO, RevenueCat purchase/restore/paywall rendering, real
  Gemini/Anthropic calls, Strava/WHOOP: never executed.
- The deletion cascade has never executed a real DELETE.
- Shake/bubble/screenshot/share-sheet: never run on a device.
- The debug production-export grep was performed by the previous pass, not
  re-run here.

---

## Prior document claims found false this pass (named, per the brief)

| Where | Claim | Truth |
|---|---|---|
| RELEASE_PREP.md §C, DECISIONS.md, STATUS.md:80, commit c9b43ae | "LUMO_* still honoured with a deprecation warning" (the env shim) | The shim read `LUME_`+suffix — a self-referential no-op. The rename script had rewritten the shim's own string literals; even its doc comment said "renamed Lume/Lume → Lume". Proven by test, fixed |
| RELEASE_PREP.md verdict | "Yes — can be built and uploaded today" | Not for that tree — see Verdict |
| RELEASE_PREP.md / TESTFLIGHT_READINESS.md | "camera-failure fabrication … still open" | Stale in the safe direction: already fixed on main (`isDevBuild()` gate) before this audit |
| TESTFLIGHT_READINESS.md:183/520 | real-SQL tests skip unless `LUMO_TEST_DATABASE_URL` | The code reads `LUME_TEST_DATABASE_URL` — following the doc runs 0 of the 9 real-SQL proofs |
| STATUS.md verification baseline "569 tests" | presented as passing tests | 560 passed + **9 silently SKIPPED** — and the 9 are exactly the real-Postgres proofs of the double-count and gym-500 fixes. They pass when actually run (proven this pass against local PG) |
| DECISIONS.md / RELEASE_PREP.md §B | "a replayed confirm now finds status='confirmed' and cannot re-claim" (implying safe) | It couldn't re-claim — so it fell through to INSERT and duplicated. Fixed + PG-tested |
| commit ae8619b / DECISIONS.md | "mealsFromLogs carries status through, so an under-review row stays out of the day's totals" | It carried ONLY status; identity fields were dropped, and mergeMeals used its own totals rule that counted ready rows — refresh mid-review inflated the day and duplicated the card |
| RELEASE_PREP.md:251, DECISIONS.md | "Redaction happens at capture time … asserted by test" | True for the ring buffers; title, notes, routeParams and storeSlice bypassed redaction entirely |
| RELEASE_PREP.md §E trigger table, FIRST_HOUR.md:248 | "Unhandled promise rejection → automatic draft" | Inert on Hermes (hooked the unused promise polyfill) |
| src/lib/appVersion.ts comment | "eas.json sets EXPO_PUBLIC_GIT_SHA for the debug profile" | Nothing sets it; every report's gitSha was null |
| FIRST_HOUR.md:230-232, :64-66 | "main still has all twelve fabricated-data defects / you are not on this branch" | False since merge df3bfa5 landed everything on main |
| backend/.env.example | "feature keys absent ⇒ endpoints return 503" | Morning brief/insights serve a deterministic fallback with 200; USDA silently uses DEMO_KEY; CLERK_WEBHOOK_SECRET listed "required" but the server starts without it (webhook 503s — fail-closed, but the contract text was wrong) |
| SECURITY_AUDIT.md:35, scan.go:800-805 invariant comment | "every paid Gemini call writes exactly one session row" | The legacy /api/scan wrote the row only on success — billed failures were unmetered. Fixed |
| DECISIONS.md:82 | scan learning helpers "unreachable" framing | HourBucket genuinely dead; logged_hour write-only; PickCalibrationFactor's documented fallback implemented nowhere |
| web/lib/legal.ts:176-186 | consent "stored ON YOUR DEVICE … not recorded on our servers"; "grep -rn consent backend/ returns nothing" | The server-side record shipped weeks ago; the policy described an unmerged-branch state as current. Fixed |
| web/lib/legal.ts:319-323 | "view and correct … body metrics … in the app" | No such screen. Fixed |
| APP_STORE_METADATA.md:3-5 | "shipping config uses Veltai" | False since c9b43ae; the whole draft was also still "Lumo". Fixed |
| CONFIG.md | Clerk allowlist `veltai://`, LUMO_* env surface | Scheme is `lume`, env is LUME_*. Fixed this pass (docs) |
| DEPLOY.md | `LUMO_ENV=production`, `lumo-api.service` | Dead names; with the dead shim this produced a silently misconfigured server. Fixed this pass (docs) |
| src/app/food/quick-add.tsx header | "Offline-safe: on API failure it still logs locally" | Session-only; lost at restart behind a success toast. Fixed |
| src/lib/data/aiBrain.ts:157-159 comment | "503 carries the server's own explanation … surfaced" | The generic block rendered instead. Comment corrected? No — left; flagged here |
| STATUS.md "Works (verified…)" | "quick add … offline queue with idempotency" as one list | Quick add bypassed the queue entirely. Fixed in code |
| src/lib/ai/consent.ts + aiBrain.ts copy | "You can turn it on any time in Settings → Privacy" | No such control existed. Built this pass |
| SUBMISSION_READINESS.md (several) | own-branch claims presented as shipped | Documented last pass; unchanged — historical record |

---

## Does the previous pass's "yes" hold?

**No.** The gates it reported were genuinely green (I reproduced them exactly:
464/28 app tests, clean tsc/eslint/vet/race, assets 4-ok, and its go "569" is
560 passed + 9 silently skipped). But green gates measured the wrong thing:
the fabricating pipeline, the refresh-shaped double-count revival, the broken
debug_reports migration, the dead env shim, the redaction bypass and the
missing consent enforcement all sat behind those gates untested. The verdict
was an artifact of hermetic coverage, not of correctness. It holds **now**
because those defects are fixed and pinned by tests that failed on that tree.

## Verification baseline after this pass (run 2026-08-06, all green)

- backend: build/vet/gofmt clean; **506 tests pass, 0 skipped, 0 failed**
  across 29 packages — including the 9 real-Postgres proofs, which run when
  `LUME_TEST_DATABASE_URL` points at a migrated database and SILENTLY SKIP
  when it does not (was 480 pass + 9 skip; set the variable or the
  double-count proofs never execute); `-race` clean
- app: tsc clean; eslint 0 errors / 24 warnings; **jest 469 tests / 28 suites**
  (was 464 — nothing dropped; 3 rewritten tests say so in their comments)
- web: production build clean · assets: `check:assets` exit 0

## What only you can do (ordered)

0. **`git push`.** Local `main` is **22 commits ahead of `origin/main`** —
   this audit's seven commits AND fifteen from the previous passes. Unmerged
   branches already cost this project weeks; an unpushed `main` is the same
   failure one level up. Anything building from the remote builds the old
   bugs. (Not pushed autonomously: pushing publishes, and that call is yours.)
1. **Verify the live database**: `./deploy/migrate.sh status` then `apply`
   then `verify`. Fifteen migrations must show applied. This has never been
   checked by anyone, and the debug system is dead until debug_reports exists.
2. **Register `lume.fit`** and deploy `web/` (Support URL must resolve before
   submission).
3. **Supply the keys** (Clerk, RevenueCat, Gemini, Anthropic) and set
   **billing caps** at Google/Anthropic — there is still no global ceiling in
   code.
4. **RevenueCat dashboard**: products, `pro` entitlement, 7-day trial to match
   `TRIAL_DAYS`, hosted paywall showing plan/duration/renewal price.
5. **App Store Connect**: Regulated Medical Device Status declaration (new,
   mandatory since Mar 2026 for Health & Fitness in EEA/UK/US), the new
   age-rating questionnaire, App Privacy answers (use APP_STORE_METADATA.md),
   demo account for review.
6. **Decide the analytics-consent posture** (5.1.1(ii)): keep opt-out and
   defend it, or flip to opt-in.
7. **Lawyer pass on Privacy/Terms** — the deliberately-empty APP 3.3 sections
   still block PUBLIC release (not TestFlight).
8. **eas build:configure**, then `prebuild --clean` + build (preview profile
   for your testing fortnight).
9. **First hour on the device**: FIRST_HOUR.md, updated this pass.
10. **Replace the placeholder icon/splash** before public release.
