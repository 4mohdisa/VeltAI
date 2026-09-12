# Follow-up pass — 2026-09-12

The nine decisions the structural pass left open, built or answered on `main`,
one commit per item. Everything below was traced in the code and — where the
simulator allowed it — exercised with real taps, not inferred.

| # | Item | Commit | Outcome |
|---|------|--------|---------|
| 1 | Log-session sheet sizing | `7c8b804` | Fixed: sizes to its content, pill on screen |
| 2 | Untraced test-server session | `10c91ac` | **Cause found and reproduced.** No fix needed |
| 3 | `gym/freeze` date default | `5a114aa` | Fixed: freezes today, the only day the server can |
| 4 | Local `durationMin` default | `d2a9fa7` | Fixed: nothing asserts a duration nobody logged |
| 5 | Offline-queue size limits | (with 4→6) | Audited: size is fine; a real silent-failure path fixed |
| 6 | Fibre end to end | `2e89cbe` | Built, honest about sources that have none |
| 7 | Remove Summary's gym card | `f3fdd0c` | **Not removed** — the condition genuinely failed |
| 8 | Device verification | `ac766b1` | V7 and V6 confirmed; V1 keyboard NOT verified |

---

## Simulator access — read this first

The native simulator integration never came back, despite `xcode-select -p`
correctly reporting `/Applications/Xcode.app/Contents/Developer` with Xcode 26.6
installed. Its tool kept returning "Xcode is installed but not selected", which
looks like a value cached when that process started; I cannot restart it.

So device work went through the generic screen-control tools against the
Simulator app, which was already granted. I am flagging that explicitly because
it has one consequence that matters below: those tools drive a field through the
accessibility API (they report "set AXSelectedTextRange" / "set AXValue") rather
than dispatching a touch, so **iOS never raises the software keyboard**. Taps,
drags and button presses work fine; keyboard-dependent checks do not.

---

## 1. Log-session sheet sizing (`7c8b804`)

`gym/log-session` used the shared `sheetOptions`, whose detent is `[0.6, 1]`. On
an iPhone 17 Pro that is ~524pt, while the sheet's content — slider, two
steppers, a multiline Notes field, and V1's new save pill — needs ~670pt, so the
pill sat below the fold, reachable only by scrolling.

It now uses `sheetAllowedDetents: 'fitToContents'`, the rule `food/add` already
used. **Other sheets:** every other sheet passes its own `sheetAllowedDetents`
(`freeze` 0.5, `quick-add` 0.6, `custom-food` 0.95, `detail` [0.75, 1], `saved`
[0.7, 1], `calendar` 0.75), so nothing else moved — the shared base was not
touched. `food/detail` and `gym/freeze` were both re-opened on device afterwards
and render correctly.

Verified: `docs/followup/item1_log_session_pill.png`.

## 2. The untraced test-server session (`10c91ac`)

**Found, and reproduced deliberately.**

It is the offline queue replaying a write that had failed earlier. Reproduction:
stop the stub → log a session through the sheet (the POST fails, the write is
queued to the Keychain) → restart the stub → cold-launch the app. The first
request of that launch was:

```
POST /api/gym/sessions {"date":"2026-09-12","duration_minutes":60,"name":null,"notes":null}
```

which is exactly the signature the structural pass could not explain.

Why it looks spontaneous: `_layout.tsx:115` runs `loadQueue().then(flush)` on
every launch **and** every foreground, and a queued mutation keeps the body it
was created with — the date captured by `todayISO()` at enqueue, and the
duration from the log-session slider, whose default was 60. If you never saw the
original failure, the replay arrives out of nowhere. It never recurred because
the flush emptied the queue.

**No production change**, because the queue is behaving correctly and the user
does see pending writes (`PendingSyncBanner`) while they wait. The fabricated
"60 minutes" half of it was a real defect and is item 4. `coldStartReplay.test.ts`
now pins all three facts: a failed log is queued, the replay is verbatim and is
never re-dated to the day it replays on, and the queue is empty afterwards.

## 3. Freeze date default (`5a114aa`)

`POST /api/gym/streak/freeze` takes no date: the handler sets
`last_freeze_date = today`, refuses when today is already covered, and refuses
once the streak is broken (`backend/internal/gym/gym.go:537-551`).

The sheet defaulted to tomorrow and passed through an `offset` from the parked
streak screen's 7-day list, so the local store recorded a freeze on a day no
server row backed — and the Gym calendar drew it there. It now always applies to
today and says so. The parked screen still sends its params; they are ignored,
and its styling was not touched.

Verified: `docs/followup/item3_freeze_today.png` — "Use 1 of your 1 freezes for
today?".

