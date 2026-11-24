Handover: Lume Phase 4, branch loop/phase4

Setup
Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first. Do not run git; the loop script commits. Never connect to 127.0.0.1:55432 or print LUME_TEST_DATABASE_URL.

Rows
Row 1 is BUILT. Row 2 is still PARTIAL; no row became BUILT this session.
- 2.1: only the simulator check is left.
- 2.2: done.
- 2.3 (strings): in progress, nothing half done. Translated this session: the gym month title; formatWeekdayDate, formatMonthYear, formatRelativeDate, formatLongDate, formatStreak and formatDuration; the MyScheduleCard weekday; the hours and minutes text in the month and weekly summaries; the weekly workout and energy card day letters; all WeekEnergyCard literals.
- 2.4 and 2.5 not started.

Last checkpoint
tsc 0 errors. Full Jest: 244 suites, 1,456 tests, 4 snapshots, all pass.

Key files
- src/lib/formatting.ts: dateLocale, formatDuration (rounds first), new formatHoursMinutes (always shows hours)
- src/lib/data/gymRange.ts, src/lib/data/summaryCards.ts
- src/components/domain/WeekEnergyCard.tsx, src/components/gym/MyScheduleCard.tsx
- src/lib/i18n/locales/{en,es,fr}.json (quote the glob in zsh)
- Tests: src/__tests__/helpers.test.ts, gymMonth.test.ts, summaryCards.test.ts, render/gymCards.emptyStates.render.test.tsx, render/weekEnergyCard.letters.render.test.tsx
- Snapshot: src/__tests__/render/__snapshots__/detailChrome.render.test.tsx.snap

Decisions and why
- Dates use dateLocale(i18n.language); en maps to en-AU.
- Day letters come from calendar.weekdayLetters (Monday first), not Intl narrow, because Hermes ignores narrow.
- Short dates are built from Intl's short weekday and month names, keeping the design's "Wed 10 Jun" without a comma.
- Today and Yesterday reuse foodLog.today and history.yesterday, since meaning and casing match.
- New keys: common.days_one/_other, common.hours, common.hoursMinutes, and five dashboard.* keys for the week card. es and fr use native spacing ("1 h 45 min").
- The month summary keeps the design's "0h 45m" through formatHoursMinutes. formatDuration's "45 min" was rejected.
- Rendering tests must be named *.render.test.tsx to get the jest-expo preset.

Open for Isa
- es and fr spacing "1 h 45 min".
- English "Sept" for September (en-AU), visible in the detail snapshots.
- es and fr wording of the new week card keys.
- Should the morning brief's free-plan refusal count as an error?

Not fixed
- WeekEnergyCard reads i18n directly, not through useTranslation.
- es and fr "per day" wording differs between the card and the week detail screen.
- formatNumber is hardcoded to en-AU.
- Other Summary cards may still have English literals (recommended next task).
- No locale key parity test (Row 29).
- The src/lib/i18n/index.ts comment still calls French partial.
- Jest prints about 200 console blocks.
- delete-account.tsx not checked for swallowed errors.
- KNOWN_ISSUES.md has Phase 3 wording.
- Weekday and month names on Hermes not checked on the simulator.