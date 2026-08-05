# Lume — release prep

**2026-08-06. All work is on `main`.** Six commits, one per part, each
independently revertible.

---

## Verdict

**Yes — this can be built and uploaded today.** Every blocker that made the
previous answer "no" is closed, and the four gates are green:

| Gate | Before | Now |
|---|---|---|
| `npx tsc --noEmit` | clean | clean |
| `npx eslint src` | 0 errors | **0 errors**, 28 warnings |
| `npm test` | 370 / 22 suites | **464 / 28 suites** |
| `go build ./... && go vet ./... && gofmt -l .` | clean | clean |
| `go test ./... -count=1` and `-race` | 541 | **569**, race clean |
| `cd web && npm run build` | clean | clean |
| `npm run check:assets` | *script didn't exist* → 3 blockers | **exit 0**, 0 blockers |

Test counts went **up** at every step. Nothing was fixed by weakening a check.

What is still ⚠️ is at the bottom, and it is the same honest list as before: no
key has been supplied, so nothing has run against Clerk, RevenueCat or Gemini,
and there are still zero render tests. **The app compiles, its logic is tested,
and its blockers are cleared. It has not been used.**

---

## A. The merge

**Only two branches were ever unmerged**, and one contained the other:

| Branch | Ancestor of `main`? | Contents |
|---|---|---|
| `audit/testflight-gate` | **no** — 9 commits | Everything below, plus the confidence/gym/IDOR/quota/token/queue/floor fixes |
| `audit/submission-readiness` | **no** — contained in the above | 12 fabricated-data fixes, the AI-consent gate, the onboarding wiring |
| `cleanup/repo-sweep` | yes | already in |
| `deploy/aws-hardening` | yes | already in |
| `web/landing-redesign` | yes | already in |
| `web/legal-scaffold` | yes | already in |
| `work/outstanding-security` | yes | already in |

So Part A was **one merge**, not five. The other four branches in the brief were
already ancestors of `main`; merging them would have been a no-op, and I did not
make empty merge commits to look busy.

**Verified present on `main` by opening the code, not by trusting the merge:**

- `src/__tests__/noFabricatedData.test.ts` — exists, **16 tests pass**
- `scripts/check-assets.mjs` — exists, wired as `npm run check:assets`
- `supabase/migrations/20260731000001_ai_consent.sql` — exists; `consent` now has
  **82 hits** in Go (it had **0** on `main` before)
- Confidence bands — `src/lib/food/confidence.ts` mirrors the Go thresholds;
  `ConfidenceBadge.tsx` contains **zero** `>= 85` / `>= 60` constants
- Real factors — `scan.ts:245-246` keeps `confidence.{label,factors}`; they flow
  through `food.tsx:175-176` to `ScanReviewCard.tsx:291-292`. `synthesizeBreakdown`
  survives only inside the test asserting its absence
- `git log --oneline main | head -30` shows all nine fix commits

**Nothing was lost, nothing conflicted, nothing was superseded.** The merge was
clean because the app fixes and the web redesign touch disjoint trees; `main`'s
later web/legal work (`globals.css` at 1,225 lines, `legal/manifest.json`,
`legalParity.test.ts`) all survived and the web build still passes.

---

## B. The double-count bug

### Root cause, traced end to end

1. `POST /api/scan/pipeline` → `CreateAnalyzingLog` inserts **food_logs row A**
   (`status='analyzing'`, zero macros). `CreatePipelineSession` links
   `scan_sessions.food_log_id = A`.
2. The background pass → `FinishScanLog(A, 'ready', …)` fills A with the real
   macros.
3. The user confirms → `SaveConfirmed` **INSERTed row B** with the same food, and
   then overwrote `scan_sessions.food_log_id` from A to B — losing the only link
   back to A.
4. `GET /api/food/logs` sends **no status filter**, so the client received both.
5. `mealsFromLogs` **dropped `status`**, so `foodStore.recompute`'s under-review
   exclusion could never fire on fetched rows.

Net: the day's calories doubled on the next refresh. `food_logs.status` defaults
to `'confirmed'`, so row B looked like an ordinary logged meal.

### The reconciliation rule I chose

> **A confirmed scan claims the pipeline's row.** `/api/scan/confirm` UPDATEs the
> `food_log` that its `scan_session` created — the user's corrected values plus
> `status='confirmed'` — and returns that row's id. It INSERTs only when there is
> nothing to claim: no session, no linked log, another user's row, or a row the
> user discarded.

