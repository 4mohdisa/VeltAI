# Verification report: the running app against the design

Date: 2026-09-10. Branch: `main`. Device: iPhone 17 Pro simulator, iOS 26.5, against Metro.
A new pass, separate from the UI restyle, the architecture pass and the cleanup pass. I trusted
none of their claims. Everything below was checked in the running app; where a document
disagrees with the app, §9 names the document as wrong.

## 1. Result in one screen

| | |
|---|---|
| Covered screens checked | 37 surfaces across Summary, Food, Gym and Profile (§3) |
| ✅ Matches | 21 |
| ⚠️ Minor drift | 13 |
| ❌ Doesn't match | 3 (food detail sheet in logged mode, Gym calendar, Summary card set) |
| Mismatches fixed inline | **6**, one commit each (§6.1) |
| New architecture items | **17** (V1–V17) plus one data defect (D1), appended to `DECISIONS.md` |
| Regression checks | **4 of 4 hold** (§4) |
| "+" menu tap test | **Done by real tap input on the simulator** (§5) |
| Parked screens | 21 of 23 have **no commits** across all passes; the 2 layouts changed for navigation only; 6 checked visually (§7) |
| App tests | 44 suites / 694 before → 44 / 694 after; tsc 0; eslint 0 errors / 35 warnings, unchanged |
| Backend tests | 623 pass / 0 skip / 0 fail against real Postgres (no backend code changed) |

## 2. Method

- **Ground truth, re-read from the source.** I fetched `Lume App.dc.html`, the four screen files,
  `ios-frame.jsx`, `support.js` and `body3d.js` fresh from the Claude Design project. Every file's
  last change predates this pass; the four screen files match the 2026-09-07 cache byte for byte.
  The bound design system's `_ds_bundle.css`, `_ds_bundle.js` and `styles.css` match the
  repo's `ds-bundle/` exactly. The shell file only mounts the four screens in the iPhone frame;
  the tab bar, "+" menu and every sub-screen live inside the screen files as `sc-if` panels.
- **The design, rendered.** I served the screen files locally and viewed each at 402×874 in
  light mode (the README: "light mode only"), then opened each sub-panel (add sheet, detail sheet,
  calendar, quick add, My dishes, schedule, session, the full muscle view, all 12 settings
  panels) by clicking it inside the prototype. That gave a real artboard to compare against,
  not a reading of the source.
