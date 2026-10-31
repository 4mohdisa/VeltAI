# Design gap analysis — 2026-09-13

An analysis-only pass. **No code, migration or config was changed.** The only file
added is this one.

Every verdict below was re-derived from the design files and the app source read
side by side. No prior report was used as evidence, and no prior verdict was
inherited. Where a prior report turns out to have been wrong, it is named in the
final section.

## How this was done

1. The four design screens were re-fetched from the Claude Design project
   (`f00a75f6-…`) into `.design-sync/previews/` and read **in full**, including
   each file's `<script type="text/x-dc">` `DCLogic` class, which holds the real
   copy strings, state machine and handlers:
   `SummaryScreen.dc.html` (71 KB), `FoodScreen.dc.html` (106 KB),
   `GymScreen.dc.html` (181 KB), `ProfileScreen.dc.html` (74 KB), plus
   `Lume App.dc.html` (the tab shell), `README.md` (conventions) and `github.md`
   (the screen→repo map).
2. For each screen the design was written up **before** the app was opened, then
   the app source was written up independently, then the two were compared value
   by value — not by impression.
3. The app was run on the simulator and captured where possible
   (`docs/gap/*.png`).

### Design conventions this pass measures against

From the design project's own `README.md`, quoted:

- "Header: no solid nav bars. A blurred top gradient (`backdrop-filter: blur(18px)`)
  plus a floating 38px circular back button at top-left (`top: 50px; left: 14px`).
  The screen title sits inside the scroll as an eyebrow + large title."
- **"Number entry uses the native keyboard: tapping a value opens a slim edit bar
  (label, focused `<input inputMode="numeric|decimal">`, Done). No custom keypad."**
- "Toasts: dark pill, bottom of screen, 2.2 s."
- "Colour is functional only… Buttons are black pills, cards are grey fills with
  no border."
- "Every screen is `402 × 874` (iPhone 16 Pro), light mode only."

The number-entry rule matters repeatedly below: it is the single convention the
app departs from most often, and it is the core of the gym log-session problem.

### Honest caveats about this pass

- **The design files are stored double-encoded.** `−`, `—`, `·` and `±` appear as
  mojibake in the raw bytes (`Chest Â· shoulders`). Every quoted string is the
  repaired text, not the literal bytes. This was observed independently in three
  of the four files.
- **The design is a prototype with fixture data.** Numbers like `92%`, `138`,
  `$4.99`, `14 Sep 2026` are literals in `renderVals()`, not a spec of real
  values. Where that matters, the section says so. The *presence* of a field is a
  design statement; its value usually is not.
- **The device captures are committed alongside this document** under
  `docs/gap/`, following the convention of earlier passes (`docs/followup/`,
  `docs/structural/`). Nothing else in this commit is a file the app builds from.
- **Device captures were partial.** `simctl` screenshot failed mid-pass
  ("Timeout waiting for screen surfaces") and recovered after a simulator reboot;
  five screens were captured (`docs/gap/app_{summary,food,gym,log_session,profile}.png`).
  The comparison itself is source-based, which is the stronger evidence for
  layout values anyway.
- **Sub-screen depth varies.** The four Summary detail routes (`/energy`,
  `/dashboard/{week,training,nutrition}`) were confirmed to exist and to be
  reachable, but their internals were not compared against the design's five
  detail-sheet variants. That is the largest known hole in this pass.

---

## Summary table — worst first

**24 surfaces ❌ DIFFERENT, 14 ⚠️ PARTIAL, 4 🔨 BUILT (not verified), 0 ✅ EXACT.** No surface compared in
this pass matched the design on every checked value.

| Screen / surface | Verdict | One-line reason |
|---|---|---|
| **Gym — session logging (log sheet)** | 🔨 BUILT (not verified) | The log sheet is now the design's plan-aware chooser: title "How did it go?", the plan subtitle (`{name} · N exercises · about M min`, duration derived at 3.2 min a set), the 2-column grid of "Different weights" / "Only some of it" over the full-width "Something else" row, and the footer pill "It went as planned" + caption, which commits the plan exercise by exercise through `logGymSession(session, workout)` at completion rate 1. The duration slider, both steppers and the notes field are gone, so nothing is collected that the server drops. The three tiles all open `/gym/session`, which is where this app adjusts numbers, ticks exercises and adds extras; nothing scheduled falls back to the design's rest-day state. Difference 16 remains closed. A failed today fetch no longer shows as a rest day (`src/app/gym/log-session.tsx`): the sheet shows `t('gym.loadFailed')` and offers Try again instead (not verified). |
| **Gym — multiple logging methods** | ❌ DIFFERENT | The design implies five logging flows; the app exposes one reachable questionnaire plus a conditional session screen, while the backend already supports nearly all five. |
| **Gym — workout / template detail** | ❌ DIFFERENT | Design is a live accordion editor with per-set rows, warm-up marking, rest/tempo/RPE tiles, notes, supersets and a keypad bar; the app is a name + duration form whose exercises become read-only once saved. Only the number-entry bar difference is closed (not verified): the four planned-value pads in `PlannedValuesForm` — `Planned sets`, `Target reps`, `Target weight · kg`, `Rest · seconds` — now type through the shared `NumberEntryBar`. |
| Gym — Muscle focus / 3D body | ❌ DIFFERENT | The design embeds an interactive 3D body three times with tap-to-select, a popover and volume chips; the app has no 3D body and renders a static bar list the design does not have on that card. |
| Gym — day / session detail | ❌ DIFFERENT | The design's calendar cells open a full day view (energy in/out, what I ate, muscles hit, locked/unlocked editing); the app has no such route, and its calendar cells are not even tappable. |
| Gym — "My schedule" card | ❌ DIFFERENT | The design's three-day preview card on the main tab does not exist in the app at all — only a settings row. |
| Gym — streak strip | 🔨 BUILT (not verified) | One-row streak strip built; drops Longest, Total and Freezes; tap to /gym/streak kept as accepted deviation; flame pulses, zero-state greys and artwork remain different and are parked. |
| Gym — "Log this session" CTA | ❌ DIFFERENT | Different copy, icon, position and conditions, and it pushes a route where the design opens a sheet in place. |
| Gym — streak detail & session history | ❌ DIFFERENT | Neither screen exists in the design, and both are still in pre-design chrome using deprecated grey tokens. |
| Food — Day log (main view) | ❌ DIFFERENT | Design's calories card is goal-relative with a progress bar and four macro bars; the app shows total logged, no goal, three macros — plus a search field the design puts in a sheet. |
| Food — Food detail sheet | 🔨 BUILT (not verified) | All six numbers are now tap-to-edit through the shared `NumberEntryBar` — the design’s captions and keyboards (`Serving size · grams` and `Calories · kcal` numeric, the four macros decimal), a grams chip, a tappable kcal readout and a 2×2 macro grid replacing the boxed fields. |
| Food — Quick add | ❌ DIFFERENT | Rebuilt to the design: hero kcal figure, ±50 discs, +100/+250/+500/+750 presets, no Label field, and tapping the figure opens the shared `NumberEntryBar` ("Calories · kcal", numeric, 5-digit cap) with the discs, presets and CTA hidden until Done. BUILT, not verified: the confirm pill is 52pt high (padding via space.md), the Meal control passes the compact prop of SegmentedField, the quick add detent is fitToContents, and the MEAL caption and toast exist. Still open: the confirm label is 17/24 against the design's 17/22 (waiting on Isa); the Meal chip keeps 8pt horizontal padding where the design has none; there is no selection transition on the Meal chip; there is no blinking caret; the copy is hardcoded English; the offline toast names no meal; the screen has its own flex:1 KeyboardAvoidingView at src/app/food/quick-add.tsx:114. |
| Food — Search | ❌ DIFFERENT | Design is a dedicated sheet with filter chips and a one-tap `+`; the app has an inline field whose results replace the day view, and its `+` is decorative. |
| Food — My dishes / Saved | ❌ DIFFERENT | Design is a photo gallery with a "New dish" tile; the app is a searchable text list with swipe-to-unsave. |
|  |  | Saved foods sheet title now t(food.savedTitle), design wording My dishes. Photo gallery layout not built. |
| Food — Add sheet | 🔨 BUILT (not verified) | Rebuilt to the design’s five tiles in its order — Search foods, Scan food, Barcode, My dishes, then Quick add as the full-width 88pt row — with the design’s copy, 46/19 discs and the meal-aware title "Add to lunch"; Scan Label and My Meals are no longer offered here (their routes are untouched), and Search foods lands on the food tab, which is where search lives. Main remaining difference: the Search foods tile lands on the food tab, where the design opens its dedicated search sheet with the search pill. Tile grid: two equal columns (flexGrow 1, flexBasis 40%, TILE_BASIS in src/app/food/add.tsx), 12pt gap from space.md. BUILT, not verified. Owner to check at 320pt and 430pt. Also open: SF Symbols vs inline SVGs, separate scan routes. BUILT (not verified): sheet bottom set to 34pt by marginBottom -space.xl on the tile grid in src/app/food/add.tsx, which cancels SheetContent paddingBottom space.xl (20pt) and leaves the 34pt safe-area inset. Device check on a 34pt-inset iPhone still open. Slot title uses addMenu slot keys. |
| Food — Scan flows | ❌ DIFFERENT | Design is one scanner with a Meal/Label/Barcode switch; the app is three separate routes with a multi-angle flow the design lacks. |
| Food — "Not in a meal yet" inbox | ❌ DIFFERENT | Design files unassigned items into meals; the app's card confirms an estimated weight with a slider. |
| Food — number-entry convention | ❌ DIFFERENT | The slim edit bar does not exist anywhere; a slider and ± steppers appear where the design has neither. |
| Profile — Settings root | ❌ DIFFERENT | Design is a pure list with trailing values; the app adds avatar + two streak cards, drops every value, reorders a group. |
| Profile — Account | ❌ DIFFERENT | Design card is name + email + three stats plus a Sign-in-method row; the app shows avatar + name only. |
| Profile — Subscription | ❌ DIFFERENT | Design is a gradient price hero + usage meters + billing rows; the app is one status card and two buttons. |
| Profile — Goals | ❌ DIFFERENT | Design is two radio cards + one inline calorie figure + read-only macro bars; the app is a segmented control + eight numeric fields. The calorie control is now the design’s borderless inline `statLarge` figure with the energy unit as a suffix, read-only in the secondary colour when Lume sets the targets (built, not verified); the other differences in this row remain. |
| Profile — Scan accuracy | ❌ DIFFERENT | Design is a 96px ring plus a "Recent corrections" list; the app is a linear bar plus two sections the design lacks. |
| Profile — AI insights | ❌ DIFFERENT | Design is three static insight cards + a push toggle; the app is a consent-gated hub with "Ask Lume" and dismissible feed. |
| Profile — Delete account | ❌ DIFFERENT | Design is one confirm screen with a Cancel button; the app is a three-step flow ending in a typed "DELETE". |
| Profile — Connected apps | ❌ DIFFERENT | Design has three providers incl. Apple Health with icon chips and inline pills; the app has two with emoji and full-width buttons. |
| Summary — Macros detail | ❌ DIFFERENT | The sub-line, section title and footer now match the design copy (built, not verified).<br>The design's macro history chart is still missing from the app.<br>App-only items remain: "Calories today" gauge, "Meals today" list.<br>Unset calorie goal: the footer does not show 0; an empty profile derives the 1,500 kcal floor (`src/lib/onboarding/deriveTargets.ts:73`), so no code changed. |
| **Summary (Home) tab** | ⚠️ PARTIAL | Cards that exist match closely in chrome and tokens, but the Steps card is missing, three non-design cards are added, and the day-scoping interaction does not exist. |
| Food — Calendar sheet | ⚠️ PARTIAL | Same structure and copy; cell sizing, today's marker and arrow treatment differ. |
| Profile — Preferences | ⚠️ PARTIAL | Same five controls and labels; selected-segment treatment inverted and the mixed-units rule differs. |
| Profile — Privacy | ⚠️ PARTIAL | All design rows and both footnotes present verbatim; the app adds group headers and an AI-processing group. |
| Profile — Support | ⚠️ PARTIAL | Identical rows, address and labels; eyebrow copy and send behaviour differ. |
| Profile — About | ⚠️ PARTIAL | Identical wordmark, tagline and meta rows; the app adds a header the design omits. |
| Profile — shared chrome | ⚠️ PARTIAL | The convention is implemented, but header height, gradient stops, mask fraction and back-button size all differ. |
| Food — FAB add menu | ⚠️ PARTIAL | Same two rows and copy; solid panel, darker scrim, different radius and row metrics. |
| Gym — main tab chrome & card order | ⚠️ PARTIAL | Same title block and card vocabulary, but the log CTA moves below two other cards, two app-only cards are added, and padding is 20 vs 16 throughout. |
| Gym — "My schedule" screen | ⚠️ PARTIAL | The week card is close; the design's whole "My workouts" section is missing from it, the sub-line is truncated, and the picker sheet differs in five ways. |
| Gym — today's session card | ❌ DIFFERENT | TodayCard cards use padding 16 (space.lg) via padded={false} (not verified); all four states still differ: rest day and planned lack the tap target and chevron, planned lacks the stats grid, and loading has no design state. Logged state BUILT (not verified): green pill via `t('gym.logged')`, sub-line `Logged today · N kcal burned` from the day's `calories_out_exercise` via `formatEnergy`, the trailing chevron, and a 3-up grid (Duration, Volume, Sets) and exercise chips from the logged session. Still open on the logged state: the Calories cell, pending per-session calories on the backend; the chevron on a non-tappable card; the tap target, which needs a day-detail route; and the design's wash on the pill, whose token awaits Isa. The card renders null only when the schedule fetch fails (`src/lib/data/gymSchedule.ts:38-40`), with no error message. |
| Gym — exercise progress | ⚠️ PARTIAL | Same chart idea, but no Muscles worked or Form guide cards, the bars encode weight rather than the design's metric, and the bottom stat pair is missing. |
| Gym — month heatmap | ⚠️ PARTIAL | Geometry, ramp and legend match value for value; the cells are not tappable, so the design's only route into the day detail is gone. |
| Gym — cross-cutting token drift | ⚠️ PARTIAL | The token system is faithfully mirrored; its application rounds the design's untokenised pixels and substitutes lighter type faces throughout. |
| Tab shell / tab bar | ⚠️ PARTIAL | Same three tabs + separate black "+", same 22pt offset and 62pt button; padding, active fill, label weight and shadows differ. |

