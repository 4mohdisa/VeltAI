Handover: Lume Phase 4, branch loop/phase4

Setup
Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first. Do not run git; the loop script commits. Never connect to 127.0.0.1:55432 or print LUME_TEST_DATABASE_URL. Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts.

Rows
Row 1 is BUILT. Row 2 is still PARTIAL; no row became BUILT this session.
- 2.1: only the simulator check is left.
- 2.2: done.
- 2.3 (strings): in progress, nothing half done.
- 2.4 and 2.5: not started.

Translated this session:
- EnergyBalanceCard and GymSessionButton.
- MacroBars: the MacroTargetRows text and screen reader labels.
- The energy screen's average burn line.
- The Summary screen was checked and was already fully translated.
- energyRange.ts: weekdayShort and dayMonth now follow the app language, and there is a new weekdayLetter helper.
- The weekly axis letters on energy, training, nutrition and week now use weekdayLetter. Each has a *.axisLetters.render.test.tsx proving es, fr and en. WeekEnergyCard now imports weekdayLetter too.

Last checkpoint
tsc 0 errors. Full Jest: 245 suites, 1,462 tests, 4 snapshots, all pass. Later rounds added 3 axis letter suites, each checked on its own, so the next full run should show 248 suites.

Key files
- src/lib/data/energyRange.ts (weekdayShort, weekdayLetter, dayMonth)
- src/lib/formatting.ts (dateLocale)
- src/components/domain/MacroBars.tsx, EnergyBalanceCard.tsx, WeekEnergyCard.tsx, GymSessionButton.tsx
- src/app/energy.tsx and src/app/dashboard/{training,nutrition,week}.tsx
- src/lib/i18n/locales/{en,es,fr}.json (quote the glob in zsh)
- Snapshot: src/__tests__/render/__snapshots__/detailChrome.render.test.tsx.snap

Decisions and why
- weekdayShort stays a short day name, not a letter, because week.tsx:248 uses it as a screen reader label.
- The detailChrome snapshot was updated on purpose: "Sep" became en-AU's "Sept".
- There is a new top-level "summary" section in the locale files.
- summary.target includes the " · " separator, so the visible text is unchanged.
- summaryNoFabrication.test.ts reads source code, so it checks for the key calls, not the English text.
- Locale files are written with json.dumps(indent=2, ensure_ascii=False) plus a newline, after checking the round trip gives identical bytes.

Open for Isa
- The es and fr wording of all new keys: summary.*, gym.loggedTodayLabel, dashboard.energyBalance.*, dashboard.energyAverageBurned.
- The weekdayShort decision above.
- The English "Sept" spelling.
- From the previous handover: "1 h 45 min" spacing, the week card wording, and the morning brief refusal question.

Gotchas
- zsh does not split $VAR into separate words. Pass test paths to jest one by one.
- In test renders, findAll matches both the composite and the host View, so count with toBeGreaterThan(0), not exact lengths.
- Rendering tests must be named *.render.test.tsx to get the jest-expo preset.
- Use npx jest --ci, so a missing snapshot fails instead of being written.

Not fixed
- The " – " separator in week.tsx:150 is not translated (recommended next task).
- nutrition.tsx hardcodes "g" after its chart scale and joins its footnote with " · ".
- The energy screen always says "kcal" and ignores the energy unit setting.
- formatNumber is hardcoded to en-AU.
- MacroTargetRows has no es or fr render test.
- There is no locale key parity test (Row 29).
- PHASE4_ROWS.md has no 2.3 notes for the GymSessionButton, MacroBars, Summary, energyRange, nutrition, Week and WeekEnergyCard rounds.
- Weekday and month names have not been checked on Hermes (simulator).