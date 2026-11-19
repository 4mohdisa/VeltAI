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

**22 surfaces ❌ DIFFERENT, 18 ⚠️ PARTIAL, 2 🔨 BUILT (not verified), 0 ✅ EXACT.** No surface compared in
this pass matched the design on every checked value.

| Screen / surface | Verdict | One-line reason |
|---|---|---|
| **Gym — session logging (log sheet)** | ⚠️ PARTIAL (code re-checked, not verified on device) | Chooser re-checked 2026-11-04: code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: title, plan subtitle copy, tile copy, sizes and colours, 12 gaps, edge-to-edge divider with 12 above and below, pill height, caption copy, minutes rounded per exercise (`src/app/gym/log-session.tsx:61-62`, `:176-183`, `:199-266`); the "Only some of it" and "Something else" glyphs (`:400-412`, `:415-421`, bundle :397, :406); the "What did you do?" rows, ticks, copy and "Nothing ticked" pill (`:293-397`, bundle :422-453, :1635-1639); Time as the sum of the ticked exercises' plan minutes (`:124`, `:138`, bundle :1187); no chooser on a logged day, with the design's toast wording (`:106-113`, `:149`, `src/lib/i18n/locales/en.json:233`, bundle :1656).<br>Differences (chooser):<br>1. Subtitle, both sheets: BUILT (device check pending). Both sheets pass `subtitleVariant="caption"`, so the subtitle is caption 11/14 with a 2 gap under the title, as in the design (`src/app/gym/log-session.tsx`, `src/components/navigation/SheetContent.tsx`, bundle :377, :379, :427, :429).<br>2. Close disc: 44 × 44, because `Pressable` adds its 44 minimum tap target by default and the disc does not opt out (`SheetContent.tsx:74-86`, `src/components/primitives/Pressable.tsx:28`, `:52`) vs 40 × 40 (bundle :380).<br>3. Sheet bottom padding: 20 plus safe area (`SheetContent.tsx:143`, `:149`) vs 34 (bundle :415, :449).<br>4. Footer: scrolls with the tiles (`log-session.tsx:259-265`, `:379-394`) vs pinned under a scrolling body (bundle :385, :415).<br>5. Sheet height: `fitToContents` (`src/app/_layout.tsx:155`) vs max height 92% (bundle :374).<br>6. Pill label: BUILT (device check pending). "It went as planned" and the "Log N exercises" pill pass `labelSize="pill"`, so the label is 600 16/21, as in the design (`src/app/gym/log-session.tsx`, `src/components/forms/Button.tsx`, bundle :416, :450).<br>7. Pressed tiles and close disc: the fill changes and the whole control also fades to 0.85 (`Pressable.tsx:53`, `log-session.tsx:215-227`, `SheetContent.tsx:78-85`) vs fill change only (bundle :381, :386, :395, :404).<br>8. SF Symbol glyphs vs the design's drawn paths: the pencil (`log-session.tsx:177`) vs stroke 1.9 (bundle :388); the chevron (`log-session.tsx:250`) and close × (`SheetContent.tsx:87`) vs stroke 2.4 (bundle :382, :412).<br>9. Subtitle minutes for cardio: the planned minutes, or sets × 3.2 when none are planned (`log-session.tsx:61-62`, `:117-120`) vs the sum of the plan's segments (bundle :1161, :1187, :1611).<br>10. Plan-aware states: with nothing planned, the redirect to `/gym/session` in picker mode (`log-session.tsx:172-174`) vs the add sheet in place (bundle :1803), an accepted deviation; on a logged day the check runs after the route opens and whenever the flag changes (`log-session.tsx:106-113`, `:149`) vs only on the + menu tap (bundle :1609, :1656). The toast is item 21.<br>Re-checked 2026-11-04:<br>11. "What did you do?" rows: (a) no trailing kcal tag, because `TemplateExercise` has no per-exercise burn (`src/app/gym/log-session.tsx:364-371`, `src/lib/api.ts:742-755`) vs a 600 13/18 rounded, tertiary-label "N kcal" (bundle :445, :1621); (b) the weight shows the planned unit, so a lb plan reads "lb" (`log-session.tsx:319`) vs always "kg" (bundle :1624); (c) a cardio row with no planned minutes falls back to sets × 3.2 (`log-session.tsx:61-62`, `:318`) vs the sum of its segments (bundle :1623). Box, tick, name, caption, row height, padding, pressed 0.6, button labels and notes: EXACT (code re-checked, not verified on device) (`log-session.tsx:306-394`, bundle :432-451, :1625-1639).<br>12. "Something else": (a) replaces the sheet with `/gym/session` (`log-session.tsx:132-133`) vs the add sheet opening in place (bundle :1614); (b) a pick closes the library onto the check-in with no toast (`src/app/gym/session.tsx:329-343`) vs a toast "{name} added" or "N exercises added", the sheet closed on the Gym day (bundle :1289); (c) the pick lives in that screen's state only (`session.tsx:177`) vs added to the day's saved list without logging (bundle :1195-1197, :1288); (d) one exercise, then a planned-values form (`src/components/gym/ExercisePicker.tsx:93-99`) vs several ticked at once with defaults of 3 × 10 at 20 kg or 20 min cardio, then "Add N exercises" (bundle :509, :1268-1270, :1817-1825).<br>13. Cardio on "It went as planned": the planned minutes go into notes as "N min" and no segments are sent (`log-session.tsx:78`) vs the plan's segments kept (bundle :1180-1182).<br>14. Celebration Time: 60 minutes and over reads "1h 5m" or "1h" (`log-session.tsx:275`, `src/lib/formatting.ts:26-31`) vs always "N min" (bundle :1645).<br>15. Celebration Calories: a dash (`log-session.tsx:278`) vs a number in the calories colour (bundle :1646). The colour matches (`src/components/gym/CelebrationCard.tsx:85`).<br>16. Celebration "logged" line: missing (`CelebrationCard.tsx:74-81`) vs a footnote "{plan} logged — streak extended", or "Session logged…" with no plan (bundle :929, :1643).<br>17. Celebration stats: uppercase labels with 1 tracking and a 4 gap (`src/components/display/Stat.tsx:30`, `:35-37`) vs sentence case, no tracking and a 1 gap (bundle :933, :935). Label colour #6B6B6B matches secondary-label.<br>18. Celebration streak block: 4 gap (`CelebrationCard.tsx:74`) vs 3 (bundle :926).<br>19. "Nice one" pill: 17/24 (`CelebrationCard.tsx:89-93`, `src/components/forms/Button.tsx:101`) vs 600 15/20 (bundle :939). Height 44: EXACT (code re-checked, not verified on device).<br>20. Celebration motion: a static 88 ring of 18% streak over white and a modal fade (`CelebrationCard.tsx:50-59`, `log-session.tsx:271`) vs the ring at 0.18 opacity looping `lumeRing` (scale 0.75 to 1.3, fading out) and a `lumePop` card entrance (bundle :17, :919, :921). Card width 262, padding 24, gap 16, shadow lg, 64 disc and 30 flame: EXACT (code re-checked, not verified on device) (`CelebrationCard.tsx:48-70`, bundle :919-925).<br>21. Logged-day toast (from item 10): BUILT (device check pending). The shared toast now sits 112 off the screen bottom, shows for 2200 ms, and is a gray-1 pill with 13 × 16 padding, a 9 gap, a 16 glyph, 500 14/18 text and a fade-only entrance (`src/components/display/ToastHost.tsx`, `src/components/display/toastStore.ts`, bundle :172-174, :1171). Glyph: BUILT (device check pending) for confirmation toasts. Info and success toasts show the plain `checkmark` SF Symbol, white at 16, in place of the design's drawn tick, stroke 2.6 (bundle :173). By decision, warn and error toasts keep their tone symbols, so an error toast never shows a tick. Sides 16 and shadow md match. Copy matches (`src/lib/i18n/locales/en.json:233`, bundle :1656). Its "open it" has no destination: the logged card draws a chevron but has no press handler (`src/components/gym/TodayCard.tsx:186-198`) vs "Add something extra" and a locked strip with Edit (bundle :850-855, :864-870, :1660).<br>App-only, kept: loading skeleton (`log-session.tsx:151-157`) and load-failed notice with Try again (`log-session.tsx:161-167`).<br>Not compared: the native sheet grabber, corners, overlay and entrance. `/gym/session` items are in the differences list below. |
| **Gym — multiple logging methods** | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: the "How did it go?" chooser and its four answers (`src/app/gym/log-session.tsx:176-180`, `:261`, bundle :386-416); "It went as planned" and "Only some of it" commit in one step and end on the celebration (`log-session.tsx:135-142`, `:187-197`, bundle :1198-1200, :1608, :1640); the Gym tab pill "Log this session", shown only when today has exercises and is not logged (`src/app/(tabs)/gym.tsx:165-167`, bundle :99, :1603); the + menu row opening the chooser on an unlogged planned day (`src/components/navigation/LumeTabBar.tsx:262-265`, bundle :905-906, :1655-1658).<br>Differences:<br>1. "Different weights" destination: a check-in screen of cards with every row's sets open inline (`src/app/gym/session.tsx:122`, `:404-510`) vs the session screen with a stats card, tappable exercise rows and a per-exercise screen (bundle :827-849, :1598).<br>2. "Different weights" banner: missing vs "Tap an exercise to change its sets, reps or weight, then log the session." (bundle :820-825).<br>3. "Different weights" commit: "Finish workout", a "Workout saved" toast and back (`session.tsx:367-370`, `:522-523`) vs "Log this session" and the celebration (bundle :891, :1198-1200, :1608).<br>4. Set rows: reps then weight, no remove control (`session.tsx:482-483`) vs kg × reps with a remove × (bundle :245-260).<br>5. App-only on that screen: the RPE slider (`session.tsx:495-503`), the "Tick each exercise as you complete it" line (`:547`), per-row tick circles (`:409-423`) and the "Save progress?" alert (`:386-399`).<br>6. Saved values: one row per exercise holding the top set by weight (`session.tsx:134-168`) vs every set kept (bundle :1182). Duration: the template's estimate (`session.tsx:364`) vs the sum of exercise minutes (bundle :1187).<br>7. Session screen pill: no route back to the chooser; `/gym/session` shows only "Finish workout" vs "Log this session" opening the chooser (bundle :885-889, :1604).<br>8. "Something else" and the library: replaces the sheet with `/gym/session` over the check-in, one exercise then a values form, no toast (`log-session.tsx:133`, `session.tsx:179`, `:329-343`, `src/components/gym/ExercisePicker.tsx:93-99`) vs a sheet in place, several ticked at once with default values, "Add N exercises", a toast, staying on the Gym day (bundle :509, :1270, :1288-1289, :1614, :1820, :1825).<br>9. Library copy and rows: title "Add Exercise" (`ExercisePicker.tsx:77`) vs "Add exercises" (bundle :1804); placeholder "Search exercises" (`:106`) vs "Bench press, treadmill…" (bundle :469); chips All, Chest, Back, Legs, Shoulders, Arms, Core, Cardio (`:24`) vs All, Chest, Back, Shoulders, Arms, Legs, Cardio (bundle :1806); rows with equipment text and a difficulty badge (`:178-188`) vs a 52 glyph tile, equipment chip, muscle and form-step line, and a 30 tick disc (bundle :480-492, :1816).<br>10. Freestyle on a day with no plan: the + menu redirects to `/gym/session` with the library open (`log-session.tsx:172-174`), an accepted deviation, vs the add sheet in place (bundle :1803). The Gym tab's rest card has no action (`src/components/gym/TodayCard.tsx:224-236`) vs a session screen with "Rest day", "Nothing scheduled and nothing logged." and a "Log an exercise" pill (bundle :875-883); the app's nearest copy is "Add an exercise to log a freestyle session." with "Add an exercise" (`session.tsx:537-543`).<br>11. Custom exercise: missing, with "No exercises found" (`ExercisePicker.tsx:158-160`), and `src/lib/api.ts` has no create-exercise call, vs "Add “{query}” as a custom exercise" and "Not in the library — save it as your own" (bundle :495-505, :1827-1829).<br>12. Cardio logging: one parameter form or minutes and distance (`session.tsx:77-79`, `:453-472`) vs "Speed segments" with a bar chart, minutes and km/h rows, remove × and "Add segment" (bundle :272-311). "It went as planned" keeps cardio as a minutes note (`log-session.tsx:78`) vs the plan's segments (bundle :1180-1181).<br>13. + menu from Summary or Food: the sheet opens over the current tab (`LumeTabBar.tsx:262-265`) vs switching to the Gym tab, then opening the chooser (Summary bundle 185bb533 :764, Food bundle 71f71ac4 :886, Gym bundle :1079-1080).<br>14. Logged day: no way to add to or edit the session (`TodayCard.tsx:186-198`) vs "Add something extra" and a locked strip with Edit and "Save changes" (bundle :850-855, :864-873).<br>15. Today card route: a "Start workout" button opening `/gym/session` with nothing ticked (`TodayCard.tsx:267`, `session.tsx:124`) vs the whole card opening the session screen, with no such button (bundle :72, :1582).<br>App-only paths with no design counterpart: the Summary gym card's zero-field log (`src/app/(tabs)/index.tsx:174-181`), kept under conflict V16; Strava and WHOOP import (`src/app/profile/integrations.tsx:1`, `:34`). |
| **Gym — workout / template detail** | ❌ DIFFERENT | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: 16 side padding and 12 gap (`src/components/navigation/Screen.tsx:91-96`, bundle :562); white exercise surface with radius 20 and small shadow (`src/app/gym/new-template.tsx:169`, bundle :568); name in `bodyMedium` over a footnote line (`new-template.tsx:198-203`, bundle :572-573); the "Planned sets", "Target reps", "Target weight · kg" and "Rest · seconds" captions and keyboards on `NumberEntryBar` (`src/components/gym/PlannedValuesForm.tsx:44-49`, bundle :1793-1796, :1798).<br>Differences:<br>1. Screen model: a create or edit form saved with "Save workout", a toast and back (`new-template.tsx:87-119`, `:127-134`) vs a live editor where every edit persists and there is no save (bundle :553-647, :1130-1133).<br>2. Header: eyebrow "Workout" and title "Edit workout" (`new-template.tsx:124-125`) vs the template's name as `title-1` with no eyebrow (bundle :564). Top padding: `insets.top` + 56 (`Screen.tsx:91`) vs 110 (bundle :562).<br>3. Summary line: missing vs "{muscles} · N working sets · about M min", with minutes derived from sets × 3.2 plus cardio minutes (bundle :565, :1856-1861).<br>4. App-only fields: "Name" and "Duration (min, optional)" (`new-template.tsx:136-155`); the design's name is not editable here and its minutes are never typed.<br>5. Add control: an "Add an exercise" pill in the list, shown only when creating (`new-template.tsx:241-249`) vs a 62 black FAB at right 16, bottom 26 (bundle :559-561, :1862), with 96 bottom scroll padding (bundle :562).<br>6. Exercise layout: one shared card of rows, the `EXERCISES` label and hairlines (`new-template.tsx:158-160`, `:169-232`) vs one card per exercise with 16 padding, as a single-open accordion with a rotating chevron (bundle :567-579, :1913).<br>7. Collapsed row: no 26 index chip, chevron or Superset pill; summary "3 × 10 @ 60kg" (`new-template.tsx:29-37`) vs "(sets − warm) × reps · {kg or bodyweight} · RPE 8" (bundle :570, :576, :578, :1905).<br>8. Set rows: missing vs a warm-up chip cycling W, 1, 2, a kg box, ×, a reps box, a remove × and an "Add set" pill (bundle :583-605, :1896).<br>9. Rest, Tempo and Target RPE tiles: missing vs a three-up grid, with Rest and RPE opening the bar and Tempo cycling 2-0-2, 3-1-1, 4-0-1, 1-0-1 (bundle :607-620, :1127). Rest is typed only in the picker form (`PlannedValuesForm.tsx:186`).<br>10. Notes: missing vs a `NOTES` textarea with the placeholder "Elbows tucked, pause on chest" (bundle :621-624).<br>11. Superset: missing vs "Superset with next exercise" and a 50×30 switch (bundle :625-630).<br>12. Stored fields: `TemplateExercise` and `TemplateExerciseInput` carry no warm-up, tempo, RPE, notes or superset (`src/lib/api.ts:742-756`, `:815-824`) vs all five per exercise (bundle :1128).<br>13. Removing an exercise: a trash icon or swipe, then a confirm alert (`new-template.tsx:173-177`, `:205-215`, `:222-228`) vs a red "Remove exercise" pill that removes immediately (bundle :631, :1920-1923).<br>14. Saved workouts: exercises are read-only, with "Exercises can’t be edited on a saved workout yet." (`new-template.tsx:219-220`, `:235-239`) vs every exercise value editable. The client has `addExerciseToTemplate`, `updateTemplateExercise` and `removeTemplateExercise` (`api.ts:1154-1158`), and no screen calls them.<br>15. Adding an exercise: a values form with sets, reps, blank weight, a kg or lb control and blank rest (`PlannedValuesForm.tsx:69-76`, `:160-186`) vs seeded at 3 sets, 10 reps, 20 kg, rest 90, tempo 2-0-2, RPE 8 and opened in the accordion (bundle :1128, :1275-1283).<br>16. Number bar placement: inside the picker form, replacing "Add exercise" (`PlannedValuesForm.tsx:190-201`) vs pinned below the scroll (bundle :637-645). The design's "Target RPE · 1-10" pad is missing (bundle :1797).<br>17. Cardio: "30 min" and a boxed "Duration (min)" field (`new-template.tsx:31`, `PlannedValuesForm.tsx:176-184`) vs "N legs · M min" with one row per leg (bundle :1884, :1890-1891, :1904).<br>App-only, with no design counterpart: the create form as a route, and the `/gym/templates` list (`src/app/gym/templates.tsx:17-75`, `src/app/(tabs)/gym.tsx:178`); the design opens this editor only from My schedule's workout rows (bundle :1853). |
| Gym — Muscle focus / 3D body | ❌ DIFFERENT | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: card surface with 16 padding and 12 gap, "Muscle focus" in `bodyMedium`, strongest muscle first (`src/components/gym/MuscleChart.tsx:128`, `:141-142`, bundle :104, :106, :1555); 84 name column, 8 bar height and 74 value column (`MuscleChart.tsx:37-39`, bundle :1019-1023); "All muscle groups" title (`src/app/gym/muscles.tsx:75`, bundle :1014).<br>Differences on the Gym tab card:<br>1. 3D body: missing vs a 240 `surface.card` stage with radius 20, torso view, pick and zoom (bundle :110-111). `package.json` has no three.js, and the design's `body-3d` needs it (`MuscleChart.tsx:8-9`).<br>2. Expand button: missing vs a 34 white disc at top 8, right 8 (bundle :112-114).<br>3. Selection popover: missing vs a glass panel with the muscle's name, "N sets · N kg this week", up to three exercises, a 28 close disc and "Nothing hit this muscle in the last 7 days." (bundle :115-137, :1523-1527).<br>4. Muscle chips: missing vs up to five tappable chips, tinted 8–34% streak by intensity, with a 1.5 ring when selected (bundle :139-146, :1513-1518).<br>5. Hint line: missing vs the caption "Strongest focus: {muscle}. Tap a muscle to zoom in, or expand for the full body." (bundle :147, :1530-1531).<br>6. Bar list: ten static rows on the card (`MuscleChart.tsx:162-166`) vs no rows there.<br>7. Header: a 17 tinted barbell glyph, "Last 30 days" in tertiary, a tertiary chevron and a 44 minimum height (`MuscleChart.tsx:131-137`, `src/components/display/CardHeaderRow.tsx:34`, `:39`, `:45`) vs no glyph, "Last 7 days" in secondary, a `gray-400` chevron and a 28 minimum height (bundle :105-108).<br>8. Header press: only with data (`MuscleChart.tsx:145-155`) vs always (bundle :105).<br>9. No-data copy: "Log workouts to see which muscles you hit" (`MuscleChart.tsx:159`) vs "Log a session to see which muscles you hit." (bundle :1532).<br>Differences on the full screen (`/gym/muscles`):<br>10. Header: the floating `Screen` title with the eyebrow "Last 30 days" (`muscles.tsx:94`) vs a blurred bar with a 38 back disc, `title-3` and "Last 7 days · {N} kg lifted" (bundle :967-975, :1553).<br>11. Body stage: missing vs a 326 white full-body stage with pick and zoom (bundle :977-978).<br>12. Front and Back control: missing vs a pill control with 32 segments (bundle :1002-1007, :1538-1543).<br>13. Selection popover: missing vs a glass panel listing every exercise for the muscle (bundle :979-1001, :1548-1552). `muscle_volume_map` holds volume per group only (`src/lib/api.ts:801`), so no response supplies those sets or exercises (`muscles.tsx:9-12`).<br>14. Total volume card: app-only (`muscles.tsx:63-71`).<br>15. List container: an elevated card with an 8 gap (`muscles.tsx:73-74`) vs no card, a 2 gap and 16 / 20 / 40 scroll padding (bundle :1010-1012).<br>16. List scope: "Volume" in footnote (`muscles.tsx:75`, `CardHeaderRow.tsx:39`) vs "Sets · volume" in caption (bundle :1015).<br>17. Rows: static, 28 minimum height, 12 gap and a footnote name (`MuscleChart.tsx:70-72`) vs tappable with a selected fill, 44 minimum height, 10 gap and a body name (bundle :1018-1019, :1564-1566).<br>18. Bars: solid streak on a `light2` track, with a dash when empty (`MuscleChart.tsx:80-93`) vs no track, a streak gradient fading to transparent, and an empty bar (bundle :1020-1021, :1563).<br>19. Value column: one footnote value, unit-free, such as "1.2k" (`MuscleChart.tsx:49-52`, `:96-103`) vs a rounded 600 13/16 set count over a caption "1.2k kg" (bundle :1024-1025, :1561-1562).<br>20. Muscle groups: chest, back, shoulders, biceps, triceps, core, glutes, quadriceps, hamstrings and calves, plus anything else the server sends (`MuscleChart.tsx:23-34`, `muscles.tsx:32`) vs nine, with Arms and Quads (bundle :1143).<br>21. Window: 30 days from the server (`muscles.tsx:13-15`) vs 7 days (bundle :107, :973).<br>22. Footer caption: a volume explanation (`muscles.tsx:85-88`) vs "Drag the body to spin it. Tap a muscle to zoom in and see the exercises that hit it." (bundle :1031).<br>23. No-data state: "No muscle data yet" (`muscles.tsx:53-57`) and a loading skeleton (`muscles.tsx:44-47`) are app-only; the design always shows the list.<br>Difference on the exercise screen:<br>24. "Muscles worked": chips only (`src/app/gym/exercise-progress.tsx:88-90`) vs a 216 body stage above the chips, facing front or back by muscle (bundle :195-197, :1699-1701). |
| Gym — day / session detail | ❌ DIFFERENT | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>The app has no counterpart to this view: `src/app/gym/` has no day route, so nothing on it can match.<br>Differences:<br>1. Calendar cells: plain views that do nothing when tapped (`src/components/domain/GymCalendar.tsx:80-95`) vs tappable on every past day and today, opening the day view (bundle :57, :1263).<br>2. Calendar ring: always on today (`GymCalendar.tsx:74-75`) vs on the selected day (bundle :1261).<br>3. Today card: not tappable, with a chevron on the logged state only (`src/components/gym/TodayCard.tsx:186-198`) vs the whole card opening the day view (bundle :72, :1582).<br>4. Day header: missing vs a `title-1` "Today", "Yesterday" or "{weekday} {date} {month}" (bundle :683, :1928), over "{plan} · logged", "{plan} · not logged yet" or "Rest day" on today (bundle :685, :1929), and "{plan} · {N} min · {N} kcal · {N} steps" on past days (bundle :688, :1470-1472).<br>5. Page chrome: missing vs a 44 glass back button, 110 / 16 / 96 scroll padding with a 16 gap, and a 62 black add FAB on today only (bundle :673-681).<br>6. "Energy in and out" card on past days: missing vs a net deficit or surplus chip, Eaten and Burned rows with 7 bars, and resting, steps and training rows with 5 bars (bundle :692-729, :1474-1486).<br>7. "The workout I did" card on past days: missing vs a four-up stats grid (Duration, Calories, Volume, Sets) and tappable exercise rows with a kcal tag and chevron (bundle :731-752, :1584-1598). The nearest app view is the logged Today card, today only, with three stats and no Calories, and exercise chips instead of rows (`TodayCard.tsx:137-172`).<br>8. "Muscles this session hit" card: missing vs rows with a name, an 8 gradient bar, sets and volume (bundle :756-772, :1441-1460).<br>9. "What I ate" card on past days: missing vs a kcal total, meal rows with time, dish, macros and kcal, and Protein, Carbs and Fat bars (bundle :789-818, :1487-1496).<br>10. Past-day notes: missing vs "Nothing was logged on this day — the session above is what had been planned." and a "Rest day" card with "No session logged — the energy below is food and steps only." (bundle :775-787).<br>11. Today's view: missing; `/gym/session` is a check-in form instead, as listed under "Gym — multiple logging methods". The design has a stats card, exercise rows, an add pill and a "Muscles worked" card (bundle :826-863).<br>12. Logged and locked: missing, and no screen calls `api.gym.updateSession` (`src/lib/api.ts:1127`), vs "Logged and locked. Numbers are saved as they were.", an Edit button and "Save changes" (bundle :864-873, :1662-1665).<br>13. Empty today: the rest card has no action (`TodayCard.tsx:224-236`) vs "Rest day", "Nothing scheduled and nothing logged." and a "Log an exercise" pill (bundle :875-883).<br>Data for this view: energy and food logs can be read by date (`api.ts:1059`, `:1173`); sessions carry no calories (`src/app/dashboard/training.tsx:7-10`), and exercise kcal tags have no source. |
| Gym — "My schedule" card | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: the whole card opens the schedule screen (`src/components/gym/MyScheduleCard.tsx:61`, bundle :150, :1690); elevated surface with 16 padding and 12 gap (`MyScheduleCard.tsx:59-63`, bundle :150); title and planned-day count copy (`:40`, `:65`, bundle :152-153, :1668); rows for today, tomorrow and the day after at 48 minimum height with an 11 gap and a hairline above all but the first (`:41-55`, `:70-76`, bundle :158, :1669-1679); 64 day label at 600 12.5/17, label colour on today and secondary after (`:17`, `:23`, `:80-81`, bundle :159, :1674); 8 dot, streak with a workout and `light2` without (`:88-91`, bundle :160, :1675); name at 500 15/20, "Rest day" in secondary (`:24`, `:95`, bundle :161, :1676-1677); trailing footnote "N exercises" or "Nothing planned" in tertiary (`:101-102`, bundle :162, :1678).<br>Differences:<br>1. Planned-day count colour: tertiary (`src/components/display/CardHeaderRow.tsx:39`) vs secondary (bundle :153).<br>2. Header chevron: an SF Symbol (`CardHeaderRow.tsx:45`) vs a drawn path with a 2.4 stroke (bundle :154); the size and colour match.<br>3. Pressed state: the card fades to 0.85 with no fill change (`src/components/display/Card.tsx:52-58`, `src/components/primitives/Pressable.tsx:53`) vs the fill changing to `light-1` (bundle :150).<br>4. Load and failure: the card is absent until the schedule loads, and stays absent if the read fails (`MyScheduleCard.tsx:37`); the design has no such state and always shows it. |
| Gym — streak strip | 🔨 BUILT (device check pending) | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device. One-row streak strip BUILT (device check pending) (`src/app/(tabs)/gym.tsx:132-155`, bundle :35-40).<br>Matches: elevated white card at radius 28 with `shadow.sm`, padding 12 × 16 (`gym.tsx:132-138`, `src/components/display/Card.tsx:11`, bundle :35); 20 flame in the streak colour (`gym.tsx:140-142`, bundle :36); count in `statSmall` and "day streak" in `bodyMedium`, both label colour (`gym.tsx:143-148`, `src/lib/i18n/locales/en.json:253-254`, bundle :37-38); right-aligned footnote "N sessions · N freezes" in secondary label (`gym.tsx:149-153`, bundle :39, :1501).<br>Differences:<br>1. Gap between items: BUILT (device check pending): `STREAK_STRIP_GAP` 11 replaces `space.md` 12, as in the design (`gym.tsx:39`, `:139`, bundle :35).<br>2. Flame: BUILT (device check pending): the pulsing `StreakFlame` is replaced by the design's static 20 evenodd path with the inner flame cut out, always in `categoryAccent.streak` (`gym.tsx:41-43`, `:140-142`, bundle :36).<br>3. Footnote while loading: BUILT (device check pending), no code change: the footnote is already hidden until gym data has loaded, and after a failed load (`gym.tsx:149`). The design has no loading state; its footnote is a fixed string (bundle :39, :1501).<br>Accepted deviation, kept: the strip taps through to `/gym/streak` (`gym.tsx:135`), so it also fades to 0.85 when pressed (`src/components/primitives/Pressable.tsx:53`); the design strip is not a button.<br>`src/app/gym/freeze.tsx`: strings go through `t()`, BUILT (device check pending) (`:34`, `:38`, `:47`, `:50`).<br>Apply a streak freeze label moved to t() (gym.applyStreakFreeze, en/es/fr), BUILT (device check pending) (`gym.tsx:188`, `src/lib/i18n/locales/en.json:274`, `es.json:276`, `fr.json:274`). |
| Gym — "Log this session" CTA | ⚠️ PARTIAL | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: "Log this session" copy through `gym.logThisSession` (`src/lib/i18n/locales/en.json:249`, bundle :99); primary fill, on-primary label, pill radius and 8 gap, centred, 52 minimum height (`src/components/domain/GymSessionButton.tsx:56-66`, bundle :99); 15 trailing chevron-up at 0.7 opacity (`GymSessionButton.tsx:71`, bundle :100); 0.85 pressed opacity (`src/components/primitives/Pressable.tsx:53`, bundle :99); shown directly under the session card, only when today has exercises and is not logged (`src/app/(tabs)/gym.tsx:162-167`, bundle :98, :1603).<br>Differences:<br>1. Label type: `bodyBold` 600 17/24 (`GymSessionButton.tsx:68`) vs 600 16/21 (bundle :99).<br>2. Rendered height: 16 vertical padding plus the 24 line gives 56 (`GymSessionButton.tsx:63`) vs 52 with no vertical padding (bundle :99).<br>3. Side padding: 28 (`GymSessionButton.tsx:64`) vs none (bundle :99).<br>4. Chevron: a semibold SF Symbol (`GymSessionButton.tsx:71`) vs a drawn path with a 2.4 stroke and round caps (bundle :100).<br>5. Opening the sheet: pushes `/gym/log-session`, a native form sheet (`src/app/(tabs)/gym.tsx:166`, `src/app/_layout.tsx:155`), vs setting the sheet state on the same screen (bundle :1612).<br>6. Load and failure: absent until `useToday` returns, and absent if the read fails (`src/app/(tabs)/gym.tsx:47`, `:165`); the design has no such state.<br>7. Session screen: the same pill and, in adjust mode, a chevron-free "Log this session" are missing (bundle :885-892); `/gym/session` shows "Finish workout" instead (`src/app/gym/session.tsx:522`). |
| Gym — streak detail & session history | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device; Food bundle 71f71ac4 and the other design modules have no such screens.<br>Matches the design's pushed-screen conventions: floating chrome with a large title and a 20 page gap (`src/app/gym/streak.tsx:30`, `src/app/gym/history.tsx:23`, bundle :517-522); back button shadow, ring and 18 icon on a circle (`src/components/navigation/GlassButtons.tsx:131-151`, bundle :518-519); elevated cards (`streak.tsx:31`, `:43`, `:86`, `history.tsx:33`, bundle :35).<br>Differences:<br>1. Streak detail: app-only, with no design counterpart: the counter card, "Next 7 days" with action badges, and Longest, Sessions and Freezes stats (`streak.tsx:31-92`). The design's streak appears only in the main-tab strip and the celebration modal (bundle :35-40, :917-941).<br>2. Session history: app-only, with no design counterpart: a list of date, duration, effort and notes (`history.tsx:33-61`). The design reaches past sessions from a calendar cell into the day view (bundle :57, :1263).<br>3. Ways in: the Gym tab's streak strip is a button (`src/app/(tabs)/gym.tsx:126-128`) vs a card with no press (bundle :35); the Summary streak line is a button (`src/app/(tabs)/index.tsx:117`) vs static text (Summary bundle 185bb533 :34-37); a "Session history" row in the Training list (`gym.tsx:180`) vs no such list.<br>4. History back control: a pill labelled "Gym" (`history.tsx:23`, `GlassButtons.tsx:132-138`) vs a 44 circle with no label (bundle :518). Top padding on both screens: `insets.top` + 56 (`src/components/navigation/Screen.tsx:91`) vs 110 (bundle :521).<br>5. Streak hero against the nearest design treatment, the celebration: a 44 flame with no rings, `statLarge` and an uppercase caption with 1 tracking (`src/components/domain/StreakCounter.tsx:21-25`) vs a 30 flame in 64 and 88 rings, `stat-hero` and "day streak" in `callout` (bundle :920-928). |
| Food — Day log (main view) | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): page sides 16, bottom 158 and block gap 14 (`src/app/(tabs)/food.tsx:419`, `:421`, `:435`, bundle :29); header height 82 (`food.tsx:670`, `src/components/navigation/FloatingHeader.tsx:36`, bundle :27); title block side padding 4, eyebrow min height 40, gap 7, pressed 0.55, tracking 1.1 and 10 chevron, title tracking -0.6 and right padding 52 (`food.tsx:441-471`, bundle :31-36); calories card radius 28, padding 20, gap 16, 17 flame, gap 8 and title style (`food.tsx:702-703`, `src/components/display/CardHeaderRow.tsx:33-35`, bundle :55-58); the four macro columns, 6 bars, gap 6, column gap 12, caption name and stat value (`food.tsx:712-723`, bundle :69-77); the logged-row macro line with whole numbers (`food.tsx:927-932`, bundle :878). The macro names, card title and row labels use `t()`; es and fr are unreviewed drafts, and the four columns have not been checked on a device for caption-size wrapping (es 'Carbohidratos').<br>1. Calorie hero: total eaten with "{unit} logged" vs kcal remaining with "kcal left today", "kcal under goal" or "kcal over goal"; no -1 tracking; gap 8 vs 7 (`food.tsx:704-710`, bundle :61-63, :844-845).<br>2. No 12 calorie bar and no "N eaten · goal N kcal" line (bundle :65-68, :846-847). The calorie goal is not read, on purpose per `food.tsx:682-683`.<br>3. No day label ("Today", "Yesterday" or a date) on the right of the card header (`food.tsx:703`, bundle :59, :951).<br>4. Macro bars have no 700 ms fill transition and no 1% minimum fill (`src/components/display/ProgressBar.tsx:22`, `:29`, bundle :72, :822).<br>5. Search field sits on the tab (`food.tsx:492-499`) vs in a sheet (bundle :239); see the Food — Search row.<br>6. Empty day: the calories card and all meal cards are replaced by an empty state (`food.tsx:323`, `:489`, `:626-633`) vs the card and four meal cards always showing, each with "Add to …" (bundle :55, :115, :151-156).<br>7. Week strip (`src/components/food/WeekStrip.tsx`): a month label row with the arrows above the chips, tracking 1 (`:36-66`) vs one row with an arrow each side of the chips (bundle :39-53); arrows 44 wide with 16 glyphs vs 28 and 15 (`:146-155`, bundle :40-41); the next arrow goes tertiary vs opacity 0.35 (`:156`, bundle :50, :966); chip gap 4 vs 2 (`:68`, bundle :39); chip renders 66 (8 + 8 padding, 14 caption, 24 number, 4 dot, 4 + 4 gaps, above its 52 minimum) vs fixed 60 (`WeekStrip.tsx:90-96`, bundle :44); chip inner gap 4 vs 2 (`:94`, bundle :44); unselected chips white vs transparent (`:96`, bundle :957); today with no selection a hollow ring on the dot vs a light-2 chip fill (`:118`, bundle :957); number 500 17/24 display vs 600 15/19 rounded (`:103`, bundle :46); selected letter and dot white vs light-3 (`:100`, `:115`, bundle :959-960); future days opacity 0.4 vs tertiary text (`:97`, bundle :958).<br>8. Meal card header: dot 12 vs 17 (`food.tsx:794`, bundle :118); gap 8 vs 9 (`:786`, bundle :117); total-to-unit gap 4 vs 9 (`:809`, bundle :117); + disc 28 vs 30, glyph 16 vs 15, side margin -12 vs -10 (`:832`, `:837-838`, `:845`, bundle :122-124).<br>9. Logged rows: hairline separators vs none (`food.tsx:898`, bundle :128-129); no 46 food thumbnail, which the design shows by default (bundle :130-134, :667); name 400 17/24 vs 500 15/20 (`:923`, bundle :136); text gap 4 vs 1 (`:922`, bundle :135); min height 60 vs 58 (`:894`, bundle :129); number-to-unit gap 4 vs 12 (`:937`, bundle :129); pressed opacity 0.85 vs a light-1 fill (`src/components/primitives/Pressable.tsx:53`, bundle :129).<br>10. Empty-meal add row, shown when another meal has items: min height 56 vs 44, 20 outlined circle vs a 15 plus (`food.tsx:574`, `:581`, bundle :152-153).<br>11. Date eyebrow follows the device locale, so en-US reads "Monday, November 2" vs "Monday 2 November" (`food.tsx:402-406`, bundle :950).<br>12. Top padding is `insets.top` + 12, which gives 59 at a 47 inset, 71 at a 59 inset and 74 at a 62 inset, vs a fixed 70 (`food.tsx:420`, bundle :29), pending Isa.<br>13. App-only, no design counterpart: the anomaly banner (`food.tsx:437`), scan feedback, review and failed cards (`:500-513`), the Meal history link, whose 12 padding and label sit above the 158 (`:652-663`), swipe to delete (`:546`) and long press to delete a meal (`:798`). The strip blur is an approximation and its Reduce Transparency branch is app-only (`FloatingHeader.tsx:10`, `:42`). |
| Food — Food detail sheet | ⚠️ PARTIAL (code re-checked, not verified on device) | All six numbers are now tap-to-edit through the shared `NumberEntryBar` — the design’s captions and keyboards (`Serving size · grams` and `Calories · kcal` numeric, the four macros decimal), a grams chip, a tappable kcal readout and a 2×2 macro grid replacing the boxed fields. Delete item translated (en, es, fr). Not verified. Delete confirmation and toast translated, with es and fr unreviewed drafts; the toast uses the design's "Removed {name}", and the confirmation has no design counterpart. Not verified. Saved-mode removal strings are now translated, with es and fr unreviewed drafts. Not verified. BUILT: copy strings in `src/app/food/detail.tsx` now use `t()` keys present in en, es and fr. Not verified. Still different, code re-checked against Food bundle 71f71ac4, not verified on device:<br>1. Identity: 96 photo tile, name and brand beside the close, "Logged today" for a logged row vs no photo, a fixed title such as "Edit item" in the header, name and sub-line in a card, and no sub-line for a logged or saved row (`src/app/food/detail.tsx:300`, `:484-496`, bundle :386-399, :978).<br>2. AI note "Estimated from your photo — check the serving before saving" has no counterpart in the sheet (bundle :400-405, :979).<br>3. A logged row opens read-only: macro list and "Edit values manually", with the grams chip and kcal not tappable, vs always tappable (`:399`, `:479`, `:501-503`, `:551`, `:575-610`, bundle :409, :426, :435).<br>4. Grams chip: row gap 8 vs 10, inner gap 4 vs 5, no caret while editing, figure greys until typed vs staying label-coloured, pressed opacity 0.85 vs 0.6 (`:504`, `:519`, `:464`, `:532`, `src/components/primitives/Pressable.tsx:53`, bundle :407, :409-413).<br>5. Serving presets: track padding and gap 4 vs 3, labels 500 17/24 vs 600 15/20, and picking one leaves the pad open vs closing it (`:537-543`, `src/components/forms/SegmentedField.tsx:64-65`, `:105`, bundle :419, :421, :1000).<br>6. Kcal readout: centred vs left-aligned, gap 8 vs 7, padding 8/4 vs 10/2 with a -10 margin, no caret, figure greys until typed, and an extra "for N g" line (`:464`, `:467`, `:550`, `:557-558`, `:568-570`, bundle :425-431).<br>7. Editable Name field has no design counterpart (`:573`).<br>8. Macro grid: 48% tiles vs two equal columns with gap 8, dot gap 8 vs 7, value gap 4 vs 3, no caret, figure greys until typed, pressed opacity 0.85 vs 0.7, and no Fibre tile when the source has none vs always four, kept open as an accepted decision (`:464`, `:622-624`, `:633`, `:640`, `:646-647`, bundle :433-445, :1007).<br>9. BUILT: search and barcode foods show the meal control, log to the picked meal, and the pill names it (`:192-194`, `:246-247`, `:401-402`, `:661-676`, bundle :1020, :1031). Caption and labels BUILT, not verified: the control now uses the uppercase label caption and the compact 600 13/17 segments, as Quick add does (`:662-673`, bundle :450-457). Still open: the tapped meal is dropped on the search and barcode routes, so the control starts on the time-of-day meal vs the tapped one (`:168`, `:225`, bundle :870).<br>10. Primary pill 17/24 vs 17/22, renders 56 (16 + 16 padding + 24 line, no border) vs design 52 (`--lume-button-height: 52px`, no padding), and no "File under {meal}" wording (`:301`, `src/components/forms/Button.tsx:86`, `:101`, bundle :459, :1020).<br>11. Save to my dishes: height differs, app bordered pill renders 58 (16 + 16 padding + 24 line + 2 border, above its 52 minimum) vs design 44 (44 minimum, 20 line, no padding), plus 17/24 label vs tile fill, 600 15/20, and shown for logged rows vs scan-sourced foods that are not dishes (`:315-318`, `:679-684`, `Button.tsx:32`, `:86`, `:88`, bundle :461, :980).<br>12. Remove: height differs, app bordered pill renders 58 (16 + 16 padding + 24 line + 2 border, above its 52 minimum) vs design 44 (44 minimum, 20 line, no padding), plus trash icon and "Delete item", with a confirmation (parked), vs plain red 600 15/20 "Remove from log" with none (`:335`, `:688-707`, `Button.tsx:34`, `:86`, `:88`, bundle :467, :1034).<br>13. Toasts: "Added {name}." vs "{kcal} kcal added to {meal}", and no toast after an edit vs "Updated {name}" (`:130`, `:312`, bundle :782, :1025).<br>14. Sheet detents 0.75 and 1 vs sized to content up to 92% (`src/app/_layout.tsx:165`, bundle :383). |
| Food — Quick add | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): hero 800 56/68 with tracking -1.4, greyed while waiting for the first keystroke, and its "kcal · tap to type" and "kcal" captions, 60% pressed (`src/app/food/quick-add.tsx:136-150`, bundle :500-506, :1043-1044); 52 discs with the 20 glyph size, ±50 steps floored at 0 and fill-only press (`:106-122`, `:128`, `:152`, bundle :496-497, :1052-1053); +100/+250/+500/+750 presets adding to the figure, 44 pills, 600 15/20, gap 8 (`:51`, `:156-178`, bundle :515-517, :1054); no Label field; tap toggles the entry bar, hiding discs, presets and CTA, with a 5-digit cap (`:129-133`, `:155`, `:194`, `:205-216`, bundle :1042, :1046-1049); MEAL caption and chips 600 13/17 with white selected chip, `shadow.sm` and 44 height (`:182-190`, `src/components/forms/SegmentedField.tsx:29`, `:92-98`, bundle :523-526); confirm pill 52 high, active at 0, "Add N kcal" (`:196-201`, bundle :531, :1057); title, 20 sides and block gap 20 (`src/components/navigation/SheetContent.tsx:143`, bundle :493). All copy uses `t()`; es and fr unreviewed.<br>1. Confirm label 17/24 vs 17/22 (`src/components/forms/Button.tsx:101`, bundle :531), waiting on Isa.<br>2. Meal chip has no background transition (`SegmentedField.tsx:95-98`, bundle :526).<br>3. Meal chip labels stay on one line with no shrink, so a long label such as French "Petit-déjeuner" may cut off, not measured (`SegmentedField.tsx:107-108`).<br>4. The hero has no blinking 3×38 caret while editing (`quick-add.tsx:145-147`, bundle :502-504).<br>5. Sheet body bottom is 20 plus the safe-area inset vs 34 in total (`SheetContent.tsx:143`, `:149`, bundle :493).<br>6. The hero button has no 2 vertical padding (`quick-add.tsx:136-141`, bundle :500).<br>7. Disc glyphs are regular-weight symbols vs 2.6 strokes (`quick-add.tsx:120`, bundle :497, :510).<br>8. The figure resets to 250 each time the sheet opens vs keeping the last value (`quick-add.tsx:62`, bundle :629, :1039).<br>9. With no meal passed, the chip starts from the time of day vs the last meal used, Lunch at first (`quick-add.tsx:61`, bundle :629).<br>10. App-only: the loading spinner, error toast and offline toast (`quick-add.tsx:82`, `:95`, `:199`). |
| Food — Search | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): a separate `+` on each result logs it without opening the detail sheet, and tapping the row opens the detail sheet (`src/app/(tabs)/food.tsx:376-400`, `:1009-1027`, bundle :262, :272, :900-906).<br>1. Inline field on the Food tab whose results replace the day view, with the Add sheet tile routing to it (`food.tsx:319-325`, `:492-499`, `src/app/food/add.tsx:71`) vs an 88% sheet with a "Search foods" title and 40 close (bundle :239-248).<br>2. No filter chips, vs All, Database, Brands and My dishes (bundle :254-258, :894).<br>3. An empty query shows the day log vs the whole catalogue (`food.tsx:320`, bundle :824-825).<br>4. Field: white, radius 16, min height 52, sides 20 and no glyph vs input fill, pill, 44, sides 16 and a 17 search glyph (`src/components/forms/TextField.tsx:51-55`, `:70`, bundle :250-251). Placeholder "Search foods…" vs "Apple, banana, Indomie…" (`src/lib/i18n/locales/en.json:109`, bundle :252).<br>5. `+` logs 100 g to the time-of-day meal (`food.tsx:72`, `:375-381`) vs the food's second serving to the selected meal (bundle :904-905). A meal's `+` passes `slot`, but the tab reads only `focus`, so that meal is dropped (`add.tsx:62`, `food.tsx:201`).<br>6. Result rows: a white grouped card with hairlines vs plain rows on the sheet (`food.tsx:985-994`, bundle :262); min height 60 vs 64 (`:991`, bundle :262); no 46 thumbnail (bundle :263-267); name 400 17/24 vs 500 15/20 (`:998`, bundle :269); text gap 4 vs 1 (`:995`, bundle :268); + disc 28 vs 30 and glyph 16 vs 15 (`:1017-1025`, bundle :273-274).<br>7. No results: "No matches for …" with a custom-food button vs "Nothing found" and "Try another name, or scan the package." (`food.tsx:606-612`, `en.json:110`, `:126`, bundle :279-283).<br>8. App-only: the dietary conflict mark and hint (`food.tsx:974-997`), the Add custom food link (`:639-650`), and the loading and failed states (`:596-604`). |
| Food — My dishes / Saved | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): the "My dishes" title (`src/app/food/saved.tsx:85`, `src/lib/i18n/locales/en.json:142`, bundle :295) and tapping a dish opens the detail sheet (`saved.tsx:74-77`, bundle :913).<br>1. A single text list card (`saved.tsx:105`) vs a two-column grid of tiles, min height 172, radius 20, gap 12 (bundle :302, :311).<br>2. No "New dish" tile with a 44 camera disc and "Photo it once, reuse forever", which opens the scanner (bundle :303-309, :915).<br>3. No "N saved · tap to log again" sub-title (`saved.tsx:85`, bundle :296).<br>4. Dish content: no 96 photo area (bundle :312-314); name 400 17/24 vs 500 14/18 (`saved.tsx:135`, bundle :316); sub-line footnote with brand, grams, energy and protein vs caption "N kcal / 100 g · ×N" (`saved.tsx:138-145`, bundle :317, :913).<br>5. Sheet detents 70% and full vs a fixed 88% (`src/app/_layout.tsx:166`, bundle :291).<br>6. App-only: the search field (`saved.tsx:86-92`), the one-tap `+` on each row (`:149-166`), swipe to unsave (`:108-114`), and the loading, failed and empty states (`:94-103`). |
|  |  | Saved foods sheet title now t(food.savedTitle), design wording My dishes. Photo gallery layout not built. |
| Food — Add sheet | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4, not verified on device. The five tiles, their order and copy, the slot title wording, header layout, 12 grid gap, tile and row sizes and padding, 46/19 discs and text styles match. Still different:<br>1. Title with no tapped meal: "Add meal" vs always "Add to {meal}" (`src/app/food/add.tsx:66-68`, bundle :185, :887, :890).<br>2. Search foods lands on the food tab vs opening the search sheet (`add.tsx:70`, bundle :191, :239-244, :892).<br>3. Scan food and Barcode open separate routes vs one scanner in two modes (`add.tsx:71-72`, bundle :200, :209, :932-933).<br>4. Glyphs are SF Symbols vs the design's drawings: filled camera vs outlined, single photo vs a stacked pair, solid flame vs one with a hollow centre (`add.tsx:70-74`, `src/components/primitives/Icon.tsx:70`, `:81`, `:90`, bundle :193, :202, :211, :220, :229).<br>5. Pressed tile also fades to 0.85 vs the background change alone (`add.tsx:92-96`, `src/components/primitives/Pressable.tsx:53`, bundle :191, :227).<br>6. Close renders 44 and fades when pressed vs 40 with the background change alone (`src/components/navigation/SheetContent.tsx:73-85`, `Pressable.tsx:52-53`, bundle :186).<br>7. Space under the grid is the safe-area inset, so 0 on a phone with no inset vs a fixed 34 (`add.tsx:80`, `SheetContent.tsx:149`, bundle :190).<br>8. Grabber, corners and backdrop are the native sheet's vs the drawn 38×5 light-3 grabber, shadow and overlay (`src/app/_layout.tsx:72-75`, `:158`, bundle :181-184). |
| Food — Scan flows | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): a matched barcode opens the shared detail sheet (`src/app/food/barcode-scan.tsx:45-46`, bundle :947).<br>1. Three separate full-screen routes with no mode switch (`src/app/_layout.tsx:148-150`) vs one scanner with a Meal, Label and Barcode control (bundle :346-350, :925). The Add sheet has no way into the label route; only the barcode not-found path reaches it (`src/app/food/add.tsx:71-72`, `barcode-scan.tsx:176`).<br>2. Chrome: full-bleed camera on black, 30 white close, no title on meal or barcode, and "Scan Nutrition Label" on label (`src/app/food/photo-capture.tsx:116-124`, `barcode-scan.tsx:89-115`, `src/app/food/label-scan.tsx:284-303`) vs a white screen with a 40 grey close, a centred title and the preview in a radius 28 panel with sides of 16 (bundle :326-334, :920).<br>3. Framing: a dashed guide with a tip banner on meal and label, and a 240×150 white reticle on barcode (`src/components/food/CaptureGuidanceOverlay.tsx:1-3`, `barcode-scan.tsx:100-108`) vs four 40 corner brackets, plus a 2 red line on barcode (bundle :335-341).<br>4. Shutter: white 72 with a 4 grey border, and none on barcode, which detects on its own (`photo-capture.tsx:174-186`, `label-scan.tsx:316-327`, `barcode-scan.tsx:91-95`) vs black 74 with a 60 white ring and `shadow.md` in every mode (bundle :360-362).<br>5. No gallery, My dishes or Quick add buttons beside the shutter (bundle :353-358, :364-366, :935-937).<br>6. Meal: multi-angle flow with thumbnails, "Add a side angle" and "Use this photo" before scanning (`photo-capture.tsx:131-210`) vs one shot that closes the camera while the photo keeps analysing in the log (bundle :938-942).<br>7. Copy: "Hold the camera directly above the plate", "Point at a barcode — it scans automatically" and "Point camera at the nutrition facts panel on packaging" (`photo-capture.tsx:30`, `barcode-scan.tsx:122`, `label-scan.tsx:306`) vs "Point at your meal — Lume estimates the portion", "Line up the barcode — Lume matches it in the food database" and "Fill the frame with the nutrition facts panel" (bundle :921-923); no footer caption (bundle :370, :938-940).<br>8. Busy: a full overlay with "Looking up…" and a separate "Reading label…" state (`barcode-scan.tsx:134-151`, `label-scan.tsx:181-187`) vs a 150-high area under the preview with a 26 spinner and "Looking up the barcode…" or "Reading the label…" (bundle :372-376, :924).<br>9. Label result opens its own review form (`label-scan.tsx:194-201`) vs the shared detail sheet (bundle :947).<br>10. App-only: camera permission screens (`photo-capture.tsx:91-112`, `barcode-scan.tsx:61-83`), the Product not found fallback (`barcode-scan.tsx:154-179`), and the dev-only simulate buttons (`:124-129`). |
| Food — "Not in a meal yet" inbox | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): scan results sit in a white card with radius 28 and `shadow.sm`, above the meal cards (`src/components/food/scan/ScanReviewCard.tsx:161-164`, `src/app/(tabs)/food.tsx:503-510`, bundle :80-81, :115).<br>1. There is no "Not in a meal yet" card with a 17 AI dot and the "Analysing" or "Pick a meal to file it" note (bundle :82-86, :855). The app's card is titled "Review before saving", with a sparkles glyph and padding 20 vs 16/16/12 (`ScanReviewCard.tsx:167`, `:171`, bundle :81).<br>2. A photo still analysing is a row inside its meal card with "Analysing" and skeleton bars (`food.tsx:899-910`) vs an inbox row with a 46 tile and 20 spinner, "Meal photo" or "Photo from library", AI-coloured "Analysing photo" and a pulsing "Analysing" pill (bundle :88-105, :765, :856-862).<br>3. A finished scan shows a weight slider, ½×, 1× and 2× buttons, a typical-portion line and a confidence badge (`ScanReviewCard.tsx:256-306`) vs a plain row with a photo tile, name, AI-coloured "Looks like lunch" and kcal (bundle :89-109, :862).<br>4. Items are confirmed together with Discard and "Save all items", and the review detail sheet edits the name only, so no meal is picked per item (`ScanReviewCard.tsx:137-140`, `:311-318`) vs tapping a row to open the detail sheet and filing it with "File under lunch" (bundle :88, :744, :1020, :1024).<br>5. Toasts: "Scanning your meal…" (`src/app/food/photo-capture.tsx:49`) vs "Analysing photo · saved to lunch" and "… — confirm the meal" (bundle :761, :775).<br>6. App-only: angle-disagreement and agreement lines, the usual-portion prompt (`ScanReviewCard.tsx:175-222`), the "Couldn't analyse this photo" card (`src/components/food/scan/ScanFailedCard.tsx:35`) and the scan feedback prompt (`food.tsx:500-502`). |
| Food — number-entry convention | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): the bar itself, gap 12, top 12, sides 20, alt background and hairline, label style with 1.1 tracking and gap 2, 26 rounded 600 figure, "0" placeholder, and 36 Done pill with 14/18 text (`src/components/common/NumberEntryBar.tsx:52-73`, `:82-90`, `:98-107`, bundle :472-477, :535-540); it docks on the two Food surfaces the design gives it (`src/app/food/detail.tsx:713`, `src/app/food/quick-add.tsx:206`, bundle :471, :534); the six labels and the numeric or decimal mode per field (`detail.tsx:65-66`, `src/lib/i18n/locales/en.json:168-173`, bundle :808, :985).<br>1. Bottom padding is the safe-area inset, falling back to 34, vs a fixed 34 (`NumberEntryBar.tsx:60`, bundle :472). The input sets a 32 min height with no line height vs 26/32 (`:86-88`, bundle :475).<br>2. A weight slider appears where the design has none: the bundle has no range control (`src/components/food/scan/ScanReviewCard.tsx:256`).<br>3. No counterpart in this bundle, and each uses a boxed field or a stepper rather than the bar: `src/app/food/custom-food.tsx:56-76`, `src/app/food/label-scan.tsx:209-222`, including a stepper, and `src/app/food/new-recipe.tsx:135`, `:243`, including a stepper. |
| Profile — Settings root | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: name as an uppercase `label` eyebrow with 1.1 tracking over "Settings" in `title-1` (`src/app/profile/index.tsx:111-117`, bundle :31-32); 16 page sides (`index.tsx:96`, bundle :28); Account, App and About group titles, 16 title inset and 8 gap to the rows (`src/components/display/SettingsList.tsx:167`, bundle :35-36); 28 chips, with glyph tints for Subscription, Goals, Scan accuracy, AI insights and Connected apps (`index.tsx:145-161`, `SettingsList.tsx:20`, `:79`, bundle :696-711); the other row labels in the design; pressed fill `light-1` (`SettingsList.tsx:133`, bundle :39).<br>Differences:<br>1. Group layout: one white card at radius 28 with a shadow and inset hairlines (`SettingsList.tsx:49-57`, `:174-175`) vs separate white rows at radius 14 with a 4 gap and no shadow (bundle :37-39).<br>2. Trailing values: none passed (`index.tsx:144-161`) vs Pro or Free, Lume or Custom, 92%, 3 new, Imperial or Metric, and a connection count or None (bundle :44, :60, :696-710).<br>3. App-only blocks: the 84 avatar (`index.tsx:120-122`), the Streak card (`:125-130`), the streak stats card (`:133-139`) and `LoadFailedNotice` (`:104`).<br>4. App-only rows: Terms of Service and Privacy Policy (`index.tsx:168-169`), and a fourth group with Sign out and "Delete my account" (`:174-184`); the design's About group is Privacy, Support and About (bundle :713-720), and its Delete account sits inside Account (bundle :128).<br>5. Account order: Restore is third (`index.tsx:146`) vs last (bundle :704).<br>6. Restore copy: "Restore Purchases" (`src/lib/i18n/locales/en.json:40`) vs "Restore purchases" (bundle :704).<br>7. Chips: `light-1` on every row, radius 10 (`SettingsList.tsx:73-74`), vs a 14–16% tint of the row's colour on tinted rows, radius 8 (bundle :40, :631, :696-711).<br>8. Glyphs: 17 SF Symbols (`SettingsList.tsx:79`) vs 15 drawn paths with a 1.8 stroke (bundle :41). Support is a question mark (`index.tsx:170`) vs an envelope (bundle :717). The chevron is a 14 SF Symbol (`SettingsList.tsx:113`) vs an 8×14 path with a 2 stroke (bundle :45).<br>9. Row type: 17/24 (`SettingsList.tsx:92`) vs 400 16/21 (bundle :43).<br>10. Row size: 52 minimum height, 16 side padding and a 12 gap (`SettingsList.tsx:62-65`) vs 48, 12 and 11 (bundle :39).<br>11. Group title type: 600 13/16 with 1 tracking (`SettingsList.tsx:165-167`) vs 600 12/16 with 0.7 (bundle :36).<br>12. Group gap: 26 BUILT, device check pending, a literal on the hand-rolled scroll content (`index.tsx:97`, bundle :28). The avatar and streak cards are app-only and share it, with 34 below the avatar (`index.tsx:120`).<br>13. Title block: gap 2, bottom padding 0, side padding `space.xs` (4) and title tracking -0.6 BUILT (device check pending) (`index.tsx:109`, `:115`, bundle :30, :32). The eyebrow is omitted with no name (`index.tsx:110`).<br>14. Page padding: top `insets.top` + 56, so 103, 115 and 118 at insets of 47, 59 and 62 (`index.tsx:95`), vs a fixed 96; bottom 48 plus the bottom inset (`:98`) vs 48 (bundle :28).<br>15. Header strip: `insets.top` + 20 (`index.tsx:186`) vs a fixed 84 (bundle :579).<br>16. Back button: 44 at `insets.top` + 4, left 16 (`index.tsx:189-190`), vs 38 at top 50, left 14 (bundle :581).<br>17. Pressed rows also fade to 0.85 (`src/components/primitives/Pressable.tsx:53`) vs fill change only (bundle :39). |
| Profile — Account | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: "Your details" eyebrow, "Account" title, 16 page sides (`src/app/profile/account.tsx:49-50`, `src/components/navigation/Screen.tsx:92`, bundle :87, :90-91); elevated card with padding 20 (`account.tsx:57`, bundle :94); "Display name" label copy (`account.tsx:68`, bundle :111); the pill is disabled when the name is unchanged (`account.tsx:28`, `:52`, bundle :674, :729).<br>Differences:<br>1. Identity card: an 84 avatar over a centred `statMedium` 28/36 name (`account.tsx:58-64`) vs a left-aligned rounded 600 26/32 name with -0.4 tracking and no avatar (bundle :95-96).<br>2. Email: a separate Settings row with a mail chip and "Email" label (`account.tsx:70`) vs 400 14/19 secondary text under the name in the card (bundle :97).<br>3. Stats: missing vs a hairline and "Member since", "Days logged" and "Plan" (bundle :99-107, :722-726).<br>4. Display name input: 1 bordered box at radius 16, 52 height, 20 side padding and 17 text (`src/components/forms/TextField.tsx:51-56`, `:70`) vs no border, radius 14, 50 height, 14 side padding and 400 16/21 (bundle :112).<br>5. Input label: footnote in `gray700`, with the field's own spacing (`src/components/forms/FieldShell.tsx:28`) vs 400 13/18 secondary with a 4 inset and a 7 gap (bundle :110-111).<br>6. Helper: missing vs "Shown on your streaks and weekly recaps." (bundle :113).<br>7. Sign-in method row: missing vs an Apple chip, "Sign-in method" and "Apple", with no chevron, that shows a toast when tapped (bundle :117-123, :730).<br>8. Delete row: "Delete Account" (`account.tsx:76`) vs "Delete account" (bundle :128); `accent.red` text and glyph on a `light-1` chip at radius 10 (`src/components/display/SettingsList.tsx:42`, `:73-74`, `:79`) vs a darker red and orange mix on a 12% tint at radius 8 (bundle :125-128, :641, :680).<br>9. Row grouping: two separate cards at radius 28 with shadows (`account.tsx:70-81`, `SettingsList.tsx:174`) vs radius 14 rows with no shadow (bundle :116-117, :124; code re-checked, device check pending); wrapper gap 4 BUILT, device check pending (`account.tsx:69`, bundle :116); 52 row height, 16 padding and 17/24 label (`SettingsList.tsx:62-65`, `:92`) vs 48, 12 and 16/21.<br>10. Save pill: "Save" (`account.tsx:52`) vs "Save changes" (bundle :135); clean state is black at 0.4 opacity (`src/components/primitives/Pressable.tsx:53`) vs `gray-400` (bundle :728); 17/24 label (`src/components/forms/Button.tsx:101`) vs 16/21 (bundle :135); 56 rendered height from padding (`Button.tsx:86`) vs 52 (bundle :134).<br>11. Footer padding: 16 top and 16 plus the bottom inset (`Screen.tsx:142-143`) vs 12 top and 30 bottom (bundle :133).<br>12. Screen gap: 20 BUILT, device check pending (`account.tsx:51`, bundle :87).<br>13. Title block: gap 2, bottom padding 0, side padding `space.xs` (4) and title tracking -0.6 BUILT (device check pending) (`Screen.tsx:117`, `:127`, bundle :89, :91).<br>14. Top padding: `insets.top` + 56, so 103, 115 and 118 at insets of 47, 59 and 62 (`Screen.tsx:91`), vs a fixed 96 (bundle :87).<br>15. Save toast: "Name updated." or "Saved on this device — could not reach the server." (`account.tsx:38`, `:40`) vs "Display name updated" (bundle :729). |
| Profile — Subscription | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: "Billing" eyebrow and "Subscription" title (`src/app/profile/subscription.tsx:95-96`, bundle :168-169); page sides 16 and footer-screen bottom 32 (`src/components/navigation/Screen.tsx:76`, `:92`, bundle :165); top card radius 28 and padding 20 (`src/components/display/Card.tsx:35`, `:47`, bundle :172); "Lume Pro" and "Active" copy (`subscription.tsx:120`, `:123`, bundle :174, :734); footnote 400 13/18 in secondary label #6B6B6B (`subscription.tsx:136`, `:145`, `src/lib/design/tokens.ts:65`, `:152`, bundle :222).<br>Differences:<br>1. Top card fill: white with `shadow.sm` (`subscription.tsx:116`, `Card.tsx:35`) vs a 150° purple-to-ocean gradient with no shadow (bundle :172, :733; code re-checked, not verified on device).<br>2. Top card content: no price, cadence, hairline, Renews row or Payment row (`subscription.tsx:117-132`) vs bundle :177-191. The app's `CustomerInfo` type holds only active entitlements (`src/lib/billing/purchases.ts:27`, `subscription.tsx:113-115`). The design values are literals (bundle :189, :735-737).<br>3. Usage card: absent vs "This billing period" with Photo scans, AI insights and Workouts synced, each with a 6 bar (bundle :194-207, :738-742).<br>4. Billing rows: absent vs Change plan, Payment method and Billing history (bundle :209-220, :743-750).<br>5. Sticky footer buttons are app-only: Manage subscription or See plans, then Restore Purchases (`subscription.tsx:98-111`). The design has no footer here and has Restore on the Settings root only (bundle :704); the app has Restore in both places (`src/app/profile/index.tsx:146`).<br>6. Action targets: RevenueCat paywall and the App Store subscriptions page (`subscription.tsx:21`, `:71`, `:104`) vs toasts naming Superwall and Stripe (bundle :745, :747, :749).<br>7. App-only copy: the status paragraph (`subscription.tsx:127-131`), the billing-disabled note (`:135-143`) and the billing-disabled, purchase and store-error toasts (`:32-37`, `:49`, `:60-65`, `:75-85`).<br>8. Restore toasts: "Subscription restored." and "No purchases to restore." (`subscription.tsx:44`) vs "Lume Pro restored" and "No purchases to restore" (bundle :705).<br>9. Status states: "Checking…" is app-only and not entitled reads "Not subscribed" (`subscription.tsx:123`) vs "Active" or "Free" (bundle :734). The 13 status icon is app-only (`subscription.tsx:124`, `src/components/display/Badge.tsx:37`).<br>10. Status pill: `light-1` fill, vertical padding 4, side padding 12, 600 13/16 sentence case in `label` (`Badge.tsx:29-32`, `:38`) vs white at 22%, 5, 11, 600 12/16 uppercase with 0.4 tracking in white (bundle :175).<br>11. "Lume Pro" type: 600 19/25 in `label` (`subscription.tsx:119`, `tokens.ts:143`) vs 700 19/24 in white (bundle :174).<br>12. Top card gaps: 12 between blocks and 12 in the title row (`subscription.tsx:117-118`) vs 16 and 8 (bundle :172-173).<br>13. Screen gap: 20 BUILT, device check pending (`subscription.tsx:97`, bundle :165).<br>14. Footnote: different copy (`subscription.tsx:146-147`) vs "Change or cancel any time. Access lasts until the end of the paid period."; side padding 0 vs 4; no `text-wrap: pretty` equivalent (bundle :222).<br>Top padding, title block and back button are in the "Profile — shared chrome" row. |
| Profile — Goals | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: "Daily targets" eyebrow and "Goals" title (`src/app/profile/goals.tsx:94`, `src/lib/i18n/locales/en.json:63`, bundle :233-234); targets card radius 28, padding 20 and gap 16 (`goals.tsx:113`, `src/components/display/Card.tsx:35`, `:47`, bundle :252); calorie figure 800 40/50 rounded, width 126, padding 0, tracking -1, `label` when editable and secondary label when read-only (`goals.tsx:135-140`, `src/lib/design/tokens.ts:160`, bundle :258, :774); suffix colour and 400 15 size (`goals.tsx:144`, `tokens.ts:149`, bundle :259); hint colour #8A8A8A and "Set by Lume" / "Tap to edit" copy (`goals.tsx:124-125`, `en.json:80-81`, bundle :255, :770); 1 divider in #E5E5EA (`goals.tsx:150`, `tokens.ts:22`, `:120`, bundle :261); "Grams" and "Percent" copy, unselected label colour (`en.json:71-72`, `src/components/forms/SegmentedField.tsx:106`, bundle :266, :269, :635); macro row gap 12 (`goals.tsx:169`, bundle :273); custom-mode help line copy, type and position below the card (`goals.tsx:196-200`, `en.json:82`, bundle :289, :773).<br>Differences:<br>1. Mode choice: a segmented control labelled "Targets" (`goals.tsx:95-104`, `en.json:64`) vs two white radio cards at radius 20, padding 16, gap 12, with 8 between them (bundle :237-239). Each design card has a 32 tinted chip at radius 10 with a 17 drawn glyph, a 600 16/21 name, a 400 13/18 description, a 2 #000000 ring when selected and a 20 radio dot with a tick (bundle :240-247, :752-769); all are absent.<br>2. Mode copy: "Use AI recommendation" and "Set my own" (`en.json:65-66`) vs "Lume sets my targets" and "I set my own", with descriptions "1,660 kcal, from your onboarding answers and recent logs." and "Type your calorie and macro numbers. Nothing is adjusted for you." (bundle :753, :761).<br>3. Lume-mode help line: "Your targets are computed from onboarding. Switch to set your own." above the card (`goals.tsx:105-109`, `en.json:67`) vs "Lume recalculates these every Sunday from your weight trend and logged training." below the card (bundle :289, :772).<br>4. Targets card shadow: `shadow.sm` (`Card.tsx:35`) vs none (bundle :252).<br>5. Calorie label: "Daily calorie target", 600 13/16 with 1 tracking (`goals.tsx:121`, `en.json:68`, `tokens.ts:153`) vs "Daily calories", 600 12/16 with 0.7 (bundle :254).<br>6. Edit hint type: 500 11/14 (`goals.tsx:124`, `tokens.ts:154`) vs 400 12/16 (bundle :255).<br>7. Calorie block spacing: label row to figure 4 (`goals.tsx:117`) vs 16 (bundle :252); figure to suffix 8 (`goals.tsx:128`) vs 7 (bundle :257); suffix line height 21 (`tokens.ts:149`) vs 20 (bundle :259).<br>8. Range line: BUILT (not verified): the app-only "Between 1,200 and 10,000 kcal." line is removed, because the design has none (`goals.tsx:117-148`, bundle :257-261).<br>9. Split control layout: "Set by" above a full-width control (`goals.tsx:152-162`, `en.json:70`) vs "Macros shown in" at 400 14/19 on the left with the control on the right (bundle :262-264).<br>10. Split control look: `light-2` #E5E5EA track, padding and gap 4, segments at flex 1 rendering at 48, from a 24 line and 12 vertical padding, selected white with `shadow.sm` and #171717 text, label 500 17/24 (`SegmentedField.tsx:62-65`, `:85-93`, `:97`, `:105-106`, `tokens.ts:147`) vs `light-1` #F2F2F7 track, padding and gap 3, segments at 32 with side padding 16, selected #000000 with white text and no shadow, label 600 14/19 (bundle :264-269, :634-635).<br>11. Split control state: disabled in Lume mode (`goals.tsx:157`) vs tappable in both modes (bundle :778-779). It selects which fields can be typed in (`goals.tsx:176`, `:185`) vs which value the rows show (bundle :780).<br>12. Macro rows: two `TextField`s per macro, six in total, labelled "Protein (g)", "Protein (%)" and so on (`goals.tsx:170-191`) vs three read-only rows in both modes, each with an 8 category-coloured dot, a 400 14/19 name, a 700 20/26 rounded value with its unit and a 6 category-coloured bar on `light-2` (bundle :274-285, :657-661, :780).<br>13. "Macro targets" label is app-only (`goals.tsx:164-166`, `en.json:69`).<br>14. Calorie edits commit when editing ends (`goals.tsx:65-71`), under a line that reads "Saved as you type", vs on every keystroke (bundle :776).<br>15. Help line: side padding 0 (`goals.tsx:197`) vs 4, and no `text-wrap: pretty` equivalent (bundle :289).<br>16. Other app-only blocks: the macro reconciliation hint (`goals.tsx:210-217`), the "Goals updated." toast on reset (`:226`, `en.json:79`) and `HealthDisclaimer`, added for guideline 1.4.1 (`goals.tsx:230-231`).<br>17. Screen gap: 20 BUILT, device check pending (`goals.tsx:94`, bundle :230).<br>Kept by default, not listed as gaps: Fibre (`goals.tsx:202-208`), Reset to AI (`:219-228`) and kcal/kJ (`:130`, `:145`).<br>Top padding, title block, bottom padding and back button are in the "Profile — shared chrome" row. |
| Profile — Scan accuracy | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: "Scan accuracy" title (`src/app/profile/scan-calibration.tsx:60`, bundle :301); top card white at radius 28 with `shadow.sm` and padding 20 (`scan-calibration.tsx:99`, `src/components/display/Card.tsx:35`, `:47`, `src/lib/design/tokens.ts:241-247`, bundle :304); score track #E5E5EA and fill #67CE67 (`scan-calibration.tsx:103`, `tokens.ts:22`, `:82`, `:101`, bundle :307-308); tile row gap 8 and tile padding 16 (`scan-calibration.tsx:111-112`, bundle :320, :322); tile values 700 20/26 rounded, with "You corrected" in #EC6330 (`scan-calibration.tsx:120`, `src/components/display/Stat.tsx:31`, `tokens.ts:78`, `:162`, bundle :323, :784); "Scans logged" and "You corrected" copy at 500 11/14 in #6B6B6B (`scan-calibration.tsx:113`, `:118`, `Stat.tsx:35-36`, `tokens.ts:33`, `:154`, bundle :324, :783-784).<br>Differences:<br>1. Eyebrow: "Your scans" (`scan-calibration.tsx:60`) vs "Last 30 days" (bundle :300).<br>2. Score indicator: a full-width bar 8 tall (`scan-calibration.tsx:103`, `src/components/display/ProgressBar.tsx:19`) vs a 96 ring at radius 40 with stroke 9 and a round cap (bundle :305-309). `react-native-svg` is installed (`package.json:36`).<br>3. Top card layout: a column with gap 16 (`scan-calibration.tsx:100`) vs a row with gap 20 (bundle :304).<br>4. Score figure: 800 40/50 with no tracking, above the bar (`scan-calibration.tsx:102`, `tokens.ts:160`) vs 700 28/36 with -0.6 tracking, centred in the ring (bundle :310-311).<br>5. Headline and sentence: absent vs "Getting sharper" at 600 16/21 and "Up 7 points since August. You corrected 11 of 138 scans." at 400 13/18, gap 6 (bundle :314-316). `UI_PASS_GAPS.md:58` records no time series for the trend; the corrected and total counts are in the API type (`src/lib/api.ts:552-553`).<br>6. App-only in the top card: a `CardHeaderRow` "Accuracy score" with a 17 camera glyph (`scan-calibration.tsx:101`, `src/components/display/CardHeaderRow.tsx:34-35`) and the footnote "Lume is learning your portions" (`scan-calibration.tsx:104-106`).<br>7. Third tile: "Of your scans", a corrected percentage (`scan-calibration.tsx:89`, `:124`) vs "Avg kcal off" with ±64 (bundle :785). The API type has no kcal average (`api.ts:551-557`).<br>8. Tile cards: radius 28 with `shadow.sm` (`scan-calibration.tsx:112`, `Card.tsx:35`) vs radius 20 with no shadow (bundle :322; code re-checked, not verified on device).<br>9. First and third tile values: #000000 (`Stat.tsx:24`, `tokens.ts:24`) vs #171717 (bundle :783, :785).<br>10. Tile labels: uppercase with 1 tracking (`Stat.tsx:37`) vs sentence case with no tracking and `text-wrap: pretty` (bundle :324); value-to-label gap 4 (`Stat.tsx:30`) vs 2 (bundle :322).<br>11. "Recent corrections" list: absent vs a title at 600 12/16 with 0.7 tracking and left padding 16, then four rows at radius 14, min height 56, padding 10/14, gap 4, each with name, time, a struck-through old value in #8A8A8A and a 600 new value (bundle :329-344, :787-792). `UI_PASS_GAPS.md:58` records no read route for corrections.<br>12. Closing footnote "Every correction teaches Lume your portion sizes.": absent (bundle :345).<br>13. App-only sections: "Foods we've learned" and "Most corrected" (`scan-calibration.tsx:128-168`).<br>14. App-only states: three loading skeletons (`scan-calibration.tsx:61-66`) and the "No scans yet" empty state (`:79-87`).<br>15. Screen gap: 20 BUILT, device check pending (`scan-calibration.tsx:60`, bundle :297).<br>Top padding, title block, bottom padding and back button are in the "Profile — shared chrome" row. |
| Profile — AI insights | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device. The screen is `src/app/insights.tsx`, opened from the root row (`src/app/profile/index.tsx:149`).<br>Matches: white insight cards with an 8 inner gap (`src/components/ai/InsightCard.tsx:88-89`, bundle :363); insight title colour #171717 (`InsightCard.tsx:92`, bundle :368).<br>Differences:<br>1. Eyebrow and title: "Your patterns" and "Insights" (`src/app/insights.tsx:37`, `:58`) vs "Updated today" and "AI insights" (bundle :357-358). The root row that opens the screen reads "AI insights" (`src/lib/i18n/locales/en.json:41`).<br>2. Insight cards: radius 28, padding 20, `shadow.sm` (`InsightCard.tsx:88`, `src/components/display/Card.tsx:35`, `:47`) vs radius 20, padding 16, no shadow (bundle :363).<br>3. Insight glyph: a bare 17 sparkle in #B25FEA on every card (`InsightCard.tsx:91`) vs a 26 chip at radius 8 tinted 16% with a 14 drawn glyph at stroke 1.9, in a colour per insight (bundle :365-366, :795-803).<br>4. Insight header: gap 8 (`InsightCard.tsx:90`) vs 9 (bundle :364); title 500 17/24 on one line (`InsightCard.tsx:92`, `src/lib/design/tokens.ts:147`) vs 600 16/21 with no line limit (bundle :368).<br>5. Timestamp: absent vs 400 12/16 in #8A8A8A, for example "2 d ago" (bundle :369, :795). `AIInsight` has `created_at` (`src/lib/api.ts:981`).<br>6. Insight body: 400 15/21 in #6B6B6B, limited to 3 lines (`InsightCard.tsx:100`, `tokens.ts:149`) vs 400 14/20 in #171717 with no limit and `text-wrap: pretty` (bundle :371).<br>7. Insight controls are app-only: dismiss (`InsightCard.tsx:95-97`), more/less (`:104-117`) and a type badge (`:119`).<br>8. Card list gap: 8 BUILT, device check pending (`insights.tsx:99`, bundle :361). The loading skeleton wrapper is app-only at 12 (`insights.tsx:79`).<br>9. "Weekly insight push" row with a 51×31 switch, on by default: absent (bundle :376-384, :607, :806-807). The stored notification settings have `aiNudges` and `weeklyRecap` but no weekly insight setting (`src/lib/settings/store.ts:34-42`).<br>10. App-only blocks: `BrainProfileCard` (`insights.tsx:59`), which has its own "Ask Lume" link (`src/components/ai/BrainProfileCard.tsx:109-122`); a second "Ask Lume" card (`insights.tsx:62-75`); and `AnomalyCard` in the feed (`:109-113`).<br>11. Feed content: API insights and anomalies, newest first (`insights.tsx:50-53`), vs three fixed insights (bundle :794-804).<br>12. App-only states: the AI consent gate, with an empty body while it resolves (`insights.tsx:27-43`); loading skeletons (`:78-83`); two empty states (`:84-97`).<br>13. App-only motion: staggered fade-in and collapse on dismiss (`InsightCard.tsx:39-66`).<br>14. Screen gap: 20 BUILT, device check pending (`insights.tsx:58`, bundle :354).<br>Top padding, title block, bottom padding and back button are in the "Profile — shared chrome" row. |
| Profile — Delete account | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: "Are you sure?" copy and 700 22/28 type (`src/app/profile/delete-account.tsx:113-115`, `src/lib/design/tokens.ts:142`, bundle :149); black warning triangle (`delete-account.tsx:166`, `tokens.ts:67`, bundle :145); body copy and colour (`delete-account.tsx:116-119`, bundle :150); scroll content sides 24 and bottom 32 (`delete-account.tsx:21`, `:81`, `src/components/navigation/Screen.tsx:76`, bundle :143).<br>Items, each with a status: BUILT matches the design in code, not verified on device; OPEN differs and is not owner-blocked; OWNER needs a device check or an Isa decision, or is parked.<br>1. OWNER, removing the two extra steps removes part of a feature. Flow: three steps, the confirm, then what will be deleted with a subscription warning, then a typed "DELETE" (`delete-account.tsx:110-157`), vs one confirm screen (bundle :143-150). Back steps through the flow (`delete-account.tsx:43-49`).<br>2. BUILT (not verified). Title block: the confirm step shows no eyebrow or title, matching the design; the two later steps keep them (`delete-account.tsx:78-79`, `src/components/navigation/Screen.tsx:116-131`, bundle :143-150).<br>3. BUILT. Warning icon: size 42 and the design's drawn triangle, white stroke 1.9 and dot, replacing the system symbol, BUILT, not verified (`delete-account.tsx:112`, `:162-171`, bundle :144-148).<br>4. BUILT (not verified). Confirm block spacing: gap 14 and no vertical padding of its own, matching the design (`delete-account.tsx:111`, bundle :143).<br>5. BUILT (not verified). Body type: size and line height set to the design's 400 16/22 (`delete-account.tsx:116`, bundle :150). Known difference: no `text-wrap: pretty` equivalent.<br>6. OWNER, fill and border BUILT. Delete button look: final step fill white and no visible border BUILT, not verified, the 1 border stays in white so the rendered height keeps 58 (`delete-account.tsx:95-96`, `src/components/forms/Button.tsx:34`, bundle :153). Weight 600 and pill radius match. Still DIFFERENT, as no token equals the danger colour and `Button.tsx` has no label colour or pressed style prop: label `accent.red` vs a `color-mix` danger colour (`Button.tsx:44`, bundle :154, :641); pressed opacity 0.85 vs a `light-1` fill (`src/components/primitives/Pressable.tsx:53`, bundle :153); label size 17/24 vs 16/21, tied to height (`Button.tsx:101`, bundle :154). The `destructive` variant is shared with the Food detail remove button (`src/app/food/detail.tsx:690`), which the design draws as text only in `accent-red` (Food bundle 71f71ac4 :467).<br>7. OWNER, height parked. Delete button size: 58 calculated, not measured on a device, from a 24 line, 16 vertical padding and the border, label 600 17/24 (`Button.tsx:86`, `:101`, `tokens.ts:148`) vs 52, label 600 16/21 (bundle :153-154).<br>8. BUILT for the final label; OWNER with item 1 for the other two. Button copy: final step "Delete account" BUILT, not verified (`delete-account.tsx:90`, bundle :154); "Continue" and "I understand, continue" remain, as those steps do not delete and have no design counterpart (`:85`, `:87`). The final button's look is covered by item 6; height parked.<br>9. OWNER, copy, fill, border, height and gap BUILT. Cancel: "Cancel" label, no fill and no border BUILT, not verified (`delete-account.tsx:99-106`, `Button.tsx:33`, bundle :156-157). Height 48 and the 6 gap below the delete button match the design, BUILT, calculated, not measured on a device: height from the 24 label line, 12 padding above and below and no border (`delete-account.tsx:105`, `tokens.ts:148`, bundle :156); gap `space.md / 2` (`delete-account.tsx:83`, `tokens.ts:210`, bundle :152). It shows on all three steps and leaves the flow from any of them (`delete-account.tsx:45`, `:70-73`). Still DIFFERENT: label black 600 17/24 vs secondary label 500 16/21, pressed opacity 0.85 vs 0.5, as `Button.tsx` has no label colour or pressed style prop (`Button.tsx:40`, `:101`, `src/components/primitives/Pressable.tsx:53`, bundle :156-157).<br>10. OWNER, sides BUILT, top and bottom parked. Footer bar: sides 16 BUILT, not verified (`Screen.tsx:141`, bundle :152); top 16 and bottom 16 + `insets.bottom` (`Screen.tsx:142-143`) vs 12 and 30 (bundle :152).<br>Item 10 gate: tsc --noEmit exit 0; jest --ci 65 suites, 824 tests, 4 snapshots passed (round 221 gate). Footer sides are 16 (`src/components/navigation/Screen.tsx:141`). No test checks the footer sides, so item 10 stays BUILT, not verified. Footer top 16 vs design 12 and bottom 16 + `insets.bottom` vs design 30 still differ (`Screen.tsx:142-143`). Nothing is verified on a device.<br>11. Action: a real server delete (`delete-account.tsx:55-68`) vs a toast, "Account deletion is disabled in this build" (bundle :731).<br>Top padding, screen gap and back button are in the "Profile — shared chrome" row. |
| Profile — Connected apps | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device. The screen is `src/app/profile/integrations.tsx`, opened from the root row (`src/app/profile/index.tsx:161`).<br>Matches: "Connected apps" title (`integrations.tsx:163`, bundle :436); "Nothing connected" and "N of M connected" eyebrow wording (`integrations.tsx:111-112`, bundle :818); white cards with a 12 inner gap (`integrations.tsx:179-180`, bundle :441); Strava and WHOOP names and descriptions (`integrations.tsx:35-37`, `:43-45`, bundle :667-669); status text 400 13/18, #67CE67 when connected and #6B6B6B otherwise (`integrations.tsx:192-193`, `src/lib/design/tokens.ts:82`, `:152`, bundle :448, :824).<br>Gaps: BUILT (code): gap 20 (`integrations.tsx:163`, bundle :432); card wrapper gap 8 also BUILT (code) (`integrations.tsx:167`, bundle :439).<br>Differences:<br>1. Apple Health: absent (`integrations.tsx:32-49`) vs a first provider, connected by default, with "Two-way sync for workouts, weight and steps." (bundle :608, :664-666). The eyebrow therefore counts of 2 (`integrations.tsx:112`) vs of 3 (bundle :818). `UI_PASS_GAPS.md:59` records that the app cannot connect to it.<br>2. App-only copy: the "Sync" eyebrow while loading (`integrations.tsx:109`) and the line "Link a fitness app to import workouts automatically." (`:164-166`).<br>3. Cards: radius 28, padding 20, `shadow.sm` (`integrations.tsx:179`, `src/components/display/Card.tsx:35`, `:47`) vs radius 20, padding 16, no shadow (bundle :441).<br>4. Glyphs: BUILT (device check pending): the emoji is replaced by the design's 34 chip at `radius.sm`, tinted 14% on white via `mixHex`, holding the 19 drawn glyph at stroke 1.9 in `accent.orange` (Strava) or `color.label` (WHOOP) (`integrations.tsx:40-41`, `:49-51`, `:68-71`, `:197-216`, bundle :443-444, :664-670, :822).<br>5. Provider row: gap BUILT (device check pending): `PROVIDER_ROW_GAP` 11 replaces `space.md` 12, as in the design (`integrations.tsx:54`, `:181`, bundle :442). Name-to-status gap: BUILT (device check pending): 1 replaces `space.xs` 4, as in the design (`:183`, bundle :446).<br>6. Provider name: BUILT (device check pending): `bodyBold` with `PROVIDER_NAME_SIZE` 16 and `PROVIDER_NAME_LINE_HEIGHT` 21 × font scale replaces `title3` 600 19/25, so the name is 600 16/21, as in the design (`integrations.tsx:55-56`, `:184-188`, bundle :447).<br>7. Action placement: full-width buttons in their own row below the provider row (`integrations.tsx:202-213`) vs one pill inline at the right of the provider row (bundle :450-451).<br>8. Action size: 56 tall with 28 side padding and a 600 17/24 label (`src/components/forms/Button.tsx:86-88`, `:101`, `tokens.ts:148`, `:213`) vs 34 tall with 16 side padding and a 600 14/19 label (bundle :450-451).<br>9. Action copy and look: "Connect Strava" and "Connect WHOOP" (`integrations.tsx:212`) vs "Connect" (bundle :827). "Disconnect" is text-only in #000000 (`integrations.tsx:208`, `Button.tsx:33`, `:40`) vs a #F2F2F7 fill with #171717 text (bundle :825-826). Pressed opacity 0.85 (`src/components/primitives/Pressable.tsx:53`) vs 0.8 (bundle :450).<br>10. "Sync now" is app-only (`integrations.tsx:205`).<br>11. Status and description: disconnected, the description replaces the status, so "Not connected" never shows; connected, the description is hidden (`integrations.tsx:195-197`). The design always shows a status line and a separate description at 400 13/19 (bundle :448, :454, :823).<br>12. Connected wording: "Connected · synced 2h ago" (`integrations.tsx:196`, `:59-67`) vs "Synced 2 h ago" (bundle :668).<br>13. Connect behaviour: an OAuth browser session (`integrations.tsx:117`, `:122`) vs an immediate toggle (bundle :828-831).<br>14. Toasts: none on a successful connect (`integrations.tsx:123`) vs "Strava connected" (bundle :831); "Strava disconnected." with a full stop (`integrations.tsx:153`) vs none (bundle :831); not-available, sync-result and failure toasts are app-only (`:127`, `:129`, `:140`, `:143`, `:156`).<br>15. App-only states: loading skeletons (`integrations.tsx:168-172`) and busy buttons (`:177`, `:205`, `:208`, `:212`).<br>Top padding, title block, bottom padding and back button are in the "Profile — shared chrome" row. |
| Summary — Macros detail | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Summary bundle 185bb533 (bundle line numbers below), not verified on device.<br>Matches: kicker, title, stat unit and sub-line copy, and the kicker colour (`src/app/dashboard/nutrition.tsx:77`, `:86-87`, bundle :541-543, :677); card gap 16 and sides 16 (`nutrition.tsx:76`, `src/components/navigation/Screen.tsx:92`, bundle :225); secondary title, note and readout copy (`nutrition.tsx:107`, `:120`, bundle :688, :695); Breakdown title, row copy, colours and 8 bar (`nutrition.tsx:61-64`, `:131`, `:138-140`, `src/components/display/ProgressBar.tsx:19`, bundle :323, :335, :487-491, :545); footer copy, colour and side padding 4 (`nutrition.tsx:191-193`, bundle :340, :544).<br>Differences:<br>1. PARKED — needs a food-store data model change before a 7-day stacked chart is possible: hero chart shows "Calories today" with today's date over a calorie ring (`nutrition.tsx:101`, `:110`) vs "Where the calories came from", "This week", a 176 7-day stacked chart and a caption (bundle :248, :287, :678-687). The food store holds today only (`nutrition.tsx:5-9`).<br>2. Hero header: BUILT (not verified on device): the Macros hero header uses the new `ChartHeader` `hero` option, so a 500 14/18 title centred on its range, grouped with the chart at `space.sm` 8 instead of 500 17/24, baseline and 16 above it. Energy hero header BUILT (not verified on device): the Energy hero `ChartHeader` passes `hero` too, so its title is 500 14/18 and centred instead of 500 17/24 and baseline; it was already 8 above the chart. Workouts hero header BUILT (not verified on device): the Workouts hero `ChartHeader` passes `hero` the same way. This week hero header BUILT (not verified on device): the This week hero `ChartHeader` passes `hero` the same way (`src/app/dashboard/nutrition.tsx`, `src/app/energy.tsx`, `src/app/dashboard/training.tsx`, `src/app/dashboard/week.tsx`, `src/components/display/DetailChart.tsx` `ChartHeader`, bundle :243-245, :748).<br>3. Stat line: BUILT (not verified on device): the Macros stat line uses the new `StatLine` `tight` option, so gap 3, baseline gap 7 and stat tracking -1 instead of 4, 8 and 0. Energy stat line tight BUILT (device check pending). Workouts stat line tight BUILT (device check pending). This week stat line tight BUILT (device check pending) (`src/app/dashboard/nutrition.tsx`, `src/app/energy.tsx`, `src/app/dashboard/training.tsx`, `src/app/dashboard/week.tsx`, `src/components/display/DetailChart.tsx` `StatLine`, bundle :236-238).<br>4. Kicker block: BUILT (code re-checked, not verified on device): the shared `KickerTitle` already has a 10 dot, kicker tracking 1.1, title tracking -0.6, side padding 2, gap 4 and no bottom padding, the same as the design; no code changed (`src/components/display/DetailChart.tsx:292-306` `KickerTitle`, bundle :227-232).<br>5. Secondary card spacing: EXACT (code re-checked, not verified on device): blocks spaced `space.lg` 16, plot and axis grouped at `space.sm` 8 (`src/app/dashboard/nutrition.tsx`, bundle :290, :295).<br>6. Secondary plot: EXACT (code re-checked, not verified on device): 120 high, ceiling `MACRO_CEILING` 130 with bars capped at it, three 1 `light2` gridlines at 0, 50 and 100% stopping at the 44 gutter (`gridInset`), labelled 130%, 65% and 0 in caption tertiary label, 40 wide, right-aligned and centred on their lines (`nutrition.tsx`, `src/components/display/DetailChart.tsx` `Plot`, bundle :296-303, :694).<br>7. Secondary bars: BUILT (not verified on device): bars 30 wide, centred, radius 5 top and 2 bottom, gap 3, minimum 4, and grow-in on through the `Plot` `growIn` option (700 ms standard curve, 60 ms per column); the design's 4 start height and 160 ms mount delay are not matched (`src/app/dashboard/nutrition.tsx`, `src/components/display/DetailChart.tsx`, bundle :303-307, :453, :690-691).<br>8. Axis labels: BUILT (not verified on device): 500 11/15 in secondary label, gap 3, 44 right padding, and each label now fills its column and ends in an ellipsis through the new `Axis` `labelFillsColumn` option, instead of the fixed 48 box (`src/app/dashboard/nutrition.tsx`, `src/components/display/DetailChart.tsx` `Axis`, bundle :313-315, :692).<br>9. Breakdown row: BUILT (not verified on device): the shared `BreakdownRow` now has a 9 dot, a 9 dot-to-label gap, baseline alignment and a 500 15/20 label (`callout` with the `BREAKDOWN_LABEL` override), instead of 8, 8, centre and 400 15/21, on all four detail views (`src/components/display/DetailChart.tsx:362-365`, `src/lib/design/tokens.ts:149`, bundle :326-329).<br>10. App-only: "Meals today" list (`nutrition.tsx:180`), `LoadFailedNotice` (`:89`) and `HealthDisclaimer` (`:225`).<br>11. Page: BUILT, not verified on device. New opt-in `Screen` prop `detail`, set on the four detail views: scroll top `insets.top` + 48 (110 at the design's 62pt inset), back button top `insets.top` − 6 (56), and a flat bottom padding of 40, all matching (`src/components/navigation/Screen.tsx:30-32`, `:84`, `:97`, `:101`, `:107`, bundle :221-222, :225). The header strip, `insets.top` + 20 = 82, matches (`Screen.tsx:174`, bundle :221); the back button's shadow (opacity 0.1, radius 14, offset 0/4) and ring (0.5 width, `rgba(255,255,255,0.75)`) match (`src/components/navigation/GlassButtons.tsx:24-26`, bundle :222). Still different: the back button's fill is a three-way material — real Liquid Glass on iOS 26, otherwise a `BlurView` at intensity 40 with `tint="light"`, or an opaque `surface.card` fill under Reduce Transparency (`GlassButtons.tsx:32-61`) — none of which reproduces the design's literal fill, `rgba(255,255,255,0.72)` with `blur(22px) saturate(180%)` (bundle :222).<br>12. Other detail views: EXACT (code re-checked, not verified on device). The design's detail scroll gap is 16 (`gap:var(--lume-space-lg)`, bundle :225). All four views set `contentStyle={{ gap: space.lg }}` on `Screen`, which overrides the floating default of `space.md` (`src/app/dashboard/nutrition.tsx:86`, `src/app/energy.tsx:65`, `src/app/dashboard/training.tsx:67`, `src/app/dashboard/week.tsx:66`, `src/components/navigation/Screen.tsx:106-117`). Their `Body` components return fragments, so the cards are direct children of the scroll. |
| **Summary (Home) tab** | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Summary bundle 185bb533 (bundle line numbers below), not verified on device.<br>Matches: side padding 16, card gap 14 and bottom padding 158 (`src/app/(tabs)/index.tsx:84-86`, bundle :29); title block, eyebrow and title type, tracking and padding (`index.tsx:92-100`, bundle :31-33); elevated card surface with padding 20 and gap 16 (`src/components/display/Card.tsx:35`, `:47`, bundle :40); Energy balance rings, key rows, hero stat and net sign (`src/components/domain/EnergyBalanceCard.tsx:35-40`, `:153-155`, `:169-194`, bundle :47-80); This week chart geometry, dimming, unit copy, readout format and day letter weights (`src/components/domain/WeekEnergyCard.tsx:26-35`, `:111`, `:154`, `:194`, `src/lib/data/summaryCards.ts:33-40`, bundle :99-141, :720, :732); Workouts pips (`src/components/domain/WorkoutsWeekCard.tsx:18-19`, `:61-72`, bundle :187, :741-744); Macros rows (`src/components/domain/MacroBars.tsx:47-71`, bundle :201-207); header strip height 82 and gradient (`src/components/navigation/FloatingHeader.tsx:26`, `:71-72`, bundle :27); profile button size 44, right 16 and glyph 22 (`src/components/navigation/ProfileAvatarButton.tsx:31-36`, bundle :215-216).<br>Differences, missing or app-only:<br>1. Steps card: missing, as the app has no step data (`index.tsx:134-138`), vs a step count, "of 10,000 goal · N kcal burned" and a 52 seven-bar chart between This week and Workouts (bundle :148-169, :734).<br>2. App-only cards: `GymStatusCard` (`index.tsx:174`), `MorningBriefCard`, null with no brief (`:184`), and the plan card, shown only with a plan (`:190`).<br>3. `PendingSyncBanner`: app-only, null with nothing queued (`index.tsx:132`).<br>4. Pull-to-refresh: app-only (`index.tsx:89`).<br>5. Loading, error and no-data states: app-only on the streak (`index.tsx:109`, `:114`), Macros (`:152`, `:154`), Energy balance (`EnergyBalanceCard.tsx:122`, `:135`, `:164`, `:184`), This week (`WeekEnergyCard.tsx:74`, `:77`) and Workouts (`WorkoutsWeekCard.tsx:28`). Fibre can read "Not tracked · target n g" over an empty bar (`MacroBars.tsx:51-54`, `:67`).<br>Differences in behaviour:<br>6. Day scope: This week's picked day changes only that card, and Energy balance and Macros always read "Today" (`WeekEnergyCard.tsx:53`, `:160`, `EnergyBalanceCard.tsx:114`, `index.tsx:149`), vs one picked day rescoping Energy balance, Steps, Macros and the readout, with its short name as the scope word (bundle :44, :152, :196, :411, :703).<br>7. Detail views: four pushed routes (`EnergyBalanceCard.tsx:148`, `WeekEnergyCard.tsx:59`, `WorkoutsWeekCard.tsx:33`, `index.tsx:145`) vs one in-screen view with five variants, including steps.<br>8. Streak celebration: a toast from the gym card (`index.tsx:179`) vs a modal with "Keep going" (bundle :360).<br>9. Motion: values draw in their final state (`EnergyBalanceCard.tsx:49`, `WeekEnergyCard.tsx:169-178`, `src/components/display/ProgressBar.tsx:29`) vs a page fade and animated rings, bars, pips and macro widths (bundle :29, :55, :110, :187, :207).<br>10. Pressed cards: fade to 0.85 (`src/components/primitives/Pressable.tsx:53`, `Card.tsx:52-58`) vs the fill changing to `light-1` (bundle :40, :171, :192). The This week header also fades (`WeekEnergyCard.tsx:58`) vs no pressed style (bundle :84).<br>Differences on the title block and chrome:<br>11. Top padding: `insets.top` + 12, so 59, 71 and 74 at insets of 47, 59 and 62 (`index.tsx:83`), vs a fixed 70 (bundle :29).<br>12. Streak line: a button to `/gym/streak` (`index.tsx:117`) vs static text (bundle :34-37). "14 day streak" (`src/lib/i18n/locales/en.json:297-298`) vs "14-day streak" (bundle :701). The flame is an SF Symbol that pulses and greys at 0 (`src/components/display/StreakFlame.tsx:33-37`, `:44`) vs a static drawn flame (bundle :35).<br>13. Eyebrow date: the device date and locale (`index.tsx:98`) vs a fixed "Sunday 9 August" format (bundle :32); en-US adds a comma and puts the month first.<br>14. Header strip: blur intensity 30 stopping hard at 56%, with an unmasked tint (`FloatingHeader.tsx:29`, `:80-81`), vs blur 18 with saturate 1.4, both fading from 56% (bundle :27). The Reduce Transparency branch is app-only (`FloatingHeader.tsx:42`).<br>15. Profile button: top `insets.top` + 4, so 51, 63 and 66 (`ProfileAvatarButton.tsx:31`), vs a fixed 64; initials when a name exists (`:42-43`) vs always the person glyph; native glass or blur 50 with no shadow vs white at 74%, blur 20, saturate 180% and a shadow (bundle :215-216; code re-checked, not verified on device).<br>Differences on the cards:<br>16. Header glyphs: SF Symbols (`EnergyBalanceCard.tsx:114`, `WeekEnergyCard.tsx:64`, `WorkoutsWeekCard.tsx:37`, `index.tsx:149`) vs drawn paths (bundle :42, :85, :173). Macros uses one protein-coloured symbol vs four circles in four macro colours (bundle :194).<br>17. Burned: the inner ring is only a grey track, with no target and "No burn target set", as no burn target exists (`EnergyBalanceCard.tsx:172-173`, `:187-192`), vs a blue arc, "/ 2,400" and "78% of target" (bundle :57, :75-77).<br>18. This week segmented control: label 500 17/24, track padding and gap 4, height 48 (`src/components/forms/SegmentedField.tsx:64-65`, `:89`, `:105`) vs 600 15/20, 3, 44 (bundle :89-91).<br>19. This week header: no negative margin (`WeekEnergyCard.tsx:58`) vs -8.8 top and bottom, so the app's header takes 17.6 more height (bundle :84).<br>20. This week stat: no tracking and an 8 baseline gap (`WeekEnergyCard.tsx:106-107`) vs -0.6 and 6 (bundle :93-94); a zero net reads "0" (`:108`, `summaryCards.ts:38`) vs "+0" (bundle :452).<br>21. This week axis: scales with the data (`WeekEnergyCard.tsx:87-88`, `:131`) vs fixed 0, 1,400, 2,800 and −800, 0, +800 (bundle :103-105, :122-124). The goal line hides with no goal (`:141`).<br>22. This week bars: net minimum height 5 and missing or zero values draw no bar (`WeekEnergyCard.tsx:34`, `:41`, `:170`, `:175`, `:178`), and a missing value reads "—" (`:108`, `summaryCards.ts:39`); the design has no missing case.<br>23. Day letters: the last 7 days ending today, so the first letter changes daily (`WeekEnergyCard.tsx:37`, `:196`), vs a fixed M T W T F S S (bundle :425); the app's Workouts pips are Monday-first (`summaryCards.ts:45`), so the two rows can disagree.<br>24. Workouts: "session" or "sessions" (`WorkoutsWeekCard.tsx:45`) vs "of 5 sessions" (bundle :181); minutes trained (`summaryCards.ts:67-72`) vs "N kcal burned in the gym" (bundle :183); no tracking and an 8 baseline gap (`WorkoutsWeekCard.tsx:40-41`) vs -1 and 7 (bundle :179-180). |
| Food — Calendar sheet | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4. EXACT (code re-checked, not verified on device): title, sub-title and "Jump to today" copy (`src/app/food/calendar.tsx:42`, `:133`, bundle :552-553, :582); the month starts on the selected day and weeks start on Monday (`calendar.tsx:29`, `src/lib/data/foodDays.ts:97`, bundle :828, :973); month title style (`calendar.tsx:46`, bundle :563); 4 calories dot on logged days (`calendar.tsx:107-110`, bundle :577, :838); selected black fill (`:154`, bundle :836); future days inert (`:75`, bundle :839); the 52 pill and tile fill for Jump to today, 16 above it, and picking a day or jumping closes the sheet (`:32-35`, `:120-130`, bundle :575-582, :839, :975).<br>1. BUILT, not verified: month arrows are 40 tiles with tile fill, pressed fill and a 15 glyph, no press dimming, tap area still 44 (`calendar.tsx:160-161`, `:179-190`, `:195`, bundle :560-561, :564-565).<br>2. BUILT, not verified: next arrow at the current month is label-coloured at opacity 0.35 and stays disabled (`:162`, `:176`, `:190`, `:196`, bundle :564, :972).<br>3. BUILT, not verified: 8 under the arrows, 2 above the cells, 16 kept above Jump to today, weekday row 26 high with gap 2 (`:44`, `:52`, `:65`, bundle :559, :568-570, :573).<br>4. BUILT, not verified (cells full column width, 46 high, gap 2, inner gap 2; calendar.tsx).<br>5. BUILT, not verified: day number is 600 15/19 rounded (`:99-101`, bundle :576).<br>6. BUILT, not verified: today is a light-2 fill, with the ring removed (`:97`, bundle :836).<br>7. BUILT, not verified: future days are tertiary text with no dimming (`:94`, `:100`, bundle :837).<br>8. BUILT, not verified: selected logged dot is light-3 (`:110`, bundle :838).<br>9. BUILT, not verified: selecting a day eases the fill over the snap duration with the standard curve, instant under Reduce Motion (`:97`, `:142-158`, bundle :575).<br>10. BUILT, not verified: Jump to today label is 600 16/21 and pressing shows the pressed fill with no dimming (`:124-130`, `:132`, bundle :582).<br>11. BUILT, not verified: sheet sizes to its content, and the body's 20 bottom padding is cancelled so the safe-area inset alone gives the 34 on a 34-inset phone (`src/app/_layout.tsx:168`, `calendar.tsx:43`, bundle :548, :581). |
| Profile — Preferences | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device. The screen is `src/app/profile/preferences.tsx`, opened from the root row (`src/app/profile/index.tsx:155`). It uses `SegmentedField`, not `SettingsList` or `Card`.<br>Matches: "Units" eyebrow and "Preferences" title (`preferences.tsx:32`, `src/lib/i18n/locales/en.json:48`, bundle :395-396); the five controls, their labels and option pairs (`preferences.tsx:17-22`, `:36`, `:40-41`, `en.json:49-51`, `:54-56`, `:58`, `src/lib/units.ts:171-187`, bundle :400-406, :647-650); field label type 400 13/18 (`src/components/forms/FieldShell.tsx:28`, `src/lib/design/tokens.ts:152`, bundle :400); segment gap 4, pill radius and unselected label #6B6B6B (`src/components/forms/SegmentedField.tsx:63`, `:65`, `:92`, `:106`, bundle :401, :402, :635); system hint copy and type (`preferences.tsx:44-45`, `en.json:52`, bundle :409); Imperial sets energy to kcal (`units.ts:44`, bundle :811); neither pill lit when units are mixed (`preferences.tsx:37`, `SegmentedField.tsx:69`, bundle :653-655).<br>Differences:<br>1. Selected segment: white with `shadow.sm` and #171717 text (`SegmentedField.tsx:97`, `:106`) vs #000000 fill with white text and no shadow (bundle :402-403, :634-635).<br>2. Track fill: `light-2` #E5E5EA (`SegmentedField.tsx:62`) vs `light-1` #F2F2F7 (bundle :401).<br>3. Track padding: 4 (`SegmentedField.tsx:64`) vs 3 (bundle :401).<br>4. Segment height: 48, from a 24 line and 12 vertical padding, above a 44 minimum (`SegmentedField.tsx:89`, `:93`, `tokens.ts:147`), vs 40 (bundle :402).<br>5. Segment label: 500 17/24 (`SegmentedField.tsx:105`, `tokens.ts:147`) vs 600 15/20 (bundle :403).<br>6. Field label: #171717 with no left padding (`FieldShell.tsx:28`, `tokens.ts:51`) vs #6B6B6B with left padding 4 (bundle :400, :414).<br>7. Field gaps: label to control 4 (`FieldShell.tsx:26`) vs 7 (bundle :399, :413); control to hint 8 (`preferences.tsx:33`) vs 7 (bundle :399).<br>8. Hint: no left padding and no `text-wrap: pretty` equivalent (`preferences.tsx:44`) vs left padding 4 with `text-wrap: pretty` (bundle :409).<br>9. Mixed-units copy: "Custom — your units are mixed below." replaces the hint (`preferences.tsx:45`, `en.json:53`) vs the same hint in every state (bundle :409).<br>10. System check: energy counts, so metric with kJ reads as custom and lights neither pill (`units.ts:50-55`), vs weight, height and food only, so Metric stays lit (bundle :653-655).<br>11. Screen gap: 18 BUILT, device check pending, a literal because no token equals 18 (`preferences.tsx:32`, bundle :392).<br>12. Press and change feedback: pressed opacity 0.85 and a selection haptic (`src/components/primitives/Pressable.tsx:53`, `SegmentedField.tsx:77`), with no fill transition, vs no pressed style and a fill transition (bundle :402).<br>Top padding, title block, bottom padding and back button are in the "Profile — shared chrome" row. |
| Profile — Privacy | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65. All four rows, the eyebrow and both footnotes match the design copy.<br>Matches: screen gap 22 (`src/app/profile/privacy.tsx:60`, bundle :465). Both footnotes sit on the `SettingsList` footer (`privacy.tsx:69`, `:95`) at 13/18 in secondary label and side padding 4 (`src/components/display/SettingsList.tsx:181-188`, bundle :499, :510), with gap 8 to the row above (`SettingsList.tsx:185`, bundle :489, :502).<br>1. Section headers "Analytics", "AI processing", "Your data" are app-only (`privacy.tsx:68`, `:82`, `:94`).<br>2. The AI-processing row and its footnote are app-only (`privacy.tsx:80-92`); the code comment ties them to consent withdrawal (`:26-27`). The group renders only when consent is on (`:80`, group title at `:82`); the design has no AI group in any state.<br>3. Export: JSON through the share sheet (`privacy.tsx:46-57`) vs the toast "Export queued — we will email" (bundle :840).<br>4. Policy and terms open in-app documents (`privacy.tsx:63-64`) vs the toast "Opening lume.app/…" (bundle :838-839).<br>5. Busy label "Preparing your export…" is app-only (`privacy.tsx:99`).<br>6. Switch: native `Switch` vs a custom 51×31 control; track colours match (`SettingsList.tsx:103`, `:106`, bundle :495, :638).<br>7. Export failure toast "Couldn't export your data…" is app-only, with no match in the bundle (`privacy.tsx:53`).<br>8. Bottom padding: BUILT (not verified); target bottom padding per design: 40 on non-footer screens, 32 on footer screens (Account, Delete account, Subscription). Side padding is out of scope for this item. Currently 40 + `insets.bottom` (`src/components/navigation/Screen.tsx:76`, bundle :465).<br>9. Footnotes have no `text-wrap: pretty` equivalent (`SettingsList.tsx:182-188`, bundle :499, :510).<br>Row geometry, shared `SettingsList.tsx`: one grouped card at radius 28 with shadow and dividers (`:174`, `:50-55`) vs separate white rows at radius 14, no shadow, gap 4 (bundle :472-473); link-row min height 52 vs 48 (`:65`, bundle :473, :480, :503), while the analytics row's 52 matches (bundle :490); vertical padding 12 vs 0 (`:63`); side padding 16 vs 12 (`:64`); gap 12 vs 11 (`:62`); chip radius 10 vs 8 (`:73`); glyph 17 vs 15 (`:79`); label 17/24 vs 16/21 (`:92`); glyphs from the icon set vs drawn 1.8-stroke paths (`:79`, bundle :475); chevron a 14 icon vs a drawn 8×14 path (`:113`, bundle :478).<br>Top padding, title block and back button are in the "Profile — shared chrome" row. |
| Profile — Support | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65. Both rows, address, placeholder, title and button label match the design copy; the version format matches when a build number exists (`src/lib/appVersion.ts:19`).<br>1. Eyebrow "Help" (`src/app/profile/support.tsx:30`) vs "We reply within a day" (bundle :522).<br>2. Send: opens the Mail composer, with no success toast (`support.tsx:22-27`) vs in-app "Thanks — feedback sent" (bundle :846).<br>3. Email row: opens `mailto:` directly, with no toast (`support.tsx:33`) vs the toast "Draft opened to lumofit@gmail.com" (bundle :842).<br>4. Feedback field, `src/components/forms/TextField.tsx` vs bundle :546: 1 border (`:52-53`) vs no border; radius 16 (`:54`) vs 14; side padding 20 (`:55`) vs 14; vertical padding 16 (`:63`) vs 12; type 17/24 (`:56`, `:64`, `src/lib/design/tokens.ts:146`) vs 16/22; grows with content from min height `layout.buttonHeight * 2.2`, start height 114, rounded from the app's 52 × 2.2 = 114.4 (`tokens.ts:318`), with no max height (`:62`; code-read only, not device-checked) vs fixed at 4 rows with `resize:none`, no growth, start height about 112, calculated from 4 rows of 22 plus padding 12 top and bottom; placeholder `gray400` #8A8A8A (`:41`, `src/lib/design/tokens.ts:34`) vs `tertiary-label` #8a8a8a (bundle :21, `design/Lume App.html:382`) and text `gray800` #171717 (`:57`, `tokens.ts:32`) vs `label` #171717 (bundle :546, `design/Lume App.html:382`), both matching under different token names.<br>5. Feedback label: gap 4, `gray700`, no left padding (`src/components/forms/FieldShell.tsx:26-28`) vs gap 7, `secondaryLabel`, left padding 4 (bundle :544-545).<br>6. Send button: label 17/24 (`src/components/forms/Button.tsx:101`) vs 16/21; `Button.tsx:31` has no `gray-400` disabled fill (bundle :549, :845).<br>7. Bottom padding: BUILT (not verified); target bottom padding per design: 40 on non-footer screens, 32 on footer screens (Account, Delete account, Subscription). Side padding is out of scope for this item. Currently 40 + `insets.bottom` (`src/components/navigation/Screen.tsx:76`, bundle :519).<br>Exact, not a difference: screen gap 20 (code re-checked, not verified on device) (`space.xl`, `src/app/profile/support.tsx:30`, bundle :519).<br>Row geometry, shared `src/components/display/SettingsList.tsx`: one grouped card at radius 28 with shadow and dividers (`:174`, `:50-55`) vs separate white rows at radius 14, no shadow, gap 4 (bundle :526-527); min height 52 vs 48 (`:65`, bundle :527, :535); vertical padding 12 vs 0 (`:63`, bundle :527, :535); side padding 16 vs 12 (`:64`, bundle :527, :535); gap 12 vs 11 (`:62`, bundle :527, :535); chip radius 10 vs 8 (`:73`, bundle :528, :536); glyph 17 vs 15, from the icon set vs drawn 1.8-stroke paths (`:79`, `src/app/profile/support.tsx:33-34`, bundle :529, :537); label 17/24 vs 16/21 (`:92`, bundle :531, :539); value 15/21 vs 14/19 (`:96`, bundle :532, :540), with no `numberOfLines`, so a long value can wrap, and it stacks under the label at large text sizes (`:86-87`), vs `nowrap` (bundle :532, :540); chevron a 14 icon vs a drawn 8×14 path (`:113`, bundle :533).<br>Top padding, title block and back button are in the "Profile — shared chrome" row. |
| Profile — About | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Profile bundle b09a5e65. Wordmark text, size and weight, tagline copy and type, the three row labels and the Credits value match (`src/app/profile/about.tsx:16-20`, `:26-28`, bundle :561-562, :849-851).<br>Wordmark block: EXACT (code re-checked, not verified on device) for centring, wordmark-to-tagline gap 6 and no extra vertical padding (`about.tsx:15`, bundle :560).<br>Screen gap 26: EXACT (code re-checked, not verified on device) (`about.tsx:14`, bundle :559).<br>Chevrons: EXACT (code re-checked, not verified on device). All three rows are `plain`, so the app draws none (`about.tsx:26-28`, `src/components/display/SettingsList.tsx:111-114`), and the design rows have none (bundle :566-572).<br>1. Eyebrow "The app" and title "About" are app-only (`about.tsx:14`); the design has no header here (bundle :559-560).<br>2. Wordmark tracking 0 vs -0.6 (`about.tsx:16`, bundle :561).<br>3. Tagline has no `textAlign: center`, so a wrapped line would not centre (`about.tsx:19`, bundle :562).<br>4. Version and Build read from `Constants` and can be empty (`about.tsx:26-27`, `src/lib/appVersion.ts:13`, `:16`), which hides the value (`SettingsList.tsx:95`); the design shows literals (bundle :849-850).<br>5. Bottom padding: BUILT (not verified); target bottom padding per design: 40 on non-footer screens, 32 on footer screens (Account, Delete account, Subscription). Side padding is out of scope for this item. Currently 40 + `insets.bottom` (`src/components/navigation/Screen.tsx:76`, bundle :559).<br>Row geometry, shared `SettingsList.tsx`: one grouped card at radius 28 with shadow and dividers (`:174`, `:50-55`) vs separate white rows at radius 14, no shadow, gap 4 (bundle :564-566); min height 52 vs 48 (`:65`, bundle :566); vertical padding 12 vs 0 (`:63`, bundle :566); side padding 16 vs 12 (`:64`, bundle :566); gap 12 vs 11, including label to value (`:62`, `:89`, bundle :566); chip radius 10 vs 8 (`:73`, bundle :567); glyph 17 vs 15 (`:79`, bundle :568); glyphs from the icon set vs drawn 1.8-stroke paths (`:79`, `about.tsx:26-28`, bundle :568, :849-851); label 17/24 vs 16/21 (`:92`, bundle :570); value 15/21 vs 14/19, and the value can wrap, and stacks under the label at large text sizes, vs `nowrap` on one line (`:96`, `:86-87`, bundle :571).<br>Top padding, title block and back button are in the "Profile — shared chrome" row. |
| Profile — shared chrome | ⚠️ PARTIAL | Code re-checked against Profile bundle b09a5e65, not verified on device. The convention is implemented.<br>Exact (code re-checked, not verified on device): grey page #FAFAFA (`src/components/navigation/Screen.tsx:72`, `src/app/profile/index.tsx:90`, bundle :25); side padding 16, except Delete account in item 7 (`Screen.tsx:92`, `index.tsx:96`, bundle :28); hidden scroll indicator (`Screen.tsx:109`, `index.tsx:100`, bundle :18-19); screen gap on Privacy 22, Support 20 and About 26 (`privacy.tsx:60`, `support.tsx:30`, `about.tsx:14`, bundle :465, :519, :559); toast side offsets 16 (`src/components/display/ToastHost.tsx:54-55`, bundle :586).<br>1. Header strip: `insets.top` + 20 vs a fixed 84, so 67 at a 47 inset, 79 at a 59 inset and 82 at a 62 inset (`Screen.tsx:163`, `index.tsx:186`, bundle :579).<br>2. Header tint and mask: gradient 86 to 20 vs 88 to 18 and mask 56 vs 58 (`src/components/navigation/FloatingHeader.tsx:29`, `:71`, `:72`, bundle :579).<br>3. Header blur: `intensity` 30 vs blur 18 with saturate 1.4; the blur stops hard at 56% and the tint runs the full height vs one soft mask over both (`FloatingHeader.tsx:68-81`, bundle :579).<br>4. Top padding: `insets.top` + 56, so 103, 115 and 118 at insets of 47, 59 and 62, on every Profile screen (`Screen.tsx:91`, `index.tsx:95`, `src/lib/design/tokens.ts:317`), vs a fixed 96 on Settings, Account, Subscription, Goals, Scan accuracy, AI insights, Preferences, Connected apps, Privacy and Support (bundle :28, :87, :165, :230, :297, :354, :392, :432, :465, :519), 110 on About (bundle :559) and 120 on Delete account (bundle :143).<br>5. Bottom padding: scroll bottom 32 on Account, Subscription and Delete account EXACT (code re-checked, not verified on device) (`Screen.tsx:76`, `account.tsx:52`, `subscription.tsx:98`, `delete-account.tsx:82`, bundle :87, :165, :143). 40 + `insets.bottom` vs 40 on Goals, Scan accuracy, AI insights, Preferences, Connected apps, Privacy, Support and About (`Screen.tsx:76`, bundle :230, :297, :354, :392, :432, :465, :519, :559); 48 + `insets.bottom` vs 48 on Settings (`index.tsx:98`, bundle :28); footer bar on Account and Delete account, parked for Isa: top 16 and bottom 16 + `insets.bottom` vs 12 and 30 (`Screen.tsx:142-143`, bundle :133, :152); the Subscription footer bar is app-only (`subscription.tsx:98`, bundle :164-228).<br>6. Screen gap: Delete account confirm step 14 EXACT (code re-checked, device check pending), from the confirm block, as the step has no title beside it (`delete-account.tsx:79`, `:111`, bundle :143). Goals 20 BUILT, device check pending, set with `contentStyle` (`goals.tsx:94`, bundle :230). Scan accuracy 20 BUILT, device check pending, set with `contentStyle` (`scan-calibration.tsx:60`, bundle :297). Connected apps gap 20 BUILT, device check pending, set with `contentStyle` (`integrations.tsx:156`, bundle :432); card wrapper gap 8 BUILT, device check pending (`integrations.tsx:160`, bundle :439). Account gap 20 and wrapper gap 4 BUILT, device check pending (`account.tsx:51`, `:69`, bundle :87, :116). Subscription gap 20 BUILT, device check pending (`subscription.tsx:97`, bundle :165). AI insights gap 20 BUILT, device check pending (`src/app/insights.tsx:58`, bundle :354). Preferences gap 18 BUILT, device check pending, set with `contentStyle` as a literal because no token equals 18 (`preferences.tsx:32`, bundle :392). Settings gap 26 BUILT, device check pending, set as a literal on the hand-rolled scroll content because no token equals 26 (`index.tsx:97`, bundle :28).<br>7. Delete account side padding: scroll content sides 24 match the design, via local `SIDE_PADDING` in `src/app/profile/delete-account.tsx` (`:21`, `:81`, bundle :143). Footer bar sides 16 match, side padding wrapper removed from `delete-account.tsx`, BUILT, not verified (`Screen.tsx:141`, bundle :152). DIFFERENT, parked in shared `Screen.tsx`: footer bar top 16 vs 12 and bottom 16 + `insets.bottom` vs 30 (`Screen.tsx:142-143`, bundle :152).<br>8. Title block: `Screen.tsx` BUILT, device check pending: gap 2, bottom padding 0, side padding 4 and title tracking -0.6 (`Screen.tsx:117`, `:127`, bundle :30, :32, :467). `src/app/profile/index.tsx` title block BUILT, device check pending: gap 4 to 2, bottom padding 4 to 0, side padding 0 to 4 and title tracking 0 to -0.6 (`index.tsx:109`, `:115`, bundle :30, :32). Eyebrow BUILT, device check pending: the shared `Screen.tsx` eyebrow and the Settings eyebrow in `src/app/profile/index.tsx` are letterSpacing 1.1, and weight, size and line height 600 13/16 and secondary label colour match all 10 eyebrows above a title (`Screen.tsx:120-122`, `index.tsx:111`, bundle :31, :90, :168, :233, :300, :357, :395, :435, :468, :522). On Delete account the block is hidden on the confirm step, BUILT, device check pending, as the design has none (`src/app/profile/delete-account.tsx:78-79`, bundle :143-144); the later steps keep it and are app-only.<br>9. Back button: 44 vs 38, a deliberate HIG tap target (`src/components/navigation/GlassButtons.tsx:20`, bundle :581), at `insets.top` + 4 and left 16 vs top 50 and left 14 (`Screen.tsx:165`, `index.tsx:189`, bundle :581).<br>10. Back button look: system Liquid Glass, or blur 40 on `surface.card`, with shadow 0 4 14 at 0.10 and a 0.5 ring in white at 0.75 (`GlassButtons.tsx:24-26`, `:50`, `:57`, `:131`, `:142-152`) vs white 76% with blur 14, saturate 1.6, `shadow-sm` at 0 2 8 and 0.03, and no ring (bundle :581); an 18 black icon vs a drawn 10×17 path at stroke 2.6 in `label` (`GlassButtons.tsx:23`, `:133`, bundle :582); pressed opacity 0.85 vs 0.6 (`src/components/primitives/Pressable.tsx:53`, `src/lib/design/tokens.ts:329`, bundle :581).<br>11. Reduce Transparency fallbacks are app-only: an opaque header and a solid back button (`FloatingHeader.tsx:42-58`, `GlassButtons.tsx:44-46`).<br>12. Toast placement and timing: at the top unless it has an action (`src/components/display/toastStore.ts:42`, `ToastHost.tsx:56-57`) vs always at the bottom (bundle :586); bottom offset `insets.bottom` + 16 vs 52 (`ToastHost.tsx:57`, bundle :586); 2800 ms vs 2200 ms (`toastStore.ts:45`, bundle :627); slides in vs fades in (`ToastHost.tsx:67`, bundle :586).<br>13. Toast look: radius 20 vs pill (`ToastHost.tsx:76`); black vs `gray-1` #1c1c1e (`:19-22`, `:75`); vertical padding 12 vs 13 (`:77`); gap 8 vs 10 (`:74`); `shadow.md` vs none (`:80`), all against bundle :586; a tone-specific 18 symbol vs a drawn 16 check (`:84-86`, bundle :587); 15/21 weight 400 vs 14/18 weight 500 (`:92`, bundle :588); the action button is app-only (`:95-110`). |
| Food — FAB add menu | ✅ EXACT (code re-checked, not verified on device) | Code re-checked against Food bundle 71f71ac4 (bundle line numbers below), not verified on device. BUILT (device check pending).<br>Matches, + button: 62 black disc, shadow 0 12 28 at 0.26, 0.5 ring of white at 0.14, pressed 0.86 and scale 0.96, a 27 plus at stroke 2.6 turning 45° at `fast` (`src/components/navigation/LumeTabBar.tsx:34`, `:46-52`, `:136-138`, `:237-252`, bundle :611-612, :883).<br>Matches, menu: 10% black scrim fading in at `fast`, tap to close (`src/components/navigation/AddMenu.tsx:26`, `:68`, `:87-89`, bundle :166); panel 232 wide, 16 from the right and 12 above the + button, so 96 from the bottom on a 34 inset, radius 18, shadow 0 18 42 at 0.2 with a 0.5 ring at 0.06, popping from the bottom right with scale 0.94 and a 6 offset at `medium` (`AddMenu.tsx:22-31`, `:66-81`, `:92-110`, `LumeTabBar.tsx:115-117`, `:261`, bundle :15, :167); rows "Log gym session" then "Log food", 54 tall, 18 side padding, gap 12, label 500 16/20, pressed fill black at 0.05 (`AddMenu.tsx:32-38`, `:111-113`, `:130-149`, `src/lib/i18n/locales/en.json:86-87`, bundle :168-169, :173-174); 19 drawn glyphs in the positive and calories colours (`LumeTabBar.tsx:75-102`, `:270-271`, bundle :170, :175); 0.5 divider at 0.10 black, inset 18 (`AddMenu.tsx:35-36`, `:112`, bundle :172).<br>Accepted deviations, kept: solid white panel vs white at 0.94 with a 24 blur (owner decision; `AddMenu.tsx:5-8`, `:101`, bundle :167); the local `SCRIM_COLOR` (`AddMenu.tsx:26`); the Gym row pushes `/gym/log-session` (owner decision; `LumeTabBar.tsx:262-265`, bundle :886). |
| Gym — main tab chrome & card order | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device.<br>Matches: card order from the title block through "Log this session", Muscle focus and My schedule (`src/app/(tabs)/gym.tsx:108-171`, bundle :30-150); 16 page sides, 14 card gap and 158 bottom padding (`gym.tsx:99-100`, `:105`, bundle :28); `lumeFade` at 260 ms with an 8 offset (`gym.tsx:34-36`, `:105`, bundle :13, :28); title block: eyebrow `label` with 1.1 tracking and 26 minimum height, 0 gap, 4 side padding, title -0.6 tracking and 52 right padding (`gym.tsx:108-115`, bundle :30-32); padding 12 / 16 on the streak strip and 16 on the calendar, `TodayCard` and `MuscleChart` (`gym.tsx:130`, `:150`, bundle :35, :42, :72, :104); header strip height 82 and its gradient (`gym.tsx:186`, `src/components/navigation/FloatingHeader.tsx:26`, `:71-72`, bundle :26); the Log pill's visibility rule (`gym.tsx:165`, bundle :1603).<br>Differences:<br>1. `GymPatternsCard`: app-only, as no design module has its copy (`src/app/(tabs)/gym.tsx:172`). It uses `Card`'s default 20 padding, a 16 inner gap and a 17 tinted glyph (`src/components/gym/GymPatternsCard.tsx:85-87`), where the design's other Gym cards use 16, 12 and no glyph (bundle :42, :104-106).<br>2. Training list: app-only, with My schedule, My workouts, Apply a streak freeze and Session history rows (`src/app/(tabs)/gym.tsx:174-182`); the design's tab ends on the My schedule card (bundle :150-168).<br>3. Failed-load notice: app-only (`gym.tsx:122`).<br>4. Pull-to-refresh: app-only (`gym.tsx:103`).<br>5. Top padding: `insets.top` + 12, so 59, 71 and 74 at insets of 47, 59 and 62 (`gym.tsx:98`), vs a fixed 70 (bundle :28).<br>6. Date eyebrow: always today, in the device locale (`gym.tsx:85-89`), vs the selected day as "{weekday} {date} {month}" (bundle :31, :1498).<br>7. Header strip blur: intensity 30 stopping at 56%, with an unmasked tint (`FloatingHeader.tsx:29`, `:80-81`), vs blur 18 with saturate 1.4, both fading from 56% (bundle :26). The Reduce Transparency branch is app-only (`FloatingHeader.tsx:42`).<br>8. Profile button: top `insets.top` + 4, so 51, 63 and 66 (`src/components/navigation/ProfileAvatarButton.tsx:31`), vs a fixed 64; initials when a name exists (`:42-43`) vs the person glyph; native glass or blur 50 with no shadow vs white at 74%, blur 20 and a shadow (bundle :898; code re-checked, not verified on device).<br>9. Streak strip: a button (`gym.tsx:128`) vs no press, and a 12 gap (`gym.tsx:132`) vs 11 (bundle :35).<br>Needs Isa: whether `GymPatternsCard` keeps 20 padding or moves to 16. Card internals are listed in their own rows. |
| Gym — "My schedule" screen | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6. Matches: title1 title with no eyebrow, screen gap 20 (`src/app/gym/schedule.tsx:80`, bundle :521-522); one elevated card with padding 8/16 (`schedule.tsx:90`, bundle :523); Monday-first order, the design's day names and the rest-day copy (`:26`, `:91`, `:115`, `:131`, `:136`, bundle :1105, :1835-1842); row min height 58, gap 12, 1 divider in `surface.divider` and pressed opacity 0.6 (`:29`, `:32`, `:102-108`, bundle :525, :1840); 42 gutter, day 600 15/20, dot 9 and its colours, name 500 15/20 and its colours, text gap 1, footnote sub-line, one-line truncation and a 14 #8A8A8A chevron (`:24`, `:30-31`, `:38-39`, `:114-140`, bundle :526-532, :1839, :1841); "My workouts" heading with tracking 1.1, card radius 20, padding 16, gap 12, text gap 3, its three text styles, "Every …" and "Not scheduled", and a 14 gray-400 chevron (`:28`, `:192-230`, bundle :537-545, :1852); picker title, "Rest day" last with "Nothing scheduled", rows at min height 56, radius 16, gap 8, `surface.tile` when selected and `tilePressed` when pressed, 500 15/20 name, footnote sub-line and a 17 tick (`:33-35`, `:152`, `:159-173`, `:250-273`, bundle :654-662, :1865-1876).<br>1. Workout card tap opens `/gym/new-template?id=` (`schedule.tsx:214`) vs the workout screen (bundle :1853).<br>2. Workout card pressed state is the default opacity 0.85 (`src/components/display/Card.tsx:52-58`, `src/components/primitives/Pressable.tsx:53`) vs a `light-1` fill (bundle :539).<br>3. Sub-line phrase, week rows and workout cards: built from each exercise's primary muscle, in English only, and left out if the API omits the joined exercise (`schedule.tsx:93`, `:135`, `:182-186`, `:201-202`) vs the template's own text (bundle :1842, :1851).<br>4. With zero templates the whole "My workouts" section is hidden, heading included (`schedule.tsx:147`) vs the heading always rendered (bundle :536-538).<br>5. A failed or empty schedule fetch gives an empty card with no failure message (`schedule.tsx:91`, `src/lib/data/gymSchedule.ts:64-66`) vs seven rows always (bundle :1835).<br>6. App-only states: loading skeletons (`schedule.tsx:81-86`) and the save-failed rollback toast (`:67-75`).<br>7. Title to card: 20 BUILT (device check pending), as the shared title block no longer adds 4 below the title (`Screen.tsx:117`, `schedule.tsx:80`, bundle :521). DIFFERENT, from the same shared block: side padding 4 vs 0 and title tracking -0.6 vs none (`Screen.tsx:117`, `:127`, bundle :522).<br>8. Top padding `insets.top` + 56, so 103, 115 and 118 at 47, 59 and 62 insets, vs a fixed 110 (`Screen.tsx:91`, bundle :521).<br>9. Back button: at `insets.top` + 4, so 51, 63 and 66, vs top 56 (`Screen.tsx:165`, bundle :518); system Liquid Glass, or blur 40 on `surface.card` (`src/components/navigation/GlassButtons.tsx:50`, `:57`), with shadow 0 4 14 at 0.10 (`:24`, `:131`) and a 0.5 ring in white at 0.75 (`:25-26`, `:142-152`) vs 0.72 white with blur 22, saturate 180, shadow 0 4 14 at 0.10 and a 0.5 inner ring (bundle :518); an 18 black SF Symbol, `chevron.left` (`GlassButtons.tsx:23`, `:133`, `src/components/primitives/Icon.tsx:32`) vs an 18 path at stroke 2.8 in `label` (bundle :519); pressed opacity 0.85 (`Pressable.tsx:53`) vs 0.82 with scale 0.96 (bundle :518).<br>10. Top strip: height `insets.top` + 20, so 67, 79 and 82, vs a fixed 82 (`Screen.tsx:163`, bundle :517); `intensity` 30 vs blur 18 with saturate 1.4, and the blur stops hard at 56% and the tint runs the full height vs one soft mask over both (`src/components/navigation/FloatingHeader.tsx:68-82`, bundle :517).<br>11. Picker sheet, shared `src/components/navigation/BottomSheet.tsx`: grabber width 40 vs 38 and top space 16 vs 10 (`:142`, `:150`, `:152`, bundle :652); handle to title 12 vs 14 (`:154`, bundle :652-653); side padding 16 vs 20 (`:141`, bundle :653); bottom inset + 16 vs 34 (`:143`, bundle :653); centred title in black vs left in `label` (`:150`, `:154`, bundle :654); shadow `shadow.lg` vs 0 -14 40 at 0.18 (`:145`, bundle :651); rise over 260 ms on a cubic ease-out vs 380 ms on the enter curve (`:40`, bundle :651).<br>12. App-only: the picker list is capped at 70% of the window and scrolls (`schedule.tsx:36`, `:155-156`).<br>13. Chevrons and tick are SF Symbols (`schedule.tsx:140`, `:230`, `:273`) vs drawn paths at stroke 2.4 and 2.6 (bundle :532, :545, :662).<br>14. Bottom padding: BUILT (not verified); target bottom padding per design: 40 on non-footer screens, 32 on footer screens (Account, Delete account, Subscription). Side padding is out of scope for this item. Currently 40 + `insets.bottom` (`src/components/navigation/Screen.tsx:76`, bundle :521).<br>Not compared: the push transition into this screen (bundle :516).<br>Needs Isa, parked: back button shadow conflict. `BACK_SHADOW` (`GlassButtons.tsx:24`) matches the Gym design's 0 4 14 at 0.10 (bundle 7dc211f6 :518), the Profile design uses `shadow-sm` at 0 2 8 and 0.03 (bundle b09a5e65 :581), and one shared button cannot match both without a prop. |
| Gym — today's session card | ❌ DIFFERENT (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6. Matches: card surface, radius, shadow, padding 16 and gap 16 (`src/components/gym/TodayCard.tsx:186-187`, bundle :72); dot 11 and its colours, header gap 10 and min height 34, title gap 1, title and sub-line type (`:24-27`, `:102-111`, bundle :73-77, :1569); pill padding 3/9, type 600 11/15, labels and the Planned and Rest fills (`:28-29`, `:36`, bundle :79, :1575-1578); stat value rounded 600 16/21, value-to-label gap 1, grid gap 8 and labels (`:32`, `:38-42`, `:153`, bundle :83-87); chip min height 28, padding 10, type 500 12/16, row gap 6, and the first three chips plus "+N more" (`:30-31`, `:37`, `:72`, bundle :91-93, :1580-1581); rest-day copy (`:229-230`, bundle :1570, :1573); chevron size and colour (`:115`, bundle :80).<br>1. The card is not tappable in any state, with no `onPress` (`TodayCard.tsx:186`, `:226`, `:248`) vs one tap target opening the session, with a `light-1` pressed fill (bundle :72, :1582).<br>2. Chevron on the logged state only, on a card that cannot be tapped (`TodayCard.tsx:115`, `:194`) vs every state (bundle :80); glyph is an SF Symbol vs a 2.4-stroke path (bundle :80).<br>3. Logged grid is 3-up with no Calories cell, because session rows carry no calories, which needs a backend change (`TodayCard.tsx:153-163`) vs 4-up (bundle :83, :1584-1589). A missing duration or volume reads as a dash, which is app-only (`:155`, `:159`). Sets counts every exercise's sets (`:143`) vs strength only (bundle :1188). The grid and chips appear only once `useGymRange(1)` finds the session (`:182-183`, `:196`) vs whenever the day has exercises (bundle :1579).<br>4. Planned state has no stats grid (`TodayCard.tsx:247-270`) vs the grid whenever a session has exercises (bundle :82-90, :1579).<br>5. "Start workout" inside the card is app-only (`TodayCard.tsx:267`) vs no button in the card (bundle :72-97).<br>6. Planned sub-line drops the muscle-group phrase (`TodayCard.tsx:245`, bundle :1573), and the design's "ready" wording for a drafted day has no counterpart.<br>7. Logged sub-line kcal is the day's total exercise burn and is left out when none is recorded (`TodayCard.tsx:181`, `:191`) vs the session's kcal, always shown (bundle :1571-1572).<br>8. Logged pill is solid green (`TodayCard.tsx:193`) vs a 22% wash into white (bundle :1576-1577); the token awaits Isa.<br>9. The card always shows today (`TodayCard.tsx:204`) vs following the selected day (bundle :1571-1572).<br>10. App-only: loading skeletons (`TodayCard.tsx:206-215`) and `LoadFailedNotice` with Try again (`:218`), an accepted deviation; the notice's button keeps `minTapTarget={false}` (`src/components/display/LoadFailedNotice.tsx:47`); a long stat value shrinks to fit (`TodayCard.tsx:124`) vs staying on one line at full size (bundle :86). |
| Gym — exercise progress | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6 (bundle line numbers below), not verified on device. The design has no standalone progress screen, so this compares its exercise detail (bundle :184-358).<br>Matches: title type and 3 gap to the sub-line (`src/app/gym/exercise-progress.tsx:33`, `:282-285`, bundle :185-186); sides 16 and gap 16 (`exercise-progress.tsx:281`, `src/components/navigation/Screen.tsx:92`, bundle :184); Muscles worked card padding 16, gap 12, chips at 28 tall with padding 10, gap 5, row gap 6, 600 11.5/15 and 22% and 10% washes (`exercise-progress.tsx:42-43`, `:87-110`, bundle :190-204, :1703-1706); form guide step discs, type, gaps and copy (`exercise-progress.tsx:54-64`, `:120-142`, bundle :228-234, :1344-1354); History card title, range, metric line, 118 chart, 6 gap, 6 bar radius, 7% minimum, last bar black, 10/14 labels, and the Latest session and Best set stats (`exercise-progress.tsx:214-274`, bundle :324-352, :1709-1731).<br>Differences:<br>1. Editing blocks: absent vs the Sets card with Add set, the cardio Speed segments card, the session stats row and Remove (bundle :239-271, :272-314, :315, :357).<br>2. Muscles worked: no 216 3D body figure, because no app asset exists (bundle :195-197).<br>3. Form guide: no 184 image carousel or its caption, because no app asset exists (bundle :210-227).<br>4. Sub-line: the primary muscle only, and absent when the library has no match (`exercise-progress.tsx:286-290`), vs muscle and kcal (bundle :187, :1733).<br>5. Cardio: the empty state, because the progress read has no minutes or speed (`exercise-progress.tsx:191`, `src/lib/api.ts:805`), vs minutes bars and a Fastest stat (bundle :1710, :1715, :1725).<br>6. Too few logs: "Not enough data yet" below 3 logs (`exercise-progress.tsx:179-194`) vs the History card with dashes (bundle :1713, :1726).<br>7. Card scope colour: tertiary vs secondary, from the shared `CardHeaderRow` (`src/components/display/CardHeaderRow.tsx:39`, bundle :193, :327).<br>8. Date labels: anchored to the newest bar (`exercise-progress.tsx:257`) vs every odd index (bundle :1720), which differ when the bar count is odd.<br>9. No `text-wrap: pretty` equivalent on the title or steps (`exercise-progress.tsx:283`, `:140`, bundle :186, :232).<br>10. Page: top padding `insets.top` + 56 vs a fixed 110, so 103, 115 and 118 at insets of 47, 59 and 62 (`Screen.tsx:91`, bundle :184); bottom padding 40 + `insets.bottom` vs 40 (`Screen.tsx:76`, bundle :184); header strip `insets.top` + 20 vs a fixed 82 (`Screen.tsx:163`, bundle :180); back button top `insets.top` + 4 vs a fixed 56, with a different glass recipe (`Screen.tsx:165`, `src/components/navigation/GlassButtons.tsx:50`, `:57`, bundle :181).<br>11. App-only: the 180 loading skeleton (`exercise-progress.tsx:176`). |
| Gym — month heatmap | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6. Matches: card padding 16 (`src/app/(tabs)/gym.tsx:150`, bundle :42), gap 12, row gap 6, cell gap 5, cell radius 7, swatch 11 radius 3, chevron 14 and 0.3 on a disabled next button (`src/components/domain/GymCalendar.tsx:26-35`, `:128-129`, `:160`, bundle :42-52, :66, :1504); pressed opacity 0.5 on both month buttons (`:36`, `:143`, `:160`, bundle :45, :48); 600 10/12 rounded digits, future cells and their 1 `light-2` border, and the 2 ring's weight and colour (`:74-78`, `:100-101`, bundle :58, :1261-1262); Monday-first lead, four-step ramp, Less and More legend, next-month limit and month title (`:54-59`, `:196-204`, `src/lib/data/gymRange.ts:207-211`, bundle :53-68, :1100-1103, :1249, :1503, :1506).<br>1. Cells are not tappable, `Day` is a bare `View` (`GymCalendar.tsx:80`) vs every non-future cell opening the session view with a 0.7 pressed opacity (bundle :57, :1263).<br>2. The 2 ring is always today (`GymCalendar.tsx:74-75`) vs the selected day (bundle :1261).<br>3. Frozen-day `light3` fill is app-only (`GymCalendar.tsx:73`).<br>4. Low end of the ramp: an untimed or up-to-30-minute session is level 1 (`gymRange.ts:108`) vs level 2 or 3 for any logged day, with an untimed day counted as 52 minutes (bundle :1164, :1168). The 55-minute boundary matches.<br>5. Summary count: every session counts, so two on one day add 2 (`gymRange.ts:178`) vs one per trained day (bundle :1257).<br>6. Summary wording: "1 session" singular (`gymRange.ts:199`) vs always "sessions"; the time segment is left out at 0 minutes (`:200`) vs always shown; "N untimed" and "N freezes" are app-only (`:201-202`), bundle :1509.<br>7. Loading and failed summary strings are app-only (`src/app/(tabs)/gym.tsx:64-67`).<br>8. Month chevrons are SF Symbols (`GymCalendar.tsx:146`, `:163`) vs drawn paths at stroke 2.8 (bundle :46, :49).<br>9. Nav button size: `NAV_SIZE` 32 is overridden by `Pressable`'s 44 minimum tap target, so the buttons and the title row lay out at 44 (`GymCalendar.tsx:30`, `src/components/primitives/Pressable.tsx:52`) vs 32 (bundle :45, :48). |
| Gym — cross-cutting token drift | ⚠️ PARTIAL (code re-checked, not verified on device) | Re-checked R489: code re-checked against Gym bundle 7dc211f6. Only the values listed here were compared; the full token set was not re-compared in this pass. EXACT (code re-checked, not verified on device): `-0.6` on the Gym title (`src/app/(tabs)/gym.tsx:115`, bundle :32, the only title in this bundle that sets it); `1.1` on the Gym eyebrow (`gym.tsx:111`, bundle :31); the heatmap ramp (`src/components/domain/GymCalendar.tsx:54-57`, bundle :1100-1103); the `lumeFade` page entrance (`gym.tsx:34`, `:105`, bundle :13, :28); card padding 16 on the exercise progress cards (`src/app/gym/exercise-progress.tsx:87`, `:118`, `:214`, bundle :190, :208, :324) and `src/components/gym/MyScheduleCard.tsx:63` (bundle :150), 28 on `src/components/gym/CelebrationCard.tsx:48` (bundle :919) and 12/16 on the streak strip (`gym.tsx:130`, bundle :35); `src/components/gym/TodayCard.tsx` dot 11, header gap 10 and min height 34, title gap 1, pill padding 3/9, chip side padding 10, chip row gap 6, stat cell gap 1, pill 600 11/15, chips 500 12/16, stat value rounded 600 16/21 and `shadow.sm` (`:24-32`, `:36-42`, bundle :72-75, :79, :85-86, :91, :93); schedule rows, dot 9, text gap 1, name 500 15/20 and footnote sub-line (`src/app/gym/schedule.tsx:30-31`, `:39`, `:127-133`, bundle :527-530, :1841); no deprecated grey alias is left in `src/app/gym`, and the ones left in shared navigation components render the same values as the design's greys.<br>1. Card padding: `src/app/gym/templates.tsx:50` 20 vs 16, and radius 28 vs 20 (nearest counterpart, the My workouts card, bundle :539); `src/app/gym/session.tsx:407` 20 on one card per exercise vs 12/16 on one shared card (bundle :835); `src/app/gym/muscles.tsx:73` 20 vs no card around "All muscle groups" (bundle :1012). No design counterpart, so not comparable, all 20 in code: `src/app/gym/muscles.tsx:63`; `src/app/gym/freeze.tsx:43`; `src/app/gym/streak.tsx:31`, `:86`; `src/components/gym/GymPatternsCard.tsx:58`, `:73`, `:85`.<br>2. Label tracking: no gap remains in this item. The shared eyebrow BUILT, not verified: tracking changed from 1 to 1.1 (`src/components/navigation/Screen.tsx:122`), matching the design's 1.1 on its labels (bundle :31, :241, :537, :622). "Next 7 days" label BUILT, not verified: tracking changed from 1 to 1.1 (`src/app/gym/streak.tsx:39`). The design has no "Exercises" label in the Gym bundle, so the tracking change in `src/app/gym/new-template.tsx:158` is kept as a BUILT item with no design counterpart.<br>3. Shadows: `shadow.lg` (0 10 28 at 0.10) vs 0 -14 40 at 0.18 on sheets (`src/components/navigation/BottomSheet.tsx:145`, bundle :374, :651). Back button shadow 0 4 14 at 0.10, 0.5 inner ring at 0.75 and 18 icon: EXACT (code re-checked, not verified on device) (`src/components/navigation/GlassButtons.tsx:23-26`, `:131`, `:133`, bundle :181-182, :518-519).<br>4. Muscle bar fill is flat (`src/components/gym/MuscleChart.tsx:86`) vs a gradient that fades out (bundle :763, :1459, :1563); the Logged pill is solid green, dropping the 22% `color-mix` wash (`src/components/gym/TodayCard.tsx:193`, bundle :1576-1577).<br>5. Pressed state is opacity 0.85 by default (`src/components/primitives/Pressable.tsx:53`) vs per-control values on 72 design elements: 14 at opacity 0.7, 10 at 0.6, 5 at 0.5, 8 `tile-pressed` fills, 6 `light-1` fills and 18 others; 11 use 0.85 and match. Controls that already set their own value include the log sheet (`src/app/gym/log-session.tsx:220`) and the schedule rows (`schedule.tsx:108`); the rest were not compared one by one.<br>6. Staggered bar transitions are absent, the bars get a static height (`exercise-progress.tsx:226-235`) vs a slow height transition delayed 45 ms per bar (bundle :333, :1719). |
| Tab shell / tab bar | ⚠️ PARTIAL (code re-checked, not verified on device) | Code re-checked against Gym bundle 7dc211f6; the Summary and Food bundles were not re-read in this pass. Matches, in `src/components/navigation/LumeTabBar.tsx` (bare line numbers) and `src/app/(tabs)/_layout.tsx`: three tabs and labels, in `t()` (`:107-111`, `:174`, `src/app/(tabs)/_layout.tsx:33-35`, bundle :948, :952, :956); Profile outside the bar; side inset 16, gap 10 and bottom offset 22 at insets up to 34 (`:37-38`, `:115-117`, `:147-154`, bundle :944); pill padding 5 and cell gap 2 (`:39-40`, `:162-164`, bundle :945); cell min height 52, content gap 2 and pill radius (`:41`, `:197-201`, bundle :946); drawn glyphs at 21 (`:44`, `:63-102`, bundle :947, :951, :955); caption 11/14 weight 500 on inactive labels, 600 on the active one, and their colours (`:207-211`, bundle :946, :948, :954, :956); active cell 0.055 black (`:43`, `:203`, bundle :954); inactive cells press to 0.55 and the active cell does not dim (`:42`, `:204`, bundle :946, :954); black 62 "+" with a 0.5 ring, shadow 0 12 28 at 0.26, drawn 27 glyph at stroke 2.6, pressed 0.86 with scale 0.96, and the 45° rotation at the fast duration and standard curve (`:34`, `:46-52`, `:132-138`, `:236-253`, bundle :959-960, :1652).<br>1. Bottom offset: an inset above 34 raises the bar, to stay clear of the home indicator (`LumeTabBar.tsx:115-117`) vs a fixed 22 (bundle :944).<br>2. Pill surface: BUILT (not verified): the blur fallback now fills with 0.62 white instead of `surface.card`, and native glass is unchanged (`src/components/navigation/LumeTabBar.tsx:58`, `:166`, bundle :945); not matched: intensity 50 vs blur 28 and no saturate 180, because `GlassSurface` fixes the intensity and `BlurView` has no saturation control (`src/components/navigation/GlassButtons.tsx:88`).<br>3. Pill shadow: BUILT (not verified): 0 12 32 at 0.14 on a wrapper outside the clipped glass (`LumeTabBar.tsx:53`, `:158`, bundle :945); `GlassSurface` overflow unchanged (`GlassButtons.tsx:73`, `:81`, `:88`). Rings added: 0.5 black at 0.05 outside and 0.5 white at 0.85 inside (`:54-57`, `:220-223`, bundle :945).<br>4. The active cell is still a pressable that emits `tabPress` and `tabLongPress` (`LumeTabBar.tsx:176-183`, `:186-189`) vs no press action in the design (bundle :954).<br>5. App-only: the "+" haptic (`LumeTabBar.tsx:228`), the Reduce Motion snap on the "+" rotation (`:134-135`) and the Reduce Transparency branch with its solid fill and border (`GlassButtons.tsx:24`, `:72-73`), where the outer ring still draws on the solid pill (`LumeTabBar.tsx:220-223`).<br>The add menu and its routes are in the "Food — FAB add menu" row. |

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

`src/app/gym/log-session.tsx` is 421 lines. It reads the day's plan through
`useToday` and opens a sheet titled **'How did it go?'**. The sheet has no form
fields. On a day with a plan it shows:

1. A subtitle built from the plan: `{name} · N exercises · about M min`, without the
   name when the template has none. Minutes come from the plan: 3.2 min a set, or a
   cardio exercise's planned minutes (`src/app/gym/log-session.tsx:61-62`).
2. **'Different weights'** / 'Same exercises, change the sets, reps or load' — opens
   `/gym/session` in `adjust` mode
3. **'Only some of it'** / 'Tick the exercises you actually did' — opens a second
   sheet in place, described below
4. **'Something else'** / 'Add an exercise that wasn't in the plan' — a full-width
   row that opens `/gym/session` in `picker` mode. The design's add sheet is not yet
   built (row 76 item 2, add path)
5. A primary **'It went as planned'** pill, captioned 'Logs {plan} exactly as
   scheduled', or 'Logs this session exactly as scheduled' when the template has no
   name

The second sheet is titled **'What did you do?'**, with the subtitle 'Untick anything
you skipped' (`src/app/gym/log-session.tsx:293-397`). Every exercise starts ticked, and
each row toggles. The pill reads 'Log N exercises', or 'Nothing ticked' and disabled
when none are left, over a caption saying what will be left out. Closing it returns to
the chooser and ticks everything again (`src/app/gym/log-session.tsx:192-195`).

Both pills call `logGymSession` with the duration derived from the logged exercises,
those exercises, and the ticked share of the plan as the completion rate
(`src/app/gym/log-session.tsx:135-142`). That posts the session, then each exercise to
`/exercises`, then `/complete`, as one queued sequence
(`src/lib/data/mutations.ts:186-197`), and raises the celebration card.

On a day already logged, the chooser does not render: the sheet shows a toast and goes
to the Gym tab (`src/app/gym/log-session.tsx:106-113`, `:149`).

The sheet has three other states. Loading shows a skeleton
(`src/app/gym/log-session.tsx:151-157`). A failed read shows `LoadFailedNotice` with Try
again (`src/app/gym/log-session.tsx:161-167`). A rest day, a day with no template, or a
template with no exercises redirects to `/gym/session` in `picker` mode
(`src/app/gym/log-session.tsx:172-174`), and closing the library with nothing added goes
to the Gym tab (`src/app/gym/session.tsx:565-569`).

The sheet collects no effort or energy. `GymSessionInput` has no field for either
(`src/lib/api.ts:709-714`, and the comment at `src/lib/data/mutations.ts:181-182`
says so outright).

Before the chooser was built, the sheet was 80 lines and asked four subjective
questions:

1. A static line: *'Everything here is optional — a one-tap log still counts.'*
2. **Duration** — a drag-thumb `SliderField`, 0–180 step 5, rendering 0 as 'Not set'
3. **Perceived effort (1–10)** — a ± `Stepper`, default 7
4. **Energy level (1–5)** — a ± `Stepper`, default 3
5. **Notes** — a multiline `TextField`
6. A black **'Log session'** pill

On save it called `logGymSession({durationMin, effort, energy, notes})`, which posted
`{date, duration_minutes, notes}` with **an empty follow-up step list** — so no
`/exercises` rows and no `/complete` call were written from this path. `effort` and
`energy` were collected by the UI and then dropped. **Two of its four controls
changed nothing on the server.**

## The differences, exhaustively

Numbers are kept from the 2026-09-13 list, because other rows cite them. Differences 15 and 21 are removed: the code no longer shows them. Design-side statements are carried over from that list.

1. **Purpose.** BUILT: the sheet records how the day's planned session went, as the design does (`src/app/gym/log-session.tsx:199-266`).
2. **Plan awareness.** BUILT: the sheet reads the day's plan through `useToday` (`src/app/gym/log-session.tsx:100`), and drops the chooser when nothing is planned (`src/app/gym/log-session.tsx:172`).
3. **Layout.** BUILT: a 2-column grid of 148pt tiles plus one full-width 88pt row, then a divider, pill and caption (`src/app/gym/log-session.tsx:40-41`, `:205-265`).
4. **Title.** BUILT: "How did it go?" (`src/app/gym/log-session.tsx:201`, `src/lib/i18n/locales/en.json:218`).
5. **Subtitle.** BUILT: the plan line, without the name when the template has none (`src/app/gym/log-session.tsx:202`).
6. **Primary button.** BUILT: "It went as planned" with its caption (`src/app/gym/log-session.tsx:261-264`).
7. **"Different weights" branch.** BUILT: the tile opens `/gym/session` in `adjust` mode, with every row's numbers open (`src/app/gym/log-session.tsx:177`, `:209`, `src/app/gym/session.tsx:122`).
8. **Tick-list branch — partial.** The tile opens a second sheet in place, "What did you do?", as in the design, with every exercise ticked and a dynamic "Log N exercises" label, and the commit carries the ticked share as its rate (`src/app/gym/log-session.tsx:139`, `:209`, `:293-397`, Gym bundle 7dc211f6 :422-454, :1635-1640). Remaining differences: the sheet's strings are hard-coded English (`src/app/gym/log-session.tsx:311`, `:318-319`, `:382`, `:388-392`); it has no per-exercise kcal tag (bundle :445, :1621), because `TemplateExercise` carries no burn field (`src/lib/api.ts:742-755`); a row's weight shows the planned unit vs always kg (`src/app/gym/log-session.tsx:319`, bundle :1624); and a cardio row's minutes fall back to sets × 3.2 when none are planned vs the sum of its segments (`src/app/gym/log-session.tsx:61-62`, `:318`, bundle :1623).
9. **"Something else" branch.** BUILT: the row opens `/gym/session` in `picker` mode, with the exercise library over it (`src/app/gym/session.tsx:179`, `:563`).
10. **Empty-day fallback — partial.** Design: opening "log" with nothing planned goes straight to the library, in place over the Gym day (Gym bundle 7dc211f6 :456, :1609, :1803). App: a rest day, a day with no template, or a template with no exercises redirects to `/gym/session` in `picker` mode, so the library opens with no extra tap, but over that route, not in place (`src/app/gym/log-session.tsx:172-174`). Closing the library with nothing added goes to the Gym tab (`src/app/gym/session.tsx:565-569`).
11. **Fields in the design, absent in the app:** remove set, add/remove segment, tempo, superset toggle, per-exercise notes. Rest seconds appears only in the picker's planned values (`src/components/gym/PlannedValuesForm.tsx:186`). BUILT: `/gym/session` saves rest seconds for picked exercises and planned rows: `inputFor` sends them (`src/app/gym/session.tsx:142`, `:149`, `:165`), and `plannedRows` fills them from `te.rest_seconds ?? undefined` (`src/app/gym/session.tsx:200`). Per-set kg and reps are entered but saved as one row at the top weight (`src/app/gym/session.tsx:151-164`). Exercise names, add set, cardio minutes, tick boxes and RPE are present (`src/app/gym/session.tsx:434-435`, `:486-503`, `:465`, `:418-422`).
12. **Fields in the app, absent in the design:** cardio distance, on an exercise with no parameter schema (`src/app/gym/session.tsx:79`, `:466-470`). The sheet has no effort or energy field.
13. **Duration.** BUILT: neither the sheet nor `/gym/session` asks. The sheet derives it from the template or the plan (`src/app/gym/log-session.tsx:116-118`), and `/gym/session` takes the template's estimate (`src/app/gym/session.tsx:364`).
14. **Slider.** The design contains no slider anywhere in the logging path. The sheet has none. `/gym/session` keeps one for RPE (`src/app/gym/session.tsx:495-503`), and `ParameterForm` uses one for a schema's slider fields (`src/components/gym/ParameterForm.tsx:224-231`).
16. **Number entry — partial.** BUILT on `/gym/session` and the picker's planned values: tapping a value docks `NumberEntryBar` with a "Done" pill (`src/app/gym/session.tsx:574-583`, `src/components/gym/PlannedValuesForm.tsx:191`). Two boxed fields remain: a schema's number fields (`src/components/gym/ParameterForm.tsx:258-265`) and planned cardio duration (`src/components/gym/PlannedValuesForm.tsx:177-183`).
17. **Confirmation — partial.** BUILT on the "It went as planned" pill: a modal celebration card with streak, Time, Volume and "Nice one" (`src/app/gym/log-session.tsx:271-287`). Calories shows a dash, because the sheet has no burn figure (`src/app/gym/log-session.tsx:278`), and the footnote is missing. `/gym/session` and Summary's card confirm with a toast instead (`src/app/gym/session.tsx:368`, `src/app/(tabs)/index.tsx:179`).
18. **Post-log state.** Design: "Logged and locked" with Edit → Save changes. App: a static "Logged today" pill (`src/components/domain/GymSessionButton.tsx:15-39`) and a logged card (`src/components/gym/TodayCard.tsx:199-201`), with no edit path. This stays an accepted deviation.
19. **Already-logged handling — partial.** BUILT: the chooser does not render on a logged day; the sheet shows the design's toast and goes to the Gym tab (`src/app/gym/log-session.tsx:106-113`, `:149`, `src/lib/i18n/locales/en.json:233`, Gym bundle 7dc211f6 :1656). Design: you edit the day (bundle :864-872). App: the logged card has no press handler or edit path, though it draws a chevron and the toast says "open it to edit" (`src/components/gym/TodayCard.tsx:115`, `:186-198`). A full workout finished from `/gym/session` on a logged day still writes a second session row, because that screen has no logged-day guard (`src/app/gym/session.tsx:363-366`, `src/lib/data/mutations.ts:173-178`). The app's routes to that screen close once the day is logged (`src/app/gym/log-session.tsx:106-113`, `src/components/gym/TodayCard.tsx:220-222`), so this needs the screen already open or an out-of-date flag.
20. **What is written.** BUILT: the pill commits the plan's exercises and a completion rate as one queued sequence (`src/app/gym/log-session.tsx:137-140`, `src/lib/data/mutations.ts:186-197`). `/gym/session` commits the same sequence with the collapsed rows in difference 11.
22. **Sheet height.** Design `max-height: 92%` with internal scroll; app `fitToContents` (`src/app/_layout.tsx:155`).
23. **Entry-point behaviour is inconsistent in the app.** The Gym tab pill and the `+` menu push `/gym/log-session` (`src/app/(tabs)/gym.tsx:166`, `src/components/navigation/LumeTabBar.tsx:262-265`), which shows the chooser only when today is not logged and has a plan (`src/app/gym/log-session.tsx:172`). The `+` menu still pushes the route on a logged day; the route then shows the toast and goes to the Gym tab without rendering the chooser (`src/app/gym/log-session.tsx:106-113`, `:149`), and the design shows no chooser on a logged day either (Gym bundle 7dc211f6 :1609, :1656). Summary's card calls `logGymSession()` with **no arguments and no sheet, only a toast** (`src/app/(tabs)/index.tsx:178-179`), a third, different behaviour.

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
| Gym tab → "Log gym session" → `/gym/log-session` | Yes | Yes — when today has a plan and is not yet logged, the "It went as planned" pill (`src/app/gym/log-session.tsx:233`) commits the plan's exercises (`src/app/gym/log-session.tsx:117-120`) |
| `+` menu → "Log gym session" → `/gym/log-session` | Yes | Same |
| Summary → gym card button → `logGymSession()` inline | Yes | Yes — **zero fields**, no UI |
| Gym tab → TodayCard → "Start workout" → `/gym/session` | **Conditional** | Yes — full exercise logging |
| Profile → Connected apps → Strava / WHOOP sync | Yes | Yes, server-side import |

`/gym/session` has these entry points:

- `src/components/gym/TodayCard.tsx:246` — "Start workout", opens the screen plain.
- `src/app/gym/log-session.tsx:185` — the three chooser tiles, shown when today has planned exercises; each opens the screen in its mode (`adjust`, `ticklist`, `picker`).
- `src/app/gym/log-session.tsx:158` — the empty state's action, shown when today has no planned exercises; opens the screen plain.
- `src/app/gym/log-session.tsx:112` — the "It went as planned" pill when the gym is already logged today; opens the screen plain.

The three log sheet paths all route through `openSession` (`src/app/gym/log-session.tsx:104-105`).

The Start workout path is the conditional one. `TodayCard` shows `LoadFailedNotice` with Try again when the
fetch failed (null). Its branches then run in this order: `already_checked_in`
first (renders `LoggedCard`), then `is_rest_day` or no template (the rest day card, a
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
- **Today / check-in** — `GET /api/gym/today` returns the template, exercises, `already_checked_in` and `session_id`. No UI surfaces `session_id`. `TodayCard` passes it to `LoggedCard` (`src/components/gym/TodayCard.tsx:200`), which uses it only to find the session row whose stats and chips it shows (`src/components/gym/TodayCard.tsx:162`), and no screen calls `api.gym.updateSession` (`src/lib/api.ts:1127`), so nothing can edit an existing session.
- **Parameterised cardio** — six schemas (`treadmill`, `cycling`, `rowing`, `stepping`, `intensity`, `jumpRope`) with `duration_minutes`, `speed_kmh`, `incline_percent`, plus `POST /api/gym/calories/preview` and `GET /api/gym/last-logged/{exercise_id}`.
- **Progress & patterns** — `GET /api/gym/progress/{exercise_name}`, `GET /api/gym/patterns`.

## The gap

| Logging method the design implies | Backend support? | Reachable UI today? |
|---|---|---|
| 1. Log as planned (one tap, verbatim) | **Yes** — sessions + exercises + complete; `GET /today` supplies the plan | **BUILT** (not verified) — label, placement and one-tap commit match, and `inputFor` now carries a cardio exercise's planned minutes in `notes` (`src/app/gym/log-session.tsx:58-66`) |
| 2. Log adjusted | **Yes** — same routes, `gym_exercises` columns | **Partial** — only inside `/gym/session`, opened by the conditional Start button or the log sheet's "Different weights" tile (`adjust` mode); tapping a value docks `NumberEntryBar` (`src/app/gym/session.tsx:567`) |
| 3. Log partial | **Yes** — `completion_rate`, `gym_adherence` | **Partial** — `/gym/session` checkboxes produce a rate; no tick-list sheet; the log sheet's "Only some of it" tile opens the screen in `ticklist` mode |
| 4. Log off-plan | **Yes** — exercise library | **Partial** — the log sheet's "Something else" tile opens `/gym/session` with `ExercisePicker` already showing (`src/app/gym/log-session.tsx:167`, `:185`, `src/app/gym/session.tsx:179`) |
| 5. Freestyle / no plan | **Yes** — a session needs no template | **No** — a response with no template shows the rest-day card, which has no Start button; `/gym/session` is still reachable from the log sheet's empty state (`src/app/gym/log-session.tsx:158`), a separate screen whose "Log an exercise" action opens `/gym/session` plain. The "Add an exercise" action is on `/gym/session` itself (`src/app/gym/session.tsx:541-542`): it opens the picker, and the session saves with no template |
| 5b. Custom exercise ("Add 'X' as a custom exercise") | **No** — every write path uses `exercise_id` into `exercise_library`; no create-exercise route | **No** |
| 6. Per-segment cardio (`Leg 1: 10 min @ 7 km/h`, "Add segment") | **Partial** — schemas capture ONE flat parameter set per exercise, not a list of segments (`parameters` is jsonb, so a list is storable but not validated) | **No** |
| 7. Session-level effort / energy (**app-only, not in the design**) | **No** — `rpe` is per-exercise; no session column, no API field | **No** — the log sheet has no effort or energy field and no input fields: it offers three tiles (`src/app/gym/log-session.tsx:164-168`), the "It went as planned" pill (`src/app/gym/log-session.tsx:233`) and, with no plan, a "Log an exercise" action (`src/app/gym/log-session.tsx:157-158`) |
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
3. **"This week" card** — only the header is the button (with `margin: -8.8px 0` so the 44pt target does not inflate the row). Segmented "In & out" / "Net" at `600 15/20`. Stat `1,899` + "kcal in per day". Chart 130px: three gridlines, **hardcoded axis labels "0" / "1,400" / "2,800"** (fixed `AX = 2800`), a dashed goal line at 98px, 12px paired bars (radii 6/6/3/3), unselected `opacity 0.28`, staggered 700 ms transitions. Net mode: ±800 axis, 16px bars over a **65px** span (min 4px). Day letters hardcoded **M T W T F S S**. Readout *"Sun 9 · in 1,240 · burned 1,864 · net −624 kcal"*.
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
`paddingHorizontal: 16`. BUILT, not verified: bottom padding fixed 158, card gap 14. Header
`FloatingHeader` default 82: EXACT (code re-checked, not verified on device). Top padding is still
`insets.top + space.md`, pending Isa. Pull-to-refresh. `FloatingHeader` has an SVG
gradient 0.86→0.20 and a `BlurView intensity 30` over the top 56%. `ProfileAvatarButton` at
`top: insets.top + 4` (≈63), right 16, showing **initials** when a name exists.

Order rendered: `PendingSyncBanner` → `EnergyBalanceCard` → `WeekEnergyCard` →
`WorkoutsWeekCard` → Macros card → `GymStatusCard` → `MorningBriefCard` → plan card.
The Steps card is missing, four non-design items are shown (`PendingSyncBanner`,
`GymStatusCard`, `MorningBriefCard`, plan card), and scope is Today only.

`EnergyBalanceCard`: Hardcoded strings wrapped in t() (BUILT, not verified).

Card chrome, `CardHeaderRow` tokens, ring geometry, chart constants
(`CHART_H 130`, `GUTTER 46`, `BAR_W 12`, `DIM 0.28`, `NET_BAR_W 16`, radii 6/6/3/3),
pip metrics (32/6/`radius.md`, `600 12/16`) and the macro row stack all match the
design value for value.

### Differences

1. **The Steps card is not built** (`src/app/(tabs)/index.tsx:134-138`, comment only). The design has it between This week and Workouts: a step count, "of 10,000 goal · N kcal burned" and a 52px 7-bar chart. The app has no step data, and `src/__tests__/summaryNoFabrication.test.ts:28` asserts the card is not rendered. Code re-checked against Summary bundle 185bb533, not verified on device.
2. **Three cards the design does not have:** `GymStatusCard`, always shown (`src/app/(tabs)/index.tsx:174`, kept because it is the one-tap session log); `MorningBriefCard`, null when there is no brief (`index.tsx:184`, `src/components/ai/MorningBriefCard.tsx:98`); the plan card, only when a plan exists (`index.tsx:190`). Code re-checked against Summary bundle 185bb533, not verified on device.
3. **`PendingSyncBanner` has no design counterpart.** It sits between the title block and Energy balance (`src/app/(tabs)/index.tsx:132`) and is null when nothing is queued (`src/components/display/PendingSyncBanner.tsx:21`). Code re-checked against Summary bundle 185bb533, not verified on device.
4. **Day scoping across cards does not exist.** In the design, the week and step bars set one `gDay`, which rescopes Energy balance, Steps, Macros and the readout. In the app, `picked` is private to `WeekEnergyCard` (`src/components/domain/WeekEnergyCard.tsx:53`, `:160`) and changes only that card; Energy balance is always today (`src/app/(tabs)/index.tsx:139`, `src/components/domain/EnergyBalanceCard.tsx:114`) and Macros is fixed to "Today" (`index.tsx:149`). Code re-checked against Summary bundle 185bb533, not verified on device.
5. **Detail views are four separate routes, not one in-screen view.** The design has one view with five variants, drawn over the tab at z-index 80 with `lumePush`. The app pushes `/energy` (`src/components/domain/EnergyBalanceCard.tsx:131`, `:148`), `/dashboard/week` (`src/components/domain/WeekEnergyCard.tsx:59`), `/dashboard/training` (`src/components/domain/WorkoutsWeekCard.tsx:33`) and `/dashboard/nutrition` (`src/app/(tabs)/index.tsx:145`). The steps variant has no route. Code re-checked against Summary bundle 185bb533, not verified on device.
6. **The streak celebration modal is not on Summary.** The design has a modal with a flame, the count, "day streak", "Gym logged — streak extended" and a "Keep going" button; this bundle never sets `gCele` to true, so it does not show what opens it. The app shows only a toast with that sentence (`src/app/(tabs)/index.tsx:179`). A separate modal exists in the log flow (`src/app/gym/log-session.tsx:242`) and was not compared. Code re-checked against Summary bundle 185bb533, not verified on device.
7. **Loading, error and empty states the design does not have.** Streak: skeleton and `LoadFailedNotice` (`src/app/(tabs)/index.tsx:109`, `:114`). Macros: skeleton, `LoadFailedNotice` and "Not tracked" (`index.tsx:152`, `:154`, `src/components/domain/MacroBars.tsx:53`). Energy balance: skeletons, error and no-data line, body-stats lines, "No calorie goal set", "No burn target set" (`src/components/domain/EnergyBalanceCard.tsx:122`, `:135`, `:164`, `:184`, `:191`). This week: skeleton and error or no-days line (`src/components/domain/WeekEnergyCard.tsx:74`, `:77`). Workouts: loading and error line (`src/components/domain/WorkoutsWeekCard.tsx:28`). Code re-checked against Summary bundle 185bb533, not verified on device.
8. **No entrance or value animations on the Summary tab or its cards.** Design: page `lumeFade` 260 ms; rings 1100 ms; bars 700 ms with a 60 ms stagger and opacity 180 ms; macro widths 1100 ms; pips 260 ms; segment fill 180 ms. App: values are drawn in their final state (`src/components/domain/EnergyBalanceCard.tsx:49`, `src/components/domain/WeekEnergyCard.tsx:160`, `src/components/domain/WorkoutsWeekCard.tsx:63`, `src/components/display/ProgressBar.tsx:29`, `src/app/(tabs)/index.tsx:81`). Code re-checked against Summary bundle 185bb533, not verified on device.
9. **Pressed states differ.** Design: Energy balance, Steps, Workouts and Macros change fill to `light-1`, and the This week header has no pressed style. App: the three built cards and the This week header all use opacity 0.85 (`src/components/primitives/Pressable.tsx:53`), the cards through `src/components/display/Card.tsx:52` and the header at `src/components/domain/WeekEnergyCard.tsx:57`. Code re-checked against Summary bundle 185bb533, not verified on device.
10. **The burned ring is never filled.** Design: a blue arc for burned against a fixed 2,400 target. App: `fraction={0}` (`src/components/domain/EnergyBalanceCard.tsx:173`), so only the grey track draws (`:47-48`), because no burn target exists in the app's data (`:172`). Code re-checked against Summary bundle 185bb533, not verified on device.
11. **"Burned" has no target and a different sub-line.** Design: "/ 2,400" and "78% of target". App: no target and "No burn target set" (`src/components/domain/EnergyBalanceCard.tsx:187-192`), and "—" when burn is unknown (`:190`). Code re-checked against Summary bundle 185bb533, not verified on device.
12. **Energy balance net sign.** BUILT, code re-checked, not verified on device. The net value now shows "+" for 0 and above and `−` below 0, as in Summary bundle 185bb533 (`src/components/domain/EnergyBalanceCard.tsx:155`).
13. **Scope word is fixed.** Design: "Today" or the picked day's short name on Energy balance, Steps and Macros. App: always today on Energy balance (`src/components/domain/EnergyBalanceCard.tsx:114`) and Macros (`src/app/(tabs)/index.tsx:149`). Code re-checked against Summary bundle 185bb533, not verified on device.
14. **Energy balance hero stat.** BUILT, code re-checked, not verified on device: letter spacing changed from 0 to -1 and baseline gap from 8 to 7 (`src/components/domain/EnergyBalanceCard.tsx:153-154`).
15. **Week chart axis scales with the data.** In & out: `axisMax` with a 400 step vs a fixed 0, 1,400, 2,800 (`src/components/domain/WeekEnergyCard.tsx:87`, `:131`). Net: `axisMax` with a 200 step vs a fixed −800, 0, +800 (`:88`, `:131`). Bars and the goal line use the same scale (`:144`, `:169-170`, `:175`, `:178`). The goal line is hidden when there is no goal (`:141`). Code re-checked against Summary bundle 185bb533, not verified on device.
16. **Net bar minimum height** 5 vs 4 (`src/components/domain/WeekEnergyCard.tsx:34`, used at `:175`, `:178`). The 65 span matches (`:27`). Code re-checked against Summary bundle 185bb533, not verified on device.
17. **Segmented control.** Label 500 17/24 vs 600 15/20 (`src/components/forms/SegmentedField.tsx:105`). Track padding and gap 4 vs 3 (`:64`, `:65`). Segment height 48 vs 44, because of 12 vertical padding (`:89`). Code re-checked against Summary bundle 185bb533, not verified on device.
18. **Header button has no negative margin.** Design: 44 min height with -8.8 top and bottom margin. App: 44 min height, no margin (`src/components/domain/WeekEnergyCard.tsx:58`), so the header takes 17.6 more height. Code re-checked against Summary bundle 185bb533, not verified on device.
19. **Day letters follow a rolling window.** Design: a fixed Monday-first row, M T W T F S S. App: the last 7 days ending today, so the first letter changes daily (`src/components/domain/WeekEnergyCard.tsx:37`, `:196`). The Workouts card is Monday-first (`src/lib/data/summaryCards.ts:45`), so the two rows can disagree. Code re-checked against Summary bundle 185bb533, not verified on device.
20. **Missing and zero values.** The design has no missing case. App: a missing burn or net draws no bar (`src/components/domain/WeekEnergyCard.tsx:170`, `:175`, `:178`) and reads "—" in the stat (`:108`) and readout (`src/lib/data/summaryCards.ts:39`). A 0 In & out value draws no bar (`WeekEnergyCard.tsx:41`), where the design draws its 5 minimum. Code re-checked against Summary bundle 185bb533, not verified on device.
21. **Workouts card count and sub-line.** "of 5 sessions" vs "sessions" or "session" (`src/components/domain/WorkoutsWeekCard.tsx:45`). "N kcal burned in the gym" vs minutes trained (`src/lib/data/summaryCards.ts:67-72`). The app has no weekly target and sessions carry no calories (`src/components/domain/WorkoutsWeekCard.tsx:5-7`). Stat letter spacing 0 vs -1 (`:41`), baseline gap 8 vs 7 (`:40`). Code re-checked against Summary bundle 185bb533, not verified on device.
22. **Macros header glyph.** One `circle.grid.2x2.fill` symbol in the protein colour vs four circles in the four macro colours (`src/app/(tabs)/index.tsx:149`). Code re-checked against Summary bundle 185bb533, not verified on device.
23. **Fibre can read "Not tracked · target n g" with an empty bar** when nothing logged today has a fibre figure (`src/components/domain/MacroBars.tsx:51-54`, `:67`). The design always shows a number and a filled bar. Code re-checked against Summary bundle 185bb533, not verified on device.
24. **Streak line.** A button that opens `/gym/streak` vs static text (`src/app/(tabs)/index.tsx:116-117`). Copy "14 day streak" vs "14-day streak" (`src/lib/i18n/locales/en.json:295-296`). The flame pulses vs static (`src/components/display/StreakFlame.tsx:33-37`) and greys at 0 (`:44`), where the design has no zero state. Code re-checked against Summary bundle 185bb533, not verified on device.
25. **Eyebrow.** Letter spacing changed from 1 to 1.1: built, code re-checked, not verified on device (`src/app/(tabs)/index.tsx:96`). Still different: the date is the real date in the device locale vs a fixed "Sunday 9 August" (`:98`): in Node, en-GB and en-AU give the design's format, en-US gives "Sunday, August 9". Device output not checked.
26. **Title.** Letter spacing -0.6 and right padding 52: built, code re-checked, not verified on device (`src/app/(tabs)/index.tsx:100`).
27. **Spacing.** Card gap 14 and bottom padding 158 are EXACT (code re-checked, not verified on device) (`src/app/(tabs)/index.tsx:85`, `:86`). Title block gap 2, bottom padding 6 and side padding 4: built, code re-checked, not verified on device (`:92`). Streak row gap 6 and top padding 6: built, code re-checked, not verified on device (`:121`).
28. **Header strip.** Height 82 and gradient 86 to 20 are EXACT (code re-checked, not verified on device) (`src/app/(tabs)/index.tsx:222`, `src/components/navigation/FloatingHeader.tsx:26`, `:71-72`). Blur intensity 30 vs blur 18 with saturate 1.4 (`:80`). Blur stops hard at 56% and the tint is not masked, where the design fades both from 56% (`:29`, `:81`). The Reduce Transparency branch has no design counterpart (`:42`). Code re-checked against Summary bundle 185bb533, not verified on device.
29. **Profile button.** Top `insets.top` + 4, so 51, 63 and 66 at insets of 47, 59 and 62, vs a fixed 64 (`src/components/navigation/ProfileAvatarButton.tsx:31`). Shows initials when there is a name, where the design always shows the person glyph (`:42-43`). Surface: native glass, or blur intensity 50 on an opaque `surface.card` fill, with no shadow (`src/components/navigation/GlassButtons.tsx:74-98`), vs white at 74%, blur 20, saturate 180% and a shadow (Summary bundle 185bb533 :215; code re-checked, not verified on device). Size 44, right 16 and glyph 22 match. Code re-checked against Summary bundle 185bb533, not verified on device.
30. **Pull-to-refresh has no design counterpart** (`src/app/(tabs)/index.tsx:89`). Code re-checked against Summary bundle 185bb533, not verified on device.

### Re-checked against Summary bundle 185bb533 (code re-checked, not verified on device)

- Summary — Macros detail (summary table): differences listed in the row.
- Summary (Home) tab (summary table): differences listed in the row.
- Difference 26, title: still different.
- Difference 27, spacing: card gap and bottom padding BUILT, not verified; title block and streak row still different.
- Difference 28, header strip: height EXACT (code re-checked, not verified on device); blur approximation and Reduce Transparency branch remain.

---

# Gym — main tab and sub-screens

## Gym — main tab: chrome, scroll and card order — ⚠️ PARTIAL MATCH (code re-checked, not verified on device)

**Design order:** date eyebrow + "Gym" title → streak strip → month heatmap →
today's session card → **"Log this session" pill** → Muscle focus (3D body) →
"My schedule" card. That is the entire tab. Cards are white, `radius.xl` 28,
`shadow.sm`, `padding: space.lg` **16** (the streak strip is `12px 16px`).
Content `padding: 70px 16px 158px`, `gap: 14px`, entrance `lumeFade`.

**App order** (`gym.tsx:108-182`): eyebrow + title → failed-load notice → streak strip → calendar card → `TodayCard` → `GymSessionButton` → `MuscleChart` → `MyScheduleCard`
→ `GymPatternsCard` → `SettingsList` "Training".

**Matches:** card order from the title block through "Log this session", Muscle focus and My schedule (`src/app/(tabs)/gym.tsx:108-171`, bundle :30-150); 16 page sides, 14
card gap and 158 bottom padding (`gym.tsx:99-100`, `:105`, bundle :28); `lumeFade` at 260 ms with an 8 offset (`gym.tsx:34-36`, `:105`, bundle :13, :28); title block:
eyebrow `label` with 1.1 tracking and 26 minimum height, 0 gap, 4 side padding, title -0.6 tracking and 52 right padding (`gym.tsx:108-115`, bundle :30-32); padding 12 / 16
on the streak strip and 16 on the calendar, `TodayCard` and `MuscleChart` (`gym.tsx:130`, `:150`, bundle :35, :42, :72, :104); header strip height 82 and its gradient
(`gym.tsx:186`, `src/components/navigation/FloatingHeader.tsx:26`, `:71-72`, bundle :26); the Log pill's visibility rule (`gym.tsx:165`, bundle :1603).

**Differences:** (1) `GymPatternsCard`: app-only, as no design module has its copy (`src/app/(tabs)/gym.tsx:172`). It uses `Card`'s default 20 padding, a 16 inner gap and a
17 tinted glyph (`src/components/gym/GymPatternsCard.tsx:85-87`), where the design's other Gym cards use 16, 12 and no glyph (bundle :42, :104-106). (2) Training list:
app-only, with My schedule, My workouts, Apply a streak freeze and Session history rows (`src/app/(tabs)/gym.tsx:174-182`); the design's tab ends on the My schedule card
(bundle :150-168). (3) Failed-load notice: app-only (`gym.tsx:122`). (4) Pull-to-refresh: app-only (`gym.tsx:103`). (5) Top padding: `insets.top` + 12, so 59, 71 and 74 at
insets of 47, 59 and 62 (`gym.tsx:98`), vs a fixed 70 (bundle :28). (6) Date eyebrow: always today, in the device locale (`gym.tsx:85-89`), vs the selected day as
"{weekday} {date} {month}" (bundle :31, :1498). (7) Header strip blur: intensity 30 stopping at 56%, with an unmasked tint (`FloatingHeader.tsx:29`, `:80-81`), vs blur 18
with saturate 1.4, both fading from 56% (bundle :26). The Reduce Transparency branch is app-only (`FloatingHeader.tsx:42`). (8) Profile button: top `insets.top` + 4, so 51,
63 and 66 (`src/components/navigation/ProfileAvatarButton.tsx:31`), vs a fixed 64; initials when a name exists (`:42-43`) vs the person glyph; native glass or blur 50 with
no shadow vs white at 74%, blur 20 and a shadow (bundle :898). (9) Streak strip: a button (`gym.tsx:128`) vs no press, and a 12 gap (`gym.tsx:132`) vs 11 (bundle :35).

Needs Isa: whether `GymPatternsCard` keeps 20 padding or moves to 16.

## Gym — streak strip — 🔨 BUILT (not verified)

**Design:** one non-interactive row — a 20px static flame in `category-streak`, the
count at `700 20/26` rounded, "day streak" at `500 17/24`, and a right-aligned
footnote *"23 sessions · 2 freezes"*. Padding `12px 16px`, gap 11.

**App** (`gym.tsx:124-140`): one row inside a **tappable** `Card` pushing
`/gym/streak` — a 20pt `StreakFlame`, the count (`statSmall`, `700 20/26` rounded)
and "day streak" (`bodyMedium`, `500 17/24`). Padding `12px 16px`. `src/app/gym/streak.tsx:88-90` shows Longest, Sessions
and Freezes as separate stats, and no code produces the text "23 sessions · 2 freezes".

**Differences:** tappable vs display-only, kept as an accepted deviation (`src/app/(tabs)/gym.tsx:127`, Gym bundle 7dc211f6 :35); **the
right-aligned summary footnote is built and hidden until gym data has loaded**, a deliberate deviation (`gym.tsx:140-144`, bundle :39, :1501); gap 12 vs 11 (`gym.tsx:132`, bundle :35). Parked:
**the flame pulses infinitely** (`scale 1 → 1.14`) unless Reduce Motion is on, where the design's is static (`src/components/display/StreakFlame.tsx:29-37`, bundle :36); the
app greys the flame at streak 0, with no design counterpart (`gym.tsx:132`, `StreakFlame.tsx:44`); different flame artwork
(SF Symbol vs a bespoke evenodd path) (`StreakFlame.tsx:44`, `src/components/primitives/Icon.tsx:70`, bundle :36).

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
   **This is one of the design's two routes into the day-detail view, with the session card, and both are gone.**
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

**Design:** the whole card is one tap target opening the session; a header row
(11px status dot, title, sub, a state pill, a 14px chevron) over a **4-up stats
grid** (Duration / Calories / Volume / Sets) and a wrapped row of exercise chips.

**App** (`TodayCard.tsx`): four rendered states (loading, logged, rest day, planned) plus `LoadFailedNotice` with Try again on load failure.
The logged, rest-day and planned states have a header row. The logged state adds a chevron and, when the logged session has exercises, a 3-up grid (Duration / Volume / Sets) and exercise chips from that session (BUILT, not verified). The planned state adds chips and a **"Start workout"** button. Every state's card,
including loading, uses padding 16 (`padded={false}`, `space.lg`); the loading state differs from the design.

**Matches:** card surface, radius, shadow, padding 16 and gap 16 (`src/components/gym/TodayCard.tsx:186-187`, bundle :72); dot 11 and its colours, header gap 10 and min height 34, title gap 1, title and sub-line type (`:24-27`, `:102-111`, bundle :73-77, :1569); pill padding 3/9, type 600 11/15, labels and the Planned and Rest fills (`:28-29`, `:36`, bundle :79, :1575-1578); stat value rounded 600 16/21, value-to-label gap 1, grid gap 8 and labels (`:32`, `:38-42`, `:153`, bundle :83-87); chip min height 28, padding 10, type 500 12/16, row gap 6, and the first three chips plus "+N more" (`:30-31`, `:37`, `:72`, bundle :91-93, :1580-1581); rest-day copy (`:229-230`, bundle :1570, :1573); chevron size and colour (`:115`, bundle :80).

**Differences:**

1. The card is not tappable in any state, with no `onPress` (`TodayCard.tsx:186`, `:226`, `:248`) vs one tap target opening the session, with a `light-1` pressed fill (bundle :72, :1582).
2. Chevron on the logged state only, on a card that cannot be tapped (`TodayCard.tsx:115`, `:194`) vs every state (bundle :80); glyph is an SF Symbol vs a 2.4-stroke path (bundle :80).
3. Logged grid is 3-up with no Calories cell, because session rows carry no calories, which needs a backend change (`TodayCard.tsx:153-163`) vs 4-up (bundle :83, :1584-1589). A missing duration or volume reads as a dash, which is app-only (`:155`, `:159`). Sets counts every exercise's sets (`:143`) vs strength only (bundle :1188). The grid and chips appear only once `useGymRange(1)` finds the session (`:182-183`, `:196`) vs whenever the day has exercises (bundle :1579).
4. Planned state has no stats grid (`TodayCard.tsx:247-270`) vs the grid whenever a session has exercises (bundle :82-90, :1579).
5. "Start workout" inside the card is app-only (`TodayCard.tsx:267`) vs no button in the card (bundle :72-97).
6. Planned sub-line drops the muscle-group phrase (`TodayCard.tsx:245`, bundle :1573), and the design's "ready" wording for a drafted day has no counterpart.
7. Logged sub-line kcal is the day's total exercise burn and is left out when none is recorded (`TodayCard.tsx:181`, `:191`) vs the session's kcal, always shown (bundle :1571-1572).
8. Logged pill is solid green (`TodayCard.tsx:193`) vs a 22% wash into white (bundle :1576-1577); the token awaits Isa.
9. The card always shows today (`TodayCard.tsx:204`) vs following the selected day (bundle :1571-1572).
10. App-only: loading skeletons (`TodayCard.tsx:206-215`) and `LoadFailedNotice` with Try again (`:218`), an accepted deviation; the notice's button keeps `minTapTarget={false}` (`src/components/display/LoadFailedNotice.tsx:47`); a long stat value shrinks to fit (`:124`) vs staying on one line at full size (bundle :86).

## Gym — the "Log this session" CTA — ❌ DIFFERENT

**Design:** `showLogCta = !past && !logged && exList.length > 0` — a black 52pt pill
reading **"Log this session"** with a trailing 15px chevron-**up** at 0.7 opacity
(signalling a sheet), sitting directly under the session card, opening the
"How did it go?" sheet in place.

**App (BUILT, not verified):** renders directly under `TodayCard`, only when
`streak.gymLoggedToday` is false and today's workout has exercises; otherwise
nothing renders (`src/app/(tabs)/gym.tsx:159-161`). Copy **"Log this session"** with a
trailing 15px chevron-up at 0.7 opacity (`src/components/domain/GymSessionButton.tsx`);
pushes the `/gym/log-session` route, presented as a sheet, instead of opening a sheet
in place.

Also: the design's `+` menu refuses to re-open the sheet when today is already
logged, toasting *"Today is already logged — open it to edit or add something
extra"*. The app's `+` menu still pushes the route on a logged day
(`src/components/navigation/LumeTabBar.tsx:262-265`); the route then shows that toast
and goes to the Gym tab without rendering the chooser
(`src/app/gym/log-session.tsx:106-113`, `:149`).

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
`elevated` (white, `radius.xl` 28, `shadow.sm`). Neither screen's own code uses a deprecated alias (the full list is in item 6 of the token drift section):
`gray500` and `black` are main palette tokens (`src/lib/design/tokens.ts:24`, `:33`),
the old aliases at `history.tsx:41` and `streak.tsx:55` are now `light1`, and
`history.tsx:55` uses `color.label` on purpose, because `tokens.ts` asks for intent
names. The history list renders `session.date` as "Today", "Yesterday" or a weekday, day and month (`history.tsx:45`, `src/lib/data/mappers.ts:197-216`).
The streak screen labels a stat "Sessions" (`streak.tsx:89`). The main-tab strip shows only the streak count (`src/app/(tabs)/gym.tsx:131-139`), and the design's strip reads "23 sessions · 2 freezes" (Gym bundle 7dc211f6 :39, :1501).

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

**Differences:** code re-checked; the list is in the summary table row.

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
The swipe-delete dialog title is built and translated (es and fr are unreviewed drafts). The trash-button dialog now uses translated keys.

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

**Matches:** active-cell fill `rgba(0,0,0,0.055)` vs
`rgba(0,0,0,0.055)`; active label weight 600 vs 600;
pill padding 5 vs 5; cell gap 2 vs 2; container gap 10 vs 10;
pill shadow 0 12 32 at 0.14 on a wrapper View in `LumeTabBar.tsx` vs 0 12 32 at 0.14, two 0.5 rings vs two 0.5 rings, and 0.62 white fill vs 0.62 white, on the blur fallback only, with the inner ring hidden under Reduce Transparency (BUILT, not verified); fill and shadow match only as numbers, not as rendered pixels; the matching values in this list are matches, and the blur gap in row 118 item 2 is still open;
plus glyph 27 vs 27; tab icons 21 vs 21 (and the food icon is
a drawn bowl vs the design's bowl); menu radius 18 vs 18; scrim `0.10` vs `0.10`;
menu row padding 18 vs 18; divider 0.5px `rgba(0,0,0,0.10)` inset 18 vs `0.5px rgba(0,0,0,0.10)` inset 18.

**Differences:** the active cell is still a button in the app; **menu panel solid white vs `rgba(255,255,255,0.94)` + blur** (documented in `AddMenu.tsx` as deliberate);
**the already-logged branch is in `log-session.tsx:108-113`, not the menu**; and "Log food" pushes `/food/add` where the design switches tab.

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
5. The design writes `1.1px` eyebrow and `-0.6px` title tracking. The main tab matches
   (`src/app/(tabs)/gym.tsx:110`, `:114`) and `schedule.tsx:195` uses 1.1. `Screen`
   now sets eyebrow tracking 1.1 and title tracking -0.6 (`src/components/navigation/Screen.tsx:122`,
   `:127`); `new-template.tsx:158` and `streak.tsx:39` now use 1.1.
6. **No deprecated grey alias is used under `src/app/gym`.** The greys still used
   there, `gray500` and `gray400`, are main palette tokens
   (`src/lib/design/tokens.ts:33-34`). `history.tsx:41` and `streak.tsx:55` now use
   `light1`, and `history.tsx:55` uses `color.label` on purpose. The aliases are defined
   at `tokens.ts:50-56` with the same hex values as the tokens they replace. Elsewhere,
   38 lines in 22 files still use them:
   - Screens: `src/app/dashboard/plan.tsx:58, 66, 86, 119, 122`, `src/app/food/barcode-scan.tsx:170`, `src/app/food/history.tsx:140`, `src/app/food/label-scan.tsx:241, 247, 326`, `src/app/food/photo-capture.tsx:138, 184`, `src/app/onboarding/cuisine.tsx:61`, `src/app/onboarding/body-type.tsx:40, 58`.
   - Forms: `src/components/forms/MultiSelectField.tsx:63`, `FieldShell.tsx:28`, `TextField.tsx:31, 51`, `SliderField.tsx:110, 120, 135`, `Button.tsx:32, 34`, `Stepper.tsx:50`.
   - Navigation: `src/components/navigation/BottomSheet.tsx:152`, `GlassButtons.tsx:24`, `Screen.tsx:147`.
   - Display and other: `src/components/display/ProgressBar.tsx:18`, `Avatar.tsx:44, 46, 52`, `LoadingSkeleton.tsx:47, 75, 96`, `src/components/domain/MacroBars.tsx:102`, `src/components/onboarding/OnbScaffold.tsx:71`, `OptionCard.tsx:68`.
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
**One-line reason:** The design's calories card is goal-relative (remaining kcal + progress bar + four macro bars) and the log has no search field; the app ships a "logged total" card with macro bars that read their targets from `useGoals()`, the calorie goal not used yet, the 12px calorie bar and 'left today' figure still missing, four columns including Fibre, plus a persistent search field that re-purposes the whole screen.

I verified the core of this myself. Design: `hLeft: fmt(Math.abs(hLeftN))`,
`hLeftWord: 'kcal left today' | 'kcal under goal' | 'kcal over goal'`,
`hEatenLine: fmt(hEaten) + ' eaten · goal ' + fmt(goal) + ' kcal'`, macro targets
`T = { p:150, c:230, f:70, fb:30 }`. App (`food.tsx:660-703`): hero is
`formatNumber(kcalToDisplay(total))` + `${energyUnit} logged`, four columns
(Protein/Carbs/Fat/Fibre); macro bars are 6px `ProgressBar`s filled from
`useGoals()` (BUILT, not verified on device). Each logged row shows a macro line
from `food.rowMacros`, with macros rounded. Still different: the 12px calorie bar
and the "left today" figure are missing.

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
rendered height 66 above `minHeight: 52` (`WeekStrip.tsx:90-96`), white (not transparent) when unselected, day number in
`bodyMedium` 17/24 display, and a **hollow ring** on today when unlogged.

### Differences

1. Hero means a different number — remaining vs total logged.
2. **The calorie goal is not used yet.** The macro bars read their targets from `useGoals()`, but the 12px calorie bar and "left today" figure are still missing.
3. **No progress bar.**
4. **No "1,240 eaten · goal 2,100 kcal" line.**
5. **No day label** in the card header.
6. The CaloriesCard has four columns, including Fibre, which is summed from the logged rows on screen; a row with no fibre figure adds 0.
7. Per-macro mini bars: design and app both use 6px bars against targets (BUILT, not verified on device); the design animates the fill over 700ms and `ProgressBar` has no animation.
8. Macro column order: design and app both use bar → name → value (BUILT, not verified on device).
9. **The card is hidden when the day is empty**; the design always renders it.
10. **A search field exists on the log that the design does not have.**
11. **Searching replaces the day view** — in the design search is a modal sheet.
12. **The date eyebrow is not the calendar opener** (the app moved that to the month label).
13. **A month label exists that the design does not have.**
14. Eyebrow string is locale-dependent vs the design's fixed format.
15. **Week arrows are in the wrong place and size** — 44pt, stacked above at the right, vs 28px inline flanking the chips.
16. Forward-arrow rule: design dims to 0.35; app fully disables.
17. **Unselected chips are white, not transparent**, and there is no today fill.
18. Chip height is a gap: design fixed 60 (bundle :44) vs app rendered 66, above its 52 minimum (8 + 8 padding, 14 caption, 24 number, 4 dot, 4 + 4 gaps, `src/components/food/WeekStrip.tsx:90-96`); day number `bodyMedium` display vs `600 15/19` rounded; chip gap 4 vs 2.
19. **A hollow ring on today is invented.**
20. Future days: `opacity 0.4` on the whole chip vs a tertiary-label foreground.
21. **No photo tile on rows.**
22. Row name 17/24 w400 vs `500 15/20`; row height 60 vs 58.
23. **Hairline separators are an app invention**; the design separates rows by padding only, with a `light-1` pressed fill and an 8px negative inset.
24. Meal header dot 12 vs 17; `+` disc 28/16px glyph vs 30/15px.
25. Empty-meal row: a separate card piece vs an inline row; *"Add to Breakfast"* vs *"Add to breakfast"*; a 20px `add-circle-outline` vs a bare 15px `+`; height 56 vs 44.
26. Units are `energyUnit` (kcal **or kJ**) throughout; the design is kcal-only.
27. Elements with no design counterpart: `AnomalyBanner`, `LoadFailedNotice`, `ScanFeedbackPrompt`, `ScanReviewCard`, `ScanFailedCard`, the "Meal history" footer, the "Add custom food" footer, the day empty state, both error states.
28. Swipe-to-delete with confirm, and long-press-to-delete a whole meal — no design counterpart. The swipe confirmation is now date-neutral and translated (BUILT, not verified).
    The `SwipeableRow` confirm buttons and the swipe action label are now translated. `src/app/food/saved.tsx` strings are translated (unsave dialog, toasts, search, empty state, row detail and VoiceOver labels); es and fr are unreviewed drafts. The swipe title in `gym/new-template.tsx` is still English (BUILT, not verified).
29. Pending-row copy and treatment differ (grey skeletons vs AI-tinted spinner and copy); a "failed" row state exists only in the app; the `"Confirm meal"` pill is absent.
30. Page values: BUILT, not verified: bottom padding 158 and block gap 14 set in `src/app/(tabs)/food.tsx`. Header height 82: EXACT (code re-checked, not verified on device).

## Food — Food detail sheet

**Verdict:** ⚠️ PARTIAL
**One-line reason:** PARTIAL: the design is a tap-a-number → slim keyboard-bar sheet with a 96px photo, serving chips and a 2×2 macro grid; the app has no photo, and a sheet that opens with locked values shows a read-only macro list until its "Edit values manually" toggle; editing mode is a macro grid of tappable tiles (`src/app/food/detail.tsx:615-656`), and tapping a value docks `NumberEntryBar` (`src/app/food/detail.tsx:713`).

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
label + value) with a pencil **"Edit values manually"** toggle, or, in editing mode,
a two-column grid of tappable macro tiles (`src/app/food/detail.tsx:615-656`);
a `Meal` segmented control **only when a slot is known**; the CTA; *"Save to my
foods"*; and a destructive **"Delete item"** behind an `Alert` confirm.

### Differences

1. **Slim keyboard edit bar in editing mode only** — `src/app/food/detail.tsx:713` docks `NumberEntryBar` (`src/components/common/NumberEntryBar.tsx`); on a sheet that opens with locked values, it is reachable only after "Edit values manually" (`src/app/food/detail.tsx:399`, `:600`).
2. Numbers are typed through `NumberEntryBar` (`src/app/food/detail.tsx:713`), captioned from `PADS` (`src/app/food/detail.tsx:64`).
3. **"Edit values manually" is an app-invented mode**; the design has no read-only/editable distinction. 'Edit values manually' translated for visible text and VoiceOver, BUILT, not verified.
4. **Values are tap-to-edit in editing mode only:** the grams chip, the kcal readout and the macro tiles (`src/app/food/detail.tsx:512-533`, `:552`, `:615-656`). A sheet that opens with locked values shows them read-only until "Edit values manually" (`src/app/food/detail.tsx:399`, `:600`).
5. No blinking caret affordance; the grams chip appears in editing mode only, and its pencil glyph hides while it is being edited (`src/app/food/detail.tsx:512-533`).
6. **No 96×96 photo tile.**
7. The sheet title is the mode, not the food — so a logged row shows its name only inside an editable field. The "Edit item" and "Rename food" titles are translated: BUILT, not verified. BUILT, not verified: Save name and Save changes translated. BUILT, not verified: the Edit food title and Save changes button now use t(). BUILT, not verified: the search and barcode "Add to {slot}" buttons now use t().
8. **A `Name` field exists that the design does not have**; the design offers no rename here.
9. No brand/density sub-line for logged rows (*"Logged today"*).
10. **No AI provenance note.**
11. Macro layout: a vertical list until *"Edit values manually"* is tapped, then two columns of tappable tiles (`src/app/food/detail.tsx:579-585`, `:615-624`), vs the design's 2×2 tappable grid. Macro labels: BUILT (not verified): both layouts read `nutrition.protein`, `carbs`, `fat` and `fibre`, whose English matches the design; the layout difference stays open. The serving size and calories VoiceOver labels: BUILT (not verified): both now use `food.tileEditLabel`.
12. The Fibre tile has its own decimal pad, and picking a serving rescales fibre rather than editing it (`src/app/food/detail.tsx:70`, `:439`, `:452`, `:622-624`). **The tile is conditional**: it shows only when the food's source has a fibre figure, and the design's grid always includes Fibre.
13. Macro precision: BUILT (not verified): picked servings keep 1 decimal place for protein, carbs and fat, as the design shows (`per100.p * scale`, shown through `r1`). `applyGrams` scales them unrounded (`src/app/food/detail.tsx:436-438`), and `num` with `MACRO_PRECISION` shows and saves them to 1 decimal place (`src/app/food/detail.tsx:74`, `:417`). Fibre also keeps 1 decimal place, typed or picked, as the design shows through `r1`: BUILT (not verified) (`src/app/food/detail.tsx:426`, `:439`, `:452`, `:585`, `:623`).
14. Energy readout centred vs left-aligned; an extra *"for 250 g"* line the design does not have. The calories sub-label is translated: BUILT, not verified.
15. Serving presets differ — fixed `[50,100,150,200]` or `[½×,1×,1½×,2×]` vs the food's own catalog servings.
16. The serving control **does not de-select** on a manual override.
17. **The meal switch is conditional**; in the design it is always present (that is how a new food's meal is chosen). The meal chip caption is translated: BUILT, not verified.
18. *"Save to my dishes"*: a full secondary `Button` (renders 58pt: 16 + 16 padding + 24 line + 2 border) vs a 44pt tile pill.
19. Remove: a transparent, bordered destructive pill with a red label and trash icon, and a **blocking confirm**, vs a plain red text button that fires immediately.
20. **No "File under {meal}" CTA**; the app's nearest mode renames only.
21. No "still calculating" holding row after adding a photo/dish item.
22. Toast copy differs throughout; after adding, the app **navigates** (`router.replace`) where the design closes in place.
23. Barcode "not found" and "No longer in your log" screens have no design counterpart. BUILT, not verified: the Food, Nothing to show, barcode lookup, No longer in your log, Product not found, Scan again, Confirm product, Name, g unit, kcal and per-100 g strings and the Added toast now go through t(). BUILT, not verified: formatCalories now uses dashboard.kcal.
24. The design's search subject carries full macros; the app's is energy-only.

**Built:** difference 24 is closed — the search branch of `src/app/food/detail.tsx` now shows the macro row from the result's per-100 g macros, and the kcal-only copy and comments were removed.

## Food — Quick add

**Verdict:** ❌ DIFFERENT
**One-line reason:** The app is rebuilt to the design's hero number, ±50 discs, `+100/+250/+500/+750` presets and keyboard bar; the hero, disc and preset press states, the confirm pill being active at 0 kcal, and the Meal chip padding and label shrink are BUILT, not verified; the Meal chip transition and truncation risk, confirm label and caret still differ.

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
- BUILT, not verified: the hero figure dims to 60% when pressed.
- BUILT, not verified: the discs and preset pills only change background when pressed.
- BUILT, not verified: the confirm pill stays active at 0 kcal.
- BUILT, not verified: Meal chip padding removed in the compact branch of `src/components/forms/SegmentedField.tsx:88`.
- BUILT, not verified: Meal chip label shrink removed in the compact branch of `src/components/forms/SegmentedField.tsx:108`.

**Still open:**

- The confirm label is 17/24 against the design's 17/22 (waiting on Isa).
- There is no 180ms selection transition on the Meal chip (`src/components/forms/SegmentedField.tsx`).
- Meal chip labels stay on one line with no shrink, so a long label such as French "Petit-déjeuner" may cut off (`src/components/forms/SegmentedField.tsx:107`, not measured).
- There is no blinking caret.
- Sheet padding: the design has 34pt below the body in total; the app has 20pt plus the safe-area inset (`src/components/navigation/SheetContent.tsx:143` and `:149`).
- Hero padding: the design has 2pt vertical padding on the hero button; the app has none (`src/app/food/quick-add.tsx`).
- Disc glyph strokes: the design has 20×20 SVG strokes of 2.6; the app has 20pt regular-weight SF Symbols (`src/app/food/quick-add.tsx:120`).
- Figure default: the design starts at 250 and keeps the last value when reopened; the app resets to 250 on every open (`src/app/food/quick-add.tsx:62`).
- Meal default: the design starts on the last meal used (Lunch at first); with no meal passed, the app starts from the time of day (`src/app/food/quick-add.tsx:61`).
- Layout: not checked on device: the screen has its own flex:1 KeyboardAvoidingView at src/app/food/quick-add.tsx:125.

Offline queueing with a loading button and an offline toast that names no meal is a necessary addition the design does not have.

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
logs 100 g (`SEARCH_DEFAULT_G`) because search results carry no serving data, and toasts; the design logs its second serving (`x.serv[1]`); parked as a data change. It
now logs the result's per-100 g macros so it writes the same row as
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
**One-line reason:** Eight differences remain: the title with no tapped meal, the Search foods destination, separate scan routes, SF Symbol glyphs, pressed tiles that also fade, a 44 close that fades when pressed, no fixed 34 under the grid on a phone with no inset, and the native sheet's grabber, corners and backdrop.
**Status:** PARTIAL. `src/app/food/add.tsx` renders the design's five tiles in its order and titles the sheet "Add to {meal}" when a slot is passed. Device run outstanding.

**Design:** title **"Add to lunch"** (lower-cased target meal, follows the `+`
that was tapped; the state defaults to Lunch); a 2-column grid with a 12pt gap of
five tiles — **Search foods** (*"Apple, banana, Indomie…"*), **Scan food** (*"Meal
photo or label"*), **Barcode** (*"Exact database match"*), **My dishes** (*"Your
saved gallery"*), and **Quick add** (*"Just calories, fast"*) as a **full-width
88pt row**. Other tiles 148pt. Icon disc 46, glyph 19, as inline SVGs. Body bottom
padding 34pt.

**App:** title **"Add to {meal}"** from the `slot` param (`add.tsx:58`), or **"Add
meal"** when no slot is passed. The same five tiles with the same copy, in the same
order, with Quick add as the full-width 88pt row and the others 148pt. Disc 46,
glyph 19, as SF Symbols through `Icon`. Tile grid: two equal columns (flexGrow 1,
flexBasis 40%, TILE_BASIS in src/app/food/add.tsx), 12pt gap from space.md. BUILT,
not verified. Owner to check at 320pt and 430pt. BUILT (not verified): sheet bottom
set to 34pt by marginBottom -space.xl on the tile grid in src/app/food/add.tsx, which
cancels SheetContent paddingBottom space.xl (20pt) and leaves the 34pt safe-area
inset. Device check on a 34pt-inset iPhone still open.

**Differences:** title with no tapped meal: "Add meal" vs always "Add to {meal}";
Search foods lands on the food tab vs opening the search sheet; Scan food and Barcode
open separate routes vs one scanner in two modes; glyphs are SF Symbols vs the
design's drawings: filled camera vs outlined, single photo vs a stacked pair, solid
flame vs one with a hollow centre; pressed tile also fades to 0.85 vs the background
change alone; close renders 44 and fades when pressed vs 40 with the background change
alone; space under the grid is the safe-area inset, so 0 on a phone with no inset vs a
fixed 34; grabber, corners and backdrop are the native sheet's vs the drawn 38×5
light-3 grabber, shadow and overlay.

## Food — Scan flows

**Verdict:** ❌ DIFFERENT (code re-checked, not verified on device)
**One-line reason:** Design is ONE scanner with a `Meal | Label | Barcode` switch, an inset preview with corner brackets, a 74pt shutter and three side shortcuts; the app is three separate full-bleed routes with no mode switch and a multi-angle flow the design lacks.

Code re-checked against Food bundle 71f71ac4 (bundle line numbers below), not verified on device.<br>Matches: a found barcode opens the shared food-detail sheet (`src/app/food/barcode-scan.tsx:44-46`, bundle :945-947); a meal photo closes the camera and keeps analysing in the log (`src/app/food/photo-capture.tsx:44-50`, bundle :938-939).<br>Differences:<br>1. Three routes, `photo-capture.tsx`, `label-scan.tsx` and `barcode-scan.tsx`, with no mode control vs one scanner with a Meal, Label and Barcode pill switch: light-2 track, padding and gap 3, selected white with `shadow-sm`, 600 14/18 (bundle :325-350, :925-931).<br>2. Full-bleed camera on black (`photo-capture.tsx:115-117`, `src/app/food/label-scan.tsx:284-286`, `barcode-scan.tsx:89-96`) vs a white screen with the preview inset 16 each side, radius 28, gray-1 fill (bundle :326, :334).<br>3. Guides: a centred dashed 2 frame, 260×320 round for a meal and 300×200 radius 20 for a label (`src/components/food/CaptureGuidanceOverlay.tsx:127-136`), and a solid white 3 reticle 240×150 radius 20 for a barcode (`barcode-scan.tsx:98-108`) vs four 40×40 corner brackets, 3 wide, radius 14 (bundle :335-338).<br>4. No 2 red line across the barcode preview (bundle :339-341).<br>5. Header: a bare 30 white close glyph, top left; no title on meal and barcode, and a title3 "Scan Nutrition Label" with a sub-line on label (`photo-capture.tsx:120-124`, `barcode-scan.tsx:110-116`, `label-scan.tsx:295-308`) vs a 40 light-1 close disc with a 15 glyph, a centred body-bold "Scan food", "Scan label" or "Scan barcode", and a 40 spacer (bundle :327-332, :920).<br>6. Shutter: 72 white with a 4 gray300 border on meal and label, none on barcode, which detects on its own (`photo-capture.tsx:174-186`, `label-scan.tsx:316-327`) vs 74 primary with `shadow-md`, a 60 inner ring 3 white and 0.94 scale when pressed, in every mode (bundle :360-362).<br>7. No gallery, My dishes or Quick add buttons beside the shutter (bundle :353-367).<br>8. Copy: angle guidance, "Tap to capture", "Point at a barcode — it scans automatically", the label prompt and the fork prompt (`photo-capture.tsx:29-33`, `label-scan.tsx:290`, `:313-314`, `barcode-scan.tsx:121-123`, `CaptureGuidanceOverlay.tsx:28`) vs the in-preview hint and the caption footnote per mode (bundle :342, :370, :921-923, :938-940).<br>9. Busy: label is a full black screen with a large white `ActivityIndicator` and "Reading label…" (`label-scan.tsx:181-189`); barcode is an overlay with a 44 icon and title3 (`barcode-scan.tsx:134-150`) vs a 150 tall panel under the preview with a 26 ring spinner in the AI tint and body-medium text (bundle :372-377).<br>10. App-only: multi-angle capture of up to 3 shots with thumbnails and Add angle and Use buttons (`photo-capture.tsx:25-41`, `:129-210`).<br>11. Label scan ends on a form screen with text fields and a `Stepper` (`label-scan.tsx:197-235`) vs the shared detail sheet (bundle :945-947).<br>12. App-only: the AI-consent gate (`photo-capture.tsx:58`, `label-scan.tsx:84`), the camera-permission screens, the dev Simulate scan and Unknown code buttons (`barcode-scan.tsx:124-129`) and the Product not found screen (`barcode-scan.tsx:155-177`).

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

**Differences:** code re-checked; the list is in the summary table row.

## Food — number entry (cross-cutting)

**Verdict:** ❌ DIFFERENT
**One-line reason:** The design enters every number through the slim bar and uses ± / presets only as shortcuts; the app uses the slim bar on `src/app/food/detail.tsx:713` and `src/app/food/quick-add.tsx:206`, boxed fields on `src/app/food/custom-food.tsx`, `src/app/food/label-scan.tsx` and `src/app/food/new-recipe.tsx`, and, in four places, a **slider** or a **± stepper**.

Where numbers are entered in the app today: the detail sheet and quick add, both through `NumberEntryBar` (`src/components/common/NumberEntryBar.tsx`, rendered at `src/app/food/detail.tsx:713` and, captioned "Calories · kcal", at `src/app/food/quick-add.tsx:206`),
custom food, label scan fields, **label scan servings
(`Stepper`)**, **scan review weight (`SliderField` + ½×/1×/2× chips)**, **new
recipe servings (`Stepper`)**, **recipes log sheet servings (`Stepper`)**.

A search of `src` for `Done` finds the "Done" pill at `src/components/common/NumberEntryBar.tsx:94-110`; a search for `InputAccessoryView` returns
nothing. The bar autofocuses its input (`src/components/common/NumberEntryBar.tsx:75`), strips leading zeros and caps length (`src/components/common/NumberEntryBar.tsx:33-38`), at 6 digits by default and 5 on quick add (`src/app/food/quick-add.tsx:205`). The detail sheet's macro pads take a decimal point (`src/app/food/detail.tsx:67-70`). BUILT: typed and picked-serving protein, carbs and fat keep 1 decimal place on display and on save, as in the design, see Food detail difference 13 (`src/app/food/detail.tsx:74`, `:414`, `:420-422`, `:577-579`, `:614-616`). Fibre also keeps 1 decimal place, typed or picked, on display and on save, as in the design (`src/app/food/detail.tsx:423`, `:436`, `:449`, `:582`, `:620`). Separately,
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
gap 26 BUILT, device check pending; top padding `insets.top` + 56 vs a fixed 96, so 115 at a 59 inset
(`src/app/profile/index.tsx:95`); header strip `insets.top` + 20 vs a fixed 84
(`src/app/profile/index.tsx:186`); the Support glyph is a question mark vs an
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
footer padding. Screen gap 20 and row wrapper gap 4 BUILT, device check pending.

## Profile — Delete account — ❌ DIFFERENT

Design: one centred confirm screen — a 42px filled **black** warning triangle,
*"Are you sure?"* at `700 22/28`, the body sentence, then a white pill
*"Delete account"* in danger colour and a plain **"Cancel"** text button. No
eyebrow, no title.

**Differences:** the app is a **three-step flow** (confirm → what will be deleted, with a subscription warning
→ type `DELETE`); the last two steps have no design counterpart and keep an eyebrow +
title; the confirm step has neither, matching the design, BUILT, device check pending; "Continue" and "I understand, continue" keep the transparent look with a 1 `gray300` border (`Button.tsx:34`); the final "Delete account" button has a white fill and no visible border, the 1 border stays in white (`delete-account.tsx:95-96`), and an `accent.red` label (`Button.tsx:44`)
vs a white pill with no border and a `color-mix` danger label (bundle :153-154, :641); "Delete account" on the final step and "Cancel" match the design, BUILT, device check pending, while "Continue" and "I understand, continue" remain; confirm body
16/22 BUILT, device check pending; footer sides 16 match, side padding wrapper removed from `delete-account.tsx`, BUILT, device check pending (`Screen.tsx:141`, bundle :152); DIFFERENT, parked in shared `Screen.tsx`: footer top 16 vs 12 and bottom 16 + `insets.bottom` vs 30 (`Screen.tsx:142-143`, bundle :152); back intercepts to step backwards; and the
app performs a real delete where the design toasts that deletion is disabled.

## Profile — Subscription — ❌ DIFFERENT

Code re-checked against Profile bundle b09a5e65, not verified on device. Design: a **purple→ocean gradient card** with "Lume Pro", a status pill,
the price at `stat-hero` (`$4.99`), the cadence, a hairline, and **Renews** / **Payment** rows (bundle :172-192); then a **usage card**
("This billing period" — Photo scans 138/82%, AI insights 24/46%, Workouts synced 19/34% with 6 bars; bundle :194-207, :738-742); then three
**billing rows** (Change plan / Payment method / Billing history; bundle :209-220, :743-750); then a footnote (bundle :222). The prices and dates are literals (bundle :189, :735-737).
App matches: eyebrow, title, page sides 16, footer-screen bottom 32, top card radius 28 and padding 20, "Lume Pro" and "Active" copy, footnote type and colour (`src/app/profile/subscription.tsx:95-96`, `:120`, `:123`, `:136`, `:145`, `src/components/navigation/Screen.tsx:76`, `:92`, `src/components/display/Card.tsx:35`, `:47`).

**Differences:**
- **Top card:** white with `shadow.sm` vs the gradient with no shadow (`subscription.tsx:116`, `Card.tsx:35`, bundle :172, :733; code re-checked, not verified on device); no price, cadence, hairline, Renews or Payment (`subscription.tsx:117-132`, bundle :177-191), and `CustomerInfo` holds only active entitlements (`src/lib/billing/purchases.ts:27`, `subscription.tsx:113-115`); gaps 12 and 12 vs 16 and 8 (`subscription.tsx:117-118`, bundle :172-173); "Lume Pro" 600 19/25 in `label` vs 700 19/24 in white (`subscription.tsx:119`, `src/lib/design/tokens.ts:143`, bundle :174).
- **Usage card and billing rows:** both absent (bundle :194-207, :209-220).
- **Actions:** the sticky footer is app-only: Manage subscription or See plans, then Restore Purchases (`subscription.tsx:98-111`); the design has Restore on the Settings root only (bundle :704), and the app has it in both places (`src/app/profile/index.tsx:146`). Targets are the RevenueCat paywall and the App Store subscriptions page (`subscription.tsx:21`, `:71`, `:104`) vs toasts naming Superwall and Stripe (bundle :745, :747, :749).
- **App-only copy:** status paragraph (`subscription.tsx:127-131`), billing-disabled note (`:135-143`), and billing-disabled, purchase and store-error toasts (`:32-37`, `:49`, `:60-65`, `:75-85`). Restore toasts are "Subscription restored." and "No purchases to restore." (`:44`) vs "Lume Pro restored" and "No purchases to restore" (bundle :705).
- **Status states:** "Checking…" is app-only and not entitled reads "Not subscribed" (`subscription.tsx:123`) vs "Active" or "Free" (bundle :734); the 13 status icon is app-only (`subscription.tsx:124`, `src/components/display/Badge.tsx:37`).
- **Status pill:** `light-1` fill, vertical padding 4, side padding 12, 600 13/16 sentence case in `label` (`Badge.tsx:29-32`, `:38`) vs white at 22%, 5, 11, 600 12/16 uppercase with 0.4 tracking in white (bundle :175).
- **Spacing and footnote:** screen gap 20 BUILT, device check pending (`subscription.tsx:97`, bundle :165); footnote copy differs (`subscription.tsx:146-147`, bundle :222), side padding 0 vs 4 and no `text-wrap: pretty` equivalent (bundle :222). Top padding, title block and back button are in "Profile — shared chrome".

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
the design lacks; different Lume-mode help copy and placement; `shadow.sm` on the
targets card vs none; different calorie label copy and type; edit hint 11/14 vs
12/16; label-to-figure gap 4 vs 16; different
split-control copy, layout and styling (white+shadow vs black fill, 48 vs 32pt),
and disabled in Lume mode; **six editable macro fields instead of three read-only
rows**; **macro bars and colour dots absent**; a "Macro targets" label the design
lacks; calorie edits commit when editing ends vs on every keystroke; help line side
padding 0 vs 4; screen gap 20 BUILT, device check pending; **reconciliation hint and `HealthDisclaimer` app-only**.

**Built:** the calorie figure is the design's borderless `stat-large` field, with
the edit-state hint (*"Set by Lume"* / *"Tap to edit"*) beside the section label.
The figure, the split control and the macro rows sit inside the design's one white
`radius.xl` card (`Card variant="elevated"`, `space.xl` padding, `space.lg` gap)
with a hairline under the calorie block, and the custom-mode *"Saved as you type"*
help line sits below that card. Fibre, Reset to AI and kcal/kJ are app-only and kept
by default, so they are not listed as gaps. Row 98 carries the full cited list.

## Profile — Scan accuracy — ❌ DIFFERENT (code re-checked, not verified on device)

Design: a **96×96 ring** (r40, stroke 9, `dasharray "231 251"`) with `92%` centred
at `stat-medium`, beside *"Getting sharper"* and *"Up 7 points since August. You
corrected 11 of 138 scans."*; three stat tiles (`138` Scans logged, `11` You
corrected, **`±64` Avg kcal off**); a **"Recent corrections"** list of four rows
with struck-through old values; and a closing footnote.

Code re-checked against Profile bundle b09a5e65 (bundle line numbers below), not verified on device.<br>Matches: "Scan accuracy" title, screen gap 20 (`src/app/profile/scan-calibration.tsx:60`, bundle :297, :301); hero card white, radius 28, `shadow.sm`, padding 20 (`scan-calibration.tsx:99`, `src/components/display/Card.tsx:35`, `:47`, bundle :304); tile row gap 8, tile padding 16, "Scans logged" and "You corrected" labels, calories tint on the second value, `statSmall` 700 20/26 values (`scan-calibration.tsx:111-122`, bundle :321-326, :782-784).<br>Differences:<br>1. Eyebrow "Your scans" vs "Last 30 days" (`scan-calibration.tsx:60`, bundle :300).<br>2. Hero: a column at gap 16 with a `CardHeaderRow`, a `statLarge` 800 40/50 percent, a linear `ProgressBar` and an app-only "Lume is learning your portions" footnote (`scan-calibration.tsx:100-106`) vs a row at gap 20 with a 96 ring, r40, stroke 9, light-2 track and positive arc, the percent centred in `stat-medium` 700 28/36 with -0.6 tracking (bundle :304-312).<br>3. No "Getting sharper" 600 16/21 headline or 400 13/18 trend sentence (bundle :314-317).<br>4. Third tile: "{n}%" "Of your scans" vs "±64" "Avg kcal off" (`scan-calibration.tsx:124`, bundle :785).<br>5. Tiles: radius 28 with `shadow.sm` (`Card.tsx:35`) vs radius 20, white, no shadow (bundle :322).<br>6. Tile values #000000 on the first and third (`src/components/display/Stat.tsx:24`) vs #171717 (bundle :783, :785).<br>7. Tile labels uppercase with 1 tracking and gap 4 above them (`Stat.tsx:30`, `:37`) vs sentence case and gap 2 (bundle :322-324).<br>8. No "Recent corrections" eyebrow, four rows with struck-through old values, or the "Every correction teaches Lume your portion sizes." footnote (bundle :329-347, :787-792).<br>9. App-only: "Foods we've learned" and "Most corrected" (`scan-calibration.tsx:128-168`), loading skeletons (`:61-66`) and the "No scans yet" empty state (`:79-86`).

## Profile — AI insights — ❌ DIFFERENT

Design: three static insight cards (tinted 26pt chip, title, relative timestamp,
body at `400 14/20`) — *"Protein dips at weekends"*, *"You train best on
Tuesdays"*, *"Deficit is on track"* — plus a **"Weekly insight push"** row with a
51×31 iOS switch, default ON.

**Differences:** eyebrow and title differ (*"Your patterns"* / *"Insights"* vs *"Updated today"* / *"AI insights"*, so the
screen disagrees with the row that opens it); **the push toggle is absent**; `BrainProfileCard`, the **"Ask Lume"** card and `/ai-query` are app-only;
insight cards are 28/20 with `shadow.sm` vs 20/16 with none; a bare 17 sparkle vs a 26 tinted chip; title 500 17/24 vs 600 16/21; **no timestamp**;
body 400 15/21 secondary, 3 lines, vs 400 14/20 `label`, no limit; card gap 8 and screen gap 20 BUILT, device check pending; the consent gate is app-only with an empty body
while resolving; anomalies, dismissal, more/less, type badge, empty states and skeletons are app-only; the feed is data-sorted vs
three fixed cards.

## Profile — Connected apps — ❌ DIFFERENT

Design: **three** providers — **Apple Health** (default connected, *"Two-way sync
for workouts, weight and steps."*), Strava, WHOOP — each a 20px-radius card with a
34pt tinted chip holding a 19px stroked glyph, a status line, an **inline 34pt
pill** (Connect / Disconnect) and a sub-line.

**Differences:** **Apple Health is absent entirely** (eyebrow reads "of 2" vs "of
3"); icons are **emoji** (🏃 / ⌚) rendered as text vs tinted SVG chips; cards are
elevated 28px with 20pt padding vs flat 20px with 16; name `title3` 19/25 vs
`600 16/21`; **full-width buttons, 56 tall, in their own row** vs one inline 34 pill; a **"Sync now"**
action the design lacks; *"Connect Strava"* vs *"Connect"*; text-only Disconnect vs a filled pill; the blurb replaces the
status when disconnected, so *"Not connected"* never appears; different synced wording; an intro line the design lacks;
OAuth session vs immediate toggle; loading skeletons and busy states; different toasts (and **no toast on a
successful connect**). Card gap 8 and screen gap 20 BUILT, device check pending.

## Profile — Preferences — ⚠️ PARTIAL MATCH

Same five controls, same labels, same option pairs.

**Differences:** the selected segment is **inverted** — design black fill + white
text, app white + shadow + label text; track `light2` vs `light1`; padding 4 vs 3;
segment height 48 vs 40; label `500 17/24` vs `600 15/20`; field label colour
`#171717` vs `#6B6B6B`; label gap 4 vs 7; hint and label left padding 0 vs 4; **a
mixed-units hint with its own copy** where the design keeps one hint; screen gap 18
BUILT, device check pending; pressed opacity and haptic vs a fill transition; and **energy is included in the
system check**, so kcal→kJ lights neither pill in the app while the design keeps "Metric" lit.

## Profile — Privacy — ⚠️ PARTIAL MATCH

All four design rows and **both footnote paragraphs match verbatim**.

**Differences:** code re-checked; the list is in the summary table row.

## Profile — Support — ⚠️ PARTIAL MATCH

Identical rows, address (`lumofit@gmail.com`), placeholder and button label.

**Differences:** code re-checked; the list is in the summary table row.

## Profile — About — ⚠️ PARTIAL MATCH

Identical wordmark, tagline and three meta rows.

**Differences:** code re-checked; the list is in the summary table row.

## Profile — shared chrome — ⚠️ PARTIAL MATCH

The convention (grey page, blurred top gradient, floating circular back button,
title inside the scroll) **is** implemented.

**Differences, app vs design (code re-checked against Profile bundle b09a5e65,
device check pending; the full list is in the summary table row):**

- **Header:** height `insets.top` + 20 vs a fixed 84, so 67, 79 and 82 at insets of 47, 59 and 62 (`src/components/navigation/Screen.tsx:163`, `src/app/profile/index.tsx:186`, bundle :579). Gradient 86 to 20 vs 88 to 18, mask 56 vs 58, `intensity` 30 vs blur 18 with saturate 1.4 (`src/components/navigation/FloatingHeader.tsx:29`, `:68-81`, bundle :579).
- **Top padding:** `insets.top` + 56, so 103, 115 and 118, vs a fixed 96, 110 on About and 120 on Delete account (`Screen.tsx:91`, `index.tsx:95`, bundle :28, :559, :143).
- **Bottom padding:** 40 + `insets.bottom` vs 40 on Goals, Scan accuracy, AI insights, Preferences, Connected apps, Privacy, Support and About (`Screen.tsx:76`, bundle :230, :297, :354, :392, :432, :465, :519, :559); 48 + `insets.bottom` vs 48 on Settings (`index.tsx:98`, bundle :28); footer bar on Account and Delete account: top 16 and bottom 16 + `insets.bottom` vs 12 and 30 (`Screen.tsx:142-143`, bundle :133, :152).
- **Screen gap:** BUILT, device check pending: 26 on Settings (`index.tsx:97`, bundle :28), 20 on Account, Subscription, Goals, Scan accuracy, AI insights and Connected apps (`account.tsx:51`, `subscription.tsx:97`, `goals.tsx:94`, `scan-calibration.tsx:60`, `src/app/insights.tsx:58`, `integrations.tsx:156`, bundle :87, :165, :230, :297, :354, :432), 18 on Preferences (`preferences.tsx:32`, bundle :392) and 14 on the Delete account confirm step (`delete-account.tsx:111`, bundle :143).
- **Title block:** gap 2, bottom padding 0, side padding 4, eyebrow tracking 1.1 and title tracking -0.6 BUILT (device check pending) (`Screen.tsx:117`, `:122`, `:127`, `index.tsx:109`, `:111`, `:115`, bundle :30-32, :467).
- **Title block on non-Profile floating screens:** values are title to card gap / title bottom padding / title side padding / title letter spacing; "none" means the property is not set. EXACT means code re-checked, not verified on device. The gap is the parent's column gap, so the visible space to the first card is gap plus bottom padding. The shared title in `Screen.tsx:117`, `:127` always gives bottom 0, side 4 and -0.6; rows marked shared use it.

  | Screen | Design | App | Status |
  | --- | --- | --- | --- |
  | Summary tab (`src/app/(tabs)/index.tsx:85`, `:92`, `:100`) | 14 / 6 / 4 / -0.6 (Summary bundle :29-33) | 14 / 6 / 4 / -0.6 | EXACT (code re-checked, not verified on device) |
  | Food tab (`src/app/(tabs)/food.tsx:435`, `:441`, `:468`) | 14 / 0 / 4 / -0.6 (Food bundle :29-36) | 14 / 0 / 4 / -0.6 | EXACT (code re-checked, not verified on device) |
  | Gym tab (`src/app/(tabs)/gym.tsx:105`, `:108`, `:115`) | 14 / 0 / 4 / -0.6 (Gym bundle :28-32) | 14 / 0 / 4 / -0.6 | EXACT (code re-checked, not verified on device) |
  | Energy (`src/app/energy.tsx:52-53`) | 16 / 0 / 2 / -0.6 (Summary bundle :225-232) | 16 / 0 / 2 / -0.6 (`src/components/display/DetailChart.tsx:158`, `:165`) | EXACT (code re-checked, not verified on device) |
  | Macros (`src/app/dashboard/nutrition.tsx:76-77`) | 16 / 0 / 2 / -0.6 (same bundle lines) | 16 / 0 / 2 / -0.6 (same `KickerTitle`) | EXACT (code re-checked, not verified on device) |
  | Workouts (`src/app/dashboard/training.tsx:64-65`) | 16 / 0 / 2 / -0.6 (same bundle lines) | 16 / 0 / 2 / -0.6 (same `KickerTitle`) | BUILT, gap 16 on the scroll container (training.tsx) |
  | This week (`src/app/dashboard/week.tsx:54-55`) | 16 / 0 / 2 / -0.6 (same bundle lines) | 16 / 0 / 2 / -0.6 (same `KickerTitle`) | BUILT (code): scroll gap 12 to 16 with `contentStyle`; Daily net bars 22 wide, 0.3 fade and a halfway scale line through new `Plot` options (week.tsx, DetailChart.tsx) |
  | Exercise progress (`src/app/gym/exercise-progress.tsx:281-283`) | 16 / 0 / 0 / none (Gym bundle :184-186) | 16 / 0 / 0 / none, not shared | EXACT |
  | My schedule (`src/app/gym/schedule.tsx:80`) | 20 / 0 / 0 / none, no eyebrow, scrolls with the content (Gym bundle :521-522) | 20 / 0 / 0 / none, own title, no eyebrow, scrolls with the content | BUILT (code): own title, side 0 and no tracking (schedule.tsx) |
  | New or edit workout (`src/app/gym/new-template.tsx:122-125`) | 12 / 4 / 0 / none; the workout name over a footnote summary at gap 3, no eyebrow, scrolls with the content (Gym bundle :562-564, per row "Gym — workout / template detail") | 12 / 4 / 0 / none, own title; no eyebrow, "New workout" or "Edit workout", no summary, scrolls with the content | BUILT (code): own title, bottom 4, side 0, no tracking, no eyebrow (new-template.tsx); title text and summary line open |
  | Muscle focus (`src/app/gym/muscles.tsx:94`) | 0 / 12 / 20 / none (Gym bundle :967-977; a fixed bar, top 58, `title-3` over a "Last 7 days" footnote at gap 1, beside a 38 back button at gap 12, not a scrolling title) | 16 / 12 / 20 / none, own fixed bar above a local scroll, top `insets.top` + 4, `title3` over a "Last 30 days · volume" footnote at gap 1, 38 `light1` back button at gap 12 | BUILT (code), device check pending: fixed bar, 38 back button, title-3, no tracking, side 20, line below (muscles.tsx) |
  | Session (`src/app/gym/session.tsx:514-517`) | No counterpart; Gym bundle :683 is a day view with 16 / 0 / 0 / none, and the app has no day route | 12 / 0 / 4 / -0.6, shared | No design value |
  | Streak (`src/app/gym/streak.tsx:30`) | No design screen | 20 / 0 / 4 / -0.6, shared | No design value |
  | Session history (`src/app/gym/history.tsx:23`) | No design screen | 20 / 0 / 4 / -0.6, shared | No design value |
  | My workouts (`src/app/gym/templates.tsx:23-26`) | No design screen; a section of My schedule with no title (Gym bundle :537) | 12 / 0 / 4 / -0.6, shared | No design value |
  | My Meals (`src/app/food/meals.tsx:29-32`) | No design screen | 12 / 0 / 4 / -0.6, shared | No design value |
  | New Recipe (`src/app/food/new-recipe.tsx:126-129`) | No design screen | 12 / 0 / 4 / -0.6, shared | No design value |

  Per-screen check of title font size, tracking, side padding, bottom padding and gap to first card, code re-checked, not verified on device. DIFFERENT lists app vs design, differing values only:
  - Energy: EXACT (code re-checked, not verified on device): tracking -0.6, side 2, bottom 0, gap 16. Does not use the `Screen.tsx` title block.
  - Energy, hero bars: BUILT (code), device check pending: bars 52% wide and centred, column gap 3, days before today at 0.8, through the `Plot` options `barWidthRatio`, `gap` and `dimOpacity` (`src/app/energy.tsx`, Summary bundle :256-259, :578, :632-634). Scale and average line: BUILT (code), device check pending: the scale runs from 0.88 × the lowest to 1.05 × the highest drawn value, and a 2px solid calories-coloured line marks the 14-day average burn, labelled "N kcal burned" above it at the left and stopping at the gutter (`src/app/energy.tsx`, Summary bundle :277-278, :600, :635). Chart gutter: BUILT (device check pending): both Energy charts (hero and "In and out") pass `CHART_GUTTER_W` 44 and `SCALE_LABEL_W` 40 to `Plot` and the 44 gutter to `Axis`, and the average line stops at `CHART_GUTTER_W`, as in the design (`src/app/energy.tsx`, Summary bundle :250-256, :277, :281, :298-303, :313, :631-637); `DetailChart.tsx` defaults stay 48.
  - Macros: EXACT (code re-checked, not verified on device): tracking -0.6, side 2, bottom 0, gap 16. Does not use the `Screen.tsx` title block.
  - Workouts: BUILT, gap 16 on the scroll container (training.tsx). Does not use the `Screen.tsx` title block. Chart gutter: BUILT (device check pending): both Workouts charts (hero minutes and the secondary training energy) pass `CHART_GUTTER_W` 44 and `SCALE_LABEL_W` 40 to `Plot` and the 44 gutter to `Axis`, as in the design (`src/app/dashboard/training.tsx`, Summary bundle :250-256, :281, :298-303, :313, training entry :663-675); `DetailChart.tsx` defaults stay 48.
  - This week: BUILT (code): scroll gap 12 to 16 with `contentStyle` (week.tsx). Does not use the `Screen.tsx` title block.
  - This week, Daily net card: BUILT (code): card gap 12 to 16, chart and axis grouped at gap 8 above the readout (`src/app/dashboard/week.tsx:163-181`, Summary bundle :290, :295-319).
  - This week, Daily net bars: BUILT (code, device not checked): `Plot` in `src/components/display/DetailChart.tsx` gained a bar width `w`, a `dimOpacity` and a `mid` scale line, all defaulting to the old look; `src/app/dashboard/week.tsx` passes 22, 0.3 and half the ceiling for Daily net, so the days before today fade to 0.3, bars are 22 wide and centred, and a third line is labelled at half the scale (Summary bundle :296-310, :621-622, :629). Gridline inset, bottom "0" label and centred value labels: BUILT (code): `week.tsx` passes the new `Plot` options `gridInset` and `floor="0"` to Daily net only, so the three lines stop where the columns stop, a "0" labels the baseline and all three value labels sit centred on their lines (Summary bundle :296-301, :629). Tap to pick a day and the bold picked letter: BUILT (code) in `week.tsx`. Daily net gap: BUILT (code), gap 3 on columns, bars and day letters, device check pending (`DAILY_NET_COLUMN_GAP` in `week.tsx`, passed to `Plot` as `gap`, Summary bundle :303-316). Owner device checks: the "0" label at large text sizes (it hangs half a line below the chart, 8 above the day letters), and the lines clearing the gutter. BUILT: This week chart gutter 44 and scale labels 40 (week.tsx CHART_GUTTER_W and SCALE_LABEL_W).
  - This week, hero bars and average line: BUILT (code), not checked on a device: past days light grey and today blue, 2 blue average line and "N kcal average" label at 600 12/16, chart scale highest day x 1.16 now matches bundle :601 (`src/app/dashboard/week.tsx`, Summary bundle :276-279, :601, :645-646). Hero bar width: BUILT (code), 58% wide, device check pending. Unpicked opacity 0.8: BUILT (code). Both through the `Plot` options `barWidthRatio` and `dimOpacity` (Summary bundle :578, :645). The screen stays DIFFERENT: segmented control, footnote, stat unit and Daily net bars are open.
  - This week, average label: average label now uses locale keys in en, es and fr; not checked on a device. The screen stays DIFFERENT.
  - This week, stat unit: BUILT (code, not device checked): kcal in per day via dashboard.kcalEatenPerDay (`src/app/dashboard/week.tsx:128`, Summary bundle :510).
  - This week, hero In & out and Net figures: ALREADY MATCHING (code, not device checked), no code changed: the design keeps one stat line at the top of the hero card, showing the in or net average by mode (`src/app/dashboard/week.tsx:125-141`, Summary bundle :236-242, :510). The design has no "Net out" figure.
  - Exercise progress: EXACT: 30, no tracking, side 0, bottom 0, gap 16. Does not use the `Screen.tsx` title block.
  - My schedule: BUILT (code, device not checked): title drawn in `src/app/gym/schedule.tsx` instead of `Screen`'s, so side 4 to 0 and tracking -0.6 to none (Gym bundle :521-522). Gap 20, bottom 0, no eyebrow and scrolling unchanged. Does not use the `Screen.tsx` title block.
  - New or edit workout: BUILT (code, device not checked): title drawn in `src/app/gym/new-template.tsx` instead of `Screen`'s, so bottom 0 to 4, side 4 to 0, tracking -0.6 to none, and the "Workout" eyebrow removed (Gym bundle :562-565). Still DIFFERENT: title "New workout" or "Edit workout" vs the workout name, and no footnote summary (design: "{sub} · N working sets · about M min", bundle :1856-1860); block gap 3 applies only once a summary exists. Gap 12 matches. Does not use the `Screen.tsx` title block.
  - Muscle focus: BUILT (code), device check pending: `src/app/gym/muscles.tsx` no longer uses `Screen`; it draws a fixed white bar (top `insets.top` + 4, sides 20, bottom 12, gap 12) holding a 38 `light1` back circle with a 15 chevron (44 tap target, back or home as `GlassBackButton` does) beside `title3` "Muscle focus" over a "Last 30 days · {volume}" footnote at gap 1, above its own scroll (Gym bundle :967-972). Remaining, outside the five items: bar top `insets.top` + 4 vs a fixed 58; solid white vs white at 86% with blur 20; cards start 16 below the bar vs the 3D body stage flush at 0; "Last 30 days" vs "Last 7 days" (server window is 30 days); volume "12.3k" vs "N kg lifted" (weightless sets count too). Back circle pressed opacity 0.6 matches (`BACK_PRESSED_OPACITY`).
  - Session: NO DESIGN VALUE: app 30, -0.6, side 4, bottom 0, gap 12. Uses the `Screen.tsx` title block.
  - Streak: NO DESIGN VALUE: app 30, -0.6, side 4, bottom 0, gap 20. Uses the `Screen.tsx` title block.
  - Session history: NO DESIGN VALUE: app 30, -0.6, side 4, bottom 0, gap 20. Uses the `Screen.tsx` title block.
  - My workouts: NO DESIGN VALUE: app 30, -0.6, side 4, bottom 0, gap 12. Uses the `Screen.tsx` title block.
  - My Meals: NO DESIGN VALUE: app 30, -0.6, side 4, bottom 0, gap 12. Uses the `Screen.tsx` title block.
  - New Recipe: NO DESIGN VALUE: app 30, -0.6, side 4, bottom 0, gap 12. Uses the `Screen.tsx` title block.

- **Back button:** 44 vs 38, a deliberate HIG tap target (`src/components/navigation/GlassButtons.tsx:20`, bundle :581), at `insets.top` + 4 and left 16 vs top 50 and left 14 (`Screen.tsx:165`, `index.tsx:189`, bundle :581), with a different glass recipe (`GlassButtons.tsx:44`, `:51`, bundle :581).
- **Toast:** always black, with the tone shown only by the icon, vs always `gray-1` #1c1c1e (`src/components/display/ToastHost.tsx:19-22`, `:75`, bundle :586). Radius 20 vs pill (`ToastHost.tsx:76`, bundle :586). At the top unless it has an action vs always at the bottom, with bottom offset `insets.bottom` + 16 vs 52 (`src/components/display/toastStore.ts:42`, `ToastHost.tsx:56-57`, bundle :586). 2800 ms vs 2200 ms (`toastStore.ts:45`, bundle :627).

`profile/index.tsx` hand-rolls this chrome instead of using `Screen` (`index.tsx:9`).

---

# Tab shell and tab bar

**Verdict:** ⚠️ PARTIAL MATCH

`Lume App.dc.html` mounts four screens (Summary, Food, Gym, Profile) and passes
`onTab(tab, intent)`. I checked the visible bar in `SummaryScreen.dc.html`: it has
**three** tab labels — Summary, Food, Gym — and Profile is reached via
`goProfile` from the avatar. **That matches the app's architecture**, where
Profile lives on the root stack and is opened from the avatar.

**Matching:** three tabs plus a separate 62pt black `+`; 22pt bottom offset; 52pt
cells; 45° rotation over 260 ms; the add menu's 232pt width and 96pt anchor;
the two menu rows' copy; row gap 10 vs 10; pill padding 5 vs 5 and inner gap 2 vs 2;
active cell `rgba(0,0,0,0.055)` vs `rgba(0,0,0,0.055)`; active label
weight 600 vs 600; glyph 21 vs 21 and `+` 27 vs 27; shadows are 0 12 32 at 0.14 on the pill and 0 12 28 at 0.26 on the `+`,
as in the design, with its 0.5 ring layers drawn as separate views on the pill and a border on the `+`.

**Differences:** blur 50 vs 28 with saturate 180 is still open in row 118 item 2. Also open in row 118: item 1, bottom offset, where an inset above 34 raises the bar vs a fixed 22; item 4, the active cell is still a pressable that emits `tabPress` and `tabLongPress` vs no press action in the design; item 5, app-only: the "+" haptic, the Reduce Motion snap on the "+" rotation and the Reduce Transparency branch with its solid fill and border, where the outer ring still draws on the solid pill.

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
| **Quick add** (line 86) | ⚠️ | ❌ | The hero number, ± discs, preset pills and keyboard bar are BUILT and the `Label` field is gone. BUILT, not verified: the hero dims to 60% when pressed, the discs and preset pills only change background when pressed, and the confirm pill stays active at 0 kcal. BUILT, not verified: Meal chip padding and label shrink removed in the compact branch of `src/components/forms/SegmentedField.tsx`. Still different: the Meal chip's missing 180ms transition and truncation risk, plus the other differences in row 87. |
| **Saved foods** (line 87) | ⚠️ | ❌ | The design is a photo gallery with a "New dish" tile; the app is a text list. Reducing this to "photos have no source" understates it. |
| **My schedule** (line 97) | ✅ "Day names clipped until fix 3. The week starts on Sunday where the design starts on Monday." | ⚠️ | A ✅ cannot stand next to a listed defect. Beyond the week order it names, the design's entire "My workouts" section belongs on this screen and is absent, the row sub-line drops the muscle-group phrase, and the picker sheet differs in five ways (order, copy, sublabel, check treatment, an extra create row). |
| **New workout** (line 99) | ✅ "Floating chrome, fields, pill." | ❌ | The three things it checked are the three things the design does **not** have: the design's editor has no name field, no duration field and no save pill. What it does have — per-set rows, warm-up marking, Rest/Tempo/RPE tiles, notes, supersets and the keypad bar — is entirely absent, and saved templates cannot have their exercises edited at all. |
| **My workouts (templates)** (line 98) | ⚠️ "Chrome matches; the '+' is a bare glyph, not a glass circle" | ❌ | The design has no template *list screen*; the list is a section of the schedule screen, and the design has no create-template flow anywhere. The cards also lose a whole line ("Every Mon, Thu") and the muscle-group phrase. |
| **Muscle focus (full view)** (line 96) | ⚠️ "no Front/Back toggle and no set counts (V10); the 3D stage is item 7" | ❌ | Accurate as far as it goes, but grading it ⚠️ understates a screen whose central element — an interactive 3D body appearing three times in the design — does not exist, along with the selection popover, the volume chips and the per-muscle exercise lists. |
| **Month calendar sheet** (line 83) | ⚠️ "Grid, today disc, dots… all match" | ⚠️ (agree on grade) | But "today disc" is wrong — the app draws a **ring**, not the design's `light-2` filled disc. |
| **My Meals** (line 88), **New Recipe** (line 89) | ✅ | n/a | These screens have **no design counterpart at all**, so "✅ matches" cannot be true of them; they can only be "not in the design". |
| **"+" menu** (line 64) | ✅ | ⚠️ | Solid white panel vs translucent, `0.10` scrim vs `0.10`, radius 18 vs 18, row 54 vs 54, label 16/20 vs 16/20, icon 19 vs 19 — the panel documented in `AddMenu.tsx` as deliberate, but not "matches".<br>Close label now uses `tabBar.closeMenu` (BUILT, not verified).<br>The two menu labels now use t(): `addMenu.logGymSession`, `addMenu.logFood` (BUILT, not verified). |
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
