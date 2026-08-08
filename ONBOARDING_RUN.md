# Onboarding → first-run to Home — agent run, 2026-08-08

Run autonomously against `main`. Posture: prove the flow is broken. It was —
but not for the reason the brief proposed, and I could not have known that
without reading the code rather than the hypothesis.

---

## 1. What actually broke, and the real root cause of each symptom

### The leading hypothesis is wrong, and the code disproves it

> "onboarding step progress is not persisted locally, the next step is resolved
> from server state, and when the write or the state read fails the failure is
> swallowed"

Three claims, all false:

- **Progress WAS persisted locally.** The onboarding store has used zustand
  `persist` over expo-secure-store since before this run. The answers survived
  every reload.
- **The next step is NOT resolved from server state.** Every screen navigates
  to a hardcoded literal (`navigate('/onboarding/body-type')`). Onboarding makes
  **zero server writes before the paywall** — the only `/api/onboarding` POST is
  on the last screen. Steps 1–9 never touch the network.
- **Nothing was swallowed into a legal route.** There is no fallback, redirect
  or catch block anywhere in the 12 onboarding screens that can navigate to a
  legal or consent screen. Now pinned by a test that fails loudly if one appears.

### Was the backend running? Yes — and that is worse than "no"

A backend **was** listening on :8080 throughout. It was not the repo's server:

```
/private/tmp/claude-501/.../b89d5fd0-…/scratchpad/lumoserver   built Aug 5 18:46
```

A binary called **`lumoserver`** — the pre-rename name — built on **5 August**
from a *different* Claude Code session's scratchpad. It predates the rename to
Lume (`c9b43ae`, 6 Aug) and every fix from the 6 Aug audit: the server-side AI
consent gates, the trust-boundary validation, the scan-confirm replay guard,
the summary status filter. It answered `/health` with 200, so everything
*looked* wired up while serving three-day-old code.

It did not cause symptoms 1–3 (nothing in that part of the flow calls it), but
it would have silently misled any test of the paywall submit. **I killed it.**
Rebuild from source before testing again — `backend/server` in the repo is
itself stale (12 July).

### Symptom 1 — progress lost on reload → **two** causes, both real

- **No step pointer existed.** The store persisted the answers but never *where
  the user was*, so the launch gate had nothing to resume to and always sent
  them to the onboarding root, which is Welcome. The answers were on disk the
  whole time, invisible behind a restarted flow — which reads exactly like
  total data loss.
- **Nothing was written until Continue succeeded.** Anything typed into the
  measurements form and not submitted genuinely died with the reload.
- A third, latent: the signed-out branch of the launch gate `return`ed *before*
  awaiting store hydration, so it could never have consulted persisted progress
  even once it existed.

### Symptom 2 — Continue did nothing → **a disabled button**

Not a swallowed request. `<Button disabled={!canContinue}>`, where
`canContinue` required a non-empty age *and* a chosen sex. With either missing
the control was inert, and a disabled button cannot explain itself: no
navigation, no error, no toast — precisely what was observed. The screenshot
from the session shows the age field still on its placeholder.

### Symptom 3 — the legal screen → **a mis-tap, not a fallback**

`signup.tsx` (step 6, immediately before measurements at step 7) renders
footnote-sized underlined **Terms** and **Privacy Policy** links directly
beneath the auth buttons. They already carry a 14 pt `hitSlop` to reach the
44 pt target — the hazard is their *proximity to the primary CTA*, not their
size. Every legal navigation in the flow is an explicit press handler; I
verified all 12 screens and pinned it with a guard test.

---

## 2. What is fixed, with the commit and the proving test

| # | Item | Commit | Proving test (failed pre-fix) |
|---|---|---|---|
| 1 | Resume at the exact step | `441439f` | `onboardingResume.test.ts` — 2 assertions fail without `last_step` |
| 1 | Persist as you type | `bc80528` | `measurements.render.test.tsx` "what you type is persisted before you press Continue" |
| 2 | Continue never a silent no-op | `8ea8158` | 3 render tests fail on the old screen |
| 2 | Server's own message surfaced | `12f3828` | contract suite; 4xx message no longer replaced by "check your connection" |
| 3 | Sex must not default | — | **Already correct.** Render test proves nothing is selected at mount |
| 4 | Target weight follows the unit | `26be3a1` | **Label was already bound.** The real bug — toggles *reinterpreting* the typed number — is fixed and round-trip tested |
| 5 | Unspecified → 1500 floor | `01a861b` | Go derive table + 3 app tests, rewritten from 1350 |
| 6 | Age parity 13..120 | `8ea8158` | render test: 12 and 121 rejected, 105 accepted |
| 7 | Legal route | `bc80528` | `onboardingLegalRoutes.test.ts` — sweeps all 12 screens |
| 8 | Contract parity | `12f3828` | `onboardingContract.test.ts` — 16 tests, all fail pre-fix |
| 9 | First-run Home | — | **Already release-gated**; see below |

### Render tests now exist

The repo had **zero** across 127 `.tsx` files. There are now 10, in a second
jest project, and they *execute* the screens — every hook, every branch, every
computed prop — instead of grepping source text like the node suite.