Verdict key: ✅ every checked element and value agrees · ⚠️ same structure, specific
differences listed · ❌ meaningfully different layout, missing elements, or a
different interaction model.

---

# The gym log-session dialog

This is the calibration case, and the user's report is correct: it is **not** a
restyle or minor drift. The two surfaces are different features.

I verified the core of this personally, not only through analysis: I extracted the
design's log-sheet markup and handlers directly, and captured the app's sheet on
the simulator (`docs/gap/app_log_session.png`).

## What the design does

Opening "log" on a day with a plan shows a sheet titled **"How did it go?"**, with
a subtitle built from the day's plan — `logPlanSub` =
`(plan.name + ' · ') + N + ' exercises · about ' + totalM + ' min'`, e.g.
*"Push day · 4 exercises · about 42 min"*. The body is a 2-column grid of choice
tiles over a footer with the primary action:

| Control | Copy | Handler | Outcome |
|---|---|---|---|
| Tile | **"Different weights"** / "Same exercises, change the sets, reps or load" | `logAdjust` | Opens the session screen in adjust mode; per-set kg/reps edited via the slim keyboard bar |
| Tile | **"Only some of it"** / "Tick the exercises you actually did" | `logSomeOpen` | Opens a second sheet "What did you do?" / "Untick anything you skipped" |
| Full-width row | **"Something else"** / "Add an exercise that wasn't in the plan" | `logSwap` | Opens the exercise library sheet |
| Footer pill | **"It went as planned"** + caption "Logs {plan} exactly as scheduled" | `logAsPlanned` | Commits the plan verbatim, exercise by exercise |

Every branch ends in `logNow(list)`, which writes an exercise list for the day and
raises a celebration card (streak hero number, Time / Calories / Volume, a black
**"Nice one"** pill). Afterwards the day is *locked* — "Logged and locked. Numbers
are saved as they were." with an **Edit** → **Save changes** cycle.

Numbers are never typed into boxed fields: tapping a value opens the docked edit
bar (uppercase label such as `Weight · kg`, `Reps`, `Minutes`, `Speed · km/h`, an
autofocused `inputMode` input at `600 26px/32px` rounded, and a black **"Done"**
pill).

There is **no duration question, no effort rating and no energy rating anywhere in
the design's session logging.** Duration is *derived* (`minsOfEx`: sets × 3.2 min,
or the sum of cardio segment minutes).

## What the app does

`src/app/gym/log-session.tsx` is 80 lines and asks four subjective questions:

1. A static line: *"Everything here is optional — a one-tap log still counts."*
2. **Duration** — a drag-thumb `SliderField`, 0–180 step 5, rendering 0 as "Not set"
3. **Perceived effort (1–10)** — a ± `Stepper`, default 7
4. **Energy level (1–5)** — a ± `Stepper`, default 3
5. **Notes** — a multiline `TextField`
6. A black **"Log session"** pill

On save it calls `logGymSession({durationMin, effort, energy, notes})`, which posts
`{date, duration_minutes, notes}` with **an empty follow-up step list** — so no
`/exercises` rows and no `/complete` call are ever written from this path. `effort`
and `energy` are collected by the UI and then dropped: `GymSessionInput` has no
field for either (`src/lib/api.ts:709-714`, and the comment at
`src/lib/data/mutations.ts:181-182` says so outright). **Two of its four controls
change nothing on the server.**

## The differences, exhaustively

1. **Purpose.** Design: record *how the planned session actually went*. App: rate an unspecified workout. Different features.
2. **Plan awareness.** The design's sheet only exists when `exList.length > 0` and every string in it derives from the day's template. The app's sheet never reads `api.gym.getToday()`.
3. **Layout.** Design: a 2-column grid of 148pt choice tiles plus one full-width 88pt row, then a bordered footer with a pill and caption. App: a vertical stack of four labelled form fields.
4. **Title.** "How did it go?" vs "Log session".
5. **Subtitle.** Design carries the plan line; the app passes no `subtitle` at all.
6. **Primary button.** "It went as planned" (+ caption) vs "Log session".
7. **"Different weights" branch — missing.** No adjust mode, no route from the sheet into per-exercise editing.
8. **"Only some of it" branch — missing.** No tick list, no "What did you do?", no dynamic "Log N exercises" label, no partial commit.
9. **"Something else" branch — missing.** The log sheet offers no way into the exercise library.
10. **Empty-day fallback — missing.** In the design, opening "log" with nothing planned goes straight to the library; the app shows the same four fields regardless.
11. **Fields in the design, absent in the app:** per-exercise names, per-set kg, per-set reps, add/remove set, cardio minutes, cardio km/h, add/remove segment, per-exercise tick boxes, RPE, rest seconds, tempo, superset toggle, per-exercise notes.
12. **Fields in the app, absent in the design:** "Perceived effort (1–10)" and "Energy level (1–5)". The design has no session-level effort or energy concept at all.
13. **Duration.** The design never asks — it derives. The app asks on a 0–180 slider.
14. **Slider.** The design contains no slider anywhere in the logging path.
15. **Steppers.** The design contains no ± stepper anywhere. The app uses two.
16. **Number entry.** Design: tap a value → docked native-keyboard bar with a "Done" pill. App: no such bar exists anywhere in `src`.
17. **Confirmation.** Design: a modal celebration card with streak, Time/Calories/Volume and "Nice one". App: a toast, *"Gym logged — streak extended."* **Status: BUILT (step 1 of 3: component only, not wired).** Step 2 of 3: wired in log-session.tsx. Footnote still missing.
18. **Post-log state.** Design: "Logged and locked" with Edit → Save changes. App: a static "Logged today" pill, no edit path.
19. **Already-logged handling.** Design routes you into the day to edit or add extras. App shows *"Already logged today."* and dismisses.
20. **What is written.** Design commits a full exercise list. App writes one session row with duration + notes, no exercises, no completion.
21. **Silent data loss.** `effort` and `energy` never reach the server.
22. **Sheet height.** Design `max-height: 92%` with internal scroll; app `fitToContents`.
23. **Entry-point behaviour is inconsistent in the app.** Gym tab and the `+` menu open the questionnaire; Summary's card calls `logGymSession()` with **no arguments and no UI at all** — a third, silently different behaviour.

**Built:** difference 19 — an already-logged day no longer dismisses with *"Already logged today."*; `src/app/gym/log-session.tsx` now toasts the design's copy and routes to `/gym/session`, where the day can be edited or an extra added. Difference 18 (the "Logged and locked" Edit → Save changes cycle) stays an accepted deviation.

## Explicit correction of the prior report

`VERIFICATION_REPORT.md` line 100 records:

> `| Log session sheet | ⚠️ | S | 26_gym_log_session_sheet.png, live §5 | Reached by tapping the "+" menu. Controls are native: Duration slider, effort and energy steppers. Header mirrored (V1). |`

**That verdict is wrong.** It grades the sheet ⚠️ "minor drift", identifies the
only problem as a mirrored header, and presents "Duration slider, effort and
energy steppers" as acceptable — when those three controls are precisely what the
design does not contain, the design's four logging outcomes are all absent, and
two of the three controls are never persisted. The correct verdict is ❌
DIFFERENT. No other prior report assessed this sheet.

---

# Multiple gym logging methods

Food has photo scan, barcode, label scan, search, quick-add and saved foods. The
question is what the design intends for Gym, and what already exists underneath.

## What the design shows

Five distinct flows, four of them reached from the one chooser above:

| # | Flow | Design trigger | Handler |
|---|---|---|---|
| 1 | **Log as planned** — commit the day's template verbatim, one tap | Footer pill "It went as planned" | `logAsPlanned` → `logNow(exList)` |
| 2 | **Log adjusted** — same exercises, edited sets/reps/load | Tile "Different weights" | `logAdjust` → session screen in adjust mode |
| 3 | **Log partial** — only the exercises actually done | Tile "Only some of it" | `logSomeOpen` → `logSome` commits the ticked subset |
| 4 | **Log off-plan** — add an exercise that wasn't planned | Row "Something else" | `logSwap` → exercise library |
| 5 | **Freestyle / no plan** — log straight from the library | Opening log on an unplanned day | `sheetAdd` when `exList.length === 0`; includes *Add "X" as a custom exercise* |

Entry points into the chooser: the Gym tab pill **"Log this session"**, the same
pill on the session screen, the `+` menu row **"Log gym session"**, and a
cross-tab intent (Summary's `+` menu calls `onTab('gym', 'log')`, which opens the
chooser on the Gym tab — I verified this handler in `SummaryScreen.dc.html`).

**What the design explicitly does not show:** the Gym file contains no occurrence
of `health`, `strava`, `whoop`, `watch`, `scan`, `photo`, `camera`, `timer`,
`stopwatch` or `voice`. There is no live-workout timer, no wearable import, and no
camera analogue to Food's scanning. Templates and the weekly schedule are
*planning* surfaces that feed `exList`; they are not themselves logging methods.

## What the app exposes today

| Path | Reachable? | Writes a session? |
|---|---|---|
| Gym tab → "Log gym session" → `/gym/log-session` | Yes | Yes — when today has a plan and is not yet logged, the "It went as planned" pill (`src/app/gym/log-session.tsx:221`) commits the plan's exercises (`src/app/gym/log-session.tsx:116-119`) |
| `+` menu → "Log gym session" → `/gym/log-session` | Yes | Same |
| Summary → gym card button → `logGymSession()` inline | Yes | Yes — **zero fields**, no UI |
| Gym tab → TodayCard → "Start workout" → `/gym/session` | **Conditional** | Yes — full exercise logging |
| Profile → Connected apps → Strava / WHOOP sync | Yes | Yes, server-side import |

`/gym/session` has these entry points:

- `src/components/gym/TodayCard.tsx:168` — "Start workout", opens the screen plain.
- `src/app/gym/log-session.tsx:173` — the three chooser tiles, shown when today has planned exercises; each opens the screen in its mode (`adjust`, `ticklist`, `picker`).
- `src/app/gym/log-session.tsx:146` — the empty state's action, shown when today has no planned exercises; opens the screen plain.
- `src/app/gym/log-session.tsx:111` — the "It went as planned" pill when the gym is already logged today; opens the screen plain.

The three log sheet paths all route through `openSession` (`src/app/gym/log-session.tsx:103-104`).

The Start workout path is the conditional one. `TodayCard` returns `null` when the
fetch failed (null). Its branches then run in this order: `already_checked_in`
first (a bare header), then `is_rest_day` or no template (the rest day card, also a
bare header), then planned, the only state that renders the "Start workout" button.
So that button needs a template scheduled for today and a day not yet checked in.
The log sheet paths do not: the sheet opens from the `+` menu on any day, and from
the Gym tab until the day is logged (`GymSessionButton` is not pressable after that).

## What exists in the backend but is not a reachable logging flow

- **Exercise library** — `GET /api/gym/exercises`, table `exercise_library`, 125 seeded exercises across 12 canonical muscle groups. Reachable only *inside* `/gym/session` and `/gym/new-template`.
- **Per-exercise logging** — `POST /api/gym/sessions/{id}/exercises`, `PATCH/DELETE /api/gym/exercises/{id}`; `gym_exercises` carries `sets, reps, weight, weight_unit, rest_seconds, notes, parameters, rpe`.
- **Partial completion** — `POST /api/gym/sessions/{id}/complete` with `completion_rate`, table `gym_adherence` (`checked_in`, `completion_rate`, `customized`). This is exactly the backing for "Only some of it"; both `/gym/session` and the "It went as planned" pill call it, and the pill, on a day not yet logged, goes through `logGymSession` (`src/lib/data/mutations.ts:193`), which posts to `/complete`.
- **Templates** — full CRUD plus `template_exercises` with planned sets/reps/weight/duration/rest/sort order. Editing exercises on an existing template is explicitly out of scope in the app (`src/app/gym/new-template.tsx:4-6`).
- **Weekly schedule** — `GET /api/gym/schedule`, `PUT /schedule/{day}`, table `workout_schedule`.
- **Today / check-in** — `GET /api/gym/today` returns the template, exercises, `already_checked_in` and `session_id`. Nothing in the app surfaces `session_id`, so nothing can edit an existing session.
- **Parameterised cardio** — six schemas (`treadmill`, `cycling`, `rowing`, `stepping`, `intensity`, `jumpRope`) with `duration_minutes`, `speed_kmh`, `incline_percent`, plus `POST /api/gym/calories/preview` and `GET /api/gym/last-logged/{exercise_id}`.
- **Progress & patterns** — `GET /api/gym/progress/{exercise_name}`, `GET /api/gym/patterns`.

## The gap

