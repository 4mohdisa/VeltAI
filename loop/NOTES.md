# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified.

## Status
R430. Test gate RED: detailChrome.render.test.tsx, 4 snapshots (this week, training, energy, macros) fail after the Screen.tsx padding change (R427). Approval asked R428, unanswered. No code build while red. Doc-only work until resolved.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design before building.
- jest --ci only. Never -u or edit .snap.
- Isa (R423): row 111 scrim 0.10; panel solid white; gym row pushes /gym/log-session; other blocked items follow the design.
- R425/R426: streak footnote hidden until gym data loads and while gymError is set; it also hides during refresh. Deliberate deviation on row 82; Isa may overrule.
- R428: Screen.tsx padding kept per design. Snapshot regeneration needs Isa.
- R429/R430: no code build while the test gate is red. Doc-only rounds used instead.
- R430: Jev ranked row 118 first (97%). Kept the doc fix; reason in decisions.
- Data model changes parked, not asked. Badge style differences parked (style changes banned).
- Accepted deviations: duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset above inset 34; active cell emits tabPress; strip tap goes to /gym/streak; row 111 glyphs via optional size in LumeTabBar.tsx; scrim uses local SCRIM_COLOR in AddMenu.tsx; row 76 logging on pick marks the day done; gap 16 needs sign-off.

## Blocked on Isa
- R428: approve detailChrome snapshot regeneration (this week, training, energy, macros). If denied, revert Screen.tsx padding (R427). Gap 16 energy and macros use the same sign-off.
- Streak footnote wording, flame and VoiceOver items: Owner device checks.

## Built (not verified)
- Row 111 (AddMenu, scrim 0.10). Row 82 (strip; footnote gated on load). Screen.tsx floating padding 40 / 32 above footer (R427; rows 107, 109, 110 bottom padding items only). Badge.tsx gray700 to label at :19 and :38 (same value; may be uncommitted).
- Partial: 84, 108 (no bottom padding difference listed), 113, 114, 116, 117, 118.

## Queue (one per round, in order)
1. Doc fix: DESIGN_GAP_ANALYSIS.md 674, 837-839, 864, 868, 1494 (R430, doc only).
2. Row 118 pill shadow, LumeTabBar.tsx:154 and GlassSurface overflow clipping. Build only when the gate is green.
3. Row 84 NavBar floating chrome (NavBar.tsx:29 alias dropped as tidying).
4. Gap 16 snapshots: blocked on Isa.
5. Rows 113, 116, 117 builds, one at a time, only when the gate is green.

## Re-checked (do not repeat)
- Rows 107-111, 82, 84 (R405-R413).
- Rows 113, 116, 117, 118 (R429; all still PARTIAL).

## Parked (one line each)
- Screen.tsx: Settings 48 plus inset vs 48 (profile/index.tsx:98); Account footer 16/16/16 plus inset vs 12/16/30; Screen.tsx:78-79 comment; gym/session and gym/new-template 48 to 32, session maybe 96; other floating screens 48 to 40 not design-checked; 6pt home-indicator clearance on 34pt inset (Isa to confirm).
- Row 82: VoiceOver omits footnote (gym.tsx:128); no en/es/fr keys; singular wording is my addition; gap 12 vs 11.
- Row 76: draft store (data model); chevron SF Symbol (log-session.tsx:250); second add route bundle :1310; session.tsx:565-569.
- Gym: session.tsx:364 template estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62); second sheet keys, caption, pill sizes, footer scroll; no 'already logged' toast (design 1656-1657).
- Streak: streak.tsx:89 says Sessions, should be distinct days (hooks.ts:156); flame pulse; grey at zero; SF Symbol artwork.
- Row 116: month summary counts sessions, design counts trained days.
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat; logged card chevron has no action (src/components/gym/TodayCard.tsx:115, :194); no logged-day guard in session.tsx.
- Failed templates fetch; picker offers Rest day and could overwrite a workout.
- schedule.tsx:135 hardcoded English; failed schedule fetch shows empty card.
- Design AI insights screen has no file in src/app/profile/.
- act() warning from src/lib/design/reduceMotion.ts:13 in tabbar render test.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; schedule.tsx 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 stale title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; AddMenu.tsx dead exit path; 38 alias lines in 22 files (tokens.ts:50-56).
- i18n: hardcoded English on most screens (session.tsx:539-555); 'What did you do?' sheet English only (log-session.tsx:311-392).
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable during search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood is local only.

## Owner device checks (Isa)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize, menu shadow clipping, row 111 scrim, streak footnote at 320pt and large text, floating bottom padding and home-indicator clearance. Row 115: 3D body, guide images, cardio, native es/fr review, TestPG_* (18 skipped). Isa decides: footnote hiding during refresh; whether 'sessions' counts distinct days.

## Gotchas
- Briefs carry false premises: check first. CTA handler is gym.tsx:166; + menu Gym handler is LumeTabBar.tsx:244-247.
- zsh does not split $paths; use ${=paths}. A pipe hides grep's exit code.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation, hydrationErrorScreens.
- Design bundles: Gym 7dc211f6, Profile b09a5e65, Food 71f71ac4. Decode the manifest in a mktemp script, never into the repo.

## Round log
- R405-R422: doc fixes, Badge and NavBar alias, re-checks, stops awaiting Isa.
- R423: Isa decisions; row 111 scrim 0.10.
- R424-R426: row 82 footnote built, then gated on load.
- R427: Screen.tsx padding to design; 4 snapshots fail (flagged).
- R428: asked for snapshot approval; unanswered.
- R429: doc re-check of rows 113, 116, 117, 118 (all still PARTIAL).
- R430: doc fix queued and run; Jev's row 118 pick overruled, reason recorded.