**Why server-side:** client de-duplication would only hide it.
`GET /api/food/summary` sums `food_logs` directly, so anything reading the API
rather than the store would still have seen the wrong total.

**Ordering safety:** the claim is gated on `status IN ('analyzing','ready')`, and
`FinishScanLog` carries the mirror predicate `AND status = 'analyzing'`. Either
completion order is safe — a late pipeline pass updates zero rows instead of
overwriting the user's values and dragging a confirmed row back to `ready`.

**Idempotency untouched:** the offline queue's `Idempotency-Key` path lives in
`food.CreateLog` and `gym`, not in `scan.SaveConfirmed`, which the queue never
replays. And a replayed confirm now finds `status='confirmed'` and cannot
re-claim.

**Client half:** `mealsFromLogs` carries `status` through, so an under-review row
stays out of the day's totals on re-read.

### The test, proven failing first

`backend/tests/scan/confirm_reconcile_pg_test.go` — five cases against **real
Postgres**, including the refresh path the bug only showed on. On the old code:

```
--- FAIL: TestPG_ConfirmClaimsThePipelineRow
    food_logs rows = 2, want exactly 1 — the confirmed scan is duplicated
--- FAIL: TestPG_RefreshDoesNotChangeTheDayTotal
    day total drifted across reads: 1400 then 1400, want 700 both times
```

All five pass now. Plus two mapper tests for the status passthrough.

**One test I did NOT rewrite:** I initially also excluded `'analyzing'` rows from
client totals, which broke `stores.test.ts`'s `analyzing counted in totals`. On
inspection that test was **right** — a placeholder row carries zero macros on
both sides, so excluding it changes no total and only hides the optimistic row
from its meal. I reverted my change rather than rewrite a valid test.

---

## C. The rename

**The product is `Lume`. The bundle identifier is `fit.lume.app`.**

Chosen over `app.lume.lume` because it is the correct reverse-DNS form of
`lume.fit`, the domain the product owns. `app.lume.lume` only mirrored the old
`app.veltai.veltai`, which was itself malformed. **Nothing has been submitted, so
this was the last cheap moment** — after the first upload it is permanent.

| Surface | Change |
|---|---|
| `app.json` | `name: Lume`, `slug: lume`, `scheme: lume`, `bundleIdentifier: fit.lume.app` |
| Permission strings | the camera alert iOS shows now says **Lume**, matching the in-app rationale one tap earlier that already did |
| `package.json` | `lume` / `lume-web` |
| Backend env | `LUMO_*` → `LUME_*`, **with a compatibility shim** |
| Go module | `lumo/backend` → `lume/backend` |
| Secure store | prefix `veltai.` → `lume.`; consent key `lumo.` → `lume.` |
| Deploy | `lumo-api.{conf,service}` → `lume-api.*` |
| Web, legal, UI copy | all `lume.fit` |

**The env shim:** `config.lookup()` tries `LUME_X`, falls back to `LUMO_X`, and
logs a one-time deprecation warning. A deployment still exporting the old names
keeps working, and nothing silently reverts to a default because a variable
"disappeared". Delete the shim once no environment exports `LUMO_*`.

**Deliberately left alone:**

1. **`lumofit@gmail.com`** — a real mailbox that receives support email.
   `lumefit@` does not exist. `productName.test.ts` asserts it survives so nobody
   "tidies" it into a dead address.
2. **Migration file contents and names.** `deploy/migrate.sh` stores a SHA-256 of
   each applied migration and reports `DRIFT` when a file changes. Editing even a
   comment in an applied migration would make a correct deployment look
   corrupted. `20260711000001_initial_schema.sql:1` still says "Lumo initial
   schema" on purpose.
3. **Historical audit reports** — `SUBMISSION_READINESS.md`,
   `TESTFLIGHT_READINESS.md`, `CLEANUP_REPORT.md`, `SECURITY_AUDIT.md`,
   `LANDING_REDESIGN.md`, `FIRST_RUN_CHECKLIST.md`. These are point-in-time
   records of a state that used the old names; renaming inside them destroys
   their meaning.

**Secure-store keys moved with no migration.** There are no production users, so
nothing was stranded. **Had there been, this would have signed every user out**
and reset their onboarding and analytics opt-out flags — the keys *are* the
storage identity, so renaming orphans the old values rather than moving them. A
post-launch rename needs a read-old-write-new migration on first launch. Noted in
`DECISIONS.md`.