| Logging method the design implies | Backend support? | Reachable UI today? |
|---|---|---|
| 1. Log as planned (one tap, verbatim) | **Yes** — sessions + exercises + complete; `GET /today` supplies the plan | **BUILT** (not verified) — label, placement and one-tap commit match, and `inputFor` now carries a cardio exercise's planned minutes in `notes` (`src/app/gym/log-session.tsx:57-65`) |
| 2. Log adjusted | **Yes** — same routes, `gym_exercises` columns | **Partial** — only inside `/gym/session`, opened by the conditional Start button or the log sheet's "Different weights" tile (`adjust` mode); no edit bar |
| 3. Log partial | **Yes** — `completion_rate`, `gym_adherence` | **Partial** — `/gym/session` checkboxes produce a rate; no tick-list sheet; the log sheet's "Only some of it" tile opens the screen in `ticklist` mode |
| 4. Log off-plan | **Yes** — exercise library | **Partial** — `ExercisePicker` only once already inside `/gym/session` |
| 5. Freestyle / no plan | **Yes** — a session needs no template | **No** — a response with no template shows the rest-day card, which has no Start button; `/gym/session` is still reachable from the log sheet's empty state (`src/app/gym/log-session.tsx:146`), where "Add exercise" opens the picker and the session saves with no template |
| 5b. Custom exercise ("Add 'X' as a custom exercise") | **No** — every write path uses `exercise_id` into `exercise_library`; no create-exercise route | **No** |
| 6. Per-segment cardio (`Leg 1: 10 min @ 7 km/h`, "Add segment") | **Partial** — schemas capture ONE flat parameter set per exercise, not a list of segments (`parameters` is jsonb, so a list is storable but not validated) | **No** |
| 7. Session-level effort / energy (**app-only, not in the design**) | **No** — `rpe` is per-exercise; no session column, no API field | **Yes** — and the values are discarded before the request |
| 8. Strava / WHOOP / Apple Health import (**not in the design**) | **Yes** — dedupe columns and a session insert path | **Yes** for Strava/WHOOP |

**The short version:** the backend already supports essentially every logging
method the design implies. The log sheet is the chooser, and its tiles open the one
screen that implements most of the branches, so that screen does not depend on the
conditional Start button.

Per the brief, no new flow is proposed here.

---

# Summary (Home) tab

**Verdict:** ⚠️ PARTIAL MATCH
**One-line reason:** Every card the app builds is the design's card — same order, tokens and geometry — but one of the design's five cards is missing, three cards the design never shows are added, and the screen-level "tap a bar to rescope every card" interaction does not exist.

### Design write-up

402×874, light only. Root `--lume-surface-background-alt`. A fixed 82px blurred
strip (`blur(18px) saturate(1.4)`, gradient 86%→20%, mask `#000 56%`). Scroll
content `padding: 70px 16px 158px`, column, **`gap: 14px`**, entrance `lumeFade`.

1. **Title block** — eyebrow `600 13/16`, `letter-spacing 1.1px`, uppercase, secondary-label, literal *"Sunday 9 August"*; `<h1>` `800 30/36`, `letter-spacing -0.6px`, **`padding-right: 52px`** to clear the avatar; streak row with a 14×14 flame filled `--lume-category-streak` and footnote *"14-day streak"* (hyphenated). **Not a button.**
2. **Energy balance card** — pressable; `CardHeaderRow` (17px flame in `category-calories`, "Energy balance", scope `{{ gSelLabel }}` = "Today" or a day name, chevron). Hero `{{ gNetFmt }}` = **"−624"** in `stat-large` (`letter-spacing -1px`) + "kcal deficit"; `sgn()` always prefixes **"+"** for values ≥ 0. Two filled rings in a 104×104 SVG: outer r44 intake/goal in `category-calories`, **inner r29 burned/2400 in `accent-blue`**, both animating `stroke-dasharray` over 1100 ms. Key rows: Intake **1,240 / 2,100** + "59% of goal"; Burned **1,864 / 2,400** + **"78% of target"**.
3. **"This week" card** — only the header is the button (with `margin: -8.8px 0` so the 44pt target does not inflate the row). Segmented "In & out" / "Net" at `600 15/20`. Stat `1,899` + "kcal in per day". Chart 130px: three gridlines, **hardcoded axis labels "0" / "1,400" / "2,800"** (fixed `AX = 2800`), a dashed goal line at 98px, 12px paired bars (radii 6/6/3/3), unselected `opacity 0.28`, staggered 700 ms transitions. Net mode: ±800 axis, 16px bars over a **59px** span (min 3px). Day letters hardcoded **M T W T F S S**. Readout *"Sun 9 · in 1,240 · burned 1,864 · net −624 kcal"*.
4. **Steps card** — header (two footprints in `category-fibre`), `{{ gSteps }}` **"7,860"** + "steps", sub *"of 10,000 goal · 354 kcal burned"*, and a 52px 7-bar chart whose bars set `gDay`.
5. **Workouts card** — `{{ gSessions }}` **"4"** + **"of 5 sessions"**, sub *"2,000 kcal burned in the gym"*, 7 pips at 32px/`radius.md`, `category-positive` when trained.
6. **Macros card** — header glyph is **four circles in four category colours**; four rows (Protein 96/150, Carbs 132/230, Fat 38/70, **Fibre 21/30**), each name `500 15/20`, value `stat-small`, target `/ n g`, 12px pill bar animating width over 1100 ms.
7. **Floating profile button** — 44×44 at `top:64px; right:16px`, glass, **person glyph only** (no initials variant).
8. **Detail sheet** — an in-screen push (`z:80`, `lumePush`) per card, with kicker + title, a 176px hero chart, a 120px secondary chart, a "Breakdown" card and a footer note. Five variants: energy, week, steps, training, macros.
9. **Add menu**, **streak celebration** (246pt modal, pulsing ring, "Keep going"), **tab bar** — see the shell section.

**States:** `loaded` flips after 160 ms as an *entrance animation*. There is **no
skeleton, no error state and no empty state anywhere** — every number is always
present. `gDay` is screen state: tapping any week bar or step bar rescopes the
Energy balance card, the Steps card, the Macros card and the readout.

### App write-up

`src/app/(tabs)/index.tsx`. `SafeAreaView` on `surface.backgroundAlt`; scroll
`paddingTop: insets.top + 12` (≈71), `paddingHorizontal: 16`, **`gap: space.md` (12)**,
`paddingBottom: TAB_BAR_CLEARANCE` (≈100). Pull-to-refresh. `FloatingHeader
height = insets.top + space.xl` (≈79) with an SVG gradient 0.86→0.20 and a
`BlurView intensity 30` over the top 56%. `ProfileAvatarButton` at
`top: insets.top + 4` (≈63), right 16, showing **initials** when a name exists.

Order rendered: `PendingSyncBanner` → `EnergyBalanceCard` → `WeekEnergyCard` →
`WorkoutsWeekCard` → Macros card → `GymStatusCard` → `MorningBriefCard` → plan card.

`EnergyBalanceCard`: Hardcoded strings wrapped in t() (BUILT, not verified).

Card chrome, `CardHeaderRow` tokens, ring geometry, chart constants
(`CHART_H 130`, `GUTTER 46`, `BAR_W 12`, `DIM 0.28`, `NET_BAR_W 16`, radii 6/6/3/3),
pip metrics (32/6/`radius.md`, `600 12/16`) and the macro row stack all match the
design value for value.

### Differences

1. **The Steps card is absent entirely** — no step data exists in the app; `summaryNoFabrication.test.ts` actively asserts the card is not built.
2. **Three non-design cards are rendered:** `GymStatusCard`, `MorningBriefCard`, "Today's plan".
3. **`PendingSyncBanner`** sits where the design has nothing.
4. **The screen-level day-scoping interaction does not exist.** `WeekEnergyCard` owns a private `picked` state affecting only its own bars; Energy balance and Macros are hardcoded to `scope="Today"`.
5. **Detail views are pushed routes**, not the design's in-screen sheet; the design's fifth (steps) has no counterpart.
6. **The streak celebration modal has no counterpart** — the same sentence is delivered as a toast.
7. **The app has loading, error and empty states the design does not specify at all** (streak skeleton, `LoadFailedNotice`, card skeletons, "No calorie goal set", "No burn target set", "Not tracked"). Given the design has no failure states at all, these are additions the product needs — but they are differences.
8. **No entrance or value animations** (rings 1100 ms, bars 700 ms staggered, macro widths 1100 ms, pip 260 ms, page `lumeFade`).
9. **Pressed states differ** — design changes card fill to `light-1`; the app applies `opacity 0.85`.
10. **The burned ring is never filled** — `fraction={0}` literal, so the inner arc is not rendered at all.
11. **"Burned" has no target and a different sub-line** — design "1,864 / 2,400" + "78% of target"; app no target + "No burn target set".
12. **A positive net renders without a "+" sign.**
13. **Scope word frozen at "Today"** instead of following `gDay`.
14. `letter-spacing: -1px` on the hero stat not applied; hero baseline gap 8 vs 7.
15. **The week chart axis is data-driven**, not the design's fixed 0/1,400/2,800 and ±800.
16. **Net-mode bar span** 65px/min 5 vs the design's 59px/min 3.
17. **Segment label** `500 17/24` vs `600 15/20`; track padding/gap 4 vs 3.
18. **The header button lacks the design's negative margin**, so the header block is ~17-18pt taller.
19. **Day letters come from real weekdays**, not a fixed Monday-first row — and may disagree with the Workouts card, which is explicitly Monday-first.
20. **A missing burn or net draws no bar**; the headline stat can read "—". The design has no null case.
21. **"of 5 sessions" is not built** (no weekly target exists); the sub-line reports minutes trained rather than "2,000 kcal burned in the gym".
22. **The Macros header glyph is one SF Symbol in one tint**, not four circles in four colours.
23. **Fibre can read "Not tracked · target n g"** where the design always shows a number and a bar.
24. **Streak line is a control** (pushes `/gym/streak`) where the design is static text; copy is *"14 day streak"* (space) vs *"14-day streak"* (hyphen); the flame **pulses** and greys at 0.
25. Eyebrow `letter-spacing` 1 vs 1.1; the date string is locale-dependent (adds a comma in en-GB/en-AU, reorders in en-US) where the design's is fixed.
26. Title has **no `letter-spacing: -0.6px` and no `padding-right: 52px`** (the design reserves 52px so the title cannot collide with the avatar).
27. Inter-card **gap 12 vs 14**; bottom padding ≈100 vs 158; title-block gaps 4 vs 2/6.
28. Header strip ≈79 vs 82, and the blur is an approximation (RN cannot mask a backdrop filter); a Reduce-Transparency branch has no design counterpart.
29. Profile button top 63 vs 64 and shows **initials**, which the design never does.
30. Pull-to-refresh has no design counterpart.

---

# Gym — main tab and sub-screens

## Gym — main tab: chrome, scroll and card order — ⚠️ PARTIAL MATCH

**Design order:** date eyebrow + "Gym" title → streak strip → month heatmap →
today's session card → **"Log this session" pill** → Muscle focus (3D body) →
"My schedule" card. That is the entire tab. Cards are white, `radius.xl` 28,
`shadow.sm`, `padding: space.lg` **16** (the streak strip is `12px 16px`).
Content `padding: 70px 16px 158px`, `gap: 14px`, entrance `lumeFade`.

**App order** (`gym.tsx:94-158`): eyebrow + title → `LoadFailedNotice` → streak
card → calendar card → `TodayCard` → `MuscleChart` → **`GymPatternsCard`** →
`GymSessionButton` → **`SettingsList "Training"`** (My schedule / My workouts /
Apply a streak freeze / Session history).

**Differences:** card padding matches on the streak strip (`12px 16px`, `gym.tsx:115`),
the calendar card (16, `gym.tsx:130`) and `TodayCard` (16, `space.lg`); `MuscleChart` is
BUILT (not verified): both `Card` uses in `src/components/gym/MuscleChart.tsx` now use padding 16 via `padded={false}` and `style={{ padding: space.lg }}`, matching `src/app/(tabs)/gym.tsx:130`; inter-card gap 12 vs 14; **the log CTA moves
from directly under the session card to below two other cards**; `GymPatternsCard`
("Your gym habits") is app-only; the four-row `Training` settings list is app-only
(the design reaches schedule via its own card and has no freeze or history screen
at all); the design's **"My schedule" card is missing entirely**; `LoadFailedNotice`
is app-only; bottom padding ≈100 vs 158 (the design leaves ~74pt of air above the
bar, the app ~16pt); header strip ≈79 vs 82; no page entrance animation;
pull-to-refresh is app-only.

**Title block:** same tokens, but `letterSpacing` 1 vs 1.1, no `-0.6px` title
tracking, no `min-height: 26px` on the eyebrow, block gap 4 vs 0, no `padding: 0 4px`,
and **no `padding-right: 52px`** — so a long localised title can run under the
avatar. The design's date follows the *selected* day; the app always shows today
(it has no day-selection model).

## Gym — streak strip — 🔨 BUILT (not verified)

**Design:** one non-interactive row — a 20px static flame in `category-streak`, the
count at `700 20/26` rounded, "day streak" at `500 17/24`, and a right-aligned
footnote *"23 sessions · 2 freezes"*. Padding `12px 16px`, gap 11.

**App** (`gym.tsx:109-126`): one row inside a **tappable** `Card` pushing
`/gym/streak` — a 20pt `StreakFlame`, the count (`statSmall`, `700 20/26` rounded)
and "day streak" (`bodyMedium`, `500 17/24`). Padding `12px 16px`. Longest, Total
and Freezes are gone from this card.

