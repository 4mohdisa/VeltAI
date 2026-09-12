# Error state and keyboard — 2026-09-13 (addendum)

| Step / Task | Outcome | Commit |
|---|---|---|
| 0 | Real touch input — **still blocked**, but narrowed to one specific call | — |
| 1 | Error-path fallback-to-seed — **fixed across all six non-parked callers** | `2227f55` |
| 2 | V1 keyboard avoidance — **skipped**, per instruction, because Step 0 failed | — |

---

## Step 0 — the grant partly took, and the gap is now precise

The Accessibility grant to `osascript` **did** change something. System Events
*reads* now work, where last session the same call was denied:

```
tell application "System Events" to get position of window 1 of process "Simulator"
→ -1331, -1004          ✅ (was: not allowed assistive access)
```

But posting a synthetic mouse event is still refused:

```
tell application "System Events" to click at {-1127, -314}
→ execution error: osascript is not allowed assistive access. (-25211)
```

So the permission is half-applied: **reading** the UI is allowed, **clicking** is
not. The most likely explanation is the trusted-process check. `osascript` runs
here as a child of the host app — its parent process is

```
/Users/…/Claude/claude-code/…/claude.app/Contents/MacOS/claude
```

so macOS attributes the event-posting attempt to **claude.app**, not to
`/usr/bin/osascript`. Granting `osascript` therefore fixed the read path (which
System Events performs in its own process) but not the click path.

Per your instruction I did not retry the four confirmed dead ends. Task 2 is
skipped rather than faked.

**What would unblock it next time**, most likely first: grant Accessibility to
the **host app** (`claude.app`) rather than `osascript` in System Settings →
Privacy & Security → Accessibility. Failing that, accept the full-screen control
card while at the machine, or restart the simulator integration so it re-reads
`xcode-select`.

---

## Task 1 — a failed read is reported, not swallowed (`2227f55`)

### The gap

`useHydration` caught every fetch error and kept `error: null` by design — the
module said so: *"the mock-seeded store data IS the offline experience"*. That
meant no caller could distinguish:

- "here is your data", from
- "we never reached the server, so this is whatever was already in the store".

Both looked identical, and every screen rendered the second as though it were the
first. Summary's seeded 13-day streak was one symptom; the cause was shared.

### The contract now

`useHydration` distinguishes **loading / loaded / failed**. It keeps the real
`Error`, clears it on a later success, and still leaves the store untouched on
failure — so a screen can keep showing what the device has, provided it says so.

Nothing invents a reason. The fetch layer supplies no user-facing cause, so the
shared `LoadFailedNotice` says only *"Couldn't load …"* and offers **Try again**.
A test fails if any caller's message mentions a server, a network, or a status
code.

### Two bugs this surfaced, both fixed here

1. **`hydrateDashboard` could never fail.** It used `Promise.allSettled`, which
   never rejects — so once the hook could report errors, Summary would still have
   called every outage a success and gone straight back to showing its seed. It
   now inspects the settled results and throws when the food or gym read failed.
   The profile read is deliberately **not** fatal: the avatar already falls back
   to a glyph, which is honest on its own.
2. **`food.tsx` hid real rows on error.** `if (loadError || loading || itemCount
   === 0) return []` blanked the section list, so a failed refresh replaced the
   user's rows — including queued offline writes — with an error screen. It now
   keeps them and labels them.

The second one is exactly the "caller relying on the swallow-errors behaviour"
risk you flagged: that branch was dead code for as long as `error` was always
null, and surfacing errors woke it up.

### Every caller, checked

| Screen | Hook | Handling |
|---|---|---|
| Summary | `useDashboard` | streak + macro rows **replaced** by the notice |
| Food log | `useFoodLog` | notice under the title, rows kept |
| Gym | `useGym` | notice above the streak card |
| Macros detail | `useFoodLog` | notice under the kicker |
| Saved foods | `useSavedFoods` | notice under the search field |
| Settings root | `useGym` | notice above the title block |

**Why Summary differs:** everywhere else the retained data is the user's own
local rows, which should stay visible. On Summary the streak and macro *numbers*
come from a seed that was never the user's data, so on a failed read they are
replaced rather than labelled. Deliberate, and logged.

**Parked screens inherit nothing.** `gym/streak`, `gym/history` and `gym/freeze`
read `useGym().data` only and must not be edited, so they still show whatever the
store holds with no failure indication. Not fixed, by constraint, and recorded in
DECISIONS.md rather than quietly left out.

### Device evidence — launched with no backend at all

| Screen | Before | Now |
|---|---|---|
| Summary | "13 day streak"; Macros 104 / 135 / 38 | **"Couldn't load your streak. Try again"**; **"Couldn't load today's macros."** (`task1_error_summary.png`) |
| Food log | rows replaced by a full-screen error | notice under the title, **rows kept** (`task1_error_food.png`) |

The Food notice was first placed at the very top of the list, where the floating
avatar clipped its "Try again"; it was moved below the title block and
re-captured.

### Tests

`render/hydrationErrorState.render.test.tsx` mounts the hooks themselves across
**three** callers (`useGym`, `useFoodLog`, `useDashboard`) with a failing fetch
and requires a real `Error` on each — plus that a success reports none, that the
failure leaves the store alone, and that a retry clears the error. It waits on
the settle condition rather than a tick, because `api.ts` retries failed GETs
twice with backoff (~1.3s).

`hydrationErrorScreens.test.ts` pins the other half: all six non-parked callers
render `LoadFailedNotice` behind a real error check, the hook no longer returns a
permanent null, `hydrateDashboard` inspects its results, `food.tsx` no longer
blanks its list, and no message invents a cause.

---

## Tests, before vs after

| Gate | Before | After |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | 0 errors |
| `npx eslint src` | 0 errors, 35 warnings | 0 errors, 35 warnings |
| `npm test` (app) | 63 suites / 807 tests | **65 suites / 823 tests**, 4 snapshots |
| Backend, real Postgres | 632 pass / 0 skip | **632 pass / 0 skip / 0 fail** (untouched) |

No baseline dropped, and no existing suite needed rewriting — the shared-contract
change broke nothing that was relying on the old behaviour except the one dead
branch in `food.tsx`, which was fixed rather than worked around.
