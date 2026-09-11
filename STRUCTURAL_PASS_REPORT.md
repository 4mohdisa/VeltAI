# Structural pass — 2026-09-11

This was an unattended overnight pass on `main`. It built the data defect D1 and
five of the design mismatches from the verification pass (V1, V2, V6, V7, V16),
in the order below, with one commit per item. The other twelve V-items, item 7
(the 3D body) and the 23 parked screens were not touched. Decisions made along
the way are logged in `DECISIONS.md` under "Structural pass (2026-09-11)".

| # | Item | Commit | What changed |
|---|------|--------|--------------|
| 1 | D1 muscle casing | `61a7660` | A migration lowercases the library's muscles and adds CHECK constraints. The seed upsert now rewrites any drifted muscle. |
| 2 | V7 Gym calendar | `7cb0ae9` | A date-keyed month grid built from `listSessions({from,to})`: ‹ › paging, M–S header, intensity by minutes trained, today ringed, freeze days, and "N sessions · Hh Mm". |
| 3 | V2 Avatar | `a7f0d00` | One shared `ProfileAvatarButton` on Summary, Food and Gym. |
| 4 | V1 Sheet header | `8815bfa` | An opt-in `leading` SheetContent variant (title and subtitle on the left, × on the right) on seven sheets. Save moved to a bottom pill; `gym/freeze` is unchanged. |
| 5 | V16 Summary cards | `b16cfdd` | Energy balance → This week → Workouts → Macros, from one week read plus `useGymRange(7)`. |
| 6 | V6 Food detail (logged) | `b32607f` | Serving presets from the row's own per-gram values, read-only macros behind "Edit values manually", and a meal switch written to the server. |

**D1's premise was false.** The seed is all lowercase: the capitalised values
the verification pass saw were Category labels and stub data. The fix still
enforces the invariant where the data lives, so no client case-fold is needed.

---

## Test results, before vs after

| Gate | Before the pass | After the pass |
|------|-----------------|----------------|
| `npx tsc --noEmit` | 0 errors | 0 errors |
| `npx eslint src` | 0 errors, 35 warnings | 0 errors, 35 warnings |
| `npm test` (app) | 44 suites / 694 tests | **56 suites / 778 tests**, 4 snapshots, all passing |
| Backend `go test ./...` with real Postgres | 623 pass / 0 skip | **631 pass / 0 skip / 0 fail** |

The eight new backend tests are:
- D1 (4): `TestLibrarySeedMusclesAreCanonical`, plus three PG tests — the primary and secondary CHECK constraints each reject a non-canonical muscle, and the seed rewrites a drifted row.
- V6 (4): three fake-store tests — a move, an unknown meal returning 400, and another user's row returning 403 while staying put — plus `TestPG_MealMoveOnlyMovesTheOwnersRow`, which runs through the real handler and reads the row back from the database.

The PG tests skip without `LUME_TEST_DATABASE_URL`, so every backend count
above was taken with it set.

The gate ran after every item and neither baseline dropped at any point.

---

## Screenshots against the design

The design references are the artboards in `SummaryScreen.dc.html`,
`GymScreen.dc.html` and `FoodScreen.dc.html`, rendered locally at 402×874. They
are unchanged since 2026-09-06. Exporting them to image files with headless
Chrome produced blank pages (the design runtime needs the style injection used
in the browser), so they are cited by artboard, as in `VERIFICATION_REPORT.md`.
"Before" captures are from the verification pass; "after" captures are in
`docs/structural/`. All captures ran against a local stub, because the
simulator has no Clerk token.