**Differences:** tappable vs display-only, kept as an accepted deviation; **the
right-aligned summary footnote is not built**, waiting on Isa; gap 12 vs 11. Parked:
**the flame pulses infinitely** (`scale 1 → 1.14`) where the design's is static; the
app greys the flame at streak 0 (no design counterpart); different flame artwork
(SF Symbol vs a bespoke evenodd path).

## Gym — month heatmap — ⚠️ PARTIAL MATCH

**The closest surface on the whole screen.** I verified the geometry myself:
`CELL_GAP 5`, `CELL_RADIUS 7`, `SWATCH 11`, `SWATCH_RADIUS 3`, `NAV_SIZE 32`,
`600 10/12` rounded day digits, Monday-first lead, the four-step ramp implemented
via a hand-written `mixHex()` that reproduces the design's `color-mix` — all match
the design value for value, as does the `Less`/`More` legend and the month-title
rule (year appended only outside the current year).

**Differences:**

1. **Cells are not interactive.** In the design every non-future cell is a button
   whose `onPick` opens the day/session detail. In the app `Day` is a bare `View`.
   **This is the design's only route into the day-detail view, and it is gone.**
2. **The 2px ring means something different** — design: the *selected* day (which
   moves as you tap); app: always today, because no selection exists.
3. **A frozen-day fill (`light3`) is app-only** — the design's ramp has no freeze level.
4. **Low-end intensity differs.** Design: any logged day is level ≥ 2. App: an
   untimed or ≤30 min session is level 1. The >55 min → level 3 boundary matches.
5. Summary pluralisation ("1 session" vs always "sessions"); the app omits the
   `Xh Ym` segment when minutes are 0 where the design always prints it; and the
   app adds "N untimed" and "N freezes" segments plus loading/error strings that
   the design has no state for.
6. Chevron stroke weight 2.8 is not reproduced (SF Symbol default).

## Gym — today's session card — ❌ DIFFERENT

**Design:** the whole card is one tap target opening the day detail; a header row
(11px status dot, title, sub, a state pill, a 14px chevron) over a **4-up stats
grid** (Duration / Calories / Volume / Sets) and a wrapped row of exercise chips.

**App** (`TodayCard.tsx`): four rendered states (loading, logged, rest day, planned) plus null on load failure.
The logged, rest-day and planned states have a header row. The logged state adds a chevron and, when the logged session has exercises, a 3-up grid (Duration / Volume / Sets) and exercise chips from that session (BUILT, not verified). The planned state adds chips and a **"Start workout"** button. Every state's card,
including loading, uses padding 16 (`padded={false}`, `space.lg`); the loading state differs from the design.

**Differences:** the card is **not tappable** in any state; the rest-day and planned
states have **no chevron**, and the logged state's chevron sits on a card that cannot
be tapped; the logged grid is **3-up against the design's 4-up**, with the Calories cell
missing because session rows carry no per-session calories, which needs a backend
change; the planned state has **no stats grid**; "Start workout" is
app-only; the card returns null only when the schedule fetch fails
(`src/lib/data/gymSchedule.ts:38-40`), and shows no error message; dot 12 vs 11; header min-height 36 vs 34;
gaps 12 vs 10 and 4 vs 1; pill `500 11/14` vs `600 11/15` and `4px 8px` vs `3px 9px`;
**the "Logged" pill is solid green, not the design's wash** (`color-mix(positive 22%, white)` →
`categoryAccent.positive`); grid values `600 17/24` display vs `600 16/21` rounded;
chip type `500 11/14` vs `500 12/16`, padding 12 vs 10, gap 8 vs 6;
the logged sub-line's kcal is the day's total exercise burn, not the session's, and is
left out when none is recorded; the planned sub-line
drops the muscle-group phrase and adds a duration; and the design's `ready` state
(a day with a draft) has no counterpart.

## Gym — the "Log this session" CTA — ❌ DIFFERENT

**Design:** `showLogCta = !past && !logged && exList.length > 0` — a black 52pt pill
reading **"Log this session"** with a trailing 15px chevron-**up** at 0.7 opacity
(signalling a sheet), sitting directly under the session card, opening the
"How did it go?" sheet in place.

**App:** rendered **unconditionally** below two other cards; copy **"Log gym
session"**; a leading `barbell` icon instead of a trailing chevron; pushes a route
instead of opening a sheet; and when logged it substitutes an invented grey
"Logged today" pill where the design simply hides the CTA.

Also: the design's `+` menu refuses to re-open the sheet when today is already
logged, toasting *"Today is already logged — open it to edit or add something
extra"*. The app always pushes the sheet.

## Gym — Muscle focus and the 3D body — ❌ DIFFERENT

**Direct answer to the question posed: yes, the design includes a 3D muscle-group
body, in three places, and the app has none.**

`GymScreen.dc.html` is the only one of the four previews that references
`body3d.js`. It embeds `<x-import component-from-global-scope="body-3d">` three
times:

| # | Context | Attributes | Stage |
|---|---|---|---|
| 1 | Main-tab **Muscle focus** card | `groups` `view="torso"` `selected` `pick="on"` `zoom="on"` | 240px, `radius.lg`, `surface.card` |
| 2 | Exercise detail → **Muscles worked** | `groups` `view` `face` (no pick/zoom) | 216px |
| 3 | **Muscle focus full screen** | `groups` `view="full"` `face` `selected` `pick="on"` `zoom="on"` | 326px, white |

Its contract, as derivable from the call sites: `groups` is a JSON map of muscle
key → **0–1 normalised intensity**; `view` is `"torso"`/`"full"`; `face` is
`"front"`/`"back"` (auto-flipping to back for rear-chain exercises); `pick="on"`
makes meshes tappable, reporting the pick by dispatching a `lume-muscle`
`CustomEvent` on `document`; `zoom="on"` zooms to the picked muscle. The full
screen's own caption says *"Drag the body to spin it. Tap a muscle to zoom in and
see the exercises that hit it."*

Around the body the design layers an expand button, a **glass selection popover**
listing the exercises that hit the selected muscle (*"N sets · N kg this week"*, or
*"Nothing hit this muscle in the last 7 days."*), a Front/Back control, and a row
of **tinted, tappable volume chips** (`color-mix(streak 8–34%, white)` by intensity)
that drive the same selection bidirectionally.

**The app has no 3D body, no three.js dependency and no per-mesh data.**
`MuscleChart.tsx:8-9` and `muscles.tsx:5-15` both say so explicitly, citing
architecture item 7. Instead the card renders a **static 10-row bar list**.

**Differences:** all three body instances absent; no expand button; no tap-to-select;
no selection popover; no muscle chips; no hint line; **a full bar list on the card
that the design does not have there at all** (its rows live only on the full
screen); window **30 days vs 7**; taxonomy 10 keys vs 9 (`arms` split into
biceps/triceps, `quads`/`hams` renamed); header gains an icon the design lacks;
scope colour `tertiaryLabel` vs `secondaryLabel`; the bar fill is flat where the
design uses a horizontal gradient; **no per-muscle exercise lists or set counts**
(the data does not exist in any response the app can call). The one faithful part:
`NAME_WIDTH 84`, `VALUE_WIDTH 74`, `BAR_HEIGHT 8` match the design's row metrics
exactly.

## Gym — "My schedule" card — ❌ DIFFERENT (missing)

**Design:** a tappable card — header ("My schedule", *"6 days planned"*, chevron)
over three rows previewing **today, tomorrow and the day after**: a 64px day label
(`Today` / `Tomorrow` / `Wed`), an 8px dot (streak-coloured when a template is
assigned, `light2` otherwise), the template name or *"Rest day"*, and a trailing
*"N exercises"* / *"Nothing planned"*.

**App:** **no such card exists.** The nearest thing is one row labelled
"My schedule" inside the app-only `Training` settings list.

**Differences:** the card, the "N days planned" count, all three day rows, the dots,
the names and the per-day exercise counts are all absent.

## Gym — day / session detail — ❌ DIFFERENT (no counterpart)

**Design:** a full day-detail push view (`navSession`), reached by tapping **any
calendar cell** or the session card. It carries, by state: an **"Energy in and out"**
card (eaten/burned bars, a net deficit/surplus chip, and a resting/steps/training
breakdown); **"The workout I did"** (the 4-up stats grid and per-exercise rows);
**"Muscles this session hit"** (per-muscle rows with set counts and volume);
**"What I ate"** (meal rows and macro bars); a rest-day card; an unlogged-past note
(*"Nothing was logged on this day — the session above is what had been planned."*);
and the locked/unlocked model (*"Logged and locked. Numbers are saved as they were."*
with an **Edit** → **Save changes** cycle).

**App:** **no route corresponds to this view.** `/gym/session` is the live-logging
screen reachable from "Start workout" and the log sheet; `/gym/history` is a flat list. Neither
is reachable from the calendar, because the calendar's cells are not pressable.

**Differences:** no route into a specific past day; no energy card; no "What I ate";
no per-session muscle breakdown; no stats grid; no unlogged/rest-day notes; no
locked/unlocked model; no day-title vocabulary (*Today* / *Yesterday* /
*Sunday 7 Sep*) and no summary line with minutes, kcal and steps.

## Gym — exercise detail / progress — ⚠️ PARTIAL MATCH

The design has no standalone progress screen; the equivalent is the **History card**
inside its exercise detail, which also carries a **"Muscles worked"** card (a 216px
body stage plus Primary/Secondary chips) and a **"Form guide"** card (a staged
image, *"Guide 1 / 3"*, prev/next, dots and numbered steps from a nine-pattern table).

**App** (`exercise-progress.tsx`): a "Personal best" card, a trend `Badge`, a
"Weight over time" chart and a "History" text list.

**Differences:** **no Muscles worked card**; **no Form guide card**; window 10 vs 8
sessions; card titled "Weight over time" vs "History"; **the metric line is missing
and the bars encode weight rather than volume/reps/minutes** — so a bodyweight or
cardio exercise charts as a flat line; chart height 132 vs 118; bar radius 10 on all
corners vs `6px 6px 0 0`; bar width capped at 24 vs `flex:1`; gap 4 vs 6; **no
staggered grow-in** (design: 700 ms, 45 ms apart); uniform label typography vs
`600`/`400` with the last bar emphasised; no hairline above the label row; **the
bottom stat pair (Latest session / Best set or Fastest, with dates) is missing**;
the trend badge, the tap-a-bar tooltip, the text history list and the empty state
are app-only. Reachable only from inside `/gym/session`.

## Gym — streak detail and session history — ❌ DIFFERENT (app-only, wrong chrome)

Neither screen exists in the design. The design's streak lives in the main-tab strip
and in the **celebration modal**; its "past sessions" model is calendar cell → day
detail.

Both app screens are also **in the pre-design chrome**: `streak.tsx:30` uses
`Screen` with no `variant` (a bordered NavBar), `history.tsx:23` uses `grouped`, and
both use default `filled` cards (`light1`, `radius.lg` 20) instead of
`elevated` (white, `radius.xl` 28, `shadow.sm`). Both still use the deprecated
`gray100/gray500/gray700/black` aliases that `tokens.ts` marks for removal. The
history list also renders `session.date` as a raw ISO string, and the streak screen
labels a stat "Sessions" where the main tab calls the same number "Total".

## Gym — "My schedule" screen — ⚠️ PARTIAL MATCH