**The guard:** `src/__tests__/productName.test.ts` fails if `veltai` or `lumo`
reappears in `src/`, `web/` or `app.json`. Historical comments were **reworded**
to describe the old bugs without naming the dead schemes, rather than adding a
per-line opt-out marker that would erode the guard.

---

## D. Assets

`npm run check:assets` **exits 0**: 4 ok, 0 warnings, 0 blockers.

| Was | Now |
|---|---|
| `icon.png` had an **alpha channel** (colour type 6) — App Store Connect rejects at upload | colour type **2 (RGB)**, confirmed by an IHDR parse *and* `sips -g hasAlpha` → `no` |
| `ios.icon` pointed at `assets/expo.icon/` — the **Expo chevron** on a blue gradient, with a design-guide grid still compositing as a live layer | key removed, directory deleted; the 1024 PNG is the icon |
| `splash-icon.png` was **pure white on the white background** — every visible pixel `rgb(255,255,255)`, so the launch screen rendered blank | near-black on transparency: mean visible colour `rgb(28,28,30)`, contrast distance 679 |

### The icon is a placeholder, and says so

It is a geometric **"L"** in the app's own monochrome palette (white on
`#1C1C1E`, from `src/lib/design/tokens.ts`). It is deliberate, correctly
formatted and **genuinely uploadable** — but it is not a brand. `assets/README.md`
says this plainly and documents how to replace it.

`sips` cannot strip alpha; `scripts/make-icons.mjs` re-encodes from scratch,
writing PNG bytes directly with `node:zlib`. There is no ImageMagick, PIL,
cairosvg or rsvg-convert on this machine and an image toolchain is not worth
adding for a placeholder.

---

## E. The debug capture system

### How to trigger it

| Trigger | What happens |
|---|---|
| **Shake** the device | files a **draft** silently, no sheet — your hands are busy |
| **Long-press** the floating bubble | opens the quick sheet |
| **Double-tap** the bubble | opens the report list |
| **Drag** the bubble | repositions it, snaps to the nearer edge |
| ErrorBoundary catch | automatic **draft**, severity `blocker` |
| Unhandled promise rejection | automatic **draft** |
| API 5xx or network failure | automatic **draft** |

Automatic captures never modal over what you are doing. Only the bubble opens UI.

**Filing takes two taps:** type a title, hit Save. Severity defaults to `minor`,
kind to `bug`, and area is auto-filled from the route. Everything else is
optional.

**`<DebugTag name="ScanReviewCard">`** — wrap any component while testing and
reports raised while it is on screen auto-tag themselves. A transparent
passthrough in production.

### What every report captures automatically

Screenshot · route + params · app version, build number, git SHA · device, iOS
version, screen dimensions, locale · network state · auth (signed in, onboarded)
· entitlement · **last 50 console lines** · **last 20 API calls** (method, path,
status, duration, error) · **last 20 breadcrumbs** (the existing first-party
analytics events, not a second trail) · the **store slice** for the current
screen, bounded.

All ring buffers are fixed-capacity and allocated once. All of it is **redacted
at capture time**, not at export: bearer/basic headers, bare JWTs,
credential-shaped JSON keys, Clerk/RevenueCat/Google key shapes, and base64 image
payloads. A test files a report with a token in flight and asserts it does not
appear in the output.

### Export — the part that changes the workflow

The debug screen exports **all open reports as one markdown document**, sorted
blockers-first, with a summary table and then a full section per report: the
context table, the API trace, the console tail, the breadcrumbs and the store
slice, each fenced so it survives a paste. It is written to be pasted into Claude
Code so a model diagnoses from real evidence instead of your description. JSON
export and a system share sheet are alongside it.

### Storage

**Filesystem first, always** — the report and its screenshot are on disk before
any network call, so it survives a crash and works fully offline. Backend sync is
a secondary copy, upserted on `(user_id, client_id)` so a retry after regaining
signal never duplicates. 64 MB cap; oldest **resolved** reports prune first, and
an open report is never dropped to make room while anything resolved remains.

### Build commands

**Debug-enabled TestFlight build** (the one to test with):

```bash
npx expo prebuild --clean -p ios && eas build --platform ios --profile preview
```

**Clean production build** (the one to submit):