`@testing-library/react-native` v14 does **not** wire up against React Native
0.85: its `test-renderer` peer never receives a host config, so `render()`
returns an object with no queries. I used `react-test-renderer` directly under
the `jest-expo` preset and query the tree by props. Reanimated and worklets are
stubbed in `__mocks__/` (their native runtimes do not exist under jest). The
node project is untouched and still runs in its own environment.

### Two of your nine items were already correct

Stated plainly because the brief asked me to prove things, not accept them:

- **Item 3 (sex pre-selected as Female).** `SegmentedField` marks a segment
  selected only on `opt.value === value`, and the initial value is `''`, which
  matches no option. A render test asserts zero segments carry
  `accessibilityState.selected` at mount.
- **Item 4 (target-weight label hardcoded `(kg)`).** It has read
  `` `Target weight (${weightUnit})` `` since before this run. It *displayed*
  "(kg)" because kg is the default unit. The real defect underneath was worse
  and I fixed that instead — see below.

---

## 3. What is still broken, by severity

**High**

- **Height and weight are optional and silently replaced by population
  medians** (`DEFAULT_HEIGHT_CM` / `DEFAULT_WEIGHT_KG`) when left blank. The
  user never entered those numbers, and they feed Mifflin–St Jeor directly. It
  is deliberate and documented in the file header, but it is body data the
  product invented, and my new client-side contract check passes *because* the
  defaults fill the gap. Either make them required or label the derived target
  as an estimate. **Not changed here — that is a product decision, not a bug
  fix, and the brief says not to add scope.**

**Medium**

- **The stale `backend/server` binary in the repo** (12 July) and the habit of
  running binaries out of scratchpads. Nothing pins the running server to the
  source tree.
- **Signup's legal links sit under the primary CTA.** Hit target is compliant;
  placement is the hazard. A layout change is a design decision, so it is named
  rather than made.
- **`continueAfterAuth` swallows a failed `GET /api/onboarding`** and proceeds
  to measurements. Correct for an unreachable backend, but an already-onboarded
  user whose request fails is silently re-onboarded.

**Low**

- Unit round-trip settles ±0.1 kg on odd values (far below scale precision).
- `feetText`/`inchesText` are not themselves persisted; the canonical cm value
  is, so nothing is lost, but the ft/in boxes repopulate from cm.

---

## 4. Document and comment claims found false

| Where | Claim | Truth |
|---|---|---|
| The brief's leading hypothesis | progress not persisted; next step from server; failure swallowed into a legal route | All three false — see §1 |
| The brief, item 3 | "ships pre-selected as Female" | Nothing is selected at mount; proven by render test |
| The brief, item 4 | "label is hardcoded `(kg)`" | Bound to `weightUnit` already; the real bug was silent reinterpretation |
| `FINAL_AUDIT.md` | "Onboarding mid-flow resume restarts at Welcome" | **True**, and now fixed |
| `src/lib/stores/onboarding.ts:1-4` | "survives app restarts so a user who quits mid-flow resumes where they left off" | The answers survived; the *position* did not, so it did not resume. Now it does |
| `measurements.tsx` header | "Age + sex are required" | They gated a disabled button that never said so |
| `paywall.tsx` catch | every failure → "check your connection" | Sent users to debug wifi over a 400. Same swallow as `aiBrain.ts:157-159` |

---

## Gate (all green, 2026-08-08)

```
backend  go build/vet/gofmt CLEAN · 506 tests, 0 skipped, 0 failed
         (LUME_TEST_DATABASE_URL set, so the 9 real-Postgres proofs ran)
         -race: 0 failures, 0 data races
app      tsc CLEAN · eslint 0 errors, 24 warnings
         jest node   31 suites / 494 tests  (was 28 / 470 — nothing dropped)
         jest render  2 suites /  10 tests  (new — the repo had zero)
web      production build clean
assets   4 ok, 0 warnings, 0 blockers
```

Test counts went up at every step. Six tests were rewritten rather than
weakened — four that pinned the 1,350 midpoint, and two from the earlier
simulator run — each carrying a comment saying so.

## 5. What only Isa can do

1. **Rebuild the backend from source and stop running scratchpad binaries.**
   A three-day-old `lumoserver` was answering on :8080 with pre-rename,
   pre-audit code. I killed it; `backend/server` in the repo is also stale.
2. **Supply `CLERK_SECRET_KEY`** — the backend refuses to start without it and
   has no dev bypass, so configurations (a) backend-up and (b) 4xx/5xx could
   only be exercised through unit tests, not live. Configuration (c),
   unreachable backend, is what the simulator actually ran.
3. **Decide on required vs median-filled height/weight** (see §3, high).
4. **Decide whether the signup legal links should move** away from the CTA.
5. **Re-run the flow on a device.** Everything here is simulator- or
   jest-verified; see the per-item note below.

### Simulator ≠ device

| Item | Simulator can validate? |
|---|---|
| Resume after reload | **Yes** — and jest proves the pointer logic |
| Continue shows reasons | **Yes** (render tests prove it headlessly) |
| Sex unselected, unit conversion, age band | **Yes**, via render tests — no device needed |
| Calorie floor both sides | **Yes** — Go + jest |
| Legal-route guard | **Yes** — static sweep |
| Contract parity | **Partly** — the client half is tested; the server half needs a live backend with Clerk keys |
| Background/restore mid-flow | **No** — needs a device; the simulator does not reproduce real memory pressure |
| Keyboard behaviour on the measurements form | **No** — needs a device |