**Design (`navSched`):** one pushed screen (`lumePush`, 380 ms) that holds **both**
the week and the template list. Content `padding: 110px 16px 40px`,
`gap: space.xl` 20, background `surface.background-alt`, an 82px blurred top
gradient and a **44px** floating back button at `top:56; left:16` (heavier than the
README's 38px / `top:50; left:14` — the design is not internally consistent here).
Note `navSched` stays true while `nav === 'workout'`, so the workout detail pushes
*over* a still-mounted schedule screen.

1. A **title-1 "My schedule"** (`800 30/36`) with **no eyebrow**.
2. One elevated card (white, `radius.xl` 28, `shadow.sm`, `padding: 8px 16px`)
   holding seven rows in **Mon→Sun order** (the literal `[1,2,3,4,5,6,0]`): a 42px
   `600 15/20` three-letter day (always `label` colour, even on a rest day), a 9px
   dot (`category-streak` when assigned, `light2` when not), the name at
   `500 15/20` (`label` / `secondaryLabel`), a footnote sub
   **`N exercises · <muscle-group phrase>`** or *"No workout assigned"*, and a 14px
   `gray400` chevron at `stroke-width 2.4`. Row `min-height: 58`, `gap: 12`,
   text-column `gap: 1`, hairline under every row but the last,
   `style-active="opacity:0.6"`.
3. A **"MY WORKOUTS"** section label (`600 13/16`, `letterSpacing 1.1`, uppercase,
   `secondaryLabel`) over one `radius.lg` **20** card per template,
   `padding: 16`, `gap: 12`, with **three** lines: name (`bodyMedium` 500 17/24),
   `N exercises · <muscle phrase>` (footnote), and **`Every Mon, Thu`** /
   *"Not scheduled"* (`caption` 500 11/14, `tertiaryLabel`).

Tapping a day opens `sheetPick`: a content-sized sheet (`radius.xl` top corners,
`0 -14px 40px rgba(0,0,0,0.18)`, `lumeSheet`), titled **"Workout for Sunday"**
(`title-3` 600 19/25, full day name), listing every template — each row 56pt,
`radius.md` 16, `padding: 0 16` — and then **"Rest day" last with the sub
*"Nothing scheduled"***. The current choice is marked **twice**: a
`surface.tile` row background *and* a **bare 17px check glyph** in `label` colour
(no circle, no fill).

**App:** `src/app/gym/schedule.tsx` — the week only; templates live on a **separate
route** (`/gym/templates`), reached from the main tab's `Training` settings list.
The file names the design constant it kept: `const DAY_WIDTH = 42` at :24.

**Differences:**

1. **The entire "My workouts" section is missing from this screen** — no uppercase
   label, no template cards, no sub-line, no "Every Mon, Thu" line, and no route
   from here into a template.
2. **An eyebrow "Gym" is added** (:69) above a title the design leaves bare.
3. **The per-row muscle-group phrase is dropped** — the app's sub is
   `N exercises` with nothing after it (:131-133).
4. Sub colour `tertiaryLabel` (`#8a8a8a`) vs the design's `secondaryLabel`
   (`#6b6b6b`) (:130).
5. Day label `label` (**600 13/16**) vs `600 15/20` (:111); name `callout`
   (**400 15/21**) vs `500 15/20` (:124).
6. Dot 8 vs 9 (:116); row min-height 52 vs 58 (:101); text-column gap 4 vs 1
   (:122); card vertical padding 0 vs 8, so the card has no breathing room at top
   and bottom (:87).
7. Day names come from `day.day_name.slice(0, 3)` (:112) rather than a fixed
   `WD3` table, and rows render in whatever order the API returns rather than the
   design's pinned Mon→Sun (:88). A localised or differently-cased `day_name`
   would break the 42px gutter silently.
8. **Picker sheet differs in five ways**: title *"Sunday — Choose Workout"* vs
   *"Workout for Sunday"* (:147); **"Rest day" is first** (:151) rather than last
   and carries **no sublabel** where the design says *"Nothing scheduled"*;
   selection is a **22px black filled disc with a white check** (:210-222) rather
   than a bare glyph; **the selected row gets no `surface.tile` background**; and
   an extra **"Create new template →"** row is appended (:165).
9. **`Create new template →` has no design counterpart at all** — the design has
   no create-template flow anywhere, on any screen.
10. Sheet rows: `bodyMedium` (17/24) vs `500 15/20`, hairline dividers and no
    radius vs 56pt `radius.md` rows with no divider, and the list is capped at
    `maxHeight: 340` where the design's sheet is content-sized (:150, :190-201).
11. **With zero templates the app replaces the whole week card with an
    `EmptyState`** (:76-83), so the user cannot see or tap their week at all. The
    design always renders the seven rows, every one reading *"Rest day"* /
    *"No workout assigned"*.
12. Loading skeletons at height 64 (:70-75), optimistic writes with a rollback and
    the toast *"Could not save schedule — check your connection"* (:38-61) are
    app-only; the design mutates `S.sched` synchronously with no async states.
13. Pressed states (`opacity:0.6` on week rows, `surface.tile-pressed` on sheet
    rows) are not reproduced — the app sets `haptic={false}` and relies on
    `Pressable` defaults.

*Not verified:* `BottomSheet`'s own chrome (grabber, radius, scrim, shadow, title
type, entrance) was not read, so parity against the design's `38×5` `light3`
grabber, `radius.xl` top corners and `lumeSheet` animation is **unknown**, not
confirmed-different.

## Gym — workout / template detail — ❌ DIFFERENT

**Design (`navWorkout`, gated on `nav === 'workout' && tplSel`):** a full template
*editor*. The template's own **name is the `title-1`**, under it `tplSummary` =
**`<muscle phrase> · N working sets · about M min`**, where the minutes are
**derived** (`Math.round(sets × 3.2 + cardio minutes)`) and never typed. A **62×62
black FAB** at `right:16; bottom:26` opens the shared exercise-library sheet in
template mode, seeding a new item at `sets 3 / reps 10 / kg 20 / rest 90 /
tempo 2-0-2 / RPE 8` and auto-expanding it. Scroll padding `110px 16px 96px`
(96 clears the FAB), `gap: 12`.

Each exercise is **its own card** (white, `radius.lg` 20, `shadow.sm`,
`padding: 16`), and the set is a strict accordion — only one open at a time:

- **Collapsed row:** a `26×26` `radius.sm` `light1` index chip (`600 11/14`
  rounded), the name (`bodyMedium`), a summary line — strength
  `(sets − warm) × reps · <kg or "bodyweight"> · RPE 8`, cardio `N legs · M min` —
  an optional **"Superset"** pill (`color-mix(streak 20%, white)`), and a chevron
  that rotates 90° over 180 ms.
- **Expanded** (`lumeFade`): one row per set — a tappable **warm-up chip** cycling
  `W` / `1` / `2` (warm rows tinted `color-mix(streak 22%, white)`), a **tappable
  kg field**, `×`, a **tappable reps field**, and a remove `×`; an **"Add set"**
  pill; a **three-up tile grid — Rest / Tempo / Target RPE** (rest and RPE open the
  keypad, tempo cycles `['2-0-2','3-1-1','4-0-1','1-0-1']`); a **NOTES** textarea
  (`surface.input`, placeholder *"Elbows tucked, pause on chest"*); a **"Superset
  with next exercise"** `50×30` switch; and a destructive **"Remove exercise"** pill
  (`color-mix(accent-red 10%, white)`).
- Every number opens the README's **slim keypad bar** pinned below the scroll —
  an uppercase context label, a focused `600 26/32` input, and a black **Done**
  pill. Its labels here are **`Planned sets`**, **`Target reps`**, **`Target
  weight · kg`**, **`Rest · seconds`**, **`Target RPE · 1-10`**, with `inputMode`
  `decimal` for weight and `numeric` otherwise, and sanitising that clamps RPE to
  1–10 and sets/reps to ≥ 1. Every edit persists immediately — there is no save.

**App:** two screens. `templates.tsx` is a list of `radius.xl` 28 / `padding` 20
cards showing name + `N exercises · about M min`, with a 26px `+` in the header.
`new-template.tsx` is a create/edit form: a **Name** field, a **"Duration (min,
optional)"** field, an `EXERCISES` label, one shared card whose rows show only
`3 × 10 @ 60kg` or `30 min` with a trash button and swipe-to-delete, an
**"Add an exercise"** tertiary button, and a **"Save workout"** footer pill.

**Differences:**

1. **There is no set-level editing at all** — no per-set rows, no warm-up sets, no
   tappable kg/reps fields, no "Add set". The app stores one `PlannedValues` per
   exercise, set once inside `ExercisePicker` and never editable here again.
2. **Rest, Tempo, Target RPE, Notes and Superset do not exist** in the app in any
   form. `rest_seconds` is the only one of the five the picker collects; it is
   transmitted on create (:104) and never shown again.
3. **No accordion** — rows never expand, so the design's entire editing surface is
   unreachable.
4. **No slim keypad bar** anywhere; values are typed into labelled `TextField`s.
5. **Editing a saved template cannot change its exercises.** The screen says so
   outright — *"Exercises can't be edited on a saved workout yet."* (:231) — and
   edit mode patches only `{ name, estimated_duration_minutes }` (:92), attributed
   in the file header to `PATCH` having no bulk exercise replace. (I cite the app's
   stated reason; I did not verify that API constraint.) The design edits an
   existing template in place, live.
6. **`tplSummary` is missing** — no muscle phrase, no working-set count, no derived
   duration. The list screen shows a different, shorter line in a different place.
7. **The design has no Name or Duration field on this screen at all**, and no
   create-template flow anywhere; the app adds both fields plus two create entry
   points (a header `+` and an `EmptyState` CTA).
8. **The "Every Mon, Thu" / "Not scheduled" line and the muscle-group phrase are
   both missing** from the app's template cards, which show
   `N exercises · about M min` instead (:62-63).
9. **Card structure inverted:** the design gives each exercise its own shadowed
   card with 12px gaps; the app uses one card with hairline-separated rows
   (:167-193). Design list cards `radius.lg` 20 / `padding` 16 vs the app's
   `radius.xl` 28 / `padding` 20.
10. **Summary string format differs:** design `4 × 10 · 60 kg · RPE 8` vs app
    `3 × 10 @ 60kg` (:33-35) — an `@` separator, no space before the unit, no RPE,
    and `'—'` placeholders. Cardio: design `3 legs · 30 min` vs app `30 min` /
    `N sets` / the bare word `Cardio` (:29-32).
11. **No numbered index chip**, and no `62×62` FAB — the add control is an inline
    tertiary button in the content flow (:236-242).
12. **Editor title differs:** the design shows the template's own name as the
    title; the app shows `Edit workout` / `New workout` under an eyebrow
    "Workout" (:122-123), so the name is visible only inside a text field.
13. **Remove exercise** is a trash icon plus `Alert.alert('Remove exercise?')` and
    a swipe row (:171-175, :220) rather than the design's full-width red pill.
14. App-only: two `EmptyState`s, loading skeletons, a `Save workout` footer with a
    dirty/disabled state, and the toasts `Workout saved` / `Workout updated` /
    `Could not save workout` (:111,:114). The design persists continuously with no
    save action and no failure path.
15. None of the design's `style-active` pressed states on this screen (six
    distinct ones) are reproduced.

**Verdict rationale:** this is the second-largest gap in the tab after the log
sheet, and for the same reason — the design's screen is a live editor built around
tap-a-value-and-type, and the app's is a create-once form.

*Not verified:* `ExercisePicker.tsx` / `PlannedValuesForm.tsx` were not read, so the
app's defaults and numeric affordances for a newly added exercise are **unknown**
against the design's `sets 3 / reps 10 / kg 20` seeding.

*Ambiguity, not resolved here:* the muscle-group phrase `t.sub` is authored per
template in the prototype fixture. Whether production expects it typed, derived
from the exercises' muscle groups, or served is not determinable from the design —
only that the app has no equivalent field at all.


---

## Gym — tab bar, FAB and add menu — ⚠️ PARTIAL MATCH

Matching: position and 22pt offset, the 3-column glass pill, 52pt cells, the
separate **62pt** black FAB, the 45° plus rotation over 260 ms, the 232pt menu
panel at a 96pt anchor, both row labels, and a faithful `lumePop` reproduction.

