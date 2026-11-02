# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified.

## Status
R427. Row 82 footnote gate done (R426 report). Queue head is Screen.tsx bottom padding (rows 107-110). Isa's R423 decisions are in force. Blocked items follow the design unless parked. Device checks are Isa's.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before building.
- jest --ci only. Never -u or edit .snap. Code tidying is never a task.
- Isa (R423): row 111 scrim 0.10 (design). Panel stays solid white. Gym row keeps pushing /gym/log-session. Both accepted.
- Isa (R423): other blocked items follow the design. This overrides the older 'waits on Isa' notes, including the streak footnote and Screen.tsx padding.
- R425 (manager): streak footnote hidden until gym data has loaded, to avoid false 0 counts. Deliberate deviation, recorded on row 82. Isa may overrule.
- R426 (manager): footnote gated on !gymLoading && !gymError (not isLoading alone, since failed loads also set isLoading false). Side effects accepted: footnote hides during pull-to-refresh and after a failed refresh. Isa may overrule.
- Data model changes (per-day draft store) parked, not asked.
- Badge style differences parked (style changes banned).
- Accepted: gym duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset raised above inset 34; active cell keeps emitting tabPress; strip tap to /gym/streak; row 111 glyphs via optional size in LumeTabBar.tsx; scrim uses local SCRIM_COLOR in AddMenu.tsx, shared color.overlay untouched.
- Row 76 add path not faked: logging on pick marks the day done.
- NavBar.tsx:29 gray200 alias cleanup dropped as tidying.
- Gap 16 (energy balance and macros snapshots) blocked on Isa: snapshot changes need his sign-off.

## Built (not verified)
- Row 111 (AddMenu; scrim 0.10 from R423).
- Row 82 (streak strip; footnote built R424, gated on load R426).
- Rows 84, 114, 117, 118 partial.
- Badge.tsx gray700 to label at :19 and :38 (same value).

## Queue (one per round, in order)
1. Screen.tsx bottom padding to design, then rows 107-110 (R427 issued).
2. Gap 16 detailChrome energy balance and macros snapshots (blocked on Isa unless he answers).
3. Rows 113, 116, 117, 118 items per design.
4. Row 84 NavBar floating chrome.
5. Doc fix: DESIGN_GAP_ANALYSIS.md:1494 and gym add-menu section still say 0.45 scrim and deliberate; fix in a re-check round.

## Re-checked (do not repeat)
- Rows 107-111, 82, 84 (R405-R413).

## Parked (one line each)
- Row 82: VoiceOver label omits footnote (gym.tsx:128); copy has no en/es/fr locale keys; singular wording ('1 session', '1 freeze') is my addition; strip gap 12 vs design 11; footnote hides during refresh (accepted, see decisions).
- Row 76: draft store (data model); chevron SF Symbol (log-session.tsx:250); second add route bundle :1310; session.tsx:565-569.
- Gym: session.tsx:364 saves template estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62); second sheet keys, caption, pill sizes, footer scroll.
- Gym row has no 'already logged' toast in the + menu handler (design lines 1656-1657). Isa to confirm it is covered by the owner decision.
- Streak: streak.tsx:89 'Sessions' should say distinct days (hooks.ts:156); flame pulse; grey at zero; SF Symbol artwork.
- Row 108 bottom padding difference not recorded (queue item 1 covers it).
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat.
- Logged card chevron with no action (TodayCard.tsx:115, :194); no logged-day guard in session.tsx.
- Failed templates fetch; picker offers only Rest day and could overwrite a workout.
- Doc: DESIGN_GAP_ANALYSIS.md:674, :837-839, :864, :868, :1494 stale (Badge, file counts, old menu values, 0.45 scrim).
- act() warning from src/lib/design/reduceMotion.ts:13 in tabbar render test.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; Screen.tsx:22; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved 0; AddMenu.tsx dead exit path (if (!visible) return null); 38 alias lines in 22 files (tokens.ts:50-56).
- i18n: hardcoded English on most screens (session.tsx:539-555); 'What did you do?' sheet English only (log-session.tsx:311-392).
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood local only.
- AI insights screen has no file in src/app/profile/.

## Owner device checks (parked for Isa)
Fade, shadows, pull-to-refresh (footnote hides during refresh), title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize, menu clipping of shadow, row 111 scrim 0.10 on device, streak footnote at 320pt and large text (may wrap). Row 115: 3D body, guide images, cardio minutes, speed, kcal; native es/fr review; TestPG_* (18 skipped). Isa must also decide: is footnote hiding during refresh acceptable; may 'sessions' count distinct days.

## Gotchas
- Briefs carry false premises: check first (row 117 items 5-7 not in TodayCard; CTA handler is gym.tsx:160; + menu handler at LumeTabBar.tsx:243-246, not gym.tsx; gym.tsx:243-246 does not exist).
- zsh does not split $paths; use ${=paths} or separate arguments.
- A pipe hides grep's exit code; run grep without one when reporting.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation, hydrationErrorScreens.

## Round log
- R405-R422: doc fixes, Badge and NavBar alias work, re-checks, stops awaiting Isa. Last full suite 822 passed, 2 known gap-16 failures.
- R423: Isa replied on Telegram. Decisions recorded. Row 111 scrim to 0.10. tsc green, tabbar render 13/13.
- R424: Row 82 footnote built (gym.tsx).
- R425: Prompt rejected: no branch rule.
- R426: Row 82 footnote gated on load (!gymLoading && !gymError). Report: tsc exit 0; three source-reading suites 24/24. Not device checked.
- R427: Queue moved to Screen.tsx padding.

## Latest Claude Code report
R426: footnote gated on !gymLoading && !gymError in src/app/(tabs)/gym.tsx; row 82 line added and references corrected. tsc exit 0; 24/24 source-reading tests. Flagged: VoiceOver omits footnote, no locale keys, strip gap 12 vs 11. Not device checked.

## Handover note (R423 session)
Branch loop/design-match. Commits appear between rounds, not from the session. Design bundles: Gym 7dc211f6, Profile b09a5e65, Food 71f71ac4. Decode __bundler/manifest in a mktemp script, never into the repo. Tokens aliases at tokens.ts:50-56. Last full suite before Badge edit: 822 passed, 2 known failures.