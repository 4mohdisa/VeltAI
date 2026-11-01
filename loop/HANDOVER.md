HANDOVER: branch loop/design-match. Don't switch, push, merge or commit; the loop script commits. Don't open or edit loop/NOTES.md or loop/DECISIONS_LOG.md (always modified). Nothing has been checked on a device. Last round's eyebrow edit may still be uncommitted.

BUILT (in code only; no row is fully built)
- Row 76, gym/log-session.tsx: item 8 glyph; item 4 logged-day toast and redirect to Gym tab; item 1 done. Item 2 stays not built (plus glyph, add path).
- gym/session.tsx: closing the library with nothing added goes to the Gym tab.
- Row 113, gym/schedule.tsx: items 1, 2, 4-9, 12, 13 built. Open: 3, 10, 11.
- Row 115, gym/exercise-progress.tsx: built except gaps; verdict stays PARTIAL.

IN PROGRESS: nothing. Recommended next: row 113 item 3 (gap 12 vs 20), passing contentStyle gap space.xl from schedule.tsx, without touching Screen.tsx.

KEY FILES
src/app/gym/schedule.tsx, log-session.tsx, session.tsx, exercise-progress.tsx; src/components/navigation/BottomSheet.tsx, Screen.tsx; src/components/primitives/Pressable.tsx; src/lib/design/tokens.ts.
Design: design/Lume App.html. Gym bundle 7dc211f6, Profile b09a5e65. Decode the __bundler/manifest script in memory.

DECISIONS
- Rest-day redirect to picker is Isa's accepted deviation.
- My workouts sits on the schedule screen, as in the design, not the Gym tab.
- Muscle phrase derives from muscle_group_primary; English only; dropped if the API omits the join (unconfirmed).
- Picker list capped at 70% of window so rows stay reachable.
- Row 115 item 7 needs no code: CSS transition doesn't run on first render.
- Removed from progress screen: PB card, trend badge, tooltip, text history. Empty state kept.

WAITING ON ISA
- BottomSheet chrome (shared with onboarding).
- Logged-day actions: logged card has no press handler, so the toast's "open it" leads nowhere.
- Second session row (mutations.ts:173-178, deliberate per its comment).
- Row 115: 3D body, guide images, cardio minutes/speed/kcal (API lacks them).
- SettingsList geometry; detailChrome snapshot; earlier DetailChart.tsx and LumeTabBar.tsx approvals.

SPOTTED, NOT FIXED
- schedule.tsx fetches on mount only, so edits elsewhere look stale. TodayCard too: Start workout can show after logging.
- + menu pushes the sheet before checking logged state; possible flash.
- Pressable default pressed opacity is 0.85; My workouts cards use it, with no light1 fill.
- Stale: My workouts day_name.slice, "Tues…" comment, sheetRowNameStyle name. Many doc citations for these files have moved.
- Hardcoded English; kg handling parked.

GOTCHAS
Briefs often carry false premises (wrong bundle, wrong screen); check first and report. No suite imports these screens; findRelatedTests finds none (exit 1 without --passWithNoTests). Use jest --ci, never -u. Don't echo === in zsh. Row numbers are file lines. Don't mark BUILT if differences remain.