| Item | Before | After | Against the design |
|------|--------|-------|--------------------|
| V7 | `docs/verification/03_gym_success.png`: an index-keyed heatmap, drawn from the **dev seed** (see the correction in `VERIFICATION_REPORT.md`) | `v7_gym_clean_launch.png`: September grid, M–S, 1 September on Tuesday, today (11th) ringed, four stub sessions shaded by minutes, "4 sessions · 2h 30m · 1 untimed", Less→More ramp. `v7_gym_before_log.png`: the same month with an app-written session on the 11th, "5 sessions · 3h 30m · 1 untimed" | Matches the design's grid, paging, ramp and summary line. The design's "5 sessions · 4h 21m" is sample data. |
| V2 | `01_summary_success.png`, `02_food_success.png`, `03_gym_success.png` (avatar on Summary only) | `v2_summary_avatar.png`, `v2_food_avatar.png`, `v2_gym_avatar.png` | Avatar top-right on all three tabs, in the same position and size. |
| V1 | `16_food_add_sheet.png`, `11_food_calendar.png`, `12_food_quick_add.png`, `13_food_saved.png`, `26_gym_log_session_sheet.png` (× left, title centred, ✓ right) | `v1_add.png`, `v1_calendar.png`, `v1_quick_add.png`, `v1_saved.png`, `v1_custom_food.png`, `v1_log_session.png` | Title and subtitle on the left, a 40pt × on the right, save as a full-width pill. As in the design, the pill sits at the end of the scroll content. |
| V16 | `01_summary_success.png` (gym status → nutrition ring → energy → week → workouts → plan) | `v16_summary_success.png`: Energy balance −624 kcal deficit, intake ring "1,240 / 2,100 · 59% of goal", "Burned 1,864 · No burn target set"; This week "1,849 kcal in per day" with paired bars and a dashed goal line. `v16_summary_empty_energy.png`: a new user, "Nothing logged or burned yet today…", bare rings, "No calorie goal set", Burned "—" | Matches the design's first two cards. The lower cards were not captured (see "Not verified on device"). |
| V6 | none | none: opening a logged row needs a tap | Proven by `render/foodDetailLogged.render.test.tsx` (see below). |
| D1 | — | — | No UI change. |

The rest of the V1 sheet set, the food detail sheet (all five modes), uses the
same variant. Its captures need a tap to open, so none were taken.

---

## Every data gap, handled by omission or an honest state

Nothing in this pass prints a number the server did not send.
`summaryNoFabrication.test.ts` and `foodDetail.test.ts` pin the omissions, so a
later pass cannot quietly fill them in.

**Summary (V16)**
1. **Steps**: omitted. There is no step data; the HealthKit seam is a no-op.
2. **Burn target**: there is none. The inner ring is a bare track, and Burned reads "No burn target set", never "/ 2,400".
3. **No calorie goal**: no "/ goal" and no "% of goal". It reads "No calorie goal set".
4. **No body stats** (no BMR): Burned is "—", and the net is replaced by "Add your body stats in onboarding to see your net balance."
5. **Nothing logged or burned today**: an empty state, not a card of zeros beside dashes.
6. **Failed week read**: "Couldn't load today's energy balance. Pull down to try again." and "Couldn't load this week…". A skeleton shows while loading.
7. **A day the server couldn't compute** (This week): no burned or net bar, the readout shows "—", and the net average leaves it out (and is "—" if no day qualifies).
8. **"of 5 sessions"**: omitted, because there is no weekly target. Workouts shows the count alone.
9. **Gym calories on Workouts**: omitted. It shows minutes trained instead.
10. **Sessions with no duration**: counted, and labelled "N without a duration", never given a length.
11. **Fibre**: "Not tracked · target X g", never "0 g". The server has a fibre column, but the app never sends a value.

**Gym calendar (V7)**
12. **Loading or failed month**: "Loading sessions…" or "Couldn't load this month's sessions", never "0 sessions". This was the false stat V7 existed to fix.
13. **Untimed sessions**: drawn in the lowest non-zero band and counted as "K untimed".
14. **Future days**: white cells with a hairline border, never drawn as rest days.
15. **Freeze days**: only the streak's `last_freeze_date` and freezes applied on this device.
16. **Seed**: the dev-seed calendar is gone in both builds.

**Food detail sheet, logged mode (V6)**
17. **Fibre**: omitted. A logged row never stored any.
18. **Thumbnail**: omitted. Log rows carry no image.
19. **Presets for a row with no weight** (a kcal-only quick add): none, rather than invented ones.
20. **Preset values**: scaled only from the row's own values per gram, never from a catalog lookup.

**Avatar (V2)**
21. **No profile name**: a person glyph, not placeholder initials.

---

## Fetch strategy (V16): what was chosen, and why

**Chosen:**
- One `GET /api/energy-balance/week` via `useEnergyWeek()`: today's row drives Energy balance, and the seven days drive This week.
- `useGymRange(7)` (`GET /api/gym/sessions?from&to`) drives Workouts.
- Macros still come from `useDashboard()`.
- Pull-to-refresh refetches all three.

**Why:**
- Energy balance and This week are two views of the same server days. One read means they can never disagree. A separate `getBalance` could land at a different moment from the week and show a today that doesn't match the bar above it.
- It is one fewer round trip on the home screen.
- It adds no endpoint, so there is no backend change and no new route needing ownership tests. The week endpoint already existed and already backs the This week detail screen.
- The cost is that Energy balance waits for a seven-day payload, which is a few hundred bytes.