## 4. The fabricated duration (`d2a9fa7`)

Three places asserted numbers nobody logged: the store stamped every one-tap log
with `durationMin: 60, effort: 7`, and the API mapper stamped hydrated rows with
`durationMin: 0, effort: 0`.

**This was not cosmetic.** The backend turns a session duration into burned
calories: with no exercises, `energy.CalculateSessionCalories` returns 0 for a
duration of 0, but `5.0 MET × 70 kg × 1 h ≈ 350 kcal` for 60 minutes. That figure
lands in `calories_out_exercise` and flows into the energy balance on Summary, so
an invented hour invented roughly 350 kcal of burn with it. The history list also
rendered hydrated rows as "0 min · effort 0/10".

Both fields are now `number | null` and null wherever nothing was recorded,
including the log-session slider, which starts on its own "Not set" position and
sends no duration unless one is chosen. The backend already pinned the honest
branch (`TestCalculateSessionCaloriesEmptyIsZero`), so nothing changed there.

Confirmed on device: a session logged with the slider untouched POSTed
`"duration_minutes": null`.

## 5. Offline-queue size limits — audited, and the real hazard fixed

**Measured**, against the real persisted shapes rather than guessed:

| Queue depth | Bytes |
|---|---|
| one food write | ~286 |
| one gym write (with exercise steps) | ~369 |
| 10 writes | ~3,120 |
| 50 writes | ~15,510 |
| 100 writes | ~30,956 |

The "~2KB" figure the queue's own comment quoted was Expo's **old Android**
warning. expo-secure-store 56.0.4 validates no size on either platform, and an
iOS Keychain item comfortably holds tens of KB. A realistic backlog — a full day
offline is roughly 30 writes, ~9KB; a week is well under 64KB — fits. **So no
cap, no compaction, no overflow store.** Over-engineering that would have been
solving a non-issue.

The real hazard was elsewhere, and it is fixed: `setItem` swallowed **every**
write error, so a Keychain refusal — a locked device during a background flush,
storage full, an encryption key invalidated by a reinstall — was indistinguishable
from a successful save, and the whole queue silently vanished at the next launch.
`setItem` now reports whether the write landed; the queue warns once, keeps the
writes in memory for the session, and tells the user rather than pretending.
`offlineQueuePersistence.test.ts` covers both the footprint and the refusal.

## 6. Fibre, end to end (`2e89cbe`)

**What each source actually provides** — checked in the code, not assumed:

| Source | Fibre? | Detail |
|---|---|---|
| Open Food Facts | **Sometimes** | `fiber_100g`, present for some products only |
| USDA FoodData Central | **Sometimes** | nutrient `1079`, present when measured |
| Gemini scan | **Ambiguous** | the prompt asks for `fibre` but instructs "use 0 for unknown", so its 0 cannot be trusted as a measurement |
| Typed by hand (label-scan, custom food) | **Yes** | a real number the user entered |

Backend: `SearchResult.Fibre` is now `*float64`, so "this source has no figure
for this food" stops being reported as a confident 0 g. Absent → `null`; a
measured 0 stays 0. Both the search and barcode endpoints return it.

App: items carry an optional `fibre`, absent when unknown. It is written
(`logInputFromItem`, `logPatchFromItem`), read back (`mealsFromLogs`), carried
from a search hit and a barcode product into the sheet, rescaled with the serving
(`basisOf`), and shown on the detail sheet only when the row has one.
`savedInputFromApp` no longer sends a hardcoded 0. Summary's Macros row shows the
day's real total and keeps the existing "Not tracked" state only when nothing
logged that day came from a source carrying fibre.

**Known limit, logged not hidden:** `food_logs.fibre` is a plain number
server-side, so a stored 0 cannot be told apart from "never recorded". The app
treats only a positive value as known, which means a genuine 0 g food (meat, oil)
reads as unknown rather than as a measured zero. That is the conservative
direction. The fix is making the column nullable — a schema migration over
existing rows, which was out of scope tonight and is in DECISIONS.md.

Verified on device: two logged rows carrying 7 g and 4 g render as
**"Fibre 11 / 25 g"** (`docs/followup/item6_fibre_macros.png`), and the detail
sheet shows "Fibre 7 g" for the 200 g row.

## 7. Summary's gym status card — **kept** (`f3fdd0c`)

The condition was checked in code before deciding, as instructed, and it failed.

- **Summary:** `GymStatusCard`'s button calls `logGymSession()` directly → one tap.
- **Gym tab:** `GymSessionButton` is presentational; `gym.tsx` passes
  `router.push('/gym/log-session')`, which opens the sheet. The session is logged
  by a **second** tap on the sheet's own pill.

