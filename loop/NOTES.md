# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified.

## Status
R429. Test gate RED: detailChrome.render.test.tsx 4/4 snapshots fail (this week, training, energy, macros) after Screen.tsx floating padding change (R427). Snapshot regeneration needs Isa approval; asked in R428, no answer by R429. Recorded under Blocked on Isa; not asked again. No code build until resolved. R429 is a doc-only re-check of rows 113, 116, 117, 118. Device checks are Isa's.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before building.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task.
- Isa (R423): row 111 scrim 0.10 (design). Panel stays solid white. Gym row keeps pushing /gym/log-session. Both accepted.
- Isa (R423): other blocked items follow the design. This overrides the older 'waits on Isa' notes, including the streak footnote and Screen.tsx padding.
- R425 (manager): streak footnote hidden until gym data has loaded, to avoid false 0 counts. Deliberate deviation, recorded on row 82. Isa may overrule.
- R426 (manager): footnote gated on !gymLoading && !gymError. Side effects accepted: footnote hides during pull-to-refresh and after a failed refresh. Isa may overrule.
- R428 (manager): Screen.tsx padding kept per design. Snapshot regeneration needs Isa approval (asked, unanswered).
- R429 (manager): Isa did not answer the R428 question in time. Snapshot approval stays Blocked on Isa. Not re-asked.
- R429 (manager): no code build while the test gate is red. Doc-only re-check rows used instead.
- R429 (manager): Jev said ask 89%. Kept run: doc-only re-check needs no answer and touches no code or snapshots.
- Data model changes (per-day draft store) parked, not asked.
- Badge style differences parked (style changes banned).
- Accepted: gym duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset raised above inset 34; active cell keeps emitting tabPress; strip tap to /gym/streak; row 111 glyphs via optional size in LumeTabBar.tsx; scrim uses local SCRIM_COLOR in AddMenu.tsx, shared color.overlay untouched.
- Row 76 add path not faked: logging on pick marks the day done.
- NavBar.tsx:29 gray200 alias cleanup dropped as tidying.
- Gap 16 (energy balance and macros snapshots) blocked on Isa: snapshot changes need his sign-off.

## Blocked on Isa
- R428: approve detailChrome snapshot regeneration (this week, training, energy, macros) after the Screen.tsx padding change. If denied, revert Screen.tsx padding (R427).
- Gap 16: energy balance and macros snapshots, same sign-off.
- Streak footnote and flame and VoiceOver wording items wait for Isa's decisions in Owner device checks.

## Built (not verified)
- Row 111 (AddMenu; scrim 0.10 from R423).
- Row 82 (streak strip; footnote built R424, gated on load R426).
- Screen.tsx floating bottom padding 40 / 32 above footer (R427). Rows 107, 109, 110 bottom padding items only; rows stay PARTIAL.
- Rows 84, 114, 117, 118 partial.
- Badge.tsx gray700 to label at :19 and :38 (same value).

## Queue (one per round, in order)
1. Resolve detailChrome snapshots (Isa approval). If denied, revert Screen.tsx padding. Blocked on Isa.
2. Gap 16 detailChrome energy balance and macros snapshots. Blocked on Isa.
3. Re-check rows 113, 116, 117, 118 (R429, doc only). Then build items per design, only when the test gate is green.
4. Row 84 NavBar floating chrome (NavBar.tsx:29 alias cleanup dropped).
5. Doc fix: DESIGN_GAP_ANALYSIS.md:674, :837-839, :864, :868, :1494 (Badge, file counts, old menu values, 0.45 scrim). Fix in a re-check round.

## Re-checked (do not repeat)
- Rows 107-111, 82, 84 (R405-R413).
- Rows 113, 116, 117, 118 (R429, pending result in the next report).