**Rejected:**
- A combined `/api/summary` endpoint: a new route with its own tests, for no present need.
- Keeping `getBalance` beside the week read: two reads of the same data.

---

## The one-tap gym log still exists

Yes. `GymStatusCard` stays on Summary, below Macros, with its `logGymSession()`
tap. The design removes that card, but the app has no other one-tap log, so
removing it would have deleted a feature. This is a logged conflict (human call
7). It is pinned by `summaryNoFabrication.test.ts` ("the one-tap gym log is
still on Summary"), and `gymLogToCalendar.test.ts` covers its write path. It
sits below the fold, so it was not captured on device.

---

## V7 proven with a real logged session

The stub recorded writes: a session the app POSTs is stored and returned for its
date. On the first launch of the V7 check, the app POSTed a session through its
real mutation path (dated 2026-09-11, 60 min). The calendar drew it on the 11th
in the top band and counted it: "5 sessions · 3h 30m · 1 untimed"
(`v7_gym_before_log.png`). After the stub restarted, the same month read
"4 sessions · 2h 30m · 1 untimed" with today ringed and empty
(`v7_gym_clean_launch.png`). Both come from server rows by date; neither is a
seed.

What triggered that POST is unexplained (human call 3). I couldn't re-run the
deliberate tap-to-log because the Mac was locked. Its write path is covered by
`gymLogToCalendar.test.ts`, which mocks fetch, checks the POST carries today's
real date and length, and checks the calendar counts it exactly once after the
server's row is read back.

## V6 proof

- `render/foodDetailLogged.render.test.tsx` renders the real sheet and checks that:
  - the values read as text until "Edit values manually" opens the fields
  - the presets are 100/200/300/400 g for a 200 g row, and picking 400 g doubles every value
  - switching to Dinner and pressing "Save changes" moves the row into Dinner
  - no fibre appears anywhere
- `foodMealMove.test.ts` checks the move is one PATCH, `{meal_type: 'Dinner', …}`, and that an edit which stays in its meal sends no `meal_type`.
- The backend tests are listed above.

---

## Not verified on device

The Mac's screen was locked for the whole pass, so the simulator took no taps,
drags or typing. The simulator integration also reports that Xcode isn't
selected (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`).
Captures were taken with `xcrun simctl` deep links. Not exercised as a result:

- **V1 keyboard avoidance.** This was required, and it was not tested: nothing
  was typed on device, so whether the keyboard covers the new bottom pill is
  unknown.
- **V7 tap-to-log.** See the V7 proof above.
- **The V6 sheet.** See the V6 proof above.
- **Summary below the fold:** Workouts, Macros and the gym status card.

---

## Human calls needed

These are also in `DECISIONS.md`:

1. **The log-session sheet's 0.6 detent** puts its new bottom pill below the fold. The fix is the sheet options in `_layout.tsx`, which this pass left alone.
2. **`gym/freeze` defaults to tomorrow** while the server freezes today. This is pre-existing, and the sheet is parked.
3. **An unexplained session POST** (today, 60 min) at the first simulator launch. Replay never re-dates, and log-session posts only on Done. A clean launch wrote nothing. Worth checking the persisted offline queue on a real device.
4. **The local gym store defaults `durationMin` to 60** for quick-log history. This is pre-existing.
5. **Offline-queue bodies persist in SecureStore/Keychain.** Worth checking that a long offline backlog stays within its size limits.
6. **Fibre:** wire it end to end (scan, search, barcode, then the log), or keep "Not tracked".
7. **The Summary gym status card:** the design drops it. Remove it once another one-tap log exists?
8. **Device checks:** run V1 keyboard avoidance, the V7 tap-to-log and the V6 sheet once the simulator can take input. Also run the `xcode-select` command above.
9. **Summary's header streak** reads the store through `useDashboard()`, and only `useGym` hydrates the store from the server. In the dev build it showed the mock 13 while the server said 2. This is unchanged by this pass, but a release build probably reads 0 until the Gym tab loads.

## Housekeeping

The following were all removed or stopped, and nothing temporary was committed:
- the recording stub (`.design-sync/stub`)
- the local design copies (`.design-sync/previews/*`)
- the pass's `launch.json` entries
- the scratch Postgres, Metro, the stub and the design-preview servers

The existing `.gitignore` edit and `.design-sync/` stay unstaged, as they were
before the pass.