`logGymSession()` has exactly three call sites: Summary, the sheet's save, and
`gym/session.tsx` finishing a full scheduled workout. So the Gym tab has no
one-tap log, and removing the Summary card would have deleted the only one in the
app. **The card stays and the design conflict stays logged**, exactly as the
structural pass decided.

A tripwire test now fails if the Gym tab ever calls `logGymSession()` directly —
that is the moment to revisit this.

## 8. Device verification (`ac766b1`)

**V7 — tap-to-log: PASS.** Logged a session through the real sheet on the Gym
tab. The app POSTed `{"date":"2026-09-12","duration_minutes":null}`, and the
month grid went from "4 sessions · 2h 30m · 1 untimed" to **"5 sessions · 2h 30m
· 2 untimed"**, with today (12 September) shaded in the lowest intensity band and
still ringed as today. Correct date, correct band for an untimed session, and the
minutes total correctly did not move.
Captures: `item8_v7_before_log.png`, `item8_v7_after_log.png`.

**V6 — logged-item flow: PASS.** Opened the 200 g Porridge row:
- presets read **100 / 200 / 300 / 400 g** (½×, 1×, 1½×, 2× of the row itself);
- picking 300 g rescaled to **510 kcal, P 18, C 87, F 9, Fibre 11 g** from the
  row's own per-gram values;
- **"Edit values manually"** revealed the fields, seeded with those numbers;
- switching Breakfast → Dinner and pressing the pill sent
  `PATCH /api/food/logs/{id} {"meal_type":"Dinner","quantity":300,"calories":510,"protein":18,"carbs":87,"fat":9,"fibre":11}`.

Captures: `item8_v6_sheet_presets.png`, `item8_v6_after_move.png`.

**V1 — keyboard avoidance: NOT VERIFIED.** Stated plainly rather than dressed up.
The background tools focus a text field through the accessibility API instead of
a touch, so the software keyboard never appeared — I toggled the Simulator's
hardware-keyboard setting and retried, and it still did not. Raising it needs
full-screen control, which needs an approval dialog nobody was there to answer.
What *is* verified: at the new detent the whole form and the pill are on screen
at rest, and in code `SheetContent` wraps the body in a `KeyboardAvoidingView`
(`behavior="padding"`) around a `ScrollView` whose last child is the pill. The
empirical overlap check is still outstanding, on both log-session and the detail
sheet's number fields.

**Streak display: STILL HAPPENING, and worse than reported.** On a cold launch
Summary shows the seeded streak — 13 in this dev build — and **stays there**; 17
seconds later it still read 13. It only corrects once the Gym tab runs `useGym`
and hydrates the store, which is what made it show 2 earlier in the session. In a
release build the seed is 0, so a real user would read "0 day streak" until they
opened the Gym tab. Pre-existing and deliberately out of tonight's scope.
Captures: `item8_streak_stale.png`, `item8_streak_settled.png`.

The same shape affects Summary's macros: they only become real once the Food tab
has hydrated the store. Both are the same root cause — Summary reads store state
that other tabs own — and fixing it is a V-item-sized change.

---

## Tests, before vs after

| Gate | Before | After |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | 0 errors |
| `npx eslint src` | 0 errors, 35 warnings | 0 errors, 35 warnings |
| `npm test` (app) | 56 suites / 778 tests | **62 suites / 803 tests**, 4 snapshots |
| Backend with real Postgres | 631 pass / 0 skip | **632 pass / 0 skip / 0 fail** |

New app suites: `coldStartReplay`, `freezeToday`, `gymDurationHonesty`,
`offlineQueuePersistence`, `fibrePipeline`, `oneTapGymLog`. Two existing pins
were rewritten rather than deleted, because item 6 deliberately changed what they
asserted: `summaryNoFabrication`'s "fibre is never tracked" and `foodDetail`'s
"no fibre on the sheet" now pin the new contract — fibre appears only where a
source provided it.

New backend test: `TestSearchLeavesFibreNilWhenTheSourceHasNone`, covering an OFF
product with no `fiber_100g`, a USDA row with no nutrient 1079, and an OFF
product with a genuine `fiber_100g: 0`.

The gate ran after every item; neither baseline dropped at any point.

## What I did not do

- Did not remove Summary's gym card (item 7's condition failed — see above).
- Did not add a queue size cap (the measurements say it is a non-issue).
- Did not make `food_logs.fibre` nullable (a schema migration over existing rows).
- Did not fix the streak/macros hydration bug (explicitly out of scope).
- Did not touch the 23 parked screens, item 7 (the 3D body), or any V-item beyond
  those already done plus what this prompt named.