**Differences:** active-cell fill `surface.tile` (opaque `#F2F2F7`) vs
`rgba(0,0,0,0.055)`; active label weight 500 vs 600; the active cell is still a
button in the app; pill padding 4 vs 5; cell gap 4 vs 2; container gap 12 vs 10;
`shadow.md` substituted for the design's much heavier custom shadows on the pill,
the FAB and the menu; plus glyph 28 vs 27; tab icons 20 vs 21 (and the food icon is
`fork.knife` vs the design's bowl); menu radius 20 vs 18; **menu panel solid white
vs `rgba(255,255,255,0.94)` + blur**, and **scrim `0.45` vs `0.10`** (both
documented in `AddMenu.tsx` as deliberate); menu row padding 16 vs 18; divider 1px
`#e5e5ea` inset 16 vs `0.5px rgba(0,0,0,0.10)` inset 18; **the already-logged
branch is missing**; and "Log food" pushes `/food/add` where the design switches tab.

## Gym — cross-cutting token drift — ⚠️ PARTIAL MATCH

The token *system* is faithfully projected (`tokens.css` ↔ `tokens.ts` agree on
colour, type, spacing, radius, shadow and motion). The drift is in application:

1. **Card padding 20 vs 16** across every gym card (`Card` default `space.xl`).
2. **The design's untokenised pixels get rounded to the nearest token** — 11 → 12,
   10 → 12, 9 → 8, 6 → 8, 14 → 12.
3. **`caption` (500 11/14) substituted** for the design's bespoke `600 11/15`,
   `500 12/16` and `600 11.5/15` faces — weight and line-height lost each time.
4. `callout` (400) where the design specifies 500; `footnote` where it specifies
   `body`; `tertiaryLabel` where it specifies `secondaryLabel`.
5. `letterSpacing: 1` everywhere the design writes `1.1px`; `-0.6px` title tracking
   never applied.
6. **Deprecated grey aliases still in use** on `streak.tsx` and `history.tsx`.
7. `shadow.md` substituted for three heavier custom shadows.
8. Gradient bar fills flattened to solids; `color-mix` tints dropped in two of three
   places (the heatmap ramp is the one that honours them).
9. **Almost no `style-active` equivalents** — the design specifies pressed states on
   nearly every control; the app relies on `Pressable` defaults.
10. **Entrance animations largely absent** (`lumeFade`, `lumePush`, `lumeSheet`, the
    staggered bar transitions). `lumePop` is reproduced in `AddMenu`.

# Food

## Food — Day log (main view)

**Verdict:** ❌ DIFFERENT
**One-line reason:** The design's calories card is goal-relative (remaining kcal + progress bar + four macro bars) and the log has no search field; the app ships a "logged total" card with no goal, no bars, three macros, plus a persistent search field that re-purposes the whole screen.

I verified the core of this myself. Design: `hLeft: fmt(Math.abs(hLeftN))`,
`hLeftWord: 'kcal left today' | 'kcal under goal' | 'kcal over goal'`,
`hEatenLine: fmt(hEaten) + ' eaten · goal ' + fmt(goal) + ' kcal'`, macro targets
`T = { p:150, c:230, f:70, fb:30 }`. App (`food.tsx:584-626`): hero is
`formatNumber(kcalToDisplay(total))` + `${energyUnit} logged`, three columns
(Protein/Carbs/Fat) as dot + name + value, no goal, no bar, no fibre.

### Design write-up

Fixed chrome: 82px blurred strip; 44×44 glass profile disc at `top:64; right:16`
with a 22px person glyph; the floating tab bar. Scroll `padding: 70px 16px 158px`,
`gap: 14px`, `lumeFade`.

1. **Header** — the eyebrow is **tappable** (`min-height:40`, `onClick → hOpenCal`), `"Wednesday 5 August"` (no year) plus a 10×10 chevron-down; `<h1>` "Food" with `padding-right:52px`.
2. **Week strip** — one row: a 28px `‹`, seven flexed chips, a 28px `›` dimmed to `opacity 0.35` when already on the current week. Chip `height:60`, radius pill, background `--lume-color-primary` when selected, `light-2` when today-but-not-selected, else **transparent**; weekday letter in caption, day number `600 15/19` **rounded**, then a 4×4 dot. **No month label anywhere.**
3. **Calories card** — header (17px flame, "Calories", right-aligned day label "Today"/"Yesterday"/"Fri 7 Aug"); hero `|goal − eaten|` in `stat-large` + "kcal left today"; a 12px progress pill animating over 700 ms; `"1,240 eaten · goal 2,100 kcal"`; then **four** macro columns, each a 6px mini-bar over name and value.
4. **Meal cards** ×4, always all four: header (17px dot in the meal colour, name, kcal + "kcal" caption, a 30×30 black `+` disc); item rows `min-height:58` with a **46×46 photo tile**, name `500 15/20`, sub `"{g} g · P · C · F"`, trailing kcal; pending rows show an AI-tinted spinner and *"Analysing photo — this can take a moment"*; an unassigned row shows a `"Confirm meal"` pill. Empty meal = an inline row **inside the same card** reading *"Add to breakfast"* (lower-case).

No search field, no history link, no banner, no error state.

### App write-up

`src/app/(tabs)/food.tsx` — one `SectionList`. Header block order: `AnomalyBanner`
→ eyebrow + title → `LoadFailedNotice` → `WeekStrip` → `CaloriesCard` (only when
`!searching && !loading && !loadError && itemCount > 0`) → search `TextField` →
`ScanFeedbackPrompt` → `ScanReviewCard` → `ScanFailedCard`. Meal sections are
white grouped cards with hairline separators; rows are 60pt, no photo tile, name
`variant="body"` 17/24; empty meals render as a separate footer piece reading
*"Add to Breakfast"*.

`WeekStrip` is **two rows**: a month label *"August 2026"* + chevron (opening the
calendar) with both arrows at the right, then the seven chips at
`minHeight: 52`, white (not transparent) when unselected, day number in
`bodyMedium` 17/24 display, and a **hollow ring** on today when unlogged.

### Differences

1. Hero means a different number — remaining vs total logged.
2. **No calorie goal is read at all.**
3. **No progress bar.**
4. **No "1,240 eaten · goal 2,100 kcal" line.**
5. **No day label** in the card header.
6. **Three macro columns, not four** — Fibre absent.
7. **No per-macro mini bars** (design: 6px bars against targets).
8. Macro column order: design bar → name → value; app (dot + name) → value.
9. **The card is hidden when the day is empty**; the design always renders it.
10. **A search field exists on the log that the design does not have.**
11. **Searching replaces the day view** — in the design search is a modal sheet.
12. **The date eyebrow is not the calendar opener** (the app moved that to the month label).
13. **A month label exists that the design does not have.**
14. Eyebrow string is locale-dependent vs the design's fixed format.
15. **Week arrows are in the wrong place and size** — 44pt, stacked above at the right, vs 28px inline flanking the chips.
16. Forward-arrow rule: design dims to 0.35; app fully disables.
17. **Unselected chips are white, not transparent**, and there is no today fill.
18. Chip height 52 vs 60; day number `bodyMedium` display vs `600 15/19` rounded; chip gap 4 vs 2.
19. **A hollow ring on today is invented.**
20. Future days: `opacity 0.4` on the whole chip vs a tertiary-label foreground.
21. **No photo tile on rows.**
22. Row name 17/24 w400 vs `500 15/20`; row height 60 vs 58.
23. **Hairline separators are an app invention**; the design separates rows by padding only, with a `light-1` pressed fill and an 8px negative inset.
24. Meal header dot 12 vs 17; `+` disc 28/16px glyph vs 30/15px.
25. Empty-meal row: a separate card piece vs an inline row; *"Add to Breakfast"* vs *"Add to breakfast"*; a 20px `add-circle-outline` vs a bare 15px `+`; height 56 vs 44.
26. Units are `energyUnit` (kcal **or kJ**) throughout; the design is kcal-only.
27. Elements with no design counterpart: `AnomalyBanner`, `LoadFailedNotice`, `ScanFeedbackPrompt`, `ScanReviewCard`, `ScanFailedCard`, the "Meal history" footer, the "Add custom food" footer, the day empty state, both error states.
28. Swipe-to-delete with confirm, and long-press-to-delete a whole meal — no design counterpart.
29. Pending-row copy and treatment differ (grey skeletons vs AI-tinted spinner and copy); a "failed" row state exists only in the app; the `"Confirm meal"` pill is absent.
30. Header strip ≈79 vs 82; bottom padding ≈100 vs 158; block gap 12 vs 14.

## Food — Food detail sheet

**Verdict:** ❌ DIFFERENT
**One-line reason:** The design is a tap-a-number → slim keyboard-bar sheet with a 96px photo, serving chips and a 2×2 macro grid; the app is a labelled form behind an "Edit values manually" toggle, with no photo and no edit bar.

### Design write-up

Sheet `max-height:92%`, grabber, body `padding: 12px 20px 16px`, `gap: 20`.
**Identity row:** a 96×96 `light-1` tile with a 38px glyph, the name in `title-3`,
a sub-line *"Chobani · 59 kcal / 100 g"* (or *"Logged today"*), and the 40pt close
disc. **AI note** for photo-sourced items: *"Estimated from your photo — check the
serving before saving"*. **Serving size:** an uppercase label and a tappable chip
showing `"250 g"` with a pencil glyph (or a blinking caret while editing), over an
inset segmented control of the food's own presets, which **de-selects once grams
are overridden**. **Energy:** `stat-large` kcal inside a tappable span.
**Macros:** a 2×2 grid of tappable tiles — Protein, Carbs, Fat, **Fibre** — each a
dot + name + `stat-small` value to 1 dp + "g". **Meal:** an inset four-chip
control, always shown. **Actions:** a black pill *"Add to lunch"* / *"Save
changes"* / *"File under lunch"*; a `surface.tile` pill *"Save to my dishes"*; and
a plain red text button *"Remove from log"* that fires **without a confirmation**.

**The edit bar** (the convention): pinned below the body, `padding: 12px 20px 34px`,
`background: surface.background-alt`, hairline top border; an uppercase caption
from `PADS` — *"Serving size · grams"*, *"Calories · kcal"*, *"Protein · grams"*,
*"Carbs · grams"*, *"Fat · grams"*, *"Fibre · grams"* — over an autofocused
borderless input at `600 26/32` rounded with `inputMode` numeric/decimal, and a
black **"Done"** pill. Editing grams clears every other override.

### App write-up

`src/app/food/detail.tsx`, one `DetailForm` across five subject modes. Header
title is the **mode** ("Edit item", "Rename food", "Edit food", "Confirm product"),
not the food. Body: an optional grey card with name + sub-line (search/barcode
only); `SegmentedField "Serving size"`; a **centred** `statLarge` kcal readout plus
*"for 250 g"*; a `Name` `TextField`; then either a read-only macro list (dot +
label + value) with a pencil **"Edit values manually"** toggle, or 2-up boxed
`TextField`s (`Serving (g)`, `Calories`, `Protein (g)`, `Carbs (g)`, `Fat (g)`);
a `Meal` segmented control **only when a slot is known**; the CTA; *"Save to my
foods"*; and a destructive **"Delete item"** behind an `Alert` confirm.

### Differences

1. **No slim keyboard edit bar** — the design's entire number-entry model is absent from the codebase.
2. Numbers are entered in **boxed form fields** with `FieldShell` labels (footnote 13/18 w400, `#171717`) instead of the uppercase `600`, `letter-spacing 1.1px` secondary caption.
3. **"Edit values manually" is an app-invented mode**; the design has no read-only/editable distinction.
4. **Values are not tap-to-edit** anywhere.
5. No blinking caret affordance; no pencil glyph on a grams chip; **no grams chip at all**.
6. **No 96×96 photo tile.**
7. The sheet title is the mode, not the food — so a logged row shows its name only inside an editable field.
8. **A `Name` field exists that the design does not have**; the design offers no rename here.
9. No brand/density sub-line for logged rows (*"Logged today"*).
10. **No AI provenance note.**
11. Macro layout: a vertical list or 2-up inputs vs a 2×2 tappable grid.
12. **Fibre is not editable** and appears only in the locked list.
13. Macro precision: design keeps 1 dp; the app rounds to integers while still showing a decimal keypad.
14. Energy readout centred vs left-aligned; an extra *"for 250 g"* line the design does not have.
15. Serving presets differ — fixed `[50,100,150,200]` or `[½×,1×,1½×,2×]` vs the food's own catalog servings.
16. The serving control **does not de-select** on a manual override.
17. **The meal switch is conditional**; in the design it is always present (that is how a new food's meal is chosen).
18. *"Save to my dishes"* → *"Save to my foods"*, and a full secondary `Button` (52pt) vs a 44pt tile pill.
19. Remove: a filled destructive button with a **blocking confirm** vs a plain red text button that fires immediately.
20. **No "File under {meal}" CTA**; the app's nearest mode renames only.
21. No "still calculating" holding row after adding a photo/dish item.
22. Toast copy differs throughout; after adding, the app **navigates** (`router.replace`) where the design closes in place.
23. Barcode "not found" and "No longer in your log" screens have no design counterpart.
24. The design's search subject carries full macros; the app's is energy-only.

**Built:** difference 24 is closed — the search branch of `src/app/food/detail.tsx` now shows the macro row from the result's per-100 g macros, and the kcal-only copy and comments were removed.

## Food — Quick add

**Verdict:** ❌ DIFFERENT
**One-line reason:** The app is rebuilt to the design's hero number, ±50 discs, `+100/+250/+500/+750` presets and keyboard bar; the Meal chip padding and transition, confirm label, caret, offline toast and copy still differ.

**Design:** centred 52×52 `surface.tile` ± discs around a tappable
`stat-hero` (56/68, `letter-spacing -1.4px`) value with *"kcal · tap to type"*
underneath; four preset pills; the MEAL chip row; a live CTA *"Add 250 kcal"*;
and the same docked edit bar captioned *"Calories · kcal"* (5-digit cap).
Default value **250**.

**App (BUILT, device run outstanding):** `src/app/food/quick-add.tsx` — a tappable
`stat-hero` figure starting at 250 with *"kcal · tap to type"* underneath, ±50 discs,
four preset pills, and a `NumberEntryBar` captioned *"Calories · kcal"* (5-digit cap)
that hides the discs, presets and CTA until Done.

- BUILT, not verified: Meal caption (`MEAL`) above the segmented control.
- BUILT, not verified: the Meal control passes the `compact` prop of `SegmentedField`.
- BUILT, not verified: sheet detent `fitToContents` at `src/app/_layout.tsx:160`.
- BUILT, not verified: confirm pill 52pt high via `paddingVertical: space.md`.
- BUILT, not verified: toast *"{kcal} added to {meal}"*.

**Still open:**

- The confirm label is 17/24 against the design's 17/22 (waiting on Isa).
- The Meal chip keeps 8pt horizontal padding where the design has none.
- There is no selection transition on the Meal chip.
- There is no blinking caret.
- The copy is hardcoded English.
- The offline toast names no meal.
- The screen has its own flex:1 KeyboardAvoidingView at src/app/food/quick-add.tsx:114.

Offline queueing with a loading button is a necessary addition the design does not have.

## Food — Search

**Verdict:** ❌ DIFFERENT
**One-line reason:** The design's search is a dedicated 88%-height sheet with a pill input, four filter chips and a per-row quick-add `+`; the app has no such sheet — search is an inline field whose results replace the day view.

**Design:** sheet titled "Search foods"; a borderless pill input on
`surface.input` with a 17px magnifier and placeholder *"Apple, banana, Indomie…"*;
chips **All · Database · Brands · My dishes**; rows 64pt with a 46×46 thumb, name
`500 15/20`, sub *"Generic · 52 kcal / 100 g"*, and a **separate 44×44 button**
holding a 30×30 black `+` that **logs immediately** at the default serving and
toasts *"320 kcal added to lunch"*. Empty: *"Nothing found"* / *"Try another name,
or scan the package."*

**App:** a bordered `TextField` on the log; results replace the sections; rows
60pt in a grouped card with hairlines; **the trailing `+` disc is a plain `View`,
not a button**, so one-tap add is unreachable — every add goes through the detail
sheet. Empty state is an `EmptyState` with an icon and an "Add custom food" action.

**Differences:** modal sheet vs inline field; input chrome and placeholder; **no
filter chips**; **the `+` is decorative**; no quick-add toast; no thumbnails; row
height/typography; separators; `100 g` vs `100g`; different empty copy plus an
action button; loading and error states the design lacks (necessary for real
network search); dietary-conflict icon; "Add custom food" footer; searching hides
the week strip and calories card.

**Built:** `src/app/(tabs)/food.tsx` now reads a `focus` route param and focuses
the existing search input on mount when it is `search`, so a caller can land on a
focused field as the design does. The trailing `+` disc is now a real button that
logs the result at its default serving and toasts, as the design's one-tap add
does, and it now logs the result's per-100 g macros so it writes the same row as
the detail sheet. The sheet and the filter chips are untouched.

**Status:** recipe ingredient macros now scale by grams, BUILT, not verified.

Recents carry macros scaled per 100 g, including fibre (undefined when unknown), in hooks.ts useFoodSearch; BUILT, not verified.

## Food — My dishes / Saved foods

**Verdict:** ❌ DIFFERENT
**One-line reason:** Design is a two-column photo gallery with a "New dish" tile and a *"5 saved · tap to log again"* subtitle; the app is a searchable single-column text list with swipe-to-unsave.

**Differences:** 2-column 172pt tiles vs a single-column list; **no photos** (the
design gives each dish a 96px image area); **no "New dish" tile**, so no route
from here into the camera; *"My dishes"* vs *"Saved foods"*; no count subtitle; a
search field the design lacks; sub-line *"168 kcal / 100 g · ×14"* (density + log
count) vs *"Brand · 150 g · 240 kcal · P 12g"*; tapping opens an **edit** sheet
rather than an add-confirm; a one-tap `+` the design places on *search* rows, not
dish tiles; swipe-to-unsave with a confirm; name typography; sheet height;
loading/error/empty states. The app additionally has `/food/meals` and
`/food/new-recipe` with **no design counterpart at all** — the design models
exactly one saved-item concept.

## Food — Add sheet

**Verdict:** ⚠️ PARTIAL MATCH
**One-line reason:** Title, tile set, tile grid, copy and disc/glyph sizes match; the Search foods destination, glyphs and scan routes differ.
**Status:** BUILT. `src/app/food/add.tsx` renders the design's five tiles in its order and titles the sheet "Add to {meal}" when a slot is passed. Device run outstanding.

**Design:** title **"Add to lunch"** (lower-cased target meal, follows the `+`
that was tapped; the state defaults to Lunch); a 2-column grid with a 12pt gap of
five tiles — **Search foods** (*"Apple, banana, Indomie…"*), **Scan food** (*"Meal
photo or label"*), **Barcode** (*"Exact database match"*), **My dishes** (*"Your
saved gallery"*), and **Quick add** (*"Just calories, fast"*) as a **full-width
88pt row**. Other tiles 148pt. Icon disc 46, glyph 19, as inline SVGs. Body bottom
padding 34pt.

**App:** title **"Add to {meal}"** from the `slot` param (`add.tsx:56`), or **"Add
meal"** when no slot is passed. The same five tiles with the same copy, in the same
order, with Quick add as the full-width 88pt row and the others 148pt. Disc 46,
glyph 19, as SF Symbols through `Icon`. Tile grid: two equal columns (flexGrow 1,
flexBasis 40%, TILE_BASIS in src/app/food/add.tsx), 12pt gap from space.md. BUILT,
not verified. Owner to check at 320pt and 430pt. BUILT (not verified): sheet bottom
set to 34pt by marginBottom -space.xl on the tile grid in src/app/food/add.tsx, which
cancels SheetContent paddingBottom space.xl (20pt) and leaves the 34pt safe-area
inset. Device check on a 34pt-inset iPhone still open.

**Differences:** Search foods lands on the food tab with its field focused vs the
design's dedicated search sheet; SF Symbols vs the design's inline SVGs, so the camera is
filled vs outlined and My dishes is a single `photo` frame vs a stacked gallery;
separate scan routes (`/food/photo-capture`, `/food/barcode-scan`) vs one scanner
with modes.

## Food — Scan flows

**Verdict:** ❌ DIFFERENT
**One-line reason:** Design is ONE scanner with a `Meal | Label | Barcode` switch, a framed preview with corner brackets, a 74pt shutter and three side shortcuts; the app is three separate routes with no mode switch and a multi-angle flow the design lacks.

**Differences:** no single scanner and no mode control; no framed preview; **no
corner brackets**; no red barcode line; header (40pt close disc + centred title on
white) vs a bare 30px × on black; shutter 74 black with a white inner ring vs 72
white with a grey border; **no gallery button**, **no "my dishes" shortcut**, **no
quick-add shortcut**; entirely different hint and footnote copy; different busy
treatment; **multi-angle capture (up to 3 shots) is an app invention**; AI-consent
gate and camera-permission screens (necessary additions); dev simulate buttons;
barcode not-found recovery (the design has no failure path); label scan ends in a
full form screen with a **`Stepper`** rather than the shared detail sheet; white
chrome vs black chrome.

## Food — "Not in a meal yet" inbox

**Verdict:** ❌ DIFFERENT
**One-line reason:** The design's inbox files unassigned photo items into meals; the app's `ScanReviewCard` confirms an estimated weight with a slider.

**Differences:** *"Not in a meal yet"* vs *"Review before saving"*; a 17px AI dot
vs a `CardHeaderRow` with sparkles; the right-hand note (*"Analysing"* / *"Pick a
meal to file it"*) absent; **different job** (file into a meal vs confirm a
weight); **weight edited with a gesture slider**; `½× / 1× / 2×` pills invented;
no 46×46 thumbnail; no per-row spinner or pulsing "Analysing" pill; no
*"Looks like lunch"* sub-line; opening a row renames only rather than opening the
full sheet with *"File under lunch"*; bulk "Save all" / "Discard" invented;
multi-angle, angle-agreement, repeat-meal and "Typical for you" blocks invented;
different capture toasts; no `"Confirm meal"` badge.

## Food — Calendar sheet

**Verdict:** ⚠️ PARTIAL MATCH
**One-line reason:** Same structure, copy and dot semantics; cell sizing, today's marker and the arrows differ.

Copy matches exactly (*"Pick a day"*, *"Dots mark days with food logged"*,
*"Jump to today"*), as do the Monday-first weekday row and the dot rules.

**Differences:** month arrows have **no fill** (design: 40×40 `surface.tile`
circles); glyph 16 vs 15; disabled treatment greys the glyph instead of dimming
the disc; the `nextDisabled` expression is suspect across a December→January
boundary; cells are fixed 44pt circles in `100/7%` columns vs a 46pt 7-column grid
with a 2px gap; **today is a 1px ring instead of a `light-2` fill**; day numbers
`callout` 15/21 display w400 vs `600 15/19` rounded; the selected dot is pure
white vs `light-3`; future days dim the whole cell vs a tertiary foreground; no
180 ms background transition; "Jump to today" typography; sheet pinned to 0.75 vs
fitting content.

## Food — FAB add menu

**Verdict:** ⚠️ PARTIAL MATCH

Same two rows, same copy (*"Log gym session"* / *"Log food"*), same 232pt width and
96pt bottom anchor, same 62pt `+` rotating 45°.

**Differences:** scrim `rgba(0,0,0,0.45)` vs `0.10`; panel solid white vs
translucent `0.94` + blur; radius 20 vs 18; shadow; row height 52 vs 54; padding
16 vs 18; label 17/24 vs `500 16/20`; icon 20 vs 19; divider 1px `#e5e5ea` inset 16
vs `0.5px rgba(0,0,0,0.10)` inset 18; the gym row **pushes a route** where the
design switches tab with a `'log'` intent (which is what opens the chooser).
Both the solid panel and the darker scrim are documented in `AddMenu.tsx` as
deliberate design-system deviations.

## Food — number entry (cross-cutting)

**Verdict:** ❌ DIFFERENT
**One-line reason:** The design enters every number through the slim bar and uses ± / presets only as shortcuts; the app uses boxed fields everywhere and, in five places, a **slider** or a **± stepper**.

Where numbers are entered in the app today: detail sheet fields (`decimal-pad`),
quick add (`number-pad`), custom food, label scan fields, **label scan servings
(`Stepper`)**, **scan review weight (`SliderField` + ½×/1×/2× chips)**, **new
recipe servings (`Stepper`)**, **recipes log sheet servings (`Stepper`)**.

A search for an input accessory bar or a "Done" pill anywhere in `src` returns
nothing. Additional consequences: no `autoFocus`; a decimal keypad whose values are
then rounded to integers; no length cap or leading-zero stripping; and
`applyGrams` silently changes nothing else when a row has no per-100 basis (a
kcal-only quick add).

---

# Profile / Settings

### Stack coverage

| Design sub-screen | App counterpart |
|---|---|
| Settings root | `src/app/profile/index.tsx` |
| Account | `profile/account.tsx` |
| Delete account | `profile/delete-account.tsx` |
| Subscription | `profile/subscription.tsx` |
| Goals | `profile/goals.tsx` |
| Scan accuracy | `profile/scan-calibration.tsx` |
| AI insights | `src/app/insights.tsx` (the root row routes to `/insights`; no `profile/insights.tsx` exists) |
| Preferences | `profile/preferences.tsx` |
| Connected apps | `profile/integrations.tsx` |
| Privacy | `profile/privacy.tsx` |
| Support | `profile/support.tsx` |
| About | `profile/about.tsx` |

**App surfaces with no design counterpart:** "Sign out", "Delete my account" on
the root, "Terms of Service" and "Privacy Policy" rows on the root, `/legal/*`,
`/ai-query`, the AI-consent gate and "Turn off AI processing", the Fibre goal
field, `HealthDisclaimer`, "Foods we've learned", "Most corrected", and delete
steps 1–2.

**Design elements with no app counterpart:** the "Sign-in method / Apple" row,
account stats (Member since / Days logged / Plan), the whole subscription hero +
usage + billing rows, the goals radio cards and macro bars, the scan-accuracy ring
and "Recent corrections" list, the "Weekly insight push" toggle, and Apple Health.

## Profile — Settings root — ❌ DIFFERENT

Design is a pure settings list: three groups, **each row its own 14px-radius white
card** at gap 4 with a tinted 28pt chip, a name at `400 16/21`, a **trailing
value** and a chevron.

**Differences:** the **avatar block**, the **Streak card** and the
**streak-stats card** are app-only; a fourth group (Sign out / Delete my account)
is app-only; Terms and Privacy Policy rows are app-only; the Account group is
**reordered** (Restore moved third); **every trailing value is missing** (Pro,
Lume/Custom, 92%, 3 new, Metric, connection count); one grouped 28px card with
hairlines and a shadow vs individual 14px cards; chips are always `light1` with
only the glyph tinted, vs a tinted chip; chip radius 10 vs 8; icons are 17pt SF
Symbols vs 15px stroked SVGs; row type 17/24 vs 16/21; value 15/21 vs 14/19; row
height 52 vs 48; padding 16 vs 12; section label 13/16 ls 1 vs 12/16 ls 0.7; group
gap 12 vs 26; top padding ≈115 vs 96; the Support glyph is a question mark vs an
envelope; *"Restore Purchases"* vs *"Restore purchases"*; and a `LoadFailedNotice`
with no design counterpart.

## Profile — Account — ❌ DIFFERENT

Design: a card with the name at `600 26/32` rounded, the email, a hairline, and
**three stats** (Member since `Mar 2026`, Days logged `138`, Plan `Pro`); a
borderless display-name input with the helper *"Shown on your streaks and weekly
recaps."*; a **"Sign-in method / Apple"** row with no chevron; a red-tinted
"Delete account" row; and a sticky *"Save changes"* pill that greys to
`gray-400` when clean.

**Differences:** the card is avatar + name only, centred; **email moved out** to a
separate row; **all three stats missing**; **the Sign-in method row has no
counterpart**; the input is a bordered 52pt `TextField`; **the helper is missing**;
label colour `#171717` vs secondary; *"Delete Account"* vs *"Delete account"*; raw
`accent.red` vs the design's darker danger mix; *"Save"* vs *"Save changes"*;
footer padding; screen gap 12 vs 20.

## Profile — Delete account — ❌ DIFFERENT

Design: one centred confirm screen — a 42px filled **black** warning triangle,
*"Are you sure?"* at `700 22/28`, the body sentence, then a white pill
*"Delete account"* in danger colour and a plain **"Cancel"** text button. No
eyebrow, no title.

**Differences:** the app is a **three-step flow** (manifest → subscription warning
→ type `DELETE`); steps 1–2 have no design counterpart; the app adds an eyebrow +
title the design deliberately omits; **no Cancel button**; a filled destructive
button vs a white pill with a coloured label; three different button labels; body
17/24 vs 16/22; 24px gutters vs 16; back intercepts to step backwards; and the
app performs a real delete where the design toasts that deletion is disabled.

## Profile — Subscription — ❌ DIFFERENT

Design: a **purple→ocean gradient hero** with "Lume Pro", a status pill, the price
at `stat-hero` (`$4.99`), the cadence, a hairline, and **Renews** / **Payment**
rows; then a **usage card** ("This billing period" — Photo scans 138/82%, AI
insights 24/46%, Workouts synced 19/34% with 6px bars); then three **billing rows**
(Change plan / Payment method / Billing history); then a footnote.

**Differences:** no gradient hero; **no price, cadence, renewal date or payment
method**; **no usage card**; **none of the three billing rows**; a `Badge` with a
third "Checking…" state vs an uppercase pill; *"Not subscribed"* vs *"Free"*; an
explanatory paragraph the design lacks; sticky footer buttons the design lacks
(its equivalent actions are the inline rows); Restore duplicated here and on the
root; entirely different footnote copy; a billing-disabled state. The concrete
prices/dates are prototype fixtures — the *presence* of the block is the design
statement, not the values.

## Profile — Goals — ❌ DIFFERENT

Design: two **radio description cards** (*"Lume sets my targets"* / *"1,660 kcal,
from your onboarding answers and recent logs."* and *"I set my own"* / *"Type your
calorie and macro numbers. Nothing is adjusted for you."*) with a selection ring
and tick; then a targets card holding a **borderless 126px `stat-large` calorie
figure** with a `kcal` suffix and an edit hint (*"Set by Lume"* / *"Tap to edit"*),
a "Macros shown in" Grams/Percent pill, and **three read-only macro rows** (dot +
name + `stat-small` value + a 6px category-coloured bar).

**Differences:** a 2-segment control instead of radio cards; different option
copy; **descriptions, icons, selection ring and tick all absent**; a group label
the design lacks; different AI-mode hint copy and placement; the custom-mode
footnote absent; a bordered `TextField` instead of the inline figure; **no card
wrapping calories + macros**; the edit-state hint absent; a helper the design
lacks; different split-control styling (white+shadow vs black fill, 44 vs 32pt);
**six editable macro fields instead of three read-only rows**; **macro bars and
colour dots absent**; a "Macro targets" label the design lacks; **Fibre field,
reconciliation hint, "Reset to AI recommendation" and `HealthDisclaimer` all
app-only**; energy-unit awareness the design lacks.

**Built:** the calorie block now carries the design's three hints — the edit-state
hint beside the section label (*"Set by Lume"* / *"Tap to edit"*) and the
custom-mode *"Saved as you type"* help line under the figure. The calorie figure,
the split control and the macro rows now also sit inside the design's one white
`radius.xl` card (`Card variant="elevated"`, `space.xl` padding, `space.lg` gap)
with a hairline under the figure, and the help line moved below that card. The
rest of this row stands.

## Profile — Scan accuracy — ❌ DIFFERENT

Design: a **96×96 ring** (r40, stroke 9, `dasharray "231 251"`) with `92%` centred
at `stat-medium`, beside *"Getting sharper"* and *"Up 7 points since August. You
corrected 11 of 138 scans."*; three stat tiles (`138` Scans logged, `11` You
corrected, **`±64` Avg kcal off**); a **"Recent corrections"** list of four rows
with struck-through old values; and a closing footnote.

**Differences:** eyebrow *"Your scans"* vs *"Last 30 days"*; **the ring is a linear
`ProgressBar`**; hero is a vertical stack vs a horizontal row; `statLarge` vs
`stat-medium`; **the trend headline and sentence are absent**; a `CardHeaderRow`
and a footnote the design lacks; the third tile is *"Of your scans"* vs *"Avg kcal
off"*; tiles are elevated 28px cards vs flat 20px; **the entire "Recent
corrections" list is absent**; the closing footnote absent; **"Foods we've learned"
and "Most corrected" are app-only**; loading skeletons and an empty state the
design lacks.

## Profile — AI insights — ❌ DIFFERENT

Design: three static insight cards (tinted 26pt chip, title, relative timestamp,
body at `400 14/20`) — *"Protein dips at weekends"*, *"You train best on
Tuesdays"*, *"Deficit is on track"* — plus a **"Weekly insight push"** row with a
51×31 iOS switch, default ON.

**Differences:** eyebrow and title differ (*"Insights"* vs *"AI insights"*, so the
screen disagrees with the row that opens it); **the push toggle is absent**;
`BrainProfileCard`, the **"Ask Lume"** card and `/ai-query` are app-only; the
consent gate is app-only and renders a blank screen while resolving; anomalies,
dismissal, empty states and skeletons are app-only; the feed is data-sorted vs
three fixed cards.

## Profile — Connected apps — ❌ DIFFERENT

Design: **three** providers — **Apple Health** (default connected, *"Two-way sync
for workouts, weight and steps."*), Strava, WHOOP — each a 20px-radius card with a
34pt tinted chip holding a 19px stroked glyph, a status line, an **inline 34pt
pill** (Connect / Disconnect) and a sub-line.

**Differences:** **Apple Health is absent entirely** (eyebrow reads "of 2" vs "of
3"); icons are **emoji** (🏃 / ⌚) rendered as text vs tinted SVG chips; cards are
elevated 28px with 20pt padding vs flat 20px with 16; name `title3` 19/25 vs
`600 16/21`; **full-width stacked buttons** vs one inline pill; a **"Sync now"**
action the design lacks; *"Connect Strava"* vs *"Connect"*; the blurb replaces the
status when disconnected, so *"Not connected"* never appears; different synced
wording; loading skeletons and busy states; different toasts (and **no toast on a
successful connect**).

## Profile — Preferences — ⚠️ PARTIAL MATCH

Same five controls, same labels, same option pairs.

**Differences:** the selected segment is **inverted** — design black fill + white
text, app white + shadow + label text; track `light2` vs `light1`; padding 4 vs 3;
segment height 44 vs 40; label `500 17/24` vs `600 15/20`; field label colour
`#171717` vs secondary; hint placement; **a third `'custom'` state with its own
copy** where the design simply lights neither pill; and **energy is included in the
system check**, so switching kcal→kJ drops the app to "custom" while the design
keeps "Metric" lit.

## Profile — Privacy — ⚠️ PARTIAL MATCH

All four design rows and **both footnote paragraphs match verbatim**.

**Differences:** the app adds section headers ("Analytics", "AI processing", "Your
data") where the design has none; **the AI-processing group and its footnote are
app-only**; grouped 28px cards vs individual 14px row cards; the design's
policy/terms rows imply external URLs while the app pushes in-app documents;
**export is emailed in the design and share-sheeted in the app**; busy labels;
row type 17/24 vs 16/21; the switch geometry is the platform's; screen gap 12 vs 22.

## Profile — Support — ⚠️ PARTIAL MATCH

Identical rows, address (`lumofit@gmail.com`), placeholder and button label.

**Differences:** eyebrow *"Help"* vs *"We reply within a day"*; the design implies
an in-app submission (*"Thanks — feedback sent"*) while the app opens the system
Mail composer and deliberately shows no success toast; no toast on the email row;
grouped card vs two row cards; row geometry and type; a bordered `TextField` vs a
borderless textarea; disabled-button fill; version read from `Constants` vs a
literal.

## Profile — About — ⚠️ PARTIAL MATCH

Identical wordmark, tagline and three meta rows.

**Differences:** the app **adds an eyebrow + title** that the design deliberately
omits (About and Delete are the design's only header-less screens); wordmark
letter-spacing; block gap; tagline centring relies on the parent; grouped card vs
three row cards; row geometry and type; version/build read from `Constants` (which
can render empty and drop the value); icon renderings; screen gap 12 vs 26.

## Profile — shared chrome — ⚠️ PARTIAL MATCH

The convention (grey page, blurred top gradient, floating circular back button,
title inside the scroll) **is** implemented.

**Differences:** header height 84 (this file) vs ≈79 as called; gradient stops
88%→18% vs 0.86→0.20; mask 58% vs 56%; blur 18px+saturate vs `intensity 30`;
**back button 44pt vs 38pt** and positioned ≈63/16 vs 50/14 (the app's size is a
deliberate HIG tap-target choice); different glass recipe; toast radius 20 vs pill,
tone-coloured vs always `#1c1c1e`, bottom offset, and top-placement for info
toasts; **`Screen` hardcodes a 12pt inter-block gap for every sub-screen** where
the design varies 18/20/22/26; uniform ≈115 top padding vs 96/110/120; and
`profile/index.tsx` hand-rolls its chrome instead of using `Screen`.

---

# Tab shell and tab bar

**Verdict:** ⚠️ PARTIAL MATCH

`Lume App.dc.html` mounts four screens (Summary, Food, Gym, Profile) and passes
`onTab(tab, intent)`. I checked the visible bar in `SummaryScreen.dc.html`: it has
**three** tab labels — Summary, Food, Gym — and Profile is reached via
`goProfile` from the avatar. **That matches the app's architecture**, where
Profile lives on the root stack and is opened from the avatar.

**Matching:** three tabs plus a separate 62pt black `+`; 22pt bottom offset; 52pt
cells; 45° rotation over 260 ms; the add menu's 232pt width and 96pt anchor; and
the two menu rows' copy.

**Differences:** row gap 12 vs 10; pill padding 4 vs 5 and inner gap 4 vs 2;
active cell `surface.tile` (opaque `#f2f2f7`) vs `rgba(0,0,0,0.055)`; active label
weight 500 vs 600; glyph 20 vs 21 and `+` 28 vs 27; shadows are the token set
rather than the design's specific three-layer recipes.

**One behavioural difference that matters:** in the design, Summary's `+` menu
routes "Log gym session" via `onTab('gym','log')` — switching to the Gym tab and
opening the chooser. In the app the same row pushes `/gym/log-session`, and
Summary's gym **card** calls `logGymSession()` inline with no arguments at all.

---

# Which prior reports contained incorrect "match" claims

Checked directly rather than assumed.

**`VERIFICATION_REPORT.md` — the only report with a per-screen verdict table, and
the source of the wrong claims.** Its summary asserts "✅ Matches 21 / ⚠️ Minor
drift 13 / ❌ Doesn't match 3". Against this pass:

| Screen | Its verdict | This pass | Why its verdict was wrong |
|---|---|---|---|
| **Log session sheet** (line 100) | ⚠️ minor drift, "Controls are native: Duration slider, effort and energy steppers. Header mirrored." | ❌ | The design has no slider, no steppers and no effort/energy at all; all four of its logging outcomes are missing; two app controls are never persisted. The reported issue (a mirrored header) is the least of it. |
| **Add sheet** (line 84) | ⚠️ "Tile language matches… the composition differs" | BUILT (not verified) | The tile set and title differed from the design when this was checked. Since then the design's five tiles, Quick add as the full-width row and the title "Add to {meal}" are BUILT. Tile grid: two equal columns (flexGrow 1, flexBasis 40%, TILE_BASIS in src/app/food/add.tsx), 12pt gap from space.md. BUILT, not verified. Owner to check at 320pt and 430pt. |
| **Quick add** (line 86) | ⚠️ | ❌ | No hero number, no ± discs, no preset pills, no keyboard bar; plus a `Label` field the design lacks. |
| **Saved foods** (line 87) | ⚠️ | ❌ | The design is a photo gallery with a "New dish" tile; the app is a text list. Reducing this to "photos have no source" understates it. |
| **My schedule** (line 97) | ✅ "Day names clipped until fix 3. The week starts on Sunday where the design starts on Monday." | ⚠️ | A ✅ cannot stand next to a listed defect. Beyond the week order it names, the design's entire "My workouts" section belongs on this screen and is absent, the row sub-line drops the muscle-group phrase, and the picker sheet differs in five ways (order, copy, sublabel, check treatment, an extra create row). |
| **New workout** (line 99) | ✅ "Floating chrome, fields, pill." | ❌ | The three things it checked are the three things the design does **not** have: the design's editor has no name field, no duration field and no save pill. What it does have — per-set rows, warm-up marking, Rest/Tempo/RPE tiles, notes, supersets and the keypad bar — is entirely absent, and saved templates cannot have their exercises edited at all. |
| **My workouts (templates)** (line 98) | ⚠️ "Chrome matches; the '+' is a bare glyph, not a glass circle" | ❌ | The design has no template *list screen*; the list is a section of the schedule screen, and the design has no create-template flow anywhere. The cards also lose a whole line ("Every Mon, Thu") and the muscle-group phrase. |
| **Muscle focus (full view)** (line 96) | ⚠️ "no Front/Back toggle and no set counts (V10); the 3D stage is item 7" | ❌ | Accurate as far as it goes, but grading it ⚠️ understates a screen whose central element — an interactive 3D body appearing three times in the design — does not exist, along with the selection popover, the volume chips and the per-muscle exercise lists. |
| **Month calendar sheet** (line 83) | ⚠️ "Grid, today disc, dots… all match" | ⚠️ (agree on grade) | But "today disc" is wrong — the app draws a **ring**, not the design's `light-2` filled disc. |
| **My Meals** (line 88), **New Recipe** (line 89) | ✅ | n/a | These screens have **no design counterpart at all**, so "✅ matches" cannot be true of them; they can only be "not in the design". |
| **"+" menu** (line 64) | ✅ | ⚠️ | Solid white panel vs translucent, `0.45` scrim vs `0.10`, radius 20 vs 18, row 52 vs 54, label 17/24 vs 16/20, icon 20 vs 19 — all documented in `AddMenu.tsx` as deliberate, but not "matches". |
| **Avatar → Profile** (line 65) | ✅ | ⚠️ | Its own note admits the app shows initials where the design shows a person glyph — which is a difference, not a match. |
| **Summary detail views** (lines 72-75) | ✅ ×4 | **not assessed** | This pass did not compare them; I am not endorsing those verdicts either. |

**`STRUCTURAL_PASS_REPORT.md`** (written during an earlier pass in this same
project) makes two scoped claims:

- *"Matches the design's grid, paging, ramp and summary line"* (V7 calendar) — **this holds.** I verified the app's `GymCalendar` constants against the design markup: gap 5, cell radius 7, legend swatch 11 at radius 3, 32pt nav buttons, `600 10/12` rounded day digit. They agree.
- *"Matches the design's first two cards"* (V16) — **overstated.** The two cards match in chrome, tokens and geometry, but the burned ring is never filled, the "/ 2,400" target and "78% of target" line are absent, a positive net loses its "+", and the scope word is frozen.

**`UI_PASS_REPORT.md`, `ARCHITECTURE_PASS_REPORT.md`, `CLEANUP_PASS_REPORT.md`** —
these contain **no per-screen "matches the design" verdicts** at all. They are work
logs for a restyle, seven architecture items and a cleanup respectively. Nothing in
them needs correcting on this basis.

**`COMPONENT_AUDIT_REPORT.md` does not exist.** That pass was started but
interrupted before the report was written, so there are no claims in it to assess.

## The pattern behind the wrong verdicts

Every incorrect verdict above shares one failure mode: **the prior pass compared
chrome and tokens, and treated the interaction model as out of scope.** A sheet
with the right header, the right corner radius and native-looking controls was
graded "minor drift" even when it asked completely different questions and wrote
completely different data. That is why the gym log-session sheet — the largest
single divergence in the app — was recorded as a ⚠️ whose only listed problem was
a mirrored header.
