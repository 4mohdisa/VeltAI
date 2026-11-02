# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md on loop/design-match. Say BUILT, never verified.

## Status
R436. STOPPED, awaiting Isa. Test gate RED: detailChrome snapshots (this week, training, energy, macros) fail since the R427 Screen.tsx padding change. Asked R428 and R431, unanswered. Do not re-ask. tsc GREEN (R434).
Resume: when Isa answers (approve snapshot regeneration or revert Screen.tsx padding), treat it as final, go green, continue the queue from item 2.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Compare code with design first.
- jest --ci only. Never -u or edit .snap.
- No code build while the gate is red. Data model and backend changes: park, do not ask.
- Isa R423: row 111 scrim 0.10; panel solid white; gym row pushes /gym/log-session.
- R425-426: streak footnote hidden until gym data loads, during gymError and during refresh (row 82 deviation; Isa may overrule).
- Defaults: one-tap gym log on Summary card; Distance km for cardio; no food search chips; Goals extras kept.
- Accepted deviations: duration and completion use ticked exercises; no kcal tag on second-sheet rows; second-sheet copy English only; tab bar offset above inset 34; active cell emits tabPress; strip tap goes to /gym/streak; row 111 glyphs via optional size in LumeTabBar.tsx; local SCRIM_COLOR in AddMenu.tsx; row 76 pick marks day done; gap 16 needs sign-off.

## Blocked on Isa
- Gate (above). Gap 16 energy and macros share the same sign-off. If answered, resume builds 118, 84, 113, 116, 117.
- Owner checks: streak footnote wording; whether 'sessions' counts distinct days; flame; VoiceOver.

## Built (not verified)
- Row 111. Row 82. Screen.tsx floating padding 40/32 (R427; rows 107, 109, 110). Badge.tsx gray700 to color.label at :19 and :38 (same value).
- Partial: 84, 108, 113, 114, 116, 117, 118. Row 84: handover said DIFFERENT, notes said PARTIAL. Re-check when reached.

## Queue
1. Gate decision from Isa.
2. Row 118: LumeTabBar.tsx:154 pill shadow; GlassSurface overflow clipping.
3. Row 84: NavBar floating chrome; NavBar.tsx:29 gray200 alias cleanup. Do not reinstate the dropped alias tidy.
4. Gap 16 snapshots (Isa).
5. Rows 113, 116, 117, one at a time.
Builds only when the gate is green.

## Re-checked (do not repeat)
- Rows 107-111, 82, 84 (R405-413). Rows 113, 116, 117, 118 (R429). Doc lines R430 and R433.

## Doc to fix
- Lines 674, 864, 868 still list Badge and '41 lines in 24 files'; now 39 lines in 23 files.
- After the X-vs-X cleanup, remove resolved Differences entries and re-judge the heading at line 826.

## Parked
- Screen.tsx: Settings 48 plus inset (profile/index.tsx:98); Account footer 16/16/16 plus inset vs 12/16/30; comment Screen.tsx:78-79; gym/session and gym/new-template 48 to 32; other floating screens unchecked; 6pt home-indicator clearance (Isa).
- Row 82: VoiceOver omits footnote (gym.tsx:128); no en/es/fr keys; gap 12 vs 11.
- Row 76: draft store; chevron SF Symbol (log-session.tsx:250); second add route :1310; session.tsx:565-569.
- Gym: session.tsx:364 estimate; ticklist mode (session.tsx:40, :123) looks dead; library multi-select; per-set remove; cardio ParameterForm; template editor; minutesOf (log-session.tsx:62); second-sheet keys, caption, pill sizes, footer scroll; no 'already logged' toast (design 1656-1657).
- Row 116: month counts sessions, design counts trained days.
- Row 117: logged stats 3 vs 4 cells; logged pill wash flat; chevron no action (TodayCard.tsx:115, :194); no logged-day guard in session.tsx.
- Streak: streak.tsx:89 says Sessions, should be distinct days (hooks.ts:156); flame pulse; grey at zero; SF Symbol artwork.
- Templates fetch fails silently; picker offers Rest day and can overwrite a workout.
- schedule.tsx:135 English; failed fetch shows empty card.
- No design AI insights file in src/app/profile/.
- act() warning reduceMotion.ts:13.
- Stale comments: FloatingHeader.tsx:8-9, :24-26; gymSchedule.ts:32-61; gym.tsx:70-73, :155; hooks.ts:159; LumeTabBar.tsx:4; _layout.tsx:26; SettingsList.tsx:7-10; schedule 'Tues'.
- Tests: gymCalendar NAV_SIZE 32 vs 44; gymDurationHonesty.test.ts:54 title; no test covers log-session.tsx:124 or :275.
- Code: duplicated easing, SLOT_KEYS, mixHex; hooks.ts:56 console.warn; recipe fibre saved as 0; AddMenu.tsx dead exit path; 7 alias lines tokens.ts:50-56.
- i18n: hardcoded English (session.tsx:539-555); 'What did you do?' sheet (log-session.tsx:311-392).
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Food: eyebrow tappable in search; day picker changes date behind results; quick-add serving (mock/data.ts:124); editSavedFood local only.

## Owner device checks (Isa)
Fade, shadows, pull-to-refresh, title spacing, eyebrow, French label, schedule labels, header strip, logged-day sheet and toast, library close, picker fills, tab bar, second sheet resize, menu shadow clipping, row 111 scrim, streak footnote at 320pt, floating padding and home-indicator clearance. Row 115: 3D body, guide images, cardio, es/fr review, TestPG_* (18 skipped).

## Gotchas
- Briefs carry false premises; verify first. CTA handler gym.tsx:166; + menu Gym LumeTabBar.tsx:244-247; gym.tsx:243-246 does not exist.
- zsh: use ${=paths}. A pipe hides grep's exit code.
- Source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation, hydrationErrorScreens.
- Bundles: Gym 7dc211f6, Profile b09a5e65, Food 71f71ac4. Decode in mktemp, never in the repo.
- Last full suite (pre-Badge): 822 passed, 2 known fails. Badge edit not covered by a full run.
- Every prompt: branch rule and report format.

## Round log
R405-422 doc fixes and re-checks. R423 Isa decisions. R424-426 row 82. R427 padding, snapshots fail. R428, R431 gate asked. R429-430, R433 doc rounds. R432 prompt rejected. R434 tsc green. R435-436 stop.