```bash
npx expo prebuild --clean -p ios && eas build --platform ios --profile production
```

The `preview` profile sets `EXPO_PUBLIC_DEBUG_CAPTURE=1`; `production` sets no
env at all.

### Why it cannot reach the App Store

Gated at the **module boundary**, not behind a conditional. `metro.config.js`
resolves `@/debug/impl` to `src/debug/stub.ts` when the flag is off, so the debug
tree is not in the bundle **graph**. Folding `if (false)` away would still leave
the `require` edges.

**Verified empirically, not asserted:**

```
                        PRODUCTION  DEBUG
  New report             0           1
  Save report            0           1
  Export markdown        0           1
size delta: 142,419 bytes of debug code excluded from production
```

`src/__tests__/debugGating.test.ts` fails if any store-distributed profile sets
the flag, if any profile that sets it is not `distribution: internal`, if the
flag becomes a runtime toggle, or if shipping code imports `impl` directly.

**One honest caveat:** `/api/debug-reports` remains in the production bundle as a
dead API method — a string and an unused function on the shared `api` object. No
code path reaches it, because the store is stubbed out. Splitting the API client
to remove it was not worth it.

---

## What only you can do

1. **Register `lume.fit`.** The rename points every URL at it, but I cannot check
   whether you own it — the old `lumo.fit` is a third party's parked domain and
   `veltai.app` is NXDOMAIN. Set `NEXT_PUBLIC_SITE_URL` at build time. **The App
   Store Support URL must resolve to your own `/support` page before you submit.**
2. **Get the Privacy Policy and Terms finished by a lawyer.** 17 sections still
   read *"This section is being drafted with a legal adviser and is not final"* —
   including who operates the app. You collect health data; this is not optional,
   and it is the one remaining hard blocker for the *public* release. It does not
   block TestFlight.
3. **Replace the placeholder icon and splash** before a public release.
4. **Supply the keys** — Clerk, RevenueCat, Gemini, Anthropic — so the ⚠️ list can
   start becoming ✅.
5. **Run `eas build:configure`** once to attach the EAS project id, then use the
   build commands above.
6. **Apply the 14 migrations** to your Supabase project (`./deploy/migrate.sh
   status`, then `apply`). Two are new since the last report: `ai_consent` and
   `debug_reports`.
7. **Confirm the RevenueCat paywall** renders plan name, duration, renewal price
   as the most prominent element, post-trial behaviour and auto-renew terms, and
   that the entitlement is literally `pro` with a 7-day trial.
8. **Create a demo account for App Review** — the app requires login.
9. **Set a billing cap on the Gemini and Anthropic accounts.** There is still no
   global spend cap in the code.
10. **Decide the remaining known-broken items** in `TESTFLIGHT_READINESS.md` —
    the discarded-scan resurrection, the 60s/120s poller mismatch, and the
    camera-failure fabrication are the three most likely to bite you in the first
    hour.

---

## Still ⚠️ — unchanged and honest

Nothing here has run on an iPhone. The additions this pass do not change that.

- **Every screen.** 127 `.tsx` files, **zero render tests** — jest runs in a node
  environment with no renderer. Layout, safe areas, Dynamic Type, contrast, tap
  targets, VoiceOver: read, not executed. A meaningful share of the 464 tests are
  substring greps over source text. That number is not coverage and I have not
  padded it.
- **The debug system itself is ⚠️.** Its logic is tested — ring bounds,
  redaction, restart survival, export shape, gating — but **the shake gesture,
  the screenshot, the bubble drag and the share sheet have never run on a
  device.** They are the most likely things to need a tweak in your first hour.
- **Clerk, RevenueCat, Gemini, Anthropic** — no keys, never executed.
- **The account-deletion cascade** is still asserted by a regex over SQL text; no
  test runs a `DELETE`.
- **The known-broken list** in `TESTFLIGHT_READINESS.md` is unchanged apart from
  the double-count, which is now fixed. The discarded-scan resurrection, the
  poller deadline mismatch, the camera-failure fabrication and the cold-start
  auth-machine gap are all still open.
- **No CI.** The gates are enforced by nothing but running them.

---

## Commits

```
feat(debug): in-app capture system for TestFlight testing
assets: uploadable placeholder icon and a visible splash
rename: the product is Lume
fix(scan): a confirmed scan writes ONE row, not two
merge(audit): land the pre-submission remediation and TestFlight gate on main
```