- **The app, with real and honestly empty data.** With no backend, every screen is honestly
  empty, which is how I checked the empty states. For success states I ran a read-only stub on
  `:8080` (the app's default API URL) that returns fixture rows in the exact shapes of
  `src/lib/api.ts`. The stub writes nothing, and nothing it returns ships. Three stub-shape
  mistakes of mine produced false symptoms: "NaN%" on Scan accuracy, a render error on the
  schedule, and "Exercise ? × ?" plus a crash on the gym session and exercise progress. In each
  case I read the real type, confirmed the app is correct against it, fixed the stub and
  re-captured. None of those are app defects.
- **Input.** The Claude Code iOS Simulator tool still refuses ("Xcode is installed but not
  selected"; the fix needs `sudo xcode-select`, which needs the owner's password). I drove the
  Simulator window instead through the computer-use tools, granted at full tier, so taps and
  drags are real input events. Late in the pass the Mac's screen locked, which blocks input;
  every capture after that point was made by deep link and `simctl`, which don't need input.
- **Screenshots** are in `docs/verification/`, downscaled to 600 px wide.

## 3. Every covered screen

States: **S** = success (filled), **E** = empty, **L** = loading, **X** = error.
The design shows only filled prototype data, plus a few empty rows ("Add to dinner",
"No insights"). It has no loading or error artboards, so I observed those states where they
came up but had nothing to compare them against.

### Shell and navigation

| Screen | Status | States | Screenshot | Notes |
|---|---|---|---|---|
| Floating tab bar | ✅ | S | `01_summary_success.png` | Glass pill (Summary / Food / Gym) plus a separate 62pt black "+", placed per the design's `left/right:16`, `bottom:22`. Gap, padding, icon and glyph sizes sit within 1–2 pt of the design's CSS (token steps). One icon differs: Food uses `fork.knife`, the design draws a bowl with steam. ⚠️ minor |
| "+" menu | ✅ | open / closed | live, §5 | Scrim, white 232pt card anchored bottom-right, two rows with right-aligned tinted glyphs, a hairline, and "+" rotating to ×. Matches the design's `gMenu` block. |
| Avatar → Profile | ✅ | — | live, §5 | Summary's avatar pushes Profile. The design's avatar is a person glyph on white; the app shows the user's initials, falling back to the glyph with no name. |

### Summary

| Screen | Status | States | Screenshot | Notes |
|---|---|---|---|---|
| Summary tab | ❌ | S, E | `01_summary_success.png` | Chrome matches: grey page, blurred strip, full-date eyebrow (after fix 4), large title, streak line, elevated cards. **The card set and order don't match (V16).** The design runs Energy balance → This week → Steps → Workouts → Macros. The app runs Gym status → Nutrition ring → Energy balance → This week → Workouts → Today's plan. Steps is unbuildable (documented). Empty state: Energy balance renders nothing and Nutrition shows 0 / target, which is honest. |
| Energy detail | ✅ | S | `05_energy_detail.png`, `05b_energy_axis_after_fix2.png` | Kicker, hero, floating-bar chart, footnote and "In and out" all match. Axis dates clipped to one character until fix 2. The app adds an Eaten/Burned legend where the design marks today by opacity. ⚠️ minor |
| Week detail | ✅ | S | `06_week_detail.png`, `06b_week_axis_after_fix2.png` | Same chrome; axis fixed by fix 2. |
| Training detail | ✅ | S | `07_training_detail.png`, `07b_training_axis_after_fix2.png` | Same chrome; axis fixed by fix 2. Gap days draw as gaps. |
| Macros (nutrition) detail | ✅ | S | `08_nutrition_detail.png` | Hero, ring, "Against targets" and Breakdown; Fibre correctly draws no bar at 0%. |

### Food

| Screen | Status | States | Screenshot | Notes |
|---|---|---|---|---|
| Food tab | ⚠️ | S, E | `02_food_success.png`, `02c_food_after_fix4_fix5.png`, `02d_food_empty_slot_after_fix5.png` | After fixes 4 and 5, the eyebrow is the full date and each meal is one white card with its header inside. Remaining drift, all structural: no avatar (V2); a separate month row and white day chips (V3); a Calories card without goal, progress or Fibre (V4); a search field on the log (V17); no per-row icon chip (minor). An empty slot's name renders dimmed, because its long-press delete is disabled with nothing to delete; the design keeps it in the label colour. That dimming predates this pass (minor). |
| Week strip + dots | ✅ | S | `02b_food_tab_for_days_check.png` | Dots on exactly the days `/api/food/days` returned (§4). |
| Month calendar sheet | ⚠️ | S | `11_food_calendar.png` | Grid, today disc, dots, future days greyed and "Jump to today" all match. The header is mirrored (V1); the paging arrows are plain chevrons where the design uses grey circles. |
| Add sheet | ⚠️ | S | `16_food_add_sheet.png` | Tile language matches: grey tile, white disc, tinted glyph. The header is mirrored (V1), and the composition is 2×3 against the design's 2×2 plus Quick add (V5). |
| Food detail sheet (logged mode) | ❌ | S | live | The design has a thumbnail header, serving presets, a read-only macro grid, a meal segmented control, a Save pill and "Remove from log". The app has free-text fields for every value (V6). "Save to my foods" and "Delete item" are both present. |
| Quick add sheet | ⚠️ | S | `12_food_quick_add.png` | Header mirrored (V1). The design uses −/+ steppers and +100/+250/+500/+750 chips; the app has a text field. The Meal segmented control and pill match. |
| Saved foods | ⚠️ | S | `13_food_saved.png` | The design's My dishes is a photo gallery. Photos have no source, as already recorded in `UI_PASS_GAPS.md`. The list form is honest. |
| My Meals | ✅ | S | `14_food_meals.png` | Floating chrome, inset segmented control, elevated card, glass "+". |
| New Recipe | ✅ | E | `15_food_new_recipe.png` | Floating chrome, fields, stepper, honest empty state. |

### Gym

| Screen | Status | States | Screenshot | Notes |
|---|---|---|---|---|
| Gym tab | ❌ | S | `03_gym_success.png` | The eyebrow and title match. **The calendar is not the design's month grid (V7).** The streak card, habits card and training list differ too (V8), and there's no avatar (V2). *Correction (2026-09-11): the calendar in this capture came from the dev seed (`mockGymCalendar`), not from any session data; the app never read sessions for it. V7 replaced it.* |
| Muscle focus (full view) | ⚠️ | S | `20_gym_muscles_after_fix1.png` | The back control was a "‹ Gym" pill until fix 1. The header style differs, there's no Front/Back toggle and no set counts (V10); the 3D stage is item 7. Duplicate rows are possible with real data (D1). |
| My schedule | ✅ | S | `21_gym_schedule.png`, `21b_gym_schedule_after_fix3.png` | Day names clipped to "Tues…" until fix 3. The week starts on Sunday where the design starts on Monday (V9). |
| My workouts (templates) | ⚠️ | S | `22_gym_templates.png` | Chrome matches; the "+" is a bare glyph, not a glass circle (V9). |
| New workout | ✅ | E | `24_gym_new_template.png` | Floating chrome, fields, pill. |
| Log session sheet | ⚠️ | S | `26_gym_log_session_sheet.png`, live §5 | Reached by tapping the "+" menu. Controls are native: Duration slider, effort and energy steppers. Header mirrored (V1). |
| Session | ⚠️ | S | `23_gym_session.png` | Floating chrome, elevated exercise cards ("Barbell bench press 4 × 8 @ 60kg"), Log buttons, "Add an extra exercise", Finish pill. The design titles the screen "Today" with "Push day · not logged" beneath, adds a stat card and "Muscles worked", and draws a grey dumbbell chip per row. Per-session calories are documented as absent. |
| Exercise progress | ✅ | S | `25_gym_exercise_progress.png` | Floating chrome, Personal best card, trend chip, "Weight over time" chart, History. The design's form-guide carousel is documented as having no source. |

### Profile

| Screen | Status | States | Screenshot | Notes |
|---|---|---|---|---|
| Settings root | ⚠️ | S | `04_profile_root.png`, `04b_profile_root_after_fix6.png` | Chrome and groups match, and glyph tints match after fix 6. The app adds an avatar, streak card and stat row, puts Restore third, and has no trailing values (V11). The chip fill is left untinted (V12). |
| Account | ⚠️ | S | `34_profile_account.png` | Eyebrow "YOUR DETAILS" matches the design exactly. The card content and field border differ (V14). |
| Subscription | ⚠️ | S | `33_profile_subscription.png` | Eyebrow "BILLING" matches. No gradient hero or usage section (V13); that data is documented as absent. |
| Goals | ✅ | S | `30_profile_goals_after_fix1.png` | Back pill fixed by fix 1. |
| Scan accuracy | ⚠️ | S | `32b_profile_scan_success.png` | Bar hero against the design's ring, and no corrections list (V15). The eyebrow "YOUR SCANS" differs from the design's "LAST 30 DAYS"; I didn't change it, because that would be a claim about a data window the app doesn't know. |
| AI insights | ✅ | E | `39_insights.png` | Floating chrome; honest "No insights yet". |
| Preferences | ✅ | S | `31_profile_preferences_after_fix1.png` | Inset segmented controls. Back pill fixed by fix 1. |
| Connected apps | ✅ | S | `38_profile_integrations.png` | Floating chrome, elevated provider cards. |
| Privacy | ✅ | S | `37_profile_privacy.png` | |
| Support | ✅ | S | `36_profile_support.png` | |
| About | ✅ | S | `35_profile_about.png` | |
| Delete account | ✅ | S | `40_profile_delete_account.png` | The warning glyph, "Are you sure?" and copy match the design's panel. |

## 4. The four regression checks

1. **Three Dashboard cards stranded grey among white: HOLDS.** `GymStatusCard` and
   `EnergyBalanceCard` render `variant="elevated"`, white on the grey page, in
   `01_summary_success.png`. `PendingSyncBanner` is a deliberate `surface.tile` notice, not a card,
   and only appears when the offline queue has items. See §9 for how the UI pass report describes it.
2. **Settings back button clipping the title: HOLDS.** Every pushed floating screen draws its
   eyebrow clear below the back control; see screenshots 30–40, 04, 05–08 and 20–25.
3. **The four DetailChart screens: HOLD, and one pre-existing defect found.** Energy, week,
   training and macros render identical chrome on device, and the four render snapshots passed
   unchanged at the start of the pass. Looking at them on device showed one thing no earlier pass
   had noticed: the 14-day axis labels clipped to one character ("2…", "1…"). That clipping was
   already in the pre-extraction copies, so it isn't a regression from the extraction. Fix 2
   corrects it, and the four snapshots were **deliberately** re-recorded. The snapshot diff is
   confined to the axis: each label's Text loses `flex:1` and gains `width:48` inside a new
   centred `flex:1` View.
4. **Calendar dots come from `/api/food/days`: HOLDS.** The stub's request log for a Food visit
   plus the calendar sheet is exactly `GET /api/food/days` (twice) and
   `GET /api/food/logs?date=2026-09-10`. There is **no** unfiltered `/api/food/logs`. The dots
   appear on exactly the four dates returned (6, 7, 9 and 10 Sept) and on no other day
   (`11_food_calendar.png`).

## 5. Tap test: real input this time

Two prior passes could only render-test the "+" menu. This pass tapped it on the simulator
through the computer-use tools, which deliver input to the Simulator window; each tap resolved
to the named control under the pointer.

| Action | Result |
|---|---|
| Tap "+" | The menu opens, with scrim, card and the two rows. The glyph rotates to ×, the button's accessibility label becomes "Close add menu", and "Log gym session" and "Log food" appear in the accessibility tree. |
| Tap "+" again | The menu closes and the label returns to "Add". |
| "+" → "Log food" | The Add meal sheet opens (Scan food, Barcode, Saved foods, My Meals, Quick Add). |
| "+" → "Log gym session" | The Log session sheet opens (Duration, Perceived effort, Energy level). |
| Tap the Summary avatar | Pushes Profile (Settings). |

**Two failed attempts, recorded honestly.** The first attempt's taps went to the dev-only
LogBox toast ("Open debugger to view warnings"), which sits over the tab bar in a dev build, and
then to a card behind it. Another tap landed while a sheet was still animating closed, and iOS
swallowed it as usual. Both were redone cleanly.

**Not verified:** the open/close animation curve itself (screenshots show states, not easing),
Reduce Motion, haptics, and real Liquid Glass. These need a physical device.

## 6. Mismatches found

### 6.1 Fixed inline: pure style, one commit each

| # | Commit | What was wrong | Fix |
|---|---|---|---|
| 1 | `70e94ad` | Four floating screens (scan accuracy, goals, preferences, muscle focus) showed a labelled "‹ Settings" / "‹ Gym" pill. The design, and the other 15 floating screens, use a bare 38pt circle. | Dropped `backLabel` on those four. VoiceOver says "Go back". This trades HIG §4.2's named back control for the design's bare one; restoring it is one prop per screen. |
| 2 | `9e6131c` | The 14-day chart axes on energy, week and training clipped every date to one character. | Each label is centred on its column in a 48pt box and may overflow it. The 7-day letter axes are unchanged. Snapshots re-recorded deliberately (§4.3). |
| 3 | `97b1de5` | Schedule day names clipped to "Sun…", "Tues…", "Thur…", "Satu…". | Shows the design's three-letter day. The accessibility label still reads the full name. |
| 4 | `99a3277` | Summary and Food said "TODAY"; Gym and all three design tabs show the full date. | Same `toLocaleDateString` format as Gym. `formatRelativeDate` is untouched. |
| 5 | `604ca44` | Food's meal header sat on the grey page above its white card; the design keeps it inside the card. | The header is now the card's top (white group surface, top corners, row insets). Rows no longer round their top, and the empty-slot "Add to …" footer closes the card. Checked with a filled day and with an empty slot (`02d_…`). |
| 6 | `967511f` | Settings glyphs were all label-black; the design tints five rows by category. | Optional `tint` on `SettingsRowProps`, glyph only; the chip fill is V12. The other importers are unchanged. |

Every fix was checked against the hard constraints. It adds no fabricated value (fix 4 formats
the real device date; fix 6 colours existing glyphs). It doesn't touch auth, RLS, the entitlement
gate, confidence-band or Why-panel sourcing, or debug-capture gating. It introduces no new hex
literal or `rgba()`. `productName.test.ts` passes.

### 6.2 Logged, not fixed: structural

V1–V17 and D1 are recorded in `DECISIONS.md` under **"NEEDS ARCHITECTURE DECISION — surfaced
during verification (2026-09-10)"**, numbered apart from the original seven (1–6 done, 7 still
deferred). The biggest are the mirrored sheet header shared by eight sheets (V1), the Gym month
grid (V7), the logged-mode detail sheet (V6) and Summary's card set (V16). D1 is a data defect,
not design: the exercise library mixes "Back"/"back", so the muscle view can list a group twice.

## 7. Parked screens: untouched

- **Git:** `git log f1da32e~1..HEAD` shows no commit, from any of the three passes or this one,
  touching the 12 onboarding screens, both legal screens, `index.tsx`, `ai-query.tsx`,
  `dashboard/plan.tsx`, `food/history.tsx`, `gym/history.tsx`, `gym/streak.tsx` or
  `gym/freeze.tsx`, and none has uncommitted changes. Only the two layout files changed, both in
  the architecture pass, for navigation (the JS tab bar and the detail-sheet route); neither has
  a visual surface of its own.
- **Visually,** six were checked (`50_…` to `55_…`): legal/privacy, gym/streak, food/history,
  dashboard/plan, onboarding and gym/freeze. All still show their pre-pass chrome: a bordered
  NavBar with a centred title, grey `surface.card` fills, the "‹ Food" pill on history, and the
  unmodified SheetContent on freeze. **None was restyled.**
- **Shared components this pass edited** (`SettingsList`, `DetailChart`) are imported only by
  covered screens.
- An aside for the owner, not a finding against the passes: dashboard/plan and gym/streak show
  mock content in a dev build (an 18:00 gym time, "sleep averaging 6.8h", June dates). Both are
  behind `isDevBuild()` (`planForBuild`, `upcoming`), so a release build shows neither.

## 8. Test results

| | App suites | App tests | Snapshots | tsc | eslint | Backend (real Postgres) | Backend (no Postgres) |
|---|---|---|---|---|---|---|---|
| **Before** | 44 | 694 | 4 | 0 errors | 0 errors, 35 warnings | 623 pass / 0 skip / 0 fail | 609 / 14 / 0 |
| **After** | 44 | 694 | 4 (re-recorded by fix 2) | 0 errors | 0 errors, 35 warnings | 623 pass / 0 skip / 0 fail | 609 / 14 / 0 |

No test was deleted or weakened. The one test change is the deliberate snapshot re-record in
fix 2, and its diff is described in §4.3. For the backend I built a throwaway Postgres 17 in the
scratchpad (TCP 55432, `LC_ALL=C`, the Supabase roles, the auth shim, all 15 migrations clean)
and ran `go test ./... -count=1`. No backend code was changed. My first backend run reported 14
failures: my script's `psql` call never executed (zsh word splitting), so the PG tests hit an
empty database. With that corrected it is 623/0/0.

## 9. Where a prior report doesn't match the running app

1. **`ARCHITECTURE_PASS_REPORT.md`, item 5** says both new routes "push with the floating glass
   back control". `/gym/muscles` actually drew a **labelled "‹ Gym" pill**, not the circle, until
   fix 1.
2. **`CLEANUP_PASS_REPORT.md`** says the four detail screens were confirmed on device, including
   "the axis labels aligned under the columns" on the macros view. That's true for macros, whose
   labels are short category names. On energy, week and training every date label rendered as
   **one character plus an ellipsis**. The byte-identical snapshots preserved a defect that was
   there before the extraction.
3. **`UI_PASS_REPORT.md` §3 / `SettingsList.tsx` docblock** say each settings row "carries a
   tinted 28pt icon chip". In the running app **no chip or glyph was tinted** until fix 6.
4. **`UI_PASS_REPORT.md` §3** lists `PendingSyncBanner` as "elevated". Its own commit
   (`6983bc7`) and the code make it a **`surface.tile` grey notice**. The banner is fine; the
   table's wording is wrong.
5. **`UI_PASS_GAPS.md` §2** still lists the Food day switcher and calendar dots as "not built —
   reads are today-only". The app has **both**, from architecture item 3. The gaps file was never
   updated after that pass.
6. **`UI_PASS_REPORT.md` §5 / `UI_PASS_GAPS.md` §3** still list the floating tab bar, Profile off
   the tabs, the four detail views, the date-aware store, the unified sheet, the calendar and
   muscle routes, and the Profile merge as not implemented. The running app has all of them. This
   is superseded rather than wrong when written, but anyone reading only those two files would
   get the wrong picture.
7. **No report mentioned** four screens drawing the labelled back pill, the schedule's clipped
   day names, the TODAY/full-date inconsistency across the three tabs, or the meal header sitting
   outside its card. All four are visible on the first screenshot of the screen concerned.

## 10. What remains unverified

- Liquid Glass materials, Reduce Motion / Reduce Transparency branches, haptics, Dynamic Type at
  accessibility sizes, and shadow rendering. These are unchanged from the earlier passes' list and
  need a physical device.
- The food detail sheet's search and barcode modes. I opened the logged mode only, since the
  others need a search hit or a scan.
- The open "+" menu, the avatar tap and the logged-mode detail sheet were verified live, by tap,
  before the Mac's screen locked. Their evidence is the session's live screenshots and
  accessibility tree, not a saved file; reproducing any of them needs a tap. The add and
  log-session sheets were re-captured to disk by deep link afterwards.

## 11. Housekeeping

- `docs/verification/*.png` is committed as the evidence for this report.
- **Temporary, and removed at the end of the pass:** the design files I served from
  `.design-sync/previews/` (empty again, as it was before), the verification stub in
  `.design-sync/stub/` (deleted), my two `.claude/launch.json` entries (`design-preview`,
  `verify-stub` with a pinned `STUB_TODAY`; the file was restored with `git checkout`, since it
  was clean when the pass began), the throwaway Postgres data dir (scratchpad only), and the
  design-preview, stub and Metro servers (stopped).
- Pre-existing and left alone: the `.gitignore` modification and the untracked `.design-sync/`
  directory from earlier sessions.

## 12. Commits

```
70e94ad  fix(ui): bare circular back button on the four screens that labelled it
9e6131c  fix(summary): date axis labels no longer clip to one character
97b1de5  fix(gym): schedule day names no longer clip to "Tues…"
967511f  style(profile): tint the settings glyphs by category, as the design does
99a3277  style(summary,food): the full date as the eyebrow, as Gym and the design do
604ca44  style(food): the meal header sits inside its white card, as in the design
```

Plus the docs commit carrying this report, the `DECISIONS.md` section and `docs/verification/`.
