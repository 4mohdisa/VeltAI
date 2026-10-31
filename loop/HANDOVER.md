HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs requirement is in AGENTS.md.

BUILT (not verified)
- src/components/gym/TodayCard.tsx, logged state: green pill, "Logged today · N kcal burned" sub-line, chevron, 3-up grid (Duration, Volume, Sets), exercise chips. Failed fetch shows LoadFailedNotice with Try again.
- src/app/gym/log-session.tsx: failed fetch shows LoadFailedNotice with Try again, not a rest day.
- Locales en, es, fr: gym.logged, loggedTodayBurned, loggedDuration, loggedMinutes, loggedSets, loggedMore.

GAP ROWS
- Status changes: none. Header is 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT; matches the table (43 rows, one empty).
- "Gym — today's session card" stays DIFFERENT, with logged work recorded in its text.
- "Gym — session logging (log sheet)" (already BUILT) records the failed-fetch fix.
- Heatmap row and prose now say two routes into day detail.

IN PROGRESS: nothing mid-edit.

LAST CHECKS: tsc exit 0 this round. Last full suite, 65 suites and 824 tests passed, predates the failed-fetch code. No test covers TodayCard or either failure path.

DECISIONS
- Calories cell omitted: session rows carry no per-session calories.
- Sub-line kcal is the day's calories_out_exercise; hidden when none is recorded.
- Pill is solid categoryAccent.positive: no wash token exists.
- Failure is derived from today === null: useToday swallows errors, and a real response is always an object.
- planned.length === 0 kept in the rest-day check, so an empty template cannot commit.
- Missing duration or volume shows "—", never 0.

WAITING ON ISA
- Device check of logged card and both failure states.
- Native es and fr review.
- Wash pill token.
- Whole-day kcal under a session card: acceptable?
- Earlier items still open: is note-text cardio enough for BUILT (Log as planned row), keep Freestyle "No", and the "1,500 kcal" goal for users without body stats.

NEXT: merge the empty-status line (line 90) into "Food — My dishes / Saved"; no row is titled "Saved foods". Then the read-only check of the log-session.tsx failure branch (about line 139).

GOTCHAS
- Briefs have named wrong paths and rows; check first. Row 113 is "My schedule", and its label is correct.
- Design assets decode in memory with node -e from the __bundler/manifest script; gym is 7dc211f6.
- zsh breaks on echo ==.

NOT FIXED
- log-session.tsx cites just below gap line 266 (:173, :146, :111, :103-104) are stale.
- Try again is hardcoded English with a small tap target.
- Possible double notice with src/app/(tabs)/gym.tsx:107.
- Calories needs gym_sessions.calories_burned on the backend read.
- Volume overstates: src/app/gym/session.tsx saves all sets at top weight.
- Logged-day sheet still shows from the + menu.
- Tap target needs a day-detail route; the chevron sits on a non-tappable card.
- "Logged today" fallback and planned "+N more" are hardcoded English.