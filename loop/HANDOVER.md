HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs requirement is in AGENTS.md.

BUILT THIS SESSION (not verified)
- src/app/gym/log-session.tsx: inputFor saves cardio planned minutes in notes. Gap: Log as planned, line 296, BUILT.
- src/components/domain/EnergyBalanceCard.tsx: six design strings use t(); keys under dashboard.energyBalance in en, es, fr.
- src/app/dashboard/nutrition.tsx: design sub-line, section title and footer. Gap: Summary — Macros detail, line 103, stays DIFFERENT (chart missing).
- src/__tests__/render/setup.ts: imports @/lib/i18n. Macros snapshot re-recorded twice.
- src/__tests__/summaryNoFabrication.test.ts: Burned guard can fail again.
- DESIGN_GAP_ANALYSIS.md: /gym/session reachability corrected; line 71 DIFFERENT count is 24.

IN PROGRESS: nothing mid-edit.

LAST CHECKS: tsc exit 0. detailChrome.render 4 of 4. Last full render folder run predates the re-records. Full suite not run this session.

DECISIONS
- Footer uses formatEnergy, so the goal shows the user's unit.
- nutrition.remainingToday kept despite its name: brief said reuse, no renames.
- Unset goal: no code change; empty profile derives the 1,500 kcal floor (deriveTargets.ts:73), never 0.
- App-only Macros items and the history chart are parked.
- Line 103 row was created by me; no Macros row existed.

WAITING ON ISA
- Line 296: are minutes as note text enough for BUILT? Device run with planned cardio. Likely no structured duration or calories.
- Line 300 Freestyle: keep **No**?
- Native es and fr review.
- Line 90: row with empty status.
- Should users with no body stats see "your 1,500 kcal calorie goal"?

NEXT: correct line 71 counts to match the table (14 PARTIAL, 4 BUILT).

GOTCHAS
- Briefs have named wrong targets. Burned is on EnergyBalanceCard, not Macros. nutrition.tsx is under src/app/dashboard, not (tabs). The "It went as planned" pill is not the logged-day control. Check premises first.
- Gym tests are in src/__tests__, not src/components/gym.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode in memory with node -e from the __bundler/manifest script.
- Line numbers shift; locate rows by content.

NOT FIXED
- Eight EnergyBalanceCard literals remain English; its gap line overstates this.
- nutrition.tsx hardcodes "Percent of target", "Breakdown", "No meals logged yet today.", "% of target", "of … g".
- Footer no longer explains the missing chart.
- Line 76 omits cardio handling. Line 281 heading conflicts with reachable rows. Line 1471 audit row is stale.
- Logged-day pill still shows from the + menu; design hides the sheet.
- Failed today fetch looks like a rest day (log-session.tsx:89).
- "No edit bar" (line 297) may be stale; picker wording (line 299) incomplete.
- summaryNoFabrication header comment is stale on fibre.
- i18next prints a console.info banner in render tests.