## Parked (one line each)
- Screen.tsx: Settings keeps 48 + inset vs design 48 (profile/index.tsx:98); footer area 16/16/16 + inset vs 12/16/30 on Account; Screen.tsx:78-79 comment now true only for plain; gym/session and gym/new-template 48 to 32 and gym/session may need 96 (Gym bundle lines 562, 681); other floating screens (insights, energy, week, training, macros, meals, templates, exercise-progress, muscles, schedule) move 48 to 40, not individually design-checked; 6pt home-indicator clearance on 34pt inset (Isa to confirm).
- Row 82: VoiceOver label omits footnote (gym.tsx:128); copy has no en/es/fr locale keys; singular wording ('1 session', '1 freeze') is my addition; strip gap 12 vs design 11; footnote hides during refresh (accepted, see decisions).
- Row 76: draft store (data model); chevron SF Symbol (log-session.tsx:250); second add route bundle :1310; session.tsx:565-569.
- Gym: session.tsx:364 saves template estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62); second sheet keys, caption, pill sizes, footer scroll.
- Gym row has no 'already logged' toast in the + menu handler (design lines 1656-1657). Isa to confirm it is covered by the owner decision.
- Streak: streak.tsx:89 'Sessions' should say distinct days (hooks.ts:156); flame pulse; grey at zero; SF Symbol artwork.
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat.
- Logged card chevron with no action (TodayCard.tsx:115, :194); no logged-day guard in session.tsx.
- Failed templates fetch; picker offers only Rest day and could overwrite a workout.
- Doc: DESIGN_GAP_ANALYSIS.md:674, :837-839, :864, :868, :1494 stale (Badge, file counts, old menu values, 0.45 scrim).
- act() warning from src/lib/design/reduceMotion.ts:13 in tabbar render test.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; AddMenu.tsx dead exit path (if (!visible) return null); 38 alias lines in 22 files (tokens.ts:50-56).
- i18n: hardcoded English on most screens (session.tsx:539-555); 'What did you do?' sheet English only (log-session.tsx:311-392).
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood local only.
- AI insights screen has no file in src/app/profile/.

## Owner device checks (parked for Isa)
Fade, shadows, pull-to-refresh (footnote hides during refresh), title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize, menu clipping of shadow, row 111 scrim 0.10 on device, streak footnote at 320pt and large text (may wrap), floating screen bottom padding and home-indicator clearance. Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped). Isa must also decide: is footnote hiding during refresh acceptable; may 'sessions' count distinct days.

## Gotchas
- Briefs carry false premises: check first (row 117 items 5-7 not in TodayCard; CTA handler is gym.tsx:160; + menu handler at LumeTabBar.tsx:243-246, not gym.tsx; gym.tsx:243-246 does not exist).
- zsh does not split $paths; use ${=paths} or separate arguments.
- A pipe hides grep's exit code; run grep without one when reporting.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation, hydrationErrorScreens.
- detailChrome.render.test.tsx: 4 snapshots (this week, training, energy, macros) fail after Screen.tsx padding change; energy and macros also include gap 16 contentStyle.

## Round log
- R405-R422: doc fixes, Badge and NavBar alias work, re-checks, stops awaiting Isa. Last full suite 822 passed, 2 known gap-16 failures.
- R423: Isa replied on Telegram. Decisions recorded. Row 111 scrim to 0.10. tsc green, tabbar render 13/13.
- R424: Row 82 footnote built (gym.tsx).
- R425: Prompt rejected: no branch rule.
- R426: Row 82 footnote gated on load. tsc exit 0; three source-reading suites 24/24. Not device checked.
- R427: Screen.tsx floating padding to design (40 / 32 above footer). tsc exit 0. detailChrome 4/4 snapshots fail (flagged). Not approved.
- R428: Flagged report handled: asked Isa to approve snapshot regeneration. No code change this round. Isa did not answer.
- R429: Loop note: R428 question unanswered, parked under Blocked on Isa. Chose doc-only re-check of rows 113, 116, 117, 118 (Jev 89% ask overruled, reason in decisions).

## Latest Claude Code report
R427: Screen.tsx floating padding 48+inset to 40 (no footer) and 48 to 32 (footer); plain variant unchanged. Rows 107, 109, 110 bottom padding items BUILT (not verified). tsc exit 0; detailChrome 4/4 snapshots fail (this week, training, energy, macros); foodDetailLogged and measurements pass. Snapshots not updated per rule. Home-indicator clearance about 6pt on 34pt inset.
R428: no code change; asked Isa to approve snapshot regeneration; no answer.

## Handover note (R423 session)
Branch loop/design-match. Commits appear between rounds, not from the session. Design bundles: Gym 7dc211f6, Profile b09a5e65, Food 71f71ac4. Decode __bundler/manifest in a mktemp script, never into the repo. Tokens aliases at tokens.ts:50-56. Last full suite before Badge edit: 822 passed, 2 known failures.