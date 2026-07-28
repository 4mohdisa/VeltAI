# Cleanup report — `cleanup/repo-sweep`

> **Delete this file once you've read it.** It is a record of one pass, not
> repo documentation. Everything worth keeping already lives in STATUS.md,
> DECISIONS.md and README.md.

## Safety

The working tree had **121 uncommitted files** (the Phase 14 audit). Those were
committed to `main` first — `fix: Phase 14 pre-submission audit` — so every
deletion below sits on a clean base and is recoverable with `git revert` or
`git checkout HEAD~1 -- <path>`.

**No untracked file was deleted. Nothing in this pass is unrecoverable.**
Untracked things deliberately left alone: `SF-Pro.dmg` (217 MB, gitignored, the
source of the three extracted fonts — safe for you to delete locally, but it is
outside version control so I did not), `scripts/audit-routes.mjs` (gitignored
local tooling), `ios/`, `backend/server`, build caches.

## Deleted

| Category | Count | Detail |
|---|---|---|
| Point-in-time reports | 9 files, ~1,209 lines | HIG_AUDIT, LANDING_REPORT, LUMO_PHASE14_PLAN, PHASE_14_REPORT, PRODUCTION_READINESS, RESEARCH_FINDINGS, ROUTE_COVERAGE, SECURITY_AUDIT, APP_STORE_CHECKLIST |
| Orphaned component | 1 file, ~110 lines | `src/components/domain/DetectedItemsReview.tsx` — the shared review list for photo **and voice** detection; it went dead when the fake voice screen was removed in the Phase 14 audit. Proven zero inbound edges by a full alias-aware import graph (198 files) plus repo-wide grep. |
| Dead exported symbols | 6 | `mutations.ts:setGoals`, `mutations.ts:setUserProfile`, `dynamicType.ts:useFontScale`, `tokens.ts:isLargeTextScale`, `GlassButtons.tsx:liquidGlassActive`, `Icon.tsx:iconAccents` — each verified by me independently (`grep -rnw` across src/web/backend/scripts/app.json returned the definition only). `setGoals`/`setUserProfile` had doc comments claiming consumers ("used by the Goals editor", "onboarding bridge writes here") that did not exist. |
| Expo-template assets | 13 files, 112 KB | react-logo ×3, expo-logo, expo-badge ×2, tutorial-web, `tabIcons/` (6 files + the directory — tab icons are SF Symbols now, and `explore` isn't even a tab) |
| Stale comment | 1 | `hooks.ts` referenced `data-seam.check.mjs`, a script that no longer exists |

**Net: −138 lines of TypeScript, −1,370 lines of markdown, −112 KB of assets.**
Markdown files went **17 → 10** (9 at the root, plus `web/README.md`).

## Not deleted — nothing was found

- **Backend: zero dead code.** `deadcode ./cmd/server` produced 5 hits and
  every one is test-only (`ExportTableNames`, `CrosscheckMacros`,
  `newTestGemini`, plus the known `RegisterProfile`/`gym.Register` delegates) —
  kept per the rule that a test-referenced helper is not dead.
  `staticcheck -checks=U1000 ./...` was silent. No stale TODOs, no
  commented-out code, no ad-hoc tracing (the only prints are the five
  deliberate operational log lines and the hand-run seeder's stdout).
- **Web: zero dead code.** The inbound graph from the App Router entry points
  is closed — every component, every `lib/site.ts` export, and every CSS class
  in `globals.css` has a consumer.
- **Zero unused dependencies** in either `package.json`. Every one was checked
  by import count. `expo-linking`, `expo-splash-screen`, `react-native-worklets`
  and `react-dom` have zero direct imports but are required peer/plugin roles —
  removing any of them breaks the build or deep links at runtime. **No expo-\*
  package was removed, so there is no native-build risk from this pass.**
- **`go mod tidy` is a no-op** (verified against a backup: `go.mod` and
  `go.sum` byte-identical).

## Structure

Changed (all mechanical, verified by `tsc` after each batch):

- Removed the empty `src/lib/healthkit/` directory left by the Phase 14 audit.
- Flattened 5 single-file directories whose only file was `index.ts` →
  `src/lib/{analytics,api,formatting,types,units}.ts`. **Zero import changes** —
  `@/lib/api` resolves identically either way.
- Dissolved 4 single-file component directories into existing homes (6 import
  updates total): `animations/StreakFlame` → `display/`,
  `energy/EnergyBalanceCard` → `domain/`, `legal/LegalScreen` → `navigation/`,
  `offline/PendingSyncBanner` → `display/`.

Result: component directories **13 → 9**, lib directories **21 → 15**.

Skipped deliberately:

- **Normalising barrel vs direct imports.** `components/display` (23 barrel /
  107 direct) and `components/forms` (18 / 44) are used both ways. Picking one
  would touch 130+ import sites for zero functional gain — churn, not cleanup.
  All six barrels are genuinely used (4–24 call sites each), so none was
  deleted.
- **Renaming the remaining named single-file lib dirs** (`settings/store.ts`,
  `storage/secureStore.ts`, `goals/derive.ts`, …). Flattening these *would*
  change import specifiers across many files, and `@/lib/settings/store` is
  more descriptive than `@/lib/settings`. Cost exceeded the gain.
- **Backend and web layouts** are already idiomatic (Go feature packages under
  `internal/`; Next.js App Router). Left alone.

## Verification

| Gate | Result |
|---|---|
| `go build ./... && go vet ./... && gofmt -l .` | clean |
| `go test ./... -count=1` | 24/24 packages ok |
| `npx tsc --noEmit` | clean |
| `npm run lint` | 0 errors (1 pre-existing i18next warning) |
| `npm test` | **317 passed** — same as before the pass |
| `cd web && npm run build / lint / typecheck` | clean, 11 static routes |

**Test count did not drop. No test was deleted or modified in this pass.**

### A pre-existing flaky test, now diagnosed

Two runs during the final gate reported **4 failed / 313 passed** while a dozen
others passed. Rather than write it off, I chased it down.

**It is load-dependent.** Running `npm test` with the Go and web builds running
concurrently reproduced it on the first attempt; standalone runs pass ~90% of
the time. All four failures are in `src/__tests__/scanSeam.test.ts`
(`startMultiPhotoScan`), all with the same error:

```
ReferenceError: setTimeout is not defined
  at flush (src/__tests__/scanSeam.test.ts:37)
```

`flush()` is `new Promise((r) => setTimeout(r, 0))` — jest has torn the test
environment down (removing globals) while the scan seam's promise chains are
still resolving. Under load the teardown wins the race.

**It is not mine.** I checked out commit `0470936` — before both the Phase 14
audit and this cleanup — into a worktree and ran the same suite under the same
load: **4 failed, 3 times out of 3.** The last change to that test file was
`f32b775`, and nothing in this pass touched it or `src/lib/data/scan.ts`.

**I deliberately did not fix it here.** This was a deletion pass, and the fix
depends on a judgement I shouldn't make unilaterally: either the test should
await the chains properly (test hygiene), **or** `startMultiPhotoScan`'s
fallback path leaks a dangling promise, which would be a real product bug that
patching the test would hide. Logged in STATUS.md as a Medium open issue.

## Kept despite being unreferenced (flagged, per the keep-when-uncertain rule)

- `assets/images/logo-glow.png` (331 KB) — zero references repo-wide, but it is
  a custom brand asset, not template debris. Plausibly a source file for
  marketing or a future splash. Two analysers disagreed on it; I kept it.
- `assets/images/favicon.png`, `android-icon-{background,foreground,monochrome}.png`
  (100 KB) — zero references and `app.json` has no `android` or `web` block, but
  these are exactly the manifest-class assets that become live the moment an
  Android or web target is added.
- `src/lib/mock/*` unreferenced seed exports (`mockSubscription`,
  `aiUncertaintyPrompts`) — keyless dev mode seeds from this module.
- ~30 exported `*Props` types and all test-only exports (`src/lib/units`,
  `src/lib/formatting`, the `__set*` DI seams) — test-referenced or standard
  React convention, not dead.
- `src/lib/api.ts`'s ~20 exported response types — the API-surface contract
  guarded by `apiSurface.test.ts`; pruning individually is high-risk, low-value.
- `APP_STORE_METADATA.md` — this is the **9th** root markdown file, one over
  your target of 8. It is forward-looking submission input (description,
  keywords, privacy-label answers), not a build artifact, and deleting it
  destroys hand-written copy you need at submission. Fold it into the App Store
  Connect listing and then delete it.

## Bonus: Notion is now connected

It wasn't during the audit. I read `App Store Readiness` and
`iOS — App Store & Design Docs`. It is a **June 2026 plan, not a record of what
shipped**, and diverges from the code in ways that matter — a 14-day trial (repo
says 7), a soft-delete with a 7-day grace period (the shipped flow is an
immediate hard delete), `DELETE /api/account` (shipped: `/api/profile`), and it
assumes Sentry, `react-native-health`, Speech-framework voice, Face ID and push
notifications, none of which are in the build. Captured in STATUS.md; the trial
discrepancy is now a human action item.
